import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";
// Service Worker disabled for development - uncomment when needed
// import { register as registerServiceWorker, showUpdateNotification } from "./lib/serviceWorkerRegistration";

// CRITICAL: Intercept password recovery tokens BEFORE React/Supabase initializes
// This prevents Supabase from consuming the tokens before we can redirect
// IMPORTANT: Must be very specific to avoid catching Google/OAuth logins
(function interceptRecoveryTokens() {
  const hash = window.location.hash;
  const search = window.location.search;
  const currentPath = window.location.pathname;
  
  // Already on reset-password page, let it handle the tokens
  if (currentPath.startsWith('/reset-password')) {
    console.log('[Recovery] Already on reset-password page');
    return;
  }
  
  // Skip if no hash or search params (nothing to intercept)
  if (!hash && !search) {
    return;
  }
  
  // Parse URL parameters
  const hashParams = new URLSearchParams(hash.substring(1));
  const searchParams = new URLSearchParams(search);
  
  const type = hashParams.get('type') || searchParams.get('type');
  const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
  const error = hashParams.get('error') || searchParams.get('error');
  
  // Check for Supabase auth errors (e.g., expired links)
  if (error) {
    console.log('[Recovery] Auth error detected:', error);
    return;
  }
  
  // ONLY intercept if type is EXPLICITLY 'recovery' - this distinguishes from Google OAuth
  // Google OAuth uses type like 'signup', 'magiclink', or no type at all
  const isPasswordRecovery = type === 'recovery';
  
  if (isPasswordRecovery && accessToken) {
    console.log('[Recovery] PASSWORD RECOVERY DETECTED - Redirecting to reset-password page');
    // Redirect to reset-password page with tokens BEFORE Supabase can process them
    const tokenData = hash || search;
    window.location.replace(`/reset-password${tokenData}`);
    // Stop script execution - the redirect will handle the rest
    throw new Error('Recovery redirect in progress');
  }
})();

// Initialize Sentry for frontend error tracking
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
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
  console.log('✅ Sentry frontend monitoring initialized');
} else {
  console.log('⚠️  Sentry DSN not configured - error tracking disabled');
}

// Service Worker registration disabled - uncomment when needed for production
// Unregister any existing service workers to prevent errors
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('🧹 Service Worker unregistered');
    });
  });
  console.log('⚙️  Service Worker disabled in development mode');
}

createRoot(document.getElementById("root")!).render(<App />);
