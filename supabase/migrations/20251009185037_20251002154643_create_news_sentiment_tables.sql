/*
  # News Feed and Sentiment Analysis Tables

  ## Overview
  This migration creates the complete database schema for news feed aggregation,
  FinBERT sentiment analysis, and options sentiment mapping for liquid options trading.

  ## New Tables
  - news_articles - Stores raw news articles from multiple providers
  - sentiment_analysis - Stores FinBERT sentiment analysis results
  - options_sentiment_scores - Aggregated sentiment scores for options contracts
  - sentiment_trends - Historical sentiment trends for charting
  - news_feed_sources - Configuration for news feed API sources

  ## Security
  All tables have RLS enabled with policies for authenticated users

  ## Indexes
  Optimized indexes for common queries on ticker symbols, dates, and sentiment scores
*/

-- Create news_articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  headline text NOT NULL,
  summary text,
  content text,
  source text NOT NULL,
  author text,
  url text UNIQUE,
  published_at timestamptz NOT NULL,
  fetched_at timestamptz DEFAULT now(),
  provider text NOT NULL,
  relevance_score numeric DEFAULT 50 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  keywords text[],
  entities jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create sentiment_analysis table
CREATE TABLE IF NOT EXISTS sentiment_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES news_articles(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  finbert_score numeric NOT NULL CHECK (finbert_score >= -1 AND finbert_score <= 1),
  finbert_label text NOT NULL CHECK (finbert_label IN ('positive', 'negative', 'neutral')),
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  positive_probability numeric CHECK (positive_probability >= 0 AND positive_probability <= 1),
  negative_probability numeric CHECK (negative_probability >= 0 AND negative_probability <= 1),
  neutral_probability numeric CHECK (neutral_probability >= 0 AND neutral_probability <= 1),
  sentiment_magnitude numeric CHECK (sentiment_magnitude >= 0 AND sentiment_magnitude <= 1),
  analyzed_at timestamptz DEFAULT now(),
  model_version text DEFAULT 'ProsusAI/finbert',
  created_at timestamptz DEFAULT now()
);

-- Create options_sentiment_scores table
CREATE TABLE IF NOT EXISTS options_sentiment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  option_ticker text NOT NULL,
  date date NOT NULL,
  overall_sentiment_score numeric DEFAULT 0 CHECK (overall_sentiment_score >= -100 AND overall_sentiment_score <= 100),
  finbert_sentiment_score numeric DEFAULT 0,
  news_count integer DEFAULT 0,
  positive_count integer DEFAULT 0,
  negative_count integer DEFAULT 0,
  neutral_count integer DEFAULT 0,
  sentiment_momentum numeric DEFAULT 0,
  sentiment_trend text CHECK (sentiment_trend IN ('rising', 'falling', 'stable')),
  high_impact_news_count integer DEFAULT 0,
  average_confidence numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE(option_ticker, date)
);

-- Create sentiment_trends table
CREATE TABLE IF NOT EXISTS sentiment_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  date date NOT NULL,
  hour integer CHECK (hour >= 0 AND hour <= 23),
  sentiment_score numeric DEFAULT 0,
  sentiment_category text CHECK (sentiment_category IN ('very_positive', 'positive', 'neutral', 'negative', 'very_negative')),
  volume integer DEFAULT 0,
  momentum numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ticker, date, hour)
);

-- Create news_feed_sources table
CREATE TABLE IF NOT EXISTS news_feed_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text UNIQUE NOT NULL,
  api_endpoint text,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 10,
  rate_limit_per_minute integer,
  rate_limit_per_day integer,
  last_fetch_at timestamptz,
  total_articles_fetched integer DEFAULT 0,
  error_count integer DEFAULT 0,
  last_error text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_articles_ticker ON news_articles(ticker);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_ticker_published ON news_articles(ticker, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_provider ON news_articles(provider);

CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_article_id ON sentiment_analysis(article_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_ticker ON sentiment_analysis(ticker);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_score ON sentiment_analysis(finbert_score);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_analyzed_at ON sentiment_analysis(analyzed_at DESC);

CREATE INDEX IF NOT EXISTS idx_options_sentiment_ticker ON options_sentiment_scores(ticker);
CREATE INDEX IF NOT EXISTS idx_options_sentiment_option_ticker ON options_sentiment_scores(option_ticker);
CREATE INDEX IF NOT EXISTS idx_options_sentiment_date ON options_sentiment_scores(date DESC);
CREATE INDEX IF NOT EXISTS idx_options_sentiment_score ON options_sentiment_scores(overall_sentiment_score);

CREATE INDEX IF NOT EXISTS idx_sentiment_trends_ticker ON sentiment_trends(ticker);
CREATE INDEX IF NOT EXISTS idx_sentiment_trends_date ON sentiment_trends(date DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_trends_ticker_date ON sentiment_trends(ticker, date DESC);

-- Enable Row Level Security
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE options_sentiment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_feed_sources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for news_articles
CREATE POLICY "Anyone can view news articles"
  ON news_articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert news articles"
  ON news_articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create RLS policies for sentiment_analysis
CREATE POLICY "Anyone can view sentiment analysis"
  ON sentiment_analysis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sentiment analysis"
  ON sentiment_analysis FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create RLS policies for options_sentiment_scores
CREATE POLICY "Anyone can view options sentiment scores"
  ON options_sentiment_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert options sentiment scores"
  ON options_sentiment_scores FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update options sentiment scores"
  ON options_sentiment_scores FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for sentiment_trends
CREATE POLICY "Anyone can view sentiment trends"
  ON sentiment_trends FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sentiment trends"
  ON sentiment_trends FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create RLS policies for news_feed_sources
CREATE POLICY "Anyone can view news feed sources"
  ON news_feed_sources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update news feed sources"
  ON news_feed_sources FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default news feed sources
INSERT INTO news_feed_sources (provider, api_endpoint, is_active, priority, rate_limit_per_minute, rate_limit_per_day)
VALUES 
  ('polygon', 'https://api.polygon.io/v2/reference/news', true, 1, 5, 500),
  ('alphavantage', 'https://www.alphavantage.co/query', true, 2, 5, 500),
  ('finnhub', 'https://finnhub.io/api/v1/news', true, 3, 60, 10000),
  ('newsapi', 'https://newsapi.org/v2/everything', true, 4, 2, 100)
ON CONFLICT (provider) DO NOTHING;