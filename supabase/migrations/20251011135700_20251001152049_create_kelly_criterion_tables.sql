/*
  # Create Kelly Criterion Trading Tables

  ## New Tables
  
  1. **user_trading_metrics** - Aggregated trading performance metrics
  2. **trade_history** - Individual completed trades

  ## Security
  - Enable RLS on both tables
  - Users can only read and write their own trading data

  ## Indexes
  - Index on user_id for fast user-specific queries
  - Index on created_at for time-based queries
  - Index on is_winner for performance calculations
*/

-- Create user_trading_metrics table
CREATE TABLE IF NOT EXISTS user_trading_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  total_trades integer DEFAULT 0,
  winning_trades integer DEFAULT 0,
  losing_trades integer DEFAULT 0,
  average_win decimal(10,2) DEFAULT 0,
  average_loss decimal(10,2) DEFAULT 0,
  win_rate decimal(5,4) DEFAULT 0,
  win_loss_ratio decimal(10,4) DEFAULT 0,
  kelly_percentage decimal(5,4) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_trading_metrics_user_id_key UNIQUE (user_id)
);

-- Create trade_history table
CREATE TABLE IF NOT EXISTS trade_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contract_ticker text NOT NULL,
  underlying_ticker text NOT NULL,
  trade_type text NOT NULL,
  entry_price decimal(10,2) NOT NULL,
  exit_price decimal(10,2) NOT NULL,
  quantity integer NOT NULL,
  profit_loss decimal(10,2) NOT NULL,
  profit_loss_percent decimal(10,4) NOT NULL,
  entry_date timestamptz NOT NULL,
  exit_date timestamptz NOT NULL,
  strategy_type text,
  is_winner boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_trading_metrics_user_id ON user_trading_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_user_id ON trade_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_created_at ON trade_history(created_at);
CREATE INDEX IF NOT EXISTS idx_trade_history_is_winner ON trade_history(is_winner);
CREATE INDEX IF NOT EXISTS idx_trade_history_exit_date ON trade_history(exit_date);

-- Enable Row Level Security
ALTER TABLE user_trading_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_trading_metrics
CREATE POLICY "Users can view own trading metrics"
  ON user_trading_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading metrics"
  ON user_trading_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trading metrics"
  ON user_trading_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for trade_history
CREATE POLICY "Users can view own trade history"
  ON trade_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trade history"
  ON trade_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trade history"
  ON trade_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trade history"
  ON trade_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for user_trading_metrics
DROP TRIGGER IF EXISTS update_user_trading_metrics_updated_at ON user_trading_metrics;
CREATE TRIGGER update_user_trading_metrics_updated_at
  BEFORE UPDATE ON user_trading_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();