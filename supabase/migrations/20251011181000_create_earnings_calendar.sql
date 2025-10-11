/*
  # Create Earnings Calendar Table

  ## Overview
  Comprehensive earnings calendar tracking for corporate earnings announcements, conference calls,
  and results reporting. Integrates with news feed and sentiment analysis to provide complete
  earnings event context.

  ## 1. New Tables

  ### `earnings_calendar`
  Complete earnings announcement tracking with estimates and actuals
  - `id` (uuid, primary key) - Unique identifier
  - `ticker` (text, NOT NULL) - Stock ticker symbol
  - `company_name` (text) - Full company name
  - `fiscal_year` (integer) - Fiscal year of the report
  - `fiscal_quarter` (integer) - Fiscal quarter (1-4)
  - `fiscal_period` (text) - Period description (Q1 2024, FY 2024)
  - `scheduled_date` (timestamptz) - Originally scheduled announcement date/time
  - `actual_date` (timestamptz) - Actual announcement date/time if different
  - `earnings_time` (text) - Before market open (BMO), After market close (AMC), During market (DMH)
  - `report_status` (text) - scheduled, confirmed, reported, delayed, cancelled
  - `expected_eps` (numeric) - Analyst consensus EPS estimate
  - `actual_eps` (numeric) - Reported actual EPS
  - `eps_surprise` (numeric) - Actual minus expected EPS
  - `eps_surprise_percent` (numeric) - Percentage surprise
  - `expected_revenue` (numeric) - Analyst consensus revenue estimate (in millions)
  - `actual_revenue` (numeric) - Reported actual revenue (in millions)
  - `revenue_surprise` (numeric) - Actual minus expected revenue
  - `revenue_surprise_percent` (numeric) - Percentage surprise
  - `previous_quarter_eps` (numeric) - Prior quarter EPS for comparison
  - `previous_year_eps` (numeric) - Year-ago quarter EPS for YoY comparison
  - `guidance_low` (numeric) - Lower bound of management guidance
  - `guidance_high` (numeric) - Upper bound of management guidance
  - `guidance_midpoint` (numeric) - Midpoint of guidance range
  - `analyst_count` (integer) - Number of analysts covering
  - `consensus_rating` (text) - Analyst consensus (strong_buy, buy, hold, sell, strong_sell)
  - `conference_call_datetime` (timestamptz) - Scheduled conference call time
  - `conference_call_url` (text) - Webcast URL for earnings call
  - `replay_url` (text) - Replay URL after call concludes
  - `transcript_url` (text) - URL to earnings call transcript
  - `press_release_url` (text) - URL to official press release
  - `key_metrics` (jsonb) - Additional key metrics reported (margins, guidance, etc.)
  - `notes` (text) - Additional notes and highlights
  - `data_source` (text) - Where data originated (yahoo, polygon, alphavantage, manual)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - Unique constraint on (ticker, fiscal_year, fiscal_quarter)

  ### `earnings_call_highlights`
  Key points and management commentary from earnings calls
  - `id` (uuid, primary key) - Unique identifier
  - `earnings_id` (uuid, foreign key) - Links to earnings_calendar
  - `ticker` (text, NOT NULL) - Stock ticker symbol
  - `highlight_type` (text) - guidance, metric, commentary, qa, risk, opportunity
  - `highlight_text` (text) - The actual highlight or quote
  - `speaker` (text) - Who said it (CEO, CFO, analyst, etc.)
  - `sentiment` (text) - positive, negative, neutral, mixed
  - `importance` (text) - high, medium, low
  - `timestamp_in_call` (text) - When in the call this occurred
  - `created_at` (timestamptz) - Record creation timestamp

  ## 2. Security
  - RLS enabled on all tables
  - Public read access for earnings data (public information)
  - Authenticated write access for data ingestion

  ## 3. Indexes
  - Optimized for ticker and date queries
  - Composite indexes for common query patterns
  - Support for filtering by status and fiscal period

  ## 4. Integration
  - Links to news_articles for related coverage
  - Triggers sentiment snapshots before/after earnings
  - Feeds into options IV analysis for crush predictions
*/

-- Create earnings_calendar table
CREATE TABLE IF NOT EXISTS earnings_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  company_name text,
  fiscal_year integer NOT NULL,
  fiscal_quarter integer NOT NULL CHECK (fiscal_quarter >= 1 AND fiscal_quarter <= 4),
  fiscal_period text NOT NULL,
  scheduled_date timestamptz NOT NULL,
  actual_date timestamptz,
  earnings_time text DEFAULT 'AMC' CHECK (earnings_time IN ('BMO', 'AMC', 'DMH', 'TBD')),
  report_status text DEFAULT 'scheduled' CHECK (report_status IN ('scheduled', 'confirmed', 'reported', 'delayed', 'cancelled')),
  expected_eps numeric(10, 4),
  actual_eps numeric(10, 4),
  eps_surprise numeric(10, 4),
  eps_surprise_percent numeric(10, 4),
  expected_revenue numeric(20, 2),
  actual_revenue numeric(20, 2),
  revenue_surprise numeric(20, 2),
  revenue_surprise_percent numeric(10, 4),
  previous_quarter_eps numeric(10, 4),
  previous_year_eps numeric(10, 4),
  guidance_low numeric(10, 4),
  guidance_high numeric(10, 4),
  guidance_midpoint numeric(10, 4),
  analyst_count integer DEFAULT 0,
  consensus_rating text CHECK (consensus_rating IN ('strong_buy', 'buy', 'hold', 'sell', 'strong_sell')),
  conference_call_datetime timestamptz,
  conference_call_url text,
  replay_url text,
  transcript_url text,
  press_release_url text,
  key_metrics jsonb DEFAULT '{}'::jsonb,
  notes text,
  data_source text DEFAULT 'manual' CHECK (data_source IN ('yahoo', 'polygon', 'alphavantage', 'finnhub', 'earnings_whispers', 'manual')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(ticker, fiscal_year, fiscal_quarter)
);

-- Create earnings_call_highlights table
CREATE TABLE IF NOT EXISTS earnings_call_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  earnings_id uuid REFERENCES earnings_calendar(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  highlight_type text NOT NULL CHECK (highlight_type IN ('guidance', 'metric', 'commentary', 'qa', 'risk', 'opportunity', 'strategy')),
  highlight_text text NOT NULL,
  speaker text,
  sentiment text CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  importance text DEFAULT 'medium' CHECK (importance IN ('high', 'medium', 'low')),
  timestamp_in_call text,
  created_at timestamptz DEFAULT now()
);

-- Create comprehensive indexes for earnings_calendar
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_ticker ON earnings_calendar(ticker);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_scheduled_date ON earnings_calendar(scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_actual_date ON earnings_calendar(actual_date DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_ticker_date ON earnings_calendar(ticker, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_status ON earnings_calendar(report_status);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_fiscal_period ON earnings_calendar(fiscal_year, fiscal_quarter);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_earnings_time ON earnings_calendar(earnings_time);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_surprise ON earnings_calendar(eps_surprise_percent) WHERE actual_eps IS NOT NULL;

-- Create indexes for earnings_call_highlights
CREATE INDEX IF NOT EXISTS idx_earnings_highlights_earnings_id ON earnings_call_highlights(earnings_id);
CREATE INDEX IF NOT EXISTS idx_earnings_highlights_ticker ON earnings_call_highlights(ticker);
CREATE INDEX IF NOT EXISTS idx_earnings_highlights_type ON earnings_call_highlights(highlight_type);
CREATE INDEX IF NOT EXISTS idx_earnings_highlights_importance ON earnings_call_highlights(importance);
CREATE INDEX IF NOT EXISTS idx_earnings_highlights_sentiment ON earnings_call_highlights(sentiment);

-- Enable Row Level Security
ALTER TABLE earnings_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_call_highlights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for earnings_calendar
CREATE POLICY "Public can view earnings calendar"
  ON earnings_calendar FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can view earnings calendar"
  ON earnings_calendar FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert earnings data"
  ON earnings_calendar FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update earnings data"
  ON earnings_calendar FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete earnings data"
  ON earnings_calendar FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for earnings_call_highlights
CREATE POLICY "Public can view earnings highlights"
  ON earnings_call_highlights FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert earnings highlights"
  ON earnings_call_highlights FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update earnings highlights"
  ON earnings_call_highlights FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete earnings highlights"
  ON earnings_call_highlights FOR DELETE
  TO authenticated
  USING (true);

-- Create function to calculate surprise metrics
CREATE OR REPLACE FUNCTION calculate_earnings_surprise()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate EPS surprise
  IF NEW.actual_eps IS NOT NULL AND NEW.expected_eps IS NOT NULL THEN
    NEW.eps_surprise = NEW.actual_eps - NEW.expected_eps;
    IF NEW.expected_eps != 0 THEN
      NEW.eps_surprise_percent = (NEW.eps_surprise / ABS(NEW.expected_eps)) * 100;
    END IF;
  END IF;

  -- Calculate revenue surprise
  IF NEW.actual_revenue IS NOT NULL AND NEW.expected_revenue IS NOT NULL THEN
    NEW.revenue_surprise = NEW.actual_revenue - NEW.expected_revenue;
    IF NEW.expected_revenue != 0 THEN
      NEW.revenue_surprise_percent = (NEW.revenue_surprise / NEW.expected_revenue) * 100;
    END IF;
  END IF;

  -- Calculate guidance midpoint
  IF NEW.guidance_low IS NOT NULL AND NEW.guidance_high IS NOT NULL THEN
    NEW.guidance_midpoint = (NEW.guidance_low + NEW.guidance_high) / 2;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate surprise metrics
DROP TRIGGER IF EXISTS trigger_calculate_earnings_surprise ON earnings_calendar;
CREATE TRIGGER trigger_calculate_earnings_surprise
  BEFORE INSERT OR UPDATE ON earnings_calendar
  FOR EACH ROW
  EXECUTE FUNCTION calculate_earnings_surprise();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_earnings_calendar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_earnings_timestamp ON earnings_calendar;
CREATE TRIGGER trigger_update_earnings_timestamp
  BEFORE UPDATE ON earnings_calendar
  FOR EACH ROW
  EXECUTE FUNCTION update_earnings_calendar_timestamp();

-- Create materialized view for upcoming earnings
CREATE MATERIALIZED VIEW IF NOT EXISTS upcoming_earnings AS
SELECT
  ticker,
  company_name,
  fiscal_period,
  scheduled_date,
  earnings_time,
  expected_eps,
  expected_revenue,
  analyst_count,
  consensus_rating,
  conference_call_datetime
FROM earnings_calendar
WHERE report_status IN ('scheduled', 'confirmed')
  AND scheduled_date >= CURRENT_TIMESTAMP
ORDER BY scheduled_date ASC;

CREATE INDEX IF NOT EXISTS idx_upcoming_earnings_ticker ON upcoming_earnings(ticker);
CREATE INDEX IF NOT EXISTS idx_upcoming_earnings_date ON upcoming_earnings(scheduled_date);

-- Create materialized view for recent earnings results
CREATE MATERIALIZED VIEW IF NOT EXISTS recent_earnings_results AS
SELECT
  ticker,
  company_name,
  fiscal_period,
  actual_date,
  actual_eps,
  expected_eps,
  eps_surprise,
  eps_surprise_percent,
  actual_revenue,
  expected_revenue,
  revenue_surprise,
  revenue_surprise_percent
FROM earnings_calendar
WHERE report_status = 'reported'
  AND actual_date >= CURRENT_TIMESTAMP - INTERVAL '30 days'
ORDER BY actual_date DESC;

CREATE INDEX IF NOT EXISTS idx_recent_earnings_ticker ON recent_earnings_results(ticker);
CREATE INDEX IF NOT EXISTS idx_recent_earnings_date ON recent_earnings_results(actual_date);

-- Create function to refresh earnings views
CREATE OR REPLACE FUNCTION refresh_earnings_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY upcoming_earnings;
  REFRESH MATERIALIZED VIEW CONCURRENTLY recent_earnings_results;
END;
$$ LANGUAGE plpgsql;
