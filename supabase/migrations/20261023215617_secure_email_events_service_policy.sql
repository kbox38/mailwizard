-- A policy name is only a label. The deployed "Service role" policy targeted
-- PUBLIC with USING (true), granting every API caller access to all events.
-- Keep the existing campaign-ownership SELECT policy for signed-in users.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'email_events'
      AND policyname = 'Service role can manage email events'
  ) THEN
    ALTER POLICY "Service role can manage email events"
      ON public.email_events TO service_role;
  END IF;
END
$$;
