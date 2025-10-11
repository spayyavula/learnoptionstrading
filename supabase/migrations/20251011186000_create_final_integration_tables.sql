/*
  # Create Final Integration Tables

  ## Overview
  This migration creates the remaining integration tables including news deduplication tracking,
  earnings sentiment snapshots, SEC filing alerts, and cross-entity relationship tables to
  complete the comprehensive news feed and sentiment analysis system.

  ## 1. New Tables

  ### `news_article_duplicates`
  Track and manage duplicate article detection
  - `id` (uuid, primary key) - Unique identifier
  - `canonical_article_id` (uuid, foreign key) - The canonical/kept article
  - `duplicate_article_id` (uuid, foreign key) - The duplicate article
  - `similarity_score` (numeric) - How similar (0-100)
  - `similarity_type` (text) - Type of similarity detected
  - `matching_criteria` (jsonb) - What matched (title, content_hash, etc.)
  - `detection_method` (text) - How duplicate was detected
  - `detection_timestamp` (timestamptz) - When detected
  - `merge_status` (text) - Whether articles were merged
  - `merged_at` (timestamptz) - When merge occurred
  - `merged_by` (uuid) - Who performed merge
  - `is_false_positive` (boolean) - Manual override if not actually duplicate
  - `review_notes` (text) - Review notes
  - `created_at` (timestamptz) - Record creation timestamp

  ### `earnings_sentiment_snapshots`
  Capture sentiment state around earnings announcements
  - `id` (uuid, primary key) - Unique identifier
  - `earnings_id` (uuid, foreign key) - Links to earnings_calendar
  - `ticker` (text, NOT NULL) - Stock ticker symbol
  - `snapshot_time` (timestamptz, NOT NULL) - When snapshot was taken
  - `time_relative_to_earnings` (text, NOT NULL) - T-7d, T-1d, T+1h, T+1d, T+7d
  - `hours_offset` (integer) - Hours before/after earnings
  - `overall_sentiment_score` (numeric) - Aggregate sentiment score
  - `news_sentiment_score` (numeric) - News-based sentiment
  - `analyst_sentiment_score` (numeric) - Analyst rating sentiment
  - `options_sentiment_score` (numeric) - Options flow sentiment
  - `sentiment_momentum` (numeric) - Rate of sentiment change
  - `sentiment_volatility` (numeric) - Sentiment stability
  - `news_article_count` (integer) - Articles analyzed
  - `positive_news_count` (integer) - Positive articles
  - `negative_news_count` (integer) - Negative articles
  - `neutral_news_count` (integer) - Neutral articles
  - `high_impact_news_count` (integer) - Breaking news count
  - `underlying_price` (numeric) - Stock price at snapshot
  - `implied_volatility_avg` (numeric) - Average IV of near-term options
  - `created_at` (timestamptz) - Record creation timestamp

  ### `sec_filing_alerts`
  User-configured alerts for SEC filings
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key, NOT NULL) - User who owns alert
  - `alert_name` (text, NOT NULL) - User-defined alert name
  - `ticker` (text) - Specific ticker (NULL for all)
  - `filing_types` (text[]) - Alert on these filing types
  - `event_types` (text[]) - Alert on these event types (from sec_filing_events)
  - `keyword_triggers` (text[]) - Keywords to search for in filings
  - `min_materiality` (text) - Minimum event materiality
  - `is_active` (boolean) - Whether alert is active
  - `delivery_channels` (text[]) - How to deliver (push, email, sms)
  - `notification_priority` (text) - Priority level
  - `quiet_hours_respect` (boolean) - Respect user quiet hours
  - `last_triggered_at` (timestamptz) - Last alert trigger
  - `trigger_count` (integer) - Total times triggered
  - `metadata` (jsonb) - Additional alert configuration
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `cross_entity_correlations`
  Track correlations between news, earnings, filings, and price movements
  - `id` (uuid, primary key) - Unique identifier
  - `ticker` (text, NOT NULL) - Stock ticker
  - `correlation_type` (text, NOT NULL) - Type of correlation
  - `primary_entity_type` (text, NOT NULL) - First entity type
  - `primary_entity_id` (uuid, NOT NULL) - First entity ID
  - `secondary_entity_type` (text) - Second entity type
  - `secondary_entity_id` (uuid) - Second entity ID
  - `correlation_timestamp` (timestamptz, NOT NULL) - When correlation occurred
  - `correlation_strength` (numeric) - Strength of correlation (-1 to 1)
  - `time_lag_seconds` (integer) - Time lag between events
  - `sentiment_before` (numeric) - Sentiment before event
  - `sentiment_after` (numeric) - Sentiment after event
  - `price_before` (numeric) - Price before event
  - `price_after` (numeric) - Price after event
  - `volume_before` (bigint) - Volume before event
  - `volume_after` (bigint) - Volume after event
  - `iv_before` (numeric) - IV before event
  - `iv_after` (numeric) - IV after event
  - `correlation_metrics` (jsonb) - Additional correlation data
  - `created_at` (timestamptz) - Record creation timestamp

  ## 2. Security
  - RLS enabled on all tables
  - Users can manage their own alerts
  - Public read access for correlation data
  - System-level access for deduplication

  ## 3. Indexes
  - Optimized for alert lookups and correlation queries
  - Efficient duplicate detection
  - Time-based snapshot queries

  ## 4. Integration
  - Automatically creates earnings snapshots on schedule
  - Triggers SEC filing alerts on new filings
  - Tracks correlations across all data sources
*/

-- Create news_article_duplicates table
CREATE TABLE IF NOT EXISTS news_article_duplicates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_article_id uuid REFERENCES news_articles(id) ON DELETE CASCADE NOT NULL,
  duplicate_article_id uuid REFERENCES news_articles(id) ON DELETE CASCADE NOT NULL,
  similarity_score numeric(5, 2) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 100),
  similarity_type text NOT NULL CHECK (similarity_type IN (
    'exact_match', 'near_duplicate', 'same_story', 'related_story', 'url_match', 'content_hash'
  )),
  matching_criteria jsonb DEFAULT '{}'::jsonb,
  detection_method text DEFAULT 'automatic' CHECK (detection_method IN ('automatic', 'manual', 'user_report', 'algorithm')),
  detection_timestamp timestamptz DEFAULT now(),
  merge_status text DEFAULT 'pending' CHECK (merge_status IN ('pending', 'merged', 'ignored', 'false_positive')),
  merged_at timestamptz,
  merged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_false_positive boolean DEFAULT false,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(canonical_article_id, duplicate_article_id)
);

-- Create earnings_sentiment_snapshots table
CREATE TABLE IF NOT EXISTS earnings_sentiment_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  earnings_id uuid REFERENCES earnings_calendar(id) ON DELETE CASCADE NOT NULL,
  ticker text NOT NULL,
  snapshot_time timestamptz NOT NULL,
  time_relative_to_earnings text NOT NULL CHECK (time_relative_to_earnings IN (
    'T-7d', 'T-3d', 'T-1d', 'T-4h', 'T-1h', 'T+1h', 'T+4h', 'T+1d', 'T+3d', 'T+7d'
  )),
  hours_offset integer NOT NULL,
  overall_sentiment_score numeric(6, 2) DEFAULT 0,
  news_sentiment_score numeric(6, 2) DEFAULT 0,
  analyst_sentiment_score numeric(6, 2) DEFAULT 0,
  options_sentiment_score numeric(6, 2) DEFAULT 0,
  sentiment_momentum numeric(6, 2) DEFAULT 0,
  sentiment_volatility numeric(6, 2) DEFAULT 0,
  news_article_count integer DEFAULT 0,
  positive_news_count integer DEFAULT 0,
  negative_news_count integer DEFAULT 0,
  neutral_news_count integer DEFAULT 0,
  high_impact_news_count integer DEFAULT 0,
  underlying_price numeric(20, 4),
  implied_volatility_avg numeric(10, 6),
  created_at timestamptz DEFAULT now(),
  UNIQUE(earnings_id, time_relative_to_earnings)
);

-- Create sec_filing_alerts table
CREATE TABLE IF NOT EXISTS sec_filing_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_name text NOT NULL,
  ticker text,
  filing_types text[] DEFAULT ARRAY[]::text[],
  event_types text[] DEFAULT ARRAY[]::text[],
  keyword_triggers text[] DEFAULT ARRAY[]::text[],
  min_materiality text DEFAULT 'medium' CHECK (min_materiality IN ('high', 'medium', 'low')),
  is_active boolean DEFAULT true,
  delivery_channels text[] DEFAULT ARRAY['push']::text[],
  notification_priority text DEFAULT 'normal' CHECK (notification_priority IN ('critical', 'high', 'normal', 'low')),
  quiet_hours_respect boolean DEFAULT true,
  last_triggered_at timestamptz,
  trigger_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cross_entity_correlations table
CREATE TABLE IF NOT EXISTS cross_entity_correlations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  correlation_type text NOT NULL CHECK (correlation_type IN (
    'news_to_price', 'earnings_to_sentiment', 'filing_to_price', 'sentiment_to_iv',
    'analyst_to_price', 'event_to_options', 'news_to_sentiment', 'filing_to_sentiment'
  )),
  primary_entity_type text NOT NULL CHECK (primary_entity_type IN (
    'news_article', 'earnings_event', 'sec_filing', 'sentiment_change',
    'analyst_rating', 'price_movement', 'options_flow'
  )),
  primary_entity_id uuid NOT NULL,
  secondary_entity_type text CHECK (secondary_entity_type IN (
    'news_article', 'earnings_event', 'sec_filing', 'sentiment_change',
    'analyst_rating', 'price_movement', 'options_flow'
  )),
  secondary_entity_id uuid,
  correlation_timestamp timestamptz NOT NULL,
  correlation_strength numeric(5, 4) CHECK (correlation_strength >= -1 AND correlation_strength <= 1),
  time_lag_seconds integer DEFAULT 0,
  sentiment_before numeric(6, 2),
  sentiment_after numeric(6, 2),
  price_before numeric(20, 4),
  price_after numeric(20, 4),
  volume_before bigint,
  volume_after bigint,
  iv_before numeric(10, 6),
  iv_after numeric(10, 6),
  correlation_metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for news_article_duplicates
CREATE INDEX IF NOT EXISTS idx_article_duplicates_canonical ON news_article_duplicates(canonical_article_id);
CREATE INDEX IF NOT EXISTS idx_article_duplicates_duplicate ON news_article_duplicates(duplicate_article_id);
CREATE INDEX IF NOT EXISTS idx_article_duplicates_similarity ON news_article_duplicates(similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_article_duplicates_status ON news_article_duplicates(merge_status);
CREATE INDEX IF NOT EXISTS idx_article_duplicates_detection ON news_article_duplicates(detection_timestamp DESC);

-- Create indexes for earnings_sentiment_snapshots
CREATE INDEX IF NOT EXISTS idx_earnings_snapshots_earnings_id ON earnings_sentiment_snapshots(earnings_id);
CREATE INDEX IF NOT EXISTS idx_earnings_snapshots_ticker ON earnings_sentiment_snapshots(ticker);
CREATE INDEX IF NOT EXISTS idx_earnings_snapshots_time ON earnings_sentiment_snapshots(snapshot_time DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_snapshots_relative_time ON earnings_sentiment_snapshots(time_relative_to_earnings);
CREATE INDEX IF NOT EXISTS idx_earnings_snapshots_ticker_time ON earnings_sentiment_snapshots(ticker, snapshot_time DESC);

-- Create indexes for sec_filing_alerts
CREATE INDEX IF NOT EXISTS idx_filing_alerts_user ON sec_filing_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_filing_alerts_ticker ON sec_filing_alerts(ticker);
CREATE INDEX IF NOT EXISTS idx_filing_alerts_active ON sec_filing_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_filing_alerts_types ON sec_filing_alerts USING gin(filing_types);
CREATE INDEX IF NOT EXISTS idx_filing_alerts_events ON sec_filing_alerts USING gin(event_types);

-- Create indexes for cross_entity_correlations
CREATE INDEX IF NOT EXISTS idx_correlations_ticker ON cross_entity_correlations(ticker);
CREATE INDEX IF NOT EXISTS idx_correlations_type ON cross_entity_correlations(correlation_type);
CREATE INDEX IF NOT EXISTS idx_correlations_primary ON cross_entity_correlations(primary_entity_type, primary_entity_id);
CREATE INDEX IF NOT EXISTS idx_correlations_secondary ON cross_entity_correlations(secondary_entity_type, secondary_entity_id);
CREATE INDEX IF NOT EXISTS idx_correlations_timestamp ON cross_entity_correlations(correlation_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_correlations_strength ON cross_entity_correlations(correlation_strength DESC);
CREATE INDEX IF NOT EXISTS idx_correlations_ticker_time ON cross_entity_correlations(ticker, correlation_timestamp DESC);

-- Enable Row Level Security
ALTER TABLE news_article_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_sentiment_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sec_filing_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_entity_correlations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for news_article_duplicates
CREATE POLICY "Authenticated users can view article duplicates"
  ON news_article_duplicates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage duplicates"
  ON news_article_duplicates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for earnings_sentiment_snapshots
CREATE POLICY "Public can view earnings sentiment snapshots"
  ON earnings_sentiment_snapshots FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert snapshots"
  ON earnings_sentiment_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create RLS policies for sec_filing_alerts
CREATE POLICY "Users can view own filing alerts"
  ON sec_filing_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own filing alerts"
  ON sec_filing_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own filing alerts"
  ON sec_filing_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own filing alerts"
  ON sec_filing_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for cross_entity_correlations
CREATE POLICY "Public can view correlations"
  ON cross_entity_correlations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert correlations"
  ON cross_entity_correlations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to detect duplicate articles
CREATE OR REPLACE FUNCTION detect_duplicate_articles(p_article_id uuid)
RETURNS TABLE (
  duplicate_id uuid,
  similarity_score numeric,
  similarity_type text
) AS $$
BEGIN
  RETURN QUERY
  WITH article AS (
    SELECT * FROM news_articles WHERE id = p_article_id
  )
  SELECT
    na.id,
    CASE
      WHEN a.content_hash IS NOT NULL AND na.content_hash = a.content_hash THEN 100.0
      WHEN a.url = na.url THEN 100.0
      ELSE similarity(a.headline, na.headline) * 100
    END as score,
    CASE
      WHEN a.content_hash IS NOT NULL AND na.content_hash = a.content_hash THEN 'content_hash'::text
      WHEN a.url = na.url THEN 'url_match'::text
      ELSE 'near_duplicate'::text
    END as sim_type
  FROM news_articles na, article a
  WHERE na.id != p_article_id
    AND na.ticker = a.ticker
    AND na.published_at BETWEEN a.published_at - INTERVAL '3 days' AND a.published_at + INTERVAL '3 days'
    AND (
      (a.content_hash IS NOT NULL AND na.content_hash = a.content_hash) OR
      (a.url = na.url) OR
      (similarity(a.headline, na.headline) > 0.7)
    )
  ORDER BY score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to create earnings sentiment snapshot
CREATE OR REPLACE FUNCTION create_earnings_sentiment_snapshot(
  p_earnings_id uuid,
  p_time_relative text
)
RETURNS uuid AS $$
DECLARE
  v_snapshot_id uuid;
  v_earnings record;
  v_snapshot_time timestamptz;
  v_hours_offset integer;
BEGIN
  SELECT * INTO v_earnings FROM earnings_calendar WHERE id = p_earnings_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Earnings event not found';
  END IF;

  -- Calculate snapshot time based on relative time
  v_hours_offset := CASE p_time_relative
    WHEN 'T-7d' THEN -168
    WHEN 'T-3d' THEN -72
    WHEN 'T-1d' THEN -24
    WHEN 'T-4h' THEN -4
    WHEN 'T-1h' THEN -1
    WHEN 'T+1h' THEN 1
    WHEN 'T+4h' THEN 4
    WHEN 'T+1d' THEN 24
    WHEN 'T+3d' THEN 72
    WHEN 'T+7d' THEN 168
    ELSE 0
  END;

  v_snapshot_time := COALESCE(v_earnings.actual_date, v_earnings.scheduled_date) + (v_hours_offset || ' hours')::interval;

  -- Insert snapshot
  INSERT INTO earnings_sentiment_snapshots (
    earnings_id, ticker, snapshot_time, time_relative_to_earnings, hours_offset
  )
  VALUES (
    p_earnings_id, v_earnings.ticker, v_snapshot_time, p_time_relative, v_hours_offset
  )
  ON CONFLICT (earnings_id, time_relative_to_earnings) DO NOTHING
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to check SEC filing alerts
CREATE OR REPLACE FUNCTION check_sec_filing_alerts(p_filing_id uuid)
RETURNS void AS $$
DECLARE
  v_filing record;
  v_alert record;
  v_should_trigger boolean;
BEGIN
  SELECT * INTO v_filing FROM sec_filings WHERE id = p_filing_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Check each active alert
  FOR v_alert IN
    SELECT * FROM sec_filing_alerts
    WHERE is_active = true
      AND (ticker IS NULL OR ticker = v_filing.ticker)
  LOOP
    v_should_trigger := false;

    -- Check filing type match
    IF array_length(v_alert.filing_types, 1) > 0 THEN
      v_should_trigger := v_filing.filing_type = ANY(v_alert.filing_types);
    ELSE
      v_should_trigger := true;
    END IF;

    -- If alert should trigger, queue notification
    IF v_should_trigger THEN
      INSERT INTO notification_queue (
        user_id, notification_type, source_type, source_id,
        title, body, action_url, priority, channels
      )
      VALUES (
        v_alert.user_id,
        'sec_filing_alert',
        'sec_filing',
        p_filing_id,
        format('SEC Filing: %s filed %s', v_filing.ticker, v_filing.filing_type),
        COALESCE(v_filing.filing_summary, v_filing.filing_description),
        format('/app/filings/%s', p_filing_id),
        v_alert.notification_priority,
        v_alert.delivery_channels
      );

      -- Update alert stats
      UPDATE sec_filing_alerts
      SET last_triggered_at = now(),
          trigger_count = trigger_count + 1
      WHERE id = v_alert.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_filing_alerts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sec_filing_alerts updated_at
DROP TRIGGER IF EXISTS trigger_update_filing_alerts_timestamp ON sec_filing_alerts;
CREATE TRIGGER trigger_update_filing_alerts_timestamp
  BEFORE UPDATE ON sec_filing_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_filing_alerts_timestamp();

-- Create trigger to auto-check alerts on new SEC filing
DROP TRIGGER IF EXISTS trigger_check_filing_alerts ON sec_filings;
CREATE TRIGGER trigger_check_filing_alerts
  AFTER INSERT ON sec_filings
  FOR EACH ROW
  EXECUTE FUNCTION check_sec_filing_alerts(NEW.id);

-- Create view for duplicate article summary
CREATE OR REPLACE VIEW duplicate_articles_summary AS
SELECT
  canonical_article_id,
  COUNT(*) as duplicate_count,
  AVG(similarity_score) as avg_similarity,
  MAX(similarity_score) as max_similarity,
  array_agg(DISTINCT similarity_type) as similarity_types,
  MAX(detection_timestamp) as last_detected
FROM news_article_duplicates
WHERE merge_status = 'pending'
GROUP BY canonical_article_id
ORDER BY duplicate_count DESC, avg_similarity DESC;
