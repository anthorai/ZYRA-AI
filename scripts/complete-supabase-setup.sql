-- COMPLETE SUPABASE SETUP FOR ZYRA
-- Execute this in your Supabase SQL Editor to create all required tables and functionality

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables in correct order (respecting foreign key dependencies)
DROP TABLE IF EXISTS ai_generation_history CASCADE;
DROP TABLE IF EXISTS login_logs CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS security_settings CASCADE;
DROP TABLE IF EXISTS integration_settings CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS billing_history CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS store_connections CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS realtime_metrics CASCADE;
DROP TABLE IF EXISTS tools_access CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS usage_stats CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS seo_meta CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with EXACT column names from shared/schema.ts
CREATE TABLE users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    plan TEXT NOT NULL DEFAULT 'trial',
    trial_end_date TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    image_url TEXT,
    preferred_language TEXT DEFAULT 'en',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create subscription plans table
CREATE TABLE subscription_plans (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT NOT NULL UNIQUE,
    price NUMERIC(10, 2) NOT NULL,
    interval TEXT NOT NULL DEFAULT 'month',
    features JSONB NOT NULL,
    limits JSONB NOT NULL,
    stripe_price_id TEXT,
    stripe_product_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    currency TEXT NOT NULL DEFAULT 'USD',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shopify_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    original_description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    features TEXT,
    tags TEXT,
    optimized_copy JSONB,
    is_optimized BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create seo_meta table
CREATE TABLE seo_meta (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    seo_title TEXT,
    meta_description TEXT,
    keywords TEXT,
    optimized_title TEXT,
    optimized_meta TEXT,
    seo_score INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create campaigns table
CREATE TABLE campaigns (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    sent_count INTEGER DEFAULT 0,
    open_rate INTEGER DEFAULT 0,
    click_rate INTEGER DEFAULT 0,
    conversion_rate INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create analytics table
CREATE TABLE analytics (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    value INTEGER NOT NULL,
    date TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- Create subscriptions table
CREATE TABLE subscriptions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR NOT NULL REFERENCES subscription_plans(id),
    stripe_subscription_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT false,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE profiles (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    name TEXT,
    bio TEXT,
    profile_image TEXT,
    preferences JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE sessions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create usage_stats table
CREATE TABLE usage_stats (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_revenue INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    conversion_rate INTEGER DEFAULT 0,
    cart_recovery_rate INTEGER DEFAULT 0,
    products_count INTEGER DEFAULT 0,
    products_optimized INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_remaining INTEGER DEFAULT 0,
    sms_sent INTEGER DEFAULT 0,
    sms_remaining INTEGER DEFAULT 0,
    ai_generations_used INTEGER DEFAULT 0,
    seo_optimizations_used INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    last_reset_date TIMESTAMP DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE activity_logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    tool_used TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create tools_access table
CREATE TABLE tools_access (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    access_count INTEGER DEFAULT 1,
    last_accessed TIMESTAMP DEFAULT NOW(),
    first_accessed TIMESTAMP DEFAULT NOW()
);

-- Create realtime_metrics table
CREATE TABLE realtime_metrics (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    value TEXT NOT NULL,
    change_percent TEXT,
    is_positive BOOLEAN DEFAULT true,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    action_label TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

-- Create store_connections table
CREATE TABLE store_connections (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    store_name TEXT NOT NULL,
    store_url TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE user_preferences (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    ai_settings JSONB,
    notification_settings JSONB,
    ui_preferences JSONB,
    privacy_settings JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create integration_settings table
CREATE TABLE integration_settings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL,
    provider TEXT NOT NULL,
    settings JSONB NOT NULL,
    credentials JSONB,
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, integration_type, provider)
);

-- Create security_settings table
CREATE TABLE security_settings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    backup_codes JSONB,
    login_notifications BOOLEAN DEFAULT true,
    session_timeout INTEGER DEFAULT 3600,
    last_password_change TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create login_logs table
CREATE TABLE login_logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    location TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create support_tickets table
CREATE TABLE support_tickets (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'open',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create ai_generation_history table
CREATE TABLE ai_generation_history (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generation_type TEXT NOT NULL,
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    brand_voice TEXT,
    tokens_used INTEGER,
    model TEXT DEFAULT 'gpt-4o-mini',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create billing tables
CREATE TABLE invoices (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id VARCHAR REFERENCES subscriptions(id),
    stripe_invoice_id TEXT UNIQUE,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL,
    invoice_number TEXT,
    invoice_url TEXT,
    pdf_url TEXT,
    due_date TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payment_methods (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_method_id TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    card_brand TEXT,
    card_last4 TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE billing_history (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id VARCHAR REFERENCES subscriptions(id),
    invoice_id VARCHAR REFERENCES invoices(id),
    action TEXT NOT NULL,
    amount NUMERIC(10, 2),
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert subscription plans
INSERT INTO subscription_plans (plan_name, price, interval, features, limits, description) VALUES
('Starter', 49.00, 'month', 
 '["AI Product Descriptions", "Basic SEO Tools", "Email Campaigns", "Cart Recovery", "Analytics Dashboard"]'::jsonb,
 '{"products": 100, "emails": 1000, "sms": 100, "ai_generations": 500}'::jsonb,
 'Perfect for small businesses just getting started with AI-powered e-commerce optimization'
),
('Growth', 299.00, 'month',
 '["Everything in Starter", "Advanced SEO Suite", "SMS Campaigns", "A/B Testing", "Priority Support", "Custom Integrations"]'::jsonb,
 '{"products": 1000, "emails": 10000, "sms": 1000, "ai_generations": 5000}'::jsonb,
 'Ideal for growing businesses ready to scale with comprehensive automation and optimization tools'
),
('Pro', 999.00, 'month',
 '["Everything in Growth", "White-label Solutions", "API Access", "Custom AI Models", "Dedicated Account Manager", "24/7 Support"]'::jsonb,
 '{"products": "unlimited", "emails": "unlimited", "sms": 10000, "ai_generations": "unlimited"}'::jsonb,
 'Enterprise-grade solution for large businesses requiring maximum flexibility and support'
)
ON CONFLICT (plan_name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS products_user_id_idx ON products(user_id);
CREATE INDEX IF NOT EXISTS campaigns_user_id_idx ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS analytics_user_id_idx ON analytics(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS usage_stats_user_id_idx ON usage_stats(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_user_date_idx ON activity_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS ai_generation_history_user_date_idx ON ai_generation_history(user_id, created_at);
CREATE INDEX IF NOT EXISTS login_logs_user_date_idx ON login_logs(user_id, created_at);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service role access (backend operations)
CREATE POLICY "Service role can manage all users" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all products" ON products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all campaigns" ON campaigns FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all subscriptions" ON subscriptions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all analytics" ON analytics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all notifications" ON notifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all sessions" ON sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all usage_stats" ON usage_stats FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all activity_logs" ON activity_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all tools_access" ON tools_access FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all realtime_metrics" ON realtime_metrics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all store_connections" ON store_connections FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all user_preferences" ON user_preferences FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all integration_settings" ON integration_settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all security_settings" ON security_settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all login_logs" ON login_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all support_tickets" ON support_tickets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all ai_generation_history" ON ai_generation_history FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all invoices" ON invoices FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all payment_methods" ON payment_methods FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all billing_history" ON billing_history FOR ALL USING (auth.role() = 'service_role');

-- Create policies for authenticated users (frontend operations)
-- Users table policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Product-related policies
CREATE POLICY "Users can manage their own products" ON products FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can manage their own seo_meta" ON seo_meta FOR ALL USING (auth.uid()::text IN (SELECT user_id FROM products WHERE id = product_id));

-- Campaign and marketing policies
CREATE POLICY "Users can manage their own campaigns" ON campaigns FOR ALL USING (auth.uid()::text = user_id);

-- Subscription and billing policies (read-only for users)
CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view their own invoices" ON invoices FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view their own payment_methods" ON payment_methods FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view their own billing_history" ON billing_history FOR SELECT USING (auth.uid()::text = user_id);

-- Analytics and reporting policies (read-only for users)
CREATE POLICY "Users can view their own analytics" ON analytics FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view their own usage_stats" ON usage_stats FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view their own activity_logs" ON activity_logs FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view their own tools_access" ON tools_access FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view their own realtime_metrics" ON realtime_metrics FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view their own ai_generation_history" ON ai_generation_history FOR SELECT USING (auth.uid()::text = user_id);

-- User settings and preferences policies
CREATE POLICY "Users can manage their own notifications" ON notifications FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can manage their own profiles_table" ON profiles FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can manage their own preferences" ON user_preferences FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can manage their own store_connections" ON store_connections FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can manage their own integration_settings" ON integration_settings FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can manage their own security_settings" ON security_settings FOR ALL USING (auth.uid()::text = user_id);

-- Support and system policies
CREATE POLICY "Users can manage their own support_tickets" ON support_tickets FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view their own login_logs" ON login_logs FOR SELECT USING (auth.uid()::text = user_id);

-- Allow public read access to subscription plans
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans FOR SELECT USING (true);

COMMIT;