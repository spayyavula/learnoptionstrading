/*
  # Admin Management System
  
  1. New Tables
    - `user_roles` - Stores user roles and status
    - `audit_logs` - Tracks user actions for auditing
    - `admin_settings` - Stores application configuration
  2. Security
    - Enable RLS on all tables
    - Create policies for proper access control
    - Add helper functions for role checking
  3. Changes
    - Add triggers for updated_at timestamps
    - Insert default admin settings
*/

-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'manager', 'user')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'pending')),
  UNIQUE(user_id, role)
);

-- Create audit_logs table if not exists
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

-- Create admin_settings table if not exists
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM user_roles WHERE user_id = $1;
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is manager or admin
CREATE OR REPLACE FUNCTION is_manager_or_admin(user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM user_roles WHERE user_id = $1;
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

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_roles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_admin_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Create RLS policies for user_roles
CREATE POLICY "Admins can manage all user roles"
ON user_roles
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

-- Create RLS policies for audit_logs
CREATE POLICY "Admins can view all audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Managers can view audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (is_manager_or_admin(auth.uid()));

-- Create RLS policies for admin_settings
CREATE POLICY "Admins can manage all settings"
ON admin_settings
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Managers can view settings"
ON admin_settings
FOR SELECT
TO authenticated
USING (is_manager_or_admin(auth.uid()));

-- Insert default admin settings if they don't exist
INSERT INTO admin_settings (key, value, description)
VALUES 
  ('security', '{"require_mfa": false, "password_expiry_days": 90, "session_timeout_minutes": 60}'::jsonb, 'Security settings'),
  ('email', '{"welcome_email_enabled": true, "password_reset_enabled": true}'::jsonb, 'Email notification settings'),
  ('system', '{"maintenance_mode": false, "version": "1.0.0"}'::jsonb, 'System settings')
ON CONFLICT (key) DO NOTHING;

-- Create unique index on user_roles for user_id and role
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_role_key ON user_roles (user_id, role);