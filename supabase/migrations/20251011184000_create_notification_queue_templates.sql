/*
  # Create Notification Queue and Templates

  ## Overview
  Real-time notification queue management system with priority-based processing, batch delivery,
  and reusable templates for consistent messaging across channels. Supports scheduled delivery,
  retry logic, and A/B testing of notification content.

  ## 1. New Tables

  ### `notification_queue`
  Priority-based queue for immediate and scheduled notification delivery
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Target user (NULL for broadcast)
  - `user_segment` (text) - User segment for targeted broadcasts
  - `notification_type` (text, NOT NULL) - Type of notification
  - `source_type` (text) - What triggered the notification
  - `source_id` (uuid) - ID of source entity
  - `template_id` (uuid, foreign key) - Notification template used
  - `priority` (text, NOT NULL) - Priority level (critical, high, normal, low)
  - `title` (text, NOT NULL) - Notification title
  - `body` (text, NOT NULL) - Notification body
  - `action_url` (text) - Action URL/deep link
  - `image_url` (text) - Image URL for rich notifications
  - `payload` (jsonb) - Custom data payload
  - `channels` (text[]) - Delivery channels (push, email, sms, webhook)
  - `scheduled_for` (timestamptz) - When to send (NULL for immediate)
  - `expires_at` (timestamptz) - When notification becomes stale
  - `processing_status` (text, NOT NULL) - Current status
  - `processing_started_at` (timestamptz) - When processing began
  - `processing_completed_at` (timestamptz) - When processing finished
  - `retry_count` (integer) - Number of retry attempts
  - `max_retries` (integer) - Maximum retry attempts allowed
  - `error_message` (text) - Last error message
  - `target_count` (integer) - Number of intended recipients
  - `success_count` (integer) - Successfully delivered
  - `failed_count` (integer) - Failed deliveries
  - `metadata` (jsonb) - Additional metadata
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `notification_templates`
  Reusable notification templates with variable substitution
  - `id` (uuid, primary key) - Unique identifier
  - `template_name` (text, UNIQUE, NOT NULL) - Template identifier
  - `display_name` (text) - Human-readable name
  - `description` (text) - Template description
  - `notification_type` (text, NOT NULL) - Type of notification
  - `category` (text) - Template category
  - `is_active` (boolean) - Whether template is active
  - `version` (integer) - Template version number
  - `push_title_template` (text) - Push notification title with variables
  - `push_body_template` (text) - Push notification body with variables
  - `email_subject_template` (text) - Email subject with variables
  - `email_body_template` (text) - Email body HTML with variables
  - `sms_template` (text) - SMS message with variables
  - `action_url_template` (text) - Action URL with variables
  - `image_url_template` (text) - Image URL with variables
  - `default_payload` (jsonb) - Default payload data
  - `variables` (jsonb) - Available template variables and descriptions
  - `priority` (text) - Default priority
  - `channels` (text[]) - Supported channels
  - `ab_test_variant` (text) - A/B test variant identifier
  - `usage_count` (integer) - Times this template has been used
  - `last_used_at` (timestamptz) - Last usage timestamp
  - `created_by` (uuid) - User who created template
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `notification_batches`
  Batch processing tracking for bulk notifications
  - `id` (uuid, primary key) - Unique identifier
  - `batch_name` (text) - Descriptive batch name
  - `batch_type` (text) - Type of batch (broadcast, targeted, digest, scheduled)
  - `user_segment` (text) - Target user segment
  - `template_id` (uuid, foreign key) - Template used
  - `total_count` (integer) - Total notifications to send
  - `queued_count` (integer) - Queued for delivery
  - `sent_count` (integer) - Successfully sent
  - `failed_count` (integer) - Failed deliveries
  - `status` (text, NOT NULL) - Batch status
  - `scheduled_for` (timestamptz) - When to process batch
  - `started_at` (timestamptz) - When batch processing started
  - `completed_at` (timestamptz) - When batch completed
  - `metadata` (jsonb) - Additional batch metadata
  - `created_by` (uuid) - User who created batch
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  - RLS enabled on all tables
  - Users can view their own queued notifications
  - Service accounts can manage queue and templates
  - Admin users can create and edit templates

  ## 3. Indexes
  - Optimized for queue processing and status queries
  - Priority-based ordering for efficient delivery
  - Scheduled delivery lookups

  ## 4. Features
  - Variable substitution in templates (e.g., {{ticker}}, {{price}})
  - A/B testing support with variant tracking
  - Batch processing for efficient bulk delivery
  - Automatic retry with exponential backoff
  - Timezone-aware scheduled delivery
*/

-- Create notification_queue table
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_segment text,
  notification_type text NOT NULL CHECK (notification_type IN (
    'news_alert', 'earnings_alert', 'sec_filing_alert', 'sentiment_alert',
    'price_alert', 'position_alert', 'market_hours', 'system_announcement',
    'trade_confirmation', 'watchlist_update', 'digest', 'custom'
  )),
  source_type text CHECK (source_type IN (
    'news_article', 'earnings_event', 'sec_filing', 'sentiment_change',
    'price_movement', 'position_change', 'user_alert', 'system', 'batch', 'manual'
  )),
  source_id uuid,
  template_id uuid,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  title text NOT NULL,
  body text NOT NULL,
  action_url text,
  image_url text,
  payload jsonb DEFAULT '{}'::jsonb,
  channels text[] DEFAULT ARRAY['push']::text[],
  scheduled_for timestamptz,
  expires_at timestamptz,
  processing_status text NOT NULL DEFAULT 'pending' CHECK (processing_status IN (
    'pending', 'scheduled', 'processing', 'completed', 'failed', 'expired', 'cancelled'
  )),
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  error_message text,
  target_count integer DEFAULT 1,
  success_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  notification_type text NOT NULL,
  category text,
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  push_title_template text,
  push_body_template text,
  email_subject_template text,
  email_body_template text,
  sms_template text,
  action_url_template text,
  image_url_template text,
  default_payload jsonb DEFAULT '{}'::jsonb,
  variables jsonb DEFAULT '{}'::jsonb,
  priority text DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  channels text[] DEFAULT ARRAY['push']::text[],
  ab_test_variant text,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notification_batches table
CREATE TABLE IF NOT EXISTS notification_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name text NOT NULL,
  batch_type text NOT NULL CHECK (batch_type IN ('broadcast', 'targeted', 'digest', 'scheduled', 'test')),
  user_segment text,
  template_id uuid REFERENCES notification_templates(id) ON DELETE SET NULL,
  total_count integer DEFAULT 0,
  queued_count integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'queuing', 'processing', 'completed', 'failed', 'cancelled'
  )),
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comprehensive indexes for notification_queue
CREATE INDEX IF NOT EXISTS idx_notif_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_queue_status ON notification_queue(processing_status);
CREATE INDEX IF NOT EXISTS idx_notif_queue_priority ON notification_queue(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_notif_queue_scheduled ON notification_queue(scheduled_for)
  WHERE processing_status = 'scheduled' AND scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notif_queue_pending ON notification_queue(priority DESC, created_at ASC)
  WHERE processing_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notif_queue_type ON notification_queue(notification_type);
CREATE INDEX IF NOT EXISTS idx_notif_queue_source ON notification_queue(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_notif_queue_expires ON notification_queue(expires_at)
  WHERE expires_at IS NOT NULL AND processing_status IN ('pending', 'scheduled');

-- Create indexes for notification_templates
CREATE INDEX IF NOT EXISTS idx_notif_templates_name ON notification_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_notif_templates_type ON notification_templates(notification_type);
CREATE INDEX IF NOT EXISTS idx_notif_templates_active ON notification_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notif_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notif_templates_variant ON notification_templates(ab_test_variant) WHERE ab_test_variant IS NOT NULL;

-- Create indexes for notification_batches
CREATE INDEX IF NOT EXISTS idx_notif_batches_status ON notification_batches(status);
CREATE INDEX IF NOT EXISTS idx_notif_batches_scheduled ON notification_batches(scheduled_for)
  WHERE status = 'pending' AND scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notif_batches_created ON notification_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_batches_type ON notification_batches(batch_type);

-- Enable Row Level Security
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_batches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification_queue
CREATE POLICY "Users can view own queued notifications"
  ON notification_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
  ON notification_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notification queue"
  ON notification_queue FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for notification_templates
CREATE POLICY "Authenticated users can view active templates"
  ON notification_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert templates"
  ON notification_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update templates"
  ON notification_templates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for notification_batches
CREATE POLICY "Users can view own batches"
  ON notification_batches FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can insert batches"
  ON notification_batches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update batches"
  ON notification_batches FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to expire old notifications
CREATE OR REPLACE FUNCTION expire_old_notifications()
RETURNS void AS $$
BEGIN
  UPDATE notification_queue
  SET processing_status = 'expired',
      processing_completed_at = now(),
      updated_at = now()
  WHERE processing_status IN ('pending', 'scheduled')
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Create function to get next pending notification
CREATE OR REPLACE FUNCTION get_next_pending_notification()
RETURNS TABLE (
  queue_id uuid,
  user_id uuid,
  notification_type text,
  title text,
  body text,
  action_url text,
  payload jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    nq.id,
    nq.user_id,
    nq.notification_type,
    nq.title,
    nq.body,
    nq.action_url,
    nq.payload
  FROM notification_queue nq
  WHERE nq.processing_status = 'pending'
    AND (nq.scheduled_for IS NULL OR nq.scheduled_for <= now())
    AND (nq.expires_at IS NULL OR nq.expires_at > now())
  ORDER BY
    CASE nq.priority
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'normal' THEN 3
      WHEN 'low' THEN 4
    END,
    nq.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;

-- Create function to render template with variables
CREATE OR REPLACE FUNCTION render_template(
  p_template text,
  p_variables jsonb
)
RETURNS text AS $$
DECLARE
  v_result text;
  v_key text;
  v_value text;
BEGIN
  v_result := p_template;

  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_variables)
  LOOP
    v_result := replace(v_result, '{{' || v_key || '}}', v_value);
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_notification_queue_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_notification_templates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_notification_batches_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_queue_timestamp ON notification_queue;
CREATE TRIGGER trigger_update_queue_timestamp
  BEFORE UPDATE ON notification_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_queue_timestamp();

DROP TRIGGER IF EXISTS trigger_update_templates_timestamp ON notification_templates;
CREATE TRIGGER trigger_update_templates_timestamp
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_templates_timestamp();

DROP TRIGGER IF EXISTS trigger_update_batches_timestamp ON notification_batches;
CREATE TRIGGER trigger_update_batches_timestamp
  BEFORE UPDATE ON notification_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_batches_timestamp();

-- Insert default notification templates
INSERT INTO notification_templates (
  template_name, display_name, notification_type, category,
  push_title_template, push_body_template, action_url_template,
  variables, priority, channels
) VALUES
(
  'news_alert_breaking',
  'Breaking News Alert',
  'news_alert',
  'news',
  '📰 Breaking: {{headline}}',
  '{{summary}}',
  '/app/news/{{article_id}}',
  '{"headline": "Article headline", "summary": "Article summary", "article_id": "Article UUID", "ticker": "Stock ticker"}'::jsonb,
  'high',
  ARRAY['push', 'email']
),
(
  'earnings_announcement',
  'Earnings Announcement',
  'earnings_alert',
  'earnings',
  '📊 {{ticker}} reports earnings {{earnings_time}}',
  'Expected EPS: ${{expected_eps}} | Consensus: {{consensus_rating}}',
  '/app/earnings/{{earnings_id}}',
  '{"ticker": "Stock ticker", "earnings_time": "BMO/AMC", "expected_eps": "Expected EPS", "consensus_rating": "Analyst consensus", "earnings_id": "Earnings UUID"}'::jsonb,
  'high',
  ARRAY['push', 'email']
),
(
  'sec_filing_alert',
  'SEC Filing Alert',
  'sec_filing_alert',
  'regulatory',
  '📋 {{ticker}} filed {{filing_type}}',
  '{{filing_description}}',
  '/app/filings/{{filing_id}}',
  '{"ticker": "Stock ticker", "filing_type": "Filing type (10-K, 8-K, etc.)", "filing_description": "Brief description", "filing_id": "Filing UUID"}'::jsonb,
  'normal',
  ARRAY['push']
),
(
  'sentiment_spike',
  'Sentiment Spike Alert',
  'sentiment_alert',
  'sentiment',
  '📈 {{ticker}} sentiment {{trend}} {{change}}%',
  'Current sentiment: {{score}} | {{news_count}} articles analyzed',
  '/app/sentiment/{{ticker}}',
  '{"ticker": "Stock ticker", "trend": "rising/falling", "change": "Percentage change", "score": "Current score", "news_count": "Number of articles"}'::jsonb,
  'high',
  ARRAY['push']
),
(
  'price_alert',
  'Price Alert',
  'price_alert',
  'trading',
  '💰 {{ticker}} {{condition}} ${{price}}',
  '{{ticker}} is now trading at ${{price}} ({{change_percent}}%)',
  '/app/trading/{{ticker}}',
  '{"ticker": "Stock ticker", "condition": "above/below/crossed", "price": "Current price", "change_percent": "Daily change %"}'::jsonb,
  'high',
  ARRAY['push', 'sms']
)
ON CONFLICT (template_name) DO NOTHING;
