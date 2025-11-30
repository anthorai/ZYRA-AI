// Vercel serverless function entry point
// Imports the compiled Express app and exports it for Vercel

// IMPORTANT: Set these env vars before importing to skip schedulers
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.VERCEL_SERVERLESS = 'true';

// Helper to read raw body from Vercel request
async function getRawBody(req) {
  // If body is already a string (Vercel sometimes pre-parses)
  if (typeof req.body === 'string') {
    return req.body;
  }
  
  // If body is a Buffer
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }
  
  // If body is an object (already parsed JSON)
  if (req.body && typeof req.body === 'object') {
    return JSON.stringify(req.body);
  }
  
  // Read from stream if not already consumed
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk.toString();
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', reject);
    
    // Timeout after 5 seconds
    setTimeout(() => resolve(data || ''), 5000);
  });
}

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
    
    // For webhook routes, capture raw body BEFORE Express processes it
    // This is critical for HMAC signature verification
    if (req.url && req.url.includes('/api/webhooks')) {
      try {
        const rawBody = await getRawBody(req);
        req.rawBody = rawBody;
        
        // Also set the body if it's not already set
        if (!req.body && rawBody) {
          try {
            req.body = JSON.parse(rawBody);
          } catch {
            req.body = {};
          }
        }
        
        console.log('[Vercel] Webhook raw body captured:', {
          url: req.url,
          rawBodyLength: rawBody?.length || 0,
          method: req.method
        });
      } catch (bodyError) {
        console.error('[Vercel] Error capturing raw body:', bodyError);
        req.rawBody = '';
      }
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
