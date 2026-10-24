/**
 * send-campaign
 *
 * Server-side "Send now" for a single campaign. Replaces the old browser loop
 * that sent one email per round-trip (and stopped whenever the tab closed).
 *
 * Flow:
 *   1. Authenticate the caller and confirm they own the campaign.
 *   2. Optimistically lock it (draft/scheduled → sending) to avoid double sends.
 *   3. Hand off to the shared batch sender (SendGrid batch API).
 *
 * Returns a summary { sent, failed, recipientCount, errors } so the UI can show
 * the real outcome instead of silently reporting success.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendCampaign } from '../_shared/campaignSender.ts';
import { requirePaidAccess } from '../_shared/paidAccess.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw Object.assign(new Error('Authentication required'),{status:401});

    // Identify the caller from their JWT.
    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw Object.assign(new Error('User not authenticated'),{status:401});
    await requirePaidAccess(userClient, user.id);
    const { campaign_id } = await req.json();
    if (!campaign_id) throw Object.assign(new Error('campaign_id is required'),{status:400});

    // Service-role client for the heavy lifting (reads contacts, writes events).
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();

    if (campaignError || !campaign || campaign.user_id !== user.id) throw Object.assign(new Error('Campaign not found'),{status:404});

    if (campaign.status === 'sending' || campaign.status === 'sent') {
      return new Response(
        JSON.stringify({ success: false, error: `Campaign is already ${campaign.status}` }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optimistic lock: only flip to 'sending' if it hasn't changed underneath us.
    const { data: locked, error: lockError } = await supabase
      .from('campaigns')
      .update({ status: 'sending', sent_at: new Date().toISOString() })
      .eq('id', campaign.id)
      .eq('status', campaign.status)
      .select('id');

    if (lockError || !locked || locked.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Campaign is already being sent' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send in the BACKGROUND and respond immediately. A large list (thousands of
    // recipients) takes longer to send than the browser / API gateway will hold a
    // single request open, so awaiting it here made the UI hang forever on
    // "preparing to send." The campaign is already locked to 'sending'; the
    // background task writes the final 'sent' status + counts as it finishes, so
    // the UI reflects the outcome by refreshing rather than blocking.
    const task = sendCampaign(campaign, supabase).catch(async (err: any) => {
      console.error('send-campaign background task failed:', err?.message || err);
      // Don't strand the campaign in 'sending' on an unexpected failure.
      await supabase
        .from('campaigns')
        .update({ status: 'draft' })
        .eq('id', campaign.id)
        .then(() => {}, () => {});
    });

    // Keep the worker alive until the send finishes, even after we respond.
    // @ts-ignore — EdgeRuntime is provided by the Supabase Edge runtime.
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(task);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: 'sending',
        recipientCount: campaign.recipients_count ?? null,
      }),
      { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('send-campaign error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: error.status || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
