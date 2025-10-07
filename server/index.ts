import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { testSupabaseConnection } from "./lib/supabase";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

(async () => {
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

  const server = await registerRoutes(app);

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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
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
})();
