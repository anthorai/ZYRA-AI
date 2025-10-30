# Overview
Zyra AI is an AI-powered Shopify SaaS application designed to help e-commerce merchants boost sales, optimize product listings, recover abandoned carts, and automate growth through intelligent automation. It provides AI-generated product descriptions, SEO optimization tools, email marketing automation, Shopify store integration, and an analytics dashboard to enhance store performance and drive significant ROI.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The frontend uses React 18, TypeScript, and Vite, featuring shadcn/ui components with Radix UI and Wouter for routing. Styling is managed by Tailwind CSS with a dark theme, following a component-based architecture. A robust navigation tracking system ensures reliable back button functionality across all pages using `sessionStorage`. All informational page back buttons are standardized with an icon-only design, consistent styling, and responsive sizing. Browser caching is meticulously controlled to ensure users always see the latest application version, and the sidebar state persists across sessions using `localStorage`.

## Technical Implementations
The server uses Express.js with TypeScript, providing RESTful API endpoints. Authentication is session-based via `express-session` and Passport.js. PostgreSQL with Drizzle ORM is used for type-safe database operations, and Drizzle Kit manages migrations. AES-256-GCM encryption is used for sensitive data.

## Feature Specifications

### AI Integration (Zyra AI Pro Mode System & Zyra AI Engine)
Zyra AI employs a centralized AI prompt library and a multi-model AI system (GPT-4o, GPT-4o-mini) for features such as professional copywriting, product description generation, automated SEO optimization, image alt-text generation, bulk product optimization, and brand voice memory. It includes a premium Strategy AI (GPT-4o) for insights, token accounting, rate limiting, and Redis-backed AI response caching with a 24hr TTL for cost savings and faster responses.

### Authentication & Authorization
Supabase Auth provides email/password login, password reset, and JWT-based session management with bcrypt for 2FA backup codes.

### Payment System
PayPal-only payment processing (USD globally) with secure webhook handlers for subscription payments.

### Marketing Automation System
Provides real email/SMS delivery via SendGrid and Twilio, featuring campaign scheduling, abandoned cart recovery, and performance tracking.

### Analytics & Reporting
A real-time dashboard tracks campaigns, revenue, conversions, and ROI, with export capabilities for PDF and CSV.

### Error Tracking & Monitoring
Production-ready error logging to a `error_logs` table via an `ErrorLogger` utility with global error middleware.

### Security & Compliance
Includes multi-tier rate limiting, comprehensive input sanitization, GDPR compliance, enhanced security with AES-256-GCM encryption, bcrypt hashing, critical CORS fixes, comprehensive security headers (helmet.js), and secure credential management.

### Notification System
Advanced preferences for multi-channel notifications (Email, SMS, In-App, Push) with granular control, including proactive trial expiration notifications.

### Shopify Integration
Full OAuth 2.0 integration for connecting with Shopify stores, supporting bidirectional product sync and store management. Comprehensive OAuth scopes (11 permissions) cover products, inventory, customers, orders, checkouts, marketing events, analytics, reports, and localization. Includes robust security features like state validation, shop domain protection, HMAC verification, and input sanitization. GDPR-compliant webhooks respond instantly (<100ms) with asynchronous data processing. Environment configuration checks ensure proper credentials before OAuth flow initiation.

## System Design Choices
Configured for VM deployment on Replit, with a build process using Vite for frontend and esbuild for backend. The architecture supports persistent schedulers for billing, campaigns, and product syncing. Automated database migrations managed by Drizzle Kit run on server startup, creating all 37 required tables.

### Performance Optimizations
- **Response Compression**: Gzip/Brotli compression for 70% size reduction.
- **Static Asset Caching**: Immutable assets cached for 1 year.
- **Redis Caching Layer**: Upstash Redis integration with graceful fallback and pre-configured TTLs for dashboard, campaigns, AI, and products.
- **AI Response Caching**: Intelligent caching of OpenAI responses to reduce API calls and improve response times.

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