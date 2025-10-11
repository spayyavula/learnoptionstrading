/*
  # Enhanced Historical Data Tables

  This migration creates comprehensive historical data tracking tables for advanced analytics:

  1. New Tables
    - `historical_greeks_snapshots` - Daily/hourly Greeks evolution tracking
      - Records delta, gamma, theta, vega snapshots at specific timestamps
      - Supports historical Greeks charting and backtesting
      - Includes implied volatility tracking

    - `historical_volatility_surface` - IV surface data across strikes and expirations
      - Tracks implied volatility at various strike prices and expiration dates
      - Enables volatility skew and term structure analysis
      - Supports volatility surface visualization

    - `corporate_actions` - Dividend, split, and earnings event tracking
      - Records corporate actions affecting options pricing
      - Links to ticker for historical context
      - Tracks ex-dates, payment dates, and action amounts

    - `historical_market_indicators` - VIX, market breadth, sector performance
      - Stores daily market-wide indicators
      - Enables correlation and regime analysis
      - Tracks fear/greed indicators

    - `intraday_price_data` - High-resolution price data for detailed analysis
      - 1-minute to 1-hour bars for stocks and options
      - Supports intraday backtesting
      - Includes OHLCV data

    - `data_quality_log` - Data gaps, errors, and reliability tracking
      - Monitors data collection issues
      - Tracks data source reliability
      - Enables quality assurance reporting

  2. Security
    - RLS enabled on all tables
    - Public read access for market data (public information)
    - Authenticated users can insert data (for data collection services)
    - Admins have full access for data management

  3. Indexes
    - Optimized for time-range queries
    - Support for ticker and contract-based lookups
    - Composite indexes for common query patterns

  4. Performance
    - Designed for time-series partitioning (future enhancement)
    - Indexes optimized for analytical queries
    - Efficient storage with appropriate data types
*/

-- Create historical_greeks_snapshots table
CREATE TABLE IF NOT EXISTS historical_greeks_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_ticker text NOT NULL,
  underlying_ticker text NOT NULL,
  snapshot_time timestamptz NOT NULL,
  underlying_price numeric(20, 4) NOT NULL,
  strike_price numeric(20, 4) NOT NULL,
  expiration_date date NOT NULL,
  option_type text NOT NULL CHECK (option_type IN ('call', 'put')),
  bid numeric(20, 4) DEFAULT 0,
  ask numeric(20, 4) DEFAULT 0,
  last numeric(20, 4) DEFAULT 0,
  volume bigint DEFAULT 0,
  open_interest bigint DEFAULT 0,
  implied_volatility numeric(10, 6) DEFAULT 0,
  delta numeric(10, 6) DEFAULT 0,
  gamma numeric(10, 6) DEFAULT 0,
  theta numeric(10, 6) DEFAULT 0,
  vega numeric(10, 6) DEFAULT 0,
  rho numeric(10, 6) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contract_ticker, snapshot_time)
);

-- Create historical_volatility_surface table
CREATE TABLE IF NOT EXISTS historical_volatility_surface (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  underlying_ticker text NOT NULL,
  snapshot_date date NOT NULL,
  strike_price numeric(20, 4) NOT NULL,
  expiration_date date NOT NULL,
  days_to_expiration integer NOT NULL,
  option_type text NOT NULL CHECK (option_type IN ('call', 'put')),
  implied_volatility numeric(10, 6) NOT NULL,
  delta numeric(10, 6) DEFAULT 0,
  moneyness numeric(10, 6) DEFAULT 0,
  underlying_price numeric(20, 4) NOT NULL,
  volume bigint DEFAULT 0,
  open_interest bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(underlying_ticker, snapshot_date, strike_price, expiration_date, option_type)
);

-- Create corporate_actions table
CREATE TABLE IF NOT EXISTS corporate_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('dividend', 'split', 'earnings', 'merger', 'spinoff', 'rights_offering')),
  announced_date date,
  ex_date date NOT NULL,
  record_date date,
  payment_date date,
  amount numeric(20, 4),
  split_ratio text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create historical_market_indicators table
CREATE TABLE IF NOT EXISTS historical_market_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_date date NOT NULL,
  vix_close numeric(10, 4),
  vix_high numeric(10, 4),
  vix_low numeric(10, 4),
  vix_open numeric(10, 4),
  spy_close numeric(20, 4),
  spy_volume bigint,
  advance_decline_ratio numeric(10, 4),
  new_highs integer DEFAULT 0,
  new_lows integer DEFAULT 0,
  put_call_ratio numeric(10, 4),
  market_breadth_score numeric(10, 4),
  fear_greed_index integer,
  sector_rotation jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(indicator_date)
);

-- Create intraday_price_data table
CREATE TABLE IF NOT EXISTS intraday_price_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  bar_timestamp timestamptz NOT NULL,
  interval text NOT NULL CHECK (interval IN ('1min', '5min', '15min', '30min', '1hour')),
  open numeric(20, 4) NOT NULL,
  high numeric(20, 4) NOT NULL,
  low numeric(20, 4) NOT NULL,
  close numeric(20, 4) NOT NULL,
  volume bigint NOT NULL DEFAULT 0,
  vwap numeric(20, 4),
  trade_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ticker, bar_timestamp, interval)
);

-- Create data_quality_log table
CREATE TABLE IF NOT EXISTS data_quality_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source text NOT NULL,
  table_name text NOT NULL,
  quality_check_type text NOT NULL CHECK (quality_check_type IN ('missing_data', 'invalid_data', 'delayed_data', 'duplicate_data', 'source_error')),
  severity text NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  ticker text,
  date_affected date,
  timestamp_affected timestamptz,
  error_details text,
  resolution_status text DEFAULT 'open' CHECK (resolution_status IN ('open', 'investigating', 'resolved', 'ignored')),
  resolved_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for historical_greeks_snapshots
CREATE INDEX IF NOT EXISTS idx_greeks_snapshots_contract_time ON historical_greeks_snapshots(contract_ticker, snapshot_time DESC);
CREATE INDEX IF NOT EXISTS idx_greeks_snapshots_underlying_time ON historical_greeks_snapshots(underlying_ticker, snapshot_time DESC);
CREATE INDEX IF NOT EXISTS idx_greeks_snapshots_expiration ON historical_greeks_snapshots(expiration_date);
CREATE INDEX IF NOT EXISTS idx_greeks_snapshots_time ON historical_greeks_snapshots(snapshot_time DESC);

-- Create indexes for historical_volatility_surface
CREATE INDEX IF NOT EXISTS idx_vol_surface_ticker_date ON historical_volatility_surface(underlying_ticker, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_vol_surface_expiration ON historical_volatility_surface(expiration_date);
CREATE INDEX IF NOT EXISTS idx_vol_surface_moneyness ON historical_volatility_surface(moneyness);
CREATE INDEX IF NOT EXISTS idx_vol_surface_dte ON historical_volatility_surface(days_to_expiration);

-- Create indexes for corporate_actions
CREATE INDEX IF NOT EXISTS idx_corporate_actions_ticker ON corporate_actions(ticker);
CREATE INDEX IF NOT EXISTS idx_corporate_actions_ex_date ON corporate_actions(ex_date DESC);
CREATE INDEX IF NOT EXISTS idx_corporate_actions_type ON corporate_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_corporate_actions_ticker_date ON corporate_actions(ticker, ex_date DESC);

-- Create indexes for historical_market_indicators
CREATE INDEX IF NOT EXISTS idx_market_indicators_date ON historical_market_indicators(indicator_date DESC);

-- Create indexes for intraday_price_data
CREATE INDEX IF NOT EXISTS idx_intraday_ticker_time ON intraday_price_data(ticker, bar_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_intraday_timestamp ON intraday_price_data(bar_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_intraday_interval ON intraday_price_data(interval);

-- Create indexes for data_quality_log
CREATE INDEX IF NOT EXISTS idx_quality_log_source ON data_quality_log(data_source);
CREATE INDEX IF NOT EXISTS idx_quality_log_table ON data_quality_log(table_name);
CREATE INDEX IF NOT EXISTS idx_quality_log_severity ON data_quality_log(severity);
CREATE INDEX IF NOT EXISTS idx_quality_log_status ON data_quality_log(resolution_status);
CREATE INDEX IF NOT EXISTS idx_quality_log_created ON data_quality_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quality_log_ticker_date ON data_quality_log(ticker, date_affected);

-- Enable Row Level Security
ALTER TABLE historical_greeks_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_volatility_surface ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_market_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE intraday_price_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for historical_greeks_snapshots (public read, authenticated insert)
CREATE POLICY "Public read access to historical Greeks snapshots"
  ON historical_greeks_snapshots FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert Greeks snapshots"
  ON historical_greeks_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update Greeks snapshots"
  ON historical_greeks_snapshots FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for historical_volatility_surface
CREATE POLICY "Public read access to volatility surface"
  ON historical_volatility_surface FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert volatility surface"
  ON historical_volatility_surface FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update volatility surface"
  ON historical_volatility_surface FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for corporate_actions
CREATE POLICY "Public read access to corporate actions"
  ON corporate_actions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert corporate actions"
  ON corporate_actions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update corporate actions"
  ON corporate_actions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete corporate actions"
  ON corporate_actions FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for historical_market_indicators
CREATE POLICY "Public read access to market indicators"
  ON historical_market_indicators FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert market indicators"
  ON historical_market_indicators FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update market indicators"
  ON historical_market_indicators FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for intraday_price_data
CREATE POLICY "Public read access to intraday price data"
  ON intraday_price_data FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert intraday data"
  ON intraday_price_data FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update intraday data"
  ON intraday_price_data FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for data_quality_log
CREATE POLICY "Authenticated users can view data quality logs"
  ON data_quality_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert quality logs"
  ON data_quality_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update quality logs"
  ON data_quality_log FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_corporate_actions_updated_at
  BEFORE UPDATE ON corporate_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_historical_market_indicators_updated_at
  BEFORE UPDATE ON historical_market_indicators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
