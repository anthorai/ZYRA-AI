import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Middleware to verify Shopify webhook HMAC signatures
 * Validates the X-Shopify-Hmac-Sha256 header against the raw request body
 * IMPORTANT: This must return 401 for invalid signatures per Shopify compliance
 * CRITICAL: Responds within milliseconds to prevent 503 timeouts
 */
export function verifyShopifyWebhook(req: Request, res: Response, next: NextFunction) {
  const webhookTopic = req.get('X-Shopify-Topic') || 'unknown';
  const shopDomain = req.get('X-Shopify-Shop-Domain') || 'unknown';
  
  try {
    // Log incoming webhook for diagnostics
    console.log('🔐 [HMAC] Incoming webhook verification:', {
      path: req.path,
      topic: webhookTopic,
      shop: shopDomain,
      timestamp: new Date().toISOString()
    });

    // Fast path: Check for HMAC header first
    const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
    if (!hmacHeader) {
      console.log('❌ [HMAC] Missing X-Shopify-Hmac-Sha256 header');
      return res.status(401).json({ error: 'Missing HMAC signature' });
    }

    // Get API secret
    const apiSecret = process.env.SHOPIFY_API_SECRET;
    if (!apiSecret) {
      console.log('❌ [HMAC] SHOPIFY_API_SECRET not configured');
      return res.status(401).json({ error: 'Webhook verification not configured' });
    }

    // Get raw body - must be set by webhook middleware
    // IMPORTANT: rawBody can be an empty string for test webhooks - that's valid!
    const rawBody = (req as any).rawBody;
    if (rawBody === undefined || rawBody === null) {
      console.log('❌ [HMAC] rawBody is undefined/null - middleware not applied');
      return res.status(401).json({ error: 'Invalid webhook request' });
    }

    console.log('🔐 [HMAC] Verifying webhook:', {
      rawBodyLength: rawBody.length,
      rawBodyEmpty: rawBody === '',
      hmacHeaderLength: hmacHeader.length
    });

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
      console.log('❌ [HMAC] Length mismatch:', {
        expected: calculatedBuffer.length,
        received: hmacBuffer.length,
        topic: webhookTopic,
        shop: shopDomain
      });
      return res.status(401).json({ error: 'HMAC verification failed' });
    }

    // Timing-safe comparison prevents timing attacks
    if (!crypto.timingSafeEqual(hmacBuffer, calculatedBuffer)) {
      console.log('❌ [HMAC] Signature mismatch:', {
        topic: webhookTopic,
        shop: shopDomain,
        receivedPrefix: hmacHeader.substring(0, 10) + '...',
        calculatedPrefix: calculatedHmac.substring(0, 10) + '...'
      });
      return res.status(401).json({ error: 'HMAC verification failed' });
    }

    // HMAC verified - proceed to route handler
    console.log('✅ [HMAC] Webhook verified successfully:', {
      topic: webhookTopic,
      shop: shopDomain
    });
    next();
  } catch (error) {
    console.error('❌ [HMAC] Verification error:', {
      error: error instanceof Error ? error.message : String(error),
      topic: webhookTopic,
      shop: shopDomain
    });
    // Any error = invalid webhook (return 401, not 500)
    return res.status(401).json({ error: 'Webhook verification error' });
  }
}
