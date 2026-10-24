import { Router } from 'express';
import { queueEmailCampaign, getEmailQueueStats } from '../queues/emailQueue.js';
import { CacheService } from '../services/cacheService.js';
import supabase from '../config/supabase.js';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Never trust a userId from the request body: this client bypasses RLS.
router.use(async (req, res, next) => {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ error: 'Authentication required' });
  try {
    const { data: { user }, error } = await supabase.auth.getUser(match[1]);
    if (error || !user) return res.status(401).json({ error: 'Invalid session' });
    if (!user.email_confirmed_at) return res.status(403).json({ error: 'Verify your email before sending' });
    const caller = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      global: { headers: { Authorization: req.headers.authorization! } },
    });
    const access = await caller.rpc('has_platform_access', { p_user_id: user.id });
    if (access.error) return res.status(503).json({ error: 'Unable to verify subscription' });
    if (access.data !== true) return res.status(403).json({ error: 'An active paid subscription is required' });
    res.locals.caller = caller;
    res.locals.userId = user.id;
    next();
  } catch {
    return res.status(503).json({ error: 'Unable to validate session' });
  }
});

// Send campaign (queue it)
router.post('/:campaignId/send', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = res.locals.userId;

    // Check rate limit
    const rateLimit = await CacheService.checkRateLimit(
      `campaign:${userId}`,
      10,
      3600
    );

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: 3600,
      });
    }

    // Get campaign
    let campaign = await CacheService.getCampaign(campaignId);

    if (!campaign) {
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      campaign = data;

      if (campaign) {
        await CacheService.cacheCampaign(campaignId, campaign);
      }
    }

    if (!campaign || campaign.user_id !== userId) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get contacts
    let contacts = await CacheService.getContacts(userId);

    if (!contacts) {
      const { data } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name')
        .eq('user_id', userId)
        .eq('status', 'active');

      contacts = data || [];
      await CacheService.cacheContacts(userId, contacts);
    }

    if (contacts.length === 0) {
      return res.status(400).json({ error: 'No active contacts found' });
    }

    // Queue the email job
    const job = await queueEmailCampaign({
      campaignId,
      userId,
      recipients: contacts.map((c: any) => ({
        email: c.email,
        contactId: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
      })),
      emailData: {
        subject: campaign.subject,
        fromEmail: campaign.from_email || 'noreply@mail.mailwizard.io',
        fromName: campaign.from_name || 'Mail Wizard',
        replyTo: campaign.reply_to || campaign.from_email || 'noreply@mail.mailwizard.io',
        htmlBody: campaign.content?.html || '<p>No content</p>',
      },
    });

    res.json({
      success: true,
      jobId: job.id,
      queuedRecipients: contacts.length,
      message: 'Campaign queued for sending',
    });

  } catch (error: any) {
    console.error('Campaign send error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get queue stats
router.get('/queue/stats', async (req, res) => {
  try {
    const { data: admin, error } = await res.locals.caller.rpc('is_platform_admin');
    if (error || admin !== true) return res.status(403).json({ error: 'Admin access required' });
    const stats = await getEmailQueueStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
