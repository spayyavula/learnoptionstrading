/*
  # Create Core Tables for Options Trading Platform

  1. New Tables
    - `historical_data` - Stock price history
    - `options_historical_data` - Options price and greeks history
    - `user_portfolios` - User portfolio balances
    - `saved_strategies` - User's saved options strategies
    - `strategy_templates` - Pre-made strategy templates
    - `strategy_shares` - Shareable strategy links

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Public read access for historical data
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

-- Create saved_strategies table
CREATE TABLE IF NOT EXISTS saved_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  strategy_name text NOT NULL,
  custom_name text,
  underlying_ticker text NOT NULL,
  expiration_date date NOT NULL,
  legs jsonb NOT NULL DEFAULT '[]'::jsonb,
  validation_result jsonb,
  notes text,
  is_favorite boolean DEFAULT false,
  is_template boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create strategy_templates table
CREATE TABLE IF NOT EXISTS strategy_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  strategy_type text NOT NULL,
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  legs_config jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create strategy_shares table
CREATE TABLE IF NOT EXISTS strategy_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid REFERENCES saved_strategies(id) ON DELETE CASCADE NOT NULL,
  share_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  shared_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  view_count integer DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_historical_data_ticker_date ON historical_data(ticker, date DESC);
CREATE INDEX IF NOT EXISTS idx_options_historical_data_contract_date ON options_historical_data(contract_ticker, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_portfolios_user_id ON user_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_strategies_user_id ON saved_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_strategies_underlying ON saved_strategies(underlying_ticker);
CREATE INDEX IF NOT EXISTS idx_strategy_shares_token ON strategy_shares(share_token);

-- Enable RLS
ALTER TABLE historical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE options_historical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_shares ENABLE ROW LEVEL SECURITY;

-- Policies for historical_data
CREATE POLICY "Allow public read access to historical data"
  ON historical_data FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert historical data"
  ON historical_data FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for options_historical_data
CREATE POLICY "Allow public read access to options historical data"
  ON options_historical_data FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert options historical data"
  ON options_historical_data FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for user_portfolios
CREATE POLICY "Users can read own portfolio data"
  ON user_portfolios FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio data"
  ON user_portfolios FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio data"
  ON user_portfolios FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for saved_strategies
CREATE POLICY "Users can view own strategies"
  ON saved_strategies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategies"
  ON saved_strategies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies"
  ON saved_strategies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies"
  ON saved_strategies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for strategy_templates
CREATE POLICY "Anyone can view public templates"
  ON strategy_templates FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Authenticated users can create templates"
  ON strategy_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policies for strategy_shares
CREATE POLICY "Users can view shares they created"
  ON strategy_shares FOR SELECT
  TO authenticated
  USING (auth.uid() = shared_by);

CREATE POLICY "Users can create shares for own strategies"
  ON strategy_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = shared_by AND
    EXISTS (
      SELECT 1 FROM saved_strategies
      WHERE id = strategy_id AND user_id = auth.uid()
    )
  );

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
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

CREATE TRIGGER update_saved_strategies_updated_at
  BEFORE UPDATE ON saved_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategy_templates_updated_at
  BEFORE UPDATE ON strategy_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default strategy templates
INSERT INTO strategy_templates (name, description, strategy_type, is_public, legs_config)
VALUES
  (
    'Conservative Bull Call Spread',
    'A low-risk bull call spread with strikes close to current price',
    'Bull Call Spread',
    true,
    '{"legs": [{"action": "buy", "type": "call", "strike_offset": 0}, {"action": "sell", "type": "call", "strike_offset": 5}]}'::jsonb
  ),
  (
    'Wide Iron Condor',
    'A wide iron condor for range-bound markets with high probability',
    'Iron Condor',
    true,
    '{"legs": [{"action": "buy", "type": "put", "strike_offset": -15}, {"action": "sell", "type": "put", "strike_offset": -10}, {"action": "sell", "type": "call", "strike_offset": 10}, {"action": "buy", "type": "call", "strike_offset": 15}]}'::jsonb
  ),
  (
    'ATM Straddle',
    'An at-the-money straddle for volatile markets',
    'Long Straddle',
    true,
    '{"legs": [{"action": "buy", "type": "call", "strike_offset": 0}, {"action": "buy", "type": "put", "strike_offset": 0}]}'::jsonb
  )
ON CONFLICT DO NOTHING;
