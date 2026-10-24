/**
 * ============================================================================
 * SHARED CAMPAIGN SENDER
 * ============================================================================
 *
 * Single source of truth for sending a campaign to its recipients.
 *
 * WHY THIS EXISTS:
 * The old "Send now" flow looped over recipients in the BROWSER, firing one
 * Edge Function call per contact. For a list of thousands this:
 *   - took many minutes (one network round-trip per email),
 *   - silently stopped the moment the tab was closed / slept / navigated away,
 *   - so only the first ~100 emails ever reached SendGrid.
 *
 * THE FIX:
 * Sending now runs entirely server-side and uses SendGrid's BATCH API.
 * Up to `BATCH_SIZE` recipients are sent in a single /v3/mail/send call using
 * per-recipient `substitutions`, so thousands of emails go out in a handful of
 * requests that complete in seconds and never depend on the browser staying open.
 *
 * Used by both:
 *   - send-campaign            (the "Send now" button)
 *   - process-scheduled-campaigns (cron / scheduled sends)
 * ============================================================================
 */

import { requirePaidAccess, reserveEmailQuota } from './paidAccess.ts';

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const UNSUBSCRIBE_TOKEN_SECRET = Deno.env.get('UNSUBSCRIBE_TOKEN_SECRET') || '';
const SHARED_SENDING_DOMAIN = 'mail.mailwizard.io';

// SendGrid allows up to 1000 personalizations per request. Stay safely under it.
const BATCH_SIZE = 900;

export interface SendResult {
  recipientCount: number;
  sent: number;
  failed: number;
  batches: number;
  /** Contacts dropped before sending because their email was malformed. */
  skippedInvalid: number;
  errors: string[];
}

/**
 * Whether an address is well-formed enough for SendGrid to accept it.
 * SendGrid rejects an ENTIRE /mail/send request with a 400 ("Does not contain
 * a valid address") if even one personalization `to` is malformed — which would
 * silently drop every other (valid) recipient in the same batch. So we filter
 * junk addresses (names, phone numbers, "n/a", trailing commas, addresses with
 * spaces, missing @ or TLD, etc.) out up front. Mirrors the regex used by the
 * resubscribe Edge Function.
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Per-recipient unsubscribe URL — identical scheme to the rest of the app
 * (HMAC-SHA256 of `contactId:campaignId:timestamp`). Do not change without
 * also updating the unsubscribe Edge Function, or links will break.
 */
async function generateUnsubscribeUrl(contactId: string, campaignId: string): Promise<string> {
  if (!UNSUBSCRIBE_TOKEN_SECRET) return '';
  const encoder = new TextEncoder();
  const timestamp = Date.now();
  const data = `${contactId}:${campaignId}:${timestamp}`;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(UNSUBSCRIBE_TOKEN_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
  const token = btoa(`${data}:${hex}`);
  return `${SUPABASE_URL}/functions/v1/unsubscribe?token=${token}`;
}

/**
 * Substitution tokens for the per-recipient fields. These replace the template's
 * `{{...}}` merge tags in the SHARED content; SendGrid then swaps them per
 * recipient via `personalizations[].substitutions`. Using neutral `%%..%%`
 * tokens avoids any chance of SendGrid mistaking `{{ }}` for Handlebars.
 */
const TOK = {
  fname: '%%MW_FIRST_NAME%%',
  lname: '%%MW_LAST_NAME%%',
  email: '%%MW_EMAIL%%',
  company: '%%MW_COMPANY%%',
  unsub: '%%MW_UNSUB_URL%%',
};

/**
 * Replace per-recipient merge tags (all known variants) with neutral tokens,
 * and replace campaign-level constants (year / company name / from email /
 * view-in-browser) directly, since those are identical for every recipient.
 */
function tokenizeContent(
  text: string,
  constants: { year: string; companyName: string; fromEmail: string; viewUrl: string }
): string {
  return text
    // per-recipient → tokens
    .replace(/\{\{MERGE:first_name\}\}/gi, TOK.fname)
    .replace(/\{\{first_name\}\}/gi, TOK.fname)
    .replace(/\{\{firstname\}\}/gi, TOK.fname)
    .replace(/\{\{MERGE:last_name\}\}/gi, TOK.lname)
    .replace(/\{\{last_name\}\}/gi, TOK.lname)
    .replace(/\{\{lastname\}\}/gi, TOK.lname)
    .replace(/\{\{MERGE:email\}\}/gi, TOK.email)
    .replace(/\{\{email\}\}/gi, TOK.email)
    .replace(/\{\{MERGE:company\}\}/gi, TOK.company)
    .replace(/\{\{company\}\}/gi, TOK.company)
    .replace(/\{\{UNSUBSCRIBE_URL\}\}/gi, TOK.unsub)
    // campaign-level constants → final values
    .replace(/\{\{CURRENT_YEAR\}\}/gi, constants.year)
    .replace(/\{\{COMPANY_NAME\}\}/gi, constants.companyName)
    .replace(/\{\{FROM_EMAIL\}\}/gi, constants.fromEmail)
    .replace(/\{\{VIEW_IN_BROWSER_URL\}\}/gi, constants.viewUrl);
}

/**
 * Responsive style block injected into every outgoing email so it renders well
 * on phones (clients that support <style> + media queries: iOS Mail, Apple Mail,
 * Gmail app, Outlook mobile). Clients that strip <style> still get the existing
 * fluid `max-width:600px` tables, so nothing regresses.
 */
const RESPONSIVE_STYLE = `<style>
@media only screen and (max-width:600px){
  table[role="presentation"]{width:100%!important;}
  img{max-width:100%!important;height:auto!important;}
  td[style*="padding: 60px 40px"],td[style*="padding:60px 40px"],
  td[style*="padding: 50px 40px"],td[style*="padding:50px 40px"],
  td[style*="padding: 40px 40px"],td[style*="padding:40px 40px"],
  td[style*="padding: 40px"],td[style*="padding:40px"],
  td[style*="padding: 30px 40px"],td[style*="padding:30px 40px"],
  td[style*="padding: 20px 40px"],td[style*="padding:20px 40px"]{
    padding-left:22px!important;padding-right:22px!important;
    padding-top:28px!important;padding-bottom:28px!important;
  }
  h1{font-size:26px!important;line-height:1.25!important;}
  h2{font-size:21px!important;line-height:1.3!important;}
}
</style>`;

/** Insert the responsive style + a viewport meta into the email <head>. */
export function injectResponsiveStyles(html: string): string {
  let out = html;
  if (!/name=["']viewport["']/i.test(out)) {
    const viewport = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    out = /<head[^>]*>/i.test(out)
      ? out.replace(/<head[^>]*>/i, (m) => `${m}\n${viewport}`)
      : `${viewport}\n${out}`;
  }
  if (/<\/head>/i.test(out)) {
    return out.replace(/<\/head>/i, `${RESPONSIVE_STYLE}\n</head>`);
  }
  // No <head> — prepend the style so it still applies.
  return `${RESPONSIVE_STYLE}\n${out}`;
}

// PostgREST returns at most ~1000 rows per request and rejects very long URLs.
// A naive `.select()` therefore silently truncates a big list to its first 1000
// rows, and a `.in('id', [...thousands])` filter overflows the query string and
// fails outright. Either way a large campaign (e.g. a CSV-imported group of
// several thousand) resolves to far fewer recipients than intended, or zero.
const PAGE_SIZE = 1000;   // PostgREST's hard per-response row cap
const IN_CHUNK = 200;     // keep each .in(...) URL comfortably small

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Page through a query past the 1000-row cap. `build(from, to)` returns a
// PostgREST query with its filters applied; we add `.range()`. Throws on any
// query error so a failed request can't masquerade as an empty result set.
async function fetchAllRows(
  build: (from: number, to: number) => any,
  label: string
): Promise<any[]> {
  const rows: any[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await build(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${label}: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

/**
 * Build the recipient list for a campaign based on its stored recipient config.
 * Returns deduped, validated contacts plus a count of how many were dropped for
 * having an invalid email (so the caller can surface it).
 */
async function buildRecipients(
  campaign: any,
  supabase: any
): Promise<{ contacts: any[]; invalidCount: number }> {
  const recipientConfig = campaign.content?.recipients;
  const userId = campaign.user_id;
  const CONTACT_COLS = 'id, email, first_name, last_name, company';
  let contacts: any[] = [];

  // Statuses that are allowed to receive mail. Must stay in sync with the
  // recipient picker in CreateCampaignModal (Step 3), which shows both 'active'
  // and 'subscribed' contacts. Filtering on 'active' alone here silently drops
  // every 'subscribed' contact and sends the campaign to 0 recipients.
  const SENDABLE_STATUSES = ['active', 'subscribed'];

  // Load sendable contacts by id, chunking so the `.in(...)` URL never overflows.
  const contactsByIds = async (ids: string[]): Promise<any[]> => {
    const out: any[] = [];
    for (const part of chunk([...new Set(ids)], IN_CHUNK)) {
      const { data, error } = await supabase
        .from('contacts')
        .select(CONTACT_COLS)
        .eq('user_id', userId)
        .in('status', SENDABLE_STATUSES)
        .in('id', part);
      if (error) throw new Error(`load contacts by id: ${error.message}`);
      if (data) out.push(...data);
    }
    return out;
  };

  if (!recipientConfig || recipientConfig.sendToMode === 'all') {
    contacts = await fetchAllRows(
      (from, to) =>
        supabase
          .from('contacts')
          .select(CONTACT_COLS)
          .eq('user_id', userId)
          .in('status', SENDABLE_STATUSES)
          .range(from, to),
      'load all contacts'
    );
  } else if (recipientConfig.sendToMode === 'contacts') {
    contacts = await contactsByIds(recipientConfig.selectedContacts || []);
  } else if (recipientConfig.sendToMode === 'groups') {
    // A group can hold thousands of members — page through all of them, not just
    // the first 1000, then fetch the contacts themselves in chunks.
    const members = await fetchAllRows(
      (from, to) =>
        supabase
          .from('contact_group_members')
          .select('contact_id')
          .in('group_id', recipientConfig.selectedGroups || [])
          .range(from, to),
      'load group members'
    );
    contacts = await contactsByIds(members.map((m: any) => m.contact_id));
  }

  // Dedupe by email (SendGrid rejects a request if an address appears in more
  // than one personalization block) AND drop malformed addresses (a single bad
  // one 400s the whole batch). Store the cleaned address back on the contact so
  // the trimmed/normalized value is what actually gets sent.
  const seen = new Set<string>();
  let invalidCount = 0;
  const valid = contacts.filter((c) => {
    const e = (c.email || '').trim().toLowerCase();
    if (!e || seen.has(e)) return false;
    if (!isValidEmail(e)) {
      invalidCount++;
      return false;
    }
    seen.add(e);
    c.email = e;
    return true;
  });

  if (invalidCount > 0) {
    console.warn(`buildRecipients: skipped ${invalidCount} contact(s) with invalid email`);
  }
  return { contacts: valid, invalidCount };
}

/**
 * Send a campaign to all of its active recipients via SendGrid's batch API.
 * Caller is responsible for any auth checks and for setting the initial
 * 'sending' status. This function sets the final 'sent' status + counts.
 */
export async function sendCampaign(campaign: any, supabase: any): Promise<SendResult> {
  await requirePaidAccess(supabase, campaign.user_id);
  const result: SendResult = { recipientCount: 0, sent: 0, failed: 0, batches: 0, skippedInvalid: 0, errors: [] };

  const baseHtml = campaign.custom_html || campaign.content?.html || '';
  if (!baseHtml) {
    result.errors.push('Campaign has no HTML content');
    await supabase.from('campaigns').update({ status: 'draft' }).eq('id', campaign.id);
    return result;
  }

  let contacts: any[];
  let invalidCount: number;
  try {
    ({ contacts, invalidCount } = await buildRecipients(campaign, supabase));
  } catch (err: any) {
    // A genuinely empty list is fine (handled below), but a *failed* recipient
    // query must not be mistaken for "0 recipients" and reported as a success.
    // Revert the lock so the campaign isn't stranded in 'sending' and can retry.
    await supabase.from('campaigns').update({ status: 'draft' }).eq('id', campaign.id);
    throw new Error(`Failed to load recipients: ${err?.message || String(err)}`);
  }
  result.recipientCount = contacts.length;
  result.skippedInvalid = invalidCount;

  if (contacts.length === 0) {
    await supabase.from('campaigns')
      .update({ status: 'sent', recipients_count: 0, sent_at: new Date().toISOString() })
      .eq('id', campaign.id);
    return result;
  }

  // Resolve the From address (verified custom domain → fallback to shared domain).
  let fromEmail = '';
  if (campaign.content?.sending_domain_id) {
    const { data: domain } = await supabase
      .from('sending_domains')
      .select('domain')
      .eq('id', campaign.content.sending_domain_id)
      .eq('user_id', campaign.user_id)
      .eq('verification_status', 'verified')
      .single();
    if (domain) {
      const localPart = (campaign.from_email || '').split('@')[0] || 'noreply';
      fromEmail = `${localPart}@${domain.domain}`;
    }
  }
  if (!fromEmail) {
    const requested = campaign.from_email || `noreply@${SHARED_SENDING_DOMAIN}`;
    const domainName = requested.split('@')[1]?.toLowerCase();
    if (!isValidEmail(requested)) throw new Error('Invalid sender address');
    if (domainName !== SHARED_SENDING_DOMAIN) {
      const { data: owned, error } = await supabase.from('sending_domains').select('id')
        .eq('user_id', campaign.user_id).eq('domain', domainName).eq('verification_status', 'verified').maybeSingle();
      if (error || !owned) throw new Error('A verified sender domain owned by this account is required');
    }
    fromEmail = requested;
  }

  const fromName = campaign.from_name || 'Mail Wizard';
  const constants = {
    year: new Date().getFullYear().toString(),
    companyName: fromName,
    fromEmail,
    viewUrl: `${SUPABASE_URL}/functions/v1/view-email?campaign_id=${campaign.id}`,
  };

  // Shared, responsive, tokenized content (identical for every recipient in the
  // request — per-recipient values are supplied through substitutions).
  const sharedHtml = injectResponsiveStyles(tokenizeContent(baseHtml, constants));
  const sharedSubject = tokenizeContent(campaign.subject || '', constants);

  // Send one chunk of contacts as a single SendGrid batch request.
  // One personalization per recipient: their address, their substitutions, and
  // their contact_id as a custom arg (so the webhook can attribute opens /
  // clicks / unsubscribes to the right contact).
  const sendChunk = async (chunk: any[]): Promise<{ ok: boolean; status: number; errText: string }> => {
    const personalizations = await Promise.all(
      chunk.map(async (contact) => ({
        to: [{ email: contact.email }],
        // Subject lives here (not at message level) so substitutions reliably
        // apply to it per recipient.
        subject: sharedSubject,
        substitutions: {
          [TOK.fname]: contact.first_name || 'there',
          [TOK.lname]: contact.last_name || '',
          [TOK.email]: contact.email || '',
          [TOK.company]: contact.company || '',
          [TOK.unsub]: await generateUnsubscribeUrl(contact.id, campaign.id),
        },
        custom_args: { contact_id: contact.id },
      }))
    );

    const payload = {
      personalizations,
      from: { email: fromEmail, name: fromName },
      reply_to: { email: campaign.reply_to || fromEmail },
      custom_args: { campaign_id: campaign.id, user_id: campaign.user_id },
      tracking_settings: {
        click_tracking: { enable: true, enable_text: false },
        open_tracking: { enable: true },
        subscription_tracking: { enable: false },
      },
      content: [{ type: 'text/html', value: sharedHtml }],
    };

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, status: res.status, errText: res.ok ? '' : await res.text() };
  };

  // Record a successful send for a chunk (counts + best-effort analytics events).
  const recordSent = async (chunk: any[]) => {
    result.sent += chunk.length;
    const events = chunk.map((c) => ({
      campaign_id: campaign.id,
      contact_id: c.id,
      event_type: 'sent',
      timestamp: new Date().toISOString(),
    }));
    await supabase.from('email_events').insert(events).then(() => {}, () => {});
  };

  // Send a chunk; on a 400 (SendGrid rejects the WHOLE request if even one `to`
  // address is invalid), split it in half and retry the halves so a single junk
  // recipient can't sink everyone batched with it. Once a 400 chunk is down to a
  // single recipient, that recipient is the bad one — count it failed and move
  // on. Non-400 failures (auth / rate-limit / 5xx) apply to the whole chunk.
  const sendWithSplit = async (chunk: any[]): Promise<void> => {
    if (chunk.length === 0) return;

    let attempt;
    try {
      attempt = await sendChunk(chunk);
    } catch (err: any) {
      result.failed += chunk.length;
      const msg = `Network error: ${err?.message || String(err)}`;
      console.error(`Chunk of ${chunk.length} threw — ${msg}`);
      if (!result.errors.includes(msg)) result.errors.push(msg);
      return;
    }

    if (attempt.ok) {
      await recordSent(chunk);
      return;
    }

    if (attempt.status === 400 && chunk.length > 1) {
      const mid = Math.floor(chunk.length / 2);
      await sendWithSplit(chunk.slice(0, mid));
      await sendWithSplit(chunk.slice(mid));
      return;
    }

    result.failed += chunk.length;
    const who = chunk.length === 1 ? ` (${chunk[0].email})` : '';
    const msg = `SendGrid ${attempt.status}: ${attempt.errText.substring(0, 300)}`;
    console.error(`Chunk of ${chunk.length} failed${who} — ${msg}`);
    if (!result.errors.includes(msg)) result.errors.push(msg);
  };

  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    try {
      await requirePaidAccess(supabase, campaign.user_id);
      await reserveEmailQuota(supabase, campaign.user_id, Math.min(BATCH_SIZE, contacts.length-i));
    } catch (failure: any) {
      result.failed += contacts.length-i;
      result.errors.push(failure.message);
      break;
    }
    result.batches++;
    await sendWithSplit(contacts.slice(i, i + BATCH_SIZE));
  }

  await supabase.from('campaigns').update({
    status: 'sent',
    recipients_count: result.sent,
    sent_at: new Date().toISOString(),
  }).eq('id', campaign.id);

  console.log(
    `Campaign ${campaign.id}: ${result.sent} sent, ${result.failed} failed, ${result.batches} batch(es)`
  );
  return result;
}
