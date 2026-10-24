-- Run after the privacy migration inside a transaction ending in ROLLBACK.
DO $$
DECLARE hidden uuid; actors jsonb:='[]'; actor record; sid uuid; expected jsonb;
BEGIN
  SELECT user_id INTO STRICT hidden FROM private.admin_hidden_accounts WHERE user_id='d35ecafa-19bc-412f-b437-bcc782b6f20f';
  PERFORM set_config('test.hidden',hidden::text,true);
  PERFORM set_config('test.hidden_email',(SELECT email FROM private.admin_hidden_accounts WHERE user_id=hidden),true);
  PERFORM set_config('test.hidden_profile_hash',(SELECT md5(to_jsonb(p)::text) FROM public.profiles p WHERE p.id=hidden),true);
  PERFORM set_config('test.hidden_contacts',(SELECT count(*)::text FROM public.contacts WHERE user_id=hidden),true);
  FOR actor IN SELECT u.id,u.email FROM auth.users u JOIN public.profiles p ON p.id=u.id
    WHERE u.id<>hidden AND u.email_confirmed_at IS NOT NULL AND NOT p.account_suspended
    ORDER BY (lower(u.email)='kevinbox@fuelyourgrowth.net') DESC,u.id LIMIT 2
  LOOP
    sid:=gen_random_uuid();
    INSERT INTO auth.sessions(id,user_id,created_at,updated_at,aal) VALUES(sid,actor.id,now(),now(),'aal1');
    INSERT INTO private.platform_admin_access(email) VALUES(lower(actor.email)) ON CONFLICT(email) DO UPDATE SET enabled=true;
    actors:=actors||jsonb_build_array(jsonb_build_object('id',actor.id,'session',sid));
  END LOOP;
  IF jsonb_array_length(actors)<>2 THEN RAISE EXCEPTION 'Two administrator fixtures required'; END IF;
  PERFORM set_config('test.privacy_admins',actors::text,true);
  INSERT INTO private.platform_admin_audit(actor_id,target_id,action,details) VALUES
    ((actors->0->>'id')::uuid,hidden,'privacy-test-hidden-target','{}'),
    (hidden,(actors->0->>'id')::uuid,'privacy-test-hidden-actor','{}'),
    ((actors->0->>'id')::uuid,(actors->0->>'id')::uuid,'privacy-test-hidden-mention',jsonb_build_object('reason',current_setting('test.hidden_email'))),
    ((actors->0->>'id')::uuid,(actors->0->>'id')::uuid,'privacy-test-visible','{}');
  expected:=jsonb_build_object(
    'users',(SELECT count(*) FROM public.profiles p WHERE NOT EXISTS(SELECT 1 FROM private.admin_hidden_accounts h WHERE h.user_id=p.id)),
    'active_users_30d',(SELECT count(*) FROM auth.users u WHERE last_sign_in_at>now()-interval '30 days' AND NOT EXISTS(SELECT 1 FROM private.admin_hidden_accounts h WHERE h.user_id=u.id)),
    'new_users_30d',(SELECT count(*) FROM public.profiles p WHERE created_at>now()-interval '30 days' AND NOT EXISTS(SELECT 1 FROM private.admin_hidden_accounts h WHERE h.user_id=p.id)),
    'paid_access',(SELECT count(*) FROM public.profiles p WHERE private.account_has_access(p.id) AND NOT EXISTS(SELECT 1 FROM private.admin_hidden_accounts h WHERE h.user_id=p.id)),
    'by_plan',(SELECT jsonb_object_agg(plan,n) FROM (SELECT coalesce(p.admin_plan_override,p.plan_type) plan,count(*) n FROM public.profiles p WHERE NOT EXISTS(SELECT 1 FROM private.admin_hidden_accounts h WHERE h.user_id=p.id) GROUP BY 1) q),
    'campaigns',(SELECT count(*) FROM public.campaigns c WHERE NOT EXISTS(SELECT 1 FROM private.admin_hidden_accounts h WHERE h.user_id=c.user_id)),
    'scheduled_campaigns',(SELECT count(*) FROM public.campaigns c WHERE c.status='scheduled' AND NOT EXISTS(SELECT 1 FROM private.admin_hidden_accounts h WHERE h.user_id=c.user_id)),
    'sending_campaigns',(SELECT count(*) FROM public.campaigns c WHERE c.status='sending' AND NOT EXISTS(SELECT 1 FROM private.admin_hidden_accounts h WHERE h.user_id=c.user_id)),
    'contacts',(SELECT count(*) FROM public.contacts c WHERE NOT EXISTS(SELECT 1 FROM private.admin_hidden_accounts h WHERE h.user_id=c.user_id)),
    'emails_this_month',(SELECT coalesce(sum(emails_sent),0) FROM public.usage_metrics m WHERE month=extract(month FROM now()) AND year=extract(year FROM now()) AND NOT EXISTS(SELECT 1 FROM private.admin_hidden_accounts h WHERE h.user_id=m.user_id)));
  PERFORM set_config('test.privacy_expected',expected::text,true);
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE actor jsonb; snapshot jsonb; hidden uuid:=current_setting('test.hidden')::uuid; k text; v jsonb;
BEGIN
  FOR actor IN SELECT * FROM jsonb_array_elements(current_setting('test.privacy_admins')::jsonb)
  LOOP
    PERFORM set_config('request.jwt.claim.sub',actor->>'id',true);
    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor->>'id','role','authenticated','session_id',actor->>'session')::text,true);
    IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Administrator fixture denied'; END IF;
    snapshot:=public.admin_users('', 'all',1);
    IF snapshot::text LIKE '%'||hidden::text||'%' OR strpos(lower(snapshot::text),current_setting('test.hidden_email'))>0 THEN RAISE EXCEPTION 'Hidden user listed'; END IF;
    IF (snapshot->>'total')::integer<>(current_setting('test.privacy_expected')::jsonb->>'users')::integer THEN RAISE EXCEPTION 'User count includes protected account'; END IF;
    snapshot:=public.admin_users(current_setting('test.hidden_email'),'all',1);
    IF snapshot->>'total'<>'0' OR jsonb_array_length(snapshot->'users')<>0 THEN RAISE EXCEPTION 'Email search exposed account'; END IF;
    snapshot:=public.admin_users(left(current_setting('test.hidden_email'),8),'pro_plus',2);
    IF snapshot->>'total'<>'0' THEN RAISE EXCEPTION 'Partial/filter search exposed account'; END IF;
    snapshot:=public.admin_overview();
    FOR k,v IN SELECT * FROM jsonb_each(current_setting('test.privacy_expected')::jsonb)
    LOOP IF snapshot->k IS DISTINCT FROM v THEN RAISE EXCEPTION 'Aggregate leaks protected data: %',k; END IF; END LOOP;
    IF (snapshot->'activity')::text LIKE '%privacy-test-hidden%' OR strpos(lower((snapshot->'activity')::text),current_setting('test.hidden_email'))>0 THEN RAISE EXCEPTION 'Audit activity exposed account'; END IF;
    IF (snapshot->'activity')::text NOT LIKE '%privacy-test-visible%' THEN RAISE EXCEPTION 'Visible activity lost'; END IF;
    IF public.admin_can_manage_user(hidden) OR public.has_platform_access(hidden) THEN RAISE EXCEPTION 'Hidden account probe succeeded'; END IF;
    IF public.admin_can_manage_user('00000000-0000-0000-0000-000000000000') THEN RAISE EXCEPTION 'Unknown account probe succeeded'; END IF;
    IF NOT public.admin_can_manage_user((actor->>'id')::uuid) THEN RAISE EXCEPTION 'Visible account probe denied'; END IF;
    BEGIN PERFORM public.admin_set_plan(hidden,'none','Privacy regression test'); RAISE EXCEPTION 'Hidden plan changed';
      EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Account not found' THEN RAISE; END IF; END;
    BEGIN PERFORM public.admin_set_suspended(hidden,true,'Privacy regression test'); RAISE EXCEPTION 'Hidden account suspended';
      EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Account not found' THEN RAISE; END IF; END;
    IF EXISTS(SELECT 1 FROM public.profiles WHERE id=hidden) OR EXISTS(SELECT 1 FROM public.contacts WHERE user_id=hidden)
      OR EXISTS(SELECT 1 FROM public.campaigns WHERE user_id=hidden) THEN RAISE EXCEPTION 'Direct tenant data exposed'; END IF;
    BEGIN PERFORM 1 FROM private.admin_hidden_accounts; RAISE EXCEPTION 'Privacy registry accessible';
      EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  END LOOP;
END $$;
RESET ROLE;
DO $$ DECLARE hidden uuid:=current_setting('test.hidden')::uuid; sid uuid:=gen_random_uuid(); BEGIN
  IF (SELECT md5(to_jsonb(p)::text) FROM public.profiles p WHERE p.id=hidden)<>current_setting('test.hidden_profile_hash') THEN RAISE EXCEPTION 'Protected profile changed'; END IF;
  INSERT INTO auth.sessions(id,user_id,created_at,updated_at,aal) VALUES(sid,hidden,now(),now(),'aal1');
  PERFORM set_config('request.jwt.claim.sub',hidden::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',hidden,'role','authenticated','session_id',sid)::text,true);
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF NOT public.has_platform_access() OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid()) THEN RAISE EXCEPTION 'Owner lost account access'; END IF;
  IF (SELECT count(*) FROM public.contacts WHERE user_id=auth.uid())<>current_setting('test.hidden_contacts')::bigint THEN RAISE EXCEPTION 'Owner lost contacts'; END IF;
END $$;
RESET ROLE;
SELECT 'PASS: two admins cannot list/search/count/read/manage protected account; owner access preserved' AS privacy_checks;
