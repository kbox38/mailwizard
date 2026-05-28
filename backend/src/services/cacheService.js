"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const redis_1 = __importDefault(require("../config/redis"));
class CacheService {
    // Cache campaign data
    static async cacheCampaign(campaignId, data, ttl = 3600) {
        const key = `campaign:${campaignId}`;
        await redis_1.default.setex(key, ttl, JSON.stringify(data));
        console.log(`💾 Cached campaign: ${campaignId}`);
    }
    static async getCampaign(campaignId) {
        const key = `campaign:${campaignId}`;
        const cached = await redis_1.default.get(key);
        if (cached) {
            console.log(`✅ Cache HIT: campaign:${campaignId}`);
            return JSON.parse(cached);
        }
        console.log(`❌ Cache MISS: campaign:${campaignId}`);
        return null;
    }
    // Cache contact list
    static async cacheContacts(userId, contacts, ttl = 1800) {
        const key = `contacts:${userId}`;
        await redis_1.default.setex(key, ttl, JSON.stringify(contacts));
        console.log(`💾 Cached ${contacts.length} contacts for user ${userId}`);
    }
    static async getContacts(userId) {
        const key = `contacts:${userId}`;
        const cached = await redis_1.default.get(key);
        if (cached) {
            console.log(`✅ Cache HIT: contacts:${userId}`);
            return JSON.parse(cached);
        }
        return null;
    }
    // Cache dashboard stats
    static async cacheDashboardStats(userId, stats, ttl = 300) {
        const key = `stats:${userId}`;
        await redis_1.default.setex(key, ttl, JSON.stringify(stats));
    }
    static async getDashboardStats(userId) {
        const key = `stats:${userId}`;
        const cached = await redis_1.default.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    // Increment counters
    static async incrementCounter(key, amount = 1) {
        return await redis_1.default.incrby(key, amount);
    }
    static async getCounter(key) {
        const value = await redis_1.default.get(key);
        return value ? parseInt(value) : 0;
    }
    // Rate limiting
    static async checkRateLimit(identifier, maxRequests, windowSeconds) {
        const key = `ratelimit:${identifier}`;
        const current = await redis_1.default.incr(key);
        if (current === 1) {
            await redis_1.default.expire(key, windowSeconds);
        }
        const allowed = current <= maxRequests;
        const remaining = Math.max(0, maxRequests - current);
        return { allowed, remaining };
    }
    // Clear cache
    static async invalidateCache(pattern) {
        const keys = await redis_1.default.keys(pattern);
        if (keys.length > 0) {
            await redis_1.default.del(...keys);
            console.log(`🗑️ Invalidated ${keys.length} cache keys matching: ${pattern}`);
        }
    }
}
exports.CacheService = CacheService;
exports.default = CacheService;
//# sourceMappingURL=cacheService.js.map