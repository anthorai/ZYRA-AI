// Vercel serverless function entry point
// Imports the compiled Express app and exports it for Vercel

// IMPORTANT: Set these env vars before importing to skip schedulers
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.VERCEL_SERVERLESS = 'true';

// Re-export the Express app
// The dist/server/index.js file exports {app, serverPromise} after async initialization
export default async function handler(req, res) {
  try {
    // Lazy load the app on first request
    if (!global._cachedApp) {
      console.log('[Vercel] Loading Express app...');
      const { app, serverPromise } = await import('../dist/server/index.js');
      
      // Wait for routes to be registered (serverPromise resolves after registerRoutes completes)
      console.log('[Vercel] Waiting for routes to initialize...');
      await serverPromise;
      
      if (!app) {
        throw new Error('App export is undefined');
      }
      
      // Cache the app for subsequent requests
      global._cachedApp = app;
      console.log('[Vercel] ✅ App loaded, routes registered, and cached');
    }
    
    // Handle the request with the Express app
    return global._cachedApp(req, res);
  } catch (error) {
    console.error('[Vercel] ❌ Failed to load app:', error);
    
    // Return error response
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      hint: 'Check Vercel function logs for details'
    });
  }
}
