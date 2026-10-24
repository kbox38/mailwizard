BEGIN;
-- Atomic reservations count provider attempts conservatively, including uncertain
-- network outcomes. Concurrent campaigns cannot overspend the monthly allowance.
CREATE OR REPLACE FUNCTION private.reserve_email_quota(p_user_id uuid,p_count integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE used bigint; row_id uuid; effective_plan text; m integer:=extract(month FROM now()); y integer:=extract(year FROM now());
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Server access required' USING ERRCODE='42501'; END IF;
  IF p_count IS NULL OR p_count<1 OR p_count>1000 THEN RAISE EXCEPTION 'Invalid recipient count'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text||':'||y||':'||m,0));
  IF NOT private.account_has_access(p_user_id) THEN RETURN false; END IF;
  SELECT coalesce(admin_plan_override,plan_type) INTO effective_plan FROM public.profiles WHERE id=p_user_id;
  SELECT coalesce(sum(emails_sent),0) INTO used FROM public.usage_metrics WHERE user_id=p_user_id AND month=m AND year=y;
  IF effective_plan='pro' AND used+p_count>25000 THEN RETURN false; END IF;
  SELECT id INTO row_id FROM public.usage_metrics WHERE user_id=p_user_id AND month=m AND year=y ORDER BY id LIMIT 1;
  IF row_id IS NULL THEN
    INSERT INTO public.usage_metrics(user_id,month,year,emails_sent,storage_used) VALUES(p_user_id,m,y,p_count,0);
  ELSE UPDATE public.usage_metrics SET emails_sent=coalesce(emails_sent,0)+p_count WHERE id=row_id; END IF;
  RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.reserve_email_quota(p_user_id uuid,p_count integer)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.reserve_email_quota(p_user_id,p_count); $$;
REVOKE ALL ON FUNCTION private.reserve_email_quota(uuid,integer),public.reserve_email_quota(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION private.reserve_email_quota(uuid,integer),public.reserve_email_quota(uuid,integer) TO service_role;
CREATE UNIQUE INDEX IF NOT EXISTS invoices_stripe_invoice_unique ON public.invoices(stripe_invoice_id);
NOTIFY pgrst,'reload schema';
COMMIT;
