// Vercel serverless function entry point
// Imports the compiled Express app and exports it for Vercel

// IMPORTANT: Set these env vars before importing to skip schedulers
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.VERCEL_SERVERLESS = 'true';

// Re-export the Express app
// The dist/index.js file exports {app} after async initialization
module.exports = async (req, res) => {
  try {
    // Lazy load the app on first request
    if (!global._cachedApp) {
      console.log('[Vercel] Loading Express app...');
      const { app } = await import('../dist/index.js');
      
      // Wait for app to be ready (initialization happens in server/index.ts)
      if (!app) {
        throw new Error('App export is undefined');
      }
      
      // Cache the app for subsequent requests
      global._cachedApp = app;
      console.log('[Vercel] ✅ App loaded and cached');
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
};
