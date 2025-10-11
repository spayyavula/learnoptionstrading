/*
  # Paper Trading Isolated Tables

  This migration creates dedicated tables for paper (simulated) trading, completely separate
  from live broker integration tables. This allows users to practice trading strategies without
  connecting to real brokerage accounts.

  ## New Tables Created

  1. **paper_trading_accounts** - Users can have multiple paper trading accounts
     - Account name, description, initial balance
     - Current balance, buying power, portfolio value
     - Account type (options_focused, stocks_focused, mixed, day_trading)
     - Risk limits and position limits
     - Reset capability with history preservation
     - Performance metrics

  2. **paper_positions** - Current open positions in paper accounts
     - Symbol, quantity, average cost
     - Current market value, unrealized P&L
     - Position type (stock, option, crypto, future)
     - For options: strike, expiry, type (call/put), Greeks
     - Entry date, entry notes
     - Stop loss and take profit levels

  3. **paper_orders** - Paper trading order history
     - Order type (market, limit, stop, stop_limit)
     - Side (buy, sell, buy_to_open, sell_to_open, buy_to_close, sell_to_close)
     - Status (pending, filled, partially_filled, cancelled, rejected)
     - Execution simulation with realistic slippage
     - Fill price, fill timestamp
     - Commission and fees simulation

  4. **paper_transactions** - Complete transaction log
     - Buy/sell transactions with timestamps
     - Quantity, price, total cost
     - Transaction type (trade, dividend, interest, fee, deposit, withdrawal)
     - Links to orders and positions
     - Cash flow impact

  5. **paper_cash_flows** - Account cash movements
     - Deposits, withdrawals, dividends, interest, fees
     - Running balance calculation
     - Cash flow type and description
     - Approval status for withdrawals

  6. **trade_execution_log** - Detailed execution records
     - Simulated slippage based on liquidity
     - Market conditions at execution time
     - Execution latency simulation
     - Partial fills tracking
     - Order book snapshot (if available)

  7. **paper_account_resets** - Reset history for paper accounts
     - Tracks when accounts are reset to initial state
     - Preserves performance data before reset
     - Reset reason and notes
     - Performance summary snapshot

  8. **paper_trade_journal** - User notes and reflections
     - Trade journal entries linked to positions/orders
     - Entry/exit rationale
     - Emotional state tracking
     - Lessons learned
     - Tags for categorization

  ## Security

  - RLS enabled on all tables
  - Users can only access their own paper trading accounts
  - Strict user_id checks on all operations
  - No cross-account data leakage

  ## Performance

  - Indexes on account_id and user_id
  - Composite indexes for common queries
  - Efficient position and order lookups

  ## Business Logic

  - Paper accounts start with configurable initial balance
  - Realistic commission and slippage simulation
  - Position size limits based on account type
  - Pattern day trader rules can be enabled/disabled
  - Options approval level simulation
*/

-- Create paper_trading_accounts table
CREATE TABLE IF NOT EXISTS paper_trading_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
  day_trade_count integer DEFAULT 0,
  pattern_day_trader boolean DEFAULT false,
  simulate_commissions boolean DEFAULT true,
  commission_per_trade numeric(10, 2) DEFAULT 0,
  commission_per_contract numeric(10, 2) DEFAULT 0.65,
  simulate_slippage boolean DEFAULT true,
  slippage_percent numeric(10, 4) DEFAULT 0.05,
  max_position_size_percent numeric(10, 2) DEFAULT 20,
  max_positions_count integer DEFAULT 50,
  enable_pdt_rules boolean DEFAULT true,
  enable_margin_trading boolean DEFAULT true,
  margin_multiplier numeric(10, 2) DEFAULT 2,
  options_approval_level integer DEFAULT 2 CHECK (options_approval_level >= 0 AND options_approval_level <= 5),
  reset_count integer DEFAULT 0,
  total_trades integer DEFAULT 0,
  winning_trades integer DEFAULT 0,
  losing_trades integer DEFAULT 0,
  total_profit_loss numeric(20, 2) DEFAULT 0,
  best_trade numeric(20, 2) DEFAULT 0,
  worst_trade numeric(20, 2) DEFAULT 0,
  average_win numeric(20, 2) DEFAULT 0,
  average_loss numeric(20, 2) DEFAULT 0,
  win_rate numeric(10, 4) DEFAULT 0,
  profit_factor numeric(10, 4) DEFAULT 0,
  sharpe_ratio numeric(10, 6),
  max_drawdown numeric(10, 4),
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, account_name)
);

-- Create paper_positions table
CREATE TABLE IF NOT EXISTS paper_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES paper_trading_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  underlying_symbol text,
  position_type text NOT NULL CHECK (position_type IN ('stock', 'option', 'crypto', 'future', 'etf')),
  asset_class text,
  quantity numeric(20, 8) NOT NULL,
  avg_entry_price numeric(20, 4) NOT NULL,
  total_cost numeric(20, 2) NOT NULL,
  current_price numeric(20, 4),
  market_value numeric(20, 2),
  cost_basis numeric(20, 2),
  unrealized_pl numeric(20, 2),
  unrealized_pl_percent numeric(10, 4),
  realized_pl numeric(20, 2) DEFAULT 0,
  total_pl numeric(20, 2),
  side text NOT NULL CHECK (side IN ('long', 'short')),
  contract_type text CHECK (contract_type IN ('call', 'put')),
  strike_price numeric(20, 4),
  expiration_date date,
  days_to_expiry integer,
  multiplier integer DEFAULT 100,
  delta numeric(10, 6),
  gamma numeric(10, 6),
  theta numeric(10, 6),
  vega numeric(10, 6),
  rho numeric(10, 6),
  implied_volatility numeric(10, 6),
  stop_loss_price numeric(20, 4),
  take_profit_price numeric(20, 4),
  entry_strategy text,
  entry_notes text,
  position_tags text[],
  opened_at timestamptz DEFAULT now(),
  last_updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create paper_orders table
CREATE TABLE IF NOT EXISTS paper_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES paper_trading_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  position_id uuid REFERENCES paper_positions(id) ON DELETE SET NULL,
  symbol text NOT NULL,
  underlying_symbol text,
  order_type text NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit', 'trailing_stop')),
  side text NOT NULL CHECK (side IN ('buy', 'sell', 'buy_to_open', 'sell_to_open', 'buy_to_close', 'sell_to_close')),
  time_in_force text DEFAULT 'day' CHECK (time_in_force IN ('day', 'gtc', 'ioc', 'fok', 'opg', 'cls')),
  quantity numeric(20, 8) NOT NULL,
  filled_quantity numeric(20, 8) DEFAULT 0,
  remaining_quantity numeric(20, 8),
  limit_price numeric(20, 4),
  stop_price numeric(20, 4),
  trailing_percent numeric(10, 4),
  avg_fill_price numeric(20, 4),
  last_fill_price numeric(20, 4),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'accepted', 'partially_filled', 'filled', 'cancelled', 'rejected', 'expired')),
  rejection_reason text,
  simulated_slippage numeric(20, 4) DEFAULT 0,
  commission numeric(20, 4) DEFAULT 0,
  fees numeric(20, 4) DEFAULT 0,
  total_cost numeric(20, 2),
  contract_type text CHECK (contract_type IN ('call', 'put')),
  strike_price numeric(20, 4),
  expiration_date date,
  is_multi_leg boolean DEFAULT false,
  parent_order_id uuid,
  strategy_type text,
  order_notes text,
  submitted_at timestamptz,
  filled_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create paper_transactions table
CREATE TABLE IF NOT EXISTS paper_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES paper_trading_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
  settlement_date date,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create paper_cash_flows table
CREATE TABLE IF NOT EXISTS paper_cash_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES paper_trading_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  flow_type text NOT NULL CHECK (flow_type IN ('deposit', 'withdrawal', 'dividend', 'interest', 'fee', 'commission', 'realized_gain', 'realized_loss')),
  amount numeric(20, 2) NOT NULL,
  description text,
  reference_id uuid,
  running_balance numeric(20, 2) NOT NULL,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create trade_execution_log table
CREATE TABLE IF NOT EXISTS trade_execution_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES paper_trading_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES paper_orders(id) ON DELETE CASCADE NOT NULL,
  execution_type text CHECK (execution_type IN ('full', 'partial', 'cancelled', 'rejected')),
  symbol text NOT NULL,
  quantity numeric(20, 8) NOT NULL,
  execution_price numeric(20, 4) NOT NULL,
  market_price_at_submission numeric(20, 4),
  bid_at_execution numeric(20, 4),
  ask_at_execution numeric(20, 4),
  spread_at_execution numeric(20, 4),
  simulated_slippage_amount numeric(20, 4),
  simulated_latency_ms integer DEFAULT 100,
  liquidity_score numeric(10, 4),
  execution_quality_score numeric(10, 4),
  market_conditions jsonb DEFAULT '{}'::jsonb,
  execution_notes text,
  executed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create paper_account_resets table
CREATE TABLE IF NOT EXISTS paper_account_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES paper_trading_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reset_reason text,
  reset_notes text,
  balance_before_reset numeric(20, 2),
  balance_after_reset numeric(20, 2),
  total_trades_before numeric integer,
  total_pl_before numeric(20, 2),
  win_rate_before numeric(10, 4),
  sharpe_ratio_before numeric(10, 6),
  max_drawdown_before numeric(10, 4),
  performance_snapshot jsonb DEFAULT '{}'::jsonb,
  positions_snapshot jsonb DEFAULT '{}'::jsonb,
  reset_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create paper_trade_journal table
CREATE TABLE IF NOT EXISTS paper_trade_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES paper_trading_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  position_id uuid REFERENCES paper_positions(id) ON DELETE SET NULL,
  order_id uuid REFERENCES paper_orders(id) ON DELETE SET NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('pre_trade', 'during_trade', 'post_trade', 'reflection', 'lesson')),
  symbol text,
  title text NOT NULL,
  content text NOT NULL,
  entry_rationale text,
  exit_rationale text,
  emotional_state text,
  confidence_level integer CHECK (confidence_level >= 1 AND confidence_level <= 10),
  setup_quality integer CHECK (setup_quality >= 1 AND setup_quality <= 10),
  execution_quality integer CHECK (execution_quality >= 1 AND execution_quality <= 10),
  lessons_learned text,
  mistakes_made text,
  what_worked text,
  what_didnt_work text,
  future_improvements text,
  tags text[] DEFAULT ARRAY[]::text[],
  attachments jsonb DEFAULT '[]'::jsonb,
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for paper_trading_accounts
CREATE INDEX IF NOT EXISTS idx_paper_accounts_user ON paper_trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_accounts_active ON paper_trading_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_paper_accounts_default ON paper_trading_accounts(user_id, is_default);

-- Create indexes for paper_positions
CREATE INDEX IF NOT EXISTS idx_paper_positions_account ON paper_positions(account_id);
CREATE INDEX IF NOT EXISTS idx_paper_positions_user ON paper_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_positions_symbol ON paper_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_paper_positions_type ON paper_positions(position_type);
CREATE INDEX IF NOT EXISTS idx_paper_positions_expiration ON paper_positions(expiration_date);

-- Create indexes for paper_orders
CREATE INDEX IF NOT EXISTS idx_paper_orders_account ON paper_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_paper_orders_user ON paper_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_orders_symbol ON paper_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_paper_orders_status ON paper_orders(status);
CREATE INDEX IF NOT EXISTS idx_paper_orders_created ON paper_orders(created_at DESC);

-- Create indexes for paper_transactions
CREATE INDEX IF NOT EXISTS idx_paper_transactions_account ON paper_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_paper_transactions_user ON paper_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_transactions_type ON paper_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_paper_transactions_date ON paper_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_paper_transactions_symbol ON paper_transactions(symbol);

-- Create indexes for paper_cash_flows
CREATE INDEX IF NOT EXISTS idx_cash_flows_account ON paper_cash_flows(account_id);
CREATE INDEX IF NOT EXISTS idx_cash_flows_user ON paper_cash_flows(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_flows_type ON paper_cash_flows(flow_type);
CREATE INDEX IF NOT EXISTS idx_cash_flows_processed ON paper_cash_flows(processed_at DESC);

-- Create indexes for trade_execution_log
CREATE INDEX IF NOT EXISTS idx_execution_log_account ON trade_execution_log(account_id);
CREATE INDEX IF NOT EXISTS idx_execution_log_order ON trade_execution_log(order_id);
CREATE INDEX IF NOT EXISTS idx_execution_log_symbol ON trade_execution_log(symbol);
CREATE INDEX IF NOT EXISTS idx_execution_log_executed ON trade_execution_log(executed_at DESC);

-- Create indexes for paper_account_resets
CREATE INDEX IF NOT EXISTS idx_account_resets_account ON paper_account_resets(account_id);
CREATE INDEX IF NOT EXISTS idx_account_resets_user ON paper_account_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_account_resets_date ON paper_account_resets(reset_at DESC);

-- Create indexes for paper_trade_journal
CREATE INDEX IF NOT EXISTS idx_trade_journal_account ON paper_trade_journal(account_id);
CREATE INDEX IF NOT EXISTS idx_trade_journal_user ON paper_trade_journal(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_journal_position ON paper_trade_journal(position_id);
CREATE INDEX IF NOT EXISTS idx_trade_journal_symbol ON paper_trade_journal(symbol);
CREATE INDEX IF NOT EXISTS idx_trade_journal_tags ON paper_trade_journal USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_trade_journal_favorite ON paper_trade_journal(is_favorite);

-- Enable Row Level Security
ALTER TABLE paper_trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_cash_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_execution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_account_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_trade_journal ENABLE ROW LEVEL SECURITY;

-- RLS Policies for paper_trading_accounts
CREATE POLICY "Users can view own paper accounts"
  ON paper_trading_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own paper accounts"
  ON paper_trading_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own paper accounts"
  ON paper_trading_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own paper accounts"
  ON paper_trading_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for paper_positions
CREATE POLICY "Users can view own paper positions"
  ON paper_positions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own paper positions"
  ON paper_positions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own paper positions"
  ON paper_positions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own paper positions"
  ON paper_positions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for paper_orders
CREATE POLICY "Users can view own paper orders"
  ON paper_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own paper orders"
  ON paper_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own paper orders"
  ON paper_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for paper_transactions
CREATE POLICY "Users can view own paper transactions"
  ON paper_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own paper transactions"
  ON paper_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for paper_cash_flows
CREATE POLICY "Users can view own paper cash flows"
  ON paper_cash_flows FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own paper cash flows"
  ON paper_cash_flows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for trade_execution_log
CREATE POLICY "Users can view own execution logs"
  ON trade_execution_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own execution logs"
  ON trade_execution_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for paper_account_resets
CREATE POLICY "Users can view own account resets"
  ON paper_account_resets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own account resets"
  ON paper_account_resets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for paper_trade_journal
CREATE POLICY "Users can view own journal entries"
  ON paper_trade_journal FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON paper_trade_journal FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON paper_trade_journal FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON paper_trade_journal FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_paper_accounts_updated_at
  BEFORE UPDATE ON paper_trading_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paper_orders_updated_at
  BEFORE UPDATE ON paper_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paper_trade_journal_updated_at
  BEFORE UPDATE ON paper_trade_journal
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create default paper account for new users
CREATE OR REPLACE FUNCTION create_default_paper_account()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO paper_trading_accounts (
    user_id,
    account_name,
    account_description,
    account_type,
    is_default
  ) VALUES (
    NEW.id,
    'My First Paper Account',
    'Default paper trading account with $100,000 starting balance',
    'mixed',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default paper account when user is created
CREATE TRIGGER create_default_paper_account_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_paper_account();
