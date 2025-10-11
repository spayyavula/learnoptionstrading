/*
  # Liquid Options Sentiment Analysis Tables

  ## Overview
  Comprehensive schema for liquid options sentiment scoring, heatmap caching,
  and sentiment alerting system. Integrates FinBERT sentiment analysis,
  analyst recommendations, and event-driven signals into unified sentiment scores.

  ## 1. New Tables

  ### `liquid_options_sentiment_scores`
  Per-contract sentiment metrics combining multiple data sources
  - `id` (uuid, primary key) - Unique identifier
  - `contract_ticker` (text) - Specific option contract ticker (e.g., O:SPY250117C00500000)
  - `underlying_ticker` (text) - Underlying stock ticker (e.g., SPY)
  - `strike_price` (numeric) - Strike price of option contract
  - `contract_type` (text) - 'call' or 'put'
  - `expiration_date` (date) - Contract expiration date
  - `date` (date) - Sentiment calculation date
  - `composite_sentiment_score` (numeric) - Weighted composite score (-100 to 100)
  - `finbert_sentiment_score` (numeric) - FinBERT-based news sentiment (-100 to 100)
  - `analyst_sentiment_score` (numeric) - Analyst ratings sentiment (-100 to 100)
  - `event_sentiment_score` (numeric) - Event-driven sentiment (-100 to 100)
  - `sentiment_confidence` (numeric) - Confidence level (0-100)
  - `sentiment_momentum` (numeric) - Rate of sentiment change
  - `sentiment_trend` (text) - Trend direction (rising, falling, stable, accelerating, decelerating)
  - `news_article_count` (integer) - Number of news articles analyzed
  - `positive_news_count` (integer) - Count of positive articles
  - `negative_news_count` (integer) - Count of negative articles
  - `neutral_news_count` (integer) - Count of neutral articles
  - `analyst_rating_count` (integer) - Number of analyst ratings
  - `recent_upgrade_count` (integer) - Recent upgrades in last 30 days
  - `recent_downgrade_count` (integer) - Recent downgrades in last 30 days
  - `last_major_event` (text) - Description of most recent major event
  - `sentiment_volatility` (numeric) - Volatility of sentiment over time
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - Unique constraint on (contract_ticker, date)

  ### `sentiment_heatmap_cache`
  Cached heatmap data for performance optimization
  - `id` (uuid, primary key) - Unique identifier
  - `cache_key` (text, unique) - Unique key for cache lookup
  - `underlying_tickers` (text[]) - Array of tickers in cached data
  - `expiry_type` (text) - Expiration filter (All, 0DTE, Daily, Weekly, Monthly, LEAPS)
  - `sentiment_mode` (text) - Sentiment mode (composite, news_only, analyst_only, momentum)
  - `heatmap_data` (jsonb) - Complete heatmap data structure
  - `row_count` (integer) - Number of rows in heatmap
  - `cell_count` (integer) - Total number of cells/contracts
  - `min_sentiment` (numeric) - Minimum sentiment score in dataset
  - `max_sentiment` (numeric) - Maximum sentiment score in dataset
  - `avg_sentiment` (numeric) - Average sentiment score
  - `computed_at` (timestamptz) - When cache was computed
  - `expires_at` (timestamptz) - Cache expiration timestamp
  - `created_at` (timestamptz) - Record creation timestamp

  ### `sentiment_alerts`
  Tracks significant sentiment changes and anomalies
  - `id` (uuid, primary key) - Unique identifier
  - `alert_type` (text) - Type of alert (momentum_spike, sentiment_reversal, analyst_upgrade, etc.)
  - `underlying_ticker` (text) - Stock ticker
  - `contract_ticker` (text) - Option contract ticker (if applicable)
  - `alert_severity` (text) - Severity level (low, medium, high, critical)
  - `sentiment_change` (numeric) - Magnitude of sentiment change
  - `previous_sentiment` (numeric) - Sentiment score before change
  - `current_sentiment` (numeric) - Current sentiment score
  - `trigger_threshold` (numeric) - Threshold that triggered alert
  - `alert_message` (text) - Human-readable alert description
  - `source_data` (jsonb) - Related data that triggered alert
  - `is_read` (boolean) - Whether user has acknowledged alert
  - `is_active` (boolean) - Whether alert is still relevant
  - `triggered_at` (timestamptz) - When alert was triggered
  - `expires_at` (timestamptz) - When alert becomes stale
  - `created_at` (timestamptz) - Record creation timestamp

  ### `sentiment_signal_weights`
  User-customizable weights for sentiment components
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - User who owns these weights (NULL for system defaults)
  - `weight_profile_name` (text) - Name of weight profile
  - `finbert_weight` (numeric) - Weight for FinBERT sentiment (0-1)
  - `analyst_weight` (numeric) - Weight for analyst sentiment (0-1)
  - `event_weight` (numeric) - Weight for event sentiment (0-1)
  - `is_default` (boolean) - Whether this is user's default profile
  - `description` (text) - Profile description
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  All tables have RLS enabled with policies for authenticated users

  ## 3. Indexes
  Optimized indexes for heatmap queries and sentiment lookups

  ## 4. Notes
  - Composite sentiment scores combine multiple sources with configurable weights
  - Caching layer provides 15-minute TTL for heatmap performance
  - Alerts track significant sentiment shifts for timely trading decisions
  - Sentiment trends use momentum and volatility for predictive signals
*/

-- Create liquid_options_sentiment_scores table
CREATE TABLE IF NOT EXISTS liquid_options_sentiment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_ticker text NOT NULL,
  underlying_ticker text NOT NULL,
  strike_price numeric NOT NULL,
  contract_type text NOT NULL CHECK (contract_type IN ('call', 'put')),
  expiration_date date NOT NULL,
  date date NOT NULL,
  composite_sentiment_score numeric DEFAULT 0 CHECK (composite_sentiment_score >= -100 AND composite_sentiment_score <= 100),
  finbert_sentiment_score numeric DEFAULT 0 CHECK (finbert_sentiment_score >= -100 AND finbert_sentiment_score <= 100),
  analyst_sentiment_score numeric DEFAULT 0 CHECK (analyst_sentiment_score >= -100 AND analyst_sentiment_score <= 100),
  event_sentiment_score numeric DEFAULT 0 CHECK (event_sentiment_score >= -100 AND event_sentiment_score <= 100),
  sentiment_confidence numeric DEFAULT 50 CHECK (sentiment_confidence >= 0 AND sentiment_confidence <= 100),
  sentiment_momentum numeric DEFAULT 0,
  sentiment_trend text DEFAULT 'stable' CHECK (sentiment_trend IN ('rising', 'falling', 'stable', 'accelerating', 'decelerating')),
  news_article_count integer DEFAULT 0,
  positive_news_count integer DEFAULT 0,
  negative_news_count integer DEFAULT 0,
  neutral_news_count integer DEFAULT 0,
  analyst_rating_count integer DEFAULT 0,
  recent_upgrade_count integer DEFAULT 0,
  recent_downgrade_count integer DEFAULT 0,
  last_major_event text,
  sentiment_volatility numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(contract_ticker, date)
);

-- Create sentiment_heatmap_cache table
CREATE TABLE IF NOT EXISTS sentiment_heatmap_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  underlying_tickers text[] NOT NULL,
  expiry_type text DEFAULT 'All',
  sentiment_mode text DEFAULT 'composite',
  heatmap_data jsonb NOT NULL,
  row_count integer DEFAULT 0,
  cell_count integer DEFAULT 0,
  min_sentiment numeric DEFAULT -100,
  max_sentiment numeric DEFAULT 100,
  avg_sentiment numeric DEFAULT 0,
  computed_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sentiment_alerts table
CREATE TABLE IF NOT EXISTS sentiment_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL CHECK (alert_type IN (
    'momentum_spike', 'sentiment_reversal', 'analyst_upgrade', 'analyst_downgrade',
    'news_surge', 'sentiment_divergence', 'volatility_spike', 'consensus_shift',
    'event_impact', 'anomaly_detection'
  )),
  underlying_ticker text NOT NULL,
  contract_ticker text,
  alert_severity text NOT NULL CHECK (alert_severity IN ('low', 'medium', 'high', 'critical')),
  sentiment_change numeric,
  previous_sentiment numeric,
  current_sentiment numeric,
  trigger_threshold numeric,
  alert_message text NOT NULL,
  source_data jsonb,
  is_read boolean DEFAULT false,
  is_active boolean DEFAULT true,
  triggered_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create sentiment_signal_weights table
CREATE TABLE IF NOT EXISTS sentiment_signal_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_profile_name text NOT NULL,
  finbert_weight numeric DEFAULT 0.5 CHECK (finbert_weight >= 0 AND finbert_weight <= 1),
  analyst_weight numeric DEFAULT 0.35 CHECK (analyst_weight >= 0 AND analyst_weight <= 1),
  event_weight numeric DEFAULT 0.15 CHECK (event_weight >= 0 AND event_weight <= 1),
  is_default boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (finbert_weight + analyst_weight + event_weight = 1.0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_liquid_sentiment_contract_ticker ON liquid_options_sentiment_scores(contract_ticker);
CREATE INDEX IF NOT EXISTS idx_liquid_sentiment_underlying_ticker ON liquid_options_sentiment_scores(underlying_ticker);
CREATE INDEX IF NOT EXISTS idx_liquid_sentiment_date ON liquid_options_sentiment_scores(date DESC);
CREATE INDEX IF NOT EXISTS idx_liquid_sentiment_ticker_date ON liquid_options_sentiment_scores(underlying_ticker, date DESC);
CREATE INDEX IF NOT EXISTS idx_liquid_sentiment_composite_score ON liquid_options_sentiment_scores(composite_sentiment_score);
CREATE INDEX IF NOT EXISTS idx_liquid_sentiment_expiration ON liquid_options_sentiment_scores(expiration_date);
CREATE INDEX IF NOT EXISTS idx_liquid_sentiment_strike ON liquid_options_sentiment_scores(strike_price);
CREATE INDEX IF NOT EXISTS idx_liquid_sentiment_trend ON liquid_options_sentiment_scores(sentiment_trend);

CREATE INDEX IF NOT EXISTS idx_heatmap_cache_key ON sentiment_heatmap_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_heatmap_cache_expires ON sentiment_heatmap_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_heatmap_cache_computed ON sentiment_heatmap_cache(computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_ticker ON sentiment_alerts(underlying_ticker);
CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_type ON sentiment_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_severity ON sentiment_alerts(alert_severity);
CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_active ON sentiment_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_triggered ON sentiment_alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_read ON sentiment_alerts(is_read);

CREATE INDEX IF NOT EXISTS idx_signal_weights_user ON sentiment_signal_weights(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_weights_default ON sentiment_signal_weights(is_default);

-- Enable Row Level Security
ALTER TABLE liquid_options_sentiment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_heatmap_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_signal_weights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for liquid_options_sentiment_scores
CREATE POLICY "Anyone can view liquid options sentiment scores"
  ON liquid_options_sentiment_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert liquid options sentiment scores"
  ON liquid_options_sentiment_scores FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update liquid options sentiment scores"
  ON liquid_options_sentiment_scores FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for sentiment_heatmap_cache
CREATE POLICY "Anyone can view sentiment heatmap cache"
  ON sentiment_heatmap_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sentiment heatmap cache"
  ON sentiment_heatmap_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sentiment heatmap cache"
  ON sentiment_heatmap_cache FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete expired sentiment heatmap cache"
  ON sentiment_heatmap_cache FOR DELETE
  TO authenticated
  USING (expires_at < now());

-- Create RLS policies for sentiment_alerts
CREATE POLICY "Users can view all active sentiment alerts"
  ON sentiment_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sentiment alerts"
  ON sentiment_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sentiment alerts"
  ON sentiment_alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete old sentiment alerts"
  ON sentiment_alerts FOR DELETE
  TO authenticated
  USING (expires_at < now() OR created_at < now() - interval '30 days');

-- Create RLS policies for sentiment_signal_weights
CREATE POLICY "Users can view their own sentiment signal weights"
  ON sentiment_signal_weights FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert their own sentiment signal weights"
  ON sentiment_signal_weights FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sentiment signal weights"
  ON sentiment_signal_weights FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own sentiment signal weights"
  ON sentiment_signal_weights FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Insert default sentiment signal weight profiles
INSERT INTO sentiment_signal_weights (user_id, weight_profile_name, finbert_weight, analyst_weight, event_weight, is_default, description)
VALUES
  (NULL, 'Balanced', 0.5, 0.35, 0.15, true, 'Equal emphasis on news sentiment, analyst ratings, and market events'),
  (NULL, 'News-Driven', 0.7, 0.2, 0.1, false, 'Heavy weight on news sentiment for momentum trading'),
  (NULL, 'Analyst-Focused', 0.25, 0.6, 0.15, false, 'Prioritize analyst recommendations for fundamental analysis'),
  (NULL, 'Event-Reactive', 0.3, 0.3, 0.4, false, 'React to market events like earnings and announcements')
ON CONFLICT DO NOTHING;
