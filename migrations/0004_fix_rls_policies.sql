-- Fix RLS policies for ai_generation_history and usage_stats tables
-- This migration ensures that authenticated users can insert/read their own records

-- Fix ai_generation_history table
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can insert their own AI generation history" ON ai_generation_history;
  DROP POLICY IF EXISTS "Users can read their own AI generation history" ON ai_generation_history;
  DROP POLICY IF EXISTS "Users can update their own AI generation history" ON ai_generation_history;
  DROP POLICY IF EXISTS "Service role bypass RLS" ON ai_generation_history;
  
  -- Create policies that work with both user JWTs and service role
  CREATE POLICY "Enable insert for authenticated users and service role"
    ON ai_generation_history
    FOR INSERT
    WITH CHECK (
      auth.uid() = user_id OR 
      auth.jwt()->>'role' = 'service_role' OR
      current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );
  
  CREATE POLICY "Enable read for own data"
    ON ai_generation_history
    FOR SELECT
    USING (
      auth.uid() = user_id OR
      auth.jwt()->>'role' = 'service_role' OR
      current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );
END $$;

-- Fix usage_stats table
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can insert their own usage stats" ON usage_stats;
  DROP POLICY IF EXISTS "Users can read their own usage stats" ON usage_stats;
  DROP POLICY IF EXISTS "Users can update their own usage stats" ON usage_stats;
  DROP POLICY IF EXISTS "Service role bypass RLS" ON usage_stats;
  
  -- Create policies
  CREATE POLICY "Enable all for authenticated users and service role"
    ON usage_stats
    FOR ALL
    USING (
      auth.uid() = user_id OR
      auth.jwt()->>'role' = 'service_role' OR
      current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    )
    WITH CHECK (
      auth.uid() = user_id OR
      auth.jwt()->>'role' = 'service_role' OR
      current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );
END $$;
