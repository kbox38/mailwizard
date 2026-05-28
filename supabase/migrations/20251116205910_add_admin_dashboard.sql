-- ============================================================================
-- ADMIN DASHBOARD DATABASE SCHEMA
-- ============================================================================

-- Admin Users Table (separate from regular users)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  admin_role VARCHAR(50) NOT NULL CHECK (admin_role IN ('super_admin', 'support_admin', 'finance_admin', 'readonly_admin')),
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(admin_role);

-- Admin Activity Log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON admin_activity_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_action ON admin_activity_log(action_type, created_at DESC);

-- Platform Metrics Daily
CREATE TABLE IF NOT EXISTS platform_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL UNIQUE,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  free_tier_count INTEGER DEFAULT 0,
  pro_tier_count INTEGER DEFAULT 0,
  pro_plus_tier_count INTEGER DEFAULT 0,
  total_emails_sent INTEGER DEFAULT 0,
  total_emails_delivered INTEGER DEFAULT 0,
  total_emails_bounced INTEGER DEFAULT 0,
  total_emails_opened INTEGER DEFAULT 0,
  total_emails_clicked INTEGER DEFAULT 0,
  total_spam_complaints INTEGER DEFAULT 0,
  mrr INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_metrics_date ON platform_metrics_daily(metric_date DESC);

-- System Alerts
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status, severity, created_at DESC);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Admin users can see everything (enforced in backend)
CREATE POLICY "Admin users have full access" ON admin_users FOR ALL USING (true);
CREATE POLICY "Admin activity log accessible" ON admin_activity_log FOR ALL USING (true);
CREATE POLICY "Platform metrics accessible" ON platform_metrics_daily FOR ALL USING (true);
CREATE POLICY "System alerts accessible" ON system_alerts FOR ALL USING (true);

-- Seed default super admin (password: Admin123!)
-- Password hash generated with bcrypt
INSERT INTO admin_users (email, password_hash, first_name, last_name, admin_role, permissions)
VALUES (
  'admin@emailwizard.com',
  '$2a$10$X.YqQ4KQM3aKj5vZZxT7j.V0ZWN8eFqJqEv6YJXn/1vWwJF.YjQQm',
  'Super',
  'Admin',
  'super_admin',
  '["view_all_metrics", "manage_users", "manage_billing", "system_configuration", "view_logs", "export_data"]'::jsonb
)
ON CONFLICT (email) DO NOTHING;