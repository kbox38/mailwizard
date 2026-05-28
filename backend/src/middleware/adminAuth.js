"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateAdmin = authenticateAdmin;
exports.requireAdminPermission = requireAdminPermission;
exports.logAdminActivity = logAdminActivity;
exports.adminLogin = adminLogin;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const supabase_1 = __importDefault(require("../config/supabase"));
// Admin role permissions
const ADMIN_PERMISSIONS = {
    super_admin: [
        'view_all_metrics',
        'manage_users',
        'manage_billing',
        'system_configuration',
        'impersonate_users',
        'view_logs',
        'export_data',
        'delete_accounts',
        'manage_admins'
    ],
    support_admin: [
        'view_user_data',
        'view_campaigns',
        'view_logs',
        'impersonate_users',
        'suspend_accounts',
        'view_billing'
    ],
    finance_admin: [
        'view_revenue_metrics',
        'view_billing',
        'export_financial_reports',
        'manage_subscriptions'
    ],
    readonly_admin: [
        'view_metrics',
        'view_user_data',
        'view_logs'
    ]
};
// Admin authentication middleware
async function authenticateAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Admin authentication required' });
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ADMIN_JWT_SECRET);
        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        // Verify admin is still active
        const { data: admin, error } = await supabase_1.default
            .from('admin_users')
            .select('id, email, admin_role, permissions, is_active')
            .eq('id', decoded.adminId)
            .single();
        if (error || !admin || !admin.is_active) {
            return res.status(403).json({ error: 'Admin account inactive or not found' });
        }
        req.admin = {
            adminId: admin.id,
            email: admin.email,
            role: admin.admin_role,
            permissions: ADMIN_PERMISSIONS[admin.admin_role] || []
        };
        next();
    }
    catch (error) {
        console.error('Admin auth error:', error);
        return res.status(401).json({ error: 'Invalid admin token' });
    }
}
// Permission checking middleware
function requireAdminPermission(...permissions) {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({ error: 'Admin authentication required' });
        }
        const hasPermission = permissions.every(p => req.admin.permissions.includes(p));
        if (!hasPermission) {
            // Log permission denial
            logAdminActivity({
                adminId: req.admin.adminId,
                actionType: 'permission_denied',
                details: {
                    requiredPermissions: permissions,
                    attemptedAction: `${req.method} ${req.path}`
                },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: permissions
            });
        }
        next();
    };
}
// Log admin activity
async function logAdminActivity(data) {
    try {
        await supabase_1.default.from('admin_activity_log').insert({
            admin_id: data.adminId,
            action_type: data.actionType,
            resource_type: data.resourceType,
            resource_id: data.resourceId,
            details: data.details || {},
            ip_address: data.ipAddress,
            user_agent: data.userAgent
        });
    }
    catch (error) {
        console.error('Failed to log admin activity:', error);
    }
}
// Admin login
async function adminLogin(email, password) {
    const { data: admin, error } = await supabase_1.default
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();
    if (error || !admin) {
        throw new Error('Invalid credentials');
    }
    const isValidPassword = await bcrypt_1.default.compare(password, admin.password_hash);
    if (!isValidPassword) {
        throw new Error('Invalid credentials');
    }
    // Update last login
    await supabase_1.default
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', admin.id);
    // Generate JWT
    const token = jsonwebtoken_1.default.sign({
        adminId: admin.id,
        email: admin.email,
        role: admin.admin_role,
        isAdmin: true
    }, process.env.ADMIN_JWT_SECRET, { expiresIn: '8h' });
    return {
        token,
        admin: {
            id: admin.id,
            email: admin.email,
            firstName: admin.first_name,
            lastName: admin.last_name,
            role: admin.admin_role,
            permissions: ADMIN_PERMISSIONS[admin.admin_role]
        }
    };
}
//# sourceMappingURL=adminAuth.js.map