# Overview
Zyra AI is an AI-powered Shopify SaaS application designed to enhance e-commerce operations by boosting sales, optimizing product listings, recovering abandoned carts, and automating growth. Its long-term vision is to evolve into a fully autonomous AI store manager that continuously monitors, optimizes, and learns, providing key capabilities such as AI-generated product descriptions, SEO optimization, email marketing automation, Shopify integration, and an analytics dashboard. The system focuses on detecting and removing "revenue friction" across the buyer journey.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The frontend uses React 18, TypeScript, Vite, shadcn/ui with Radix UI, and Wouter for routing. Styling is managed by Tailwind CSS (dark theme) with a component-based architecture. The application prioritizes accessibility (WCAG 2.1 AA compliant) and PWA capabilities. Performance optimization includes TanStack Query, optimistic updates, route prefetching, lazy loading, a service worker for offline support, and GPU-accelerated animations.

## Technical Implementations
The backend is built with Express.js and TypeScript, providing RESTful API endpoints. Authentication uses `express-session` and Passport.js. PostgreSQL with Drizzle ORM handles type-safe database operations. Sensitive data is encrypted using AES-256-GCM. The application is configured for VM deployment on Replit, with Vite for frontend and esbuild for backend, and supports persistent schedulers for various background tasks. Automated Drizzle Kit migrations run on startup.

## Feature Specifications
### AI Integration
Utilizes a multi-model AI system (GPT-4o, GPT-4o-mini) with a centralized prompt library for professional copywriting, product description generation, SEO optimization, and bulk product optimization, maintaining brand voice memory. It includes premium Strategy AI (GPT-4o) with token accounting, rate limiting, and Redis-backed caching. "Fast Mode" uses GPT-4o-mini with SSE streaming, while "Quality Mode" uses a multi-agent pipeline with GPT-4o.

### SEO & Competitive Intelligence
Provides a comprehensive SEO Health Dashboard for monitoring and improving Shopify store SEO, including store health scores, issue detection, per-product audits, keyword ranking, schema markup generation, and AI recommendations. SERP Competitive Intelligence offers real-time Google search analysis via DataForSEO API, extracting patterns from top-ranking competitors and using an AI prompt system to generate content for competitive advantage.

### Authentication & Authorization
Uses Supabase Auth for email/password authentication, password reset, JWT-based session management, Row Level Security (RLS), RBAC for admin endpoints, and TOTP-based Two-Factor Authentication.

### Payment System
Supports PayPal-only payment processing (USD globally) with secure webhook handlers for subscription payments, including free trial auto-activation and paid plan checkout.

### Trial Welcome System
Automatically activates a 7-day free trial on user signup with daily welcome dialog reminders, managing trial state and displaying contextual messages.

### Marketing Automation System
ZYRA operates as an autonomous marketing brain, presenting marketing functionality (abandoned cart recovery, post-purchase upsells, follow-ups) as AI-detected revenue actions requiring user approval, rather than user-created campaigns. Email/SMS delivery via SendGrid and Twilio enables automated recovery messages and upsell notifications with full performance tracking.

### Email Template Builder
Enterprise-grade drag-and-drop email template editor with features like various block types (Logo, Heading, Text, Image, Button, Divider, Spacer, Columns), undo/redo functionality (50-state history stack), full version control with restore capability, send test email functionality (SendGrid integration), HTML export with inline CSS, customizable brand settings (colors, fonts), and desktop/mobile preview modes.

### Analytics & Reporting
A real-time dashboard tracks key metrics with PDF and CSV export, including an ROI Tracking System for end-to-end revenue attribution across various sources, integrating with Shopify sales webhooks.

### Error Tracking & Monitoring
Sentry integration provides production-grade real-time error tracking for both frontend and backend, including session replay and 5xx alerts.

### Security & Compliance
Ensures production-ready security with multi-tier rate limiting, input sanitization (XSS, SQL injection prevention), GDPR compliance, AES-256-GCM encryption, bcrypt hashing, CORS protection (Helmet.js), and secure credential management.

### Notification System
Offers advanced multi-channel notification preferences (Email, SMS, In-App, Push) with granular control and proactive trial expiration notifications.

### Shopify Integration
Features full OAuth 2.0 integration for bidirectional product sync and store management, encompassing comprehensive OAuth scopes and robust security. GDPR-compliant webhooks ensure instant responses with asynchronous data processing. The connection flow uses a shared `ConnectionProgressCard` component with a 5-step visual progress and comprehensive error handling.

### Automation Tools
Includes comprehensive bulk SEO optimization tools like "Smart Bulk Suggestions" (AI-powered fixes with previews) and "One-Click Shopify Publish" with per-product rollback.

### Upsell Email Receipts
An AI-powered post-purchase upsell system sending personalized product recommendations after Shopify orders, featuring a product recommendation engine and conversion attribution.

### Autonomous AI Store Manager
This system transforms manual optimization into autonomous, AI-driven processes, including Autonomous SEO (daily audits, AI-powered action processing), Dynamic Pricing AI, and Autonomous Marketing (multi-channel automation, cart recovery escalation). A Master Automation Control provides a global ON/OFF toggle and a Pending Approvals system.

### Revenue Loop System
Autonomous revenue optimization using the DETECT→DECIDE→EXECUTE→PROVE→LEARN cycle. The system continuously monitors products for optimization opportunities, automatically applies AI-powered improvements, and tracks revenue impact.

### Revenue Friction Detection System
ZYRA detects and removes "revenue friction" – moments where buyer intent exists but a sale doesn't happen. It identifies four friction types: `view_no_cart`, `cart_no_checkout`, `checkout_drop`, and `purchase_no_upsell`. A detection engine identifies friction from performance data, abandoned carts, and order analysis, using a scoring formula (`Priority = Expected_Recovery × Confidence × (1/Risk)`) to prioritize opportunities.

### Next Move Feature
The "Next Move" feature is ZYRA's single authoritative revenue decision interface, surfacing one high-priority action at a time. A decision engine scores all revenue opportunities (`NextMoveScore = (Expected_Revenue_Impact × Confidence_Score) ÷ Risk_Level`) and selects the highest-scoring one. Execution rules are plan-based (Starter+, Growth, Scale) determining whether actions require approval or can run automatically. API endpoints manage fetching, approving, executing, and rolling back actions. The frontend displays the action, reason, expected revenue, confidence, and risk level, with real-time status updates.

### ZYRA Detection Engine (3-Layer Architecture)
This high-performance engine ensures ≤10s response time for revenue opportunity detection using a three-layer architecture:
1.  **Background Precomputation Worker**: Runs on schedule and data changes, precomputes product funnel stats, friction scores, and revenue signals, and pre-builds execution payloads.
2.  **Fast Detect**: Hard 10-second timeout, reads only from precomputed cache, and returns detection phases (`detect_started`, `cache_loaded`, `friction_identified`, `decision_ready`).
3.  **Deep Detect**: An async worker for optional accuracy improvements, triggered by stale cache or low confidence scores, but does not block Fast Detect.
The PROVE phase is event-driven, using `interimProofEvents` database table and Shopify webhooks for real-time attribution. The frontend integrates with detection status polling and displays progress.

### Credit Consumption System
A plan-aware credit consumption system where credits represent AI thinking depth, SERP analysis, execution complexity, and learning costs. Monthly credits vary by plan, and credit cost multipliers are applied based on action type, plan, SERP usage, and autonomy. The system includes "soft nudges" for low credit situations and backend enforcement with credit checks before execution and a 5% credit reserve.

## System Design Choices
The application uses two storage implementations: `MemStorage` (in-memory for general data like billing/dashboard operations) and `DatabaseStorage` (PostgreSQL-backed for persistent data like bulk optimization jobs). Bulk optimization jobs specifically use `DatabaseStorage` to ensure job persistence across server restarts.

# External Dependencies

## Database & Hosting
-   **PostgreSQL**: Production database.
-   **Supabase**: PostgreSQL and authentication services.
-   **Drizzle ORM**: Type-safe database queries.
-   **Deployment Options**: Replit VM, Vercel.

## AI & Machine Learning
-   **OpenAI API**: GPT-4o mini (text generation), Vision API (image analysis).
-   **Upstash Redis**: Serverless Redis for AI response caching.

## SEO & Analytics
-   **DataForSEO API**: Real-time Google SERP data for competitive intelligence.

## Payment Processing
-   **PayPal**: International payment gateway.

## Email & SMS Services
-   **SendGrid**: Transactional emails and marketing campaigns.
-   **Twilio**: SMS notifications and cart recovery.

# Recent Changes

## January 26, 2026 - New Store Foundational Actions
- **Rule**: For NEW STORES (age < 30 days OR orders < 50), DETECT must NEVER return "no action"
- **Implementation**: Added Foundational Action System with 4 action types:
  - `seo_basics`: "Improve Discoverability" - Optimize titles and descriptions
  - `product_copy_clarity`: "Clarify Product Value" - Refine copy for buyer confidence
  - `trust_signals`: "Build Buyer Confidence" - Add policies, badges, social proof
  - `recovery_setup`: "Prepare Revenue Safety Net" - Enable cart recovery
- **Selection Logic**: Based on product health score (< 30: SEO, 30-60: Copy, 60+: Trust)
- **Triple-Layer Guarantee**:
  1. `selectFoundationalAction()` always returns valid action (try-catch with fallback)
  2. API endpoints add hard fallback if action is still missing
  3. UI shows hardcoded fallback if foundationalAction is undefined
- **Files Changed**: `shared/schema.ts`, `server/lib/fast-detection-engine.ts`, `server/routes.ts`, `client/src/components/dashboard/zyra-at-work.tsx`

## January 26, 2026 - Finding Friction Detection Fix
- **Issue**: "Finding Friction Step 1" was stuck and detection wasn't progressing
- **Root Cause**: 
  1. Detection only triggered when user toggled autopilot ON, not when page loaded with autopilot already enabled
  2. When cache was missing, detection returned without properly marking as complete, causing UI to stay stuck
- **Fix Applied**:
  1. Added auto-trigger in `zyra-at-work.tsx` to start detection when page loads with autopilot enabled
  2. Fixed `fast-detection-engine.ts` to properly emit both 'preparing' and 'decision_ready' phases with complete=true when cache is missing
  3. This ensures the UI properly shows the "Collecting baseline data" message and stops the progress spinner