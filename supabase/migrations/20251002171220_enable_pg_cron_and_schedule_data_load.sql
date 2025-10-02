/*
  # Enable pg_cron Extension and Schedule Historical Data Load

  ## Description
  This migration enables the pg_cron extension in Supabase and sets up a scheduled job
  to load historical options data every midnight (00:00 UTC).

  ## Changes
  1. Enable pg_cron extension for job scheduling
  2. Create a configuration table to store Supabase URL and anon key
  3. Create a function to invoke the Edge Function
  4. Schedule a cron job that runs daily at midnight

  ## Security
  - The Edge Function is public (no JWT verification required)
  - Historical market data is public information
  - The function is idempotent (safe to run multiple times)

  ## Notes
  - Job runs at 00:00 UTC daily
  - Monitor via cron.job_run_details table
  - Configuration must be set after migration
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a table to store the Supabase configuration for cron jobs
CREATE TABLE IF NOT EXISTS cron_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  supabase_url TEXT NOT NULL DEFAULT 'https://ldfuxeqhvsuduqezfbpp.supabase.co',
  supabase_anon_key TEXT NOT NULL DEFAULT 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZnV4ZXFodnN1ZHVxZXpmYnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTk1MzIsImV4cCI6MjA3NDk5NTUzMn0.1HbMLrmo7HzAxWpMRLO41cHIgxYpHAakfjrjumJOGFg',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS on cron_config table
ALTER TABLE cron_config ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow reading the config
CREATE POLICY "Allow reading cron config"
  ON cron_config
  FOR SELECT
  TO public
  USING (true);

-- Insert the configuration
INSERT INTO cron_config (id, supabase_url, supabase_anon_key)
VALUES (1, 'https://ldfuxeqhvsuduqezfbpp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZnV4ZXFodnN1ZHVxZXpmYnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTk1MzIsImV4cCI6MjA3NDk5NTUzMn0.1HbMLrmo7HzAxWpMRLO41cHIgxYpHAakfjrjumJOGFg')
ON CONFLICT (id) DO UPDATE
SET 
  supabase_url = EXCLUDED.supabase_url,
  supabase_anon_key = EXCLUDED.supabase_anon_key,
  updated_at = NOW();

-- Create a function to invoke the edge function
CREATE OR REPLACE FUNCTION invoke_load_historical_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_url TEXT;
  v_anon_key TEXT;
  v_request_id BIGINT;
BEGIN
  -- Get the Supabase URL and anon key from the config table
  SELECT supabase_url, supabase_anon_key
  INTO v_url, v_anon_key
  FROM cron_config
  WHERE id = 1;

  -- Make the HTTP request to the edge function
  SELECT INTO v_request_id net.http_post(
    url := v_url || '/functions/v1/load-historical-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon_key
    ),
    body := '{}'::jsonb
  );

  -- Log the request
  RAISE NOTICE 'Historical data load triggered. Request ID: %', v_request_id;
END;
$$;

-- Remove any existing job with the same name
DO $$
BEGIN
  PERFORM cron.unschedule('load_historical_data_midnight')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'load_historical_data_midnight'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'No existing job to unschedule';
END $$;

-- Schedule the job to run every day at midnight (00:00 UTC)
SELECT cron.schedule(
  'load_historical_data_midnight',
  '0 0 * * *',
  $$SELECT invoke_load_historical_data();$$
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO postgres;
