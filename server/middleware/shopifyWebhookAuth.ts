import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Middleware to verify Shopify webhook HMAC signatures
 * Validates the X-Shopify-Hmac-Sha256 header against the raw request body
 * IMPORTANT: This must return 401 for invalid signatures per Shopify compliance
 * CRITICAL: Responds within milliseconds to prevent 503 timeouts
 */
export function verifyShopifyWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    // Fast path: Check for HMAC header first
    const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
    if (!hmacHeader) {
      return res.status(401).json({ error: 'Missing HMAC signature' });
    }

    // Get API secret
    const apiSecret = process.env.SHOPIFY_API_SECRET;
    if (!apiSecret) {
      return res.status(401).json({ error: 'Webhook verification not configured' });
    }

    // Get raw body - must be set by webhook middleware
    // IMPORTANT: rawBody can be an empty string for test webhooks - that's valid!
    const rawBody = (req as any).rawBody;
    if (rawBody === undefined || rawBody === null) {
      console.log('❌ [HMAC] rawBody is undefined/null - middleware not applied');
      return res.status(401).json({ error: 'Invalid webhook request' });
    }

    console.log('🔐 [HMAC] Verifying webhook, rawBody length:', rawBody.length);

    // Calculate HMAC - this is fast even for large bodies
    // Works correctly with empty string (for Shopify test webhooks)
    const calculatedHmac = crypto
      .createHmac('sha256', apiSecret)
      .update(rawBody, 'utf8')
      .digest('base64');

    // Convert to buffers for timing-safe comparison
    const hmacBuffer = Buffer.from(hmacHeader, 'utf8');
    const calculatedBuffer = Buffer.from(calculatedHmac, 'utf8');

    // Length must match before comparison
    if (hmacBuffer.length !== calculatedBuffer.length) {
      return res.status(401).json({ error: 'HMAC verification failed' });
    }

    // Timing-safe comparison prevents timing attacks
    if (!crypto.timingSafeEqual(hmacBuffer, calculatedBuffer)) {
      return res.status(401).json({ error: 'HMAC verification failed' });
    }

    // HMAC verified - proceed to route handler
    next();
  } catch (error) {
    // Any error = invalid webhook (return 401, not 500)
    return res.status(401).json({ error: 'Webhook verification error' });
  }
}
