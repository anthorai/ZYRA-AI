-- Remediation migration: Ensures store_connections table exists
-- This migration is idempotent and safe to run multiple times

-- Create store_connections table if it doesn't exist
CREATE TABLE IF NOT EXISTS "store_connections" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "platform" text NOT NULL,
  "store_name" text NOT NULL,
  "store_url" text,
  "access_token" text NOT NULL,
  "refresh_token" text,
  "status" text DEFAULT 'active' NOT NULL,
  "last_sync_at" timestamp,
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW()
);

-- Add indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'store_connections_user_id_idx') THEN
    CREATE INDEX store_connections_user_id_idx ON store_connections(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'store_connections_status_idx') THEN
    CREATE INDEX store_connections_status_idx ON store_connections(status);
  END IF;
END $$;

-- Ensure foreign key exists (if users table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'store_connections_user_id_users_id_fk'
    ) THEN
      ALTER TABLE "store_connections" 
      ADD CONSTRAINT "store_connections_user_id_users_id_fk" 
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
      ON DELETE no action ON UPDATE no action;
    END IF;
  END IF;
END $$;
