# Overview
Zyra AI is an AI-powered Shopify SaaS application designed to empower e-commerce merchants. Its core purpose is to boost sales, optimize product listings, recover abandoned carts, and automate growth. Key capabilities include AI-generated product descriptions, SEO optimization, email marketing automation, Shopify integration, and an analytics dashboard, all aimed at enhancing store performance and driving significant ROI. The long-term vision is to evolve into a fully autonomous AI store manager that monitors, optimizes, and learns continuously.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The frontend leverages React 18, TypeScript, and Vite, utilizing shadcn/ui components with Radix UI and Wouter for routing. Styling is managed by Tailwind CSS with a dark theme and a component-based architecture. The application prioritizes accessibility (WCAG 2.1 AA compliant) with features like keyboard navigation, screen reader support, and PWA capabilities for offline support and installability. A standardized PageShell component ensures consistent page layouts and routing context.

## Technical Implementations
The backend is built with Express.js and TypeScript, providing RESTful API endpoints. Authentication uses `express-session` and Passport.js. PostgreSQL with Drizzle ORM handles type-safe database operations, with Drizzle Kit managing migrations. Sensitive data is encrypted using AES-256-GCM.

## Feature Specifications
### AI Integration
Zyra AI uses a multi-model AI system (GPT-4o, GPT-4o-mini) with a centralized prompt library for professional copywriting, product description generation, SEO optimization, image alt-text generation, and bulk product optimization, maintaining brand voice memory. It includes premium Strategy AI (GPT-4o) with token accounting, rate limiting, and Redis-backed caching.

### Authentication & Authorization
Supabase Auth provides email/password, password reset, and JWT-based session management. It features application-level Row Level Security (RLS), RBAC for admin endpoints, perfect payment data isolation, and TOTP-based Two-Factor Authentication with backup codes and password strength validation.

### Payment System
The system supports PayPal-only payment processing (USD globally) with secure webhook handlers for subscription payments, including free trial auto-activation, paid plan checkout, and credit initialization. It supports multiple subscription plans.

### Marketing Automation System
Real email/SMS delivery is provided via SendGrid and Twilio, enabling campaign scheduling, abandoned cart recovery, and performance tracking.

### Analytics & Reporting
A real-time dashboard tracks key metrics such as campaigns, revenue, conversions, and ROI, with PDF and CSV export capabilities.

### Error Tracking & Monitoring
Sentry integration provides production-grade real-time error tracking for both frontend and backend, including session replay, 5xx alerts, and a `/health` endpoint, all while protecting sensitive data.

### Security & Compliance
The system ensures production-ready security with multi-tier rate limiting for auth endpoints, comprehensive input sanitization (XSS, SQL injection prevention), GDPR compliance (data export, account deletion), AES-256-GCM encryption, bcrypt hashing for passwords and 2FA codes, CORS protection (Helmet.js), and secure credential management.

### Notification System
Advanced multi-channel notification preferences (Email, SMS, In-App, Push) offer granular control, including proactive trial expiration notifications.

### Shopify Integration
Full OAuth 2.0 integration allows bidirectional product sync and store management. It covers comprehensive OAuth scopes (products, inventory, customers, orders, checkouts, marketing, analytics, reports, localization) and robust security (state validation, HMAC verification, input sanitization). GDPR-compliant webhooks ensure instant (<100ms) responses with asynchronous data processing.

### Autonomous AI Store Manager
This system transforms manual optimization into autonomous, AI-driven processes across multiple domains.

- **Phase 1 - Autonomous SEO**: Daily SEO Audit Scheduler (node-cron), JSON-based Rule Engine, Action Processor using AI (GPT-4o-mini), Product Snapshots for one-click rollback, Audit Trail, safety features (maxDailyActions, autopilot verification, cooldowns, deduplication), Autopilot Settings UI, and Activity Timeline.

- **Phase 2 - Production Hardening**: Critical security enhancements (Bearer tokens, Zod validation, complete rollback, maxCatalogChangePercent enforcement), Dry-Run Mode, Transactional Safety, daily Morning Report Emails, enhanced Activity Timeline with 7-day metrics and charts.

- **Phase 3 - Dynamic Pricing AI**: Database schema complete (competitor_products, pricing_rules, price_changes, pricing_snapshots, pricing_settings). 13 secure API endpoints for competitor management, pricing rules, history, rollback, settings, and analytics. Reuses existing autonomous infrastructure. Next steps: competitor price scraper, product matching algorithm, pricing rules engine, scheduler, action processor, and UI. Safety features planned: min/max price bounds, daily change limits, cooldowns, dry-run mode, approval workflows.

- **Phase 4 - Autonomous Marketing**: Complete multi-channel marketing automation with A/B Testing Orchestration (3-way variant split, statistical significance testing, automatic winner promotion), Cart Recovery Escalation (4-stage sequences with email→SMS channel progression), Safety Guardrails (per-channel frequency caps 3/day + 5/week, timezone-aware quiet hours 9 AM-9 PM, GDPR consent validation, unsubscribe checking), Performance Analytics (real-time metrics with Redis caching), and Marketing UI Dashboard with autopilot toggle.

- **Phase 5 - Master Automation Control (LATEST)**: Complete global control system for autonomous operations.
  - **Master Toggle**: Global ON/OFF switch (globalAutopilotEnabled) in automation_settings table. When ON: AI operates autonomously. When OFF: AI creates recommendations requiring manual approval.
  - **Pending Approvals System**: New pending_approvals table stores AI recommendations (actionType, recommendedAction JSONB, aiReasoning, priority, estimatedImpact, status). Approval Queue Page displays recommendations grouped by type (SEO, Marketing, Cart Recovery, Pricing) with approve/reject actions.
  - **Approval Executor**: Executes approved actions via approval-executor.ts module. Routes recommendations to appropriate handlers (SEO optimization, campaign sends, cart recovery, price adjustments). Logs approved actions to autonomous_actions with approvalMode='manual' metadata.
  - **API Endpoints**: GET /api/pending-approvals (list), POST /api/pending-approvals/:id/approve (execute), POST /api/pending-approvals/:id/reject (decline). PUT /api/automation/settings (update globalAutopilotEnabled).
  - **UI Integration**: Master toggle in dashboard header (green=Autonomous, gray=Manual) with confirmation dialog. Pending Approvals page at /pending-approvals with tabs filtering, priority badges, AI reasoning display, estimated impact metrics.
  - **Safety**: All existing safety features (frequency caps, quiet hours, GDPR) remain active in both modes. Manual mode adds additional oversight layer for users wanting more control.

### Dynamic Pricing AI (In Progress)
This feature aims to automate pricing decisions based on competitor monitoring, profit optimization, and market conditions. The database schema (competitor_products, pricing_rules, price_changes, pricing_snapshots, pricing_settings) and 13 secure API endpoints for competitor management, pricing rules, history, rollback, settings, and analytics are complete. It reuses existing autonomous infrastructure components (rule engine, scheduler, action processor, rollback system) and extends the `autonomous_actions` table. Next steps involve building a competitor price scraper, product matching algorithm, pricing rules engine, scheduler, action processor, and UI. Safety features like min/max price bounds, daily change limits, cooldowns, dry-run mode, and approval workflows are planned.

## System Design Choices
The application is configured for VM deployment on Replit, with Vite for frontend and esbuild for backend. It supports persistent schedulers for billing, campaigns, and product syncing. Automated Drizzle Kit migrations run on startup, creating all necessary tables. Performance is optimized with 95+ database indexes, Upstash Redis caching for AI responses, and frontend optimizations like code splitting, response compression, and static asset caching.

# External Dependencies

## Database & Hosting
- **PostgreSQL**: Production database.
- **Supabase**: PostgreSQL and authentication services.
- **Drizzle ORM**: Type-safe database queries.
- **Deployment Options**: Replit VM (development/testing), Vercel (production serverless).

## AI & Machine Learning
- **OpenAI API**: GPT-4o mini (text generation), Vision API (image analysis).
- **Upstash Redis**: Serverless Redis for AI response caching.

## Payment Processing
- **PayPal**: International payment gateway.

## Email & SMS Services
- **SendGrid**: Transactional emails and marketing campaigns.
- **Twilio**: SMS notifications and cart recovery.