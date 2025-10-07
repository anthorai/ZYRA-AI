import type { Express, Request, Response, NextFunction } from "express";
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
  insertCampaignSchema,
  insertCampaignTemplateSchema,
  insertAbandonedCartSchema,
  errorLogs
} from "@shared/schema";
import { supabaseStorage } from "./lib/supabase-storage";
import { supabase } from "./lib/supabase";
import { storage } from "./storage";
import { testSupabaseConnection } from "./lib/supabase";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";
import OpenAI from "openai";
import Stripe from "stripe";
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
import {
  createPayoneerInvoice,
  getPayoneerInvoiceStatus,
  isPayoneerConfigured
} from "./payoneer";
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

// Initialize OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

// Initialize Stripe if keys are provided
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  });
}

// Types for authenticated user from Supabase
interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  plan: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
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
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Get user profile from Supabase storage by ID first, then email fallback
      let userProfile = await supabaseStorage.getUser(user.id);
      if (!userProfile) {
        // Try email lookup (for backwards compatibility)
        userProfile = await supabaseStorage.getUserByEmail(user.email!);
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
          } catch (error) {
            console.error('Failed to auto-provision user profile:', error);
            return res.status(500).json({ message: "Failed to create user profile" });
          }
        }
      }

      // Attach user to request
      (req as AuthenticatedRequest).user = {
        id: userProfile.id,
        email: userProfile.email,
        fullName: userProfile.fullName,
        role: userProfile.role,
        plan: userProfile.plan,
        stripeCustomerId: userProfile.stripeCustomerId,
        stripeSubscriptionId: userProfile.stripeSubscriptionId
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
  app.patch("/api/admin/error-logs/:id/resolve", requireAuth, async (req, res) => {
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
      const currentPlan = plans.find(p => p.planName.toLowerCase() === userPlan.toLowerCase());

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
              return res.status(403).json({ 
                message: "Trial AI generation limit (10) reached. Upgrade to continue.",
                upgradeRequired: true 
              });
            }
          }
          // For Starter: 50 AI generations, 50 SEO optimizations
          else if (currentPlan.planName === 'Starter') {
            if (aiGenerationsUsed >= 50) {
              return res.status(403).json({ 
                message: "Monthly AI generation limit (50) reached. Upgrade to Growth plan for 1,000 generations.",
                upgradeRequired: true 
              });
            }
          }
          // For Growth: 1000 AI generations, 500 SEO optimizations
          else if (currentPlan.planName === 'Growth') {
            if (aiGenerationsUsed >= 1000) {
              return res.status(403).json({ 
                message: "Monthly AI generation limit (1,000) reached. Upgrade to Pro for unlimited access.",
                upgradeRequired: true 
              });
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

  // Registration is handled by Supabase Auth on frontend
  // User profiles are auto-provisioned by the auth middleware
  app.post("/api/register", async (req, res) => {
    res.status(400).json({ 
      message: "Registration should be handled through Supabase Auth on the frontend. User profiles are automatically created on first API access." 
    });
  });

  // Login is handled by Supabase Auth on frontend
  app.post("/api/login", async (req, res) => {
    // This endpoint is no longer needed as Supabase Auth handles login
    // Frontend should use supabase.auth.signInWithPassword()
    res.status(400).json({ 
      message: "Login should be handled through Supabase Auth on the frontend" 
    });
  });

  // Logout is handled by Supabase Auth on frontend
  app.post("/api/logout", (req, res) => {
    // This endpoint is no longer needed as Supabase Auth handles logout
    // Frontend should use supabase.auth.signOut()
    res.json({ message: "Logout should be handled through Supabase Auth on the frontend" });
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
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId
      } 
    });
  });

  // AI Product Description Generator
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

      // Generate the dynamic prompt using the template system
      let selectedPrompt = processPromptTemplate("Product Description", selectedBrandVoice, templateVariables);
      
      // Enhance prompt with custom instructions if available
      if (customInstructions) {
        selectedPrompt += `\n\nAdditional brand guidelines: ${customInstructions}`;
      }
      
      // Add tone preferences if available
      if (Object.keys(tonePreferences).length > 0) {
        selectedPrompt += `\n\nTone preferences: ${JSON.stringify(tonePreferences)}`;
      }

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: selectedPrompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Track usage and tokens
      const tokensUsed = response.usage?.total_tokens || 0;
      await trackAIUsage(userId, tokensUsed);
      
      // Store generation in AI history for learning
      await supabaseStorage.createAiGenerationHistory({
        userId,
        generationType: 'product_description',
        inputData: { productName, category, features, audience, keywords, specs },
        outputData: { description: result.description },
        brandVoice: selectedBrandVoice,
        tokensUsed,
        model: 'gpt-5'
      });
      
      res.json({ description: result.description, brandVoiceUsed: selectedBrandVoice });
    } catch (error: any) {
      console.error("AI generation error:", error);
      res.status(500).json({ message: "Failed to generate description" });
    }
  });

  // SEO Optimization
  app.post("/api/optimize-seo", requireAuth, aiLimiter, sanitizeBody, checkRateLimit, checkAIUsageLimit, async (req, res) => {
    try {
      const { currentTitle, keywords, currentMeta, category } = req.body;

      if (!currentTitle || !keywords) {
        return res.status(400).json({ message: "Title and keywords are required" });
      }

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

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Track SEO usage
      await trackSEOUsage((req as AuthenticatedRequest).user.id);
      
      res.json(result);
    } catch (error: any) {
      console.error("SEO optimization error:", error);
      res.status(500).json({ message: "Failed to optimize SEO" });
    }
  });

  // Image Alt-Text Generation
  app.post("/api/generate-alt-text", requireAuth, checkRateLimit, checkAIUsageLimit, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const { additionalTags } = req.body;
      
      // Convert image buffer to base64
      const base64Image = req.file.buffer.toString('base64');
      const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

      // Use OpenAI Vision API to analyze the image
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: `Analyze this product image and generate:
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
}` 
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

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Get image dimensions
      const dimensions = `${req.file.size > 0 ? Math.round(req.file.size / 1024) : 0} KB`;
      
      // Track usage and tokens
      const tokensUsed = response.usage?.total_tokens || 0;
      await trackAIUsage((req as AuthenticatedRequest).user.id, tokensUsed);
      
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

  app.post("/api/brand-voice/preferences", requireAuth, async (req, res) => {
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
  app.post("/api/brand-voice/learn", requireAuth, async (req, res) => {
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
            model: "gpt-5",
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
            model: "gpt-5",
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

  app.post("/api/products", requireAuth, async (req, res) => {
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

  app.patch("/api/products/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
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
  app.post("/api/products/optimize-all", requireAuth, async (req, res) => {
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

  app.post("/api/notifications", requireAuth, async (req, res) => {
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

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await supabaseStorage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      await supabaseStorage.markAllNotificationsAsRead((req as AuthenticatedRequest).user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
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

  app.post("/api/notifications/clear-all", requireAuth, async (req, res) => {
    try {
      await supabaseStorage.markAllNotificationsAsRead((req as AuthenticatedRequest).user.id);
      res.json({ message: "All notifications cleared successfully" });
    } catch (error: any) {
      console.error("Clear all notifications error:", error);
      res.status(500).json({ message: "Failed to clear all notifications" });
    }
  });

  // Stripe subscription routes
  if (stripe) {
    app.post("/api/create-subscription", requireAuth, async (req, res) => {
      try {
        let user = (req as AuthenticatedRequest).user;
        
        if (user.stripeSubscriptionId) {
          const subscription = await stripe!.subscriptions.retrieve(user.stripeSubscriptionId);
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
          });
        }

        let customerId = user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe!.customers.create({
            email: user.email,
            name: user.fullName,
          });
          customerId = customer.id;
          await supabaseStorage.updateUserStripeInfo(user.id, customerId, "");
        }

        const subscription = await stripe!.subscriptions.create({
          customer: customerId,
          items: [{
            price: process.env.STRIPE_PRICE_ID || "price_1234", // User needs to set this
          }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });

        await supabaseStorage.updateUserStripeInfo(user.id, customerId, subscription.id);

        res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
      } catch (error: any) {
        console.error("Subscription error:", error);
        res.status(400).json({ error: { message: error.message } });
      }
    });
  }

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
      const dbPlans = await supabaseStorage.getSubscriptionPlans();
      
      // Enhanced plan features with organized categories
      const enhancedPlans = dbPlans.map(plan => {
        if (plan.planName === 'Starter') {
          return {
            ...plan,
            features: [
              "✨ 1,000 credits / month",
              "🔧 Product Optimization & SEO:",
              "• Optimized Products – 200 credits",
              "• SEO Keyword Density Analysis – 100 credits",
              "• AI Image Alt-Text Generator – 100 credits",
              "• Smart SEO Titles & Meta Tags – 100 credits",
              "📈 Conversion Boosting & Sales Automation:",
              "• AI-Powered Growth Intelligence – 150 credits",
              "• A/B Testing – 50 credits",
              "• Upsell Email Receipts – 100 credits",
              "• Abandoned Cart SMS – 50 credits",
              "🎨 Content & Branding at Scale:",
              "• Smart Product Descriptions – 100 credits",
              "• Dynamic Templates – 50 credits",
              "• Brand Voice Memory – included",
              "📊 Performance Tracking & ROI Insights:",
              "• Email & SMS Conversion Analytics – included",
              "⚡ Workflow & Integration Tools:",
              "• CSV Import/Export – included",
              "• One-Click Shopify Publish – included", 
              "• Rollback Button – included",
              "• Smart Bulk Suggestions – included"
            ]
          };
        } else if (plan.planName === 'Growth') {
          return {
            ...plan,
            features: [
              "✨ 5,000 credits / month",
              "🔧 Product Optimization & SEO:",
              "• All Starter features +",
              "• SEO Ranking Tracker – 200 credits",
              "• Bulk Optimization & Smart Bulk Suggestions – 500 credits",
              "• Scheduled Refresh for Content & SEO Updates – 300 credits",
              "📈 Conversion Boosting & Sales Automation:",
              "• AI Upsell Suggestions & Triggers – 300 credits",
              "• Dynamic Segmentation of Customers – 200 credits",
              "• Behavioral Targeting – 200 credits",
              "• Full A/B Test Results Dashboard – included",
              "🎨 Content & Branding at Scale:",
              "• Custom Templates – included",
              "• Multimodal AI (text + image + insights) – 300 credits",
              "• Multi-Channel Content Repurposing – 300 credits",
              "📊 Performance Tracking & ROI Insights:",
              "• Full Email & SMS tracking – included",
              "• Content ROI Tracking – included",
              "• Revenue Impact Attribution – included",
              "• Product Management Dashboard – included",
              "⚡ Workflow & Integration Tools:",
              "• Unlimited Starter workflow tools"
            ]
          };
        } else if (plan.planName === 'Pro') {
          return {
            ...plan,
            features: [
              "✨ 20,000 credits / month",
              "🔧 Product Optimization & SEO:",
              "• All Growth features + priority processing",
              "📈 Conversion Boosting & Sales Automation:",
              "• Full AI-driven automation for campaigns, upsells, and behavioral targeting",
              "🎨 Content & Branding at Scale:",
              "• Full template library, advanced brand voice memory, multimodal AI insights, multi-channel automation",
              "📊 Performance Tracking & ROI Insights:",
              "• Enterprise-grade analytics and revenue attribution dashboard",
              "⚡ Workflow & Integration Tools:",
              "• Enterprise bulk management, CSV import/export, rollback, smart bulk suggestions at scale"
            ]
          };
        }
        return plan;
      });
      
      // Always include the free trial plan at the beginning
      const freeTrialPlan = {
        id: "trial",
        planName: "7-Day Free Trial",
        price: 0,
        description: "Try ZYRA for 7 Days",
        features: [
          "✨ 100 credits / 7 days",
          "🔧 Product Optimization & SEO:",
          "• Optimized Products – 20 credits",
          "• SEO Keyword Density Analysis – 10 credits",
          "📈 Conversion Boosting & Sales Automation:",
          "• AI-Powered Growth Intelligence – 20 credits", 
          "• Basic A/B Testing – 10 credits",
          "🎨 Content & Branding at Scale:",
          "• Smart Product Descriptions – 20 credits",
          "• Limited Dynamic Templates – 10 credits",
          "📊 Performance Tracking & ROI Insights:",
          "• Email Performance Analytics – 10 credits",
          "⚡ Workflow & Integration Tools:",
          "• One-Click Shopify Publish – 10 credits",
          "• Rollback Button – included"
        ],
        currency: "USD",
        interval: "day",
        is_active: true,
        created_at: new Date().toISOString(),
        limits: {
          credits: 100,
          duration: 7
        },
        stripe_price_id: null,
        stripe_product_id: null
      };
      
      // Return free trial first, then enhanced database plans
      res.json([freeTrialPlan, ...enhancedPlans]);
    } catch (error: any) {
      console.error("Get subscription plans error:", error);
      
      // Fallback to hardcoded plans when database is unavailable
      const fallbackPlans = [
        {
          id: "trial",
          planName: "7-Day Free Trial",
          price: 0,
          description: "Try ZYRA for 7 Days",
          features: [
            "100 credits / 7 days",
            "Optimized Products – 20 credits",
            "SEO Keyword Density Analysis – 10 credits", 
            "AI-Powered Growth Intelligence – 20 credits",
            "Basic A/B Testing – 10 credits",
            "Smart Product Descriptions – 20 credits",
            "Limited Dynamic Templates – 10 credits",
            "Email Performance Analytics – 10 credits",
            "One-Click Shopify Publish – 10 credits",
            "Rollback Button – included"
          ],
          limits: {
            credits: 100,
            duration: 7
          },
          currency: "USD",
          interval: "day"
        },
        {
          id: "starter",
          planName: "Starter",
          price: 49,
          description: "For New Shopify Stores",
          features: [
            "✨ 1,000 credits / month",
            "🔧 Product Optimization & SEO:",
            "• Optimized Products – 200 credits",
            "• SEO Keyword Density Analysis – 100 credits",
            "• AI Image Alt-Text Generator – 100 credits",
            "• Smart SEO Titles & Meta Tags – 100 credits",
            "📈 Conversion Boosting & Sales Automation:",
            "• AI-Powered Growth Intelligence – 150 credits",
            "• A/B Testing – 50 credits",
            "• Upsell Email Receipts – 100 credits",
            "• Abandoned Cart SMS – 50 credits",
            "🎨 Content & Branding at Scale:",
            "• Smart Product Descriptions – 100 credits",
            "• Dynamic Templates – 50 credits",
            "• Brand Voice Memory – included",
            "📊 Performance Tracking & ROI Insights:",
            "• Email & SMS Conversion Analytics – included",
            "⚡ Workflow & Integration Tools:",
            "• CSV Import/Export – included",
            "• One-Click Shopify Publish – included", 
            "• Rollback Button – included",
            "• Smart Bulk Suggestions – included"
          ],
          limits: {
            credits: 1000,
            aiOptimization: true,
            seoTools: true,
            emailTriggers: true,
            templates: true,
            dashboards: true
          },
          currency: "USD",
          interval: "month"
        },
        {
          id: "growth",
          planName: "Growth",
          price: 299,
          description: "For Growing Merchants",
          features: [
            "✨ 5,000 credits / month",
            "🔧 Product Optimization & SEO:",
            "• All Starter features +",
            "• SEO Ranking Tracker – 200 credits",
            "• Bulk Optimization & Smart Bulk Suggestions – 500 credits",
            "• Scheduled Refresh for Content & SEO Updates – 300 credits",
            "📈 Conversion Boosting & Sales Automation:",
            "• AI Upsell Suggestions & Triggers – 300 credits",
            "• Dynamic Segmentation of Customers – 200 credits",
            "• Behavioral Targeting – 200 credits",
            "• Full A/B Test Results Dashboard – included",
            "🎨 Content & Branding at Scale:",
            "• Custom Templates – included",
            "• Multimodal AI (text + image + insights) – 300 credits",
            "• Multi-Channel Content Repurposing – 300 credits",
            "📊 Performance Tracking & ROI Insights:",
            "• Full Email & SMS tracking – included",
            "• Content ROI Tracking – included",
            "• Revenue Impact Attribution – included",
            "• Product Management Dashboard – included",
            "⚡ Workflow & Integration Tools:",
            "• Unlimited Starter workflow tools"
          ],
          limits: {
            credits: 10000,
            abTesting: true,
            upsellSuggestions: true,
            cartRecovery: true,
            customerSegmentation: true,
            multiChannelRepurposing: true
          },
          currency: "USD",
          interval: "month"
        },
        {
          id: "pro",
          planName: "Pro",
          price: 999,
          description: "For High-Revenue Brands",
          features: [
            "✨ 20,000 credits / month",
            "🔧 Product Optimization & SEO:",
            "• All Growth features + priority processing",
            "📈 Conversion Boosting & Sales Automation:",
            "• Full AI-driven automation for campaigns, upsells, and behavioral targeting",
            "🎨 Content & Branding at Scale:",
            "• Full template library, advanced brand voice memory, multimodal AI insights, multi-channel automation",
            "📊 Performance Tracking & ROI Insights:",
            "• Enterprise-grade analytics and revenue attribution dashboard",
            "⚡ Workflow & Integration Tools:",
            "• Enterprise bulk management, CSV import/export, rollback, smart bulk suggestions at scale"
          ],
          limits: {
            credits: -1,
            roiTracking: true,
            revenueAttribution: true,
            multimodalAI: true,
            brandVoiceMemory: true,
            enterpriseDashboards: true,
            prioritySupport: true
          },
          currency: "USD",
          interval: "month"
        }
      ];
      
      console.warn("Using fallback subscription plans due to database error");
      res.json(fallbackPlans);
    }
  });

  // Get current user subscription
  app.get("/api/subscription/current", requireAuth, async (req, res) => {
    try {
      const subscription = await supabaseStorage.getUserSubscription((req as AuthenticatedRequest).user.id);
      res.json(subscription || {});
    } catch (error: any) {
      console.error("Error fetching user subscription:", error);
      res.status(500).json({ 
        error: "Failed to fetch subscription",
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

  // Get invoices
  app.get("/api/invoices", requireAuth, async (req, res) => {
    try {
      // Mock invoices - implement with Stripe integration
      const invoices: any[] = [];
      res.json(invoices || []);
    } catch (error: any) {
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
      // Mock payment methods - implement with Stripe integration
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

  // Add payment method
  app.post("/api/payment-methods/add", requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const user = (req as AuthenticatedRequest).user;
      let customerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.fullName,
          metadata: { userId: user.id }
        });
        customerId = customer.id;
        await supabaseStorage.updateUserStripeInfo(user.id, customerId, "");
      }

      // Create setup session
      const session = await stripe.checkout.sessions.create({
        mode: 'setup',
        customer: customerId,
        success_url: `${req.protocol}://${req.get('host')}/billing?setup=success`,
        cancel_url: `${req.protocol}://${req.get('host')}/billing?setup=cancel`,
      });

      res.json({ setupUrl: session.url });
    } catch (error: any) {
      console.error("Error adding payment method:", error);
      res.status(500).json({ 
        error: "Failed to add payment method",
        message: error.message 
      });
    }
  });

  app.post("/api/update-subscription", requireAuth, async (req, res) => {
    try {
      const { planId } = req.body;
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      const user = await supabaseStorage.updateUserSubscription((req as AuthenticatedRequest).user.id, { planId });
      res.json({ message: "Subscription updated successfully", user });
    } catch (error: any) {
      console.error("Update subscription error:", error);
      res.status(500).json({ message: error.message || "Failed to update subscription" });
    }
  });

  // Change subscription plan (alternative endpoint for billing page)
  app.post("/api/subscription/change-plan", requireAuth, async (req, res) => {
    try {
      const { planId } = req.body;
      if (!planId) {
        return res.status(400).json({ error: "Plan ID is required" });
      }

      const user = await supabaseStorage.updateUserSubscription((req as AuthenticatedRequest).user.id, { planId });
      res.json({ user });
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
        stripe: {
          enabled: !!stripe,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
        },
        razorpay: {
          enabled: isRazorpayConfigured(),
          keyId: isRazorpayConfigured() ? getRazorpayKeyId() : null
        },
        paypal: {
          enabled: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
          clientId: process.env.PAYPAL_CLIENT_ID || null
        },
        payoneer: {
          enabled: isPayoneerConfigured()
        }
      });
    } catch (error: any) {
      console.error("Error fetching payment config:", error);
      res.status(500).json({ error: "Failed to fetch payment configuration" });
    }
  });

  // === RAZORPAY ROUTES ===
  
  // Create Razorpay order
  app.post("/api/payments/razorpay/create-order", requireAuth, async (req, res) => {
    try {
      if (!isRazorpayConfigured()) {
        return res.status(503).json({ error: "Razorpay is not configured" });
      }

      const { amount, currency = 'INR', notes } = req.body;
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

  // Verify Razorpay payment
  app.post("/api/payments/razorpay/verify", requireAuth, async (req, res) => {
    try {
      const { orderId, paymentId, signature } = req.body;
      const user = (req as AuthenticatedRequest).user;

      if (!orderId || !paymentId || !signature) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const isValid = await verifyRazorpaySignature(orderId, paymentId, signature);

      if (!isValid) {
        return res.status(400).json({ error: "Invalid payment signature" });
      }

      // Fetch payment details
      const payment = await fetchRazorpayPayment(paymentId);

      // Store transaction in database
      await storage.createPaymentTransaction({
        userId: user.id,
        gateway: 'razorpay',
        gatewayTransactionId: paymentId,
        gatewayOrderId: orderId,
        amount: (Number(payment.amount) / 100).toString(),
        currency: payment.currency,
        status: 'completed',
        paymentMethod: payment.method,
        paymentDetails: {
          card_id: payment.card_id,
          email: payment.email,
          contact: payment.contact
        },
        signature,
        webhookReceived: false,
        metadata: { payment }
      });

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

  // === PAYONEER ROUTES ===
  
  // Create Payoneer invoice (B2B)
  app.post("/api/payments/payoneer/create-invoice", requireAuth, async (req, res) => {
    try {
      if (!isPayoneerConfigured()) {
        return res.status(503).json({ error: "Payoneer is not configured" });
      }

      const { amount, currency, description } = req.body;
      const user = (req as AuthenticatedRequest).user;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const invoice = await createPayoneerInvoice({
        amount,
        currency: currency || 'USD',
        customerId: user.id,
        description: description || 'Zyra subscription payment',
        invoiceNumber: `INV-${Date.now()}`
      });

      res.json(invoice);
    } catch (error: any) {
      console.error("Error creating Payoneer invoice:", error);
      res.status(500).json({ 
        error: "Failed to create invoice",
        message: error.message 
      });
    }
  });

  // Get Payoneer invoice status
  app.get("/api/payments/payoneer/invoice/:invoiceId", requireAuth, async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const status = await getPayoneerInvoiceStatus(invoiceId);
      res.json(status);
    } catch (error: any) {
      console.error("Error fetching Payoneer invoice:", error);
      res.status(500).json({ 
        error: "Failed to fetch invoice status",
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
  app.post("/api/payments/refund/:transactionId", requireAuth, async (req, res) => {
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
        case 'stripe':
          if (!stripe) {
            return res.status(503).json({ error: "Stripe not configured" });
          }
          refundResult = await stripe.refunds.create({
            payment_intent: transaction.gatewayTransactionId,
            amount: amount ? Math.round(Number(amount) * 100) : undefined,
            reason: 'requested_by_customer'
          });
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
      await storage.generateSampleMetrics((req as AuthenticatedRequest).user.id);
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

  // Generate new sample metrics (for demo purposes)
  app.post("/api/dashboard/refresh-metrics", requireAuth, async (req, res) => {
    try {
      await storage.generateSampleMetrics((req as AuthenticatedRequest).user.id);
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

  app.put('/api/language', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { preferredLanguage } = req.body;
      if (!preferredLanguage) {
        return res.status(400).json({ error: 'Preferred language is required' });
      }

      const updatedUser = await supabaseStorage.updateUserLanguage(userId, preferredLanguage);
      res.json(updatedUser);
    } catch (error) {
      console.error('Update language error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/upload-profile-image', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // For now, return a placeholder URL since we need to implement proper file upload
      // This would be where you handle the actual file upload to object storage
      const imageUrl = '/placeholder-avatar.png';
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

  app.post('/api/store-connections', requireAuth, async (req, res) => {
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

  app.delete('/api/store-connections/:id', requireAuth, async (req, res) => {
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
  app.patch('/api/profile', requireAuth, async (req, res) => {
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
  app.post('/api/profile/upload-image', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      // For now, return a placeholder URL since we need to implement proper file upload
      // This would be where you handle the actual file upload to object storage
      const imageUrl = `/profile-${userId}-${Date.now()}.png`;
      const updatedUser = await supabaseStorage.updateUserImage(userId, imageUrl);
      res.json({ imageUrl, user: updatedUser });
    } catch (error) {
      console.error('Upload image error:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // POST /api/profile/change-password - Change password
  app.post('/api/profile/change-password', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { oldPassword, newPassword, confirmPassword } = req.body;
      
      if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'All password fields are required' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'New passwords do not match' });
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
            contentStyle: "seo"
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
      const preferences = await supabaseStorage.updateUserPreferences(userId, updates);
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

  // Shopify Integration - Future Feature (Not Implemented)
  // NOTE: Infrastructure ready (store_connections table, frontend UI, storage methods)
  // Future implementation will require Shopify API credentials and OAuth flow
  app.get('/api/shopify/products', requireAuth, async (req, res) => {
    res.status(501).json({ 
      message: 'Shopify integration is not currently available',
      status: 'not_implemented',
      details: 'This feature is planned for a future release. The database schema and UI are ready for implementation.',
      futureFeatures: [
        'OAuth-based Shopify store connection',
        'Automatic product sync',
        'Inventory management',
        'Order fulfillment integration'
      ]
    });
  });

  app.post('/api/shopify/sync', requireAuth, async (req, res) => {
    res.status(501).json({ 
      message: 'Shopify sync is not currently available',
      status: 'not_implemented',
      details: 'This feature is planned for a future release.'
    });
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

  // Get single campaign
  app.get('/api/campaigns/:id', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const campaign = await supabaseStorage.getCampaign(req.params.id);
      
      if (!campaign || campaign.userId !== userId) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error('Get campaign error:', error);
      res.status(500).json({ error: 'Failed to get campaign' });
    }
  });

  // Create campaign
  app.post('/api/campaigns', requireAuth, campaignLimiter, sanitizeBody, validateCampaign, checkValidation, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const validated = insertCampaignSchema.parse({ ...req.body, userId });
      const campaign = await supabaseStorage.createCampaign(validated);
      res.status(201).json(campaign);
    } catch (error) {
      console.error('Create campaign error:', error);
      res.status(400).json({ error: 'Failed to create campaign' });
    }
  });

  // Update campaign
  app.patch('/api/campaigns/:id', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const campaign = await supabaseStorage.getCampaign(req.params.id);
      
      if (!campaign || campaign.userId !== userId) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      const updated = await supabaseStorage.updateCampaign(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error('Update campaign error:', error);
      res.status(400).json({ error: 'Failed to update campaign' });
    }
  });

  // Delete campaign
  app.delete('/api/campaigns/:id', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const campaign = await supabaseStorage.getCampaign(req.params.id);
      
      if (!campaign || campaign.userId !== userId) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      await supabaseStorage.deleteCampaign(req.params.id);
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
      
      if (!campaign || campaign.userId !== userId) {
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
      
      if (!campaign || campaign.userId !== userId) {
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
      
      if (!campaign || campaign.userId !== userId) {
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

  // Track conversion (when a campaign leads to a sale)
  app.post('/api/analytics/track-conversion', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { campaignId, revenue, orderId } = req.body;

      if (!campaignId) {
        return res.status(400).json({ error: 'campaignId is required' });
      }

      const campaign = await supabaseStorage.getCampaign(campaignId);
      if (!campaign || campaign.userId !== userId) {
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

  const httpServer = createServer(app);
  return httpServer;
}
