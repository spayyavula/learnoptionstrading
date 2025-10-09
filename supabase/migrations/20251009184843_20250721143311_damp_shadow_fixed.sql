/*
  # Admin System Setup - Fixed

  1. Changes
    - Add status column to user_roles if it doesn't exist
    - Create audit_logs and admin_settings tables
    - Add admin helper functions
    - Set up RLS policies

  2. Security
    - Enable RLS on all admin tables
    - Add policies for role-based access control
*/

-- Add status column to user_roles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'status'
  ) THEN
    ALTER TABLE user_roles ADD COLUMN status text NOT NULL DEFAULT 'active';
    ALTER TABLE user_roles ADD CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'pending'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'role'
  ) THEN
    ALTER TABLE user_roles ADD COLUMN role text NOT NULL DEFAULT 'user';
  END IF;
  
  -- Add constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'valid_role'
  ) THEN
    ALTER TABLE user_roles ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'manager', 'user'));
  END IF;
END $$;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  action text NOT NULL,
  resource text NOT NULL,
  details text NOT NULL,
  ip_address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM user_roles WHERE user_roles.user_id = $1 AND status = 'active';
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is manager or admin
CREATE OR REPLACE FUNCTION is_manager_or_admin(user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM user_roles WHERE user_roles.user_id = $1 AND status = 'active';
  RETURN user_role IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id uuid,
  p_user_email text,
  p_action text,
  p_resource text,
  p_details text,
  p_ip_address text
) RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO audit_logs (
    user_id, user_email, action, resource, details, ip_address
  ) VALUES (
    p_user_id, p_user_email, p_action, p_resource, p_details, p_ip_address
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist, then create new ones
DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON admin_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for audit_logs (drop if exists first)
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Managers can view audit logs" ON audit_logs;
CREATE POLICY "Managers can view audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (is_manager_or_admin(auth.uid()));

-- Create RLS policies for admin_settings (drop if exists first)
DROP POLICY IF EXISTS "Admins can manage all settings" ON admin_settings;
CREATE POLICY "Admins can manage all settings"
ON admin_settings
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Managers can view settings" ON admin_settings;
CREATE POLICY "Managers can view settings"
ON admin_settings
FOR SELECT
TO authenticated
USING (is_manager_or_admin(auth.uid()));

-- Insert default admin settings
INSERT INTO admin_settings (key, value, description)
VALUES 
  ('security', '{"require_mfa": false, "password_expiry_days": 90, "session_timeout_minutes": 60}', 'Security settings'),
  ('email', '{"welcome_email_enabled": true, "password_reset_enabled": true}', 'Email notification settings'),
  ('system', '{"maintenance_mode": false, "version": "1.0.0"}', 'System settings')
ON CONFLICT (key) DO NOTHING;