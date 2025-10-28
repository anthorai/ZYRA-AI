import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Production-safe database migration script with idempotent error handling
 * Runs all pending migrations from the migrations directory
 * Gracefully handles "already exists" errors for types and tables
 */
export async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set. Please configure your database connection.');
  }

  console.log('🔄 Starting database migrations...');
  console.log(`📍 Database: ${databaseUrl.split('@')[1]?.split('/')[0] || 'configured'}`);
  
  let pool: Pool | null = null;
  
  try {
    // Create connection pool for migrations
    pool = new Pool({
      connectionString: databaseUrl,
      max: 1, // Only need one connection for migrations
    });
    const db = drizzle(pool);
    
    console.log('🔌 Connected to database');
    console.log('📦 Running migrations from ./migrations directory...');
    
    // Get all SQL migration files
    const migrationsDir = './migrations';
    const files = (await readdir(migrationsDir))
      .filter(f => f.endsWith('.sql'))
      .sort(); // Run in order
    
    console.log(`📄 Found ${files.length} migration file(s)`);
    
    for (const file of files) {
      console.log(`   ▶ Running: ${file}`);
      const filePath = join(migrationsDir, file);
      const migrationSQL = await readFile(filePath, 'utf-8');
      
      // Split migration into individual statements
      const statements = migrationSQL
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      let successCount = 0;
      let skippedCount = 0;
      
      for (const statement of statements) {
        try {
          await db.execute(sql.raw(statement));
          successCount++;
        } catch (error: any) {
          // PostgreSQL error codes for "already exists"
          // 42710: duplicate_object (CREATE TYPE when type exists)
          // 42P07: duplicate_table (CREATE TABLE when table exists)
          // 42P16: invalid_table_definition (duplicate column)
          const isDuplicateError = ['42710', '42P07', '42P16'].includes(error?.code);
          
          if (isDuplicateError) {
            skippedCount++;
            // Silently skip - object already exists
          } else {
            // Re-throw non-duplicate errors
            throw error;
          }
        }
      }
      
      console.log(`   ✓ ${file}: ${successCount} statements executed, ${skippedCount} skipped (already exist)`);
    }
    
    console.log('✅ Migrations completed successfully!');
    console.log('🎉 Database schema is now up to date');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('   This usually means:');
    console.error('   1. Database connection credentials are incorrect');
    console.error('   2. Database server is unreachable');
    console.error('   3. Migration SQL has syntax errors');
    console.error('   4. Database user lacks necessary permissions');
    throw error; // Re-throw to let caller handle the error
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migrations when script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('👍 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}
