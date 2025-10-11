/*
  # Consolidate News Articles Schema

  ## Overview
  This migration consolidates the duplicate news_articles table definitions from previous migrations
  (20251002154643 and 20251001160000) into a single, comprehensive schema. The consolidated schema
  combines the best features from both versions while ensuring data integrity and optimal performance.

  ## Changes

  1. Schema Consolidation
    - Adopts the more comprehensive schema from 20251002154643 as the base
    - Adds any missing beneficial columns from 20251001160000
    - Ensures backward compatibility with existing code
    - Maintains all foreign key relationships

  2. New/Enhanced Columns
    - `content` (text) - Full article content for deep analysis
    - `fetched_at` (timestamptz) - When article was retrieved by our system
    - `provider` (text) - API provider that fetched the article (polygon, alphavantage, etc.)
    - `sentiment_score` (numeric) - Quick reference sentiment (-100 to 100) for compatibility
    - `sentiment_magnitude` (numeric) - Strength of sentiment (0 to 1)
    - `content_hash` (text) - SHA256 hash for deduplication
    - `is_analyzed` (boolean) - Whether FinBERT analysis has been performed
    - `quality_score` (numeric) - Article quality metric (0-100)

  3. Data Quality Enhancements
    - Add content hash for exact duplicate detection
    - Add quality score for filtering low-value content
    - Add analysis status flag for processing pipeline
    - Enhance indexes for better query performance

  4. Indexes
    - Composite indexes for common query patterns
    - Text search index for content field
    - Hash index for deduplication

  5. Security
    - RLS enabled with policies for authenticated users
    - Public read access for news data
    - Authenticated write access for data ingestion services

  ## Notes
  - Uses IF NOT EXISTS to avoid conflicts with existing tables
  - Sentiment_score is duplicated from sentiment_analysis table for quick access
  - Content hash enables efficient deduplication before API calls
  - Quality score can be used for filtering and ranking
*/

-- Drop old materialized views that depend on news_articles if they exist
DROP MATERIALIZED VIEW IF EXISTS latest_news_by_ticker CASCADE;

-- Consolidate news_articles table with enhanced schema
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  headline text NOT NULL,
  summary text,
  content text,
  source text NOT NULL,
  author text,
  url text UNIQUE NOT NULL,
  published_at timestamptz NOT NULL,
  fetched_at timestamptz DEFAULT now(),
  provider text NOT NULL CHECK (provider IN ('polygon', 'alphavantage', 'finnhub', 'newsapi', 'eodhd', 'manual', 'other')),
  relevance_score numeric DEFAULT 50 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  sentiment_score numeric DEFAULT 0 CHECK (sentiment_score >= -100 AND sentiment_score <= 100),
  sentiment_magnitude numeric DEFAULT 0 CHECK (sentiment_magnitude >= 0 AND sentiment_magnitude <= 1),
  keywords text[],
  entities jsonb DEFAULT '{}'::jsonb,
  content_hash text,
  is_analyzed boolean DEFAULT false,
  quality_score numeric DEFAULT 50 CHECK (quality_score >= 0 AND quality_score <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comprehensive indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_news_articles_ticker ON news_articles(ticker);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_ticker_published ON news_articles(ticker, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_provider ON news_articles(provider);
CREATE INDEX IF NOT EXISTS idx_news_articles_source ON news_articles(source);
CREATE INDEX IF NOT EXISTS idx_news_articles_relevance ON news_articles(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_sentiment ON news_articles(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_news_articles_content_hash ON news_articles(content_hash) WHERE content_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_news_articles_is_analyzed ON news_articles(is_analyzed) WHERE is_analyzed = false;
CREATE INDEX IF NOT EXISTS idx_news_articles_quality ON news_articles(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_keywords ON news_articles USING gin(keywords);

-- Full-text search index on headline and summary
CREATE INDEX IF NOT EXISTS idx_news_articles_fulltext ON news_articles
  USING gin(to_tsvector('english', coalesce(headline, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')));

-- Enable Row Level Security
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (from previous migrations)
DROP POLICY IF EXISTS "Anyone can view news articles" ON news_articles;
DROP POLICY IF EXISTS "Authenticated users can insert news articles" ON news_articles;
DROP POLICY IF EXISTS "Public read access to news articles" ON news_articles;

-- Create RLS policies
CREATE POLICY "Authenticated users can view all news articles"
  ON news_articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view news articles"
  ON news_articles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert news articles"
  ON news_articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update news articles"
  ON news_articles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to generate content hash
CREATE OR REPLACE FUNCTION generate_content_hash()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS NOT NULL AND NEW.content_hash IS NULL THEN
    NEW.content_hash = encode(digest(NEW.headline || coalesce(NEW.summary, '') || coalesce(NEW.content, ''), 'sha256'), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate content hash
DROP TRIGGER IF EXISTS trigger_generate_content_hash ON news_articles;
CREATE TRIGGER trigger_generate_content_hash
  BEFORE INSERT ON news_articles
  FOR EACH ROW
  EXECUTE FUNCTION generate_content_hash();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_news_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_news_articles_timestamp ON news_articles;
CREATE TRIGGER trigger_update_news_articles_timestamp
  BEFORE UPDATE ON news_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_news_articles_updated_at();

-- Create materialized view for latest news by ticker
CREATE MATERIALIZED VIEW IF NOT EXISTS latest_news_by_ticker AS
SELECT DISTINCT ON (ticker)
  ticker,
  headline,
  summary,
  source,
  published_at,
  sentiment_score,
  relevance_score,
  url
FROM news_articles
ORDER BY ticker, published_at DESC, relevance_score DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_latest_news_ticker ON latest_news_by_ticker(ticker);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_latest_news_by_ticker()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY latest_news_by_ticker;
END;
$$ LANGUAGE plpgsql;
