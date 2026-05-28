/**
 * ============================================================================
 * SEND EMAIL EDGE FUNCTION
 * ============================================================================
 *
 * ROOT CAUSE FIX — WHY UNSUBSCRIBE NEVER WORKED:
 *
 * The unsubscribe URL was built as:
 *   `${APP_URL}/unsubscribe?token=...`
 *
 * Where APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173'
 *
 * Since APP_URL was never set as a Supabase secret, every email had a
 * localhost link. Even if the link was correct, it pointed to the React
 * page on Netlify — which then had to make a second fetch() to Supabase.
 *
 * THE FIX:
 * Build the unsubscribe URL to point DIRECTLY to the Supabase Edge Function:
 *   `${SUPABASE_URL}/functions/v1/unsubscribe?token=...`
 *
 * SUPABASE_URL is auto-injected by Supabase — always correct, no config needed.
 * The Edge Function already returns a complete HTML page (success/error).
 * The React /unsubscribe page is now only a fallback for direct navigation.
 *
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || '';
// SUPABASE_URL is auto-injected by Supabase — always available, never empty
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SHARED_SENDING_DOMAIN = 'mail.mailwizard.io';
const UNSUBSCRIBE_TOKEN_SECRET = Deno.env.get('UNSUBSCRIBE_TOKEN_SECRET') || '';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

/**
 * Generate HMAC-SHA256 signature for unsubscribe token
 */
async function generateUnsubscribeSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate unsubscribe token for a specific contact and campaign.
 * The resulting URL points DIRECTLY to the Supabase Edge Function —
 * no Netlify/React page involved, no second network call needed.
 *
 * @param contactId   - UUID of the contact
 * @param campaignId  - UUID of the campaign
 * @param secret      - UNSUBSCRIBE_TOKEN_SECRET env var
 * @returns           - Full unsubscribe URL pointing to this Edge Function's sibling
 */
async function generateUnsubscribeUrl(
  contactId: string,
  campaignId: string,
  secret: string
): Promise<string> {
  const timestamp = Date.now();
  const data = `${contactId}:${campaignId}:${timestamp}`;
  const signature = await generateUnsubscribeSignature(data, secret);
  const token = btoa(`${data}:${signature}`);

  // Point directly to the Supabase unsubscribe Edge Function.
  // SUPABASE_URL is auto-injected — always correct, no env var needed.
  const url = `${SUPABASE_URL}/functions/v1/unsubscribe?token=${token}`;

  console.log(`🔗 Unsubscribe URL domain: ${SUPABASE_URL}/functions/v1/unsubscribe`);
  return url;
}

/**
 * Replace {{KEY}} and {{MERGE:KEY}} personalization fields in text
 */
function replacePersonalizationFields(text: string, fields: Record<string, any>): string {
  let result = text;
  for (const [key, value] of Object.entries(fields)) {
    const stringValue = String(value || '');
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), stringValue);
    result = result.replace(new RegExp(`\\{\\{MERGE:${key}\\}\\}`, 'gi'), stringValue);
  }
  return result;
}

/**
 * Generate username from email/metadata for the From address
 */
function generateUsername(userEmail: string, userMetadata: any): string {
  if (userMetadata?.username) {
    return userMetadata.username.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  return userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Main handler
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    console.log('='.repeat(80));
    console.log('📧 EMAIL SEND REQUEST');
    console.log('='.repeat(80) + '\n');

    if (!UNSUBSCRIBE_TOKEN_SECRET) {
      console.error('❌ UNSUBSCRIBE_TOKEN_SECRET not configured');
      throw new Error('Server configuration error: Missing unsubscribe token secret');
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const {
      to,
      subject,
      html,
      text,
      reply_to,
      from_name,
      campaign_id,
      contact_id,
      sending_domain_id,
      personalization = {}
    } = await req.json();

    console.log(`📨 To: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    console.log(`🎯 Campaign ID: ${campaign_id || 'N/A'}`);
    console.log(`👤 Contact ID: ${contact_id || 'N/A'}`);
    console.log(`🌐 SUPABASE_URL: ${SUPABASE_URL}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log(`👤 User: ${user.email}`);

    // Determine sender email
    let fromEmail = '';
    let fromName = from_name || 'Email Wizard';

    if (sending_domain_id) {
      const { data: customDomain } = await supabase
        .from('sending_domains')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', sending_domain_id)
        .eq('verification_status', 'verified')
        .single();

      if (customDomain) {
        fromEmail = `${generateUsername(user.email!, user.user_metadata)}@${customDomain.domain}`;
        console.log(`✅ Using specified custom domain: ${customDomain.domain}`);
      }
    }

    if (!fromEmail) {
      const { data: defaultDomain } = await supabase
        .from('sending_domains')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .eq('verification_status', 'verified')
        .single();

      if (defaultDomain) {
        fromEmail = `${generateUsername(user.email!, user.user_metadata)}@${defaultDomain.domain}`;
        console.log(`✅ Found default verified custom domain: ${defaultDomain.domain}`);
      }
    }

    if (!fromEmail) {
      fromEmail = `${generateUsername(user.email!, user.user_metadata)}@${SHARED_SENDING_DOMAIN}`;
      console.log(`📧 Using shared domain: ${fromEmail}`);
    }

    // =========================================================================
    // GENERATE UNSUBSCRIBE URL
    // Points directly to the Supabase Edge Function — no React page needed
    // =========================================================================
    let unsubscribeUrl = '';

    if (contact_id && campaign_id) {
      try {
        unsubscribeUrl = await generateUnsubscribeUrl(
          contact_id,
          campaign_id,
          UNSUBSCRIBE_TOKEN_SECRET
        );
        console.log(`🔗 Unsubscribe URL generated (direct to Edge Function)`);
      } catch (error) {
        console.error('⚠️ Failed to generate unsubscribe URL:', error);
      }
    } else {
      console.warn('⚠️ Missing contact_id or campaign_id — no unsubscribe link');
    }

    // =========================================================================
    // APPLY PERSONALIZATION
    // =========================================================================
    const mergeFields = {
      first_name: personalization.first_name || 'there',
      last_name: personalization.last_name || '',
      email: to,
      company: personalization.company || '',
      ...personalization,
      UNSUBSCRIBE_URL: unsubscribeUrl,
      VIEW_IN_BROWSER_URL: `${SUPABASE_URL}/functions/v1/view-email?campaign_id=${campaign_id || ''}`,
      FROM_EMAIL: fromEmail,
      COMPANY_NAME: fromName,
      CURRENT_YEAR: new Date().getFullYear().toString()
    };

    const personalizedHtml = replacePersonalizationFields(html, mergeFields);
    const personalizedText = text ? replacePersonalizationFields(text, mergeFields) : '';
    const personalizedSubject = replacePersonalizationFields(subject, mergeFields);

    // Verify replacement worked
    const hasUnsubscribeTag = personalizedHtml.includes('{{UNSUBSCRIBE_URL}}');
    const hasActualUrl = unsubscribeUrl ? personalizedHtml.includes(unsubscribeUrl) : false;

    console.log(`\n🔍 Merge tag check:`);
    console.log(`   {{UNSUBSCRIBE_URL}} still present (should be false): ${hasUnsubscribeTag}`);
    console.log(`   Actual URL injected (should be true): ${hasActualUrl}`);

    if (hasUnsubscribeTag) {
      console.error('❌ CRITICAL: {{UNSUBSCRIBE_URL}} was NOT replaced — template may be missing the tag');
    }

    // =========================================================================
    // BUILD SENDGRID PAYLOAD
    // =========================================================================
    const sendGridPayload: any = {
      personalizations: [{ to: [{ email: to }], subject: personalizedSubject }],
      from: { email: fromEmail, name: fromName },
      reply_to: { email: reply_to || user.email! },
      custom_args: {
        campaign_id: campaign_id || '',
        contact_id: contact_id || '',
        user_id: user.id
      },
      tracking_settings: {
        click_tracking: { enable: true, enable_text: false },
        open_tracking: { enable: true },
        subscription_tracking: { enable: false }
      },
      content: [{ type: 'text/html', value: personalizedHtml }]
    };

    if (personalizedText) {
      sendGridPayload.content.unshift({ type: 'text/plain', value: personalizedText });
    }

    console.log(`\n📦 Sending to: ${to} from: ${fromEmail}`);
    console.log(`   Unsubscribe: ${unsubscribeUrl ? '✅ included' : '❌ missing'}`);

    // =========================================================================
    // SEND VIA SENDGRID
    // =========================================================================
    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sendGridPayload)
    });

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      console.error('❌ SendGrid error:', errorText);
      throw new Error(`SendGrid error: ${errorText}`);
    }

    const messageId = sendGridResponse.headers.get('x-message-id');
    console.log(`\n✅ Email sent! Message ID: ${messageId}`);

    return new Response(
      JSON.stringify({ success: true, message_id: messageId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Send email error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});