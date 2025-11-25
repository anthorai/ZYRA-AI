# Overview
Zyra AI is an AI-powered Shopify SaaS application designed to empower e-commerce merchants by boosting sales, optimizing product listings, recovering abandoned carts, and automating growth. Its core capabilities include AI-generated product descriptions, SEO optimization, email marketing automation, Shopify integration, and an analytics dashboard. The long-term vision is to evolve into a fully autonomous AI store manager that continuously monitors, optimizes, and learns.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The frontend uses React 18, TypeScript, Vite, shadcn/ui with Radix UI, and Wouter for routing. Styling is managed by Tailwind CSS (dark theme) with a component-based architecture. The application prioritizes accessibility (WCAG 2.1 AA compliant) and PWA capabilities.

## Technical Implementations
The backend is built with Express.js and TypeScript, providing RESTful API endpoints. Authentication uses `express-session` and Passport.js. PostgreSQL with Drizzle ORM handles type-safe database operations and migrations. Sensitive data is encrypted using AES-256-GCM.

## Feature Specifications
### AI Integration
Zyra AI utilizes a multi-model AI system (GPT-4o, GPT-4o-mini) with a centralized prompt library for professional copywriting, product description generation, SEO optimization, image alt-text generation, and bulk product optimization, maintaining brand voice memory. It includes premium Strategy AI (GPT-4o) with token accounting, rate limiting, and Redis-backed caching. A "Fast Mode" for copywriting uses GPT-4o-mini and SSE streaming for real-time content generation, significantly reducing generation time compared to the "Quality Mode" which uses a multi-agent pipeline with GPT-4o.

### SEO Health Dashboard & Google Ranking (COMPLETE)
Comprehensive SEO health monitoring and ranking improvement system for Shopify merchants:

**Backend Features (server/lib/seo-health-service.ts):**
- **Store Health Score**: Aggregates SEO metrics across all products (meta, content, technical, schema categories)
- **Issue Detection**: Identifies critical issues (missing meta titles/descriptions), warnings (short content, missing alt text), and suggestions
- **Product SEO Audit**: Per-product scoring with detailed issue breakdown and field-level recommendations
- **Keyword Rankings**: Tracks keyword positions extracted from SEO history with trend analysis
- **Schema Markup Generation**: Creates Product schema (JSON-LD) for rich snippets in Google search
- **Recommendations Engine**: Prioritized quick wins, improvements, and advanced optimization suggestions

**API Endpoints (7 new routes in server/routes.ts):**
- `GET /api/seo-health/score` - Overall store SEO health score with category breakdown
- `GET /api/seo-health/issues` - Prioritized list of SEO issues to fix
- `GET /api/seo-health/audit` - All products SEO audit results
- `GET /api/seo-health/audit/:productId` - Single product detailed audit
- `GET /api/seo-health/keywords` - Keyword ranking tracking
- `GET /api/seo-health/schema` - Product schema markup generation
- `GET /api/seo-health/recommendations` - AI-generated improvement suggestions

**Frontend UI (client/src/pages/seo-health-dashboard.tsx):**
- **Overview Tab**: Health score gauge, category scores, quick wins, top issues
- **Issues Tab**: Full issue list with severity badges, impact descriptions, fix suggestions
- **Product Audit Tab**: Per-product scores with SEO status badges and optimize buttons
- **Keywords Tab**: Keyword ranking table with position changes, search volume, difficulty
- **Schema Tab**: JSON-LD preview with validation status and missing field indicators

**Route**: `/seo-health` (protected, requires authentication)

### SERP Competitive Intelligence (COMPLETE - Backend + Frontend)
Real-time Google search analysis powered by DataForSEO API provides competitive intelligence for SEO optimization. The system is fully integrated into the Product SEO Engine with dual-mode optimization:

**Backend Features:**
- **Live SERP Data**: Fetches top 10 Google organic results for any keyword via DataForSEO API
- **Pattern Extraction**: Analyzes title structures, meta descriptions, keyword clusters, and emotional triggers from top-ranking competitors
- **ZYRA GOOGLE ECOMMERCE RANKING ANALYZER**: Enhanced AI prompt system that generates content designed to outrank competitors using real SERP patterns
- **Redis Caching**: 7-day TTL reduces API costs by 60% (cached results are free, fresh searches cost $0.005)
- **Keyword Clustering**: Extracts primary, secondary, long-tail, and LSI keywords from competitor pages
- **Value Tracking**: Calculates dollar value delivered to merchants ($500-$2,000/month in equivalent SEO tools)
- **ROI Optimization**: 99.7% profit margin for SaaS owner (costs $0.005 per search, charges 10 credits worth ~$0.50)

**Frontend UI Features:**
- **Dual-Mode Selector**: Interactive toggle between Fast Mode (10 credits, 2-3 sec) and Competitive Intelligence (30 credits, 5-8 sec)
- **Competitor Insights Card**: Real-time display of top 5 competitor domains, winning title patterns, keyword opportunities, and common product features
- **Loading States**: Separate loading indicators for SERP analysis and AI generation
- **Error Handling**: Automatic graceful fallback from competitive mode to fast mode if SERP analysis fails
- **Responsive Design**: Mode selector cards and insights display adapt to desktop and mobile viewports
- **Credit System**: Fast Mode (10 credits, AI-only), Competitive Intelligence (30 credits including 10 for SERP + 20 for enhanced AI)

### Authentication & Authorization
Supabase Auth provides email/password, password reset, JWT-based session management, Row Level Security (RLS), RBAC for admin endpoints, and TOTP-based Two-Factor Authentication.

### Payment System
The system supports PayPal-only payment processing (USD globally) with secure webhook handlers for subscription payments, including free trial auto-activation and paid plan checkout.

### Marketing Automation System
Real email/SMS delivery via SendGrid and Twilio enables campaign scheduling, abandoned cart recovery, and performance tracking.

### Analytics & Reporting
A real-time dashboard tracks key metrics (campaigns, revenue, conversions, ROI) with PDF and CSV export. An ROI Tracking System provides end-to-end revenue attribution across various sources (cart recovery, email/SMS campaigns, AI optimization) with a full audit trail, displayed through an API and frontend components. It includes conversion tracking and lift attribution for optimized products, integrating with Shopify sales webhooks.

### Error Tracking & Monitoring
Sentry integration provides production-grade real-time error tracking for both frontend and backend, including session replay and 5xx alerts, while protecting sensitive data.

### Security & Compliance
The system ensures production-ready security with multi-tier rate limiting, comprehensive input sanitization (XSS, SQL injection prevention), GDPR compliance, AES-256-GCM encryption, bcrypt hashing, CORS protection (Helmet.js), and secure credential management.

### Notification System
Advanced multi-channel notification preferences (Email, SMS, In-App, Push) offer granular control, including proactive trial expiration notifications.

### Shopify Integration
Full OAuth 2.0 integration enables bidirectional product sync and store management, covering comprehensive OAuth scopes and robust security. GDPR-compliant webhooks ensure instant responses with asynchronous data processing.

### Automation Tools (COMPLETE)
Comprehensive bulk SEO optimization tools for efficient store management:

**Smart Bulk Suggestions (client/src/pages/automation/smart-bulk-suggestions.tsx):**
- **Product Analysis**: Fetches products via /api/seo-health/audit with SEO scores, issue counts, and improvement potential
- **AI Suggestion Generator**: Uses /api/generate-product-seo to create actionable fixes for selected low-performing products
- **Before/After Preview**: Side-by-side comparison of current vs AI-suggested SEO fields (title, description, keywords, score)
- **Apply/Apply All**: Individual or batch application of fixes via PATCH /api/products/:id/seo
- **Tab-Based Workflow**: Analyze (select products) → Suggestions (review AI fixes) → Applied (track completed optimizations)
- **Data Persistence**: Updates seoMeta table (seoTitle, optimizedTitle, metaDescription, optimizedMeta, keywords) and productSeoHistory for tracking

**API Endpoint (PATCH /api/products/:id/seo):**
- Normalizes keywords (accepts array or comma-separated string)
- Updates both seoMeta and productSeoHistory tables
- Marks products as optimized
- Records AI-generated seoScore for analytics

**Other Automation Tools:**
- CSV Import/Export for bulk data operations
- One-Click Shopify Publish for live store updates
- Per-product Rollback to revert changes

### Autonomous AI Store Manager
This system transforms manual optimization into autonomous, AI-driven processes across multiple domains, offering both autonomous and manual approval modes.

- **Autonomous SEO**: Daily SEO Audit Scheduler, JSON-based Rule Engine, AI-powered Action Processor, Product Snapshots for rollback, Audit Trail, and safety features.
- **Dynamic Pricing AI**: Automates pricing based on competitor monitoring, profit optimization, and market conditions. Database schema and 13 API endpoints are complete, with planned features including a competitor scraper, product matching, pricing rules engine, and UI.
- **Autonomous Marketing**: Multi-channel marketing automation with A/B Testing Orchestration, Cart Recovery Escalation, Safety Guardrails (frequency caps, quiet hours, GDPR consent), and Performance Analytics.
- **Master Automation Control (MVP Complete)**: Global ON/OFF toggle for autonomous operations versus manual approval. A Pending Approvals system stores AI recommendations for manual review, with an Approval Executor for consistent action processing. Safety Guardrails perform preflight validation.

## System Design Choices
The application is configured for VM deployment on Replit, with Vite for frontend and esbuild for backend. It supports persistent schedulers for billing, campaigns, and product syncing. Automated Drizzle Kit migrations run on startup. Performance is optimized with extensive database indexes, Upstash Redis caching for AI responses, and frontend optimizations.

# External Dependencies

## Database & Hosting
- **PostgreSQL**: Production database.
- **Supabase**: PostgreSQL and authentication services.
- **Drizzle ORM**: Type-safe database queries.
- **Deployment Options**: Replit VM, Vercel.

## AI & Machine Learning
- **OpenAI API**: GPT-4o mini (text generation), Vision API (image analysis).
- **Upstash Redis**: Serverless Redis for AI response caching.

## SEO & Analytics
- **DataForSEO API**: Real-time Google SERP data for competitive intelligence ($0.005 per search).

## Payment Processing
- **PayPal**: International payment gateway.

## Email & SMS Services
- **SendGrid**: Transactional emails and marketing campaigns.
- **Twilio**: SMS notifications and cart recovery.