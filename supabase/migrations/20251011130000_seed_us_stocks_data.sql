/*
  # Seed US Stock Market Data for Screener

  ## Summary
  Populates the screener_stocks table with major US stocks from DOW 30 and NASDAQ indices.
  Includes stocks from various sectors: Technology, Finance, Healthcare, Consumer, Industrial, Energy, etc.

  ## Changes

  1. Removes Indian stocks
  2. Seeds screener_stocks table with:
    - Index futures (SPX, NDX, DJI)
    - DOW 30 components
    - Major NASDAQ stocks (FAANG+, Tech leaders)
    - Healthcare stocks
    - Financial stocks
    - Consumer stocks
    - Industrial stocks
    - Energy stocks

  3. All stocks marked as liquid by default
  4. Exchange set to various US exchanges (NASDAQ, NYSE, etc.)

  ## Notes
  - Clears existing data first to avoid conflicts
  - Safe to run multiple times
*/

-- Clear existing stocks
DELETE FROM screener_stocks;

-- Insert index futures
INSERT INTO screener_stocks (ticker, name, sector, exchange, is_liquid)
VALUES
  ('SPX', 'S&P 500 Index', 'INDEX', 'CBOE', true),
  ('NDX', 'NASDAQ 100 Index', 'INDEX', 'NASDAQ', true),
  ('DJI', 'Dow Jones Industrial Average', 'INDEX', 'NYSE', true)
ON CONFLICT (ticker) DO NOTHING;

-- Insert DOW 30 stocks
INSERT INTO screener_stocks (ticker, name, sector, exchange, is_liquid)
VALUES
  ('AAPL', 'Apple Inc.', 'TECHNOLOGY', 'NASDAQ', true),
  ('MSFT', 'Microsoft Corporation', 'TECHNOLOGY', 'NASDAQ', true),
  ('JNJ', 'Johnson & Johnson', 'HEALTHCARE', 'NYSE', true),
  ('V', 'Visa Inc.', 'FINANCE', 'NYSE', true),
  ('JPM', 'JPMorgan Chase & Co.', 'FINANCE', 'NYSE', true),
  ('WMT', 'Walmart Inc.', 'CONSUMER', 'NYSE', true),
  ('PG', 'Procter & Gamble Co.', 'CONSUMER', 'NYSE', true),
  ('UNH', 'UnitedHealth Group Inc.', 'HEALTHCARE', 'NYSE', true),
  ('HD', 'Home Depot Inc.', 'CONSUMER', 'NYSE', true),
  ('DIS', 'Walt Disney Company', 'ENTERTAINMENT', 'NYSE', true),
  ('MA', 'Mastercard Inc.', 'FINANCE', 'NYSE', true),
  ('BAC', 'Bank of America Corp.', 'FINANCE', 'NYSE', true),
  ('XOM', 'Exxon Mobil Corporation', 'ENERGY', 'NYSE', true),
  ('CVX', 'Chevron Corporation', 'ENERGY', 'NYSE', true),
  ('KO', 'Coca-Cola Company', 'CONSUMER', 'NYSE', true),
  ('PFE', 'Pfizer Inc.', 'HEALTHCARE', 'NYSE', true),
  ('MRK', 'Merck & Co. Inc.', 'HEALTHCARE', 'NYSE', true),
  ('CSCO', 'Cisco Systems Inc.', 'TECHNOLOGY', 'NASDAQ', true),
  ('INTC', 'Intel Corporation', 'TECHNOLOGY', 'NASDAQ', true),
  ('VZ', 'Verizon Communications', 'TELECOM', 'NYSE', true),
  ('NKE', 'Nike Inc.', 'CONSUMER', 'NYSE', true),
  ('CRM', 'Salesforce Inc.', 'TECHNOLOGY', 'NYSE', true),
  ('MCD', 'McDonald''s Corporation', 'CONSUMER', 'NYSE', true),
  ('HON', 'Honeywell International', 'INDUSTRIAL', 'NASDAQ', true),
  ('CAT', 'Caterpillar Inc.', 'INDUSTRIAL', 'NYSE', true),
  ('GS', 'Goldman Sachs Group', 'FINANCE', 'NYSE', true),
  ('IBM', 'IBM Corporation', 'TECHNOLOGY', 'NYSE', true),
  ('AMGN', 'Amgen Inc.', 'HEALTHCARE', 'NASDAQ', true),
  ('AXP', 'American Express Company', 'FINANCE', 'NYSE', true),
  ('MMM', '3M Company', 'INDUSTRIAL', 'NYSE', true)
ON CONFLICT (ticker) DO NOTHING;

-- Insert major NASDAQ stocks
INSERT INTO screener_stocks (ticker, name, sector, exchange, is_liquid)
VALUES
  ('GOOGL', 'Alphabet Inc. Class A', 'TECHNOLOGY', 'NASDAQ', true),
  ('GOOG', 'Alphabet Inc. Class C', 'TECHNOLOGY', 'NASDAQ', true),
  ('AMZN', 'Amazon.com Inc.', 'TECHNOLOGY', 'NASDAQ', true),
  ('NVDA', 'NVIDIA Corporation', 'TECHNOLOGY', 'NASDAQ', true),
  ('META', 'Meta Platforms Inc.', 'TECHNOLOGY', 'NASDAQ', true),
  ('TSLA', 'Tesla Inc.', 'AUTO', 'NASDAQ', true),
  ('NFLX', 'Netflix Inc.', 'ENTERTAINMENT', 'NASDAQ', true),
  ('ADBE', 'Adobe Inc.', 'TECHNOLOGY', 'NASDAQ', true),
  ('PYPL', 'PayPal Holdings Inc.', 'FINANCE', 'NASDAQ', true),
  ('CMCSA', 'Comcast Corporation', 'TELECOM', 'NASDAQ', true),
  ('COST', 'Costco Wholesale Corp.', 'CONSUMER', 'NASDAQ', true),
  ('PEP', 'PepsiCo Inc.', 'CONSUMER', 'NASDAQ', true),
  ('AVGO', 'Broadcom Inc.', 'TECHNOLOGY', 'NASDAQ', true),
  ('TXN', 'Texas Instruments Inc.', 'TECHNOLOGY', 'NASDAQ', true),
  ('QCOM', 'QUALCOMM Inc.', 'TECHNOLOGY', 'NASDAQ', true),
  ('TMUS', 'T-Mobile US Inc.', 'TELECOM', 'NASDAQ', true),
  ('INTU', 'Intuit Inc.', 'TECHNOLOGY', 'NASDAQ', true),
  ('AMAT', 'Applied Materials Inc.', 'TECHNOLOGY', 'NASDAQ', true),
  ('AMD', 'Advanced Micro Devices', 'TECHNOLOGY', 'NASDAQ', true),
  ('SBUX', 'Starbucks Corporation', 'CONSUMER', 'NASDAQ', true),
  ('ISRG', 'Intuitive Surgical Inc.', 'HEALTHCARE', 'NASDAQ', true),
  ('GILD', 'Gilead Sciences Inc.', 'HEALTHCARE', 'NASDAQ', true),
  ('BKNG', 'Booking Holdings Inc.', 'CONSUMER', 'NASDAQ', true),
  ('ADP', 'Automatic Data Processing', 'TECHNOLOGY', 'NASDAQ', true),
  ('MDLZ', 'Mondelez International', 'CONSUMER', 'NASDAQ', true),
  ('REGN', 'Regeneron Pharmaceuticals', 'HEALTHCARE', 'NASDAQ', true),
  ('VRTX', 'Vertex Pharmaceuticals', 'HEALTHCARE', 'NASDAQ', true)
ON CONFLICT (ticker) DO NOTHING;

-- Insert additional NYSE stocks
INSERT INTO screener_stocks (ticker, name, sector, exchange, is_liquid)
VALUES
  ('BA', 'Boeing Company', 'INDUSTRIAL', 'NYSE', true),
  ('GE', 'General Electric Company', 'INDUSTRIAL', 'NYSE', true),
  ('LMT', 'Lockheed Martin Corp.', 'DEFENSE', 'NYSE', true),
  ('RTX', 'Raytheon Technologies', 'DEFENSE', 'NYSE', true),
  ('C', 'Citigroup Inc.', 'FINANCE', 'NYSE', true),
  ('WFC', 'Wells Fargo & Company', 'FINANCE', 'NYSE', true),
  ('MS', 'Morgan Stanley', 'FINANCE', 'NYSE', true),
  ('BLK', 'BlackRock Inc.', 'FINANCE', 'NYSE', true),
  ('SPGI', 'S&P Global Inc.', 'FINANCE', 'NYSE', true),
  ('T', 'AT&T Inc.', 'TELECOM', 'NYSE', true),
  ('NEE', 'NextEra Energy Inc.', 'ENERGY', 'NYSE', true),
  ('DUK', 'Duke Energy Corporation', 'ENERGY', 'NYSE', true),
  ('SO', 'Southern Company', 'ENERGY', 'NYSE', true),
  ('LOW', 'Lowe''s Companies Inc.', 'CONSUMER', 'NYSE', true),
  ('TGT', 'Target Corporation', 'CONSUMER', 'NYSE', true),
  ('CVS', 'CVS Health Corporation', 'HEALTHCARE', 'NYSE', true),
  ('ABBV', 'AbbVie Inc.', 'HEALTHCARE', 'NYSE', true),
  ('TMO', 'Thermo Fisher Scientific', 'HEALTHCARE', 'NYSE', true),
  ('DHR', 'Danaher Corporation', 'HEALTHCARE', 'NYSE', true),
  ('LLY', 'Eli Lilly and Company', 'HEALTHCARE', 'NYSE', true),
  ('ABT', 'Abbott Laboratories', 'HEALTHCARE', 'NYSE', true),
  ('BMY', 'Bristol Myers Squibb', 'HEALTHCARE', 'NYSE', true)
ON CONFLICT (ticker) DO NOTHING;
