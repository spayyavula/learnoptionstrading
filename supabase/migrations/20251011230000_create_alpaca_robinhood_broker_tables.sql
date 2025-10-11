/*
  # Create Alpaca and Robinhood Broker Integration Tables

  ## New Tables

  ### Alpaca Integration (5 tables)
  1. **alpaca_credentials** - Alpaca API credentials
     - user_id, account_id, api_key, api_secret (encrypted)
     - is_paper_trading, is_active

  2. **alpaca_account_info** - Alpaca account information
     - user_id, account_id, account_status
     - equity, cash, buying_power, day_trading_buying_power

  3. **alpaca_positions** - Current positions
     - user_id, account_id, symbol, asset_class
     - quantity, market_value, cost_basis, unrealized_pnl

  4. **alpaca_orders** - Order history
     - user_id, account_id, order_id, symbol
     - order_type, side, quantity, status

  5. **alpaca_trading_activity_log** - Activity tracking
     - user_id, account_id, activity_type, details

  ### Robinhood Integration (5 tables)
  1. **robinhood_credentials** - Robinhood credentials
     - user_id, account_id, access_token, refresh_token (encrypted)
     - device_token, is_active

  2. **robinhood_account_info** - Account information
     - user_id, account_id, account_number
     - equity, cash, unsettled_funds, buying_power

  3. **robinhood_positions** - Current positions
     - user_id, account_id, symbol, instrument_url
     - quantity, average_buy_price, market_value

  4. **robinhood_orders** - Order history
     - user_id, account_id, order_id, symbol
     - order_type, side, quantity, status

  5. **robinhood_trading_activity_log** - Activity tracking
     - user_id, account_id, activity_type, details

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Encrypted credential storage

  ## Indexes
  - Optimized for user_id and account_id queries
*/

-- ============================================================================
-- ALPACA TABLES
-- ============================================================================

-- Create alpaca_credentials table
CREATE TABLE IF NOT EXISTS alpaca_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id text NOT NULL,
  encrypted_api_key text NOT NULL,
  encrypted_api_secret text NOT NULL,
  is_paper_trading boolean DEFAULT true,
  is_active boolean DEFAULT true,
  api_endpoint text,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, account_id)
);

-- Create alpaca_account_info table
CREATE TABLE IF NOT EXISTS alpaca_account_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id text NOT NULL,
  account_number text,
  account_status text,
  pattern_day_trader boolean DEFAULT false,
  equity numeric DEFAULT 0,
  cash numeric DEFAULT 0,
  buying_power numeric DEFAULT 0,
  day_trading_buying_power numeric DEFAULT 0,
  regt_buying_power numeric DEFAULT 0,
  maintenance_margin numeric DEFAULT 0,
  multiplier text,
  portfolio_value numeric DEFAULT 0,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, account_id)
);

-- Create alpaca_positions table
CREATE TABLE IF NOT EXISTS alpaca_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id text NOT NULL,
  symbol text NOT NULL,
  asset_id text,
  asset_class text DEFAULT 'us_equity',
  exchange text,
  quantity numeric NOT NULL,
  side text CHECK (side IN ('long', 'short')),
  market_value numeric DEFAULT 0,
  cost_basis numeric DEFAULT 0,
  average_entry_price numeric,
  current_price numeric,
  unrealized_pnl numeric DEFAULT 0,
  unrealized_pnl_percent numeric DEFAULT 0,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create alpaca_orders table
CREATE TABLE IF NOT EXISTS alpaca_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id text NOT NULL,
  order_id text NOT NULL,
  client_order_id text,
  symbol text NOT NULL,
  asset_class text DEFAULT 'us_equity',
  order_type text NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit', 'trailing_stop')),
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  time_in_force text DEFAULT 'day' CHECK (time_in_force IN ('day', 'gtc', 'ioc', 'fok', 'opg', 'cls')),
  quantity numeric NOT NULL,
  filled_quantity numeric DEFAULT 0,
  limit_price numeric,
  stop_price numeric,
  trail_price numeric,
  trail_percent numeric,
  average_fill_price numeric,
  status text NOT NULL CHECK (status IN ('new', 'partially_filled', 'filled', 'done_for_day', 'canceled', 'expired', 'replaced', 'pending_cancel', 'pending_replace', 'pending_new', 'accepted', 'pending', 'rejected')),
  extended_hours boolean DEFAULT false,
  submitted_at timestamptz,
  filled_at timestamptz,
  canceled_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, account_id, order_id)
);

-- Create alpaca_trading_activity_log table
CREATE TABLE IF NOT EXISTS alpaca_trading_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id text NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('fill', 'transaction', 'order_placed', 'order_canceled', 'order_filled', 'dividend', 'transfer', 'sync', 'error')),
  activity_date date,
  symbol text,
  quantity numeric,
  price numeric,
  details jsonb,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- ROBINHOOD TABLES
-- ============================================================================

-- Create robinhood_credentials table
CREATE TABLE IF NOT EXISTS robinhood_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id text NOT NULL,
  encrypted_access_token text NOT NULL,
  encrypted_refresh_token text,
  device_token text,
  token_expires_at timestamptz,
  is_active boolean DEFAULT true,
  mfa_enabled boolean DEFAULT false,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, account_id)
);

-- Create robinhood_account_info table
CREATE TABLE IF NOT EXISTS robinhood_account_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id text NOT NULL,
  account_number text,
  account_url text,
  account_type text,
  pattern_day_trader boolean DEFAULT false,
  equity numeric DEFAULT 0,
  cash numeric DEFAULT 0,
  unsettled_funds numeric DEFAULT 0,
  buying_power numeric DEFAULT 0,
  cash_available_for_withdrawal numeric DEFAULT 0,
  portfolio_value numeric DEFAULT 0,
  margin_limit numeric DEFAULT 0,
  instant_allocated numeric DEFAULT 0,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, account_id)
);

-- Create robinhood_positions table
CREATE TABLE IF NOT EXISTS robinhood_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id text NOT NULL,
  symbol text NOT NULL,
  instrument_id text,
  instrument_url text,
  quantity numeric NOT NULL,
  shares_held_for_buys numeric DEFAULT 0,
  shares_held_for_sells numeric DEFAULT 0,
  average_buy_price numeric,
  intraday_average_buy_price numeric,
  current_price numeric,
  market_value numeric DEFAULT 0,
  equity numeric DEFAULT 0,
  percent_change numeric DEFAULT 0,
  unrealized_pnl numeric DEFAULT 0,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create robinhood_orders table
CREATE TABLE IF NOT EXISTS robinhood_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id text NOT NULL,
  order_id text NOT NULL,
  symbol text NOT NULL,
  instrument_url text,
  order_type text NOT NULL CHECK (order_type IN ('market', 'limit')),
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  time_in_force text DEFAULT 'gfd' CHECK (time_in_force IN ('gfd', 'gtc', 'ioc', 'opg')),
  quantity numeric NOT NULL,
  filled_quantity numeric DEFAULT 0,
  limit_price numeric,
  stop_price numeric,
  average_price numeric,
  status text NOT NULL CHECK (status IN ('queued', 'unconfirmed', 'confirmed', 'partially_filled', 'filled', 'rejected', 'canceled', 'failed')),
  trigger text CHECK (trigger IN ('immediate', 'stop')),
  extended_hours boolean DEFAULT false,
  override_day_trade_checks boolean DEFAULT false,
  created_at_robinhood timestamptz,
  updated_at_robinhood timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, account_id, order_id)
);

-- Create robinhood_trading_activity_log table
CREATE TABLE IF NOT EXISTS robinhood_trading_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id text NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('order_placed', 'order_filled', 'order_canceled', 'dividend', 'transfer', 'sync', 'error')),
  activity_date date,
  symbol text,
  quantity numeric,
  price numeric,
  details jsonb,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Alpaca indexes
CREATE INDEX IF NOT EXISTS idx_alpaca_credentials_user_id ON alpaca_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_alpaca_account_info_user_id ON alpaca_account_info(user_id);
CREATE INDEX IF NOT EXISTS idx_alpaca_positions_user_id ON alpaca_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_alpaca_positions_symbol ON alpaca_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_alpaca_orders_user_id ON alpaca_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_alpaca_orders_status ON alpaca_orders(status);
CREATE INDEX IF NOT EXISTS idx_alpaca_orders_symbol ON alpaca_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_alpaca_activity_log_user_id ON alpaca_trading_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_alpaca_activity_log_timestamp ON alpaca_trading_activity_log(timestamp DESC);

-- Robinhood indexes
CREATE INDEX IF NOT EXISTS idx_robinhood_credentials_user_id ON robinhood_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_robinhood_account_info_user_id ON robinhood_account_info(user_id);
CREATE INDEX IF NOT EXISTS idx_robinhood_positions_user_id ON robinhood_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_robinhood_positions_symbol ON robinhood_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_robinhood_orders_user_id ON robinhood_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_robinhood_orders_status ON robinhood_orders(status);
CREATE INDEX IF NOT EXISTS idx_robinhood_orders_symbol ON robinhood_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_robinhood_activity_log_user_id ON robinhood_trading_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_robinhood_activity_log_timestamp ON robinhood_trading_activity_log(timestamp DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE alpaca_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE alpaca_account_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE alpaca_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alpaca_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE alpaca_trading_activity_log ENABLE ROW LEVEL SECURITY;

ALTER TABLE robinhood_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE robinhood_account_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE robinhood_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE robinhood_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE robinhood_trading_activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - ALPACA
-- ============================================================================

-- alpaca_credentials policies
CREATE POLICY "Users can view own Alpaca credentials"
  ON alpaca_credentials FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Alpaca credentials"
  ON alpaca_credentials FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Alpaca credentials"
  ON alpaca_credentials FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Alpaca credentials"
  ON alpaca_credentials FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- alpaca_account_info policies
CREATE POLICY "Users can view own Alpaca account info"
  ON alpaca_account_info FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Alpaca account info"
  ON alpaca_account_info FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Alpaca account info"
  ON alpaca_account_info FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- alpaca_positions policies
CREATE POLICY "Users can view own Alpaca positions"
  ON alpaca_positions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Alpaca positions"
  ON alpaca_positions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Alpaca positions"
  ON alpaca_positions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Alpaca positions"
  ON alpaca_positions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- alpaca_orders policies
CREATE POLICY "Users can view own Alpaca orders"
  ON alpaca_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Alpaca orders"
  ON alpaca_orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Alpaca orders"
  ON alpaca_orders FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- alpaca_trading_activity_log policies
CREATE POLICY "Users can view own Alpaca activity log"
  ON alpaca_trading_activity_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Alpaca activity log"
  ON alpaca_trading_activity_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - ROBINHOOD
-- ============================================================================

-- robinhood_credentials policies
CREATE POLICY "Users can view own Robinhood credentials"
  ON robinhood_credentials FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Robinhood credentials"
  ON robinhood_credentials FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Robinhood credentials"
  ON robinhood_credentials FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Robinhood credentials"
  ON robinhood_credentials FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- robinhood_account_info policies
CREATE POLICY "Users can view own Robinhood account info"
  ON robinhood_account_info FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Robinhood account info"
  ON robinhood_account_info FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Robinhood account info"
  ON robinhood_account_info FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- robinhood_positions policies
CREATE POLICY "Users can view own Robinhood positions"
  ON robinhood_positions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Robinhood positions"
  ON robinhood_positions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Robinhood positions"
  ON robinhood_positions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Robinhood positions"
  ON robinhood_positions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- robinhood_orders policies
CREATE POLICY "Users can view own Robinhood orders"
  ON robinhood_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Robinhood orders"
  ON robinhood_orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Robinhood orders"
  ON robinhood_orders FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- robinhood_trading_activity_log policies
CREATE POLICY "Users can view own Robinhood activity log"
  ON robinhood_trading_activity_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Robinhood activity log"
  ON robinhood_trading_activity_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Alpaca triggers
CREATE TRIGGER update_alpaca_credentials_updated_at
  BEFORE UPDATE ON alpaca_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alpaca_account_info_updated_at
  BEFORE UPDATE ON alpaca_account_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alpaca_positions_updated_at
  BEFORE UPDATE ON alpaca_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alpaca_orders_updated_at
  BEFORE UPDATE ON alpaca_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Robinhood triggers
CREATE TRIGGER update_robinhood_credentials_updated_at
  BEFORE UPDATE ON robinhood_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_robinhood_account_info_updated_at
  BEFORE UPDATE ON robinhood_account_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_robinhood_positions_updated_at
  BEFORE UPDATE ON robinhood_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_robinhood_orders_updated_at
  BEFORE UPDATE ON robinhood_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
