// Vercel serverless function entry point
// This file exports the Express app for Vercel's serverless environment

// Import the compiled server (Vercel will run the build step first)
const path = require('path');

// Set environment to production for serverless
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Vercel serverless indicator
process.env.VERCEL_SERVERLESS = 'true';

// Import the Express app from the compiled dist/server directory
let app;

try {
  // Load the compiled server app
  const serverPath = path.join(__dirname, '../dist/server/index.js');
  const serverModule = require(serverPath);
  
  // The server exports either 'app' or 'default'
  app = serverModule.app || serverModule.default || serverModule;
  
  if (typeof app === 'function' && app.name === 'app') {
    // It's already an Express app
    module.exports = app;
  } else if (typeof app === 'object' && app.handle) {
    // It's an Express app object
    module.exports = app;
  } else {
    throw new Error('Invalid Express app export');
  }
} catch (error) {
  console.error('Failed to load Express app:', error);
  
  // Fallback: create a minimal Express app that shows the error
  const express = require('express');
  app = express();
  
  app.use((req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      hint: 'Make sure the build completed successfully. Run: npm run build'
    });
  });
  
  module.exports = app;
}
