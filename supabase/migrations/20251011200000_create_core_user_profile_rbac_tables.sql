/*
  # Core User Profile and RBAC (Role-Based Access Control) Tables

  This migration creates fundamental user management tables that were missing from the schema:

  ## New Tables Created

  1. **user_profiles** - Core user information and metadata
     - Basic profile data: full_name, bio, avatar_url, location, website
     - Professional info: trading_experience, preferred_strategies
     - Account status: is_verified, is_active, onboarding_completed
     - Social links: twitter_handle, linkedin_url, discord_username
     - Privacy settings: show_profile_publicly, show_trading_stats
     - Metadata: timezone, language, last_login_at
     - Links to auth.users with CASCADE delete

  2. **user_roles** - Role definitions (admin, moderator, premium, free, trial)
     - Role name, description, and hierarchy level
     - Permission sets defined per role
     - System roles vs custom roles
     - Active/inactive role management

  3. **user_role_assignments** - Maps users to roles (many-to-many)
     - User can have multiple roles simultaneously
     - Role assignment history with timestamps
     - Assigned by tracking (admin who assigned role)
     - Expiration support for temporary role grants

  4. **user_permissions** - Granular permission definitions
     - Permission keys: 'can_trade_live', 'can_access_analytics', etc.
     - Resource-based permissions: resource_type, resource_action
     - Permission groups for easy management
     - Description for documentation

  5. **role_permissions** - Maps roles to permissions (many-to-many)
     - Defines which permissions each role has
     - System-managed permission sets
     - Override capability for custom permissions

  6. **user_login_methods** - OAuth providers and authentication methods
     - Tracks email/password, Google OAuth, Apple, etc.
     - MFA enabled status per login method
     - Last used timestamp
     - Provider-specific metadata

  7. **user_referrals** - Referral program tracking
     - Referrer and referee relationship
     - Referral code generation
     - Conversion tracking (signup, first trade, etc.)
     - Reward status and fulfillment

  ## Security

  - RLS enabled on all tables
  - Users can view/edit their own profiles
  - Only admins can manage roles and permissions
  - Referral data is private to user
  - Login methods are sensitive and protected

  ## Performance

  - Indexes on user_id for fast lookups
  - Composite indexes for role-permission checks
  - Index on referral codes for quick validation

  ## Privacy

  - GDPR-compliant data structure
  - User data deletion support via CASCADE
  - Privacy settings per profile
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

-- Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_verified ON user_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active ON user_profiles(last_active_at DESC);

-- Create indexes for user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_key ON user_roles(role_key);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_hierarchy ON user_roles(hierarchy_level DESC);

-- Create indexes for user_role_assignments
CREATE INDEX IF NOT EXISTS idx_role_assignments_user ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_role ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_active ON user_role_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_role_assignments_expires ON user_role_assignments(expires_at);

-- Create indexes for user_permissions
CREATE INDEX IF NOT EXISTS idx_permissions_key ON user_permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_permissions_group ON user_permissions(permission_group);

-- Create indexes for role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- Create indexes for user_login_methods
CREATE INDEX IF NOT EXISTS idx_login_methods_user ON user_login_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_login_methods_provider ON user_login_methods(provider);
CREATE INDEX IF NOT EXISTS idx_login_methods_primary ON user_login_methods(is_primary);

-- Create indexes for user_referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON user_referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON user_referrals(status);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_login_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
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

-- RLS Policies for user_roles (read-only for users, admin management only)
CREATE POLICY "Anyone can view active roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for user_role_assignments
CREATE POLICY "Users can view own role assignments"
  ON user_role_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_permissions (read-only)
CREATE POLICY "Authenticated users can view permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for role_permissions (read-only)
CREATE POLICY "Authenticated users can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_login_methods
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

-- RLS Policies for user_referrals
CREATE POLICY "Referrers can view own referrals"
  ON user_referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert referrals"
  ON user_referrals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

-- Create triggers for updated_at
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

-- Insert default system roles
INSERT INTO user_roles (role_name, role_key, description, hierarchy_level, is_system_role) VALUES
  ('Administrator', 'admin', 'Full system access with all permissions', 100, true),
  ('Moderator', 'moderator', 'Community moderation and user management', 75, true),
  ('Premium User', 'premium', 'Paid subscription with advanced features', 50, true),
  ('Basic User', 'basic', 'Paid subscription with standard features', 30, true),
  ('Trial User', 'trial', 'Limited trial access to premium features', 20, true),
  ('Free User', 'free', 'Free tier with basic access', 10, true)
ON CONFLICT (role_key) DO NOTHING;

-- Insert default system permissions
INSERT INTO user_permissions (permission_key, permission_name, description, permission_group) VALUES
  -- Trading permissions
  ('can_paper_trade', 'Paper Trading', 'Can use paper trading features', 'trading'),
  ('can_live_trade', 'Live Trading', 'Can connect live brokerage accounts and execute real trades', 'trading'),
  ('can_create_strategies', 'Create Strategies', 'Can build and save multi-leg options strategies', 'trading'),
  ('can_backtest_strategies', 'Backtest Strategies', 'Can run historical backtests', 'trading'),
  ('unlimited_backtests', 'Unlimited Backtests', 'No limit on number of backtests per month', 'trading'),

  -- Data permissions
  ('access_real_time_data', 'Real-Time Market Data', 'Access to real-time market data feeds', 'data'),
  ('access_historical_data', 'Historical Data', 'Access to historical market data', 'data'),
  ('access_level_2_data', 'Level 2 Data', 'Access to order book and market depth data', 'data'),
  ('export_data', 'Export Data', 'Can export data to CSV/Excel', 'data'),

  -- Analytics permissions
  ('access_advanced_analytics', 'Advanced Analytics', 'Access to advanced analytics and metrics', 'analytics'),
  ('access_sentiment_analysis', 'Sentiment Analysis', 'Access to news and social sentiment data', 'analytics'),
  ('access_unusual_activity', 'Unusual Activity Scanner', 'Track unusual options volume and activity', 'analytics'),
  ('create_custom_scans', 'Custom Scans', 'Create custom stock and options screeners', 'analytics'),

  -- API permissions
  ('api_access', 'API Access', 'Can generate and use API keys', 'api'),
  ('api_rate_limit_standard', 'Standard API Rate Limit', '60 requests per minute', 'api'),
  ('api_rate_limit_premium', 'Premium API Rate Limit', '300 requests per minute', 'api'),
  ('webhook_access', 'Webhook Access', 'Can create webhooks for alerts', 'api'),

  -- Community permissions
  ('post_strategies', 'Post Strategies', 'Can share strategies with community', 'community'),
  ('comment_on_posts', 'Comment on Posts', 'Can comment on community posts', 'community'),
  ('create_watchlists', 'Create Watchlists', 'Can create and share watchlists', 'community'),
  ('upvote_content', 'Upvote Content', 'Can upvote community content', 'community'),

  -- Support permissions
  ('priority_support', 'Priority Support', 'Priority customer support access', 'support'),
  ('live_chat_support', 'Live Chat Support', 'Access to live chat support', 'support'),

  -- Admin permissions
  ('manage_users', 'Manage Users', 'Can view and manage user accounts', 'admin'),
  ('manage_roles', 'Manage Roles', 'Can create and modify user roles', 'admin'),
  ('view_analytics_dashboard', 'Admin Analytics', 'Access to admin analytics dashboard', 'admin'),
  ('manage_content', 'Manage Content', 'Can moderate user-generated content', 'admin'),
  ('system_configuration', 'System Configuration', 'Can modify system settings', 'admin')
ON CONFLICT (permission_key) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM user_roles r, user_permissions p
WHERE r.role_key = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM user_roles r, user_permissions p
WHERE r.role_key = 'premium' AND p.permission_key IN (
  'can_paper_trade', 'can_live_trade', 'can_create_strategies', 'can_backtest_strategies',
  'unlimited_backtests', 'access_real_time_data', 'access_historical_data', 'export_data',
  'access_advanced_analytics', 'access_sentiment_analysis', 'access_unusual_activity',
  'create_custom_scans', 'api_access', 'api_rate_limit_premium', 'webhook_access',
  'post_strategies', 'comment_on_posts', 'create_watchlists', 'upvote_content',
  'priority_support', 'live_chat_support'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM user_roles r, user_permissions p
WHERE r.role_key = 'free' AND p.permission_key IN (
  'can_paper_trade', 'can_create_strategies', 'access_historical_data',
  'post_strategies', 'comment_on_posts', 'create_watchlists', 'upvote_content'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid uuid, perm_key text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_role_assignments ura
    JOIN role_permissions rp ON rp.role_id = ura.role_id
    JOIN user_permissions p ON p.id = rp.permission_id
    WHERE ura.user_id = user_uuid
      AND ura.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > now())
      AND p.permission_key = perm_key
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION get_user_highest_role(user_uuid uuid)
RETURNS text AS $$
DECLARE
  highest_role text;
BEGIN
  SELECT r.role_key INTO highest_role
  FROM user_role_assignments ura
  JOIN user_roles r ON r.id = ura.role_id
  WHERE ura.user_id = user_uuid
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > now())
  ORDER BY r.hierarchy_level DESC
  LIMIT 1;

  RETURN COALESCE(highest_role, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
