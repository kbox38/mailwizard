"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
// Create Redis client with connection pooling
exports.redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    enableReadyCheck: true,
    enableOfflineQueue: true,
    lazyConnect: false,
    keepAlive: 30000,
});
// Handle connection events
exports.redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});
exports.redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});
exports.redis.on('ready', () => {
    console.log('🚀 Redis ready for operations');
});
// Test connection on startup
exports.redis.ping().then((result) => {
    console.log('📡 Redis PING:', result);
}).catch((err) => {
    console.error('❌ Redis PING failed:', err);
});
exports.default = exports.redis;
//# sourceMappingURL=redis.js.map