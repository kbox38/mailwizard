BEGIN;
CREATE OR REPLACE FUNCTION private.dispatch_scheduled_campaigns() RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cron_secret text; anon_key text; request_id bigint;
BEGIN
  SELECT decrypted_secret INTO cron_secret FROM vault.decrypted_secrets WHERE name='mailwizard_campaign_cron_secret' LIMIT 1;
  SELECT decrypted_secret INTO anon_key FROM vault.decrypted_secrets WHERE name='mailwizard_scheduler_anon_key' LIMIT 1;
  IF cron_secret IS NULL OR anon_key IS NULL THEN RAISE EXCEPTION 'Campaign scheduler credentials are not configured'; END IF;
  SELECT net.http_post(
    url:='https://dmgrxgtcmcurjvmxlfvw.supabase.co/functions/v1/process-scheduled-campaigns',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||anon_key,'X-Cron-Secret',cron_secret),
    body:='{}'::jsonb
  ) INTO request_id;
  RETURN request_id;
END $$;
REVOKE ALL ON FUNCTION private.dispatch_scheduled_campaigns() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION private.dispatch_scheduled_campaigns() TO service_role;
SELECT cron.schedule('process-scheduled-campaigns','* * * * *','SELECT private.dispatch_scheduled_campaigns();');
COMMIT;
