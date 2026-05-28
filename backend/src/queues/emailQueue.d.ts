import { Queue } from 'bullmq';
export interface EmailJobData {
    campaignId: string;
    userId: string;
    recipients: Array<{
        email: string;
        contactId: string;
        firstName?: string;
        lastName?: string;
    }>;
    emailData: {
        subject: string;
        fromEmail: string;
        fromName: string;
        replyTo: string;
        htmlBody: string;
    };
}
export declare const emailQueue: Queue<EmailJobData, any, string, DataTypeOrJob extends import("bullmq").Job<infer D, any, any> ? D : DataTypeOrJob, DataTypeOrJob extends import("bullmq").Job<any, infer R, any> ? R : DefaultResultType, DataTypeOrJob extends import("bullmq").Job<any, any, infer N extends string> ? N : DefaultNameType>;
export declare function queueEmailCampaign(data: EmailJobData): Promise<import("bullmq").Job<DataTypeOrJob extends import("bullmq").Job<infer D, any, any> ? D : DataTypeOrJob, DataTypeOrJob extends import("bullmq").Job<any, infer R, any> ? R : DefaultResultType, DataTypeOrJob extends import("bullmq").Job<any, any, infer N extends string> ? N : DefaultNameType>>;
export declare function getEmailQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
}>;
export declare function cleanEmailQueue(): Promise<void>;
export default emailQueue;
//# sourceMappingURL=emailQueue.d.ts.map