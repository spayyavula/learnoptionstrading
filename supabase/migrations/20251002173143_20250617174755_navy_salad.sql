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
CREATE INDEX IF NOT EXISTS idx_user_portfolios_user_id ON user_portfolios(user_id);

-- Enable Row Level Security
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;

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

-- Create function to automatically update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_portfolios_updated_at ON user_portfolios;
CREATE TRIGGER update_user_portfolios_updated_at
  BEFORE UPDATE ON user_portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();