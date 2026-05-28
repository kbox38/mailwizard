"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../../middleware/adminAuth");
const router = (0, express_1.Router)();
// POST /admin/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        const result = await (0, adminAuth_1.adminLogin)(email, password);
        res.json(result);
    }
    catch (error) {
        console.error('Admin login error:', error);
        res.status(401).json({ error: error.message });
    }
});
// POST /admin/auth/verify - Verify admin token
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Token required' });
        }
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        res.json({ valid: true, decoded });
    }
    catch (error) {
        res.status(401).json({ valid: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map