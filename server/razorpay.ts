import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Request, Response } from 'express';

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

let razorpayInstance: Razorpay | null = null;

if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
}

interface CreateRazorpayOrderParams {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export async function createRazorpayOrder(params: CreateRazorpayOrderParams) {
  if (!razorpayInstance) {
    throw new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
  }

  const { amount, currency = 'INR', receipt, notes } = params;

  const options: any = {
    amount: Math.round(amount * 100), // Razorpay expects amount in paise (smallest currency unit)
    currency,
    receipt: receipt || `receipt_${Date.now()}`,
  };

  if (notes) {
    options.notes = notes;
  }

  const order = await razorpayInstance.orders.create(options);
  return order;
}

export async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  if (!RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay secret key is not configured');
  }

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

export async function captureRazorpayPayment(paymentId: string, amount: number, currency = 'INR') {
  if (!razorpayInstance) {
    throw new Error('Razorpay is not configured');
  }

  const capturedPayment = await razorpayInstance.payments.capture(
    paymentId,
    Math.round(amount * 100), // Amount in paise
    currency
  );

  return capturedPayment;
}

export async function fetchRazorpayPayment(paymentId: string) {
  if (!razorpayInstance) {
    throw new Error('Razorpay is not configured');
  }

  const payment = await razorpayInstance.payments.fetch(paymentId);
  return payment;
}

export async function refundRazorpayPayment(paymentId: string, amount?: number) {
  if (!razorpayInstance) {
    throw new Error('Razorpay is not configured');
  }

  const options: any = {
    payment_id: paymentId,
  };

  if (amount) {
    options.amount = Math.round(amount * 100); // Amount in paise
  }

  const refund = await razorpayInstance.payments.refund(paymentId, options);
  return refund;
}

export function getRazorpayKeyId(): string {
  if (!RAZORPAY_KEY_ID) {
    throw new Error('Razorpay key ID is not configured');
  }
  return RAZORPAY_KEY_ID;
}

export function isRazorpayConfigured(): boolean {
  return !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
}

export async function handleRazorpayWebhook(req: Request, res: Response) {
  // NOTE: Webhook implementation with proper raw body signature verification and idempotency
  
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.warn('Razorpay webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    const signature = req.headers['x-razorpay-signature'] as string;
    // Use raw body for signature verification (captured by webhook middleware)
    const rawBody = (req as any).rawBody;
    
    if (!rawBody) {
      console.error('Raw body not available for signature verification');
      return res.status(400).json({ error: 'Invalid webhook request' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid Razorpay webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log('Razorpay webhook event:', event);

    // Process webhook and update database
    const { db } = await import('./db');
    const { paymentTransactions } = await import('../shared/schema');
    const { eq, and } = await import('drizzle-orm');

    switch (event) {
      case 'payment.authorized':
      case 'payment.captured': {
        const payment = payload.payment.entity;
        console.log('Payment successful:', payment.id);
        
        // Check for existing transaction
        const existing = await db.select()
          .from(paymentTransactions)
          .where(and(
            eq(paymentTransactions.gatewayTransactionId, payment.id),
            eq(paymentTransactions.gateway, 'razorpay')
          ))
          .limit(1);

        // Idempotency: Skip only if already in completed state
        if (existing.length > 0 && existing[0].status === 'completed') {
          console.log('Payment already completed:', payment.id);
          return res.status(200).json({ success: true, message: 'Already processed' });
        }

        // Update or create transaction record
        if (existing.length > 0) {
          await db.update(paymentTransactions)
            .set({
              status: 'completed',
              webhookReceived: true,
              webhookData: payload,
              updatedAt: new Date()
            })
            .where(eq(paymentTransactions.id, existing[0].id));
        } else {
          // Transaction not found - log warning for investigation
          console.warn('Razorpay webhook received for unknown payment:', payment.id);
          console.warn('This may indicate a race condition or missing transaction record');
        }
        break;
      }

      case 'payment.failed': {
        const payment = payload.payment.entity;
        console.log('Payment failed:', payment.id);
        
        const existing = await db.select()
          .from(paymentTransactions)
          .where(and(
            eq(paymentTransactions.gatewayTransactionId, payment.id),
            eq(paymentTransactions.gateway, 'razorpay')
          ))
          .limit(1);

        // Idempotency: Skip only if already in failed state
        if (existing.length > 0 && existing[0].status === 'failed') {
          console.log('Payment already marked as failed:', payment.id);
          return res.status(200).json({ success: true, message: 'Already processed' });
        }

        if (existing.length > 0) {
          await db.update(paymentTransactions)
            .set({
              status: 'failed',
              errorCode: payment.error_code || null,
              errorMessage: payment.error_description || null,
              webhookReceived: true,
              webhookData: payload,
              updatedAt: new Date()
            })
            .where(eq(paymentTransactions.id, existing[0].id));
        } else {
          console.warn('Razorpay webhook received for unknown failed payment:', payment.id);
        }
        break;
      }

      case 'refund.created': {
        const refund = payload.refund.entity;
        console.log('Refund created:', refund.id);
        
        const existing = await db.select()
          .from(paymentTransactions)
          .where(and(
            eq(paymentTransactions.gatewayTransactionId, refund.payment_id),
            eq(paymentTransactions.gateway, 'razorpay')
          ))
          .limit(1);

        // Idempotency: Skip only if already in refunded state
        if (existing.length > 0 && existing[0].status === 'refunded') {
          console.log('Refund already processed:', refund.payment_id);
          return res.status(200).json({ success: true, message: 'Already processed' });
        }

        if (existing.length > 0) {
          await db.update(paymentTransactions)
            .set({
              status: 'refunded',
              refundAmount: (refund.amount / 100).toString(), // Convert paise to rupees
              refundReason: refund.notes?.reason || null,
              webhookReceived: true,
              webhookData: payload,
              updatedAt: new Date()
            })
            .where(eq(paymentTransactions.id, existing[0].id));
        } else {
          console.warn('Razorpay webhook received for unknown refund:', refund.payment_id);
        }
        break;
      }

      default:
        console.log('Unhandled webhook event:', event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log error to error tracking system
    const { ErrorLogger } = await import('./lib/errorLogger');
    ErrorLogger.logFromRequest(
      error instanceof Error ? error : new Error(String(error)),
      req,
      {
        errorType: 'payment_error',
        statusCode: 500,
        metadata: { service: 'razorpay_webhook' }
      }
    );
    
    res.status(500).json({ error: 'Webhook processing failed', message: errorMessage });
  }
}
