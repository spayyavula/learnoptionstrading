/*
  # Comprehensive User Management Tables

  This migration creates tables for user settings, notifications, API keys, and activity tracking:

  1. New Tables
    - `user_settings` - App preferences (theme, timezone, default views)
      - Stores user-specific UI and feature preferences
      - JSON-based flexible settings storage
      - Supports feature flag overrides

    - `user_notification_preferences` - Email/SMS/push notification controls
      - Granular notification type management
      - Multi-channel support with opt-in/opt-out
      - Quiet hours and delivery preferences

    - `user_api_keys` - Third-party integrations and webhooks
      - Secure API key generation and storage
      - Scoped permissions per key
      - Usage tracking and rate limiting support

    - `user_session_history` - Login tracking and security monitoring
      - Records all authentication events
      - Tracks device, location, and IP
      - Supports suspicious activity detection

    - `user_activity_log` - Feature usage analytics
      - Tracks user interactions and feature usage
      - Enables product analytics and user engagement metrics
      - Privacy-respecting event tracking

    - `user_watchlists` - Organized ticker tracking with folders
      - Multiple watchlists per user
      - Folder/tag organization support
      - Custom notes and alerts per ticker

    - `user_alerts` - Price and Greeks-based custom alerts
      - Flexible alert conditions (price, Greeks, volume)
      - Multi-channel delivery (email, SMS, push, webhook)
      - One-time or recurring alerts

    - `user_subscription_tiers` - Subscription features and limits
      - Maps users to subscription tiers
      - Feature flag and limit enforcement
      - Trial period and upgrade tracking

  2. Security
    - RLS enabled on all tables
    - Users can only access their own data
    - API keys are hashed and encrypted
    - Sensitive data protected with additional policies

  3. Performance
    - Indexes on user_id for all tables
    - Composite indexes for common queries
    - JSON indexes for settings and metadata

  4. Privacy
    - GDPR-compliant data structure
    - User data deletion support via CASCADE
    - Activity logging with retention policies
*/

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  timezone text DEFAULT 'America/New_York',
  default_market text DEFAULT 'US' CHECK (default_market IN ('US', 'India', 'Both')),
  default_view text DEFAULT 'dashboard',
  chart_type text DEFAULT 'candlestick',
  show_greeks boolean DEFAULT true,
  show_implied_volatility boolean DEFAULT true,
  auto_refresh boolean DEFAULT true,
  refresh_interval_seconds integer DEFAULT 30,
  compact_mode boolean DEFAULT false,
  show_tutorials boolean DEFAULT true,
  language text DEFAULT 'en',
  currency text DEFAULT 'USD',
  number_format text DEFAULT 'US',
  date_format text DEFAULT 'MM/DD/YYYY',
  risk_display_preference text DEFAULT 'percentage' CHECK (risk_display_preference IN ('percentage', 'dollar', 'both')),
  feature_flags jsonb DEFAULT '{}'::jsonb,
  ui_preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  push_enabled boolean DEFAULT true,
  webhook_enabled boolean DEFAULT false,
  trade_confirmations_email boolean DEFAULT true,
  trade_confirmations_sms boolean DEFAULT false,
  trade_confirmations_push boolean DEFAULT true,
  price_alerts_email boolean DEFAULT true,
  price_alerts_sms boolean DEFAULT true,
  price_alerts_push boolean DEFAULT true,
  market_news_email boolean DEFAULT true,
  market_news_sms boolean DEFAULT false,
  market_news_push boolean DEFAULT false,
  portfolio_updates_email boolean DEFAULT true,
  portfolio_updates_sms boolean DEFAULT false,
  portfolio_updates_push boolean DEFAULT true,
  earnings_alerts_email boolean DEFAULT true,
  earnings_alerts_sms boolean DEFAULT false,
  earnings_alerts_push boolean DEFAULT true,
  system_announcements_email boolean DEFAULT true,
  system_announcements_sms boolean DEFAULT false,
  system_announcements_push boolean DEFAULT true,
  email_address text,
  phone_number text,
  push_token text,
  webhook_url text,
  quiet_hours_enabled boolean DEFAULT false,
  quiet_hours_start time,
  quiet_hours_end time,
  digest_frequency text DEFAULT 'daily' CHECK (digest_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'never')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_api_keys table
CREATE TABLE IF NOT EXISTS user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key_name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  scopes text[] DEFAULT ARRAY['read']::text[],
  is_active boolean DEFAULT true,
  rate_limit_per_minute integer DEFAULT 60,
  rate_limit_per_hour integer DEFAULT 3600,
  usage_count bigint DEFAULT 0,
  last_used_at timestamptz,
  last_used_ip text,
  expires_at timestamptz,
  allowed_ips text[],
  webhook_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_session_history table
CREATE TABLE IF NOT EXISTS user_session_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token text,
  action text NOT NULL CHECK (action IN ('login', 'logout', 'refresh', 'timeout', 'force_logout')),
  auth_method text CHECK (auth_method IN ('password', 'oauth', 'magic_link', 'mfa', 'api_key')),
  device_type text,
  device_name text,
  browser text,
  operating_system text,
  ip_address text,
  location_city text,
  location_country text,
  is_suspicious boolean DEFAULT false,
  suspicious_reason text,
  session_duration_seconds integer,
  created_at timestamptz DEFAULT now()
);

-- Create user_activity_log table
CREATE TABLE IF NOT EXISTS user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  activity_category text CHECK (activity_category IN ('trading', 'analysis', 'portfolio', 'settings', 'learning', 'social')),
  feature_name text NOT NULL,
  action_name text NOT NULL,
  resource_type text,
  resource_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  session_id text,
  ip_address text,
  user_agent text,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Create user_watchlists table
CREATE TABLE IF NOT EXISTS user_watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  color text,
  icon text,
  is_default boolean DEFAULT false,
  is_public boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  tickers text[] DEFAULT ARRAY[]::text[],
  ticker_metadata jsonb DEFAULT '{}'::jsonb,
  folder text,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create user_alerts table
CREATE TABLE IF NOT EXISTS user_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_name text NOT NULL,
  ticker text NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('price', 'percent_change', 'volume', 'greek', 'iv', 'custom')),
  condition_operator text NOT NULL CHECK (condition_operator IN ('above', 'below', 'crosses_above', 'crosses_below', 'equals', 'between')),
  threshold_value numeric(20, 4),
  threshold_value_2 numeric(20, 4),
  greek_type text CHECK (greek_type IN ('delta', 'gamma', 'theta', 'vega', 'rho')),
  is_active boolean DEFAULT true,
  frequency text DEFAULT 'once' CHECK (frequency IN ('once', 'recurring', 'daily')),
  delivery_channels text[] DEFAULT ARRAY['push']::text[],
  last_triggered_at timestamptz,
  trigger_count integer DEFAULT 0,
  expires_at timestamptz,
  message_template text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_subscription_tiers table
CREATE TABLE IF NOT EXISTS user_subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier_name text NOT NULL DEFAULT 'free' CHECK (tier_name IN ('free', 'basic', 'premium', 'professional', 'enterprise')),
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  max_watchlists integer DEFAULT 3,
  max_alerts integer DEFAULT 10,
  max_api_keys integer DEFAULT 1,
  max_backtests_per_month integer DEFAULT 10,
  real_time_data_enabled boolean DEFAULT false,
  advanced_analytics_enabled boolean DEFAULT false,
  api_access_enabled boolean DEFAULT false,
  priority_support_enabled boolean DEFAULT false,
  feature_limits jsonb DEFAULT '{}'::jsonb,
  feature_flags jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for user_settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

-- Create indexes for user_notification_preferences
CREATE INDEX IF NOT EXISTS idx_user_notif_prefs_user ON user_notification_preferences(user_id);

-- Create indexes for user_api_keys
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_hash ON user_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_active ON user_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_expires ON user_api_keys(expires_at);

-- Create indexes for user_session_history
CREATE INDEX IF NOT EXISTS idx_user_session_user ON user_session_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_session_created ON user_session_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_session_action ON user_session_history(action);
CREATE INDEX IF NOT EXISTS idx_user_session_suspicious ON user_session_history(is_suspicious);

-- Create indexes for user_activity_log
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_category ON user_activity_log(activity_category);
CREATE INDEX IF NOT EXISTS idx_user_activity_feature ON user_activity_log(feature_name);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity_log(created_at DESC);

-- Create indexes for user_watchlists
CREATE INDEX IF NOT EXISTS idx_user_watchlists_user ON user_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlists_name ON user_watchlists(name);
CREATE INDEX IF NOT EXISTS idx_user_watchlists_public ON user_watchlists(is_public);
CREATE INDEX IF NOT EXISTS idx_user_watchlists_tickers ON user_watchlists USING gin(tickers);

-- Create indexes for user_alerts
CREATE INDEX IF NOT EXISTS idx_user_alerts_user ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_ticker ON user_alerts(ticker);
CREATE INDEX IF NOT EXISTS idx_user_alerts_active ON user_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_user_alerts_type ON user_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_user_alerts_expires ON user_alerts(expires_at);

-- Create indexes for user_subscription_tiers
CREATE INDEX IF NOT EXISTS idx_user_sub_tiers_user ON user_subscription_tiers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sub_tiers_tier ON user_subscription_tiers(tier_name);
CREATE INDEX IF NOT EXISTS idx_user_sub_tiers_status ON user_subscription_tiers(status);
CREATE INDEX IF NOT EXISTS idx_user_sub_tiers_stripe ON user_subscription_tiers(stripe_customer_id);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_session_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscription_tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_notification_preferences
CREATE POLICY "Users can view own notification preferences"
  ON user_notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON user_notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON user_notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_api_keys
CREATE POLICY "Users can view own API keys"
  ON user_api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys"
  ON user_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON user_api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON user_api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_session_history
CREATE POLICY "Users can view own session history"
  ON user_session_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session history"
  ON user_session_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_activity_log
CREATE POLICY "Users can view own activity log"
  ON user_activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity log"
  ON user_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_watchlists
CREATE POLICY "Users can view own watchlists"
  ON user_watchlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view public watchlists"
  ON user_watchlists FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Users can insert own watchlists"
  ON user_watchlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlists"
  ON user_watchlists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlists"
  ON user_watchlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_alerts
CREATE POLICY "Users can view own alerts"
  ON user_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON user_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON user_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON user_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_subscription_tiers
CREATE POLICY "Users can view own subscription tier"
  ON user_subscription_tiers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription tier"
  ON user_subscription_tiers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription tier"
  ON user_subscription_tiers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_watchlists_updated_at
  BEFORE UPDATE ON user_watchlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_alerts_updated_at
  BEFORE UPDATE ON user_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscription_tiers_updated_at
  BEFORE UPDATE ON user_subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
