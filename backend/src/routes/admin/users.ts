import { Router } from 'express';
import { authenticateAdmin, requireAdminPermission, logAdminActivity } from '../../middleware/adminAuth';
import supabase from '../../config/supabase';

const router = Router();

// GET /admin/users - List all users with filtering and pagination
router.get(
  '/',
  authenticateAdmin,
  requireAdminPermission('view_user_data'),
  async (req, res) => {
    try {
      const {
        page = 1,
        pageSize = 20,
        search,
        plan,
        status,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const offset = (Number(page) - 1) * Number(pageSize);

      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          plan_type,
          subscription_status,
          created_at,
          last_active_at
        `, { count: 'exact' });

      // Apply filters
      if (search) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      if (plan) {
        query = query.eq('plan_type', plan);
      }

      if (status) {
        query = query.eq('subscription_status', status);
      }

      // Sorting
      query = query.order(sortBy as string, { ascending: sortOrder === 'asc' });

      // Pagination
      query = query.range(offset, offset + Number(pageSize) - 1);

      const { data: users, error, count } = await query;

      if (error) throw error;

      // Get usage stats for these users
      const userIds = users?.map(u => u.id) || [];
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data: usageStats } = await supabase
        .from('usage_metrics')
        .select('user_id, emails_sent')
        .in('user_id', userIds)
        .eq('year', currentYear)
        .eq('month', currentMonth);

      // Merge usage data
      const usersWithStats = users?.map(user => ({
        ...user,
        currentMonthUsage: usageStats?.find(u => u.user_id === user.id)?.emails_sent || 0
      }));

      res.json({
        users: usersWithStats,
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          total: count,
          totalPages: Math.ceil((count || 0) / Number(pageSize))
        }
      });

    } catch (error: any) {
      console.error('List users error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /admin/users/:id - Get user details
router.get(
  '/:id',
  authenticateAdmin,
  requireAdminPermission('view_user_data'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (userError) throw userError;

      // Get campaigns
      const { data: campaigns, count: campaignCount } = await supabase
        .from('campaigns')
        .select('id, name, status, sent_at, recipients_count', { count: 'exact' })
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get contacts
      const { count: contactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id);

      // Get usage metrics
      const { data: usage } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('user_id', id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(6);

      await logAdminActivity({
        adminId: req.admin!.adminId,
        actionType: 'view_user_details',
        resourceType: 'user',
        resourceId: id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        user,
        stats: {
          campaigns: campaignCount,
          contacts: contactCount
        },
        recentCampaigns: campaigns,
        usage: usage || []
      });

    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /admin/users/:id/suspend - Suspend user account
router.post(
  '/:id/suspend',
  authenticateAdmin,
  requireAdminPermission('suspend_accounts'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ error: 'Suspension reason required' });
      }

      // Update user status
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Log suspension
      await logAdminActivity({
        adminId: req.admin!.adminId,
        actionType: 'suspend_user',
        resourceType: 'user',
        resourceId: id,
        details: { reason },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        message: 'User account suspended'
      });

    } catch (error: any) {
      console.error('Suspend user error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /admin/users/:id/activate - Reactivate suspended account
router.post(
  '/:id/activate',
  authenticateAdmin,
  requireAdminPermission('suspend_accounts'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await logAdminActivity({
        adminId: req.admin!.adminId,
        actionType: 'activate_user',
        resourceType: 'user',
        resourceId: id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        message: 'User account activated'
      });

    } catch (error: any) {
      console.error('Activate user error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /admin/users/:id/impersonate - Start impersonation session
router.post(
  '/:id/impersonate',
  authenticateAdmin,
  requireAdminPermission('impersonate_users'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ error: 'Impersonation reason required' });
      }

      // Generate impersonation token
      const jwt = require('jsonwebtoken');
      const impersonationToken = jwt.sign(
        {
          userId: id,
          impersonating: true,
          adminId: req.admin!.adminId
        },
        process.env.JWT_SECRET!,
        { expiresIn: '2h' }
      );

      await logAdminActivity({
        adminId: req.admin!.adminId,
        actionType: 'start_impersonation',
        resourceType: 'user',
        resourceId: id,
        details: { reason },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        token: impersonationToken,
        expiresIn: 7200
      });

    } catch (error: any) {
      console.error('Impersonate user error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE /admin/users/:id - Delete user account (dangerous operation)
router.delete(
  '/:id',
  authenticateAdmin,
  requireAdminPermission('delete_accounts'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { confirmation } = req.body;

      if (confirmation !== 'DELETE') {
        return res.status(400).json({ error: 'Confirmation required: must send "DELETE"' });
      }

      // Delete user data (cascading will handle related records)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logAdminActivity({
        adminId: req.admin!.adminId,
        actionType: 'delete_user',
        resourceType: 'user',
        resourceId: id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        message: 'User account deleted'
      });

    } catch (error: any) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
