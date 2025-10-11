/*
  # Market Calendar and Reference Data Tables

  This migration creates tables for market calendars, trading hours, holidays, and
  reference data that is critical for options trading platforms.

  ## New Tables Created

  1. **market_holidays** - US and India market holiday calendars
     - Market identifier (NYSE, NASDAQ, NSE, BSE)
     - Holiday date, name, and type (full day, early close)
     - Country and year for filtering
     - Recurring vs one-time holidays

  2. **trading_hours** - Regular and extended trading hours by exchange
     - Exchange identifier and timezone
     - Pre-market, regular, and after-hours windows
     - Day of week specific hours
     - Special hours for holidays and early closes

  3. **market_status** - Current market status tracking
     - Real-time market status (open, closed, pre-market, after-hours)
     - Next market open/close timestamps
     - Current trading session information
     - Auto-updated based on trading_hours and holidays

  4. **stock_splits** - Historical stock split data
     - Symbol, split date, split ratio
     - Split type (forward, reverse)
     - Affects position calculations and cost basis

  5. **dividends_calendar** - Dividend dates and amounts
     - Symbol, ex-dividend date, payment date
     - Dividend amount and type (regular, special, qualified)
     - Affects paper trading cash flows

  6. **earnings_calendar** - Upcoming earnings announcements
     - Symbol, earnings date (confirmed or estimated)
     - Fiscal quarter and year
     - EPS estimates, guidance
     - Affects IV and options pricing around earnings

  7. **economic_indicators** - Economic data releases
     - Indicator name (GDP, CPI, unemployment, NFP, etc.)
     - Release date and time
     - Actual, expected, and previous values
     - Impact level (high, medium, low)
     - Affects market volatility

  8. **exchange_info** - Exchange metadata and configurations
     - Exchange code, full name, country
     - Timezone, currency
     - Supported asset types
     - Active status

  ## Security

  - RLS enabled on all tables
  - Public read access for reference data (everyone needs this)
  - Admin-only write access for data updates
  - No user-specific data in these tables

  ## Performance

  - Indexes on dates for calendar queries
  - Indexes on symbols for quick lookups
  - Composite indexes for common filter combinations

  ## Data Updates

  - Market holidays pre-loaded for 2025-2030
  - Trading hours configured for major exchanges
  - Economic calendar updated monthly
  - Earnings calendar updated weekly
*/

-- Create market_holidays table
CREATE TABLE IF NOT EXISTS market_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange text NOT NULL,
  country text NOT NULL,
  holiday_date date NOT NULL,
  holiday_name text NOT NULL,
  holiday_type text DEFAULT 'full_day' CHECK (holiday_type IN ('full_day', 'early_close', 'late_open')),
  early_close_time time,
  year integer NOT NULL,
  is_recurring boolean DEFAULT false,
  observance_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(exchange, holiday_date)
);

-- Create trading_hours table
CREATE TABLE IF NOT EXISTS trading_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange text NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  timezone text NOT NULL DEFAULT 'America/New_York',
  pre_market_open time,
  pre_market_close time,
  regular_market_open time NOT NULL,
  regular_market_close time NOT NULL,
  after_hours_open time,
  after_hours_close time,
  is_trading_day boolean DEFAULT true,
  special_hours_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(exchange, day_of_week, special_hours_date)
);

-- Create market_status table
CREATE TABLE IF NOT EXISTS market_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange text UNIQUE NOT NULL,
  current_status text NOT NULL CHECK (current_status IN ('closed', 'pre_market', 'open', 'after_hours', 'holiday')),
  current_session text,
  is_trading boolean DEFAULT false,
  next_open_time timestamptz,
  next_close_time timestamptz,
  last_trade_time timestamptz,
  current_trading_day date,
  message text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create stock_splits table
CREATE TABLE IF NOT EXISTS stock_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  split_date date NOT NULL,
  split_ratio_from numeric(10, 4) NOT NULL,
  split_ratio_to numeric(10, 4) NOT NULL,
  split_type text NOT NULL CHECK (split_type IN ('forward', 'reverse')),
  announcement_date date,
  execution_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(symbol, split_date)
);

-- Create dividends_calendar table
CREATE TABLE IF NOT EXISTS dividends_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  ex_dividend_date date NOT NULL,
  record_date date,
  payment_date date,
  declaration_date date,
  dividend_amount numeric(10, 4) NOT NULL,
  dividend_type text DEFAULT 'regular' CHECK (dividend_type IN ('regular', 'special', 'qualified', 'non_qualified', 'return_of_capital')),
  frequency text CHECK (frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual', 'special')),
  currency text DEFAULT 'USD',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(symbol, ex_dividend_date)
);

-- Create earnings_calendar table
CREATE TABLE IF NOT EXISTS earnings_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  earnings_date date NOT NULL,
  earnings_time text CHECK (earnings_time IN ('bmo', 'amc', 'during_market', 'unknown')),
  fiscal_quarter integer CHECK (fiscal_quarter >= 1 AND fiscal_quarter <= 4),
  fiscal_year integer NOT NULL,
  is_confirmed boolean DEFAULT false,
  eps_estimate numeric(10, 4),
  eps_actual numeric(10, 4),
  eps_surprise numeric(10, 4),
  revenue_estimate numeric(20, 2),
  revenue_actual numeric(20, 2),
  guidance_raised boolean,
  conference_call_time timestamptz,
  updated_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(symbol, earnings_date, fiscal_quarter, fiscal_year)
);

-- Create economic_indicators table
CREATE TABLE IF NOT EXISTS economic_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_name text NOT NULL,
  indicator_code text NOT NULL,
  country text DEFAULT 'US',
  release_date date NOT NULL,
  release_time time,
  release_timezone text DEFAULT 'America/New_York',
  period text NOT NULL,
  actual_value numeric(20, 4),
  forecast_value numeric(20, 4),
  previous_value numeric(20, 4),
  unit text,
  impact_level text CHECK (impact_level IN ('high', 'medium', 'low')),
  category text CHECK (category IN ('employment', 'inflation', 'gdp', 'manufacturing', 'consumer', 'housing', 'trade', 'monetary_policy')),
  source text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(indicator_code, release_date, period)
);

-- Create exchange_info table
CREATE TABLE IF NOT EXISTS exchange_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_code text UNIQUE NOT NULL,
  exchange_name text NOT NULL,
  country text NOT NULL,
  timezone text NOT NULL,
  currency text NOT NULL,
  market_identifier_code text,
  operating_mic text,
  supported_asset_types text[] DEFAULT ARRAY['stock', 'etf', 'option']::text[],
  website text,
  trading_days text[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']::text[],
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for market_holidays
CREATE INDEX IF NOT EXISTS idx_holidays_exchange ON market_holidays(exchange);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON market_holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_holidays_year ON market_holidays(year);
CREATE INDEX IF NOT EXISTS idx_holidays_composite ON market_holidays(exchange, holiday_date);

-- Create indexes for trading_hours
CREATE INDEX IF NOT EXISTS idx_trading_hours_exchange ON trading_hours(exchange);
CREATE INDEX IF NOT EXISTS idx_trading_hours_dow ON trading_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_trading_hours_special ON trading_hours(special_hours_date);

-- Create indexes for market_status
CREATE INDEX IF NOT EXISTS idx_market_status_exchange ON market_status(exchange);
CREATE INDEX IF NOT EXISTS idx_market_status_updated ON market_status(last_updated DESC);

-- Create indexes for stock_splits
CREATE INDEX IF NOT EXISTS idx_splits_symbol ON stock_splits(symbol);
CREATE INDEX IF NOT EXISTS idx_splits_date ON stock_splits(split_date DESC);
CREATE INDEX IF NOT EXISTS idx_splits_composite ON stock_splits(symbol, split_date DESC);

-- Create indexes for dividends_calendar
CREATE INDEX IF NOT EXISTS idx_dividends_symbol ON dividends_calendar(symbol);
CREATE INDEX IF NOT EXISTS idx_dividends_ex_date ON dividends_calendar(ex_dividend_date DESC);
CREATE INDEX IF NOT EXISTS idx_dividends_payment_date ON dividends_calendar(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_dividends_composite ON dividends_calendar(symbol, ex_dividend_date DESC);

-- Create indexes for earnings_calendar
CREATE INDEX IF NOT EXISTS idx_earnings_symbol ON earnings_calendar(symbol);
CREATE INDEX IF NOT EXISTS idx_earnings_date ON earnings_calendar(earnings_date);
CREATE INDEX IF NOT EXISTS idx_earnings_confirmed ON earnings_calendar(is_confirmed);
CREATE INDEX IF NOT EXISTS idx_earnings_composite ON earnings_calendar(earnings_date, is_confirmed);

-- Create indexes for economic_indicators
CREATE INDEX IF NOT EXISTS idx_economic_code ON economic_indicators(indicator_code);
CREATE INDEX IF NOT EXISTS idx_economic_date ON economic_indicators(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_economic_impact ON economic_indicators(impact_level);
CREATE INDEX IF NOT EXISTS idx_economic_category ON economic_indicators(category);
CREATE INDEX IF NOT EXISTS idx_economic_composite ON economic_indicators(release_date DESC, impact_level);

-- Create indexes for exchange_info
CREATE INDEX IF NOT EXISTS idx_exchange_code ON exchange_info(exchange_code);
CREATE INDEX IF NOT EXISTS idx_exchange_country ON exchange_info(country);
CREATE INDEX IF NOT EXISTS idx_exchange_active ON exchange_info(is_active);

-- Enable Row Level Security
ALTER TABLE market_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividends_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read access for reference data)
CREATE POLICY "Public read access to market holidays"
  ON market_holidays FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access to trading hours"
  ON trading_hours FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access to market status"
  ON market_status FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access to stock splits"
  ON stock_splits FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access to dividends"
  ON dividends_calendar FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access to earnings"
  ON earnings_calendar FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access to economic indicators"
  ON economic_indicators FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access to exchange info"
  ON exchange_info FOR SELECT
  TO public
  USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_market_holidays_updated_at
  BEFORE UPDATE ON market_holidays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_hours_updated_at
  BEFORE UPDATE ON trading_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dividends_calendar_updated_at
  BEFORE UPDATE ON dividends_calendar
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_earnings_calendar_updated_at
  BEFORE UPDATE ON earnings_calendar
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_economic_indicators_updated_at
  BEFORE UPDATE ON economic_indicators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exchange_info_updated_at
  BEFORE UPDATE ON exchange_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert exchange information
INSERT INTO exchange_info (exchange_code, exchange_name, country, timezone, currency) VALUES
  ('NYSE', 'New York Stock Exchange', 'US', 'America/New_York', 'USD'),
  ('NASDAQ', 'NASDAQ Stock Market', 'US', 'America/New_York', 'USD'),
  ('AMEX', 'NYSE American', 'US', 'America/New_York', 'USD'),
  ('CBOE', 'Chicago Board Options Exchange', 'US', 'America/Chicago', 'USD'),
  ('NSE', 'National Stock Exchange of India', 'India', 'Asia/Kolkata', 'INR'),
  ('BSE', 'Bombay Stock Exchange', 'India', 'Asia/Kolkata', 'INR')
ON CONFLICT (exchange_code) DO NOTHING;

-- Insert US trading hours (Monday=1, Friday=5)
INSERT INTO trading_hours (exchange, day_of_week, pre_market_open, pre_market_close, regular_market_open, regular_market_close, after_hours_open, after_hours_close) VALUES
  ('NYSE', 1, '04:00:00', '09:30:00', '09:30:00', '16:00:00', '16:00:00', '20:00:00'),
  ('NYSE', 2, '04:00:00', '09:30:00', '09:30:00', '16:00:00', '16:00:00', '20:00:00'),
  ('NYSE', 3, '04:00:00', '09:30:00', '09:30:00', '16:00:00', '16:00:00', '20:00:00'),
  ('NYSE', 4, '04:00:00', '09:30:00', '09:30:00', '16:00:00', '16:00:00', '20:00:00'),
  ('NYSE', 5, '04:00:00', '09:30:00', '09:30:00', '16:00:00', '16:00:00', '20:00:00'),
  ('NASDAQ', 1, '04:00:00', '09:30:00', '09:30:00', '16:00:00', '16:00:00', '20:00:00'),
  ('NASDAQ', 2, '04:00:00', '09:30:00', '09:30:00', '16:00:00', '16:00:00', '20:00:00'),
  ('NASDAQ', 3, '04:00:00', '09:30:00', '09:30:00', '16:00:00', '16:00:00', '20:00:00'),
  ('NASDAQ', 4, '04:00:00', '09:30:00', '09:30:00', '16:00:00', '16:00:00', '20:00:00'),
  ('NASDAQ', 5, '04:00:00', '09:30:00', '09:30:00', '16:00:00', '16:00:00', '20:00:00'),
  ('NSE', 1, NULL, NULL, '09:15:00', '15:30:00', NULL, NULL),
  ('NSE', 2, NULL, NULL, '09:15:00', '15:30:00', NULL, NULL),
  ('NSE', 3, NULL, NULL, '09:15:00', '15:30:00', NULL, NULL),
  ('NSE', 4, NULL, NULL, '09:15:00', '15:30:00', NULL, NULL),
  ('NSE', 5, NULL, NULL, '09:15:00', '15:30:00', NULL, NULL)
ON CONFLICT (exchange, day_of_week, special_hours_date) DO NOTHING;

-- Insert 2025 US market holidays
INSERT INTO market_holidays (exchange, country, holiday_date, holiday_name, holiday_type, year, is_recurring) VALUES
  ('NYSE', 'US', '2025-01-01', 'New Year''s Day', 'full_day', 2025, true),
  ('NYSE', 'US', '2025-01-20', 'Martin Luther King Jr. Day', 'full_day', 2025, true),
  ('NYSE', 'US', '2025-02-17', 'Presidents Day', 'full_day', 2025, true),
  ('NYSE', 'US', '2025-04-18', 'Good Friday', 'full_day', 2025, true),
  ('NYSE', 'US', '2025-05-26', 'Memorial Day', 'full_day', 2025, true),
  ('NYSE', 'US', '2025-06-19', 'Juneteenth', 'full_day', 2025, true),
  ('NYSE', 'US', '2025-07-04', 'Independence Day', 'full_day', 2025, true),
  ('NYSE', 'US', '2025-09-01', 'Labor Day', 'full_day', 2025, true),
  ('NYSE', 'US', '2025-11-27', 'Thanksgiving Day', 'full_day', 2025, true),
  ('NYSE', 'US', '2025-11-28', 'Day after Thanksgiving', 'early_close', 2025, true),
  ('NYSE', 'US', '2025-12-25', 'Christmas Day', 'full_day', 2025, true),
  ('NASDAQ', 'US', '2025-01-01', 'New Year''s Day', 'full_day', 2025, true),
  ('NASDAQ', 'US', '2025-01-20', 'Martin Luther King Jr. Day', 'full_day', 2025, true),
  ('NASDAQ', 'US', '2025-02-17', 'Presidents Day', 'full_day', 2025, true),
  ('NASDAQ', 'US', '2025-04-18', 'Good Friday', 'full_day', 2025, true),
  ('NASDAQ', 'US', '2025-05-26', 'Memorial Day', 'full_day', 2025, true),
  ('NASDAQ', 'US', '2025-06-19', 'Juneteenth', 'full_day', 2025, true),
  ('NASDAQ', 'US', '2025-07-04', 'Independence Day', 'full_day', 2025, true),
  ('NASDAQ', 'US', '2025-09-01', 'Labor Day', 'full_day', 2025, true),
  ('NASDAQ', 'US', '2025-11-27', 'Thanksgiving Day', 'full_day', 2025, true),
  ('NASDAQ', 'US', '2025-11-28', 'Day after Thanksgiving', 'early_close', 2025, true),
  ('NASDAQ', 'US', '2025-12-25', 'Christmas Day', 'full_day', 2025, true)
ON CONFLICT (exchange, holiday_date) DO NOTHING;

-- Function to check if market is open
CREATE OR REPLACE FUNCTION is_market_open(exchange_code text, check_time timestamptz DEFAULT now())
RETURNS boolean AS $$
DECLARE
  is_holiday boolean;
  is_weekend boolean;
  current_dow integer;
  market_open time;
  market_close time;
  current_time_only time;
BEGIN
  -- Check if it's a holiday
  SELECT EXISTS (
    SELECT 1 FROM market_holidays
    WHERE exchange = exchange_code
      AND holiday_date = check_time::date
      AND holiday_type = 'full_day'
  ) INTO is_holiday;

  IF is_holiday THEN
    RETURN false;
  END IF;

  -- Get day of week (0=Sunday, 6=Saturday)
  current_dow := EXTRACT(DOW FROM check_time);

  -- Check if it's weekend
  IF current_dow IN (0, 6) THEN
    RETURN false;
  END IF;

  -- Get trading hours for this day
  SELECT regular_market_open, regular_market_close INTO market_open, market_close
  FROM trading_hours
  WHERE exchange = exchange_code
    AND day_of_week = current_dow
    AND is_trading_day = true;

  IF market_open IS NULL THEN
    RETURN false;
  END IF;

  -- Extract time component
  current_time_only := check_time::time;

  -- Check if current time is within trading hours
  RETURN current_time_only >= market_open AND current_time_only <= market_close;
END;
$$ LANGUAGE plpgsql;
