BEGIN;
-- Policy names do not restrict roles. These deployed ALL policies targeted
-- PUBLIC and silently overrode the tenant-ownership policies.
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND cmd='ALL'
      AND qual='true' AND ('public'=ANY(roles) OR 'authenticated'=ANY(roles) OR 'anon'=ANY(roles))
      AND tablename IN ('campaign_recipients','link_clicks','usage_metrics',
        'admin_users','admin_activity_log','platform_metrics_daily','system_alerts','email_events')
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I TO service_role',p.policyname,p.schemaname,p.tablename);
  END LOOP;
  IF to_regclass('public.delivery_timestamps') IS NOT NULL THEN
    ALTER TABLE public.delivery_timestamps ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.delivery_timestamps FROM anon, authenticated;
  END IF;
  IF to_regclass('public.campaigns_stats_backup') IS NOT NULL THEN
    ALTER TABLE public.campaigns_stats_backup ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.campaigns_stats_backup FROM anon, authenticated;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_security_events'
    AND policyname='Service can insert security events') THEN
    ALTER POLICY "Service can insert security events" ON public.user_security_events
      WITH CHECK ((SELECT auth.uid())=user_id);
  END IF;
END $$;

-- These RPCs perform privileged bookkeeping and are used only by server jobs.
DO $$
DECLARE f record;
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef AND p.proname IN
      ('increment_usage','increment_campaign_stat','update_contact_engagement',
       'increment_campaign_unsubscribes','check_rate_limit','cleanup_old_rate_limits','handle_new_user')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated',f.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp',f.signature);
  END LOOP;
END $$;
REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;
COMMIT;
