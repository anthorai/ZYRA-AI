# Overview

Zyra is an AI-powered Shopify SaaS application designed to help e-commerce merchants boost sales, optimize product listings, recover abandoned carts, and automate growth through intelligent automation. It provides AI-generated product descriptions, SEO optimization tools, email marketing automation, and an analytics dashboard to enhance store performance and drive significant ROI.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
The client-side uses React 18, TypeScript, and Vite, featuring shadcn/ui components with Radix UI, Wouter for routing, and TanStack Query for server state. Styling is managed by Tailwind CSS with a dark theme. It follows a component-based architecture.

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
A multi-gateway payment system supports Razorpay (India), PayPal (International), and planned Stripe integration. It includes database schema for transaction tracking, gateway-specific services, and webhook handling.

# External Dependencies

## Database & Hosting
- **PostgreSQL**: Production database hosted via Replit.
- **Supabase**: PostgreSQL with built-in authentication.
- **Drizzle ORM**: Type-safe database queries.
- **Replit Deployment**: Full-stack hosting with autoscale.

## AI & Machine Learning
- **OpenAI API**: GPT-5 for text generation, Vision API for image analysis.

## Payment Processing
- **Razorpay**: Indian payment gateway.
- **PayPal**: International payment gateway.
- **Stripe Integration**: Planned for subscriptions.

## Email & SMS Services
- **SendGrid**: Transactional emails and marketing campaigns.
- **Twilio**: SMS notifications and cart recovery.

## Third-party Integrations
- **Shopify API**: Placeholder endpoints for product synchronization.
- **CSV Import/Export**: Functionality for product data.