/*
  # Seed Indian Stock Market Data for Screener

  ## Summary
  Populates the screener_stocks table with major Indian stocks from NIFTY and BANKNIFTY indices.
  Includes stocks from various sectors: Banking, IT, Pharma, Auto, Energy, FMCG, Metal, Finance, Telecom, Defense.

  ## Changes

  1. Seeds screener_stocks table with:
    - Index futures (NIFTY, BANKNIFTY)
    - Major banking stocks (HDFCBANK, ICICIBANK, AXISBANK, SBIN, etc.)
    - IT sector stocks (TCS, INFY, WIPRO)
    - Pharma stocks (DIVISLAB, etc.)
    - Auto sector (TATAMOTORS)
    - Energy (RELIANCE)
    - FMCG (ITC)
    - Metal (TATASTEEL)
    - Finance (BAJFINANCE, BSE, CDSL)
    - Telecom (BHARTIARTL)
    - Defense (BEL)

  2. All stocks marked as liquid by default
  3. Exchange set to NSE (National Stock Exchange)

  ## Notes
  - Uses INSERT with ON CONFLICT DO NOTHING to prevent duplicates
  - Safe to run multiple times
*/

-- Insert index futures
INSERT INTO screener_stocks (ticker, name, sector, exchange, is_liquid)
VALUES
  ('NIFTY', 'NIFTY 50 Index', 'INDEX', 'NSE', true),
  ('BANKNIFTY', 'Bank Nifty Index', 'INDEX', 'NSE', true)
ON CONFLICT (ticker) DO NOTHING;

-- Insert banking sector stocks
INSERT INTO screener_stocks (ticker, name, sector, exchange, is_liquid)
VALUES
  ('HDFCBANK', 'HDFC Bank Limited', 'BANK', 'NSE', true),
  ('ICICIBANK', 'ICICI Bank Limited', 'BANK', 'NSE', true),
  ('AXISBANK', 'Axis Bank Limited', 'BANK', 'NSE', true),
  ('SBIN', 'State Bank of India', 'BANK', 'NSE', true),
  ('KOTAKBANK', 'Kotak Mahindra Bank', 'BANK', 'NSE', true),
  ('INDUSINDBK', 'IndusInd Bank Limited', 'BANK', 'NSE', true),
  ('CANBK', 'Canara Bank', 'BANK', 'NSE', true),
  ('PNB', 'Punjab National Bank', 'BANK', 'NSE', true),
  ('BANDHANBNK', 'Bandhan Bank Limited', 'BANK', 'NSE', true)
ON CONFLICT (ticker) DO NOTHING;

-- Insert IT sector stocks
INSERT INTO screener_stocks (ticker, name, sector, exchange, is_liquid)
VALUES
  ('TCS', 'Tata Consultancy Services', 'IT', 'NSE', true),
  ('INFY', 'Infosys Limited', 'IT', 'NSE', true),
  ('WIPRO', 'Wipro Limited', 'IT', 'NSE', true),
  ('HCLTECH', 'HCL Technologies Limited', 'IT', 'NSE', true),
  ('TECHM', 'Tech Mahindra Limited', 'IT', 'NSE', true),
  ('LTIM', 'LTIMindtree Limited', 'IT', 'NSE', true)
ON CONFLICT (ticker) DO NOTHING;

-- Insert pharma sector stocks
INSERT INTO screener_stocks (ticker, name, sector, exchange, is_liquid)
VALUES
  ('DIVISLAB', 'Divi''s Laboratories', 'PHARMA', 'NSE', true),
  ('SUNPHARMA', 'Sun Pharmaceutical Industries', 'PHARMA', 'NSE', true),
  ('DRREDDY', 'Dr. Reddy''s Laboratories', 'PHARMA', 'NSE', true),
  ('CIPLA', 'Cipla Limited', 'PHARMA', 'NSE', true),
  ('AUROPHARMA', 'Aurobindo Pharma Limited', 'PHARMA', 'NSE', true)
ON CONFLICT (ticker) DO NOTHING;

-- Insert auto sector stocks
INSERT INTO screener_stocks (ticker, name, sector, exchange, is_liquid)
VALUES
  ('TATAMOTORS', 'Tata Motors Limited', 'AUTO', 'NSE', true),
  ('MARUTI', 'Maruti Suzuki India Limited', 'AUTO', 'NSE', true),
  ('M&M', 'Mahindra & Mahindra Limited', 'AUTO', 'NSE', true),
  ('BAJAJ-AUTO', 'Bajaj Auto Limited', 'AUTO', 'NSE', true),
  ('EICHERMOT', 'Eicher Motors Limited', 'AUTO', 'NSE', true)
ON CONFLICT (ticker) DO NOTHING;

-- Insert energy sector stocks
INSERT INTO screener_stocks (ticker, name, sector, exchange, is_liquid)
VALUES
  ('RELIANCE', 'Reliance Industries Limited', 'ENERGY', 'NSE', true),
  ('ONGC', 'Oil & Natural Gas Corporation', 'ENERGY', 'NSE', true),
  ('BPCL', 'Bharat Petroleum Corporation', 'ENERGY', 'NSE', true),
  ('IOC', 'Indian Oil Corporation', 'ENERGY', 'NSE', true),
  ('POWERGRID', 'Power Grid Corporation of India', 'ENERGY', 'NSE', true)
ON CONFLICT (ticker) DO NOTHING;

-- Insert FMCG sector stocks
INSERT INTO screener_stocks (ticker, name, sector, exchange, is_liquid)
VALUES
  ('ITC', 'ITC Limited', 'FMCG', 'NSE', true),
  ('HINDUNILVR', 'Hindustan Unilever Limited', 'FMCG', 'NSE', true),
  ('NESTLEIND', 'Nestle India Limited', 'FMCG', 'NSE', true),
  ('BRITANNIA', 'Britannia Industries Limited', 'FMCG', 'NSE', true),
  ('DABUR', 'Dabur India Limited', 'FMCG', 'NSE', true)
ON CONFLICT (ticker) DO NOTHING;

-- Insert metal sector stocks
INSERT INTO screener_stocks (ticker, name, sector, exchange, is_liquid)
VALUES
  ('TATASTEEL', 'Tata Steel Limited', 'METAL', 'NSE', true),
  ('HINDALCO', 'Hindalco Industries Limited', 'METAL', 'NSE', true),
  ('JSWSTEEL', 'JSW Steel Limited', 'METAL', 'NSE', true),
  ('VEDL', 'Vedanta Limited', 'METAL', 'NSE', true),
  ('COALINDIA', 'Coal India Limited', 'METAL', 'NSE', true)
ON CONFLICT (ticker) DO NOTHING;

-- Insert finance sector stocks
INSERT INTO screener_stocks (ticker, name, sector, exchange, is_liquid)
VALUES
  ('BAJFINANCE', 'Bajaj Finance Limited', 'FINANCE', 'NSE', true),
  ('BAJAJFINSV', 'Bajaj Finserv Limited', 'FINANCE', 'NSE', true),
  ('BSE', 'BSE Limited', 'FINANCE', 'NSE', true),
  ('CDSL', 'Central Depository Services Limited', 'FINANCE', 'NSE', true),
  ('SHRIRAMFIN', 'Shriram Finance Limited', 'FINANCE', 'NSE', true)
ON CONFLICT (ticker) DO NOTHING;

-- Insert telecom sector stocks
INSERT INTO screener_stocks (ticker, name, sector, exchange, is_liquid)
VALUES
  ('BHARTIARTL', 'Bharti Airtel Limited', 'TELECOM', 'NSE', true),
  ('IDEA', 'Vodafone Idea Limited', 'TELECOM', 'NSE', true)
ON CONFLICT (ticker) DO NOTHING;

-- Insert defense sector stocks
INSERT INTO screener_stocks (ticker, name, sector, exchange, is_liquid)
VALUES
  ('BEL', 'Bharat Electronics Limited', 'DEFENSE', 'NSE', true),
  ('HAL', 'Hindustan Aeronautics Limited', 'DEFENSE', 'NSE', true)
ON CONFLICT (ticker) DO NOTHING;

-- Insert additional high-volume stocks
INSERT INTO screener_stocks (ticker, name, sector, exchange, is_liquid)
VALUES
  ('ADANIENT', 'Adani Enterprises Limited', 'CONGLOMERATE', 'NSE', true),
  ('ADANIPORTS', 'Adani Ports and Special Economic Zone', 'INFRASTRUCTURE', 'NSE', true),
  ('LT', 'Larsen & Toubro Limited', 'INFRASTRUCTURE', 'NSE', true),
  ('ULTRACEMCO', 'UltraTech Cement Limited', 'CEMENT', 'NSE', true),
  ('GRASIM', 'Grasim Industries Limited', 'CEMENT', 'NSE', true)
ON CONFLICT (ticker) DO NOTHING;
