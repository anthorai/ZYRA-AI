# Overview
Zyra AI is an AI-powered Shopify SaaS application designed to help e-commerce merchants boost sales, optimize product listings, recover abandoned carts, and automate growth through intelligent automation. It provides AI-generated product descriptions, SEO optimization tools, email marketing automation, Shopify store integration, and an analytics dashboard to enhance store performance and drive significant ROI.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The frontend uses React 18, TypeScript, and Vite, featuring shadcn/ui components with Radix UI and Wouter for routing. Styling is managed by Tailwind CSS with a dark theme, following a component-based architecture. Navigation uses the browser's native `window.history.back()` API for consistent back button behavior. Browser caching is controlled to ensure the latest application version, and the sidebar state persists across sessions using `localStorage`. The application is WCAG 2.1 AA compliant, with comprehensive accessibility features including keyboard navigation, visible focus indicators, logical tab order, color contrast verification, screen reader support (ARIA labels, semantic landmarks), and accessible components for loading states and forms. PWA capabilities with service worker caching provide offline support, faster repeat visits, and installability.

## Technical Implementations
The server uses Express.js with TypeScript, providing RESTful API endpoints. Authentication is session-based via `express-session` and Passport.js. PostgreSQL with Drizzle ORM is used for type-safe database operations, and Drizzle Kit manages migrations. AES-256-GCM encryption is used for sensitive data.

## Feature Specifications
### AI Integration
Zyra AI employs a centralized AI prompt library and a multi-model AI system (GPT-4o, GPT-4o-mini) for professional copywriting, product description generation, automated SEO optimization, image alt-text generation, bulk product optimization, and brand voice memory. It includes a premium Strategy AI (GPT-4o) for insights, token accounting, rate limiting, and Redis-backed AI response caching with a 24hr TTL.

### Authentication & Authorization
Supabase Auth provides email/password login, password reset, and JWT-based session management with bcrypt for 2FA backup codes. The system implements application-level Row Level Security (RLS) using backend JWT authentication and service role database access, with comprehensive RBAC for admin endpoints and perfect payment data isolation.

### Payment System
PayPal-only payment processing (USD globally) with secure webhook handlers for subscription payments, idempotent processing, signature verification, and error handling. It supports free trial auto-activation, paid plan checkout via PayPal SDK, payment capture, subscription activation, credit initialization, and user notifications. All subscription plans ($0, $49, $299, $999) are configured.

### Marketing Automation System
Provides real email/SMS delivery via SendGrid and Twilio, featuring campaign scheduling, abandoned cart recovery, and performance tracking.

### Analytics & Reporting
A real-time dashboard tracks campaigns, revenue, conversions, and ROI, with export capabilities for PDF and CSV.

### Error Tracking & Monitoring
Production-grade monitoring infrastructure with Sentry integration for both backend and frontend, featuring real-time error tracking with 5xx error alerts, session replay, user-friendly error messages, and a comprehensive health check endpoint (`/health`). Sensitive data protection ensures no confidential information is leaked.

### Security & Compliance
Production-ready security with zero critical vulnerabilities. Features include multi-tier rate limiting, comprehensive input sanitization, GDPR compliance, AES-256-GCM encryption, bcrypt hashing, CORS protection, helmet.js security headers, and secure credential management.

### Notification System
Advanced preferences for multi-channel notifications (Email, SMS, In-App, Push) with granular control, including proactive trial expiration notifications.

### Shopify Integration
Full OAuth 2.0 integration for connecting with Shopify stores, supporting bidirectional product sync and store management. Comprehensive OAuth scopes cover products, inventory, customers, orders, checkouts, marketing events, analytics, reports, and localization. Includes robust security features like state validation, shop domain protection, HMAC verification, and input sanitization. GDPR-compliant webhooks respond instantly (<100ms) with asynchronous data processing.

## System Design Choices
Configured for VM deployment on Replit, with a build process using Vite for frontend and esbuild for backend. The architecture supports persistent schedulers for billing, campaigns, and product syncing. Automated database migrations managed by Drizzle Kit run on server startup, creating all 37 required tables. Performance optimizations include 95+ database indexes for optimal query performance, Redis caching (Upstash) for AI responses and data, and frontend optimizations like code splitting, response compression, and static asset caching.

# External Dependencies

## Database & Hosting
- **PostgreSQL**: Production database.
- **Supabase**: Provides PostgreSQL and authentication services.
- **Drizzle ORM**: Type-safe database queries.
- **Deployment Options**: Replit VM (development/testing), Vercel (production serverless with CDN, auto-scaling, Vercel Cron, and automatic database migrations).

## AI & Machine Learning
- **OpenAI API**: GPT-4o mini for text generation and Vision API for image analysis.
- **Upstash Redis**: Serverless Redis for AI response caching and performance optimization.

## Payment Processing
- **PayPal**: International payment gateway.

## Email & SMS Services
- **SendGrid**: Transactional emails and marketing campaigns.
- **Twilio**: SMS notifications and cart recovery.