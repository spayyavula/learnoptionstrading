/*
  # Fix Duplicate strategy_templates Table Conflict

  This migration resolves the conflict where strategy_templates appears in two different
  migrations with different schemas:

  1. In create_saved_strategies.sql: strategy_templates for public reusable templates
  2. In create_greeks_and_strategy_tables.sql: strategy_templates for user strategies

  ## Resolution Strategy

  We'll rename the second table from create_greeks_and_strategy_tables.sql to
  `user_strategy_templates` to differentiate it from the public template library.

  The public strategy_templates table will remain for community/platform templates,
  while user_strategy_templates will be for personal user templates.

  ## Changes

  1. Check if duplicate strategy_templates exists
  2. Rename the second one to user_strategy_templates
  3. Update foreign key references
  4. Update indexes and policies
  5. Migrate any existing data if needed
*/

-- Only execute if the old strategy_templates from greeks exists
-- We can identify it by checking if it has user_id column without is_public column

DO $$
DECLARE
  has_user_id_col boolean;
  has_is_public_col boolean;
BEGIN
  -- Check if strategy_templates has user_id but not is_public
  -- This would be from the greeks_and_strategy_tables migration
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'strategy_templates'
      AND column_name = 'user_id'
  ) INTO has_user_id_col;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'strategy_templates'
      AND column_name = 'is_public'
  ) INTO has_is_public_col;

  -- If we have user_id but not is_public, this is the old table
  -- that needs to be renamed
  IF has_user_id_col AND NOT has_is_public_col THEN
    -- Rename the table
    ALTER TABLE IF EXISTS strategy_templates RENAME TO user_strategy_templates_old;

    -- Update scenario_analysis foreign key if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_name = 'scenario_analysis'
    ) THEN
      ALTER TABLE scenario_analysis
        DROP CONSTRAINT IF EXISTS scenario_analysis_strategy_id_fkey;

      ALTER TABLE scenario_analysis
        ADD CONSTRAINT scenario_analysis_strategy_id_fkey
        FOREIGN KEY (strategy_id)
        REFERENCES user_strategy_templates_old(id)
        ON DELETE CASCADE;
    END IF;

    RAISE NOTICE 'Renamed duplicate strategy_templates to user_strategy_templates_old';
  ELSE
    RAISE NOTICE 'No duplicate strategy_templates found or already resolved';
  END IF;
END $$;

-- Create user_strategy_templates table if it doesn't exist
-- This is for user-specific strategy templates (not public)
CREATE TABLE IF NOT EXISTS user_strategy_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_name text NOT NULL,
  strategy_type text NOT NULL,
  description text,
  legs jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_favorite boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for user_strategy_templates
CREATE INDEX IF NOT EXISTS idx_user_strategy_templates_user
  ON user_strategy_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_strategy_templates_favorite
  ON user_strategy_templates(user_id, is_favorite);

-- Enable RLS on user_strategy_templates
ALTER TABLE user_strategy_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_strategy_templates
CREATE POLICY "Users can view own strategy templates"
  ON user_strategy_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategy templates"
  ON user_strategy_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategy templates"
  ON user_strategy_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategy templates"
  ON user_strategy_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_strategy_templates_updated_at
  BEFORE UPDATE ON user_strategy_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migrate data from old table if it exists and has data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_strategy_templates_old') THEN
    -- Copy data from old table to new table
    INSERT INTO user_strategy_templates (
      id, user_id, template_name, strategy_type, description, legs, created_at, updated_at
    )
    SELECT
      id,
      user_id,
      strategy_name as template_name,
      strategy_type,
      COALESCE(strategy_name, 'User Template') as description,
      legs,
      created_at,
      updated_at
    FROM user_strategy_templates_old
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Migrated data from user_strategy_templates_old to user_strategy_templates';

    -- Drop the old table
    -- DROP TABLE user_strategy_templates_old CASCADE;
    -- RAISE NOTICE 'Dropped old user_strategy_templates_old table';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not migrate data: %', SQLERRM;
END $$;

-- Add comment to document the tables
COMMENT ON TABLE strategy_templates IS 'Public strategy templates available to all users. Created by platform or community.';
COMMENT ON TABLE user_strategy_templates IS 'User-specific strategy templates. Private to each user.';
