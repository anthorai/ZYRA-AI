import { testDatabaseConnection, seedSubscriptionPlans, getUserById, db } from "./db";
import { users, profiles } from "@shared/schema";

// Dev test user configuration
const DEV_TEST_USER_ID = 'dev-test-user-id';
const DEV_TEST_USER_EMAIL = 'test@example.com';

export async function ensureDevTestUser(): Promise<void> {
  // Only create test user in development mode without Supabase
  const isDevelopmentMode = process.env.NODE_ENV !== 'production';
  const hasSupabaseCredentials = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  
  if (!isDevelopmentMode || hasSupabaseCredentials) {
    return;
  }
  
  try {
    // Check if test user already exists in PostgreSQL
    const existingUser = await getUserById(DEV_TEST_USER_ID);
    
    if (!existingUser && db) {
      console.log("🔧 [INIT] Creating dev test user in database...");
      
      // Create the test user in PostgreSQL
      await db.insert(users).values({
        id: DEV_TEST_USER_ID,
        email: DEV_TEST_USER_EMAIL,
        fullName: 'Test User',
        password: null,
        role: 'user',
        plan: 'trial',
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        preferredLanguage: 'en',
      }).onConflictDoNothing();
      
      // Create profile for test user
      await db.insert(profiles).values({
        userId: DEV_TEST_USER_ID,
        name: 'Test User',
      }).onConflictDoNothing();
      
      console.log("✅ [INIT] Dev test user created in database");
    } else if (existingUser) {
      console.log("✓ [INIT] Dev test user already exists in database");
    }
  } catch (error) {
    console.error("⚠️ [INIT] Failed to create dev test user:", error);
    // Don't throw - this is non-critical for development
  }
}

export async function initializeDatabase(): Promise<void> {
  console.log("🚀 [INIT] Starting database initialization...");
  
  try {
    // Test database connection
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      throw new Error("Database connection failed");
    }
    
    // Seed subscription plans
    await seedSubscriptionPlans();
    
    // Ensure dev test user exists in development mode
    await ensureDevTestUser();
    
    console.log("✅ [INIT] Database initialization completed successfully!");
  } catch (error) {
    console.error("❌ [INIT] Database initialization failed:", error);
    throw error;
  }
}

// Auto-run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log("[INIT] Database ready!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("[INIT] Failed to initialize database:", error);
      process.exit(1);
    });
}