/*
  # Create Kelly Criterion Trading Tables

  ## Overview
  This migration creates tables to track user trading performance and calculate Kelly Criterion position sizing recommendations.

  ## New Tables
  
  ### `user_trading_metrics`
  Stores aggregated trading performance metrics for Kelly Criterion calculations.
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `total_trades` (integer) - Total number of completed trades
  - `winning_trades` (integer) - Number of profitable trades
  - `losing_trades` (integer) - Number of losing trades
  - `average_win` (decimal) - Average profit on winning trades
  - `average_loss` (decimal) - Average loss on losing trades (positive number)
  - `win_rate` (decimal) - Calculated win rate (winning_trades / total_trades)
  - `win_loss_ratio` (decimal) - Calculated ratio (average_win / average_loss)
  - `kelly_percentage` (decimal) - Calculated Kelly Criterion percentage
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `trade_history`
  Stores individual completed trades for performance tracking.
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `contract_ticker` (text) - Options contract ticker symbol
  - `underlying_ticker` (text) - Underlying asset ticker
  - `trade_type` (text) - Type of trade (buy_to_open, sell_to_close, etc.)
  - `entry_price` (decimal) - Entry price per contract
  - `exit_price` (decimal) - Exit price per contract
  - `quantity` (integer) - Number of contracts traded
  - `profit_loss` (decimal) - Total profit or loss on the trade
  - `profit_loss_percent` (decimal) - P&L as percentage of capital risked
  - `entry_date` (timestamptz) - Trade entry timestamp
  - `exit_date` (timestamptz) - Trade exit timestamp
  - `strategy_type` (text) - Strategy used (e.g., Bull Call Spread)
  - `is_winner` (boolean) - Whether trade was profitable
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on both tables
  - Users can only read and write their own trading data
  - Policies enforce user_id matches auth.uid()

  ## Indexes
  - Index on user_id for both tables for fast user-specific queries
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
  ON user_trading_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading metrics"
  ON user_trading_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trading metrics"
  ON user_trading_metrics
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for trade_history
CREATE POLICY "Users can view own trade history"
  ON trade_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trade history"
  ON trade_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trade history"
  ON trade_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trade history"
  ON trade_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_trading_metrics
DROP TRIGGER IF EXISTS update_user_trading_metrics_updated_at ON user_trading_metrics;
CREATE TRIGGER update_user_trading_metrics_updated_at
  BEFORE UPDATE ON user_trading_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();