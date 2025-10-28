-- Supabase Database Setup Script - FIXED VERSION
-- Execute this in your Supabase SQL Editor to create all required tables

-- Enable the required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables to fix schema conflicts
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
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS seo_meta CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with correct schema
CREATE TABLE users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
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

-- Create subscription_plans table
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
    user_id VARCHAR NOT NULL REFERENCES users(id),
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
    product_id VARCHAR NOT NULL REFERENCES products(id),
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
    user_id VARCHAR NOT NULL REFERENCES users(id),
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

-- Create subscriptions table
CREATE TABLE subscriptions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
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

-- Create analytics table
CREATE TABLE analytics (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    metric_type TEXT NOT NULL,
    value INTEGER NOT NULL,
    date TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- Create notifications table
CREATE TABLE notifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    action_label TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
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
);

-- Create indexes for better performance
CREATE INDEX products_user_id_idx ON products(user_id);
CREATE INDEX campaigns_user_id_idx ON campaigns(user_id);
CREATE INDEX subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX analytics_user_id_idx ON analytics(user_id);
CREATE INDEX notifications_user_id_idx ON notifications(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (for future Supabase Auth migration)
-- Note: Currently using custom auth, service role key bypasses these policies

-- Allow service role full access (for backend operations)
CREATE POLICY "Service role can manage all users" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all products" ON products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all campaigns" ON campaigns FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all subscriptions" ON subscriptions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all analytics" ON analytics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all notifications" ON notifications FOR ALL USING (auth.role() = 'service_role');

-- Allow public read access to subscription plans
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans FOR SELECT USING (true);

COMMIT;