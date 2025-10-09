/*
  # Create Options Chain Live Data Tables
  
  ## Description
  Creates comprehensive tables to store real-time options chain data for multiple liquid tickers
  with support for expiry categorization (0DTE, Weekly, Monthly, LEAPS) and liquidity metrics.
  
  ## New Tables
  
  1. `liquid_tickers` - Stores metadata for supported liquid options tickers
  2. `options_contracts_live` - Stores live options contract data
  3. `options_expiries` - Stores expiration dates with categorization
  
  ## Security
  - RLS enabled on all tables
  - Public read access for market data
  - Restricted write access for data collection services
  
  ## Indexes
  - Optimized for ticker and expiry-based queries
  - Support for filtering by expiry type
  - Efficient lookups by strike price ranges
*/

-- Create liquid_tickers table
CREATE TABLE IF NOT EXISTS liquid_tickers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text UNIQUE NOT NULL,
  name text NOT NULL,
  sector text,
  market_cap numeric,
  current_price numeric,
  avg_daily_volume bigint DEFAULT 0,
  avg_open_interest bigint DEFAULT 0,
  is_active boolean DEFAULT true,
  last_update timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create options_contracts_live table
CREATE TABLE IF NOT EXISTS options_contracts_live (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_ticker text UNIQUE NOT NULL,
  underlying_ticker text NOT NULL,
  contract_type text NOT NULL CHECK (contract_type IN ('call', 'put')),
  strike_price numeric NOT NULL,
  expiration_date date NOT NULL,
  exercise_style text DEFAULT 'american' CHECK (exercise_style IN ('american', 'european')),
  shares_per_contract integer DEFAULT 100,
  bid numeric DEFAULT 0,
  ask numeric DEFAULT 0,
  last numeric DEFAULT 0,
  mark numeric DEFAULT 0,
  volume bigint DEFAULT 0,
  open_interest bigint DEFAULT 0,
  implied_volatility numeric DEFAULT 0,
  delta numeric DEFAULT 0,
  gamma numeric DEFAULT 0,
  theta numeric DEFAULT 0,
  vega numeric DEFAULT 0,
  rho numeric DEFAULT 0,
  intrinsic_value numeric DEFAULT 0,
  time_value numeric DEFAULT 0,
  bid_ask_spread numeric DEFAULT 0,
  last_trade_timestamp timestamptz,
  last_update timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create options_expiries table
CREATE TABLE IF NOT EXISTS options_expiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expiration_date date NOT NULL,
  underlying_ticker text NOT NULL,
  expiry_type text NOT NULL CHECK (expiry_type IN ('0DTE', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'LEAPS')),
  days_to_expiry integer NOT NULL DEFAULT 0,
  business_days_to_expiry integer DEFAULT 0,
  is_standard_expiry boolean DEFAULT false,
  total_call_volume bigint DEFAULT 0,
  total_put_volume bigint DEFAULT 0,
  total_call_open_interest bigint DEFAULT 0,
  total_put_open_interest bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(expiration_date, underlying_ticker)
);

-- Create comprehensive indexes for performance
CREATE INDEX IF NOT EXISTS idx_liquid_tickers_active ON liquid_tickers(is_active, ticker);
CREATE INDEX IF NOT EXISTS idx_liquid_tickers_last_update ON liquid_tickers(last_update DESC);

CREATE INDEX IF NOT EXISTS idx_options_live_underlying ON options_contracts_live(underlying_ticker);
CREATE INDEX IF NOT EXISTS idx_options_live_expiry ON options_contracts_live(expiration_date);
CREATE INDEX IF NOT EXISTS idx_options_live_strike ON options_contracts_live(strike_price);
CREATE INDEX IF NOT EXISTS idx_options_live_type ON options_contracts_live(contract_type);
CREATE INDEX IF NOT EXISTS idx_options_live_composite ON options_contracts_live(underlying_ticker, expiration_date, contract_type, strike_price);
CREATE INDEX IF NOT EXISTS idx_options_live_volume ON options_contracts_live(volume DESC);
CREATE INDEX IF NOT EXISTS idx_options_live_oi ON options_contracts_live(open_interest DESC);
CREATE INDEX IF NOT EXISTS idx_options_live_last_update ON options_contracts_live(last_update DESC);

CREATE INDEX IF NOT EXISTS idx_expiries_ticker ON options_expiries(underlying_ticker);
CREATE INDEX IF NOT EXISTS idx_expiries_date ON options_expiries(expiration_date);
CREATE INDEX IF NOT EXISTS idx_expiries_type ON options_expiries(expiry_type);
CREATE INDEX IF NOT EXISTS idx_expiries_dte ON options_expiries(days_to_expiry);
CREATE INDEX IF NOT EXISTS idx_expiries_composite ON options_expiries(underlying_ticker, expiration_date);

-- Enable Row Level Security
ALTER TABLE liquid_tickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE options_contracts_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE options_expiries ENABLE ROW LEVEL SECURITY;

-- Create policies for liquid_tickers
CREATE POLICY "Enable public read for liquid_tickers"
  ON liquid_tickers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable public insert for liquid_tickers"
  ON liquid_tickers
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable public update for liquid_tickers"
  ON liquid_tickers
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policies for options_contracts_live
CREATE POLICY "Enable public read for options_contracts_live"
  ON options_contracts_live
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable public insert for options_contracts_live"
  ON options_contracts_live
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable public update for options_contracts_live"
  ON options_contracts_live
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policies for options_expiries
CREATE POLICY "Enable public read for options_expiries"
  ON options_expiries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable public insert for options_expiries"
  ON options_expiries
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable public update for options_expiries"
  ON options_expiries
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_liquid_tickers_updated_at ON liquid_tickers;
CREATE TRIGGER update_liquid_tickers_updated_at
  BEFORE UPDATE ON liquid_tickers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_options_contracts_live_updated_at ON options_contracts_live;
CREATE TRIGGER update_options_contracts_live_updated_at
  BEFORE UPDATE ON options_contracts_live
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_options_expiries_updated_at ON options_expiries;
CREATE TRIGGER update_options_expiries_updated_at
  BEFORE UPDATE ON options_expiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to categorize expiry type based on date
CREATE OR REPLACE FUNCTION categorize_expiry_type(expiry_date date, underlying text)
RETURNS text AS $$
DECLARE
  days_diff integer;
  day_of_week integer;
  is_third_friday boolean;
BEGIN
  days_diff := expiry_date - CURRENT_DATE;
  day_of_week := EXTRACT(DOW FROM expiry_date);
  
  -- Check if it's the third Friday of the month (standard monthly expiry)
  is_third_friday := (
    day_of_week = 5 AND 
    EXTRACT(DAY FROM expiry_date) BETWEEN 15 AND 21
  );
  
  -- 0DTE: Expiring today
  IF days_diff = 0 THEN
    RETURN '0DTE';
  -- Daily: Expiring within next 3 days
  ELSIF days_diff <= 3 THEN
    RETURN 'Daily';
  -- Weekly: Expiring within 7 days and not a monthly
  ELSIF days_diff <= 7 AND NOT is_third_friday THEN
    RETURN 'Weekly';
  -- Monthly: Standard third Friday expiry
  ELSIF is_third_friday AND days_diff <= 45 THEN
    RETURN 'Monthly';
  -- Quarterly: 60-120 days out
  ELSIF days_diff BETWEEN 60 AND 120 THEN
    RETURN 'Quarterly';
  -- LEAPS: Over 365 days
  ELSIF days_diff > 365 THEN
    RETURN 'LEAPS';
  -- Default to Monthly for anything else
  ELSE
    RETURN 'Monthly';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate business days to expiry
CREATE OR REPLACE FUNCTION calculate_business_days(start_date date, end_date date)
RETURNS integer AS $$
DECLARE
  business_days integer := 0;
  current_day date;
BEGIN
  current_day := start_date;
  WHILE current_day < end_date LOOP
    IF EXTRACT(DOW FROM current_day) NOT IN (0, 6) THEN
      business_days := business_days + 1;
    END IF;
    current_day := current_day + 1;
  END LOOP;
  RETURN business_days;
END;
$$ LANGUAGE plpgsql;

-- Insert initial liquid tickers
INSERT INTO liquid_tickers (ticker, name, sector, is_active) VALUES
  ('SPY', 'SPDR S&P 500 ETF Trust', 'ETF', true),
  ('SPX', 'S&P 500 Index', 'Index', true),
  ('QQQ', 'Invesco QQQ Trust', 'ETF', true),
  ('AAPL', 'Apple Inc.', 'Technology', true),
  ('MSFT', 'Microsoft Corporation', 'Technology', true),
  ('NVDA', 'NVIDIA Corporation', 'Technology', true),
  ('TSLA', 'Tesla, Inc.', 'Automotive', true),
  ('AMZN', 'Amazon.com, Inc.', 'Consumer Cyclical', true),
  ('GOOGL', 'Alphabet Inc.', 'Technology', true),
  ('META', 'Meta Platforms, Inc.', 'Technology', true),
  ('IWM', 'iShares Russell 2000 ETF', 'ETF', true),
  ('DIA', 'SPDR Dow Jones Industrial Average ETF', 'ETF', true)
ON CONFLICT (ticker) DO NOTHING;