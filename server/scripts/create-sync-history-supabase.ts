import { createClient } from '@supabase/supabase-js';

async function createSyncHistoryTable() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔄 Creating sync_history table in Supabase...');

  try {
    // First check if the table exists by trying to query it
    const { error: checkError } = await supabase
      .from('sync_history')
      .select('id')
      .limit(1);

    if (!checkError || checkError.code !== 'PGRST204') {
      console.log('✅ sync_history table already exists');
      return;
    }

    console.log('ℹ️  Table does not exist, you need to create it manually');
    console.log('\n📋 Please run the following SQL in your Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/_/sql\n');
    
    const sql = `
-- Create sync_history table
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
`;

    console.log(sql);
    console.log('\n⚠️  Note: The Supabase JavaScript client cannot execute DDL statements.');
    console.log('   You must run this SQL manually in the Supabase dashboard.\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createSyncHistoryTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
