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
OpenAI GPT-5 powers core AI functionalities, including product description generation, automated SEO optimization, image alt-text generation (Vision API), bulk product optimization, and a brand voice memory system. It includes token accounting and rate limiting.

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
- **OAuth Flow**: Secure authorization using Shopify's OAuth 2.0 with state parameter validation
- **Product Sync**: Bidirectional sync of products between Shopify and Zyra
- **Store Management**: Connection status tracking, disconnect functionality, and store metadata storage
- **Security**: Token refresh handling, postMessage origin validation, and Bearer token authentication
- **API Endpoints**: 
  - POST /api/shopify/auth - Initiate OAuth flow
  - GET /api/shopify/callback - Handle OAuth callback
  - GET /api/shopify/status - Check connection status
  - POST /api/shopify/disconnect - Remove connection
  - GET /api/shopify/products - Fetch Shopify products
  - POST /api/shopify/sync - Sync products to Zyra database
- **Frontend Integration**: Integration card on settings page with OAuth popup flow, connection status display, and visual indicators

# External Dependencies

## Database & Hosting
- **PostgreSQL**: Production database.
- **Supabase**: Provides PostgreSQL with built-in authentication.
- **Drizzle ORM**: Type-safe database queries.
- **Replit Deployment**: Full-stack hosting.

## AI & Machine Learning
- **OpenAI API**: GPT-5 for text generation and Vision API for image analysis.

## Payment Processing
- **Razorpay**: Indian payment gateway.
- **PayPal**: International payment gateway.

## Email & SMS Services
- **SendGrid**: Transactional emails and marketing campaigns.
- **Twilio**: SMS notifications and cart recovery.