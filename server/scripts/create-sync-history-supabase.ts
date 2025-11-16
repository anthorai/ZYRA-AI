import pkg from 'pg';
const { Client } = pkg;

async function createSyncHistoryTable() {
  // Parse Supabase URL to get database connection details
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabasePassword = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ Missing SUPABASE_URL environment variable');
    process.exit(1);
  }

  // Extract project ref from Supabase URL
  // Format: https://<project-ref>.supabase.co
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
  
  // Construct direct database URL
  // Supabase database connection format:
  const dbConfig = {
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || supabasePassword,
    ssl: { rejectUnauthorized: false }
  };

  console.log(`🔄 Connecting to Supabase database: ${dbConfig.host}`);
  
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database');

    // Check if table already exists
    const checkTableSQL = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sync_history'
      );
    `;

    const checkResult = await client.query(checkTableSQL);
    const tableExists = checkResult.rows[0].exists;

    if (tableExists) {
      console.log('ℹ️  sync_history table already exists');
    } else {
      console.log('🔄 Creating sync_history table...');

      // Create sync_history table
      const createTableSQL = `
        CREATE TABLE "sync_history" (
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
      `;

      await client.query(createTableSQL);
      console.log('✅ sync_history table created successfully');
    }

    // Create indexes (IF NOT EXISTS)
    console.log('🔄 Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "sync_history_user_id_idx" ON "sync_history" USING btree ("user_id");',
      'CREATE INDEX IF NOT EXISTS "sync_history_status_idx" ON "sync_history" USING btree ("status");',
      'CREATE INDEX IF NOT EXISTS "sync_history_started_at_idx" ON "sync_history" USING btree ("started_at");',
      'CREATE INDEX IF NOT EXISTS "sync_history_store_connection_id_idx" ON "sync_history" USING btree ("store_connection_id");'
    ];

    for (const indexSQL of indexes) {
      await client.query(indexSQL);
    }

    console.log('✅ Indexes created successfully');
    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

createSyncHistoryTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
