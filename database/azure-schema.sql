/*
  Azure PostgreSQL Schema for Options Trading Platform

  This is a consolidated schema adapted from Supabase migrations for Azure PostgreSQL.
  Key changes from Supabase:
  - Created standalone 'users' table instead of auth.users
  - Removed RLS (Row Level Security) policies
  - Removed Supabase-specific functions like auth.uid()
  - Application-level security is handled by Azure Functions
*/

-- ============================================================================
-- CORE INFRASTRUCTURE
-- ============================================================================

-- Create function for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- USERS AND AUTHENTICATION
-- ============================================================================

-- Users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  azure_oid text UNIQUE, -- Azure Entra ID Object ID
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_azure_oid ON users(azure_oid);

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text,
  display_name text,
  bio text,
  avatar_url text,
  location text,
  trading_experience text CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'professional')),
  preferred_strategies text[],
  risk_tolerance text DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  onboarding_completed boolean DEFAULT false,
  show_profile_publicly boolean DEFAULT false,
  show_trading_stats boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- User roles
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  role_key text UNIQUE NOT NULL,
  description text NOT NULL,
  hierarchy_level integer DEFAULT 0,
  is_system_role boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User role assignments
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES user_roles(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_role_assignments_user ON user_role_assignments(user_id);

-- ============================================================================
-- MARKET DATA TABLES
-- ============================================================================

-- Historical stock data
CREATE TABLE IF NOT EXISTS historical_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  date date NOT NULL,
  open numeric NOT NULL,
  high numeric NOT NULL,
  low numeric NOT NULL,
  close numeric NOT NULL,
  volume bigint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(ticker, date)
);

CREATE INDEX IF NOT EXISTS idx_historical_data_ticker_date ON historical_data(ticker, date DESC);

-- Options historical data
CREATE TABLE IF NOT EXISTS options_historical_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_ticker text NOT NULL,
  underlying_ticker text NOT NULL,
  date date NOT NULL,
  bid numeric NOT NULL,
  ask numeric NOT NULL,
  last numeric NOT NULL,
  volume bigint NOT NULL DEFAULT 0,
  open_interest bigint NOT NULL DEFAULT 0,
  implied_volatility numeric NOT NULL DEFAULT 0,
  delta numeric NOT NULL DEFAULT 0,
  gamma numeric NOT NULL DEFAULT 0,
  theta numeric NOT NULL DEFAULT 0,
  vega numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(contract_ticker, date)
);

CREATE INDEX IF NOT EXISTS idx_options_historical_data_contract_date ON options_historical_data(contract_ticker, date DESC);
CREATE INDEX IF NOT EXISTS idx_options_historical_data_underlying_date ON options_historical_data(underlying_ticker, date DESC);

-- ============================================================================
-- PAPER TRADING TABLES
-- ============================================================================

-- Paper trading accounts
CREATE TABLE IF NOT EXISTS paper_trading_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  account_name text NOT NULL,
  account_description text,
  account_type text DEFAULT 'mixed' CHECK (account_type IN ('options_focused', 'stocks_focused', 'mixed', 'day_trading', 'swing_trading')),
  initial_balance numeric(20, 2) DEFAULT 100000 NOT NULL,
  current_balance numeric(20, 2) DEFAULT 100000 NOT NULL,
  cash_balance numeric(20, 2) DEFAULT 100000 NOT NULL,
  buying_power numeric(20, 2) DEFAULT 100000 NOT NULL,
  portfolio_value numeric(20, 2) DEFAULT 100000 NOT NULL,
  total_equity numeric(20, 2) DEFAULT 100000 NOT NULL,
  margin_used numeric(20, 2) DEFAULT 0,
  simulate_commissions boolean DEFAULT true,
  commission_per_trade numeric(10, 2) DEFAULT 0,
  commission_per_contract numeric(10, 2) DEFAULT 0.65,
  simulate_slippage boolean DEFAULT true,
  slippage_percent numeric(10, 4) DEFAULT 0.05,
  total_trades integer DEFAULT 0,
  winning_trades integer DEFAULT 0,
  losing_trades integer DEFAULT 0,
  total_profit_loss numeric(20, 2) DEFAULT 0,
  win_rate numeric(10, 4) DEFAULT 0,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, account_name)
);

CREATE INDEX IF NOT EXISTS idx_paper_accounts_user ON paper_trading_accounts(user_id);

-- Paper positions
CREATE TABLE IF NOT EXISTS paper_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES paper_trading_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  underlying_symbol text,
  position_type text NOT NULL CHECK (position_type IN ('stock', 'option', 'crypto', 'future', 'etf')),
  quantity numeric(20, 8) NOT NULL,
  avg_entry_price numeric(20, 4) NOT NULL,
  total_cost numeric(20, 2) NOT NULL,
  current_price numeric(20, 4),
  market_value numeric(20, 2),
  unrealized_pl numeric(20, 2),
  unrealized_pl_percent numeric(10, 4),
  realized_pl numeric(20, 2) DEFAULT 0,
  side text NOT NULL CHECK (side IN ('long', 'short')),
  contract_type text CHECK (contract_type IN ('call', 'put')),
  strike_price numeric(20, 4),
  expiration_date date,
  multiplier integer DEFAULT 100,
  delta numeric(10, 6),
  gamma numeric(10, 6),
  theta numeric(10, 6),
  vega numeric(10, 6),
  stop_loss_price numeric(20, 4),
  take_profit_price numeric(20, 4),
  entry_notes text,
  opened_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paper_positions_account ON paper_positions(account_id);
CREATE INDEX IF NOT EXISTS idx_paper_positions_user ON paper_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_positions_symbol ON paper_positions(symbol);

-- Paper orders
CREATE TABLE IF NOT EXISTS paper_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES paper_trading_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  position_id uuid REFERENCES paper_positions(id) ON DELETE SET NULL,
  symbol text NOT NULL,
  underlying_symbol text,
  order_type text NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit', 'trailing_stop')),
  side text NOT NULL CHECK (side IN ('buy', 'sell', 'buy_to_open', 'sell_to_open', 'buy_to_close', 'sell_to_close')),
  time_in_force text DEFAULT 'day' CHECK (time_in_force IN ('day', 'gtc', 'ioc', 'fok', 'opg', 'cls')),
  quantity numeric(20, 8) NOT NULL,
  filled_quantity numeric(20, 8) DEFAULT 0,
  limit_price numeric(20, 4),
  stop_price numeric(20, 4),
  avg_fill_price numeric(20, 4),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'accepted', 'partially_filled', 'filled', 'cancelled', 'rejected', 'expired')),
  rejection_reason text,
  simulated_slippage numeric(20, 4) DEFAULT 0,
  commission numeric(20, 4) DEFAULT 0,
  total_cost numeric(20, 2),
  contract_type text CHECK (contract_type IN ('call', 'put')),
  strike_price numeric(20, 4),
  expiration_date date,
  order_notes text,
  submitted_at timestamptz,
  filled_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paper_orders_account ON paper_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_paper_orders_user ON paper_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_orders_status ON paper_orders(status);
CREATE INDEX IF NOT EXISTS idx_paper_orders_created ON paper_orders(created_at DESC);

-- Paper transactions
CREATE TABLE IF NOT EXISTS paper_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES paper_trading_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES paper_orders(id) ON DELETE SET NULL,
  position_id uuid REFERENCES paper_positions(id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('trade', 'dividend', 'interest', 'fee', 'commission', 'deposit', 'withdrawal', 'split', 'assignment', 'exercise')),
  symbol text,
  description text NOT NULL,
  quantity numeric(20, 8),
  price numeric(20, 4),
  amount numeric(20, 2) NOT NULL,
  cash_flow numeric(20, 2) NOT NULL,
  balance_after numeric(20, 2) NOT NULL,
  transaction_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paper_transactions_account ON paper_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_paper_transactions_user ON paper_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_transactions_date ON paper_transactions(transaction_date DESC);

-- ============================================================================
-- SAVED STRATEGIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  strategy_type text NOT NULL,
  underlying_symbol text NOT NULL,
  legs jsonb NOT NULL DEFAULT '[]'::jsonb,
  entry_price numeric(20, 4),
  max_profit numeric(20, 4),
  max_loss numeric(20, 4),
  breakeven_points jsonb DEFAULT '[]'::jsonb,
  risk_reward_ratio numeric(10, 4),
  probability_of_profit numeric(10, 4),
  net_delta numeric(10, 6),
  net_gamma numeric(10, 6),
  net_theta numeric(10, 6),
  net_vega numeric(10, 6),
  is_favorite boolean DEFAULT false,
  tags text[] DEFAULT ARRAY[]::text[],
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_strategies_user ON saved_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_strategies_type ON saved_strategies(strategy_type);
CREATE INDEX IF NOT EXISTS idx_saved_strategies_symbol ON saved_strategies(underlying_symbol);

-- ============================================================================
-- SUBSCRIPTIONS AND PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  plan_type text DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'premium', 'enterprise')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'paused')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- ============================================================================
-- TRADING METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS trading_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES paper_trading_accounts(id) ON DELETE CASCADE,
  period text NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly', 'all_time')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_trades integer DEFAULT 0,
  winning_trades integer DEFAULT 0,
  losing_trades integer DEFAULT 0,
  total_profit_loss numeric(20, 2) DEFAULT 0,
  win_rate numeric(10, 4) DEFAULT 0,
  profit_factor numeric(10, 4) DEFAULT 0,
  average_win numeric(20, 2) DEFAULT 0,
  average_loss numeric(20, 2) DEFAULT 0,
  largest_win numeric(20, 2) DEFAULT 0,
  largest_loss numeric(20, 2) DEFAULT 0,
  sharpe_ratio numeric(10, 6),
  max_drawdown numeric(10, 4),
  calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trading_metrics_user ON trading_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_metrics_account ON trading_metrics(account_id);
CREATE INDEX IF NOT EXISTS idx_trading_metrics_period ON trading_metrics(period, period_start);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_historical_data_updated_at
  BEFORE UPDATE ON historical_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_options_historical_data_updated_at
  BEFORE UPDATE ON options_historical_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paper_accounts_updated_at
  BEFORE UPDATE ON paper_trading_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paper_orders_updated_at
  BEFORE UPDATE ON paper_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_strategies_updated_at
  BEFORE UPDATE ON saved_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: DEFAULT ROLES
-- ============================================================================

INSERT INTO user_roles (role_name, role_key, description, hierarchy_level, is_system_role) VALUES
  ('Administrator', 'admin', 'Full system access with all permissions', 100, true),
  ('Moderator', 'moderator', 'Community moderation and user management', 75, true),
  ('Premium User', 'premium', 'Paid subscription with advanced features', 50, true),
  ('Basic User', 'basic', 'Paid subscription with standard features', 30, true),
  ('Trial User', 'trial', 'Limited trial access to premium features', 20, true),
  ('Free User', 'free', 'Free tier with basic access', 10, true)
ON CONFLICT (role_key) DO NOTHING;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to get or create user by Azure OID
CREATE OR REPLACE FUNCTION get_or_create_user(p_azure_oid text, p_email text)
RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Try to find existing user by Azure OID
  SELECT id INTO v_user_id FROM users WHERE azure_oid = p_azure_oid;

  IF v_user_id IS NULL THEN
    -- Try by email
    SELECT id INTO v_user_id FROM users WHERE email = p_email;

    IF v_user_id IS NOT NULL THEN
      -- Update existing user with Azure OID
      UPDATE users SET azure_oid = p_azure_oid, last_login_at = now() WHERE id = v_user_id;
    ELSE
      -- Create new user
      INSERT INTO users (email, azure_oid, email_verified, last_login_at)
      VALUES (p_email, p_azure_oid, true, now())
      RETURNING id INTO v_user_id;

      -- Create default profile
      INSERT INTO user_profiles (user_id) VALUES (v_user_id);

      -- Create default paper trading account
      INSERT INTO paper_trading_accounts (user_id, account_name, account_description, is_default)
      VALUES (v_user_id, 'My First Paper Account', 'Default paper trading account with $100,000 starting balance', true);

      -- Assign free role
      INSERT INTO user_role_assignments (user_id, role_id)
      SELECT v_user_id, id FROM user_roles WHERE role_key = 'free';
    END IF;
  ELSE
    -- Update last login
    UPDATE users SET last_login_at = now() WHERE id = v_user_id;
  END IF;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;
