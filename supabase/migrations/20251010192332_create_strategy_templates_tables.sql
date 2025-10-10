/*
  # Strategy Templates and User Strategies

  1. New Tables
    - `strategy_templates`
      - `id` (text, primary key) - Unique identifier for the template
      - `name` (text) - Display name of the strategy
      - `description` (text) - Description of the strategy
      - `type` (text) - Strategy type: bullish, bearish, neutral, volatility
      - `complexity` (text) - beginner, intermediate, advanced
      - `max_risk` (numeric) - Maximum risk amount
      - `max_profit` (numeric) - Maximum profit amount (Infinity represented as -1)
      - `time_decay` (text) - positive, negative, neutral
      - `volatility_impact` (text) - positive, negative, neutral
      - `instructions` (jsonb) - Array of instruction strings
      - `examples` (jsonb) - Array of example strings
      - `best_conditions` (jsonb) - Array of best market conditions
      - `worst_conditions` (jsonb) - Array of worst market conditions
      - `legs` (jsonb) - Array of strategy leg definitions
      - `breakeven_points` (jsonb) - Array of breakeven prices
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_strategy_instances`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `template_id` (text, foreign key to strategy_templates)
      - `underlying_ticker` (text) - The stock/ETF symbol
      - `entry_date` (timestamptz) - When the strategy was entered
      - `exit_date` (timestamptz) - When the strategy was exited
      - `status` (text) - active, closed, expired
      - `entry_price` (numeric) - Total entry cost
      - `exit_price` (numeric) - Total exit value
      - `pnl` (numeric) - Profit/loss
      - `notes` (text) - User notes about the trade
      - `legs_data` (jsonb) - Actual contract details used
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - strategy_templates is read-only for all authenticated users
    - user_strategy_instances accessible only by the user who created them
*/

-- Create strategy_templates table
CREATE TABLE IF NOT EXISTS strategy_templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('bullish', 'bearish', 'neutral', 'volatility')),
  complexity text NOT NULL CHECK (complexity IN ('beginner', 'intermediate', 'advanced')),
  max_risk numeric NOT NULL DEFAULT 0,
  max_profit numeric NOT NULL DEFAULT 0,
  time_decay text NOT NULL CHECK (time_decay IN ('positive', 'negative', 'neutral')),
  volatility_impact text NOT NULL CHECK (volatility_impact IN ('positive', 'negative', 'neutral')),
  instructions jsonb DEFAULT '[]'::jsonb,
  examples jsonb DEFAULT '[]'::jsonb,
  best_conditions jsonb DEFAULT '[]'::jsonb,
  worst_conditions jsonb DEFAULT '[]'::jsonb,
  legs jsonb NOT NULL DEFAULT '[]'::jsonb,
  breakeven_points jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_strategy_instances table
CREATE TABLE IF NOT EXISTS user_strategy_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id text REFERENCES strategy_templates(id) ON DELETE SET NULL,
  underlying_ticker text NOT NULL,
  entry_date timestamptz DEFAULT now(),
  exit_date timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')),
  entry_price numeric NOT NULL DEFAULT 0,
  exit_price numeric DEFAULT 0,
  pnl numeric DEFAULT 0,
  notes text,
  legs_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_strategy_templates_type ON strategy_templates(type);
CREATE INDEX IF NOT EXISTS idx_strategy_templates_complexity ON strategy_templates(complexity);
CREATE INDEX IF NOT EXISTS idx_user_strategy_instances_user_id ON user_strategy_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_strategy_instances_template_id ON user_strategy_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_user_strategy_instances_status ON user_strategy_instances(status);
CREATE INDEX IF NOT EXISTS idx_user_strategy_instances_entry_date ON user_strategy_instances(entry_date DESC);

-- Enable Row Level Security
ALTER TABLE strategy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_strategy_instances ENABLE ROW LEVEL SECURITY;

-- Policies for strategy_templates (read-only for authenticated users)
CREATE POLICY "Anyone can view strategy templates"
  ON strategy_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for user_strategy_instances
CREATE POLICY "Users can view own strategy instances"
  ON user_strategy_instances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own strategy instances"
  ON user_strategy_instances
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategy instances"
  ON user_strategy_instances
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategy instances"
  ON user_strategy_instances
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_strategy_templates_updated_at ON strategy_templates;
CREATE TRIGGER update_strategy_templates_updated_at
  BEFORE UPDATE ON strategy_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_strategy_instances_updated_at ON user_strategy_instances;
CREATE TRIGGER update_user_strategy_instances_updated_at
  BEFORE UPDATE ON user_strategy_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
