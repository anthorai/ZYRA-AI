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
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.warn('Razorpay webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    const signature = req.headers['x-razorpay-signature'] as string;
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid Razorpay webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log('Razorpay webhook event:', event);

    switch (event) {
      case 'payment.authorized':
      case 'payment.captured':
        console.log('Payment successful:', payload.payment.entity.id);
        break;
      case 'payment.failed':
        console.log('Payment failed:', payload.payment.entity.id);
        break;
      case 'refund.created':
        console.log('Refund created:', payload.refund.entity.id);
        break;
      default:
        console.log('Unhandled webhook event:', event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
