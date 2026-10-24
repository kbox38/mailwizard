BEGIN;
DO $$ DECLARE actor uuid; BEGIN
  SELECT p.id INTO actor FROM public.profiles p JOIN auth.users u ON u.id=p.id
    WHERE p.plan_type='pro' AND u.email_confirmed_at IS NOT NULL LIMIT 1;
  IF actor IS NULL THEN RAISE EXCEPTION 'Missing verified Pro fixture'; END IF;
  PERFORM set_config('test.quota_actor',actor::text,true);
  UPDATE public.profiles SET admin_plan_override='pro',account_suspended=false WHERE id=actor;
  DELETE FROM public.usage_metrics WHERE user_id=actor AND month=extract(month FROM now()) AND year=extract(year FROM now());
  INSERT INTO public.usage_metrics(user_id,month,year,emails_sent,storage_used) VALUES(actor,extract(month FROM now()),extract(year FROM now()),24000,0);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('role','service_role')::text,true);
END $$;
SET LOCAL ROLE service_role;
DO $$ BEGIN
  IF NOT public.reserve_email_quota(current_setting('test.quota_actor')::uuid,1000) THEN RAISE EXCEPTION 'Valid allowance denied'; END IF;
  IF public.reserve_email_quota(current_setting('test.quota_actor')::uuid,1) THEN RAISE EXCEPTION 'Monthly limit bypassed'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN PERFORM public.reserve_email_quota(current_setting('test.quota_actor')::uuid,1);
    RAISE EXCEPTION 'Client can reserve quota'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT 'PASS: quota boundary and service-only permission' AS checks;
ROLLBACK;
