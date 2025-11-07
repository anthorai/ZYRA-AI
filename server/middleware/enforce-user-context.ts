/**
 * 🔒 USER CONTEXT ENFORCEMENT MIDDLEWARE
 * 
 * This middleware ensures that all database queries are properly filtered by the authenticated user's ID.
 * Since we use backend authentication with service role keys (which bypass Supabase RLS),
 * we must enforce user isolation at the application level.
 * 
 * CRITICAL SECURITY:
 * - All storage methods MUST accept and use userId parameter
 * - No direct database access without userId filtering
 * - All API routes MUST use authenticated user's ID, never trust client-provided IDs
 */

import { type Request, type Response, type NextFunction } from 'express';

// Add userId to Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        email: string;
        role?: string;
      };
    }
  }
}

/**
 * Middleware to extract and validate user context from authenticated request
 * Must be used AFTER authentication middleware
 */
export function enforceUserContext(req: Request, res: Response, next: NextFunction) {
  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  // Attach userId to request for easy access
  req.userId = req.user.id;
  
  next();
}

/**
 * Security validator to ensure userId is used in database operations
 * This is a development/testing helper to catch security issues
 */
export function validateUserIdUsage(operation: string, userId?: string) {
  if (process.env.NODE_ENV === 'development') {
    if (!userId) {
      console.warn(`⚠️  [SECURITY WARNING] Database operation '${operation}' called without userId filtering!`);
      console.warn(`   This could expose user data across accounts.`);
      console.warn(`   Stack trace:`, new Error().stack);
    }
  }
}

/**
 * Middleware to prevent parameter tampering
 * Ensures route parameters match authenticated user context
 */
export function preventUserIdTampering(req: Request, res: Response, next: NextFunction) {
  const paramUserId = req.params.userId;
  const authenticatedUserId = req.user?.id;

  if (paramUserId && paramUserId !== authenticatedUserId) {
    console.error(`🚨 [SECURITY VIOLATION] User ${authenticatedUserId} attempted to access data for user ${paramUserId}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own data'
    });
  }

  next();
}

/**
 * Rate limiting per user to prevent abuse
 * More strict than global rate limiting
 */
export const perUserRateLimit = {
  // TODO: Implement per-user rate limiting
  // This should track requests per user ID, not just per IP
  // Recommended: 100 requests per minute per user
};

export default {
  enforceUserContext,
  validateUserIdUsage,
  preventUserIdTampering,
};
