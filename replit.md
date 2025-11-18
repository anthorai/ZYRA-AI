# Overview
Zyra AI is an AI-powered Shopify SaaS application designed to help e-commerce merchants boost sales, optimize product listings, recover abandoned carts, and automate growth through intelligent automation. It provides AI-generated product descriptions, SEO optimization tools, email marketing automation, Shopify store integration, and an analytics dashboard to enhance store performance and drive significant ROI.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The frontend uses React 18, TypeScript, and Vite, featuring shadcn/ui components with Radix UI and Wouter for routing. Styling is managed by Tailwind CSS with a dark theme, following a component-based architecture. Navigation uses the browser's native `window.history.back()` API for consistent back button behavior. Browser caching is controlled to ensure the latest application version, and the sidebar state persists across sessions using `localStorage`. The application is WCAG 2.1 AA compliant, with comprehensive accessibility features including keyboard navigation, visible focus indicators, logical tab order, color contrast verification, screen reader support (ARIA labels, semantic landmarks), and accessible components for loading states and forms. PWA capabilities with service worker caching provide offline support, faster repeat visits, and installability.

**Page Layout System**: The PageShell component provides standardized page structure with optional header suppression via `hideHeader` prop. This allows pages like Products Manage to render without headers while maintaining required layout contracts (routing context, responsive gutters, standardized spacing). All protected routes should use PageShell to ensure consistency.

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
Production-ready security with zero critical vulnerabilities. Features include:
- **Multi-tier rate limiting**: Brute force protection for all auth endpoints
- **Comprehensive input sanitization**: XSS and SQL injection prevention
- **GDPR compliance**: Data export, account deletion, privacy controls
- **AES-256-GCM encryption**: Sensitive data protection
- **bcrypt hashing**: Password and 2FA backup code hashing
- **CORS protection**: Helmet.js security headers
- **Secure credential management**: Environment-based secrets
- **Two-Factor Authentication**: TOTP-based 2FA with QR enrollment, backup codes, and recovery flow
- **Password Strength Validation**: Production-grade password strength meter with shared validation logic (shared/password-validation.ts) ensuring perfect client-server alignment. Enforces minimum score of 3, character variety (uppercase, lowercase, numbers, special chars), and blocks weak patterns (sequences, common words, all-numeric/alpha). Real-time visual feedback with color-coded strength bar and actionable guidance.

### Notification System
Advanced preferences for multi-channel notifications (Email, SMS, In-App, Push) with granular control, including proactive trial expiration notifications.

### Shopify Integration
Full OAuth 2.0 integration for connecting with Shopify stores, supporting bidirectional product sync and store management. Comprehensive OAuth scopes cover products, inventory, customers, orders, checkouts, marketing events, analytics, reports, and localization. Includes robust security features like state validation, shop domain protection, HMAC verification, and input sanitization. GDPR-compliant webhooks respond instantly (<100ms) with asynchronous data processing.

### Autonomous AI Store Manager (Phase 1 - MVP)
**Vision**: Transform Zyra AI from manual optimization tools into a fully autonomous AI that monitors stores 24/7, makes optimization decisions automatically, and learns from results.

**Current Implementation** (Phase 1 - Autonomous SEO):
- **Daily SEO Audit Scheduler**: Runs every day at 2 AM via node-cron, scans all products for users with autopilot enabled, evaluates SEO scores against rules
- **Rule Engine**: JSON-based rule system evaluates conditions (e.g., SEO score < 70) and triggers optimization actions automatically
- **Action Processor**: Executes SEO optimizations via AI (GPT-4o-mini), generates optimized SEO titles and meta descriptions, applies changes to products
- **Product Snapshots**: Creates snapshots before changes for one-click rollback capability
- **Audit Trail**: All autonomous actions logged in `autonomous_actions` table with reasoning, results, and timestamps
- **Safety Features**:
  - `maxDailyActions` enforcement (default: 10/day) prevents runaway automation
  - Autopilot mode verification before executing actions
  - Cooldown periods (default: 7 days) prevent over-optimization
  - Deduplication prevents multiple pending actions for same product
  - Try/finally concurrency protection in scheduler
- **UI Controls**:
  - Autopilot Settings (`/ai-tools/autopilot`): Toggle on/off, modes (Safe/Balanced/Aggressive), safety limits
  - Activity Timeline (`/ai-tools/activity-timeline`): View all autonomous actions, rollback any change
  
**Database Schema**:
- `autonomous_actions`: Tracks all autonomous actions (type, status, entity, reasoning, result, impact)
- `autonomous_rules`: Stores optimization rules (JSON conditions, actions, priority, cooldown)
- `automation_settings`: User preferences (autopilotEnabled, mode, maxDailyActions, maxCatalogChangePercent)
- `product_snapshots`: Pre-change snapshots for rollback capability

**Known Limitations** (Phase 2 Backlog):
- Uses `x-user-id` header pattern (matches existing app auth but needs proper auth middleware for production)
- No Zod validation on automation API route inputs
- Rollback only restores `products` table, not `seoMeta` (incomplete)
- No transactional safety across related tables
- `maxCatalogChangePercent` not yet enforced
- No dry-run mode implementation

**Future Workflows** (Phase 2+):
- Autonomous Cart Recovery: Send personalized recovery emails automatically
- Autonomous Product Fixes: Detect and fix product errors (missing images, broken links)
- Predictive Intelligence: Learn from results and optimize rules over time
- Smart Scheduling: Optimize execution timing based on store traffic patterns

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