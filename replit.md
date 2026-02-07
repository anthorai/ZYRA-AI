# Overview
Zyra AI is an AI-powered Shopify SaaS application designed to revolutionize e-commerce operations. Its core purpose is to boost sales, optimize product listings, recover abandoned carts, and automate growth for online stores. The long-term vision is to create a fully autonomous AI store manager that continuously monitors, optimizes, and learns from e-commerce data. Zyra AI focuses on identifying and eliminating "revenue friction" throughout the buyer journey using AI-driven capabilities such as product description generation, SEO optimization, email marketing automation, Shopify integration, and a comprehensive analytics dashboard.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The frontend is built with React 18, TypeScript, Vite, shadcn/ui (Radix UI), and Wouter for routing, utilizing Tailwind CSS for a dark-themed, component-based design. It prioritizes accessibility (WCAG 2.1 AA compliant) and PWA capabilities, with performance optimizations like TanStack Query, optimistic updates, route prefetching, lazy loading, a service worker for offline support, and GPU-accelerated animations.

## Technical Implementations
The backend uses Express.js with TypeScript, providing RESTful APIs. Authentication is handled by `express-session` and Passport.js. PostgreSQL with Drizzle ORM ensures type-safe database operations. Sensitive data is encrypted with AES-256-GCM. The application is designed for VM deployment on Replit, using Vite for the frontend and esbuild for the backend, and includes persistent schedulers for background tasks. Automated Drizzle Kit migrations run on startup.

## Feature Specifications
### AI Integration
A multi-model AI system (GPT-4o, GPT-4o-mini) with a centralized prompt library handles professional copywriting, product description generation, SEO optimization, and bulk product optimization while maintaining brand voice. It includes a premium Strategy AI (GPT-4o) with token accounting, rate limiting, and Redis caching. "Fast Mode" uses GPT-4o-mini with SSE streaming, while "Quality Mode" employs a multi-agent pipeline with GPT-4o.

### SEO & Competitive Intelligence
Features an SEO Health Dashboard for monitoring and improving Shopify store SEO, offering store health scores, issue detection, per-product audits, keyword ranking, schema markup generation, and AI recommendations. SERP Competitive Intelligence leverages the DataForSEO API for real-time Google search analysis to inform content strategies.

### Authentication & Authorization
Uses Supabase Auth for email/password authentication, password reset, JWT-based sessions, Row Level Security (RLS), RBAC for admin endpoints, and TOTP-based Two-Factor Authentication.

### Payment System
Supports PayPal for subscription payments, including free trial auto-activation and paid plan checkout, with secure webhook handlers.

### Marketing Automation System
ZYRA functions as an autonomous marketing engine, identifying and addressing revenue actions like abandoned cart recovery and post-purchase upsells, requiring user approval rather than user-created campaigns. Email/SMS delivery via SendGrid and Twilio automates recovery messages and upsell notifications with performance tracking.

### Email Template Builder
An enterprise-grade drag-and-drop email editor provides various block types, undo/redo, full version control, test email functionality, HTML export with inline CSS, customizable brand settings, and desktop/mobile previews.

### Analytics & Reporting
A real-time dashboard tracks key metrics with PDF/CSV export and an ROI Tracking System for end-to-end revenue attribution, integrating with Shopify sales webhooks.

### Error Tracking & Monitoring
Sentry integration provides production-grade real-time error tracking for both frontend and backend, including session replay and 5xx alerts.

### Security & Compliance
Ensures production-ready security with multi-tier rate limiting, input sanitization, GDPR compliance, AES-256-GCM encryption, bcrypt hashing, CORS protection (Helmet.js), and secure credential management.

### Notification System
Offers advanced multi-channel notification preferences (Email, SMS, In-App, Push) with granular control and proactive trial expiration notifications.

### Shopify Integration
Features full OAuth 2.0 integration for bidirectional product sync and store management, encompassing comprehensive OAuth scopes and robust security. GDPR-compliant webhooks ensure instant responses with asynchronous data processing. The connection flow uses a shared `ConnectionProgressCard` component with a 5-step visual progress and comprehensive error handling.

### Autonomous AI Store Manager
This system transforms manual optimization into autonomous, AI-driven processes, including Autonomous SEO (daily audits, AI-powered action processing), Dynamic Pricing AI, and Autonomous Marketing (multi-channel automation, cart recovery escalation). A Master Automation Control provides a global ON/OFF toggle and a Pending Approvals system.

### Revenue Loop System
Autonomous revenue optimization using the DETECT→DECIDE→EXECUTE→PROVE→LEARN cycle, continuously monitoring products for optimization opportunities, applying AI-powered improvements, and tracking revenue impact.

### Revenue Friction Detection System
ZYRA detects and removes "revenue friction" (e.g., `view_no_cart`, `cart_no_checkout`, `checkout_drop`, `purchase_no_upsell`) by identifying issues from performance data, abandoned carts, and order analysis, using a scoring formula to prioritize opportunities.

### Revenue Immune System
ZYRA's core revenue protection feature operates silently 24/7, detecting and fixing issues like content decay, SEO erosion, and copy fatigue before they impact sales. It displays "Prevented Revenue," offers ACTIVE/PAUSED status toggle, sensitivity controls, and ensures all changes are reversible and logged.

### ZYRA Detection Engine (3-Layer Architecture)
A high-performance engine ensures ≤10s response time for revenue opportunity detection using a three-layer architecture: Background Precomputation Worker, Fast Detect, and Deep Detect. The PROVE phase is event-driven, using an `interimProofEvents` database table and Shopify webhooks for real-time attribution.

### Credit Consumption System
A plan-aware credit consumption system where credits represent AI thinking depth, SERP analysis, execution complexity, and learning costs. Monthly credits vary by plan, and credit cost multipliers are applied based on action type, plan, SERP usage, and autonomy. The system includes "soft nudges" for low credit situations and backend enforcement with credit checks before execution and a 5% credit reserve.

### Real Learning System
ZYRA captures real learning from every optimization to improve future recommendations. It includes baseline snapshots, records optimization changes, measures impact over 14 days, extracts patterns (power words, title structures), and stores them in a `Learned Patterns Table` with success rates and confidence scores.

### Live Activity Log (SSE Streaming)
Real-time activity streaming using Server-Sent Events (SSE) to show ZYRA engine activities as they happen, featuring an SSE endpoint, event emitter system, frontend hook for streaming with authorization, exponential backoff reconnection, 50-event history per user, connection status indicators, and an 8-step progress bar driven by SSE events (DETECT, DECIDE, EXECUTE, PROVE, LEARN).

### Dynamic Recommendation Reasoning
Context-specific "Why ZYRA recommends this" explanations are generated dynamically based on product name, health score, store situation, and completed actions, providing personalized descriptions, reasons, and expected impacts.

### ZYRA Master Loop System
The production-level autonomous optimization engine operates on a strict DETECT→DECIDE→EXECUTE→PROVE→LEARN cycle. Key components include a Store Situation Detector, Plan Permission Mapper, Master Action Registry, Priority Sequencing Engine, KPI Monitor, and Master Loop Controller.

### Action Deduplication Guard System
The `ActionDeduplicationGuard` enforces 10 core rules to prevent wasteful duplicate AI actions, ensuring unique actions, cooldowns, material change detection for unlocking, sequential execution, and transparency logging.

## System Design Choices
The application uses two storage implementations: `MemStorage` (in-memory for general data like billing/dashboard operations) and `DatabaseStorage` (PostgreSQL-backed for persistent data like bulk optimization jobs). Bulk optimization jobs specifically use `DatabaseStorage` to ensure job persistence across server restarts.

# External Dependencies

## Database & Hosting
-   **PostgreSQL**: Production database.
-   **Supabase**: PostgreSQL and authentication services.
-   **Drizzle ORM**: Type-safe database queries.

## AI & Machine Learning
-   **OpenAI API**: GPT-4o, GPT-4o-mini (text generation), Vision API (image analysis).
-   **Upstash Redis**: Serverless Redis for AI response caching.

## SEO & Analytics
-   **DataForSEO API**: Real-time Google SERP data for competitive intelligence.

## Payment Processing
-   **PayPal**: International payment gateway.

## Email & SMS Services
-   **SendGrid**: Transactional emails and marketing campaigns.
-   **Twilio**: SMS notifications and cart recovery.