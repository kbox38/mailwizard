/**
 * process-scheduled-campaigns
 *
 * Finds all campaigns with status='scheduled' whose scheduled_at has passed
 * and sends them via SendGrid. Called by a pg_cron job every minute and also
 * triggered from the frontend whenever the Campaigns page loads.
 *
 * Uses the service role key so no user session is required. The actual sending
 * is delegated to the shared batch sender (SendGrid batch API), so even very
 * large lists go out in a handful of fast requests instead of one-per-recipient.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendCampaign } from '../_shared/campaignSender.ts';
import { requirePaidAccess } from '../_shared/paidAccess.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const authHeader = req.headers.get('authorization') || '';
  const cronSecret = Deno.env.get('CAMPAIGN_CRON_SECRET') || '';
  const cronAuthorized = !!cronSecret && req.headers.get('x-cron-secret') === cronSecret;
  let callerId: string | null = null;
  if (!cronAuthorized && (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` || !SUPABASE_SERVICE_ROLE_KEY)) {
    if (!authHeader.startsWith('Bearer ')) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    const caller = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error } = await caller.auth.getUser();
    if (error || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    try { await requirePaidAccess(caller, user.id); } catch { return new Response('Subscription required', { status: 403, headers: corsHeaders }); }
    callerId = user.id;
  }

  // Find all scheduled campaigns whose time has arrived
  let dueQuery = supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true });
  if (callerId) dueQuery = dueQuery.eq('user_id', callerId);
  const { data: campaigns, error: fetchError } = await dueQuery;

  if (fetchError) {
    console.error('Failed to fetch scheduled campaigns:', fetchError);
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!campaigns || campaigns.length === 0) {
    return new Response(JSON.stringify({ processed: 0, message: 'No campaigns due' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log(`Processing ${campaigns.length} scheduled campaign(s)`);
  const results: { campaignId: string; sent: number; failed: number }[] = [];

  for (const campaign of campaigns) {
    try { await requirePaidAccess(supabase, campaign.user_id); }
    catch (error: any) {
      if (error.status !== 403) continue;
      await supabase.from('campaigns').update({ status: 'draft', scheduled_at: null }).eq('id', campaign.id).eq('status', 'scheduled');
      continue;
    }
    // Mark as sending immediately to prevent double-processing (optimistic lock:
    // only succeeds if the row is still 'scheduled').
    const { data: locked, error: lockError } = await supabase
      .from('campaigns')
      .update({ status: 'sending', sent_at: new Date().toISOString() })
      .eq('id', campaign.id)
      .eq('status', 'scheduled')
      .select('id');

    if (lockError || !locked || locked.length === 0) {
      console.log(`Skipping campaign ${campaign.id} — already locked by another worker`);
      continue;
    }

    try {
      const result = await sendCampaign(campaign, supabase);
      results.push({ campaignId: campaign.id, sent: result.sent, failed: result.failed });
    } catch (err: any) {
      console.error(`Failed to send campaign ${campaign.id}:`, err?.message || err);
      // Roll back so the cron can retry on the next pass.
      await supabase.from('campaigns').update({ status: 'scheduled' }).eq('id', campaign.id);
      results.push({ campaignId: campaign.id, sent: 0, failed: 0 });
    }
  }

  return new Response(JSON.stringify({ processed: campaigns.length, results }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
