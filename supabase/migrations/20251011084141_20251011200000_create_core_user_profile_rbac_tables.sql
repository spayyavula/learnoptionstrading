/*
  # Core User Profile and RBAC (Role-Based Access Control) Tables

  This migration creates fundamental user management tables that were missing from the schema:

  ## New Tables Created

  1. **user_profiles** - Core user information and metadata
  2. **user_roles** - Role definitions (admin, moderator, premium, free, trial)
  3. **user_role_assignments** - Maps users to roles (many-to-many)
  4. **user_permissions** - Granular permission definitions
  5. **role_permissions** - Maps roles to permissions (many-to-many)
  6. **user_login_methods** - OAuth providers and authentication methods
  7. **user_referrals** - Referral program tracking

  ## Security

  - RLS enabled on all tables
  - Users can view/edit their own profiles
  - Only admins can manage roles and permissions
  - Referral data is private to user
  - Login methods are sensitive and protected
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text,
  display_name text,
  bio text,
  avatar_url text,
  location text,
  website text,
  twitter_handle text,
  linkedin_url text,
  discord_username text,
  trading_experience text CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'professional')),
  preferred_strategies text[],
  risk_tolerance text DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_banned boolean DEFAULT false,
  ban_reason text,
  banned_at timestamptz,
  banned_by uuid REFERENCES auth.users(id),
  onboarding_completed boolean DEFAULT false,
  onboarding_step integer DEFAULT 0,
  show_profile_publicly boolean DEFAULT false,
  show_trading_stats boolean DEFAULT false,
  email_verified boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  last_login_at timestamptz,
  last_active_at timestamptz,
  login_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  role_key text UNIQUE NOT NULL,
  description text NOT NULL,
  hierarchy_level integer DEFAULT 0,
  is_system_role boolean DEFAULT true,
  is_active boolean DEFAULT true,
  color text DEFAULT '#6B7280',
  permissions_summary jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_role_assignments table
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES user_roles(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  assignment_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key text UNIQUE NOT NULL,
  permission_name text NOT NULL,
  description text NOT NULL,
  resource_type text,
  resource_action text,
  permission_group text DEFAULT 'general',
  is_system_permission boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES user_roles(id) ON DELETE CASCADE NOT NULL,
  permission_id uuid REFERENCES user_permissions(id) ON DELETE CASCADE NOT NULL,
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id),
  can_override boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Create user_login_methods table
CREATE TABLE IF NOT EXISTS user_login_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('email', 'google', 'apple', 'github', 'twitter', 'facebook')),
  provider_user_id text,
  is_primary boolean DEFAULT false,
  mfa_enabled boolean DEFAULT false,
  mfa_method text CHECK (mfa_method IN ('totp', 'sms', 'email', 'authenticator')),
  last_used_at timestamptz,
  login_count integer DEFAULT 0,
  provider_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Create user_referrals table
CREATE TABLE IF NOT EXISTS user_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text UNIQUE NOT NULL,
  referral_source text,
  referral_campaign text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded', 'expired', 'invalid')),
  conversion_type text CHECK (conversion_type IN ('signup', 'first_trade', 'subscription', 'deposit')),
  converted_at timestamptz,
  reward_type text CHECK (reward_type IN ('cash', 'credit', 'free_month', 'feature_unlock')),
  reward_amount numeric(10, 2),
  reward_status text DEFAULT 'pending' CHECK (reward_status IN ('pending', 'approved', 'paid', 'denied')),
  rewarded_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_verified ON user_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active ON user_profiles(last_active_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_roles_key ON user_roles(role_key);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_hierarchy ON user_roles(hierarchy_level DESC);

CREATE INDEX IF NOT EXISTS idx_role_assignments_user ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_role ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_active ON user_role_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_role_assignments_expires ON user_role_assignments(expires_at);

CREATE INDEX IF NOT EXISTS idx_permissions_key ON user_permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_permissions_group ON user_permissions(permission_group);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_login_methods_user ON user_login_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_login_methods_provider ON user_login_methods(provider);
CREATE INDEX IF NOT EXISTS idx_login_methods_primary ON user_login_methods(is_primary);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON user_referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON user_referrals(status);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_login_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (show_profile_publicly = true);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view active roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can view own role assignments"
  ON user_role_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own login methods"
  ON user_login_methods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own login methods"
  ON user_login_methods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own login methods"
  ON user_login_methods FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Referrers can view own referrals"
  ON user_referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert referrals"
  ON user_referrals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

-- Triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_login_methods_updated_at
  BEFORE UPDATE ON user_login_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_referrals_updated_at
  BEFORE UPDATE ON user_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO user_roles (role_name, role_key, description, hierarchy_level) VALUES
  ('Administrator', 'admin', 'Full system access', 100),
  ('Moderator', 'moderator', 'Community moderation', 75),
  ('Premium User', 'premium', 'Paid subscription', 50),
  ('Basic User', 'basic', 'Standard features', 30),
  ('Trial User', 'trial', 'Trial access', 20),
  ('Free User', 'free', 'Basic access', 10)
ON CONFLICT (role_key) DO NOTHING;

-- Insert default permissions
INSERT INTO user_permissions (permission_key, permission_name, description, permission_group) VALUES
  ('can_paper_trade', 'Paper Trading', 'Can use paper trading', 'trading'),
  ('can_live_trade', 'Live Trading', 'Can execute real trades', 'trading'),
  ('can_create_strategies', 'Create Strategies', 'Can build strategies', 'trading'),
  ('access_real_time_data', 'Real-Time Data', 'Access real-time data', 'data'),
  ('access_advanced_analytics', 'Advanced Analytics', 'Advanced analytics', 'analytics'),
  ('api_access', 'API Access', 'API access', 'api'),
  ('manage_users', 'Manage Users', 'Manage users', 'admin')
ON CONFLICT (permission_key) DO NOTHING;

-- Assign all permissions to admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM user_roles r, user_permissions p
WHERE r.role_key = 'admin'
ON CONFLICT DO NOTHING;

-- Assign basic permissions to free tier
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM user_roles r, user_permissions p
WHERE r.role_key = 'free' AND p.permission_key IN ('can_paper_trade', 'can_create_strategies')
ON CONFLICT DO NOTHING;