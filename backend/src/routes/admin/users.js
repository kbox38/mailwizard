"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../../middleware/adminAuth");
const supabase_1 = __importDefault(require("../../config/supabase"));
const router = (0, express_1.Router)();
// GET /admin/users - List all users with filtering and pagination
router.get('/', adminAuth_1.authenticateAdmin, (0, adminAuth_1.requireAdminPermission)('view_user_data'), async (req, res) => {
    try {
        const { page = 1, pageSize = 20, search, plan, status, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
        const offset = (Number(page) - 1) * Number(pageSize);
        let query = supabase_1.default
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
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
        // Pagination
        query = query.range(offset, offset + Number(pageSize) - 1);
        const { data: users, error, count } = await query;
        if (error)
            throw error;
        // Get usage stats for these users
        const userIds = users?.map(u => u.id) || [];
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const { data: usageStats } = await supabase_1.default
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
    }
    catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /admin/users/:id - Get user details
router.get('/:id', adminAuth_1.authenticateAdmin, (0, adminAuth_1.requireAdminPermission)('view_user_data'), async (req, res) => {
    try {
        const { id } = req.params;
        // Get user profile
        const { data: user, error: userError } = await supabase_1.default
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        if (userError)
            throw userError;
        // Get campaigns
        const { data: campaigns, count: campaignCount } = await supabase_1.default
            .from('campaigns')
            .select('id, name, status, sent_at, recipients_count', { count: 'exact' })
            .eq('user_id', id)
            .order('created_at', { ascending: false })
            .limit(10);
        // Get contacts
        const { count: contactCount } = await supabase_1.default
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', id);
        // Get usage metrics
        const { data: usage } = await supabase_1.default
            .from('usage_metrics')
            .select('*')
            .eq('user_id', id)
            .order('year', { ascending: false })
            .order('month', { ascending: false })
            .limit(6);
        await (0, adminAuth_1.logAdminActivity)({
            adminId: req.admin.adminId,
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
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: error.message });
    }
});
// POST /admin/users/:id/suspend - Suspend user account
router.post('/:id/suspend', adminAuth_1.authenticateAdmin, (0, adminAuth_1.requireAdminPermission)('suspend_accounts'), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({ error: 'Suspension reason required' });
        }
        // Update user status
        const { error } = await supabase_1.default
            .from('profiles')
            .update({
            subscription_status: 'suspended',
            updated_at: new Date().toISOString()
        })
            .eq('id', id);
        if (error)
            throw error;
        // Log suspension
        await (0, adminAuth_1.logAdminActivity)({
            adminId: req.admin.adminId,
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
    }
    catch (error) {
        console.error('Suspend user error:', error);
        res.status(500).json({ error: error.message });
    }
});
// POST /admin/users/:id/activate - Reactivate suspended account
router.post('/:id/activate', adminAuth_1.authenticateAdmin, (0, adminAuth_1.requireAdminPermission)('suspend_accounts'), async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase_1.default
            .from('profiles')
            .update({
            subscription_status: 'active',
            updated_at: new Date().toISOString()
        })
            .eq('id', id);
        if (error)
            throw error;
        await (0, adminAuth_1.logAdminActivity)({
            adminId: req.admin.adminId,
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
    }
    catch (error) {
        console.error('Activate user error:', error);
        res.status(500).json({ error: error.message });
    }
});
// POST /admin/users/:id/impersonate - Start impersonation session
router.post('/:id/impersonate', adminAuth_1.authenticateAdmin, (0, adminAuth_1.requireAdminPermission)('impersonate_users'), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({ error: 'Impersonation reason required' });
        }
        // Generate impersonation token
        const jwt = require('jsonwebtoken');
        const impersonationToken = jwt.sign({
            userId: id,
            impersonating: true,
            adminId: req.admin.adminId
        }, process.env.JWT_SECRET, { expiresIn: '2h' });
        await (0, adminAuth_1.logAdminActivity)({
            adminId: req.admin.adminId,
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
    }
    catch (error) {
        console.error('Impersonate user error:', error);
        res.status(500).json({ error: error.message });
    }
});
// DELETE /admin/users/:id - Delete user account (dangerous operation)
router.delete('/:id', adminAuth_1.authenticateAdmin, (0, adminAuth_1.requireAdminPermission)('delete_accounts'), async (req, res) => {
    try {
        const { id } = req.params;
        const { confirmation } = req.body;
        if (confirmation !== 'DELETE') {
            return res.status(400).json({ error: 'Confirmation required: must send "DELETE"' });
        }
        // Delete user data (cascading will handle related records)
        const { error } = await supabase_1.default
            .from('profiles')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        await (0, adminAuth_1.logAdminActivity)({
            adminId: req.admin.adminId,
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
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map