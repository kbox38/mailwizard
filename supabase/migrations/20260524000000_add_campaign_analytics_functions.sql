/*
  Migration: Campaign analytics counter functions (+ delivered column + backfill)

  WHY:
  The sendgrid-webhook Edge Function increments per-campaign counters by calling
  RPCs: increment_campaign_opens / _clicks / _bounces / _complaints /
  _delivered / _unsubscribes. Only `increment_campaign_unsubscribes` and
  `update_contact_engagement` ever existed in the database — the other five were
  never created. Because supabase.rpc() returns a PostgREST 404 in its result
  object (instead of throwing), the webhook silently swallowed the failure: every
  SendGrid event still landed in `email_events`, but the campaigns.opens / clicks
  / bounces / complaints / delivered columns stayed at 0.

  EFFECT:
  - Dashboard & Analytics pages read `email_events`, so they already showed data.
  - The Campaigns list reads campaigns.opens / clicks / bounces directly, so it
    showed 0 opens and 0% open rate for every campaign.

  This migration creates the missing functions, adds the missing `delivered`
  column, and backfills all existing campaigns from the events already recorded
  in `email_events`.
*/

-- 1. delivered column (referenced by increment_campaign_delivered, never created)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS delivered integer DEFAULT 0;

-- 2. Counter increment functions. Called only by the service-role webhook, so
--    execute is restricted to service_role (prevents clients incrementing
--    arbitrary campaign counters).
CREATE OR REPLACE FUNCTION increment_campaign_opens(campaign_id_param uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE campaigns SET opens = COALESCE(opens, 0) + 1 WHERE id = campaign_id_param;
$$;

CREATE OR REPLACE FUNCTION increment_campaign_clicks(campaign_id_param uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE campaigns SET clicks = COALESCE(clicks, 0) + 1 WHERE id = campaign_id_param;
$$;

CREATE OR REPLACE FUNCTION increment_campaign_bounces(campaign_id_param uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE campaigns SET bounces = COALESCE(bounces, 0) + 1 WHERE id = campaign_id_param;
$$;

CREATE OR REPLACE FUNCTION increment_campaign_complaints(campaign_id_param uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE campaigns SET complaints = COALESCE(complaints, 0) + 1 WHERE id = campaign_id_param;
$$;

CREATE OR REPLACE FUNCTION increment_campaign_delivered(campaign_id_param uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE campaigns SET delivered = COALESCE(delivered, 0) + 1 WHERE id = campaign_id_param;
$$;

-- 3. Lock down execute to the service role only (the webhook uses the service key).
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'increment_campaign_opens',
    'increment_campaign_clicks',
    'increment_campaign_bounces',
    'increment_campaign_complaints',
    'increment_campaign_delivered'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I(uuid) FROM PUBLIC;', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I(uuid) TO service_role;', fn);
  END LOOP;
END $$;

-- 4. Backfill existing campaigns from events already recorded in email_events.
UPDATE campaigns c SET
  opens        = COALESCE(e.opens, 0),
  clicks       = COALESCE(e.clicks, 0),
  bounces      = COALESCE(e.bounces, 0),
  complaints   = COALESCE(e.complaints, 0),
  unsubscribes = COALESCE(e.unsubscribes, 0),
  delivered    = COALESCE(e.delivered, 0)
FROM (
  SELECT campaign_id,
    COUNT(*) FILTER (WHERE event_type = 'open')                 AS opens,
    COUNT(*) FILTER (WHERE event_type = 'click')                AS clicks,
    COUNT(*) FILTER (WHERE event_type IN ('bounce', 'dropped')) AS bounces,
    COUNT(*) FILTER (WHERE event_type IN ('spamreport', 'spam')) AS complaints,
    COUNT(*) FILTER (WHERE event_type = 'unsubscribe')          AS unsubscribes,
    COUNT(*) FILTER (WHERE event_type = 'delivered')            AS delivered
  FROM email_events
  WHERE campaign_id IS NOT NULL
  GROUP BY campaign_id
) e
WHERE c.id = e.campaign_id;
