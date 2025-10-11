-- Zerodha Kite Connect Integration Tables
-- Documentation: https://kite.trade/docs/connect/v3/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Zerodha Credentials Table
CREATE TABLE IF NOT EXISTS zerodha_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- API Credentials
  api_key TEXT NOT NULL,
  api_secret_encrypted TEXT NOT NULL, -- AES-256 encrypted

  -- Session Management
  access_token_encrypted TEXT, -- AES-256 encrypted, expires daily
  refresh_token_encrypted TEXT, -- AES-256 encrypted
  request_token TEXT, -- Temporary token from OAuth flow

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_live BOOLEAN DEFAULT false, -- true = live trading, false = paper trading

  -- Timestamps
  token_expires_at TIMESTAMPTZ,
  last_connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_zerodha UNIQUE(user_id, api_key)
);

-- Row Level Security
ALTER TABLE zerodha_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Zerodha credentials"
  ON zerodha_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Zerodha credentials"
  ON zerodha_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Zerodha credentials"
  ON zerodha_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own Zerodha credentials"
  ON zerodha_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- Zerodha Sessions Table (for tracking daily logins)
CREATE TABLE IF NOT EXISTS zerodha_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credential_id UUID NOT NULL REFERENCES zerodha_credentials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session Info
  access_token_encrypted TEXT NOT NULL,
  session_type TEXT CHECK (session_type IN ('kite_web', 'kite_connect')) DEFAULT 'kite_connect',

  -- IP and Device
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT unique_active_session UNIQUE(credential_id, session_type)
);

-- RLS for sessions
ALTER TABLE zerodha_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Zerodha sessions"
  ON zerodha_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Zerodha sessions"
  ON zerodha_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Zerodha sessions"
  ON zerodha_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Zerodha Account Info (cached from API)
CREATE TABLE IF NOT EXISTS zerodha_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credential_id UUID NOT NULL REFERENCES zerodha_credentials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Account Details
  user_name TEXT,
  user_shortname TEXT,
  email TEXT,
  user_type TEXT CHECK (user_type IN ('individual', 'corporate')),
  broker TEXT DEFAULT 'zerodha',

  -- Trading Info
  exchanges TEXT[] DEFAULT ARRAY['NSE', 'BSE', 'NFO', 'BFO', 'MCX'], -- Available exchanges
  products TEXT[] DEFAULT ARRAY['CNC', 'MIS', 'NRML'], -- Product types
  order_types TEXT[] DEFAULT ARRAY['MARKET', 'LIMIT', 'SL', 'SL-M'], -- Order types

  -- Account Status
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_zerodha_account UNIQUE(credential_id)
);

-- RLS for accounts
ALTER TABLE zerodha_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Zerodha accounts"
  ON zerodha_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Zerodha accounts"
  ON zerodha_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Zerodha accounts"
  ON zerodha_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- Zerodha Holdings (cached from API)
CREATE TABLE IF NOT EXISTS zerodha_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES zerodha_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Instrument Details
  tradingsymbol TEXT NOT NULL,
  exchange TEXT NOT NULL,
  instrument_token BIGINT,
  isin TEXT,
  product TEXT, -- CNC, MIS, NRML

  -- Quantity Info
  quantity INTEGER NOT NULL DEFAULT 0,
  t1_quantity INTEGER DEFAULT 0, -- T+1 holdings
  realised_quantity INTEGER DEFAULT 0,
  authorised_quantity INTEGER DEFAULT 0,

  -- Price Info
  average_price DECIMAL(15, 2),
  last_price DECIMAL(15, 2),
  close_price DECIMAL(15, 2),

  -- P&L Info
  pnl DECIMAL(15, 2),
  day_change DECIMAL(15, 2),
  day_change_percentage DECIMAL(8, 4),

  -- Timestamps
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT unique_zerodha_holding UNIQUE(account_id, tradingsymbol, product)
);

-- RLS for holdings
ALTER TABLE zerodha_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Zerodha holdings"
  ON zerodha_holdings FOR SELECT
  USING (auth.uid() = user_id);

-- Zerodha Positions (cached from API)
CREATE TABLE IF NOT EXISTS zerodha_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES zerodha_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Instrument Details
  tradingsymbol TEXT NOT NULL,
  exchange TEXT NOT NULL,
  instrument_token BIGINT,
  product TEXT, -- CNC, MIS, NRML

  -- Position Info
  quantity INTEGER NOT NULL DEFAULT 0,
  overnight_quantity INTEGER DEFAULT 0,
  multiplier DECIMAL(10, 4) DEFAULT 1.0,

  -- Price Info
  average_price DECIMAL(15, 2),
  last_price DECIMAL(15, 2),
  close_price DECIMAL(15, 2),
  buy_price DECIMAL(15, 2),
  sell_price DECIMAL(15, 2),
  buy_quantity INTEGER DEFAULT 0,
  sell_quantity INTEGER DEFAULT 0,
  buy_value DECIMAL(15, 2),
  sell_value DECIMAL(15, 2),

  -- P&L Info
  pnl DECIMAL(15, 2),
  m2m DECIMAL(15, 2), -- Mark to market
  unrealised DECIMAL(15, 2),
  realised DECIMAL(15, 2),

  -- Day Position
  day_buy_quantity INTEGER DEFAULT 0,
  day_buy_price DECIMAL(15, 2),
  day_buy_value DECIMAL(15, 2),
  day_sell_quantity INTEGER DEFAULT 0,
  day_sell_price DECIMAL(15, 2),
  day_sell_value DECIMAL(15, 2),

  -- Timestamps
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT unique_zerodha_position UNIQUE(account_id, tradingsymbol, product)
);

-- RLS for positions
ALTER TABLE zerodha_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Zerodha positions"
  ON zerodha_positions FOR SELECT
  USING (auth.uid() = user_id);

-- Zerodha Margins (cached from API)
CREATE TABLE IF NOT EXISTS zerodha_margins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES zerodha_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Segment (equity, commodity)
  segment TEXT NOT NULL CHECK (segment IN ('equity', 'commodity')),

  -- Available Margins
  net DECIMAL(15, 2), -- Net available margin
  available_cash DECIMAL(15, 2),
  available_collateral DECIMAL(15, 2),
  available_intraday_payin DECIMAL(15, 2),

  -- Enabled/Disabled
  enabled BOOLEAN DEFAULT true,

  -- Used Margins
  utilised_debits DECIMAL(15, 2),
  utilised_span DECIMAL(15, 2),
  utilised_exposure DECIMAL(15, 2),
  utilised_option_premium DECIMAL(15, 2),
  utilised_holding_sales DECIMAL(15, 2),
  utilised_turnover DECIMAL(15, 2),

  -- Timestamps
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_zerodha_margin UNIQUE(account_id, segment)
);

-- RLS for margins
ALTER TABLE zerodha_margins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Zerodha margins"
  ON zerodha_margins FOR SELECT
  USING (auth.uid() = user_id);

-- Zerodha Orders (cached from API)
CREATE TABLE IF NOT EXISTS zerodha_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES zerodha_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Zerodha Order ID
  order_id TEXT NOT NULL,
  parent_order_id TEXT,
  exchange_order_id TEXT,

  -- Instrument Details
  tradingsymbol TEXT NOT NULL,
  exchange TEXT NOT NULL,
  instrument_token BIGINT,

  -- Order Details
  transaction_type TEXT CHECK (transaction_type IN ('BUY', 'SELL')),
  order_type TEXT CHECK (order_type IN ('MARKET', 'LIMIT', 'SL', 'SL-M')),
  product TEXT CHECK (product IN ('CNC', 'MIS', 'NRML')),
  variety TEXT CHECK (variety IN ('regular', 'amo', 'co', 'iceberg')),

  -- Quantity
  quantity INTEGER NOT NULL,
  filled_quantity INTEGER DEFAULT 0,
  pending_quantity INTEGER DEFAULT 0,
  cancelled_quantity INTEGER DEFAULT 0,
  disclosed_quantity INTEGER DEFAULT 0,

  -- Price
  price DECIMAL(15, 2),
  trigger_price DECIMAL(15, 2),
  average_price DECIMAL(15, 2),

  -- Status
  status TEXT CHECK (status IN ('OPEN', 'COMPLETE', 'CANCELLED', 'REJECTED', 'AMO REQ RECEIVED')),
  status_message TEXT,
  validity TEXT CHECK (validity IN ('DAY', 'IOC')),

  -- Timestamps
  order_timestamp TIMESTAMPTZ,
  exchange_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT unique_zerodha_order UNIQUE(account_id, order_id)
);

-- RLS for orders
ALTER TABLE zerodha_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Zerodha orders"
  ON zerodha_orders FOR SELECT
  USING (auth.uid() = user_id);

-- Zerodha Instruments Cache (for performance)
CREATE TABLE IF NOT EXISTS zerodha_instruments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Instrument Details
  instrument_token BIGINT NOT NULL,
  exchange_token BIGINT,
  tradingsymbol TEXT NOT NULL,
  name TEXT,

  -- Exchange Info
  exchange TEXT NOT NULL,
  segment TEXT,

  -- Type
  instrument_type TEXT CHECK (instrument_type IN ('EQ', 'CE', 'PE', 'FUT')),

  -- Options/Futures Details
  expiry DATE,
  strike DECIMAL(15, 2),
  lot_size INTEGER DEFAULT 1,
  tick_size DECIMAL(8, 4),

  -- Price Info (cached)
  last_price DECIMAL(15, 2),

  -- Timestamps
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_zerodha_instrument UNIQUE(instrument_token),
  CONSTRAINT unique_tradingsymbol_exchange UNIQUE(tradingsymbol, exchange)
);

-- Public read access for instruments (they're market data)
ALTER TABLE zerodha_instruments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view Zerodha instruments"
  ON zerodha_instruments FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_zerodha_credentials_user_id ON zerodha_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_zerodha_credentials_active ON zerodha_credentials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_zerodha_sessions_expires ON zerodha_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_zerodha_accounts_user_id ON zerodha_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_zerodha_holdings_account_id ON zerodha_holdings(account_id);
CREATE INDEX IF NOT EXISTS idx_zerodha_positions_account_id ON zerodha_positions(account_id);
CREATE INDEX IF NOT EXISTS idx_zerodha_margins_account_id ON zerodha_margins(account_id);
CREATE INDEX IF NOT EXISTS idx_zerodha_orders_account_id ON zerodha_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_zerodha_orders_status ON zerodha_orders(status);
CREATE INDEX IF NOT EXISTS idx_zerodha_instruments_exchange ON zerodha_instruments(exchange);
CREATE INDEX IF NOT EXISTS idx_zerodha_instruments_type ON zerodha_instruments(instrument_type);
CREATE INDEX IF NOT EXISTS idx_zerodha_instruments_expiry ON zerodha_instruments(expiry) WHERE expiry IS NOT NULL;

-- Updated at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_zerodha_credentials_updated_at BEFORE UPDATE ON zerodha_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zerodha_accounts_updated_at BEFORE UPDATE ON zerodha_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zerodha_holdings_updated_at BEFORE UPDATE ON zerodha_holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zerodha_positions_updated_at BEFORE UPDATE ON zerodha_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zerodha_margins_updated_at BEFORE UPDATE ON zerodha_margins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zerodha_orders_updated_at BEFORE UPDATE ON zerodha_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE zerodha_credentials IS 'Stores encrypted Zerodha Kite Connect API credentials';
COMMENT ON TABLE zerodha_sessions IS 'Tracks daily Zerodha sessions (tokens expire daily)';
COMMENT ON TABLE zerodha_accounts IS 'Cached Zerodha account information from API';
COMMENT ON TABLE zerodha_holdings IS 'Current holdings from Zerodha account';
COMMENT ON TABLE zerodha_positions IS 'Current positions (intraday + overnight) from Zerodha';
COMMENT ON TABLE zerodha_margins IS 'Available and utilized margins from Zerodha';
COMMENT ON TABLE zerodha_orders IS 'Order history and status from Zerodha';
COMMENT ON TABLE zerodha_instruments IS 'Cached instruments list from Zerodha (updated daily)';
