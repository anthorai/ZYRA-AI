import { Request, Response, NextFunction } from 'express';
import { UAParser } from 'ua-parser-js';
import { supabaseStorage } from '../lib/supabase-storage';

// AuthenticatedUser interface
interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  plan: string;
  imageUrl?: string;
}

// AuthenticatedRequest type
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

interface DeviceInfo {
  userAgent: string;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
}

/**
 * Extract device information from request headers
 */
function extractDeviceInfo(req: Request): DeviceInfo {
  const userAgent = req.headers['user-agent'] || '';
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  // Determine device type
  let deviceType: string | null = null;
  if (result.device.type) {
    deviceType = result.device.type; // mobile, tablet, etc.
  } else if (result.os.name && result.os.name.toLowerCase().includes('android') || 
             result.os.name && result.os.name.toLowerCase().includes('ios')) {
    deviceType = 'mobile';
  } else {
    deviceType = 'desktop';
  }
  
  // Get IP address (handles proxy headers)
  const ipAddress = 
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    null;
  
  return {
    userAgent,
    deviceType,
    browser: result.browser.name || null,
    os: result.os.name || null,
    ipAddress
  };
}

/**
 * Session tracking middleware
 * Updates lastSeenAt for existing sessions on each authenticated request
 */
export function trackSession() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Only track for authenticated requests
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user?.id) {
        return next();
      }
      
      // Get session ID from authorization header (JWT token)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }
      
      const token = authHeader.split(' ')[1];
      
      // Get device information
      const deviceInfo = extractDeviceInfo(req);
      
      // Try to find existing session by token or create new one
      // For now, we'll use the token as the session identifier
      // In a full implementation, we'd decode the JWT to get the actual session ID
      
      // Update session last seen time
      // This will be called after requireAuth, so user is already authenticated
      // We'll update the session in the background (fire and forget)
      setImmediate(async () => {
        try {
          const userId = authReq.user.id;
          
          // Get all user sessions to find the current one
          const userSessions = await supabaseStorage.getUserSessions(userId);
          
          // Update the most recent session (assumes it's the current one)
          // In a production system, we'd track session IDs more precisely
          if (userSessions.length > 0) {
            const currentSession = userSessions[0]; // Most recent session
            await supabaseStorage.updateSession(currentSession.sessionId, {
              lastSeenAt: new Date(),
              ...deviceInfo
            });
          }
        } catch (error) {
          // Log but don't fail the request
          console.error('[Session Tracking] Error updating session:', error);
        }
      });
      
      next();
    } catch (error) {
      // Don't fail the request if session tracking fails
      console.error('[Session Tracking] Middleware error:', error);
      next();
    }
  };
}

/**
 * Create a new session record when user logs in
 * This should be called after successful authentication
 */
export async function createSession(
  userId: string,
  sessionId: string,
  refreshTokenId: string | null,
  req: Request
): Promise<void> {
  try {
    const deviceInfo = extractDeviceInfo(req);
    
    await supabaseStorage.saveSession({
      sessionId,
      userId,
      refreshTokenId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ...deviceInfo,
      location: null, // TODO: Add geolocation lookup service
      lastSeenAt: new Date()
    });
    
    console.log('[Session Tracking] Created session:', sessionId, 'for user:', userId);
  } catch (error) {
    console.error('[Session Tracking] Error creating session:', error);
    // Don't throw - session creation failure shouldn't prevent login
  }
}
