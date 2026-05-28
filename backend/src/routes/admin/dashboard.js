"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../../middleware/adminAuth");
const supabase_1 = __importDefault(require("../../config/supabase"));
const redis_1 = __importDefault(require("../../config/redis"));
const router = (0, express_1.Router)();
// GET /admin/dashboard/overview
router.get('/overview', adminAuth_1.authenticateAdmin, (0, adminAuth_1.requireAdminPermission)('view_all_metrics'), async (req, res) => {
    try {
        const { timeRange = '7d' } = req.query;
        // Calculate date range
        const now = new Date();
        const daysAgo = parseInt(timeRange.toString().replace('d', ''));
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        // Get real-time metrics from Redis
        let activeUsers = 0;
        try {
            activeUsers = await redis_1.default.scard('active_users:today') || 0;
        }
        catch (error) {
            console.error('Redis active users error:', error);
        }
        // Get historical metrics from database
        const { data: metrics, error } = await supabase_1.default
            .from('platform_metrics_daily')
            .select('*')
            .gte('metric_date', startDate.toISOString().split('T')[0])
            .order('metric_date', { ascending: false });
        if (error)
            throw error;
        // Calculate totals
        const totals = metrics?.reduce((acc, day) => ({
            newUsers: acc.newUsers + day.new_users,
            emailsSent: acc.emailsSent + day.total_emails_sent,
            emailsDelivered: acc.emailsDelivered + day.total_emails_delivered,
            emailsBounced: acc.emailsBounced + day.total_emails_bounced,
            spamComplaints: acc.spamComplaints + day.total_spam_complaints,
            mrr: day.mrr,
            newMrr: acc.newMrr + (day.new_mrr || 0),
            churnedMrr: acc.churnedMrr + (day.churned_mrr || 0),
        }), {
            newUsers: 0,
            emailsSent: 0,
            emailsDelivered: 0,
            emailsBounced: 0,
            spamComplaints: 0,
            mrr: 0,
            newMrr: 0,
            churnedMrr: 0,
        }) || {};
        // Get current user counts by plan
        const { data: profiles } = await supabase_1.default
            .from('profiles')
            .select('plan_type');
        const planDistribution = { free: 0, pro: 0, pro_plus: 0 };
        profiles?.forEach(p => {
            if (p.plan_type in planDistribution) {
                planDistribution[p.plan_type]++;
            }
        });
        // Get queue stats
        const queueStats = await getQueueStats();
        // Log admin access
        await (0, adminAuth_1.logAdminActivity)({
            adminId: req.admin.adminId,
            actionType: 'view_dashboard',
            details: { timeRange },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
        res.json({
            realtime: {
                activeUsers,
                queueStats
            },
            totals,
            planDistribution,
            dailyMetrics: metrics,
            timeRange
        });
    }
    catch (error) {
        console.error('Dashboard overview error:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /admin/dashboard/users/stats
router.get('/users/stats', adminAuth_1.authenticateAdmin, (0, adminAuth_1.requireAdminPermission)('view_user_data'), async (req, res) => {
    try {
        // Total users count
        const { count: totalUsers } = await supabase_1.default
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        // Users by plan
        const { data: profiles } = await supabase_1.default
            .from('profiles')
            .select('plan_type');
        const planCounts = { free: 0, pro: 0, pro_plus: 0 };
        profiles?.forEach(p => {
            if (p.plan_type in planCounts) {
                planCounts[p.plan_type]++;
            }
        });
        // New users today
        const today = new Date().toISOString().split('T')[0];
        const { count: newToday } = await supabase_1.default
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);
        // Active users estimate (users with recent campaigns)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const { data: recentCampaigns } = await supabase_1.default
            .from('campaigns')
            .select('user_id')
            .gte('created_at', thirtyDaysAgo.toISOString());
        const uniqueActiveUsers = new Set(recentCampaigns?.map(c => c.user_id)).size;
        res.json({
            totalUsers,
            newToday,
            activeUsers: uniqueActiveUsers,
            planDistribution: planCounts
        });
    }
    catch (error) {
        console.error('User stats error:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /admin/dashboard/revenue
router.get('/revenue', adminAuth_1.authenticateAdmin, (0, adminAuth_1.requireAdminPermission)('view_revenue_metrics'), async (req, res) => {
    try {
        const { data: latestMetrics } = await supabase_1.default
            .from('platform_metrics_daily')
            .select('mrr, new_mrr, churned_mrr')
            .order('metric_date', { ascending: false })
            .limit(1)
            .maybeSingle();
        // Get historical revenue data
        const { data: revenueHistory } = await supabase_1.default
            .from('platform_metrics_daily')
            .select('metric_date, mrr, new_mrr, churned_mrr')
            .order('metric_date', { ascending: false })
            .limit(30);
        res.json({
            current: latestMetrics || { mrr: 0, new_mrr: 0, churned_mrr: 0 },
            history: revenueHistory || []
        });
    }
    catch (error) {
        console.error('Revenue stats error:', error);
        res.status(500).json({ error: error.message });
    }
});
// Helper function to get queue stats
async function getQueueStats() {
    try {
        const { getEmailQueueStats } = await import('../../queues/emailQueue');
        return await getEmailQueueStats();
    }
    catch (error) {
        return {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            total: 0
        };
    }
}
exports.default = router;
//# sourceMappingURL=dashboard.js.map