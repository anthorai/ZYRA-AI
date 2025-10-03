import { testDatabaseConnection, seedSubscriptionPlans } from "./db";

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