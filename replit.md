# Overview

Zyra is an AI-powered Shopify SaaS application designed to help e-commerce merchants boost sales, optimize product listings, recover abandoned carts, and automate growth through intelligent automation. It provides AI-generated product descriptions, SEO optimization tools, email marketing automation, Shopify store integration, and an analytics dashboard to enhance store performance and drive significant ROI.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
The client-side uses React 18, TypeScript, and Vite, featuring shadcn/ui components with Radix UI, Wouter for routing, and TanStack Query for server state. Styling is managed by Tailwind CSS with a dark theme, following a component-based architecture.

## Backend
The server uses Express.js with TypeScript, providing RESTful API endpoints. Authentication is session-based via express-session and Passport.js (local strategy with bcrypt).

## Database
PostgreSQL with Drizzle ORM is used for type-safe operations. The schema includes tables for users, products, SEO metadata, marketing campaigns, and analytics. Drizzle Kit manages migrations.

## AI Integration

### Zyra Pro Mode System
**Architecture:** Centralized AI prompt library (`shared/ai-system-prompts.ts`) that transforms all AI outputs from basic text generation to expert-level, conversion-optimized content. Every AI tool uses the ZYRA_PRO_MODE_PROMPT system instruction.

**Core Principles:**
- Professional, expert, confident tone in all outputs
- Conversion-focused (drives action, not just information)
- SEO-optimized with natural keyword flow
- Human-quality (never robotic or generic)
- Production-ready (instantly usable for business)
- Tool-specific adaptations (Blog ≠ Caption ≠ Product)

**Quality Standards Enforced:**
- Unique, insight-rich content (no fluff or repetition)
- Clear formatting (headings, bullets, short paragraphs)
- Strategic emotional triggers and persuasion techniques
- Banned phrases filtering (corporate jargon, clichés)
- Power words library for high-impact copy

**Tool-Specific Prompts (11 variations):**
1. **Professional Copywriting** - Multi-agent pipeline with frameworks
2. **Product Descriptions** - Persuasive, benefit-driven, conversion-optimized
3. **SEO Titles & Meta** - Search-optimized, click-worthy, keyword-rich
4. **Image Alt-Text** - Accessible, SEO-friendly, descriptive
5. **Email Marketing** - Personalized, engaging, high-converting
6. **Blog Content** - Long-form SEO-rich, informative, structured
7. **Social Captions** - Scroll-stopping, emotional, CTA-focused
8. **Ad Copy** - Creative, bold, emotionally triggering, concise
9. **Video Scripts** - Cinematic, engaging, emotional storytelling
10. **Analyzer Agent** - Market & audience analysis for multi-agent pipeline
11. **Copywriter/Critic Agents** - Content generation and quality refinement

### Core AI Features
OpenAI GPT-4o mini powers all content generation with Zyra Pro Mode:

- **Professional Copywriting System**: Multi-agent pipeline (Analyzer → Copywriter → Critic) with 5 industry frameworks (AIDA, PAS, BAB, 4Ps, FAB), 6 psychological triggers (scarcity, social proof, authority, urgency, reciprocity, loss aversion), and 6 industry-specific templates (Fashion, Tech, Health, Home, Luxury, Beauty). Generates 3 A/B variants (emotional, logical, hybrid) with comprehensive quality scoring across conversion potential, SEO, readability, emotional impact, and clarity. **Uses Pro Mode multi-agent prompts.**

- **Product Description Generation**: AI-powered descriptions with brand voice consistency. **Uses Pro Mode persuasive, benefit-driven prompt.**

- **Automated SEO Optimization**: Keyword-rich titles and meta descriptions. **Uses Pro Mode search-optimized, click-worthy prompt.**

- **Image Alt-Text Generation**: Vision API for accessibility and SEO. **Uses Pro Mode accessible, SEO-friendly prompt.**

- **Bulk Product Optimization**: Process 20-100+ products efficiently with Pro Mode quality

- **Brand Voice Memory**: Maintains consistent tone across all content, enhanced by Pro Mode standards

- **Token Accounting & Rate Limiting**: Cost control and usage tracking

## Authentication & Authorization
Supabase Auth provides email/password login, password reset, and JWT-based session management. It includes frontend route protection and backend middleware for API endpoint security.

## State Management
Client-side state uses TanStack Query for server state caching, React Hook Form with Zod for validation, and React Context for global state.

## Payment System
A multi-gateway payment system supports Razorpay (India) and PayPal (International). Webhook handlers for both gateways include signature verification, idempotency checks, database updates, and error logging.

## Marketing Automation System
Real email/SMS delivery using SendGrid and Twilio. A campaign scheduler runs every 5 minutes to process scheduled sends. Features include campaign templates, abandoned cart recovery, secure email open tracking, and performance tracking with open/click/conversion rates.

## Analytics & Reporting
Real-time analytics dashboard tracks campaigns, revenue, conversions, and ROI. Export capabilities include PDF reports and CSV data exports. Tracks abandoned cart recovery rates and potential revenue.

## Error Tracking & Monitoring
A production-ready error logging system uses an `ErrorLogger` utility for centralized logging to a `error_logs` table, non-blocking asynchronous database writes, and a global error middleware. Admin endpoints allow for monitoring and managing error logs.

## Security & Compliance
Includes multi-tier rate limiting, comprehensive input sanitization using `express-validator`, GDPR compliance with data export/deletion endpoints, and dedicated privacy and terms pages.

## Notification System
An advanced notification preference system allows granular control over multi-channel notifications (Email, SMS, In-App, Push) across various categories. Features include preset modes, frequency management, visual quiet hours builder, and four-tier priority filtering.

## Shopify Integration
A fully functional OAuth 2.0 integration system connects Zyra with Shopify stores. Features include:
- **OAuth Flow**: Secure authorization using Shopify's OAuth 2.0 with comprehensive security hardening
- **Product Sync**: Bidirectional sync of products between Shopify and Zyra
- **Store Management**: Connection status tracking, disconnect functionality, and store metadata storage
- **Security Features**:
  - **State Validation**: 256-bit secure random state tokens using crypto.randomBytes
  - **Shop Domain Protection**: Stored shopDomain validation prevents SSRF and secret disclosure attacks
  - **HMAC Verification**: Cryptographic verification of callback authenticity from Shopify
  - **Input Sanitization**: Shop domain sanitized and validated on both initiation and callback
  - **Single-use States**: States deleted after use with 10-minute expiry and automatic cleanup
  - **Origin Validation**: postMessage uses specific origin instead of wildcard
  - **Rate Limiting**: OAuth endpoints protected against abuse
- **API Endpoints**: 
  - POST /api/shopify/auth - Initiate OAuth flow with secure state generation
  - GET /api/shopify/callback - Handle OAuth callback with HMAC verification
  - GET /api/shopify/status - Check connection status
  - POST /api/shopify/disconnect - Remove connection
  - GET /api/shopify/products - Fetch Shopify products
  - POST /api/shopify/sync - Sync products to Zyra database
- **Frontend Integration**: Integration card on settings page with OAuth popup flow, connection status display, and visual indicators
- **Known Limitation**: OAuth state storage uses in-memory Map (single-process). For production multi-instance deployments, migrate to Redis or Supabase table for shared state persistence.

# External Dependencies

## Database & Hosting
- **PostgreSQL**: Production database.
- **Supabase**: Provides PostgreSQL with built-in authentication.
- **Drizzle ORM**: Type-safe database queries.
- **Replit Deployment**: Full-stack hosting.

## AI & Machine Learning
- **OpenAI API**: GPT-4o mini for text generation and Vision API for image analysis.

## Payment Processing
- **Razorpay**: Indian payment gateway.
- **PayPal**: International payment gateway.

## Email & SMS Services
- **SendGrid**: Transactional emails and marketing campaigns.
- **Twilio**: SMS notifications and cart recovery.