// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { Request, Response } from "express";

/* PayPal Controllers Setup */

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

if (!PAYPAL_CLIENT_ID) {
  console.warn("Missing PAYPAL_CLIENT_ID");
}
if (!PAYPAL_CLIENT_SECRET) {
  console.warn("Missing PAYPAL_CLIENT_SECRET");
}

let client: Client | null = null;
let ordersController: OrdersController | null = null;
let oAuthAuthorizationController: OAuthAuthorizationController | null = null;

if (PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET) {
  client = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: PAYPAL_CLIENT_ID,
      oAuthClientSecret: PAYPAL_CLIENT_SECRET,
    },
    timeout: 0,
    environment:
                  process.env.NODE_ENV === "production"
                    ? Environment.Production
                    : Environment.Sandbox,
    logging: {
      logLevel: LogLevel.Info,
      logRequest: {
        logBody: true,
      },
      logResponse: {
        logHeaders: true,
      },
    },
  });
  ordersController = new OrdersController(client);
  oAuthAuthorizationController = new OAuthAuthorizationController(client);
}

/* Token generation helpers */

export async function getClientToken() {
  if (!oAuthAuthorizationController || !PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal not configured");
  }

  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const { result } = await oAuthAuthorizationController.requestToken(
    {
      authorization: `Basic ${auth}`,
    },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

/*  Process transactions */

export async function createPaypalOrder(req: Request, res: Response) {
  try {
    if (!ordersController) {
      return res.status(503).json({ error: "PayPal not configured" });
    }

    const { amount, currency, intent, description, planName } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({
          error: "Invalid amount. Amount must be a positive number.",
        });
    }

    if (!currency) {
      return res
        .status(400)
        .json({ error: "Invalid currency. Currency is required." });
    }

    // Validate and normalize intent - PayPal only accepts CAPTURE or AUTHORIZE
    const normalizedIntent = intent?.toUpperCase();
    if (!normalizedIntent || !['CAPTURE', 'AUTHORIZE'].includes(normalizedIntent)) {
      return res
        .status(400)
        .json({ error: "Invalid intent. Intent must be 'capture' or 'authorize'." });
    }

    const collect = {
      body: {
        intent: normalizedIntent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: String(amount),
            },
            description: description || `Zyra AI ${planName || 'Subscription'}`,
          },
        ],
        applicationContext: {
          brandName: "Zyra AI",
          locale: "en-US",
          shippingPreference: "NO_SHIPPING" as any,
          userAction: "PAY_NOW" as any,
        },
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.createOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    if (!ordersController) {
      return res.status(503).json({ error: "PayPal not configured" });
    }

    const { orderID } = req.params;
    const collect = {
      id: orderID,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.captureOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
}

export async function loadPaypalDefault(req: Request, res: Response) {
  try {
    const clientToken = await getClientToken();
    res.json({
      clientToken,
    });
  } catch (error) {
    console.error("PayPal load error:", error);
    res.status(503).json({ error: "PayPal not configured" });
  }
}

export async function handlePaypalWebhook(req: Request, res: Response) {
  // NOTE: Current implementation handles basic webhook flow with PayPal signature verification.
  // Known limitations for future enhancement:
  // 1. Multiple capture attempts per order require order-level tracking
  // 2. Should handle cases where transaction record doesn't exist yet
  // 3. Consider adding webhook_events table for granular per-event tracking
  // 4. Capture vs authorization states could be more granular
  
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    
    if (!webhookId || !PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.warn('PayPal webhook not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    // PayPal sends headers for verification
    const transmissionId = req.headers['paypal-transmission-id'] as string;
    const transmissionTime = req.headers['paypal-transmission-time'] as string;
    const certUrl = req.headers['paypal-cert-url'] as string;
    const authAlgo = req.headers['paypal-auth-algo'] as string;
    const transmissionSig = req.headers['paypal-transmission-sig'] as string;

    if (!transmissionId || !transmissionSig) {
      console.error('Missing PayPal webhook headers');
      return res.status(400).json({ error: 'Missing webhook headers' });
    }

    const event = req.body;
    const eventType = event.event_type;
    
    console.log('PayPal webhook event:', eventType);

    // Verify webhook signature using PayPal's verification API
    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://api-m.paypal.com' 
        : 'https://api-m.sandbox.paypal.com';
      
      // Get OAuth token
      const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
      const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get PayPal OAuth token');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Verify webhook signature
      const verifyResponse = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          transmission_id: transmissionId,
          transmission_time: transmissionTime,
          cert_url: certUrl,
          auth_algo: authAlgo,
          transmission_sig: transmissionSig,
          webhook_id: webhookId,
          webhook_event: event
        })
      });

      if (!verifyResponse.ok) {
        console.error('PayPal signature verification failed:', await verifyResponse.text());
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }

      const verifyData = await verifyResponse.json();
      if (verifyData.verification_status !== 'SUCCESS') {
        console.error('PayPal signature verification failed:', verifyData);
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }

      console.log('PayPal webhook signature verified successfully');
    } catch (verifyError) {
      console.error('PayPal signature verification error:', verifyError);
      return res.status(400).json({ error: 'Signature verification failed' });
    }

    // Process webhook and update database
    const { db: dbInstance } = await import('./db');
    const { paymentTransactions } = await import('../shared/schema');
    const { eq, and } = await import('drizzle-orm');

    const db = dbInstance!;

    // Extract resource from event
    const resource = event.resource;

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const captureId = resource.id;
        const orderId = resource.supplementary_data?.related_ids?.order_id || null;
        console.log('PayPal payment captured:', captureId);

        // Check for existing transaction
        const existing = await db.select()
          .from(paymentTransactions)
          .where(and(
            eq(paymentTransactions.gatewayTransactionId, captureId),
            eq(paymentTransactions.gateway, 'paypal')
          ))
          .limit(1);

        // Idempotency: Skip only if already in completed state
        if (existing.length > 0 && existing[0].status === 'completed') {
          console.log('Payment already completed:', captureId);
          return res.status(200).json({ success: true, message: 'Already processed' });
        }

        // Update transaction record
        if (existing.length > 0) {
          await db.update(paymentTransactions)
            .set({
              status: 'completed',
              webhookReceived: true,
              webhookData: event,
              updatedAt: new Date()
            })
            .where(eq(paymentTransactions.id, existing[0].id));
        }
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED': {
        const captureId = resource.id;
        console.log('PayPal payment failed:', captureId);

        const existing = await db.select()
          .from(paymentTransactions)
          .where(and(
            eq(paymentTransactions.gatewayTransactionId, captureId),
            eq(paymentTransactions.gateway, 'paypal')
          ))
          .limit(1);

        // Idempotency: Skip only if already in failed state
        if (existing.length > 0 && existing[0].status === 'failed') {
          console.log('Payment already marked as failed:', captureId);
          return res.status(200).json({ success: true, message: 'Already processed' });
        }

        if (existing.length > 0) {
          await db.update(paymentTransactions)
            .set({
              status: 'failed',
              errorMessage: resource.status_details?.reason || 'Payment declined',
              webhookReceived: true,
              webhookData: event,
              updatedAt: new Date()
            })
            .where(eq(paymentTransactions.id, existing[0].id));
        }
        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        const refund = resource;
        const captureId = refund.links?.find((l: any) => l.rel === 'up')?.href?.split('/').pop();
        console.log('PayPal refund processed:', refund.id);

        if (captureId) {
          const existing = await db.select()
            .from(paymentTransactions)
            .where(and(
              eq(paymentTransactions.gatewayTransactionId, captureId),
              eq(paymentTransactions.gateway, 'paypal')
            ))
            .limit(1);

          // Idempotency: Skip only if already in refunded state (allows completed → refunded transition)
          if (existing.length > 0 && existing[0].status === 'refunded') {
            console.log('Refund already processed:', captureId);
            return res.status(200).json({ success: true, message: 'Already processed' });
          }

          if (existing.length > 0) {
            await db.update(paymentTransactions)
              .set({
                status: 'refunded',
                refundAmount: refund.amount?.value || null,
                webhookReceived: true,
                webhookData: event,
                updatedAt: new Date()
              })
              .where(eq(paymentTransactions.id, existing[0].id));
          }
        }
        break;
      }

      default:
        console.log('Unhandled PayPal webhook event:', eventType);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log error to error tracking system
    const { ErrorLogger } = await import('./lib/errorLogger');
    ErrorLogger.logFromRequest(
      error instanceof Error ? error : new Error(String(error)),
      req,
      {
        errorType: 'payment_error',
        statusCode: 500,
        metadata: { service: 'paypal_webhook' }
      }
    );
    
    res.status(500).json({ error: 'Webhook processing failed', message: errorMessage });
  }
}
// <END_EXACT_CODE>
