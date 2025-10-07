import { Request } from "express";
import { db } from "../db";
import { errorLogs } from "@shared/schema";

export interface ErrorContext {
  userId?: string;
  errorType: 'api_error' | 'database_error' | 'auth_error' | 'payment_error' | 'ai_error' | 'validation_error' | 'external_api_error';
  endpoint?: string;
  method?: string;
  statusCode?: number;
  requestBody?: any;
  userAgent?: string;
  ipAddress?: string;
  metadata?: any;
}

export class ErrorLogger {
  /**
   * Log error to database and console
   */
  static async log(error: Error, context: ErrorContext): Promise<void> {
    // Always log to console for immediate visibility
    console.error(`[${context.errorType}] ${context.endpoint || 'Unknown'}: ${error.message}`, {
      stack: error.stack,
      ...context
    });

    // Attempt to log to database (non-blocking, fully isolated)
    setImmediate(async () => {
      try {
        await db.insert(errorLogs).values({
          userId: context.userId,
          errorType: context.errorType,
          message: error.message,
          stack: error.stack,
          endpoint: context.endpoint,
          method: context.method,
          statusCode: context.statusCode,
          requestBody: context.requestBody || null, // Store as JSON object directly
          userAgent: context.userAgent,
          ipAddress: context.ipAddress,
          metadata: context.metadata || null, // Store as JSON object directly
        });
      } catch (dbError) {
        // If database logging fails, just log to console - don't throw
        console.error('[ErrorLogger] Failed to log error to database:', dbError);
      }
    });
  }

  /**
   * Log error from Express request context (non-blocking)
   */
  static logFromRequest(error: Error, req: Request, context: Partial<ErrorContext> = {}): void {
    const errorContext: ErrorContext = {
      userId: (req as any).user?.id,
      errorType: context.errorType || 'api_error',
      endpoint: req.originalUrl || req.url,
      method: req.method,
      statusCode: context.statusCode || 500,
      requestBody: req.method !== 'GET' ? req.body : undefined,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip || req.socket.remoteAddress,
      metadata: context.metadata,
    };

    // Fire and forget - don't block response
    this.log(error, errorContext).catch(err => {
      console.error('[ErrorLogger] Async logging failed:', err);
    });
  }

  /**
   * Create error response with logging (non-blocking)
   */
  static logAndRespond(error: Error, req: Request, res: any, statusCode: number = 500, context: Partial<ErrorContext> = {}): void {
    this.logFromRequest(error, req, { ...context, statusCode });
    
    res.status(statusCode).json({
      message: error.message || 'An error occurred',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Helper function for quick error logging
 */
export async function logError(error: Error, context: ErrorContext): Promise<void> {
  await ErrorLogger.log(error, context);
}
