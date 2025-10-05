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
Authentication is session-based with email/password login and bcrypt hashing. It supports secure session management, basic role-based access control with plan-based feature restrictions, and a 7-day trial system.

## State Management
Client-side state management uses TanStack Query for server state caching, React Hook Form with Zod for form validation, and React Context for global state like authentication and UI.

## Payment System
A multi-gateway payment system supports Razorpay (India), PayPal (International), and planned Stripe integration. It includes database schema for transaction tracking, gateway-specific services, webhook handling with signature verification, and secure checkout UI components.

# External Dependencies

## Database & Hosting
- **Supabase**: PostgreSQL database.
- **Drizzle ORM**: Type-safe database queries.
- **Replit Deployment**: Full-stack hosting with autoscale.

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
- **Shopify API**: Planned for product sync and order processing.