import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Middleware to verify Shopify webhook HMAC signatures
 * Validates the X-Shopify-Hmac-Sha256 header against the raw request body
 */
export function verifyShopifyWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
    const apiSecret = process.env.SHOPIFY_API_SECRET;

    if (!apiSecret) {
      console.error('SHOPIFY_API_SECRET not configured');
      return res.status(500).json({ error: 'Webhook verification not configured' });
    }

    if (!hmacHeader) {
      console.error('Missing X-Shopify-Hmac-Sha256 header');
      return res.status(401).json({ error: 'Missing HMAC signature' });
    }

    // Use raw body for HMAC verification (captured by webhook middleware in server/index.ts)
    const rawBody = (req as any).rawBody;
    
    if (!rawBody) {
      console.error('Raw body not available for HMAC verification');
      return res.status(400).json({ error: 'Invalid webhook request format' });
    }

    // Calculate HMAC using raw body and API secret
    const calculatedHmac = crypto
      .createHmac('sha256', apiSecret)
      .update(rawBody, 'utf8')
      .digest('base64');

    // Use timing-safe comparison to prevent timing attacks
    const hmacBuffer = Buffer.from(hmacHeader, 'utf8');
    const calculatedBuffer = Buffer.from(calculatedHmac, 'utf8');

    // Ensure buffers are the same length before comparison
    if (hmacBuffer.length !== calculatedBuffer.length) {
      console.error('HMAC verification failed: length mismatch');
      return res.status(401).json({ error: 'HMAC verification failed' });
    }

    // Perform constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(hmacBuffer, calculatedBuffer)) {
      console.error('HMAC verification failed', {
        provided: hmacHeader.substring(0, 10) + '...',
        calculated: calculatedHmac.substring(0, 10) + '...'
      });
      return res.status(401).json({ error: 'HMAC verification failed' });
    }

    console.log('✅ Shopify webhook HMAC verified successfully');
    next();
  } catch (error) {
    console.error('Error verifying Shopify webhook:', error);
    return res.status(500).json({ error: 'Webhook verification error' });
  }
}
