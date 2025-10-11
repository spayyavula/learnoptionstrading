/*
  # Saved Multi-Leg Strategies Schema

  1. New Tables
    - `saved_strategies` - User-saved multi-leg option strategies
    - `strategy_templates` - Public and private strategy templates
    - `strategy_shares` - Shareable strategy links

  2. Security
    - Enable RLS on all tables
    - Users can only access their own saved strategies
    - Public templates are readable by all authenticated users
*/

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
CREATE INDEX IF NOT EXISTS idx_saved_strategies_user_id ON saved_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_strategies_underlying ON saved_strategies(underlying_ticker);
CREATE INDEX IF NOT EXISTS idx_saved_strategies_strategy_name ON saved_strategies(strategy_name);
CREATE INDEX IF NOT EXISTS idx_saved_strategies_is_favorite ON saved_strategies(is_favorite);
CREATE INDEX IF NOT EXISTS idx_strategy_shares_token ON strategy_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_strategy_templates_public ON strategy_templates(is_public);

-- Enable Row Level Security
ALTER TABLE saved_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_shares ENABLE ROW LEVEL SECURITY;

-- Policies for saved_strategies
CREATE POLICY "Users can view own strategies"
  ON saved_strategies FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategies"
  ON saved_strategies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies"
  ON saved_strategies FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies"
  ON saved_strategies FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Policies for strategy_templates
CREATE POLICY "Anyone can view public templates"
  ON strategy_templates FOR SELECT TO authenticated
  USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Authenticated users can create templates"
  ON strategy_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Template creators can update own templates"
  ON strategy_templates FOR UPDATE TO authenticated
  USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Template creators can delete own templates"
  ON strategy_templates FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- Policies for strategy_shares
CREATE POLICY "Users can view shares they created"
  ON strategy_shares FOR SELECT TO authenticated
  USING (auth.uid() = shared_by);

CREATE POLICY "Users can create shares for own strategies"
  ON strategy_shares FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = shared_by AND
    EXISTS (SELECT 1 FROM saved_strategies WHERE id = strategy_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own shares"
  ON strategy_shares FOR DELETE TO authenticated
  USING (auth.uid() = shared_by);

-- Triggers
CREATE TRIGGER update_saved_strategies_updated_at
  BEFORE UPDATE ON saved_strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategy_templates_updated_at
  BEFORE UPDATE ON strategy_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default public templates
INSERT INTO strategy_templates (name, description, strategy_type, is_public, legs_config)
VALUES
  ('Conservative Bull Call Spread', 'A low-risk bull call spread with strikes close to current price', 'Bull Call Spread', true, '{"legs": [{"action": "buy", "type": "call", "strike_offset": 0}, {"action": "sell", "type": "call", "strike_offset": 5}]}'::jsonb),
  ('Wide Iron Condor', 'A wide iron condor for range-bound markets with high probability', 'Iron Condor', true, '{"legs": [{"action": "buy", "type": "put", "strike_offset": -15}, {"action": "sell", "type": "put", "strike_offset": -10}, {"action": "sell", "type": "call", "strike_offset": 10}, {"action": "buy", "type": "call", "strike_offset": 15}]}'::jsonb),
  ('ATM Straddle', 'An at-the-money straddle for volatile markets', 'Long Straddle', true, '{"legs": [{"action": "buy", "type": "call", "strike_offset": 0}, {"action": "buy", "type": "put", "strike_offset": 0}]}'::jsonb)
ON CONFLICT DO NOTHING;