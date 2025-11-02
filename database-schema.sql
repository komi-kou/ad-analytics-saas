-- ============================================
-- Multi-User Ad Analytics SaaS Database Schema
-- ============================================

-- Users table
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  gomarble_token TEXT NOT NULL, -- Encrypted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);

-- Ad Accounts table
CREATE TABLE ad_accounts (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL, -- 'facebook', 'google', 'tiktok'
  account_id VARCHAR(100) NOT NULL, -- act_xxx for Facebook
  account_name VARCHAR(255) NOT NULL,
  currency VARCHAR(10) DEFAULT 'JPY',
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, platform, account_id)
);

CREATE INDEX idx_ad_accounts_user_id ON ad_accounts(user_id);
CREATE INDEX idx_ad_accounts_enabled ON ad_accounts(enabled);

-- Chatwork Settings table
CREATE TABLE chatwork_settings (
  id VARCHAR(50) PRIMARY KEY,
  account_id VARCHAR(50) NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  room_id VARCHAR(50) NOT NULL,
  api_token TEXT NOT NULL, -- Encrypted
  enabled BOOLEAN DEFAULT TRUE,
  schedule VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  day_of_week INT, -- 0=Sunday, 1=Monday, etc.
  time TIME DEFAULT '09:00:00',
  timezone VARCHAR(50) DEFAULT 'Asia/Tokyo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id)
);

CREATE INDEX idx_chatwork_settings_enabled ON chatwork_settings(enabled);

-- Metrics Configuration table
CREATE TABLE metrics_config (
  id VARCHAR(50) PRIMARY KEY,
  account_id VARCHAR(50) NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  
  -- Basic metrics
  include_spend BOOLEAN DEFAULT TRUE,
  include_impressions BOOLEAN DEFAULT TRUE,
  include_clicks BOOLEAN DEFAULT TRUE,
  include_ctr BOOLEAN DEFAULT TRUE,
  include_cpc BOOLEAN DEFAULT TRUE,
  include_cpm BOOLEAN DEFAULT TRUE,
  
  -- Conversion metrics
  include_conversions BOOLEAN DEFAULT TRUE,
  include_cpa BOOLEAN DEFAULT TRUE,
  include_conversion_values BOOLEAN DEFAULT TRUE,
  include_roas BOOLEAN DEFAULT TRUE,
  
  -- Engagement metrics
  include_reach BOOLEAN DEFAULT FALSE,
  include_frequency BOOLEAN DEFAULT FALSE,
  
  -- Video metrics (for video creatives)
  include_video_plays BOOLEAN DEFAULT FALSE,
  include_video_p25 BOOLEAN DEFAULT FALSE,
  include_video_p50 BOOLEAN DEFAULT FALSE,
  include_video_p75 BOOLEAN DEFAULT FALSE,
  include_video_p100 BOOLEAN DEFAULT FALSE,
  
  -- Action metrics
  include_purchases BOOLEAN DEFAULT FALSE,
  include_leads BOOLEAN DEFAULT FALSE,
  include_app_installs BOOLEAN DEFAULT FALSE,
  include_page_views BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id)
);

-- Analysis Levels Configuration table
CREATE TABLE analysis_levels_config (
  id VARCHAR(50) PRIMARY KEY,
  account_id VARCHAR(50) NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  
  -- Level 1: Account Summary
  include_account_summary BOOLEAN DEFAULT TRUE,
  
  -- Level 2: Campaign Analysis
  include_campaign_analysis BOOLEAN DEFAULT TRUE,
  campaign_top_count INT DEFAULT 3,
  campaign_worst_count INT DEFAULT 3,
  
  -- Level 3: Creative Analysis
  include_creative_analysis BOOLEAN DEFAULT TRUE,
  creative_per_campaign_count INT DEFAULT 5,
  
  -- Level 4: Format Comparison
  include_format_comparison BOOLEAN DEFAULT TRUE,
  
  -- Level 5: Trend Analysis
  include_trend_analysis BOOLEAN DEFAULT TRUE,
  trend_weeks_back INT DEFAULT 4,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id)
);

-- Analysis History table
CREATE TABLE analysis_history (
  id VARCHAR(50) PRIMARY KEY,
  account_id VARCHAR(50) NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  
  -- Raw data (JSON)
  raw_data JSONB,
  
  -- Analysis results (JSON)
  analysis_summary JSONB,
  campaign_analysis JSONB,
  creative_analysis JSONB,
  format_comparison JSONB,
  trend_analysis JSONB,
  
  -- Claude AI insights
  ai_insights TEXT,
  
  -- Delivery status
  sent_to_chatwork BOOLEAN DEFAULT FALSE,
  chatwork_message_id VARCHAR(100),
  sent_at TIMESTAMP,
  
  -- Execution metadata
  execution_time_seconds INT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analysis_history_account_id ON analysis_history(account_id);
CREATE INDEX idx_analysis_history_date_range ON analysis_history(date_range_start, date_range_end);
CREATE INDEX idx_analysis_history_created_at ON analysis_history(created_at DESC);

-- System Logs table
CREATE TABLE system_logs (
  id SERIAL PRIMARY KEY,
  log_level VARCHAR(20) NOT NULL, -- 'INFO', 'WARNING', 'ERROR'
  component VARCHAR(50) NOT NULL, -- 'auth', 'data_fetch', 'analysis', 'chatwork'
  message TEXT NOT NULL,
  details JSONB,
  user_id VARCHAR(50) REFERENCES users(id),
  account_id VARCHAR(50) REFERENCES ad_accounts(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_level ON system_logs(log_level);

-- API Keys table (for future API access)
CREATE TABLE api_keys (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  name VARCHAR(100),
  last_used TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- ============================================
-- Default Configuration Function
-- ============================================

CREATE OR REPLACE FUNCTION create_default_configs()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default metrics config
  INSERT INTO metrics_config (id, account_id)
  VALUES (
    'metrics_' || NEW.id,
    NEW.id
  );
  
  -- Create default analysis levels config
  INSERT INTO analysis_levels_config (id, account_id)
  VALUES (
    'analysis_' || NEW.id,
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_configs
AFTER INSERT ON ad_accounts
FOR EACH ROW
EXECUTE FUNCTION create_default_configs();

-- ============================================
-- Updated_at Trigger Function
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_accounts_updated_at
BEFORE UPDATE ON ad_accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chatwork_settings_updated_at
BEFORE UPDATE ON chatwork_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metrics_config_updated_at
BEFORE UPDATE ON metrics_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_levels_config_updated_at
BEFORE UPDATE ON analysis_levels_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample Data (for testing)
-- ============================================

-- Sample user
INSERT INTO users (id, email, gomarble_token, is_active)
VALUES (
  'user_sample_001',
  'test@example.com',
  'encrypted_token_here',
  TRUE
);

-- Sample ad account
INSERT INTO ad_accounts (id, user_id, platform, account_id, account_name, currency, enabled)
VALUES (
  'account_sample_001',
  'user_sample_001',
  'facebook',
  'act_561944936444172',
  'cokonlab',
  'JPY',
  TRUE
);

-- Sample Chatwork setting (will auto-create configs via trigger)
INSERT INTO chatwork_settings (id, account_id, room_id, api_token, enabled, day_of_week, time)
VALUES (
  'chatwork_sample_001',
  'account_sample_001',
  '12345678',
  'encrypted_chatwork_token',
  TRUE,
  1, -- Monday
  '09:00:00'
);

-- ============================================
-- Useful Queries
-- ============================================

-- Get all enabled accounts with their settings
-- SELECT 
--   a.id, a.account_name, a.platform, a.account_id,
--   c.room_id, c.schedule, c.day_of_week, c.time,
--   m.include_spend, m.include_conversions,
--   al.include_campaign_analysis, al.include_creative_analysis
-- FROM ad_accounts a
-- JOIN chatwork_settings c ON a.id = c.account_id
-- JOIN metrics_config m ON a.id = m.account_id
-- JOIN analysis_levels_config al ON a.id = al.account_id
-- WHERE a.enabled = TRUE AND c.enabled = TRUE;

-- Get analysis history for an account
-- SELECT 
--   date_range_start, date_range_end,
--   analysis_summary->>'total_spend' as total_spend,
--   sent_to_chatwork, created_at
-- FROM analysis_history
-- WHERE account_id = 'account_sample_001'
-- ORDER BY created_at DESC
-- LIMIT 10;
