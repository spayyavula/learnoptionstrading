/*
  # Admin and Monitoring Infrastructure

  Tables for admin dashboard, system monitoring, user feedback, and support tickets.

  ## New Tables

  1. **admin_audit_log** - Tracks all admin actions
  2. **system_health_metrics** - API uptime, data quality, performance metrics
  3. **feature_flags_global** - System-wide feature toggles
  4. **user_feedback** - Bug reports and feature requests
  5. **support_tickets** - Customer support tracking
  6. **system_alerts** - Critical system alerts and notifications
*/

-- Create admin_audit_log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) NOT NULL,
  action_type text NOT NULL,
  action_description text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id),
  resource_type text,
  resource_id text,
  changes_made jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at timestamptz DEFAULT now()
);

-- Create system_health_metrics table
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_type text CHECK (metric_type IN ('uptime', 'latency', 'error_rate', 'data_quality', 'api_calls')),
  metric_value numeric(20, 4) NOT NULL,
  threshold_warning numeric(20, 4),
  threshold_critical numeric(20, 4),
  status text DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical', 'unknown')),
  component text NOT NULL,
  environment text DEFAULT 'production',
  metadata jsonb DEFAULT '{}'::jsonb,
  measured_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create feature_flags_global table
CREATE TABLE IF NOT EXISTS feature_flags_global (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text UNIQUE NOT NULL,
  flag_name text NOT NULL,
  description text,
  is_enabled boolean DEFAULT false,
  rollout_percentage integer DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  enabled_for_user_ids uuid[],
  enabled_for_roles text[],
  environment text DEFAULT 'all' CHECK (environment IN ('all', 'production', 'staging', 'development')),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('bug', 'feature_request', 'improvement', 'complaint', 'praise')),
  title text NOT NULL,
  description text NOT NULL,
  category text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'planned', 'in_progress', 'completed', 'wont_fix', 'duplicate')),
  assignee_id uuid REFERENCES auth.users(id),
  upvotes integer DEFAULT 0,
  page_url text,
  browser text,
  device text,
  screenshots text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  admin_notes text,
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL DEFAULT 'TICK-' || LPAD(floor(random() * 999999)::text, 6, '0'),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text CHECK (category IN ('account', 'trading', 'broker_connection', 'billing', 'technical', 'data', 'other')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  assigned_to uuid REFERENCES auth.users(id),
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  satisfaction_rating integer CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  satisfaction_feedback text,
  tags text[],
  related_order_id text,
  related_position_id text,
  attachments jsonb DEFAULT '[]'::jsonb,
  internal_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create system_alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL CHECK (alert_type IN ('error', 'warning', 'info', 'critical')),
  alert_source text NOT NULL,
  alert_message text NOT NULL,
  alert_details jsonb DEFAULT '{}'::jsonb,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'ignored')),
  affected_users_count integer DEFAULT 0,
  acknowledged_by uuid REFERENCES auth.users(id),
  acknowledged_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_metrics_name ON system_health_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_health_metrics_status ON system_health_metrics(status);
CREATE INDEX IF NOT EXISTS idx_health_metrics_measured ON system_health_metrics(measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags_global(is_enabled);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON user_feedback(feedback_type);

CREATE INDEX IF NOT EXISTS idx_support_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_assigned ON support_tickets(assigned_to);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON system_alerts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own feedback"
  ON user_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON user_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own support tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own support tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read access to feature flags"
  ON feature_flags_global FOR SELECT
  TO authenticated
  USING (true);

-- Triggers
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags_global
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
