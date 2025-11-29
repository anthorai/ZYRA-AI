import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Middleware to verify Shopify webhook HMAC signatures
 * Validates the X-Shopify-Hmac-Sha256 header against the raw request body
 * IMPORTANT: This must return 401 for invalid signatures per Shopify compliance
 */
export function verifyShopifyWebhook(req: Request, res: Response, next: NextFunction) {
  console.log('🔐 [HMAC] Verifying webhook signature...');
  
  try {
    const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
    const apiSecret = process.env.SHOPIFY_API_SECRET;

    if (!apiSecret) {
      console.error('❌ [HMAC] SHOPIFY_API_SECRET not configured');
      return res.status(401).json({ error: 'Webhook verification not configured' });
    }

    if (!hmacHeader) {
      console.error('❌ [HMAC] Missing X-Shopify-Hmac-Sha256 header');
      return res.status(401).json({ error: 'Missing HMAC signature' });
    }

    // Use raw body for HMAC verification (captured by webhook middleware in server/index.ts)
    const rawBody = (req as any).rawBody;
    
    if (!rawBody) {
      console.error('❌ [HMAC] Raw body not available for verification');
      return res.status(401).json({ error: 'Invalid webhook request' });
    }

    console.log('🔐 [HMAC] Raw body length:', rawBody.length);
    console.log('🔐 [HMAC] HMAC header:', hmacHeader.substring(0, 10) + '...');

    // Calculate HMAC using raw body and API secret
    const calculatedHmac = crypto
      .createHmac('sha256', apiSecret)
      .update(rawBody, 'utf8')
      .digest('base64');

    console.log('🔐 [HMAC] Calculated:', calculatedHmac.substring(0, 10) + '...');

    // Use timing-safe comparison to prevent timing attacks
    const hmacBuffer = Buffer.from(hmacHeader, 'utf8');
    const calculatedBuffer = Buffer.from(calculatedHmac, 'utf8');

    // Ensure buffers are the same length before comparison
    if (hmacBuffer.length !== calculatedBuffer.length) {
      console.error('❌ [HMAC] Verification failed: length mismatch');
      console.error('❌ [HMAC] Returning 401 Unauthorized');
      return res.status(401).json({ error: 'HMAC verification failed' });
    }

    // Perform constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(hmacBuffer, calculatedBuffer)) {
      console.error('❌ [HMAC] Verification failed: signature mismatch');
      console.error('❌ [HMAC] Returning 401 Unauthorized');
      return res.status(401).json({ error: 'HMAC verification failed' });
    }

    console.log('✅ [HMAC] Webhook signature verified successfully');
    next();
  } catch (error) {
    console.error('❌ [HMAC] Exception during verification:', error);
    // Return 401 even on errors to meet Shopify compliance
    return res.status(401).json({ error: 'Webhook verification error' });
  }
}
