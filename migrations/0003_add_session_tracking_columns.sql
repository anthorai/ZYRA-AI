-- Add session tracking columns for device, browser, location info
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS refresh_token_id TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_type TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS browser TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS os TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP DEFAULT NOW();

-- Create index for last_seen_at for efficient queries
CREATE INDEX IF NOT EXISTS sessions_last_seen_idx ON sessions(last_seen_at);
