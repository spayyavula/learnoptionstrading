/*
  # Update Application Name

  1. Changes
    - Update application name from "Options World" to "Learn Options Trading Academy"
    - Add metadata field to subscriptions table to store application name
    - Update existing subscriptions to use the new application name
    - Create a trigger to ensure new subscriptions use the correct application name

  2. Security
    - No changes to security policies
    - Maintains existing RLS policies
*/

-- Add metadata field if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN metadata jsonb;
  END IF;
END $$;

-- Update existing subscriptions to include the new app name in metadata
UPDATE subscriptions
SET metadata = COALESCE(metadata, '{}'::jsonb) || 
  jsonb_build_object('app_name', 'Learn Options Trading Academy');

-- Create or replace function to ensure new app name is used
CREATE OR REPLACE FUNCTION ensure_app_name_in_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure metadata exists
  IF NEW.metadata IS NULL THEN
    NEW.metadata := '{}'::jsonb;
  END IF;
  
  -- Add app name if not present
  IF NOT (NEW.metadata ? 'app_name') THEN
    NEW.metadata := NEW.metadata || 
      jsonb_build_object('app_name', 'Learn Options Trading Academy');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure app name is set
DROP TRIGGER IF EXISTS ensure_app_name_trigger ON subscriptions;

CREATE TRIGGER ensure_app_name_trigger
BEFORE INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION ensure_app_name_in_metadata();

-- Update plan names to reflect the new application name
UPDATE subscriptions
SET 
  plan_name = CASE 
    WHEN plan_name = 'Basic' THEN 'Learn Basic'
    WHEN plan_name = 'Pro' THEN 'Learn Pro'
    WHEN plan_name = 'Enterprise' THEN 'Learn Enterprise'
    ELSE plan_name
  END
WHERE plan_name IS NOT NULL;