-- FINAL FIX: Create users table with exact column names from Drizzle schema
-- Execute this in your Supabase SQL Editor

-- Drop users table completely
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with EXACT column names from shared/schema.ts
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

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for service role
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
CREATE POLICY "Service role can manage all users" ON users FOR ALL USING (auth.role() = 'service_role');

-- Test: Insert a test user to verify schema works
INSERT INTO users (email, password, full_name) VALUES 
('test-final@example.com', 'test123', 'Test User Final')
ON CONFLICT (email) DO NOTHING;

-- Verify the exact column structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;