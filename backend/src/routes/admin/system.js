"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../../middleware/adminAuth");
const redis_1 = __importDefault(require("../../config/redis"));
const supabase_1 = __importDefault(require("../../config/supabase"));
const router = (0, express_1.Router)();
// GET /admin/system/health
router.get('/health', adminAuth_1.authenticateAdmin, (0, adminAuth_1.requireAdminPermission)('view_metrics'), async (req, res) => {
    try {
        // Check Redis
        const redisHealth = redis_1.default.status === 'ready' ? 'healthy' : 'unhealthy';
        let redisPing = 'N/A';
        try {
            redisPing = await redis_1.default.ping();
        }
        catch (error) {
            redisPing = 'FAILED';
        }
        // Check Database
        const dbHealth = await checkDatabaseHealth();
        // Check Queue
        const queueHealth = await checkQueueHealth();
        // Get system alerts
        const { data: alerts, count: alertCount } = await supabase_1.default
            .from('system_alerts')
            .select('*', { count: 'exact' })
            .eq('status', 'active')
            .order('severity', { ascending: false })
            .limit(10);
        const overallHealth = redisHealth === 'healthy' &&
            dbHealth.status === 'healthy' &&
            queueHealth.status === 'healthy'
            ? 'healthy'
            : 'degraded';
        res.json({
            overall: overallHealth,
            services: {
                redis: {
                    status: redisHealth,
                    ping: redisPing,
                    uptime: process.uptime()
                },
                database: dbHealth,
                queue: queueHealth
            },
            alerts: {
                active: alertCount,
                recent: alerts || []
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('System health check error:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /admin/system/metrics
router.get('/metrics', adminAuth_1.authenticateAdmin, (0, adminAuth_1.requireAdminPermission)('view_metrics'), async (req, res) => {
    try {
        // Redis metrics
        let redisMetrics = {
            keys: 0,
            memory: {
                usedMemory: 'N/A',
                maxMemory: 'N/A'
            }
        };
        try {
            const redisKeys = await redis_1.default.dbsize();
            const redisInfo = await redis_1.default.info('memory');
            redisMetrics = {
                keys: redisKeys,
                memory: parseRedisInfo(redisInfo)
            };
        }
        catch (error) {
            console.error('Redis metrics error:', error);
        }
        // Queue metrics
        const queueStats = await getQueueStats();
        // Database metrics
        const dbMetrics = await getDatabaseMetrics();
        res.json({
            redis: redisMetrics,
            queue: queueStats,
            database: dbMetrics,
            process: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage()
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('System metrics error:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /admin/system/logs - Get recent admin activity logs
router.get('/logs', adminAuth_1.authenticateAdmin, (0, adminAuth_1.requireAdminPermission)('view_logs'), async (req, res) => {
    try {
        const { limit = 100, actionType, adminId } = req.query;
        let query = supabase_1.default
            .from('admin_activity_log')
            .select(`
          *,
          admin:admin_users(email, first_name, last_name)
        `)
            .order('created_at', { ascending: false })
            .limit(Number(limit));
        if (actionType) {
            query = query.eq('action_type', actionType);
        }
        if (adminId) {
            query = query.eq('admin_id', adminId);
        }
        const { data: logs, error } = await query;
        if (error)
            throw error;
        res.json({
            logs: logs || [],
            total: logs?.length || 0
        });
    }
    catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: error.message });
    }
});
// POST /admin/system/alerts - Create system alert
router.post('/alerts', adminAuth_1.authenticateAdmin, (0, adminAuth_1.requireAdminPermission)('system_configuration'), async (req, res) => {
    try {
        const { alertType, severity, message, details } = req.body;
        if (!alertType || !severity || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const { data: alert, error } = await supabase_1.default
            .from('system_alerts')
            .insert({
            alert_type: alertType,
            severity,
            message,
            details: details || {}
        })
            .select()
            .single();
        if (error)
            throw error;
        res.json({
            success: true,
            alert
        });
    }
    catch (error) {
        console.error('Create alert error:', error);
        res.status(500).json({ error: error.message });
    }
});
// POST /admin/system/alerts/:id/acknowledge
router.post('/alerts/:id/acknowledge', adminAuth_1.authenticateAdmin, (0, adminAuth_1.requireAdminPermission)('system_configuration'), async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase_1.default
            .from('system_alerts')
            .update({
            status: 'acknowledged',
            acknowledged_by: req.admin.adminId,
            acknowledged_at: new Date().toISOString()
        })
            .eq('id', id);
        if (error)
            throw error;
        res.json({
            success: true,
            message: 'Alert acknowledged'
        });
    }
    catch (error) {
        console.error('Acknowledge alert error:', error);
        res.status(500).json({ error: error.message });
    }
});
// Helper functions
async function checkDatabaseHealth() {
    try {
        const start = Date.now();
        const { error } = await supabase_1.default
            .from('profiles')
            .select('id')
            .limit(1);
        const responseTime = Date.now() - start;
        if (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                responseTime
            };
        }
        return {
            status: 'healthy',
            responseTime
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            error: error.message
        };
    }
}
async function checkQueueHealth() {
    try {
        const { getEmailQueueStats } = await import('../../queues/emailQueue');
        const stats = await getEmailQueueStats();
        const isHealthy = stats.failed < 100 && stats.waiting < 1000;
        return {
            status: isHealthy ? 'healthy' : 'degraded',
            stats
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            error: error.message
        };
    }
}
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
async function getDatabaseMetrics() {
    try {
        // Get table counts
        const { count: profilesCount } = await supabase_1.default
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        const { count: campaignsCount } = await supabase_1.default
            .from('campaigns')
            .select('*', { count: 'exact', head: true });
        const { count: contactsCount } = await supabase_1.default
            .from('contacts')
            .select('*', { count: 'exact', head: true });
        return {
            tables: {
                profiles: profilesCount,
                campaigns: campaignsCount,
                contacts: contactsCount
            }
        };
    }
    catch (error) {
        return {
            tables: {
                profiles: 0,
                campaigns: 0,
                contacts: 0
            }
        };
    }
}
function parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const memory = {};
    lines.forEach(line => {
        if (line.includes(':')) {
            const [key, value] = line.split(':');
            memory[key] = value;
        }
    });
    return {
        usedMemory: memory.used_memory_human || 'N/A',
        maxMemory: memory.maxmemory_human || 'N/A',
        memoryUsage: memory.used_memory_rss_human || 'N/A'
    };
}
exports.default = router;
//# sourceMappingURL=system.js.map