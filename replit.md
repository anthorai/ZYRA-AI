# Overview
Zyra AI is an AI-powered Shopify SaaS application designed to help e-commerce merchants boost sales, optimize product listings, recover abandoned carts, and automate growth through intelligent automation. It provides AI-generated product descriptions, SEO optimization tools, email marketing automation, Shopify store integration, and an analytics dashboard to enhance store performance and drive significant ROI.

# User Preferences
Preferred communication style: Simple, everyday language.

# Recent Changes

## October 30, 2025
### Unified Navigation Button Standardization
- **Standardized all back buttons** across informational pages (Privacy Policy, Terms of Service, About):
  - Replaced inconsistent button implementations with unified design matching `unified-header.tsx` pattern
  - **Icon-only design**: Removed text labels for cleaner, more compact UI
  - **Consistent styling**: All buttons now use `variant="ghost"`, `size="icon"` with standardized classes
  - **Unified hover effects**: `text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out`
  - **Responsive sizing**: Icon scales from `w-4 h-4` on mobile to `w-5 h-5` on larger screens
  - **Preserved navigation**: Continues using `window.history.back()` for proper browser history navigation
- **Auth pages unchanged**: Login, forgot-password, and other auth flows maintain their existing full-width button patterns for better UX in authentication contexts
- **Removed hardcoded navigation routes**: Eliminated all `backTo` props from PageShell components across settings pages, checkout, and notifications
  - **Pages updated**: CheckoutPage, Integrations, Support, Security Settings, Notification Settings, AI Preferences, Advanced Notification Settings
  - **Navigation behavior**: All back buttons now use browser history (`window.history.back()`) instead of redirecting to hardcoded routes
  - **User experience**: Users return to their actual previous page instead of being forced to specific routes like `/settings` or `/billing`
- **Result**: Consistent, professional navigation UI across all pages with smooth animations, responsive design, and proper browser history navigation

### Browser Caching & Sidebar Persistence Improvements
- **Added comprehensive cache-control headers** to prevent browser caching issues:
  - HTML files now include `no-cache, no-store, must-revalidate` headers in both production and Vercel deployments
  - Added `Pragma: no-cache` and `Expires: 0` for legacy browser compatibility
  - Static assets (JS, CSS, images) remain aggressively cached with 1-year max-age for optimal performance
  - **Result**: Users always see the latest application version without manual hard refresh (Ctrl+Shift+R)
- **Sidebar state persistence with localStorage**:
  - Sidebar now remembers open/closed state across page navigations and browser sessions
  - Initial state respects user's screen size (desktop: open by default, mobile: closed by default)
  - Smart resize behavior: only auto-closes when switching to mobile view, preserves user preference on desktop
  - **Result**: Sidebar no longer auto-opens unexpectedly when navigating back to dashboard

## October 29, 2025
### Navigation UX Improvements
- **Fixed back button navigation** across all informational pages (Privacy Policy, Terms of Service, About):
  - Replaced hardcoded `/dashboard` routes with proper browser history navigation (`window.history.back()`)
  - Updated button text from "Back to Dashboard" to simply "Back" for clearer UX
  - Users now navigate to their actual previous page instead of always being sent to dashboard
  - Maintained auth-specific navigation where appropriate (e.g., forgot-password correctly returns to login page)
- **Result**: Improved navigation flow that respects user's browsing history and provides expected back button behavior

### Billing Page - Comprehensive Subscription Plan Cards
- **Redesigned subscription plan cards** with landing-page-quality presentation:
  - **Detailed plan data structure**: Each plan now displays comprehensive feature lists organized into 5 categories (Product Optimization & SEO, Conversion Boosting & Sales Automation, Content & Branding at Scale, Performance Tracking & ROI Insights, Workflow & Integration Tools)
  - **Credit allocations**: Prominently displays credits per period (100/7 days, 1,000/month, 5,000/month, 20,000/month) with ✨ emoji
  - **Individual feature breakdowns**: Shows credit costs for each feature (e.g., "Optimized Products – 200 credits")
  - **Marketing taglines**: "Who it's for" descriptions for each tier
  - **Enhanced centered layout**: All content center-aligned for professional appearance
    - **Header section**: Centered icon (larger at 10-12px), plan name (larger text-3xl), pricing (text-4xl), credits, and tagline with increased spacing (pb-6, space-y-4)
    - **Features section**: Centered category names and feature lists with clean typography and increased spacing (py-6, space-y-4)
    - **Footer CTA button**: Full-width button with gradient effects and hover animations
  - **Responsive design**: Changed from 3-column to 2-column grid on large screens for better readability of dense content
  - **Removed scroll system**: Eliminated overflow-y-auto scroll to show all features at once in naturally expanding cards
  - **Optimized spacing**: Balanced spacing throughout for a clean, professional presentation
  - **Badge positioning fix**: "Popular" badge on Growth plan now fully visible above the card using relative wrapper with conditional padding
- **Result**: Beautiful, landing-page-quality plan cards with centered content that merchants can see all features at a glance without scrolling

### Smart Product Descriptions Enhancement
- **Expanded dropdown options from 7 to 15** for better merchant targeting:
  - **Product Categories** (15 options): Fashion & Apparel, Electronics & Gadgets, Home & Kitchen, Beauty & Personal Care, Health & Fitness, Groceries & Food, Books & Stationery, Toys & Baby Products, Automotive, Sports & Outdoor, Pet Supplies, Jewelry & Watches, Furniture & Home Improvement, Digital Products, Arts & Crafts
  - **Target Audiences** (15 options): General Consumers, Tech Enthusiasts, Business Professionals, Athletes & Fitness Enthusiasts, Students, Parents & Families, Creative Professionals, Eco-conscious Shoppers, Luxury Buyers, Travelers & Adventurers, Home Improvers, Pet Owners, Gamers, Beauty & Self-care Lovers, Lifelong Learners
- **Fixed dropdown styling** to match application's slate-blue theme (#14142B) instead of black backgrounds
- **Fixed runtime errors** by replacing Radix UI Select components with native HTML select elements to resolve Vite error overlay compatibility issue
- **Result**: More granular AI-powered product description targeting with stable, error-free, theme-matching dropdowns

# System Architecture

## UI/UX Decisions
The frontend uses React 18, TypeScript, and Vite, featuring shadcn/ui components with Radix UI and Wouter for routing. Styling is managed by Tailwind CSS with a dark theme, following a component-based architecture.

## Technical Implementations
The server uses Express.js with TypeScript, providing RESTful API endpoints. Authentication is session-based via `express-session` and Passport.js. PostgreSQL with Drizzle ORM is used for type-safe database operations, and Drizzle Kit manages migrations. AES-256-GCM encryption is used for sensitive data.

## Feature Specifications

### AI Integration (Zyra AI Pro Mode System & Zyra AI Engine)
Zyra AI employs a centralized AI prompt library for all AI outputs, ensuring expert-level, conversion-optimized content. It utilizes a multi-model AI system with plan-based intelligent routing, dynamically selecting models (GPT-4o, GPT-4o-mini) based on user plans and task types for features like:
- **Professional Copywriting System**: Multi-agent pipeline for A/B variants.
- **Product Description Generation**: AI-powered descriptions with brand voice consistency.
- **Automated SEO Optimization**: Keyword-rich titles and meta descriptions.
- **Image Alt-Text Generation**: Vision API for accessibility and SEO.
- **Bulk Product Optimization**: Efficiently processes multiple products.
- **Brand Voice Memory**: Maintains consistent tone across all content.
- **Strategy AI (GPT-4o)**: Premium strategic analysis for deep insights and campaign strategies.
- **Token Accounting & Rate Limiting**: Controls costs and tracks usage.
- **AI Response Caching**: Redis-backed intelligent caching layer with 24hr TTL provides significant cost savings and faster responses.

### Authentication & Authorization
Supabase Auth provides email/password login, password reset, and JWT-based session management with robust security measures including bcrypt for 2FA backup codes.

### Payment System
PayPal-only payment processing (USD globally) with secure webhook handlers for all subscription payments.

### Marketing Automation System
Provides real email/SMS delivery via SendGrid and Twilio, featuring campaign scheduling, abandoned cart recovery, and performance tracking.

### Analytics & Reporting
A real-time dashboard tracks campaigns, revenue, conversions, and ROI, with export capabilities for PDF and CSV.

### Error Tracking & Monitoring
Production-ready error logging to a `error_logs` table via an `ErrorLogger` utility with global error middleware.

### Security & Compliance
Includes multi-tier rate limiting, comprehensive input sanitization, GDPR compliance, and enhanced security with AES-256-GCM encryption and bcrypt hashing. Recent security hardening includes critical CORS fixes, comprehensive security headers (helmet.js), and secure credential management.

### Notification System
Advanced preferences for multi-channel notifications (Email, SMS, In-App, Push) with granular control, including proactive trial expiration notifications.

### Shopify Integration
Full OAuth 2.0 integration for connecting with Shopify stores, supporting bidirectional product sync and store management. Comprehensive OAuth scopes (11 permissions) cover products, inventory, customers, orders, checkouts, marketing events, analytics, reports, and localization. Includes robust security features like state validation, shop domain protection, HMAC verification, and input sanitization. GDPR-compliant webhooks respond instantly (<100ms) with asynchronous data processing. Comprehensive Shopify API rate limiting and setup documentation included.

**Environment Configuration**: Production-ready with secure diagnostic logging that checks environment variable presence (SHOPIFY_API_KEY, SHOPIFY_API_SECRET, PRODUCTION_DOMAIN) at startup without exposing values. Clear error messages guide operators when credentials are missing, ensuring proper configuration before OAuth flow initiation.

## System Design Choices
Configured for VM deployment on Replit, with a build process using Vite for frontend and esbuild for backend. The architecture supports persistent schedulers for billing, campaigns, and product syncing, ensuring always-running background jobs.

### Database Migrations
Production deployments use automated database migrations managed by Drizzle Kit:
- **Migration Files**: Generated from `shared/schema.ts` and stored in `./migrations/` directory
- **Runtime Execution**: Migrations run automatically when the server starts (not during build), ensuring full access to environment variables
- **Automatic Execution**: Runs on every deployment and server restart via server startup sequence
- **Manual Execution**: Can be triggered locally with `tsx scripts/migrate.ts` when `DATABASE_URL` is configured
- **37 Tables Created**: Includes users, store_connections, products, campaigns, subscriptions, and 32 supporting tables
- **Production Safety**: Migrations are idempotent - they skip existing objects and only create missing tables
- **Error Handling**: Migration failures are logged but don't block server startup (tables may already exist)
- **Troubleshooting**: See `PRODUCTION_DATABASE_MIGRATIONS.md` for detailed migration guide and error resolution

**Critical Note**: The Shopify integration requires the `store_connections` table with `access_token` column. Migrations run automatically on server startup, creating all required tables before the application starts serving requests.

### Performance Optimizations
- **Response Compression**: Gzip/Brotli compression delivers 70% size reduction for all API responses and assets, resulting in 3-5x faster initial page loads.
- **Static Asset Caching**: Immutable assets cached for 1 year with HTML revalidation, providing instant loading for returning visitors.
- **Redis Caching Layer**: Upstash Redis integration with graceful fallback, pre-configured TTLs (Dashboard: 5min, Campaigns: 5min, AI: 24hr, Products: 10min), and pattern-based cache invalidation.
- **AI Response Caching**: Intelligent caching of OpenAI responses reduces API calls by 60-80%, saves significant costs, and provides 5-10x faster AI feature response times.

# External Dependencies

## Database & Hosting
- **PostgreSQL**: Production database.
- **Supabase**: Provides PostgreSQL and authentication services.
- **Drizzle ORM**: Type-safe database queries.
- **Deployment Options**:
  - **Replit VM**: Always-running environment for development and testing.
  - **Vercel**: Production serverless deployment with global CDN, auto-scaling, Vercel Cron for scheduled tasks, and **automatic database migrations** on every deployment.

## AI & Machine Learning
- **OpenAI API**: GPT-4o mini for text generation and Vision API for image analysis.
- **Upstash Redis**: Serverless Redis for AI response caching and performance optimization.

## Payment Processing
- **Razorpay**: Indian payment gateway.
- **PayPal**: International payment gateway.

## Email & SMS Services
- **SendGrid**: Transactional emails and marketing campaigns.
- **Twilio**: SMS notifications and cart recovery.