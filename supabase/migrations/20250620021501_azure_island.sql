/*
  # Fix Options Historical Data Insert Policy

  1. Changes
    - Update the insert policy for `options_historical_data` table to allow public access
    - This allows the application to store historical options data without requiring authentication
    - Maintains security for user-specific data while allowing public historical data storage

  2. Security
    - Historical data is considered public information for this application
    - User portfolios remain protected with authenticated-only access
    - This change aligns with the existing public read policy for historical data
*/

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Allow authenticated users to insert options historical data" ON options_historical_data;

-- Create new policy allowing public insert access for options historical data
CREATE POLICY "Allow public insert access to options historical data"
  ON options_historical_data
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Also update the historical_data table policy for consistency
DROP POLICY IF EXISTS "Allow authenticated users to insert historical data" ON historical_data;

CREATE POLICY "Allow public insert access to historical data"
  ON historical_data
  FOR INSERT
  TO public
  WITH CHECK (true);