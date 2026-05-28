"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emailQueue_1 = require("../queues/emailQueue");
const cacheService_1 = require("../services/cacheService");
const supabase_1 = __importDefault(require("../config/supabase"));
const router = (0, express_1.Router)();
// Send campaign (queue it)
router.post('/:campaignId/send', async (req, res) => {
    try {
        const { campaignId } = req.params;
        const userId = req.body.userId;
        // Check rate limit
        const rateLimit = await cacheService_1.CacheService.checkRateLimit(`campaign:${userId}`, 10, 3600);
        if (!rateLimit.allowed) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                retryAfter: 3600,
            });
        }
        // Get campaign
        let campaign = await cacheService_1.CacheService.getCampaign(campaignId);
        if (!campaign) {
            const { data } = await supabase_1.default
                .from('campaigns')
                .select('*')
                .eq('id', campaignId)
                .single();
            campaign = data;
            if (campaign) {
                await cacheService_1.CacheService.cacheCampaign(campaignId, campaign);
            }
        }
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        // Get contacts
        let contacts = await cacheService_1.CacheService.getContacts(userId);
        if (!contacts) {
            const { data } = await supabase_1.default
                .from('contacts')
                .select('id, email, first_name, last_name')
                .eq('user_id', userId)
                .eq('status', 'active');
            contacts = data || [];
            await cacheService_1.CacheService.cacheContacts(userId, contacts);
        }
        if (contacts.length === 0) {
            return res.status(400).json({ error: 'No active contacts found' });
        }
        // Queue the email job
        const job = await (0, emailQueue_1.queueEmailCampaign)({
            campaignId,
            userId,
            recipients: contacts.map((c) => ({
                email: c.email,
                contactId: c.id,
                firstName: c.first_name,
                lastName: c.last_name,
            })),
            emailData: {
                subject: campaign.subject,
                fromEmail: campaign.from_email || 'hello@mailwizard.com',
                fromName: campaign.from_name || 'Mail Wizard',
                replyTo: campaign.reply_to || campaign.from_email || 'hello@mailwizard.com',
                htmlBody: campaign.content?.html || '<p>No content</p>',
            },
        });
        res.json({
            success: true,
            jobId: job.id,
            queuedRecipients: contacts.length,
            message: 'Campaign queued for sending',
        });
    }
    catch (error) {
        console.error('Campaign send error:', error);
        res.status(500).json({ error: error.message });
    }
});
// Get queue stats
router.get('/queue/stats', async (req, res) => {
    try {
        const stats = await (0, emailQueue_1.getEmailQueueStats)();
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=campaigns.js.map