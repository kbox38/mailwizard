export declare class CacheService {
    static cacheCampaign(campaignId: string, data: any, ttl?: number): Promise<void>;
    static getCampaign(campaignId: string): Promise<any>;
    static cacheContacts(userId: string, contacts: any[], ttl?: number): Promise<void>;
    static getContacts(userId: string): Promise<any>;
    static cacheDashboardStats(userId: string, stats: any, ttl?: number): Promise<void>;
    static getDashboardStats(userId: string): Promise<any>;
    static incrementCounter(key: string, amount?: number): Promise<number>;
    static getCounter(key: string): Promise<number>;
    static checkRateLimit(identifier: string, maxRequests: number, windowSeconds: number): Promise<{
        allowed: boolean;
        remaining: number;
    }>;
    static invalidateCache(pattern: string): Promise<void>;
}
export default CacheService;
//# sourceMappingURL=cacheService.d.ts.map