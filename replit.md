# Overview
Zyra AI is an AI-powered Shopify SaaS application designed to enhance e-commerce operations by boosting sales, optimizing product listings, recovering abandoned carts, and automating growth. Key capabilities include AI-generated product descriptions, SEO optimization, email marketing automation, Shopify integration, and an analytics dashboard. The long-term vision is to evolve into a fully autonomous AI store manager that continuously monitors, optimizes, and learns.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The frontend uses React 18, TypeScript, Vite, shadcn/ui with Radix UI, and Wouter for routing. Styling is managed by Tailwind CSS (dark theme) with a component-based architecture. The application prioritizes accessibility (WCAG 2.1 AA compliant) and PWA capabilities.

## Technical Implementations
The backend is built with Express.js and TypeScript, providing RESTful API endpoints. Authentication uses `express-session` and Passport.js. PostgreSQL with Drizzle ORM handles type-safe database operations and migrations. Sensitive data is encrypted using AES-256-GCM.

## Feature Specifications
### AI Integration
Zyra AI utilizes a multi-model AI system (GPT-4o, GPT-4o-mini) with a centralized prompt library for various tasks including professional copywriting, product description generation, SEO optimization, and bulk product optimization, while maintaining brand voice memory. It includes premium Strategy AI (GPT-4o) with token accounting, rate limiting, and Redis-backed caching. A "Fast Mode" uses GPT-4o-mini and SSE streaming for real-time content generation, while "Quality Mode" uses a multi-agent pipeline with GPT-4o.

### SEO Health Dashboard & Google Ranking
Provides comprehensive SEO health monitoring and ranking improvement for Shopify merchants, including store health scores, issue detection, per-product SEO audits, keyword ranking tracking, schema markup generation, and AI-powered recommendations. It includes a frontend dashboard for visualization and interaction.

### SERP Competitive Intelligence
Offers real-time Google search analysis via the DataForSEO API, providing competitive insights to enhance SEO. It includes live SERP data fetching, pattern extraction from top-ranking competitors, and an AI prompt system (ZYRA GOOGLE ECOMMERCE RANKING ANALYZER) designed to generate content for outranking competitors. Features dual-mode optimization (Fast Mode vs. Competitive Intelligence) and Redis caching for cost efficiency.

### Authentication & Authorization
Uses Supabase Auth for email/password authentication, password reset, JWT-based session management, Row Level Security (RLS), RBAC for admin endpoints, and TOTP-based Two-Factor Authentication.

### Payment System
Supports PayPal-only payment processing (USD globally) with secure webhook handlers for subscription payments, including free trial auto-activation and paid plan checkout.

### Marketing Automation System
Enables real email/SMS delivery via SendGrid and Twilio for campaign scheduling, abandoned cart recovery, and performance tracking.

### Analytics & Reporting
A real-time dashboard tracks key metrics (campaigns, revenue, conversions, ROI) with PDF and CSV export. An ROI Tracking System provides end-to-end revenue attribution across various sources and integrates with Shopify sales webhooks.

### Error Tracking & Monitoring
Sentry integration provides production-grade real-time error tracking for both frontend and backend, including session replay and 5xx alerts.

### Security & Compliance
Ensures production-ready security with multi-tier rate limiting, comprehensive input sanitization (XSS, SQL injection prevention), GDPR compliance, AES-256-GCM encryption, bcrypt hashing, CORS protection (Helmet.js), and secure credential management.

### Notification System
Offers advanced multi-channel notification preferences (Email, SMS, In-App, Push) with granular control and proactive trial expiration notifications.

### Shopify Integration
Features full OAuth 2.0 integration for bidirectional product sync and store management, encompassing comprehensive OAuth scopes and robust security. GDPR-compliant webhooks ensure instant responses with asynchronous data processing.

### Automation Tools
Includes comprehensive bulk SEO optimization tools. "Smart Bulk Suggestions" analyzes product SEO, generates AI-powered fixes, and provides before/after previews with batch application. "One-Click Shopify Publish" allows publishing optimized products to Shopify individually or in bulk. Other tools include CSV Import/Export and per-product rollback.

### Upsell Email Receipts
An AI-powered post-purchase upsell system that sends personalized product recommendations after Shopify orders. Features a product recommendation engine, secure SQL operations, A/B test metrics tracking, input validation, click tracking, and conversion attribution. Includes a frontend UI for settings, custom rules, analytics, and A/B testing.

### Autonomous AI Store Manager
This system transforms manual optimization into autonomous, AI-driven processes. It includes Autonomous SEO (daily audits, AI-powered action processing, product snapshots), Dynamic Pricing AI (automates pricing based on market conditions, competitor monitoring), and Autonomous Marketing (multi-channel automation, A/B testing orchestration, cart recovery escalation). A Master Automation Control provides a global ON/OFF toggle and a Pending Approvals system for manual review.

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
- **DataForSEO API**: Real-time Google SERP data for competitive intelligence.

## Payment Processing
- **PayPal**: International payment gateway.

## Email & SMS Services
- **SendGrid**: Transactional emails and marketing campaigns.
- **Twilio**: SMS notifications and cart recovery.