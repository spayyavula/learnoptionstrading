/*
  # Create Strategy Templates Tables

  1. New Tables
    - `strategy_templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `description` (text)
      - `type` (text) - bullish, bearish, neutral, volatility
      - `complexity` (text) - beginner, intermediate, advanced
      - `legs` (jsonb) - array of strategy legs
      - `max_risk` (numeric)
      - `max_profit` (numeric)
      - `breakeven` (jsonb) - array of breakeven points
      - `best_market_conditions` (jsonb) - array of strings
      - `worst_market_conditions` (jsonb) - array of strings
      - `time_decay` (text) - positive, negative, neutral
      - `volatility_impact` (text) - positive, negative, neutral
      - `instructions` (jsonb) - array of instruction strings
      - `examples` (jsonb) - array of example strings
      - `is_public` (boolean) - whether template is shared with community
      - `is_favorite` (boolean) - whether user favorited this template
      - `usage_count` (integer) - how many times template has been used
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `strategy_template_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `template_id` (uuid, foreign key to strategy_templates)
      - `underlying_ticker` (text)
      - `quantity` (integer)
      - `entry_date` (timestamptz)
      - `exit_date` (timestamptz)
      - `pnl` (numeric)
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can read their own templates and public templates
    - Users can create/update/delete their own templates
    - Users can create their own usage records
    - Public templates are read-only for non-owners
*/

-- Create strategy_templates table
CREATE TABLE IF NOT EXISTS strategy_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('bullish', 'bearish', 'neutral', 'volatility')),
  complexity text NOT NULL CHECK (complexity IN ('beginner', 'intermediate', 'advanced')),
  legs jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_risk numeric NOT NULL DEFAULT 0,
  max_profit numeric NOT NULL DEFAULT 0,
  breakeven jsonb NOT NULL DEFAULT '[]'::jsonb,
  best_market_conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  worst_market_conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  time_decay text NOT NULL CHECK (time_decay IN ('positive', 'negative', 'neutral')),
  volatility_impact text NOT NULL CHECK (volatility_impact IN ('positive', 'negative', 'neutral')),
  instructions jsonb DEFAULT '[]'::jsonb,
  examples jsonb DEFAULT '[]'::jsonb,
  is_public boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create strategy_template_usage table
CREATE TABLE IF NOT EXISTS strategy_template_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id uuid REFERENCES strategy_templates(id) ON DELETE CASCADE NOT NULL,
  underlying_ticker text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  entry_date timestamptz DEFAULT now(),
  exit_date timestamptz,
  pnl numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_strategy_templates_user_id ON strategy_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_templates_type ON strategy_templates(type);
CREATE INDEX IF NOT EXISTS idx_strategy_templates_is_public ON strategy_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_strategy_templates_is_favorite ON strategy_templates(is_favorite);
CREATE INDEX IF NOT EXISTS idx_strategy_template_usage_user_id ON strategy_template_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_template_usage_template_id ON strategy_template_usage(template_id);

-- Enable Row Level Security
ALTER TABLE strategy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_template_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for strategy_templates

-- Users can view their own templates and public templates
CREATE POLICY "Users can view own and public templates"
  ON strategy_templates
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR is_public = true
  );

-- Users can insert their own templates
CREATE POLICY "Users can create own templates"
  ON strategy_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
  ON strategy_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
  ON strategy_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for strategy_template_usage

-- Users can view their own usage records
CREATE POLICY "Users can view own usage records"
  ON strategy_template_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own usage records
CREATE POLICY "Users can create own usage records"
  ON strategy_template_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage records
CREATE POLICY "Users can update own usage records"
  ON strategy_template_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own usage records
CREATE POLICY "Users can delete own usage records"
  ON strategy_template_usage
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_strategy_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_strategy_templates_updated_at ON strategy_templates;
CREATE TRIGGER update_strategy_templates_updated_at
  BEFORE UPDATE ON strategy_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_strategy_template_updated_at();

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE strategy_templates
  SET usage_count = usage_count + 1
  WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment usage count when usage record is created
DROP TRIGGER IF EXISTS increment_usage_count ON strategy_template_usage;
CREATE TRIGGER increment_usage_count
  AFTER INSERT ON strategy_template_usage
  FOR EACH ROW
  EXECUTE FUNCTION increment_template_usage_count();
