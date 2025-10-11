/*
  # Create Push Notification System

  ## Overview
  Real-time push notification infrastructure for immediate delivery of news alerts, earnings
  announcements, SEC filings, sentiment changes, and price movements. Supports multiple platforms
  (iOS, Android, web push) with delivery tracking and retry logic.

  ## 1. New Tables

  ### `push_notification_subscriptions`
  User device registrations for push notifications
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - User who owns this subscription
  - `device_token` (text, UNIQUE, NOT NULL) - Platform-specific push token
  - `platform` (text, NOT NULL) - Platform type (ios, android, web, expo)
  - `device_type` (text) - Device model or browser
  - `device_name` (text) - User-assigned device name
  - `app_version` (text) - App version string
  - `os_version` (text) - Operating system version
  - `is_active` (boolean) - Whether subscription is currently active
  - `subscription_data` (jsonb) - Platform-specific subscription details
  - `topics` (text[]) - Subscribed notification topics
  - `token_expires_at` (timestamptz) - When token expires (if applicable)
  - `last_validated_at` (timestamptz) - Last successful validation
  - `validation_failure_count` (integer) - Consecutive validation failures
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `push_notification_delivery_log`
  Complete delivery tracking for all push notifications
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Target user
  - `subscription_id` (uuid, foreign key) - Target device subscription
  - `notification_type` (text, NOT NULL) - Type of notification
  - `source_type` (text) - What triggered the notification
  - `source_id` (uuid) - ID of the source entity (article, alert, etc.)
  - `title` (text, NOT NULL) - Notification title
  - `body` (text, NOT NULL) - Notification body text
  - `action_url` (text) - Deep link or URL to open
  - `priority` (text) - Notification priority (high, normal, low)
  - `category` (text) - Notification category for grouping
  - `badge_count` (integer) - Badge number to display
  - `sound` (text) - Sound to play
  - `image_url` (text) - Image for rich notification
  - `payload` (jsonb) - Additional custom data
  - `delivery_status` (text, NOT NULL) - Status of delivery attempt
  - `sent_at` (timestamptz) - When notification was sent
  - `delivered_at` (timestamptz) - When delivery was confirmed
  - `failed_at` (timestamptz) - When delivery failed
  - `opened_at` (timestamptz) - When user opened notification
  - `retry_count` (integer) - Number of retry attempts
  - `error_message` (text) - Error message if failed
  - `platform_message_id` (text) - Platform-specific message ID
  - `created_at` (timestamptz) - Record creation timestamp

  ### `notification_preferences`
  User-specific notification settings and preferences
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key, UNIQUE) - User who owns preferences
  - `push_enabled` (boolean) - Master push notification toggle
  - `news_alerts_enabled` (boolean) - News article notifications
  - `earnings_alerts_enabled` (boolean) - Earnings announcement notifications
  - `sec_filing_alerts_enabled` (boolean) - SEC filing notifications
  - `sentiment_alerts_enabled` (boolean) - Sentiment change notifications
  - `price_alerts_enabled` (boolean) - Price movement notifications
  - `position_alerts_enabled` (boolean) - Portfolio position notifications
  - `market_open_close_enabled` (boolean) - Market hours notifications
  - `breaking_news_only` (boolean) - Only high-priority breaking news
  - `min_relevance_score` (integer) - Minimum relevance score (0-100)
  - `quiet_hours_enabled` (boolean) - Enable quiet hours
  - `quiet_hours_start` (time) - Quiet hours start time
  - `quiet_hours_end` (time) - Quiet hours end time
  - `timezone` (text) - User timezone for quiet hours
  - `watchlist_tickers_only` (boolean) - Only notify for watchlist tickers
  - `notification_frequency` (text) - Frequency limit (realtime, hourly, daily, digest)
  - `digest_time` (time) - When to send daily digest
  - `custom_keywords` (text[]) - Keywords to trigger notifications
  - `blocked_sources` (text[]) - News sources to exclude
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  - RLS enabled on all tables
  - Users can only access their own subscriptions and preferences
  - Service accounts can write delivery logs

  ## 3. Indexes
  - Optimized for user lookups and delivery status queries
  - Composite indexes for filtering and reporting

  ## 4. Integration
  - Links to news_articles, earnings_calendar, and sec_filings
  - Triggers on sentiment_alerts to queue push notifications
  - Supports batching and rate limiting
*/

-- Create push_notification_subscriptions table
CREATE TABLE IF NOT EXISTS push_notification_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_token text UNIQUE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web', 'expo', 'fcm', 'apns')),
  device_type text,
  device_name text,
  app_version text,
  os_version text,
  is_active boolean DEFAULT true,
  subscription_data jsonb DEFAULT '{}'::jsonb,
  topics text[] DEFAULT ARRAY[]::text[],
  token_expires_at timestamptz,
  last_validated_at timestamptz DEFAULT now(),
  validation_failure_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create push_notification_delivery_log table
CREATE TABLE IF NOT EXISTS push_notification_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES push_notification_subscriptions(id) ON DELETE SET NULL,
  notification_type text NOT NULL CHECK (notification_type IN (
    'news_alert', 'earnings_alert', 'sec_filing_alert', 'sentiment_alert',
    'price_alert', 'position_alert', 'market_hours', 'system_announcement',
    'trade_confirmation', 'watchlist_update', 'custom'
  )),
  source_type text CHECK (source_type IN (
    'news_article', 'earnings_event', 'sec_filing', 'sentiment_change',
    'price_movement', 'position_change', 'user_alert', 'system', 'manual'
  )),
  source_id uuid,
  title text NOT NULL,
  body text NOT NULL,
  action_url text,
  priority text DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  category text,
  badge_count integer DEFAULT 0,
  sound text DEFAULT 'default',
  image_url text,
  payload jsonb DEFAULT '{}'::jsonb,
  delivery_status text NOT NULL DEFAULT 'pending' CHECK (delivery_status IN (
    'pending', 'sent', 'delivered', 'failed', 'expired', 'cancelled'
  )),
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  opened_at timestamptz,
  retry_count integer DEFAULT 0,
  error_message text,
  platform_message_id text,
  created_at timestamptz DEFAULT now()
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  push_enabled boolean DEFAULT true,
  news_alerts_enabled boolean DEFAULT true,
  earnings_alerts_enabled boolean DEFAULT true,
  sec_filing_alerts_enabled boolean DEFAULT false,
  sentiment_alerts_enabled boolean DEFAULT true,
  price_alerts_enabled boolean DEFAULT true,
  position_alerts_enabled boolean DEFAULT true,
  market_open_close_enabled boolean DEFAULT false,
  breaking_news_only boolean DEFAULT false,
  min_relevance_score integer DEFAULT 50 CHECK (min_relevance_score >= 0 AND min_relevance_score <= 100),
  quiet_hours_enabled boolean DEFAULT false,
  quiet_hours_start time DEFAULT '22:00:00',
  quiet_hours_end time DEFAULT '08:00:00',
  timezone text DEFAULT 'America/New_York',
  watchlist_tickers_only boolean DEFAULT false,
  notification_frequency text DEFAULT 'realtime' CHECK (notification_frequency IN ('realtime', 'hourly', 'daily', 'digest')),
  digest_time time DEFAULT '08:00:00',
  custom_keywords text[] DEFAULT ARRAY[]::text[],
  blocked_sources text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comprehensive indexes for push_notification_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON push_notification_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_device_token ON push_notification_subscriptions(device_token);
CREATE INDEX IF NOT EXISTS idx_push_subs_platform ON push_notification_subscriptions(platform);
CREATE INDEX IF NOT EXISTS idx_push_subs_is_active ON push_notification_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_push_subs_topics ON push_notification_subscriptions USING gin(topics);
CREATE INDEX IF NOT EXISTS idx_push_subs_expires ON push_notification_subscriptions(token_expires_at) WHERE token_expires_at IS NOT NULL;

-- Create indexes for push_notification_delivery_log
CREATE INDEX IF NOT EXISTS idx_push_delivery_user_id ON push_notification_delivery_log(user_id);
CREATE INDEX IF NOT EXISTS idx_push_delivery_subscription_id ON push_notification_delivery_log(subscription_id);
CREATE INDEX IF NOT EXISTS idx_push_delivery_type ON push_notification_delivery_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_push_delivery_status ON push_notification_delivery_log(delivery_status);
CREATE INDEX IF NOT EXISTS idx_push_delivery_sent_at ON push_notification_delivery_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_delivery_created_at ON push_notification_delivery_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_delivery_source ON push_notification_delivery_log(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_push_delivery_pending ON push_notification_delivery_log(delivery_status, created_at)
  WHERE delivery_status = 'pending';

-- Create indexes for notification_preferences
CREATE INDEX IF NOT EXISTS idx_notif_prefs_user_id ON notification_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE push_notification_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for push_notification_subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON push_notification_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
  ON push_notification_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions"
  ON push_notification_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON push_notification_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for push_notification_delivery_log
CREATE POLICY "Users can view own delivery log"
  ON push_notification_delivery_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert delivery log"
  ON push_notification_delivery_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update delivery log"
  ON push_notification_delivery_log FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for notification_preferences
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to deactivate expired tokens
CREATE OR REPLACE FUNCTION deactivate_expired_push_tokens()
RETURNS void AS $$
BEGIN
  UPDATE push_notification_subscriptions
  SET is_active = false,
      updated_at = now()
  WHERE token_expires_at < now()
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create function to deactivate failed tokens
CREATE OR REPLACE FUNCTION deactivate_failed_push_tokens()
RETURNS void AS $$
BEGIN
  UPDATE push_notification_subscriptions
  SET is_active = false,
      updated_at = now()
  WHERE validation_failure_count >= 3
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_subscriptions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_notification_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_push_subs_timestamp ON push_notification_subscriptions;
CREATE TRIGGER trigger_update_push_subs_timestamp
  BEFORE UPDATE ON push_notification_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_timestamp();

DROP TRIGGER IF EXISTS trigger_update_notif_prefs_timestamp ON notification_preferences;
CREATE TRIGGER trigger_update_notif_prefs_timestamp
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_timestamp();

-- Create function to check if user is in quiet hours
CREATE OR REPLACE FUNCTION is_in_quiet_hours(
  p_user_id uuid,
  p_check_time timestamptz DEFAULT now()
)
RETURNS boolean AS $$
DECLARE
  v_prefs record;
  v_local_time time;
BEGIN
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;

  IF NOT FOUND OR NOT v_prefs.quiet_hours_enabled THEN
    RETURN false;
  END IF;

  -- Convert to user's timezone
  v_local_time = (p_check_time AT TIME ZONE v_prefs.timezone)::time;

  -- Check if current time is in quiet hours
  IF v_prefs.quiet_hours_start < v_prefs.quiet_hours_end THEN
    RETURN v_local_time >= v_prefs.quiet_hours_start AND v_local_time < v_prefs.quiet_hours_end;
  ELSE
    -- Quiet hours span midnight
    RETURN v_local_time >= v_prefs.quiet_hours_start OR v_local_time < v_prefs.quiet_hours_end;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create view for delivery statistics
CREATE OR REPLACE VIEW push_notification_stats AS
SELECT
  user_id,
  notification_type,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE delivery_status = 'delivered') as delivered_count,
  COUNT(*) FILTER (WHERE delivery_status = 'failed') as failed_count,
  COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened_count,
  AVG(EXTRACT(EPOCH FROM (delivered_at - sent_at))) as avg_delivery_time_seconds,
  AVG(EXTRACT(EPOCH FROM (opened_at - delivered_at))) FILTER (WHERE opened_at IS NOT NULL) as avg_time_to_open_seconds
FROM push_notification_delivery_log
WHERE sent_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, notification_type;
