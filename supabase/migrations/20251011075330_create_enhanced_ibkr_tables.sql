/*
  # Enhanced IBKR Integration Tables

  This migration creates additional tables for comprehensive IBKR Client Portal API integration:

  1. New Tables
    - `ibkr_margin_requirements` - Track margin requirements by position
      - Initial margin and maintenance margin per position
      - Real-time margin utilization tracking
      - Supports margin call predictions

    - `ibkr_commissions_fees` - Trade cost analysis and tracking
      - Commission per trade with breakdown
      - Exchange fees, regulatory fees, and clearing fees
      - Supports cost basis calculations

    - `ibkr_contract_details` - Comprehensive contract metadata cache
      - Contract specifications (multiplier, tick size, trading hours)
      - Reduces API calls by caching contract metadata
      - Supports contract search and filtering

    - `ibkr_market_data_subscriptions` - Track user market data entitlements
      - Records active market data subscriptions
      - Tracks subscription costs and renewal dates
      - Enables permission-based data access

    - `ibkr_connection_logs` - Gateway connectivity debugging
      - Records connection attempts, successes, and failures
      - Tracks latency and performance metrics
      - Enables troubleshooting connectivity issues

    - `ibkr_notification_preferences` - Alert routing configuration
      - User preferences for order fills, margin calls, etc.
      - Multi-channel notification support (email, SMS, push)
      - Enables customizable alert thresholds

  2. Security
    - RLS enabled on all tables
    - Users can only access their own data
    - Foreign keys link to auth.users for data isolation
    - Indexes for performance optimization

  3. Performance
    - Indexes on user_id for fast user-specific queries
    - Composite indexes for common query patterns
    - Timestamp indexes for time-based analytics

  4. Integration
    - Links to existing ibkr_orders and ibkr_positions tables
    - Supports real-time margin and cost tracking
    - Enables comprehensive trade analysis
*/

-- Create ibkr_margin_requirements table
CREATE TABLE IF NOT EXISTS ibkr_margin_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id text NOT NULL,
  position_id uuid,
  conid bigint,
  symbol text NOT NULL,
  initial_margin numeric(20, 2) NOT NULL DEFAULT 0,
  maintenance_margin numeric(20, 2) NOT NULL DEFAULT 0,
  overnight_margin numeric(20, 2),
  intraday_margin numeric(20, 2),
  margin_excess numeric(20, 2),
  margin_utilization_percent numeric(10, 4),
  requirement_type text CHECK (requirement_type IN ('reg_t', 'portfolio', 'span')),
  calculation_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ibkr_commissions_fees table
CREATE TABLE IF NOT EXISTS ibkr_commissions_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id text NOT NULL,
  order_id uuid,
  ibkr_order_id text,
  trade_id text,
  symbol text NOT NULL,
  trade_date timestamptz NOT NULL,
  quantity numeric(20, 8) NOT NULL,
  commission numeric(20, 4) DEFAULT 0,
  exchange_fee numeric(20, 4) DEFAULT 0,
  regulatory_fee numeric(20, 4) DEFAULT 0,
  clearing_fee numeric(20, 4) DEFAULT 0,
  other_fees numeric(20, 4) DEFAULT 0,
  total_cost numeric(20, 4) NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  fee_breakdown jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create ibkr_contract_details table
CREATE TABLE IF NOT EXISTS ibkr_contract_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conid bigint UNIQUE NOT NULL,
  symbol text NOT NULL,
  underlying_symbol text,
  sec_type text NOT NULL CHECK (sec_type IN ('STK', 'OPT', 'FUT', 'CASH', 'BOND', 'CFD')),
  exchange text,
  primary_exchange text,
  currency text DEFAULT 'USD',
  multiplier integer DEFAULT 100,
  strike numeric(20, 4),
  expiry date,
  right text CHECK (right IN ('C', 'P', 'CALL', 'PUT')),
  contract_month text,
  trading_class text,
  min_tick numeric(20, 8),
  order_types text[],
  valid_exchanges text[],
  time_zone_id text,
  trading_hours text,
  liquid_hours text,
  long_name text,
  industry text,
  category text,
  subcategory text,
  market_cap bigint,
  shares_outstanding bigint,
  contract_metadata jsonb DEFAULT '{}'::jsonb,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create ibkr_market_data_subscriptions table
CREATE TABLE IF NOT EXISTS ibkr_market_data_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id text NOT NULL,
  subscription_type text NOT NULL,
  exchange text,
  data_type text CHECK (data_type IN ('real_time', 'delayed', 'snapshot', 'historical')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'cancelled')),
  monthly_cost numeric(10, 2),
  start_date date DEFAULT CURRENT_DATE,
  renewal_date date,
  auto_renew boolean DEFAULT true,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ibkr_connection_logs table
CREATE TABLE IF NOT EXISTS ibkr_connection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connection_type text NOT NULL CHECK (connection_type IN ('gateway', 'websocket', 'rest_api')),
  action text NOT NULL CHECK (action IN ('connect', 'disconnect', 'authenticate', 'tickle', 'error', 'timeout')),
  gateway_host text,
  gateway_port integer,
  status text NOT NULL CHECK (status IN ('success', 'failure', 'warning')),
  response_time_ms integer,
  error_code text,
  error_message text,
  request_details jsonb DEFAULT '{}'::jsonb,
  response_details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create ibkr_notification_preferences table
CREATE TABLE IF NOT EXISTS ibkr_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  order_filled_email boolean DEFAULT true,
  order_filled_sms boolean DEFAULT false,
  order_filled_push boolean DEFAULT true,
  order_rejected_email boolean DEFAULT true,
  order_rejected_sms boolean DEFAULT false,
  order_rejected_push boolean DEFAULT true,
  margin_call_email boolean DEFAULT true,
  margin_call_sms boolean DEFAULT true,
  margin_call_push boolean DEFAULT true,
  position_alert_email boolean DEFAULT true,
  position_alert_sms boolean DEFAULT false,
  position_alert_push boolean DEFAULT true,
  session_expiry_email boolean DEFAULT true,
  session_expiry_sms boolean DEFAULT false,
  session_expiry_push boolean DEFAULT true,
  email_address text,
  phone_number text,
  push_token text,
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text DEFAULT 'America/New_York',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for ibkr_margin_requirements
CREATE INDEX IF NOT EXISTS idx_ibkr_margin_user ON ibkr_margin_requirements(user_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_margin_account ON ibkr_margin_requirements(account_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_margin_symbol ON ibkr_margin_requirements(symbol);
CREATE INDEX IF NOT EXISTS idx_ibkr_margin_date ON ibkr_margin_requirements(calculation_date DESC);
CREATE INDEX IF NOT EXISTS idx_ibkr_margin_utilization ON ibkr_margin_requirements(margin_utilization_percent);

-- Create indexes for ibkr_commissions_fees
CREATE INDEX IF NOT EXISTS idx_ibkr_fees_user ON ibkr_commissions_fees(user_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_fees_account ON ibkr_commissions_fees(account_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_fees_order ON ibkr_commissions_fees(ibkr_order_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_fees_symbol ON ibkr_commissions_fees(symbol);
CREATE INDEX IF NOT EXISTS idx_ibkr_fees_date ON ibkr_commissions_fees(trade_date DESC);

-- Create indexes for ibkr_contract_details
CREATE INDEX IF NOT EXISTS idx_ibkr_contract_conid ON ibkr_contract_details(conid);
CREATE INDEX IF NOT EXISTS idx_ibkr_contract_symbol ON ibkr_contract_details(symbol);
CREATE INDEX IF NOT EXISTS idx_ibkr_contract_underlying ON ibkr_contract_details(underlying_symbol);
CREATE INDEX IF NOT EXISTS idx_ibkr_contract_sectype ON ibkr_contract_details(sec_type);
CREATE INDEX IF NOT EXISTS idx_ibkr_contract_expiry ON ibkr_contract_details(expiry);
CREATE INDEX IF NOT EXISTS idx_ibkr_contract_strike ON ibkr_contract_details(strike);

-- Create indexes for ibkr_market_data_subscriptions
CREATE INDEX IF NOT EXISTS idx_ibkr_mds_user ON ibkr_market_data_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_mds_account ON ibkr_market_data_subscriptions(account_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_mds_status ON ibkr_market_data_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_ibkr_mds_renewal ON ibkr_market_data_subscriptions(renewal_date);

-- Create indexes for ibkr_connection_logs
CREATE INDEX IF NOT EXISTS idx_ibkr_conn_user ON ibkr_connection_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_conn_type ON ibkr_connection_logs(connection_type);
CREATE INDEX IF NOT EXISTS idx_ibkr_conn_action ON ibkr_connection_logs(action);
CREATE INDEX IF NOT EXISTS idx_ibkr_conn_status ON ibkr_connection_logs(status);
CREATE INDEX IF NOT EXISTS idx_ibkr_conn_created ON ibkr_connection_logs(created_at DESC);

-- Create indexes for ibkr_notification_preferences
CREATE INDEX IF NOT EXISTS idx_ibkr_notif_user ON ibkr_notification_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE ibkr_margin_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ibkr_commissions_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE ibkr_contract_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE ibkr_market_data_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ibkr_connection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ibkr_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ibkr_margin_requirements
CREATE POLICY "Users can view own margin requirements"
  ON ibkr_margin_requirements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own margin requirements"
  ON ibkr_margin_requirements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own margin requirements"
  ON ibkr_margin_requirements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own margin requirements"
  ON ibkr_margin_requirements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for ibkr_commissions_fees
CREATE POLICY "Users can view own commissions and fees"
  ON ibkr_commissions_fees FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commissions and fees"
  ON ibkr_commissions_fees FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ibkr_contract_details (public read for contract info)
CREATE POLICY "Public read access to contract details"
  ON ibkr_contract_details FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert contract details"
  ON ibkr_contract_details FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contract details"
  ON ibkr_contract_details FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for ibkr_market_data_subscriptions
CREATE POLICY "Users can view own market data subscriptions"
  ON ibkr_market_data_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own market data subscriptions"
  ON ibkr_market_data_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own market data subscriptions"
  ON ibkr_market_data_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own market data subscriptions"
  ON ibkr_market_data_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for ibkr_connection_logs
CREATE POLICY "Users can view own connection logs"
  ON ibkr_connection_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connection logs"
  ON ibkr_connection_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ibkr_notification_preferences
CREATE POLICY "Users can view own notification preferences"
  ON ibkr_notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON ibkr_notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON ibkr_notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification preferences"
  ON ibkr_notification_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_ibkr_margin_requirements_updated_at
  BEFORE UPDATE ON ibkr_margin_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibkr_market_data_subscriptions_updated_at
  BEFORE UPDATE ON ibkr_market_data_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibkr_notification_preferences_updated_at
  BEFORE UPDATE ON ibkr_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
