-- Create sync_history table in Supabase
-- Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

CREATE TABLE IF NOT EXISTS "sync_history" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "store_connection_id" varchar,
  "sync_type" text NOT NULL,
  "status" text NOT NULL,
  "products_added" integer DEFAULT 0,
  "products_updated" integer DEFAULT 0,
  "products_deleted" integer DEFAULT 0,
  "error_message" text,
  "started_at" timestamp DEFAULT NOW(),
  "completed_at" timestamp,
  "metadata" jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "sync_history_user_id_idx" ON "sync_history" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "sync_history_status_idx" ON "sync_history" USING btree ("status");
CREATE INDEX IF NOT EXISTS "sync_history_started_at_idx" ON "sync_history" USING btree ("started_at");
CREATE INDEX IF NOT EXISTS "sync_history_store_connection_id_idx" ON "sync_history" USING btree ("store_connection_id");
