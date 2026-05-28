/*
  Migration: Add cron job to process scheduled campaigns every minute.

  SETUP REQUIRED (one-time, in Supabase dashboard):
  1. Enable pg_cron:  Project Settings → Database → Extensions → pg_cron  ✓
  2. Enable pg_net:   Project Settings → Database → Extensions → pg_net   ✓
  3. Add two Postgres settings so the cron SQL below can find your project:

     In Supabase SQL editor run:
       ALTER DATABASE postgres
         SET app.settings.project_url  = 'https://<your-project-ref>.supabase.co';
       ALTER DATABASE postgres
         SET app.settings.service_role_key = '<your-service-role-key>';

  The service_role_key is on: Project Settings → API → service_role (secret).
*/

-- Enable required extensions (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing job if it exists so we can recreate it cleanly
SELECT cron.unschedule('process-scheduled-campaigns')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-campaigns'
);

-- Schedule the edge function every minute
SELECT cron.schedule(
  'process-scheduled-campaigns',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url  := current_setting('app.settings.project_url') || '/functions/v1/process-scheduled-campaigns',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
