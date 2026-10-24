-- Run after the paid/admin migration within a transaction; always ROLLBACK.
DO $$
DECLARE actor uuid; sid uuid; target uuid; actor_email text;
BEGIN
  SELECT p.id,u.email INTO actor,actor_email FROM public.profiles p JOIN auth.users u ON u.id=p.id
    WHERE p.plan_type IN ('pro','pro_plus') AND u.email_confirmed_at IS NOT NULL
      AND NOT EXISTS(SELECT 1 FROM private.platform_admin_access a WHERE a.email=lower(u.email) AND a.enabled) LIMIT 1;
  IF actor IS NULL THEN RAISE EXCEPTION 'A verified paid test fixture is required'; END IF;
  sid:=gen_random_uuid();
  INSERT INTO auth.sessions(id,user_id,created_at,updated_at,aal) VALUES(sid,actor,now(),now(),'aal1');
  SELECT p.id INTO target FROM public.profiles p JOIN auth.users u ON u.id=p.id
    WHERE p.id<>actor AND u.email_confirmed_at IS NOT NULL LIMIT 1;
  IF target IS NULL THEN RAISE EXCEPTION 'A second verified account is required'; END IF;
  PERFORM set_config('test.actor',actor::text,true);
  PERFORM set_config('test.actor_email',actor_email,true);
  PERFORM set_config('test.session',sid::text,true);
  PERFORM set_config('test.target',target::text,true);
  PERFORM set_config('request.jwt.claim.sub',actor::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','session_id',sid,
    'user_metadata',jsonb_build_object('is_admin',true,'admin_role','super_admin'))::text,true);
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF NOT public.has_platform_access() THEN RAISE EXCEPTION 'Paid user lost access'; END IF;
  IF public.is_platform_admin() THEN RAISE EXCEPTION 'Editable metadata granted admin access'; END IF;
  BEGIN PERFORM public.admin_overview(); RAISE EXCEPTION 'Non-admin read admin overview'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.admin_set_plan(current_setting('test.target')::uuid,'pro','Unauthorized test'); RAISE EXCEPTION 'Non-admin changed a plan'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN UPDATE public.profiles SET plan_type='none' WHERE id=auth.uid(); RAISE EXCEPTION 'User changed protected billing fields'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  IF EXISTS(SELECT 1 FROM public.profiles WHERE id<>auth.uid()) THEN RAISE EXCEPTION 'Cross-account profile read'; END IF;
END $$;
RESET ROLE;
INSERT INTO private.platform_admin_access(email) VALUES(lower(current_setting('test.actor_email'))) ON CONFLICT(email) DO UPDATE SET enabled=true;
SET LOCAL ROLE authenticated;
DO $$ DECLARE snapshot jsonb; BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Verified authorized admin denied'; END IF;
  snapshot:=public.admin_overview();
  IF (snapshot->>'users')::integer<1 THEN RAISE EXCEPTION 'Admin overview missing users'; END IF;
  snapshot:=public.admin_users('', 'all',1);
  IF jsonb_array_length(snapshot->'users')<1 THEN RAISE EXCEPTION 'Admin user list empty'; END IF;
  PERFORM public.admin_set_plan(current_setting('test.target')::uuid,'pro','Authorization regression test');
  IF NOT public.has_platform_access(current_setting('test.target')::uuid) THEN RAISE EXCEPTION 'Admin grant did not activate access'; END IF;
  PERFORM public.admin_set_plan(current_setting('test.target')::uuid,'none','Authorization regression test');
  IF public.has_platform_access(current_setting('test.target')::uuid) THEN RAISE EXCEPTION 'Admin revocation did not block access'; END IF;
END $$;
RESET ROLE;
DELETE FROM auth.sessions WHERE id=current_setting('test.session')::uuid;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF public.is_platform_admin() OR public.has_platform_access() THEN RAISE EXCEPTION 'Revoked session retained access'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM public.admin_overview(); RAISE EXCEPTION 'Anonymous admin API access'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  IF EXISTS(SELECT 1 FROM public.campaign_recipients) OR EXISTS(SELECT 1 FROM public.email_events) THEN RAISE EXCEPTION 'Anonymous tracking data exposed'; END IF;
END $$;
RESET ROLE;
SELECT 'PASS: paid access, admin grants/revocation, tenant isolation, metadata spoofing, profile protection, revoked sessions and anonymous denial' AS security_checks;
