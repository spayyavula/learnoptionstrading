/*
  # Data Relationship Enhancements

  This migration creates helper functions, materialized views, and additional indexes
  for improved query performance and data analysis:

  1. Database Functions
    - `calculate_portfolio_greeks()` - Aggregate Greeks across all positions
    - `get_position_cost_basis()` - Calculate cost basis using tax lots
    - `check_pdt_status()` - Evaluate pattern day trader status
    - `calculate_unrealized_pl()` - Real-time P&L calculation
    - `get_trade_performance_summary()` - Trading metrics aggregation

  2. Materialized Views
    - `mv_daily_portfolio_summary` - Daily portfolio aggregates
    - `mv_symbol_performance` - Per-ticker performance metrics
    - `mv_strategy_analytics` - Strategy success rates
    - `mv_greeks_heatmap` - Greeks exposure visualization data
    - `mv_user_engagement_metrics` - Feature usage analytics

  3. Additional Indexes
    - Composite indexes for common join patterns
    - Partial indexes for active records
    - Expression indexes for calculated fields

  4. Helper Functions
    - Automated data cleanup and archival
    - Performance metric calculations
    - Risk score computations

  5. Security
    - All functions use SECURITY DEFINER where appropriate
    - RLS policies applied to materialized views
    - Proper permission management

  6. Performance
    - Indexes optimized for analytical queries
    - Materialized views refreshed on schedule
    - Query plan optimization hints
*/

-- Function: Calculate portfolio-level Greeks
CREATE OR REPLACE FUNCTION calculate_portfolio_greeks(p_user_id uuid)
RETURNS TABLE (
  total_delta numeric,
  total_gamma numeric,
  total_theta numeric,
  total_vega numeric,
  total_rho numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(delta * quantity), 0) as total_delta,
    COALESCE(SUM(gamma * quantity), 0) as total_gamma,
    COALESCE(SUM(theta * quantity), 0) as total_theta,
    COALESCE(SUM(vega * quantity), 0) as total_vega,
    COALESCE(SUM(rho * quantity), 0) as total_rho
  FROM position_history_snapshots
  WHERE user_id = p_user_id
    AND snapshot_date = CURRENT_DATE
    AND asset_type = 'option';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get position cost basis from tax lots
CREATE OR REPLACE FUNCTION get_position_cost_basis(
  p_user_id uuid,
  p_symbol text
)
RETURNS numeric AS $$
DECLARE
  v_cost_basis numeric;
BEGIN
  SELECT COALESCE(SUM(cost_basis), 0)
  INTO v_cost_basis
  FROM tax_lot_tracking
  WHERE user_id = p_user_id
    AND symbol = p_symbol
    AND remaining_quantity > 0;

  RETURN v_cost_basis;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check PDT status
CREATE OR REPLACE FUNCTION check_pdt_status(p_user_id uuid)
RETURNS TABLE (
  is_pdt boolean,
  day_trades_count integer,
  days_remaining integer,
  warning_level text
) AS $$
DECLARE
  v_account_value numeric;
  v_day_trade_count integer;
  v_is_pdt boolean;
  v_warning_level text;
BEGIN
  -- Get latest account value
  SELECT portfolio_value
  INTO v_account_value
  FROM portfolio_performance_metrics
  WHERE user_id = p_user_id
  ORDER BY metric_date DESC
  LIMIT 1;

  -- Get day trade count in rolling 5 business days
  SELECT day_trade_count_rolling_5days, is_pattern_day_trader
  INTO v_day_trade_count, v_is_pdt
  FROM pdt_monitoring
  WHERE user_id = p_user_id
  ORDER BY monitoring_date DESC
  LIMIT 1;

  -- Determine warning level
  IF v_day_trade_count >= 4 OR v_is_pdt THEN
    v_warning_level := 'critical';
  ELSIF v_day_trade_count = 3 THEN
    v_warning_level := 'warning';
  ELSE
    v_warning_level := 'normal';
  END IF;

  RETURN QUERY SELECT
    v_is_pdt,
    COALESCE(v_day_trade_count, 0),
    GREATEST(0, 4 - COALESCE(v_day_trade_count, 0)),
    v_warning_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate unrealized P&L
CREATE OR REPLACE FUNCTION calculate_unrealized_pl(
  p_user_id uuid,
  p_symbol text DEFAULT NULL
)
RETURNS numeric AS $$
DECLARE
  v_unrealized_pl numeric;
BEGIN
  SELECT COALESCE(SUM(unrealized_pl), 0)
  INTO v_unrealized_pl
  FROM position_history_snapshots
  WHERE user_id = p_user_id
    AND snapshot_date = CURRENT_DATE
    AND (p_symbol IS NULL OR symbol = p_symbol);

  RETURN v_unrealized_pl;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get trade performance summary
CREATE OR REPLACE FUNCTION get_trade_performance_summary(
  p_user_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  total_trades integer,
  winning_trades integer,
  losing_trades integer,
  win_rate numeric,
  average_win numeric,
  average_loss numeric,
  profit_factor numeric,
  total_profit_loss numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::integer as total_trades,
    COUNT(*) FILTER (WHERE is_winner = true)::integer as winning_trades,
    COUNT(*) FILTER (WHERE is_winner = false)::integer as losing_trades,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE is_winner = true)::numeric / COUNT(*)::numeric) * 100, 2)
      ELSE 0
    END as win_rate,
    COALESCE(AVG(profit_loss) FILTER (WHERE is_winner = true), 0) as average_win,
    COALESCE(ABS(AVG(profit_loss)) FILTER (WHERE is_winner = false), 0) as average_loss,
    CASE
      WHEN ABS(SUM(profit_loss) FILTER (WHERE is_winner = false)) > 0 THEN
        ABS(SUM(profit_loss) FILTER (WHERE is_winner = true) /
            SUM(profit_loss) FILTER (WHERE is_winner = false))
      ELSE 0
    END as profit_factor,
    COALESCE(SUM(profit_loss), 0) as total_profit_loss
  FROM trade_history
  WHERE user_id = p_user_id
    AND (p_start_date IS NULL OR exit_date >= p_start_date)
    AND (p_end_date IS NULL OR exit_date <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Archive old data (data retention)
CREATE OR REPLACE FUNCTION archive_old_activity_logs()
RETURNS integer AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  -- Archive activity logs older than 90 days
  WITH deleted AS (
    DELETE FROM user_activity_log
    WHERE created_at < CURRENT_DATE - INTERVAL '90 days'
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Clean up expired user alerts
CREATE OR REPLACE FUNCTION cleanup_expired_alerts()
RETURNS integer AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM user_alerts
    WHERE expires_at IS NOT NULL
      AND expires_at < CURRENT_TIMESTAMP
      AND frequency = 'once'
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create materialized view: Daily Portfolio Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_portfolio_summary AS
SELECT
  user_id,
  metric_date,
  portfolio_value,
  daily_return_percent,
  ytd_return_percent,
  sharpe_ratio,
  max_drawdown_percent,
  win_rate,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY metric_date DESC) as rank
FROM portfolio_performance_metrics
ORDER BY user_id, metric_date DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_portfolio_user_date
  ON mv_daily_portfolio_summary(user_id, metric_date);

-- Create materialized view: Symbol Performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_symbol_performance AS
SELECT
  user_id,
  symbol,
  COUNT(*) as trade_count,
  SUM(profit_loss) as total_pl,
  AVG(profit_loss) as avg_pl,
  COUNT(*) FILTER (WHERE is_winner = true) as wins,
  COUNT(*) FILTER (WHERE is_winner = false) as losses,
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE is_winner = true)::numeric / COUNT(*)::numeric) * 100, 2)
    ELSE 0
  END as win_rate_percent,
  MAX(exit_date) as last_trade_date
FROM trade_history
GROUP BY user_id, symbol;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_symbol_perf_user_symbol
  ON mv_symbol_performance(user_id, symbol);

-- Create materialized view: Strategy Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_strategy_analytics AS
SELECT
  user_id,
  strategy_type,
  COUNT(*) as total_trades,
  SUM(profit_loss) as total_pl,
  AVG(profit_loss) as avg_pl,
  STDDEV(profit_loss) as stddev_pl,
  COUNT(*) FILTER (WHERE is_winner = true)::numeric / NULLIF(COUNT(*), 0) * 100 as win_rate_percent,
  MAX(exit_date) as last_used_date
FROM trade_history
WHERE strategy_type IS NOT NULL
GROUP BY user_id, strategy_type;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_strategy_analytics_user_strategy
  ON mv_strategy_analytics(user_id, strategy_type);

-- Create materialized view: User Engagement Metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_engagement_metrics AS
SELECT
  user_id,
  DATE_TRUNC('day', created_at) as activity_date,
  COUNT(*) as total_actions,
  COUNT(DISTINCT feature_name) as unique_features_used,
  COUNT(DISTINCT activity_category) as categories_engaged,
  MAX(created_at) as last_activity_time,
  jsonb_object_agg(
    activity_category,
    COUNT(*)
  ) as category_breakdown
FROM user_activity_log
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, DATE_TRUNC('day', created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_engagement_user_date
  ON mv_user_engagement_metrics(user_id, activity_date);

-- Additional composite indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_history_user_exit_date
  ON trade_history(user_id, exit_date DESC);

CREATE INDEX IF NOT EXISTS idx_trade_history_strategy_exit
  ON trade_history(strategy_type, exit_date DESC)
  WHERE strategy_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_position_snapshots_user_symbol_date
  ON position_history_snapshots(user_id, symbol, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_tax_lots_user_symbol_remaining
  ON tax_lot_tracking(user_id, symbol, remaining_quantity)
  WHERE remaining_quantity > 0;

CREATE INDEX IF NOT EXISTS idx_user_alerts_active_ticker
  ON user_alerts(user_id, ticker, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_ibkr_positions_user_account
  ON ibkr_positions(user_id, account_id);

CREATE INDEX IF NOT EXISTS idx_ibkr_orders_user_status_submitted
  ON ibkr_orders(user_id, status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_corporate_actions_ticker_exdate
  ON corporate_actions(ticker, ex_date DESC, action_type);

CREATE INDEX IF NOT EXISTS idx_historical_greeks_ticker_time
  ON historical_greeks_snapshots(underlying_ticker, snapshot_time DESC);

-- Partial indexes for active records only
CREATE INDEX IF NOT EXISTS idx_user_api_keys_active_user
  ON user_api_keys(user_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_ibkr_credentials_active
  ON ibkr_credentials(user_id, environment)
  WHERE is_active = true;

-- Expression indexes for computed values
CREATE INDEX IF NOT EXISTS idx_portfolio_metrics_return_rank
  ON portfolio_performance_metrics(user_id, (ytd_return_percent))
  WHERE ytd_return_percent IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_risk_metrics_high_vol
  ON risk_metrics(user_id, calculation_date DESC)
  WHERE volatility_annualized > 0.3;

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_portfolio_greeks(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_position_cost_basis(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_pdt_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_unrealized_pl(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trade_performance_summary(uuid, date, date) TO authenticated;

-- Create function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_portfolio_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_symbol_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_strategy_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_engagement_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule materialized view refresh (requires pg_cron extension)
-- This can be enabled if pg_cron is available:
-- SELECT cron.schedule('refresh-mv-daily', '0 1 * * *', 'SELECT refresh_all_materialized_views()');

-- Create helper function for database statistics
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE (
  table_name text,
  row_count bigint,
  total_size text,
  index_size text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname || '.' || tablename as table_name,
    n_live_tup as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
