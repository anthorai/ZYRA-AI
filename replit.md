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
The Change Control Dashboard now features 5 category tabs for organized action management: Discoverability & SEO, Conversion Optimization, Revenue Recovery, Revenue Protection, and Learning & Intelligence. These tabs facilitate actions like bulk updates, individual pushes/rollbacks, enabling/disabling features, and monitoring learning insights.

### Autonomous AI Store Manager
This system transforms manual optimization into autonomous, AI-driven processes, including Autonomous SEO (daily audits, AI-powered action processing), Dynamic Pricing AI, and Autonomous Marketing (multi-channel automation, cart recovery escalation). A Master Automation Control provides a global ON/OFF toggle and a Pending Approvals system.

### Revenue Loop System
Autonomous revenue optimization using the DETECT→DECIDE→EXECUTE→PROVE→LEARN cycle. The system continuously monitors products for optimization opportunities, automatically applies AI-powered improvements, and tracks revenue impact.

### Revenue Friction Detection System
ZYRA detects and removes "revenue friction" – moments where buyer intent exists but a sale doesn't happen. It identifies four friction types: `view_no_cart`, `cart_no_checkout`, `checkout_drop`, and `purchase_no_upsell`. A detection engine identifies friction from performance data, abandoned carts, and order analysis, using a scoring formula to prioritize opportunities.

### Revenue Immune System
The Revenue Immune System is ZYRA's core revenue protection feature that operates silently in the background. It displays a "Prevented Revenue" metric, offers ACTIVE/PAUSED status toggle, sensitivity controls (Conservative/Balanced/Aggressive), and operates silently 24/7 detecting and fixing issues (content decay, SEO erosion, copy fatigue) before they impact sales. All changes are reversible and logged.

### ZYRA Detection Engine (3-Layer Architecture)
This high-performance engine ensures ≤10s response time for revenue opportunity detection using a three-layer architecture: Background Precomputation Worker, Fast Detect, and Deep Detect. The PROVE phase is event-driven, using `interimProofEvents` database table and Shopify webhooks for real-time attribution. The frontend integrates with detection status polling and displays progress.

### Credit Consumption System
A plan-aware credit consumption system where credits represent AI thinking depth, SERP analysis, execution complexity, and learning costs. Monthly credits vary by plan, and credit cost multipliers are applied based on action type, plan, SERP usage, and autonomy. The system includes "soft nudges" for low credit situations and backend enforcement with credit checks before execution and a 5% credit reserve.

**Execution Modes**: Two modes available - "Fast Mode" (GPT-4o-mini, base credits) and "Competitive Intelligence" mode (3× multiplier, includes SERP analysis). Dynamic credit costs display on action cards based on selected mode.

**Action Lock Enforcement**: The `action_locks` database table prevents duplicate credit consumption. Composite key (userId, entityType, entityId, actionType) ensures the same action cannot be applied to the same product multiple times. Lock checking in `selectFoundationalAction()` queries locked combinations and skips them when recommending actions. Locks are removed when material changes are detected (price, inventory, content edits), allowing re-optimization.

### Real Learning System
ZYRA captures real learning from every optimization to improve future recommendations. The system includes:
- **Baseline Snapshots**: Captures product metrics (views, conversions, revenue) before optimization
- **Optimization Changes**: Records exactly what was changed (old/new values, AI reasoning, patterns applied)
- **Measurement Period**: 14-day post-optimization tracking to calculate impact
- **Pattern Extraction**: Identifies what works (power words, title structures, trust signals)
- **Learned Patterns Table**: Persists patterns with success rates, confidence scores, and usage counts
- **Scheduled Processor**: Runs every 6 hours to evaluate completed measurements and extract patterns
- **API Endpoints**: `/api/mode-credits/learning-stats` and `/api/mode-credits/learned-patterns` expose insights
- **Frontend Component**: `ZyraLearningInsights` displays patterns, success rates, and revenue lift

### Live Activity Log (SSE Streaming)
Real-time activity streaming using Server-Sent Events (SSE) to show ZYRA engine activities as they happen. Features include an SSE endpoint, event emitter system, frontend hook for streaming with authorization, exponential backoff reconnection, 50-event history per user, connection status indicators, and an 8-step progress bar driven by SSE events (DETECT, DECIDE, EXECUTE, PROVE, LEARN).

### Dynamic Recommendation Reasoning
Context-specific "Why ZYRA recommends this" explanations generated dynamically based on product name, health score, store situation, completed actions count, and multiple template variations per action type. The `generateDynamicReasoning` method provides personalized descriptions, reasons, and expected impacts instead of static generic text.

### ZYRA Master Loop System (Production-Level Autonomous Engine)
The Master Loop is the production-level autonomous optimization engine that operates on a strict DETECT→DECIDE→EXECUTE→PROVE→LEARN cycle. Key components include a Store Situation Detector, Plan Permission Mapper, Master Action Registry, Priority Sequencing Engine, KPI Monitor, and Master Loop Controller. It offers various API endpoints for state management, execution, analysis, and activity tracking.

### Action Deduplication Guard System
The `ActionDeduplicationGuard` (`server/lib/action-deduplication-guard.ts`) enforces 10 core rules to prevent wasteful duplicate AI actions:
1. **Global Non-Repetition**: Same action on same product = NEVER repeated without material change
2. **Cooldown Enforcement**: Action-type-specific cooldowns (4h default, up to 24h for pattern learning)
3. **New Problem Required**: Loops detect problems but don't auto-re-execute old actions
4. **Material Change Detection**: Actions only unlock when price, inventory, or content actually changes
5. **"No Action Needed" Valid**: System prefers doing nothing over doing too much
6. **Sequential Execution**: Fix most critical issue first, lock it, then re-evaluate
7. **One Active Action Per Product**: No parallel actions on the same product
8. **Cooldown Periods**: Type-specific cooldowns (4-24h) between same action types
9. **Transparency Logging**: Every decision (allowed/blocked) logged with rule and reason
10. **User-Facing Messages**: Clear "no action needed" messaging instead of silent failures
- **API Endpoints**: `/api/master-loop/guard-stats` (decision log) and `/api/master-loop/validate-action` (pre-validation)
- **Integration Points**: MasterLoopController.runCycle(), FastDetectionEngine.selectFoundationalAction()

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