/*
  # Complete Alpaca Integration Tables
  
  This migration adds the remaining tables needed for full Alpaca integration:
  - alpaca_account_info: Account details and buying power
  - alpaca_positions: Synced positions from Alpaca
  - alpaca_orders: Order tracking and history
  - trading_compliance_log: Compliance checks and PDT tracking
  
  ## Tables Created
  
  1. alpaca_account_info - Account metadata and buying power
  2. alpaca_positions - Real-time position sync
  3. alpaca_orders - Order history and status
  4. trading_compliance_log - Regulatory compliance tracking
  
  ## Security
  
  - RLS enabled on all tables
  - Users can only access their own data
  - Indexes for performance
*/

-- Create alpaca_account_info table
CREATE TABLE IF NOT EXISTS alpaca_account_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  account_number text,
  account_status text,
  trading_level integer DEFAULT 0 CHECK (trading_level >= 0 AND trading_level <= 3),
  buying_power numeric(20, 2) DEFAULT 0,
  options_buying_power numeric(20, 2) DEFAULT 0,
  pattern_day_trader boolean DEFAULT false,
  day_trade_count integer DEFAULT 0,
  equity numeric(20, 2) DEFAULT 0,
  cash numeric(20, 2) DEFAULT 0,
  portfolio_value numeric(20, 2) DEFAULT 0,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create alpaca_positions table
CREATE TABLE IF NOT EXISTS alpaca_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  underlying_symbol text,
  asset_class text DEFAULT 'us_option',
  quantity numeric(20, 8) NOT NULL,
  avg_entry_price numeric(20, 4),
  current_price numeric(20, 4),
  market_value numeric(20, 2),
  cost_basis numeric(20, 2),
  unrealized_pl numeric(20, 2),
  unrealized_plpc numeric(10, 4),
  side text CHECK (side IN ('long', 'short')),
  contract_type text CHECK (contract_type IN ('call', 'put')),
  strike_price numeric(20, 4),
  expiration_date date,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Create alpaca_orders table
CREATE TABLE IF NOT EXISTS alpaca_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alpaca_order_id text,
  client_order_id text,
  symbol text NOT NULL,
  underlying_symbol text,
  asset_class text DEFAULT 'us_option',
  order_type text NOT NULL CHECK (order_type IN ('market', 'limit')),
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  time_in_force text DEFAULT 'day',
  quantity numeric(20, 8) NOT NULL,
  limit_price numeric(20, 4),
  filled_qty numeric(20, 8) DEFAULT 0,
  filled_avg_price numeric(20, 4),
  status text DEFAULT 'pending',
  submitted_at timestamptz,
  filled_at timestamptz,
  cancelled_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trading_compliance_log table
CREATE TABLE IF NOT EXISTS trading_compliance_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  compliance_type text NOT NULL,
  check_result text NOT NULL CHECK (check_result IN ('passed', 'failed', 'warning')),
  details jsonb DEFAULT '{}'::jsonb,
  action_taken text,
  trade_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_alpaca_account_info_user ON alpaca_account_info(user_id);
CREATE INDEX IF NOT EXISTS idx_alpaca_positions_user ON alpaca_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_alpaca_positions_symbol ON alpaca_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_alpaca_positions_expiration ON alpaca_positions(expiration_date);
CREATE INDEX IF NOT EXISTS idx_alpaca_orders_user ON alpaca_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_alpaca_orders_status ON alpaca_orders(status);
CREATE INDEX IF NOT EXISTS idx_alpaca_orders_symbol ON alpaca_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_alpaca_orders_alpaca_id ON alpaca_orders(alpaca_order_id);
CREATE INDEX IF NOT EXISTS idx_compliance_log_user ON trading_compliance_log(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_log_type ON trading_compliance_log(compliance_type);
CREATE INDEX IF NOT EXISTS idx_compliance_log_date ON trading_compliance_log(trade_date);

-- Enable Row Level Security
ALTER TABLE alpaca_account_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE alpaca_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alpaca_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_compliance_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alpaca_account_info
CREATE POLICY "Users can view own Alpaca account info"
  ON alpaca_account_info FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Alpaca account info"
  ON alpaca_account_info FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Alpaca account info"
  ON alpaca_account_info FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for alpaca_positions
CREATE POLICY "Users can view own Alpaca positions"
  ON alpaca_positions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Alpaca positions"
  ON alpaca_positions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Alpaca positions"
  ON alpaca_positions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Alpaca positions"
  ON alpaca_positions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for alpaca_orders
CREATE POLICY "Users can view own Alpaca orders"
  ON alpaca_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Alpaca orders"
  ON alpaca_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Alpaca orders"
  ON alpaca_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for trading_compliance_log
CREATE POLICY "Users can view own compliance logs"
  ON trading_compliance_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own compliance logs"
  ON trading_compliance_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_alpaca_account_info_updated_at
  BEFORE UPDATE ON alpaca_account_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alpaca_positions_updated_at
  BEFORE UPDATE ON alpaca_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alpaca_orders_updated_at
  BEFORE UPDATE ON alpaca_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();