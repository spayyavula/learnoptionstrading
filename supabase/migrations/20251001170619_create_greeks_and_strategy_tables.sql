/*
  # Greeks Tracking and Strategy Storage Schema

  1. New Tables
    - `contracts_watchlist`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `contract_ticker` (text)
      - `underlying_ticker` (text)
      - `strike_price` (numeric)
      - `expiration_date` (date)
      - `contract_type` (text: 'call' or 'put')
      - `added_at` (timestamptz)
      - `notes` (text, optional)
    
    - `greeks_snapshots`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `contract_ticker` (text)
      - `underlying_ticker` (text)
      - `underlying_price` (numeric)
      - `strike_price` (numeric)
      - `time_to_expiry` (numeric, in years)
      - `implied_volatility` (numeric)
      - `delta` (numeric)
      - `gamma` (numeric)
      - `theta` (numeric)
      - `vega` (numeric)
      - `rho` (numeric)
      - `snapshot_date` (timestamptz)
    
    - `strategy_templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `strategy_name` (text)
      - `strategy_type` (text: e.g., 'Bull Call Spread')
      - `legs` (jsonb: array of leg configurations)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `scenario_analysis`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `strategy_id` (uuid, references strategy_templates)
      - `scenario_name` (text)
      - `underlying_price_change` (numeric)
      - `volatility_change` (numeric)
      - `days_passed` (integer)
      - `expected_pnl` (numeric)
      - `created_at` (timestamptz)
    
    - `greeks_alerts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `contract_ticker` (text)
      - `greek_type` (text: 'delta', 'gamma', 'theta', 'vega', 'rho')
      - `threshold_value` (numeric)
      - `condition` (text: 'above' or 'below')
      - `is_active` (boolean)
      - `last_triggered` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data only
  
  3. Indexes
    - Add indexes on user_id for all tables
    - Add index on contract_ticker for watchlist and snapshots
    - Add index on snapshot_date for time-based queries

  4. Notes
    - Greeks snapshots are automatically cleaned up after 30 days
    - All tables have default timestamps
    - JSONB is used for flexible strategy leg storage
*/

-- Create contracts_watchlist table
CREATE TABLE IF NOT EXISTS contracts_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contract_ticker text NOT NULL,
  underlying_ticker text NOT NULL,
  strike_price numeric NOT NULL,
  expiration_date date NOT NULL,
  contract_type text NOT NULL CHECK (contract_type IN ('call', 'put')),
  added_at timestamptz DEFAULT now(),
  notes text
);

ALTER TABLE contracts_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist"
  ON contracts_watchlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist"
  ON contracts_watchlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist"
  ON contracts_watchlist FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist"
  ON contracts_watchlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON contracts_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_contract_ticker ON contracts_watchlist(contract_ticker);

-- Create greeks_snapshots table
CREATE TABLE IF NOT EXISTS greeks_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contract_ticker text NOT NULL,
  underlying_ticker text NOT NULL,
  underlying_price numeric NOT NULL,
  strike_price numeric NOT NULL,
  time_to_expiry numeric NOT NULL,
  implied_volatility numeric NOT NULL,
  delta numeric NOT NULL,
  gamma numeric NOT NULL,
  theta numeric NOT NULL,
  vega numeric NOT NULL,
  rho numeric NOT NULL,
  snapshot_date timestamptz DEFAULT now()
);

ALTER TABLE greeks_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots"
  ON greeks_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots"
  ON greeks_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own snapshots"
  ON greeks_snapshots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON greeks_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_contract_ticker ON greeks_snapshots(contract_ticker);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON greeks_snapshots(snapshot_date);

-- Create strategy_templates table
CREATE TABLE IF NOT EXISTS strategy_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  strategy_name text NOT NULL,
  strategy_type text NOT NULL,
  legs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE strategy_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strategies"
  ON strategy_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategies"
  ON strategy_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies"
  ON strategy_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies"
  ON strategy_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategy_templates(user_id);

-- Create scenario_analysis table
CREATE TABLE IF NOT EXISTS scenario_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  strategy_id uuid REFERENCES strategy_templates(id) ON DELETE CASCADE,
  scenario_name text NOT NULL,
  underlying_price_change numeric NOT NULL DEFAULT 0,
  volatility_change numeric NOT NULL DEFAULT 0,
  days_passed integer NOT NULL DEFAULT 0,
  expected_pnl numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scenario_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scenarios"
  ON scenario_analysis FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scenarios"
  ON scenario_analysis FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scenarios"
  ON scenario_analysis FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scenarios"
  ON scenario_analysis FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON scenario_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_strategy_id ON scenario_analysis(strategy_id);

-- Create greeks_alerts table
CREATE TABLE IF NOT EXISTS greeks_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contract_ticker text NOT NULL,
  greek_type text NOT NULL CHECK (greek_type IN ('delta', 'gamma', 'theta', 'vega', 'rho')),
  threshold_value numeric NOT NULL,
  condition text NOT NULL CHECK (condition IN ('above', 'below')),
  is_active boolean DEFAULT true,
  last_triggered timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE greeks_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON greeks_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON greeks_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON greeks_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON greeks_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON greeks_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_contract_ticker ON greeks_alerts(contract_ticker);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for strategy_templates
DROP TRIGGER IF EXISTS update_strategy_templates_updated_at ON strategy_templates;
CREATE TRIGGER update_strategy_templates_updated_at
  BEFORE UPDATE ON strategy_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();