import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";
// Service Worker disabled for development - uncomment when needed
// import { register as registerServiceWorker, showUpdateNotification } from "./lib/serviceWorkerRegistration";

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
