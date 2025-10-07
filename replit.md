# Overview

Zyra is an AI-powered Shopify SaaS application designed to help e-commerce merchants boost sales, optimize product listings, recover abandoned carts, and automate growth through intelligent automation. It provides AI-generated product descriptions, SEO optimization tools, email marketing automation, and an analytics dashboard to enhance store performance and drive significant ROI.

# Recent Changes (October 2025)

## Phase 6: Production Readiness Complete
- **Error Tracking System**: Comprehensive error logging to database with ErrorLogger utility, global error middleware, and admin endpoints for monitoring
- **Database Performance**: 46 indexes across 21 tables for optimized queries (userId, status, timestamps, composite indexes)
- **Health Monitoring**: /api/health endpoint with uptime, database status, and response time metrics
- **Session Security**: 30-minute inactivity timeout with automatic logout and warning notifications
- **Empty State UX**: User-friendly empty states with CTAs across 5 major pages (campaigns, templates, carts, etc.)
- **Payment Webhooks**: Razorpay and PayPal webhook handlers with signature verification, state-based idempotency, database updates, and error logging

## Phase 5: Security, Compliance & Error Handling Complete
- **Rate Limiting**: Multi-tier rate limiting (auth: 15/15min, AI: 10/min, campaigns: 20/min, payments: 10/min, uploads: 5/min)
- **Input Sanitization**: Comprehensive input validation middleware using express-validator
- **GDPR Compliance**: Data export and deletion endpoints with proper anonymization
- **Privacy & Terms Pages**: Full Privacy Policy and Terms of Service with proper routing
- **Error Handling**: Retry logic in API calls, proper loading states, and validation error messages

## Phase 4: Real Marketing Automation & Analytics Complete
- **Campaign Scheduler**: Runs every 5 minutes, processes scheduled campaigns and sends emails/SMS
- **Real Analytics Tracking**: Dashboard with real revenue metrics, conversion rates, and campaign performance
- **PDF/CSV Export**: Generate downloadable analytics reports in PDF and CSV formats
- **Revenue Tracking**: Track campaign conversions and calculate ROI from abandoned cart recovery
- **Abandoned Cart Recovery**: Automated email/SMS recovery with real SendGrid/Twilio delivery

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
The client-side uses React 18, TypeScript, and Vite, featuring shadcn/ui components with Radix UI, Wouter for routing, and TanStack Query for server state. Styling is managed by Tailwind CSS with a dark theme. It follows a component-based architecture.

## Backend
The server uses Express.js with TypeScript, providing RESTful API endpoints. Authentication is session-based via express-session and Passport.js (local strategy with bcrypt).

## Database
PostgreSQL with Drizzle ORM is used for type-safe operations. The schema includes tables for users, products, SEO metadata, marketing campaigns, and analytics. Drizzle Kit manages migrations.

## AI Integration
OpenAI GPT-5 powers core AI functionalities, including product description generation, automated SEO optimization, image alt-text generation (Vision API), bulk product optimization, and a brand voice memory system. It includes token accounting and rate limiting.

## Authentication & Authorization
Supabase Auth provides email/password login, password reset, and JWT-based session management. It includes frontend route protection and backend middleware for API endpoint security.

## State Management
Client-side state uses TanStack Query for server state caching, React Hook Form with Zod for validation, and React Context for global state.

## Payment System
A multi-gateway payment system supports Razorpay (India), PayPal (International), and planned Stripe integration.

**Webhook Handlers:**
- **Razorpay**: HMAC-SHA256 signature verification, handles payment.authorized, payment.captured, payment.failed, refund.created events
- **PayPal**: OAuth-based signature verification via PayPal API, handles PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED, PAYMENT.CAPTURE.DECLINED, PAYMENT.CAPTURE.REFUNDED events
- **Idempotency**: State-based checks prevent duplicate processing while allowing legitimate transitions (e.g., completed → refunded)
- **Database Updates**: All webhook events update paymentTransactions table with status, webhookData, and metadata
- **Error Logging**: Integrated with ErrorLogger for webhook processing failures
- **Known Limitations**: Documented edge cases for future enhancement (multiple payment attempts, granular auth/capture states, per-event tracking)

## Marketing Automation System
Real email/SMS delivery using SendGrid and Twilio via Replit connectors. Campaign scheduler runs every 5 minutes to process scheduled sends. Features include campaign templates, abandoned cart recovery, and performance tracking with open/click/conversion rates.

## Analytics & Reporting
Real-time analytics dashboard tracking campaigns, revenue, conversions, and ROI. Export capabilities include PDF reports (jsPDF) and CSV data exports. Tracks abandoned cart recovery rates and potential revenue.

## Error Tracking & Monitoring
Production-ready error logging system with comprehensive tracking and non-blocking operations:

**Architecture:**
- **ErrorLogger Utility** (`server/lib/errorLogger.ts`): Centralized logging with context (user, endpoint, request data)
- **Database Storage**: `error_logs` table with jsonb columns for metadata, stack traces, and resolution status
- **Global Error Middleware**: Module-scope handler registered after routes using promise chain
- **Non-Blocking Design**: Uses setImmediate for async DB writes, no request blocking
- **Type Safety**: Proper Error type casting with instanceof checks and fallbacks

**Admin Endpoints:**
- GET `/api/admin/error-logs` - Paginated error logs with filters (status, errorType, userId, resolved)
- PATCH `/api/admin/error-logs/:id/resolve` - Mark errors as resolved with optional notes
- **Pagination**: Accurate counts using shared filter queries, validated limit/offset (1-1000)

**Error Categories:**
api_error, database_error, auth_error, payment_error, ai_error, validation_error, external_api_error

**Implementation Details:**
- Module-level import efficiency (static imports, no per-request dynamic loading)
- Robust query validation with NaN handling and safe defaults
- Context-rich logging with request body, metadata, and stack traces as native JSON

# External Dependencies

## Database & Hosting
- **PostgreSQL**: Production database hosted via Replit.
- **Supabase**: PostgreSQL with built-in authentication.
- **Drizzle ORM**: Type-safe database queries.
- **Replit Deployment**: Full-stack hosting with autoscale.

## AI & Machine Learning
- **OpenAI API**: GPT-5 for text generation, Vision API for image analysis.

## Payment Processing
- **Razorpay**: Indian payment gateway.
- **PayPal**: International payment gateway.
- **Stripe Integration**: Planned for subscriptions.

## Email & SMS Services
- **SendGrid**: Transactional emails and marketing campaigns.
- **Twilio**: SMS notifications and cart recovery.

## Third-party Integrations
- **Shopify API**: Placeholder endpoints for product synchronization.
- **CSV Import/Export**: Functionality for product data.