# Overview

Zyra is an AI-powered Shopify SaaS application designed to help e-commerce merchants boost sales, optimize product listings, recover abandoned carts, and automate growth through intelligent automation. It provides AI-generated product descriptions, SEO optimization tools, email marketing automation, Shopify store integration, and an analytics dashboard to enhance store performance and drive significant ROI.

**Production Status:** ✅ Ready for deployment (as of October 19, 2025)  
**Documentation:** See `PRODUCTION_DEPLOYMENT_GUIDE.md` for complete deployment instructions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The frontend uses React 18, TypeScript, and Vite, featuring shadcn/ui components with Radix UI and Wouter for routing. Styling is managed by Tailwind CSS with a dark theme, following a component-based architecture.

## Technical Implementations
The server uses Express.js with TypeScript, providing RESTful API endpoints. Authentication is session-based via `express-session` and Passport.js (local strategy with bcrypt). PostgreSQL with Drizzle ORM is used for type-safe database operations, and Drizzle Kit manages migrations. AES-256-GCM encryption is used for sensitive data.

## Feature Specifications

### AI Integration (Zyra Pro Mode System & Zyra Engine)
Zyra employs a centralized AI prompt library (`shared/ai-system-prompts.ts`) for all AI outputs, ensuring expert-level, conversion-optimized content with a professional tone, SEO optimization, and human-quality. It utilizes a multi-model AI system with plan-based intelligent routing, dynamically selecting models (GPT-4o, GPT-4o-mini) based on user plans and task types for core features like:
- **Professional Copywriting System**: Multi-agent pipeline (Analyzer → Copywriter → Critic) using industry frameworks and psychological triggers to generate A/B variants.
- **Product Description Generation**: AI-powered descriptions with brand voice consistency.
- **Automated SEO Optimization**: Keyword-rich titles and meta descriptions.
- **Image Alt-Text Generation**: Vision API for accessibility and SEO.
- **Bulk Product Optimization**: Efficiently processes multiple products with high quality.
- **Brand Voice Memory**: Maintains consistent tone across all content.
- **Strategy AI (GPT-4o)**: Premium strategic analysis for deep insights and campaign strategies with data-driven recommendations.
- **Token Accounting & Rate Limiting**: Controls costs and tracks usage.

### Authentication & Authorization
Supabase Auth provides email/password login, password reset, and JWT-based session management with robust security measures including bcrypt for 2FA backup codes.

### Payment System
A multi-gateway payment system supports Razorpay and PayPal, with secure webhook handlers.

### Marketing Automation System
Provides real email/SMS delivery via SendGrid and Twilio, featuring campaign scheduling, abandoned cart recovery, and performance tracking.

### Analytics & Reporting
A real-time dashboard tracks campaigns, revenue, conversions, and ROI, with export capabilities for PDF and CSV.

### Error Tracking & Monitoring
Production-ready error logging to a `error_logs` table via an `ErrorLogger` utility with global error middleware.

### Security & Compliance
Includes multi-tier rate limiting, comprehensive input sanitization, GDPR compliance, and enhanced security with AES-256-GCM encryption and bcrypt hashing. Recent security hardening includes critical CORS fixes, comprehensive security headers (helmet.js), and secure credential management via Replit Integrations.

### Notification System
Advanced preferences for multi-channel notifications (Email, SMS, In-App, Push) with granular control, including proactive trial expiration notifications.

### Shopify Integration
Full OAuth 2.0 integration for connecting with Shopify stores, supporting bidirectional product sync and store management. Includes robust security features like state validation, shop domain protection, HMAC verification, and input sanitization, along with comprehensive Shopify API rate limiting.

## System Design Choices
Configured for VM deployment on Replit, with a build process using Vite for frontend and esbuild for backend. The architecture supports persistent schedulers for billing, campaigns, and product syncing, ensuring always-running background jobs.

# External Dependencies

## Database & Hosting
- **PostgreSQL**: Production database.
- **Supabase**: Provides PostgreSQL and authentication services.
- **Drizzle ORM**: Type-safe database queries.
- **Replit Deployment**: Full-stack hosting environment.

## AI & Machine Learning
- **OpenAI API**: GPT-4o mini for text generation and Vision API for image analysis.

## Payment Processing
- **Razorpay**: Indian payment gateway.
- **PayPal**: International payment gateway.

## Email & SMS Services
- **SendGrid**: Transactional emails and marketing campaigns.
- **Twilio**: SMS notifications and cart recovery.