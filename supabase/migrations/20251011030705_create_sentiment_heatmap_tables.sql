/*
  # Sentiment Heatmap Integration for Liquid Options
  
  ## Overview
  Creates comprehensive database schema for sentiment-driven heatmap visualization
  combining FinBERT news analysis, analyst recommendations, and market events
  to provide intelligent options trading signals.
  
  ## 1. New Tables
  
  ### `liquid_options_sentiment_scores`
  Links each liquid option contract to its composite sentiment score
  - `id` (uuid, primary key) - Unique identifier
  - `contract_ticker` (text) - Full options contract ticker
  - `underlying_ticker` (text) - Underlying stock ticker (SPY, QQQ, etc.)
  - `strike_price` (numeric) - Strike price
  - `contract_type` (text) - call or put
  - `expiration_date` (date) - Option expiration
  - `date` (date) - Date of sentiment calculation
  - `composite_sentiment_score` (numeric) - Overall sentiment (-100 to +100)
  - `finbert_sentiment_score` (numeric) - FinBERT news sentiment component
  - `analyst_sentiment_score` (numeric) - Analyst ratings component
  - `event_sentiment_score` (numeric) - Market events component
  - `sentiment_confidence` (numeric) - Confidence level (0-100)
  - `sentiment_momentum` (numeric) - Rate of sentiment change
  - `sentiment_trend` (text) - rising, falling, stable, accelerating, decelerating
  - `news_article_count` (integer) - Number of news articles analyzed
  - `positive_news_count` (integer) - Positive articles
  - `negative_news_count` (integer) - Negative articles
  - `neutral_news_count` (integer) - Neutral articles
  - `analyst_rating_count` (integer) - Number of analyst ratings
  - `recent_upgrade_count` (integer) - Recent upgrades (last 30 days)
  - `recent_downgrade_count` (integer) - Recent downgrades (last 30 days)
  - `last_major_event` (text) - Most recent significant event
  - `sentiment_volatility` (numeric) - How rapidly sentiment is changing
  - `created_at` (timestamptz) - Record creation
  - `updated_at` (timestamptz) - Last update
  - Unique constraint on (contract_ticker, date)
  
  ### `sentiment_heatmap_cache`
  Pre-computed heatmap data for fast loading
  - `id` (uuid, primary key) - Unique identifier
  - `cache_key` (text) - Unique cache identifier based on filters
  - `underlying_tickers` (text[]) - Array of tickers included
  - `expiry_type` (text) - 0DTE, Weekly, Monthly, LEAPS, All
  - `sentiment_mode` (text) - composite, news_only, analyst_only, momentum
  - `heatmap_data` (jsonb) - Complete heatmap data structure
  - `row_count` (integer) - Number of rows in heatmap
  - `cell_count` (integer) - Total cells in heatmap
  - `min_sentiment` (numeric) - Minimum sentiment value
  - `max_sentiment` (numeric) - Maximum sentiment value
  - `avg_sentiment` (numeric) - Average sentiment
  - `computed_at` (timestamptz) - When cache was computed
  - `expires_at` (timestamptz) - When cache becomes stale
  - `created_at` (timestamptz) - Record creation
  - Unique constraint on cache_key
  
  ### `sentiment_alerts`
  User-configured sentiment alerts and thresholds
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - User who created alert (foreign key to auth.users)
  - `ticker` (text) - Ticker to monitor
  - `alert_type` (text) - threshold, momentum, divergence, upgrade, downgrade
  - `sentiment_threshold` (numeric) - Trigger threshold
  - `momentum_threshold` (numeric) - Momentum trigger
  - `time_window` (interval) - Time window for monitoring
  - `is_active` (boolean) - Whether alert is enabled
  - `notification_channels` (text[]) - email, sms, push, in_app
  - `last_triggered_at` (timestamptz) - Last time alert fired
  - `trigger_count` (integer) - Total times triggered
  - `created_at` (timestamptz) - Record creation
  - `updated_at` (timestamptz) - Last update
  
  ### `sentiment_historical_snapshots`
  Daily snapshots for long-term trend analysis and backtesting
  - `id` (uuid, primary key) - Unique identifier
  - `snapshot_date` (date) - Date of snapshot
  - `underlying_ticker` (text) - Ticker symbol
  - `contract_count` (integer) - Number of contracts
  - `avg_composite_sentiment` (numeric) - Average sentiment
  - `sentiment_distribution` (jsonb) - Distribution of sentiment scores
  - `top_positive_contracts` (jsonb) - Top 10 most positive
  - `top_negative_contracts` (jsonb) - Top 10 most negative
  - `highest_momentum_contracts` (jsonb) - Highest momentum changes
  - `news_volume` (integer) - Total news articles
  - `analyst_activity` (integer) - Analyst rating updates
  - `market_events` (jsonb) - Significant events that day
  - `created_at` (timestamptz) - Record creation
  - Unique constraint on (snapshot_date, underlying_ticker)
  
  ### `sentiment_impact_tracking`
  Measures correlation between sentiment and options performance
  - `id` (uuid, primary key) - Unique identifier
  - `contract_ticker` (text) - Options contract
  - `underlying_ticker` (text) - Underlying ticker
  - `measurement_date` (date) - Date of measurement
  - `sentiment_score_t0` (numeric) - Sentiment at start
  - `sentiment_score_t1` (numeric) - Sentiment at end (1 day later)
  - `option_price_t0` (numeric) - Option price at start
  - `option_price_t1` (numeric) - Option price at end
  - `price_change_percent` (numeric) - Price change percentage
  - `iv_t0` (numeric) - Implied volatility at start
  - `iv_t1` (numeric) - Implied volatility at end
  - `iv_change_percent` (numeric) - IV change percentage
  - `volume_t0` (bigint) - Volume at start
  - `volume_t1` (bigint) - Volume at end
  - `sentiment_predictive_accuracy` (numeric) - How well sentiment predicted movement
  - `correlation_coefficient` (numeric) - Statistical correlation
  - `created_at` (timestamptz) - Record creation
  
  ### `sentiment_provider_performance`
  Tracks predictive accuracy of different sentiment sources
  - `id` (uuid, primary key) - Unique identifier
  - `provider_type` (text) - finbert, analyst, events, composite
  - `provider_name` (text) - Specific provider (e.g., 'polygon', 'goldman_sachs')
  - `ticker` (text) - Ticker being tracked
  - `prediction_date` (date) - Date of prediction
  - `sentiment_prediction` (numeric) - Sentiment score
  - `actual_outcome` (numeric) - Actual price movement
  - `prediction_accuracy` (numeric) - Accuracy score (0-100)
  - `confidence_level` (numeric) - Confidence of prediction
  - `time_horizon` (interval) - Prediction timeframe
  - `created_at` (timestamptz) - Record creation
  
  ## 2. Security
  All tables have RLS enabled with appropriate policies
  
  ## 3. Indexes
  Optimized for fast heatmap queries and sentiment lookups
  
  ## 4. Notes
  - Sentiment scores normalized to -100 (very negative) to +100 (very positive)
  - Composite scores use configurable weighting between components
  - Cache expires after 15 minutes by default
  - Historical snapshots created via scheduled job
*/

-- Create liquid_options_sentiment_scores table
CREATE TABLE IF NOT EXISTS liquid_options_sentiment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_ticker text NOT NULL,
  underlying_ticker text NOT NULL,
  strike_price numeric NOT NULL,
  contract_type text NOT NULL CHECK (contract_type IN ('call', 'put')),
  expiration_date date NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  composite_sentiment_score numeric DEFAULT 0,
  finbert_sentiment_score numeric DEFAULT 0,
  analyst_sentiment_score numeric DEFAULT 0,
  event_sentiment_score numeric DEFAULT 0,
  sentiment_confidence numeric DEFAULT 50,
  sentiment_momentum numeric DEFAULT 0,
  sentiment_trend text DEFAULT 'stable',
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
  min_sentiment numeric DEFAULT 0,
  max_sentiment numeric DEFAULT 0,
  avg_sentiment numeric DEFAULT 0,
  computed_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '15 minutes',
  created_at timestamptz DEFAULT now()
);

-- Create sentiment_alerts table
CREATE TABLE IF NOT EXISTS sentiment_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('threshold', 'momentum', 'divergence', 'upgrade', 'downgrade')),
  sentiment_threshold numeric,
  momentum_threshold numeric,
  time_window interval DEFAULT '1 hour',
  is_active boolean DEFAULT true,
  notification_channels text[] DEFAULT ARRAY['in_app'],
  last_triggered_at timestamptz,
  trigger_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sentiment_historical_snapshots table
CREATE TABLE IF NOT EXISTS sentiment_historical_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  underlying_ticker text NOT NULL,
  contract_count integer DEFAULT 0,
  avg_composite_sentiment numeric DEFAULT 0,
  sentiment_distribution jsonb,
  top_positive_contracts jsonb,
  top_negative_contracts jsonb,
  highest_momentum_contracts jsonb,
  news_volume integer DEFAULT 0,
  analyst_activity integer DEFAULT 0,
  market_events jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(snapshot_date, underlying_ticker)
);

-- Create sentiment_impact_tracking table
CREATE TABLE IF NOT EXISTS sentiment_impact_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_ticker text NOT NULL,
  underlying_ticker text NOT NULL,
  measurement_date date NOT NULL,
  sentiment_score_t0 numeric,
  sentiment_score_t1 numeric,
  option_price_t0 numeric,
  option_price_t1 numeric,
  price_change_percent numeric,
  iv_t0 numeric,
  iv_t1 numeric,
  iv_change_percent numeric,
  volume_t0 bigint,
  volume_t1 bigint,
  sentiment_predictive_accuracy numeric,
  correlation_coefficient numeric,
  created_at timestamptz DEFAULT now()
);

-- Create sentiment_provider_performance table
CREATE TABLE IF NOT EXISTS sentiment_provider_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type text NOT NULL,
  provider_name text,
  ticker text NOT NULL,
  prediction_date date NOT NULL,
  sentiment_prediction numeric,
  actual_outcome numeric,
  prediction_accuracy numeric,
  confidence_level numeric,
  time_horizon interval DEFAULT '1 day',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_liquid_sentiment_ticker ON liquid_options_sentiment_scores(underlying_ticker);
CREATE INDEX IF NOT EXISTS idx_liquid_sentiment_date ON liquid_options_sentiment_scores(date DESC);
CREATE INDEX IF NOT EXISTS idx_liquid_sentiment_contract ON liquid_options_sentiment_scores(contract_ticker);
CREATE INDEX IF NOT EXISTS idx_liquid_sentiment_expiry ON liquid_options_sentiment_scores(expiration_date);
CREATE INDEX IF NOT EXISTS idx_liquid_sentiment_composite ON liquid_options_sentiment_scores(underlying_ticker, date, expiration_date);
CREATE INDEX IF NOT EXISTS idx_liquid_sentiment_score ON liquid_options_sentiment_scores(composite_sentiment_score DESC);

CREATE INDEX IF NOT EXISTS idx_heatmap_cache_key ON sentiment_heatmap_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_heatmap_cache_expires ON sentiment_heatmap_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_user ON sentiment_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_ticker ON sentiment_alerts(ticker);
CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_active ON sentiment_alerts(is_active, ticker);

CREATE INDEX IF NOT EXISTS idx_sentiment_snapshots_date ON sentiment_historical_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_snapshots_ticker ON sentiment_historical_snapshots(underlying_ticker);

CREATE INDEX IF NOT EXISTS idx_sentiment_impact_ticker ON sentiment_impact_tracking(underlying_ticker);
CREATE INDEX IF NOT EXISTS idx_sentiment_impact_date ON sentiment_impact_tracking(measurement_date DESC);

CREATE INDEX IF NOT EXISTS idx_sentiment_provider_type ON sentiment_provider_performance(provider_type);
CREATE INDEX IF NOT EXISTS idx_sentiment_provider_ticker ON sentiment_provider_performance(ticker);

-- Enable Row Level Security
ALTER TABLE liquid_options_sentiment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_heatmap_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_historical_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_impact_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_provider_performance ENABLE ROW LEVEL SECURITY;

-- Create policies for liquid_options_sentiment_scores
CREATE POLICY "Enable public read for sentiment scores"
  ON liquid_options_sentiment_scores
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable public insert for sentiment scores"
  ON liquid_options_sentiment_scores
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable public update for sentiment scores"
  ON liquid_options_sentiment_scores
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policies for sentiment_heatmap_cache
CREATE POLICY "Enable public read for heatmap cache"
  ON sentiment_heatmap_cache
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable public insert for heatmap cache"
  ON sentiment_heatmap_cache
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable public update for heatmap cache"
  ON sentiment_heatmap_cache
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable public delete for expired cache"
  ON sentiment_heatmap_cache
  FOR DELETE
  TO public
  USING (expires_at < now());

-- Create policies for sentiment_alerts
CREATE POLICY "Users can view own alerts"
  ON sentiment_alerts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts"
  ON sentiment_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON sentiment_alerts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON sentiment_alerts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for historical snapshots
CREATE POLICY "Enable public read for historical snapshots"
  ON sentiment_historical_snapshots
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable public insert for historical snapshots"
  ON sentiment_historical_snapshots
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policies for impact tracking
CREATE POLICY "Enable public read for impact tracking"
  ON sentiment_impact_tracking
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable public insert for impact tracking"
  ON sentiment_impact_tracking
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policies for provider performance
CREATE POLICY "Enable public read for provider performance"
  ON sentiment_provider_performance
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable public insert for provider performance"
  ON sentiment_provider_performance
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_liquid_sentiment_updated_at ON liquid_options_sentiment_scores;
CREATE TRIGGER update_liquid_sentiment_updated_at
  BEFORE UPDATE ON liquid_options_sentiment_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sentiment_alerts_updated_at ON sentiment_alerts;
CREATE TRIGGER update_sentiment_alerts_updated_at
  BEFORE UPDATE ON sentiment_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_sentiment_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM sentiment_heatmap_cache
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
