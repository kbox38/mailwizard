/**
 * ============================================================================
 * Edge Function: Unsubscribe Handler
 * ============================================================================
 *
 * FIXES IN THIS VERSION:
 *
 * FIX 1 — Raw HTML in browser:
 *   The browser was displaying raw HTML source because when a user opens the
 *   link directly (no apikey header), Supabase's gateway interferes with the
 *   Content-Type. Solution: process the unsubscribe server-side, then issue
 *   a 302 redirect to the Netlify React page with a ?result= parameter.
 *   The React page renders the beautiful UI. Supabase stays invisible.
 *
 * FIX 2 — email_events insert failing:
 *   The email_events table has a NOT NULL `email` column. The insert was
 *   missing it. Now we pass contact.email (already fetched from the DB).
 *
 * Flow:
 *   Email link → this Edge Function (processes DB update) → 302 redirect
 *   → Netlify /unsubscribe?result=success (renders UI)
 *
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for preflight requests from the React app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// APP_URL: the Netlify frontend — user is redirected here after processing.
// Set this as a Supabase secret: supabase secrets set APP_URL=https://yourapp.netlify.app
const APP_URL = Deno.env.get('APP_URL') || '';

/**
 * Generate HMAC-SHA256 signature for token validation
 */
async function generateSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate and parse the base64-encoded unsubscribe token.
 * Format: base64("{contact_id}:{campaign_id}:{timestamp}:{hmac_signature}")
 */
async function validateToken(token: string, secret: string): Promise<{
  valid: boolean;
  contact_id?: string;
  campaign_id?: string;
  error?: string;
}> {
  try {
    const decoded = atob(token);
    const parts = decoded.split(':');
    if (parts.length !== 4) return { valid: false, error: 'Invalid token format' };

    const [contact_id, campaign_id, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);

    // Token expires after 30 days
    if (Date.now() - timestamp > 30 * 24 * 60 * 60 * 1000) {
      return { valid: false, error: 'Token expired' };
    }

    const expected = await generateSignature(`${contact_id}:${campaign_id}:${timestampStr}`, secret);
    if (signature !== expected) return { valid: false, error: 'Invalid signature' };

    return { valid: true, contact_id, campaign_id };
  } catch {
    return { valid: false, error: 'Token validation failed' };
  }
}

/**
 * Build a redirect Response to the Netlify frontend.
 * The React /unsubscribe page reads ?result= and ?email= to render the UI.
 *
 * @param result  - 'success' | 'already' | 'error'
 * @param email   - contact email to display (optional)
 * @param appUrl  - Netlify base URL
 */
function redirectToFrontend(result: string, email: string | null, appUrl: string): Response {
  const params = new URLSearchParams({ result });
  if (email) params.set('email', email);

  const destination = `${appUrl}/unsubscribe?${params.toString()}`;
  console.log(`↩️  Redirecting to: ${destination}`);

  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      'Location': destination,
    },
  });
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  console.log(`📨 Unsubscribe request — token present: ${!!token}`);

  // Guard: no APP_URL configured means we can't redirect — fall back to inline HTML
  if (!APP_URL) {
    console.error('❌ APP_URL secret not set — cannot redirect to frontend');
    return new Response(
      '<h1>Configuration error: APP_URL not set in Supabase secrets.</h1>',
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );
  }

  if (!token) {
    console.warn('⚠️ Missing token');
    return redirectToFrontend('error', null, APP_URL);
  }

  const tokenSecret = Deno.env.get('UNSUBSCRIBE_TOKEN_SECRET');
  if (!tokenSecret) {
    console.error('❌ UNSUBSCRIBE_TOKEN_SECRET not configured');
    return redirectToFrontend('error', null, APP_URL);
  }

  const validation = await validateToken(token, tokenSecret);
  if (!validation.valid) {
    console.error('❌ Token invalid:', validation.error);
    return redirectToFrontend('error', null, APP_URL);
  }

  const { contact_id, campaign_id } = validation;
  console.log(`✅ Token valid — contact: ${contact_id}`);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Fetch contact
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, email, status')
    .eq('id', contact_id)
    .single();

  if (contactError || !contact) {
    console.error('❌ Contact not found:', contactError?.message);
    return redirectToFrontend('error', null, APP_URL);
  }

  console.log(`📧 Contact: ${contact.email} (status: ${contact.status})`);

  // Already unsubscribed — idempotent success
  if (contact.status === 'unsubscribed') {
    console.log(`ℹ️ Already unsubscribed`);
    return redirectToFrontend('already', contact.email, APP_URL);
  }

  // Update contact status
  const { error: updateError } = await supabase
    .from('contacts')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
      unsubscribe_campaign_id: campaign_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contact_id);

  if (updateError) {
    console.error('❌ Failed to update contact:', updateError.message);
    return redirectToFrontend('error', contact.email, APP_URL);
  }

  console.log(`✅ Contact ${contact.email} marked as unsubscribed`);

  // Record event — include email (NOT NULL in schema)
  const { error: eventError } = await supabase.from('email_events').insert({
    campaign_id,
    contact_id,
    email: contact.email,          // FIX: was missing, caused NOT NULL violation
    event_type: 'unsubscribe',
    timestamp: new Date().toISOString(),
    metadata: {
      method: 'link_click',
      user_agent: req.headers.get('user-agent') || 'unknown',
    },
  });

  if (eventError) {
    console.warn('⚠️ Failed to record event:', eventError.message);
  } else {
    console.log('📊 Unsubscribe event recorded');
  }

  // Increment campaign unsubscribe counter — non-critical
  const { error: rpcError } = await supabase.rpc('increment_campaign_unsubscribes', {
    campaign_id_param: campaign_id,
  });
  if (rpcError) console.warn('⚠️ Failed to increment counter:', rpcError.message);
  else console.log('📊 Campaign counter incremented');

  console.log(`✅ Unsubscribe complete for ${contact.email}`);

  // Redirect to React frontend — renders the success UI
  return redirectToFrontend('success', contact.email, APP_URL);
});