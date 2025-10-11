/*
  # Robinhood Crypto Integration Tables

  This migration creates all tables needed for Robinhood Crypto API integration:
  - Secure credential storage with encryption
  - Account and holdings management
  - Order tracking and history
  - Compliance acknowledgments
  - Activity audit logging

  ## Tables Created

  1. **robinhood_credentials** - Encrypted API credentials storage
     - Stores private key, public key, and API key (all encrypted)
     - Supports environment toggle (though RH Crypto only has live trading)
     - Tracks compliance acknowledgment status
     - Includes last validation timestamp

  2. **robinhood_account_info** - Account metadata and balances
     - Account ID and status tracking
     - Cash balance and buying power
     - Portfolio value calculations
     - Last sync timestamp

  3. **robinhood_holdings** - Cryptocurrency positions
     - Symbol and asset details
     - Quantity and average cost basis
     - Current price and market value
     - Unrealized P&L tracking
     - Real-time sync capabilities

  4. **robinhood_orders** - Order history and tracking
     - Order ID and client order ID
     - Symbol and order type (market, limit, stop-limit, stop-loss)
     - Side (buy/sell) and quantity
     - Price information (limit, stop, filled avg)
     - Status tracking (pending, filled, cancelled, etc.)
     - Timestamps for submitted, filled, cancelled

  5. **robinhood_trading_activity_log** - Audit trail
     - Activity type tracking
     - Metadata in JSONB format
     - IP address and user agent
     - Timestamp tracking

  6. **robinhood_compliance_acknowledgments** - Regulatory compliance
     - Disclosure type and version
     - Acknowledgment timestamp
     - IP address tracking

  ## Security

  - Row Level Security (RLS) enabled on ALL tables
  - Users can ONLY access their own data
  - Credentials encrypted with AES-256-GCM before storage
  - Comprehensive indexes for query performance
  - Audit logging for all trading activities

  ## Important Notes

  - Robinhood Crypto API only supports live trading (no paper trading)
  - Crypto markets trade 24/7
  - Users don't fully "own" crypto on Robinhood (can't transfer to external wallets)
  - API requires private key, public key, and API key from Robinhood developer portal
*/

-- Create robinhood_credentials table
CREATE TABLE IF NOT EXISTS robinhood_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  private_key_encrypted text NOT NULL,
  public_key_encrypted text NOT NULL,
  api_key_encrypted text NOT NULL,
  encryption_iv text NOT NULL,
  environment text NOT NULL DEFAULT 'live' CHECK (environment IN ('live', 'paper')),
  is_active boolean DEFAULT true,
  compliance_acknowledged boolean DEFAULT false,
  compliance_acknowledged_at timestamptz,
  last_validated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, environment)
);

-- Create robinhood_account_info table
CREATE TABLE IF NOT EXISTS robinhood_account_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  account_id text,
  account_status text,
  buying_power numeric(20, 2) DEFAULT 0,
  cash_balance numeric(20, 2) DEFAULT 0,
  portfolio_value numeric(20, 2) DEFAULT 0,
  total_equity numeric(20, 2) DEFAULT 0,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create robinhood_holdings table
CREATE TABLE IF NOT EXISTS robinhood_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  asset_name text,
  asset_code text,
  quantity numeric(20, 8) NOT NULL,
  quantity_available numeric(20, 8),
  avg_cost_basis numeric(20, 8),
  current_price numeric(20, 8),
  market_value numeric(20, 2),
  cost_basis_total numeric(20, 2),
  unrealized_pl numeric(20, 2),
  unrealized_plpc numeric(10, 4),
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Create robinhood_orders table
CREATE TABLE IF NOT EXISTS robinhood_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  robinhood_order_id text,
  client_order_id text,
  symbol text NOT NULL,
  asset_code text,
  order_type text NOT NULL CHECK (order_type IN ('market', 'limit', 'stop_limit', 'stop_loss')),
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity numeric(20, 8) NOT NULL,
  limit_price numeric(20, 8),
  stop_price numeric(20, 8),
  filled_qty numeric(20, 8) DEFAULT 0,
  filled_avg_price numeric(20, 8),
  remaining_qty numeric(20, 8),
  status text DEFAULT 'pending',
  order_config jsonb DEFAULT '{}'::jsonb,
  error_message text,
  submitted_at timestamptz,
  filled_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, robinhood_order_id)
);

-- Create robinhood_trading_activity_log table
CREATE TABLE IF NOT EXISTS robinhood_trading_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('live', 'paper')),
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create robinhood_compliance_acknowledgments table
CREATE TABLE IF NOT EXISTS robinhood_compliance_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  disclosure_type text NOT NULL,
  disclosure_version text NOT NULL,
  acknowledged_at timestamptz DEFAULT now(),
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_robinhood_credentials_user ON robinhood_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_robinhood_credentials_active ON robinhood_credentials(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_robinhood_account_info_user ON robinhood_account_info(user_id);
CREATE INDEX IF NOT EXISTS idx_robinhood_holdings_user ON robinhood_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_robinhood_holdings_symbol ON robinhood_holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_robinhood_orders_user ON robinhood_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_robinhood_orders_status ON robinhood_orders(status);
CREATE INDEX IF NOT EXISTS idx_robinhood_orders_symbol ON robinhood_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_robinhood_orders_rh_id ON robinhood_orders(robinhood_order_id);
CREATE INDEX IF NOT EXISTS idx_robinhood_activity_user ON robinhood_trading_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_robinhood_activity_type ON robinhood_trading_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_robinhood_compliance_user ON robinhood_compliance_acknowledgments(user_id);

-- Enable Row Level Security
ALTER TABLE robinhood_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE robinhood_account_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE robinhood_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE robinhood_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE robinhood_trading_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE robinhood_compliance_acknowledgments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for robinhood_credentials
CREATE POLICY "Users can view own Robinhood credentials"
  ON robinhood_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Robinhood credentials"
  ON robinhood_credentials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Robinhood credentials"
  ON robinhood_credentials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Robinhood credentials"
  ON robinhood_credentials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for robinhood_account_info
CREATE POLICY "Users can view own Robinhood account info"
  ON robinhood_account_info FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Robinhood account info"
  ON robinhood_account_info FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Robinhood account info"
  ON robinhood_account_info FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for robinhood_holdings
CREATE POLICY "Users can view own Robinhood holdings"
  ON robinhood_holdings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Robinhood holdings"
  ON robinhood_holdings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Robinhood holdings"
  ON robinhood_holdings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Robinhood holdings"
  ON robinhood_holdings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for robinhood_orders
CREATE POLICY "Users can view own Robinhood orders"
  ON robinhood_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Robinhood orders"
  ON robinhood_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Robinhood orders"
  ON robinhood_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for robinhood_trading_activity_log
CREATE POLICY "Users can view own Robinhood activity logs"
  ON robinhood_trading_activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Robinhood activity logs"
  ON robinhood_trading_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for robinhood_compliance_acknowledgments
CREATE POLICY "Users can view own Robinhood compliance acknowledgments"
  ON robinhood_compliance_acknowledgments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Robinhood compliance acknowledgments"
  ON robinhood_compliance_acknowledgments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_robinhood_credentials_updated_at
  BEFORE UPDATE ON robinhood_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_robinhood_account_info_updated_at
  BEFORE UPDATE ON robinhood_account_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_robinhood_holdings_updated_at
  BEFORE UPDATE ON robinhood_holdings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_robinhood_orders_updated_at
  BEFORE UPDATE ON robinhood_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();