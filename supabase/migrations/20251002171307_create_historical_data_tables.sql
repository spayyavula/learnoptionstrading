/*
  # Create Historical Data Tables

  ## Description
  Creates tables to store historical stock and options data for the options trading platform.
  These tables support the data collection cron job.

  ## New Tables
  1. `historical_data` - Stores historical stock price data
     - ticker, date, OHLCV (open, high, low, close, volume)
     - Unique constraint on (ticker, date)
  
  2. `options_historical_data` - Stores historical options contract data
     - contract_ticker, underlying_ticker, date
     - Pricing data: bid, ask, last
     - Volume and open interest
     - Greeks: delta, gamma, theta, vega, implied_volatility
     - Unique constraint on (contract_ticker, date)

  ## Security
  - RLS enabled on both tables
  - Public read access (market data is public)
  - Public insert/update access for data collection

  ## Indexes
  - Optimized for date-range queries
  - Support for ticker-based lookups
*/

-- Create historical_data table
CREATE TABLE IF NOT EXISTS historical_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  date date NOT NULL,
  open numeric NOT NULL,
  high numeric NOT NULL,
  low numeric NOT NULL,
  close numeric NOT NULL,
  volume bigint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(ticker, date)
);

-- Create options_historical_data table
CREATE TABLE IF NOT EXISTS options_historical_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_ticker text NOT NULL,
  underlying_ticker text NOT NULL,
  date date NOT NULL,
  bid numeric NOT NULL,
  ask numeric NOT NULL,
  last numeric NOT NULL,
  volume bigint NOT NULL DEFAULT 0,
  open_interest bigint NOT NULL DEFAULT 0,
  implied_volatility numeric NOT NULL DEFAULT 0,
  delta numeric NOT NULL DEFAULT 0,
  gamma numeric NOT NULL DEFAULT 0,
  theta numeric NOT NULL DEFAULT 0,
  vega numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(contract_ticker, date)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_historical_data_ticker_date ON historical_data(ticker, date DESC);
CREATE INDEX IF NOT EXISTS idx_historical_data_date ON historical_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_options_historical_data_contract_date ON options_historical_data(contract_ticker, date DESC);
CREATE INDEX IF NOT EXISTS idx_options_historical_data_underlying_date ON options_historical_data(underlying_ticker, date DESC);

-- Enable Row Level Security
ALTER TABLE historical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE options_historical_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable public read for historical_data" ON historical_data;
DROP POLICY IF EXISTS "Enable public insert for historical_data" ON historical_data;
DROP POLICY IF EXISTS "Enable public update for historical_data" ON historical_data;
DROP POLICY IF EXISTS "Enable public read for options_historical_data" ON options_historical_data;
DROP POLICY IF EXISTS "Enable public insert for options_historical_data" ON options_historical_data;
DROP POLICY IF EXISTS "Enable public update for options_historical_data" ON options_historical_data;

-- Create policies for historical_data
CREATE POLICY "Enable public read for historical_data"
  ON historical_data
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable public insert for historical_data"
  ON historical_data
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable public update for historical_data"
  ON historical_data
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policies for options_historical_data
CREATE POLICY "Enable public read for options_historical_data"
  ON options_historical_data
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable public insert for options_historical_data"
  ON options_historical_data
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable public update for options_historical_data"
  ON options_historical_data
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_historical_data_updated_at ON historical_data;
CREATE TRIGGER update_historical_data_updated_at
  BEFORE UPDATE ON historical_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_options_historical_data_updated_at ON options_historical_data;
CREATE TRIGGER update_options_historical_data_updated_at
  BEFORE UPDATE ON options_historical_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
