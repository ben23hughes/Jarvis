-- =============================================
-- Supabase pg_cron + pg_net: call Vercel API endpoints
--
-- Run this AFTER deploying to Vercel.
-- Replace the URL with your actual Vercel deployment URL.
-- Set your CRON_SECRET env var in Vercel, then run:
--   ALTER DATABASE postgres SET app.cron_secret = 'your-secret-here';
-- before running this migration.
-- =============================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any old jobs first (safe to re-run)
SELECT cron.unschedule('jarvis-reminders')    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'jarvis-reminders');
SELECT cron.unschedule('jarvis-meeting-prep') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'jarvis-meeting-prep');
SELECT cron.unschedule('jarvis-daily-briefing') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'jarvis-daily-briefing');

-- Reminders + user schedules: every minute
SELECT cron.schedule(
  'jarvis-reminders',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://jarvis-one-woad.vercel.app/api/cron/reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
    )
  )
  $$
);

-- Meeting prep: every 5 minutes
SELECT cron.schedule(
  'jarvis-meeting-prep',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://jarvis-one-woad.vercel.app/api/cron/meeting-prep',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
    )
  )
  $$
);

-- Daily briefing: 7am UTC (= 12am MST / 1am MDT)
-- Adjust the hour to match your preferred send time in UTC.
-- MST is UTC-7, so 14:00 UTC = 7am MST.
SELECT cron.schedule(
  'jarvis-daily-briefing',
  '0 14 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://jarvis-one-woad.vercel.app/api/cron/daily-briefing',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
    )
  )
  $$
);
