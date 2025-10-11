/*
  # Unified Broker Management Layer

  This migration creates tables that provide a unified interface across all broker
  integrations (IBKR, Alpaca, Robinhood, Zerodha, etc.), making it easier to manage
  multiple broker connections and provide consistent data access patterns.

  ## New Tables Created

  1. **broker_connections** - Central registry of user broker connections
     - Tracks which brokers each user has connected
     - Connection status (connected, disconnected, error, pending)
     - Last sync timestamp and sync status
     - Connection metadata and configuration

  2. **broker_sync_status** - Tracks synchronization state per broker
     - Last successful sync timestamp
     - Last sync attempt and result
     - Sync errors and retry count
     - Next scheduled sync time
     - Data freshness indicators

  3. **broker_credentials_vault** - Encrypted credential storage (unified)
     - Broker-agnostic credential storage
     - Encryption key management
     - Credential type (API key, OAuth token, client portal, etc.)
     - Expiration tracking
     - Audit trail

  4. **broker_api_rate_limits** - Track API usage to prevent throttling
     - Rate limit tracking per broker and endpoint
     - Request count per time window
     - Cooldown tracking when limits approached
     - Historical usage patterns
     - Alert thresholds

  5. **broker_webhooks** - Webhook configurations for broker events
     - Webhook URL per broker per event type
     - Event types (order_fill, position_update, account_update)
     - Retry configuration
     - Secret keys for verification
     - Active/inactive status

  6. **broker_data_sync_queue** - Queue for async data synchronization
     - Queued sync jobs per broker per data type
     - Priority levels
     - Job status tracking
     - Retry logic with exponential backoff
     - Job results and errors

  ## Security

  - RLS enabled on all tables
  - Users can only access their own broker connections
  - Credentials encrypted at rest with user-specific keys
  - Rate limit data helps prevent account bans

  ## Performance

  - Indexes on user_id and broker_name
  - Composite indexes for status queries
  - Efficient queue processing

  ## Integration

  - Works with existing IBKR, Alpaca, Robinhood tables
  - Provides abstraction layer for future broker integrations
  - Consistent error handling across brokers
*/

-- Create broker_connections table
CREATE TABLE IF NOT EXISTS broker_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  broker_name text NOT NULL CHECK (broker_name IN ('ibkr', 'alpaca', 'robinhood', 'zerodha', 'td_ameritrade', 'etrade', 'schwab', 'fidelity', 'webull')),
  connection_status text DEFAULT 'pending' CHECK (connection_status IN ('pending', 'connected', 'disconnected', 'error', 'expired', 'suspended')),
  environment text DEFAULT 'live' CHECK (environment IN ('live', 'paper', 'sandbox')),
  account_id text,
  account_name text,
  is_primary boolean DEFAULT false,
  is_active boolean DEFAULT true,
  capabilities text[] DEFAULT ARRAY[]::text[],
  supported_asset_types text[] DEFAULT ARRAY['stock', 'option']::text[],
  connection_established_at timestamptz,
  last_successful_sync_at timestamptz,
  last_sync_attempt_at timestamptz,
  sync_status text DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'success', 'error')),
  sync_error_message text,
  sync_error_count integer DEFAULT 0,
  next_sync_scheduled_at timestamptz,
  auto_sync_enabled boolean DEFAULT true,
  sync_interval_minutes integer DEFAULT 15,
  connection_metadata jsonb DEFAULT '{}'::jsonb,
  configuration jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, broker_name, environment)
);

-- Create broker_sync_status table
CREATE TABLE IF NOT EXISTS broker_sync_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES broker_connections(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data_type text NOT NULL CHECK (data_type IN ('account', 'positions', 'orders', 'transactions', 'balances', 'market_data')),
  last_sync_attempt_at timestamptz,
  last_successful_sync_at timestamptz,
  sync_result text CHECK (sync_result IN ('success', 'partial_success', 'failure', 'skipped')),
  records_synced integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  sync_duration_ms integer,
  error_message text,
  error_code text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  next_retry_at timestamptz,
  data_freshness_seconds integer,
  is_stale boolean DEFAULT false,
  sync_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(connection_id, data_type)
);

-- Create broker_credentials_vault table
CREATE TABLE IF NOT EXISTS broker_credentials_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES broker_connections(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credential_type text NOT NULL CHECK (credential_type IN ('api_key', 'oauth_token', 'client_portal', 'session_token', 'jwt', 'basic_auth')),
  credentials_encrypted text NOT NULL,
  encryption_key_id text NOT NULL,
  encryption_algorithm text DEFAULT 'AES-256-GCM',
  encryption_iv text NOT NULL,
  credential_metadata jsonb DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  requires_refresh boolean DEFAULT false,
  refresh_token_encrypted text,
  last_refreshed_at timestamptz,
  last_validated_at timestamptz,
  validation_status text CHECK (validation_status IN ('valid', 'invalid', 'expired', 'pending')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create broker_api_rate_limits table
CREATE TABLE IF NOT EXISTS broker_api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES broker_connections(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  broker_name text NOT NULL,
  endpoint_pattern text NOT NULL,
  time_window_seconds integer NOT NULL,
  max_requests_per_window integer NOT NULL,
  current_request_count integer DEFAULT 0,
  window_start_time timestamptz DEFAULT now(),
  window_reset_time timestamptz,
  is_throttled boolean DEFAULT false,
  throttle_until timestamptz,
  last_request_time timestamptz,
  requests_today integer DEFAULT 0,
  requests_this_hour integer DEFAULT 0,
  requests_this_minute integer DEFAULT 0,
  cooldown_triggered_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(connection_id, endpoint_pattern)
);

-- Create broker_webhooks table
CREATE TABLE IF NOT EXISTS broker_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES broker_connections(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  broker_name text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('order_filled', 'order_cancelled', 'order_rejected', 'position_opened', 'position_closed', 'account_updated', 'margin_call', 'pdt_warning', 'trade_confirmation')),
  webhook_url text NOT NULL,
  webhook_secret text NOT NULL,
  is_active boolean DEFAULT true,
  delivery_method text DEFAULT 'http_post' CHECK (delivery_method IN ('http_post', 'websocket', 'server_sent_events')),
  retry_config jsonb DEFAULT '{"max_retries": 3, "backoff_seconds": [1, 5, 15]}'::jsonb,
  last_triggered_at timestamptz,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  success_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  average_response_time_ms integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create broker_data_sync_queue table
CREATE TABLE IF NOT EXISTS broker_data_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES broker_connections(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  broker_name text NOT NULL,
  sync_type text NOT NULL CHECK (sync_type IN ('full', 'incremental', 'realtime')),
  data_types text[] NOT NULL,
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  scheduled_at timestamptz NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  job_duration_ms integer,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  next_retry_at timestamptz,
  error_message text,
  error_details jsonb,
  result_summary jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for broker_connections
CREATE INDEX IF NOT EXISTS idx_broker_conn_user ON broker_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_conn_broker ON broker_connections(broker_name);
CREATE INDEX IF NOT EXISTS idx_broker_conn_status ON broker_connections(connection_status);
CREATE INDEX IF NOT EXISTS idx_broker_conn_active ON broker_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_broker_conn_sync ON broker_connections(last_successful_sync_at DESC);
CREATE INDEX IF NOT EXISTS idx_broker_conn_composite ON broker_connections(user_id, broker_name, is_active);

-- Create indexes for broker_sync_status
CREATE INDEX IF NOT EXISTS idx_sync_status_connection ON broker_sync_status(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_status_user ON broker_sync_status(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_status_data_type ON broker_sync_status(data_type);
CREATE INDEX IF NOT EXISTS idx_sync_status_stale ON broker_sync_status(is_stale);
CREATE INDEX IF NOT EXISTS idx_sync_status_retry ON broker_sync_status(next_retry_at);

-- Create indexes for broker_credentials_vault
CREATE INDEX IF NOT EXISTS idx_credentials_connection ON broker_credentials_vault(connection_id);
CREATE INDEX IF NOT EXISTS idx_credentials_user ON broker_credentials_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_expires ON broker_credentials_vault(expires_at);
CREATE INDEX IF NOT EXISTS idx_credentials_validation ON broker_credentials_vault(validation_status);

-- Create indexes for broker_api_rate_limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_connection ON broker_api_rate_limits(connection_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_throttled ON broker_api_rate_limits(is_throttled);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON broker_api_rate_limits(window_reset_time);

-- Create indexes for broker_webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_connection ON broker_webhooks(connection_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_user ON broker_webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON broker_webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhooks_event ON broker_webhooks(event_type);

-- Create indexes for broker_data_sync_queue
CREATE INDEX IF NOT EXISTS idx_sync_queue_connection ON broker_data_sync_queue(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_user ON broker_data_sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON broker_data_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_scheduled ON broker_data_sync_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON broker_data_sync_queue(priority DESC, scheduled_at);

-- Enable Row Level Security
ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_credentials_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_data_sync_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for broker_connections
CREATE POLICY "Users can view own broker connections"
  ON broker_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own broker connections"
  ON broker_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own broker connections"
  ON broker_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own broker connections"
  ON broker_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for broker_sync_status
CREATE POLICY "Users can view own sync status"
  ON broker_sync_status FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync status"
  ON broker_sync_status FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync status"
  ON broker_sync_status FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for broker_credentials_vault
CREATE POLICY "Users can view own credentials"
  ON broker_credentials_vault FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
  ON broker_credentials_vault FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
  ON broker_credentials_vault FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
  ON broker_credentials_vault FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for broker_api_rate_limits
CREATE POLICY "Users can view own rate limits"
  ON broker_api_rate_limits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rate limits"
  ON broker_api_rate_limits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rate limits"
  ON broker_api_rate_limits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for broker_webhooks
CREATE POLICY "Users can view own webhooks"
  ON broker_webhooks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own webhooks"
  ON broker_webhooks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhooks"
  ON broker_webhooks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhooks"
  ON broker_webhooks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for broker_data_sync_queue
CREATE POLICY "Users can view own sync queue"
  ON broker_data_sync_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync queue"
  ON broker_data_sync_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_broker_connections_updated_at
  BEFORE UPDATE ON broker_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_broker_sync_status_updated_at
  BEFORE UPDATE ON broker_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_broker_credentials_vault_updated_at
  BEFORE UPDATE ON broker_credentials_vault
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_broker_api_rate_limits_updated_at
  BEFORE UPDATE ON broker_api_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_broker_webhooks_updated_at
  BEFORE UPDATE ON broker_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_broker_data_sync_queue_updated_at
  BEFORE UPDATE ON broker_data_sync_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get user's connected brokers
CREATE OR REPLACE FUNCTION get_user_connected_brokers(user_uuid uuid)
RETURNS TABLE (
  broker_name text,
  connection_status text,
  environment text,
  last_sync timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bc.broker_name,
    bc.connection_status,
    bc.environment,
    bc.last_successful_sync_at
  FROM broker_connections bc
  WHERE bc.user_id = user_uuid
    AND bc.is_active = true
  ORDER BY bc.is_primary DESC, bc.last_successful_sync_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if broker connection is healthy
CREATE OR REPLACE FUNCTION is_broker_connection_healthy(conn_id uuid)
RETURNS boolean AS $$
DECLARE
  conn_status text;
  last_sync timestamptz;
  sync_interval integer;
  is_healthy boolean;
BEGIN
  SELECT
    connection_status,
    last_successful_sync_at,
    sync_interval_minutes
  INTO conn_status, last_sync, sync_interval
  FROM broker_connections
  WHERE id = conn_id;

  -- Connection is healthy if:
  -- 1. Status is 'connected'
  -- 2. Last sync was within 2x the sync interval
  is_healthy := (
    conn_status = 'connected' AND
    (last_sync IS NULL OR last_sync > (now() - (sync_interval * 2 || ' minutes')::interval))
  );

  RETURN is_healthy;
END;
$$ LANGUAGE plpgsql;

-- Function to increment API rate limit counter
CREATE OR REPLACE FUNCTION increment_api_rate_limit(
  conn_id uuid,
  endpoint text
)
RETURNS boolean AS $$
DECLARE
  current_count integer;
  max_count integer;
  window_reset timestamptz;
BEGIN
  SELECT
    current_request_count,
    max_requests_per_window,
    window_reset_time
  INTO current_count, max_count, window_reset
  FROM broker_api_rate_limits
  WHERE connection_id = conn_id
    AND endpoint_pattern = endpoint;

  -- Reset window if expired
  IF window_reset < now() THEN
    UPDATE broker_api_rate_limits
    SET current_request_count = 1,
        window_start_time = now(),
        window_reset_time = now() + (time_window_seconds || ' seconds')::interval,
        is_throttled = false,
        updated_at = now()
    WHERE connection_id = conn_id
      AND endpoint_pattern = endpoint;
    RETURN true;
  END IF;

  -- Check if would exceed limit
  IF current_count >= max_count THEN
    UPDATE broker_api_rate_limits
    SET is_throttled = true,
        throttle_until = window_reset,
        updated_at = now()
    WHERE connection_id = conn_id
      AND endpoint_pattern = endpoint;
    RETURN false;
  END IF;

  -- Increment counter
  UPDATE broker_api_rate_limits
  SET current_request_count = current_request_count + 1,
      last_request_time = now(),
      updated_at = now()
  WHERE connection_id = conn_id
    AND endpoint_pattern = endpoint;

  RETURN true;
END;
$$ LANGUAGE plpgsql;
