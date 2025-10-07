# Overview

Zyra is an AI-powered Shopify SaaS application designed to help e-commerce merchants boost sales, optimize product listings, recover abandoned carts, and automate growth through intelligent automation. It provides AI-generated product descriptions, SEO optimization tools, email marketing automation, and an analytics dashboard to enhance store performance and drive significant ROI.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
The client-side is built with React 18, TypeScript, and Vite. It uses shadcn/ui components with Radix UI primitives, Wouter for routing, and TanStack Query for server state management. Styling is handled by Tailwind CSS with a dark theme featuring a midnight blue to light azure gradient. It follows a component-based architecture for pages, dashboard modules, and reusable UI elements.

## Backend
The server uses Express.js with TypeScript, providing RESTful API endpoints. Authentication is session-based via express-session and Passport.js (local strategy with bcrypt). Key features include secure user sessions, organized API routes, and a middleware pipeline for logging, JSON parsing, and error handling.

## Database
The application utilizes PostgreSQL with Drizzle ORM for type-safe operations. The schema includes tables for users (authentication, subscriptions, Stripe integration), products (Shopify integration, optimization status), SEO metadata, marketing campaigns, and analytics. Drizzle Kit manages database migrations.

## AI Integration
OpenAI GPT-5 (released August 7, 2025) powers core AI functionalities, including:
- Product description generation with various brand voice styles and custom instructions
- Automated SEO title and meta description generation with keyword analysis
- Image alt-text generation using Vision API for accessibility and SEO
- Bulk product optimization via CSV processing
- Brand voice memory system that learns from user preferences and edits
- Token accounting and usage tracking per user
- Rate limiting per subscription plan

## Authentication & Authorization
Authentication uses Supabase Auth with email/password login, password reset functionality via email, and secure JWT-based session management. The system includes:
- Frontend ProtectedRoute component for route-level authorization
- Backend requireAuth middleware for API endpoint protection
- Password reset flow with email verification and proper token exchange using `exchangeCodeForSession({ code })`
- Automatic user profile provisioning
- Session persistence and refresh token handling

## State Management
Client-side state management uses TanStack Query for server state caching, React Hook Form with Zod for form validation, and React Context for global state like authentication and UI.

## Payment System
A multi-gateway payment system supports Razorpay (India), PayPal (International), and planned Stripe integration. It includes database schema for transaction tracking, gateway-specific services, webhook handling with signature verification, and secure checkout UI components.

# External Dependencies

## Database & Hosting
- **PostgreSQL**: Production database via Replit (configured and active)
- **Supabase**: PostgreSQL database with built-in authentication
- **Drizzle ORM**: Type-safe database queries with automatic migrations
- **Replit Deployment**: Full-stack hosting with autoscale
- **Database Schema**: Fully migrated with tables for users, products, campaigns, analytics, notifications, and more

## AI & Machine Learning
- **OpenAI API**: GPT-5 for text generation, Vision API for image analysis, content optimization with token tracking.

## Payment Processing
- **Razorpay**: Indian payment gateway.
- **PayPal**: International payment gateway.
- **Stripe Integration**: Planned for subscription management and payments.

## Email & SMS Services
- **SendGrid**: Transactional emails and marketing campaigns.
- **Twilio**: SMS notifications and cart recovery campaigns (configured).

## Development Tools
- **TypeScript**: Full-stack type safety.
- **Vite**: Fast development server and build tool.
- **Tailwind CSS**: Utility-first styling.

## Third-party Integrations
- **Shopify API**: Placeholder endpoints created for product sync (/api/shopify/products, /api/shopify/sync)
- **CSV Import/Export**: Fully functional product import/export via CSV files (/api/products/export-csv, /api/products/import-csv)

# Recent Changes

## Phase 1: Core Foundation ✅ COMPLETE

### 1. Database Integration ✅
- PostgreSQL database provisioned via Replit and connected through Supabase
- All tables successfully migrated using Drizzle ORM
- Switched from in-memory storage to persistent PostgreSQL storage
- Database now persists data across server restarts
- All CRUD operations working with type-safe Drizzle queries

### 2. Authentication & User Management ✅
- Supabase authentication fully integrated with JWT token handling
- Password reset functionality implemented:
  - Forgot password page (/forgot-password) with email submission
  - Reset password page (/reset-password) with proper token exchange
  - Email-based password reset flow using `exchangeCodeForSession({ code })`
  - Handles both hash and search params for Supabase reset links
  - Proper error handling for expired tokens
- Protected route guards on frontend (ProtectedRoute component)
- Backend authentication middleware (requireAuth)
- Automatic user profile provisioning on signup
- Session persistence and refresh token handling

### 3. Product Management ✅
- CSV import/export endpoints fully functional:
  - GET /api/products/export-csv - Export all products to CSV with proper headers
  - POST /api/products/import-csv - Import products from CSV with file upload (multer)
  - CSV parsing using csv-parser library
  - Bulk operations support with error reporting
  - Proper mapping of CSV columns to product schema
- Shopify integration placeholders:
  - GET /api/shopify/products - Shopify product listing (placeholder)
  - POST /api/shopify/sync - Sync products to Shopify (placeholder)
- Product CRUD operations connected to database
- All product operations persist to PostgreSQL

### 4. Routes Added
- /forgot-password - Password reset request
- /reset-password - Password reset completion with token exchange
- Protected routes with authentication guards
- All routes properly handle authentication state

### 5. Security Improvements
- Session-based authentication with JWT tokens from Supabase
- Protected API endpoints requiring authentication via requireAuth middleware
- Password hashing handled securely by Supabase Auth
- Secure password reset flow with email verification and token exchange
- File upload security with multer for CSV import
- Proper error handling to prevent information leakage

### 6. Technical Fixes Applied
- Fixed password reset token exchange to use `exchangeCodeForSession({ code })` with object parameter
- Fixed CSV import to properly handle multipart/form-data uploads with multer
- Added @types/multer for proper TypeScript support
- Fixed TypeScript errors in route handlers
- Proper error handling and validation throughout

## Phase 2: Core AI Features ✅ COMPLETE

### 1. Image Alt-Text Generation ✅
- OpenAI Vision API integration for analyzing product images
- Generates SEO-optimized alt-text, accessibility descriptions, and keywords
- Real-time image analysis with multi-modal AI capabilities
- Frontend: /ai-tools/image-alt-text with file upload and preview
- Backend: POST /api/generate-alt-text with multipart/form-data handling

### 2. Usage Limit Enforcement ✅
- Middleware (checkAIUsageLimit) verifies plan limits before AI operations
- Plan-based credit limits:
  - Trial: 10 credits
  - Starter: 50 credits  
  - Growth: 1000 credits
  - Pro: Unlimited (-1)
- Returns 429 status when limits exceeded with upgrade suggestions
- Applied to all AI endpoints (descriptions, SEO, alt-text, bulk optimization)

### 3. Token Accounting System ✅
- Tracks OpenAI token usage for all AI operations
- trackAIUsage() function persists token counts to usage_stats table
- createAiGenerationHistory() stores complete generation metadata:
  - Input data, output data, brand voice used, tokens consumed, model version
  - Enables historical analysis and learning from past generations
- Real-time token tracking integrated into all AI endpoints

### 4. Bulk Product Optimization ✅
- CSV-based batch processing for multiple products
- POST /api/products/bulk-optimize endpoint with file upload
- Generates descriptions AND SEO optimization for each product in CSV
- Real-time progress tracking with streaming responses
- Frontend: /ai-tools/bulk-optimization with job status and results display
- Proper error handling and partial success reporting

### 5. Brand Voice Memory System ✅
- User preference storage in user_preferences.aiSettings:
  - Preferred brand voice (sales, professional, creative, etc.)
  - Custom instructions for brand-specific guidelines
  - Tone preferences (formal, casual, technical)
  - Learning enabled/disabled toggle
- Automatic preference integration into AI generation prompts
- POST /api/brand-voice/learn endpoint captures user edits for future learning
- GET/POST /api/brand-voice/preferences for managing preferences
- Frontend integration shows current preferences in generation forms

### 6. Rate Limiting ✅
- Per-plan rate limiting middleware (checkRateLimit):
  - Trial: 5 requests/minute
  - Starter: 10 requests/minute
  - Growth: 30 requests/minute
  - Pro: 100 requests/minute
- In-memory rate limit tracking with automatic cleanup
- Returns 429 Too Many Requests when exceeded
- Applied to all AI endpoints for fair usage enforcement

### Technical Implementation Details
- All AI endpoints follow middleware chain: requireAuth → checkRateLimit → checkAIUsageLimit → AI operation → trackAIUsage
- Token accounting properly invokes createAiGenerationHistory for learning
- Brand voice preferences seamlessly integrated into prompt engineering
- Robust error handling and validation throughout
- TypeScript type safety maintained across all new features

## Phase 3: Billing & Monetization ✅ COMPLETE

### 1. Multi-Gateway Payment System ✅
- **PayPal Integration**: Complete subscription billing for international users
  - Blueprint integration with PayPal SDK configured
  - Order creation and capture endpoints: `/api/paypal/order`, `/api/paypal/order/:orderID/capture`
  - Environment secrets configured: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
- **Razorpay Integration**: Indian payment gateway with subscription support
  - Payment verification with signature validation
  - Webhook handling for payment events
  - Environment secrets configured: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
- **Regional Gateway Selection**: Automatic payment method selection
  - `server/lib/payment-gateway-selector.ts` selects gateway based on currency/country
  - Razorpay for INR/India, PayPal for international
  - GET `/api/payments/gateway-selection` returns recommended and available gateways

### 2. Subscription Management ✅
- **UI Components**: Full subscription management interface
  - `/subscription` page shows current plan, billing period, next billing date
  - Plan upgrade/downgrade cards with visual indicators
  - Payment history and transaction tracking
  - Invoice listing with download links
  - TypeScript-safe with proper type handling for query responses
- **Backend Logic**: Plan change and subscription operations
  - POST `/api/subscription/change-plan` handles plan switches
  - Validates plan transitions and updates database
  - Integrates with payment gateways for billing

### 3. Trial Expiration & Auto-Billing ✅
- **Trial Expiration Service**: Automated trial conversion system
  - `server/lib/trial-expiration-service.ts` handles expired trials
  - Converts trial users to paid plans or past_due status
  - Uses plan slugs (planName) for data integrity, not plan IDs
  - Properly updates user.plan field with subscription plan name
- **Billing Scheduler**: Automated recurring billing
  - Runs every 6 hours to check trial expirations and renewals
  - Singleton pattern prevents duplicate initialization
  - Error handling wrapper prevents crashes from failed billing runs
  - Logs all operations for monitoring and debugging
- **Admin Endpoint**: Manual billing trigger with security
  - POST `/api/admin/run-billing-tasks` (admin-only with role check)
  - Returns 403 Forbidden for non-admin users
  - Prevents privilege escalation attacks

### 4. Security & Data Integrity Fixes ✅
- **Authorization**: Admin role verification on billing endpoints
- **Plan Consistency**: Trial conversion uses plan names (slugs) not IDs
- **Scheduler Hardening**: Error handling, singleton pattern, crash prevention
- **Audit Trail**: All billing operations logged for compliance

### Technical Implementation
- Multi-gateway architecture supports regional payment preferences
- Subscription state machine handles trial → paid → renewal flow
- Automated billing runs without manual intervention
- Robust error handling prevents service disruptions
- All payment operations validated and secured

## Next Steps (Phase 4+)
- Implement actual Shopify API integration with webhooks
- Create marketing campaign management (email/SMS)
- Add analytics dashboard with usage visualization
- Build recommendation engine using AI generation history
- Add A/B testing for product descriptions
- Implement Stripe integration (deferred from Phase 3)
