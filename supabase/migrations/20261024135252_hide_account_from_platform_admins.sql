BEGIN;
-- This registry is controlled by database owners/server operations, not by
-- MailWizard administrators. UUID binding survives account email changes.
CREATE TABLE IF NOT EXISTS private.admin_hidden_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.admin_hidden_accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.admin_hidden_accounts FROM PUBLIC,anon,authenticated;
GRANT ALL ON private.admin_hidden_accounts TO service_role;
INSERT INTO private.admin_hidden_accounts(user_id,email)
SELECT id,lower(email) FROM auth.users WHERE id='d35ecafa-19bc-412f-b437-bcc782b6f20f'
ON CONFLICT(user_id) DO NOTHING;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM private.admin_hidden_accounts WHERE user_id='d35ecafa-19bc-412f-b437-bcc782b6f20f')
    THEN RAISE EXCEPTION 'The account to protect was not found'; END IF;
END $$;

CREATE OR REPLACE FUNCTION private.admin_account_visible(p_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT NOT EXISTS(SELECT 1 FROM private.admin_hidden_accounts WHERE user_id=p_user_id);
$$;
REVOKE ALL ON FUNCTION private.admin_account_visible(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION private.admin_account_visible(uuid) TO service_role;

CREATE OR REPLACE FUNCTION private.admin_can_manage_user(p_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT private.is_platform_admin() AND private.admin_account_visible(p_user_id)
    AND EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user_id);
$$;
CREATE OR REPLACE FUNCTION public.admin_can_manage_user(p_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
  SELECT private.admin_can_manage_user(p_user_id);
$$;
REVOKE ALL ON FUNCTION private.admin_can_manage_user(uuid),public.admin_can_manage_user(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.admin_can_manage_user(uuid),public.admin_can_manage_user(uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION private.account_has_access(p_user_id uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF auth.role()='anon' OR (auth.role()='authenticated' AND
    ((p_user_id IS DISTINCT FROM auth.uid() AND
      (NOT private.is_platform_admin() OR NOT private.admin_account_visible(p_user_id)))
      OR NOT private.has_live_session())) THEN RETURN false; END IF;
  RETURN EXISTS(SELECT 1 FROM public.profiles p JOIN auth.users u ON u.id=p.id
    WHERE p.id=p_user_id AND NOT p.account_suspended AND u.email_confirmed_at IS NOT NULL
      AND (u.banned_until IS NULL OR u.banned_until<now()) AND
      (p.admin_plan_override IN ('pro','pro_plus') OR
        (p.admin_plan_override IS NULL AND p.plan_type IN ('pro','pro_plus')
          AND p.subscription_status IN ('active','trialing'))));
END $$;

CREATE OR REPLACE FUNCTION private.admin_overview() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT private.is_platform_admin() THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501'; END IF;
  RETURN jsonb_build_object(
    'users',(SELECT count(*) FROM public.profiles WHERE private.admin_account_visible(id)),
    'active_users_30d',(SELECT count(*) FROM auth.users WHERE last_sign_in_at>now()-interval '30 days' AND private.admin_account_visible(id)),
    'new_users_30d',(SELECT count(*) FROM public.profiles WHERE created_at>now()-interval '30 days' AND private.admin_account_visible(id)),
    'paid_access',(SELECT count(*) FROM public.profiles p WHERE private.admin_account_visible(p.id) AND private.account_has_access(p.id)),
    'by_plan',(SELECT jsonb_object_agg(plan,users) FROM (SELECT coalesce(admin_plan_override,plan_type) AS plan,count(*) AS users
      FROM public.profiles WHERE private.admin_account_visible(id) GROUP BY 1) q),
    'campaigns',(SELECT count(*) FROM public.campaigns WHERE private.admin_account_visible(user_id)),
    'scheduled_campaigns',(SELECT count(*) FROM public.campaigns WHERE status='scheduled' AND private.admin_account_visible(user_id)),
    'sending_campaigns',(SELECT count(*) FROM public.campaigns WHERE status='sending' AND private.admin_account_visible(user_id)),
    'contacts',(SELECT count(*) FROM public.contacts WHERE private.admin_account_visible(user_id)),
    'emails_this_month',(SELECT coalesce(sum(emails_sent),0) FROM public.usage_metrics
      WHERE month=extract(month FROM now()) AND year=extract(year FROM now()) AND private.admin_account_visible(user_id)),
    'checked_at',now(),
    'activity',(SELECT coalesce(jsonb_agg(a ORDER BY a.created_at DESC),'[]'::jsonb)
      FROM (SELECT l.id,l.action,l.target_id,l.details,l.created_at,u.email AS actor_email
        FROM private.platform_admin_audit l LEFT JOIN auth.users u ON u.id=l.actor_id
        WHERE private.admin_account_visible(l.actor_id) AND private.admin_account_visible(l.target_id)
          AND NOT EXISTS(SELECT 1 FROM private.admin_hidden_accounts h
            WHERE strpos(lower(l.details::text),h.email)>0 OR strpos(l.details::text,h.user_id::text)>0)
        ORDER BY l.created_at DESC LIMIT 50) a));
END $$;

CREATE OR REPLACE FUNCTION private.admin_users(p_search text DEFAULT '',p_plan text DEFAULT 'all',p_page integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE total integer; result jsonb; page_number integer:=greatest(1,least(coalesce(p_page,1),10000));
BEGIN
  IF NOT private.is_platform_admin() THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501'; END IF;
  IF length(coalesce(p_search,''))>200 OR p_plan NOT IN ('all','none','pro','pro_plus') THEN RAISE EXCEPTION 'Invalid filter'; END IF;
  SELECT count(*) INTO total FROM public.profiles p WHERE private.admin_account_visible(p.id)
    AND (p.email ILIKE '%'||coalesce(p_search,'')||'%' OR p.full_name ILIKE '%'||coalesce(p_search,'')||'%')
    AND (p_plan='all' OR coalesce(p.admin_plan_override,p.plan_type)=p_plan);
  SELECT coalesce(jsonb_agg(q ORDER BY q.created_at DESC,q.id),'[]'::jsonb) INTO result FROM (
    SELECT p.id,p.email,p.full_name,p.plan_type,p.subscription_status,p.admin_plan_override,p.account_suspended,
      p.created_at,u.last_sign_in_at,u.email_confirmed_at IS NOT NULL AS email_verified,
      private.account_has_access(p.id) AS has_access,p.stripe_subscription_id IS NOT NULL AS has_billing_subscription,
      EXISTS(SELECT 1 FROM private.platform_admin_access a WHERE a.email=lower(u.email) AND a.enabled) AS is_admin,
      (SELECT count(*) FROM public.campaigns c WHERE c.user_id=p.id) AS campaigns,
      (SELECT count(*) FROM public.contacts c WHERE c.user_id=p.id) AS contacts
    FROM public.profiles p LEFT JOIN auth.users u ON u.id=p.id
    WHERE private.admin_account_visible(p.id)
      AND (p.email ILIKE '%'||coalesce(p_search,'')||'%' OR p.full_name ILIKE '%'||coalesce(p_search,'')||'%')
      AND (p_plan='all' OR coalesce(p.admin_plan_override,p.plan_type)=p_plan)
    ORDER BY p.created_at DESC,p.id LIMIT 25 OFFSET (page_number-1)*25) q;
  RETURN jsonb_build_object('users',result,'total',total,'page',page_number,'total_pages',greatest(1,ceil(total/25.0)::integer));
END $$;

CREATE OR REPLACE FUNCTION private.admin_set_plan(p_user_id uuid,p_plan text,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE previous jsonb;
BEGIN
  IF NOT private.is_platform_admin() THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501'; END IF;
  IF NOT private.admin_can_manage_user(p_user_id) THEN RAISE EXCEPTION 'Account not found'; END IF;
  IF p_plan IS NULL OR p_plan NOT IN ('none','pro','pro_plus','billing') OR length(trim(coalesce(p_reason,'')))<3
    OR length(p_reason)>500 THEN RAISE EXCEPTION 'Choose a plan and provide a reason (3-500 characters)'; END IF;
  SELECT jsonb_build_object('override',admin_plan_override,'billing_plan',plan_type) INTO previous
    FROM public.profiles WHERE id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
  UPDATE public.profiles SET admin_plan_override=CASE WHEN p_plan='billing' THEN NULL ELSE p_plan END,updated_at=now() WHERE id=p_user_id;
  INSERT INTO private.platform_admin_audit(actor_id,target_id,action,details)
    VALUES(auth.uid(),p_user_id,'plan_changed',jsonb_build_object('before',previous,'plan',p_plan,'reason',trim(p_reason)));
END $$;

CREATE OR REPLACE FUNCTION private.admin_set_suspended(p_user_id uuid,p_suspended boolean,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT private.is_platform_admin() THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501'; END IF;
  IF NOT private.admin_can_manage_user(p_user_id) THEN RAISE EXCEPTION 'Account not found'; END IF;
  IF p_user_id=auth.uid() THEN RAISE EXCEPTION 'You cannot suspend your own account'; END IF;
  IF p_suspended IS NULL OR length(trim(coalesce(p_reason,'')))<3 OR length(p_reason)>500 THEN RAISE EXCEPTION 'Provide a reason (3-500 characters)'; END IF;
  UPDATE public.profiles SET account_suspended=p_suspended,updated_at=now() WHERE id=p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
  IF p_suspended THEN DELETE FROM auth.sessions WHERE user_id=p_user_id; END IF;
  INSERT INTO private.platform_admin_audit(actor_id,target_id,action,details)
    VALUES(auth.uid(),p_user_id,CASE WHEN p_suspended THEN 'account_suspended' ELSE 'account_restored' END,jsonb_build_object('reason',trim(p_reason)));
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
