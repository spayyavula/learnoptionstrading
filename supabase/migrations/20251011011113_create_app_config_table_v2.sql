/*
  # Create Application Configuration Table (v2)

  1. New Tables
    - `app_config`
      - `id` (uuid, primary key)
      - `key` (text, unique) - Configuration key name
      - `value` (text, nullable) - Configuration value (can be null until set)
      - `description` (text) - Human-readable description
      - `category` (text) - Category grouping
      - `priority` (text) - Priority level
      - `is_required` (boolean) - Whether required for app functionality
      - `is_active` (boolean) - Whether currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid, foreign key to auth.users)

    - `config_audit_log`
      - `id` (uuid, primary key)
      - `config_id` (uuid, foreign key to app_config)
      - `action` (text) - Action performed
      - `old_value` (text) - Previous value
      - `new_value` (text) - New value
      - `changed_by` (uuid, foreign key to auth.users)
      - `changed_at` (timestamptz)
      - `ip_address` (text)
      - `user_agent` (text)

  2. Security
    - Enable RLS on both tables
    - Only authenticated admin users can read/write config
    - All actions are logged in audit table
    - Sensitive values encrypted at application level

  3. Features
    - Automatic audit logging
    - Timestamp tracking
    - Category-based organization
    - Priority-based filtering
*/

-- Create app_config table
CREATE TABLE IF NOT EXISTS app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  description text,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  is_required boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create config audit log table
CREATE TABLE IF NOT EXISTS config_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid REFERENCES app_config(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'accessed')),
  old_value text,
  new_value text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key);
CREATE INDEX IF NOT EXISTS idx_app_config_category ON app_config(category);
CREATE INDEX IF NOT EXISTS idx_app_config_priority ON app_config(priority);
CREATE INDEX IF NOT EXISTS idx_app_config_is_active ON app_config(is_active);
CREATE INDEX IF NOT EXISTS idx_config_audit_config_id ON config_audit_log(config_id);
CREATE INDEX IF NOT EXISTS idx_config_audit_changed_at ON config_audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_config_audit_action ON config_audit_log(action);

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_audit_log ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for app_config
CREATE POLICY "Admins can view all config"
  ON app_config FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert config"
  ON app_config FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update config"
  ON app_config FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete config"
  ON app_config FOR DELETE TO authenticated
  USING (is_admin());

-- RLS Policies for config_audit_log
CREATE POLICY "Admins can view audit logs"
  ON config_audit_log FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "System can insert audit logs"
  ON config_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger to log config changes
CREATE OR REPLACE FUNCTION log_config_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO config_audit_log (config_id, action, new_value, changed_by)
    VALUES (NEW.id, 'created', NEW.value, auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO config_audit_log (config_id, action, old_value, new_value, changed_by)
    VALUES (NEW.id, 'updated', OLD.value, NEW.value, auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO config_audit_log (config_id, action, old_value, changed_by)
    VALUES (OLD.id, 'deleted', OLD.value, auth.uid());
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER app_config_audit
  AFTER INSERT OR UPDATE OR DELETE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION log_config_change();

-- Insert default configuration structure
INSERT INTO app_config (key, description, category, priority, is_required) VALUES
  ('VITE_SUPABASE_URL', 'Supabase project URL', 'database', 'critical', true),
  ('VITE_SUPABASE_ANON_KEY', 'Supabase anonymous key for client access', 'database', 'critical', true),
  ('VITE_POLYGON_API_KEY', 'Polygon.io API key for market data', 'market_data', 'critical', true),
  ('VITE_NEWS_API_KEY', 'News API key for financial news articles', 'sentiment', 'high', false),
  ('VITE_HUGGINGFACE_API_KEY', 'HuggingFace token for FinBERT AI sentiment analysis', 'sentiment', 'high', false),
  ('VITE_ALPHA_VANTAGE_API_KEY', 'Alpha Vantage API key for sentiment indicators', 'sentiment', 'high', false),
  ('VITE_FINNHUB_API_KEY', 'Finnhub API key for alternative news source', 'market_data', 'medium', false),
  ('VITE_FINANCIAL_MODELING_PREP_API_KEY', 'FMP API key for analyst recommendations', 'market_data', 'medium', false),
  ('VITE_STRIPE_PUBLISHABLE_KEY', 'Stripe publishable key for payments', 'payments', 'medium', false),
  ('VITE_STRIPE_MONTHLY_PAYMENT_LINK', 'Stripe monthly subscription payment link', 'payments', 'low', false),
  ('VITE_STRIPE_YEARLY_PAYMENT_LINK', 'Stripe yearly subscription payment link', 'payments', 'low', false),
  ('VITE_STRIPE_PRO_PAYMENT_LINK', 'Stripe pro subscription payment link', 'payments', 'low', false),
  ('VITE_STRIPE_ENTERPRISE_PAYMENT_LINK', 'Stripe enterprise payment link', 'payments', 'low', false),
  ('VITE_ZERODHA_API_KEY', 'Zerodha Kite Connect API key', 'trading', 'low', false),
  ('VITE_ZERODHA_API_SECRET', 'Zerodha Kite Connect API secret', 'trading', 'low', false),
  ('VITE_ZERODHA_ACCESS_TOKEN', 'Zerodha Kite Connect access token', 'trading', 'low', false),
  ('VITE_SLACK_WEBHOOK_URL', 'Slack webhook URL for trading alerts', 'community', 'low', false),
  ('VITE_DISCORD_WEBHOOK_URL', 'Discord webhook URL for community sharing', 'community', 'low', false),
  ('VITE_TELEGRAM_BOT_TOKEN', 'Telegram bot token for alerts', 'community', 'low', false),
  ('VITE_TELEGRAM_CHAT_ID', 'Telegram chat ID', 'community', 'low', false),
  ('VITE_TELEGRAM_CHANNEL', 'Telegram channel name', 'community', 'low', false),
  ('VITE_WHATSAPP_GROUP_INVITE', 'WhatsApp group invite link', 'community', 'low', false),
  ('VITE_FACEBOOK_GROUP_ID', 'Facebook group ID', 'community', 'low', false),
  ('VITE_CONSTANT_CONTACT_API_KEY', 'Constant Contact API key', 'marketing', 'low', false),
  ('VITE_CONSTANT_CONTACT_ACCESS_TOKEN', 'Constant Contact access token', 'marketing', 'low', false),
  ('VITE_CONSTANT_CONTACT_LIST_ID', 'Constant Contact list ID', 'marketing', 'low', false),
  ('VITE_ENABLE_REAL_TIME_DATA', 'Enable real-time data fetching', 'feature_flags', 'high', true),
  ('VITE_ENABLE_MOCK_DATA', 'Enable mock data fallback', 'feature_flags', 'high', true),
  ('VITE_ENABLE_DATA_PERSISTENCE', 'Enable database persistence', 'feature_flags', 'high', true),
  ('VITE_HISTORICAL_DATA_RETENTION_DAYS', 'Historical data retention period in days', 'feature_flags', 'medium', false),
  ('VITE_OPTIONS_UPDATE_INTERVAL', 'Options data update interval in milliseconds', 'feature_flags', 'medium', false),
  ('VITE_MAX_HISTORICAL_DAYS', 'Maximum historical days to load', 'feature_flags', 'medium', false),
  ('VITE_AUTO_START_SENTIMENT_SYNC', 'Auto-start sentiment sync on app load', 'feature_flags', 'low', false),
  ('VITE_SENTIMENT_SYNC_INTERVAL_MINUTES', 'Sentiment sync interval in minutes', 'feature_flags', 'low', false),
  ('VITE_POLYGON_BASE_URL', 'Polygon.io base URL', 'market_data', 'low', false),
  ('VITE_DEFAULT_MARKET', 'Default market selection (US or IN)', 'general', 'low', false)
ON CONFLICT (key) DO NOTHING;

-- Create view for config summary
CREATE OR REPLACE VIEW config_summary AS
SELECT 
  id,
  key,
  description,
  category,
  priority,
  is_required,
  is_active,
  CASE 
    WHEN value IS NOT NULL AND value != '' THEN true
    ELSE false
  END as is_configured,
  created_at,
  updated_at
FROM app_config;

GRANT SELECT ON config_summary TO authenticated;

-- Function to get config value by key
CREATE OR REPLACE FUNCTION get_config_value(config_key text)
RETURNS text AS $$
DECLARE
  config_value text;
  config_record_id uuid;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT id, value INTO config_record_id, config_value
  FROM app_config
  WHERE key = config_key AND is_active = true;

  IF config_record_id IS NULL THEN
    RAISE EXCEPTION 'Configuration key not found: %', config_key;
  END IF;

  INSERT INTO config_audit_log (config_id, action, changed_by)
  VALUES (config_record_id, 'accessed', auth.uid());

  RETURN config_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set config value
CREATE OR REPLACE FUNCTION set_config_value(config_key text, config_value text)
RETURNS void AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  UPDATE app_config
  SET value = config_value,
      updated_at = now()
  WHERE key = config_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuration key not found: %', config_key;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all configs by category
CREATE OR REPLACE FUNCTION get_configs_by_category(config_category text)
RETURNS TABLE (
  key text,
  value text,
  description text,
  priority text,
  is_required boolean,
  is_configured boolean
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    ac.key,
    ac.value,
    ac.description,
    ac.priority,
    ac.is_required,
    CASE WHEN ac.value IS NOT NULL AND ac.value != '' THEN true ELSE false END as is_configured
  FROM app_config ac
  WHERE ac.category = config_category AND ac.is_active = true
  ORDER BY 
    CASE ac.priority
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE app_config IS 'Centralized application configuration storage with audit trail';
COMMENT ON TABLE config_audit_log IS 'Complete audit log of all configuration changes and access';
COMMENT ON FUNCTION get_config_value IS 'Retrieve configuration value securely (admin only, logged)';
COMMENT ON FUNCTION set_config_value IS 'Update configuration value securely (admin only, logged)';
COMMENT ON FUNCTION get_configs_by_category IS 'Get all configurations for a specific category (admin only)';
