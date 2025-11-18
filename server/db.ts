import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, and, gte, lt, sql, notInArray } from "drizzle-orm";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import * as schema from "@shared/schema";
import {
  users,
  profiles,
  sessions,
  subscriptionPlans,
  subscriptions,
  usageStats,
  activityLogs,
  toolsAccess,
  realtimeMetrics,
  type User,
  type InsertUser,
  type Profile,
  type InsertProfile,
  type Session,
  type InsertSession,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Subscription,
  type UsageStats,
  type InsertUsageStats,
  type ActivityLog,
  type InsertActivityLog,
  type ToolsAccess,
  type InsertToolsAccess,
  type RealtimeMetrics,
  type InsertRealtimeMetrics
} from "@shared/schema";

// Database connection
// Check for DATABASE_URL and only initialize if available
// This prevents connection attempts to localhost when DATABASE_URL is missing
let pool: Pool | undefined;
let _db: NodePgDatabase<typeof schema> | null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  _db = drizzle(pool, { schema });
} else {
  console.warn("⚠️ DATABASE_URL not found. Database operations will fail.");
  // Create a dummy db object to prevent import errors, but operations will fail gracefully
  _db = null;
}

// Export the database connection directly
// Modules that use this must handle the null case or rely on runtime checks
export const db = _db;

// Type-safe database accessor for when you need guaranteed non-null db
// This throws at runtime if db is not initialized (narrows type to non-null)
export function requireDb(): NodePgDatabase<typeof schema> {
  if (!db) {
    throw new Error("Database connection not configured. Please check DATABASE_URL.");
  }
  return db;
}

// Error handling wrapper
async function withErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    if (!db) {
      throw new Error("Database connection not configured. Please check DATABASE_URL.");
    }
    console.log(`[DB] Starting operation: ${operationName}`);
    const result = await operation();
    console.log(`[DB] Operation completed successfully: ${operationName}`);
    return result;
  } catch (error) {
    console.error(`[DB] Error in ${operationName}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Database operation failed: ${operationName} - ${errorMessage}`);
  }
}

// User operations
export async function createUser(userData: InsertUser): Promise<User> {
  return withErrorHandling(async () => {
    const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : null;
    const [user] = await db.insert(users).values({
      ...userData,
      password: hashedPassword,
    }).returning();
    
    // Auto-create profile for user
    await db.insert(profiles).values({
      userId: user.id,
      name: userData.fullName,
    });
    
    console.log(`[DB] User created with ID: ${user.id}`);
    return user;
  }, "createUser");
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  return withErrorHandling(async () => {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }, "getUserByEmail");
}

export async function getUserById(userId: string): Promise<User | undefined> {
  return withErrorHandling(async () => {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user || undefined;
  }, "getUserById");
}

export async function updateUserSubscription(userId: string, planId: string, userEmail?: string): Promise<User> {
  return withErrorHandling(async () => {
    // Get the subscription plan details
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId));
    if (!plan) {
      throw new Error(`Subscription plan with ID ${planId} not found`);
    }

    // Check if user exists in PostgreSQL, create if not
    let [existingUser] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!existingUser) {
      console.log(`[DB] User ${userId} not found in PostgreSQL, creating...`);
      // Create user in PostgreSQL if they don't exist
      // This handles users authenticated via Supabase
      const fullName = userEmail?.split('@')[0] || 'User'; // Extract name from email or use default
      [existingUser] = await db.insert(users).values({
        id: userId,
        email: userEmail || 'user@example.com', // Use provided email or placeholder
        fullName: fullName,
        password: null, // No password for Supabase users
        plan: plan.planName,
      }).returning();
      
      console.log(`[DB] Created user ${userId} in PostgreSQL with fullName: ${fullName}`);
    }

    // Update user's plan
    const [updatedUser] = await db.update(users)
      .set({ plan: plan.planName })
      .where(eq(users.id, userId))
      .returning();

    // Create or update subscription record
    // Check if subscription already exists
    const [existingSubscription] = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    
    if (existingSubscription) {
      // Update existing subscription
      await db.update(subscriptions)
        .set({ planId, status: "active" })
        .where(eq(subscriptions.userId, userId));
    } else {
      // Create new subscription
      await db.insert(subscriptions).values({
        userId,
        planId,
        status: "active",
      });
    }

    console.log(`[DB] User ${userId} subscription updated to ${plan.planName}`);
    return updatedUser;
  }, "updateUserSubscription");
}

// Profile operations
export async function getUserProfile(userId: string): Promise<Profile | undefined> {
  return withErrorHandling(async () => {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile || undefined;
  }, "getUserProfile");
}

export async function updateUserProfile(userId: string, profileData: Partial<InsertProfile>): Promise<Profile> {
  return withErrorHandling(async () => {
    const [updatedProfile] = await db.update(profiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();

    if (!updatedProfile) {
      throw new Error(`Profile for user ${userId} not found`);
    }

    console.log(`[DB] Profile updated for user: ${userId}`);
    return updatedProfile;
  }, "updateUserProfile");
}

// Session operations
export async function saveSession(sessionData: InsertSession): Promise<Session> {
  return withErrorHandling(async () => {
    // Clean up expired sessions first
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));

    const [session] = await db.insert(sessions).values(sessionData).returning();
    console.log(`[DB] Session saved: ${session.sessionId}`);
    return session;
  }, "saveSession");
}

export async function getSession(sessionId: string): Promise<Session | undefined> {
  return withErrorHandling(async () => {
    const [session] = await db.select()
      .from(sessions)
      .where(and(
        eq(sessions.sessionId, sessionId),
        gte(sessions.expiresAt, new Date())
      ));
    
    return session || undefined;
  }, "getSession");
}

export async function deleteSession(sessionId: string): Promise<void> {
  return withErrorHandling(async () => {
    await db.delete(sessions).where(eq(sessions.sessionId, sessionId));
    console.log(`[DB] Session deleted: ${sessionId}`);
  }, "deleteSession");
}

// Subscription plan operations
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return withErrorHandling(async () => {
    return await db.select({
      id: subscriptionPlans.id,
      planName: subscriptionPlans.planName,
      price: subscriptionPlans.price,
      description: subscriptionPlans.description,
      features: subscriptionPlans.features,
      interval: subscriptionPlans.interval,
      limits: subscriptionPlans.limits,
      isActive: subscriptionPlans.isActive,
      createdAt: subscriptionPlans.createdAt
    })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(sql`(${subscriptionPlans.price})::numeric`);
  }, "getSubscriptionPlans");
}

export async function getSubscriptionPlanById(planId: string): Promise<SubscriptionPlan | undefined> {
  return withErrorHandling(async () => {
    const [plan] = await db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId));
    
    return plan || undefined;
  }, "getSubscriptionPlanById");
}

export async function createSubscriptionPlan(planData: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
  return withErrorHandling(async () => {
    const [plan] = await db.insert(subscriptionPlans).values(planData).returning();
    console.log(`[DB] Subscription plan created: ${plan.planName}`);
    return plan;
  }, "createSubscriptionPlan");
}

// Utility functions
export async function cleanupExpiredSessions(): Promise<number> {
  return withErrorHandling(async () => {
    const result = await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
    console.log(`[DB] Cleaned up expired sessions`);
    return result.rowCount || 0;
  }, "cleanupExpiredSessions");
}

export async function getUserSubscription(userId: string): Promise<Subscription | undefined> {
  return withErrorHandling(async () => {
    const [subscription] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
    
    return subscription || undefined;
  }, "getUserSubscription");
}

// Seed default subscription plans
export async function seedSubscriptionPlans(): Promise<void> {
  return withErrorHandling(async () => {
    console.log("[DB] Seeding default subscription plans...");

    const defaultPlans: InsertSubscriptionPlan[] = [
      {
        planName: "7-Day Free Trial",
        price: "0",
        description: "New users exploring Zyra features",
        features: [
          "✨ 100 credits / 7 days",
          "Product Optimization & SEO:",
          "• Optimized Products – 20 credits",
          "• SEO Keyword Density Analysis – 10 credits",
          "Conversion Boosting & Sales Automation:",
          "• AI-Powered Growth Intelligence – 20 credits",
          "• Basic A/B Testing – 10 credits",
          "Content & Branding at Scale:",
          "• Smart Product Descriptions – 20 credits",
          "• Limited Dynamic Templates – 10 credits",
          "Performance Tracking & ROI Insights:",
          "• Email Performance Analytics – 10 credits",
          "Workflow & Integration Tools:",
          "• One-Click Shopify Publish – 10 credits",
          "• Rollback Button – included"
        ],
        limits: {
          credits: 100
        },
        interval: "day",
        isActive: true
      },
      {
        planName: "Starter",
        price: "49.00",
        description: "Best for new Shopify stores just getting started",
        features: [
          "✨ 1,000 credits / month",
          "Product Optimization & SEO:",
          "• Optimized Products – 200 credits",
          "• SEO Keyword Density Analysis – 100 credits",
          "• AI Image Alt-Text Generator – 100 credits",
          "• Smart SEO Titles & Meta Tags – 100 credits",
          "Conversion Boosting & Sales Automation:",
          "• AI-Powered Growth Intelligence – 150 credits",
          "• A/B Testing – 50 credits",
          "• Upsell Email Receipts – 100 credits",
          "• Abandoned Cart SMS – 50 credits",
          "Content & Branding at Scale:",
          "• Smart Product Descriptions – 100 credits",
          "• Dynamic Templates – 50 credits",
          "• Brand Voice Memory – included",
          "Performance Tracking & ROI Insights:",
          "• Email & SMS Conversion Analytics – included",
          "Workflow & Integration Tools:",
          "• CSV Import/Export – included",
          "• One-Click Shopify Publish – included",
          "• Rollback Button – included",
          "• Smart Bulk Suggestions – included"
        ],
        limits: {
          credits: 1000
        },
        interval: "month",
        isActive: true
      },
      {
        planName: "Growth",
        price: "299.00",
        description: "For scaling merchants ready to grow",
        features: [
          "✨ 5,000 credits / month",
          "Product Optimization & SEO:",
          "• All Starter features +",
          "• SEO Ranking Tracker – 200 credits",
          "• Bulk Optimization & Smart Bulk Suggestions – 500 credits",
          "• Scheduled Refresh for Content & SEO Updates – 300 credits",
          "Conversion Boosting & Sales Automation:",
          "• AI Upsell Suggestions & Triggers – 300 credits",
          "• Dynamic Segmentation of Customers – 200 credits",
          "• Behavioral Targeting – 200 credits",
          "• Full A/B Test Results Dashboard – included",
          "Content & Branding at Scale:",
          "• Custom Templates – included",
          "• Multimodal AI (text + image + insights) – 300 credits",
          "• Multi-Channel Content Repurposing – 300 credits",
          "Performance Tracking & ROI Insights:",
          "• Full Email & SMS Tracking – included",
          "• Content ROI Tracking – included",
          "• Revenue Impact Attribution – included",
          "• Product Management Dashboard – included",
          "Workflow & Integration Tools:",
          "• Unlimited Starter workflow tools – included"
        ],
        limits: {
          credits: 5000
        },
        interval: "month",
        isActive: true
      },
      {
        planName: "Pro",
        price: "999.00",
        description: "For high-revenue brands & enterprises",
        features: [
          "✨ 20,000 credits / month",
          "Product Optimization & SEO:",
          "• All Growth features + priority processing",
          "Conversion Boosting & Sales Automation:",
          "• Full AI-driven automation for campaigns, upsells, and behavioral targeting",
          "Content & Branding at Scale:",
          "• Full template library",
          "• Advanced brand voice memory",
          "• Multimodal AI insights",
          "• Multi-channel automation",
          "Performance Tracking & ROI Insights:",
          "• Enterprise-grade analytics",
          "• Revenue attribution dashboard",
          "Workflow & Integration Tools:",
          "• Enterprise bulk management",
          "• CSV import/export",
          "• Rollback",
          "• Smart bulk suggestions at scale"
        ],
        limits: {
          credits: 20000
        },
        interval: "month",
        isActive: true
      },
    ];

    // Upsert plans (update if exists, insert if not)
    for (const planData of defaultPlans) {
      const [existingPlan] = await db.select({
        id: subscriptionPlans.id,
        planName: subscriptionPlans.planName,
        price: subscriptionPlans.price,
        features: subscriptionPlans.features,
        isActive: subscriptionPlans.isActive,
        createdAt: subscriptionPlans.createdAt
      })
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.planName, planData.planName));

      if (!existingPlan) {
        // Insert new plan
        await db.insert(subscriptionPlans).values({
          planName: planData.planName,
          price: planData.price,
          description: planData.description,
          features: planData.features,
          limits: planData.limits,
          interval: planData.interval || "month",
          isActive: planData.isActive || true
        });
        console.log(`[DB] Created subscription plan: ${planData.planName}`);
      } else {
        // Update existing plan with new pricing and features
        await db.update(subscriptionPlans)
          .set({
            price: planData.price,
            description: planData.description,
            features: planData.features,
            limits: planData.limits,
            interval: planData.interval || "month",
            isActive: planData.isActive || true
          })
          .where(eq(subscriptionPlans.planName, planData.planName));
        console.log(`[DB] Updated subscription plan: ${planData.planName}`);
      }
    }

    // Deactivate any legacy plans not in the new 4-plan set
    const activePlanNames = ["7-Day Free Trial", "Starter", "Growth", "Pro"];
    await db.update(subscriptionPlans)
      .set({ isActive: false })
      .where(notInArray(subscriptionPlans.planName, activePlanNames));
    
    console.log("[DB] Deactivated legacy plans not in current plan set");
    console.log("[DB] Subscription plans seeding completed!");
  }, "seedSubscriptionPlans");
}

// Database health check
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    if (!db) return false;
    
    // Simple test query
    await db.execute("SELECT 1");
    console.log("[DB] Database connection test successful!");
    return true;
  } catch (error) {
    console.error("[DB] Database connection test failed:", error);
    return false;
  }
}

// REAL-TIME DASHBOARD DATA FUNCTIONS

// Usage Stats Operations
export async function getUserUsageStats(userId: string): Promise<UsageStats | null> {
  return withErrorHandling(async () => {
    const [stats] = await db.select().from(usageStats).where(eq(usageStats.userId, userId));
    return stats || null;
  }, "getUserUsageStats");
}

export async function createOrUpdateUsageStats(userId: string, statsData: Partial<InsertUsageStats>): Promise<UsageStats> {
  return withErrorHandling(async () => {
    const existing = await getUserUsageStats(userId);
    
    if (existing) {
      const [updated] = await db.update(usageStats)
        .set({ ...statsData, lastUpdated: new Date() })
        .where(eq(usageStats.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(usageStats)
        .values({ userId, ...statsData })
        .returning();
      return created;
    }
  }, "createOrUpdateUsageStats");
}

export async function incrementUsageStat(userId: string, statField: keyof UsageStats, increment: number = 1): Promise<void> {
  return withErrorHandling(async () => {
    const current = await getUserUsageStats(userId);
    if (current) {
      const currentValue = current[statField] as number || 0;
      await db.update(usageStats)
        .set({ [statField]: currentValue + increment, lastUpdated: new Date() })
        .where(eq(usageStats.userId, userId));
    } else {
      await db.insert(usageStats)
        .values({ userId, [statField]: increment });
    }
    console.log(`[DB] Incremented ${statField} by ${increment} for user ${userId}`);
  }, "incrementUsageStat");
}

// Activity Logs Operations
export async function createActivityLog(logData: InsertActivityLog): Promise<ActivityLog> {
  return withErrorHandling(async () => {
    const [log] = await db.insert(activityLogs).values(logData).returning();
    console.log(`[DB] Activity logged: ${logData.action} for user ${logData.userId}`);
    return log;
  }, "createActivityLog");
}

export async function getUserActivityLogs(userId: string, limit: number = 10): Promise<ActivityLog[]> {
  return withErrorHandling(async () => {
    return await db.select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }, "getUserActivityLogs");
}

// Tools Access Operations
export async function trackToolAccess(userId: string, toolName: string): Promise<ToolsAccess> {
  return withErrorHandling(async () => {
    const [existing] = await db.select()
      .from(toolsAccess)
      .where(and(eq(toolsAccess.userId, userId), eq(toolsAccess.toolName, toolName)));

    if (existing) {
      const [updated] = await db.update(toolsAccess)
        .set({ 
          accessCount: existing.accessCount + 1,
          lastAccessed: new Date()
        })
        .where(and(eq(toolsAccess.userId, userId), eq(toolsAccess.toolName, toolName)))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(toolsAccess)
        .values({ userId, toolName, accessCount: 1 })
        .returning();
      return created;
    }
  }, "trackToolAccess");
}

export async function getUserToolsAccess(userId: string): Promise<ToolsAccess[]> {
  return withErrorHandling(async () => {
    return await db.select()
      .from(toolsAccess)
      .where(eq(toolsAccess.userId, userId))
      .orderBy(desc(toolsAccess.lastAccessed));
  }, "getUserToolsAccess");
}

// Real-time Metrics Operations
export async function updateRealtimeMetric(metricData: InsertRealtimeMetrics): Promise<RealtimeMetrics> {
  return withErrorHandling(async () => {
    const [metric] = await db.insert(realtimeMetrics).values(metricData).returning();
    console.log(`[DB] Real-time metric updated: ${metricData.metricName} for user ${metricData.userId}`);
    return metric;
  }, "updateRealtimeMetric");
}

export async function getUserRealtimeMetrics(userId: string, hours: number = 24): Promise<RealtimeMetrics[]> {
  return withErrorHandling(async () => {
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await db.select()
      .from(realtimeMetrics)
      .where(and(
        eq(realtimeMetrics.userId, userId),
        gte(realtimeMetrics.timestamp, hoursAgo)
      ))
      .orderBy(desc(realtimeMetrics.timestamp))
      .limit(50); // Limit to recent 50 metrics for faster loading
  }, "getUserRealtimeMetrics");
}

// Optimized Dashboard Data with reduced queries
export async function getUserDashboardData(userId: string): Promise<{
  user: User;
  profile: Profile | null;
  usageStats: UsageStats | null;
  activityLogs: ActivityLog[];
  toolsAccess: ToolsAccess[];
  realtimeMetrics: RealtimeMetrics[];
}> {
  return withErrorHandling(async () => {
    // Reduce parallel queries and data volume for faster loading
    const [user, profile, stats, activities, tools, metrics] = await Promise.all([
      getUserById(userId),
      getUserProfile(userId),
      getUserUsageStats(userId),
      getUserActivityLogs(userId, 3), // Reduced from 5 to 3 activities
      getUserToolsAccess(userId),
      getUserRealtimeMetrics(userId, 6) // Reduced from 24 to 6 hours
    ]);

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    console.log(`[DB] Optimized dashboard data fetched for user ${userId}`);
    return {
      user,
      profile: profile || null,
      usageStats: stats,
      activityLogs: activities,
      toolsAccess: tools,
      realtimeMetrics: metrics
    };
  }, "getUserDashboardData");
}

// Initialize user real-time data (called on first login)
export async function initializeUserRealtimeData(userId: string): Promise<void> {
  return withErrorHandling(async () => {
    // Create initial usage stats if they don't exist
    const existingStats = await getUserUsageStats(userId);
    if (!existingStats) {
      await db.insert(usageStats).values({
        userId,
        totalRevenue: Math.floor(Math.random() * 50000) + 10000, // Random initial revenue $100-$500
        totalOrders: Math.floor(Math.random() * 500) + 100, // Random initial orders 100-600
        conversionRate: Math.floor(Math.random() * 500) + 200, // 2-7% conversion rate
        cartRecoveryRate: Math.floor(Math.random() * 3000) + 5000, // 50-80% recovery rate
        productsOptimized: 0,
        emailsSent: 0,
        smsSent: 0,
        aiGenerationsUsed: 0,
        seoOptimizationsUsed: 0
      });
    }

    // Create initial activity log
    await createActivityLog({
      userId,
      action: "user_login",
      description: "User logged into dashboard",
      toolUsed: "dashboard",
      metadata: { timestamp: new Date().toISOString() }
    });

    console.log(`[DB] Initialized real-time data for user ${userId}`);
  }, "initializeUserRealtimeData");
}

// Generate realistic sample metrics for demo purposes
export async function generateSampleMetrics(userId: string): Promise<void> {
  return withErrorHandling(async () => {
    const metrics = [
      {
        userId,
        metricName: "revenue_change",
        value: "$" + (Math.floor(Math.random() * 5000) + 1000),
        changePercent: "+" + (Math.random() * 20 + 5).toFixed(1) + "%",
        isPositive: true
      },
      {
        userId,
        metricName: "orders_change", 
        value: (Math.floor(Math.random() * 100) + 50).toString(),
        changePercent: "+" + (Math.random() * 15 + 3).toFixed(1) + "%",
        isPositive: true
      },
      {
        userId,
        metricName: "conversion_change",
        value: (Math.random() * 2 + 2).toFixed(1) + "%",
        changePercent: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 5 + 1).toFixed(1) + "%",
        isPositive: Math.random() > 0.3
      },
      {
        userId,
        metricName: "cart_recovery_change",
        value: (Math.random() * 20 + 70).toFixed(0) + "%",
        changePercent: "+" + (Math.random() * 10 + 5).toFixed(1) + "%",
        isPositive: true
      }
    ];

    for (const metric of metrics) {
      await updateRealtimeMetric(metric);
    }

    console.log(`[DB] Generated sample metrics for user ${userId}`);
  }, "generateSampleMetrics");
}
