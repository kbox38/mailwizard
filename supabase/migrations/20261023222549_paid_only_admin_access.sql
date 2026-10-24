BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS private.platform_admin_access (
  email text PRIMARY KEY CHECK (email=lower(email)), enabled boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS private.platform_admin_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid NOT NULL, target_id uuid, action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS private.retired_free_accounts (
  user_id uuid PRIMARY KEY, stripe_subscription_id text,
  captured_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.platform_admin_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.platform_admin_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.retired_free_accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA private FROM PUBLIC, anon, authenticated;
INSERT INTO private.platform_admin_access(email) VALUES ('kevinbox@fuelyourgrowth.net')
ON CONFLICT(email) DO UPDATE SET enabled=true;

INSERT INTO private.retired_free_accounts(user_id,stripe_subscription_id)
SELECT id,stripe_subscription_id FROM public.profiles WHERE plan_type='free'
ON CONFLICT DO NOTHING;
INSERT INTO private.retired_free_accounts(user_id)
SELECT u.id FROM auth.users u WHERE NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=u.id)
ON CONFLICT DO NOTHING;
DO $$ DECLARE c record; BEGIN
  FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='public.profiles'::regclass
    AND contype='c' AND pg_get_constraintdef(oid) LIKE '%plan_type%'
  LOOP EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I',c.conname); END LOOP;
END $$;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_plan_override text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_suspended boolean NOT NULL DEFAULT false;
UPDATE public.profiles p SET email=u.email FROM auth.users u WHERE u.id=p.id AND p.email IS DISTINCT FROM u.email;
UPDATE public.profiles SET plan_type='none', subscription_status='inactive' WHERE plan_type='free';
INSERT INTO public.profiles(id,email,full_name,plan_type,subscription_status)
SELECT u.id,u.email,coalesce(u.raw_user_meta_data->>'full_name',''),'none','inactive'
FROM auth.users u WHERE NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=u.id);
ALTER TABLE public.profiles ALTER COLUMN plan_type SET DEFAULT 'none';
ALTER TABLE public.profiles ALTER COLUMN subscription_status SET DEFAULT 'inactive';
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_type_check CHECK(plan_type IN ('none','pro','pro_plus'));
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_admin_plan_override_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_admin_plan_override_check CHECK(admin_plan_override IN ('none','pro','pro_plus'));

CREATE OR REPLACE FUNCTION private.has_live_session() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT EXISTS(SELECT 1 FROM auth.sessions s
    WHERE s.user_id=(SELECT auth.uid()) AND s.id::text=(SELECT auth.jwt()->>'session_id'));
$$;
CREATE OR REPLACE FUNCTION private.is_platform_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT private.has_live_session() AND EXISTS(
    SELECT 1 FROM auth.users u JOIN public.profiles p ON p.id=u.id
      JOIN private.platform_admin_access a ON a.email=lower(u.email)
    WHERE u.id=(SELECT auth.uid()) AND u.email_confirmed_at IS NOT NULL AND a.enabled
      AND NOT p.account_suspended AND (u.banned_until IS NULL OR u.banned_until<now()));
$$;
CREATE OR REPLACE FUNCTION private.account_has_access(p_user_id uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF auth.role()='anon' OR (auth.role()='authenticated' AND
    ((p_user_id IS DISTINCT FROM auth.uid() AND NOT private.is_platform_admin()) OR NOT private.has_live_session())) THEN RETURN false; END IF;
  RETURN EXISTS(SELECT 1 FROM public.profiles p JOIN auth.users u ON u.id=p.id
    WHERE p.id=p_user_id AND NOT p.account_suspended AND u.email_confirmed_at IS NOT NULL
      AND (u.banned_until IS NULL OR u.banned_until<now()) AND
      (p.admin_plan_override IN ('pro','pro_plus') OR
        (p.admin_plan_override IS NULL AND p.plan_type IN ('pro','pro_plus')
          AND p.subscription_status IN ('active','trialing'))));
END $$;

CREATE OR REPLACE FUNCTION private.guard_profile_entitlements() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF current_user IN ('postgres','supabase_admin') OR auth.role()='service_role' THEN RETURN NEW; END IF;
  IF TG_OP='INSERT' THEN
    IF NEW.plan_type<>'none' OR NEW.subscription_status<>'inactive' OR NEW.admin_plan_override IS NOT NULL
      OR NEW.account_suspended OR NEW.stripe_customer_id IS NOT NULL OR NEW.stripe_subscription_id IS NOT NULL
    THEN RAISE EXCEPTION 'Plan fields are managed by billing and platform administrators' USING ERRCODE='42501'; END IF;
  ELSIF ROW(NEW.id,NEW.email,NEW.plan_type,NEW.subscription_status,NEW.stripe_customer_id,
    NEW.stripe_subscription_id,NEW.admin_plan_override,NEW.account_suspended)
    IS DISTINCT FROM ROW(OLD.id,OLD.email,OLD.plan_type,OLD.subscription_status,OLD.stripe_customer_id,
    OLD.stripe_subscription_id,OLD.admin_plan_override,OLD.account_suspended) THEN
    RAISE EXCEPTION 'Plan fields are managed by billing and platform administrators' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_profile_entitlements ON public.profiles;
CREATE TRIGGER guard_profile_entitlements BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.guard_profile_entitlements();
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  INSERT INTO public.profiles(id,email,full_name,plan_type,subscription_status)
  VALUES(NEW.id,NEW.email,coalesce(NEW.raw_user_meta_data->>'full_name',''),'none','inactive');
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION private.admin_overview() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT private.is_platform_admin() THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501'; END IF;
  RETURN jsonb_build_object(
    'users',(SELECT count(*) FROM public.profiles),
    'active_users_30d',(SELECT count(*) FROM auth.users WHERE last_sign_in_at>now()-interval '30 days'),
    'new_users_30d',(SELECT count(*) FROM public.profiles WHERE created_at>now()-interval '30 days'),
    'paid_access',(SELECT count(*) FROM public.profiles p WHERE private.account_has_access(p.id)),
    'by_plan',(SELECT jsonb_object_agg(plan,users) FROM (SELECT coalesce(admin_plan_override,plan_type) AS plan,count(*) AS users FROM public.profiles GROUP BY 1) q),
    'campaigns',(SELECT count(*) FROM public.campaigns),
    'scheduled_campaigns',(SELECT count(*) FROM public.campaigns WHERE status='scheduled'),
    'sending_campaigns',(SELECT count(*) FROM public.campaigns WHERE status='sending'),
    'contacts',(SELECT count(*) FROM public.contacts),
    'emails_this_month',(SELECT coalesce(sum(emails_sent),0) FROM public.usage_metrics
      WHERE month=extract(month FROM now()) AND year=extract(year FROM now())),
    'checked_at',now(),
    'activity',(SELECT coalesce(jsonb_agg(a ORDER BY a.created_at DESC),'[]'::jsonb)
      FROM (SELECT l.id,l.action,l.target_id,l.details,l.created_at,u.email AS actor_email
        FROM private.platform_admin_audit l LEFT JOIN auth.users u ON u.id=l.actor_id
        ORDER BY l.created_at DESC LIMIT 50) a));
END $$;

CREATE OR REPLACE FUNCTION private.admin_users(p_search text DEFAULT '',p_plan text DEFAULT 'all',p_page integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE total integer; result jsonb; page_number integer:=greatest(1,least(coalesce(p_page,1),10000));
BEGIN
  IF NOT private.is_platform_admin() THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501'; END IF;
  IF length(coalesce(p_search,''))>200 OR p_plan NOT IN ('all','none','pro','pro_plus') THEN
    RAISE EXCEPTION 'Invalid filter'; END IF;
  SELECT count(*) INTO total FROM public.profiles p WHERE
    (p.email ILIKE '%'||coalesce(p_search,'')||'%' OR p.full_name ILIKE '%'||coalesce(p_search,'')||'%')
    AND (p_plan='all' OR coalesce(p.admin_plan_override,p.plan_type)=p_plan);
  SELECT coalesce(jsonb_agg(q ORDER BY q.created_at DESC,q.id),'[]'::jsonb) INTO result FROM (
    SELECT p.id,p.email,p.full_name,p.plan_type,p.subscription_status,p.admin_plan_override,p.account_suspended,
      p.created_at,u.last_sign_in_at,u.email_confirmed_at IS NOT NULL AS email_verified,
      private.account_has_access(p.id) AS has_access,p.stripe_subscription_id IS NOT NULL AS has_billing_subscription,
      EXISTS(SELECT 1 FROM private.platform_admin_access a WHERE a.email=lower(u.email) AND a.enabled) AS is_admin,
      (SELECT count(*) FROM public.campaigns c WHERE c.user_id=p.id) AS campaigns,
      (SELECT count(*) FROM public.contacts c WHERE c.user_id=p.id) AS contacts
    FROM public.profiles p LEFT JOIN auth.users u ON u.id=p.id
    WHERE (p.email ILIKE '%'||coalesce(p_search,'')||'%' OR p.full_name ILIKE '%'||coalesce(p_search,'')||'%')
      AND (p_plan='all' OR coalesce(p.admin_plan_override,p.plan_type)=p_plan)
    ORDER BY p.created_at DESC,p.id LIMIT 25 OFFSET (page_number-1)*25) q;
  RETURN jsonb_build_object('users',result,'total',total,'page',page_number,'total_pages',greatest(1,ceil(total/25.0)::integer));
END $$;

CREATE OR REPLACE FUNCTION private.admin_set_plan(p_user_id uuid,p_plan text,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE previous jsonb;
BEGIN
  IF NOT private.is_platform_admin() THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501'; END IF;
  IF p_plan IS NULL OR p_plan NOT IN ('none','pro','pro_plus','billing') OR length(trim(coalesce(p_reason,'')))<3
    OR length(p_reason)>500 THEN RAISE EXCEPTION 'Choose a plan and provide a reason (3–500 characters)'; END IF;
  SELECT jsonb_build_object('override',admin_plan_override,'billing_plan',plan_type) INTO previous
    FROM public.profiles WHERE id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
  UPDATE public.profiles SET admin_plan_override=CASE WHEN p_plan='billing' THEN NULL ELSE p_plan END,
    updated_at=now() WHERE id=p_user_id;
  INSERT INTO private.platform_admin_audit(actor_id,target_id,action,details)
    VALUES(auth.uid(),p_user_id,'plan_changed',jsonb_build_object('before',previous,'plan',p_plan,'reason',trim(p_reason)));
END $$;

CREATE OR REPLACE FUNCTION private.admin_set_suspended(p_user_id uuid,p_suspended boolean,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT private.is_platform_admin() THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501'; END IF;
  IF p_user_id=auth.uid() THEN RAISE EXCEPTION 'You cannot suspend your own account'; END IF;
  IF p_suspended IS NULL OR length(trim(coalesce(p_reason,'')))<3 OR length(p_reason)>500 THEN RAISE EXCEPTION 'Provide a reason (3–500 characters)'; END IF;
  UPDATE public.profiles SET account_suspended=p_suspended,updated_at=now() WHERE id=p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
  IF p_suspended THEN DELETE FROM auth.sessions WHERE user_id=p_user_id; END IF;
  INSERT INTO private.platform_admin_audit(actor_id,target_id,action,details)
    VALUES(auth.uid(),p_user_id,CASE WHEN p_suspended THEN 'account_suspended' ELSE 'account_restored' END,jsonb_build_object('reason',trim(p_reason)));
END $$;

-- Public API wrappers run as the caller. Privileged implementations are kept
-- outside the exposed schema and independently check the live administrator.
CREATE OR REPLACE FUNCTION public.is_platform_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT private.is_platform_admin(); $$;
CREATE OR REPLACE FUNCTION public.has_platform_access(p_user_id uuid DEFAULT auth.uid()) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT private.account_has_access(p_user_id); $$;
CREATE OR REPLACE FUNCTION public.admin_overview() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT private.admin_overview(); $$;
CREATE OR REPLACE FUNCTION public.admin_users(p_search text DEFAULT '',p_plan text DEFAULT 'all',p_page integer DEFAULT 1) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT private.admin_users(p_search,p_plan,p_page); $$;
CREATE OR REPLACE FUNCTION public.admin_set_plan(p_user_id uuid,p_plan text,p_reason text) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.admin_set_plan(p_user_id,p_plan,p_reason); $$;
CREATE OR REPLACE FUNCTION public.admin_set_suspended(p_user_id uuid,p_suspended boolean,p_reason text) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.admin_set_suspended(p_user_id,p_suspended,p_reason); $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.has_live_session(), private.is_platform_admin(), private.account_has_access(uuid),
  private.admin_overview(), private.admin_users(text,text,integer), private.admin_set_plan(uuid,text,text),
  private.admin_set_suspended(uuid,boolean,text) TO authenticated,service_role;
DO $$ DECLARE f record; BEGIN
  FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('is_platform_admin','has_platform_access','admin_overview','admin_users','admin_set_plan','admin_set_suspended')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',f.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated,service_role',f.signature);
  END LOOP;
END $$;

-- Restrictive policies combine with the existing ownership policies (AND).
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['contacts','campaigns','contact_groups','contact_group_members','tags','contact_tags',
    'segments','segment_contacts','templates','automations','landing_pages','media_library','sending_domains','api_keys']
  LOOP
    IF to_regclass('public.'||t) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS paid_platform_access ON public.%I',t);
      EXECUTE format('CREATE POLICY paid_platform_access ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT private.account_has_access(auth.uid()))) WITH CHECK ((SELECT private.account_has_access(auth.uid())))',t);
    END IF;
  END LOOP;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
