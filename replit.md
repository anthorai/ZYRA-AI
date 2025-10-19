# Overview

Zyra is an AI-powered Shopify SaaS application designed to help e-commerce merchants boost sales, optimize product listings, recover abandoned carts, and automate growth through intelligent automation. It provides AI-generated product descriptions, SEO optimization tools, email marketing automation, Shopify store integration, and an analytics dashboard to enhance store performance and drive significant ROI.

# Recent Changes (October 19, 2025)

## Integration Management System
1. **PayPal & SendGrid Integration UI**: Added comprehensive integration management system in `client/src/pages/settings/integrations.tsx`:
   - PayPal integration with Client ID + Client Secret input forms
   - SendGrid integration with API key input form
   - Secure credential storage using existing integration settings API
   - Full connect/disconnect flows with backend synchronization
   - Connection status persists across page reloads
   - Complete error handling and user feedback

## Bug Fixes
2. **Growth Dashboard Navigation**: Fixed "Total Campaigns" card navigation to properly route to `/campaigns` page instead of showing "Coming Soon" toast

# Previous Changes (October 18, 2025)

## Security Enhancements
1. **AES-256-GCM Encryption**: Upgraded from base64 encoding to military-grade AES-256-GCM encryption for all sensitive data (API keys, OAuth tokens, 2FA secrets) in `server/lib/encryption.ts` and `server/lib/supabase-storage.ts`
2. **2FA Backup Code Security**: Upgraded from SHA256 to bcrypt (10 salt rounds) for backup code hashing in `server/lib/2fa-service.ts` with constant-time verification

## Infrastructure Improvements
3. **Shopify API Rate Limiting**: Implemented token bucket rate limiter in `server/lib/shopify-client.ts` to prevent throttling:
   - 2 requests/second with 40-request burst capacity
   - In-place 429 retry handling with exponential backoff
   - Queue management with try-finally error recovery
   - Rate limit header monitoring and warnings

4. **Trial Expiration Notification System**: Enhanced `server/lib/trial-expiration-service.ts` with proactive notification service:
   - Notification schedule: 7 days (welcome), 3 days, 1 day before expiration
   - In-app notifications with analytics tracking
   - Duplicate prevention and graceful error handling
   - Admin-only API endpoints for manual triggering and status monitoring
   - Ready for SendGrid/Twilio email/SMS integration (now available via integrations UI)

## Deployment Configuration
5. **Production Deployment Setup**: Configured VM deployment for production publishing:
   - Build: `npm run build` (Vite frontend + esbuild backend bundling)
   - Run: `npm start` (Production server on 0.0.0.0:5000)
   - VM target for persistent schedulers and background jobs

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
The client-side uses React 18, TypeScript, and Vite, featuring shadcn/ui components with Radix UI, Wouter for routing, and TanStack Query for server state. Styling is managed by Tailwind CSS with a dark theme, following a component-based architecture.

## Backend
The server uses Express.js with TypeScript, providing RESTful API endpoints. Authentication is session-based via express-session and Passport.js (local strategy with bcrypt).

## Database
PostgreSQL with Drizzle ORM is used for type-safe operations. The schema includes tables for users, products, SEO metadata, marketing campaigns, and analytics. Drizzle Kit manages migrations.

## AI Integration

### Zyra Pro Mode System
**Architecture:** Centralized AI prompt library (`shared/ai-system-prompts.ts`) that transforms all AI outputs from basic text generation to expert-level, conversion-optimized content. Every AI tool uses the ZYRA_PRO_MODE_PROMPT system instruction.

**Core Principles:**
- Professional, expert, confident tone in all outputs
- Conversion-focused (drives action, not just information)
- SEO-optimized with natural keyword flow
- Human-quality (never robotic or generic)
- Production-ready (instantly usable for business)
- Tool-specific adaptations (Blog ≠ Caption ≠ Product)

**Quality Standards Enforced:**
- Unique, insight-rich content (no fluff or repetition)
- Clear formatting (headings, bullets, short paragraphs)
- Strategic emotional triggers and persuasion techniques
- Banned phrases filtering (corporate jargon, clichés)
- Power words library for high-impact copy

**Tool-Specific Prompts (12 variations):**
1. **Professional Copywriting** - Multi-agent pipeline with frameworks
2. **Product Descriptions** - Persuasive, benefit-driven, conversion-optimized
3. **SEO Titles & Meta** - Search-optimized, click-worthy, keyword-rich
4. **Image Alt-Text** - Accessible, SEO-friendly, descriptive
5. **Email Marketing** - Personalized, engaging, high-converting
6. **Blog Content** - Long-form SEO-rich, informative, structured
7. **Social Captions** - Scroll-stopping, emotional, CTA-focused
8. **Ad Copy** - Creative, bold, emotionally triggering, concise
9. **Video Scripts** - Cinematic, engaging, emotional storytelling
10. **Analyzer Agent** - Market & audience analysis for multi-agent pipeline
11. **Copywriter/Critic Agents** - Content generation and quality refinement
12. **Strategy AI** - Deep insights, campaign strategies (GPT-4o premium)

### Zyra Engine - Plan-Based AI Routing
**Architecture:** Advanced multi-model AI system with plan-based intelligent routing and dynamic prompt generation:

**Plan-Based Model Selection:**
- **PRO Plan** → GPT-4o for deep reasoning, tone optimization, A/B testing, strategic analysis
- **Growth Plan** → GPT-4o for advanced features with some limitations
- **Starter/Free Plans** → GPT-4o-mini for lightweight tasks (titles, alt text, bulk updates)

**Zyra Engine Master Prompt (`shared/ai-system-prompts.ts`):**
- Dynamic variable replacement system for context-aware generation
- Multi-category output support (Product SEO, Conversion, Branding, Performance, Workflow)
- Structured JSON output for seamless integration
- Quality validation: keyword density, brand uniqueness, performance focus
- Goal: Increase CTR, SEO ranking, and conversions

**Model Selector (`server/lib/ai-model-selector.ts`):**
- 13 task types with optimized temperature and max_tokens per task
- Automatic cost estimation and token tracking
- Plan-aware routing: `getModelForPlan(taskType, userPlan)`
- Premium access validation for GPT-4o features

### Core AI Features
OpenAI powers all content generation:

- **Professional Copywriting System**: Multi-agent pipeline (Analyzer → Copywriter → Critic) with 5 industry frameworks (AIDA, PAS, BAB, 4Ps, FAB), 6 psychological triggers (scarcity, social proof, authority, urgency, reciprocity, loss aversion), and 6 industry-specific templates (Fashion, Tech, Health, Home, Luxury, Beauty). Generates 3 A/B variants (emotional, logical, hybrid) with comprehensive quality scoring across conversion potential, SEO, readability, emotional impact, and clarity. **Uses Pro Mode multi-agent prompts.**

- **Product Description Generation**: AI-powered descriptions with brand voice consistency. **Uses Pro Mode persuasive, benefit-driven prompt.**

- **Automated SEO Optimization**: Keyword-rich titles and meta descriptions. **Uses Pro Mode search-optimized, click-worthy prompt.**

- **Image Alt-Text Generation**: Vision API for accessibility and SEO. **Uses Pro Mode accessible, SEO-friendly prompt.**

- **Bulk Product Optimization**: Process 20-100+ products efficiently with Pro Mode quality

- **Brand Voice Memory**: Maintains consistent tone across all content, enhanced by Pro Mode standards

- **Strategy AI (GPT-4o)**: Premium strategic analysis using GPT-4o full model for deep insights, campaign strategies, and high-converting long-form copy. Four-part analysis framework: Performance Deep Dive, Strategic Recommendations (email/SMS/ads/SEO), Campaign Execution (3 copy variants A/B/C ready), and Action Plan (0-7 days, 1-3 months, 3-6 months). Auto-fills with real analytics data and provides data-driven, actionable insights in professional markdown format. **Uses premium GPT-4o with Strategy AI prompt.**

- **Token Accounting & Rate Limiting**: Cost control and usage tracking

## Authentication & Authorization
Supabase Auth provides email/password login, password reset, and JWT-based session management. It includes frontend route protection and backend middleware for API endpoint security.

## State Management
Client-side state uses TanStack Query for server state caching, React Hook Form with Zod for validation, and React Context for global state.

## Payment System
A multi-gateway payment system supports Razorpay (India) and PayPal (International). Webhook handlers for both gateways include signature verification, idempotency checks, database updates, and error logging.

## Marketing Automation System
Real email/SMS delivery using SendGrid and Twilio. A campaign scheduler runs every 5 minutes to process scheduled sends. Features include campaign templates, abandoned cart recovery, secure email open tracking, and performance tracking with open/click/conversion rates.

## Analytics & Reporting
Real-time analytics dashboard tracks campaigns, revenue, conversions, and ROI. Export capabilities include PDF reports and CSV data exports. Tracks abandoned cart recovery rates and potential revenue.

## Error Tracking & Monitoring
A production-ready error logging system uses an `ErrorLogger` utility for centralized logging to a `error_logs` table, non-blocking asynchronous database writes, and a global error middleware. Admin endpoints allow for monitoring and managing error logs.

## Security & Compliance
Includes multi-tier rate limiting, comprehensive input sanitization using `express-validator`, GDPR compliance with data export/deletion endpoints, and dedicated privacy and terms pages. **Enhanced with AES-256-GCM encryption** for sensitive credentials and **bcrypt-hashed 2FA backup codes** for production-grade security.

## Notification System
An advanced notification preference system allows granular control over multi-channel notifications (Email, SMS, In-App, Push) across various categories. Features include preset modes, frequency management, visual quiet hours builder, and four-tier priority filtering. **Trial expiration notification service** sends proactive in-app notifications at 7, 3, and 1 days before trial expiration, with infrastructure ready for email/SMS integration.

## Shopify Integration
A fully functional OAuth 2.0 integration system connects Zyra with Shopify stores. Features include:
- **OAuth Flow**: Secure authorization using Shopify's OAuth 2.0 with comprehensive security hardening
- **Product Sync**: Bidirectional sync of products between Shopify and Zyra
- **Store Management**: Connection status tracking, disconnect functionality, and store metadata storage
- **Security Features**:
  - **State Validation**: 256-bit secure random state tokens using crypto.randomBytes
  - **Shop Domain Protection**: Stored shopDomain validation prevents SSRF and secret disclosure attacks
  - **HMAC Verification**: Cryptographic verification of callback authenticity from Shopify
  - **Input Sanitization**: Shop domain sanitized and validated on both initiation and callback
  - **Single-use States**: States deleted after use with 10-minute expiry and automatic cleanup
  - **Origin Validation**: postMessage uses specific origin instead of wildcard
  - **Rate Limiting**: OAuth endpoints protected against abuse, plus comprehensive Shopify API rate limiting (2 req/sec with 40-request burst capacity, automatic 429 retry handling)
- **API Endpoints**: 
  - POST /api/shopify/auth - Initiate OAuth flow with secure state generation
  - GET /api/shopify/callback - Handle OAuth callback with HMAC verification
  - GET /api/shopify/status - Check connection status
  - POST /api/shopify/disconnect - Remove connection
  - GET /api/shopify/products - Fetch Shopify products
  - POST /api/shopify/sync - Sync products to Zyra database
- **Frontend Integration**: Integration card on settings page with OAuth popup flow, connection status display, and visual indicators
- **Known Limitation**: OAuth state storage uses in-memory Map (single-process). For production multi-instance deployments, migrate to Redis or Supabase table for shared state persistence.

## Deployment
Configured for VM deployment on Replit with:
- Build process: Vite frontend bundling + esbuild backend compilation
- Production server: Node.js on 0.0.0.0:5000
- Persistent schedulers: Billing tasks (6h), campaign scheduler (5min), product sync (10min)
- Always-running architecture for SaaS features and background jobs

# External Dependencies

## Database & Hosting
- **PostgreSQL**: Production database.
- **Supabase**: Provides PostgreSQL with built-in authentication.
- **Drizzle ORM**: Type-safe database queries.
- **Replit Deployment**: Full-stack hosting.

## AI & Machine Learning
- **OpenAI API**: GPT-4o mini for text generation and Vision API for image analysis.

## Payment Processing
- **Razorpay**: Indian payment gateway.
- **PayPal**: International payment gateway.

## Email & SMS Services
- **SendGrid**: Transactional emails and marketing campaigns.
- **Twilio**: SMS notifications and cart recovery.