/*
  # Fix RLS Policies for Historical Data Storage

  1. Changes
    - Drop existing restrictive policies that prevent data insertion
    - Create new policies allowing public insert access for both historical_data and options_historical_data tables
    - Maintain existing read policies while enabling write access for data collection

  2. Security
    - Historical market data is considered public information
    - These tables store market data, not user-specific sensitive information
    - User portfolios and personal data remain protected with authentication requirements
*/

-- First, ensure RLS is enabled on both tables
ALTER TABLE historical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE options_historical_data ENABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive insert policies
DROP POLICY IF EXISTS "Allow authenticated users to insert historical data" ON historical_data;
DROP POLICY IF EXISTS "Allow authenticated users to insert options historical data" ON options_historical_data;
DROP POLICY IF EXISTS "Allow public insert access to historical data" ON historical_data;
DROP POLICY IF EXISTS "Allow public insert access to options historical data" ON options_historical_data;

-- Create new policies allowing public insert access for historical_data
CREATE POLICY "Enable public insert for historical_data"
  ON historical_data
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create new policies allowing public insert access for options_historical_data
CREATE POLICY "Enable public insert for options_historical_data"
  ON options_historical_data
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure public read access is also available (if not already present)
DROP POLICY IF EXISTS "Enable public read for historical_data" ON historical_data;
DROP POLICY IF EXISTS "Enable public read for options_historical_data" ON options_historical_data;

CREATE POLICY "Enable public read for historical_data"
  ON historical_data
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable public read for options_historical_data"
  ON options_historical_data
  FOR SELECT
  TO public
  USING (true);

-- Allow public update access for upsert operations
DROP POLICY IF EXISTS "Enable public update for historical_data" ON historical_data;
DROP POLICY IF EXISTS "Enable public update for options_historical_data" ON options_historical_data;

CREATE POLICY "Enable public update for historical_data"
  ON historical_data
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable public update for options_historical_data"
  ON options_historical_data
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);