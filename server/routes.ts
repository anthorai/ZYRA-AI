import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
// Removed Express session and Passport.js imports
import { 
  insertUserSchema, 
  insertProductSchema, 
  insertNotificationSchema,
  insertUserPreferencesSchema,
  insertIntegrationSettingsSchema,
  insertSecuritySettingsSchema,
  insertLoginLogSchema,
  insertSupportTicketSchema,
  insertAiGenerationHistorySchema,
  insertProductSeoHistorySchema,
  insertCampaignSchema,
  insertCampaignTemplateSchema,
  insertAbandonedCartSchema,
  insertNotificationPreferencesSchema,
  insertNotificationRuleSchema,
  insertNotificationChannelSchema,
  insertNotificationAnalyticsSchema,
  insertAbTestSchema,
  insertBehavioralTriggerSchema,
  insertBehaviorEventSchema,
  insertTriggerExecutionSchema,
  users,
  subscriptions,
  subscriptionPlans,
  errorLogs,
  campaigns,
  campaignEvents,
  trackingTokens,
  products,
  seoMeta,
  storeConnections,
  oauthStates,
  abandonedCarts,
  revenueAttribution,
  behavioralTriggers,
  behaviorEvents,
  triggerExecutions,
  triggerAnalytics,
  customerSegments,
  customerSegmentMembers,
  customerProfiles,
  segmentAnalytics,
  usageStats,
  notificationAnalytics,
  notifications,
  userPreferences,
  securitySettings,
  loginLogs,
  supportTickets,
  aiGenerationHistory,
  productSeoHistory,
  campaignTemplates,
  notificationPreferences,
  notificationRules,
  notificationChannels,
  abTests,
  integrationSettings,
  profiles,
  automationSettings,
  autonomousActions,
  autonomousRules,
  pendingApprovals,
  competitorProducts,
  pricingRules,
  priceChanges,
  pricingSettings,
  sessions,
  customerSegmentMembers,
  segmentAnalytics
} from "@shared/schema";
import { supabaseStorage } from "./lib/supabase-storage";
import { supabase, supabaseAuth } from "./lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { storage, dbStorage } from "./storage";
import { testSupabaseConnection } from "./lib/supabase";
import { db, getSubscriptionPlans, updateUserSubscription, getUserById, createUser as createUserInNeon } from "./db";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import OpenAI from "openai";
import { processPromptTemplate, getAvailableBrandVoices } from "../shared/prompts.js";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import multer from "multer";
import csvParser from "csv-parser";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  captureRazorpayPayment,
  fetchRazorpayPayment,
  refundRazorpayPayment,
  getRazorpayKeyId,
  isRazorpayConfigured,
  handleRazorpayWebhook
} from "./razorpay";
import { sendEmail, sendBulkEmails } from "./lib/sendgrid-client";
import { sendSMS, sendBulkSMS } from "./lib/twilio-client";
import { 
  apiLimiter, 
  authLimiter, 
  aiLimiter, 
  campaignLimiter, 
  uploadLimiter,
  paymentLimiter 
} from "./middleware/rateLimiting";
import { 
  sanitizeBody, 
  validateProduct, 
  validateCampaign, 
  validateUser,
  checkValidation 
} from "./middleware/sanitization";
import { NotificationService } from "./lib/notification-service";
import { TwoFactorAuthService } from "./lib/2fa-service";
import { initializeUserCredits, getCreditBalance, checkAIToolCredits, consumeAIToolCredits, resetMonthlyCredits } from "./lib/credits";
import { cacheOrFetch, deleteCached, CacheConfig } from "./lib/cache";
import { cachedTextGeneration, cachedVisionAnalysis, getAICacheStats } from "./lib/ai-cache";
import { extractProductFeatures } from "./lib/shopify-features-extractor";
import { BulkOptimizationService } from "./lib/bulk-optimization-service";
import { upsellRecommendationEngine } from "./lib/upsell-recommendation-engine";
import { upsellRecommendationRules } from "@shared/schema";
import { grantFreeTrial } from "./lib/trial-expiration-service";

// Initialize OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || ""
});

// Types for authenticated user from Supabase
interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  plan: string;
  imageUrl?: string;
}

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Track server start time for uptime calculation
  const serverStartTime = Date.now();

  // Configure multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static('./uploads'));

  // Health check endpoint (no auth required) for monitoring
  app.get("/api/health", async (req, res) => {
    const startTime = Date.now();
    const status: any = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - serverStartTime) / 1000), // seconds
      environment: process.env.NODE_ENV || 'development',
      services: {
        api: "operational",
        database: "checking...",
      }
    };

    // Check database connectivity
    try {
      const dbConnected = await testSupabaseConnection();
      status.services.database = dbConnected ? "operational" : "degraded";
      if (!dbConnected) {
        status.status = "degraded";
      }
    } catch (error) {
      status.services.database = "unavailable";
      status.status = "degraded";
    }

    // Calculate response time
    status.responseTime = `${Date.now() - startTime}ms`;

    // Return appropriate status code
    const statusCode = status.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(status);
  });

  // Supabase authentication middleware
  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('🔐 Auth failed: No authorization header');
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(' ')[1];
      console.log('🔐 Auth attempt:', { 
        path: req.path,
        tokenLength: token?.length,
        tokenPreview: token?.substring(0, 20) + '...'
      });
      
      // Check for internal service token (for background jobs and cron)
      // SECURITY: INTERNAL_SERVICE_TOKEN is a secret only known to internal services
      // Accepts from any source when paired with x-internal-user-id header
      const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;
      
      if (token === INTERNAL_SERVICE_TOKEN && INTERNAL_SERVICE_TOKEN) {
        const internalUserId = req.headers['x-internal-user-id'];
        if (!internalUserId) {
          return res.status(401).json({ message: "Internal user ID required for service token" });
        }
        
        // Get user profile for internal service requests
        const userProfile = await supabaseStorage.getUser(internalUserId as string);
        if (!userProfile) {
          return res.status(401).json({ message: "User not found" });
        }
        
        (req as AuthenticatedRequest).user = {
          id: userProfile.id,
          email: userProfile.email,
          fullName: userProfile.fullName,
          role: userProfile.role,
          plan: userProfile.plan,
          imageUrl: userProfile.imageUrl ?? undefined
        };
        
        return next();
      }
      
      // Normal Supabase auth
      // Verify JWT token using service role admin methods
      console.log('🔐 Verifying JWT token...');
      
      // Use the service role client to verify the JWT
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        console.error('🔐 Token verification failed:', { 
          error: error?.message,
          errorCode: error?.code,
          hasUser: !!user,
          tokenLength: token.length
        });
        return res.status(401).json({ message: "Invalid token - please log in again" });
      }
      
      console.log('✅ Token verified successfully:', { userId: user.id, email: user.email });

      // Get user profile from Supabase storage by ID first, then email fallback
      let userProfile = await supabaseStorage.getUser(user.id);
      console.log('🔍 DB userProfile from getUser:', userProfile);
      
      if (!userProfile) {
        // Try email lookup (for backwards compatibility)
        userProfile = await supabaseStorage.getUserByEmail(user.email!);
        console.log('🔍 DB userProfile from getUserByEmail:', userProfile);
        
        if (!userProfile) {
          // Auto-provision profile for Supabase user using Supabase storage
          try {
            userProfile = await supabaseStorage.createUser({
              id: user.id, // Use Supabase user ID
              email: user.email!,
              password: null, // No password for Supabase users
              fullName: user.user_metadata?.full_name || user.user_metadata?.name || 'User'
            });
            console.log(`Auto-provisioned profile for user: ${user.email}`);
            
            // Automatically grant 7-day free trial to new users
            const trialResult = await grantFreeTrial(user.id);
            if (trialResult.success) {
              console.log(`🎉 [AUTO TRIAL] Granted 7-day free trial to new user ${user.email}`);
              // Refresh user profile to get updated trial info
              userProfile = await supabaseStorage.getUser(user.id) || userProfile;
            } else {
              console.warn(`⚠️ [AUTO TRIAL] Failed to grant trial: ${trialResult.message}`);
            }
          } catch (error) {
            console.error('Failed to auto-provision user profile:', error);
            return res.status(500).json({ message: "Failed to create user profile" });
          }
        }
      }

      // CRITICAL FIX: Ensure user exists in Neon database for foreign key constraints
      // oauth_states table (and others) in Neon require users to exist there
      // Use retry logic for transient database failures
      // Also sync admin role from Neon (source of truth for admin status)
      const syncUserToNeon = async (maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const neonUser = await getUserById(userProfile.id);
            if (!neonUser) {
              console.log(`🔧 [AUTH SYNC] User ${userProfile.id} not found in Neon (attempt ${attempt}/${maxRetries}), creating...`);
              await createUserInNeon({
                id: userProfile.id,
                email: userProfile.email,
                fullName: userProfile.fullName,
                password: null // No password for Supabase Auth users
                // plan and role will use database defaults: 'trial' and 'user'
              });
              console.log(`✅ [AUTH SYNC] User ${userProfile.id} synced to Neon successfully`);
              
              // Grant free trial to new Neon user (idempotent - won't duplicate if already granted)
              const trialResult = await grantFreeTrial(userProfile.id);
              if (trialResult.success && trialResult.trialEndDate) {
                console.log(`🎉 [AUTH SYNC] Trial activated for ${userProfile.email}, ends ${trialResult.trialEndDate.toISOString()}`);
              }
            } else {
              // User already exists in Neon - check for admin role
              // Neon database is source of truth for admin role
              if (neonUser.role === 'admin' && userProfile.role !== 'admin') {
                console.log(`👑 [AUTH SYNC] User ${userProfile.id} has admin role in Neon, upgrading session`);
                userProfile.role = 'admin';
              }
              console.log(`✓ [AUTH SYNC] User ${userProfile.id} already exists in Neon (role: ${neonUser.role})`);
            }
            return true; // Success
          } catch (error: any) {
            const isLastAttempt = attempt === maxRetries;
            const errorMessage = error?.message || 'Unknown error';
            
            if (isLastAttempt) {
              // Final attempt failed - log detailed error
              console.error(`❌ [AUTH SYNC] Failed to sync user ${userProfile.id} to Neon after ${maxRetries} attempts:`, {
                error: errorMessage,
                stack: error?.stack,
                userId: userProfile.id,
                email: userProfile.email
              });
              return false; // Failed
            } else {
              // Retry with exponential backoff
              const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
              console.warn(`⚠️ [AUTH SYNC] Attempt ${attempt} failed, retrying in ${backoffMs}ms:`, errorMessage);
              await new Promise(resolve => setTimeout(resolve, backoffMs));
            }
          }
        }
        return false;
      };
      
      await syncUserToNeon();

      console.log('🔍 Final userProfile being attached to request:', {
        id: userProfile.id,
        email: userProfile.email,
        fullName: userProfile.fullName,
        role: userProfile.role,
        plan: userProfile.plan
      });

      // Attach user to request
      (req as AuthenticatedRequest).user = {
        id: userProfile.id,
        email: userProfile.email,
        fullName: userProfile.fullName,
        role: userProfile.role,
        plan: userProfile.plan,
        imageUrl: userProfile.imageUrl ?? undefined
      };
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401).json({ message: "Authentication failed" });
    }
  };

  // Error logs endpoints (admin only) - for production monitoring
  app.get("/api/admin/error-logs", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      // Only allow admin users
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { resolved, errorType, limit, offset } = req.query;

      // Validate and sanitize pagination params
      const parsedLimit = parseInt(limit as string || '100', 10);
      const parsedOffset = parseInt(offset as string || '0', 10);
      const safeLimit = Math.min(Math.max(isNaN(parsedLimit) ? 100 : parsedLimit, 1), 1000);
      const safeOffset = Math.max(isNaN(parsedOffset) ? 0 : parsedOffset, 0);

      // Build filters array
      const filters = [];
      if (resolved === 'true') {
        filters.push(eq(errorLogs.resolved, true));
      } else if (resolved === 'false') {
        filters.push(eq(errorLogs.resolved, false));
      }
      
      if (errorType && typeof errorType === 'string') {
        filters.push(eq(errorLogs.errorType, errorType));
      }

      // Build query with combined filters
      let query = db.select().from(errorLogs);
      if (filters.length > 0) {
        query = query.where(and(...filters)) as any;
      }

      // Execute query with ordering and pagination
      const errors = await query
        .orderBy(desc(errorLogs.createdAt))
        .limit(safeLimit)
        .offset(safeOffset);
      
      // Get total count with same filters for accurate pagination
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(errorLogs);
      if (filters.length > 0) {
        countQuery = countQuery.where(and(...filters)) as any;
      }
      const totalResult = await countQuery;
      const total = totalResult[0]?.count || 0;
      
      res.json({ errors, total, limit: safeLimit, offset: safeOffset });
    } catch (error: any) {
      console.error("Error fetching error logs:", error);
      res.status(500).json({ message: "Failed to fetch error logs" });
    }
  });

  // Mark error as resolved
  app.patch("/api/admin/error-logs/:id/resolve", requireAuth, apiLimiter, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;

      await db.update(errorLogs)
        .set({
          resolved: true,
          resolvedAt: sql`NOW()`,
          resolvedBy: user.id,
        })
        .where(eq(errorLogs.id, id));

      res.json({ message: "Error marked as resolved" });
    } catch (error: any) {
      console.error("Error resolving error log:", error);
      res.status(500).json({ message: "Failed to resolve error" });
    }
  });

  // Authorized admin emails (hardcoded for security - source of truth)
  const AUTHORIZED_ADMIN_EMAILS = [
    'anthoraiofficial@gmail.com',
    'zyrahelp.io@gmail.com',
    'aniketar111@gmail.com',
    'theelitezoneofficial@gmail.com'
  ];

  // Admin: Get all users with their subscription details
  app.get("/api/admin/users-with-subscriptions", requireAuth, apiLimiter, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      // Double check: role must be admin AND email must be in authorized list
      if (user.role !== 'admin' || !AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        console.warn(`[SECURITY] Unauthorized admin access attempt by ${user.email}`);
        return res.status(403).json({ message: "Admin access required" });
      }

      // Pagination params
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100 per page
      const offset = (page - 1) * limit;

      // Get total count for pagination
      const [{ count: totalCount }] = await db.select({ count: sql<number>`count(*)` }).from(users);
      
      // Get paginated users from database
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
      
      // Get subscription and credit details for each user
      const usersWithDetails = await Promise.all(allUsers.map(async (u) => {
        // Get subscription with expiration dates
        const [subscription] = await db.select({
          planId: subscriptions.planId,
          status: subscriptions.status,
          trialEnd: subscriptions.trialEnd,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
        }).from(subscriptions).where(eq(subscriptions.userId, u.id));
        
        // Get plan name if subscription exists
        let planName = u.plan;
        if (subscription?.planId) {
          const [plan] = await db.select({ planName: subscriptionPlans.planName })
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, subscription.planId));
          planName = plan?.planName || u.plan;
        }
        
        // Get credits info from Neon database (where trial grants are stored)
        const [stats] = await db.select({
          creditsUsed: usageStats.creditsUsed,
          creditsRemaining: usageStats.creditsRemaining,
        }).from(usageStats).where(eq(usageStats.userId, u.id));
        
        const creditsUsed = stats?.creditsUsed || 0;
        const creditsRemaining = stats?.creditsRemaining || 0;
        
        // Get credit limit from plan
        let creditLimit = creditsUsed + creditsRemaining;
        if (subscription?.planId) {
          const [planData] = await db.select({ limits: subscriptionPlans.limits })
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, subscription.planId));
          if (planData?.limits && typeof planData.limits === 'object' && 'credits' in planData.limits) {
            creditLimit = (planData.limits as { credits?: number }).credits || creditLimit;
          }
        }
        
        // Determine expiration date (trial end for trialing, period end for active)
        const expiresAt = subscription?.status === 'trialing' 
          ? subscription.trialEnd 
          : subscription?.currentPeriodEnd;
        
        return {
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          plan: u.plan,
          createdAt: u.createdAt,
          subscription: subscription ? {
            planId: subscription.planId,
            planName,
            status: subscription.status,
            expiresAt: expiresAt || null,
          } : null,
          credits: {
            used: creditsUsed,
            remaining: creditsRemaining,
            limit: creditLimit,
          },
        };
      }));

      // Return paginated response
      res.json({
        users: usersWithDetails,
        pagination: {
          page,
          limit,
          total: Number(totalCount),
          totalPages: Math.ceil(Number(totalCount) / limit),
        }
      });
    } catch (error: any) {
      console.error("Error fetching users with subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin: Assign a subscription plan to a user (without payment)
  app.post("/api/admin/assign-plan", requireAuth, apiLimiter, async (req, res) => {
    try {
      const adminUser = (req as AuthenticatedRequest).user;
      
      // Double check: role must be admin AND email must be in authorized list
      if (adminUser.role !== 'admin' || !AUTHORIZED_ADMIN_EMAILS.includes(adminUser.email.toLowerCase())) {
        console.warn(`[SECURITY] Unauthorized admin access attempt by ${adminUser.email}`);
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId, planId } = req.body;
      
      if (!userId || !planId) {
        return res.status(400).json({ message: "userId and planId are required" });
      }

      // Get the plan details
      const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId));
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // Get user
      const [targetUser] = await db.select().from(users).where(eq(users.id, userId));
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user's plan in users table
      await db.update(users)
        .set({ plan: plan.planName })
        .where(eq(users.id, userId));

      // Check if subscription exists
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

      // Initialize/reset credits for the new plan
      await initializeUserCredits(userId, planId);

      console.log(`[ADMIN] User ${targetUser.email} assigned to ${plan.planName} by admin ${adminUser.email}`);

      res.json({ 
        success: true,
        message: "Plan assigned successfully",
        userId,
        planId,
        planName: plan.planName,
        userEmail: targetUser.email,
      });
    } catch (error: any) {
      console.error("Error assigning plan:", error);
      res.status(500).json({ message: "Failed to assign plan" });
    }
  });

  // Admin: Reset user's credits to plan limit
  app.post("/api/admin/reset-credits", requireAuth, apiLimiter, async (req, res) => {
    try {
      const adminUser = (req as AuthenticatedRequest).user;
      
      // Double check: role must be admin AND email must be in authorized list
      if (adminUser.role !== 'admin' || !AUTHORIZED_ADMIN_EMAILS.includes(adminUser.email.toLowerCase())) {
        console.warn(`[SECURITY] Unauthorized admin access attempt by ${adminUser.email}`);
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      // Get user's subscription
      const [subscription] = await db.select().from(subscriptions)
        .where(eq(subscriptions.userId, userId));

      if (!subscription) {
        return res.status(404).json({ message: "No subscription found for user" });
      }

      // Reset credits for the plan
      await resetMonthlyCredits(userId);

      console.log(`[ADMIN] Credits reset for user ${userId} by admin ${adminUser.email}`);

      res.json({ 
        success: true,
        message: "Credits reset successfully",
      });
    } catch (error: any) {
      console.error("Error resetting credits:", error);
      res.status(500).json({ message: "Failed to reset credits" });
    }
  });

  // Admin: Delete user account
  app.delete("/api/admin/delete-user/:userId", requireAuth, apiLimiter, async (req, res) => {
    try {
      const adminUser = (req as AuthenticatedRequest).user;
      
      // Double check: role must be admin AND email must be in authorized list
      if (adminUser.role !== 'admin' || !AUTHORIZED_ADMIN_EMAILS.includes(adminUser.email.toLowerCase())) {
        console.warn(`[SECURITY] Unauthorized admin delete attempt by ${adminUser.email}`);
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      // Prevent admin from deleting themselves
      if (userId === adminUser.id) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }

      // Get the user to be deleted
      const [targetUser] = await db.select().from(users).where(eq(users.id, userId));
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deleting other admins
      if (targetUser.role === 'admin') {
        return res.status(400).json({ message: "Cannot delete admin accounts" });
      }

      console.log(`[ADMIN] Starting account deletion for user ${userId} (${targetUser.email}) by admin ${adminUser.email}`);

      // Step 1: Try to delete user from Supabase Auth (may not exist for orphaned accounts)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) {
        // If user not found in Supabase Auth, that's okay - they can't login anyway
        // Continue with database cleanup
        if (authError.message?.includes('not found') || authError.message?.includes('User not found')) {
          console.log(`[ADMIN] User ${userId} not found in Supabase Auth (orphaned account) - proceeding with database cleanup`);
        } else {
          // For other auth errors, still log but proceed with deletion
          console.warn('Warning during Supabase auth deletion:', authError.message);
        }
      }

      // Step 2: Delete all related records from database tables (order matters for foreign keys)
      const tablesToClean = [
        { name: 'notificationAnalytics', table: notificationAnalytics },
        { name: 'notifications', table: notifications },
        { name: 'notificationPreferences', table: notificationPreferences },
        { name: 'notificationRules', table: notificationRules },
        { name: 'notificationChannels', table: notificationChannels },
        { name: 'subscriptions', table: subscriptions },
        { name: 'usageStats', table: usageStats },
        { name: 'userPreferences', table: userPreferences },
        { name: 'securitySettings', table: securitySettings },
        { name: 'loginLogs', table: loginLogs },
        { name: 'supportTickets', table: supportTickets },
        { name: 'aiGenerationHistory', table: aiGenerationHistory },
        { name: 'productSeoHistory', table: productSeoHistory },
        { name: 'campaigns', table: campaigns },
        { name: 'campaignTemplates', table: campaignTemplates },
        { name: 'campaignEvents', table: campaignEvents },
        { name: 'products', table: products },
        { name: 'seoMeta', table: seoMeta },
        { name: 'storeConnections', table: storeConnections },
        { name: 'abandonedCarts', table: abandonedCarts },
        { name: 'revenueAttribution', table: revenueAttribution },
        { name: 'behavioralTriggers', table: behavioralTriggers },
        { name: 'behaviorEvents', table: behaviorEvents },
        { name: 'triggerExecutions', table: triggerExecutions },
        { name: 'triggerAnalytics', table: triggerAnalytics },
        { name: 'customerSegments', table: customerSegments },
        { name: 'customerProfiles', table: customerProfiles },
        { name: 'abTests', table: abTests },
        { name: 'integrationSettings', table: integrationSettings },
        { name: 'automationSettings', table: automationSettings },
        { name: 'autonomousActions', table: autonomousActions },
        { name: 'autonomousRules', table: autonomousRules },
        { name: 'pendingApprovals', table: pendingApprovals },
        { name: 'competitorProducts', table: competitorProducts },
        { name: 'pricingRules', table: pricingRules },
        { name: 'priceChanges', table: priceChanges },
        { name: 'pricingSettings', table: pricingSettings },
        { name: 'sessions', table: sessions },
        { name: 'customerSegmentMembers', table: customerSegmentMembers },
        { name: 'segmentAnalytics', table: segmentAnalytics },
        { name: 'profiles', table: profiles },
        { name: 'errorLogs', table: errorLogs },
      ];

      for (const { name, table } of tablesToClean) {
        try {
          await db.delete(table).where(eq(table.userId, userId));
          console.log(`[ADMIN] Deleted ${name} records for user ${userId}`);
        } catch (e: any) {
          // Some tables may not have data for this user, that's okay
          if (!e.message?.includes('column "user_id" does not exist')) {
            console.warn(`[ADMIN] Error deleting ${name} (continuing):`, e.message);
          }
        }
      }

      // Step 3: Delete user from users table
      await db.delete(users).where(eq(users.id, userId));

      console.log(`[ADMIN] Successfully deleted user ${userId} (${targetUser.email}) by admin ${adminUser.email}`);

      res.json({ 
        success: true,
        message: `User ${targetUser.email} has been permanently deleted`,
        deletedUser: {
          id: userId,
          email: targetUser.email
        }
      });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user account" });
    }
  });

  // Usage limit enforcement middleware for AI operations
  const checkAIUsageLimit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const userPlan = (req as AuthenticatedRequest).user.plan;

      // Get user's usage stats
      const usageStats = await supabaseStorage.getUserUsageStats(userId);
      const aiGenerationsUsed = usageStats?.aiGenerationsUsed || 0;
      const seoOptimizationsUsed = usageStats?.seoOptimizationsUsed || 0;

      // Get plan limits from subscription plans
      const plans = await supabaseStorage.getSubscriptionPlans();
      const currentPlan = plans.find(p => p.planName?.toLowerCase() === userPlan.toLowerCase());

      if (!currentPlan) {
        // If no plan found, allow trial users limited access
        if (userPlan === 'trial') {
          if (aiGenerationsUsed >= 10) {
            return res.status(403).json({ 
              message: "Trial limit reached. Upgrade to continue using AI features.",
              upgradeRequired: true 
            });
          }
        }
      } else {
        const limits = currentPlan.limits as any;
        
        // Check if plan has unlimited credits (-1) or is Pro plan
        if (limits.credits !== -1 && currentPlan.planName !== 'Pro') {
          // For trial: 10 AI generations, 5 SEO optimizations
          if (userPlan === 'trial') {
            if (aiGenerationsUsed >= 10) {
              await NotificationService.notifyAILimitReached(userId, 'Trial', 10);
              return res.status(403).json({ 
                message: "Trial AI generation limit (10) reached. Upgrade to continue.",
                upgradeRequired: true 
              });
            } else if (aiGenerationsUsed >= 8) {
              await NotificationService.notifyAILimitWarning(userId, 10 - aiGenerationsUsed, 10);
            }
          }
          // For Starter: 50 AI generations, 50 SEO optimizations
          else if (currentPlan.planName === 'Starter') {
            if (aiGenerationsUsed >= 50) {
              await NotificationService.notifyAILimitReached(userId, 'Starter', 50);
              return res.status(403).json({ 
                message: "Monthly AI generation limit (50) reached. Upgrade to Growth plan for 1,000 generations.",
                upgradeRequired: true 
              });
            } else if (aiGenerationsUsed >= 45) {
              await NotificationService.notifyAILimitWarning(userId, 50 - aiGenerationsUsed, 50);
            }
          }
          // For Growth: 1000 AI generations, 500 SEO optimizations
          else if (currentPlan.planName === 'Growth') {
            if (aiGenerationsUsed >= 1000) {
              await NotificationService.notifyAILimitReached(userId, 'Growth', 1000);
              return res.status(403).json({ 
                message: "Monthly AI generation limit (1,000) reached. Upgrade to Pro for unlimited access.",
                upgradeRequired: true 
              });
            } else if (aiGenerationsUsed >= 950) {
              await NotificationService.notifyAILimitWarning(userId, 1000 - aiGenerationsUsed, 1000);
            }
          }
        }
      }

      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      // Don't block on errors, just log and continue
      next();
    }
  };

  // Track AI usage after successful operation
  const trackAIUsage = async (userId: string, tokensUsed: number = 0) => {
    try {
      const stats = await supabaseStorage.getUserUsageStats(userId);
      const currentUsage = stats?.aiGenerationsUsed || 0;
      
      await supabaseStorage.createOrUpdateUsageStats(userId, {
        aiGenerationsUsed: currentUsage + 1,
        lastUpdated: new Date()
      });

      // Also log to AI generation history
      // This will be implemented when we add the history tracking
    } catch (error) {
      console.error('Failed to track AI usage:', error);
    }
  };

  // Track SEO optimization usage
  const trackSEOUsage = async (userId: string) => {
    try {
      const stats = await supabaseStorage.getUserUsageStats(userId);
      const currentUsage = stats?.seoOptimizationsUsed || 0;
      
      await supabaseStorage.createOrUpdateUsageStats(userId, {
        seoOptimizationsUsed: currentUsage + 1,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Failed to track SEO usage:', error);
    }
  };

  // Rate limiting for AI operations
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  
  const checkRateLimit = (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as AuthenticatedRequest).user.id;
    const userPlan = (req as AuthenticatedRequest).user.plan;
    
    // Define rate limits per plan (requests per minute)
    const rateLimits: Record<string, number> = {
      'trial': 5,      // 5 requests per minute
      'Starter': 10,   // 10 requests per minute
      'Growth': 30,    // 30 requests per minute
      'Pro': 100       // 100 requests per minute
    };
    
    const limit = rateLimits[userPlan] || 5;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    
    const userRateData = rateLimitMap.get(userId);
    
    if (!userRateData || now > userRateData.resetTime) {
      // New window or expired window
      rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
      next();
    } else if (userRateData.count < limit) {
      // Within limit
      userRateData.count++;
      next();
    } else {
      // Rate limit exceeded
      const resetIn = Math.ceil((userRateData.resetTime - now) / 1000);
      res.status(429).json({ 
        message: `Rate limit exceeded. You can make ${limit} AI requests per minute. Try again in ${resetIn} seconds.`,
        retryAfter: resetIn
      });
    }
  };

  // Clean up old rate limit entries periodically
  setInterval(() => {
    const now = Date.now();
    const entries = Array.from(rateLimitMap.entries());
    for (const [userId, data] of entries) {
      if (now > data.resetTime) {
        rateLimitMap.delete(userId);
      }
    }
  }, 60 * 1000); // Clean up every minute

  // Contact form endpoint - stores submissions and attempts email via SendGrid
  app.post("/api/contact", apiLimiter, sanitizeBody, async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      // Store contact submission in database first (always succeeds)
      try {
        await db.execute(sql`
          INSERT INTO contact_submissions (name, email, subject, message, created_at, status)
          VALUES (${name}, ${email}, ${subject}, ${message}, NOW(), 'pending')
        `);
        console.log(`[Contact Form] Submission stored from ${email} - Subject: ${subject}`);
      } catch (dbError: any) {
        // If table doesn't exist, create it and retry
        if (dbError.message?.includes('does not exist')) {
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS contact_submissions (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL,
              subject VARCHAR(500) NOT NULL,
              message TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT NOW(),
              status VARCHAR(50) DEFAULT 'pending'
            )
          `);
          await db.execute(sql`
            INSERT INTO contact_submissions (name, email, subject, message, created_at, status)
            VALUES (${name}, ${email}, ${subject}, ${message}, NOW(), 'pending')
          `);
          console.log(`[Contact Form] Table created and submission stored from ${email}`);
        } else {
          console.error('[Contact Form] Database error:', dbError.message);
        }
      }
      
      // Try to send email notification (optional - doesn't block success)
      let emailSent = false;
      try {
        const teamEmail = "team@zzyraai.com";
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #00F0FF 0%, #00FFE5 100%); padding: 20px; border-radius: 12px 12px 0 0;">
              <h1 style="color: #0D0D1F; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
            </div>
            <div style="background: #1a1a2e; padding: 30px; border-radius: 0 0 12px 12px; color: #ffffff;">
              <div style="margin-bottom: 20px;">
                <p style="color: #00F0FF; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">From</p>
                <p style="margin: 0; font-size: 16px;">${name}</p>
              </div>
              <div style="margin-bottom: 20px;">
                <p style="color: #00F0FF; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">Email</p>
                <p style="margin: 0; font-size: 16px;"><a href="mailto:${email}" style="color: #00F0FF; text-decoration: none;">${email}</a></p>
              </div>
              <div style="margin-bottom: 20px;">
                <p style="color: #00F0FF; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">Subject</p>
                <p style="margin: 0; font-size: 16px;">${subject}</p>
              </div>
              <div style="margin-bottom: 20px;">
                <p style="color: #00F0FF; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">Message</p>
                <div style="background: #0D0D1F; padding: 15px; border-radius: 8px; border-left: 3px solid #00F0FF;">
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                </div>
              </div>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #2a2a4e;">
                <p style="color: #888; font-size: 12px; margin: 0;">This message was sent from the Zyra AI contact form.</p>
                <p style="color: #888; font-size: 12px; margin: 5px 0 0 0;">Received at: ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        `;
        
        await sendEmail(teamEmail, `[Contact Form] ${subject}`, htmlContent);
        emailSent = true;
        console.log(`[Contact Form] Email notification sent for ${email}`);
      } catch (emailError: any) {
        console.error('[Contact Form] Email sending failed (submission still saved):', emailError.message);
      }
      
      // Always return success since we've stored the submission
      res.json({ 
        success: true, 
        message: "Thank you for your message! We've received your inquiry and will get back to you within 24 hours.",
        emailSent 
      });
    } catch (error: any) {
      console.error('Contact form error:', error);
      res.status(500).json({ message: 'Failed to submit message. Please try again later.', error: error.message });
    }
  });

  // Server-side auth proxy endpoints (fixes CORS/CSP issues with Supabase)
  
  // Registration endpoint - proxies to Supabase from server
  app.post("/api/auth/register", authLimiter, sanitizeBody, async (req, res) => {
    try {
      const { email, password, fullName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Call Supabase from server (no CORS issues)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) {
        return res.status(400).json({ message: error.message, error });
      }
      
      res.json({ data });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed', error: error.message });
    }
  });

  // Login endpoint - proxies to Supabase from server
  app.post("/api/auth/login", authLimiter, sanitizeBody, async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Call Supabase from server (no CORS issues)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return res.status(400).json({ message: error.message, error });
      }
      
      res.json({ data });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  });

  // Logout endpoint - proxies to Supabase from server
  app.post("/api/auth/logout", apiLimiter, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No authorization token provided" });
      }
      
      const token = authHeader.split(' ')[1];
      
      // Set the session for this supabase client instance
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: '' // Not needed for logout
      });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return res.status(400).json({ message: error.message, error });
      }
      
      res.json({ message: "Logged out successfully" });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed', error: error.message });
    }
  });

  app.get("/api/me", requireAuth, (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        fullName: user.fullName, 
        role: user.role,
        plan: user.plan,
        imageUrl: user.imageUrl
      } 
    });
  });


  // ===== 2FA (Two-Factor Authentication) Routes =====

  // Setup 2FA - Generate secret and QR code
  app.post("/api/2fa/setup", requireAuth, apiLimiter, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const userEmail = (req as AuthenticatedRequest).user.email;

      // Generate TOTP secret
      const { secret, otpauth_url } = TwoFactorAuthService.generateSecret(userEmail);
      
      // Generate QR code
      const qrCode = await TwoFactorAuthService.generateQRCode(otpauth_url);

      // Generate backup codes
      const backupCodes = TwoFactorAuthService.generateBackupCodes();
      const hashedBackupCodes = await TwoFactorAuthService.hashBackupCodes(backupCodes);

      // Store secret and backup codes in security settings (temporarily, until verified)
      const existingSettings = await supabaseStorage.getSecuritySettings(userId);
      
      if (existingSettings) {
        await supabaseStorage.updateSecuritySettings(userId, {
          twoFactorSecret: secret,
          backupCodes: hashedBackupCodes as any
        });
      } else {
        await supabaseStorage.createSecuritySettings({
          userId,
          twoFactorEnabled: false,
          twoFactorSecret: secret,
          backupCodes: hashedBackupCodes as any
        });
      }

      res.json({
        secret,
        qrCode,
        backupCodes // Return plain codes for user to save (only shown once)
      });
    } catch (error: any) {
      console.error('2FA setup error:', error);
      res.status(500).json({ message: 'Failed to setup 2FA' });
    }
  });

  // Enable 2FA - Verify token and enable
  app.post("/api/2fa/enable", requireAuth, authLimiter, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: 'Token is required' });
      }

      // Get security settings
      const settings = await supabaseStorage.getSecuritySettings(userId);
      if (!settings || !settings.twoFactorSecret) {
        return res.status(400).json({ message: '2FA setup required first' });
      }

      // Verify token
      const isValid = TwoFactorAuthService.verifyToken(settings.twoFactorSecret, token);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid token' });
      }

      // Enable 2FA
      await supabaseStorage.updateSecuritySettings(userId, {
        twoFactorEnabled: true
      });

      res.json({ message: '2FA enabled successfully' });
    } catch (error: any) {
      console.error('2FA enable error:', error);
      res.status(500).json({ message: 'Failed to enable 2FA' });
    }
  });

  // Disable 2FA
  app.post("/api/2fa/disable", requireAuth, authLimiter, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: 'Token is required' });
      }

      // Get security settings
      const settings = await supabaseStorage.getSecuritySettings(userId);
      if (!settings || !settings.twoFactorEnabled) {
        return res.status(400).json({ message: '2FA is not enabled' });
      }

      // Try to verify as TOTP token first
      let isValid = TwoFactorAuthService.verifyToken(settings.twoFactorSecret || '', token);
      let usedBackupCode = false;

      // If TOTP verification fails, try backup codes
      if (!isValid && settings.backupCodes) {
        const backupCodesArray = settings.backupCodes as string[];
        const backupCodeValid = await TwoFactorAuthService.verifyBackupCode(token, backupCodesArray);
        
        if (backupCodeValid) {
          isValid = true;
          usedBackupCode = true;
        }
      }

      // If both TOTP and backup code verification failed, return error
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid token or backup code' });
      }

      // Disable 2FA and clear all secrets
      await supabaseStorage.updateSecuritySettings(userId, {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null
      });

      res.json({ 
        message: '2FA disabled successfully',
        usedBackupCode
      });
    } catch (error: any) {
      console.error('2FA disable error:', error);
      res.status(500).json({ message: 'Failed to disable 2FA' });
    }
  });

  // Verify 2FA token (for login or sensitive operations)
  app.post("/api/2fa/verify", requireAuth, authLimiter, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: 'Token is required' });
      }

      // Get security settings
      const settings = await supabaseStorage.getSecuritySettings(userId);
      if (!settings || !settings.twoFactorEnabled) {
        return res.status(400).json({ message: '2FA is not enabled' });
      }

      // Verify token
      const isValid = TwoFactorAuthService.verifyToken(settings.twoFactorSecret || '', token);
      
      // If token is invalid, try backup codes
      if (!isValid && settings.backupCodes) {
        const backupCodesArray = settings.backupCodes as string[];
        const backupCodeValid = await TwoFactorAuthService.verifyBackupCode(token, backupCodesArray);
        
        if (backupCodeValid) {
          // Remove used backup code
          const updatedCodes = backupCodesArray.filter(async (code) => {
            const crypto = await import('crypto');
            const hashedInput = crypto.createHash('sha256').update(token).digest('hex');
            return code !== hashedInput;
          });
          
          await supabaseStorage.updateSecuritySettings(userId, {
            backupCodes: updatedCodes as any
          });
          
          return res.json({ verified: true, message: 'Backup code used successfully' });
        }
        
        return res.status(400).json({ message: 'Invalid token or backup code' });
      }

      res.json({ verified: isValid });
    } catch (error: any) {
      console.error('2FA verify error:', error);
      res.status(500).json({ message: 'Failed to verify 2FA token' });
    }
  });

  // Get 2FA status
  app.get("/api/2fa/status", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      const settings = await supabaseStorage.getSecuritySettings(userId);
      
      res.json({
        enabled: settings?.twoFactorEnabled || false,
        backupCodesCount: settings?.backupCodes ? (settings.backupCodes as string[]).length : 0
      });
    } catch (error: any) {
      console.error('2FA status error:', error);
      res.status(500).json({ message: 'Failed to get 2FA status' });
    }
  });

  // Session management endpoints
  app.get("/api/sessions", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      const sessions = await supabaseStorage.getUserSessions(userId);
      
      res.json(sessions);
    } catch (error: any) {
      console.error('[Sessions] Error fetching user sessions:', error);
      res.status(500).json({ message: 'Failed to fetch sessions' });
    }
  });

  app.delete("/api/sessions/:sessionId", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { sessionId } = req.params;
      
      // Verify session belongs to user
      const session = await supabaseStorage.getSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Delete the session from our database
      await supabaseStorage.deleteSession(sessionId);
      
      // TODO: Revoke Supabase refresh token if refreshTokenId exists
      // This will be implemented in session tracking middleware
      
      res.json({ message: 'Session revoked successfully' });
    } catch (error: any) {
      console.error('[Sessions] Error revoking session:', error);
      res.status(500).json({ message: 'Failed to revoke session' });
    }
  });

  // Professional AI Copywriting with Multi-Agent Pipeline & A/B Testing
  app.post("/api/generate-professional-copy", requireAuth, aiLimiter, sanitizeBody, checkRateLimit, checkAIUsageLimit, async (req, res) => {
    try {
      const { 
        productName, 
        category, 
        features, 
        audience, 
        framework = 'AIDA',
        industry,
        psychologicalTriggers = [],
        maxWords = 150
      } = req.body;
      
      const userId = (req as AuthenticatedRequest).user.id;

      if (!productName?.trim()) {
        return res.status(400).json({ message: "Product name is required" });
      }

      // Import advanced copywriting modules
      const { generateMultiAgentCopy, scoreACopy } = await import('../shared/ai-quality-scoring');
      const { getCopywritingFramework, getIndustryTemplate, getPsychologicalTrigger } = await import('../shared/copywriting-frameworks');
      const { validateAIContent } = await import('../shared/ai-content-validator');

      // Get framework template
      const frameworkTemplate = getCopywritingFramework(framework);
      if (!frameworkTemplate) {
        return res.status(400).json({ message: `Invalid framework: ${framework}` });
      }

      // Generate 3 variants using multi-agent pipeline with industry context
      const variants = await generateMultiAgentCopy(
        productName,
        category || 'General',
        features || 'High-quality product',
        audience || 'General consumers',
        framework,
        maxWords,
        openai,
        industry, // Pass industry for specific templates
        psychologicalTriggers // Pass triggers for enhanced persuasion
      );

      // Fetch learned patterns for this user/category to enhance validation
      const patterns = await storage.getLearningPatterns(userId, { 
        category: category || 'General',
        patternType: 'ad_copy'
      });
      
      // Score each variant with AI quality scoring + pre-validation
      const [emotionalScore, logicalScore, hybridScore] = await Promise.all([
        scoreACopy(variants.emotional.copy || '', audience || 'General', industry || category || 'General', openai),
        scoreACopy(variants.logical.copy || '', audience || 'General', industry || category || 'General', openai),
        scoreACopy(variants.hybrid.copy || '', audience || 'General', industry || category || 'General', openai)
      ]);
      
      // Pre-validate each variant using learned patterns
      const [emotionalValidation, logicalValidation, hybridValidation] = [
        validateAIContent(variants.emotional.copy || '', 'ad_copy', patterns, { 
          minOverallScore: 65, 
          category: category || 'General',
          targetAudience: audience 
        }),
        validateAIContent(variants.logical.copy || '', 'ad_copy', patterns, { 
          minOverallScore: 65, 
          category: category || 'General',
          targetAudience: audience 
        }),
        validateAIContent(variants.hybrid.copy || '', 'ad_copy', patterns, { 
          minOverallScore: 65, 
          category: category || 'General',
          targetAudience: audience 
        })
      ];

      // Track total tokens used (estimate 3x for 3 variants + scoring)
      const estimatedTokens = 1500;
      await trackAIUsage(userId, estimatedTokens);

      // Store generation in history
      await supabaseStorage.createAiGenerationHistory({
        userId,
        generationType: 'professional_copy_multiagent',
        inputData: { productName, category, features, audience, framework, industry },
        outputData: { 
          variants: {
            emotional: variants.emotional,
            logical: variants.logical,
            hybrid: variants.hybrid
          },
          scores: {
            emotional: emotionalScore,
            logical: logicalScore,
            hybrid: hybridScore
          },
          analysis: variants.analysis
        },
        brandVoice: framework,
        tokensUsed: estimatedTokens,
        model: 'gpt-4o-mini-multiagent'
      });

      await NotificationService.notifyAIGenerationComplete(userId, 'professional copy', productName);

      res.json({
        success: true,
        framework,
        wordCount: variants.emotional.copy?.split(' ').length || 0,
        variants: [
          {
            id: 'emotional',
            type: 'emotional',
            headline: variants.emotional.headline,
            copy: variants.emotional.copy,
            cta: variants.emotional.cta,
            qualityScore: emotionalScore,
            validation: {
              passed: emotionalValidation.passed,
              score: emotionalValidation.overallScore,
              readability: emotionalValidation.readabilityScore,
              seo: emotionalValidation.seoScore,
              issues: emotionalValidation.issues.filter(i => i.severity === 'critical' || i.severity === 'warning'),
              suggestions: emotionalValidation.suggestions.slice(0, 3)
            },
            framework,
            psychologicalTriggers: psychologicalTriggers.filter((t: string) => ['Scarcity', 'Urgency', 'Loss Aversion'].includes(t))
          },
          {
            id: 'logical',
            type: 'logical',
            headline: variants.logical.headline,
            copy: variants.logical.copy,
            cta: variants.logical.cta,
            qualityScore: logicalScore,
            validation: {
              passed: logicalValidation.passed,
              score: logicalValidation.overallScore,
              readability: logicalValidation.readabilityScore,
              seo: logicalValidation.seoScore,
              issues: logicalValidation.issues.filter(i => i.severity === 'critical' || i.severity === 'warning'),
              suggestions: logicalValidation.suggestions.slice(0, 3)
            },
            framework,
            psychologicalTriggers: psychologicalTriggers.filter((t: string) => ['Authority', 'Social Proof'].includes(t))
          },
          {
            id: 'hybrid',
            type: 'hybrid',
            headline: variants.hybrid.headline,
            copy: variants.hybrid.copy,
            cta: variants.hybrid.cta,
            qualityScore: hybridScore,
            validation: {
              passed: hybridValidation.passed,
              score: hybridValidation.overallScore,
              readability: hybridValidation.readabilityScore,
              seo: hybridValidation.seoScore,
              issues: hybridValidation.issues.filter(i => i.severity === 'critical' || i.severity === 'warning'),
              suggestions: hybridValidation.suggestions.slice(0, 3)
            },
            framework,
            psychologicalTriggers
          }
        ],
        analysis: variants.analysis,
        recommendedVariant: hybridScore.overall >= Math.max(emotionalScore.overall, logicalScore.overall) ? 'hybrid' : 
                            emotionalScore.overall > logicalScore.overall ? 'emotional' : 'logical',
        validationSummary: {
          allPassed: emotionalValidation.passed && logicalValidation.passed && hybridValidation.passed,
          averageScore: Math.round((emotionalValidation.overallScore + logicalValidation.overallScore + hybridValidation.overallScore) / 3),
          patternsUsed: patterns.length
        }
      });
    } catch (error: any) {
      console.error("Professional copy generation error:", error);
      res.status(500).json({ message: "Failed to generate professional copy" });
    }
  });

  // Get available copywriting frameworks
  app.get("/api/copywriting/frameworks", requireAuth, async (req, res) => {
    try {
      const { COPYWRITING_FRAMEWORKS, PSYCHOLOGICAL_TRIGGERS, INDUSTRY_TEMPLATES } = await import('../shared/copywriting-frameworks');
      
      res.json({
        frameworks: COPYWRITING_FRAMEWORKS.map(f => ({
          name: f.name,
          acronym: f.acronym,
          description: f.description,
          steps: f.steps,
          bestFor: f.bestFor
        })),
        psychologicalTriggers: PSYCHOLOGICAL_TRIGGERS.map(t => ({
          name: t.name,
          description: t.description,
          examples: t.examples.slice(0, 2), // Just show first 2 examples
          whenToUse: t.whenToUse
        })),
        industries: INDUSTRY_TEMPLATES.map(i => ({
          industry: i.industry,
          toneGuidelines: i.toneGuidelines,
          keywordFocus: i.keywordFocus.slice(0, 5) // Top 5 keywords
        }))
      });
    } catch (error: any) {
      console.error("Get frameworks error:", error);
      res.status(500).json({ message: "Failed to get frameworks" });
    }
  });

  // Fast Mode Copywriting with Streaming (2-3 seconds, no multi-agent pipeline)
  app.post("/api/generate-copy-fast", requireAuth, aiLimiter, sanitizeBody, checkRateLimit, checkAIUsageLimit, async (req, res) => {
    try {
      const { 
        productName, 
        category, 
        features, 
        audience, 
        framework = 'AIDA',
        industry,
        maxWords = 150,
        stream = true
      } = req.body;
      
      const userId = (req as AuthenticatedRequest).user.id;

      if (!productName?.trim()) {
        return res.status(400).json({ message: "Product name is required" });
      }

      // Import frameworks
      const { getCopywritingFramework } = await import('../shared/copywriting-frameworks');
      const { getSystemPromptForTool } = await import('../shared/ai-system-prompts');
      
      // Get framework template
      const frameworkTemplate = getCopywritingFramework(framework);
      if (!frameworkTemplate) {
        return res.status(400).json({ message: `Invalid framework: ${framework}` });
      }

      // Build fast mode prompt (no analyzer, direct generation)
      const proModePrompt = getSystemPromptForTool('professionalCopywriting');
      const fastPrompt = `Generate compelling ${framework} copy for this product:

**Product:** ${productName}
**Category:** ${category || 'General'}
**Features:** ${features || 'High-quality product'}
**Target Audience:** ${audience || 'General consumers'}
${industry ? `**Industry:** ${industry}` : ''}

**Framework:** ${framework} (${frameworkTemplate.description})

**Requirements:**
- Maximum ${maxWords} words
- Include compelling headline
- Include strong CTA
- Use benefit-focused language
- Make it conversion-optimized

**Framework Structure:**
${frameworkTemplate.steps.join(' → ')}

Respond with JSON:
{
  "headline": "attention-grabbing headline",
  "copy": "full ${framework} formatted copy",
  "cta": "compelling call-to-action"
}`;

      // Setup streaming if requested
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
          const streamResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: proModePrompt },
              { role: "user", content: fastPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.8,
            stream: true
          });

          let fullContent = '';
          
          for await (const chunk of streamResponse) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              // Send streaming chunk to frontend
              res.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`);
            }
          }

          // Parse final result
          let result;
          try {
            result = JSON.parse(fullContent);
          } catch (e) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to parse AI response' })}\n\n`);
            res.end();
            return;
          }

          // Send final complete event FIRST - before any bookkeeping that could fail
          res.write(`data: ${JSON.stringify({ 
            type: 'complete', 
            result: {
              success: true,
              headline: result.headline,
              copy: result.copy,
              cta: result.cta,
              framework,
              wordCount: result.copy?.split(' ').length || 0,
              fastMode: true
            }
          })}\n\n`);
          
          res.end();

          // Track usage and store history AFTER completing the stream
          // Wrap in try-catch so failures don't affect the user experience
          try {
            const estimatedTokens = 500;
            await trackAIUsage(userId, estimatedTokens);

            await supabaseStorage.createAiGenerationHistory({
              userId,
              generationType: 'professional_copy_fast',
              inputData: { productName, category, features, audience, framework, industry },
              outputData: result,
              brandVoice: framework,
              tokensUsed: estimatedTokens,
              model: 'gpt-4o-mini-fast'
            });
          } catch (bookkeepingError: any) {
            // Log but don't fail - user already got their result
            console.error('Fast Mode bookkeeping error (non-critical):', bookkeepingError);
          }
        } catch (streamError: any) {
          // Ensure we always send an error event and close the stream
          console.error('Fast copy streaming error:', streamError);
          
          // Always try to send error event, even if headers were already sent
          try {
            res.write(`data: ${JSON.stringify({ type: 'error', message: streamError.message || 'Streaming failed' })}\n\n`);
          } catch (writeError) {
            console.error('Failed to write error event:', writeError);
          }
          
          if (!res.headersSent) {
            res.status(500);
          }
          res.end();
        }
      } else {
        // Non-streaming mode
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: proModePrompt },
            { role: "user", content: fastPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.8
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");

        // Track usage
        const estimatedTokens = 500;
        await trackAIUsage(userId, estimatedTokens);

        // Store in history
        await supabaseStorage.createAiGenerationHistory({
          userId,
          generationType: 'professional_copy_fast',
          inputData: { productName, category, features, audience, framework, industry },
          outputData: result,
          brandVoice: framework,
          tokensUsed: estimatedTokens,
          model: 'gpt-4o-mini-fast'
        });

        await NotificationService.notifyAIGenerationComplete(userId, 'professional copy (fast)', productName);

        res.json({
          success: true,
          headline: result.headline,
          copy: result.copy,
          cta: result.cta,
          framework,
          wordCount: result.copy?.split(' ').length || 0,
          fastMode: true
        });
      }
    } catch (error: any) {
      console.error("Fast copy generation error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Failed to generate copy" });
      }
    }
  });

  // Refine copy using Critic Agent
  app.post("/api/copywriting/refine", requireAuth, aiLimiter, sanitizeBody, checkRateLimit, checkAIUsageLimit, async (req, res) => {
    try {
      const { copy, audience, industry } = req.body;
      const userId = (req as AuthenticatedRequest).user.id;

      if (!copy?.trim()) {
        return res.status(400).json({ message: "Copy text is required" });
      }

      const { scoreACopy, refineCopyWithCritic } = await import('../shared/ai-quality-scoring');

      // First score the copy
      const initialScore = await scoreACopy(copy, audience || 'General', industry || 'General', openai);

      // Then refine it using critic agent
      const refinement = await refineCopyWithCritic(copy, initialScore, openai);

      // Score the refined version
      const finalScore = await scoreACopy(refinement.refinedCopy, audience || 'General', industry || 'General', openai);

      // Track usage
      const estimatedTokens = 800;
      await trackAIUsage(userId, estimatedTokens);

      res.json({
        success: true,
        original: {
          copy,
          score: initialScore
        },
        refined: {
          copy: refinement.refinedCopy,
          score: finalScore,
          explanation: refinement.explanation,
          expectedImpact: refinement.impact
        },
        improvement: finalScore.overall - initialScore.overall
      });
    } catch (error: any) {
      console.error("Copy refinement error:", error);
      res.status(500).json({ message: "Failed to refine copy" });
    }
  });

  // Fast Mode Copy Refinement with Streaming (2-3 seconds, direct refinement)
  app.post("/api/copywriting/refine-fast", requireAuth, aiLimiter, sanitizeBody, checkRateLimit, checkAIUsageLimit, async (req, res) => {
    try {
      const { 
        copy, 
        audience = 'General', 
        industry = 'General',
        stream = true
      } = req.body;
      
      const userId = (req as AuthenticatedRequest).user.id;

      if (!copy?.trim()) {
        return res.status(400).json({ message: "Copy text is required" });
      }

      // Import prompts
      const { getSystemPromptForTool } = await import('../shared/ai-system-prompts');
      const proModePrompt = getSystemPromptForTool('professionalCopywriting');

      // Build fast mode refinement prompt (direct, no critic agent)
      const fastPrompt = `Analyze and refine the following copy:

**Original Copy:**
${copy}

**Target Audience:** ${audience}
**Industry:** ${industry}

**Your task:**
1. Identify 3-5 key improvement areas
2. Provide a refined version with better impact
3. Explain what was improved and why
4. Estimate the expected impact on conversion

**Requirements:**
- Maintain the original message intent
- Improve clarity and persuasiveness
- Enhance emotional appeal
- Strengthen call-to-action
- Keep it concise and punchy

Respond with JSON:
{
  "refinedCopy": "your improved version here",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "explanation": "brief explanation of changes",
  "expectedImpact": "estimated improvement percentage"
}`;

      // Setup streaming if requested
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
          const streamResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: proModePrompt },
              { role: "user", content: fastPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            stream: true
          });

          let fullContent = '';
          let lastSentLength = 0;
          
          for await (const chunk of streamResponse) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              
              // Try to extract partial refinedCopy from accumulated JSON
              try {
                const refinedMatch = fullContent.match(/"refinedCopy"\s*:\s*"([^"\\]*(\\.[^"\\]*)*)"/);
                if (refinedMatch && refinedMatch[1]) {
                  const currentRefined = refinedMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                  
                  // Only send new content (delta)
                  if (currentRefined.length > lastSentLength) {
                    const delta = currentRefined.substring(lastSentLength);
                    lastSentLength = currentRefined.length;
                    
                    // Send delta as plain text in the JSON event
                    res.write(`data: ${JSON.stringify({ 
                      type: 'chunk', 
                      delta,
                      refinedCopy: currentRefined 
                    })}\n\n`);
                  }
                }
              } catch (e) {
                // Continue accumulating if we can't parse yet
              }
            }
          }

          // Parse final result
          let result;
          try {
            result = JSON.parse(fullContent);
          } catch (e) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to parse AI response' })}\n\n`);
            res.end();
            return;
          }

          // Send final complete event
          res.write(`data: ${JSON.stringify({ 
            type: 'complete', 
            original: { copy },
            refined: {
              copy: result.refinedCopy,
              improvements: result.improvements,
              explanation: result.explanation,
              expectedImpact: result.expectedImpact
            },
            wordCount: result.refinedCopy?.split(' ').length || 0,
            fastMode: true
          })}\n\n`);
          
          res.end();

          // Track usage AFTER completing the stream
          try {
            const estimatedTokens = 600;
            await trackAIUsage(userId, estimatedTokens);

            await supabaseStorage.createAiGenerationHistory({
              userId,
              generationType: 'copy_refinement_fast',
              inputData: { copy, audience, industry },
              outputData: result,
              brandVoice: 'refinement',
              tokensUsed: estimatedTokens,
              model: 'gpt-4o-mini-fast'
            });
          } catch (bookkeepingError: any) {
            console.error('Fast Mode bookkeeping error (non-critical):', bookkeepingError);
          }
        } catch (streamError: any) {
          console.error('Fast refinement streaming error:', streamError);
          
          try {
            res.write(`data: ${JSON.stringify({ type: 'error', message: streamError.message || 'Streaming failed' })}\n\n`);
          } catch (writeError) {
            console.error('Failed to write error event:', writeError);
          }
          
          if (!res.headersSent) {
            res.status(500);
          }
          res.end();
        }
      } else {
        // Non-streaming mode
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: proModePrompt },
            { role: "user", content: fastPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");

        // Track usage
        const estimatedTokens = 600;
        await trackAIUsage(userId, estimatedTokens);

        await supabaseStorage.createAiGenerationHistory({
          userId,
          generationType: 'copy_refinement_fast',
          inputData: { copy, audience, industry },
          outputData: result,
          brandVoice: 'refinement',
          tokensUsed: estimatedTokens,
          model: 'gpt-4o-mini-fast'
        });

        res.json({
          success: true,
          original: { copy },
          refined: {
            copy: result.refinedCopy,
            improvements: result.improvements,
            explanation: result.explanation,
            expectedImpact: result.expectedImpact
          },
          wordCount: result.refinedCopy?.split(' ').length || 0,
          fastMode: true
        });
      }
    } catch (error: any) {
      console.error("Fast refinement error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Failed to refine copy" });
      }
    }
  });

  // Legacy endpoint - still works for backward compatibility
  app.post("/api/generate-description", requireAuth, aiLimiter, sanitizeBody, checkRateLimit, checkAIUsageLimit, async (req, res) => {
    try {
      const { productName, category, features, audience, brandVoice, keywords, specs } = req.body;
      const userId = (req as AuthenticatedRequest).user.id;

      // Validate input
      if (!productName?.trim()) {
        return res.status(400).json({ message: "Product name is required" });
      }
      
      // Get user's brand voice preferences
      const userPrefs = await supabaseStorage.getUserPreferences(userId);
      const aiSettings = (userPrefs?.aiSettings || {}) as any;
      const savedBrandVoice = aiSettings.preferredBrandVoice;
      const customInstructions = aiSettings.customInstructions || '';
      const tonePreferences = aiSettings.tonePreferences || {};
      
      // Validate brand voice
      const availableVoices = getAvailableBrandVoices("Product Description");
      if (brandVoice && !availableVoices.includes(brandVoice)) {
        return res.status(400).json({ 
          message: `Invalid brand voice. Available options: ${availableVoices.join(', ')}` 
        });
      }

      // Prepare variables for template processing
      const templateVariables = {
        product_name: productName,
        category: category || "General",
        audience: audience || "General consumers",
        features: features || "High-quality product",
        keywords: keywords || "",
        specs: specs || ""
      };

      // Use provided brand voice, or fall back to saved preference, or default to 'sales'
      const selectedBrandVoice = brandVoice || savedBrandVoice || "sales";

      // Import Zyra Pro Mode prompts and validation
      const { getSystemPromptForTool } = await import('../shared/ai-system-prompts');
      const { validateAIContent } = await import('../shared/ai-content-validator');
      
      // Generate the dynamic prompt using pro mode + template system
      let selectedPrompt = processPromptTemplate("Product Description", selectedBrandVoice, templateVariables);
      
      // Enhance prompt with custom instructions if available
      if (customInstructions) {
        selectedPrompt += `\n\nAdditional brand guidelines: ${customInstructions}`;
      }
      
      // Add tone preferences if available
      if (Object.keys(tonePreferences).length > 0) {
        selectedPrompt += `\n\nTone preferences: ${JSON.stringify(tonePreferences)}`;
      }

      // Get Zyra Pro Mode system prompt for product descriptions
      const proModePrompt = getSystemPromptForTool('productDescriptions');

      // Get model configuration based on user's performance mode preference
      const { getModelFromUserPreferences } = await import('./lib/ai-model-selector');
      const modelConfig = await getModelFromUserPreferences(userId, 'product_description', supabaseStorage);
      
      // Using selected model with Zyra Pro Mode + AI Response Caching
      const cacheKey = `${proModePrompt}\n\n${selectedPrompt}\n\nModel:${modelConfig.model}`;
      let tokensUsed = 0;
      
      const result = await cachedTextGeneration(
        { 
          prompt: cacheKey,
          model: modelConfig.model,
          maxTokens: modelConfig.maxTokens
        },
        async () => {
          const response = await openai.chat.completions.create({
            model: modelConfig.model,
            messages: [
              { role: "system", content: proModePrompt },
              { role: "user", content: selectedPrompt }
            ],
            temperature: modelConfig.temperature,
            max_tokens: modelConfig.maxTokens,
            response_format: { type: "json_object" },
          });

          tokensUsed = response.usage?.total_tokens || 0;
          await trackAIUsage(userId, tokensUsed);
          
          return JSON.parse(response.choices[0].message.content || "{}");
        }
      );
      
      // Fetch learned patterns for validation
      const patterns = await storage.getLearningPatterns(userId, { 
        category: category || 'General',
        patternType: 'product_description'
      });
      
      // Pre-validate the generated description
      const validation = validateAIContent(
        result.description || '', 
        'product_description', 
        patterns, 
        { 
          minOverallScore: 65,
          category: category || 'General',
          targetAudience: audience
        }
      );
      
      // Store generation in AI history for learning (only if not from cache)
      if (tokensUsed > 0) {
        await supabaseStorage.createAiGenerationHistory({
          userId,
          generationType: 'product_description',
          inputData: { productName, category, features, audience, keywords, specs },
          outputData: { 
            description: result.description,
            validationScore: validation.overallScore,
            validationPassed: validation.passed
          },
          brandVoice: selectedBrandVoice,
          tokensUsed,
          model: modelConfig.model
        });
      }
      
      // Send AI generation complete notification
      await NotificationService.notifyAIGenerationComplete(userId, 'product description', productName);
      
      res.json({ 
        description: result.description, 
        brandVoiceUsed: selectedBrandVoice,
        validation: {
          passed: validation.passed,
          score: validation.overallScore,
          readability: validation.readabilityScore,
          seo: validation.seoScore,
          issues: validation.issues.filter(i => i.severity === 'critical' || i.severity === 'warning'),
          suggestions: validation.suggestions.slice(0, 3),
          patternsUsed: patterns.length
        }
      });
    } catch (error: any) {
      console.error("AI generation error:", error);
      res.status(500).json({ message: "Failed to generate description" });
    }
  });

  // Fast Mode Product Description with Streaming (2-3 seconds, single GPT-4o-mini call)
  app.post("/api/generate-description-fast", requireAuth, aiLimiter, sanitizeBody, checkRateLimit, checkAIUsageLimit, async (req, res) => {
    try {
      const { 
        productName, 
        category, 
        features, 
        audience, 
        brandVoice = 'sales',
        keywords = '',
        specs = '',
        stream = true
      } = req.body;
      
      const userId = (req as AuthenticatedRequest).user.id;

      if (!productName?.trim()) {
        return res.status(400).json({ message: "Product name is required" });
      }

      // Import prompts
      const { getSystemPromptForTool } = await import('../shared/ai-system-prompts');
      const proModePrompt = getSystemPromptForTool('productDescriptions');
      
      // Build fast mode prompt (direct generation, no validation pipeline)
      const fastPrompt = `Generate a compelling ${brandVoice} product description:

**Product:** ${productName}
**Category:** ${category || 'General'}
**Features:** ${features || 'High-quality product'}
**Target Audience:** ${audience || 'General consumers'}
${keywords ? `**Keywords:** ${keywords}` : ''}
${specs ? `**Specifications:** ${specs}` : ''}

**Brand Voice:** ${brandVoice}

**Requirements:**
- Engaging and conversion-focused
- Highlight key benefits and features
- Include relevant keywords naturally
- Professional and polished tone
- 100-150 words ideal length

Respond with JSON:
{
  "description": "your compelling product description here"
}`;

      // Setup streaming if requested
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
          const streamResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: proModePrompt },
              { role: "user", content: fastPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.8,
            stream: true
          });

          let fullContent = '';
          let lastSentLength = 0;
          
          for await (const chunk of streamResponse) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              
              // Try to extract partial description from accumulated JSON
              try {
                const partialMatch = fullContent.match(/"description"\s*:\s*"([^"\\]*(\\.[^"\\]*)*)"/);
                if (partialMatch && partialMatch[1]) {
                  const currentDescription = partialMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                  
                  // Only send new content (delta)
                  if (currentDescription.length > lastSentLength) {
                    const delta = currentDescription.substring(lastSentLength);
                    lastSentLength = currentDescription.length;
                    
                    // Send delta as plain text in the JSON event
                    res.write(`data: ${JSON.stringify({ type: 'chunk', delta, description: currentDescription })}\n\n`);
                  }
                }
              } catch (e) {
                // Continue accumulating if we can't parse yet
              }
            }
          }

          // Parse final result
          let result;
          try {
            result = JSON.parse(fullContent);
          } catch (e) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to parse AI response' })}\n\n`);
            res.end();
            return;
          }

          // Send final complete event
          res.write(`data: ${JSON.stringify({ 
            type: 'complete', 
            description: result.description,
            brandVoiceUsed: brandVoice,
            wordCount: result.description?.split(' ').length || 0,
            fastMode: true
          })}\n\n`);
          
          res.end();

          // Track usage AFTER completing the stream
          try {
            const estimatedTokens = 400;
            await trackAIUsage(userId, estimatedTokens);

            await supabaseStorage.createAiGenerationHistory({
              userId,
              generationType: 'product_description_fast',
              inputData: { productName, category, features, audience, brandVoice, keywords, specs },
              outputData: result,
              brandVoice,
              tokensUsed: estimatedTokens,
              model: 'gpt-4o-mini-fast'
            });
          } catch (bookkeepingError: any) {
            console.error('Fast Mode bookkeeping error (non-critical):', bookkeepingError);
          }
        } catch (streamError: any) {
          console.error('Fast description streaming error:', streamError);
          
          try {
            res.write(`data: ${JSON.stringify({ type: 'error', message: streamError.message || 'Streaming failed' })}\n\n`);
          } catch (writeError) {
            console.error('Failed to write error event:', writeError);
          }
          
          if (!res.headersSent) {
            res.status(500);
          }
          res.end();
        }
      } else {
        // Non-streaming mode
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: proModePrompt },
            { role: "user", content: fastPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.8
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");

        // Track usage
        const estimatedTokens = 400;
        await trackAIUsage(userId, estimatedTokens);

        await supabaseStorage.createAiGenerationHistory({
          userId,
          generationType: 'product_description_fast',
          inputData: { productName, category, features, audience, brandVoice, keywords, specs },
          outputData: result,
          brandVoice,
          tokensUsed: estimatedTokens,
          model: 'gpt-4o-mini-fast'
        });

        await NotificationService.notifyAIGenerationComplete(userId, 'product description (fast)', productName);

        res.json({
          success: true,
          description: result.description,
          brandVoiceUsed: brandVoice,
          wordCount: result.description?.split(' ').length || 0,
          fastMode: true
        });
      }
    } catch (error: any) {
      console.error("Fast description generation error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Failed to generate description" });
      }
    }
  });

  // Multi-Channel Content Repurposing - Generate content for all marketing channels
  app.post("/api/ai/multi-channel-content", requireAuth, aiLimiter, sanitizeBody, checkRateLimit, checkAIUsageLimit, async (req, res) => {
    try {
      const { productDescription } = req.body;
      const userId = (req as AuthenticatedRequest).user.id;

      if (!productDescription) {
        return res.status(400).json({ message: "Product description is required" });
      }

      const prompt = `You are an expert multi-channel marketing copywriter. Based on the following product description, generate optimized marketing content for multiple channels.

Product Description:
"${productDescription}"

Generate content in JSON format with these exact fields:
{
  "email": {
    "subject": "Compelling email subject line (under 50 characters)",
    "body": "Email body copy (2-3 paragraphs, persuasive, includes call-to-action)"
  },
  "sms": "SMS marketing message (under 160 characters, includes urgency and CTA)",
  "social": "Social media post (engaging caption with hashtags, under 280 characters)",
  "seo": "SEO meta description (under 160 characters, includes keywords)",
  "adCopy": "Google/Facebook ad copy (headline + short description, compelling and action-oriented)"
}

Important guidelines:
- Each channel should have a unique voice appropriate for that platform
- Email should be professional but engaging
- SMS should be urgent and concise
- Social should be casual and use hashtags
- SEO should be keyword-rich but natural
- Ad copy should focus on benefits and include a clear CTA`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are Zyra AI, an expert marketing copywriter specializing in multi-channel content creation for e-commerce. You create compelling, conversion-focused content tailored for each marketing channel." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8
      });

      const content = JSON.parse(response.choices[0].message.content || "{}");

      // Track usage
      const estimatedTokens = 600;
      await trackAIUsage(userId, estimatedTokens);

      await supabaseStorage.createAiGenerationHistory({
        userId,
        generationType: 'multi_channel_content',
        inputData: { productDescription },
        outputData: content,
        tokensUsed: estimatedTokens,
        model: 'gpt-4o-mini'
      });

      res.json({
        success: true,
        content
      });
    } catch (error: any) {
      console.error("Multi-channel content generation error:", error);
      res.status(500).json({ message: "Failed to generate multi-channel content" });
    }
  });

  // SEO Optimization
  app.post("/api/optimize-seo", requireAuth, aiLimiter, sanitizeBody, checkRateLimit, checkAIUsageLimit, async (req, res) => {
    try {
      const { currentTitle, keywords, currentMeta, category } = req.body;

      if (!currentTitle || !keywords) {
        return res.status(400).json({ message: "Title and keywords are required" });
      }

      // Import Zyra Pro Mode prompts and validation
      const { getSystemPromptForTool } = await import('../shared/ai-system-prompts');
      const { validateAIContent } = await import('../shared/ai-content-validator');
      const proModePrompt = getSystemPromptForTool('seoTitles');

      const prompt = `Optimize the following product for SEO:
                      Current Title: "${currentTitle}"
                      Keywords: "${keywords}"
                      Category: "${category}"
                      Current Meta: "${currentMeta}"
                      
                      Create an optimized SEO title (under 60 characters), meta description (under 160 characters), 
                      and suggest 5-7 relevant keywords. Calculate an SEO score out of 100.
                      
                      Respond with JSON in this format:
                      {
                        "optimizedTitle": "your title",
                        "optimizedMeta": "your meta description", 
                        "keywords": ["keyword1", "keyword2", "keyword3"],
                        "seoScore": 85
                      }`;

      // Using GPT-4o mini model with Zyra Pro Mode for SEO + AI Response Caching
      const userId = (req as AuthenticatedRequest).user.id;
      const cacheKey = `${proModePrompt}\n\n${prompt}`;
      
      const result = await cachedTextGeneration(
        {
          prompt: cacheKey,
          model: "gpt-4o-mini",
          maxTokens: 500
        },
        async () => {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: proModePrompt },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
          });

          // Track SEO usage (only on cache miss)
          await trackSEOUsage(userId);
          
          return JSON.parse(response.choices[0].message.content || "{}");
        }
      );
      
      // Fetch learned patterns for validation
      const patterns = await storage.getLearningPatterns(userId, { 
        category: category || 'General',
        patternType: 'seo_content'
      });
      
      // Pre-validate the generated meta description
      const metaValidation = validateAIContent(
        result.optimizedMeta || '', 
        'meta_description', 
        patterns, 
        { 
          minOverallScore: 70,
          minSEOScore: 75,
          category: category || 'General'
        }
      );
      
      // Send SEO optimization notification with performance improvement
      const improvement = `SEO Score: ${result.seoScore || 'N/A'}/100 | Validation: ${metaValidation.overallScore}/100`;
      await NotificationService.notifyPerformanceOptimizationComplete(userId, currentTitle, improvement);
      
      res.json({
        ...result,
        validation: {
          passed: metaValidation.passed,
          score: metaValidation.overallScore,
          readability: metaValidation.readabilityScore,
          seo: metaValidation.seoScore,
          issues: metaValidation.issues.filter(i => i.severity === 'critical' || i.severity === 'warning'),
          suggestions: metaValidation.suggestions.slice(0, 3),
          patternsUsed: patterns.length
        }
      });
    } catch (error: any) {
      console.error("SEO optimization error:", error);
      res.status(500).json({ message: "Failed to optimize SEO" });
    }
  });

  // Fast Mode SEO Optimization with Streaming (2-3 seconds)
  app.post("/api/optimize-seo-fast", requireAuth, aiLimiter, sanitizeBody, checkRateLimit, checkAIUsageLimit, async (req, res) => {
    try {
      const { 
        currentTitle, 
        keywords, 
        currentMeta = '', 
        category = 'General',
        stream = true
      } = req.body;

      const userId = (req as AuthenticatedRequest).user.id;

      if (!currentTitle || !keywords) {
        return res.status(400).json({ message: "Title and keywords are required" });
      }

      // Import prompts
      const { getSystemPromptForTool } = await import('../shared/ai-system-prompts');
      const proModePrompt = getSystemPromptForTool('seoTitles');

      // Build fast mode prompt (direct generation, no validation)
      const fastPrompt = `Optimize the following product for SEO:

**Current Title:** "${currentTitle}"
**Target Keywords:** "${keywords}"
**Category:** "${category}"
${currentMeta ? `**Current Meta:** "${currentMeta}"` : ''}

**Requirements:**
- SEO title under 60 characters
- Meta description under 160 characters
- Include primary keywords naturally
- 5-7 relevant keywords
- Calculate SEO score out of 100

Respond with JSON:
{
  "optimizedTitle": "your seo-optimized title",
  "optimizedMeta": "your seo-optimized meta description",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "seoScore": 85
}`;

      // Setup streaming if requested
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
          const streamResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: proModePrompt },
              { role: "user", content: fastPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            stream: true
          });

          let fullContent = '';
          let lastSent = { title: '', meta: '' };
          
          for await (const chunk of streamResponse) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              
              // Try to extract partial fields from accumulated JSON
              try {
                const titleMatch = fullContent.match(/"optimizedTitle"\s*:\s*"([^"\\]*(\\.[^"\\]*)*)"/);
                const metaMatch = fullContent.match(/"optimizedMeta"\s*:\s*"([^"\\]*(\\.[^"\\]*)*)"/);
                
                const currentTitle = titleMatch ? titleMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '';
                const currentMeta = metaMatch ? metaMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '';
                
                // Send deltas for any new content
                if (currentTitle !== lastSent.title || currentMeta !== lastSent.meta) {
                  const titleDelta = currentTitle.substring(lastSent.title.length);
                  const metaDelta = currentMeta.substring(lastSent.meta.length);
                  
                  lastSent = { title: currentTitle, meta: currentMeta };
                  
                  res.write(`data: ${JSON.stringify({ 
                    type: 'chunk', 
                    titleDelta,
                    metaDelta,
                    optimizedTitle: currentTitle,
                    optimizedMeta: currentMeta
                  })}\n\n`);
                }
              } catch (e) {
                // Continue accumulating if we can't parse yet
              }
            }
          }

          // Parse final result
          let result;
          try {
            result = JSON.parse(fullContent);
          } catch (e) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to parse AI response' })}\n\n`);
            res.end();
            return;
          }

          // Send final complete event
          res.write(`data: ${JSON.stringify({ 
            type: 'complete', 
            optimizedTitle: result.optimizedTitle,
            optimizedMeta: result.optimizedMeta,
            keywords: result.keywords,
            seoScore: result.seoScore,
            titleLength: result.optimizedTitle?.length || 0,
            metaLength: result.optimizedMeta?.length || 0,
            fastMode: true
          })}\n\n`);
          
          res.end();

          // Track usage AFTER completing the stream
          try {
            await trackSEOUsage(userId);

            await supabaseStorage.createAiGenerationHistory({
              userId,
              generationType: 'seo_optimization_fast',
              inputData: { currentTitle, keywords, currentMeta, category },
              outputData: result,
              brandVoice: 'seo',
              tokensUsed: 300,
              model: 'gpt-4o-mini-fast'
            });
          } catch (bookkeepingError: any) {
            console.error('Fast Mode bookkeeping error (non-critical):', bookkeepingError);
          }
        } catch (streamError: any) {
          console.error('Fast SEO streaming error:', streamError);
          
          try {
            res.write(`data: ${JSON.stringify({ type: 'error', message: streamError.message || 'Streaming failed' })}\n\n`);
          } catch (writeError) {
            console.error('Failed to write error event:', writeError);
          }
          
          if (!res.headersSent) {
            res.status(500);
          }
          res.end();
        }
      } else {
        // Non-streaming mode
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: proModePrompt },
            { role: "user", content: fastPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");

        // Track usage
        await trackSEOUsage(userId);

        await supabaseStorage.createAiGenerationHistory({
          userId,
          generationType: 'seo_optimization_fast',
          inputData: { currentTitle, keywords, currentMeta, category },
          outputData: result,
          brandVoice: 'seo',
          tokensUsed: 300,
          model: 'gpt-4o-mini-fast'
        });

        await NotificationService.notifyPerformanceOptimizationComplete(userId, currentTitle, `SEO Score: ${result.seoScore}/100`);

        res.json({
          success: true,
          optimizedTitle: result.optimizedTitle,
          optimizedMeta: result.optimizedMeta,
          keywords: result.keywords,
          seoScore: result.seoScore,
          titleLength: result.optimizedTitle?.length || 0,
          metaLength: result.optimizedMeta?.length || 0,
          fastMode: true
        });
      }
    } catch (error: any) {
      console.error("Fast SEO optimization error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Failed to optimize SEO" });
      }
    }
  });

  // Ultimate Product SEO Engine - USING REAL WAVE 1 ORCHESTRATION SERVICE! 🚀
  app.post("/api/generate-product-seo", requireAuth, aiLimiter, sanitizeBody, checkRateLimit, checkAIUsageLimit, async (req, res) => {
    try {
      const { productName, keyFeatures, targetAudience, category, price } = req.body;

      if (!productName) {
        return res.status(400).json({ message: "Product name is required" });
      }

      const userId = (req as AuthenticatedRequest).user.id;

      console.log('[Product SEO Engine] Using Wave 1 Orchestration Service for:', productName);

      // 🎯 WAVE 1: Use the real orchestration service
      const { orchestrateSEOGeneration } = await import('./lib/seo-orchestration-service');

      // Generate SEO with full Wave 1 orchestration
      const result = await orchestrateSEOGeneration({
        userId,
        productName,
        keyFeatures: keyFeatures || 'Premium quality product',
        category,
        price: price ? parseFloat(price) : undefined,
        targetAudience,
        options: {
          enableFrameworkAutoSelection: true,
          enableBrandDNA: true,
          enableSERPAnalysis: false,
          shopifyFormatting: true,
        },
      }, openai, db);

      // Track SEO usage
      await trackSEOUsage(userId);

      // Save to generation history
      await supabaseStorage.createAiGenerationHistory({
        userId,
        generationType: 'unified_product_seo',
        inputData: { productName, keyFeatures, targetAudience, category },
        outputData: result,
        brandVoice: result.recommendedFramework?.name || 'auto',
        tokensUsed: 800, // Estimated
        model: (result as any).aiModel || 'gpt-4o-mini'
      });

      // Send notification
      await NotificationService.notifyPerformanceOptimizationComplete(
        userId,
        productName,
        `SEO Score: ${result.seoScore}/100 | Framework: ${result.recommendedFramework?.name || 'auto'}`
      );

      // Return the Wave 1 output (matching the UI's expected format)
      res.json({
        seoTitle: result.seoTitle,
        seoDescription: result.seoDescription,
        metaTitle: result.metaTitle,
        metaDescription: result.metaDescription,
        keywords: result.keywords,
        seoScore: result.seoScore,
        searchIntent: result.searchIntent,
        suggestedKeywords: result.suggestedKeywords,
        frameworkUsed: result.recommendedFramework?.name,
        brandVoiceMatchScore: (result as any).brandVoiceMatchScore,
        conversionScore: (result as any).conversionScore,
      });
    } catch (error: any) {
      console.error("[Product SEO Engine] Error:", error);
      res.status(500).json({ 
        message: "Failed to generate product SEO",
        error: error.message 
      });
    }
  });

  // =============================================================================
  // WAVE 1: UNIFIED SEO ENGINE WITH ADVANCED FEATURES
  // =============================================================================

  // Main Wave 1 SEO Generation - Unified engine with all advanced features
  app.post("/api/seo/generate", requireAuth, aiLimiter, sanitizeBody, checkRateLimit, checkAIUsageLimit, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const {
        productName,
        productDescription,
        category,
        price,
        tags,
        currentKeywords,
        targetAudience,
        uniqueSellingPoints,
        // Wave 1 features
        autoDetectFramework = true,
        frameworkId,
        enableBrandDNA = true,
        enableSerpPatterns = false,
        shopifyHtmlFormatting = true,
        preferredModel,
        creativityLevel,
      } = req.body;

      if (!productName) {
        return res.status(400).json({ message: "Product name is required" });
      }

      // Import orchestration service
      const { generateWithOrchestration } = await import('./lib/seo-orchestration-service');

      // Generate SEO with full orchestration
      const result = await generateWithOrchestration({
        userId,
        productInput: {
          productName,
          productDescription,
          category,
          price,
          tags,
          currentKeywords,
          targetAudience,
          uniqueSellingPoints,
        },
        options: {
          autoDetectFramework,
          frameworkId,
          enableBrandDNA,
          enableSerpPatterns,
          shopifyHtmlFormatting,
          preferredModel,
          creativityLevel,
        },
        openaiClient: openai,
        db,
      });

      // Track SEO usage
      await trackSEOUsage(userId);

      // Save to generation history
      await supabaseStorage.createAiGenerationHistory({
        userId,
        generationType: 'wave1_unified_seo',
        inputData: { productName, category, frameworkUsed: result.frameworkUsed },
        outputData: result.seoOutput,
        brandVoice: result.frameworkUsed || 'auto',
        tokensUsed: 800, // Estimated
        model: result.seoOutput.aiModel || 'gpt-4o-mini'
      });

      // Send notification
      await NotificationService.notifyPerformanceOptimizationComplete(
        userId,
        productName,
        `SEO Score: ${result.seoOutput.seoScore}/100 | Framework: ${result.frameworkUsed}`
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error("[Wave1 API] SEO generation error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to generate SEO content",
        error: error.message 
      });
    }
  });

  // =============================================================================
  // SERP COMPETITIVE INTELLIGENCE API
  // =============================================================================

  // Analyze Google SERP for real-time competitor intelligence
  app.post("/api/serp/analyze", requireAuth, aiLimiter, sanitizeBody, checkRateLimit, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { keyword, location = 'United States' } = req.body;

      if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
        return res.status(400).json({ 
          message: "Keyword is required for SERP analysis" 
        });
      }

      // Check SERP credit cost (10 credits per analysis)
      const SERP_CREDIT_COST = 10;
      
      // Get user's current credits (from subscription plan)
      const userProfile = await supabaseStorage.getUser(userId);
      if (!userProfile) {
        return res.status(404).json({ message: "User not found" });
      }

      // Import SERP analyzer
      const { analyzeSERP, getSERPCost } = await import('./services/serp-analyzer');

      console.log(`[SERP API] Starting analysis for "${keyword}" (location: ${location})`);

      // Perform SERP analysis
      const analysis = await analyzeSERP(keyword.trim(), location);

      // Calculate actual API cost
      const apiCost = getSERPCost();

      console.log(`[SERP API] Analysis complete:`, {
        keyword,
        topResults: analysis.topResults.length,
        cached: !!analysis.cachedAt,
        apiCost: analysis.cachedAt ? '$0.00 (cached)' : `$${apiCost.perSearch.toFixed(4)}`,
      });

      // Track usage for value dashboard
      // In a real implementation, you would deduct credits here
      // For now, we'll just log the usage

      res.json({
        success: true,
        analysis,
        credits: {
          cost: SERP_CREDIT_COST,
          remaining: 1000, // TODO: Calculate actual remaining credits
        },
        apiCost: analysis.cachedAt ? 0 : apiCost.perSearch,
        cached: !!analysis.cachedAt,
      });
    } catch (error: any) {
      console.error("[SERP API] Analysis error:", error);
      
      // Handle specific errors
      if (error.message.includes('credentials not configured')) {
        return res.status(503).json({
          success: false,
          message: "SERP analysis service temporarily unavailable",
          error: "Service configuration pending",
        });
      }

      res.status(500).json({ 
        success: false,
        message: "Failed to analyze SERP data",
        error: error.message 
      });
    }
  });

  // Get SERP analysis health status
  app.get("/api/serp/health", requireAuth, async (req, res) => {
    try {
      const { checkSERPHealth } = await import('./services/serp-analyzer');
      const health = await checkSERPHealth();
      
      res.json({
        success: true,
        ...health,
      });
    } catch (error: any) {
      res.json({
        success: false,
        available: false,
        message: error.message,
      });
    }
  });

  // Train Brand DNA from sample content
  app.post("/api/brand-dna/train", requireAuth, aiLimiter, sanitizeBody, checkRateLimit, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { sampleTexts } = req.body;

      if (!sampleTexts || !Array.isArray(sampleTexts) || sampleTexts.length === 0) {
        return res.status(400).json({ 
          message: "At least one sample text is required for training" 
        });
      }

      if (sampleTexts.length > 10) {
        return res.status(400).json({ 
          message: "Maximum 10 sample texts allowed per training session" 
        });
      }

      // Import orchestration service
      const { trainBrandDNAIfNeeded } = await import('./lib/seo-orchestration-service');

      // Train brand DNA
      const brandDNA = await trainBrandDNAIfNeeded(userId, sampleTexts, openai, db);

      res.json({
        success: true,
        brandDNA: {
          writingStyle: brandDNA.writingStyle,
          toneDensity: brandDNA.toneDensity,
          avgSentenceLength: brandDNA.avgSentenceLength,
          formalityScore: brandDNA.formalityScore,
          emojiFrequency: brandDNA.emojiFrequency,
          ctaStyle: brandDNA.ctaStyle,
          brandPersonality: brandDNA.brandPersonality,
          confidenceScore: brandDNA.confidenceScore,
          keyPhrases: brandDNA.keyPhrases.slice(0, 5), // Top 5 only
          powerWords: brandDNA.powerWords?.slice(0, 5), // Top 5 only
        },
        message: "Brand DNA trained successfully",
      });
    } catch (error: any) {
      console.error("[Wave1 API] Brand DNA training error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to train brand DNA",
        error: error.message 
      });
    }
  });

  // Get Brand DNA profile
  app.get("/api/brand-dna/profile", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { getBrandDNAProfile } = await import('./services/wave1-persistence');
      
      const brandDNA = await getBrandDNAProfile(userId);
      
      if (!brandDNA) {
        return res.json({
          success: true,
          hasBrandDNA: false,
          message: "No brand DNA profile found. Train one to personalize your SEO content.",
        });
      }

      res.json({
        success: true,
        hasBrandDNA: true,
        brandDNA: {
          writingStyle: brandDNA.writingStyle,
          toneDensity: brandDNA.toneDensity,
          avgSentenceLength: brandDNA.avgSentenceLength,
          formalityScore: brandDNA.formalityScore,
          emojiFrequency: brandDNA.emojiFrequency,
          ctaStyle: brandDNA.ctaStyle,
          brandPersonality: brandDNA.brandPersonality,
          confidenceScore: brandDNA.confidenceScore,
        },
      });
    } catch (error: any) {
      console.error("[Wave1 API] Get brand DNA error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch brand DNA profile" 
      });
    }
  });

  // Get marketing framework recommendations
  app.post("/api/templates/recommend", requireAuth, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const {
        productName,
        productDescription,
        category,
        price,
        tags,
        targetAudience,
      } = req.body;

      if (!productName) {
        return res.status(400).json({ message: "Product name is required" });
      }

      // Import orchestration service
      const { getFrameworkRecommendation } = await import('./lib/seo-orchestration-service');

      const recommendation = await getFrameworkRecommendation(
        {
          productName,
          productDescription,
          category,
          price,
          tags,
          targetAudience,
        },
        userId,
        db
      );

      res.json({
        success: true,
        recommendation: {
          primary: {
            id: recommendation.primaryFramework.id,
            name: recommendation.primaryFramework.name,
            description: recommendation.primaryFramework.description,
            bestFor: recommendation.primaryFramework.bestFor,
            confidence: recommendation.confidence,
            reason: recommendation.reason,
          },
          alternatives: recommendation.alternatives.map(alt => ({
            id: alt.framework.id,
            name: alt.framework.name,
            description: alt.framework.description,
            confidence: alt.confidence,
            reason: alt.reason,
          })),
        },
      });
    } catch (error: any) {
      console.error("[Wave1 API] Template recommendation error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to get template recommendations" 
      });
    }
  });

  // Get framework usage statistics
  app.get("/api/templates/stats", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { getFrameworkStats } = await import('./services/wave1-persistence');
      
      const stats = await getFrameworkStats(userId);

      res.json({
        success: true,
        stats,
      });
    } catch (error: any) {
      console.error("[Wave1 API] Framework stats error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch framework statistics" 
      });
    }
  });

  // =============================================================================
  // WAVE 2: A/B TESTING & ADVANCED FEATURES
  // =============================================================================

  // Generate A/B test variants for SEO content
  app.post("/api/ab-test/create", requireAuth, aiLimiter, sanitizeBody, checkRateLimit, checkAIUsageLimit, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const {
        productName,
        productDescription,
        category,
        price,
        tags,
        targetAudience,
        numVariants = 3,
        focusMetric = 'balanced',
        frameworkIds,
      } = req.body;

      if (!productName) {
        return res.status(400).json({ message: "Product name is required" });
      }

      if (numVariants < 2 || numVariants > 4) {
        return res.status(400).json({ message: "Number of variants must be between 2 and 4" });
      }

      // Import A/B testing service
      const { generateABTestVariants } = await import('./lib/ab-testing-service');

      // Generate variants
      const results = await generateABTestVariants(
        {
          productInput: {
            productName,
            productDescription,
            category,
            price,
            tags,
            targetAudience,
          },
          numVariants,
          focusMetric,
          frameworkIds,
        },
        openai
      );

      // Track AI usage
      await trackSEOUsage(userId);

      // Save to generation history
      await supabaseStorage.createAiGenerationHistory({
        userId,
        generationType: 'ab_test_variants',
        inputData: { productName, category, numVariants, focusMetric },
        outputData: { testId: results.testId, variantCount: results.variants.length },
        brandVoice: 'multiple',
        tokensUsed: numVariants * 600, // Estimated
        model: 'gpt-4o-mini'
      });

      res.json({
        success: true,
        ...results,
      });
    } catch (error: any) {
      console.error("[Wave2 API] A/B test generation error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to generate A/B test variants",
        error: error.message 
      });
    }
  });

  // Calculate A/B test winner from performance data
  app.post("/api/ab-test/results", requireAuth, sanitizeBody, async (req, res) => {
    try {
      const { performances, minimumSampleSize = 100 } = req.body;

      if (!performances || !Array.isArray(performances)) {
        return res.status(400).json({ message: "Performance data is required" });
      }

      // Import A/B testing service
      const { calculateABTestWinner } = await import('./lib/ab-testing-service');

      const winner = calculateABTestWinner(performances, minimumSampleSize);

      if (!winner) {
        return res.json({
          success: true,
          hasWinner: false,
          message: "Not enough data to determine a winner. Continue running the test.",
        });
      }

      res.json({
        success: true,
        hasWinner: true,
        winner,
      });
    } catch (error: any) {
      console.error("[Wave2 API] A/B test results error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to calculate A/B test results" 
      });
    }
  });

  // =============================================================================
  // END WAVE 1 + WAVE 2 API ENDPOINTS
  // =============================================================================

  // Save Product SEO to History
  app.post("/api/save-product-seo", requireAuth, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Validate the request body using Zod schema
      const validation = insertProductSeoHistorySchema.safeParse({
        ...req.body,
        userId
      });

      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: validation.error.errors 
        });
      }

      const saved = await storage.saveProductSEOHistory(validation.data);

      res.json({ success: true, message: "SEO content saved to history", data: saved });
    } catch (error: any) {
      console.error("Save product SEO error:", error);
      res.status(500).json({ message: "Failed to save SEO content", error: error.message });
    }
  });

  // Get Product SEO History
  app.get("/api/product-seo-history", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const history = await storage.getProductSEOHistory(userId);
      res.json(history);
    } catch (error: any) {
      console.error("Get product SEO history error:", error);
      res.status(500).json({ message: "Failed to fetch SEO history" });
    }
  });

  // =============================================================================
  // SEO HEALTH DASHBOARD & GOOGLE RANKING APIs
  // =============================================================================

  // Get Store SEO Health Score
  app.get("/api/seo-health/score", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { SEOHealthService } = await import('./lib/seo-health-service');
      const score = await SEOHealthService.getStoreHealthScore(userId);
      res.json(score);
    } catch (error: any) {
      console.error("Get SEO health score error:", error);
      res.status(500).json({ message: "Failed to get SEO health score" });
    }
  });

  // Get SEO Issues
  app.get("/api/seo-health/issues", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { SEOHealthService } = await import('./lib/seo-health-service');
      const issues = await SEOHealthService.getSEOIssues(userId);
      res.json(issues);
    } catch (error: any) {
      console.error("Get SEO issues error:", error);
      res.status(500).json({ message: "Failed to get SEO issues" });
    }
  });

  // Audit All Products
  app.get("/api/seo-health/audit", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { SEOHealthService } = await import('./lib/seo-health-service');
      const audits = await SEOHealthService.auditAllProducts(userId);
      res.json(audits);
    } catch (error: any) {
      console.error("SEO audit error:", error);
      res.status(500).json({ message: "Failed to audit products" });
    }
  });

  // Audit Single Product
  app.get("/api/seo-health/audit/:productId", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { productId } = req.params;
      const { SEOHealthService } = await import('./lib/seo-health-service');
      const audit = await SEOHealthService.auditSingleProduct(userId, productId);
      if (!audit) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(audit);
    } catch (error: any) {
      console.error("Single product audit error:", error);
      res.status(500).json({ message: "Failed to audit product" });
    }
  });

  // Get Keyword Rankings
  app.get("/api/seo-health/keywords", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { SEOHealthService } = await import('./lib/seo-health-service');
      const rankings = await SEOHealthService.getKeywordRankings(userId);
      res.json(rankings);
    } catch (error: any) {
      console.error("Get keyword rankings error:", error);
      res.status(500).json({ message: "Failed to get keyword rankings" });
    }
  });

  // Get Schema Markups
  app.get("/api/seo-health/schema", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { SEOHealthService } = await import('./lib/seo-health-service');
      const schemas = await SEOHealthService.getSchemaMarkups(userId);
      res.json(schemas);
    } catch (error: any) {
      console.error("Get schema markups error:", error);
      res.status(500).json({ message: "Failed to get schema markups" });
    }
  });

  // Get SEO Recommendations
  app.get("/api/seo-health/recommendations", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { SEOHealthService } = await import('./lib/seo-health-service');
      const recommendations = await SEOHealthService.getSEORecommendations(userId);
      res.json(recommendations);
    } catch (error: any) {
      console.error("Get SEO recommendations error:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // =============================================================================
  // END SEO HEALTH DASHBOARD APIs
  // =============================================================================

  // Image Alt-Text Generation
  app.post("/api/generate-alt-text", requireAuth, checkRateLimit, checkAIUsageLimit, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const { additionalTags } = req.body;
      
      // Import Zyra Pro Mode prompts
      const { getSystemPromptForTool } = await import('../shared/ai-system-prompts');
      const proModePrompt = getSystemPromptForTool('imageAltText');
      
      // Convert image buffer to base64
      const base64Image = req.file.buffer.toString('base64');
      const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;
      
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Use OpenAI Vision API with Zyra Pro Mode + AI Response Caching
      const promptText = `Analyze this product image and generate:
1. SEO-optimized alt-text (concise, descriptive, keyword-rich)
2. Detailed accessibility description for screen readers
3. 5-7 relevant SEO keywords
4. Image dimensions analysis

${additionalTags ? `Additional context/tags: ${additionalTags}` : ''}

Respond with JSON in this exact format:
{
  "altText": "your seo-optimized alt text here",
  "accessibility": "detailed screen reader friendly description",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "imageAnalysis": "brief analysis of what the image shows"
}`;

      const result = await cachedVisionAnalysis(
        {
          prompt: promptText,
          imageUrl: imageUrl,
          model: "gpt-4o-mini",
          maxTokens: 1000
        },
        async () => {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: proModePrompt
              },
              {
                role: "user",
                content: [
                  { 
                    type: "text", 
                    text: promptText 
                  },
                  {
                    type: "image_url",
                    image_url: { url: imageUrl }
                  }
                ]
              }
            ],
            response_format: { type: "json_object" },
            max_tokens: 1000
          });

          // Track usage and tokens (only on cache miss)
          const tokensUsed = response.usage?.total_tokens || 0;
          await trackAIUsage(userId, tokensUsed);
          
          return JSON.parse(response.choices[0].message.content || "{}");
        }
      );
      
      // Get image dimensions
      const dimensions = `${req.file.size > 0 ? Math.round(req.file.size / 1024) : 0} KB`;
      
      res.json({
        fileName: req.file.originalname,
        altText: result.altText || "Product image",
        seoKeywords: result.seoKeywords || [],
        accessibility: result.accessibility || result.altText || "Product image",
        fileSize: dimensions,
        dimensions: "Analysis complete" // We don't have actual pixel dimensions from buffer
      });
    } catch (error: any) {
      console.error("Alt-text generation error:", error);
      res.status(500).json({ message: "Failed to generate alt-text" });
    }
  });

  // Strategy AI - Deep Insights & Campaign Strategy (GPT-4o)
  app.post("/api/strategy-insights", requireAuth, aiLimiter, sanitizeBody, checkRateLimit, checkAIUsageLimit, async (req, res) => {
    try {
      const { 
        brandOverview, 
        analyticsData, 
        targetAudience, 
        goal,
        includeCompetitorAnalysis = false 
      } = req.body;

      const userId = (req as AuthenticatedRequest).user.id;

      if (!brandOverview?.trim() || !goal?.trim()) {
        return res.status(400).json({ message: "Brand overview and goal are required" });
      }

      // Import AI model selector and strategy prompt
      const { getModelForTask } = await import('./lib/ai-model-selector');
      const { AI_TOOL_PROMPTS } = await import('../shared/ai-system-prompts');
      
      const modelConfig = getModelForTask('strategy_insights');
      const strategyPrompt = AI_TOOL_PROMPTS.strategyAI;

      // Build user prompt with all context
      const userPrompt = `Generate deep insights and strategies for this Shopify store.

Brand Overview: ${brandOverview}

Recent Performance Data: ${analyticsData || 'No specific analytics provided - use general best practices'}

Target Audience: ${targetAudience || 'General e-commerce customers'}

Goal: ${goal}

${includeCompetitorAnalysis ? '\nInclude competitive analysis and differentiation strategies.' : ''}

Deliver:
1. Detailed performance insights and missed opportunities.
2. Advanced campaign strategy (email, SMS, ads, SEO).
3. 3 high-converting long-form brand copies for the next campaign (emotional, logical, hybrid variants).
4. Clear next steps to execute (0-7 days, 1-3 months, 3-6 months).

Output format: Markdown with clear section headings.`;

      // Using GPT-4o with Strategy AI prompt
      const response = await openai.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: "system", content: strategyPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
      });

      const strategyContent = response.choices[0].message.content || "";
      
      // Track token usage (GPT-4o is more expensive)
      const tokensUsed = response.usage?.total_tokens || 0;
      await trackAIUsage(userId, tokensUsed);
      
      // Store strategy generation in history
      await supabaseStorage.createAiGenerationHistory({
        userId,
        generationType: 'strategy_insights_gpt4o',
        inputData: { brandOverview, analyticsData, targetAudience, goal },
        outputData: { strategyContent, model: modelConfig.model, tokensUsed },
        tokensUsed
      });
      
      res.json({
        strategy: strategyContent,
        model: modelConfig.model,
        tokensUsed,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Strategy AI error:", error);
      res.status(500).json({ message: "Failed to generate strategy insights" });
    }
  });

  // Brand Voice Preferences
  app.get("/api/brand-voice/preferences", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const userPrefs = await supabaseStorage.getUserPreferences(userId);
      const aiSettings = (userPrefs?.aiSettings || {}) as any;
      
      res.json({
        preferredBrandVoice: aiSettings.preferredBrandVoice || 'sales',
        customInstructions: aiSettings.customInstructions || '',
        tonePreferences: aiSettings.tonePreferences || {},
        learningEnabled: aiSettings.learningEnabled !== false
      });
    } catch (error: any) {
      console.error("Get brand voice preferences error:", error);
      res.status(500).json({ message: "Failed to get brand voice preferences" });
    }
  });

  app.post("/api/brand-voice/preferences", requireAuth, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { preferredBrandVoice, customInstructions, tonePreferences, learningEnabled } = req.body;
      
      const existingPrefs = await supabaseStorage.getUserPreferences(userId);
      const currentAiSettings = (existingPrefs?.aiSettings || {}) as any;
      
      const updatedAiSettings = {
        ...currentAiSettings,
        preferredBrandVoice,
        customInstructions,
        tonePreferences,
        learningEnabled
      };

      if (existingPrefs) {
        await supabaseStorage.updateUserPreferences(userId, {
          aiSettings: updatedAiSettings
        });
      } else {
        await supabaseStorage.createUserPreferences({
          userId,
          aiSettings: updatedAiSettings
        });
      }

      res.json({ 
        success: true, 
        message: "Brand voice preferences saved successfully",
        preferences: updatedAiSettings
      });
    } catch (error: any) {
      console.error("Save brand voice preferences error:", error);
      res.status(500).json({ message: "Failed to save brand voice preferences" });
    }
  });

  // Learn from user edits to improve brand voice
  app.post("/api/brand-voice/learn", requireAuth, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { originalContent, editedContent, contentType } = req.body;
      
      // Check if learning is enabled
      const userPrefs = await supabaseStorage.getUserPreferences(userId);
      const aiSettings = (userPrefs?.aiSettings || {}) as any;
      if (aiSettings.learningEnabled === false) {
        return res.json({ success: true, message: "Learning is disabled" });
      }

      // Store the edit pattern in AI generation history for future reference
      await supabaseStorage.createAiGenerationHistory({
        userId,
        generationType: `${contentType}_learning`,
        inputData: { originalContent },
        outputData: { editedContent, learningData: true },
        brandVoice: aiSettings.preferredBrandVoice || 'custom',
        tokensUsed: 0,
        model: 'user_edit'
      });

      res.json({ success: true, message: "Learning data saved" });
    } catch (error: any) {
      console.error("Brand voice learning error:", error);
      res.status(500).json({ message: "Failed to save learning data" });
    }
  });

  // Bulk Product Optimization (special rate limit for bulk operations)
  app.post("/api/products/bulk-optimize", requireAuth, checkRateLimit, checkAIUsageLimit, upload.single('csv'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file provided" });
      }

      const userId = (req as AuthenticatedRequest).user.id;
      const results: any[] = [];
      const errors: any[] = [];

      // Parse CSV
      const csvData: any[] = [];
      const stream = require('stream');
      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer);

      await new Promise((resolve, reject) => {
        bufferStream
          .pipe(csvParser())
          .on('data', (row: any) => csvData.push(row))
          .on('end', resolve)
          .on('error', reject);
      });

      if (csvData.length === 0) {
        return res.status(400).json({ message: "CSV file is empty" });
      }

      // Check if bulk operation would exceed usage limits
      const stats = await supabaseStorage.getUserUsageStats(userId);
      const currentUsage = stats?.aiGenerationsUsed || 0;
      const userPlan = (req as AuthenticatedRequest).user.plan;
      
      // Calculate estimated usage (1 generation per product for description + SEO)
      const estimatedUsage = csvData.length * 2;
      
      // Simple plan limits check
      const planLimits: Record<string, number> = {
        'trial': 10,
        'Starter': 50,
        'Growth': 1000,
        'Pro': -1 // unlimited
      };
      
      const limit = planLimits[userPlan] || 10;
      if (limit !== -1 && (currentUsage + estimatedUsage) > limit) {
        return res.status(403).json({ 
          message: `Bulk operation would exceed your plan limit. Current usage: ${currentUsage}, Estimated: ${estimatedUsage}, Limit: ${limit}`,
          upgradeRequired: true 
        });
      }

      // Process each product
      for (const row of csvData) {
        try {
          const productName = row.product_name || row.name || row.title;
          if (!productName) {
            errors.push({ row, error: 'Missing product name' });
            continue;
          }

          const category = row.category || 'General';
          const features = row.features || row.current_description || '';
          const audience = row.target_audience || row.audience || 'General consumers';

          // Generate optimized description
          const templateVariables = {
            product_name: productName,
            category,
            audience,
            features,
            keywords: row.keywords || '',
            specs: row.specs || ''
          };

          const selectedPrompt = processPromptTemplate("Product Description", "seo", templateVariables);

          const descResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: selectedPrompt }],
            response_format: { type: "json_object" },
          });

          const descResult = JSON.parse(descResponse.choices[0].message.content || "{}");

          // Generate SEO optimization
          const seoPrompt = `Optimize this product for SEO:
            Title: "${productName}"
            Category: "${category}"
            Description: "${descResult.description || features}"
            
            Create an optimized SEO title (under 60 characters) and meta description (under 160 characters).
            Respond with JSON: { "seoTitle": "...", "metaDescription": "..." }`;

          const seoResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: seoPrompt }],
            response_format: { type: "json_object" },
          });

          const seoResult = JSON.parse(seoResponse.choices[0].message.content || "{}");

          results.push({
            ...row,
            optimized_description: descResult.description,
            seo_title: seoResult.seoTitle,
            meta_description: seoResult.metaDescription
          });

          // Track usage for each product
          await trackAIUsage(userId, (descResponse.usage?.total_tokens || 0) + (seoResponse.usage?.total_tokens || 0));

        } catch (error: any) {
          errors.push({ row, error: error.message });
        }
      }

      res.json({
        success: true,
        totalProducts: csvData.length,
        optimized: results.length,
        errors: errors.length,
        results,
        errorDetails: errors
      });

    } catch (error: any) {
      console.error("Bulk optimization error:", error);
      res.status(500).json({ message: "Failed to process bulk optimization" });
    }
  });

  // Products CRUD
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await supabaseStorage.getProducts((req as AuthenticatedRequest).user.id);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", requireAuth, sanitizeBody, async (req, res) => {
    try {
      // Validate the request body using the insertProductSchema
      const validation = insertProductSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: validation.error.errors 
        });
      }
      
      const productData = { ...validation.data, userId: (req as AuthenticatedRequest).user.id };
      const product = await supabaseStorage.createProduct(productData);
      res.json(product);
    } catch (error: any) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Product History endpoints (must be before /:id routes to avoid "history" being treated as an ID)
  app.get("/api/products/history", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const history = await supabaseStorage.getProductHistory(userId);
      res.json(history);
    } catch (error: any) {
      console.error("Get product history error:", error);
      res.status(500).json({ message: "Failed to fetch product history" });
    }
  });

  app.post("/api/products/history/rollback/:id", requireAuth, apiLimiter, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const historyId = req.params.id;

      // Verify the history entry belongs to the user
      const history = await supabaseStorage.getProductHistory(userId);
      const historyEntry = history.find(h => h.id === historyId);
      
      if (!historyEntry) {
        return res.status(404).json({ message: "History entry not found" });
      }

      if (!historyEntry.canRollback) {
        return res.status(400).json({ message: "This change cannot be rolled back" });
      }

      await supabaseStorage.rollbackProductChange(historyId);
      
      res.json({ 
        message: "Product successfully rolled back to previous version",
        productName: historyEntry.productName
      });
    } catch (error: any) {
      console.error("Rollback product error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to rollback product changes" 
      });
    }
  });

  app.get("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const product = await supabaseStorage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      // Check if the product belongs to the authenticated user
      if (product.userId !== (req as AuthenticatedRequest).user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      res.json(product);
    } catch (error: any) {
      console.error("Get product error:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.patch("/api/products/:id", requireAuth, sanitizeBody, async (req, res) => {
    try {
      // Validate partial update data
      const validation = insertProductSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: validation.error.errors 
        });
      }

      // Check if the product exists and belongs to the user
      const existingProduct = await supabaseStorage.getProduct(req.params.id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (existingProduct.userId !== (req as AuthenticatedRequest).user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const product = await supabaseStorage.updateProduct(req.params.id, validation.data);
      res.json(product);
    } catch (error: any) {
      console.error("Update product error:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Apply AI-generated content to a product
  app.post("/api/products/:id/apply-content", requireAuth, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const productId = req.params.id;
      const { optimizedCopy, optimizedDescription, seoTitle, seoMetaDescription } = req.body;

      // Check if the product exists and belongs to the user
      const existingProduct = await supabaseStorage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (existingProduct.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Backup original content if not already backed up
      const updates: any = {};
      
      if (optimizedDescription && !existingProduct.originalDescription) {
        updates.originalDescription = existingProduct.description;
      }
      if (optimizedCopy && !existingProduct.originalCopy) {
        updates.originalCopy = existingProduct.optimizedCopy || null;
      }

      // Record baseline metrics before optimization
      const { recordProductOptimizationForProduct } = await import('./lib/record-product-optimization');
      await recordProductOptimizationForProduct(userId, existingProduct);

      // Apply optimized content
      if (optimizedDescription) {
        updates.description = optimizedDescription;
      }
      if (optimizedCopy) {
        updates.optimizedCopy = optimizedCopy;
      }
      updates.isOptimized = true;
      updates.updatedAt = new Date();

      // Update the product
      const updatedProduct = await supabaseStorage.updateProduct(productId, updates);

      // Update SEO metadata if provided
      if (seoTitle || seoMetaDescription) {
        try {
          // Check if SEO meta exists for this product
          const existingSeoMeta = await db
            .select()
            .from(seoMeta)
            .where(eq(seoMeta.productId, productId))
            .limit(1);

          if (existingSeoMeta.length > 0) {
            // Update existing SEO meta
            await db
              .update(seoMeta)
              .set({
                seoTitle: seoTitle || existingSeoMeta[0].seoTitle,
                metaDescription: seoMetaDescription || existingSeoMeta[0].metaDescription,
              })
              .where(eq(seoMeta.productId, productId));
            console.log("✅ SEO metadata updated for product:", productId);
          } else {
            // Create new SEO meta record
            await db.insert(seoMeta).values({
              productId,
              seoTitle: seoTitle || null,
              metaDescription: seoMetaDescription || null,
            });
            console.log("✅ SEO metadata created for product:", productId);
          }
        } catch (seoError) {
          console.error("SEO update error (non-critical):", seoError);
        }
      }

      res.json({
        success: true,
        product: updatedProduct,
        message: "AI-generated content applied successfully"
      });
    } catch (error: any) {
      console.error("Apply content error:", error);
      res.status(500).json({ message: "Failed to apply content" });
    }
  });

  // Update product SEO metadata (for Smart Bulk Suggestions)
  app.patch("/api/products/:id/seo", requireAuth, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const productId = req.params.id;
      const { seoTitle, metaDescription, keywords, seoScore } = req.body;

      // Check if the product exists and belongs to the user
      const existingProduct = await supabaseStorage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (existingProduct.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Normalize keywords to array if it's a string
      let keywordsArray: string[] = [];
      if (Array.isArray(keywords)) {
        keywordsArray = keywords.filter((k: unknown) => typeof k === 'string' && k.trim());
      } else if (typeof keywords === 'string' && keywords.trim()) {
        keywordsArray = keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
      }
      
      // Join keywords as comma-separated string for storage
      const keywordsString = keywordsArray.join(', ');

      // Check if SEO meta exists for this product
      const existingSeoMeta = await db
        .select()
        .from(seoMeta)
        .where(eq(seoMeta.productId, productId))
        .limit(1);

      if (existingSeoMeta.length > 0) {
        // Update existing SEO meta
        await db
          .update(seoMeta)
          .set({
            seoTitle: seoTitle || existingSeoMeta[0].seoTitle,
            optimizedTitle: seoTitle || existingSeoMeta[0].optimizedTitle,
            metaDescription: metaDescription || existingSeoMeta[0].metaDescription,
            optimizedMeta: metaDescription || existingSeoMeta[0].optimizedMeta,
            keywords: keywordsString || existingSeoMeta[0].keywords,
            updatedAt: sql`NOW()`
          })
          .where(eq(seoMeta.productId, productId));
      } else {
        // Create new SEO meta record
        await db.insert(seoMeta).values({
          productId,
          seoTitle: seoTitle || null,
          optimizedTitle: seoTitle || null,
          metaDescription: metaDescription || null,
          optimizedMeta: metaDescription || null,
          keywords: keywordsString || null
        });
      }

      // Mark product as optimized
      await supabaseStorage.updateProduct(productId, {
        isOptimized: true,
        updatedAt: new Date()
      });

      // Track in SEO history with actual score from AI
      try {
        await db.insert(productSeoHistory).values({
          userId,
          productId,
          productName: existingProduct.name,
          seoTitle: seoTitle || null,
          metaDescription: metaDescription || null,
          keywords: keywordsArray,
          seoScore: seoScore || 75
        });
      } catch (historyError) {
        console.error("SEO history insert error (non-critical):", historyError);
      }

      res.json({
        success: true,
        message: "SEO metadata updated successfully",
        appliedScore: seoScore || 75
      });
    } catch (error: any) {
      console.error("Update SEO error:", error);
      res.status(500).json({ message: "Failed to update SEO metadata" });
    }
  });

  // Apply AI-generated content to multiple products (bulk)
  app.post("/api/products/apply-content-bulk", requireAuth, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { products: productUpdates } = req.body;

      if (!Array.isArray(productUpdates) || productUpdates.length === 0) {
        return res.status(400).json({ message: "No products provided" });
      }

      const results = [];
      const errors = [];

      for (const update of productUpdates) {
        try {
          const { productId, optimizedCopy, optimizedDescription, seoTitle, seoMetaDescription } = update;

          // Check if the product exists and belongs to the user
          const existingProduct = await supabaseStorage.getProduct(productId);
          if (!existingProduct) {
            errors.push({ productId, error: "Product not found" });
            continue;
          }
          if (existingProduct.userId !== userId) {
            errors.push({ productId, error: "Unauthorized" });
            continue;
          }

          // Record baseline metrics before optimization
          const { recordProductOptimizationForProduct } = await import('./lib/record-product-optimization');
          await recordProductOptimizationForProduct(userId, existingProduct);

          // Backup and apply content
          const updates: any = {};
          
          if (optimizedDescription && !existingProduct.originalDescription) {
            updates.originalDescription = existingProduct.description;
          }
          if (optimizedCopy && !existingProduct.originalCopy) {
            updates.originalCopy = existingProduct.optimizedCopy || null;
          }

          if (optimizedDescription) {
            updates.description = optimizedDescription;
          }
          if (optimizedCopy) {
            updates.optimizedCopy = optimizedCopy;
          }
          updates.isOptimized = true;
          updates.updatedAt = new Date();

          const updatedProduct = await supabaseStorage.updateProduct(productId, updates);
          results.push({ productId, success: true, product: updatedProduct });
        } catch (error: any) {
          errors.push({ productId: update.productId, error: error.message });
        }
      }

      res.json({
        success: true,
        results,
        errors,
        total: productUpdates.length,
        succeeded: results.length,
        failed: errors.length
      });
    } catch (error: any) {
      console.error("Bulk apply content error:", error);
      res.status(500).json({ message: "Failed to apply content in bulk" });
    }
  });

  app.delete("/api/products/:id", requireAuth, apiLimiter, async (req, res) => {
    try {
      // Check if the product exists and belongs to the user
      const existingProduct = await supabaseStorage.getProduct(req.params.id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (existingProduct.userId !== (req as AuthenticatedRequest).user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await supabaseStorage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Optimize all products endpoint
  app.post("/api/products/optimize-all", requireAuth, aiLimiter, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Fetch all products for the user
      const products = await supabaseStorage.getProducts(userId);
      
      if (products.length === 0) {
        return res.json({ 
          message: "No products found to optimize", 
          optimizedCount: 0 
        });
      }

      // Helper function to capitalize names properly
      const capitalizeName = (name: string): string => {
        return name.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };

      // Helper function to generate default descriptions
      const generateDefaultDescription = (name: string, category: string): string => {
        const categoryDescriptions: Record<string, string> = {
          'Electronics': `Experience the latest in electronic innovation with ${name}. Designed for modern living with premium quality and reliable performance.`,
          'Clothing': `Discover stylish comfort with ${name}. Premium quality materials and contemporary design for your wardrobe essentials.`,
          'Home & Garden': `Transform your living space with ${name}. Quality craftsmanship meets functional design for your home.`,
          'Books': `Immerse yourself in ${name}. A captivating read that combines engaging content with valuable insights.`,
          'Health': `Enhance your wellness journey with ${name}. Quality ingredients and trusted formulation for your health goals.`,
          'Sports': `Elevate your performance with ${name}. Professional-grade quality for athletes and fitness enthusiasts.`,
          'Beauty': `Discover your natural radiance with ${name}. Premium formulation for effective and gentle care.`,
          'Toys': `Spark imagination and fun with ${name}. Safe, durable, and designed for endless entertainment.`
        };
        
        return categoryDescriptions[category] || `Discover the exceptional quality and value of ${name}. Carefully crafted to meet your needs with superior performance and reliability.`;
      };

      // Helper function to generate default tags
      const generateDefaultTags = (category: string): string => {
        const categoryTags: Record<string, string> = {
          'Electronics': 'technology, innovation, gadgets, electronics, modern',
          'Clothing': 'fashion, style, apparel, comfortable, trendy',
          'Home & Garden': 'home improvement, decor, garden, lifestyle, quality',
          'Books': 'reading, education, literature, knowledge, entertainment',
          'Health': 'wellness, health, fitness, natural, supplements',
          'Sports': 'fitness, sports, athletic, performance, training',
          'Beauty': 'skincare, beauty, cosmetics, self-care, premium',
          'Toys': 'kids, fun, educational, safe, entertainment'
        };
        
        return categoryTags[category] || 'quality, premium, reliable, popular, recommended';
      };

      // Remove duplicates by name and category
      const uniqueProducts = [];
      const seen = new Set();
      
      for (const product of products) {
        const key = `${product.name.toLowerCase()}-${product.category.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueProducts.push(product);
        }
      }

      // Optimize each unique product
      const optimizedProducts = uniqueProducts.map(product => {
        const optimizedName = capitalizeName(product.name);
        const optimizedDescription = product.description || generateDefaultDescription(product.name, product.category);
        const optimizedTags = product.tags || generateDefaultTags(product.category);
        
        return {
          id: product.id,
          name: optimizedName,
          description: optimizedDescription,
          tags: optimizedTags,
          isOptimized: true,
          optimizedCopy: {
            originalName: product.name,
            originalDescription: product.description,
            originalTags: product.tags,
            optimizedAt: new Date().toISOString(),
            optimizationType: 'database-only'
          }
        };
      });

      // Update all optimized products in database
      const updatePromises = optimizedProducts.map(product => 
        supabaseStorage.updateProduct(product.id, {
          name: product.name,
          description: product.description,
          tags: product.tags,
          isOptimized: product.isOptimized,
          optimizedCopy: product.optimizedCopy
        })
      );

      await Promise.all(updatePromises);

      // Delete duplicate products (keep only the unique ones)
      const duplicateCount = products.length - uniqueProducts.length;
      if (duplicateCount > 0) {
        const uniqueIds = new Set(uniqueProducts.map(p => p.id));
        const duplicateIds = products
          .filter(p => !uniqueIds.has(p.id))
          .map(p => p.id);
        
        const deletePromises = duplicateIds.map(id => supabaseStorage.deleteProduct(id));
        await Promise.all(deletePromises);
      }

      res.json({
        message: "All products optimized successfully",
        optimizedCount: optimizedProducts.length,
        duplicatesRemoved: duplicateCount,
        details: {
          namesCapitalized: optimizedProducts.filter(p => p.optimizedCopy.originalName !== p.name).length,
          descriptionsGenerated: optimizedProducts.filter(p => !p.optimizedCopy.originalDescription).length,
          tagsAdded: optimizedProducts.filter(p => !p.optimizedCopy.originalTags).length
        }
      });
    } catch (error: any) {
      console.error("Optimize products error:", error);
      res.status(500).json({ message: "Failed to optimize products" });
    }
  });

  // Analytics
  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const { type } = req.query;
      const analytics = await supabaseStorage.getAnalytics((req as AuthenticatedRequest).user.id);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // AB Test routes
  app.get("/api/ab-tests", requireAuth, async (req, res) => {
    try {
      const abTests = await supabaseStorage.getABTests((req as AuthenticatedRequest).user.id);
      res.json(abTests);
    } catch (error: any) {
      console.error("Get AB tests error:", error);
      res.status(500).json({ message: "Failed to fetch AB tests" });
    }
  });

  app.post("/api/ab-tests", requireAuth, sanitizeBody, async (req, res) => {
    try {
      const validation = insertAbTestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid AB test data", 
          errors: validation.error.errors 
        });
      }

      const abTestData = { ...validation.data, userId: (req as AuthenticatedRequest).user.id };
      const abTest = await supabaseStorage.createABTest(abTestData);
      res.json(abTest);
    } catch (error: any) {
      console.error("Create AB test error:", error);
      res.status(500).json({ message: "Failed to create AB test" });
    }
  });

  app.patch("/api/ab-tests/:id", requireAuth, sanitizeBody, async (req, res) => {
    try {
      const validation = insertAbTestSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid AB test data", 
          errors: validation.error.errors 
        });
      }

      // Check if the AB test exists and belongs to the user
      const existingTest = await supabaseStorage.getABTest(req.params.id);
      if (!existingTest) {
        return res.status(404).json({ message: "AB test not found" });
      }
      if (existingTest.userId !== (req as AuthenticatedRequest).user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const abTest = await supabaseStorage.updateABTest(req.params.id, validation.data);
      res.json(abTest);
    } catch (error: any) {
      console.error("Update AB test error:", error);
      res.status(500).json({ message: "Failed to update AB test" });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await supabaseStorage.getNotifications((req as AuthenticatedRequest).user.id);
      res.json(notifications);
    } catch (error: any) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const unreadNotifications = await supabaseStorage.getUnreadNotifications((req as AuthenticatedRequest).user.id);
      const count = unreadNotifications.length;
      res.json({ count });
    } catch (error: any) {
      console.error("Get unread count error:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.post("/api/notifications", requireAuth, sanitizeBody, async (req, res) => {
    try {
      const validation = insertNotificationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid notification data", 
          errors: validation.error.errors 
        });
      }

      const notificationData = { ...validation.data, userId: (req as AuthenticatedRequest).user.id };
      const notification = await supabaseStorage.createNotification(notificationData);
      res.json(notification);
    } catch (error: any) {
      console.error("Create notification error:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, apiLimiter, async (req, res) => {
    try {
      await supabaseStorage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", requireAuth, apiLimiter, async (req, res) => {
    try {
      await supabaseStorage.markAllNotificationsAsRead((req as AuthenticatedRequest).user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, apiLimiter, async (req, res) => {
    try {
      await supabaseStorage.markNotificationAsRead(req.params.id);
      // Always succeeds
      if (false) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ message: "Notification deleted successfully" });
    } catch (error: any) {
      console.error("Delete notification error:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  app.post("/api/notifications/clear-all", requireAuth, apiLimiter, async (req, res) => {
    try {
      await supabaseStorage.markAllNotificationsAsRead((req as AuthenticatedRequest).user.id);
      res.json({ message: "All notifications cleared successfully" });
    } catch (error: any) {
      console.error("Clear all notifications error:", error);
      res.status(500).json({ message: "Failed to clear all notifications" });
    }
  });

  // Advanced Notification Preference Routes
  
  // Get user's notification preferences
  app.get("/api/notification-preferences", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const preferences = await storage.getNotificationPreferences(userId);
      
      if (!preferences) {
        // Create default preferences if none exist
        const defaultPreferences = await storage.createNotificationPreferences({
          userId,
          activePreset: 'full_alerts',
          enableDigests: false,
          defaultFrequency: 'instant',
          digestTime: '09:00',
          minPriority: 'low',
          enableQuietHours: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
          allowUrgentInQuietHours: true
        });
        return res.json(defaultPreferences);
      }
      
      res.json(preferences);
    } catch (error: any) {
      console.error("Get notification preferences error:", error);
      res.status(500).json({ message: "Failed to get notification preferences" });
    }
  });

  // Update notification preferences
  app.put("/api/notification-preferences", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const validated = insertNotificationPreferencesSchema.parse({ userId, ...req.body });
      
      const existing = await storage.getNotificationPreferences(userId);
      let preferences;
      
      if (!existing) {
        preferences = await storage.createNotificationPreferences(validated);
      } else {
        preferences = await storage.updateNotificationPreferences(userId, validated);
      }
      
      res.json(preferences);
    } catch (error: any) {
      console.error("Update notification preferences error:", error);
      res.status(400).json({ message: error.message || "Failed to update notification preferences" });
    }
  });

  // Apply preset mode
  app.post("/api/notification-preferences/preset", requireAuth, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { preset } = req.body;
      
      if (!['work', 'focus', 'full_alerts'].includes(preset)) {
        return res.status(400).json({ message: "Invalid preset mode" });
      }
      
      // Ensure preferences exist first
      let existing = await storage.getNotificationPreferences(userId);
      if (!existing) {
        await storage.createNotificationPreferences({
          userId,
          activePreset: 'full_alerts',
          enableDigests: false,
          defaultFrequency: 'instant',
          minPriority: 'low'
        });
      }
      
      const preferences = await storage.applyPresetMode(userId, preset);
      res.json(preferences);
    } catch (error: any) {
      console.error("Apply preset mode error:", error);
      res.status(500).json({ message: "Failed to apply preset mode" });
    }
  });

  // Get notification rules
  app.get("/api/notification-rules", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const rules = await storage.getNotificationRules(userId);
      res.json(rules);
    } catch (error: any) {
      console.error("Get notification rules error:", error);
      res.status(500).json({ message: "Failed to get notification rules" });
    }
  });

  // Get specific notification rule by category
  app.get("/api/notification-rules/:category", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const rule = await storage.getNotificationRule(userId, req.params.category);
      
      if (!rule) {
        return res.status(404).json({ message: "Rule not found" });
      }
      
      res.json(rule);
    } catch (error: any) {
      console.error("Get notification rule error:", error);
      res.status(500).json({ message: "Failed to get notification rule" });
    }
  });

  // Create notification rule
  app.post("/api/notification-rules", requireAuth, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const validated = insertNotificationRuleSchema.parse({ userId, ...req.body });
      const rule = await storage.createNotificationRule(validated);
      res.json(rule);
    } catch (error: any) {
      console.error("Create notification rule error:", error);
      res.status(400).json({ message: error.message || "Failed to create notification rule" });
    }
  });

  // Update notification rule
  app.put("/api/notification-rules/:id", requireAuth, async (req, res) => {
    try {
      const validated = insertNotificationRuleSchema.partial().parse(req.body);
      const rule = await storage.updateNotificationRule(req.params.id, validated);
      res.json(rule);
    } catch (error: any) {
      console.error("Update notification rule error:", error);
      res.status(400).json({ message: error.message || "Failed to update notification rule" });
    }
  });

  // Delete notification rule
  app.delete("/api/notification-rules/:id", requireAuth, apiLimiter, async (req, res) => {
    try {
      await storage.deleteNotificationRule(req.params.id);
      res.json({ message: "Rule deleted successfully" });
    } catch (error: any) {
      console.error("Delete notification rule error:", error);
      res.status(500).json({ message: "Failed to delete notification rule" });
    }
  });

  // Get notification channels
  app.get("/api/notification-channels", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const channels = await storage.getNotificationChannels(userId);
      res.json(channels);
    } catch (error: any) {
      console.error("Get notification channels error:", error);
      res.status(500).json({ message: "Failed to get notification channels" });
    }
  });

  // Create notification channel
  app.post("/api/notification-channels", requireAuth, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const validated = insertNotificationChannelSchema.parse({ userId, ...req.body });
      const channel = await storage.createNotificationChannel(validated);
      res.json(channel);
    } catch (error: any) {
      console.error("Create notification channel error:", error);
      res.status(400).json({ message: error.message || "Failed to create notification channel" });
    }
  });

  // Update notification channel
  app.put("/api/notification-channels/:id", requireAuth, async (req, res) => {
    try {
      const validated = insertNotificationChannelSchema.partial().parse(req.body);
      const channel = await storage.updateNotificationChannel(req.params.id, validated);
      res.json(channel);
    } catch (error: any) {
      console.error("Update notification channel error:", error);
      res.status(400).json({ message: error.message || "Failed to update notification channel" });
    }
  });

  // Delete notification channel
  app.delete("/api/notification-channels/:id", requireAuth, apiLimiter, async (req, res) => {
    try {
      await storage.deleteNotificationChannel(req.params.id);
      res.json({ message: "Channel deleted successfully" });
    } catch (error: any) {
      console.error("Delete notification channel error:", error);
      res.status(500).json({ message: "Failed to delete notification channel" });
    }
  });

  // Get notification analytics
  app.get("/api/notification-analytics", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const filters = {
        category: req.query.category as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100
      };
      const analytics = await storage.getNotificationAnalytics(userId, filters);
      res.json(analytics);
    } catch (error: any) {
      console.error("Get notification analytics error:", error);
      res.status(500).json({ message: "Failed to get notification analytics" });
    }
  });

  // NEW DATABASE HELPER ROUTES

  // User profile routes
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const profile = await supabaseStorage.getUser((req as AuthenticatedRequest).user.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      // Return sanitized profile without password
      const { password, ...safeProfile } = profile;
      res.json(safeProfile);
    } catch (error: any) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", requireAuth, async (req, res) => {
    try {
      const { fullName, email } = req.body;
      const updatedUser = await supabaseStorage.updateUserProfile((req as AuthenticatedRequest).user.id, fullName, email);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Subscription plans routes
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const dbPlans = await getSubscriptionPlans();
      console.log("[API] Fetched subscription plans:", dbPlans.map(p => ({ id: p.id, name: p.planName })));
      
      // Sort plans to ensure trial is first, then by price
      const sortedPlans = dbPlans.sort((a, b) => {
        if (a.planName === '7-Day Free Trial') return -1;
        if (b.planName === '7-Day Free Trial') return 1;
        return parseFloat(a.price) - parseFloat(b.price);
      });
      
      res.json(sortedPlans);
    } catch (error: any) {
      console.error("Get subscription plans error:", error);
      res.status(500).json({ 
        error: "Failed to fetch subscription plans",
        message: error.message 
      });
    }
  });

  // Get current user subscription
  app.get("/api/subscription/current", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const subscription = await supabaseStorage.getUserSubscription(userId);
      
      // If user has an active subscription, return it
      if (subscription) {
        res.json(subscription);
        return;
      }
      
      // If no subscription, check if user is on trial and create virtual subscription
      const userProfile = (req as AuthenticatedRequest).user;
      const user = await supabaseStorage.getUser(userId);
      
      if (user?.plan === 'trial' || userProfile?.plan === 'trial') {
        // Get trial plan details
        const plans = await getSubscriptionPlans();
        const trialPlan = plans.find(p => p.planName === '7-Day Free Trial');
        
        // Calculate trial period dates
        const trialEndDate = user?.trialEndDate;
        const trialStartDate = trialEndDate 
          ? new Date(new Date(trialEndDate).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
          : new Date().toISOString();
        const trialEnd = trialEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        // Create a virtual trial subscription response
        const trialSubscription = {
          id: `trial_${userId}`,
          userId: userId,
          planId: trialPlan?.id || 'trial',
          planName: '7-Day Free Trial',
          status: 'trial',
          currentPeriodStart: trialStartDate,
          currentPeriodEnd: trialEnd,
          cancelAtPeriodEnd: false,
          isTrial: true,
          creditsIncluded: 100,
          creditsUsed: 0,
          price: '0',
          features: trialPlan?.features || [
            "100 credits for 7 days",
            "Full access to all features",
            "Product optimization",
            "AI-powered growth tools"
          ]
        };
        
        res.json(trialSubscription);
        return;
      }
      
      // No subscription and not on trial - return empty
      res.json({});
    } catch (error: any) {
      console.error("Error fetching user subscription:", error);
      res.status(500).json({ 
        error: "Failed to fetch subscription",
        message: error.message 
      });
    }
  });

  // Get trial status for current user
  app.get("/api/trial/status", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Get user from database
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const isOnTrial = user.plan === 'trial';
      const trialEndDate = user.trialEndDate ? new Date(user.trialEndDate) : null;
      
      // Calculate days remaining using UTC date-only math to avoid timezone issues
      let daysRemaining = 0;
      if (trialEndDate) {
        const nowUTC = new Date();
        nowUTC.setUTCHours(0, 0, 0, 0);
        const endUTC = new Date(trialEndDate);
        endUTC.setUTCHours(0, 0, 0, 0);
        
        const diffMs = endUTC.getTime() - nowUTC.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        // If trial end date is in the future, ensure at least 1 day remaining
        if (trialEndDate > new Date()) {
          daysRemaining = Math.max(1, diffDays);
        } else {
          daysRemaining = Math.max(0, diffDays);
        }
      }

      // Check if we should show the daily welcome message (using UTC dates)
      const lastWelcome = user.lastTrialWelcomeAt ? new Date(user.lastTrialWelcomeAt) : null;
      const todayUTC = new Date();
      todayUTC.setUTCHours(0, 0, 0, 0);
      
      let shouldShowWelcome = false;
      if (isOnTrial && daysRemaining > 0) {
        if (!lastWelcome) {
          shouldShowWelcome = true;
        } else {
          const lastWelcomeUTC = new Date(lastWelcome);
          lastWelcomeUTC.setUTCHours(0, 0, 0, 0);
          shouldShowWelcome = lastWelcomeUTC.getTime() < todayUTC.getTime();
        }
      }

      res.json({
        isOnTrial,
        trialEndDate: trialEndDate?.toISOString() || null,
        daysRemaining,
        shouldShowWelcome,
        lastWelcomeAt: user.lastTrialWelcomeAt?.toISOString() || null,
        plan: user.plan
      });
    } catch (error: any) {
      console.error("Error fetching trial status:", error);
      res.status(500).json({ 
        error: "Failed to fetch trial status",
        message: error.message 
      });
    }
  });

  // Mark trial welcome as shown for today (only for trial users)
  app.patch("/api/trial/status", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const userPlan = (req as AuthenticatedRequest).user.plan;
      
      // Only allow trial users to mark welcome as shown
      if (userPlan !== 'trial') {
        return res.status(403).json({ 
          error: "Forbidden", 
          message: "Only trial users can mark trial welcome as shown" 
        });
      }
      
      await db.update(users)
        .set({ lastTrialWelcomeAt: new Date() })
        .where(eq(users.id, userId));

      res.json({ success: true, message: "Trial welcome marked as shown" });
    } catch (error: any) {
      console.error("Error updating trial status:", error);
      res.status(500).json({ 
        error: "Failed to update trial status",
        message: error.message 
      });
    }
  });

  // Get usage stats
  app.get("/api/usage-stats", requireAuth, async (req, res) => {
    try {
      const usageStats = await supabaseStorage.getUserUsageStats((req as AuthenticatedRequest).user.id);
      res.json(usageStats || {
        productsCount: 0,
        emailsSent: 0,
        emailsRemaining: 0,
        smsSent: 0,
        smsRemaining: 0,
        aiGenerationsUsed: 0,
        seoOptimizationsUsed: 0
      });
    } catch (error: any) {
      console.error("Error fetching usage stats:", error);
      res.status(500).json({ 
        error: "Failed to fetch usage stats",
        message: error.message 
      });
    }
  });

  // Get credit balance for AI tools
  app.get("/api/credits/balance", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const balance = await getCreditBalance(userId);
      res.json(balance);
    } catch (error: any) {
      console.error("Error fetching credit balance:", error);
      res.status(500).json({ 
        error: "Failed to fetch credit balance",
        message: error.message 
      });
    }
  });

  // Check credits for an AI tool operation
  app.post("/api/credits/check", requireAuth, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { toolId, quantity = 1 } = req.body;
      
      if (!toolId) {
        return res.status(400).json({ error: "toolId is required" });
      }
      
      const result = await checkAIToolCredits(userId, toolId, quantity);
      res.json(result);
    } catch (error: any) {
      console.error("Error checking credits:", error);
      res.status(500).json({ 
        error: "Failed to check credits",
        message: error.message 
      });
    }
  });

  // Consume credits for an AI tool operation (called after successful generation)
  app.post("/api/credits/consume", requireAuth, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { toolId, quantity = 1 } = req.body;
      
      if (!toolId) {
        return res.status(400).json({ error: "toolId is required" });
      }
      
      const result = await consumeAIToolCredits(userId, toolId, quantity);
      
      if (!result.success) {
        return res.status(402).json({ 
          error: "Insufficient credits",
          message: result.message 
        });
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("Error consuming credits:", error);
      res.status(500).json({ 
        error: "Failed to consume credits",
        message: error.message 
      });
    }
  });

  // Get invoices (returns payment transaction history)
  app.get("/api/invoices", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      // Get real payment transactions from database
      const invoices = await supabaseStorage.getPaymentTransactions(userId);
      res.json(invoices || []);
    } catch (error: any) {
      // If payment_transactions table doesn't exist, return empty array instead of error
      if (error.message?.includes('payment_transactions') || error.message?.includes('schema cache')) {
        console.log("[API] Payment transactions table not found, returning empty invoices");
        res.json([]);
        return;
      }
      console.error("Error fetching invoices:", error);
      res.status(500).json({ 
        error: "Failed to fetch invoices",
        message: error.message 
      });
    }
  });

  // Get payment methods
  app.get("/api/payment-methods", requireAuth, async (req, res) => {
    try {
      // Payment methods managed through PayPal and Razorpay
      const paymentMethods: any[] = [];
      res.json(paymentMethods || []);
    } catch (error: any) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ 
        error: "Failed to fetch payment methods",
        message: error.message 
      });
    }
  });

  app.post("/api/update-subscription", requireAuth, paymentLimiter, sanitizeBody, async (req, res) => {
    try {
      const { planId } = req.body;
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      const userId = (req as AuthenticatedRequest).user.id;
      const user = await supabaseStorage.updateUserSubscription(userId, { planId });
      
      // Initialize credits for the new plan
      await initializeUserCredits(userId, planId);
      
      res.json({ message: "Subscription updated successfully", user });
    } catch (error: any) {
      console.error("Update subscription error:", error);
      res.status(500).json({ message: error.message || "Failed to update subscription" });
    }
  });

  // Change subscription plan (alternative endpoint for billing page)
  app.post("/api/subscription/change-plan", requireAuth, paymentLimiter, sanitizeBody, async (req, res) => {
    try {
      const { planId, gateway = 'razorpay', billingPeriod = 'monthly' } = req.body;
      console.log("[SUBSCRIPTION] Received plan change request with planId:", planId, "gateway:", gateway, "billingPeriod:", billingPeriod);
      
      if (!planId) {
        return res.status(400).json({ error: "Plan ID is required" });
      }

      const userId = (req as AuthenticatedRequest).user.id;
      const userEmail = (req as AuthenticatedRequest).user.email;
      
      // Verify plan exists before attempting to update subscription
      const plans = await getSubscriptionPlans();
      const selectedPlan = plans.find(p => p.id === planId);
      console.log("[SUBSCRIPTION] Plan exists check:", !!selectedPlan, "Available plan IDs:", plans.map(p => p.id));
      
      if (!selectedPlan) {
        return res.status(400).json({ 
          error: "Invalid plan ID",
          message: "The selected plan does not exist. Please refresh and try again." 
        });
      }
      
      // Check if the plan is free (7-Day Free Trial)
      if (Number(selectedPlan.price) === 0 || selectedPlan.planName === '7-Day Free Trial') {
        console.log("[SUBSCRIPTION] Free plan selected, updating directly without payment");
        
        // Update subscription directly for free plans
        const updatedUser = await updateUserSubscription(userId, planId, userEmail);
        await initializeUserCredits(userId, planId);
        await NotificationService.notifySubscriptionChanged(userId, planId);
        
        return res.json({ 
          success: true,
          requiresPayment: false,
          user: updatedUser 
        });
      }
      
      // For paid plans, create a payment order
      console.log("[SUBSCRIPTION] Paid plan selected, creating payment order");
      
      // Calculate the correct amount based on billing period
      const monthlyPrice = Number(selectedPlan.price);
      const finalAmount = billingPeriod === 'annual' 
        ? Math.round(monthlyPrice * 12 * 0.8)  // 20% discount for annual
        : monthlyPrice;
      
      console.log("[SUBSCRIPTION] Calculated amount:", { monthlyPrice, billingPeriod, finalAmount });
      
      // Create payment transaction record
      const transaction = await storage.createPaymentTransaction({
        userId,
        amount: finalAmount.toString(),
        currency: 'USD',  // All payments are in USD
        gateway,
        purpose: 'subscription',
        status: 'pending',
        metadata: {
          planId,
          planName: selectedPlan.planName,
          userEmail,
          billingPeriod
        }
      });
      
      // Create payment order based on gateway
      let paymentOrder;
      if (gateway === 'razorpay' && isRazorpayConfigured()) {
        paymentOrder = await createRazorpayOrder({
          amount: Number(selectedPlan.price),
          currency: 'USD',  // USD-only pricing
          receipt: transaction.id,
          notes: {
            userId,
            planId,
            planName: selectedPlan.planName,
            transactionId: transaction.id
          }
        });
        
        // Update transaction with gateway order ID
        await storage.updatePaymentTransaction(transaction.id, {
          gatewayOrderId: paymentOrder.id
        });
        
        return res.json({
          success: true,
          requiresPayment: true,
          gateway: 'razorpay',
          transactionId: transaction.id,
          order: {
            id: paymentOrder.id,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            keyId: getRazorpayKeyId()
          },
          plan: selectedPlan
        });
      } else if (gateway === 'paypal' && process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
        // PayPal requires frontend integration, return transaction ID
        return res.json({
          success: true,
          requiresPayment: true,
          gateway: 'paypal',
          transactionId: transaction.id,
          amount: finalAmount,
          currency: 'USD',  // All payments are in USD
          billingPeriod: billingPeriod,
          plan: selectedPlan
        });
      } else {
        // No payment gateway configured
        return res.status(503).json({ 
          error: "Payment gateway not configured",
          message: `${gateway} is not configured. Please contact support.` 
        });
      }
    } catch (error: any) {
      console.error("Error changing subscription plan:", error);
      res.status(500).json({ 
        error: "Failed to change subscription plan",
        message: error.message 
      });
    }
  });

  // ==================== PAYMENT GATEWAY ROUTES ====================
  
  // Get payment gateway configuration (for frontend)
  app.get("/api/payments/config", requireAuth, async (req, res) => {
    try {
      res.json({
        razorpay: {
          enabled: isRazorpayConfigured(),
          keyId: isRazorpayConfigured() ? getRazorpayKeyId() : null
        },
        paypal: {
          enabled: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
          clientId: process.env.PAYPAL_CLIENT_ID || null
        }
      });
    } catch (error: any) {
      console.error("Error fetching payment config:", error);
      res.status(500).json({ error: "Failed to fetch payment configuration" });
    }
  });

  // === RAZORPAY ROUTES ===
  
  // Create Razorpay order
  app.post("/api/payments/razorpay/create-order", requireAuth, paymentLimiter, sanitizeBody, async (req, res) => {
    try {
      if (!isRazorpayConfigured()) {
        return res.status(503).json({ error: "Razorpay is not configured" });
      }

      const { amount, currency = 'USD', notes } = req.body;
      const user = (req as AuthenticatedRequest).user;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const order = await createRazorpayOrder({
        amount,
        currency,
        receipt: `order_${user.id}_${Date.now()}`,
        notes: { userId: user.id, ...notes }
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: getRazorpayKeyId()
      });
    } catch (error: any) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ 
        error: "Failed to create order",
        message: error.message 
      });
    }
  });

  // Verify Razorpay payment and activate subscription
  app.post("/api/payments/razorpay/verify", requireAuth, paymentLimiter, sanitizeBody, async (req, res) => {
    try {
      const { orderId, paymentId, signature, transactionId } = req.body;
      const user = (req as AuthenticatedRequest).user;

      if (!orderId || !paymentId || !signature) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!transactionId) {
        return res.status(400).json({ error: "Transaction ID is required" });
      }

      // Get transaction first to validate amount
      const transaction = await storage.getPaymentTransaction(transactionId);
      
      if (!transaction || transaction.userId !== user.id) {
        return res.status(404).json({ error: "Transaction not found or unauthorized" });
      }

      // Ensure transaction is still pending
      if (transaction.status !== 'pending') {
        return res.status(400).json({ 
          error: "Invalid transaction status",
          message: `Transaction is ${transaction.status}, expected pending` 
        });
      }

      // Verify signature
      const isValid = await verifyRazorpaySignature(orderId, paymentId, signature);

      if (!isValid) {
        // Mark transaction as failed
        await storage.updatePaymentTransaction(transactionId, {
          status: 'failed',
          errorMessage: 'Invalid payment signature'
        });
        return res.status(400).json({ error: "Invalid payment signature" });
      }

      // Fetch payment details from Razorpay
      const payment = await fetchRazorpayPayment(paymentId);

      // Validate payment amount matches transaction amount
      const paidAmount = Number(payment.amount) / 100;
      const expectedAmount = Number(transaction.amount);
      
      console.log("[PAYMENT] Validating amount - Paid:", paidAmount, "Expected:", expectedAmount);
      
      if (Math.abs(paidAmount - expectedAmount) > 0.01) {
        // Amount mismatch - mark transaction as failed
        await storage.updatePaymentTransaction(transactionId, {
          status: 'failed',
          errorMessage: `Amount mismatch: Expected ${expectedAmount}, received ${paidAmount}`,
          gatewayTransactionId: paymentId
        });
        return res.status(400).json({ 
          error: "Payment amount mismatch",
          message: `Expected ${expectedAmount}, received ${paidAmount}` 
        });
      }

      // Validate currency matches
      if (payment.currency.toUpperCase() !== transaction.currency.toUpperCase()) {
        await storage.updatePaymentTransaction(transactionId, {
          status: 'failed',
          errorMessage: `Currency mismatch: Expected ${transaction.currency}, received ${payment.currency}`,
          gatewayTransactionId: paymentId
        });
        return res.status(400).json({ 
          error: "Payment currency mismatch" 
        });
      }

      // Validate payment status - must be captured
      if (payment.status !== 'captured') {
        // If payment is only authorized, capture it first
        if (payment.status === 'authorized') {
          try {
            console.log("[PAYMENT] Payment is authorized, capturing now...");
            const capturedPayment = await captureRazorpayPayment(paymentId, paidAmount, payment.currency);
            console.log("[PAYMENT] Payment captured successfully:", capturedPayment.id);
            
            // Verify capture was successful
            if (capturedPayment.status !== 'captured') {
              await storage.updatePaymentTransaction(transactionId, {
                status: 'failed',
                errorMessage: `Capture failed: ${capturedPayment.status}`,
                gatewayTransactionId: paymentId
              });
              return res.status(400).json({ 
                error: "Payment capture failed",
                message: `Capture status is ${capturedPayment.status}` 
              });
            }
          } catch (captureError: any) {
            console.error("[PAYMENT] Capture failed:", captureError);
            await storage.updatePaymentTransaction(transactionId, {
              status: 'failed',
              errorMessage: `Capture error: ${captureError.message}`,
              gatewayTransactionId: paymentId
            });
            return res.status(400).json({ 
              error: "Payment capture failed",
              message: captureError.message 
            });
          }
        } else {
          // Payment is neither captured nor authorized
          await storage.updatePaymentTransaction(transactionId, {
            status: 'failed',
            errorMessage: `Payment not successful: ${payment.status}`,
            gatewayTransactionId: paymentId
          });
          return res.status(400).json({ 
            error: "Payment not successful",
            message: `Payment status is ${payment.status}` 
          });
        }
      }

      // All validations passed - update transaction as completed
      await storage.updatePaymentTransaction(transactionId, {
        gatewayTransactionId: paymentId,
        status: 'completed',
        paymentMethod: payment.method,
        paymentDetails: {
          card_id: payment.card_id,
          email: payment.email,
          contact: payment.contact
        },
        signature,
        webhookReceived: false
      });

      // If this is a subscription payment, activate the subscription
      if (transaction.purpose === 'subscription' && transaction.metadata?.planId) {
        const planId = transaction.metadata.planId;
        const userEmail = user.email;
        
        console.log("[PAYMENT] Payment verified and validated, activating subscription for planId:", planId);
        
        // Update user subscription
        const updatedUser = await updateUserSubscription(user.id, planId, userEmail);
        await initializeUserCredits(user.id, planId);
        await NotificationService.notifySubscriptionChanged(user.id, planId);
      }

      // Send payment success notification
      await NotificationService.notifyPaymentSuccess(user.id, paidAmount, user.plan || 'subscription');

      res.json({ 
        success: true, 
        paymentId,
        status: payment.status 
      });
    } catch (error: any) {
      console.error("Error verifying Razorpay payment:", error);
      res.status(500).json({ 
        error: "Payment verification failed",
        message: error.message 
      });
    }
  });

  // Razorpay webhook
  app.post("/api/webhooks/razorpay", async (req, res) => {
    await handleRazorpayWebhook(req, res);
  });

  // PayPal webhook
  app.post("/api/webhooks/paypal", async (req, res) => {
    const { handlePaypalWebhook } = await import("./paypal");
    await handlePaypalWebhook(req, res);
  });

  // === PAYPAL ROUTES (Blueprint integration) ===
  
  // From PayPal blueprint - referenced integration: blueprint:javascript_paypal
  app.get("/api/paypal/setup", async (req, res) => {
    try {
      await loadPaypalDefault(req, res);
    } catch (error: any) {
      console.error("PayPal setup error:", error);
      res.status(500).json({ error: "PayPal setup failed" });
    }
  });

  app.post("/api/paypal/order", async (req, res) => {
    try {
      await createPaypalOrder(req, res);
    } catch (error: any) {
      console.error("PayPal order creation error:", error);
      res.status(500).json({ error: "Failed to create PayPal order" });
    }
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    try {
      await capturePaypalOrder(req, res);
    } catch (error: any) {
      console.error("PayPal capture error:", error);
      res.status(500).json({ error: "Failed to capture PayPal payment" });
    }
  });

  // Verify PayPal payment and activate subscription
  app.post("/api/payments/paypal/verify-subscription", requireAuth, paymentLimiter, sanitizeBody, async (req, res) => {
    try {
      const { transactionId, planId, paypalOrderId } = req.body;
      const user = (req as AuthenticatedRequest).user;

      if (!transactionId || !planId || !paypalOrderId) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "Transaction ID, Plan ID, and PayPal Order ID are required" 
        });
      }

      console.log(`[PayPal Verify] Processing payment for user ${user.id}, transaction ${transactionId}`);

      // Import required functions
      const { updateUserSubscription } = await import('./db');
      const { initializeUserCredits } = await import('./lib/credits');
      const { NotificationService } = await import('./lib/notification-service');

      // Get the transaction to retrieve billing period from metadata
      const transaction = await storage.getPaymentTransaction(transactionId);
      const billingPeriod = transaction?.metadata?.billingPeriod || 'monthly';
      
      console.log(`[PayPal Verify] Billing period: ${billingPeriod}`);

      // Update the transaction status to completed
      await storage.updatePaymentTransaction(transactionId, {
        status: 'completed',
        gatewayOrderId: paypalOrderId,
        paidAt: new Date()
      });

      // Update user subscription and activate the plan with billing period
      const updatedUser = await updateUserSubscription(user.id, planId, user.email, billingPeriod);
      
      // Initialize credits for the new plan
      await initializeUserCredits(user.id, planId);
      
      // Send notification about subscription activation
      await NotificationService.notifySubscriptionChanged(user.id, planId);

      console.log(`[PayPal Verify] Subscription activated successfully for user ${user.id}, billingPeriod: ${billingPeriod}`);

      res.json({ 
        success: true,
        message: "Subscription activated successfully",
        billingPeriod: billingPeriod,
        user: updatedUser
      });
    } catch (error: any) {
      console.error("PayPal subscription verification error:", error);
      res.status(500).json({ 
        error: "Failed to verify payment and activate subscription",
        message: error.message 
      });
    }
  });

  // Payment Gateway Selection
  app.get("/api/payments/gateway-selection", requireAuth, async (req, res) => {
    try {
      const { selectPaymentGateway, getAvailableGateways } = await import('./lib/payment-gateway-selector');
      const { currency, countryCode } = req.query as { currency?: string; countryCode?: string };
      
      const recommended = selectPaymentGateway(currency, countryCode);
      const available = getAvailableGateways(currency);
      
      res.json({
        recommended,
        available,
        currentCurrency: currency || 'USD'
      });
    } catch (error: any) {
      console.error("Gateway selection error:", error);
      res.status(500).json({ error: "Failed to determine payment gateway" });
    }
  });

  // Trial and subscription billing tasks (admin only or scheduled)
  app.post("/api/admin/run-billing-tasks", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      // SECURITY: Only allow admins to manually trigger billing tasks
      if (user.role !== 'admin') {
        return res.status(403).json({ 
          error: "Forbidden",
          message: "Only administrators can trigger billing tasks" 
        });
      }
      
      const { runBillingTasks } = await import('./lib/trial-expiration-service');
      
      // Run billing tasks
      await runBillingTasks();
      
      res.json({ 
        success: true, 
        message: "Billing tasks completed successfully" 
      });
    } catch (error: any) {
      console.error("Billing tasks error:", error);
      res.status(500).json({ 
        error: "Failed to run billing tasks",
        message: error.message 
      });
    }
  });

  // Get trial status summary (admin only)
  app.get("/api/admin/trial-status", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      // SECURITY: Only allow admins to view trial status
      if (user.role !== 'admin') {
        return res.status(403).json({ 
          error: "Forbidden",
          message: "Only administrators can view trial status" 
        });
      }
      
      const { getTrialStatusSummary } = await import('./lib/trial-expiration-service');
      
      const summary = await getTrialStatusSummary();
      
      res.json(summary);
    } catch (error: any) {
      console.error("Trial status error:", error);
      res.status(500).json({ 
        error: "Failed to fetch trial status",
        message: error.message 
      });
    }
  });

  // Send trial notification to specific user (admin only, for testing)
  app.post("/api/admin/send-trial-notification", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      // SECURITY: Only allow admins to send manual notifications
      if (user.role !== 'admin') {
        return res.status(403).json({ 
          error: "Forbidden",
          message: "Only administrators can send manual notifications" 
        });
      }
      
      const { sendTrialExpirationNotifications } = await import('./lib/trial-expiration-service');
      
      // Send notifications for all schedules
      const result = await sendTrialExpirationNotifications();
      
      res.json({ 
        success: true, 
        notificationsSent: result.processedCount,
        errors: result.errors
      });
    } catch (error: any) {
      console.error("Trial notification error:", error);
      res.status(500).json({ 
        error: "Failed to send trial notifications",
        message: error.message 
      });
    }
  });

  // === PAYMENT TRANSACTIONS ===
  
  // Get all payment transactions for user
  app.get("/api/payments/transactions", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const { status, gateway, limit = 50, offset = 0 } = req.query;
      
      const transactions = await storage.getPaymentTransactions(user.id, {
        status: status as string,
        gateway: gateway as string,
        limit: Number(limit),
        offset: Number(offset)
      });

      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Get single payment transaction
  app.get("/api/payments/transactions/:transactionId", requireAuth, async (req, res) => {
    try {
      const { transactionId } = req.params;
      const user = (req as AuthenticatedRequest).user;
      
      const transaction = await storage.getPaymentTransaction(transactionId);
      
      if (!transaction || transaction.userId !== user.id) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      res.json(transaction);
    } catch (error: any) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  // Request refund
  app.post("/api/payments/refund/:transactionId", requireAuth, paymentLimiter, sanitizeBody, async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { amount, reason } = req.body;
      const user = (req as AuthenticatedRequest).user;

      const transaction = await storage.getPaymentTransaction(transactionId);
      
      if (!transaction || transaction.userId !== user.id) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.status !== 'completed') {
        return res.status(400).json({ error: "Only completed payments can be refunded" });
      }

      let refundResult;

      switch (transaction.gateway) {
        case 'razorpay':
          refundResult = await refundRazorpayPayment(
            transaction.gatewayTransactionId,
            amount ? Number(amount) : undefined
          );
          break;
        default:
          return res.status(400).json({ error: `Refunds not supported for ${transaction.gateway}` });
      }

      // Update transaction status
      await storage.updatePaymentTransaction(transactionId, {
        status: amount ? 'partially_refunded' : 'refunded',
        refundAmount: amount || transaction.amount,
        refundReason: reason,
        refundedAt: new Date()
      });

      res.json({ 
        success: true, 
        refund: refundResult 
      });
    } catch (error: any) {
      console.error("Error processing refund:", error);
      res.status(500).json({ 
        error: "Failed to process refund",
        message: error.message 
      });
    }
  });

  // Admin: Get all transactions with filters
  app.get("/api/admin/payments/transactions", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      if (user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { status, gateway, userId, limit = 100, offset = 0 } = req.query;
      
      const transactions = await storage.getAllPaymentTransactions({
        status: status as string,
        gateway: gateway as string,
        userId: userId as string,
        limit: Number(limit),
        offset: Number(offset)
      });

      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching admin transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Session management routes (for admin/internal use only)
  app.post("/api/sessions", requireAuth, async (req, res) => {
    try {
      // Only allow admin users to create sessions
      if ((req as AuthenticatedRequest).user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { sessionId, expiresAt } = req.body;
      if (!sessionId || !expiresAt) {
        return res.status(400).json({ message: "Missing required session data" });
      }
      
      // Session management is handled by Supabase Auth
      res.json({ 
        message: "Session management handled by Supabase Auth",
        sessionId,
        userId: (req as AuthenticatedRequest).user.id 
      });
    } catch (error: any) {
      console.error("Save session error:", error);
      res.status(500).json({ message: "Failed to save session" });
    }
  });

  app.get("/api/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      // Session management is handled by Supabase Auth
      res.json({ 
        message: "Session management handled by Supabase Auth",
        sessionId 
      });
    } catch (error: any) {
      console.error("Get session error:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.delete("/api/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      // Session management is handled by Supabase Auth
      // await deleteSession(sessionId);
      res.json({ message: "Session deleted successfully" });
    } catch (error: any) {
      console.error("Delete session error:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Database admin routes (you may want to protect these more strictly)
  app.get("/api/admin/db-test", requireAuth, async (req, res) => {
    try {
      const isConnected = await testSupabaseConnection();
      res.json({ 
        connected: isConnected,
        message: isConnected ? "Database connection successful" : "Database connection failed"
      });
    } catch (error: any) {
      console.error("Database test error:", error);
      res.status(500).json({ message: "Database test failed" });
    }
  });

  app.post("/api/admin/seed-plans", requireAuth, async (req, res) => {
    try {
      // Only allow admin users to seed (you may want to add role checking)
      if ((req as AuthenticatedRequest).user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // TODO: Implement seedSubscriptionPlans function
      // await seedSubscriptionPlans();
      res.json({ message: "Subscription plans seeded successfully" });
    } catch (error: any) {
      console.error("Seed plans error:", error);
      res.status(500).json({ message: "Failed to seed subscription plans" });
    }
  });

  // Enhanced user registration route using new database helper
  app.post("/api/register-v2", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists using new helper
      const existingUser = await supabaseStorage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create user using new helper (automatically creates profile)
      const user = await supabaseStorage.createUser(validatedData);
      
      // Send welcome email (non-blocking - don't fail registration if email fails)
      setImmediate(async () => {
        try {
          const welcomeEmailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 32px; }
                .content { padding: 40px 30px; }
                .content h2 { color: #333; margin-top: 0; }
                .content p { color: #666; line-height: 1.6; font-size: 16px; }
                .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
                .features { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
                .features h3 { color: #333; margin-top: 0; font-size: 18px; }
                .features ul { color: #666; line-height: 1.8; padding-left: 20px; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Welcome to Zyra AI! 🎉</h1>
                </div>
                <div class="content">
                  <h2>Hi ${user.fullName || 'there'}!</h2>
                  <p>We're thrilled to have you join the Zyra family! Your account has been successfully created, and you're now ready to transform your e-commerce store with the power of AI.</p>
                  
                  <div class="features">
                    <h3>Here's what you can do with Zyra:</h3>
                    <ul>
                      <li><strong>AI Product Descriptions</strong> - Generate compelling, SEO-optimized product descriptions instantly</li>
                      <li><strong>Smart Marketing Automation</strong> - Recover abandoned carts and boost sales with automated email & SMS campaigns</li>
                      <li><strong>SEO Optimization</strong> - Improve your search rankings with AI-powered meta tags and titles</li>
                      <li><strong>Analytics Dashboard</strong> - Track your performance and ROI in real-time</li>
                      <li><strong>Brand Voice Memory</strong> - Train AI to write in your unique brand voice</li>
                    </ul>
                  </div>
                  
                  <p>Ready to get started? Log in to your dashboard and explore all the powerful features waiting for you!</p>
                  
                  <center>
                    <a href="${process.env.REPLIT_DOMAIN ? `https://${process.env.REPLIT_DOMAIN}` : 'https://zyra.ai'}/dashboard" class="cta-button">Go to Dashboard →</a>
                  </center>
                  
                  <p style="margin-top: 30px;">If you have any questions or need help getting started, our support team is here for you. Just reply to this email!</p>
                  
                  <p>Happy selling!<br><strong>The Zyra Team</strong></p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Zyra AI. All rights reserved.</p>
                  <p>You're receiving this email because you signed up for Zyra AI.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          await sendEmail(
            user.email,
            'Welcome to Zyra AI - Let\'s Get Started! 🚀',
            welcomeEmailHTML
          );
          console.log(`Welcome email sent to: ${user.email}`);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Log to error tracking but don't block registration
          const { ErrorLogger } = await import('./lib/errorLogger');
          ErrorLogger.log(
            emailError instanceof Error ? emailError : new Error(String(emailError)),
            {
              errorType: 'external_api_error',
              statusCode: 500,
              userId: user.id,
              metadata: { 
                service: 'sendgrid_welcome_email',
                recipientEmail: user.email 
              }
            }
          );
        }
      });
      
      // Registration complete - Supabase Auth handles login
      // req.login(user, (err: any) => {
      res.status(201).json({ 
        message: "User created successfully", 
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          plan: user.plan
        }
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.message?.includes('Database operation failed')) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Registration failed" });
      }
    }
  });

  // REAL-TIME DASHBOARD API ENDPOINTS

  // Get comprehensive dashboard data
  app.get("/api/dashboard", requireAuth, async (req, res) => {
    try {
      const dashboardData = await storage.getDashboardData((req as AuthenticatedRequest).user.id);
      res.json(dashboardData);
    } catch (error: any) {
      console.error("[API] Dashboard data fetch error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Combined dashboard endpoint for faster loading - includes dashboard + notifications + user data
  app.get("/api/dashboard-complete", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Run dashboard and notifications in parallel for better performance
      const [dashboardData, notifications, notificationCount] = await Promise.all([
        storage.getDashboardData(userId),
        storage.getNotifications(userId), // Get notifications
        storage.getUnreadNotificationCount(userId)
      ]);

      res.json({
        dashboard: dashboardData,
        notifications: notifications || [],
        unreadCount: notificationCount || 0,
        user: (req as AuthenticatedRequest).user // User already loaded from auth middleware
      });
    } catch (error: any) {
      console.error("[API] Combined dashboard fetch error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Initialize user real-time data (called on first login)
  app.post("/api/dashboard/initialize", requireAuth, async (req, res) => {
    try {
      await storage.initializeUserRealtimeData((req as AuthenticatedRequest).user.id);
      res.json({ message: "Real-time data initialized successfully" });
    } catch (error: any) {
      console.error("[API] Dashboard initialization error:", error);
      res.status(500).json({ message: "Failed to initialize dashboard data" });
    }
  });

  // Track tool access (called when user clicks on tool buttons)
  app.post("/api/dashboard/track-tool-access", requireAuth, async (req, res) => {
    try {
      const { toolName } = req.body;
      if (!toolName) {
        return res.status(400).json({ message: "Tool name is required" });
      }
      
      const toolAccess = await storage.trackToolAccess((req as AuthenticatedRequest).user.id, toolName);
      
      // Log activity
      await storage.createActivityLog((req as AuthenticatedRequest).user.id, {
        action: "tool_accessed",
        description: `Opened ${toolName.replace('-', ' ')} tool`,
        toolUsed: toolName,
        metadata: { timestamp: new Date().toISOString() }
      });

      res.json({ success: true, toolAccess });
    } catch (error: any) {
      console.error("[API] Tool access tracking error:", error);
      res.status(500).json({ message: "Failed to track tool access" });
    }
  });

  // Log user activity
  app.post("/api/dashboard/log-activity", requireAuth, async (req, res) => {
    try {
      const { action, description, toolUsed, metadata } = req.body;
      if (!action || !description) {
        return res.status(400).json({ message: "Action and description are required" });
      }

      const activityLog = await storage.createActivityLog((req as AuthenticatedRequest).user.id, {
        action,
        description,
        toolUsed,
        metadata
      });

      res.json({ success: true, activityLog });
    } catch (error: any) {
      console.error("[API] Activity logging error:", error);
      res.status(500).json({ message: "Failed to log activity" });
    }
  });

  // Update usage stats (called when user performs actions)
  app.post("/api/dashboard/update-usage", requireAuth, async (req, res) => {
    try {
      const { statField, increment = 1 } = req.body;
      if (!statField) {
        return res.status(400).json({ message: "Stat field is required" });
      }

      await storage.updateUsageStats((req as AuthenticatedRequest).user.id, statField, increment);
      res.json({ success: true, message: `Updated ${statField} by ${increment}` });
    } catch (error: any) {
      console.error("[API] Usage stats update error:", error);
      res.status(500).json({ message: "Failed to update usage stats" });
    }
  });

  // Refresh metrics (re-fetch latest dashboard data)
  app.post("/api/dashboard/refresh-metrics", requireAuth, async (req, res) => {
    try {
      const dashboardData = await storage.getDashboardData((req as AuthenticatedRequest).user.id);
      res.json({ success: true, dashboardData });
    } catch (error: any) {
      console.error("[API] Metrics refresh error:", error);
      res.status(500).json({ message: "Failed to refresh metrics" });
    }
  });

  // Get real-time usage stats only
  app.get("/api/dashboard/usage-stats", requireAuth, async (req, res) => {
    try {
      const dashboardData = await storage.getDashboardData((req as AuthenticatedRequest).user.id);
      res.json(dashboardData.usageStats);
    } catch (error: any) {
      console.error("[API] Usage stats fetch error:", error);
      res.status(500).json({ message: "Failed to fetch usage stats" });
    }
  });

  // Profile management routes
  app.put('/api/profile', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { fullName, email } = req.body;
      if (!fullName || !email) {
        return res.status(400).json({ error: 'Full name and email are required' });
      }

      const updatedUser = await supabaseStorage.updateUserProfile(userId, fullName, email);
      res.json(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/change-password', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      await supabaseStorage.changeUserPassword(userId, currentPassword, newPassword);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Change password error:', error);
      if (error.message === 'Current password is incorrect') {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/upload-profile-image', requireAuth, uploadLimiter, upload.single('image'), async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const ext = req.file.originalname.split('.').pop() || 'jpg';
      const filename = `profile-${userId}-${timestamp}.${ext}`;
      const imageUrl = `/uploads/profiles/${filename}`;

      // Save file using multer's buffer (already in memory)
      const fs = await import('fs');
      const path = await import('path');
      const uploadsDir = path.join(process.cwd(), 'uploads', 'profiles');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Write file to disk
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      // Update user profile with image URL
      const updatedUser = await supabaseStorage.updateUserImage(userId, imageUrl);
      res.json(updatedUser);
    } catch (error) {
      console.error('Upload image error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Store connections routes
  app.get('/api/store-connections', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const connections = await supabaseStorage.getStoreConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error('Get store connections error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/store-connections', requireAuth, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { platform, storeName, storeUrl, accessToken } = req.body;
      if (!platform || !storeName || !storeUrl || !accessToken) {
        return res.status(400).json({ error: 'All store connection fields are required' });
      }

      const connection = await supabaseStorage.createStoreConnection({
        userId,
        platform,
        storeName,
        storeUrl,
        accessToken,
        status: 'active'
      });
      res.json(connection);
    } catch (error) {
      console.error('Create store connection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/store-connections/:id', requireAuth, apiLimiter, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      await supabaseStorage.deleteStoreConnection(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete store connection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ===== PROFILE API ROUTES (matching frontend expectations) =====
  
  // PATCH /api/profile - Update profile information
  app.patch('/api/profile', requireAuth, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { fullName, email } = req.body;
      
      if (!fullName || !email) {
        return res.status(400).json({ message: 'Full name and email are required' });
      }

      const updatedUser = await supabaseStorage.updateUserProfile(userId, fullName, email);
      res.json(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // POST /api/profile/upload-image - Upload profile image
  app.post('/api/profile/upload-image', requireAuth, uploadLimiter, upload.single('image'), async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      // Save the file to uploads directory
      const uploadsDir = './uploads/profiles';
      const fs = await import('fs/promises');
      
      // Create directory if it doesn't exist
      try {
        await fs.mkdir(uploadsDir, { recursive: true });
      } catch (err) {
        // Directory might already exist
      }
      
      // Generate unique filename
      const ext = req.file.originalname.split('.').pop();
      const filename = `${userId}-${Date.now()}.${ext}`;
      const filepath = `${uploadsDir}/${filename}`;
      
      // Write file to disk
      await fs.writeFile(filepath, req.file.buffer);
      
      // Create public URL
      const imageUrl = `/uploads/profiles/${filename}`;
      
      // Update user in database
      const updatedUser = await supabaseStorage.updateUserImage(userId, imageUrl);
      
      res.json({ imageUrl, user: updatedUser });
    } catch (error) {
      console.error('Upload image error:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // POST /api/profile/change-password - Change password
  app.post('/api/profile/change-password', requireAuth, authLimiter, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { oldPassword, newPassword, confirmPassword } = req.body;
      
      if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'All password fields are required' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'New passwords do not match' });
      }

      // Validate password strength
      const { PasswordValidator } = await import('./lib/password-validator');
      const validation = PasswordValidator.validate(newPassword);
      
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: 'Password does not meet security requirements',
          feedback: validation.feedback,
          score: validation.score
        });
      }

      await supabaseStorage.changeUserPassword(userId, oldPassword, newPassword);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error: any) {
      console.error('Change password error:', error);
      if (error.message === 'Current password is incorrect') {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      res.status(500).json({ message: 'Failed to change password' });
    }
  });

  // GET /api/stores/connected - Get connected stores
  app.get('/api/stores/connected', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const connections = await supabaseStorage.getStoreConnections(userId);
      
      // Transform to match frontend expectations
      const stores = connections.map((conn: any) => ({
        id: conn.id,
        name: conn.storeName,
        platform: conn.platform,
        status: conn.status,
        url: conn.storeUrl,
        lastSync: conn.lastSync || '2 hours ago' // placeholder
      }));
      
      res.json(stores);
    } catch (error) {
      console.error('Get connected stores error:', error);
      res.status(500).json({ message: 'Failed to get connected stores' });
    }
  });

  // POST /api/stores/:id/connect - Connect a store
  app.post('/api/stores/:id/connect', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id } = req.params;
      
      // Update store connection status to 'connected'
      await supabaseStorage.updateStoreConnection(id, { status: 'connected' });
      
      res.json({ success: true, message: 'Store connected successfully' });
    } catch (error) {
      console.error('Connect store error:', error);
      res.status(500).json({ message: 'Failed to connect store' });
    }
  });

  // POST /api/stores/:id/disconnect - Disconnect a store
  app.post('/api/stores/:id/disconnect', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id } = req.params;
      
      // Update store connection status to 'disconnected'
      await supabaseStorage.updateStoreConnection(id, { status: 'disconnected' });
      
      res.json({ success: true, message: 'Store disconnected successfully' });
    } catch (error) {
      console.error('Disconnect store error:', error);
      res.status(500).json({ message: 'Failed to disconnect store' });
    }
  });

  // POST /api/translate - AI Translation using GPT-4o-mini
  app.post('/api/translate', requireAuth, async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      
      if (!text || !targetLanguage) {
        return res.status(400).json({ message: 'Text and target language are required' });
      }

      // Use OpenAI GPT-4o-mini for translation
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the given text to ${targetLanguage}. Return only the translated text without any additional explanations.`
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      });

      const translatedText = completion.choices[0]?.message?.content || 'Translation unavailable';
      
      res.json({ translatedText });
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ 
        message: 'Translation failed',
        translatedText: 'Translation preview unavailable' 
      });
    }
  });

  // ===== SETTINGS ROUTES =====
  
  // Helper function to redact sensitive data from responses
  const redactSensitiveData = (entity: any, type: 'integration' | 'security') => {
    if (!entity) return entity;
    
    const redacted = { ...entity };
    
    if (type === 'integration') {
      delete redacted.credentials; // Never expose credentials
    } else if (type === 'security') {
      delete redacted.twoFactorSecret; // Never expose 2FA secrets
      delete redacted.backupCodes; // Never expose backup codes
    }
    
    return redacted;
  };
  
  // User Preferences Routes
  app.get('/api/settings/preferences', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const preferences = await storage.getUserPreferences(userId);
      if (!preferences) {
        // Create default preferences if they don't exist
        const defaultPreferences = await storage.createUserPreferences({
          userId,
          aiSettings: {
            defaultBrandVoice: "professional",
            autoSaveOutputs: true,
            contentStyle: "seo",
            performanceMode: "balanced"
          },
          notificationSettings: {
            email: true,
            inApp: true,
            push: true,
            aiRecommendations: true
          },
          uiPreferences: {
            theme: "dark",
            language: "en"
          },
          privacySettings: {
            dataSharing: false,
            analyticsOptOut: false
          }
        });
        return res.json(defaultPreferences);
      }
      res.json(preferences);
    } catch (error) {
      console.error('Get user preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/settings/preferences', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const updates = insertUserPreferencesSchema.partial().parse(req.body);
      
      // Convert camelCase to snake_case for Supabase columns
      const dbUpdates: any = {};
      if (updates.aiSettings !== undefined) dbUpdates.ai_settings = updates.aiSettings;
      if (updates.notificationSettings !== undefined) dbUpdates.notification_settings = updates.notificationSettings;
      if (updates.uiPreferences !== undefined) dbUpdates.ui_preferences = updates.uiPreferences;
      if (updates.privacySettings !== undefined) dbUpdates.privacy_settings = updates.privacySettings;
      
      const preferences = await supabaseStorage.updateUserPreferences(userId, dbUpdates);
      res.json(preferences);
    } catch (error) {
      console.error('Update user preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Integration Settings Routes
  app.get('/api/settings/integrations', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const integrations = await storage.getIntegrationSettings(userId);
      // Redact sensitive credentials from response
      const safeIntegrations = integrations.map(integration => ({
        ...integration,
        credentials: undefined // Never expose credentials to frontend
      }));
      res.json(safeIntegrations);
    } catch (error) {
      console.error('Get integration settings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/settings/integrations', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const data = insertIntegrationSettingsSchema.parse({ ...req.body, userId });
      const integration = await supabaseStorage.createIntegrationSettings(data);
      // Redact sensitive data from response
      const safeIntegration = redactSensitiveData(integration, 'integration');
      res.json(safeIntegration);
    } catch (error) {
      console.error('Create integration settings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/settings/integrations/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Check ownership
      const existing = await supabaseStorage.getIntegrationSettings(userId);
      const ownedIntegration = existing.find(i => i.id === id);
      if (!ownedIntegration) {
        return res.status(404).json({ error: 'Integration not found' });
      }
      
      const updates = insertIntegrationSettingsSchema.partial().omit({ userId: true }).parse(req.body);
      const integration = await supabaseStorage.updateIntegrationSettings(id, updates);
      // Redact credentials from response
      const safeIntegration = { ...integration, credentials: undefined };
      res.json(safeIntegration);
    } catch (error) {
      console.error('Update integration settings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/settings/integrations/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Check ownership
      const existing = await supabaseStorage.getIntegrationSettings(userId);
      const ownedIntegration = existing.find(i => i.id === id);
      if (!ownedIntegration) {
        return res.status(404).json({ error: 'Integration not found' });
      }
      
      // TODO: Implement deleteIntegrationSettings method
      // await supabaseStorage.deleteIntegrationSettings(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete integration settings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Twilio Verify Credentials (for merchant connection)
  app.post('/api/twilio/verify', requireAuth, async (req, res) => {
    try {
      const { accountSid, authToken, phoneNumber } = req.body;

      if (!accountSid || !authToken || !phoneNumber) {
        return res.status(400).json({
          valid: false,
          error: 'Account SID, Auth Token, and Phone Number are required'
        });
      }

      // Validate Account SID format
      if (!accountSid.startsWith('AC') || accountSid.length !== 34) {
        return res.status(400).json({
          valid: false,
          error: 'Invalid Account SID format. It should start with "AC" and be 34 characters long.'
        });
      }

      // Validate phone number format
      if (!phoneNumber.startsWith('+')) {
        return res.status(400).json({
          valid: false,
          error: 'Phone number must include country code (e.g., +1234567890)'
        });
      }

      try {
        // Verify credentials by making a test API call to Twilio
        const twilio = await import('twilio');
        const client = twilio.default(accountSid, authToken);
        
        // Fetch account info to verify credentials
        const account = await client.api.accounts(accountSid).fetch();
        
        if (account.status !== 'active') {
          return res.json({
            valid: false,
            error: `Twilio account is ${account.status}. Please activate your account.`
          });
        }

        // Verify the phone number belongs to this account
        try {
          const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({ phoneNumber });
          if (incomingPhoneNumbers.length === 0) {
            return res.json({
              valid: false,
              error: 'This phone number is not associated with your Twilio account.'
            });
          }
        } catch (phoneError: any) {
          // Phone number lookup might fail for various reasons, log but don't block
          console.warn('Twilio phone number verification warning:', phoneError.message);
        }

        res.json({
          valid: true,
          accountName: account.friendlyName,
          accountStatus: account.status
        });
      } catch (twilioError: any) {
        console.error('Twilio verification failed:', twilioError.message);
        
        if (twilioError.code === 20003) {
          return res.json({
            valid: false,
            error: 'Invalid Account SID or Auth Token. Please check your credentials.'
          });
        }
        
        return res.json({
          valid: false,
          error: twilioError.message || 'Failed to verify Twilio credentials'
        });
      }
    } catch (error: any) {
      console.error('Twilio verify error:', error);
      res.status(500).json({
        valid: false,
        error: 'Failed to verify Twilio credentials'
      });
    }
  });

  // Twilio Status Check (checks merchant's saved credentials in database)
  app.get('/api/twilio/status', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Check if merchant has saved Twilio credentials in database
      const integrations = await supabaseStorage.getIntegrationSettings(userId);
      const twilioIntegration = integrations.find(i => i.provider === 'twilio' && i.isActive);
      
      if (twilioIntegration && twilioIntegration.credentials) {
        const creds = twilioIntegration.credentials as any;
        const hasAccountSid = !!creds.accountSid;
        const hasAuthToken = !!creds.authToken;
        const hasPhoneNumber = !!creds.phoneNumber;
        
        res.json({
          isConnected: hasAccountSid && hasAuthToken && hasPhoneNumber,
          isConfigured: true,
          hasAccountSid,
          hasAuthToken,
          hasPhoneNumber,
          phoneNumber: hasPhoneNumber ? creds.phoneNumber.replace(/\d(?=\d{4})/g, '*') : null,
          source: 'database'
        });
        return;
      }
      
      // Fallback: Check environment variables (platform-level config)
      const hasTwilioAccountSid = !!process.env.TWILIO_ACCOUNT_SID;
      const hasTwilioAuthToken = !!process.env.TWILIO_AUTH_TOKEN;
      const hasTwilioPhoneNumber = !!process.env.TWILIO_PHONE_NUMBER;
      
      const isConfigured = hasTwilioAccountSid && hasTwilioAuthToken && hasTwilioPhoneNumber;
      
      res.json({
        isConnected: isConfigured,
        isConfigured,
        hasAccountSid: hasTwilioAccountSid,
        hasAuthToken: hasTwilioAuthToken,
        hasPhoneNumber: hasTwilioPhoneNumber,
        phoneNumber: hasTwilioPhoneNumber ? process.env.TWILIO_PHONE_NUMBER?.replace(/\d(?=\d{4})/g, '*') : null,
        source: isConfigured ? 'environment' : 'none'
      });
    } catch (error: any) {
      console.error('Twilio status check error:', error);
      res.status(500).json({ 
        error: 'Failed to check Twilio status',
        isConnected: false,
        isConfigured: false
      });
    }
  });

  // SendGrid Status Check
  app.get('/api/sendgrid/status', requireAuth, async (req, res) => {
    try {
      const hasSendGridApiKey = !!process.env.SENDGRID_API_KEY;
      const hasSendGridFromEmail = !!process.env.SENDGRID_FROM_EMAIL;
      
      const isConfigured = hasSendGridApiKey;
      
      res.json({
        isConnected: isConfigured,
        isConfigured,
        hasApiKey: hasSendGridApiKey,
        hasFromEmail: hasSendGridFromEmail,
        fromEmail: hasSendGridFromEmail ? process.env.SENDGRID_FROM_EMAIL?.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null
      });
    } catch (error: any) {
      console.error('SendGrid status check error:', error);
      res.status(500).json({ 
        error: 'Failed to check SendGrid status',
        isConnected: false,
        isConfigured: false
      });
    }
  });

  // Security Settings Routes
  app.get('/api/settings/security', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const security = await storage.getSecuritySettings(userId);
      if (!security) {
        // Create default security settings if they don't exist
        const defaultSecurity = await storage.createSecuritySettings({
          userId,
          twoFactorEnabled: false,
          loginNotifications: true,
          sessionTimeout: 3600
        });
        // Redact sensitive fields
        const safeSecurity = {
          ...defaultSecurity,
          twoFactorSecret: undefined,
          backupCodes: undefined
        };
        return res.json(safeSecurity);
      }
      // Redact sensitive fields from response
      const safeSecurity = {
        ...security,
        twoFactorSecret: undefined,
        backupCodes: undefined
      };
      res.json(safeSecurity);
    } catch (error) {
      console.error('Get security settings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/settings/security', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const updates = insertSecuritySettingsSchema.partial().omit({ userId: true }).parse(req.body);
      const security = await supabaseStorage.updateSecuritySettings(userId, updates);
      // Redact sensitive fields from response
      const safeSecurity = {
        ...security,
        twoFactorSecret: undefined,
        backupCodes: undefined
      };
      res.json(safeSecurity);
    } catch (error) {
      console.error('Update security settings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Login Logs Routes
  app.get('/api/settings/login-logs', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await supabaseStorage.getLoginLogs(userId, limit);
      res.json(logs);
    } catch (error) {
      console.error('Get login logs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Support Tickets Routes
  app.get('/api/settings/support', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const tickets = await supabaseStorage.getSupportTickets(userId);
      res.json(tickets);
    } catch (error) {
      console.error('Get support tickets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/settings/support', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const data = insertSupportTicketSchema.parse({ ...req.body, userId });
      const ticket = await supabaseStorage.createSupportTicket(data);
      res.json(ticket);
    } catch (error) {
      console.error('Create support ticket error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/settings/support/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Check ownership
      const existing = await supabaseStorage.getSupportTickets(userId);
      const ownedTicket = existing.find(t => t.id === id);
      if (!ownedTicket) {
        return res.status(404).json({ error: 'Support ticket not found' });
      }
      
      const updates = insertSupportTicketSchema.partial().omit({ userId: true }).parse(req.body);
      const ticket = await supabaseStorage.updateSupportTicket(id, updates);
      res.json(ticket);
    } catch (error) {
      console.error('Update support ticket error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin Support Ticket Routes
  app.get('/api/admin/support-tickets', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      // Admin-only access
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
      }
      
      // Parse query filters
      const filters = {
        status: req.query.status as string | undefined,
        category: req.query.category as string | undefined,
        priority: req.query.priority as string | undefined,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };
      
      const tickets = await supabaseStorage.getAllSupportTickets(filters);
      res.json(tickets);
    } catch (error) {
      console.error('Admin get support tickets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/admin/support-tickets/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      // Admin-only access
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
      }
      
      const ticket = await supabaseStorage.getSupportTicketById(req.params.id);
      res.json(ticket);
    } catch (error) {
      console.error('Admin get support ticket error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/admin/support-tickets/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      // Admin-only access
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
      }
      
      // Validate updates (allow status, priority, category updates)
      const updates = insertSupportTicketSchema
        .partial()
        .omit({ userId: true })
        .parse(req.body);
      
      const ticket = await supabaseStorage.updateSupportTicket(req.params.id, updates);
      res.json(ticket);
    } catch (error) {
      console.error('Admin update support ticket error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI Generation History Routes  
  app.get('/api/settings/ai-history', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const limit = parseInt(req.query.limit as string) || 100;
      const history = await supabaseStorage.getAiGenerationHistory(userId, limit);
      res.json(history);
    } catch (error) {
      console.error('Get AI generation history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI Content Performance Tracking Routes (Self-Learning System)
  // Track when AI-generated content is applied to a product
  app.post('/api/ai-content/track-usage', requireAuth, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { aiGenerationId, productId, contentType } = req.body;

      if (!aiGenerationId || !productId || !contentType) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Create content performance record
      const performance = await storage.createContentPerformance({
        userId,
        aiGenerationId,
        productId,
        contentType
      });

      // Initialize quality score
      await storage.createContentQualityScore({
        userId,
        aiGenerationId,
        readabilityScore: 0,
        seoScore: 0
      });

      res.json({ 
        success: true, 
        performanceId: performance.id,
        message: 'AI content usage tracked successfully' 
      });
    } catch (error: any) {
      console.error('Track AI content usage error:', error);
      res.status(500).json({ message: 'Failed to track content usage' });
    }
  });

  // Update performance metrics for AI-generated content
  app.patch('/api/ai-content/performance/:performanceId', requireAuth, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { performanceId } = req.params;
      const { views, ctr, conversions, revenue, conversionRate } = req.body;

      // Verify ownership - get all content performance for user and find by id
      const allPerformance = await storage.getContentPerformance(userId);
      const existing = allPerformance.find(p => p.id === performanceId);
      
      if (!existing) {
        return res.status(404).json({ message: 'Performance record not found' });
      }

      // Update performance metrics
      const updated = await storage.updateContentPerformance(performanceId, {
        views: views ?? existing.views,
        ctr: ctr ?? existing.ctr,
        conversions: conversions ?? existing.conversions,
        revenue: revenue ?? existing.revenue,
        conversionRate: conversionRate ?? existing.conversionRate
      });

      // Check if performance is high enough to trigger pattern learning
      const conversionRateNum = parseFloat(updated.conversionRate || "0");
      const shouldLearn = (
        (updated.views || 0) >= 100 && 
        conversionRateNum >= 2.0
      );

      if (shouldLearn) {
        // Trigger pattern extraction (in background)
        setImmediate(async () => {
          try {
            const { extractWinningPatterns } = await import('../shared/content-performance-analyzer');
            const pattern = extractWinningPatterns([{
              content: `High performing ${existing.contentType}`,
              performanceScore: updated.performanceScore || 0
            }]);
            
            await storage.createLearningPattern({
              userId,
              category: existing.contentType || 'General',
              patternType: existing.contentType || 'General',
              patternName: `High Converting ${existing.contentType}`,
              patternData: pattern,
              successRate: conversionRateNum.toString(),
              sampleSize: updated.views || 0,
              confidence: ((updated.views || 0) / 1000).toFixed(2)
            });
            
            console.log(`✅ [LEARNING] New pattern extracted from high-performing content (${conversionRateNum}% CVR)`);
          } catch (error) {
            console.error('Pattern extraction error:', error);
          }
        });
      }

      res.json({ 
        success: true, 
        performance: updated,
        learningTriggered: shouldLearn
      });
    } catch (error: any) {
      console.error('Update performance metrics error:', error);
      res.status(500).json({ message: 'Failed to update performance metrics' });
    }
  });

  // Get performance data for a specific AI generation
  app.get('/api/ai-content/performance/:aiGenerationId', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { aiGenerationId } = req.params;

      const performanceList = await storage.getContentPerformance(userId, { aiGenerationId });
      
      if (performanceList.length === 0) {
        return res.status(404).json({ message: 'Performance data not found' });
      }

      res.json(performanceList[0]);
    } catch (error: any) {
      console.error('Get performance data error:', error);
      res.status(500).json({ message: 'Failed to get performance data' });
    }
  });

  // Get top performing content for learning
  app.get('/api/ai-content/top-performing', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const limit = parseInt(req.query.limit as string) || 10;

      const topContent = await storage.getTopPerformingContent(userId, limit);

      res.json({ 
        success: true,
        topPerformers: topContent,
        insights: {
          averageConversionRate: topContent.reduce((sum, c) => sum + parseFloat(c.conversionRate || "0"), 0) / topContent.length,
          totalRevenue: topContent.reduce((sum, c) => sum + parseFloat(c.revenue || "0"), 0)
        }
      });
    } catch (error: any) {
      console.error('Get top performing content error:', error);
      res.status(500).json({ message: 'Failed to get top performing content' });
    }
  });

  // Get active learning patterns
  app.get('/api/ai-content/learning-patterns', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { category, patternType } = req.query;

      const patterns = await storage.getLearningPatterns(userId, {
        category: category as string,
        patternType: patternType as string
      });

      res.json({ 
        success: true,
        patterns,
        count: patterns.length
      });
    } catch (error: any) {
      console.error('Get learning patterns error:', error);
      res.status(500).json({ message: 'Failed to get learning patterns' });
    }
  });

  // Manually trigger pattern learning from successful content
  app.post('/api/ai-content/learn-patterns', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { minConversionRate = 2.0, minViews = 100 } = req.body;

      // Get top performing content
      const topContent = await storage.getTopPerformingContent(userId, 50);
      
      // Filter by thresholds
      const qualifying = topContent.filter(c => 
        parseFloat(c.conversionRate || "0") >= minConversionRate &&
        (c.views || 0) >= minViews
      );

      const { extractWinningPatterns } = await import('../shared/content-performance-analyzer');
      const patternsCreated = [];

      for (const content of qualifying) {
        try {
          const pattern = extractWinningPatterns([{
            content: `High performing ${content.contentType}`,
            performanceScore: content.performanceScore || 0
          }]);
          const conversionRate = parseFloat(content.conversionRate || "0");
          
          const created = await storage.createLearningPattern({
            userId,
            category: content.contentType || 'General',
            patternType: content.contentType || 'General',
            patternName: `High Converting ${content.contentType}`,
            patternData: pattern,
            successRate: conversionRate.toString(),
            sampleSize: content.views || 0,
            confidence: ((content.views || 0) / 1000).toFixed(2)
          });
          
          patternsCreated.push(created);
        } catch (error) {
          console.error('Pattern creation error:', error);
        }
      }

      res.json({ 
        success: true,
        patternsLearned: patternsCreated.length,
        patterns: patternsCreated,
        message: `Successfully learned ${patternsCreated.length} new patterns from ${qualifying.length} high-performing content pieces`
      });
    } catch (error: any) {
      console.error('Learn patterns error:', error);
      res.status(500).json({ message: 'Failed to learn patterns' });
    }
  });

  // CSV Import/Export Routes
  app.get('/api/products/export-csv', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const products = await supabaseStorage.getProducts(userId);
      
      const csvHeaders = ['ID', 'Name', 'Description', 'Price', 'Tags', 'Image URL', 'Category', 'Created At'];
      const csvRows = products.map(p => [
        p.id,
        p.name || '',
        p.description || '',
        p.price?.toString() || '',
        Array.isArray(p.tags) ? p.tags.join(';') : '',
        p.image || '',
        p.category || '',
        p.createdAt?.toISOString() || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="products_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({ error: 'Failed to export products' });
    }
  });

  app.post('/api/products/import-csv', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const file = (req as any).file;

      if (!file) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
      }

      const imported = [];
      const errors = [];
      const products: any[] = [];

      // Parse CSV file
      const stream = require('stream');
      const bufferStream = new stream.PassThrough();
      bufferStream.end(file.buffer);

      await new Promise((resolve, reject) => {
        bufferStream
          .pipe(csvParser())
          .on('data', (row: any) => {
            products.push(row);
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // Import each product
      for (const productData of products) {
        try {
          // Map CSV columns to product schema
          const productPayload = {
            name: productData.Name || productData.name || productData.Title || productData.title,
            description: productData.Description || productData.description || '',
            price: productData.Price || productData.price || '0',
            category: productData.Category || productData.category || 'general',
            userId,
            stock: parseInt(productData.Stock || productData.stock) || 0,
            tags: productData.Tags || productData.tags 
              ? (typeof productData.Tags === 'string' ? productData.Tags.split(';') : productData.tags.split(';'))
              : [],
            image: productData['Image URL'] || productData.image || productData.Image || ''
          };
          const product = await supabaseStorage.createProduct(productPayload as any);
          imported.push(product);
        } catch (error) {
          errors.push({ 
            product: productData, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      res.json({
        success: true,
        imported: imported.length,
        errors: errors.length,
        details: { imported, errors }
      });
    } catch (error) {
      console.error('CSV import error:', error);
      res.status(500).json({ error: 'Failed to import products', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // ===== SHOPIFY OAUTH INTEGRATION =====
  
  // Helper function to get the correct base URL for OAuth redirects
  const getBaseUrl = () => {
    // Use production domain if set (e.g., https://zzyraai.com)
    if (process.env.PRODUCTION_DOMAIN) {
      return process.env.PRODUCTION_DOMAIN;
    }
    
    // Fall back to Replit domain for development
    const replitDomains = process.env.REPLIT_DOMAINS || process.env.REPLIT_DOMAIN;
    if (replitDomains) {
      return `https://${replitDomains.split(',')[0].trim()}`;
    }
    
    // Final fallback to legacy Replit URL format
    return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  };
  
  // Helper endpoint to get the redirect URI that needs to be configured in Shopify
  app.get('/api/shopify/redirect-uri', (req, res) => {
    const baseUrl = getBaseUrl();
    const redirectUri = `${baseUrl}/api/shopify/callback`;
    
    // Get both production and dev URLs for reference
    const productionUrl = process.env.PRODUCTION_DOMAIN 
      ? `${process.env.PRODUCTION_DOMAIN}/api/shopify/callback`
      : null;
    
    const replitDomain = process.env.REPLIT_DOMAINS || process.env.REPLIT_DOMAIN;
    const devUrl = replitDomain 
      ? `https://${replitDomain.split(',')[0].trim()}/api/shopify/callback`
      : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/shopify/callback`;
    
    res.json({ 
      redirectUri,
      currentEnvironment: process.env.PRODUCTION_DOMAIN ? 'production' : 'development',
      productionUrl,
      devUrl,
      instructions: 'Add this URL to your Shopify App settings under "App setup" > "URLs" > "Allowed redirection URL(s)". For best results, add both production and development URLs.'
    });
  });
  
  // Validation endpoint to check Shopify setup
  app.get('/api/shopify/validate-setup', requireAuth, (req, res) => {
    try {
      const checks = {
        hasApiKey: !!process.env.SHOPIFY_API_KEY,
        hasApiSecret: !!process.env.SHOPIFY_API_SECRET,
        hasProductionDomain: !!process.env.PRODUCTION_DOMAIN,
        currentEnvironment: process.env.PRODUCTION_DOMAIN ? 'production' : 'development'
      };
      
      const baseUrl = getBaseUrl();
      const redirectUri = `${baseUrl}/api/shopify/callback`;
      
      const productionUrl = process.env.PRODUCTION_DOMAIN 
        ? `${process.env.PRODUCTION_DOMAIN}/api/shopify/callback`
        : null;
      
      const replitDomain = process.env.REPLIT_DOMAINS || process.env.REPLIT_DOMAIN;
      const devUrl = replitDomain 
        ? `https://${replitDomain.split(',')[0].trim()}/api/shopify/callback`
        : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/shopify/callback`;
      
      const isReady = checks.hasApiKey && checks.hasApiSecret;
      
      const issues = [];
      if (!checks.hasApiKey) {
        issues.push('Missing SHOPIFY_API_KEY environment variable');
      }
      if (!checks.hasApiSecret) {
        issues.push('Missing SHOPIFY_API_SECRET environment variable');
      }
      
      const nextSteps = [];
      if (!isReady) {
        nextSteps.push('Add SHOPIFY_API_KEY and SHOPIFY_API_SECRET to your environment variables');
      }
      nextSteps.push(`Add ${redirectUri} to your Shopify app's allowed redirect URLs`);
      if (productionUrl && devUrl && productionUrl !== devUrl) {
        nextSteps.push(`For testing, also add ${devUrl} to allowed redirect URLs`);
      }
      
      res.json({
        ready: isReady,
        checks,
        redirectUri,
        productionUrl,
        devUrl,
        issues,
        nextSteps,
        shopifyAppUrl: 'https://partners.shopify.com/organizations'
      });
    } catch (error: any) {
      console.error('Shopify validation error:', error);
      res.status(500).json({ 
        error: 'Failed to validate Shopify setup',
        message: error.message 
      });
    }
  });
  
  /**
   * Normalize Shopify shop domain to the permanent .myshopify.com format
   * Required by Shopify 2025 OAuth rules - OAuth must use permanent domain, not admin.shopify.com
   */
  function normalizeShopDomain(shop: string): string {
    // Remove whitespace and convert to lowercase
    let normalized = shop.trim().toLowerCase();
    
    // Handle admin.shopify.com/store/{shop} pattern (Shopify admin URL format)
    if (normalized.includes('admin.shopify.com/store/')) {
      const storeMatch = normalized.match(/store\/([a-z0-9-]+)/i);
      if (storeMatch && storeMatch[1]) {
        normalized = `${storeMatch[1]}.myshopify.com`;
        console.log(`🔄 Converted admin URL to permanent domain: ${shop} → ${normalized}`);
        return normalized;
      }
    }
    
    // Remove protocol (http:// or https://)
    normalized = normalized.replace(/^https?:\/\//, '');
    
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    
    // If the domain doesn't already end with .myshopify.com, append it
    if (!normalized.endsWith('.myshopify.com')) {
      // Extract just the shop name if there's any domain
      const shopName = normalized.split('.')[0];
      normalized = `${shopName}.myshopify.com`;
    }
    
    return normalized;
  }

  // Cleanup expired OAuth states every 10 minutes
  setInterval(async () => {
    try {
      const now = new Date();
      const result = await db
        .delete(oauthStates)
        .where(sql`${oauthStates.expiresAt} < ${now}`)
        .returning();
      if (result.length > 0) {
        console.log(`🧹 Cleaned up ${result.length} expired OAuth states`);
      }
    } catch (error) {
      console.error('Error cleaning up expired OAuth states:', error);
    }
  }, 10 * 60 * 1000);

  // Public OAuth initiation for Shopify App Store installations (no auth required)
  app.get('/api/shopify/install', async (req, res) => {
    try {
      const { shop, hmac, timestamp } = req.query;
      
      if (!shop) {
        return res.status(400).json({ error: 'Shop domain is required' });
      }

      // Normalize shop domain to permanent .myshopify.com format
      const shopDomain = normalizeShopDomain(shop as string);

      // Validate domain format
      if (!/^[a-z0-9-]+\.myshopify\.com$/.test(shopDomain)) {
        return res.status(400).json({ error: 'Invalid Shopify store domain' });
      }

      // REQUIRED: Verify HMAC for security (prevents unauthorized OAuth initiation)
      if (!hmac || !timestamp) {
        console.error('Missing HMAC or timestamp - possible attack attempt');
        return res.status(403).json({ error: 'Missing required security parameters' });
      }

      // Import crypto once at the top of this block
      const crypto = await import('crypto');
      // IMPORTANT: Trim whitespace/newlines - Vercel preserves trailing chars in env vars
      const apiSecret = (process.env.SHOPIFY_API_SECRET || '').trim();
      
      if (!apiSecret) {
        console.error('❌ SHOPIFY_API_SECRET not configured');
        return res.status(500).json({ error: 'Server configuration error' });
      }
      
      // Validate timestamp freshness (prevent replay attacks)
      const requestTime = parseInt(timestamp as string, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      const TIMESTAMP_TOLERANCE = 300; // 5 minutes
      
      if (Math.abs(currentTime - requestTime) > TIMESTAMP_TOLERANCE) {
        console.error('Timestamp too old - possible replay attack. Request time:', requestTime, 'Current:', currentTime);
        return res.status(403).json({ error: 'Request timestamp expired' });
      }
      
      // HMAC Verification Helper - Shopify OAuth HMAC verification
      // CRITICAL: Shopify signs the raw query string in original order, not sorted!
      const verifyShopifyHmac = (providedHmac: string, queryParams: Record<string, string>, secret: string): { valid: boolean; method: string; computed: string; allAttempts: Array<{method: string; message: string; computed: string}> } => {
        const allAttempts: Array<{method: string; message: string; computed: string}> = [];
        
        // Safe comparison using timing-safe equal
        const safeCompare = (a: string, b: string): boolean => {
          if (a.length !== b.length) return false;
          try {
            return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
          } catch {
            return a === b;
          }
        };
        
        // Get raw query string from URL
        const rawUrl = req.originalUrl || req.url;
        const queryStringStart = rawUrl.indexOf('?');
        const rawQueryString = queryStringStart !== -1 ? rawUrl.substring(queryStringStart + 1) : '';
        
        // METHOD 1 (PRIMARY): Raw query string in ORIGINAL ORDER, just filter hmac/signature
        // This is how Shopify actually signs - exact bytes, original order, no sorting
        // IMPORTANT: Keep ALL parts including empty values (e.g., "scope=") to preserve byte order
        // ALSO filter out 'path' and 'shopify_verification' which Vercel adds but Shopify doesn't sign
        const excludeParams = ['hmac', 'signature', 'path', 'shopify_verification'];
        const rawPartsOriginalOrder: string[] = [];
        for (const part of rawQueryString.split('&')) {
          if (!part) continue; // Skip empty parts from double &&
          const eqIndex = part.indexOf('=');
          // Handle both "key=value" and "key" (no equals) forms
          const rawKey = eqIndex !== -1 ? part.substring(0, eqIndex) : part;
          if (excludeParams.includes(rawKey)) continue;
          rawPartsOriginalOrder.push(part); // Keep entire part as-is (preserves empty values)
        }
        const message1 = rawPartsOriginalOrder.join('&');
        const computed1 = crypto.createHmac('sha256', secret).update(message1).digest('hex');
        allAttempts.push({ method: 'raw-original-order', message: message1, computed: computed1 });
        
        if (safeCompare(computed1, providedHmac)) {
          return { valid: true, method: 'raw-original-order', computed: computed1, allAttempts };
        }
        
        // METHOD 2: Standard Shopify HMAC (decoded values, sorted alphabetically)
        // Per older Shopify docs: Remove hmac, sort remaining params alphabetically, join with &
        const sortedKeys = Object.keys(queryParams)
          .filter(key => !excludeParams.includes(key))
          .sort();
        
        const message2 = sortedKeys.map(key => `${key}=${queryParams[key]}`).join('&');
        const computed2 = crypto.createHmac('sha256', secret).update(message2).digest('hex');
        allAttempts.push({ method: 'sorted-decoded', message: message2, computed: computed2 });
        
        if (safeCompare(computed2, providedHmac)) {
          return { valid: true, method: 'sorted-decoded', computed: computed2, allAttempts };
        }
        
        // METHOD 3: Raw query string sorted (encoded values preserved, sorted by raw key)
        const rawPairs: Array<{ key: string; value: string; original: string }> = [];
        for (const part of rawQueryString.split('&')) {
          if (!part) continue;
          const eqIndex = part.indexOf('=');
          const rawKey = eqIndex !== -1 ? part.substring(0, eqIndex) : part;
          const rawValue = eqIndex !== -1 ? part.substring(eqIndex + 1) : '';
          if (excludeParams.includes(rawKey)) continue;
          rawPairs.push({ key: rawKey, value: rawValue, original: part });
        }
        rawPairs.sort((a, b) => a.key.localeCompare(b.key));
        // Reconstruct using original format (handles both key=value and key forms)
        const message3 = rawPairs.map(p => p.original.includes('=') ? `${p.key}=${p.value}` : p.key).join('&');
        const computed3 = crypto.createHmac('sha256', secret).update(message3).digest('hex');
        allAttempts.push({ method: 'raw-sorted', message: message3, computed: computed3 });
        
        if (safeCompare(computed3, providedHmac)) {
          return { valid: true, method: 'raw-sorted', computed: computed3, allAttempts };
        }
        
        // METHOD 4: Fully decoded, original order
        const decodedOriginalOrder: string[] = [];
        for (const part of rawQueryString.split('&')) {
          if (!part) continue;
          const eqIndex = part.indexOf('=');
          const rawKey = eqIndex !== -1 ? part.substring(0, eqIndex) : part;
          const rawValue = eqIndex !== -1 ? part.substring(eqIndex + 1) : '';
          const decodedKey = decodeURIComponent(rawKey);
          if (excludeParams.includes(decodedKey)) continue;
          const decodedValue = decodeURIComponent(rawValue.replace(/\+/g, ' '));
          decodedOriginalOrder.push(eqIndex !== -1 ? `${decodedKey}=${decodedValue}` : decodedKey);
        }
        const message4 = decodedOriginalOrder.join('&');
        const computed4 = crypto.createHmac('sha256', secret).update(message4).digest('hex');
        allAttempts.push({ method: 'decoded-original-order', message: message4, computed: computed4 });
        
        if (safeCompare(computed4, providedHmac)) {
          return { valid: true, method: 'decoded-original-order', computed: computed4, allAttempts };
        }
        
        return { valid: false, method: 'none', computed: computed1, allAttempts };
      };
      
      // Build query params from Express parsed query
      const queryParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          queryParams[key] = value;
        }
      }
      
      const hmacResult = verifyShopifyHmac(hmac as string, queryParams, apiSecret);
      
      // Debug logging - controlled by SHOPIFY_HMAC_DEBUG env var (set to 'true' for verbose logging)
      const hmacDebug = process.env.SHOPIFY_HMAC_DEBUG === 'true';
      
      console.log('🔐 [HMAC INSTALL]', hmacResult.valid ? '✅ VALID' : '❌ FAILED', 
        `shop=${shopDomain} method=${hmacResult.method}`);
      
      if (hmacDebug) {
        console.log('  [DEBUG] Timestamp:', timestamp, '| Current:', currentTime);
        console.log('  [DEBUG] API Secret length:', apiSecret.length);
        console.log('  [DEBUG] Query params:', Object.keys(queryParams).filter(k => k !== 'hmac').join(', '));
        console.log('  [DEBUG] HMAC provided:', (hmac as string).substring(0, 16) + '...');
        for (const attempt of hmacResult.allAttempts) {
          const match = attempt.computed === (hmac as string) ? '✅' : '❌';
          console.log(`  [DEBUG] ${match} ${attempt.method}: computed=${attempt.computed.substring(0, 16)}...`);
        }
      }
      
      if (!hmacResult.valid) {
        console.error('❌ HMAC verification failed during installation for shop:', shopDomain);
        console.error('  All verification methods failed. Check that SHOPIFY_API_SECRET matches your Shopify Partner Dashboard.');
        return res.status(403).json({ 
          error: 'HMAC verification failed - invalid signature',
          debug: {
            providedHmac: (hmac as string).substring(0, 16) + '...',
            computedHmac: hmacResult.computed.substring(0, 16) + '...',
            message: 'Ensure SHOPIFY_API_SECRET matches your Shopify app Client Secret'
          }
        });
      }
      
      console.log('✅ HMAC verified successfully for installation from:', shopDomain, '(method:', hmacResult.method + ')');
      
      const apiKey = process.env.SHOPIFY_API_KEY;
      
      // Get base URL using helper function (handles production domain)
      const baseUrl = getBaseUrl();
      const redirectUri = `${baseUrl}/api/shopify/callback`;
      // Comprehensive scopes for AI-powered features
      const scopes = 'read_products,write_products,read_inventory,read_customers,read_orders,read_checkouts,read_marketing_events,write_marketing_events,read_analytics,read_reports,read_locales';
      
      // Generate secure nonce (reuse crypto module from above)
      const state = crypto.randomBytes(32).toString('hex');
      
      // Store state in database with expiration (10 minutes)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await db.insert(oauthStates).values({
        state,
        userId: null, // Will be filled after user logs in/signs up
        shopDomain,
        expiresAt
      });
      
      const authUrl = `https://${shopDomain}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
      
      res.json({ authUrl });
    } catch (error) {
      console.error('Shopify installation OAuth error:', error);
      res.status(500).json({ error: 'Failed to initiate Shopify OAuth' });
    }
  });

  // Initiate Shopify OAuth flow (authenticated users)
  app.post('/api/shopify/auth', requireAuth, apiLimiter, async (req, res) => {
    console.log('🔵 [SHOPIFY AUTH] POST /api/shopify/auth endpoint hit');
    console.log('🔵 [SHOPIFY AUTH] Request body:', req.body);
    console.log('🔵 [SHOPIFY AUTH] User ID:', (req as AuthenticatedRequest).user?.id);
    console.log('🔵 [SHOPIFY AUTH] DB object check:', {
      dbDefined: db !== undefined,
      dbType: typeof db,
      hasInsert: db && typeof db.insert === 'function'
    });
    
    try {
      const { shop } = req.body;
      const userId = (req as AuthenticatedRequest).user.id;
      
      console.log('🔵 [SHOPIFY AUTH] Processing for shop:', shop, 'userId:', userId);
      
      // Safety check for database
      if (!db) {
        throw new Error('Database connection not available. Please check DATABASE_URL environment variable.');
      }
      
      // Check if Shopify credentials are configured
      if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) {
        console.error('❌ [SHOPIFY AUTH] Missing API credentials');
        console.error('   - SHOPIFY_API_KEY present:', !!process.env.SHOPIFY_API_KEY);
        console.error('   - SHOPIFY_API_SECRET present:', !!process.env.SHOPIFY_API_SECRET);
        return res.status(500).json({ 
          error: 'Shopify integration not configured. Please add SHOPIFY_API_KEY and SHOPIFY_API_SECRET to your environment variables.' 
        });
      }
      
      if (!shop) {
        return res.status(400).json({ error: 'Shop domain is required' });
      }

      // Normalize shop domain to permanent .myshopify.com format (Shopify 2025 OAuth requirement)
      const shopDomain = normalizeShopDomain(shop);

      // Validate domain format
      if (!/^[a-z0-9-]+\.myshopify\.com$/.test(shopDomain)) {
        return res.status(400).json({ error: 'Invalid Shopify store domain' });
      }
      
      const apiKey = process.env.SHOPIFY_API_KEY;
      
      // Get base URL using helper function (handles production domain)
      const baseUrl = getBaseUrl();
      const redirectUri = `${baseUrl}/api/shopify/callback`;
      
      // Log the exact redirect URI being used for debugging
      console.log('🔍 Shopify OAuth Redirect URI:', redirectUri);
      console.log('🔍 Environment:', {
        PRODUCTION_DOMAIN: process.env.PRODUCTION_DOMAIN,
        REPLIT_DOMAINS: process.env.REPLIT_DOMAINS,
        REPL_SLUG: process.env.REPL_SLUG
      });
      
      // Comprehensive scopes for AI-powered features
      const scopes = 'read_products,write_products,read_inventory,read_customers,read_orders,read_checkouts,read_marketing_events,write_marketing_events,read_analytics,read_reports,read_locales';
      
      // Generate secure nonce using crypto (32 bytes = 256 bits)
      const crypto = await import('crypto');
      const state = crypto.randomBytes(32).toString('hex');
      
      // Store state in database with expiration (10 minutes)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      console.log('🔵 [SHOPIFY AUTH] Storing OAuth state in database:', {
        state: state.substring(0, 10) + '...',
        userId,
        shopDomain,
        expiresAt
      });
      
      try {
        await db.insert(oauthStates).values({
          state,
          userId,
          shopDomain,
          expiresAt
        });
        console.log('✅ [SHOPIFY AUTH] OAuth state stored successfully');
      } catch (dbError) {
        console.error('❌ [SHOPIFY AUTH] Database insert failed:', dbError);
        throw dbError;
      }
      
      // Shopify 2025 OAuth URL format: https://admin.shopify.com/store/{shop-name}/oauth/authorize
      // Extract shop name from domain (e.g., "anthor-ai" from "anthor-ai.myshopify.com")
      const shopName = shopDomain.replace('.myshopify.com', '');
      const authUrl = `https://admin.shopify.com/store/${shopName}/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
      
      // Detailed OAuth URL logging for troubleshooting (mask sensitive data)
      console.log('🚀 Generated Shopify OAuth URL (2025 format) for shop:', shopDomain);
      console.log('📋 OAuth Parameters:');
      console.log('  - Shop Domain:', shopDomain);
      console.log('  - Shop Name:', shopName);
      console.log('  - Client ID:', apiKey ? `${apiKey.substring(0, 8)}...` : 'undefined');
      console.log('  - Redirect URI:', redirectUri);
      console.log('  - Redirect URI (encoded):', encodeURIComponent(redirectUri));
      console.log('  - Scopes:', scopes);
      console.log('  - State length:', state.length);
      console.log('  - Auth URL (masked):', `https://admin.shopify.com/store/${shopName}/oauth/authorize?client_id=${apiKey.substring(0, 8)}...&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=...`);
      console.log('✅ [SHOPIFY AUTH] OAuth initiated successfully, sending response');
      
      res.json({ authUrl, redirectUri }); // Include redirectUri in response for debugging
    } catch (error) {
      console.error('❌ [SHOPIFY AUTH] OAuth initiation error:', error);
      console.error('❌ [SHOPIFY AUTH] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to initiate Shopify OAuth' 
      });
    }
  });

  // Handle Shopify OAuth callback
  app.get('/api/shopify/callback', async (req, res) => {
    console.log('\n🔵 ========================================');
    console.log('🔵 SHOPIFY OAUTH CALLBACK RECEIVED');
    console.log('🔵 ========================================');
    console.log('📥 Query params summary (non-sensitive):', {
      hasCode: !!req.query.code,
      codeLength: req.query.code ? (req.query.code as string).length : 0,
      hasState: !!req.query.state,
      stateLength: req.query.state ? (req.query.state as string).length : 0,
      shop: req.query.shop,
      hasHmac: !!req.query.hmac,
      timestamp: req.query.timestamp,
      hasError: !!req.query.error,
      error: req.query.error || null,
      errorDescription: req.query.error_description || null
    });
    
    // Check for Shopify error responses
    if (req.query.error) {
      console.log('❌ SHOPIFY RETURNED ERROR:');
      console.log('  Error type:', req.query.error);
      console.log('  Description:', req.query.error_description || 'No description');
      console.log('  Shop:', req.query.shop);
      
      const errorCode = req.query.error === 'access_denied' ? 'user_declined' : 'shopify_error';
      
      // Use trusted domain from env - never use req.get('host') for redirects (open redirect vulnerability)
      const baseUrl = getBaseUrl();
      const redirectUrl = `${baseUrl}/settings/integrations?error=${errorCode}`;
      
      console.log('  Redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
    }
    
    try {
      const { code, state, shop, hmac, timestamp } = req.query;
      
      // Step 1: Validate required parameters
      console.log('📋 Step 1: Validating required parameters...');
      if (!code || !state || !shop) {
        console.log('❌ FAILED: Missing required parameters');
        return res.status(400).send('Missing required parameters');
      }
      console.log('✅ All required parameters present');

      // Step 2: Sanitize and validate shop parameter
      console.log('📋 Step 2: Sanitizing shop domain...');
      let shopDomain = (shop as string).trim().toLowerCase();
      
      // Remove protocol if present
      shopDomain = shopDomain.replace(/^https?:\/\//, '');
      console.log('  Shop domain:', shopDomain);
      
      // Validate .myshopify.com format
      if (!shopDomain.endsWith('.myshopify.com')) {
        console.log('❌ FAILED: Invalid shop domain format:', shopDomain);
        return res.status(403).send('Invalid shop domain');
      }
      console.log('✅ Shop domain validated');

      // Step 3: Validate state parameter from database
      console.log('📋 Step 3: Validating OAuth state...');
      const stateRecords = await db
        .select()
        .from(oauthStates)
        .where(eq(oauthStates.state, state as string))
        .limit(1);
      
      if (stateRecords.length === 0) {
        console.log('❌ FAILED: Invalid or expired state parameter');
        return res.status(403).send('Invalid or expired state parameter');
      }
      
      const stateData = stateRecords[0];
      console.log('  State found, userId:', stateData.userId || 'none (fresh install)');

      // Check if state is expired
      const now = new Date();
      if (now > stateData.expiresAt) {
        console.log('❌ FAILED: State parameter expired');
        console.log('  Expired at:', stateData.expiresAt);
        await db.delete(oauthStates).where(eq(oauthStates.state, state as string));
        return res.status(403).send('State parameter expired');
      }
      
      const stateAge = now.getTime() - (stateData.createdAt || new Date()).getTime();
      console.log('  State age:', Math.floor(stateAge / 1000), 'seconds');

      // Validate shop domain matches the one from initiation
      if (shopDomain !== stateData.shopDomain) {
        console.log('❌ FAILED: Shop domain mismatch');
        console.log('  Expected:', stateData.shopDomain);
        console.log('  Got:', shopDomain);
        await db.delete(oauthStates).where(eq(oauthStates.state, state as string));
        return res.status(403).send('Shop domain mismatch');
      }
      console.log('✅ State validated successfully');

      // Step 4: Verify HMAC if present (Shopify includes this for security)
      if (hmac) {
        console.log('📋 Step 4: Verifying HMAC signature...');
        const crypto = await import('crypto');
        // IMPORTANT: Trim whitespace/newlines - Vercel preserves trailing chars in env vars
        const apiSecret = (process.env.SHOPIFY_API_SECRET || '').trim();
        
        if (!apiSecret) {
          console.error('❌ SHOPIFY_API_SECRET not configured');
          await db.delete(oauthStates).where(eq(oauthStates.state, state as string));
          return res.status(500).send('Server configuration error');
        }
        
        // HMAC Verification Helper - Shopify OAuth callback HMAC verification
        // CRITICAL: Shopify signs the raw query string in original order, not sorted!
        const verifyCallbackHmac = (providedHmac: string, queryParams: Record<string, string>, secret: string): { valid: boolean; method: string; computed: string; allAttempts: Array<{method: string; message: string; computed: string}> } => {
          const allAttempts: Array<{method: string; message: string; computed: string}> = [];
          
          // Safe comparison using timing-safe equal
          const safeCompare = (a: string, b: string): boolean => {
            if (a.length !== b.length) return false;
            try {
              return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
            } catch {
              return a === b;
            }
          };
          
          // Get raw query string from URL
          const rawUrl = req.originalUrl || req.url;
          const queryStringStart = rawUrl.indexOf('?');
          const rawQueryString = queryStringStart !== -1 ? rawUrl.substring(queryStringStart + 1) : '';
          
          // METHOD 1 (PRIMARY): Raw query string in ORIGINAL ORDER, just filter hmac/signature
          // This is how Shopify actually signs - exact bytes, original order, no sorting
          // IMPORTANT: Keep ALL parts including empty values (e.g., "scope=") to preserve byte order
          // ALSO filter out 'path' and 'shopify_verification' which Vercel adds but Shopify doesn't sign
          const excludeParams = ['hmac', 'signature', 'path', 'shopify_verification'];
          const rawPartsOriginalOrder: string[] = [];
          for (const part of rawQueryString.split('&')) {
            if (!part) continue; // Skip empty parts from double &&
            const eqIndex = part.indexOf('=');
            // Handle both "key=value" and "key" (no equals) forms
            const rawKey = eqIndex !== -1 ? part.substring(0, eqIndex) : part;
            if (excludeParams.includes(rawKey)) continue;
            rawPartsOriginalOrder.push(part); // Keep entire part as-is (preserves empty values)
          }
          const message1 = rawPartsOriginalOrder.join('&');
          const computed1 = crypto.createHmac('sha256', secret).update(message1).digest('hex');
          allAttempts.push({ method: 'raw-original-order', message: message1, computed: computed1 });
          
          if (safeCompare(computed1, providedHmac)) {
            return { valid: true, method: 'raw-original-order', computed: computed1, allAttempts };
          }
          
          // METHOD 2: Standard Shopify HMAC (decoded values, sorted alphabetically)
          // Per older Shopify docs: Remove hmac, sort remaining params alphabetically, join with &
          const sortedKeys = Object.keys(queryParams)
            .filter(key => !excludeParams.includes(key))
            .sort();
          
          const message2 = sortedKeys.map(key => `${key}=${queryParams[key]}`).join('&');
          const computed2 = crypto.createHmac('sha256', secret).update(message2).digest('hex');
          allAttempts.push({ method: 'sorted-decoded', message: message2, computed: computed2 });
          
          if (safeCompare(computed2, providedHmac)) {
            return { valid: true, method: 'sorted-decoded', computed: computed2, allAttempts };
          }
          
          // METHOD 3: Raw query string sorted (encoded values preserved, sorted by raw key)
          const rawPairs: Array<{ key: string; value: string; original: string }> = [];
          for (const part of rawQueryString.split('&')) {
            if (!part) continue;
            const eqIndex = part.indexOf('=');
            const rawKey = eqIndex !== -1 ? part.substring(0, eqIndex) : part;
            const rawValue = eqIndex !== -1 ? part.substring(eqIndex + 1) : '';
            if (excludeParams.includes(rawKey)) continue;
            rawPairs.push({ key: rawKey, value: rawValue, original: part });
          }
          rawPairs.sort((a, b) => a.key.localeCompare(b.key));
          // Reconstruct using original format (handles both key=value and key forms)
          const message3 = rawPairs.map(p => p.original.includes('=') ? `${p.key}=${p.value}` : p.key).join('&');
          const computed3 = crypto.createHmac('sha256', secret).update(message3).digest('hex');
          allAttempts.push({ method: 'raw-sorted', message: message3, computed: computed3 });
          
          if (safeCompare(computed3, providedHmac)) {
            return { valid: true, method: 'raw-sorted', computed: computed3, allAttempts };
          }
          
          // METHOD 4: Fully decoded, original order
          const decodedOriginalOrder: string[] = [];
          for (const part of rawQueryString.split('&')) {
            if (!part) continue;
            const eqIndex = part.indexOf('=');
            const rawKey = eqIndex !== -1 ? part.substring(0, eqIndex) : part;
            const rawValue = eqIndex !== -1 ? part.substring(eqIndex + 1) : '';
            const decodedKey = decodeURIComponent(rawKey);
            if (excludeParams.includes(decodedKey)) continue;
            const decodedValue = decodeURIComponent(rawValue.replace(/\+/g, ' '));
            decodedOriginalOrder.push(eqIndex !== -1 ? `${decodedKey}=${decodedValue}` : decodedKey);
          }
          const message4 = decodedOriginalOrder.join('&');
          const computed4 = crypto.createHmac('sha256', secret).update(message4).digest('hex');
          allAttempts.push({ method: 'decoded-original-order', message: message4, computed: computed4 });
          
          if (safeCompare(computed4, providedHmac)) {
            return { valid: true, method: 'decoded-original-order', computed: computed4, allAttempts };
          }
          
          return { valid: false, method: 'none', computed: computed1, allAttempts };
        };
        
        // Build query params from Express parsed query
        const callbackQueryParams: Record<string, string> = {};
        for (const [key, value] of Object.entries(req.query)) {
          if (typeof value === 'string') {
            callbackQueryParams[key] = value;
          }
        }
        
        const callbackHmacResult = verifyCallbackHmac(hmac as string, callbackQueryParams, apiSecret);
        
        // Debug logging - controlled by SHOPIFY_HMAC_DEBUG env var (set to 'true' for verbose logging)
        const hmacDebug = process.env.SHOPIFY_HMAC_DEBUG === 'true';
        
        console.log('🔐 [HMAC CALLBACK]', callbackHmacResult.valid ? '✅ VALID' : '❌ FAILED', 
          `shop=${shopDomain} method=${callbackHmacResult.method}`);
        
        if (hmacDebug) {
          console.log('  [DEBUG] API Secret length:', apiSecret.length);
          console.log('  [DEBUG] Query params:', Object.keys(callbackQueryParams).filter(k => k !== 'hmac').join(', '));
          console.log('  [DEBUG] HMAC provided:', (hmac as string).substring(0, 16) + '...');
          for (const attempt of callbackHmacResult.allAttempts) {
            const match = attempt.computed === (hmac as string) ? '✅' : '❌';
            console.log(`  [DEBUG] ${match} ${attempt.method}: computed=${attempt.computed.substring(0, 16)}...`);
          }
        }
        
        if (!callbackHmacResult.valid) {
          console.error('❌ HMAC verification failed for callback from shop:', shopDomain);
          console.error('  All verification methods failed. Check SHOPIFY_API_SECRET.');
          console.error('  Provided HMAC (full):', hmac);
          console.error('  Best computed HMAC (full):', callbackHmacResult.computed);
          await db!.delete(oauthStates).where(eq(oauthStates.state, state as string));
          return res.status(403).send('HMAC verification failed');
        }
        console.log('✅ HMAC verified successfully for callback (method:', callbackHmacResult.method + ')');
      } else {
        console.log('ℹ️  No HMAC in request (optional)');
      }

      // Get userId from validated state (may be empty for fresh installations)
      const userId = stateData.userId;
      const isNewInstallation = !userId || userId === '';
      console.log('  User ID:', userId || 'none');
      console.log('  Installation type:', isNewInstallation ? 'New installation' : 'Existing user');
      
      // Delete state after single use (ensures state can only be used once)
      await db.delete(oauthStates).where(eq(oauthStates.state, state as string));
      console.log('  State deleted (single-use)');

      // Step 5: Exchange code for access token
      console.log('📋 Step 5: Exchanging authorization code for access token...');
      const apiKey = (process.env.SHOPIFY_API_KEY || '').trim();
      // Re-retrieve and trim for token exchange (apiSecret was scoped inside HMAC block)
      const tokenApiSecret = (process.env.SHOPIFY_API_SECRET || '').trim();
      const accessTokenUrl = `https://${shop}/admin/oauth/access_token`;
      console.log('  Token URL:', accessTokenUrl);
      
      const tokenResponse = await fetch(accessTokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: apiKey,
          client_secret: tokenApiSecret,
          code
        })
      });

      console.log('  Token response status:', tokenResponse.status);
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.log('❌ FAILED: Token exchange error');
        console.log('  Response:', errorText);
        throw new Error('Failed to exchange code for access token');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      console.log('✅ Access token received:', accessToken ? `${accessToken.substring(0, 10)}...` : 'none');

      // Step 6: Get shop info
      console.log('📋 Step 6: Fetching shop information...');
      const shopInfoResponse = await fetch(`https://${shop}/admin/api/2025-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken
        }
      });

      console.log('  Shop info response status:', shopInfoResponse.status);
      if (!shopInfoResponse.ok) {
        console.log('❌ FAILED: Could not fetch shop info');
        throw new Error('Failed to fetch shop information');
      }

      const shopInfo = await shopInfoResponse.json();
      const shopName = shopInfo.shop?.name || shop;
      const storeCurrency = shopInfo.shop?.currency || 'USD'; // Extract store currency (INR, USD, EUR, etc.)
      console.log('✅ Shop info received:', { shopName, currency: storeCurrency });

      // Handle new installation without userId (fresh from App Store)
      if (isNewInstallation) {
        console.log('📋 NEW INSTALLATION FLOW: User not logged in');
        // Store pending connection in database temporarily (10 minutes expiration)
        const cryptoModule = await import('crypto');
        const pendingState = cryptoModule.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
        // Store with metadata JSON for pending installation data
        await db.insert(oauthStates).values({
          state: `pending_${pendingState}`,
          userId: null,
          shopDomain,
          expiresAt,
          // Note: metadata would require adding a column, so we'll create a separate pending record
        });
        
        // Store additional pending data as a JSON string in shop_domain field temporarily
        // This is a workaround - ideally we'd have a metadata column
        await db.insert(oauthStates).values({
          state: `pending_meta_${pendingState}`,
          userId: null,
          shopDomain: JSON.stringify({ shopName, accessToken, storeUrl: `https://${shop}`, currency: storeCurrency }),
          expiresAt,
        });
        
        // Redirect to signup page with pending connection info
        const redirectUrl = process.env.PRODUCTION_DOMAIN 
          ? `${process.env.PRODUCTION_DOMAIN}/auth?shopify_install=${pendingState}&shop=${encodeURIComponent(shopName)}`
          : `${req.protocol}://${req.get('host')}/auth?shopify_install=${pendingState}&shop=${encodeURIComponent(shopName)}`;
        
        return res.send(`
          <html>
            <head>
              <meta http-equiv="refresh" content="0;url=${redirectUrl}">
            </head>
            <body>
              <script>
                window.location.href = '${redirectUrl}';
              </script>
              <p>Shopify authorized! Creating your Zyra AI account...</p>
            </body>
          </html>
        `);
      }

      // Step 7: Store connection in database
      console.log('📋 Step 7: Saving connection to database...');
      const existingConnections = await supabaseStorage.getStoreConnections(userId);
      const shopifyConnection = existingConnections.find(conn => conn.platform === 'shopify');

      if (shopifyConnection) {
        console.log('  Updating existing connection:', shopifyConnection.id);
        // Update existing connection
        await supabaseStorage.updateStoreConnection(shopifyConnection.id, {
          storeName: shopName,
          storeUrl: `https://${shop}`,
          accessToken,
          status: 'active',
          lastSyncAt: new Date()
        });
        console.log('✅ Connection updated successfully');
      } else {
        console.log('  Creating new connection for user:', userId);
        // Create new connection
        await supabaseStorage.createStoreConnection({
          userId,
          platform: 'shopify',
          storeName: shopName,
          storeUrl: `https://${shop}`,
          accessToken,
          currency: storeCurrency, // Save store currency for multi-currency display
          status: 'active'
        });
        console.log('✅ Connection created successfully with currency:', storeCurrency);
      }

      // Step 8: Register mandatory Shopify webhooks for compliance
      console.log('📋 Step 8: Registering GDPR webhooks...');
      const { registerShopifyWebhooks } = await import('./lib/shopify-webhooks');
      
      // CRITICAL: Production domain is REQUIRED for Shopify GDPR compliance
      // No fallback is allowed - webhooks MUST use production URLs
      const webhookBaseUrl = process.env.PRODUCTION_DOMAIN;
      if (!webhookBaseUrl) {
        console.error('❌ CRITICAL: PRODUCTION_DOMAIN not configured!');
        console.error('❌ Shopify compliance webhooks will NOT work without this.');
        // Continue with OAuth but warn about webhook failure
      }
      
      console.log('  Webhook base URL:', webhookBaseUrl);
      const webhookResult = await registerShopifyWebhooks(shop as string, accessToken, webhookBaseUrl);
      
      if (webhookResult.success) {
        console.log('✅ All mandatory webhooks registered successfully');
      } else {
        console.log('⚠️  Some webhooks failed to register (non-critical)');
        console.log('  Errors:', webhookResult.errors);
      }

      // Step 9: Redirect user to success page
      console.log('📋 Step 9: Redirecting to success page...');
      const isPopupFlow = req.query.popup === 'true';
      console.log('  Flow type:', isPopupFlow ? 'Popup' : 'Direct redirect');
      
      if (isPopupFlow) {
        // Send success message to parent window (popup flow)
        console.log('  Sending postMessage to parent window');
        res.send(`
          <html>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'shopify-connected', success: true }, window.opener.location.origin);
                  window.close();
                }
              </script>
              <p>Connection successful! You can close this window.</p>
            </body>
          </html>
        `);
      } else {
        // Direct installation from Shopify App Store - redirect to frontend callback
        const redirectUrl = process.env.PRODUCTION_DOMAIN 
          ? `${process.env.PRODUCTION_DOMAIN}/auth/callback?shopify=connected`
          : `${req.protocol}://${req.get('host')}/auth/callback?shopify=connected`;
        
        res.send(`
          <html>
            <head>
              <meta http-equiv="refresh" content="0;url=${redirectUrl}">
            </head>
            <body>
              <script>
                window.location.href = '${redirectUrl}';
              </script>
              <p>Connection successful! Redirecting...</p>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.log('\n❌ ========================================');
      console.log('❌ SHOPIFY OAUTH CALLBACK FAILED');
      console.log('❌ ========================================');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');
      console.log('========================================\n');
      
      // Determine specific error type for better user feedback
      const errorMessage = error instanceof Error ? error.message : String(error);
      let errorCode = 'shopify_connection_failed';
      let userMessage = 'Connection failed. Please try again.';
      
      if (errorMessage.includes('state') || errorMessage.includes('expired')) {
        errorCode = 'state_expired';
        userMessage = 'Session expired. Please try connecting again.';
      } else if (errorMessage.includes('HMAC')) {
        errorCode = 'hmac_failed';
        userMessage = 'Security verification failed. Please try again.';
      } else if (errorMessage.includes('token')) {
        errorCode = 'token_exchange_failed';
        userMessage = 'Failed to authenticate with Shopify. Please check your credentials.';
      } else if (errorMessage.includes('shop')) {
        errorCode = 'shop_info_failed';
        userMessage = 'Could not fetch store information. Please try again.';
      } else if (errorMessage.includes('database') || errorMessage.includes('storage')) {
        errorCode = 'db_save_failed';
        userMessage = 'Failed to save connection. Please try again.';
      }
      
      const isPopupFlow = req.query.popup === 'true';
      
      if (isPopupFlow) {
        res.send(`
          <html>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'shopify-connected', 
                    success: false, 
                    error: '${userMessage}',
                    errorCode: '${errorCode}'
                  }, window.opener.location.origin);
                  window.close();
                }
              </script>
              <p>${userMessage}</p>
            </body>
          </html>
        `);
      } else {
        // Direct installation - redirect to frontend callback with specific error code
        const redirectUrl = process.env.PRODUCTION_DOMAIN 
          ? `${process.env.PRODUCTION_DOMAIN}/auth/callback?shopify_error=${errorCode}`
          : `${req.protocol}://${req.get('host')}/auth/callback?shopify_error=${errorCode}`;
        
        res.send(`
          <html>
            <head>
              <meta http-equiv="refresh" content="0;url=${redirectUrl}">
            </head>
            <body>
              <script>
                window.location.href = '${redirectUrl}';
              </script>
              <p>${userMessage} Redirecting...</p>
            </body>
          </html>
        `);
      }
    }
  });

  // Check Shopify connection status
  app.get('/api/shopify/status', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const connections = await supabaseStorage.getStoreConnections(userId);
      const shopifyConnection = connections.find(c => c.platform === 'shopify' && c.status === 'active');
      
      res.json({ 
        isConnected: !!shopifyConnection,
        connection: shopifyConnection || null
      });
    } catch (error) {
      console.error('Shopify status check error:', error);
      res.status(500).json({ error: 'Failed to check Shopify status' });
    }
  });

  // Associate pending Shopify connection after signup/login
  app.post('/api/shopify/associate-pending', requireAuth, async (req, res) => {
    try {
      const { pendingState } = req.body;
      const userId = (req as AuthenticatedRequest).user.id;
      
      if (!pendingState) {
        return res.status(400).json({ error: 'Pending state required' });
      }

      // Retrieve pending connection data from database
      const pendingKey = `pending_${pendingState}`;
      const pendingMetaKey = `pending_meta_${pendingState}`;
      
      const [pendingRecord, metaRecord] = await Promise.all([
        db.select().from(oauthStates).where(eq(oauthStates.state, pendingKey)).limit(1),
        db.select().from(oauthStates).where(eq(oauthStates.state, pendingMetaKey)).limit(1)
      ]);
      
      if (pendingRecord.length === 0 || metaRecord.length === 0) {
        return res.status(404).json({ error: 'Pending connection not found or expired' });
      }

      // Extract connection details from stored metadata
      const shopDomain = pendingRecord[0].shopDomain;
      const metadata = JSON.parse(metaRecord[0].shopDomain); // Temporary storage in shopDomain field
      const { shopName, accessToken, storeUrl, currency } = metadata;
      
      // Create Shopify connection
      await supabaseStorage.createStoreConnection({
        userId,
        platform: 'shopify',
        storeName: shopName,
        storeUrl,
        accessToken,
        currency: currency || 'USD', // Save currency for multi-currency display
        status: 'active'
      });

      // Register mandatory Shopify webhooks
      const { registerShopifyWebhooks } = await import('./lib/shopify-webhooks');
      const baseUrl = getBaseUrl();
      
      console.log('📡 Registering webhooks for pending connection:', shopDomain);
      await registerShopifyWebhooks(shopDomain, accessToken, baseUrl);
      
      // Clean up pending state from database (both pending and metadata records)
      await Promise.all([
        db.delete(oauthStates).where(eq(oauthStates.state, pendingKey)),
        db.delete(oauthStates).where(eq(oauthStates.state, pendingMetaKey))
      ]);
      
      res.json({ success: true, shopName });
    } catch (error) {
      console.error('Associate pending Shopify error:', error);
      res.status(500).json({ error: 'Failed to associate Shopify connection' });
    }
  });

  // Disconnect Shopify
  app.post('/api/shopify/disconnect', requireAuth, apiLimiter, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const connections = await supabaseStorage.getStoreConnections(userId);
      const shopifyConnection = connections.find(c => c.platform === 'shopify');
      
      if (!shopifyConnection) {
        return res.status(404).json({ error: 'No Shopify connection found' });
      }

      await supabaseStorage.deleteStoreConnection(shopifyConnection.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Shopify disconnect error:', error);
      res.status(500).json({ error: 'Failed to disconnect Shopify' });
    }
  });

  // Manual webhook registration endpoint (for admin re-registration)
  app.post('/api/shopify/webhooks/register', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const connections = await supabaseStorage.getStoreConnections(userId);
      const shopifyConnection = connections.find(c => c.platform === 'shopify' && c.status === 'active');
      
      if (!shopifyConnection || !shopifyConnection.storeUrl) {
        return res.status(404).json({ error: 'No active Shopify connection found' });
      }

      // Get shop domain from storeUrl
      const shopDomain = shopifyConnection.storeUrl.replace('https://', '');
      
      // Register webhooks using production domain
      const { registerShopifyWebhooks, forceReregisterWebhooks } = await import('./lib/shopify-webhooks');
      
      // CRITICAL: Production domain is REQUIRED for Shopify GDPR compliance
      const webhookBaseUrl = process.env.PRODUCTION_DOMAIN;
      if (!webhookBaseUrl) {
        console.error('❌ PRODUCTION_DOMAIN not configured');
        return res.status(500).json({ 
          error: 'PRODUCTION_DOMAIN not configured',
          message: 'Cannot register webhooks without a production domain'
        });
      }
      const forceReregister = req.body?.force === true;
      
      console.log('📡 Manually registering webhooks with baseUrl:', webhookBaseUrl);
      console.log('📡 Force re-register:', forceReregister);
      
      const result = forceReregister 
        ? await forceReregisterWebhooks(shopDomain, shopifyConnection.accessToken)
        : await registerShopifyWebhooks(shopDomain, shopifyConnection.accessToken, webhookBaseUrl);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: 'All webhooks registered successfully',
          baseUrl: webhookBaseUrl,
          registered: result.registered 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Some webhooks failed to register',
          baseUrl: webhookBaseUrl,
          registered: result.registered,
          errors: result.errors 
        });
      }
    } catch (error) {
      console.error('Webhook registration error:', error);
      res.status(500).json({ error: 'Failed to register webhooks' });
    }
  });

  // Verify webhook registration status
  app.get('/api/shopify/webhooks/verify', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const connections = await supabaseStorage.getStoreConnections(userId);
      const shopifyConnection = connections.find(c => c.platform === 'shopify' && c.status === 'active');
      
      if (!shopifyConnection || !shopifyConnection.storeUrl) {
        return res.status(404).json({ error: 'No active Shopify connection found' });
      }

      // Get shop domain from storeUrl
      const shopDomain = shopifyConnection.storeUrl.replace('https://', '');
      
      // Verify webhooks
      const { verifyWebhooksRegistered } = await import('./lib/shopify-webhooks');
      const result = await verifyWebhooksRegistered(shopDomain, shopifyConnection.accessToken);
      
      const expectedBaseUrl = process.env.PRODUCTION_DOMAIN || 'Not configured';
      
      res.json({ 
        allRegistered: result.allRegistered,
        missing: result.missing,
        webhooks: result.webhooks,
        expectedBaseUrl,
        shop: shopDomain
      });
    } catch (error) {
      console.error('Webhook verification error:', error);
      res.status(500).json({ error: 'Failed to verify webhooks' });
    }
  });

  // Run comprehensive Shopify integration tests (Admin only)
  app.post('/api/shopify/run-integration-tests', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      // Restrict to admin users only
      if (user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Only administrators can run integration tests' 
        });
      }
      
      console.log('🧪 Starting Shopify integration test suite for admin user:', user.id);
      
      // Import test suite
      const { ShopifyIntegrationTester, formatTestResults } = await import('./lib/shopify-integration-test');
      
      // Create tester instance
      const tester = new ShopifyIntegrationTester(supabaseStorage);
      
      // Run all tests
      const report = await tester.runAllTests(user.id);
      
      // Format results for console
      const formattedReport = formatTestResults(report);
      console.log(formattedReport);
      
      // Return JSON report to client
      res.json({
        success: report.summary.failed === 0,
        report
      });
    } catch (error: any) {
      console.error('Integration test error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to run integration tests',
        message: error.message 
      });
    }
  });

  // Get Shopify sync status (for real-time status component)
  app.get('/api/shopify/sync-status', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const connections = await supabaseStorage.getStoreConnections(userId);
      const shopifyConnection = connections.find(c => c.platform === 'shopify' && c.status === 'active');
      
      if (!shopifyConnection) {
        return res.json({
          connected: false,
          syncing: false,
          lastSync: null,
          productCount: 0,
          error: null
        });
      }

      // Get latest sync
      const latestSync = await supabaseStorage.getLatestSync(userId);
      const isSyncing = latestSync?.status === 'started';
      
      // Get product count
      const products = await supabaseStorage.getProducts(userId);
      
      res.json({
        connected: true,
        syncing: isSyncing,
        lastSync: shopifyConnection.lastSyncAt,
        productCount: products.length,
        error: latestSync?.status === 'failed' ? latestSync.errorMessage : null
      });
    } catch (error) {
      console.error('Sync status error:', error);
      res.status(500).json({ error: 'Failed to get sync status' });
    }
  });

  // Get sync history
  app.get('/api/products/sync-history', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const history = await supabaseStorage.getSyncHistory(userId, limit);
      res.json(history);
    } catch (error) {
      console.error('Sync history error:', error);
      res.status(500).json({ error: 'Failed to get sync history' });
    }
  });

  // Get Shopify products (from connected store)
  app.get('/api/shopify/products', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const connections = await supabaseStorage.getStoreConnections(userId);
      const shopifyConnection = connections.find(c => c.platform === 'shopify' && c.status === 'active');
      
      if (!shopifyConnection) {
        return res.status(404).json({ error: 'No active Shopify connection found' });
      }

      // Fetch products from Shopify API
      const productsResponse = await fetch(`${shopifyConnection.storeUrl}/admin/api/2025-10/products.json`, {
        headers: {
          'X-Shopify-Access-Token': shopifyConnection.accessToken
        }
      });

      if (!productsResponse.ok) {
        throw new Error('Failed to fetch Shopify products');
      }

      const productsData = await productsResponse.json();
      res.json(productsData.products || []);
    } catch (error) {
      console.error('Shopify products fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch Shopify products' });
    }
  });

  // Get full Shopify product details by Shopify product ID (with all images)
  app.get('/api/shopify/products/:shopifyProductId', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { shopifyProductId } = req.params;
      
      const connections = await supabaseStorage.getStoreConnections(userId);
      const shopifyConnection = connections.find(c => c.platform === 'shopify' && c.status === 'active');
      
      if (!shopifyConnection) {
        return res.status(404).json({ error: 'No active Shopify connection found' });
      }

      // Fetch single product from Shopify API
      const productResponse = await fetch(`${shopifyConnection.storeUrl}/admin/api/2025-10/products/${shopifyProductId}.json`, {
        headers: {
          'X-Shopify-Access-Token': shopifyConnection.accessToken
        }
      });

      if (!productResponse.ok) {
        throw new Error('Failed to fetch Shopify product details');
      }

      const productData = await productResponse.json();
      const product = productData.product;
      
      // Extract all images (up to 10)
      const images = (product.images || []).slice(0, 10).map((img: any) => ({
        id: img.id,
        src: img.src,
        alt: img.alt || product.title,
        position: img.position
      }));
      
      // Return formatted product data
      res.json({
        id: product.id,
        title: product.title,
        description: product.body_html || '',
        images: images,
        variants: product.variants || [],
        tags: product.tags || '',
        productType: product.product_type || '',
        vendor: product.vendor || '',
      });
    } catch (error) {
      console.error('Shopify product details fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch Shopify product details' });
    }
  });

  // Sync Shopify products to Zyra (with history tracking and delta sync)
  app.post('/api/shopify/sync', requireAuth, async (req, res) => {
    let syncRecord;
    let syncHistoryAvailable = false;
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { syncType = 'manual' } = req.body; // manual | auto | webhook
      
      console.log('🔄 [SHOPIFY SYNC] Starting sync for user:', userId);
      
      const connections = await supabaseStorage.getStoreConnections(userId);
      const shopifyConnection = connections.find(c => c.platform === 'shopify' && c.status === 'active');
      
      if (!shopifyConnection) {
        console.error('❌ [SHOPIFY SYNC] No active Shopify connection found for user:', userId);
        return res.status(404).json({ error: 'No active Shopify connection found' });
      }

      console.log('✅ [SHOPIFY SYNC] Found connection:', {
        store: shopifyConnection.storeName,
        storeUrl: shopifyConnection.storeUrl,
        hasToken: !!shopifyConnection.accessToken,
        tokenPreview: shopifyConnection.accessToken ? `${shopifyConnection.accessToken.substring(0, 8)}...` : 'none'
      });

      // Create sync history record
      // IMPORTANT: This will fail until Supabase schema cache is reloaded
      try {
        syncRecord = await supabaseStorage.createSyncHistory({
          userId,
          storeConnectionId: shopifyConnection.id,
          syncType,
          status: 'started'
        });
        syncHistoryAvailable = true;
        console.log('✅ [SHOPIFY SYNC] Created sync history record:', syncRecord.id);
      } catch (historyError) {
        console.error('⚠️  [SHOPIFY SYNC] CRITICAL: Failed to create sync history record');
        console.error('⚠️  [SHOPIFY SYNC] Reason:', historyError instanceof Error ? historyError.message : historyError);
        console.error('⚠️  [SHOPIFY SYNC] This means audit trail will not be recorded!');
        console.error('⚠️  [SHOPIFY SYNC] To fix: Reload Supabase schema cache by running:');
        console.error('⚠️  [SHOPIFY SYNC]   NOTIFY pgrst, \'reload schema\'; in Supabase SQL Editor');
        // Continue without sync history - but this is NOT ideal
      }

      // Fetch products from Shopify
      console.log('📡 [SHOPIFY SYNC] Fetching products from:', `${shopifyConnection.storeUrl}/admin/api/2025-10/products.json`);
      
      const productsResponse = await fetch(`${shopifyConnection.storeUrl}/admin/api/2025-10/products.json`, {
        headers: {
          'X-Shopify-Access-Token': shopifyConnection.accessToken
        }
      });

      console.log('📥 [SHOPIFY SYNC] Shopify API response status:', productsResponse.status);

      if (!productsResponse.ok) {
        const errorText = await productsResponse.text();
        console.error('❌ [SHOPIFY SYNC] Shopify API error:', {
          status: productsResponse.status,
          statusText: productsResponse.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch Shopify products: ${productsResponse.status} ${productsResponse.statusText}`);
      }

      const productsData = await productsResponse.json();
      const shopifyProducts = productsData.products || [];
      
      console.log('✅ [SHOPIFY SYNC] Fetched products from Shopify:', {
        count: shopifyProducts.length,
        firstProduct: shopifyProducts[0]?.title || 'N/A'
      });
      
      // Debug: Log the first product's raw data
      if (shopifyProducts.length > 0) {
        console.log('🔍 [SHOPIFY SYNC] First product raw data:', {
          id: shopifyProducts[0].id,
          idType: typeof shopifyProducts[0].id,
          title: shopifyProducts[0].title,
          updated_at: shopifyProducts[0].updated_at,
          variants: shopifyProducts[0].variants?.length || 0
        });
      }

      let productsAdded = 0;
      let productsUpdated = 0;
      const imported = [];
      const errors = [];

      // Get last sync timestamp for delta sync
      const lastSyncTime = shopifyConnection.lastSyncAt ? new Date(shopifyConnection.lastSyncAt) : null;

      for (const product of shopifyProducts) {
        try {
          // CRITICAL: Validate shopifyId exists - reject products without valid IDs
          if (!product.id || product.id.toString().trim() === '') {
            console.warn(`⚠️  [SHOPIFY SYNC] Skipping product with invalid/null shopifyId:`, {
              title: product.title || 'Unknown',
              product_type: product.product_type || 'Unknown'
            });
            errors.push({
              product: product.title || 'Unknown',
              error: 'Product missing valid Shopify ID - skipped to prevent duplicates'
            });
            continue; // Skip this product to prevent duplicate inserts
          }
          
          const productUpdatedAt = new Date(product.updated_at);
          
          // Smart delta sync: Skip if not updated since last sync
          if (lastSyncTime && productUpdatedAt <= lastSyncTime) {
            console.log(`⏭️  [SHOPIFY SYNC] Skipping unchanged product (delta sync):`, {
              title: product.title,
              productUpdatedAt: productUpdatedAt.toISOString(),
              lastSyncTime: lastSyncTime.toISOString()
            });
            continue; // Skip unchanged products
          }

          const shopifyId = product.id.toString().trim();
          const variant = product.variants?.[0];
          
          // Extract features from product description and metafields
          // Note: For performance, we extract from description only during sync
          // To extract from metafields, use ShopifyClient.getProductMetafields(shopifyId)
          const extractedFeatures = extractProductFeatures([], product.body_html || '');
          
          const productPayload = {
            userId,
            shopifyId,
            name: product.title,
            description: product.body_html || '',
            originalDescription: product.body_html || '',
            price: variant?.price || '0',
            category: product.product_type || 'Uncategorized',
            stock: variant?.inventory_quantity || 0,
            image: product.image?.src || product.images?.[0]?.src || '',
            tags: product.tags || '',
            features: extractedFeatures,
            isOptimized: false
          };

          // Check if product exists before upsert to track stats
          const existingProduct = await db.query.products.findFirst({
            where: and(
              eq(products.userId, userId),
              eq(products.shopifyId, shopifyId)
            )
          });
          
          // Use UPSERT to atomically insert or update (prevents race conditions)
          const upsertResult = await db
            .insert(products)
            .values({
              ...productPayload,
              createdAt: sql`NOW()`,
              updatedAt: sql`NOW()`
            })
            .onConflictDoUpdate({
              target: [products.userId, products.shopifyId],
              set: {
                name: productPayload.name,
                description: productPayload.description,
                originalDescription: productPayload.originalDescription,
                price: productPayload.price,
                category: productPayload.category,
                stock: productPayload.stock,
                image: productPayload.image,
                tags: productPayload.tags,
                features: productPayload.features,
                updatedAt: sql`NOW()`
              }
            })
            .returning();
          
          // Track whether this was an insert or update
          if (existingProduct) {
            productsUpdated++;
          } else {
            productsAdded++;
          }
          
          imported.push(upsertResult[0]);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ [SHOPIFY SYNC] Error syncing product "${product.title}":`, errorMessage);
          console.error(`❌ [SHOPIFY SYNC] Product data:`, {
            shopifyId: product.id,
            title: product.title,
            updated_at: product.updated_at
          });
          errors.push({
            product: product.title,
            error: errorMessage
          });
        }
      }

      // Update last sync time
      await db.update(storeConnections)
        .set({ lastSyncAt: sql`NOW()` })
        .where(eq(storeConnections.id, shopifyConnection.id));

      console.log('✅ [SHOPIFY SYNC] Sync completed:', {
        productsAdded,
        productsUpdated,
        totalProcessed: shopifyProducts.length,
        skipped: shopifyProducts.length - (productsAdded + productsUpdated),
        errors: errors.length
      });

      // Update sync history with results (only if sync record was successfully created)
      if (syncHistoryAvailable && syncRecord) {
        try {
          await supabaseStorage.updateSyncHistory(syncRecord.id, {
            status: 'completed',
            productsAdded,
            productsUpdated,
            completedAt: new Date() as any,
            metadata: { 
              totalProcessed: shopifyProducts.length,
              skipped: shopifyProducts.length - (productsAdded + productsUpdated),
              errors: errors.length
            } as any
          });
          console.log('✅ [SHOPIFY SYNC] Updated sync history record');
        } catch (historyUpdateError) {
          console.error('⚠️  [SHOPIFY SYNC] Failed to update sync history:', historyUpdateError instanceof Error ? historyUpdateError.message : historyUpdateError);
        }
      } else if (!syncHistoryAvailable) {
        console.warn('⚠️  [SHOPIFY SYNC] Skipping sync history update (record was not created due to schema cache issue)');
      }

      res.json({
        success: true,
        imported: imported.length,
        added: productsAdded,
        updated: productsUpdated,
        errors: errors.length,
        details: { imported, errors }
      });
    } catch (error) {
      console.error('❌ [SHOPIFY SYNC] Sync failed:', error);
      console.error('❌ [SHOPIFY SYNC] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Update sync history with error (only if sync record was successfully created)
      if (syncHistoryAvailable && syncRecord) {
        try {
          await supabaseStorage.updateSyncHistory(syncRecord.id, {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date() as any
          });
          console.log('✅ [SHOPIFY SYNC] Updated sync history with error status');
        } catch (historyUpdateError) {
          console.error('⚠️  [SHOPIFY SYNC] Failed to update sync history with error:', historyUpdateError instanceof Error ? historyUpdateError.message : historyUpdateError);
        }
      } else if (!syncHistoryAvailable) {
        console.warn('⚠️  [SHOPIFY SYNC] Skipping sync history error update (record was not created due to schema cache issue)');
      }
      
      res.status(500).json({ 
        error: 'Failed to sync Shopify products',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Clean up duplicate products (keeps most recent product per shopifyId)
  app.post('/api/shopify/cleanup-duplicates', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      console.log('🧹 [CLEANUP] Starting duplicate cleanup for user:', userId);
      
      // Get all products for this user from Supabase
      const allProducts = await supabaseStorage.getProducts(userId);
      console.log(`📊 [CLEANUP] Found ${allProducts.length} total products for user`);
      
      // Log products with their shopifyIds for debugging
      const nullShopifyIdCount = allProducts.filter(p => !p.shopifyId).length;
      console.log(`🔍 [CLEANUP] Products without shopifyId: ${nullShopifyIdCount}`);
      console.log(`🔍 [CLEANUP] Products with shopifyId: ${allProducts.length - nullShopifyIdCount}`);
      
      // Show sample of product names and shopifyIds
      const sampleProducts = allProducts.slice(0, 10).map(p => ({
        name: p.name,
        shopifyId: p.shopifyId || 'null',
        id: p.id
      }));
      console.log(`📋 [CLEANUP] Sample products:`, JSON.stringify(sampleProducts, null, 2));
      
      // Group products by shopifyId (for valid shopifyIds)
      const productsByShopifyId = new Map<string, typeof allProducts>();
      
      // Group products WITHOUT shopifyId by name (these are legacy duplicates)
      const productsWithoutShopifyId = new Map<string, typeof allProducts>();
      
      for (const product of allProducts) {
        if (product.shopifyId) {
          const existing = productsByShopifyId.get(product.shopifyId) || [];
          existing.push(product);
          productsByShopifyId.set(product.shopifyId, existing);
        } else {
          // Group null shopifyId products by name
          const existing = productsWithoutShopifyId.get(product.name) || [];
          existing.push(product);
          productsWithoutShopifyId.set(product.name, existing);
        }
      }
      
      console.log(`🔍 [CLEANUP] Unique shopifyIds found: ${productsByShopifyId.size}`);
      console.log(`🔍 [CLEANUP] Product names with null shopifyIds: ${productsWithoutShopifyId.size}`);
      
      // Find duplicates (shopifyIds with more than 1 product)
      const duplicatesToRemove: string[] = [];
      
      // Check products WITH valid shopifyIds
      for (const [shopifyId, productGroup] of Array.from(productsByShopifyId.entries())) {
        if (productGroup.length > 1) {
          console.log(`🔍 [CLEANUP] Found ${productGroup.length} duplicates for shopifyId: ${shopifyId}`);
          
          // Sort by updatedAt DESC to keep the most recent
          productGroup.sort((a: typeof allProducts[0], b: typeof allProducts[0]) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
          });
          
          // Keep the first (most recent), remove the rest
          for (let i = 1; i < productGroup.length; i++) {
            duplicatesToRemove.push(productGroup[i].id);
            console.log(`  ➡️  Will remove duplicate product: ${productGroup[i].name} (ID: ${productGroup[i].id})`);
          }
        }
      }
      
      // Check products WITHOUT shopifyId (legacy duplicates grouped by name)
      for (const [productName, productGroup] of Array.from(productsWithoutShopifyId.entries())) {
        if (productGroup.length > 1) {
          console.log(`🔍 [CLEANUP] Found ${productGroup.length} legacy duplicates (null shopifyId) for product: ${productName}`);
          
          // Sort by updatedAt DESC to keep the most recent
          productGroup.sort((a: typeof allProducts[0], b: typeof allProducts[0]) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
          });
          
          // Delete ALL of them (including the newest) since they have no valid shopifyId
          // The next Shopify sync will create 1 fresh product with a valid shopifyId
          for (let i = 0; i < productGroup.length; i++) {
            duplicatesToRemove.push(productGroup[i].id);
            console.log(`  ➡️  Will remove legacy product without shopifyId: ${productGroup[i].name} (ID: ${productGroup[i].id})`);
          }
        }
      }
      
      if (duplicatesToRemove.length === 0) {
        console.log('✅ [CLEANUP] No duplicates found');
        return res.json({
          success: true,
          message: 'No duplicate products found',
          removed: 0
        });
      }
      
      console.log(`🗑️  [CLEANUP] Removing ${duplicatesToRemove.length} duplicate products from Supabase...`);
      
      // Delete duplicates using Supabase storage (production database)
      let removedCount = 0;
      const deleteErrors: { productId: string; error: string }[] = [];
      
      for (const productId of duplicatesToRemove) {
        try {
          await supabaseStorage.deleteProduct(productId);
          removedCount++;
          console.log(`  ✅ Deleted duplicate product ${productId}`);
        } catch (deleteError) {
          const errorMsg = deleteError instanceof Error ? deleteError.message : String(deleteError);
          console.error(`  ❌ Failed to delete product ${productId}:`, errorMsg);
          deleteErrors.push({ productId, error: errorMsg });
        }
      }
      
      // Verify all deletions succeeded - fail fast if any deletion failed
      if (deleteErrors.length > 0) {
        const errorMessage = `Failed to delete ${deleteErrors.length} product(s). Successfully deleted ${removedCount}. Errors: ${deleteErrors.map(e => `${e.productId}: ${e.error}`).join(', ')}`;
        console.error(`❌ [CLEANUP] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      console.log(`✅ [CLEANUP] Successfully removed ${removedCount} duplicate products from Supabase`);
      
      // Verify duplicates are actually gone by re-fetching products
      console.log('🔍 [CLEANUP] Verifying duplicates were removed...');
      const remainingProducts = await supabaseStorage.getProducts(userId);
      const remainingDuplicates = new Map<string, number>();
      
      for (const product of remainingProducts) {
        if (product.shopifyId) {
          const count = remainingDuplicates.get(product.shopifyId) || 0;
          remainingDuplicates.set(product.shopifyId, count + 1);
        }
      }
      
      const stillDuplicated: string[] = [];
      for (const [shopifyId, count] of Array.from(remainingDuplicates.entries())) {
        if (count > 1) {
          stillDuplicated.push(`${shopifyId} (${count} copies)`);
        }
      }
      
      if (stillDuplicated.length > 0) {
        const verificationError = `Verification failed: Found ${stillDuplicated.length} shopifyId(s) still duplicated: ${stillDuplicated.join(', ')}`;
        console.error(`❌ [CLEANUP] ${verificationError}`);
        throw new Error(verificationError);
      }
      
      console.log(`✅ [CLEANUP] Verification passed: No duplicates remaining`);
      console.log(`📊 [CLEANUP] Final product count: ${remainingProducts.length}`);
      
      res.json({
        success: true,
        message: `Successfully removed ${removedCount} duplicate product${removedCount !== 1 ? 's' : ''}`,
        removed: removedCount,
        remainingProducts: remainingProducts.length
      });
    } catch (error) {
      console.error('❌ [CLEANUP] Cleanup failed:', error);
      console.error('❌ [CLEANUP] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        error: 'Failed to cleanup duplicates',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Bulk publish AI content to Shopify (MUST come before /:productId route!)
  app.post('/api/shopify/publish/bulk', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { products: productUpdates } = req.body;

      console.log('📦 [BULK PUBLISH] Request received:', {
        userId,
        productCount: productUpdates?.length,
        productIds: productUpdates?.map(p => p.productId)
      });

      if (!Array.isArray(productUpdates) || productUpdates.length === 0) {
        console.log('❌ [BULK PUBLISH] Invalid products array');
        return res.status(400).json({ error: 'Invalid products array' });
      }

      // Get Shopify connection
      const connections = await supabaseStorage.getStoreConnections(userId);
      const shopifyConnection = connections.find(c => c.platform === 'shopify' && c.status === 'active');
      
      if (!shopifyConnection) {
        return res.status(404).json({ error: 'No active Shopify connection found' });
      }

      // Initialize Shopify client
      const { getShopifyClient } = await import('./lib/shopify-client');
      // Remove protocol from storeUrl (client adds it automatically)
      const shopDomain = (shopifyConnection.storeUrl || shopifyConnection.storeName).replace(/^https?:\/\//, '');
      const shopifyClient = await getShopifyClient(
        shopDomain,
        shopifyConnection.accessToken
      );

      const results = [];
      const errors = [];

      for (const update of productUpdates) {
        try {
          console.log('🔍 [BULK PUBLISH] Processing product:', update.productId);
          
          const product = await db.query.products.findFirst({
            where: and(
              eq(products.id, update.productId),
              eq(products.userId, userId)
            )
          });

          if (!product) {
            console.log('❌ [BULK PUBLISH] Product not found:', update.productId);
            errors.push({ productId: update.productId, error: 'Product not found' });
            continue;
          }
          
          console.log('✅ [BULK PUBLISH] Product found:', {
            id: product.id,
            name: product.name,
            shopifyId: product.shopifyId
          });

          if (!product.shopifyId) {
            errors.push({ productId: update.productId, error: 'Not linked to Shopify' });
            continue;
          }

          // Fetch current Shopify product data for backup (before overwriting) - only if not already backed up
          if (!product.originalCopy) {
            const currentShopifyProduct = await shopifyClient.getProduct(product.shopifyId);
            const metafields = await shopifyClient.getProductMetafields(product.shopifyId);
            
            // Extract SEO metafields from Shopify
            const seoTitleMetafield = metafields.find(m => m.namespace === 'global' && m.key === 'title_tag');
            const metaDescMetafield = metafields.find(m => m.namespace === 'global' && m.key === 'description_tag');
            
            // Save complete original content from Shopify (not local DB) for rollback
            const originalContent = {
              description: currentShopifyProduct.body_html,
              seoTitle: seoTitleMetafield?.value || currentShopifyProduct.title,
              metaDescription: metaDescMetafield?.value || '',
              images: currentShopifyProduct.images?.map(img => ({
                id: img.id.toString(),
                alt: img.alt || ''
              }))
            };

            await db.update(products)
              .set({
                originalCopy: originalContent,
                originalDescription: currentShopifyProduct.body_html
              })
              .where(eq(products.id, update.productId));
          }

          // Publish to Shopify
          const updatedProduct = await shopifyClient.publishAIContent(product.shopifyId, update.content);

          // MERGE content with existing optimizedCopy (don't replace entirely)
          const existingOptimizedCopy = (product.optimizedCopy || {}) as any;
          const optimizedCopyData = {
            ...existingOptimizedCopy,
            ...(update.content.description ? { description: update.content.description } : {}),
            ...(update.content.seoTitle ? { title: update.content.seoTitle, productName: update.content.seoTitle } : {}),
            ...(update.content.metaDescription ? { metaDescription: update.content.metaDescription } : {}),
            ...(update.content.tags ? { keywords: Array.isArray(update.content.tags) ? update.content.tags.join(', ') : update.content.tags } : {}),
          };

          // Update in database
          await db.update(products)
            .set({
              isOptimized: true,
              optimizedCopy: optimizedCopyData,
              ...(update.content.description ? { description: update.content.description } : {}),
              updatedAt: sql`NOW()`
            })
            .where(eq(products.id, update.productId));

          results.push({
            productId: update.productId,
            productName: product.name,
            success: true
          });

        } catch (error: any) {
          console.error('❌ [BULK PUBLISH] Error publishing product:', {
            productId: update.productId,
            error: error.message,
            stack: error.stack?.split('\n').slice(0, 3)
          });
          errors.push({
            productId: update.productId,
            error: error.message
          });
        }
      }

      console.log('📊 [BULK PUBLISH] Summary:', {
        successful: results.length,
        failed: errors.length,
        errors: errors.map(e => ({ productId: e.productId, error: e.error }))
      });

      res.json({
        success: true,
        published: results.length,
        failed: errors.length,
        results,
        errors
      });

    } catch (error: any) {
      console.error('Bulk publish error:', error);
      res.status(500).json({ 
        error: 'Failed to bulk publish to Shopify',
        details: error.message 
      });
    }
  });

  // Publish AI content to Shopify (single product)
  app.post('/api/shopify/publish/:productId', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { productId } = req.params;
      const { content } = req.body;

      // Get Shopify connection
      const connections = await supabaseStorage.getStoreConnections(userId);
      const shopifyConnection = connections.find(c => c.platform === 'shopify' && c.status === 'active');
      
      if (!shopifyConnection) {
        return res.status(404).json({ error: 'No active Shopify connection found' });
      }

      // Get product from database
      const product = await db.query.products.findFirst({
        where: and(
          eq(products.id, productId),
          eq(products.userId, userId)
        )
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      if (!product.shopifyId) {
        return res.status(400).json({ error: 'Product is not linked to Shopify. Please sync products first.' });
      }

      // Initialize Shopify client
      const { getShopifyClient } = await import('./lib/shopify-client');
      // Remove protocol from storeUrl (client adds it automatically)
      const shopDomain = (shopifyConnection.storeUrl || shopifyConnection.storeName).replace(/^https?:\/\//, '');
      const shopifyClient = await getShopifyClient(
        shopDomain,
        shopifyConnection.accessToken
      );

      // Fetch current Shopify product data for backup (before overwriting) - only if not already backed up
      if (!product.originalCopy) {
        const currentShopifyProduct = await shopifyClient.getProduct(product.shopifyId);
        const metafields = await shopifyClient.getProductMetafields(product.shopifyId);
        
        // Extract SEO metafields from Shopify
        const seoTitleMetafield = metafields.find(m => m.namespace === 'global' && m.key === 'title_tag');
        const metaDescMetafield = metafields.find(m => m.namespace === 'global' && m.key === 'description_tag');
        
        // Save complete original content from Shopify (not local DB) for rollback
        const originalContent = {
          description: currentShopifyProduct.body_html,
          seoTitle: seoTitleMetafield?.value || currentShopifyProduct.title, // Real Shopify SEO title or product title
          metaDescription: metaDescMetafield?.value || '', // Real Shopify meta description
          images: currentShopifyProduct.images?.map(img => ({
            id: img.id.toString(),
            alt: img.alt || ''
          }))
        };

        await db.update(products)
          .set({
            originalCopy: originalContent,
            originalDescription: currentShopifyProduct.body_html
          })
          .where(eq(products.id, productId));
      }

      // Record baseline metrics before optimization
      const { recordProductOptimizationForProduct } = await import('./lib/record-product-optimization');
      await recordProductOptimizationForProduct(userId, product);

      // Publish content to Shopify
      const updatedProduct = await shopifyClient.publishAIContent(product.shopifyId, content);

      // Update product in Zyra database
      // MERGE new content with existing optimizedCopy (don't replace entirely)
      const existingOptimizedCopy = (product.optimizedCopy || {}) as any;
      const optimizedCopyData = {
        ...existingOptimizedCopy,
        // Only update fields that have content
        ...(content.description ? { description: content.description } : {}),
        ...(content.seoTitle ? { title: content.seoTitle, productName: content.seoTitle } : {}),
        ...(content.metaDescription ? { metaDescription: content.metaDescription } : {}),
        ...(content.tags ? { keywords: Array.isArray(content.tags) ? content.tags.join(', ') : content.tags } : {}),
      };
      
      await db.update(products)
        .set({
          isOptimized: true,
          optimizedCopy: optimizedCopyData,
          // Only update description if provided
          ...(content.description ? { description: content.description } : {}),
          updatedAt: sql`NOW()`
        })
        .where(eq(products.id, productId));

      res.json({
        success: true,
        message: 'Content published to Shopify successfully',
        shopifyProduct: updatedProduct
      });

    } catch (error: any) {
      console.error('Shopify publish error:', error);
      res.status(500).json({ 
        error: 'Failed to publish to Shopify',
        details: error.message 
      });
    }
  });

  // Rollback Shopify product to original content
  app.post('/api/shopify/rollback/:productId', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { productId } = req.params;

      // Get Shopify connection
      const connections = await supabaseStorage.getStoreConnections(userId);
      const shopifyConnection = connections.find(c => c.platform === 'shopify' && c.status === 'active');
      
      if (!shopifyConnection) {
        return res.status(404).json({ error: 'No active Shopify connection found' });
      }

      // Get product from database
      const product = await db.query.products.findFirst({
        where: and(
          eq(products.id, productId),
          eq(products.userId, userId)
        )
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      if (!product.shopifyId || !product.originalCopy) {
        return res.status(400).json({ error: 'Cannot rollback: missing original content' });
      }

      // Initialize Shopify client
      const { getShopifyClient } = await import('./lib/shopify-client');
      // Remove protocol from storeUrl (client adds it automatically)
      const shopDomain = (shopifyConnection.storeUrl || shopifyConnection.storeName).replace(/^https?:\/\//, '');
      const shopifyClient = await getShopifyClient(
        shopDomain,
        shopifyConnection.accessToken
      );

      // Extract original content
      const originalContent: any = product.originalCopy;

      // Restore original description to Shopify
      const updatedProduct = await shopifyClient.updateProduct(product.shopifyId, {
        body_html: originalContent.description
      });

      // Restore SEO metadata if available
      if (originalContent.seoTitle && originalContent.metaDescription) {
        await shopifyClient.updateProductSEO(
          product.shopifyId,
          originalContent.seoTitle,
          originalContent.metaDescription
        );
      }

      // Restore image alt texts if available
      if (originalContent.images && originalContent.images.length > 0) {
        for (const img of originalContent.images) {
          if (img.id && img.alt) {
            await shopifyClient.updateProductImage(product.shopifyId, img.id, img.alt);
          }
        }
      }

      // Update product in Zyra database - clear optimizations
      await db.update(products)
        .set({
          description: originalContent.description,
          isOptimized: false,
          optimizedCopy: null,
          updatedAt: sql`NOW()`
        })
        .where(eq(products.id, productId));

      res.json({
        success: true,
        message: 'Product rolled back to original content successfully (description, SEO, and images restored)',
        shopifyProduct: updatedProduct
      });

    } catch (error: any) {
      console.error('Shopify rollback error:', error);
      res.status(500).json({ 
        error: 'Failed to rollback product',
        details: error.message 
      });
    }
  });

  // ===== IMAGE OPTIMIZATION ROUTES =====
  
  // Create new bulk image optimization job
  app.post('/api/image-optimization/jobs', requireAuth, aiLimiter, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { productIds } = req.body;

      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: 'Product IDs are required' });
      }

      // Get Shopify connection
      const connections = await supabaseStorage.getStoreConnections(userId);
      const shopifyConnection = connections.find(c => c.platform === 'shopify' && c.status === 'active');
      
      if (!shopifyConnection) {
        return res.status(404).json({ error: 'No active Shopify connection found' });
      }

      // Initialize services
      const { ImageOptimizationService } = await import('./lib/image-optimization-service');
      const { getShopifyClient } = await import('./lib/shopify-client');
      const shopDomain = (shopifyConnection.storeUrl || shopifyConnection.storeName).replace(/^https?:\/\//, '');
      const shopifyClient = await getShopifyClient(shopDomain, shopifyConnection.accessToken);
      
      const imageService = new ImageOptimizationService(supabaseStorage);

      // Fetch product images from Shopify
      const productImages = await imageService.fetchProductImages(userId, productIds, shopifyClient);

      // Create job
      const job = await imageService.createJob(userId, productImages);

      res.json({
        success: true,
        job,
        productImages
      });

    } catch (error: any) {
      console.error('Create image optimization job error:', error);
      res.status(500).json({ 
        error: 'Failed to create image optimization job',
        details: error.message 
      });
    }
  });

  // Get all image optimization jobs for user
  app.get('/api/image-optimization/jobs', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { ImageOptimizationService } = await import('./lib/image-optimization-service');
      const imageService = new ImageOptimizationService(supabaseStorage);

      const jobs = await imageService.getJobs(userId);
      res.json(jobs);

    } catch (error: any) {
      console.error('Get image optimization jobs error:', error);
      res.status(500).json({ 
        error: 'Failed to get image optimization jobs',
        details: error.message 
      });
    }
  });

  // Get specific job with details
  app.get('/api/image-optimization/jobs/:jobId', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { jobId } = req.params;
      const { ImageOptimizationService } = await import('./lib/image-optimization-service');
      const imageService = new ImageOptimizationService(supabaseStorage);

      const job = await imageService.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Verify ownership
      if (job.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      res.json(job);

    } catch (error: any) {
      console.error('Get image optimization job error:', error);
      res.status(500).json({ 
        error: 'Failed to get image optimization job',
        details: error.message 
      });
    }
  });

  // Process an image optimization job
  app.post('/api/image-optimization/jobs/:jobId/process', requireAuth, aiLimiter, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { jobId } = req.params;
      
      const { ImageOptimizationService } = await import('./lib/image-optimization-service');
      const imageService = new ImageOptimizationService(supabaseStorage);

      // Get job and verify ownership
      const job = await imageService.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      if (job.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Get Shopify connection
      const connections = await supabaseStorage.getStoreConnections(userId);
      const shopifyConnection = connections.find(c => c.platform === 'shopify' && c.status === 'active');
      
      if (!shopifyConnection) {
        return res.status(404).json({ error: 'No active Shopify connection found' });
      }

      const { getShopifyClient } = await import('./lib/shopify-client');
      const shopDomain = (shopifyConnection.storeUrl || shopifyConnection.storeName).replace(/^https?:\/\//, '');
      const shopifyClient = await getShopifyClient(shopDomain, shopifyConnection.accessToken);

      // Process job asynchronously
      res.json({
        success: true,
        message: 'Job processing started',
        jobId
      });

      // Process in background (don't await)
      imageService.processJob(jobId, shopifyClient).catch(error => {
        console.error('Background job processing error:', error);
      });

    } catch (error: any) {
      console.error('Process image optimization job error:', error);
      res.status(500).json({ 
        error: 'Failed to process image optimization job',
        details: error.message 
      });
    }
  });

  // Get optimization history
  app.get('/api/image-optimization/history', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { productId, jobId } = req.query;
      
      const { ImageOptimizationService } = await import('./lib/image-optimization-service');
      const imageService = new ImageOptimizationService(supabaseStorage);

      const filters: any = {};
      if (productId) filters.productId = productId as string;
      if (jobId) filters.jobId = jobId as string;

      const history = await imageService.getHistory(userId, filters);
      res.json(history);

    } catch (error: any) {
      console.error('Get optimization history error:', error);
      res.status(500).json({ 
        error: 'Failed to get optimization history',
        details: error.message 
      });
    }
  });

  // Apply optimized alt-text to Shopify
  app.post('/api/image-optimization/apply-to-shopify', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { historyIds } = req.body;

      if (!Array.isArray(historyIds) || historyIds.length === 0) {
        return res.status(400).json({ error: 'History IDs are required' });
      }

      // Get Shopify connection
      const connections = await supabaseStorage.getStoreConnections(userId);
      const shopifyConnection = connections.find(c => c.platform === 'shopify' && c.status === 'active');
      
      if (!shopifyConnection) {
        return res.status(404).json({ error: 'No active Shopify connection found' });
      }

      const { ImageOptimizationService } = await import('./lib/image-optimization-service');
      const { getShopifyClient } = await import('./lib/shopify-client');
      const shopDomain = (shopifyConnection.storeUrl || shopifyConnection.storeName).replace(/^https?:\/\//, '');
      const shopifyClient = await getShopifyClient(shopDomain, shopifyConnection.accessToken);
      
      const imageService = new ImageOptimizationService(supabaseStorage);

      // Apply to Shopify
      const result = await imageService.applyToShopify(historyIds, shopifyClient);

      res.json({
        success: true,
        applied: result.success,
        failed: result.failed,
        message: `Successfully applied ${result.success} alt-texts to Shopify`
      });

    } catch (error: any) {
      console.error('Apply to Shopify error:', error);
      res.status(500).json({ 
        error: 'Failed to apply alt-text to Shopify',
        details: error.message 
      });
    }
  });

  // ===== CAMPAIGN ROUTES =====
  
  // Get all campaigns
  app.get('/api/campaigns', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const campaigns = await supabaseStorage.getCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error('Get campaigns error:', error);
      res.status(500).json({ error: 'Failed to get campaigns' });
    }
  });

  // Get aggregate campaign statistics for dashboard (MUST be before :id routes)
  app.get('/api/campaigns/stats', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Use caching for campaign stats (5 min TTL)
      const stats = await cacheOrFetch(
        userId,
        async () => {
          const campaigns = await supabaseStorage.getCampaigns(userId);

          return {
            totalCampaigns: campaigns.length,
            emailCampaigns: campaigns.filter(c => c.type === 'email').length,
            smsCampaigns: campaigns.filter(c => c.type === 'sms').length,
            sentCampaigns: campaigns.filter(c => c.status === 'sent').length,
            scheduledCampaigns: campaigns.filter(c => c.status === 'scheduled').length,
            draftCampaigns: campaigns.filter(c => c.status === 'draft').length,
            totalSent: campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0),
            avgOpenRate: campaigns.length > 0 
              ? campaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) / campaigns.length 
              : 0,
            avgClickRate: campaigns.length > 0 
              ? campaigns.reduce((sum, c) => sum + (c.clickRate || 0), 0) / campaigns.length 
              : 0,
            avgConversionRate: campaigns.length > 0 
              ? campaigns.reduce((sum, c) => sum + (c.conversionRate || 0), 0) / campaigns.length 
              : 0,
            recentCampaigns: campaigns
              .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
              .slice(0, 5)
              .map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                status: c.status,
                sentCount: c.sentCount || 0,
                openRate: c.openRate || 0,
                createdAt: c.createdAt
              }))
          };
        },
        CacheConfig.CAMPAIGN_STATS
      );

      res.json(stats);
    } catch (error) {
      console.error('Get campaign stats error:', error);
      res.status(500).json({ error: 'Failed to get campaign statistics' });
    }
  });

  // Get single campaign
  app.get('/api/campaigns/:id', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const campaign = await supabaseStorage.getCampaign(req.params.id);
      
      // Handle both snake_case (from DB) and camelCase field names
      const campaignUserId = (campaign as any)?.user_id || campaign?.userId;
      if (!campaign || campaignUserId !== userId) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error('Get campaign error:', error);
      res.status(500).json({ error: 'Failed to get campaign' });
    }
  });

  // Save campaign draft (autosave)
  app.post('/api/campaigns/draft', requireAuth, sanitizeBody, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const draftData = { ...req.body, userId, status: 'draft' };
      const validated = insertCampaignSchema.parse(draftData);
      const campaign = await supabaseStorage.createCampaign(validated);
      
      res.status(200).json({ success: true, draftId: campaign.id });
    } catch (error: any) {
      console.error('Draft save error:', error);
      res.status(500).json({ error: 'Failed to save draft' });
    }
  });

  // Create campaign
  app.post('/api/campaigns', requireAuth, campaignLimiter, sanitizeBody, validateCampaign, checkValidation, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const validated = insertCampaignSchema.parse({ ...req.body, userId });
      const campaign = await supabaseStorage.createCampaign(validated);
      
      // Invalidate campaign stats cache
      await deleteCached(userId, CacheConfig.CAMPAIGN_STATS);
      
      res.status(201).json(campaign);
    } catch (error) {
      console.error('Create campaign error:', error);
      res.status(400).json({ error: 'Failed to create campaign' });
    }
  });

  // Update campaign
  app.patch('/api/campaigns/:id', requireAuth, campaignLimiter, sanitizeBody, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const campaign = await supabaseStorage.getCampaign(req.params.id);
      
      // Handle both snake_case (from DB) and camelCase field names
      const campaignUserId = (campaign as any)?.user_id || campaign?.userId;
      if (!campaign || campaignUserId !== userId) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      const updated = await supabaseStorage.updateCampaign(req.params.id, req.body);
      
      // Invalidate campaign stats cache
      await deleteCached(userId, CacheConfig.CAMPAIGN_STATS);
      
      res.json(updated);
    } catch (error) {
      console.error('Update campaign error:', error);
      res.status(400).json({ error: 'Failed to update campaign' });
    }
  });

  // Delete campaign
  app.delete('/api/campaigns/:id', requireAuth, campaignLimiter, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const campaign = await supabaseStorage.getCampaign(req.params.id);
      
      // Handle both snake_case (from DB) and camelCase field names
      const campaignUserId = (campaign as any)?.user_id || campaign?.userId;
      if (!campaign || campaignUserId !== userId) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      await supabaseStorage.deleteCampaign(req.params.id);
      
      // Invalidate campaign stats cache
      await deleteCached(userId, CacheConfig.CAMPAIGN_STATS);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete campaign error:', error);
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  });

  // Send campaign (email or SMS)
  app.post('/api/campaigns/:id/send', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const campaign = await supabaseStorage.getCampaign(req.params.id);
      
      // Handle both snake_case (from DB) and camelCase field names
      const campaignUserId = (campaign as any)?.user_id || campaign?.userId;
      if (!campaign || campaignUserId !== userId) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const recipients = campaign.recipientList as string[] || [];
      if (recipients.length === 0) {
        return res.status(400).json({ error: 'No recipients specified' });
      }

      let sentCount = 0;
      const errors: any[] = [];

      if (campaign.type === 'email') {
        // Send emails
        const messages = recipients.map(email => ({
          to: email,
          subject: campaign.subject || 'No Subject',
          html: campaign.content
        }));

        try {
          const result = await sendBulkEmails(messages);
          sentCount = result.count;
        } catch (error: any) {
          console.error('Email sending error:', error);
          errors.push({ error: error.message });
        }
      } else if (campaign.type === 'sms') {
        // Send SMS
        const messages = recipients.map(phone => ({
          to: phone,
          message: campaign.content
        }));

        const result = await sendBulkSMS(messages);
        sentCount = result.sent;
        errors.push(...result.errors);
      }

      // Update campaign status
      await supabaseStorage.updateCampaign(req.params.id, {
        status: 'sent',
        sentAt: new Date() as any,
        sentCount
      });

      // Track in analytics
      await supabaseStorage.trackActivity({
        userId,
        action: 'sent_campaign',
        description: `Sent ${campaign.type} campaign: ${campaign.name}`,
        metadata: { campaignId: campaign.id, type: campaign.type, sentCount },
        toolUsed: 'campaigns'
      });

      // Send notification
      if (errors.length > 0) {
        await NotificationService.notifyCampaignFailed(userId, campaign.name, errors.map(e => e.error).join(', '));
      } else {
        await NotificationService.notifyCampaignSent(userId, campaign.name, sentCount);
        
        // Check for milestones
        if (sentCount >= 1000) {
          await NotificationService.notifyCampaignMilestone(userId, campaign.name, `Reached ${sentCount} recipients!`);
        }
      }

      res.json({ 
        success: true, 
        sentCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Send campaign error:', error);
      res.status(500).json({ error: 'Failed to send campaign' });
    }
  });

  // Schedule campaign for future sending
  app.post('/api/campaigns/:id/schedule', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const campaign = await supabaseStorage.getCampaign(req.params.id);
      
      // Handle both snake_case (from DB) and camelCase field names
      const campaignUserId = (campaign as any)?.user_id || campaign?.userId;
      if (!campaign || campaignUserId !== userId) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const { scheduledFor } = req.body;
      if (!scheduledFor) {
        return res.status(400).json({ error: 'scheduledFor date is required' });
      }

      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate <= new Date()) {
        return res.status(400).json({ error: 'Scheduled date must be in the future' });
      }

      await supabaseStorage.updateCampaign(req.params.id, {
        status: 'scheduled',
        scheduledFor: scheduledDate as any
      });

      res.json({ success: true, scheduledFor: scheduledDate });
    } catch (error) {
      console.error('Schedule campaign error:', error);
      res.status(500).json({ error: 'Failed to schedule campaign' });
    }
  });

  // Get campaign performance metrics
  app.get('/api/campaigns/:id/metrics', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const campaign = await supabaseStorage.getCampaign(req.params.id);
      
      // Handle both snake_case (from DB) and camelCase field names
      const campaignUserId = (campaign as any)?.user_id || campaign?.userId;
      if (!campaign || campaignUserId !== userId) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Calculate metrics
      const metrics = {
        campaignId: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        sentCount: campaign.sentCount || 0,
        openRate: campaign.openRate || 0,
        clickRate: campaign.clickRate || 0,
        conversionRate: campaign.conversionRate || 0,
        sentAt: campaign.sentAt,
        scheduledFor: campaign.scheduledFor
      };

      res.json(metrics);
    } catch (error) {
      console.error('Get campaign metrics error:', error);
      res.status(500).json({ error: 'Failed to get campaign metrics' });
    }
  });

  // ===== CAMPAIGN TEMPLATE ROUTES =====
  
  // Get all templates
  app.get('/api/campaign-templates', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const templates = await supabaseStorage.getCampaignTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ error: 'Failed to get templates' });
    }
  });

  // Create template
  app.post('/api/campaign-templates', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const validated = insertCampaignTemplateSchema.parse({ ...req.body, userId });
      const template = await supabaseStorage.createCampaignTemplate(validated);
      res.status(201).json(template);
    } catch (error) {
      console.error('Create template error:', error);
      res.status(400).json({ error: 'Failed to create template' });
    }
  });

  // Update template
  app.patch('/api/campaign-templates/:id', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const template = await supabaseStorage.getCampaignTemplate(req.params.id);
      
      if (!template || template.userId !== userId) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      const updated = await supabaseStorage.updateCampaignTemplate(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error('Update template error:', error);
      res.status(400).json({ error: 'Failed to update template' });
    }
  });

  // Delete template
  app.delete('/api/campaign-templates/:id', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const template = await supabaseStorage.getCampaignTemplate(req.params.id);
      
      if (!template || template.userId !== userId) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      await supabaseStorage.deleteCampaignTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  });

  // ===== TRACKING PIXEL ROUTES =====
  
  // Tracking pixel endpoint (email open tracking)
  app.get('/track/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      // Look up tracking token from database
      const trackingTokenResult = await db.select().from(trackingTokens)
        .where(eq(trackingTokens.token, token))
        .limit(1);
      
      if (trackingTokenResult.length === 0) {
        // Token not found - return pixel silently
        return res.status(200).type('image/gif').send(Buffer.from(
          'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'
        ));
      }
      
      const trackingToken = trackingTokenResult[0];
      const { campaignId, userId, recipientEmail } = trackingToken;
      
      // Get campaign for open rate calculation
      const campaign = await supabaseStorage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(200).type('image/gif').send(Buffer.from(
          'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'
        ));
      }
      
      // Try to insert open event (will fail silently if duplicate due to unique index)
      try {
        await db.insert(campaignEvents).values({
          campaignId,
          userId,
          recipientEmail,
          eventType: 'open',
          ipAddress: req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          metadata: { timestamp: new Date().toISOString() }
        });
        
        // Update campaign open rate only if new event was inserted
        const totalOpens = await db.select({ count: sql<number>`count(*)` })
          .from(campaignEvents)
          .where(and(
            eq(campaignEvents.campaignId, campaignId),
            eq(campaignEvents.eventType, 'open')
          ));
        
        const openCount = totalOpens[0]?.count || 0;
        const sentCount = campaign.sentCount || 0;
        const openRate = sentCount > 0 
          ? Math.round((Number(openCount) / sentCount) * 100) 
          : 0;
        
        await db.update(campaigns)
          .set({ openRate })
          .where(eq(campaigns.id, campaignId));
      } catch (insertError: any) {
        // Duplicate event (unique constraint violation) - silently ignore
        if (!insertError.message?.includes('unique')) {
          console.error('Campaign event insert error:', insertError);
        }
      }
      
      // Always return 1x1 transparent GIF
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'
      );
      res.status(200).type('image/gif').send(pixel);
    } catch (error) {
      console.error('Tracking pixel error:', error);
      // Always return pixel even on error
      res.status(200).type('image/gif').send(Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'
      ));
    }
  });

  // Click tracking endpoint (link click tracking)
  app.get('/click/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const { url } = req.query;
      
      if (!url) {
        return res.status(400).send('Missing destination URL');
      }
      
      try {
        const destinationUrl = new URL(url as string);
        const allowedDomains = [
          'myshopify.com',
          '.myshopify.com',
          process.env.PRODUCTION_DOMAIN?.replace(/^https?:\/\//, ''),
          ...(process.env.REPLIT_DOMAINS?.split(',').map(d => d.trim()) || [])
        ].filter((d): d is string => Boolean(d));
        
        const isAllowed = allowedDomains.some(domain => {
          return destinationUrl.hostname === domain || 
                 destinationUrl.hostname.endsWith(`.${domain}`) ||
                 destinationUrl.hostname === domain.replace(/^\./, '');
        });
        
        if (!isAllowed && !destinationUrl.hostname.endsWith('.myshopify.com')) {
          console.warn(`[SECURITY] Blocked redirect to untrusted domain: ${destinationUrl.hostname}`);
          return res.status(403).send('Redirect to external domains not allowed');
        }
      } catch (urlError) {
        console.error('[SECURITY] Invalid URL format:', url);
        return res.status(400).send('Invalid URL format');
      }
      
      const trackingTokenResult = await db.select().from(trackingTokens)
        .where(eq(trackingTokens.token, token))
        .limit(1);
      
      if (trackingTokenResult.length > 0) {
        const trackingToken = trackingTokenResult[0];
        const { campaignId, userId, recipientEmail } = trackingToken;
        
        const campaign = await supabaseStorage.getCampaign(campaignId);
        
        if (campaign) {
          try {
            await db.insert(campaignEvents).values({
              campaignId,
              userId,
              recipientEmail,
              eventType: 'click',
              ipAddress: req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
              userAgent: req.headers['user-agent'] || 'unknown',
              metadata: { 
                timestamp: new Date().toISOString(),
                destinationUrl: url as string
              }
            });
            
            const totalClicks = await db.select({ count: sql<number>`count(*)` })
              .from(campaignEvents)
              .where(and(
                eq(campaignEvents.campaignId, campaignId),
                eq(campaignEvents.eventType, 'click')
              ));
            
            const clickCount = totalClicks[0]?.count || 0;
            const sentCount = campaign.sentCount || 0;
            const clickRate = sentCount > 0 
              ? Math.round((Number(clickCount) / sentCount) * 100) 
              : 0;
            
            await db.update(campaigns)
              .set({ clickRate })
              .where(eq(campaigns.id, campaignId));
          } catch (insertError: any) {
            if (!insertError.message?.includes('unique')) {
              console.error('Campaign click event insert error:', insertError);
            }
          }
        }
      }
      
      res.redirect(url as string);
    } catch (error) {
      console.error('Click tracking error:', error);
      if (req.query.url) {
        res.redirect(req.query.url as string);
      } else {
        res.status(500).send('Tracking error');
      }
    }
  });

  // ===== ABANDONED CART ROUTES =====
  
  // Get abandoned carts
  app.get('/api/abandoned-carts', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const carts = await supabaseStorage.getAbandonedCarts(userId);
      res.json(carts);
    } catch (error) {
      console.error('Get abandoned carts error:', error);
      res.status(500).json({ error: 'Failed to get abandoned carts' });
    }
  });

  // Create abandoned cart
  app.post('/api/abandoned-carts', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const validated = insertAbandonedCartSchema.parse({ ...req.body, userId });
      const cart = await supabaseStorage.createAbandonedCart(validated);
      res.status(201).json(cart);
    } catch (error) {
      console.error('Create abandoned cart error:', error);
      res.status(400).json({ error: 'Failed to create abandoned cart' });
    }
  });

  // Send recovery campaign for abandoned cart
  app.post('/api/abandoned-carts/:id/recover', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const cart = await supabaseStorage.getAbandonedCart(req.params.id);
      
      if (!cart || cart.userId !== userId) {
        return res.status(404).json({ error: 'Abandoned cart not found' });
      }

      if (cart.recoveryCampaignSent) {
        return res.status(400).json({ error: 'Recovery campaign already sent' });
      }

      // Send email recovery
      if (cart.customerEmail) {
        const cartItems = cart.cartItems as any[];
        const itemsList = cartItems.map(item => `- ${item.name} (${item.quantity}x)`).join('\n');
        
        const emailContent = `
          <h2>Complete Your Purchase</h2>
          <p>You left these items in your cart:</p>
          <pre>${itemsList}</pre>
          <p>Total Value: $${cart.cartValue}</p>
          <p><a href="#">Complete your purchase now</a></p>
        `;

        await sendEmail(cart.customerEmail, 'Complete Your Purchase', emailContent);
      }

      // Send SMS recovery if phone available
      if (cart.customerPhone) {
        const message = `Complete your $${cart.cartValue} purchase! You left items in your cart. Check your email to finish checkout.`;
        await sendSMS(cart.customerPhone, message);
      }

      // Update cart status
      await supabaseStorage.updateAbandonedCart(req.params.id, {
        recoveryCampaignSent: true
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Send recovery error:', error);
      res.status(500).json({ error: 'Failed to send recovery campaign' });
    }
  });

  // ===== REAL ANALYTICS & TRACKING ROUTES =====

  // Get real analytics dashboard data
  app.get('/api/analytics/dashboard', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Fetch all data in parallel for better performance (avoid sequential queries)
      const [campaigns, products, abandonedCarts, stats] = await Promise.all([
        supabaseStorage.getCampaigns(userId),
        supabaseStorage.getProducts(userId),
        supabaseStorage.getAbandonedCarts(userId),
        supabaseStorage.getUserUsageStats(userId)
      ]);
      
      // Calculate real metrics
      const totalCampaignsSent = campaigns.filter(c => c.status === 'sent').length;
      const totalEmailsSent = campaigns
        .filter(c => c.type === 'email' && c.status === 'sent')
        .reduce((sum, c) => sum + (c.sentCount || 0), 0);
      const totalSMSSent = campaigns
        .filter(c => c.type === 'sms' && c.status === 'sent')
        .reduce((sum, c) => sum + (c.sentCount || 0), 0);
      
      // Calculate abandoned cart metrics
      const totalAbandonedValue = abandonedCarts
        .reduce((sum, cart) => sum + parseFloat(cart.cartValue as any || '0'), 0);
      const recoveredCarts = abandonedCarts.filter(c => c.isRecovered).length;
      const recoveryRate = abandonedCarts.length > 0 
        ? (recoveredCarts / abandonedCarts.length * 100).toFixed(1) 
        : '0';

      // Calculate average campaign performance
      const avgOpenRate = campaigns.length > 0
        ? campaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) / campaigns.length
        : 0;
      const avgClickRate = campaigns.length > 0
        ? campaigns.reduce((sum, c) => sum + (c.clickRate || 0), 0) / campaigns.length
        : 0;

      const analytics = {
        overview: {
          totalProducts: products.length,
          totalCampaigns: campaigns.length,
          campaignsSent: totalCampaignsSent,
          emailsSent: totalEmailsSent,
          smsSent: totalSMSSent,
          aiGenerationsUsed: stats?.aiGenerationsUsed || 0
        },
        campaigns: {
          avgOpenRate: avgOpenRate.toFixed(1),
          avgClickRate: avgClickRate.toFixed(1),
          totalSent: totalCampaignsSent,
          emailCampaigns: campaigns.filter(c => c.type === 'email').length,
          smsCampaigns: campaigns.filter(c => c.type === 'sms').length
        },
        revenue: {
          totalAbandonedValue: totalAbandonedValue.toFixed(2),
          recoveredCarts,
          recoveryRate,
          potentialRevenue: (totalAbandonedValue * parseFloat(recoveryRate) / 100).toFixed(2)
        },
        trends: {
          last7Days: campaigns.filter(c => {
            const sentDate = c.sentAt ? new Date(c.sentAt) : null;
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return sentDate && sentDate >= sevenDaysAgo;
          }).length,
          last30Days: campaigns.filter(c => {
            const sentDate = c.sentAt ? new Date(c.sentAt) : null;
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return sentDate && sentDate >= thirtyDaysAgo;
          }).length
        }
      };

      res.json(analytics);
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ error: 'Failed to get analytics' });
    }
  });

  // Get growth summary metrics
  app.get('/api/analytics/growth-summary', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Fetch usage stats and campaigns
      const [stats, campaigns, products] = await Promise.all([
        supabaseStorage.getUserUsageStats(userId),
        supabaseStorage.getCampaigns(userId),
        supabaseStorage.getProducts(userId)
      ]);

      // Calculate date ranges
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Current period (last 30 days)
      const currentPeriodCampaigns = campaigns.filter(c => {
        const sentDate = c.sentAt ? new Date(c.sentAt) : null;
        return sentDate && sentDate >= thirtyDaysAgo;
      });

      // Previous period (30-60 days ago)
      const previousPeriodCampaigns = campaigns.filter(c => {
        const sentDate = c.sentAt ? new Date(c.sentAt) : null;
        return sentDate && sentDate >= sixtyDaysAgo && sentDate < thirtyDaysAgo;
      });

      // Calculate growth percentage based on campaign activity
      const currentCount = currentPeriodCampaigns.length;
      const previousCount = previousPeriodCampaigns.length;
      
      let growthPercentage = 0;
      if (previousCount > 0) {
        growthPercentage = Math.round(((currentCount - previousCount) / previousCount) * 100);
      } else if (currentCount > 0) {
        growthPercentage = 100; // 100% growth if starting from zero
      }

      // Get total AI impact from usage stats (revenue)
      const totalAIImpact = stats?.totalRevenue || 0;

      // Get products optimized count
      const productsOptimized = stats?.productsOptimized || 0;

      const summary = {
        overallGrowth: growthPercentage,
        totalAIImpact,
        productsOptimized,
        currentPeriodCampaigns: currentCount,
        previousPeriodCampaigns: previousCount,
        totalProducts: products.length,
        totalOrders: stats?.totalOrders || 0
      };

      res.json(summary);
    } catch (error) {
      console.error('Get growth summary error:', error);
      res.status(500).json({ error: 'Failed to get growth summary' });
    }
  });

  // Get revenue trends for charts (last 7 days, 30 days, 90 days)
  app.get('/api/analytics/revenue-trends', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { period = '30' } = req.query;
      
      // Validate period parameter
      const validPeriods = ['7', '30', '90'];
      const periodStr = period as string;
      if (!validPeriods.includes(periodStr)) {
        return res.status(400).json({ error: 'Invalid period. Must be 7, 30, or 90 days.' });
      }
      
      const days = parseInt(periodStr);
      
      // Fetch all data in parallel
      const [stats, campaigns, abandonedCarts] = await Promise.all([
        supabaseStorage.getUserUsageStats(userId),
        supabaseStorage.getCampaigns(userId),
        supabaseStorage.getAbandonedCarts(userId)
      ]);
      
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      // Group data by date for trend visualization
      const trendData: { date: string; revenue: number; orders: number; campaigns: number }[] = [];
      
      // Generate data points for each day
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        // Filter campaigns sent on this day
        const dayCampaigns = campaigns.filter(c => {
          if (!c.sentAt) return false;
          const sentDate = new Date(c.sentAt).toISOString().split('T')[0];
          return sentDate === dateStr;
        });
        
        // Filter carts recovered on this day
        const dayRecoveredCarts = abandonedCarts.filter(c => {
          if (!c.recoveredAt || !c.isRecovered) return false;
          const recoveredDate = new Date(c.recoveredAt).toISOString().split('T')[0];
          return recoveredDate === dateStr;
        });
        
        // Calculate real revenue from recovered carts
        const dayRevenue = dayRecoveredCarts.reduce((sum, cart) => 
          sum + parseFloat(cart.cartValue as any || '0'), 0
        );
        
        // Calculate orders from campaign sent count
        const dayOrders = dayCampaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
        
        trendData.push({
          date: dateStr,
          revenue: Math.round(dayRevenue),
          orders: dayOrders,
          campaigns: dayCampaigns.length
        });
      }
      
      // Safe calculations with fallbacks for empty data
      const totalTrendRevenue = trendData.reduce((sum, d) => sum + d.revenue, 0);
      const totalTrendOrders = trendData.reduce((sum, d) => sum + d.orders, 0);
      const avgDailyRevenue = days > 0 ? totalTrendRevenue / days : 0;
      const avgDailyOrders = days > 0 ? totalTrendOrders / days : 0;
      const peakDay = trendData.length > 0 
        ? trendData.reduce((max, d) => d.revenue > max.revenue ? d : max, trendData[0])
        : { date: '', revenue: 0, orders: 0, campaigns: 0 };
      
      res.json({
        period: days,
        totalRevenue: stats?.totalRevenue || 0,
        totalOrders: stats?.totalOrders || 0,
        trends: trendData,
        summary: {
          avgDailyRevenue: Math.round(avgDailyRevenue),
          avgDailyOrders: Math.round(avgDailyOrders),
          peakDay: {
            date: peakDay.date,
            revenue: peakDay.revenue,
            orders: peakDay.orders
          }
        }
      });
    } catch (error) {
      console.error('Get revenue trends error:', error);
      res.status(500).json({ error: 'Failed to get revenue trends' });
    }
  });

  // Get cart recovery analytics
  app.get('/api/analytics/cart-recovery', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Gracefully handle Supabase schema cache issues
      let abandonedCarts: any[] = [];
      try {
        abandonedCarts = await supabaseStorage.getAbandonedCarts(userId);
      } catch (cartError: any) {
        // Supabase schema cache issue - return empty data gracefully
        if (cartError.message?.includes('schema cache')) {
          console.warn('[Cart Recovery] Supabase schema cache not refreshed yet for abandoned_carts table');
          abandonedCarts = [];
        } else {
          throw cartError;
        }
      }
      
      const stats = await supabaseStorage.getUserUsageStats(userId);
      
      // Calculate recovery metrics
      const totalCarts = abandonedCarts.length;
      const recoveredCarts = abandonedCarts.filter(c => c.isRecovered).length;
      const campaignsSent = abandonedCarts.filter(c => c.recoveryCampaignSent).length;
      
      const totalValue = abandonedCarts.reduce((sum, cart) => 
        sum + parseFloat(cart.cartValue as any || '0'), 0
      );
      
      const recoveredValue = abandonedCarts
        .filter(c => c.isRecovered)
        .reduce((sum, cart) => sum + parseFloat(cart.cartValue as any || '0'), 0);
      
      const recoveryRate = totalCarts > 0 ? (recoveredCarts / totalCarts * 100).toFixed(1) : '0';
      const conversionRate = campaignsSent > 0 ? (recoveredCarts / campaignsSent * 100).toFixed(1) : '0';
      
      // Group by date for trends
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentCarts = abandonedCarts.filter(c => 
        new Date(c.createdAt!) >= last30Days
      );
      
      res.json({
        overview: {
          totalCarts,
          recoveredCarts,
          recoveryRate: parseFloat(recoveryRate),
          totalValue: Math.round(totalValue * 100) / 100,
          recoveredValue: Math.round(recoveredValue * 100) / 100,
          potentialRevenue: Math.round((totalValue - recoveredValue) * 100) / 100,
          campaignsSent,
          conversionRate: parseFloat(conversionRate)
        },
        recentActivity: {
          last30Days: recentCarts.length,
          last30DaysRecovered: recentCarts.filter(c => c.isRecovered).length,
          last30DaysValue: Math.round(recentCarts.reduce((sum, cart) => 
            sum + parseFloat(cart.cartValue as any || '0'), 0
          ) * 100) / 100
        },
        topCarts: abandonedCarts
          .sort((a, b) => parseFloat(b.cartValue as any) - parseFloat(a.cartValue as any))
          .slice(0, 10)
          .map(cart => ({
            id: cart.id,
            email: cart.customerEmail,
            value: Math.round(parseFloat(cart.cartValue as any) * 100) / 100,
            isRecovered: cart.isRecovered,
            campaignSent: cart.recoveryCampaignSent,
            createdAt: cart.createdAt
          }))
      });
    } catch (error) {
      console.error('Get cart recovery error:', error);
      res.status(500).json({ error: 'Failed to get cart recovery analytics' });
    }
  });

  // Get store currency - returns the user's store currency for multi-currency display
  app.get('/api/store/currency', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Fetch user's store currency
      let storeCurrency = 'USD'; // Default fallback
      try {
        const connections = await supabaseStorage.getStoreConnections(userId);
        const shopifyConnection = connections.find(c => c.platform === 'shopify' && c.status === 'active');
        if (shopifyConnection?.currency) {
          storeCurrency = shopifyConnection.currency;
        }
      } catch (currencyError) {
        console.warn('[Currency] Could not fetch store currency, defaulting to USD:', currencyError);
      }
      
      res.json({ currency: storeCurrency });
    } catch (error) {
      console.error('[Currency] Get store currency error:', error);
      res.status(500).json({ error: 'Failed to get store currency' });
    }
  });

  // Get ROI summary - aggregates revenue from all sources
  app.get('/api/analytics/roi-summary', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { period = 'current' } = req.query; // 'current' or 'previous' month
      
      // Fetch user's store currency for multi-currency display
      let storeCurrency = 'USD'; // Default fallback
      try {
        const connections = await supabaseStorage.getStoreConnections(userId);
        const shopifyConnection = connections.find(c => c.platform === 'shopify' && c.status === 'active');
        if (shopifyConnection?.currency) {
          storeCurrency = shopifyConnection.currency;
        }
      } catch (currencyError) {
        console.warn('[ROI] Could not fetch store currency, defaulting to USD:', currencyError);
      }
      
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      
      // Helper function to get revenue for a specific month
      const getMonthRevenue = async (startDate: Date, endDate: Date) => {
        // 1. Cart Recovery Revenue
        let cartRecoveryRevenue = 0;
        try {
          // Query recovered carts - use updatedAt as fallback since recoveredAt can be null
          const carts = await db
            .select()
            .from(abandonedCarts)
            .where(
              and(
                eq(abandonedCarts.userId, userId),
                eq(abandonedCarts.status, 'recovered'),
                // Use updatedAt for date filtering since recoveredAt can be null for manually marked carts
                gte(abandonedCarts.updatedAt, startDate),
                lte(abandonedCarts.updatedAt, endDate)
              )
            );
          
          cartRecoveryRevenue = carts.reduce((sum, cart) => 
            sum + parseFloat(cart.recoveredValue as any || '0'), 0
          );
        } catch (error) {
          console.warn('[ROI] Cart recovery query error:', error);
        }
        
        // 2. Email/SMS Campaign Revenue (from revenue_attribution table)
        let campaignRevenue = 0;
        try {
          const attributions = await db
            .select()
            .from(revenueAttribution)
            .where(
              and(
                eq(revenueAttribution.userId, userId),
                sql`${revenueAttribution.source} IN ('email_campaign', 'sms_campaign')`,
                gte(revenueAttribution.attributedAt, startDate),
                lte(revenueAttribution.attributedAt, endDate)
              )
            );
          
          campaignRevenue = attributions.reduce((sum, attr) => 
            sum + parseFloat(attr.revenueAmount as any || '0'), 0
          );
        } catch (error) {
          console.warn('[ROI] Campaign revenue query error (table may not exist yet):', error);
          // If revenue_attribution table doesn't exist yet, campaignRevenue stays at 0
          // Merchants should track actual revenue via the attribution table once it's seeded
        }
        
        // 3. AI Optimization Conversion Lift Revenue
        let aiOptimizationRevenue = 0;
        try {
          const aiAttributions = await db
            .select()
            .from(revenueAttribution)
            .where(
              and(
                eq(revenueAttribution.userId, userId),
                eq(revenueAttribution.source, 'ai_optimization'),
                gte(revenueAttribution.attributedAt, startDate),
                lte(revenueAttribution.attributedAt, endDate)
              )
            );
          
          aiOptimizationRevenue = aiAttributions.reduce((sum, attr) => 
            sum + parseFloat(attr.revenueAmount as any || '0'), 0
          );
        } catch (error) {
          console.warn('[ROI] AI optimization revenue query error:', error);
          // For now, estimate based on optimized products
          // This will be replaced with actual tracking in task 6
          try {
            const optimizedProducts = await db
              .select()
              .from(products)
              .where(
                and(
                  eq(products.userId, userId),
                  eq(products.isOptimized, true)
                )
              );
            
            // Estimate: 0.3% conversion lift, 100 monthly visits per product, $45 AOV
            const monthlyVisitsPerProduct = 100;
            const conversionLift = 0.003; // 0.3%
            const avgOrderValue = 45;
            aiOptimizationRevenue = optimizedProducts.length * monthlyVisitsPerProduct * conversionLift * avgOrderValue;
          } catch (estError) {
            console.warn('[ROI] AI optimization estimation error:', estError);
          }
        }
        
        const totalRevenue = cartRecoveryRevenue + campaignRevenue + aiOptimizationRevenue;
        
        return {
          total: Math.round(totalRevenue * 100) / 100,
          breakdown: {
            cartRecovery: Math.round(cartRecoveryRevenue * 100) / 100,
            campaigns: Math.round(campaignRevenue * 100) / 100,
            aiOptimization: Math.round(aiOptimizationRevenue * 100) / 100
          }
        };
      };
      
      // Get current and previous month revenue with defensive defaults
      let currentMonth, previousMonth;
      try {
        [currentMonth, previousMonth] = await Promise.all([
          getMonthRevenue(currentMonthStart, now),
          getMonthRevenue(previousMonthStart, previousMonthEnd)
        ]);
      } catch (queryError) {
        console.error('[ROI] Revenue queries failed, returning default values:', queryError);
        // Return safe defaults if queries fail
        const defaultRevenue = {
          total: 0,
          breakdown: { cartRecovery: 0, campaigns: 0, aiOptimization: 0 }
        };
        currentMonth = defaultRevenue;
        previousMonth = defaultRevenue;
      }
      
      // Calculate month-over-month change (always defined, even if data is 0)
      const monthOverMonthChange = previousMonth.total > 0
        ? ((currentMonth.total - previousMonth.total) / previousMonth.total * 100)
        : (currentMonth.total > 0 ? 100 : 0);
      
      // Always return complete response structure with comparison object
      res.json({
        currentMonth: {
          ...currentMonth,
          period: `${currentMonthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
        },
        previousMonth: {
          ...previousMonth,
          period: `${previousMonthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
        },
        comparison: {
          change: Math.round(monthOverMonthChange * 10) / 10,
          trend: monthOverMonthChange > 0 ? 'up' : (monthOverMonthChange < 0 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral'
        },
        currency: storeCurrency // Include store currency for proper display formatting
      });
    } catch (error) {
      console.error('[ROI] Get ROI summary error:', error);
      res.status(500).json({ error: 'Failed to get ROI summary' });
    }
  });

  // Get growth comparison metrics (WoW, MoM, YoY)
  app.get('/api/analytics/growth-comparison', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      const [campaigns, stats] = await Promise.all([
        supabaseStorage.getCampaigns(userId),
        supabaseStorage.getUserUsageStats(userId)
      ]);
      
      const now = new Date();
      
      // Week over Week (WoW)
      const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const thisWeekCampaigns = campaigns.filter(c => {
        const sentDate = c.sentAt ? new Date(c.sentAt) : null;
        return sentDate && sentDate >= thisWeekStart;
      });
      
      const lastWeekCampaigns = campaigns.filter(c => {
        const sentDate = c.sentAt ? new Date(c.sentAt) : null;
        return sentDate && sentDate >= lastWeekStart && sentDate < thisWeekStart;
      });
      
      const wowGrowth = lastWeekCampaigns.length > 0
        ? ((thisWeekCampaigns.length - lastWeekCampaigns.length) / lastWeekCampaigns.length * 100).toFixed(1)
        : thisWeekCampaigns.length > 0 ? '100' : '0';
      
      // Month over Month (MoM)
      const thisMonthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const lastMonthStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      const thisMonthCampaigns = campaigns.filter(c => {
        const sentDate = c.sentAt ? new Date(c.sentAt) : null;
        return sentDate && sentDate >= thisMonthStart;
      });
      
      const lastMonthCampaigns = campaigns.filter(c => {
        const sentDate = c.sentAt ? new Date(c.sentAt) : null;
        return sentDate && sentDate >= lastMonthStart && sentDate < thisMonthStart;
      });
      
      const momGrowth = lastMonthCampaigns.length > 0
        ? ((thisMonthCampaigns.length - lastMonthCampaigns.length) / lastMonthCampaigns.length * 100).toFixed(1)
        : thisMonthCampaigns.length > 0 ? '100' : '0';
      
      res.json({
        weekOverWeek: {
          growth: parseFloat(wowGrowth),
          thisWeek: thisWeekCampaigns.length,
          lastWeek: lastWeekCampaigns.length,
          change: thisWeekCampaigns.length - lastWeekCampaigns.length
        },
        monthOverMonth: {
          growth: parseFloat(momGrowth),
          thisMonth: thisMonthCampaigns.length,
          lastMonth: lastMonthCampaigns.length,
          change: thisMonthCampaigns.length - lastMonthCampaigns.length
        },
        metrics: {
          totalRevenue: stats?.totalRevenue || 0,
          totalOrders: stats?.totalOrders || 0,
          productsOptimized: stats?.productsOptimized || 0,
          aiGenerations: stats?.aiGenerationsUsed || 0
        }
      });
    } catch (error) {
      console.error('Get growth comparison error:', error);
      res.status(500).json({ error: 'Failed to get growth comparison' });
    }
  });

  // Track conversion (when a campaign leads to a sale)
  app.post('/api/analytics/track-conversion', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { campaignId, revenue, orderId } = req.body;

      if (!campaignId) {
        return res.status(400).json({ error: 'campaignId is required' });
      }

      const campaign = await supabaseStorage.getCampaign(campaignId);
      // Handle both snake_case (from DB) and camelCase field names
      const campaignUserId = (campaign as any)?.user_id || campaign?.userId;
      if (!campaign || campaignUserId !== userId) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Track the conversion
      await supabaseStorage.trackActivity({
        userId,
        action: 'campaign_conversion',
        description: `Conversion from campaign: ${campaign.name}`,
        metadata: { campaignId, revenue: revenue || 0, orderId },
        toolUsed: 'campaigns'
      });

      // Update campaign conversion rate (simplified - in real app, track clicks and conversions separately)
      const newConversionRate = ((campaign.conversionRate || 0) + 1);
      await supabaseStorage.updateCampaign(campaignId, {
        conversionRate: newConversionRate
      });

      res.json({ success: true, conversionTracked: true });
    } catch (error) {
      console.error('Track conversion error:', error);
      res.status(500).json({ error: 'Failed to track conversion' });
    }
  });

  // Get AI Cache Statistics
  app.get('/api/analytics/ai-cache-stats', requireAuth, async (req, res) => {
    try {
      const stats = getAICacheStats();
      res.json(stats);
    } catch (error) {
      console.error('AI cache stats error:', error);
      res.status(500).json({ error: 'Failed to get AI cache statistics' });
    }
  });

  // Export analytics to PDF
  app.get('/api/analytics/export/pdf', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      // Get analytics data
      const campaigns = await supabaseStorage.getCampaigns(userId);
      const stats = await supabaseStorage.getUserUsageStats(userId);

      // Create PDF
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('ZYRA Analytics Report', 14, 20);
      
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Overview section
      doc.setFontSize(16);
      doc.text('Campaign Overview', 14, 45);
      
      doc.setFontSize(10);
      const sentCampaigns = campaigns.filter(c => c.status === 'sent');
      doc.text(`Total Campaigns: ${campaigns.length}`, 14, 55);
      doc.text(`Sent Campaigns: ${sentCampaigns.length}`, 14, 62);
      doc.text(`AI Generations Used: ${stats?.aiGenerationsUsed || 0}`, 14, 69);

      // Campaign table
      const tableData = sentCampaigns.slice(0, 20).map(c => [
        c.name,
        c.type,
        c.sentCount || 0,
        `${c.openRate || 0}%`,
        `${c.clickRate || 0}%`,
        c.sentAt ? new Date(c.sentAt).toLocaleDateString() : 'N/A'
      ]);

      (doc as any).autoTable({
        startY: 80,
        head: [['Campaign', 'Type', 'Sent', 'Open Rate', 'Click Rate', 'Date']],
        body: tableData,
        theme: 'grid'
      });

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_${new Date().toISOString().split('T')[0]}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF export error:', error);
      res.status(500).json({ error: 'Failed to export PDF' });
    }
  });

  // Export analytics to CSV
  app.get('/api/analytics/export/csv', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const campaigns = await supabaseStorage.getCampaigns(userId);

      const csvHeaders = ['Campaign Name', 'Type', 'Status', 'Recipients Sent', 'Open Rate', 'Click Rate', 'Conversion Rate', 'Sent Date'];
      const csvRows = campaigns.map(c => [
        c.name,
        c.type,
        c.status,
        c.sentCount || 0,
        `${c.openRate || 0}%`,
        `${c.clickRate || 0}%`,
        `${c.conversionRate || 0}%`,
        c.sentAt ? new Date(c.sentAt).toISOString() : 'Not sent'
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="campaigns_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({ error: 'Failed to export CSV' });
    }
  });

  // ===== GDPR COMPLIANCE ROUTES =====

  // Export all user data (GDPR Right to Data Portability)
  app.get('/api/gdpr/export-data', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Gather all user data
      const [
        user,
        products,
        campaigns,
        templates,
        abandonedCarts,
        analytics,
        notifications,
        usageStats,
        activityLogs
      ] = await Promise.all([
        supabaseStorage.getUser(userId),
        supabaseStorage.getProducts(userId),
        supabaseStorage.getCampaigns(userId),
        supabaseStorage.getCampaignTemplates(userId),
        supabaseStorage.getAbandonedCarts(userId),
        supabaseStorage.getAnalytics(userId),
        supabaseStorage.getNotifications(userId),
        supabaseStorage.getUserUsageStats(userId),
        supabaseStorage.getUserActivityLogs(userId)
      ]);

      const userData = {
        user: {
          id: user?.id,
          email: user?.email,
          fullName: user?.fullName,
          role: user?.role,
          plan: user?.plan,
          createdAt: user?.createdAt
        },
        products,
        campaigns,
        templates,
        abandonedCarts,
        analytics,
        notifications,
        usageStats,
        activityLogs,
        exportDate: new Date().toISOString(),
        notice: 'This is a complete export of your personal data stored in ZYRA as per GDPR Article 20.'
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="zyra_data_export_${userId}_${new Date().toISOString().split('T')[0]}.json"`);
      res.send(JSON.stringify(userData, null, 2));
    } catch (error) {
      console.error('Data export error:', error);
      res.status(500).json({ error: 'Failed to export data' });
    }
  });

  // Request account deletion (GDPR Right to Erasure)
  app.post('/api/gdpr/delete-account', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { confirmation } = req.body;

      if (confirmation !== 'DELETE MY ACCOUNT') {
        return res.status(400).json({ 
          error: 'Please confirm account deletion by typing "DELETE MY ACCOUNT"' 
        });
      }

      // Fetch all user data in parallel
      const [products, campaigns, templates] = await Promise.all([
        supabaseStorage.getProducts(userId),
        supabaseStorage.getCampaigns(userId),
        supabaseStorage.getCampaignTemplates(userId)
      ]);

      // Delete all user data in parallel using allSettled to ensure all deletions are attempted
      // (avoids N+1 sequential deletions while maintaining GDPR compliance)
      const deletionResults = await Promise.allSettled([
        ...products.map(product => supabaseStorage.deleteProduct(product.id)),
        ...campaigns.map(campaign => supabaseStorage.deleteCampaign(campaign.id)),
        ...templates.map(template => supabaseStorage.deleteCampaignTemplate(template.id))
      ]);

      // Check for deletion failures - GDPR compliance requires complete data removal
      const failures = deletionResults.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.error(`Account deletion failed: ${failures.length} items could not be deleted`, failures);
        return res.status(500).json({ 
          error: 'Account deletion incomplete',
          message: 'Some data could not be deleted. Please try again or contact support.',
          details: `${failures.length} items failed to delete`
        });
      }

      // Delete user account from Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) {
        console.error('Error deleting Supabase auth user:', authError);
      }

      // Note: User data in other tables will be cascade deleted due to foreign key constraints
      
      res.json({ 
        success: true, 
        message: 'Your account and all associated data have been permanently deleted.' 
      });
    } catch (error) {
      console.error('Account deletion error:', error);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  });

  // Get data deletion status
  app.get('/api/gdpr/deletion-info', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Count user data
      const [products, campaigns, templates] = await Promise.all([
        supabaseStorage.getProducts(userId),
        supabaseStorage.getCampaigns(userId),
        supabaseStorage.getCampaignTemplates(userId)
      ]);

      res.json({
        dataToBeDeleted: {
          products: products.length,
          campaigns: campaigns.length,
          templates: templates.length,
          note: 'All your data including analytics, notifications, and activity logs will be permanently deleted.'
        },
        policy: {
          retentionPeriod: 'Data is deleted immediately upon request',
          backups: 'Data in backups will be deleted within 30 days',
          thirdParty: 'We will request deletion from third-party services where applicable'
        }
      });
    } catch (error) {
      console.error('Deletion info error:', error);
      res.status(500).json({ error: 'Failed to get deletion info' });
    }
  });

  // ===== Shopify Compliance Webhooks =====
  // GDPR compliance webhooks are configured in shopify.app.toml (NOT registered via API)
  // Shopify automatically routes compliance_topics to the URI specified in TOML config
  // All webhooks use HMAC verification for security

  // Import webhook verification middleware
  const { verifyShopifyWebhook } = await import('./middleware/shopifyWebhookAuth');

  // GET handler for compliance endpoint - for verification/testing
  // Shopify may check if the endpoint is reachable before sending webhooks
  app.get('/api/webhooks/compliance', (req, res) => {
    res.status(200).json({ 
      status: 'active',
      message: 'Zyra AI GDPR Compliance Webhook Endpoint',
      topics: ['customers/data_request', 'customers/redact', 'shop/redact'],
      method_required: 'POST',
      note: 'This endpoint accepts POST requests from Shopify with HMAC verification'
    });
  });

  // Unified Compliance Webhook Endpoint
  // Handles all 3 mandatory GDPR webhooks configured in shopify.app.toml:
  // - customers/data_request, customers/redact, shop/redact
  // CRITICAL: Must respond within 5 seconds to avoid Shopify timeout
  app.post('/api/webhooks/compliance', verifyShopifyWebhook, async (req, res) => {
    try {
      const topic = req.headers['x-shopify-topic'] as string;
      const { shop_domain, shop_id, customer, orders_requested } = req.body;

      // Respond immediately - process asynchronously
      res.status(200).json({ success: true, acknowledged: true });

      // Process request asynchronously after responding
      setImmediate(async () => {
        try {
          console.log('📡 Unified compliance webhook received:', { topic, shop_domain });

          switch (topic) {
            case 'customers/data_request':
              console.log('📋 GDPR data request:', { shop_domain, customer_email: customer?.email, orders_requested });
              console.log('⚠️ Manual action required: Customer data request needs to be fulfilled');
              console.log('Customer details:', JSON.stringify(customer, null, 2));
              break;

            case 'customers/redact':
              console.log('🗑️ GDPR customer redaction:', { shop_domain, customer_email: customer?.email, customer_id: customer?.id });
              console.log('⚠️ Manual action required: Customer data redaction needs to be processed');
              console.log('Customer to redact:', JSON.stringify(customer, null, 2));
              break;

            case 'shop/redact':
              console.log('🗑️ GDPR shop redaction:', { shop_domain, shop_id });
              
              // Find and delete all shop data (non-blocking)
              try {
                const connections = await supabaseStorage.getStoreConnections('');
                const shopConnections = connections.filter(conn => 
                  conn.platform === 'shopify' && 
                  conn.storeUrl?.includes(shop_domain)
                );

                for (const connection of shopConnections) {
                  await supabaseStorage.deleteStoreConnection(connection.id);
                  console.log('✅ Deleted store connection:', connection.id);
                }
                
                console.log('✅ Shop data redaction completed for:', shop_domain);
              } catch (dbError) {
                console.error('Error processing shop redaction:', dbError);
              }
              break;

            default:
              console.log('⚠️ Unknown webhook topic:', topic);
              break;
          }
        } catch (asyncError: any) {
          console.error('Error processing compliance webhook asynchronously:', asyncError);
        }
      });
    } catch (error: any) {
      console.error('Error in compliance webhook handler:', error);
      // Return 200 even on errors to prevent Shopify retries
      res.status(200).json({ success: false });
    }
  });

  // 1. App Uninstalled Webhook
  // Triggered when merchant uninstalls the app
  app.post('/api/webhooks/shopify/app_uninstalled', verifyShopifyWebhook, async (req, res) => {
    try {
      const { shop_domain, shop_id } = req.body;
      
      console.log('📦 Shopify app uninstalled:', { shop_domain, shop_id });

      // Find and deactivate the store connection
      const connections = await supabaseStorage.getStoreConnections('');
      const connection = connections.find(conn => 
        conn.platform === 'shopify' && 
        conn.storeUrl?.includes(shop_domain)
      );

      if (connection) {
        await supabaseStorage.updateStoreConnection(connection.id, {
          status: 'inactive',
          updatedAt: new Date()
        });
        console.log('✅ Deactivated store connection:', connection.id);
      }

      // Respond with 200 OK as required by Shopify
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error handling app uninstalled webhook:', error);
      // Still return 200 to prevent Shopify retries
      res.status(200).json({ success: false });
    }
  });

  // NOTE: Individual GDPR webhook endpoints removed - all GDPR compliance webhooks
  // (customers/data_request, customers/redact, shop/redact) are handled by the 
  // unified /api/webhooks/compliance endpoint above, which is configured in shopify.app.toml

  // 2. Orders Paid Webhook - Track product sales for conversion lift attribution
  app.post('/api/webhooks/shopify/orders/paid', verifyShopifyWebhook, async (req, res) => {
    // CRITICAL: Respond immediately to prevent 503 timeout
    res.status(200).json({ success: true });
    
    // Process order data asynchronously after responding
    try {
      const orderData = req.body;
      console.log('💰 Order paid webhook received:', {
        order_id: orderData.id,
        order_number: orderData.order_number,
        total_price: orderData.total_price,
        line_items_count: orderData.line_items?.length || 0
      });

      // Import conversion tracking helper
      const { trackProductSale } = await import('./lib/conversion-tracking');

      // Process each line item
      for (const lineItem of orderData.line_items || []) {
        try {
          // Find product in our database by Shopify product ID
          const shopifyProductId = lineItem.product_id?.toString();
          if (!shopifyProductId) continue;

          const [product] = await db
            .select()
            .from(products)
            .where(eq(products.shopifyId, shopifyProductId))
            .limit(1);

          if (!product) {
            console.log(`[Orders/Paid] Product not found in database: ${shopifyProductId}`);
            continue;
          }

          // Only track if product is optimized
          if (!product.isOptimized) {
            console.log(`[Orders/Paid] Skipping non-optimized product: ${product.id}`);
            continue;
          }

          // Calculate sale metrics using correct Shopify revenue field
          // 1. price_set.shop_money.amount is per-unit, multiply by quantity
          // 2. total_price already includes quantity, use directly
          // 3. price is per-unit fallback, multiply by quantity
          const saleAmount = lineItem.price_set?.shop_money?.amount 
            ? parseFloat(lineItem.price_set.shop_money.amount) * (lineItem.quantity || 1)
            : lineItem.total_price
              ? parseFloat(lineItem.total_price)
              : parseFloat(lineItem.price) * (lineItem.quantity || 1);

          // Track the sale - this will calculate lift and create revenue attribution
          // Note: For now, we use placeholder metrics. 
          // TODO: Integrate Shopify Analytics API to get real views/conversions
          await trackProductSale(product.userId, product.id, saleAmount, {
            totalViews: 100, // Placeholder - replace with Shopify Analytics
            totalConversions: 5, // Placeholder - replace with Shopify Analytics
            totalRevenue: saleAmount // This sale's revenue
          });

          console.log(`[Orders/Paid] Tracked sale for optimized product ${product.id}: $${saleAmount}`);
        } catch (itemError) {
          console.error('[Orders/Paid] Error processing line item:', itemError);
          // Continue processing other items
        }
      }

      console.log('✅ Order processed for conversion tracking');
    } catch (error) {
      console.error('❌ Error handling orders/paid webhook:', error);
      // Error is logged but doesn't affect response (already sent)
    }
  });

  // Unified Cron Endpoint - Called by GitHub Actions every 6 hours
  // Runs all scheduled tasks: billing, campaigns, and product sync
  app.post('/api/cron', async (req, res) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    console.log(`[Cron] 🕐 Starting scheduled tasks at ${timestamp}`);
    
    // Verify internal service token
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;
    
    if (!expectedToken) {
      console.error('[Cron] ❌ INTERNAL_SERVICE_TOKEN not configured');
      return res.status(500).json({ 
        error: 'Server misconfiguration',
        message: 'INTERNAL_SERVICE_TOKEN not set' 
      });
    }
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      console.error('[Cron] ❌ Unauthorized access attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const results: Record<string, any> = {
      timestamp,
      tasks: {}
    };
    
    // Task 1: Billing & Subscription Renewals
    try {
      console.log('[Cron] 💳 Running billing tasks...');
      const { runBillingTasks } = await import('./lib/trial-expiration-service');
      await runBillingTasks();
      results.tasks.billing = { success: true, message: 'Billing tasks completed' };
      console.log('[Cron] ✅ Billing tasks completed');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.tasks.billing = { success: false, error: errorMsg };
      console.error('[Cron] ❌ Billing tasks failed:', errorMsg);
    }
    
    // Task 2: Scheduled Campaign Processing
    try {
      console.log('[Cron] 📧 Processing scheduled campaigns...');
      const { processScheduledCampaigns } = await import('./lib/campaign-scheduler');
      await processScheduledCampaigns();
      results.tasks.campaigns = { success: true, message: 'Campaigns processed' };
      console.log('[Cron] ✅ Campaign processing completed');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.tasks.campaigns = { success: false, error: errorMsg };
      console.error('[Cron] ❌ Campaign processing failed:', errorMsg);
    }
    
    // Task 3: Shopify Product Sync
    try {
      console.log('[Cron] 🛍️ Syncing Shopify products...');
      
      // Get all active Shopify connections directly from Supabase (across all users)
      const { data: shopifyConnections, error } = await supabase
        .from('store_connections')
        .select('*')
        .eq('platform', 'shopify')
        .eq('status', 'active');
      
      if (error) {
        throw new Error(`Failed to fetch Shopify connections: ${error.message}`);
      }
      
      if (shopifyConnections.length === 0) {
        results.tasks.productSync = { 
          success: true, 
          message: 'No active Shopify stores to sync',
          storesSynced: 0
        };
        console.log('[Cron] ℹ️ No active Shopify connections found');
      } else {
        console.log(`[Cron] Found ${shopifyConnections.length} active Shopify connection(s)`);
        
        const syncResults: Array<{ store: string; userId: string; success: boolean; error?: string }> = [];
        
        for (const connection of shopifyConnections) {
          try {
            // Supabase returns snake_case column names
            const userId = (connection as any).user_id;
            const storeName = (connection as any).store_name || (connection as any).store_url || 'Unknown';
            console.log(`[Cron] Syncing store: ${storeName} for user ${userId}`);
            
            // Call sync API with service token
            // Use production URL on Vercel, localhost in development
            const baseUrl = process.env.VERCEL_URL 
              ? `https://${process.env.VERCEL_URL}` 
              : 'http://127.0.0.1:5000';
            
            const response = await fetch(`${baseUrl}/api/shopify/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${expectedToken}`,
                'x-internal-user-id': userId
              },
              body: JSON.stringify({ userId })
            });
            
            if (response.ok) {
              syncResults.push({ 
                store: storeName,
                userId,
                success: true 
              });
              console.log(`[Cron] ✅ Successfully synced ${storeName}`);
            } else {
              const errorText = await response.text();
              syncResults.push({ 
                store: storeName,
                userId,
                success: false,
                error: errorText
              });
              console.error(`[Cron] ❌ Failed to sync ${storeName}: ${errorText}`);
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            syncResults.push({ 
              store: (connection as any).store_name || (connection as any).store_url || 'Unknown',
              userId: (connection as any).user_id,
              success: false,
              error: errorMsg
            });
            console.error(`[Cron] ❌ Error syncing store:`, errorMsg);
          }
        }
        
        const successCount = syncResults.filter(r => r.success).length;
        const failCount = syncResults.filter(r => !r.success).length;
        
        results.tasks.productSync = { 
          success: failCount === 0,
          message: `Synced ${successCount}/${shopifyConnections.length} store(s)`,
          storesSynced: successCount,
          failed: failCount,
          details: syncResults
        };
        console.log(`[Cron] ✅ Product sync completed: ${successCount} succeeded, ${failCount} failed`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.tasks.productSync = { success: false, error: errorMsg };
      console.error('[Cron] ❌ Product sync failed:', errorMsg);
    }
    
    const duration = Date.now() - startTime;
    results.duration = `${duration}ms`;
    results.success = Object.values(results.tasks).every((task: any) => task.success);
    
    console.log(`[Cron] 🏁 All tasks completed in ${duration}ms`);
    console.log(`[Cron] Summary:`, JSON.stringify(results, null, 2));
    
    res.status(200).json(results);
  });

  // ===== AUTOMATION SETTINGS =====
  
  // Get user's automation settings
  app.get("/api/automation/settings", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;

      const { automationSettings } = await import('@shared/schema');
      
      const settings = await db
        .select()
        .from(automationSettings)
        .where(eq(automationSettings.userId, userId))
        .limit(1);

      if (settings.length === 0) {
        // Initialize settings for user
        const { initializeUserAutomationSettings } = await import('./lib/default-autonomous-rules');
        await initializeUserAutomationSettings(userId);
        
        // Fetch again
        const newSettings = await db
          .select()
          .from(automationSettings)
          .where(eq(automationSettings.userId, userId))
          .limit(1);
          
        return res.json(newSettings[0]);
      }

      res.json(settings[0]);
    } catch (error) {
      console.error("Error fetching automation settings:", error);
      res.status(500).json({ error: "Failed to fetch automation settings" });
    }
  });

  // Update user's automation settings
  app.put("/api/automation/settings", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;

      const { automationSettings, updateAutomationSettingsSchema } = await import('@shared/schema');
      
      // Validate request body
      const validated = updateAutomationSettingsSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validated.error.errors 
        });
      }

      await db
        .update(automationSettings)
        .set({
          ...validated.data,
          updatedAt: new Date(),
        })
        .where(eq(automationSettings.userId, userId));

      const updated = await db
        .select()
        .from(automationSettings)
        .where(eq(automationSettings.userId, userId))
        .limit(1);

      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating automation settings:", error);
      res.status(500).json({ error: "Failed to update automation settings" });
    }
  });

  // ===== PENDING APPROVALS (Manual Mode) =====
  
  // Get pending approvals for review
  app.get("/api/pending-approvals", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { pendingApprovals } = await import('@shared/schema');
      
      const status = (req.query.status as string) || 'pending';
      
      const approvals = await db
        .select()
        .from(pendingApprovals)
        .where(
          and(
            eq(pendingApprovals.userId, userId),
            eq(pendingApprovals.status, status)
          )
        )
        .orderBy(desc(pendingApprovals.createdAt));

      res.json(approvals);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      res.status(500).json({ error: "Failed to fetch pending approvals" });
    }
  });

  // Approve a recommendation and execute it
  app.post("/api/pending-approvals/:id/approve", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const approvalId = req.params.id;

      const { pendingApprovals, autonomousActions } = await import('@shared/schema');
      
      // Get the pending approval
      const [approval] = await db
        .select()
        .from(pendingApprovals)
        .where(
          and(
            eq(pendingApprovals.id, approvalId),
            eq(pendingApprovals.userId, userId),
            eq(pendingApprovals.status, 'pending')
          )
        )
        .limit(1);

      if (!approval) {
        return res.status(404).json({ error: "Approval not found or already processed" });
      }

      // Execute the recommended action
      const actionPayload = approval.recommendedAction as any;
      const { executeApprovedAction } = await import('./lib/approval-executor');
      
      const executionResult = await executeApprovedAction(
        userId,
        approval.actionType,
        actionPayload,
        approvalId,
        approval.aiReasoning || undefined
      );

      if (!executionResult.success) {
        return res.status(500).json({ 
          error: "Failed to execute approved action",
          details: executionResult.error 
        });
      }

      // Update approval status
      await db
        .update(pendingApprovals)
        .set({
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: userId,
          executedActionId: executionResult.actionId
        })
        .where(eq(pendingApprovals.id, approvalId));

      res.json({ 
        success: true,
        actionId: executionResult.actionId,
        result: executionResult.result
      });
    } catch (error) {
      console.error("Error approving recommendation:", error);
      res.status(500).json({ error: "Failed to approve recommendation" });
    }
  });

  // Reject a recommendation
  app.post("/api/pending-approvals/:id/reject", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const approvalId = req.params.id;

      const { pendingApprovals } = await import('@shared/schema');
      
      // Update approval status
      const updated = await db
        .update(pendingApprovals)
        .set({
          status: 'rejected',
          reviewedAt: new Date(),
          reviewedBy: userId
        })
        .where(
          and(
            eq(pendingApprovals.id, approvalId),
            eq(pendingApprovals.userId, userId),
            eq(pendingApprovals.status, 'pending')
          )
        )
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Approval not found or already processed" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting recommendation:", error);
      res.status(500).json({ error: "Failed to reject recommendation" });
    }
  });

  // Get autonomous actions (activity timeline)
  app.get("/api/autonomous-actions", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;

      const { autonomousActions } = await import('@shared/schema');
      
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const actions = await db
        .select()
        .from(autonomousActions)
        .where(eq(autonomousActions.userId, userId))
        .orderBy(desc(autonomousActions.createdAt))
        .limit(limit)
        .offset(offset);

      res.json(actions);
    } catch (error) {
      console.error("Error fetching autonomous actions:", error);
      res.status(500).json({ error: "Failed to fetch autonomous actions" });
    }
  });

  // Get autopilot statistics
  app.get("/api/autopilot/stats", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { autonomousActions } = await import('@shared/schema');
      // Database is already imported as db
      // Using db directly
      
      // Get actions from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const actions = await db
        .select()
        .from(autonomousActions)
        .where(
          and(
            eq(autonomousActions.userId, userId),
            sql`${autonomousActions.createdAt} >= ${sevenDaysAgo}`
          )
        )
        .orderBy(autonomousActions.createdAt);

      // Calculate metrics
      const totalActions = actions.length;
      const completedActions = actions.filter(a => a.status === 'completed').length;
      const failedActions = actions.filter(a => a.status === 'failed').length;
      const successRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
      
      // Count by action type
      const seoOptimizations = actions.filter(a => a.actionType === 'optimize_seo').length;
      const cartRecoveries = actions.filter(a => a.actionType === 'send_cart_recovery').length;
      
      // Daily breakdown for chart
      const dailyBreakdown: { date: string; actions: number; completed: number; failed: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayActions = actions.filter(a => {
          if (!a.createdAt) return false;
          const actionDate = new Date(a.createdAt).toISOString().split('T')[0];
          return actionDate === dateStr;
        });
        
        dailyBreakdown.push({
          date: dateStr,
          actions: dayActions.length,
          completed: dayActions.filter(a => a.status === 'completed').length,
          failed: dayActions.filter(a => a.status === 'failed').length,
        });
      }

      res.json({
        totalActions,
        completedActions,
        failedActions,
        successRate,
        seoOptimizations,
        cartRecoveries,
        dailyBreakdown,
      });
    } catch (error) {
      console.error("Error fetching autopilot stats:", error);
      res.status(500).json({ error: "Failed to fetch autopilot statistics" });
    }
  });

  // Rollback an autonomous action
  app.post("/api/autonomous-actions/:id/rollback", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;

      const { autonomousActions, productSnapshots, products: productsTable } = await import('@shared/schema');
      
      const actionId = req.params.id;

      // Get the action
      const action = await db
        .select()
        .from(autonomousActions)
        .where(and(
          eq(autonomousActions.id, actionId),
          eq(autonomousActions.userId, userId)
        ))
        .limit(1);

      if (action.length === 0) {
        return res.status(404).json({ error: "Action not found" });
      }

      // Get the snapshot before this action
      const snapshot = await db
        .select()
        .from(productSnapshots)
        .where(and(
          eq(productSnapshots.actionId, actionId),
          eq(productSnapshots.reason, 'before_optimization')
        ))
        .limit(1);

      if (snapshot.length === 0) {
        return res.status(400).json({ error: "No snapshot found for rollback" });
      }

      const { seoMeta: seoMetaTable } = await import('@shared/schema');

      // Restore both product and seoMeta data from snapshot
      const snapshotData = snapshot[0].snapshotData as any;
      
      // Restore product data (if any fields were changed)
      if (snapshotData.product) {
        await db
          .update(productsTable)
          .set({
            name: snapshotData.product.name,
            description: snapshotData.product.description,
          })
          .where(eq(productsTable.id, action[0].entityId as string));
      }

      // Restore seoMeta data
      if (snapshotData.seoMeta) {
        const existingSeo = await db
          .select()
          .from(seoMetaTable)
          .where(eq(seoMetaTable.productId, action[0].entityId as string))
          .limit(1);

        if (existingSeo.length > 0) {
          // Update existing
          await db
            .update(seoMetaTable)
            .set({
              seoTitle: snapshotData.seoMeta.seoTitle,
              metaDescription: snapshotData.seoMeta.metaDescription,
              seoScore: snapshotData.seoMeta.seoScore,
            })
            .where(eq(seoMetaTable.productId, action[0].entityId as string));
        } else if (snapshotData.seoMeta.seoTitle) {
          // Recreate if it existed before
          await db.insert(seoMetaTable).values({
            productId: action[0].entityId as string,
            seoTitle: snapshotData.seoMeta.seoTitle,
            metaDescription: snapshotData.seoMeta.metaDescription,
            seoScore: snapshotData.seoMeta.seoScore,
          });
        }
      }

      // Mark action as rolled back
      await db
        .update(autonomousActions)
        .set({
          status: 'rolled_back' as any,
          rolledBackAt: new Date(),
          result: {
            ...action[0].result,
            rolledBack: true,
            rollbackAt: new Date().toISOString(),
          } as any,
        })
        .where(eq(autonomousActions.id, actionId));

      res.json({ success: true, message: "Action rolled back successfully" });
    } catch (error) {
      console.error("Error rolling back action:", error);
      res.status(500).json({ error: "Failed to rollback action" });
    }
  });

  // ============================================================================
  // DYNAMIC PRICING AUTOMATION ROUTES
  // ============================================================================

  // Get pricing settings for current user
  app.get("/api/pricing/settings", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { pricingSettings } = await import('@shared/schema');

      const settings = await db
        .select()
        .from(pricingSettings)
        .where(eq(pricingSettings.userId, userId))
        .limit(1);

      if (settings.length === 0) {
        // Return default settings if none exist
        res.json({
          pricingAutomationEnabled: false,
          defaultStrategy: 'match',
          globalMinMargin: '10.00',
          globalMaxDiscount: '30.00',
          priceUpdateFrequency: 'daily',
          requireApproval: true,
          approvalThreshold: '10.00',
          competitorScanEnabled: true,
          maxCompetitorsPerProduct: 3,
          notifyOnPriceChanges: true,
        });
      } else {
        res.json(settings[0]);
      }
    } catch (error) {
      console.error("Error fetching pricing settings:", error);
      res.status(500).json({ error: "Failed to fetch pricing settings" });
    }
  });

  // Update pricing settings
  app.put("/api/pricing/settings", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { pricingSettings, updatePricingSettingsSchema } = await import('@shared/schema');

      // Validate request body
      const validation = updatePricingSettingsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request data", details: validation.error.errors });
      }
      const validatedData = validation.data;

      // Check if settings exist
      const existing = await db
        .select()
        .from(pricingSettings)
        .where(eq(pricingSettings.userId, userId))
        .limit(1);

      let result;
      if (existing.length === 0) {
        // Create new settings
        result = await db
          .insert(pricingSettings)
          .values({
            userId,
            ...validatedData,
          })
          .returning();
      } else {
        // Update existing settings
        result = await db
          .update(pricingSettings)
          .set({
            ...validatedData,
            updatedAt: new Date(),
          })
          .where(eq(pricingSettings.userId, userId))
          .returning();
      }

      res.json(result[0]);
    } catch (error) {
      console.error("Error updating pricing settings:", error);
      res.status(500).json({ error: "Failed to update pricing settings" });
    }
  });

  // Get all competitor products for current user
  app.get("/api/pricing/competitors", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { competitorProducts, products } = await import('@shared/schema');
      // Database is already imported as db
      // Using db directly

      const competitors = await db
        .select({
          id: competitorProducts.id,
          productId: competitorProducts.productId,
          competitorName: competitorProducts.competitorName,
          competitorUrl: competitorProducts.competitorUrl,
          competitorSku: competitorProducts.competitorSku,
          productTitle: competitorProducts.productTitle,
          currentPrice: competitorProducts.currentPrice,
          previousPrice: competitorProducts.previousPrice,
          currency: competitorProducts.currency,
          inStock: competitorProducts.inStock,
          lastScrapedAt: competitorProducts.lastScrapedAt,
          scrapingEnabled: competitorProducts.scrapingEnabled,
          matchConfidence: competitorProducts.matchConfidence,
          createdAt: competitorProducts.createdAt,
          updatedAt: competitorProducts.updatedAt,
          productName: products.name,
        })
        .from(competitorProducts)
        .leftJoin(products, eq(competitorProducts.productId, products.id))
        .where(eq(competitorProducts.userId, userId))
        .orderBy(desc(competitorProducts.createdAt));

      res.json(competitors);
    } catch (error) {
      console.error("Error fetching competitor products:", error);
      res.status(500).json({ error: "Failed to fetch competitor products" });
    }
  });

  // Add new competitor product
  app.post("/api/pricing/competitors", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { competitorProducts, insertCompetitorProductSchema } = await import('@shared/schema');
      // Database is already imported as db
      // Using db directly

      // Validate request body
      const validation = insertCompetitorProductSchema.safeParse({
        ...req.body,
        userId,
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request data", details: validation.error.errors });
      }
      const validatedData = validation.data;

      const result = await db
        .insert(competitorProducts)
        .values(validatedData)
        .returning();

      res.json(result[0]);
    } catch (error) {
      console.error("Error adding competitor product:", error);
      res.status(500).json({ error: "Failed to add competitor product" });
    }
  });

  // Update competitor product
  app.put("/api/pricing/competitors/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const competitorId = req.params.id;
      const { competitorProducts } = await import('@shared/schema');
      // Database is already imported as db
      // Using db directly

      // Verify ownership
      const existing = await db
        .select()
        .from(competitorProducts)
        .where(and(
          eq(competitorProducts.id, competitorId),
          eq(competitorProducts.userId, userId)
        ))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: "Competitor product not found" });
      }

      const result = await db
        .update(competitorProducts)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(competitorProducts.id, competitorId))
        .returning();

      res.json(result[0]);
    } catch (error) {
      console.error("Error updating competitor product:", error);
      res.status(500).json({ error: "Failed to update competitor product" });
    }
  });

  // Delete competitor product
  app.delete("/api/pricing/competitors/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const competitorId = req.params.id;
      const { competitorProducts } = await import('@shared/schema');
      // Database is already imported as db
      // Using db directly

      // Verify ownership
      const existing = await db
        .select()
        .from(competitorProducts)
        .where(and(
          eq(competitorProducts.id, competitorId),
          eq(competitorProducts.userId, userId)
        ))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: "Competitor product not found" });
      }

      await db
        .delete(competitorProducts)
        .where(eq(competitorProducts.id, competitorId));

      res.json({ success: true, message: "Competitor product deleted" });
    } catch (error) {
      console.error("Error deleting competitor product:", error);
      res.status(500).json({ error: "Failed to delete competitor product" });
    }
  });

  // Get all pricing rules for current user
  app.get("/api/pricing/rules", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { pricingRules } = await import('@shared/schema');
      // Database is already imported as db
      // Using db directly

      const rules = await db
        .select()
        .from(pricingRules)
        .where(eq(pricingRules.userId, userId))
        .orderBy(desc(pricingRules.priority), desc(pricingRules.createdAt));

      res.json(rules);
    } catch (error) {
      console.error("Error fetching pricing rules:", error);
      res.status(500).json({ error: "Failed to fetch pricing rules" });
    }
  });

  // Add new pricing rule
  app.post("/api/pricing/rules", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { pricingRules, insertPricingRuleSchema } = await import('@shared/schema');
      // Database is already imported as db
      // Using db directly

      // Validate request body
      const validation = insertPricingRuleSchema.safeParse({
        ...req.body,
        userId,
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request data", details: validation.error.errors });
      }
      const validatedData = validation.data;

      const result = await db
        .insert(pricingRules)
        .values(validatedData)
        .returning();

      res.json(result[0]);
    } catch (error) {
      console.error("Error adding pricing rule:", error);
      res.status(500).json({ error: "Failed to add pricing rule" });
    }
  });

  // Update pricing rule
  app.put("/api/pricing/rules/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const ruleId = req.params.id;
      const { pricingRules } = await import('@shared/schema');
      // Database is already imported as db
      // Using db directly

      // Verify ownership
      const existing = await db
        .select()
        .from(pricingRules)
        .where(and(
          eq(pricingRules.id, ruleId),
          eq(pricingRules.userId, userId)
        ))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: "Pricing rule not found" });
      }

      const result = await db
        .update(pricingRules)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(pricingRules.id, ruleId))
        .returning();

      res.json(result[0]);
    } catch (error) {
      console.error("Error updating pricing rule:", error);
      res.status(500).json({ error: "Failed to update pricing rule" });
    }
  });

  // Delete pricing rule
  app.delete("/api/pricing/rules/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const ruleId = req.params.id;
      const { pricingRules } = await import('@shared/schema');
      // Database is already imported as db
      // Using db directly

      // Verify ownership
      const existing = await db
        .select()
        .from(pricingRules)
        .where(and(
          eq(pricingRules.id, ruleId),
          eq(pricingRules.userId, userId)
        ))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: "Pricing rule not found" });
      }

      await db
        .delete(pricingRules)
        .where(eq(pricingRules.id, ruleId));

      res.json({ success: true, message: "Pricing rule deleted" });
    } catch (error) {
      console.error("Error deleting pricing rule:", error);
      res.status(500).json({ error: "Failed to delete pricing rule" });
    }
  });

  // Get price change history
  app.get("/api/pricing/history", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { priceChanges, products, pricingRules } = await import('@shared/schema');
      // Database is already imported as db
      // Using db directly

      const history = await db
        .select({
          id: priceChanges.id,
          productId: priceChanges.productId,
          productName: products.name,
          ruleId: priceChanges.ruleId,
          ruleName: pricingRules.name,
          oldPrice: priceChanges.oldPrice,
          newPrice: priceChanges.newPrice,
          priceChange: priceChanges.priceChange,
          priceChangePercent: priceChanges.priceChangePercent,
          reason: priceChanges.reason,
          competitorPrice: priceChanges.competitorPrice,
          status: priceChanges.status,
          publishedToShopify: priceChanges.publishedToShopify,
          revenueImpact: priceChanges.revenueImpact,
          createdAt: priceChanges.createdAt,
          appliedAt: priceChanges.appliedAt,
          rolledBackAt: priceChanges.rolledBackAt,
        })
        .from(priceChanges)
        .leftJoin(products, eq(priceChanges.productId, products.id))
        .leftJoin(pricingRules, eq(priceChanges.ruleId, pricingRules.id))
        .where(eq(priceChanges.userId, userId))
        .orderBy(desc(priceChanges.createdAt))
        .limit(100);

      res.json(history);
    } catch (error) {
      console.error("Error fetching price history:", error);
      res.status(500).json({ error: "Failed to fetch price history" });
    }
  });

  // Rollback price change
  app.post("/api/pricing/rollback/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const priceChangeId = req.params.id;
      const { priceChanges, pricingSnapshots, products } = await import('@shared/schema');
      // Database is already imported as db
      // Using db directly

      // Get price change
      const priceChange = await db
        .select()
        .from(priceChanges)
        .where(and(
          eq(priceChanges.id, priceChangeId),
          eq(priceChanges.userId, userId)
        ))
        .limit(1);

      if (priceChange.length === 0) {
        return res.status(404).json({ error: "Price change not found" });
      }

      if (priceChange[0].status === 'rolled_back') {
        return res.status(400).json({ error: "Price change already rolled back" });
      }

      // Get snapshot
      const snapshot = await db
        .select()
        .from(pricingSnapshots)
        .where(eq(pricingSnapshots.priceChangeId, priceChangeId))
        .limit(1);

      if (snapshot.length === 0) {
        return res.status(404).json({ error: "No snapshot found for this price change" });
      }

      // Verify product ownership before updating
      const product = await db
        .select()
        .from(products)
        .where(and(
          eq(products.id, priceChange[0].productId),
          eq(products.userId, userId)
        ))
        .limit(1);

      if (product.length === 0) {
        return res.status(403).json({ error: "Unauthorized: Product does not belong to this user" });
      }

      // Restore old price
      await db
        .update(products)
        .set({
          price: snapshot[0].price,
        })
        .where(and(
          eq(products.id, priceChange[0].productId),
          eq(products.userId, userId)
        ));

      // Mark as rolled back
      await db
        .update(priceChanges)
        .set({
          status: 'rolled_back' as any,
          rolledBackAt: new Date(),
        })
        .where(eq(priceChanges.id, priceChangeId));

      res.json({ success: true, message: "Price change rolled back successfully" });
    } catch (error) {
      console.error("Error rolling back price change:", error);
      res.status(500).json({ error: "Failed to rollback price change" });
    }
  });

  // Get pricing statistics
  app.get("/api/pricing/stats", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { priceChanges, competitorProducts } = await import('@shared/schema');
      // Database is already imported as db
      // Using db directly

      // Get stats for last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentChanges = await db
        .select()
        .from(priceChanges)
        .where(and(
          eq(priceChanges.userId, userId),
          gte(priceChanges.createdAt, sevenDaysAgo)
        ));

      const totalCompetitors = await db
        .select({ count: sql<number>`count(*)` })
        .from(competitorProducts)
        .where(eq(competitorProducts.userId, userId));

      const appliedChanges = recentChanges.filter(c => c.status === 'applied');
      const totalPriceChanges = recentChanges.length;
      const successRate = totalPriceChanges > 0 
        ? Math.round((appliedChanges.length / totalPriceChanges) * 100) 
        : 0;

      // Calculate daily breakdown
      const dailyStats = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayChanges = recentChanges.filter(c => {
          const createdAt = new Date(c.createdAt!);
          return createdAt >= date && createdAt < nextDate;
        });

        dailyStats.push({
          date: date.toISOString().split('T')[0],
          priceChanges: dayChanges.length,
          applied: dayChanges.filter(c => c.status === 'applied').length,
        });
      }

      res.json({
        totalPriceChanges,
        appliedChanges: appliedChanges.length,
        successRate,
        totalCompetitors: totalCompetitors[0]?.count || 0,
        dailyStats,
      });
    } catch (error) {
      console.error("Error fetching pricing stats:", error);
      res.status(500).json({ error: "Failed to fetch pricing stats" });
    }
  });

  // Get comprehensive pricing analytics
  app.get("/api/pricing/analytics", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { priceChanges, competitorProducts, products } = await import('@shared/schema');
      
      // Get analytics for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get all price changes in last 30 days
      const changes = await db
        .select()
        .from(priceChanges)
        .where(and(
          eq(priceChanges.userId, userId),
          gte(priceChanges.createdAt, thirtyDaysAgo)
        ))
        .orderBy(desc(priceChanges.createdAt));

      const appliedChanges = changes.filter(c => c.status === 'applied');
      
      // Calculate revenue metrics
      let totalRevenueBefore = 0;
      let totalRevenueAfter = 0;
      let profitableChanges = 0;

      appliedChanges.forEach(change => {
        const revenueImpact = change.revenueImpact as any;
        if (revenueImpact && typeof revenueImpact === 'object') {
          const before = parseFloat(revenueImpact.before || '0');
          const after = parseFloat(revenueImpact.after || '0');
          
          if (!isNaN(before) && !isNaN(after)) {
            totalRevenueBefore += before;
            totalRevenueAfter += after;
            if (after > before) {
              profitableChanges++;
            }
          }
        }
      });

      const revenueIncrease = totalRevenueAfter - totalRevenueBefore;
      const revenueIncreasePercent = totalRevenueBefore > 0 
        ? ((revenueIncrease / totalRevenueBefore) * 100) 
        : 0;

      // Calculate win rate (percentage of profitable changes)
      const winRate = appliedChanges.length > 0 
        ? (profitableChanges / appliedChanges.length) * 100 
        : 0;

      // Calculate average margin improvement
      let totalMarginImprovement = 0;
      let changesWithMargin = 0;

      appliedChanges.forEach(change => {
        const oldPrice = parseFloat(change.oldPrice || '0');
        const newPrice = parseFloat(change.newPrice || '0');
        const competitorPrice = parseFloat(change.competitorPrice || '0');
        
        if (oldPrice > 0 && newPrice > 0 && competitorPrice > 0) {
          const oldMargin = ((oldPrice - competitorPrice) / oldPrice) * 100;
          const newMargin = ((newPrice - competitorPrice) / newPrice) * 100;
          const marginChange = newMargin - oldMargin;
          
          if (!isNaN(marginChange)) {
            totalMarginImprovement += marginChange;
            changesWithMargin++;
          }
        }
      });

      const averageMarginImprovement = changesWithMargin > 0 
        ? totalMarginImprovement / changesWithMargin 
        : 0;

      // Get competitor stats
      const allCompetitors = await db
        .select()
        .from(competitorProducts)
        .where(eq(competitorProducts.userId, userId));

      const activeCompetitors = allCompetitors.filter(c => c.scrapingEnabled);
      const competitorsTracked = allCompetitors.length;
      const competitorsActive = activeCompetitors.length;

      // Calculate average competitor price vs our prices
      const allProducts = await db
        .select()
        .from(products)
        .where(eq(products.userId, userId));

      let totalOurPrice = 0;
      let totalCompetitorPrice = 0;
      let comparisonCount = 0;

      allCompetitors.forEach(comp => {
        const product = allProducts.find(p => p.id === comp.productId);
        if (product && comp.currentPrice) {
          totalOurPrice += parseFloat(product.price || '0');
          totalCompetitorPrice += parseFloat(comp.currentPrice || '0');
          comparisonCount++;
        }
      });

      const avgPriceDifference = comparisonCount > 0 
        ? ((totalOurPrice - totalCompetitorPrice) / comparisonCount) 
        : 0;

      // Generate 30-day trend data
      const trendData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayChanges = changes.filter(c => {
          const createdAt = new Date(c.createdAt!);
          return createdAt >= date && createdAt < nextDate;
        });

        const dayApplied = dayChanges.filter(c => c.status === 'applied');
        
        // Calculate daily revenue impact
        let dailyRevenue = 0;
        dayApplied.forEach(change => {
          const revenueImpact = change.revenueImpact as any;
          if (revenueImpact && typeof revenueImpact === 'object') {
            const before = parseFloat(revenueImpact.before || '0');
            const after = parseFloat(revenueImpact.after || '0');
            if (!isNaN(before) && !isNaN(after)) {
              dailyRevenue += (after - before);
            }
          }
        });

        trendData.push({
          date: date.toISOString().split('T')[0],
          priceChanges: dayChanges.length,
          applied: dayApplied.length,
          revenueImpact: Math.round(dailyRevenue * 100) / 100,
          winRate: dayApplied.length > 0 
            ? Math.round((dayApplied.filter(c => {
                const ri = c.revenueImpact as any;
                if (ri && typeof ri === 'object') {
                  const before = parseFloat(ri.before || '0');
                  const after = parseFloat(ri.after || '0');
                  return after > before;
                }
                return false;
              }).length / dayApplied.length) * 100) 
            : 0,
        });
      }

      res.json({
        summary: {
          totalChanges: changes.length,
          appliedChanges: appliedChanges.length,
          pendingChanges: changes.filter(c => c.status === 'pending').length,
          rolledBackChanges: changes.filter(c => c.status === 'rolled_back').length,
        },
        revenue: {
          before: Math.round(totalRevenueBefore * 100) / 100,
          after: Math.round(totalRevenueAfter * 100) / 100,
          increase: Math.round(revenueIncrease * 100) / 100,
          increasePercent: Math.round(revenueIncreasePercent * 100) / 100,
        },
        performance: {
          winRate: Math.round(winRate * 100) / 100,
          profitableChanges,
          totalApplied: appliedChanges.length,
          averageMarginImprovement: Math.round(averageMarginImprovement * 100) / 100,
        },
        competitors: {
          total: competitorsTracked,
          active: competitorsActive,
          avgPriceDifference: Math.round(avgPriceDifference * 100) / 100,
        },
        trends: trendData,
      });
    } catch (error) {
      console.error("Error fetching pricing analytics:", error);
      res.status(500).json({ error: "Failed to fetch pricing analytics" });
    }
  });

  // ========================
  // BULK OPTIMIZATION ROUTES
  // ========================

  // Initialize bulk optimization service with database storage for persistence
  // Using dbStorage instead of MemStorage so jobs survive server restarts
  const bulkOptService = new BulkOptimizationService(dbStorage);

  // Create a new bulk optimization job
  app.post("/api/bulk-optimization", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { productIds, optimizationMode = 'fast' } = req.body;

      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: "Product IDs array is required" });
      }

      // Validate optimization mode
      if (!['fast', 'competitive'].includes(optimizationMode)) {
        return res.status(400).json({ error: "Invalid optimization mode. Must be 'fast' or 'competitive'" });
      }

      // Create the job
      const job = await bulkOptService.createJob(userId, productIds, 'Bulk Optimization Job', optimizationMode);

      // Fetch product details and create items for each product
      const products = await storage.getProducts(userId);
      const productMap = new Map(products.map(p => [p.id, p]));
      
      console.log(`📦 [BULK OPT] Creating items for job ${job.id}:`);
      console.log(`   - Requested productIds: ${JSON.stringify(productIds)}`);
      console.log(`   - Available product IDs: ${JSON.stringify(products.map(p => p.id))}`);

      let itemsCreated = 0;
      for (const productId of productIds) {
        const product = productMap.get(productId);
        if (product) {
          await dbStorage.createBulkOptimizationItem({
            jobId: job.id,
            productId: product.id,
            productName: product.name,
            category: product.category || null,
            keyFeatures: product.description?.substring(0, 500) || null,
            targetAudience: null,
            status: 'pending',
            retryCount: 0,
            maxRetries: 3,
          });
          itemsCreated++;
          console.log(`   ✅ Created item for product: ${product.name}`);
        } else {
          console.log(`   ⚠️ Product not found: ${productId}`);
        }
      }
      
      console.log(`📦 [BULK OPT] Created ${itemsCreated} items for job ${job.id}`);

      // Trigger processing asynchronously (don't await - let it run in background)
      bulkOptService.processJob(job.id).catch(err => {
        console.error(`Background job ${job.id} processing failed:`, err);
      });

      res.json(job);
    } catch (error: any) {
      console.error("Error creating bulk optimization job:", error);
      res.status(500).json({ error: error.message || "Failed to create bulk optimization job" });
    }
  });

  // Get all bulk optimization jobs for user
  app.get("/api/bulk-optimization", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const jobs = await dbStorage.getBulkOptimizationJobs(userId);
      res.json(jobs);
    } catch (error: any) {
      console.error("Error fetching bulk optimization jobs:", error);
      res.status(500).json({ error: "Failed to fetch bulk optimization jobs" });
    }
  });

  // Get single bulk optimization job with items
  app.get("/api/bulk-optimization/:jobId", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { jobId } = req.params;

      const job = await dbStorage.getBulkOptimizationJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Verify ownership
      if (job.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const items = await dbStorage.getBulkOptimizationItems(jobId);
      res.json({ ...job, items });
    } catch (error: any) {
      console.error("Error fetching bulk optimization job:", error);
      res.status(500).json({ error: "Failed to fetch bulk optimization job" });
    }
  });

  // Start processing a bulk optimization job
  app.post("/api/bulk-optimization/:jobId/start", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { jobId } = req.params;

      const job = await dbStorage.getBulkOptimizationJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Verify ownership
      if (job.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Prevent concurrent processing
      if (job.status === 'processing') {
        return res.status(409).json({ error: "Job is already being processed" });
      }

      if (job.status === 'completed') {
        return res.status(400).json({ error: "Job is already completed" });
      }

      // Start processing asynchronously (don't await)
      bulkOptService.processJob(jobId).catch(error => {
        console.error(`Background job processing error for ${jobId}:`, error);
      });

      res.json({ message: "Job processing started", jobId });
    } catch (error: any) {
      console.error("Error starting bulk optimization job:", error);
      res.status(500).json({ error: "Failed to start bulk optimization job" });
    }
  });

  // Retry failed items in a job
  app.post("/api/bulk-optimization/:jobId/retry", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { jobId } = req.params;

      const job = await dbStorage.getBulkOptimizationJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Verify ownership
      if (job.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Start retry asynchronously
      bulkOptService.retryFailedItems(jobId).catch(error => {
        console.error(`Background retry error for ${jobId}:`, error);
      });

      res.json({ message: "Retry started", jobId });
    } catch (error: any) {
      console.error("Error retrying failed items:", error);
      res.status(500).json({ error: "Failed to retry failed items" });
    }
  });

  // Delete a bulk optimization job
  app.delete("/api/bulk-optimization/:jobId", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { jobId } = req.params;

      const job = await dbStorage.getBulkOptimizationJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Verify ownership
      if (job.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await dbStorage.deleteBulkOptimizationJob(jobId);
      res.json({ message: "Job deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting bulk optimization job:", error);
      res.status(500).json({ error: "Failed to delete bulk optimization job" });
    }
  });

  // ===== UPSELL EMAIL RECEIPTS ROUTES =====
  
  // Get upsell receipt settings
  app.get("/api/upsell/settings", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const settings = await upsellRecommendationEngine.getOrCreateSettings(userId);
      res.json(settings);
    } catch (error: any) {
      console.error("Error fetching upsell settings:", error);
      res.status(500).json({ error: "Failed to fetch upsell settings" });
    }
  });

  // Update upsell receipt settings
  app.patch("/api/upsell/settings", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const updated = await upsellRecommendationEngine.updateSettings(userId, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating upsell settings:", error);
      res.status(500).json({ error: "Failed to update upsell settings" });
    }
  });

  // Get recommendation rules
  app.get("/api/upsell/rules", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const rules = await upsellRecommendationEngine.getActiveRules(userId);
      res.json(rules);
    } catch (error: any) {
      console.error("Error fetching upsell rules:", error);
      res.status(500).json({ error: "Failed to fetch upsell rules" });
    }
  });

  // Create recommendation rule
  app.post("/api/upsell/rules", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const database = db;
      if (!database) {
        return res.status(500).json({ error: "Database not available" });
      }
      const [rule] = await database.insert(upsellRecommendationRules)
        .values({ ...req.body, userId })
        .returning();
      res.status(201).json(rule);
    } catch (error: any) {
      console.error("Error creating upsell rule:", error);
      res.status(500).json({ error: "Failed to create upsell rule" });
    }
  });

  // Update recommendation rule
  app.patch("/api/upsell/rules/:ruleId", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { ruleId } = req.params;
      const database = db;
      if (!database) {
        return res.status(500).json({ error: "Database not available" });
      }
      const [updated] = await database.update(upsellRecommendationRules)
        .set({ ...req.body, updatedAt: new Date() })
        .where(and(
          eq(upsellRecommendationRules.id, ruleId),
          eq(upsellRecommendationRules.userId, userId)
        ))
        .returning();
      if (!updated) {
        return res.status(404).json({ error: "Rule not found" });
      }
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating upsell rule:", error);
      res.status(500).json({ error: "Failed to update upsell rule" });
    }
  });

  // Delete recommendation rule
  app.delete("/api/upsell/rules/:ruleId", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { ruleId } = req.params;
      const database = db;
      if (!database) {
        return res.status(500).json({ error: "Database not available" });
      }
      await database.delete(upsellRecommendationRules)
        .where(and(
          eq(upsellRecommendationRules.id, ruleId),
          eq(upsellRecommendationRules.userId, userId)
        ));
      res.json({ message: "Rule deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting upsell rule:", error);
      res.status(500).json({ error: "Failed to delete upsell rule" });
    }
  });

  // Get upsell analytics
  app.get("/api/upsell/analytics", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const days = parseInt(req.query.days as string) || 30;
      const analytics = await upsellRecommendationEngine.getAnalytics(userId, days);
      res.json(analytics);
    } catch (error: any) {
      console.error("Error fetching upsell analytics:", error);
      res.status(500).json({ error: "Failed to fetch upsell analytics" });
    }
  });

  // Track upsell click (public endpoint - no auth required)
  app.get("/api/upsell/click/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const productId = req.query.product as string;
      
      if (!productId) {
        return res.status(400).json({ error: "Product ID required" });
      }

      await upsellRecommendationEngine.trackClick(token, productId);
      
      // Redirect to Shopify product page (or custom redirect)
      const redirectUrl = req.query.redirect as string;
      if (redirectUrl) {
        res.redirect(redirectUrl);
      } else {
        res.json({ success: true, message: "Click tracked" });
      }
    } catch (error: any) {
      console.error("Error tracking upsell click:", error);
      res.status(500).json({ error: "Failed to track click" });
    }
  });

  // Get A/B test results
  app.get("/api/upsell/ab-tests", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const testId = req.query.testId as string;
      const results = await upsellRecommendationEngine.getAbTestResults(userId, testId);
      res.json(results);
    } catch (error: any) {
      console.error("Error fetching A/B test results:", error);
      res.status(500).json({ error: "Failed to fetch A/B test results" });
    }
  });

  // Create new A/B test
  app.post("/api/upsell/ab-tests", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const test = await upsellRecommendationEngine.createAbTest(userId, req.body);
      res.status(201).json(test);
    } catch (error: any) {
      console.error("Error creating A/B test:", error);
      res.status(500).json({ error: "Failed to create A/B test" });
    }
  });

  // End A/B test
  app.post("/api/upsell/ab-tests/:testId/end", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { testId } = req.params;
      const { winnerId } = req.body;
      const result = await upsellRecommendationEngine.endAbTest(userId, testId, winnerId);
      if (!result) {
        return res.status(404).json({ error: "Test not found" });
      }
      res.json(result);
    } catch (error: any) {
      console.error("Error ending A/B test:", error);
      res.status(500).json({ error: "Failed to end A/B test" });
    }
  });

  // Preview upsell recommendations (for testing)
  app.post("/api/upsell/preview", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { order } = req.body;
      
      if (!order || !order.items || order.items.length === 0) {
        return res.status(400).json({ error: "Order with items required" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const recommendations = await upsellRecommendationEngine.getRecommendations(
        userId,
        { ...order, id: 'preview-' + Date.now() },
        baseUrl
      );
      
      res.json(recommendations);
    } catch (error: any) {
      console.error("Error generating preview recommendations:", error);
      res.status(500).json({ error: "Failed to generate preview" });
    }
  });

  // =============================================
  // BEHAVIORAL TRIGGERS API ROUTES
  // =============================================

  // Get all behavioral triggers for user
  app.get("/api/behavioral-triggers", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const status = req.query.status as string | undefined;
      
      let query = db.select().from(behavioralTriggers)
        .where(eq(behavioralTriggers.userId, userId))
        .orderBy(desc(behavioralTriggers.createdAt));
      
      const triggers = await query;
      
      // Filter by status if provided
      const filteredTriggers = status 
        ? triggers.filter(t => t.status === status)
        : triggers;
      
      res.json(filteredTriggers);
    } catch (error: any) {
      console.error("Error fetching behavioral triggers:", error);
      res.status(500).json({ error: "Failed to fetch triggers" });
    }
  });

  // Get single trigger by ID
  app.get("/api/behavioral-triggers/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id } = req.params;
      
      const [trigger] = await db.select().from(behavioralTriggers)
        .where(and(
          eq(behavioralTriggers.id, id),
          eq(behavioralTriggers.userId, userId)
        ));
      
      if (!trigger) {
        return res.status(404).json({ error: "Trigger not found" });
      }
      
      res.json(trigger);
    } catch (error: any) {
      console.error("Error fetching trigger:", error);
      res.status(500).json({ error: "Failed to fetch trigger" });
    }
  });

  // Create new behavioral trigger
  app.post("/api/behavioral-triggers", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const triggerData = insertBehavioralTriggerSchema.parse({
        ...req.body,
        userId
      });
      
      const [trigger] = await db.insert(behavioralTriggers)
        .values(triggerData)
        .returning();
      
      res.status(201).json(trigger);
    } catch (error: any) {
      console.error("Error creating trigger:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid trigger data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create trigger" });
    }
  });

  // Update behavioral trigger
  app.patch("/api/behavioral-triggers/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id } = req.params;
      
      // Verify ownership
      const [existing] = await db.select().from(behavioralTriggers)
        .where(and(
          eq(behavioralTriggers.id, id),
          eq(behavioralTriggers.userId, userId)
        ));
      
      if (!existing) {
        return res.status(404).json({ error: "Trigger not found" });
      }
      
      const [trigger] = await db.update(behavioralTriggers)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(behavioralTriggers.id, id))
        .returning();
      
      res.json(trigger);
    } catch (error: any) {
      console.error("Error updating trigger:", error);
      res.status(500).json({ error: "Failed to update trigger" });
    }
  });

  // Delete behavioral trigger
  app.delete("/api/behavioral-triggers/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id } = req.params;
      
      // Verify ownership
      const [existing] = await db.select().from(behavioralTriggers)
        .where(and(
          eq(behavioralTriggers.id, id),
          eq(behavioralTriggers.userId, userId)
        ));
      
      if (!existing) {
        return res.status(404).json({ error: "Trigger not found" });
      }
      
      await db.delete(behavioralTriggers)
        .where(eq(behavioralTriggers.id, id));
      
      res.json({ success: true, message: "Trigger deleted" });
    } catch (error: any) {
      console.error("Error deleting trigger:", error);
      res.status(500).json({ error: "Failed to delete trigger" });
    }
  });

  // Toggle trigger status (active/paused)
  app.post("/api/behavioral-triggers/:id/toggle", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id } = req.params;
      
      const [existing] = await db.select().from(behavioralTriggers)
        .where(and(
          eq(behavioralTriggers.id, id),
          eq(behavioralTriggers.userId, userId)
        ));
      
      if (!existing) {
        return res.status(404).json({ error: "Trigger not found" });
      }
      
      const newStatus = existing.status === 'active' ? 'paused' : 'active';
      
      const [trigger] = await db.update(behavioralTriggers)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(behavioralTriggers.id, id))
        .returning();
      
      res.json(trigger);
    } catch (error: any) {
      console.error("Error toggling trigger:", error);
      res.status(500).json({ error: "Failed to toggle trigger" });
    }
  });

  // Get AI-powered trigger recommendations
  app.get("/api/behavioral-triggers/ai/recommendations", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Get user's existing triggers to avoid duplicates
      const existingTriggers = await db.select().from(behavioralTriggers)
        .where(eq(behavioralTriggers.userId, userId));
      
      // Get user's store performance data for context
      const [recentEvents] = await db.select({
        totalEvents: sql<number>`COUNT(*)::int`,
        productViews: sql<number>`COUNT(*) FILTER (WHERE event_type = 'product_view')::int`,
        cartAdds: sql<number>`COUNT(*) FILTER (WHERE event_type = 'cart_add')::int`,
        cartAbandons: sql<number>`COUNT(*) FILTER (WHERE event_type = 'cart_abandon')::int`,
        orders: sql<number>`COUNT(*) FILTER (WHERE event_type = 'order_placed')::int`,
      }).from(behaviorEvents)
        .where(and(
          eq(behaviorEvents.userId, userId),
          gte(behaviorEvents.createdAt, sql`NOW() - INTERVAL '30 days'`)
        ));
      
      // Build context for AI
      const storeContext = {
        existingTriggerCount: existingTriggers.length,
        existingTriggerTypes: existingTriggers.map(t => `${t.eventType}:${t.conditionType}:${t.actionType}`),
        recentMetrics: recentEvents || { totalEvents: 0, productViews: 0, cartAdds: 0, cartAbandons: 0, orders: 0 }
      };

      // Generate AI recommendations
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an e-commerce marketing automation expert. Generate smart behavioral trigger recommendations based on store performance data.
            
Available event types: product_view, cart_add, cart_abandon, checkout_start, order_placed, order_fulfilled, page_visit, time_on_site, return_visit, first_purchase, repeat_purchase, high_value_cart, browse_without_buy, wishlist_add, search_query

Available condition types: count_gte (count >= value), count_lte, value_gte (amount >= value), value_lte, time_elapsed (hours after event), time_on_site_gte (minutes), is_first, is_return, no_action, segment_match

Available action types: send_email, send_sms, show_popup, offer_discount, assign_tag, add_to_segment, send_push, trigger_webhook

Return a JSON array of 5 trigger recommendations. Each should have:
- name: Short descriptive name
- description: Why this trigger is valuable
- eventType: One of the available event types
- conditionType: One of the available condition types
- conditionValue: The threshold value (number as string, e.g., "3", "200", "2")
- actionType: One of the available action types
- confidenceScore: 0-100 based on likely effectiveness
- reasoning: Why you recommend this specific trigger`
          },
          {
            role: "user",
            content: `Generate behavioral trigger recommendations for this store:
            
Store metrics (last 30 days):
- Total events tracked: ${storeContext.recentMetrics.totalEvents}
- Product views: ${storeContext.recentMetrics.productViews}
- Cart additions: ${storeContext.recentMetrics.cartAdds}
- Cart abandonments: ${storeContext.recentMetrics.cartAbandons}
- Orders placed: ${storeContext.recentMetrics.orders}

Existing triggers (avoid duplicates): ${storeContext.existingTriggerTypes.join(', ') || 'None'}

Generate 5 high-impact trigger recommendations that would benefit this store.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = aiResponse.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No AI response content");
      }

      const parsed = JSON.parse(content);
      const recommendations = parsed.recommendations || parsed.triggers || [];
      
      // Mark as AI recommended
      const formattedRecommendations = recommendations.map((rec: any) => ({
        ...rec,
        isAiRecommended: true,
        aiConfidenceScore: rec.confidenceScore,
        aiReasoning: rec.reasoning
      }));

      res.json(formattedRecommendations);
    } catch (error: any) {
      console.error("Error generating AI recommendations:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // Apply AI recommendation (create trigger from recommendation)
  app.post("/api/behavioral-triggers/ai/apply", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const recommendation = req.body;
      
      const triggerData = {
        userId,
        name: recommendation.name,
        description: recommendation.description,
        eventType: recommendation.eventType,
        conditionType: recommendation.conditionType,
        conditionValue: recommendation.conditionValue,
        actionType: recommendation.actionType,
        isAiRecommended: true,
        aiConfidenceScore: recommendation.confidenceScore?.toString(),
        aiReasoning: recommendation.reasoning,
        status: 'draft' as const
      };
      
      const [trigger] = await db.insert(behavioralTriggers)
        .values(triggerData)
        .returning();
      
      res.status(201).json(trigger);
    } catch (error: any) {
      console.error("Error applying AI recommendation:", error);
      res.status(500).json({ error: "Failed to apply recommendation" });
    }
  });

  // Get trigger analytics/performance
  app.get("/api/behavioral-triggers/analytics/summary", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const days = parseInt(req.query.days as string) || 30;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get execution stats
      const [execStats] = await db.select({
        totalExecutions: sql<number>`COUNT(*)::int`,
        successfulSends: sql<number>`COUNT(*) FILTER (WHERE status = 'sent' OR status = 'delivered')::int`,
        clicks: sql<number>`COUNT(*) FILTER (WHERE clicked = true)::int`,
        conversions: sql<number>`COUNT(*) FILTER (WHERE converted = true)::int`,
        totalRevenue: sql<string>`COALESCE(SUM(conversion_value), 0)`,
      }).from(triggerExecutions)
        .where(and(
          eq(triggerExecutions.userId, userId),
          gte(triggerExecutions.createdAt, startDate)
        ));
      
      // Get active triggers count
      const [triggerStats] = await db.select({
        total: sql<number>`COUNT(*)::int`,
        active: sql<number>`COUNT(*) FILTER (WHERE status = 'active')::int`,
        paused: sql<number>`COUNT(*) FILTER (WHERE status = 'paused')::int`,
        draft: sql<number>`COUNT(*) FILTER (WHERE status = 'draft')::int`,
      }).from(behavioralTriggers)
        .where(eq(behavioralTriggers.userId, userId));
      
      // Calculate rates
      const executions = execStats?.totalExecutions || 0;
      const clicks = execStats?.clicks || 0;
      const conversions = execStats?.conversions || 0;
      const revenue = parseFloat(execStats?.totalRevenue || '0');
      
      const clickRate = executions > 0 ? (clicks / executions * 100).toFixed(2) : '0.00';
      const conversionRate = executions > 0 ? (conversions / executions * 100).toFixed(2) : '0.00';
      const roi = executions > 0 ? (revenue / executions).toFixed(2) : '0.00';
      
      res.json({
        period: `${days} days`,
        triggers: triggerStats,
        executions: {
          total: executions,
          sent: execStats?.successfulSends || 0,
          clicks,
          conversions,
        },
        performance: {
          clickRate: parseFloat(clickRate),
          conversionRate: parseFloat(conversionRate),
          revenue,
          avgRevenuePerTrigger: parseFloat(roi),
        }
      });
    } catch (error: any) {
      console.error("Error fetching trigger analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Get execution history for a trigger
  app.get("/api/behavioral-triggers/:id/executions", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const executions = await db.select().from(triggerExecutions)
        .where(and(
          eq(triggerExecutions.triggerId, id),
          eq(triggerExecutions.userId, userId)
        ))
        .orderBy(desc(triggerExecutions.createdAt))
        .limit(limit);
      
      res.json(executions);
    } catch (error: any) {
      console.error("Error fetching executions:", error);
      res.status(500).json({ error: "Failed to fetch executions" });
    }
  });

  // Shopify webhook for behavior events (product view, cart, order, etc.)
  app.post("/api/webhooks/shopify/behavior", verifyShopifyWebhook, async (req, res) => {
    try {
      const { shop, topic, data } = req.body;
      
      // Find user by shop URL/domain
      const [connection] = await db.select().from(storeConnections)
        .where(eq(storeConnections.storeUrl, shop));
      
      if (!connection) {
        return res.status(404).json({ error: "Store not connected" });
      }
      
      // Map Shopify webhook topics to our event types
      const topicToEventType: Record<string, string> = {
        'products/view': 'product_view',
        'carts/create': 'cart_add',
        'carts/update': 'cart_add',
        'checkouts/create': 'checkout_start',
        'orders/create': 'order_placed',
        'orders/fulfilled': 'order_fulfilled',
      };
      
      const eventType = topicToEventType[topic];
      if (!eventType) {
        return res.json({ success: true, message: "Event type not tracked" });
      }
      
      // Create behavior event
      const eventData = {
        userId: connection.userId,
        customerId: data.customer?.id?.toString(),
        customerEmail: data.customer?.email || data.email,
        eventType: eventType as any,
        eventData: data,
        shopifyShopId: shop,
        productId: data.line_items?.[0]?.product_id?.toString() || data.product_id?.toString(),
        orderId: data.id?.toString(),
        cartToken: data.token,
        eventValue: data.total_price || data.subtotal_price,
        processed: false
      };
      
      const [event] = await db.insert(behaviorEvents)
        .values(eventData)
        .returning();
      
      // Process triggers asynchronously
      processBehaviorEvent(event.id, connection.userId).catch(console.error);
      
      res.json({ success: true, eventId: event.id });
    } catch (error: any) {
      console.error("Error processing behavior webhook:", error);
      res.status(500).json({ error: "Failed to process event" });
    }
  });

  // Manual event tracking (for frontend/JS SDK integration)
  app.post("/api/behavioral-triggers/events", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const eventData = insertBehaviorEventSchema.parse({
        ...req.body,
        userId,
        processed: false
      });
      
      const [event] = await db.insert(behaviorEvents)
        .values(eventData)
        .returning();
      
      // Process triggers asynchronously
      processBehaviorEvent(event.id, userId).catch(console.error);
      
      res.status(201).json(event);
    } catch (error: any) {
      console.error("Error tracking event:", error);
      res.status(500).json({ error: "Failed to track event" });
    }
  });

  // Get recent behavior events for debugging
  app.get("/api/behavioral-triggers/events", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const events = await db.select().from(behaviorEvents)
        .where(eq(behaviorEvents.userId, userId))
        .orderBy(desc(behaviorEvents.createdAt))
        .limit(limit);
      
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Trigger execution helper function
  async function processBehaviorEvent(eventId: string, userId: string) {
    try {
      // Get the event
      const [event] = await db.select().from(behaviorEvents)
        .where(eq(behaviorEvents.id, eventId));
      
      if (!event || event.processed) return;
      
      // Get active triggers for this event type
      const activeTriggers = await db.select().from(behavioralTriggers)
        .where(and(
          eq(behavioralTriggers.userId, userId),
          eq(behavioralTriggers.status, 'active'),
          eq(behavioralTriggers.eventType, event.eventType)
        ))
        .orderBy(desc(behavioralTriggers.priority));
      
      const matchedTriggerIds: string[] = [];
      
      for (const trigger of activeTriggers) {
        // Check condition
        const conditionMet = checkTriggerCondition(trigger, event);
        
        if (conditionMet) {
          matchedTriggerIds.push(trigger.id);
          
          // Check cooldown
          const canFire = await checkTriggerCooldown(trigger, event.customerEmail || event.customerId);
          
          if (canFire) {
            // Execute the trigger action
            await executeTriggerAction(trigger, event);
          }
        }
      }
      
      // Mark event as processed
      await db.update(behaviorEvents)
        .set({ 
          processed: true,
          triggersMatched: matchedTriggerIds
        })
        .where(eq(behaviorEvents.id, eventId));
      
    } catch (error) {
      console.error("Error processing behavior event:", error);
    }
  }

  // Check if trigger condition is met
  function checkTriggerCondition(trigger: any, event: any): boolean {
    const value = parseFloat(trigger.conditionValue || '0');
    const eventValue = parseFloat(event.eventValue || '0');
    
    switch (trigger.conditionType) {
      case 'count_gte':
        // Would need to count previous events - simplified for now
        return true;
      case 'value_gte':
        return eventValue >= value;
      case 'value_lte':
        return eventValue <= value;
      case 'is_first':
        // Would need to check if first event for customer
        return true;
      case 'is_return':
        // Would need to check customer history
        return true;
      case 'time_elapsed':
        // Handled by scheduler, not real-time
        return false;
      default:
        return true;
    }
  }

  // Check cooldown period
  async function checkTriggerCooldown(trigger: any, customerIdentifier: string | null | undefined): Promise<boolean> {
    if (!customerIdentifier) return true;
    
    const cooldownHours = trigger.cooldownHours || 24;
    const cooldownDate = new Date();
    cooldownDate.setHours(cooldownDate.getHours() - cooldownHours);
    
    const [recentExecution] = await db.select().from(triggerExecutions)
      .where(and(
        eq(triggerExecutions.triggerId, trigger.id),
        sql`(customer_email = ${customerIdentifier} OR customer_id = ${customerIdentifier})`,
        gte(triggerExecutions.createdAt, cooldownDate)
      ))
      .limit(1);
    
    return !recentExecution;
  }

  // Execute trigger action
  async function executeTriggerAction(trigger: any, event: any) {
    try {
      const executionData = {
        triggerId: trigger.id,
        behaviorEventId: event.id,
        userId: trigger.userId,
        customerId: event.customerId,
        customerEmail: event.customerEmail,
        actionType: trigger.actionType,
        actionPayload: {
          triggerName: trigger.name,
          eventType: event.eventType,
          eventData: event.eventData,
          actionConfig: trigger.actionConfig
        },
        status: 'pending'
      };
      
      const [execution] = await db.insert(triggerExecutions)
        .values(executionData)
        .returning();
      
      // Execute based on action type
      let success = false;
      
      switch (trigger.actionType) {
        case 'send_email':
          if (event.customerEmail) {
            const emailConfig = trigger.actionConfig || {};
            await sendEmail({
              to: event.customerEmail,
              subject: emailConfig.subject || `Special offer for you!`,
              text: emailConfig.text || 'We noticed you were interested in our products...',
              html: emailConfig.html
            });
            success = true;
          }
          break;
        case 'send_sms':
          // SMS sending logic
          success = true;
          break;
        case 'offer_discount':
          // Create discount code logic
          success = true;
          break;
        default:
          success = true;
      }
      
      // Update execution status
      await db.update(triggerExecutions)
        .set({ 
          status: success ? 'sent' : 'failed',
          sentAt: success ? new Date() : undefined
        })
        .where(eq(triggerExecutions.id, execution.id));
      
      // Update trigger last fired timestamp
      await db.update(behavioralTriggers)
        .set({ lastFiredAt: new Date() })
        .where(eq(behavioralTriggers.id, trigger.id));
      
    } catch (error) {
      console.error("Error executing trigger action:", error);
    }
  }

  // Track click on triggered action (email link, etc.)
  app.get("/api/behavioral-triggers/track/click/:executionId", async (req, res) => {
    try {
      const { executionId } = req.params;
      const redirect = req.query.redirect as string;
      
      await db.update(triggerExecutions)
        .set({ 
          clicked: true,
          clickedAt: new Date(),
          status: 'clicked'
        })
        .where(eq(triggerExecutions.id, executionId));
      
      if (redirect) {
        res.redirect(redirect);
      } else {
        res.json({ success: true });
      }
    } catch (error: any) {
      console.error("Error tracking click:", error);
      res.status(500).json({ error: "Failed to track click" });
    }
  });

  // Track conversion from triggered action
  app.post("/api/behavioral-triggers/track/conversion/:executionId", async (req, res) => {
    try {
      const { executionId } = req.params;
      const { orderId, value } = req.body;
      
      await db.update(triggerExecutions)
        .set({ 
          converted: true,
          convertedAt: new Date(),
          conversionValue: value?.toString(),
          conversionOrderId: orderId,
          status: 'converted'
        })
        .where(eq(triggerExecutions.id, executionId));
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error tracking conversion:", error);
      res.status(500).json({ error: "Failed to track conversion" });
    }
  });

  // ============================================
  // DYNAMIC CUSTOMER SEGMENTATION API
  // ============================================

  // Get all segments for user
  app.get("/api/segments", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      const segments = await db.select().from(customerSegments)
        .where(eq(customerSegments.userId, userId))
        .orderBy(desc(customerSegments.createdAt));
      
      res.json(segments);
    } catch (error: any) {
      console.error("Error fetching segments:", error);
      res.status(500).json({ error: "Failed to fetch segments" });
    }
  });

  // Create a new segment
  app.post("/api/segments", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { name, description, segmentType, rules, color, icon } = req.body;
      
      if (!name || !segmentType || !rules) {
        return res.status(400).json({ error: "Name, segmentType, and rules are required" });
      }
      
      const [segment] = await db.insert(customerSegments)
        .values({
          userId,
          name,
          description,
          segmentType,
          rules,
          color: color || "#3b82f6",
          icon: icon || "users",
          isActive: true,
          isAiGenerated: false
        })
        .returning();
      
      res.json(segment);
    } catch (error: any) {
      console.error("Error creating segment:", error);
      res.status(500).json({ error: "Failed to create segment" });
    }
  });

  // Update a segment
  app.patch("/api/segments/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id } = req.params;
      const updates = req.body;
      
      const [segment] = await db.update(customerSegments)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(and(
          eq(customerSegments.id, id),
          eq(customerSegments.userId, userId)
        ))
        .returning();
      
      if (!segment) {
        return res.status(404).json({ error: "Segment not found" });
      }
      
      res.json(segment);
    } catch (error: any) {
      console.error("Error updating segment:", error);
      res.status(500).json({ error: "Failed to update segment" });
    }
  });

  // Delete a segment
  app.delete("/api/segments/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id } = req.params;
      
      // Check if it's a system segment
      const [existing] = await db.select().from(customerSegments)
        .where(and(
          eq(customerSegments.id, id),
          eq(customerSegments.userId, userId)
        ));
      
      if (!existing) {
        return res.status(404).json({ error: "Segment not found" });
      }
      
      if (existing.isSystem) {
        return res.status(403).json({ error: "Cannot delete system segments" });
      }
      
      await db.delete(customerSegments)
        .where(and(
          eq(customerSegments.id, id),
          eq(customerSegments.userId, userId)
        ));
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting segment:", error);
      res.status(500).json({ error: "Failed to delete segment" });
    }
  });

  // Get segment members
  app.get("/api/segments/:id/members", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const members = await db.select().from(customerSegmentMembers)
        .where(and(
          eq(customerSegmentMembers.segmentId, id),
          eq(customerSegmentMembers.userId, userId)
        ))
        .orderBy(desc(customerSegmentMembers.totalSpent))
        .limit(limit)
        .offset(offset);
      
      res.json(members);
    } catch (error: any) {
      console.error("Error fetching segment members:", error);
      res.status(500).json({ error: "Failed to fetch segment members" });
    }
  });

  // Get customer profiles
  app.get("/api/customers/profiles", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const profiles = await db.select().from(customerProfiles)
        .where(eq(customerProfiles.userId, userId))
        .orderBy(desc(customerProfiles.totalSpent))
        .limit(limit)
        .offset(offset);
      
      res.json(profiles);
    } catch (error: any) {
      console.error("Error fetching customer profiles:", error);
      res.status(500).json({ error: "Failed to fetch customer profiles" });
    }
  });

  // Run AI segmentation analysis
  app.post("/api/segments/ai/analyze", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Get customer data for analysis
      const profiles = await db.select().from(customerProfiles)
        .where(eq(customerProfiles.userId, userId))
        .limit(100);
      
      // If no customer data, try to build from revenue attribution data
      let customerData = profiles;
      
      if (profiles.length === 0) {
        // Build profiles from revenue attribution history
        const attributions = await db.select().from(revenueAttribution)
          .where(eq(revenueAttribution.userId, userId))
          .orderBy(desc(revenueAttribution.attributedAt))
          .limit(500);
        
        // Also get abandoned carts data
        const carts = await db.select().from(abandonedCarts)
          .where(eq(abandonedCarts.userId, userId))
          .orderBy(desc(abandonedCarts.createdAt))
          .limit(500);
        
        // Aggregate data by customer email
        const customerMap = new Map<string, any>();
        
        // Process revenue attributions
        for (const attr of attributions) {
          const email = attr.customerEmail;
          if (!email) continue;
          
          if (!customerMap.has(email)) {
            customerMap.set(email, {
              customerEmail: email,
              customerName: null,
              totalOrders: 0,
              totalSpent: 0,
              discountOrders: 0,
              firstOrderDate: attr.attributedAt,
              lastOrderDate: attr.attributedAt
            });
          }
          
          const customer = customerMap.get(email)!;
          customer.totalOrders += 1;
          customer.totalSpent += parseFloat(attr.revenueAmount || '0');
          if (attr.attributedAt && (!customer.firstOrderDate || attr.attributedAt < customer.firstOrderDate)) {
            customer.firstOrderDate = attr.attributedAt;
          }
          if (attr.attributedAt && (!customer.lastOrderDate || attr.attributedAt > customer.lastOrderDate)) {
            customer.lastOrderDate = attr.attributedAt;
          }
        }
        
        // Process abandoned carts to identify cart abandoners
        for (const cart of carts) {
          const email = cart.customerEmail;
          if (!email) continue;
          
          if (!customerMap.has(email)) {
            customerMap.set(email, {
              customerEmail: email,
              customerName: cart.customerName,
              totalOrders: 0,
              totalSpent: 0,
              discountOrders: 0,
              abandonedCarts: 1,
              firstOrderDate: cart.createdAt,
              lastOrderDate: cart.createdAt
            });
          } else {
            const customer = customerMap.get(email)!;
            customer.abandonedCarts = (customer.abandonedCarts || 0) + 1;
            if (cart.customerName && !customer.customerName) {
              customer.customerName = cart.customerName;
            }
          }
        }
        
        customerData = Array.from(customerMap.values()).map(c => ({
          ...c,
          avgOrderValue: c.totalOrders > 0 ? c.totalSpent / c.totalOrders : 0,
          discountUsagePercent: c.totalOrders > 0 ? (c.discountOrders / c.totalOrders) * 100 : 0,
          daysSinceLastOrder: c.lastOrderDate ? Math.floor((Date.now() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)) : 999
        }));
      }
      
      if (customerData.length === 0) {
        return res.json({
          segments: [],
          message: "No customer data available for analysis. Connect your Shopify store and sync orders first."
        });
      }
      
      // Use AI to analyze customer data and suggest segments
      const openai = new OpenAI();
      
      const analysisPrompt = `Analyze this e-commerce customer data and suggest smart customer segments.

Customer Data Summary:
- Total Customers: ${customerData.length}
- Sample customers (first 20):
${JSON.stringify(customerData.slice(0, 20).map(c => ({
  email: c.customerEmail,
  orders: c.totalOrders,
  spent: c.totalSpent,
  avgOrder: c.avgOrderValue || (c.totalSpent / Math.max(c.totalOrders, 1)),
  discountUsage: c.discountUsagePercent || (c.discountOrders / Math.max(c.totalOrders, 1) * 100),
  daysSinceLastOrder: c.daysSinceLastOrder
})), null, 2)}

Based on this data, suggest 4-6 customer segments. For each segment provide:
1. name: A clear segment name (e.g., "High Spenders", "First-Time Buyers", "Discount Seekers")
2. segmentType: One of: high_spenders, first_timers, loyal_buyers, discount_seekers, dormant, cart_abandoners, vip, at_risk, custom
3. description: 1-2 sentence description
4. rules: Object with segmentation criteria like: { field: "totalSpent", operator: "gte", value: 500 }
   - Available fields: totalOrders, totalSpent, avgOrderValue, discountUsagePercent, daysSinceLastOrder
   - Operators: gte (>=), lte (<=), eq (=), gt (>), lt (<)
5. estimatedCount: Estimated number of customers that would match
6. color: A hex color code for display
7. icon: A Lucide icon name (users, crown, shopping-cart, percent, clock, heart, star, alert-triangle)

Return JSON array of segments only, no explanation text.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an e-commerce customer segmentation expert. Analyze customer data and suggest smart segments based on purchasing behavior. Return only valid JSON."
          },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });
      
      let suggestedSegments = [];
      try {
        const responseText = completion.choices[0].message.content || "[]";
        const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        suggestedSegments = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        // Return default segments
        suggestedSegments = [
          {
            name: "High Spenders",
            segmentType: "high_spenders",
            description: "Customers who have spent over $500 total",
            rules: { field: "totalSpent", operator: "gte", value: 500 },
            estimatedCount: customerData.filter((c: any) => (c.totalSpent || 0) >= 500).length,
            color: "#10b981",
            icon: "crown"
          },
          {
            name: "First-Time Buyers",
            segmentType: "first_timers",
            description: "Customers with only one purchase",
            rules: { field: "totalOrders", operator: "eq", value: 1 },
            estimatedCount: customerData.filter((c: any) => (c.totalOrders || 0) === 1).length,
            color: "#3b82f6",
            icon: "shopping-cart"
          },
          {
            name: "Loyal Customers",
            segmentType: "loyal_buyers",
            description: "Customers with 3 or more orders",
            rules: { field: "totalOrders", operator: "gte", value: 3 },
            estimatedCount: customerData.filter((c: any) => (c.totalOrders || 0) >= 3).length,
            color: "#8b5cf6",
            icon: "heart"
          },
          {
            name: "Dormant Customers",
            segmentType: "dormant",
            description: "Customers inactive for 30+ days",
            rules: { field: "daysSinceLastOrder", operator: "gte", value: 30 },
            estimatedCount: customerData.filter((c: any) => (c.daysSinceLastOrder || 0) >= 30).length,
            color: "#f59e0b",
            icon: "clock"
          }
        ];
      }
      
      res.json({
        segments: suggestedSegments,
        customerCount: customerData.length,
        message: "AI analysis complete"
      });
    } catch (error: any) {
      console.error("Error in AI segmentation:", error);
      res.status(500).json({ error: "Failed to analyze customers" });
    }
  });

  // Apply AI-suggested segment
  app.post("/api/segments/ai/apply", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { name, segmentType, description, rules, color, icon } = req.body;
      
      // Create the segment
      const [segment] = await db.insert(customerSegments)
        .values({
          userId,
          name,
          description,
          segmentType: segmentType || 'custom',
          rules,
          color: color || "#3b82f6",
          icon: icon || "users",
          isActive: true,
          isAiGenerated: true,
          aiConfidence: "85"
        })
        .returning();
      
      // Now populate the segment with matching customers
      await populateSegment(userId, segment.id, rules);
      
      // Update member count
      const [countResult] = await db.select({ count: sql<number>`count(*)` })
        .from(customerSegmentMembers)
        .where(eq(customerSegmentMembers.segmentId, segment.id));
      
      await db.update(customerSegments)
        .set({ 
          memberCount: countResult.count,
          lastCalculatedAt: new Date()
        })
        .where(eq(customerSegments.id, segment.id));
      
      res.json({ 
        ...segment, 
        memberCount: countResult.count 
      });
    } catch (error: any) {
      console.error("Error applying segment:", error);
      res.status(500).json({ error: "Failed to apply segment" });
    }
  });

  // Helper function to populate segment members
  async function populateSegment(userId: string, segmentId: string, rules: any) {
    try {
      // Build customer profiles from revenue attribution data
      const attributions = await db.select().from(revenueAttribution)
        .where(eq(revenueAttribution.userId, userId))
        .orderBy(desc(revenueAttribution.attributedAt));
      
      // Also get abandoned carts data
      const carts = await db.select().from(abandonedCarts)
        .where(eq(abandonedCarts.userId, userId))
        .orderBy(desc(abandonedCarts.createdAt));
      
      // Aggregate by customer
      const customerMap = new Map<string, any>();
      
      // Process revenue attributions
      for (const attr of attributions) {
        const email = attr.customerEmail;
        if (!email) continue;
        
        if (!customerMap.has(email)) {
          customerMap.set(email, {
            customerEmail: email,
            customerName: null,
            customerId: null,
            totalOrders: 0,
            totalSpent: 0,
            discountOrders: 0,
            abandonedCarts: 0,
            firstOrderDate: attr.attributedAt,
            lastOrderDate: attr.attributedAt
          });
        }
        
        const customer = customerMap.get(email)!;
        customer.totalOrders += 1;
        customer.totalSpent += parseFloat(attr.revenueAmount || '0');
        if (attr.attributedAt && (!customer.firstOrderDate || attr.attributedAt < customer.firstOrderDate)) {
          customer.firstOrderDate = attr.attributedAt;
        }
        if (attr.attributedAt && (!customer.lastOrderDate || attr.attributedAt > customer.lastOrderDate)) {
          customer.lastOrderDate = attr.attributedAt;
        }
      }
      
      // Process abandoned carts
      for (const cart of carts) {
        const email = cart.customerEmail;
        if (!email) continue;
        
        if (!customerMap.has(email)) {
          customerMap.set(email, {
            customerEmail: email,
            customerName: cart.customerName,
            customerId: null,
            totalOrders: 0,
            totalSpent: 0,
            discountOrders: 0,
            abandonedCarts: 1,
            firstOrderDate: cart.createdAt,
            lastOrderDate: cart.createdAt
          });
        } else {
          const customer = customerMap.get(email)!;
          customer.abandonedCarts = (customer.abandonedCarts || 0) + 1;
          if (cart.customerName && !customer.customerName) {
            customer.customerName = cart.customerName;
          }
        }
      }
      
      // Filter customers matching the rules
      const matchingCustomers: any[] = [];
      
      for (const [email, customer] of customerMap) {
        customer.avgOrderValue = customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0;
        customer.discountUsagePercent = customer.totalOrders > 0 ? (customer.discountOrders / customer.totalOrders) * 100 : 0;
        customer.daysSinceLastOrder = customer.lastOrderDate 
          ? Math.floor((Date.now() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)) 
          : 999;
        
        // Check if customer matches rules
        if (matchesRules(customer, rules)) {
          matchingCustomers.push(customer);
        }
      }
      
      // Insert matching customers into segment
      for (const customer of matchingCustomers) {
        try {
          await db.insert(customerSegmentMembers)
            .values({
              userId,
              segmentId,
              customerEmail: customer.customerEmail,
              customerId: customer.customerId,
              customerName: customer.customerName,
              totalOrders: customer.totalOrders,
              totalSpent: customer.totalSpent.toString(),
              avgOrderValue: customer.avgOrderValue.toString(),
              lastOrderDate: customer.lastOrderDate,
              firstOrderDate: customer.firstOrderDate,
              discountUsageCount: customer.discountOrders,
              daysInactive: customer.daysSinceLastOrder,
              addedBy: 'ai'
            })
            .onConflictDoNothing();
        } catch (e) {
          // Ignore duplicate entries
        }
      }
      
      return matchingCustomers.length;
    } catch (error) {
      console.error("Error populating segment:", error);
      return 0;
    }
  }

  // Helper function to check if customer matches segment rules
  function matchesRules(customer: any, rules: any): boolean {
    if (!rules || !rules.field) return true;
    
    const value = customer[rules.field];
    const targetValue = parseFloat(rules.value);
    
    switch (rules.operator) {
      case 'gte': return value >= targetValue;
      case 'lte': return value <= targetValue;
      case 'gt': return value > targetValue;
      case 'lt': return value < targetValue;
      case 'eq': return value === targetValue;
      default: return true;
    }
  }

  // Recalculate segment members
  app.post("/api/segments/:id/recalculate", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { id } = req.params;
      
      // Get the segment
      const [segment] = await db.select().from(customerSegments)
        .where(and(
          eq(customerSegments.id, id),
          eq(customerSegments.userId, userId)
        ));
      
      if (!segment) {
        return res.status(404).json({ error: "Segment not found" });
      }
      
      // Clear existing members
      await db.delete(customerSegmentMembers)
        .where(eq(customerSegmentMembers.segmentId, id));
      
      // Repopulate
      const count = await populateSegment(userId, id, segment.rules);
      
      // Update segment
      await db.update(customerSegments)
        .set({ 
          memberCount: count,
          lastCalculatedAt: new Date()
        })
        .where(eq(customerSegments.id, id));
      
      res.json({ success: true, memberCount: count });
    } catch (error: any) {
      console.error("Error recalculating segment:", error);
      res.status(500).json({ error: "Failed to recalculate segment" });
    }
  });

  // Get segmentation analytics summary
  app.get("/api/segments/analytics/summary", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Get all segments with member counts
      const segments = await db.select().from(customerSegments)
        .where(and(
          eq(customerSegments.userId, userId),
          eq(customerSegments.isActive, true)
        ));
      
      // Get total customer count from revenue attributions and abandoned carts
      const attributions = await db.select({ email: revenueAttribution.customerEmail })
        .from(revenueAttribution)
        .where(eq(revenueAttribution.userId, userId));
      
      const carts = await db.select({ email: abandonedCarts.customerEmail })
        .from(abandonedCarts)
        .where(eq(abandonedCarts.userId, userId));
      
      const uniqueCustomers = new Set([
        ...attributions.map(o => o.email).filter(Boolean),
        ...carts.map(c => c.email).filter(Boolean)
      ]);
      
      // Calculate segment coverage
      const totalSegmentedCount = segments.reduce((sum, s) => sum + (s.memberCount || 0), 0);
      
      res.json({
        totalCustomers: uniqueCustomers.size,
        totalSegments: segments.length,
        segmentedCustomers: totalSegmentedCount,
        coveragePercent: uniqueCustomers.size > 0 
          ? Math.round((totalSegmentedCount / uniqueCustomers.size) * 100) 
          : 0,
        segments: segments.map(s => ({
          id: s.id,
          name: s.name,
          memberCount: s.memberCount || 0,
          segmentType: s.segmentType,
          color: s.color
        }))
      });
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Seed default system segments for new users
  app.post("/api/segments/seed-defaults", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Check if user already has segments
      const existing = await db.select().from(customerSegments)
        .where(eq(customerSegments.userId, userId))
        .limit(1);
      
      if (existing.length > 0) {
        return res.json({ message: "Segments already exist" });
      }
      
      // Create default segments
      const defaultSegments = [
        {
          name: "High Spenders",
          description: "Customers who have spent over $500 total",
          segmentType: "high_spenders" as const,
          rules: { field: "totalSpent", operator: "gte", value: 500 },
          color: "#10b981",
          icon: "crown",
          isSystem: true
        },
        {
          name: "First-Time Buyers",
          description: "Customers with only one purchase",
          segmentType: "first_timers" as const,
          rules: { field: "totalOrders", operator: "eq", value: 1 },
          color: "#3b82f6",
          icon: "shopping-cart",
          isSystem: true
        },
        {
          name: "Loyal Customers",
          description: "Customers with 3 or more orders",
          segmentType: "loyal_buyers" as const,
          rules: { field: "totalOrders", operator: "gte", value: 3 },
          color: "#8b5cf6",
          icon: "heart",
          isSystem: true
        },
        {
          name: "Discount Seekers",
          description: "Customers who use discounts on 50%+ of orders",
          segmentType: "discount_seekers" as const,
          rules: { field: "discountUsagePercent", operator: "gte", value: 50 },
          color: "#f59e0b",
          icon: "percent",
          isSystem: true
        },
        {
          name: "Dormant Customers",
          description: "Customers inactive for 30+ days",
          segmentType: "dormant" as const,
          rules: { field: "daysSinceLastOrder", operator: "gte", value: 30 },
          color: "#ef4444",
          icon: "clock",
          isSystem: true
        }
      ];
      
      for (const seg of defaultSegments) {
        const [created] = await db.insert(customerSegments)
          .values({
            userId,
            ...seg,
            isActive: true,
            isAiGenerated: false
          })
          .returning();
        
        // Populate segment
        await populateSegment(userId, created.id, seg.rules);
        
        // Update count
        const [countResult] = await db.select({ count: sql<number>`count(*)` })
          .from(customerSegmentMembers)
          .where(eq(customerSegmentMembers.segmentId, created.id));
        
        await db.update(customerSegments)
          .set({ 
            memberCount: countResult.count,
            lastCalculatedAt: new Date()
          })
          .where(eq(customerSegments.id, created.id));
      }
      
      res.json({ success: true, message: "Default segments created" });
    } catch (error: any) {
      console.error("Error seeding segments:", error);
      res.status(500).json({ error: "Failed to seed segments" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
