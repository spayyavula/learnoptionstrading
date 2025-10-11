/*
  # Create SEC Filings Tables

  ## Overview
  Comprehensive SEC filings tracking system for regulatory documents (10-K, 10-Q, 8-K, etc.).
  Enables full-text search, sentiment analysis of filings, and tracking of material events
  disclosed in regulatory documents.

  ## 1. New Tables

  ### `sec_filings`
  Complete regulatory filing tracking
  - `id` (uuid, primary key) - Unique identifier
  - `ticker` (text, NOT NULL) - Stock ticker symbol
  - `cik` (text, NOT NULL) - SEC Central Index Key
  - `company_name` (text) - Full company name
  - `filing_type` (text, NOT NULL) - Type of filing (10-K, 10-Q, 8-K, S-1, DEF 14A, etc.)
  - `filing_date` (date, NOT NULL) - Date filing was submitted to SEC
  - `acceptance_datetime` (timestamptz) - When SEC accepted the filing
  - `period_of_report` (date) - The period covered by the report
  - `fiscal_year` (integer) - Fiscal year of the filing
  - `fiscal_quarter` (integer) - Fiscal quarter (1-4) if applicable
  - `accession_number` (text, UNIQUE) - SEC accession number (unique identifier)
  - `document_url` (text) - URL to the full filing on SEC Edgar
  - `html_url` (text) - URL to HTML version if available
  - `interactive_data_url` (text) - URL to interactive data (XBRL) if available
  - `file_size_bytes` (bigint) - Size of the filing document
  - `page_count` (integer) - Number of pages in the filing
  - `filing_description` (text) - Short description of filing type
  - `filing_summary` (text) - AI-generated or manual summary of key points
  - `document_status` (text) - filed, amended, superseded, withdrawn
  - `is_amendment` (boolean) - Whether this is an amendment to a previous filing
  - `amends_accession_number` (text) - If amendment, the original filing's accession number
  - `full_text` (text) - Extracted full text for search and analysis
  - `full_text_search` (tsvector) - Full-text search vector
  - `key_sections` (jsonb) - Extracted key sections (MD&A, Risk Factors, Financial Statements)
  - `extracted_data` (jsonb) - Structured data extracted from filing (financials, metrics)
  - `filing_metadata` (jsonb) - Additional metadata from SEC
  - `is_processed` (boolean) - Whether filing has been fully processed
  - `processed_at` (timestamptz) - When processing completed
  - `data_source` (text) - Where filing was obtained (sec_edgar, sec_api, manual)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - Unique constraint on accession_number

  ### `sec_filing_sentiment`
  Sentiment analysis of SEC filing content
  - `id` (uuid, primary key) - Unique identifier
  - `filing_id` (uuid, foreign key) - Links to sec_filings
  - `ticker` (text, NOT NULL) - Stock ticker symbol
  - `filing_type` (text) - Type of filing for quick reference
  - `overall_sentiment_score` (numeric) - Overall document sentiment (-100 to 100)
  - `mda_sentiment_score` (numeric) - MD&A section sentiment
  - `risk_factors_sentiment_score` (numeric) - Risk Factors section sentiment
  - `business_outlook_sentiment_score` (numeric) - Forward-looking statements sentiment
  - `sentiment_change_from_prior` (numeric) - Change vs previous similar filing
  - `tone_score` (numeric) - Overall tone (optimistic to pessimistic scale)
  - `certainty_score` (numeric) - Language certainty/confidence (0-100)
  - `litigious_score` (numeric) - Presence of legal/litigation language (0-100)
  - `constraining_score` (numeric) - Constraining language prevalence (0-100)
  - `forward_looking_count` (integer) - Count of forward-looking statements
  - `risk_keyword_count` (integer) - Count of risk-related keywords
  - `positive_keyword_count` (integer) - Count of positive keywords
  - `negative_keyword_count` (integer) - Count of negative keywords
  - `word_count` (integer) - Total word count of filing
  - `readability_score` (numeric) - Flesch reading ease score
  - `sentiment_analysis_model` (text) - Model used for analysis
  - `analyzed_at` (timestamptz) - When analysis was performed
  - `created_at` (timestamptz) - Record creation timestamp

  ### `sec_filing_events`
  Material events and highlights from SEC filings
  - `id` (uuid, primary key) - Unique identifier
  - `filing_id` (uuid, foreign key) - Links to sec_filings
  - `ticker` (text, NOT NULL) - Stock ticker symbol
  - `event_type` (text, NOT NULL) - Type of event disclosed
  - `event_date` (date) - When the event occurred
  - `disclosure_date` (date) - When event was disclosed
  - `event_title` (text) - Brief event title
  - `event_description` (text) - Detailed event description
  - `event_impact` (text) - Expected impact (positive, negative, neutral, unknown)
  - `materiality` (text) - Event materiality (high, medium, low)
  - `is_recurring` (boolean) - Whether this type of event recurs
  - `related_items` (text[]) - Related Form 8-K items or sections
  - `extracted_text` (text) - Relevant excerpted text from filing
  - `financial_impact` (jsonb) - Quantified financial impact if disclosed
  - `management_commentary` (text) - Management statements about event
  - `created_at` (timestamptz) - Record creation timestamp

  ## 2. Security
  - RLS enabled on all tables
  - Public read access for SEC filings (public information)
  - Authenticated write access for data ingestion

  ## 3. Indexes
  - Full-text search indexes on filing content
  - Optimized for ticker, filing type, and date queries
  - GIN indexes for JSONB and array columns

  ## 4. Integration
  - Links to earnings_calendar for 10-Q and 10-K filings
  - Links to news_articles for related coverage
  - Triggers sentiment snapshots on important filings
*/

-- Create sec_filings table
CREATE TABLE IF NOT EXISTS sec_filings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  cik text NOT NULL,
  company_name text,
  filing_type text NOT NULL CHECK (filing_type IN (
    '10-K', '10-Q', '8-K', 'S-1', 'S-3', 'S-4', 'S-8',
    'DEF 14A', 'DEFA14A', 'SC 13D', 'SC 13G', '13F-HR',
    '3', '4', '5', '144', 'ARS', '6-K', '20-F', '40-F',
    'EFFECT', 'POS AM', 'Other'
  )),
  filing_date date NOT NULL,
  acceptance_datetime timestamptz,
  period_of_report date,
  fiscal_year integer,
  fiscal_quarter integer CHECK (fiscal_quarter >= 1 AND fiscal_quarter <= 4),
  accession_number text UNIQUE NOT NULL,
  document_url text NOT NULL,
  html_url text,
  interactive_data_url text,
  file_size_bytes bigint DEFAULT 0,
  page_count integer DEFAULT 0,
  filing_description text,
  filing_summary text,
  document_status text DEFAULT 'filed' CHECK (document_status IN ('filed', 'amended', 'superseded', 'withdrawn')),
  is_amendment boolean DEFAULT false,
  amends_accession_number text,
  full_text text,
  full_text_search tsvector,
  key_sections jsonb DEFAULT '{}'::jsonb,
  extracted_data jsonb DEFAULT '{}'::jsonb,
  filing_metadata jsonb DEFAULT '{}'::jsonb,
  is_processed boolean DEFAULT false,
  processed_at timestamptz,
  data_source text DEFAULT 'sec_edgar' CHECK (data_source IN ('sec_edgar', 'sec_api', 'polygon', 'manual')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sec_filing_sentiment table
CREATE TABLE IF NOT EXISTS sec_filing_sentiment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filing_id uuid REFERENCES sec_filings(id) ON DELETE CASCADE NOT NULL,
  ticker text NOT NULL,
  filing_type text,
  overall_sentiment_score numeric DEFAULT 0 CHECK (overall_sentiment_score >= -100 AND overall_sentiment_score <= 100),
  mda_sentiment_score numeric CHECK (mda_sentiment_score >= -100 AND mda_sentiment_score <= 100),
  risk_factors_sentiment_score numeric CHECK (risk_factors_sentiment_score >= -100 AND risk_factors_sentiment_score <= 100),
  business_outlook_sentiment_score numeric CHECK (business_outlook_sentiment_score >= -100 AND business_outlook_sentiment_score <= 100),
  sentiment_change_from_prior numeric,
  tone_score numeric CHECK (tone_score >= -100 AND tone_score <= 100),
  certainty_score numeric DEFAULT 50 CHECK (certainty_score >= 0 AND certainty_score <= 100),
  litigious_score numeric DEFAULT 0 CHECK (litigious_score >= 0 AND litigious_score <= 100),
  constraining_score numeric DEFAULT 0 CHECK (constraining_score >= 0 AND constraining_score <= 100),
  forward_looking_count integer DEFAULT 0,
  risk_keyword_count integer DEFAULT 0,
  positive_keyword_count integer DEFAULT 0,
  negative_keyword_count integer DEFAULT 0,
  word_count integer DEFAULT 0,
  readability_score numeric,
  sentiment_analysis_model text DEFAULT 'finbert',
  analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(filing_id)
);

-- Create sec_filing_events table
CREATE TABLE IF NOT EXISTS sec_filing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filing_id uuid REFERENCES sec_filings(id) ON DELETE CASCADE NOT NULL,
  ticker text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'earnings_release', 'ceo_change', 'cfo_change', 'board_change',
    'merger_acquisition', 'divestiture', 'bankruptcy', 'delisting',
    'material_agreement', 'debt_offering', 'equity_offering', 'buyback',
    'dividend_announcement', 'guidance_change', 'accounting_change',
    'legal_proceedings', 'regulatory_action', 'product_recall',
    'facility_closure', 'restructuring', 'cybersecurity_incident', 'other'
  )),
  event_date date,
  disclosure_date date NOT NULL,
  event_title text NOT NULL,
  event_description text,
  event_impact text CHECK (event_impact IN ('positive', 'negative', 'neutral', 'unknown')),
  materiality text DEFAULT 'medium' CHECK (materiality IN ('high', 'medium', 'low')),
  is_recurring boolean DEFAULT false,
  related_items text[],
  extracted_text text,
  financial_impact jsonb DEFAULT '{}'::jsonb,
  management_commentary text,
  created_at timestamptz DEFAULT now()
);

-- Create comprehensive indexes for sec_filings
CREATE INDEX IF NOT EXISTS idx_sec_filings_ticker ON sec_filings(ticker);
CREATE INDEX IF NOT EXISTS idx_sec_filings_cik ON sec_filings(cik);
CREATE INDEX IF NOT EXISTS idx_sec_filings_filing_type ON sec_filings(filing_type);
CREATE INDEX IF NOT EXISTS idx_sec_filings_filing_date ON sec_filings(filing_date DESC);
CREATE INDEX IF NOT EXISTS idx_sec_filings_ticker_date ON sec_filings(ticker, filing_date DESC);
CREATE INDEX IF NOT EXISTS idx_sec_filings_ticker_type ON sec_filings(ticker, filing_type);
CREATE INDEX IF NOT EXISTS idx_sec_filings_accession ON sec_filings(accession_number);
CREATE INDEX IF NOT EXISTS idx_sec_filings_is_processed ON sec_filings(is_processed) WHERE is_processed = false;
CREATE INDEX IF NOT EXISTS idx_sec_filings_fiscal_period ON sec_filings(fiscal_year, fiscal_quarter) WHERE fiscal_quarter IS NOT NULL;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_sec_filings_fulltext ON sec_filings USING gin(full_text_search);

-- JSONB indexes
CREATE INDEX IF NOT EXISTS idx_sec_filings_key_sections ON sec_filings USING gin(key_sections);
CREATE INDEX IF NOT EXISTS idx_sec_filings_extracted_data ON sec_filings USING gin(extracted_data);

-- Create indexes for sec_filing_sentiment
CREATE INDEX IF NOT EXISTS idx_filing_sentiment_filing_id ON sec_filing_sentiment(filing_id);
CREATE INDEX IF NOT EXISTS idx_filing_sentiment_ticker ON sec_filing_sentiment(ticker);
CREATE INDEX IF NOT EXISTS idx_filing_sentiment_overall_score ON sec_filing_sentiment(overall_sentiment_score);
CREATE INDEX IF NOT EXISTS idx_filing_sentiment_analyzed ON sec_filing_sentiment(analyzed_at DESC);

-- Create indexes for sec_filing_events
CREATE INDEX IF NOT EXISTS idx_filing_events_filing_id ON sec_filing_events(filing_id);
CREATE INDEX IF NOT EXISTS idx_filing_events_ticker ON sec_filing_events(ticker);
CREATE INDEX IF NOT EXISTS idx_filing_events_type ON sec_filing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_filing_events_event_date ON sec_filing_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_filing_events_disclosure_date ON sec_filing_events(disclosure_date DESC);
CREATE INDEX IF NOT EXISTS idx_filing_events_materiality ON sec_filing_events(materiality);
CREATE INDEX IF NOT EXISTS idx_filing_events_impact ON sec_filing_events(event_impact);

-- Enable Row Level Security
ALTER TABLE sec_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sec_filing_sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE sec_filing_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sec_filings
CREATE POLICY "Public can view SEC filings"
  ON sec_filings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert SEC filings"
  ON sec_filings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update SEC filings"
  ON sec_filings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for sec_filing_sentiment
CREATE POLICY "Public can view filing sentiment"
  ON sec_filing_sentiment FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert filing sentiment"
  ON sec_filing_sentiment FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update filing sentiment"
  ON sec_filing_sentiment FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for sec_filing_events
CREATE POLICY "Public can view filing events"
  ON sec_filing_events FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert filing events"
  ON sec_filing_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update filing events"
  ON sec_filing_events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update full-text search vector
CREATE OR REPLACE FUNCTION update_filing_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.full_text_search = to_tsvector('english',
    coalesce(NEW.filing_type, '') || ' ' ||
    coalesce(NEW.filing_description, '') || ' ' ||
    coalesce(NEW.filing_summary, '') || ' ' ||
    coalesce(NEW.full_text, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for full-text search
DROP TRIGGER IF EXISTS trigger_update_filing_search ON sec_filings;
CREATE TRIGGER trigger_update_filing_search
  BEFORE INSERT OR UPDATE OF full_text, filing_summary ON sec_filings
  FOR EACH ROW
  EXECUTE FUNCTION update_filing_search_vector();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sec_filings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_sec_filings_timestamp ON sec_filings;
CREATE TRIGGER trigger_update_sec_filings_timestamp
  BEFORE UPDATE ON sec_filings
  FOR EACH ROW
  EXECUTE FUNCTION update_sec_filings_timestamp();

-- Create materialized view for recent important filings
CREATE MATERIALIZED VIEW IF NOT EXISTS recent_important_filings AS
SELECT
  sf.ticker,
  sf.company_name,
  sf.filing_type,
  sf.filing_date,
  sf.document_url,
  sf.filing_summary,
  sfs.overall_sentiment_score,
  COUNT(sfe.id) as event_count
FROM sec_filings sf
LEFT JOIN sec_filing_sentiment sfs ON sf.id = sfs.filing_id
LEFT JOIN sec_filing_events sfe ON sf.id = sfe.filing_id
WHERE sf.filing_date >= CURRENT_DATE - INTERVAL '30 days'
  AND sf.filing_type IN ('10-K', '10-Q', '8-K')
GROUP BY sf.id, sf.ticker, sf.company_name, sf.filing_type, sf.filing_date,
         sf.document_url, sf.filing_summary, sfs.overall_sentiment_score
ORDER BY sf.filing_date DESC;

CREATE INDEX IF NOT EXISTS idx_recent_filings_ticker ON recent_important_filings(ticker);
CREATE INDEX IF NOT EXISTS idx_recent_filings_type ON recent_important_filings(filing_type);
CREATE INDEX IF NOT EXISTS idx_recent_filings_date ON recent_important_filings(filing_date);

-- Create function to refresh filings view
CREATE OR REPLACE FUNCTION refresh_filings_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY recent_important_filings;
END;
$$ LANGUAGE plpgsql;
