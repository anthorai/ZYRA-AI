# Overview
Zyra AI is an AI-powered Shopify SaaS application designed to enhance e-commerce operations by boosting sales, optimizing product listings, recovering abandoned carts, and automating growth. Its long-term vision is to evolve into a fully autonomous AI store manager that continuously monitors, optimizes, and learns. The system focuses on detecting and removing "revenue friction" across the buyer journey through capabilities such as AI-generated product descriptions, SEO optimization, email marketing automation, Shopify integration, and an analytics dashboard.

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

### Marketing Automation System
ZYRA operates as an autonomous marketing brain, presenting marketing functionality (abandoned cart recovery, post-purchase upsells, follow-ups) as AI-detected revenue actions requiring user approval, rather than user-created campaigns. Email/SMS delivery via SendGrid and Twilio enables automated recovery messages and upsell notifications with full performance tracking.

### Email Template Builder
Enterprise-grade drag-and-drop email template editor with features like various block types (Logo, Heading, Text, Image, Button, Divider, Spacer, Columns), undo/redo functionality, full version control with restore capability, send test email functionality, HTML export with inline CSS, customizable brand settings, and desktop/mobile preview modes.

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

### Change Control Dashboard (Category Tabs)
The Change Control Dashboard now features 5 category tabs for organized action management:
1. **Discoverability & SEO** - Comparison table view with columns: Action, Product, Unoptimized, Optimized, Status. Supports multi-select with Push Selected/Rollback Selected bulk actions.
2. **Conversion Optimization** - Card-based before/after view with individual Push to Shopify and Rollback buttons.
3. **Revenue Recovery** - Status cards showing Enabled/Disabled state with Enable/Disable controls and expected revenue recovery estimates.
4. **Revenue Protection** - Warning-badged cards with one-click Rollback and Freeze buttons for underperforming changes.
5. **Learning & Intelligence** - Read-only status cards (no action buttons) showing Store Conversion Pattern Learning and Performance Baseline Update with "Used internally to improve future decisions" tooltip.

### Autonomous AI Store Manager
This system transforms manual optimization into autonomous, AI-driven processes, including Autonomous SEO (daily audits, AI-powered action processing), Dynamic Pricing AI, and Autonomous Marketing (multi-channel automation, cart recovery escalation). A Master Automation Control provides a global ON/OFF toggle and a Pending Approvals system.

### Revenue Loop System
Autonomous revenue optimization using the DETECT→DECIDE→EXECUTE→PROVE→LEARN cycle. The system continuously monitors products for optimization opportunities, automatically applies AI-powered improvements, and tracks revenue impact.

### Revenue Friction Detection System
ZYRA detects and removes "revenue friction" – moments where buyer intent exists but a sale doesn't happen. It identifies four friction types: `view_no_cart`, `cart_no_checkout`, `checkout_drop`, and `purchase_no_upsell`. A detection engine identifies friction from performance data, abandoned carts, and order analysis, using a scoring formula to prioritize opportunities.

### Revenue Immune System
The Revenue Immune System is ZYRA's core revenue protection feature that operates silently in the background like a store's immune system. Unlike the previous suggestion-based "Next Move" feature, this system:
- Displays a single truth metric: "Prevented Revenue" - the estimated value of revenue loss that ZYRA prevented this month
- Provides ACTIVE/PAUSED status toggle to enable/disable autonomous protection
- Offers sensitivity controls (Conservative/Balanced/Aggressive) mapped to automation settings
- Operates silently 24/7 detecting and fixing issues (content decay, SEO erosion, copy fatigue) before they impact sales
- All changes are reversible and logged for transparency
- Backend calculates prevented revenue from `revenue_loop_proof` table entries with status 'proven' or 'positive'
- API endpoint: `/api/revenue-immune/status` provides current protection status and metrics

### ZYRA Detection Engine (3-Layer Architecture)
This high-performance engine ensures ≤10s response time for revenue opportunity detection using a three-layer architecture:
1.  **Background Precomputation Worker**: Runs on schedule and data changes, precomputes product funnel stats, friction scores, and revenue signals, and pre-builds execution payloads.
2.  **Fast Detect**: Hard 10-second timeout, reads only from precomputed cache, and returns detection phases.
3.  **Deep Detect**: An async worker for optional accuracy improvements, triggered by stale cache or low confidence scores, but does not block Fast Detect.
The PROVE phase is event-driven, using `interimProofEvents` database table and Shopify webhooks for real-time attribution. The frontend integrates with detection status polling and displays progress.

### Credit Consumption System
A plan-aware credit consumption system where credits represent AI thinking depth, SERP analysis, execution complexity, and learning costs. Monthly credits vary by plan, and credit cost multipliers are applied based on action type, plan, SERP usage, and autonomy. The system includes "soft nudges" for low credit situations and backend enforcement with credit checks before execution and a 5% credit reserve.

### Live Activity Log (SSE Streaming)
Real-time activity streaming using Server-Sent Events (SSE) to show ZYRA engine activities as they happen. Features include:
- SSE endpoint at `/api/zyra/activity-stream` with persistent connections and 15-second heartbeat
- Event emitter system (`zyraEventEmitter`) tracking detection phases (DETECT, DECIDE, EXECUTE, PROVE, LEARN)
- Frontend hook (`useZyraActivityStream`) using fetch API with streaming for Authorization header support
- Exponential backoff reconnection on both errors and normal stream closure
- 50-event history per user for replay on reconnection
- Connection status indicators ("Live", "Connecting...", "Reconnecting...")
- **8-step progress bar driven by SSE events** - Progress stages advance based on real detection phase events, not timers
- Phase-to-stage mapping: DETECT (stages 1-4), DECIDE (stage 5), EXECUTE (stage 6), PROVE (stage 7), LEARN (stage 8)
- Fallback auto-advance only activates when SSE is not connected

### Dynamic Recommendation Reasoning
Context-specific "Why ZYRA recommends this" explanations generated dynamically based on:
- Actual product name and health score
- Store situation (total products count)
- Completed actions count for template rotation
- Multiple template variations per action type for variety
The `generateDynamicReasoning` method in `FastDetectionEngine` provides personalized descriptions, reasons, and expected impacts instead of static generic text.

### ZYRA Master Loop System (Production-Level Autonomous Engine)
The Master Loop is the production-level autonomous optimization engine that operates on a strict DETECT→DECIDE→EXECUTE→PROVE→LEARN cycle. Located in `server/lib/zyra-master-loop/`.

**Core Components:**
1. **Store Situation Detector** - Classifies stores as NEW_FRESH/MEDIUM_GROWING/ENTERPRISE_SCALE based on age, orders, traffic, and revenue
2. **Plan Permission Mapper** - Maps subscription plans (STARTER/GROWTH/ENTERPRISE) to action permissions (FOUNDATION/GROWTH/GUARD) with LIMITED/FULL/ROLLBACK_ONLY access levels. **PLAN OVERRIDES STORE SITUATION** - permission levels are never reduced by situation, only extra approval requirements
3. **Master Action Registry** - 17 static actions with sub-actions organized by category (Trust Signals, Friction Copy, Product Clarity, etc.)
4. **Priority Sequencing Engine** - Orders actions by Trust→Clarity→Conversion→Revenue→SEO→Learning with lower risk and earlier funnel first
5. **KPI Monitor** - Captures baselines before execution and measures impact after 4+ hours, triggering auto-rollback when performance drops are detected
6. **Master Loop Controller** - Orchestrates the full cycle, respecting plan gates, situation, and providing full transparency

**API Endpoints** (all require authentication):
- `GET /api/master-loop/state` - Current loop state
- `POST /api/master-loop/run-cycle` - Execute one full DETECT→DECIDE→EXECUTE→PROVE→LEARN cycle
- `GET /api/master-loop/situation` - Detailed store situation analysis
- `GET /api/master-loop/permissions` - Plan-based permissions with situation effects
- `GET /api/master-loop/actions` - Available and skipped actions with reasons
- `GET /api/master-loop/activities` - Activity timeline for transparency
- `GET /api/master-loop/proof` - Loop proof metrics (cycles run, rollbacks, revenue delta)
- `POST /api/master-loop/freeze` / `POST /api/master-loop/unfreeze` - Pause/resume autonomous actions
- `POST /api/master-loop/check-impact` - Check impact of recent actions and trigger rollback if needed

**Dashboard Integration:**
- `MasterLoopPanel` component in `client/src/components/dashboard/master-loop-panel.tsx`
- React hooks in `client/src/hooks/use-master-loop.ts`
- Integrated into ZYRA at Work dashboard (`zyra-at-work.tsx`)

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