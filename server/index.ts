import * as Sentry from "@sentry/node";

// Initialize Sentry FIRST - before any other imports
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Filter out sensitive information
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
      }
      return event;
    },
  });
  console.log('✅ Sentry monitoring initialized');
} else {
  console.log('⚠️  Sentry DSN not configured - error tracking disabled');
}

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./lib/logger";
import { testSupabaseConnection, supabase } from "./lib/supabase";
import { ErrorLogger } from "./lib/errorLogger";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// ============================================
// SHOPIFY INTEGRATION DIAGNOSTICS
// ============================================
console.log('\n🔍 [SHOPIFY DIAGNOSTICS] Environment Check:');
console.log('  ✓ API Key present:', !!process.env.SHOPIFY_API_KEY);
console.log('  ✓ API Secret present:', !!process.env.SHOPIFY_API_SECRET);
console.log('  ✓ Production Domain present:', !!process.env.PRODUCTION_DOMAIN);

if (process.env.PRODUCTION_DOMAIN) {
  console.log('  📍 Production Domain:', process.env.PRODUCTION_DOMAIN);
  console.log('  🔗 Expected OAuth Callback:', `${process.env.PRODUCTION_DOMAIN}/api/shopify/callback`);
} else {
  console.log('  ⚠️  WARNING: PRODUCTION_DOMAIN not set - OAuth will use dynamic domain');
}

if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) {
  console.log('\n  ❌ CRITICAL: Shopify credentials missing!');
  console.log('     OAuth flow will fail without API credentials.');
  console.log('     Please set SHOPIFY_API_KEY and SHOPIFY_API_SECRET in your environment.\n');
} else {
  console.log('  ✅ Shopify OAuth ready\n');
}

const app = express();

// Trust proxy for rate limiting to work correctly behind Replit's proxy
app.set('trust proxy', 1);

// Enable Gzip/Brotli compression for all responses (70% size reduction)
app.use(compression({
  level: 6, // Balance between speed and compression ratio
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress streaming responses or already compressed content
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'",
        "https://replit.com"
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'", 
        "https://api.openai.com",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://*.ingest.us.sentry.io",
        "https://*.ingest.sentry.io"
      ],
      frameSrc: [
        "'self'"
      ],
      fontSrc: [
        "'self'", 
        "data:",
        "https://fonts.gstatic.com"
      ],
      workerSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true
}));

// CORS configuration - strict for production security
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? function (origin: any, callback: any) {
        // Build list of allowed origins from environment variables
        const allowedOrigins: string[] = [];
        
        // Add production domain
        if (process.env.PRODUCTION_DOMAIN) {
          allowedOrigins.push(process.env.PRODUCTION_DOMAIN);
        }
        
        // Add Replit domains (supports comma-separated list)
        if (process.env.REPLIT_DOMAINS) {
          const replitDomains = process.env.REPLIT_DOMAINS.split(',').map(d => d.trim());
          replitDomains.forEach(domain => {
            // Support both with and without protocol
            if (domain.startsWith('http://') || domain.startsWith('https://')) {
              allowedOrigins.push(domain);
            } else {
              allowedOrigins.push(`https://${domain}`);
            }
          });
        }
        
        // Fallback: Also check singular REPLIT_DOMAIN for backwards compatibility
        if (process.env.REPLIT_DOMAIN) {
          const domain = process.env.REPLIT_DOMAIN;
          if (domain.startsWith('http://') || domain.startsWith('https://')) {
            allowedOrigins.push(domain);
          } else {
            allowedOrigins.push(`https://${domain}`);
          }
        }
        
        // Log CORS configuration on first request (cache to avoid spam)
        if (!(global as any).corsConfigLogged) {
          console.log('🔒 [CORS] Production mode - Allowed origins:', allowedOrigins);
          (global as any).corsConfigLogged = true;
        }
        
        if (!origin) {
          // Allow requests with no origin (mobile apps, curl, server-to-server, etc.)
          callback(null, true);
        } else if (allowedOrigins.includes(origin)) {
          // Origin is in the whitelist
          callback(null, true);
        } else {
          // Log blocked origin for debugging
          console.error(`❌ [CORS] Blocked origin: ${origin}`);
          console.error(`🔒 [CORS] Allowed origins are:`, allowedOrigins);
          callback(new Error('Not allowed by CORS'));
        }
      }
    : true, // Development: allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400
};

app.use(cors(corsOptions));

// Capture raw body for webhook signature verification (before JSON parsing)
// CRITICAL: Preserve exact raw body for HMAC verification - do NOT modify empty bodies
app.use('/api/webhooks', express.raw({ type: 'application/json' }), (req, res, next) => {
  console.log('📥 [WEBHOOK] Incoming request to:', req.path);
  console.log('📥 [WEBHOOK] Headers:', {
    hmac: req.get('X-Shopify-Hmac-Sha256')?.substring(0, 10) + '...',
    topic: req.get('X-Shopify-Topic'),
    shop: req.get('X-Shopify-Shop-Domain'),
    contentType: req.get('Content-Type')
  });
  
  // Store raw buffer for HMAC verification - preserve EXACTLY as received
  if (Buffer.isBuffer(req.body)) {
    // Convert buffer to string, preserving empty bodies as empty strings
    (req as any).rawBody = req.body.toString('utf8');
    console.log('📥 [WEBHOOK] Raw body captured, length:', (req as any).rawBody?.length);
    
    // Only parse JSON if there's content
    if ((req as any).rawBody.length > 0) {
      try {
        req.body = JSON.parse((req as any).rawBody);
      } catch (e) {
        console.error('❌ [WEBHOOK] Failed to parse webhook JSON:', e);
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    } else {
      // Empty body - keep rawBody as empty string, set body to empty object for handlers
      req.body = {};
      console.log('📥 [WEBHOOK] Empty body received (preserved as empty string for HMAC)');
    }
  } else if (typeof req.body === 'string') {
    (req as any).rawBody = req.body;
    if (req.body.length > 0) {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        console.error('❌ [WEBHOOK] Failed to parse string body:', e);
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    } else {
      req.body = {};
    }
  } else if (!req.body || (typeof req.body === 'object' && Object.keys(req.body).length === 0)) {
    // No body or empty object - set rawBody to empty string (NOT '{}')
    (req as any).rawBody = '';
    req.body = {};
    console.log('📥 [WEBHOOK] Empty/missing body received (rawBody set to empty string)');
  } else {
    console.log('📥 [WEBHOOK] Body type:', typeof req.body);
    (req as any).rawBody = '';
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files (profile images, etc.)
app.use('/uploads', express.static('uploads', {
  maxAge: '1y', // Cache uploaded files for 1 year
  immutable: true
}));

// Define global error handler (registered after routes)
const globalErrorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  // Ensure error is Error-like
  const error = err instanceof Error ? err : new Error(String(err));
  const status = (err as any).status || (err as any).statusCode || 500;
  const message = error.message || "Internal Server Error";

  // Report critical errors to Sentry (5xx errors only)
  if (status >= 500 && process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        endpoint: req.path,
        method: req.method,
        statusCode: status,
      },
      extra: {
        userId: (req as any).user?.id,
        // NEVER send req.body or req.query - they may contain sensitive data
        // Only send safe metadata
        contentType: req.headers['content-type'],
        userAgent: req.headers['user-agent'],
      },
    });
  }

  // Log error with full context (non-blocking)
  ErrorLogger.logFromRequest(error, req, {
    errorType: (err as any).errorType || 'api_error',
    statusCode: status,
    metadata: {
      stack: error.stack,
      code: (err as any).code,
      name: error.name
    }
  });

  // Return user-friendly error messages
  const userMessage = status >= 500 
    ? "Something went wrong. Our team has been notified." 
    : message;

  res.status(status).json({ 
    message: userMessage,
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Run database migrations
async function runDatabaseMigrations() {
  // Only run migrations if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    log("⚠️ DATABASE_URL not configured - skipping migrations");
    return;
  }

  try {
    log("🔄 Running database migrations...");
    
    // Import and run migration script
    const { runMigrations } = await import('../scripts/migrate.js');
    await runMigrations();
    
    log("✅ Database migrations completed");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`❌ Migration failed: ${errorMessage}`);
    // Don't exit - tables may already exist, let the app try to start
  }
}

// Start async initialization
async function startServer() {
  // Health check endpoint - must be registered before routes
  app.get('/health', async (req, res) => {
    try {
      // Check database connectivity
      const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      
      if (error) throw error;
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: 'connected',
        uptime: process.uptime(),
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: 'disconnected',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Test Supabase connection on startup
  try {
    log("🔄 Testing Supabase connection...");
    const isConnected = await testSupabaseConnection();
    if (isConnected) {
      log("✅ Supabase connection successful");
    } else {
      log("⚠️ Supabase connection test failed - continuing anyway");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`❌ Supabase connection failed: ${errorMessage}`);
    // Don't exit - allow app to start anyway in case of DB issues
  }

  // Run database migrations in background (non-blocking)
  // DISABLED: Using db:push for schema management instead
  // runDatabaseMigrations().then(async () => {
    // Initialize database after migrations complete
    try {
      const { initializeDatabase } = await import('./init-db');
      await initializeDatabase();

      // Seed default autonomous rules
      const { seedDefaultAutonomousRules } = await import('./lib/default-autonomous-rules');
      await seedDefaultAutonomousRules();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`⚠️ Database initialization warning: ${errorMessage}`);
    }
  // });

  return await registerRoutes(app);
}

// Check if running on Vercel serverless
const isVercelServerless = process.env.VERCEL_SERVERLESS === 'true' || process.env.VERCEL === '1';

// Initialize app and export for serverless OR start server for traditional hosting
async function initializeApp() {
  const server = await startServer();
  
  // Register global error handler - must be after routes
  app.use(globalErrorHandler);
  
  return server;
}

// Start server initialization and register error handler immediately after routes
const serverPromise = initializeApp();

// Only run schedulers and listen() when NOT on Vercel (local dev or Replit VM)
if (!isVercelServerless) {
  serverPromise.then(async (server) => {

    // Initialize billing tasks scheduler with singleton pattern
    let billingSchedulerInitialized = false;
  
  async function initializeBillingScheduler() {
    // Prevent duplicate initialization (e.g., during hot reload)
    if (billingSchedulerInitialized) {
      log("[Scheduler] Billing scheduler already initialized, skipping");
      return;
    }
    
    try {
      const { runBillingTasks } = await import('./lib/trial-expiration-service');
      
      // Run billing tasks every 6 hours (21600000 ms)
      const BILLING_INTERVAL = 6 * 60 * 60 * 1000;
      
      // Wrapper to safely execute billing tasks with error handling
      const safeBillingTasksExecution = async () => {
        try {
          log("[Scheduler] Running billing tasks...");
          await runBillingTasks();
          log("[Scheduler] Billing tasks completed successfully");
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          log(`[Scheduler] ERROR in billing tasks: ${errorMsg}`);
          // Don't crash - log error and continue with next scheduled run
        }
      };
      
      // Run once on startup (after a delay to allow server to start)
      setTimeout(safeBillingTasksExecution, 30000); // 30 seconds after startup
      
      // Set up recurring execution with error handling
      setInterval(safeBillingTasksExecution, BILLING_INTERVAL);
      
      billingSchedulerInitialized = true;
      log("[Scheduler] Billing tasks scheduler initialized (runs every 6 hours)");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log(`[Scheduler] CRITICAL: Failed to initialize billing scheduler: ${errorMsg}`);
    }
  }

  // Start billing scheduler
  initializeBillingScheduler();

  // Initialize campaign scheduler with singleton pattern
  let campaignSchedulerInitialized = false;
  
  async function initializeCampaignScheduler() {
    if (campaignSchedulerInitialized) {
      log("[Campaign Scheduler] Already initialized, skipping");
      return;
    }
    
    try {
      const { processScheduledCampaigns } = await import('./lib/campaign-scheduler');
      
      // Run campaign scheduler every 5 minutes (300000 ms)
      const CAMPAIGN_INTERVAL = 5 * 60 * 1000;
      
      const safeCampaignExecution = async () => {
        try {
          await processScheduledCampaigns();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          log(`[Campaign Scheduler] ERROR: ${errorMsg}`);
        }
      };
      
      // Run once on startup (after a delay)
      setTimeout(safeCampaignExecution, 45000); // 45 seconds after startup
      
      // Set up recurring execution
      setInterval(safeCampaignExecution, CAMPAIGN_INTERVAL);
      
      campaignSchedulerInitialized = true;
      log("[Campaign Scheduler] Initialized (runs every 5 minutes)");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log(`[Campaign Scheduler] CRITICAL: Failed to initialize: ${errorMsg}`);
    }
  }

  // Start campaign scheduler
  initializeCampaignScheduler();

  // Initialize autonomous scheduler for AI-driven automation
  let autonomousSchedulerInitialized = false;
  
  async function initializeAutonomousSchedulerFn() {
    if (autonomousSchedulerInitialized) {
      log("[Autonomous Scheduler] Already initialized, skipping");
      return;
    }
    
    try {
      const { initializeAutonomousScheduler } = await import('./lib/autonomous-scheduler');
      
      // Initialize cron jobs
      initializeAutonomousScheduler();
      
      autonomousSchedulerInitialized = true;
      log("[Autonomous Scheduler] Initialized - autonomous operations active");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log(`[Autonomous Scheduler] CRITICAL: Failed to initialize: ${errorMsg}`);
    }
  }

  // Start autonomous scheduler
  initializeAutonomousSchedulerFn();

  // Initialize cart recovery scheduler for autonomous cart recovery
  let cartRecoverySchedulerInitialized = false;
  
  async function initializeCartRecoverySchedulerFn() {
    if (cartRecoverySchedulerInitialized) {
      log("[Cart Recovery] Already initialized, skipping");
      return;
    }
    
    try {
      const { startCartRecoveryScheduler } = await import('./lib/cart-recovery-scheduler');
      
      // Initialize cron jobs for cart recovery
      startCartRecoveryScheduler();
      
      cartRecoverySchedulerInitialized = true;
      log("[Cart Recovery] Scheduler initialized - cart recovery active");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log(`[Cart Recovery] CRITICAL: Failed to initialize: ${errorMsg}`);
    }
  }

  // Start cart recovery scheduler
  initializeCartRecoverySchedulerFn();

  // Initialize background product sync scheduler
  let productSyncSchedulerInitialized = false;
  
  // Generate or use internal service token
  const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 
    (process.env.NODE_ENV === 'production' 
      ? (() => { throw new Error('INTERNAL_SERVICE_TOKEN must be set in production'); })()
      : `dev-internal-${Math.random().toString(36).substring(7)}`
    );
  
  if (!process.env.INTERNAL_SERVICE_TOKEN) {
    if (process.env.NODE_ENV === 'production') {
      log("[Product Sync] ERROR: INTERNAL_SERVICE_TOKEN not set in production - scheduler disabled for security");
    } else {
      log(`[Product Sync] Using development token (not for production)`);
      process.env.INTERNAL_SERVICE_TOKEN = INTERNAL_SERVICE_TOKEN;
    }
  }
  
  async function initializeProductSyncScheduler() {
    if (productSyncSchedulerInitialized) {
      log("[Product Sync] Already initialized, skipping");
      return;
    }
    
    // Skip if no token in production
    if (!process.env.INTERNAL_SERVICE_TOKEN) {
      log("[Product Sync] Skipping initialization - no service token configured");
      return;
    }
    
    try {
      const { SupabaseStorage } = await import('./lib/supabase-storage');
      const storage = new SupabaseStorage();
      
      // Run product sync every 10 minutes (600000 ms)
      const SYNC_INTERVAL = 10 * 60 * 1000;
      
      const safeProductSyncExecution = async () => {
        try {
          log("[Product Sync] Running auto-sync for all connected stores...");
          
          // Get all active Shopify connections directly from database
          const { data: connections } = await supabase
            .from('store_connections')
            .select('*')
            .eq('platform', 'shopify')
            .eq('status', 'active');
          
          if (!connections || connections.length === 0) {
            log("[Product Sync] No active Shopify connections found");
            return;
          }
          
          log(`[Product Sync] Found ${connections.length} active connections`);
          
          // Sync each store using internal service token (localhost only)
          for (const connection of connections) {
            try {
              const userId = connection.user_id;
              log(`[Product Sync] Syncing store ${connection.store_name} for user ${userId}`);
              
              // Trigger sync via internal API call (localhost only for security)
              const response = await fetch(`http://127.0.0.1:5000/api/shopify/sync`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
                  'x-internal-user-id': userId
                },
                body: JSON.stringify({ syncType: 'auto' })
              });
              
              if (response.ok) {
                const result = await response.json();
                log(`[Product Sync] Completed: ${result.added} added, ${result.updated} updated`);
              } else {
                const errorText = await response.text();
                log(`[Product Sync] Failed for ${connection.store_name}: ${response.status} ${errorText}`);
              }
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : String(error);
              log(`[Product Sync] ERROR syncing ${connection.store_name}: ${errorMsg}`);
            }
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          log(`[Product Sync] ERROR: ${errorMsg}`);
        }
      };
      
      // Run once on startup (after a delay)
      setTimeout(safeProductSyncExecution, 60000); // 60 seconds after startup
      
      // Set up recurring execution
      setInterval(safeProductSyncExecution, SYNC_INTERVAL);
      
      productSyncSchedulerInitialized = true;
      log("[Product Sync] Initialized (runs every 10 minutes)");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log(`[Product Sync] CRITICAL: Failed to initialize: ${errorMsg}`);
    }
  }

  // Start product sync scheduler
  initializeProductSyncScheduler();

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // Dynamically import Vite only in development to avoid loading it in production
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    // Production: serve pre-built static files without importing Vite
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const distPath = path.resolve(__dirname, "..", "public");
    
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        // HTML files should always revalidate to get latest content
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    
    // SPA fallback - serve index.html for all non-API routes
    app.get("*", (req, res) => {
      // HTML should always revalidate to get latest content
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  }).catch((error) => {
    console.error("Fatal startup error:", error);
    process.exit(1);
  });
} else {
  // Vercel serverless: initialize the app (including routes), don't start schedulers or listen()
  serverPromise.then(async (server) => {
    // Vercel: serve pre-built static files without importing Vite
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const distPath = path.resolve(__dirname, "..", "public");
    
    // Verify dist/public exists (fail fast if misconfigured)
    if (!fs.existsSync(distPath)) {
      const error = `Cannot find build directory: ${distPath}. Run 'npm run build:all' first.`;
      console.error(error);
      throw new Error(error);
    }
    
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        // HTML files should always revalidate to get latest content
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    
    // SPA fallback - serve index.html for all non-API routes
    app.get("*", (req, res) => {
      // HTML should always revalidate to get latest content
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, "index.html"));
    });
    
    log("✅ App initialized for Vercel serverless (routes registered)");
  }).catch((error) => {
    console.error("Fatal app initialization error:", error);
    // Don't exit on Vercel - let the serverless function handle the error
  });
}

// Export both the app and the initialization promise for Vercel serverless
// api/index.js needs to await serverPromise to ensure routes are registered
export { app, serverPromise };
