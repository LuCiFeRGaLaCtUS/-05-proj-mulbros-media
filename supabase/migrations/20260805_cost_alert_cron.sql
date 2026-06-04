-- Schedule the cost-alert Edge Function to run daily at 09:00 UTC.
-- Edge function must be deployed first:
--   supabase functions deploy cost-alert --project-ref ymkikosszdherismfckl
-- Required secrets on the function:
--   RESEND_API_KEY, COST_ALERT_TO, COST_ALERT_FROM, COST_ALERT_USD_THRESHOLD

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;

-- Drop any prior schedule for idempotency
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'cost-alert-daily';

SELECT cron.schedule(
  'cost-alert-daily',
  '0 9 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://ymkikosszdherismfckl.functions.supabase.co/cost-alert',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body    := '{}'::jsonb
    );
  $$
);

COMMENT ON EXTENSION pg_cron IS 'Used for: cost-alert daily check';
