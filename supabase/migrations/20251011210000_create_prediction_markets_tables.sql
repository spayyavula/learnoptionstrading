-- Create Prediction Markets (Kalshi Integration) Tables
-- This migration creates tables for managing prediction market contracts,
-- positions, and orders through Kalshi API (as used by Robinhood Prediction Markets)

-- =====================================================
-- 1. Kalshi Credentials Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kalshi_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_encrypted text NOT NULL,
  encryption_iv text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('live', 'demo')),
  is_active boolean DEFAULT true NOT NULL,
  last_validated_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, environment)
);

-- =====================================================
-- 2. Kalshi Account Info Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kalshi_account_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id text NOT NULL,
  account_status text,
  balance numeric(20,2) DEFAULT 0,
  available_balance numeric(20,2) DEFAULT 0,
  portfolio_value numeric(20,2) DEFAULT 0,
  total_pnl numeric(20,2) DEFAULT 0,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================
-- 3. Prediction Markets Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.prediction_markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_ticker text NOT NULL UNIQUE,
  market_title text NOT NULL,
  market_category text,
  market_type text,
  series_ticker text,
  event_ticker text,
  description text,
  settlement_value numeric(10,4),
  settlement_date timestamptz,
  open_time timestamptz,
  close_time timestamptz,
  expiration_time timestamptz,
  status text NOT NULL CHECK (status IN ('active', 'closed', 'settled', 'expired')),
  yes_bid numeric(10,4),
  yes_ask numeric(10,4),
  yes_price numeric(10,4),
  no_bid numeric(10,4),
  no_ask numeric(10,4),
  no_price numeric(10,4),
  volume bigint DEFAULT 0,
  open_interest bigint DEFAULT 0,
  strike_type text,
  floor_strike numeric(10,4),
  cap_strike numeric(10,4),
  metadata jsonb,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================
-- 4. User Prediction Market Positions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.prediction_market_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_ticker text NOT NULL REFERENCES public.prediction_markets(market_ticker) ON DELETE CASCADE,
  position_side text NOT NULL CHECK (position_side IN ('yes', 'no')),
  quantity integer NOT NULL DEFAULT 0,
  average_price numeric(10,4) NOT NULL,
  total_cost numeric(20,2) NOT NULL,
  current_value numeric(20,2),
  unrealized_pnl numeric(20,2),
  realized_pnl numeric(20,2) DEFAULT 0,
  opened_at timestamptz DEFAULT now() NOT NULL,
  last_updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, market_ticker, position_side)
);

-- =====================================================
-- 5. Prediction Market Orders Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.prediction_market_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kalshi_order_id text UNIQUE,
  market_ticker text NOT NULL REFERENCES public.prediction_markets(market_ticker) ON DELETE CASCADE,
  order_type text NOT NULL CHECK (order_type IN ('market', 'limit')),
  side text NOT NULL CHECK (side IN ('yes', 'no')),
  action text NOT NULL CHECK (action IN ('buy', 'sell')),
  quantity integer NOT NULL,
  limit_price numeric(10,4),
  filled_quantity integer DEFAULT 0,
  remaining_quantity integer,
  average_fill_price numeric(10,4),
  status text NOT NULL CHECK (status IN ('pending', 'open', 'partially_filled', 'filled', 'cancelled', 'rejected', 'expired')),
  time_in_force text DEFAULT 'gtc' CHECK (time_in_force IN ('gtc', 'ioc', 'fok')),
  client_order_id text,
  error_message text,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  filled_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================
-- 6. Prediction Market Trades Table (Execution History)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.prediction_market_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.prediction_market_orders(id) ON DELETE CASCADE,
  kalshi_trade_id text UNIQUE,
  market_ticker text NOT NULL REFERENCES public.prediction_markets(market_ticker) ON DELETE CASCADE,
  side text NOT NULL CHECK (side IN ('yes', 'no')),
  action text NOT NULL CHECK (action IN ('buy', 'sell')),
  quantity integer NOT NULL,
  price numeric(10,4) NOT NULL,
  total_value numeric(20,2) NOT NULL,
  fees numeric(20,2) DEFAULT 0,
  trade_timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================
-- 7. Market Price History Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.prediction_market_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_ticker text NOT NULL REFERENCES public.prediction_markets(market_ticker) ON DELETE CASCADE,
  yes_price numeric(10,4),
  no_price numeric(10,4),
  volume bigint,
  open_interest bigint,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================
-- 8. Prediction Markets Activity Log
-- =====================================================
CREATE TABLE IF NOT EXISTS public.prediction_markets_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  market_ticker text,
  environment text,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================
-- 9. Market Categories/Series Reference Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.prediction_market_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_ticker text NOT NULL UNIQUE,
  title text NOT NULL,
  category text,
  description text,
  frequency text,
  tags text[],
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Kalshi Credentials
CREATE INDEX idx_kalshi_credentials_user_id ON public.kalshi_credentials(user_id);
CREATE INDEX idx_kalshi_credentials_environment ON public.kalshi_credentials(environment);

-- Account Info
CREATE INDEX idx_kalshi_account_info_user_id ON public.kalshi_account_info(user_id);

-- Markets
CREATE INDEX idx_prediction_markets_ticker ON public.prediction_markets(market_ticker);
CREATE INDEX idx_prediction_markets_status ON public.prediction_markets(status);
CREATE INDEX idx_prediction_markets_category ON public.prediction_markets(market_category);
CREATE INDEX idx_prediction_markets_expiration ON public.prediction_markets(expiration_time);
CREATE INDEX idx_prediction_markets_series ON public.prediction_markets(series_ticker);

-- Positions
CREATE INDEX idx_prediction_positions_user_id ON public.prediction_market_positions(user_id);
CREATE INDEX idx_prediction_positions_market ON public.prediction_market_positions(market_ticker);
CREATE INDEX idx_prediction_positions_user_market ON public.prediction_market_positions(user_id, market_ticker);

-- Orders
CREATE INDEX idx_prediction_orders_user_id ON public.prediction_market_orders(user_id);
CREATE INDEX idx_prediction_orders_market ON public.prediction_market_orders(market_ticker);
CREATE INDEX idx_prediction_orders_status ON public.prediction_market_orders(status);
CREATE INDEX idx_prediction_orders_submitted ON public.prediction_market_orders(submitted_at DESC);

-- Trades
CREATE INDEX idx_prediction_trades_user_id ON public.prediction_market_trades(user_id);
CREATE INDEX idx_prediction_trades_order_id ON public.prediction_market_trades(order_id);
CREATE INDEX idx_prediction_trades_market ON public.prediction_market_trades(market_ticker);
CREATE INDEX idx_prediction_trades_timestamp ON public.prediction_market_trades(trade_timestamp DESC);

-- Price History
CREATE INDEX idx_price_history_market ON public.prediction_market_price_history(market_ticker);
CREATE INDEX idx_price_history_timestamp ON public.prediction_market_price_history(timestamp DESC);
CREATE INDEX idx_price_history_market_time ON public.prediction_market_price_history(market_ticker, timestamp DESC);

-- Activity Log
CREATE INDEX idx_prediction_activity_user_id ON public.prediction_markets_activity_log(user_id);
CREATE INDEX idx_prediction_activity_type ON public.prediction_markets_activity_log(activity_type);
CREATE INDEX idx_prediction_activity_created ON public.prediction_markets_activity_log(created_at DESC);

-- Market Series
CREATE INDEX idx_market_series_ticker ON public.prediction_market_series(series_ticker);
CREATE INDEX idx_market_series_category ON public.prediction_market_series(category);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.kalshi_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kalshi_account_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_market_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_market_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_market_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_market_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_markets_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_market_series ENABLE ROW LEVEL SECURITY;

-- Kalshi Credentials Policies
CREATE POLICY kalshi_credentials_select ON public.kalshi_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY kalshi_credentials_insert ON public.kalshi_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY kalshi_credentials_update ON public.kalshi_credentials
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY kalshi_credentials_delete ON public.kalshi_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- Account Info Policies
CREATE POLICY kalshi_account_select ON public.kalshi_account_info
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY kalshi_account_insert ON public.kalshi_account_info
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY kalshi_account_update ON public.kalshi_account_info
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Markets Policies (Public Read)
CREATE POLICY prediction_markets_select ON public.prediction_markets
  FOR SELECT USING (true); -- All users can read market data

CREATE POLICY prediction_markets_insert ON public.prediction_markets
  FOR INSERT WITH CHECK (true); -- System can insert

CREATE POLICY prediction_markets_update ON public.prediction_markets
  FOR UPDATE USING (true) WITH CHECK (true); -- System can update

-- Positions Policies
CREATE POLICY prediction_positions_select ON public.prediction_market_positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY prediction_positions_insert ON public.prediction_market_positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY prediction_positions_update ON public.prediction_market_positions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Orders Policies
CREATE POLICY prediction_orders_select ON public.prediction_market_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY prediction_orders_insert ON public.prediction_market_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY prediction_orders_update ON public.prediction_market_orders
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trades Policies
CREATE POLICY prediction_trades_select ON public.prediction_market_trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY prediction_trades_insert ON public.prediction_market_trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Price History Policies (Public Read)
CREATE POLICY price_history_select ON public.prediction_market_price_history
  FOR SELECT USING (true);

CREATE POLICY price_history_insert ON public.prediction_market_price_history
  FOR INSERT WITH CHECK (true);

-- Activity Log Policies
CREATE POLICY activity_log_select ON public.prediction_markets_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY activity_log_insert ON public.prediction_markets_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Market Series Policies (Public Read)
CREATE POLICY market_series_select ON public.prediction_market_series
  FOR SELECT USING (true);

CREATE POLICY market_series_insert ON public.prediction_market_series
  FOR INSERT WITH CHECK (true);

CREATE POLICY market_series_update ON public.prediction_market_series
  FOR UPDATE USING (true) WITH CHECK (true);

-- =====================================================
-- Updated_at Triggers
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kalshi_credentials_updated_at BEFORE UPDATE ON public.kalshi_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kalshi_account_updated_at BEFORE UPDATE ON public.kalshi_account_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prediction_markets_updated_at BEFORE UPDATE ON public.prediction_markets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prediction_positions_updated_at BEFORE UPDATE ON public.prediction_market_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prediction_orders_updated_at BEFORE UPDATE ON public.prediction_market_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_series_updated_at BEFORE UPDATE ON public.prediction_market_series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE public.kalshi_credentials IS 'Encrypted Kalshi API credentials for prediction markets access';
COMMENT ON TABLE public.kalshi_account_info IS 'Kalshi account balance and portfolio information';
COMMENT ON TABLE public.prediction_markets IS 'Available prediction market contracts from Kalshi';
COMMENT ON TABLE public.prediction_market_positions IS 'User positions in prediction markets';
COMMENT ON TABLE public.prediction_market_orders IS 'Order history for prediction market contracts';
COMMENT ON TABLE public.prediction_market_trades IS 'Executed trades and fills for prediction market orders';
COMMENT ON TABLE public.prediction_market_price_history IS 'Historical price data for prediction markets';
COMMENT ON TABLE public.prediction_markets_activity_log IS 'Audit trail for prediction market activities';
COMMENT ON TABLE public.prediction_market_series IS 'Market categories and series information';
