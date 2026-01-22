# Overview
Zyra AI is an AI-powered Shopify SaaS application designed to enhance e-commerce operations by boosting sales, optimizing product listings, recovering abandoned carts, and automating growth. Its long-term vision is to evolve into a fully autonomous AI store manager that continuously monitors, optimizes, and learns, providing key capabilities such as AI-generated product descriptions, SEO optimization, email marketing automation, Shopify integration, and an analytics dashboard.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The frontend uses React 18, TypeScript, Vite, shadcn/ui with Radix UI, and Wouter for routing. Styling is managed by Tailwind CSS (dark theme) with a component-based architecture. The application prioritizes accessibility (WCAG 2.1 AA compliant) and PWA capabilities. Performance optimization includes TanStack Query for data management, optimistic updates, route prefetching, lazy loading, a service worker for offline support, and GPU-accelerated animations.

## Technical Implementations
The backend is built with Express.js and TypeScript, providing RESTful API endpoints. Authentication uses `express-session` and Passport.js. PostgreSQL with Drizzle ORM handles type-safe database operations. Sensitive data is encrypted using AES-256-GCM. The application is configured for VM deployment on Replit, with Vite for frontend and esbuild for backend, and supports persistent schedulers for billing, campaigns, and product syncing. Automated Drizzle Kit migrations run on startup.

## Feature Specifications
### AI Integration
Utilizes a multi-model AI system (GPT-4o, GPT-4o-mini) with a centralized prompt library for professional copywriting, product description generation, SEO optimization, and bulk product optimization, maintaining brand voice memory. It includes premium Strategy AI (GPT-4o) with token accounting, rate limiting, and Redis-backed caching. "Fast Mode" uses GPT-4o-mini with SSE streaming, while "Quality Mode" uses a multi-agent pipeline with GPT-4o.

### SEO & Competitive Intelligence
Provides a comprehensive SEO Health Dashboard for monitoring and improving Shopify store SEO, including store health scores, issue detection, per-product audits, keyword ranking, schema markup generation, and AI recommendations. SERP Competitive Intelligence offers real-time Google search analysis via DataForSEO API, extracting patterns from top-ranking competitors and using an AI prompt system (ZYRA GOOGLE ECOMMERCE RANKING ANALYZER) to generate content for competitive advantage.

### Power Mode
Premium competitive intelligence feature accessible from AI Tools menu at `/automation/power-mode`. Uses real-time Google SERP analysis (DataForSEO) combined with GPT-4o AI to analyze top-ranking competitors and generate optimized product content. Features include:
- **Real-time SERP Analysis**: Fetches and analyzes top 10 Google search results for target keywords
- **Competitor Insights**: Extracts title patterns, keyword gaps, and content opportunities from competitors
- **AI-Powered Optimization**: GPT-4o generates optimized title, meta title, meta description, and product description
- **Confidence/Difficulty Scoring**: Assesses optimization success likelihood and competitor strength
- **Credit System**: 5 credits per analysis with server-side credit checking via `checkAIToolCredits`/`consumeAIToolCredits`
- **Rollback Support**: All changes saved to `product_history` table for instant rollback
- **Manual Approval Required**: Users must review and approve all optimizations before applying

### Authentication & Authorization
Uses Supabase Auth for email/password authentication, password reset, JWT-based session management, Row Level Security (RLS), RBAC for admin endpoints, and TOTP-based Two-Factor Authentication.

### Payment System
Supports PayPal-only payment processing (USD globally) with secure webhook handlers for subscription payments, including free trial auto-activation and paid plan checkout.

### Trial Welcome System
Automatically activates a 7-day free trial on user signup with daily welcome dialog reminders, managing trial state and displaying contextual messages.

### Marketing Automation System
Enables real email/SMS delivery via SendGrid and Twilio for campaign scheduling, abandoned cart recovery, and performance tracking.

### Email Template Builder
Enterprise-grade drag-and-drop email template editor with 3-panel layout (blocks, preview, properties). Features include:
- **Block Types**: Logo, Heading, Text, Image, Button (table-based), Divider, Spacer, Columns - all with professional email-safe rendering
- **Undo/Redo**: 50-state history stack with keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y), proper history seeding on template load
- **Version History**: Full version control with restore capability via dialog and API integration
- **Send Test Email**: Email validation with SendGrid integration for production, simulation mode for development
- **HTML Export**: Auto-download generated email-safe HTML with inline CSS and CAN-SPAM compliant footer
- **Brand Settings**: Customizable primary/secondary colors, background, text color, font family, and footer text
- **Desktop/Mobile Preview**: Email client simulation with responsive preview modes

### Analytics & Reporting
A real-time dashboard tracks key metrics with PDF and CSV export, including an ROI Tracking System for end-to-end revenue attribution across various sources, integrating with Shopify sales webhooks.

### Error Tracking & Monitoring
Sentry integration provides production-grade real-time error tracking for both frontend and backend, including session replay and 5xx alerts.

### Security & Compliance
Ensures production-ready security with multi-tier rate limiting, input sanitization (XSS, SQL injection prevention), GDPR compliance, AES-256-GCM encryption, bcrypt hashing, CORS protection (Helmet.js), and secure credential management.

### Notification System
Offers advanced multi-channel notification preferences (Email, SMS, In-App, Push) with granular control and proactive trial expiration notifications.

### Shopify Integration
Features full OAuth 2.0 integration for bidirectional product sync and store management, encompassing comprehensive OAuth scopes and robust security. GDPR-compliant webhooks ensure instant responses with asynchronous data processing. The connection flow uses a shared ConnectionProgressCard component (`client/src/components/ui/connection-progress-card.tsx`) with 5-step visual progress (Initializing, Authenticating, Verifying, Syncing, Complete), consistent UX across both manual connects and App Store installations, and comprehensive error handling with specific error codes for Shopify review compliance.

### Automation Tools
Includes comprehensive bulk SEO optimization tools like "Smart Bulk Suggestions" (AI-powered fixes with previews) and "One-Click Shopify Publish" with per-product rollback.

### Upsell Email Receipts
An AI-powered post-purchase upsell system sending personalized product recommendations after Shopify orders, featuring a product recommendation engine and conversion attribution.

### Autonomous AI Store Manager
This system transforms manual optimization into autonomous, AI-driven processes, including Autonomous SEO (daily audits, AI-powered action processing), Dynamic Pricing AI, and Autonomous Marketing (multi-channel automation, cart recovery escalation). A Master Automation Control provides a global ON/OFF toggle and a Pending Approvals system.

### Revenue Loop System
Autonomous revenue optimization using the DETECT→DECIDE→EXECUTE→PROVE→LEARN cycle. The system continuously monitors products for optimization opportunities, automatically applies AI-powered improvements, and tracks revenue impact without manual intervention.

## System Design Choices
The application uses two storage implementations: `MemStorage` (in-memory for general data like billing/dashboard operations) and `DatabaseStorage` (PostgreSQL-backed for persistent data like bulk optimization jobs). Bulk optimization jobs specifically use `DatabaseStorage` to ensure job persistence across server restarts.

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
- **Twilio**: SMS notifications and cart recovery. Merchants can connect their own Twilio accounts, with credentials securely stored and validated.