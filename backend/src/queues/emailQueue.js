"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailQueue = void 0;
exports.queueEmailCampaign = queueEmailCampaign;
exports.getEmailQueueStats = getEmailQueueStats;
exports.cleanEmailQueue = cleanEmailQueue;
const bullmq_1 = require("bullmq");
const bullmq_2 = require("../config/bullmq");
// Create email queue
exports.emailQueue = new bullmq_1.Queue('email-sending', {
    ...bullmq_2.defaultQueueOptions,
    defaultJobOptions: {
        ...bullmq_2.defaultQueueOptions.defaultJobOptions,
        priority: 1,
        limiter: {
            max: 10,
            duration: 1000,
        },
    },
});
// Add job to queue
async function queueEmailCampaign(data) {
    const job = await exports.emailQueue.add('send-campaign', data, {
        jobId: `campaign-${data.campaignId}-${Date.now()}`,
        priority: data.recipients.length > 1000 ? 2 : 1,
    });
    console.log(`📬 Queued email job: ${job.id} for campaign ${data.campaignId}`);
    return job;
}
// Get queue statistics
async function getEmailQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        exports.emailQueue.getWaitingCount(),
        exports.emailQueue.getActiveCount(),
        exports.emailQueue.getCompletedCount(),
        exports.emailQueue.getFailedCount(),
        exports.emailQueue.getDelayedCount(),
    ]);
    return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
    };
}
// Clean up old jobs
async function cleanEmailQueue() {
    await exports.emailQueue.clean(3600000, 100, 'completed');
    await exports.emailQueue.clean(86400000, 500, 'failed');
    console.log('🧹 Email queue cleaned');
}
exports.default = exports.emailQueue;
//# sourceMappingURL=emailQueue.js.map