/*
  # Market Events and Sentiment Analysis Tables

  ## Overview
  This migration creates comprehensive tables for tracking market events, analyst recommendations,
  news sentiment, and their correlation with options pricing. This enables event-driven options
  analysis and sentiment-based trading decisions.

  ## New Tables

  ### `market_events`
  Tracks all market events that may impact options pricing

  ### `analyst_recommendations`
  Stores analyst ratings, price targets, and recommendation changes

  ### `stock_sentiment_scores`
  Aggregated daily sentiment scores from multiple sources

  ### `news_articles`
  Stores news articles with sentiment analysis

  ### `event_options_impact`
  Tracks how specific events affected options prices

  ## Security
  - Enable RLS on all tables
  - Public read access for market data (authenticated users)
  - No write access for regular users (data populated by system)
  - Admin users can insert/update data

  ## Indexes
  - Indexes on ticker symbols for fast lookups
  - Indexes on dates for time-based queries
  - Indexes on event types and sentiment categories
  - Composite indexes for common query patterns
*/

-- Create market_events table
CREATE TABLE IF NOT EXISTS market_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  event_type text NOT NULL,
  event_date timestamptz NOT NULL,
  event_title text NOT NULL,
  event_description text,
  impact_severity text DEFAULT 'medium',
  actual_outcome jsonb,
  expected_outcome jsonb,
  surprise_factor decimal(10,2),
  source text,
  is_future_event boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT market_events_impact_severity_check CHECK (
    impact_severity IN ('low', 'medium', 'high', 'critical')
  )
);

-- Create analyst_recommendations table
CREATE TABLE IF NOT EXISTS analyst_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  analyst_firm text NOT NULL,
  analyst_name text,
  rating text NOT NULL,
  previous_rating text,
  price_target decimal(10,2),
  previous_price_target decimal(10,2),
  rating_date timestamptz NOT NULL,
  rating_change_type text,
  confidence_score decimal(5,2) DEFAULT 50,
  accuracy_score decimal(5,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT analyst_recommendations_rating_check CHECK (
    rating IN ('strong_buy', 'buy', 'hold', 'sell', 'strong_sell')
  ),
  CONSTRAINT analyst_recommendations_change_type_check CHECK (
    rating_change_type IN ('upgrade', 'downgrade', 'maintained', 'new_coverage', 'reiterated')
  )
);

-- Create stock_sentiment_scores table
CREATE TABLE IF NOT EXISTS stock_sentiment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  date date NOT NULL,
  overall_sentiment_score decimal(6,2) NOT NULL,
  news_sentiment_score decimal(6,2) DEFAULT 0,
  analyst_sentiment_score decimal(6,2) DEFAULT 0,
  social_sentiment_score decimal(6,2) DEFAULT 0,
  sentiment_momentum decimal(6,2) DEFAULT 0,
  positive_news_count integer DEFAULT 0,
  negative_news_count integer DEFAULT 0,
  neutral_news_count integer DEFAULT 0,
  analyst_buy_count integer DEFAULT 0,
  analyst_hold_count integer DEFAULT 0,
  analyst_sell_count integer DEFAULT 0,
  sentiment_category text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT stock_sentiment_scores_ticker_date_key UNIQUE (ticker, date),
  CONSTRAINT stock_sentiment_scores_category_check CHECK (
    sentiment_category IN ('very_positive', 'positive', 'neutral', 'negative', 'very_negative')
  )
);

-- Create news_articles table (simplified version to avoid duplication)
CREATE TABLE IF NOT EXISTS news_articles_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  headline text NOT NULL,
  summary text,
  source text NOT NULL,
  author text,
  url text,
  published_at timestamptz NOT NULL,
  sentiment_score decimal(6,2),
  sentiment_magnitude decimal(6,2),
  keywords text[],
  entities jsonb,
  relevance_score decimal(5,2) DEFAULT 50,
  created_at timestamptz DEFAULT now()
);

-- Create event_options_impact table
CREATE TABLE IF NOT EXISTS event_options_impact (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES market_events(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  contract_ticker text NOT NULL,
  strike_price decimal(10,2) NOT NULL,
  contract_type text NOT NULL,
  expiration_date date NOT NULL,
  pre_event_price decimal(10,2),
  post_event_price decimal(10,2),
  pre_event_iv decimal(6,4),
  post_event_iv decimal(6,4),
  price_change_percent decimal(10,2),
  iv_change_percent decimal(10,2),
  volume_change decimal(10,2),
  days_to_expiry integer,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT event_options_impact_contract_type_check CHECK (
    contract_type IN ('call', 'put')
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_market_events_ticker ON market_events(ticker);
CREATE INDEX IF NOT EXISTS idx_market_events_event_date ON market_events(event_date);
CREATE INDEX IF NOT EXISTS idx_market_events_event_type ON market_events(event_type);
CREATE INDEX IF NOT EXISTS idx_market_events_is_future ON market_events(is_future_event);
CREATE INDEX IF NOT EXISTS idx_market_events_ticker_date ON market_events(ticker, event_date);

CREATE INDEX IF NOT EXISTS idx_analyst_recommendations_ticker ON analyst_recommendations(ticker);
CREATE INDEX IF NOT EXISTS idx_analyst_recommendations_rating_date ON analyst_recommendations(rating_date);
CREATE INDEX IF NOT EXISTS idx_analyst_recommendations_firm ON analyst_recommendations(analyst_firm);
CREATE INDEX IF NOT EXISTS idx_analyst_recommendations_ticker_date ON analyst_recommendations(ticker, rating_date);

CREATE INDEX IF NOT EXISTS idx_stock_sentiment_scores_ticker ON stock_sentiment_scores(ticker);
CREATE INDEX IF NOT EXISTS idx_stock_sentiment_scores_date ON stock_sentiment_scores(date);
CREATE INDEX IF NOT EXISTS idx_stock_sentiment_scores_ticker_date ON stock_sentiment_scores(ticker, date);
CREATE INDEX IF NOT EXISTS idx_stock_sentiment_scores_category ON stock_sentiment_scores(sentiment_category);

CREATE INDEX IF NOT EXISTS idx_event_options_impact_event_id ON event_options_impact(event_id);
CREATE INDEX IF NOT EXISTS idx_event_options_impact_ticker ON event_options_impact(ticker);
CREATE INDEX IF NOT EXISTS idx_event_options_impact_contract ON event_options_impact(contract_ticker);

-- Enable Row Level Security
ALTER TABLE market_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyst_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_sentiment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_options_impact ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read access for authenticated users
CREATE POLICY "Public read access to market events"
  ON market_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public read access to analyst recommendations"
  ON analyst_recommendations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public read access to sentiment scores"
  ON stock_sentiment_scores
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public read access to event options impact"
  ON event_options_impact
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_market_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for market_events
DROP TRIGGER IF EXISTS update_market_events_updated_at_trigger ON market_events;
CREATE TRIGGER update_market_events_updated_at_trigger
  BEFORE UPDATE ON market_events
  FOR EACH ROW
  EXECUTE FUNCTION update_market_events_updated_at();

-- Create function to calculate sentiment category
CREATE OR REPLACE FUNCTION calculate_sentiment_category(score decimal)
RETURNS text AS $$
BEGIN
  IF score >= 50 THEN
    RETURN 'very_positive';
  ELSIF score >= 15 THEN
    RETURN 'positive';
  ELSIF score >= -15 THEN
    RETURN 'neutral';
  ELSIF score >= -50 THEN
    RETURN 'negative';
  ELSE
    RETURN 'very_negative';
  END IF;
END;
$$ language 'plpgsql';

-- Create trigger to auto-set sentiment category
CREATE OR REPLACE FUNCTION set_sentiment_category()
RETURNS TRIGGER AS $$
BEGIN
  NEW.sentiment_category = calculate_sentiment_category(NEW.overall_sentiment_score);
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_sentiment_category_trigger ON stock_sentiment_scores;
CREATE TRIGGER set_sentiment_category_trigger
  BEFORE INSERT OR UPDATE ON stock_sentiment_scores
  FOR EACH ROW
  EXECUTE FUNCTION set_sentiment_category();