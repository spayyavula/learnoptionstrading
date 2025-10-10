/*
  # Create Kelly Criterion Tracking Tables

  1. New Tables
    - `user_strategy_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `strategy_name` (text)
      - `default_kelly_type` (text: 'full', 'half', 'quarter')
      - `preferred_quantities` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `trade_kelly_metadata`
      - `id` (uuid, primary key)
      - `trade_id` (text)
      - `user_id` (uuid, references auth.users)
      - `strategy_name` (text)
      - `kelly_type_used` (text: 'full', 'half', 'quarter', 'custom')
      - `kelly_recommended_contracts` (integer)
      - `actual_contracts` (integer)
      - `buy_leg_premium` (numeric)
      - `sell_leg_premium` (numeric)
      - `net_debit` (numeric)
      - `kelly_percentage` (numeric)
      - `account_balance_at_trade` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Create indexes for performance

  3. Important Notes
    - These tables track Kelly Criterion usage for analyzing effectiveness over time
    - Data helps users understand if they're following recommendations
    - Future analytics can compare Kelly-sized vs custom-sized trade performance
*/

-- Create user_strategy_preferences table
CREATE TABLE IF NOT EXISTS user_strategy_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  strategy_name text NOT NULL,
  default_kelly_type text CHECK (default_kelly_type IN ('full', 'half', 'quarter')) DEFAULT 'half',
  preferred_quantities jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, strategy_name)
);

-- Create trade_kelly_metadata table
CREATE TABLE IF NOT EXISTS trade_kelly_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  strategy_name text NOT NULL,
  kelly_type_used text CHECK (kelly_type_used IN ('full', 'half', 'quarter', 'custom')) NOT NULL,
  kelly_recommended_contracts integer NOT NULL DEFAULT 0,
  actual_contracts integer NOT NULL,
  buy_leg_premium numeric(10, 2) NOT NULL,
  sell_leg_premium numeric(10, 2),
  net_debit numeric(10, 2) NOT NULL,
  kelly_percentage numeric(5, 4) NOT NULL,
  account_balance_at_trade numeric(12, 2) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_strategy_preferences_user_id
  ON user_strategy_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_strategy_preferences_strategy_name
  ON user_strategy_preferences(strategy_name);

CREATE INDEX IF NOT EXISTS idx_trade_kelly_metadata_user_id
  ON trade_kelly_metadata(user_id);

CREATE INDEX IF NOT EXISTS idx_trade_kelly_metadata_trade_id
  ON trade_kelly_metadata(trade_id);

CREATE INDEX IF NOT EXISTS idx_trade_kelly_metadata_strategy_name
  ON trade_kelly_metadata(strategy_name);

CREATE INDEX IF NOT EXISTS idx_trade_kelly_metadata_created_at
  ON trade_kelly_metadata(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_strategy_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_kelly_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_strategy_preferences
CREATE POLICY "Users can view own strategy preferences"
  ON user_strategy_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategy preferences"
  ON user_strategy_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategy preferences"
  ON user_strategy_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategy preferences"
  ON user_strategy_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for trade_kelly_metadata
CREATE POLICY "Users can view own kelly metadata"
  ON trade_kelly_metadata
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kelly metadata"
  ON trade_kelly_metadata
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_strategy_preferences
DROP TRIGGER IF EXISTS update_user_strategy_preferences_updated_at ON user_strategy_preferences;
CREATE TRIGGER update_user_strategy_preferences_updated_at
  BEFORE UPDATE ON user_strategy_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
