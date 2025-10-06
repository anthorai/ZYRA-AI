# Overview

Zyra is an AI-powered Shopify SaaS application designed to help e-commerce merchants boost sales, optimize product listings, recover abandoned carts, and automate growth through intelligent automation. It provides AI-generated product descriptions, SEO optimization tools, email marketing automation, and an analytics dashboard to enhance store performance and drive significant ROI.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
The client-side is built with React 18, TypeScript, and Vite. It uses shadcn/ui components with Radix UI primitives, Wouter for routing, and TanStack Query for server state management. Styling is handled by Tailwind CSS with a dark theme featuring a midnight blue to light azure gradient. It follows a component-based architecture for pages, dashboard modules, and reusable UI elements.

## Backend
The server uses Express.js with TypeScript, providing RESTful API endpoints. Authentication is session-based via express-session and Passport.js (local strategy with bcrypt). Key features include secure user sessions, organized API routes, and a middleware pipeline for logging, JSON parsing, and error handling.

## Database
The application utilizes PostgreSQL with Drizzle ORM for type-safe operations. The schema includes tables for users (authentication, subscriptions, Stripe integration), products (Shopify integration, optimization status), SEO metadata, marketing campaigns, and analytics. Drizzle Kit manages database migrations.

## AI Integration
OpenAI GPT-4 powers core AI functionalities, including:
- Product description generation with various brand voice styles.
- Automated SEO title and meta description generation with keyword analysis.
- Content analysis for image alt-text generation.

## Authentication & Authorization
Authentication uses Supabase Auth with email/password login, password reset functionality via email, and secure JWT-based session management. The system includes:
- Frontend ProtectedRoute component for route-level authorization
- Backend requireAuth middleware for API endpoint protection
- Password reset flow with email verification
- Automatic user profile provisioning
- Session persistence and refresh token handling

## State Management
Client-side state management uses TanStack Query for server state caching, React Hook Form with Zod for form validation, and React Context for global state like authentication and UI.

## Payment System
A multi-gateway payment system supports Razorpay (India), PayPal (International), and planned Stripe integration. It includes database schema for transaction tracking, gateway-specific services, webhook handling with signature verification, and secure checkout UI components.

# External Dependencies

## Database & Hosting
- **PostgreSQL**: Production database via Replit (configured and active)
- **Supabase**: PostgreSQL database with built-in authentication
- **Drizzle ORM**: Type-safe database queries with automatic migrations
- **Replit Deployment**: Full-stack hosting with autoscale
- **Database Schema**: Fully migrated with tables for users, products, campaigns, analytics, notifications, and more

## AI & Machine Learning
- **OpenAI API**: GPT-4 for text generation and content optimization.

## Payment Processing
- **Razorpay**: Indian payment gateway.
- **PayPal**: International payment gateway.
- **Stripe Integration**: Planned for subscription management and payments.

## Email & SMS Services
- **SendGrid**: Transactional emails and marketing campaigns.
- **Twilio**: SMS notifications and cart recovery campaigns (configured).

## Development Tools
- **TypeScript**: Full-stack type safety.
- **Vite**: Fast development server and build tool.
- **Tailwind CSS**: Utility-first styling.

## Third-party Integrations
- **Shopify API**: Placeholder endpoints created for product sync (/api/shopify/products, /api/shopify/sync)
- **CSV Import/Export**: Fully functional product import/export via CSV files (/api/products/export-csv, /api/products/import-csv)

# Recent Changes (Phase 1: Core Foundation)

## Implemented Features (Latest Session)

### 1. Database Integration ✅
- PostgreSQL database provisioned and connected
- All tables migrated successfully via Drizzle
- Switched from in-memory storage to persistent PostgreSQL storage via Supabase
- Database now persists data across server restarts

### 2. Authentication & User Management ✅
- Supabase authentication fully integrated
- Password reset functionality implemented:
  - Forgot password page (/forgot-password)
  - Reset password page (/reset-password)
  - Email-based password reset flow
- Protected route guards on frontend (ProtectedRoute component)
- Backend authentication middleware (requireAuth)
- Automatic user profile provisioning

### 3. Product Management ✅
- CSV import/export endpoints:
  - GET /api/products/export-csv - Export all products to CSV
  - POST /api/products/import-csv - Import products from CSV
- Shopify integration placeholders:
  - GET /api/shopify/products - Shopify product listing
  - POST /api/shopify/sync - Sync products to Shopify
- Product CRUD operations connected to database

### 4. Routes Added
- /forgot-password - Password reset request
- /reset-password - Password reset completion
- Protected routes with authentication guards

### 5. Security Improvements
- Session-based authentication with JWT tokens
- Protected API endpoints requiring authentication
- Password hashing with bcrypt
- Secure password reset flow with email verification