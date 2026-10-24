import { Queue } from 'bullmq';
import { defaultQueueOptions } from '../config/bullmq.js';

// Email job data interface
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

// Create email queue
export const emailQueue = new Queue<EmailJobData>('email-sending', {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    priority: 1,
  },
});

// Add job to queue
export async function queueEmailCampaign(data: EmailJobData) {
  const job = await emailQueue.add(
    'send-campaign' as any,
    data,
    {
      jobId: `campaign-${data.campaignId}-${Date.now()}`,
      priority: data.recipients.length > 1000 ? 2 : 1,
    }
  );

  console.log(`📬 Queued email job: ${job.id} for campaign ${data.campaignId}`);
  return job;
}

// Get queue statistics
export async function getEmailQueueStats(canViewUser?: (userId: string) => Promise<boolean>) {
  if (canViewUser) {
    const counts = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, total: 0 };
    const visible = new Map<string, Promise<boolean>>();
    for (const state of ['waiting','active','completed','failed','delayed'] as const) {
      for (let offset=0;;offset+=500) {
        const jobs=await emailQueue.getJobs([state],offset,offset+499,true);
        for (const job of jobs) {
          const userId=job?.data?.userId;
          if (!userId) continue;
          if (!visible.has(userId)) visible.set(userId,canViewUser(userId));
          if (await visible.get(userId)) { counts[state]++;counts.total++; }
        }
        if (jobs.length<500) break;
      }
    }
    return counts;
  }
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount(),
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
export async function cleanEmailQueue() {
  await emailQueue.clean(3600000, 100, 'completed');
  await emailQueue.clean(86400000, 500, 'failed');
  console.log('🧹 Email queue cleaned');
}

export default emailQueue;
