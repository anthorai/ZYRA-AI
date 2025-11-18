import { requireDb } from "../db";
import {
  abandonedCarts,
  cartRecoverySequences,
  autonomousActions,
  automationSettings,
  campaigns
} from "@shared/schema";
import { eq, and, sql, gte, isNull, inArray } from "drizzle-orm";
import { sendBulkEmails } from "./sendgrid-client";
import { sendBulkSMS } from "./twilio-client";

/**
 * Cart Recovery Manager
 * Handles multi-step escalation sequences with channel escalation
 */

export type CartRecoveryStage = 'initial_reminder' | 'first_discount' | 'second_discount' | 'final_offer';
export type OfferType = 'none' | 'percentage' | 'fixed_amount' | 'free_shipping';

export interface RecoverySequenceConfig {
  stage: CartRecoveryStage;
  delayHours: number;
  offerType: OfferType;
  offerValue?: number;
  channel: 'email' | 'sms';
  subject?: string;
  messageTemplate: string;
}

/**
 * Default recovery sequence configuration
 * Escalates from gentle reminder to urgent final offer
 */
export const DEFAULT_RECOVERY_SEQUENCE: RecoverySequenceConfig[] = [
  {
    stage: 'initial_reminder',
    delayHours: 1,
    offerType: 'none',
    channel: 'email',
    subject: 'You left items in your cart',
    messageTemplate: 'Hi {{customerName}}, you left {{itemCount}} items in your cart. Complete your purchase now!'
  },
  {
    stage: 'first_discount',
    delayHours: 24,
    offerType: 'percentage',
    offerValue: 10,
    channel: 'email',
    subject: 'Special 10% discount on your cart!',
    messageTemplate: 'Hi {{customerName}}, we noticed you didn\'t complete your purchase. Here\'s 10% off to help you decide!'
  },
  {
    stage: 'second_discount',
    delayHours: 48,
    offerType: 'percentage',
    offerValue: 15,
    channel: 'sms',
    messageTemplate: '🎁 Last chance! Get 15% off your cart. Use code SAVE15. Expires in 24 hours.'
  },
  {
    stage: 'final_offer',
    delayHours: 72,
    offerType: 'free_shipping',
    channel: 'sms',
    messageTemplate: '🚨 FINAL OFFER: Free shipping on your cart! This offer expires tonight. Complete your order now.'
  }
];

/**
 * Create recovery sequence for abandoned cart
 */
export async function createRecoverySequence(
  abandonedCartId: string,
  userId: string,
  ruleId?: string
): Promise<void> {
  const db = requireDb();

  console.log(`📋 [Cart Recovery] Creating recovery sequence for cart ${abandonedCartId}`);

  // Check if sequence already exists
  const existing = await db
    .select()
    .from(cartRecoverySequences)
    .where(eq(cartRecoverySequences.abandonedCartId, abandonedCartId))
    .limit(1);

  if (existing.length > 0) {
    console.log(`⏭️  [Cart Recovery] Sequence already exists for cart ${abandonedCartId}`);
    return;
  }

  // Create sequence entries for each stage
  for (const config of DEFAULT_RECOVERY_SEQUENCE) {
    await db.insert(cartRecoverySequences).values({
      userId,
      ruleId: ruleId || null,
      abandonedCartId,
      stage: config.stage,
      delayHours: config.delayHours,
      offerType: config.offerType,
      offerValue: config.offerValue?.toString(),
      status: 'pending',
      metadata: {
        channel: config.channel,
        subject: config.subject,
        messageTemplate: config.messageTemplate
      }
    });
  }

  console.log(`✅ [Cart Recovery] Created ${DEFAULT_RECOVERY_SEQUENCE.length} sequence stages for cart ${abandonedCartId}`);
}

/**
 * Process pending recovery sequences
 * Checks each sequence stage and sends if delay has passed
 */
export async function processRecoverySequences(): Promise<void> {
  const db = requireDb();

  console.log('📨 [Cart Recovery Sequences] Processing pending sequences...');

  try {
    // Get all pending sequences
    const pendingSequences = await db
      .select()
      .from(cartRecoverySequences)
      .where(eq(cartRecoverySequences.status, 'pending'));

    if (pendingSequences.length === 0) {
      console.log('📨 [Cart Recovery Sequences] No pending sequences to process');
      return;
    }

    console.log(`📨 [Cart Recovery Sequences] Found ${pendingSequences.length} pending sequences`);

    for (const sequence of pendingSequences) {
      try {
        // Get the abandoned cart
        const [cart] = await db
          .select()
          .from(abandonedCarts)
          .where(eq(abandonedCarts.id, sequence.abandonedCartId))
          .limit(1);

        if (!cart) {
          console.log(`⚠️  [Cart Recovery Sequences] Cart ${sequence.abandonedCartId} not found`);
          continue;
        }

        // Skip if cart is recovered or expired
        if (cart.status === 'recovered' || cart.status === 'expired') {
          await db
            .update(cartRecoverySequences)
            .set({ status: 'expired' })
            .where(eq(cartRecoverySequences.id, sequence.id));
          continue;
        }

        // Check if delay has passed
        const abandonedAt = new Date(cart.abandonedAt);
        const now = new Date();
        const hoursSinceAbandonment = (now.getTime() - abandonedAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceAbandonment < sequence.delayHours) {
          console.log(`⏳ [Cart Recovery Sequences] Sequence ${sequence.id} not ready (${hoursSinceAbandonment.toFixed(1)}h / ${sequence.delayHours}h)`);
          continue;
        }

        // Get automation settings for user
        const [settings] = await db
          .select()
          .from(automationSettings)
          .where(eq(automationSettings.userId, sequence.userId))
          .limit(1);

        if (!settings || !settings.cartRecoveryEnabled) {
          console.log(`⚠️  [Cart Recovery Sequences] Cart recovery disabled for user ${sequence.userId}`);
          continue;
        }

        // Validate customer email
        if (!cart.customerEmail) {
          console.log(`⚠️  [Cart Recovery Sequences] No customer email for cart ${cart.id}`);
          continue;
        }

        // Check for frequency caps (prevent over-messaging)
        const recentActions = await getRecentRecoveryActions(sequence.userId, cart.customerEmail);
        if (recentActions >= 3) {
          console.log(`🚫 [Cart Recovery Sequences] Frequency cap reached for ${cart.customerEmail}`);
          continue;
        }

        // Send recovery message
        await sendRecoveryMessage(sequence, cart, settings);

        // Update sequence status
        await db
          .update(cartRecoverySequences)
          .set({
            status: 'sent',
            sentAt: new Date(),
            lastTriggeredAt: new Date()
          })
          .where(eq(cartRecoverySequences.id, sequence.id));

        console.log(`✅ [Cart Recovery Sequences] Sent ${sequence.stage} to ${cart.customerEmail}`);

      } catch (error) {
        console.error(`❌ [Cart Recovery Sequences] Error processing sequence ${sequence.id}:`, error);
      }
    }

  } catch (error) {
    console.error('❌ [Cart Recovery Sequences] Fatal error:', error);
  }
}

/**
 * Send recovery message via email or SMS
 */
async function sendRecoveryMessage(
  sequence: any,
  cart: any,
  settings: any
): Promise<void> {
  const db = requireDb();
  const metadata = sequence.metadata as any || {};
  const channel = metadata.channel || 'email';

  // Generate personalized message
  const message = generateRecoveryMessage(sequence, cart);

  try {
    if (channel === 'email') {
      // Send via email
      await sendBulkEmails([{
        to: cart.customerEmail,
        subject: metadata.subject || 'Complete your purchase',
        html: message
      }]);
    } else {
      // Send via SMS
      if (cart.customerPhone) {
        await sendBulkSMS([{
          to: cart.customerPhone,
          message: message
        }]);
      } else {
        console.log(`⚠️  [Cart Recovery] No phone number for cart ${cart.id}, skipping SMS`);
        return;
      }
    }

    // Log autonomous action
    await db.insert(autonomousActions).values({
      userId: sequence.userId,
      actionType: 'send_cart_recovery',
      entityType: 'cart',
      entityId: cart.id,
      status: 'completed',
      decisionReason: `Cart recovery sequence: ${sequence.stage}`,
      ruleId: sequence.ruleId,
      payload: {
        stage: sequence.stage,
        channel,
        offerType: sequence.offerType,
        offerValue: sequence.offerValue
      },
      result: {
        sent: true,
        channel,
        recipientEmail: cart.customerEmail,
        recipientPhone: cart.customerPhone
      },
      completedAt: new Date()
    });

  } catch (error) {
    console.error(`❌ [Cart Recovery] Failed to send message:`, error);
    throw error;
  }
}

/**
 * Generate personalized recovery message
 */
function generateRecoveryMessage(sequence: any, cart: any): string {
  const metadata = sequence.metadata as any || {};
  let template = metadata.messageTemplate || 'Complete your purchase!';

  // Replace template variables
  const cartItems = cart.items as any[] || [];
  const itemCount = cartItems.length;
  const customerName = cart.customerName || 'there';

  template = template
    .replace(/\{\{customerName\}\}/g, customerName)
    .replace(/\{\{itemCount\}\}/g, itemCount.toString())
    .replace(/\{\{cartValue\}\}/g, `$${parseFloat(cart.cartValue).toFixed(2)}`);

  // Add offer details
  if (sequence.offerType !== 'none') {
    let offerText = '';
    if (sequence.offerType === 'percentage') {
      offerText = `\n\n🎁 Special offer: ${sequence.offerValue}% off your entire cart!`;
    } else if (sequence.offerType === 'fixed_amount') {
      offerText = `\n\n🎁 Special offer: $${sequence.offerValue} off your cart!`;
    } else if (sequence.offerType === 'free_shipping') {
      offerText = '\n\n🎁 Special offer: FREE SHIPPING on your order!';
    }
    template += offerText;
  }

  // Add cart link
  if (cart.checkoutUrl) {
    template += `\n\nComplete your purchase: ${cart.checkoutUrl}`;
  }

  return template;
}

/**
 * Get count of recent recovery actions for frequency capping
 * Returns number of recovery actions sent in last 24 hours
 */
async function getRecentRecoveryActions(userId: string, customerEmail: string): Promise<number> {
  const db = requireDb();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const actions = await db
    .select()
    .from(autonomousActions)
    .where(
      and(
        eq(autonomousActions.userId, userId),
        eq(autonomousActions.actionType, 'send_cart_recovery'),
        gte(autonomousActions.createdAt, oneDayAgo)
      )
    );

  // Filter by customer email in result payload
  const relevantActions = actions.filter(action => {
    const result = action.result as any || {};
    return result.recipientEmail === customerEmail;
  });

  return relevantActions.length;
}

/**
 * Mark cart as recovered (called when customer completes purchase)
 */
export async function markCartRecovered(abandonedCartId: string): Promise<void> {
  const db = requireDb();

  console.log(`✅ [Cart Recovery] Marking cart ${abandonedCartId} as recovered`);

  // Update cart status
  await db
    .update(abandonedCarts)
    .set({ status: 'recovered' })
    .where(eq(abandonedCarts.id, abandonedCartId));

  // Update all pending sequences to converted
  await db
    .update(cartRecoverySequences)
    .set({
      status: 'converted',
      convertedAt: new Date()
    })
    .where(
      and(
        eq(cartRecoverySequences.abandonedCartId, abandonedCartId),
        eq(cartRecoverySequences.status, 'pending')
      )
    );

  console.log(`✅ [Cart Recovery] Cart ${abandonedCartId} marked as recovered`);
}

/**
 * Expire old carts and their sequences
 */
export async function expireOldCarts(): Promise<void> {
  const db = requireDb();

  console.log('🗑️  [Cart Recovery] Expiring old carts...');

  // Expire carts older than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const expiredCarts = await db
    .update(abandonedCarts)
    .set({ status: 'expired' })
    .where(
      and(
        eq(abandonedCarts.status, 'abandoned'),
        gte(abandonedCarts.abandonedAt, sevenDaysAgo)
      )
    )
    .returning();

  if (expiredCarts.length > 0) {
    console.log(`🗑️  [Cart Recovery] Expired ${expiredCarts.length} old carts`);

    // Update associated sequences
    for (const cart of expiredCarts) {
      await db
        .update(cartRecoverySequences)
        .set({ status: 'expired' })
        .where(
          and(
            eq(cartRecoverySequences.abandonedCartId, cart.id),
            eq(cartRecoverySequences.status, 'pending')
          )
        );
    }
  } else {
    console.log('🗑️  [Cart Recovery] No old carts to expire');
  }
}
