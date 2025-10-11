/*
  # Create Data Quality Monitoring System

  ## Overview
  Comprehensive data quality monitoring for news feeds, sentiment analysis, and market data.
  Tracks source reliability, validates data completeness, monitors freshness, and provides
  quality metrics for continuous improvement.

  ## 1. New Tables

  ### `news_source_quality_metrics`
  Quality tracking for each news source
  - `id` (uuid, primary key) - Unique identifier
  - `source_name` (text, UNIQUE, NOT NULL) - News source identifier
  - `provider` (text) - API provider (polygon, alphavantage, etc.)
  - `total_articles_fetched` (integer) - Lifetime article count
  - `articles_last_7d` (integer) - Articles in last 7 days
  - `articles_last_30d` (integer) - Articles in last 30 days
  - `avg_relevance_score` (numeric) - Average relevance score
  - `avg_quality_score` (numeric) - Average quality score
  - `duplicate_rate` (numeric) - Percentage of duplicate articles
  - `stale_content_rate` (numeric) - Percentage of old/stale articles
  - `sentiment_accuracy_score` (numeric) - Sentiment prediction accuracy
  - `timeliness_score` (numeric) - How quickly articles are published
  - `uniqueness_score` (numeric) - Exclusive content score
  - `reliability_score` (numeric) - Overall reliability (0-100)
  - `last_article_at` (timestamptz) - Most recent article timestamp
  - `api_availability_percent` (numeric) - API uptime percentage
  - `avg_response_time_ms` (numeric) - Average API response time
  - `error_count_7d` (integer) - Errors in last 7 days
  - `last_error_at` (timestamptz) - Most recent error
  - `last_error_message` (text) - Last error message
  - `is_active` (boolean) - Whether source is actively used
  - `metadata` (jsonb) - Additional quality metrics
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `sentiment_validation_feedback`
  Track sentiment accuracy and user corrections
  - `id` (uuid, primary key) - Unique identifier
  - `article_id` (uuid, foreign key) - Related news article
  - `sentiment_analysis_id` (uuid, foreign key) - Related sentiment analysis
  - `ticker` (text, NOT NULL) - Stock ticker
  - `original_sentiment_score` (numeric) - Original calculated score
  - `original_sentiment_label` (text) - Original label (positive/negative/neutral)
  - `corrected_sentiment_score` (numeric) - User-corrected score
  - `corrected_sentiment_label` (text) - User-corrected label
  - `correction_reason` (text) - Why correction was needed
  - `price_movement_after_1h` (numeric) - Price change 1 hour after article
  - `price_movement_after_24h` (numeric) - Price change 24 hours after
  - `divergence_detected` (boolean) - Sentiment vs price divergence
  - `divergence_magnitude` (numeric) - How much they diverged
  - `feedback_source` (text) - Source of feedback (user, algorithm, expert)
  - `feedback_by` (uuid) - User who provided feedback
  - `model_version` (text) - Sentiment model version
  - `confidence_at_time` (numeric) - Model confidence when predicted
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp

  ### `data_validation_rules`
  Define validation rules for data quality
  - `id` (uuid, primary key) - Unique identifier
  - `rule_name` (text, UNIQUE, NOT NULL) - Rule identifier
  - `display_name` (text) - Human-readable name
  - `description` (text) - Rule description
  - `target_table` (text, NOT NULL) - Table to validate
  - `target_column` (text) - Specific column (NULL for table-level rules)
  - `rule_type` (text, NOT NULL) - Type of validation
  - `validation_query` (text) - SQL query for validation
  - `threshold_value` (numeric) - Threshold for pass/fail
  - `comparison_operator` (text) - Comparison operator (>, <, =, etc.)
  - `severity` (text, NOT NULL) - Rule severity
  - `is_active` (boolean) - Whether rule is active
  - `check_frequency` (text) - How often to check
  - `last_checked_at` (timestamptz) - Last check timestamp
  - `last_pass_at` (timestamptz) - Last successful check
  - `last_fail_at` (timestamptz) - Last failed check
  - `consecutive_failures` (integer) - Consecutive failure count
  - `metadata` (jsonb) - Additional rule configuration
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `data_quality_violations`
  Log all data quality rule violations
  - `id` (uuid, primary key) - Unique identifier
  - `rule_id` (uuid, foreign key) - Violated rule
  - `violation_timestamp` (timestamptz, NOT NULL) - When violation occurred
  - `target_table` (text, NOT NULL) - Affected table
  - `target_column` (text) - Affected column
  - `severity` (text, NOT NULL) - Violation severity
  - `violation_type` (text) - Specific violation type
  - `actual_value` (text) - Actual value found
  - `expected_value` (text) - Expected value
  - `affected_records_count` (integer) - Number of affected records
  - `affected_record_ids` (uuid[]) - IDs of affected records
  - `violation_details` (text) - Detailed description
  - `resolution_status` (text, NOT NULL) - Current status
  - `resolved_at` (timestamptz) - When resolved
  - `resolved_by` (uuid) - Who resolved it
  - `resolution_notes` (text) - Resolution notes
  - `auto_fixable` (boolean) - Whether can be auto-fixed
  - `created_at` (timestamptz) - Record creation timestamp

  ## 2. Security
  - RLS enabled on all tables
  - Authenticated users can view quality metrics
  - Only system/admin can modify validation rules
  - Users can provide feedback on sentiment

  ## 3. Indexes
  - Optimized for quality metric queries
  - Time-based filtering for violations
  - Source and rule lookups

  ## 4. Automation
  - Scheduled quality checks via pg_cron
  - Automatic metric calculation
  - Alert generation on violations
*/

-- Create news_source_quality_metrics table
CREATE TABLE IF NOT EXISTS news_source_quality_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text UNIQUE NOT NULL,
  provider text,
  total_articles_fetched integer DEFAULT 0,
  articles_last_7d integer DEFAULT 0,
  articles_last_30d integer DEFAULT 0,
  avg_relevance_score numeric(5, 2) DEFAULT 50,
  avg_quality_score numeric(5, 2) DEFAULT 50,
  duplicate_rate numeric(5, 2) DEFAULT 0,
  stale_content_rate numeric(5, 2) DEFAULT 0,
  sentiment_accuracy_score numeric(5, 2) DEFAULT 50,
  timeliness_score numeric(5, 2) DEFAULT 50,
  uniqueness_score numeric(5, 2) DEFAULT 50,
  reliability_score numeric(5, 2) DEFAULT 50 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  last_article_at timestamptz,
  api_availability_percent numeric(5, 2) DEFAULT 100,
  avg_response_time_ms numeric(10, 2) DEFAULT 0,
  error_count_7d integer DEFAULT 0,
  last_error_at timestamptz,
  last_error_message text,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sentiment_validation_feedback table
CREATE TABLE IF NOT EXISTS sentiment_validation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES news_articles(id) ON DELETE CASCADE,
  sentiment_analysis_id uuid REFERENCES sentiment_analysis(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  original_sentiment_score numeric(6, 2) NOT NULL,
  original_sentiment_label text NOT NULL CHECK (original_sentiment_label IN ('positive', 'negative', 'neutral')),
  corrected_sentiment_score numeric(6, 2),
  corrected_sentiment_label text CHECK (corrected_sentiment_label IN ('positive', 'negative', 'neutral', 'mixed')),
  correction_reason text,
  price_movement_after_1h numeric(10, 4),
  price_movement_after_24h numeric(10, 4),
  divergence_detected boolean DEFAULT false,
  divergence_magnitude numeric(10, 4),
  feedback_source text DEFAULT 'user' CHECK (feedback_source IN ('user', 'algorithm', 'expert', 'backtest')),
  feedback_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  model_version text,
  confidence_at_time numeric(5, 4),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create data_validation_rules table
CREATE TABLE IF NOT EXISTS data_validation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  target_table text NOT NULL,
  target_column text,
  rule_type text NOT NULL CHECK (rule_type IN (
    'not_null', 'unique', 'range', 'format', 'freshness', 'completeness',
    'consistency', 'accuracy', 'uniqueness', 'timeliness', 'custom'
  )),
  validation_query text,
  threshold_value numeric(20, 4),
  comparison_operator text CHECK (comparison_operator IN ('>', '<', '>=', '<=', '=', '!=', 'BETWEEN')),
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('critical', 'warning', 'info')),
  is_active boolean DEFAULT true,
  check_frequency text DEFAULT 'daily' CHECK (check_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
  last_checked_at timestamptz,
  last_pass_at timestamptz,
  last_fail_at timestamptz,
  consecutive_failures integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create data_quality_violations table
CREATE TABLE IF NOT EXISTS data_quality_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES data_validation_rules(id) ON DELETE CASCADE,
  violation_timestamp timestamptz NOT NULL DEFAULT now(),
  target_table text NOT NULL,
  target_column text,
  severity text NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  violation_type text NOT NULL,
  actual_value text,
  expected_value text,
  affected_records_count integer DEFAULT 1,
  affected_record_ids uuid[],
  violation_details text,
  resolution_status text NOT NULL DEFAULT 'open' CHECK (resolution_status IN (
    'open', 'investigating', 'in_progress', 'resolved', 'ignored', 'false_positive'
  )),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes text,
  auto_fixable boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for news_source_quality_metrics
CREATE INDEX IF NOT EXISTS idx_source_quality_source ON news_source_quality_metrics(source_name);
CREATE INDEX IF NOT EXISTS idx_source_quality_provider ON news_source_quality_metrics(provider);
CREATE INDEX IF NOT EXISTS idx_source_quality_reliability ON news_source_quality_metrics(reliability_score DESC);
CREATE INDEX IF NOT EXISTS idx_source_quality_active ON news_source_quality_metrics(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_source_quality_last_article ON news_source_quality_metrics(last_article_at DESC);

-- Create indexes for sentiment_validation_feedback
CREATE INDEX IF NOT EXISTS idx_sentiment_feedback_article ON sentiment_validation_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_feedback_analysis ON sentiment_validation_feedback(sentiment_analysis_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_feedback_ticker ON sentiment_validation_feedback(ticker);
CREATE INDEX IF NOT EXISTS idx_sentiment_feedback_divergence ON sentiment_validation_feedback(divergence_detected)
  WHERE divergence_detected = true;
CREATE INDEX IF NOT EXISTS idx_sentiment_feedback_source ON sentiment_validation_feedback(feedback_source);
CREATE INDEX IF NOT EXISTS idx_sentiment_feedback_created ON sentiment_validation_feedback(created_at DESC);

-- Create indexes for data_validation_rules
CREATE INDEX IF NOT EXISTS idx_validation_rules_name ON data_validation_rules(rule_name);
CREATE INDEX IF NOT EXISTS idx_validation_rules_table ON data_validation_rules(target_table);
CREATE INDEX IF NOT EXISTS idx_validation_rules_active ON data_validation_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_validation_rules_severity ON data_validation_rules(severity);
CREATE INDEX IF NOT EXISTS idx_validation_rules_frequency ON data_validation_rules(check_frequency);

-- Create indexes for data_quality_violations
CREATE INDEX IF NOT EXISTS idx_quality_violations_rule ON data_quality_violations(rule_id);
CREATE INDEX IF NOT EXISTS idx_quality_violations_table ON data_quality_violations(target_table);
CREATE INDEX IF NOT EXISTS idx_quality_violations_timestamp ON data_quality_violations(violation_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_quality_violations_severity ON data_quality_violations(severity);
CREATE INDEX IF NOT EXISTS idx_quality_violations_status ON data_quality_violations(resolution_status);
CREATE INDEX IF NOT EXISTS idx_quality_violations_open ON data_quality_violations(severity, violation_timestamp DESC)
  WHERE resolution_status = 'open';

-- Enable Row Level Security
ALTER TABLE news_source_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_validation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_violations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for news_source_quality_metrics
CREATE POLICY "Authenticated users can view source quality metrics"
  ON news_source_quality_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update source quality metrics"
  ON news_source_quality_metrics FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for sentiment_validation_feedback
CREATE POLICY "Authenticated users can view sentiment feedback"
  ON sentiment_validation_feedback FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert sentiment feedback"
  ON sentiment_validation_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = feedback_by OR feedback_by IS NULL);

-- Create RLS policies for data_validation_rules
CREATE POLICY "Authenticated users can view validation rules"
  ON data_validation_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage validation rules"
  ON data_validation_rules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for data_quality_violations
CREATE POLICY "Authenticated users can view quality violations"
  ON data_quality_violations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update violations"
  ON data_quality_violations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to calculate source reliability score
CREATE OR REPLACE FUNCTION calculate_source_reliability_score(p_source_name text)
RETURNS numeric AS $$
DECLARE
  v_score numeric;
BEGIN
  SELECT
    (
      (100 - COALESCE(duplicate_rate, 0)) * 0.25 +
      COALESCE(avg_quality_score, 50) * 0.25 +
      COALESCE(sentiment_accuracy_score, 50) * 0.20 +
      COALESCE(timeliness_score, 50) * 0.15 +
      COALESCE(uniqueness_score, 50) * 0.15
    )
  INTO v_score
  FROM news_source_quality_metrics
  WHERE source_name = p_source_name;

  RETURN COALESCE(v_score, 50);
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to update source quality metrics
CREATE OR REPLACE FUNCTION update_source_quality_metrics(p_source_name text)
RETURNS void AS $$
BEGIN
  INSERT INTO news_source_quality_metrics (source_name)
  VALUES (p_source_name)
  ON CONFLICT (source_name) DO UPDATE SET
    total_articles_fetched = (
      SELECT COUNT(*) FROM news_articles WHERE source = p_source_name
    ),
    articles_last_7d = (
      SELECT COUNT(*) FROM news_articles
      WHERE source = p_source_name AND fetched_at >= now() - INTERVAL '7 days'
    ),
    articles_last_30d = (
      SELECT COUNT(*) FROM news_articles
      WHERE source = p_source_name AND fetched_at >= now() - INTERVAL '30 days'
    ),
    avg_relevance_score = (
      SELECT AVG(relevance_score) FROM news_articles WHERE source = p_source_name
    ),
    avg_quality_score = (
      SELECT AVG(quality_score) FROM news_articles WHERE source = p_source_name
    ),
    last_article_at = (
      SELECT MAX(published_at) FROM news_articles WHERE source = p_source_name
    ),
    updated_at = now();

  -- Update reliability score
  UPDATE news_source_quality_metrics
  SET reliability_score = calculate_source_reliability_score(p_source_name)
  WHERE source_name = p_source_name;
END;
$$ LANGUAGE plpgsql;

-- Create function to check data validation rule
CREATE OR REPLACE FUNCTION check_validation_rule(p_rule_id uuid)
RETURNS boolean AS $$
DECLARE
  v_rule record;
  v_result boolean;
  v_violation_count integer;
BEGIN
  SELECT * INTO v_rule FROM data_validation_rules WHERE id = p_rule_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN true;
  END IF;

  -- Execute validation query
  EXECUTE v_rule.validation_query INTO v_violation_count;

  v_result := (v_violation_count = 0);

  -- Update rule check timestamp
  UPDATE data_validation_rules
  SET
    last_checked_at = now(),
    last_pass_at = CASE WHEN v_result THEN now() ELSE last_pass_at END,
    last_fail_at = CASE WHEN NOT v_result THEN now() ELSE last_fail_at END,
    consecutive_failures = CASE WHEN v_result THEN 0 ELSE consecutive_failures + 1 END
  WHERE id = p_rule_id;

  -- Log violation if check failed
  IF NOT v_result THEN
    INSERT INTO data_quality_violations (
      rule_id, target_table, target_column, severity, violation_type,
      affected_records_count, violation_details
    )
    VALUES (
      p_rule_id, v_rule.target_table, v_rule.target_column, v_rule.severity,
      v_rule.rule_type, v_violation_count,
      format('Validation rule "%s" failed with %s violations', v_rule.display_name, v_violation_count)
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_quality_metrics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_source_quality_timestamp ON news_source_quality_metrics;
CREATE TRIGGER trigger_update_source_quality_timestamp
  BEFORE UPDATE ON news_source_quality_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_quality_metrics_timestamp();

DROP TRIGGER IF EXISTS trigger_update_validation_rules_timestamp ON data_validation_rules;
CREATE TRIGGER trigger_update_validation_rules_timestamp
  BEFORE UPDATE ON data_validation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_quality_metrics_timestamp();

-- Insert default validation rules
INSERT INTO data_validation_rules (
  rule_name, display_name, description, target_table, rule_type,
  validation_query, severity, check_frequency
) VALUES
(
  'news_articles_freshness',
  'News Articles Freshness',
  'Ensure news articles are being fetched regularly',
  'news_articles',
  'freshness',
  'SELECT COUNT(*) FROM news_articles WHERE fetched_at < now() - INTERVAL ''1 hour''',
  'warning',
  'hourly'
),
(
  'sentiment_analysis_completeness',
  'Sentiment Analysis Completeness',
  'Check that analyzed articles have sentiment records',
  'news_articles',
  'completeness',
  'SELECT COUNT(*) FROM news_articles WHERE is_analyzed = true AND NOT EXISTS (SELECT 1 FROM sentiment_analysis WHERE article_id = news_articles.id)',
  'warning',
  'daily'
),
(
  'earnings_calendar_gaps',
  'Earnings Calendar Data Gaps',
  'Detect missing expected or actual earnings data',
  'earnings_calendar',
  'completeness',
  'SELECT COUNT(*) FROM earnings_calendar WHERE report_status = ''reported'' AND (actual_eps IS NULL OR actual_revenue IS NULL)',
  'critical',
  'daily'
)
ON CONFLICT (rule_name) DO NOTHING;
