/*
  # Create Options Screener Tables
  
  ## Summary
  Creates comprehensive database tables for storing options screener data with real-time market information,
  implied volatility metrics, open interest tracking, and max pain calculations.
  
  ## New Tables
  
  ### `screener_stocks`
  Stores fundamental stock information for screener
  - `id` (uuid, primary key)
  - `ticker` (text, unique) - Stock symbol
  - `name` (text) - Full company name
  - `sector` (text) - Industry sector (BANK, IT, PHARMA, etc.)
  - `exchange` (text) - Trading exchange
  - `is_liquid` (boolean) - Whether stock has liquid options
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `screener_data`
  Real-time screener metrics and calculations
  - `id` (uuid, primary key)
  - `stock_id` (uuid, foreign key) - Reference to screener_stocks
  - `ticker` (text) - Stock ticker symbol
  - `expiry_date` (date) - Options expiry date
  - `fut_price` (numeric) - Futures price
  - `price_chg_pct` (numeric) - Price change percentage
  - `atm_iv` (numeric) - At-the-money implied volatility
  - `iv_chg` (numeric) - IV change from previous day
  - `ivp` (integer) - IV percentile (0-100)
  - `result_date` (text) - Earnings/result announcement date
  - `oi_chg_pct` (numeric) - Open interest change percentage
  - `pcr` (numeric) - Put-Call ratio
  - `max_pain` (numeric) - Max pain strike price
  - `oi_action` (text) - OI action type (Long Buildup, Short Cover, etc.)
  - `has_upcoming_event` (boolean) - Whether stock has upcoming event
  - `total_call_oi` (bigint) - Total call open interest
  - `total_put_oi` (bigint) - Total put open interest
  - `total_call_volume` (bigint) - Total call volume
  - `total_put_volume` (bigint) - Total put volume
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `screener_iv_history`
  Historical IV tracking for percentile calculations
  - `id` (uuid, primary key)
  - `ticker` (text)
  - `date` (date)
  - `atm_iv` (numeric)
  - `created_at` (timestamptz)
  
  ### `screener_oi_chain`
  Detailed open interest by strike for max pain calculation
  - `id` (uuid, primary key)
  - `ticker` (text)
  - `expiry_date` (date)
  - `strike_price` (numeric)
  - `call_oi` (bigint)
  - `put_oi` (bigint)
  - `call_volume` (bigint)
  - `put_volume` (bigint)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Public read access for screener data (authenticated users)
  - Admin-only write access for data updates
  
  ## Indexes
  - Optimized for quick filtering by ticker, sector, expiry
  - Composite indexes for common query patterns
*/

-- Create screener_stocks table
CREATE TABLE IF NOT EXISTS screener_stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text UNIQUE NOT NULL,
  name text NOT NULL,
  sector text NOT NULL,
  exchange text DEFAULT 'NSE',
  is_liquid boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create screener_data table
CREATE TABLE IF NOT EXISTS screener_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id uuid REFERENCES screener_stocks(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  expiry_date date NOT NULL,
  fut_price numeric NOT NULL DEFAULT 0,
  price_chg_pct numeric DEFAULT 0,
  atm_iv numeric DEFAULT 0,
  iv_chg numeric DEFAULT 0,
  ivp integer DEFAULT 0 CHECK (ivp >= 0 AND ivp <= 100),
  result_date text,
  oi_chg_pct numeric DEFAULT 0,
  pcr numeric DEFAULT 0,
  max_pain numeric DEFAULT 0,
  oi_action text CHECK (oi_action IN ('Long Buildup', 'Short Cover', 'Long Unwind', 'Short Buildup', 'Neutral')),
  has_upcoming_event boolean DEFAULT false,
  total_call_oi bigint DEFAULT 0,
  total_put_oi bigint DEFAULT 0,
  total_call_volume bigint DEFAULT 0,
  total_put_volume bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(ticker, expiry_date)
);

-- Create screener_iv_history table
CREATE TABLE IF NOT EXISTS screener_iv_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  date date NOT NULL,
  atm_iv numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ticker, date)
);

-- Create screener_oi_chain table
CREATE TABLE IF NOT EXISTS screener_oi_chain (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  expiry_date date NOT NULL,
  strike_price numeric NOT NULL,
  call_oi bigint DEFAULT 0,
  put_oi bigint DEFAULT 0,
  call_volume bigint DEFAULT 0,
  put_volume bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(ticker, expiry_date, strike_price)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_screener_data_ticker ON screener_data(ticker);
CREATE INDEX IF NOT EXISTS idx_screener_data_expiry ON screener_data(expiry_date);
CREATE INDEX IF NOT EXISTS idx_screener_data_ticker_expiry ON screener_data(ticker, expiry_date);
CREATE INDEX IF NOT EXISTS idx_screener_stocks_sector ON screener_stocks(sector);
CREATE INDEX IF NOT EXISTS idx_screener_stocks_ticker ON screener_stocks(ticker);
CREATE INDEX IF NOT EXISTS idx_screener_iv_history_ticker_date ON screener_iv_history(ticker, date);
CREATE INDEX IF NOT EXISTS idx_screener_oi_chain_ticker_expiry ON screener_oi_chain(ticker, expiry_date);

-- Enable Row Level Security
ALTER TABLE screener_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE screener_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE screener_iv_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE screener_oi_chain ENABLE ROW LEVEL SECURITY;

-- RLS Policies for screener_stocks
CREATE POLICY "Anyone can view screener stocks"
  ON screener_stocks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert screener stocks"
  ON screener_stocks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Only admins can update screener stocks"
  ON screener_stocks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for screener_data
CREATE POLICY "Anyone can view screener data"
  ON screener_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert screener data"
  ON screener_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Only admins can update screener data"
  ON screener_data FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for screener_iv_history
CREATE POLICY "Anyone can view IV history"
  ON screener_iv_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert IV history"
  ON screener_iv_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for screener_oi_chain
CREATE POLICY "Anyone can view OI chain"
  ON screener_oi_chain FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert OI chain"
  ON screener_oi_chain FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Only admins can update OI chain"
  ON screener_oi_chain FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_screener_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_screener_stocks_updated_at
  BEFORE UPDATE ON screener_stocks
  FOR EACH ROW
  EXECUTE FUNCTION update_screener_updated_at();

CREATE TRIGGER update_screener_data_updated_at
  BEFORE UPDATE ON screener_data
  FOR EACH ROW
  EXECUTE FUNCTION update_screener_updated_at();

CREATE TRIGGER update_screener_oi_chain_updated_at
  BEFORE UPDATE ON screener_oi_chain
  FOR EACH ROW
  EXECUTE FUNCTION update_screener_updated_at();
