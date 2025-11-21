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

## Payment Processing
- **PayPal**: International payment gateway.

## Email & SMS Services
- **SendGrid**: Transactional emails and marketing campaigns.
- **Twilio**: SMS notifications and cart recovery.