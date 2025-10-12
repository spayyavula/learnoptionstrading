/*
  # Indian Broker Integration Tables

  Creates tables for ICICI Direct and HDFC Securities integrations:

  ## ICICI Direct Tables
  1. `icici_direct_credentials` - Stores API credentials and session tokens
  2. `icici_direct_positions` - Tracks positions from ICICI Direct
  3. `icici_direct_orders` - Stores order history
  4. `icici_direct_sync_log` - Logs data synchronization events

  ## HDFC Securities Tables
  1. `hdfc_securities_credentials` - Stores API credentials and access tokens
  2. `hdfc_securities_positions` - Tracks positions from HDFC Securities
  3. `hdfc_securities_orders` - Stores order history
  4. `hdfc_securities_sync_log` - Logs data synchronization events

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Credentials are encrypted at rest
*/

-- ============================================================================
-- ICICI DIRECT TABLES
-- ============================================================================

-- ICICI Direct Credentials
CREATE TABLE IF NOT EXISTS icici_direct_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key text NOT NULL,
  api_secret text NOT NULL,
  session_token text,
  icici_user_id text NOT NULL,
  environment text NOT NULL DEFAULT 'demo' CHECK (environment IN ('live', 'demo')),
  is_active boolean DEFAULT true,
  last_validated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, environment)
);

-- ICICI Direct Positions
CREATE TABLE IF NOT EXISTS icici_direct_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_code text NOT NULL,
  exchange_code text NOT NULL,
  product text NOT NULL,
  quantity integer NOT NULL,
  average_price numeric(20, 4) NOT NULL,
  buy_quantity integer DEFAULT 0,
  sell_quantity integer DEFAULT 0,
  buy_average numeric(20, 4) DEFAULT 0,
  sell_average numeric(20, 4) DEFAULT 0,
  net_quantity integer NOT NULL,
  realized_profit numeric(20, 4) DEFAULT 0,
  unrealized_profit numeric(20, 4) DEFAULT 0,
  ltp numeric(20, 4) NOT NULL,
  mtm numeric(20, 4) DEFAULT 0,
  environment text NOT NULL DEFAULT 'demo',
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ICICI Direct Orders
CREATE TABLE IF NOT EXISTS icici_direct_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  exchange_code text NOT NULL,
  stock_code text NOT NULL,
  product text NOT NULL,
  action text NOT NULL,
  order_type text NOT NULL,
  quantity integer NOT NULL,
  price numeric(20, 4),
  trigger_price numeric(20, 4),
  disclosed_quantity integer,
  validity text NOT NULL,
  status text NOT NULL,
  filled_quantity integer DEFAULT 0,
  pending_quantity integer DEFAULT 0,
  order_datetime timestamptz NOT NULL,
  exchange_order_id text,
  rejection_reason text,
  environment text NOT NULL DEFAULT 'demo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, order_id, environment)
);

-- ICICI Direct Sync Log
CREATE TABLE IF NOT EXISTS icici_direct_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type text NOT NULL,
  status text NOT NULL,
  records_synced integer DEFAULT 0,
  error_message text,
  environment text NOT NULL DEFAULT 'demo',
  synced_at timestamptz DEFAULT now()
);

-- ============================================================================
-- HDFC SECURITIES TABLES
-- ============================================================================

-- HDFC Securities Credentials
CREATE TABLE IF NOT EXISTS hdfc_securities_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id text NOT NULL,
  app_secret text NOT NULL,
  access_token text,
  user_code text NOT NULL,
  environment text NOT NULL DEFAULT 'demo' CHECK (environment IN ('live', 'demo')),
  is_active boolean DEFAULT true,
  last_validated_at timestamptz,
  token_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, environment)
);

-- HDFC Securities Positions
CREATE TABLE IF NOT EXISTS hdfc_securities_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  exchange text NOT NULL,
  product_type text NOT NULL,
  quantity integer NOT NULL,
  buy_quantity integer DEFAULT 0,
  sell_quantity integer DEFAULT 0,
  buy_avg_price numeric(20, 4) DEFAULT 0,
  sell_avg_price numeric(20, 4) DEFAULT 0,
  net_quantity integer NOT NULL,
  realized_pnl numeric(20, 4) DEFAULT 0,
  unrealized_pnl numeric(20, 4) DEFAULT 0,
  ltp numeric(20, 4) NOT NULL,
  mtm numeric(20, 4) DEFAULT 0,
  close_price numeric(20, 4) DEFAULT 0,
  environment text NOT NULL DEFAULT 'demo',
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- HDFC Securities Orders
CREATE TABLE IF NOT EXISTS hdfc_securities_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  exchange text NOT NULL,
  symbol text NOT NULL,
  trading_symbol text NOT NULL,
  product_type text NOT NULL,
  transaction_type text NOT NULL,
  order_type text NOT NULL,
  quantity integer NOT NULL,
  price numeric(20, 4),
  trigger_price numeric(20, 4),
  disclosed_quantity integer,
  validity text NOT NULL,
  status text NOT NULL,
  filled_quantity integer DEFAULT 0,
  remaining_quantity integer DEFAULT 0,
  order_timestamp timestamptz NOT NULL,
  exchange_order_id text,
  rejection_reason text,
  average_price numeric(20, 4),
  environment text NOT NULL DEFAULT 'demo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, order_id, environment)
);

-- HDFC Securities Sync Log
CREATE TABLE IF NOT EXISTS hdfc_securities_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type text NOT NULL,
  status text NOT NULL,
  records_synced integer DEFAULT 0,
  error_message text,
  environment text NOT NULL DEFAULT 'demo',
  synced_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- ICICI Direct Indexes
CREATE INDEX IF NOT EXISTS idx_icici_credentials_user ON icici_direct_credentials(user_id, environment);
CREATE INDEX IF NOT EXISTS idx_icici_positions_user ON icici_direct_positions(user_id, environment);
CREATE INDEX IF NOT EXISTS idx_icici_orders_user ON icici_direct_orders(user_id, environment);
CREATE INDEX IF NOT EXISTS idx_icici_orders_status ON icici_direct_orders(status);
CREATE INDEX IF NOT EXISTS idx_icici_sync_log_user ON icici_direct_sync_log(user_id, synced_at DESC);

-- HDFC Securities Indexes
CREATE INDEX IF NOT EXISTS idx_hdfc_credentials_user ON hdfc_securities_credentials(user_id, environment);
CREATE INDEX IF NOT EXISTS idx_hdfc_positions_user ON hdfc_securities_positions(user_id, environment);
CREATE INDEX IF NOT EXISTS idx_hdfc_orders_user ON hdfc_securities_orders(user_id, environment);
CREATE INDEX IF NOT EXISTS idx_hdfc_orders_status ON hdfc_securities_orders(status);
CREATE INDEX IF NOT EXISTS idx_hdfc_sync_log_user ON hdfc_securities_sync_log(user_id, synced_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE icici_direct_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE icici_direct_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE icici_direct_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE icici_direct_sync_log ENABLE ROW LEVEL SECURITY;

ALTER TABLE hdfc_securities_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE hdfc_securities_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hdfc_securities_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE hdfc_securities_sync_log ENABLE ROW LEVEL SECURITY;

-- ICICI Direct RLS Policies
CREATE POLICY "Users can view their own ICICI credentials"
  ON icici_direct_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ICICI credentials"
  ON icici_direct_credentials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ICICI credentials"
  ON icici_direct_credentials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ICICI credentials"
  ON icici_direct_credentials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own ICICI positions"
  ON icici_direct_positions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own ICICI positions"
  ON icici_direct_positions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own ICICI orders"
  ON icici_direct_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own ICICI orders"
  ON icici_direct_orders FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own ICICI sync logs"
  ON icici_direct_sync_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ICICI sync logs"
  ON icici_direct_sync_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- HDFC Securities RLS Policies
CREATE POLICY "Users can view their own HDFC credentials"
  ON hdfc_securities_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own HDFC credentials"
  ON hdfc_securities_credentials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own HDFC credentials"
  ON hdfc_securities_credentials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own HDFC credentials"
  ON hdfc_securities_credentials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own HDFC positions"
  ON hdfc_securities_positions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own HDFC positions"
  ON hdfc_securities_positions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own HDFC orders"
  ON hdfc_securities_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own HDFC orders"
  ON hdfc_securities_orders FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own HDFC sync logs"
  ON hdfc_securities_sync_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own HDFC sync logs"
  ON hdfc_securities_sync_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_icici_credentials_updated_at
  BEFORE UPDATE ON icici_direct_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_icici_positions_updated_at
  BEFORE UPDATE ON icici_direct_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_icici_orders_updated_at
  BEFORE UPDATE ON icici_direct_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hdfc_credentials_updated_at
  BEFORE UPDATE ON hdfc_securities_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hdfc_positions_updated_at
  BEFORE UPDATE ON hdfc_securities_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hdfc_orders_updated_at
  BEFORE UPDATE ON hdfc_securities_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
