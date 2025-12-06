-- Migration: Add password-based authentication
-- This migration adds password_hash column for JWT-based auth

-- Add password_hash column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;

-- Add refresh_token column for token refresh
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_expires_at timestamptz;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token) WHERE refresh_token IS NOT NULL;

-- Function to create user with password
CREATE OR REPLACE FUNCTION create_user_with_password(
  p_email text,
  p_password_hash text,
  p_display_name text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Create new user
  INSERT INTO users (email, password_hash, email_verified)
  VALUES (p_email, p_password_hash, false)
  RETURNING id INTO v_user_id;

  -- Create default profile
  INSERT INTO user_profiles (user_id, display_name, full_name)
  VALUES (v_user_id, p_display_name, p_display_name);

  -- Create default paper trading account
  INSERT INTO paper_trading_accounts (user_id, account_name, account_description, is_default)
  VALUES (v_user_id, 'My Paper Account', 'Default paper trading account with $100,000', true);

  -- Assign free role
  INSERT INTO user_role_assignments (user_id, role_id)
  SELECT v_user_id, id FROM user_roles WHERE role_key = 'free';

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;
