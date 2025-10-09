/*
  # Update Subscription Plans

  1. Changes
    - Add new columns to the subscriptions table to track plan details
    - Add plan_name column to store the display name of the plan (Basic, Pro, Enterprise)
    - Add plan_price column to store the price of the plan
    - Add plan_interval column to store the billing interval (month, year)

  2. Security
    - Maintain existing RLS policies
    - No changes to access control
*/

-- Add new columns to the subscriptions table
ALTER TABLE IF EXISTS subscriptions 
ADD COLUMN IF NOT EXISTS plan_name text,
ADD COLUMN IF NOT EXISTS plan_price numeric,
ADD COLUMN IF NOT EXISTS plan_interval text;

-- Create a function to update plan details based on price_id
CREATE OR REPLACE FUNCTION update_subscription_plan_details()
RETURNS TRIGGER AS $$
BEGIN
  -- Set plan details based on price_id
  IF NEW.price_id LIKE '%basic%' OR NEW.price_id LIKE '%monthly%' THEN
    NEW.plan_name := 'Basic';
    NEW.plan_price := 29;
    NEW.plan_interval := 'month';
  ELSIF NEW.price_id LIKE '%pro%' THEN
    NEW.plan_name := 'Pro';
    NEW.plan_price := 75;
    NEW.plan_interval := 'month';
  ELSIF NEW.price_id LIKE '%enterprise%' OR NEW.price_id LIKE '%yearly%' THEN
    NEW.plan_name := 'Enterprise';
    NEW.plan_price := 25;
    NEW.plan_interval := 'month';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update plan details
DROP TRIGGER IF EXISTS update_subscription_plan_details_trigger ON subscriptions;

CREATE TRIGGER update_subscription_plan_details_trigger
BEFORE INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscription_plan_details();

-- Update existing subscriptions
UPDATE subscriptions
SET 
  plan_name = CASE 
    WHEN price_id LIKE '%basic%' OR price_id LIKE '%monthly%' THEN 'Basic'
    WHEN price_id LIKE '%pro%' THEN 'Pro'
    WHEN price_id LIKE '%enterprise%' OR price_id LIKE '%yearly%' THEN 'Enterprise'
    ELSE NULL
  END,
  plan_price = CASE 
    WHEN price_id LIKE '%basic%' OR price_id LIKE '%monthly%' THEN 29
    WHEN price_id LIKE '%pro%' THEN 75
    WHEN price_id LIKE '%enterprise%' OR price_id LIKE '%yearly%' THEN 25
    ELSE NULL
  END,
  plan_interval = CASE 
    WHEN price_id LIKE '%yearly%' THEN 'year'
    ELSE 'month'
  END
WHERE plan_name IS NULL;