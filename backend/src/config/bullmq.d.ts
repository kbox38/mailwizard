import Redis from 'ioredis';
declare const connection: Redis;
export declare const defaultQueueOptions: {
    connection: Redis;
    defaultJobOptions: {
        attempts: number;
        backoff: {
            type: "exponential";
            delay: number;
        };
        removeOnComplete: {
            count: number;
            age: number;
        };
        removeOnFail: {
            count: number;
        };
    };
};
export { connection as bullmqConnection };
//# sourceMappingURL=bullmq.d.ts.map