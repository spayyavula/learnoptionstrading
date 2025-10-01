/*
  # Create Historical Data Tables

  1. New Tables
    - `historical_data`
      - `id` (uuid, primary key)
      - `ticker` (text, stock symbol)
      - `date` (date, trading date)
      - `open` (numeric, opening price)
      - `high` (numeric, high price)
      - `low` (numeric, low price)
      - `close` (numeric, closing price)
      - `volume` (bigint, trading volume)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `options_historical_data`
      - `id` (uuid, primary key)
      - `contract_ticker` (text, options contract symbol)
      - `underlying_ticker` (text, underlying stock symbol)
      - `date` (date, trading date)
      - `bid` (numeric, bid price)
      - `ask` (numeric, ask price)
      - `last` (numeric, last traded price)
      - `volume` (bigint, trading volume)
      - `open_interest` (bigint, open interest)
      - `implied_volatility` (numeric, implied volatility)
      - `delta` (numeric, delta greek)
      - `gamma` (numeric, gamma greek)
      - `theta` (numeric, theta greek)
      - `vega` (numeric, vega greek)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_portfolios`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `balance` (numeric, cash balance)
      - `buying_power` (numeric, available buying power)
      - `total_value` (numeric, total portfolio value)
      - `day_change` (numeric, daily change in value)
      - `day_change_percent` (numeric, daily change percentage)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access to historical data

  3. Indexes
    - Add indexes for efficient querying by ticker and date
    - Add composite indexes for common query patterns
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

-- Create user_portfolios table
CREATE TABLE IF NOT EXISTS user_portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 100000,
  buying_power numeric NOT NULL DEFAULT 100000,
  total_value numeric NOT NULL DEFAULT 100000,
  day_change numeric NOT NULL DEFAULT 0,
  day_change_percent numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_historical_data_ticker_date ON historical_data(ticker, date DESC);
CREATE INDEX IF NOT EXISTS idx_historical_data_date ON historical_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_options_historical_data_contract_date ON options_historical_data(contract_ticker, date DESC);
CREATE INDEX IF NOT EXISTS idx_options_historical_data_underlying_date ON options_historical_data(underlying_ticker, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_portfolios_user_id ON user_portfolios(user_id);

-- Enable Row Level Security
ALTER TABLE historical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE options_historical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;

-- Create policies for historical_data (public read access for demo purposes)
CREATE POLICY "Allow public read access to historical data"
  ON historical_data
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert historical data"
  ON historical_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for options_historical_data (public read access for demo purposes)
CREATE POLICY "Allow public read access to options historical data"
  ON options_historical_data
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert options historical data"
  ON options_historical_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for user_portfolios (users can only access their own data)
CREATE POLICY "Users can read own portfolio data"
  ON user_portfolios
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio data"
  ON user_portfolios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio data"
  ON user_portfolios
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_historical_data_updated_at
  BEFORE UPDATE ON historical_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_options_historical_data_updated_at
  BEFORE UPDATE ON options_historical_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_portfolios_updated_at
  BEFORE UPDATE ON user_portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();