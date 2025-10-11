/*
  # Complete Interactive Brokers Integration Tables

  This migration creates all tables needed for full IBKR Client Portal API integration:
  - ibkr_credentials: Gateway connection details and user credentials
  - ibkr_account_info: Account details and buying power
  - ibkr_positions: Synced positions from IBKR
  - ibkr_orders: Order tracking and history
  - ibkr_session_tracking: Gateway session management
  - ibkr_trading_activity_log: Activity audit trail
  - ibkr_compliance_acknowledgments: Regulatory compliance tracking

  ## Tables Created

  1. ibkr_credentials - Encrypted gateway connection configuration
  2. ibkr_account_info - Account metadata and buying power
  3. ibkr_positions - Real-time position sync
  4. ibkr_orders - Order history and status
  5. ibkr_session_tracking - Session lifecycle management
  6. ibkr_trading_activity_log - Audit trail for all activities
  7. ibkr_compliance_acknowledgments - User compliance acknowledgments

  ## Security

  - RLS enabled on all tables
  - Users can only access their own data
  - Credentials encrypted with AES-256
  - Indexes for performance
*/

-- Create ibkr_credentials table
CREATE TABLE IF NOT EXISTS ibkr_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gateway_host text DEFAULT 'localhost',
  gateway_port integer DEFAULT 5000,
  gateway_ssl boolean DEFAULT true,
  paper_username text,
  live_username text,
  credentials_encrypted text NOT NULL,
  encryption_iv text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('paper', 'live')),
  is_active boolean DEFAULT true,
  options_trading_level integer DEFAULT 0 CHECK (options_trading_level >= 0 AND options_trading_level <= 3),
  compliance_acknowledged boolean DEFAULT false,
  compliance_acknowledged_at timestamptz,
  last_validated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, environment)
);

-- Create ibkr_account_info table
CREATE TABLE IF NOT EXISTS ibkr_account_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  account_number text,
  account_id text,
  account_status text,
  trading_level integer DEFAULT 0 CHECK (trading_level >= 0 AND trading_level <= 3),
  buying_power numeric(20, 2) DEFAULT 0,
  options_buying_power numeric(20, 2) DEFAULT 0,
  pattern_day_trader boolean DEFAULT false,
  day_trade_count integer DEFAULT 0,
  equity numeric(20, 2) DEFAULT 0,
  cash numeric(20, 2) DEFAULT 0,
  portfolio_value numeric(20, 2) DEFAULT 0,
  net_liquidation numeric(20, 2) DEFAULT 0,
  available_funds numeric(20, 2) DEFAULT 0,
  excess_liquidity numeric(20, 2) DEFAULT 0,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ibkr_positions table
CREATE TABLE IF NOT EXISTS ibkr_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id text NOT NULL,
  conid bigint,
  symbol text NOT NULL,
  underlying_symbol text,
  asset_class text DEFAULT 'OPT',
  quantity numeric(20, 8) NOT NULL,
  avg_entry_price numeric(20, 4),
  current_price numeric(20, 4),
  market_value numeric(20, 2),
  cost_basis numeric(20, 2),
  unrealized_pl numeric(20, 2),
  unrealized_plpc numeric(10, 4),
  realized_pl numeric(20, 2),
  side text CHECK (side IN ('long', 'short')),
  contract_type text CHECK (contract_type IN ('call', 'put', 'C', 'P')),
  strike_price numeric(20, 4),
  expiration_date date,
  multiplier integer DEFAULT 100,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, account_id, conid)
);

-- Create ibkr_orders table
CREATE TABLE IF NOT EXISTS ibkr_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id text NOT NULL,
  ibkr_order_id text,
  client_order_id text,
  conid bigint,
  symbol text NOT NULL,
  underlying_symbol text,
  asset_class text DEFAULT 'OPT',
  order_type text NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit', 'MKT', 'LMT', 'STP', 'STPLMT')),
  side text NOT NULL CHECK (side IN ('buy', 'sell', 'BUY', 'SELL')),
  time_in_force text DEFAULT 'DAY',
  quantity numeric(20, 8) NOT NULL,
  limit_price numeric(20, 4),
  stop_price numeric(20, 4),
  filled_qty numeric(20, 8) DEFAULT 0,
  filled_avg_price numeric(20, 4),
  remaining_qty numeric(20, 8),
  status text DEFAULT 'pending',
  order_ref text,
  parent_order_id text,
  error_message text,
  warning_message text,
  submitted_at timestamptz,
  filled_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ibkr_session_tracking table
CREATE TABLE IF NOT EXISTS ibkr_session_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id text,
  account_id text,
  environment text NOT NULL CHECK (environment IN ('paper', 'live')),
  gateway_status text DEFAULT 'disconnected',
  authenticated boolean DEFAULT false,
  connected boolean DEFAULT false,
  competing boolean DEFAULT false,
  message text,
  last_tickle_at timestamptz,
  last_auth_check_at timestamptz,
  session_started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ibkr_trading_activity_log table
CREATE TABLE IF NOT EXISTS ibkr_trading_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('paper', 'live')),
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create ibkr_compliance_acknowledgments table
CREATE TABLE IF NOT EXISTS ibkr_compliance_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  disclosure_type text NOT NULL,
  disclosure_version text NOT NULL,
  acknowledged_at timestamptz DEFAULT now(),
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ibkr_credentials_user ON ibkr_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_credentials_active ON ibkr_credentials(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ibkr_account_info_user ON ibkr_account_info(user_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_positions_user ON ibkr_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_positions_account ON ibkr_positions(account_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_positions_symbol ON ibkr_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_ibkr_positions_expiration ON ibkr_positions(expiration_date);
CREATE INDEX IF NOT EXISTS idx_ibkr_orders_user ON ibkr_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_orders_account ON ibkr_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_orders_status ON ibkr_orders(status);
CREATE INDEX IF NOT EXISTS idx_ibkr_orders_symbol ON ibkr_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_ibkr_orders_ibkr_id ON ibkr_orders(ibkr_order_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_session_user ON ibkr_session_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_session_expires ON ibkr_session_tracking(expires_at);
CREATE INDEX IF NOT EXISTS idx_ibkr_activity_user ON ibkr_trading_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_activity_type ON ibkr_trading_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_ibkr_compliance_user ON ibkr_compliance_acknowledgments(user_id);

-- Enable Row Level Security
ALTER TABLE ibkr_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE ibkr_account_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE ibkr_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ibkr_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ibkr_session_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ibkr_trading_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ibkr_compliance_acknowledgments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ibkr_credentials
CREATE POLICY "Users can view own IBKR credentials"
  ON ibkr_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own IBKR credentials"
  ON ibkr_credentials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own IBKR credentials"
  ON ibkr_credentials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own IBKR credentials"
  ON ibkr_credentials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for ibkr_account_info
CREATE POLICY "Users can view own IBKR account info"
  ON ibkr_account_info FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own IBKR account info"
  ON ibkr_account_info FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own IBKR account info"
  ON ibkr_account_info FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ibkr_positions
CREATE POLICY "Users can view own IBKR positions"
  ON ibkr_positions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own IBKR positions"
  ON ibkr_positions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own IBKR positions"
  ON ibkr_positions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own IBKR positions"
  ON ibkr_positions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for ibkr_orders
CREATE POLICY "Users can view own IBKR orders"
  ON ibkr_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own IBKR orders"
  ON ibkr_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own IBKR orders"
  ON ibkr_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ibkr_session_tracking
CREATE POLICY "Users can view own IBKR sessions"
  ON ibkr_session_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own IBKR sessions"
  ON ibkr_session_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own IBKR sessions"
  ON ibkr_session_tracking FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own IBKR sessions"
  ON ibkr_session_tracking FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for ibkr_trading_activity_log
CREATE POLICY "Users can view own IBKR activity logs"
  ON ibkr_trading_activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own IBKR activity logs"
  ON ibkr_trading_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ibkr_compliance_acknowledgments
CREATE POLICY "Users can view own IBKR compliance acknowledgments"
  ON ibkr_compliance_acknowledgments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own IBKR compliance acknowledgments"
  ON ibkr_compliance_acknowledgments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ibkr_credentials_updated_at
  BEFORE UPDATE ON ibkr_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibkr_account_info_updated_at
  BEFORE UPDATE ON ibkr_account_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibkr_positions_updated_at
  BEFORE UPDATE ON ibkr_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibkr_orders_updated_at
  BEFORE UPDATE ON ibkr_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibkr_session_tracking_updated_at
  BEFORE UPDATE ON ibkr_session_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
