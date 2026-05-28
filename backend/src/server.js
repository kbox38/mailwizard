"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const emailProcessor_1 = require("./queues/processors/emailProcessor");
const redis_1 = __importDefault(require("./config/redis"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
// Health check
app.get('/health', async (req, res) => {
    const redisStatus = redis_1.default.status === 'ready' ? 'healthy' : 'unhealthy';
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        redis: redisStatus,
        uptime: process.uptime(),
    });
});
// Campaign routes
const campaigns_1 = __importDefault(require("./routes/campaigns"));
app.use('/api/campaigns', campaigns_1.default);
// Admin routes
const auth_1 = __importDefault(require("./routes/admin/auth"));
const dashboard_1 = __importDefault(require("./routes/admin/dashboard"));
const users_1 = __importDefault(require("./routes/admin/users"));
const system_1 = __importDefault(require("./routes/admin/system"));
app.use('/api/admin/auth', auth_1.default);
app.use('/api/admin/dashboard', dashboard_1.default);
app.use('/api/admin/users', users_1.default);
app.use('/api/admin/system', system_1.default);
console.log('✅ Admin routes registered');
// Start BullMQ worker
const worker = (0, emailProcessor_1.startEmailWorker)();
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    await worker.close();
    await redis_1.default.quit();
    process.exit(0);
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`📡 Redis: ${redis_1.default.status}`);
    console.log(`🔄 BullMQ worker: active`);
});
exports.default = app;
//# sourceMappingURL=server.js.map