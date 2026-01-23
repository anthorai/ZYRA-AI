import { requireDb } from '../db';
import { 
  products, 
  seoMeta, 
  revenueSignals, 
  automationSettings,
  contentPerformance,
  abandonedCarts,
  FrictionType,
  FRICTION_TYPE_LABELS,
  FRICTION_TYPE_CAUSES
} from '@shared/schema';
import { eq, and, lt, sql, desc, gt, gte } from 'drizzle-orm';

/**
 * FRICTION DETECTION ENGINE
 * 
 * ZYRA detects REVENUE FRICTION - moments where buyer intent existed but money did not happen.
 * 
 * Friction Types:
 * 1. VIEW_NO_CART - High views, low add-to-cart (value unclear, trust missing)
 * 2. CART_NO_CHECKOUT - Cart adds but no checkout (price friction, doubt)
 * 3. CHECKOUT_DROP - Checkout started but dropped (final risk fear)
 * 4. PURCHASE_NO_UPSELL - Purchase complete but no secondary items (missed AOV)
 */

export interface FrictionSignal {
  type: string;
  entityId: string;
  frictionType: FrictionType;
  whereIntentDied: string;
  frictionCause: string;
  estimatedMonthlyLoss: number;
  estimatedRevenueDelta: number;
  confidenceScore: number;
}

export interface DetectionResult {
  signalsDetected: number;
  signals: FrictionSignal[];
}

const FRICTION_THRESHOLDS = {
  MIN_VIEWS_FOR_ANALYSIS: 10,
  VIEW_TO_CART_LOW: 0.05,
  CART_TO_CHECKOUT_LOW: 0.30,
  CHECKOUT_COMPLETION_LOW: 0.60,
  POOR_SEO_SCORE: 60,
  MIN_MONTHLY_LOSS_THRESHOLD: 50,
};

export class RevenueDetectionEngine {
  async detectSignals(userId: string): Promise<DetectionResult> {
    console.log(`🔍 [Friction Detection] Starting friction analysis for user ${userId}`);
    const db = requireDb();
    
    const settings = await this.getUserSettings(userId);
    if (!settings || !settings.globalAutopilotEnabled) {
      console.log(`⏸️  [Friction Detection] Autopilot disabled for user ${userId}`);
      return { signalsDetected: 0, signals: [] };
    }

    const signals: FrictionSignal[] = [];

    const [
      viewNoCartFriction,
      cartNoCheckoutFriction,
      checkoutDropFriction,
      purchaseNoUpsellFriction
    ] = await Promise.all([
      this.detectViewNoCartFriction(userId),
      this.detectCartNoCheckoutFriction(userId),
      this.detectCheckoutDropFriction(userId),
      this.detectPurchaseNoUpsellFriction(userId),
    ]);

    signals.push(
      ...viewNoCartFriction,
      ...cartNoCheckoutFriction,
      ...checkoutDropFriction,
      ...purchaseNoUpsellFriction
    );

    for (const signal of signals) {
      await this.persistFrictionSignal(userId, signal);
    }

    console.log(`✅ [Friction Detection] Detected ${signals.length} friction points for user ${userId}`);
    return {
      signalsDetected: signals.length,
      signals,
    };
  }

  private async getUserSettings(userId: string) {
    const db = requireDb();
    const [settings] = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, userId))
      .limit(1);
    return settings;
  }

  /**
   * FRICTION TYPE 1: VIEW → NO ADD TO CART
   * 
   * Meaning: Value unclear, trust missing, information gap
   * Signals: High product views, low add-to-cart rate, scroll depth without interaction
   */
  private async detectViewNoCartFriction(userId: string): Promise<FrictionSignal[]> {
    const db = requireDb();
    const signals: FrictionSignal[] = [];

    const performanceData = await db
      .select({
        productId: contentPerformance.productId,
        views: contentPerformance.views,
        conversions: contentPerformance.conversions,
        product: products,
        seo: seoMeta,
      })
      .from(contentPerformance)
      .innerJoin(products, eq(products.id, contentPerformance.productId))
      .leftJoin(seoMeta, eq(seoMeta.productId, products.id))
      .where(
        and(
          eq(contentPerformance.userId, userId),
          gte(contentPerformance.views, FRICTION_THRESHOLDS.MIN_VIEWS_FOR_ANALYSIS)
        )
      );

    for (const data of performanceData) {
      if (!data.productId || !data.product) continue;
      
      const views = data.views ?? 0;
      const conversions = data.conversions ?? 0;
      const conversionRate = views > 0 ? conversions / views : 0;
      const seoScore = data.seo?.seoScore ?? 50;

      if (conversionRate < FRICTION_THRESHOLDS.VIEW_TO_CART_LOW && views >= FRICTION_THRESHOLDS.MIN_VIEWS_FOR_ANALYSIS) {
        const productPrice = parseFloat(data.product.price?.toString() || '0');
        const expectedConversions = views * 0.05;
        const lostConversions = expectedConversions - conversions;
        const monthlyLoss = lostConversions * productPrice;

        if (monthlyLoss >= FRICTION_THRESHOLDS.MIN_MONTHLY_LOSS_THRESHOLD) {
          let frictionCause = 'value_unclear';
          if (seoScore < 50) {
            frictionCause = 'information_gap';
          } else if (conversionRate < 0.01) {
            frictionCause = 'trust_missing';
          }

          signals.push({
            type: 'high_traffic_low_conversion',
            entityId: data.productId,
            frictionType: 'view_no_cart',
            whereIntentDied: 'Between product view and add-to-cart',
            frictionCause,
            estimatedMonthlyLoss: monthlyLoss,
            estimatedRevenueDelta: monthlyLoss,
            confidenceScore: Math.min(90, 50 + (views / 10)),
          });
        }
      }
    }

    return signals;
  }

  /**
   * FRICTION TYPE 2: ADD TO CART → NO CHECKOUT
   * 
   * Meaning: Price friction, doubt, shipping/risk anxiety
   * Signals: Cart adds, cart abandonment, time spent on cart page
   */
  private async detectCartNoCheckoutFriction(userId: string): Promise<FrictionSignal[]> {
    const db = requireDb();
    const signals: FrictionSignal[] = [];

    try {
      const abandonedCartsData = await db
        .select({
          cart: abandonedCarts,
          product: products,
        })
        .from(abandonedCarts)
        .innerJoin(products, sql`${abandonedCarts.cartItems}::jsonb @> ANY(ARRAY[jsonb_build_object('productId', ${products.id})])`)
        .where(
          and(
            eq(abandonedCarts.userId, userId),
            eq(abandonedCarts.status, 'abandoned'),
            sql`${abandonedCarts.createdAt} > NOW() - INTERVAL '30 days'`
          )
        )
        .limit(50);

      const productAbandonmentMap = new Map<string, { count: number; totalValue: number; product: typeof products.$inferSelect }>();

      for (const { cart, product } of abandonedCartsData) {
        if (!product) continue;
        
        const existing = productAbandonmentMap.get(product.id) || { count: 0, totalValue: 0, product };
        existing.count += 1;
        existing.totalValue += parseFloat(cart.cartValue?.toString() || '0');
        productAbandonmentMap.set(product.id, existing);
      }

      productAbandonmentMap.forEach((data, productId) => {
        if (data.count >= 3) {
          const monthlyLoss = data.totalValue;
          
          signals.push({
            type: 'abandoned_cart_pattern',
            entityId: productId,
            frictionType: 'cart_no_checkout',
            whereIntentDied: 'Between add-to-cart and checkout start',
            frictionCause: 'price_friction',
            estimatedMonthlyLoss: monthlyLoss,
            estimatedRevenueDelta: monthlyLoss * 0.3,
            confidenceScore: Math.min(85, 40 + (data.count * 5)),
          });
        }
      });
    } catch (error) {
      console.log(`⚠️ [Friction Detection] Cart abandonment analysis skipped: ${error}`);
    }

    return signals;
  }

  /**
   * FRICTION TYPE 3: CHECKOUT START → DROP
   * 
   * Meaning: Final risk fear, delivery/refund/urgency missing
   * Signals: Checkout entry, checkout abandonment
   */
  private async detectCheckoutDropFriction(userId: string): Promise<FrictionSignal[]> {
    const db = requireDb();
    const signals: FrictionSignal[] = [];

    try {
      const abandonedCheckouts = await db
        .select()
        .from(abandonedCarts)
        .where(
          and(
            eq(abandonedCarts.userId, userId),
            eq(abandonedCarts.status, 'abandoned'),
            sql`${abandonedCarts.createdAt} > NOW() - INTERVAL '30 days'`
          )
        );

      if (abandonedCheckouts.length >= 5) {
        const totalLostValue = abandonedCheckouts.reduce(
          (sum, cart) => sum + parseFloat(cart.cartValue?.toString() || '0'),
          0
        );

        signals.push({
          type: 'abandoned_cart_pattern',
          entityId: userId,
          frictionType: 'checkout_drop',
          whereIntentDied: 'At checkout - buyer started but did not complete',
          frictionCause: 'final_risk_fear',
          estimatedMonthlyLoss: totalLostValue,
          estimatedRevenueDelta: totalLostValue * 0.4,
          confidenceScore: Math.min(90, 50 + (abandonedCheckouts.length * 3)),
        });
      }
    } catch (error) {
      console.log(`⚠️ [Friction Detection] Checkout drop analysis skipped: ${error}`);
    }

    return signals;
  }

  /**
   * FRICTION TYPE 4: PURCHASE → NO UPSELL
   * 
   * Meaning: Missed AOV opportunity, offer relevance failure
   * Signals: Completed purchase, no secondary item added
   * 
   * NOTE: This requires Shopify order data - placeholder for future integration
   */
  private async detectPurchaseNoUpsellFriction(userId: string): Promise<FrictionSignal[]> {
    const signals: FrictionSignal[] = [];
    return signals;
  }

  private async persistFrictionSignal(
    userId: string, 
    signal: FrictionSignal
  ): Promise<void> {
    const db = requireDb();
    
    const existingSignal = await db
      .select()
      .from(revenueSignals)
      .where(
        and(
          eq(revenueSignals.userId, userId),
          eq(revenueSignals.entityId, signal.entityId),
          eq(revenueSignals.signalType, signal.type as any),
          sql`${revenueSignals.status} IN ('detected', 'queued')`
        )
      )
      .limit(1);

    if (existingSignal.length > 0) {
      console.log(`⏭️  [Friction Detection] Signal already exists for entity ${signal.entityId}`);
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(revenueSignals).values({
      userId,
      signalType: signal.type as any,
      entityType: 'product',
      entityId: signal.entityId,
      frictionType: signal.frictionType as any,
      whereIntentDied: signal.whereIntentDied,
      frictionCause: signal.frictionCause,
      estimatedMonthlyLoss: signal.estimatedMonthlyLoss.toFixed(2),
      signalData: {
        type: signal.type,
        frictionType: signal.frictionType,
        whereIntentDied: signal.whereIntentDied,
        frictionCause: signal.frictionCause,
        detectionMethod: 'friction_analysis',
      },
      estimatedRevenueDelta: signal.estimatedRevenueDelta.toFixed(2),
      confidenceScore: signal.confidenceScore,
      status: 'detected',
      expiresAt,
    });

    console.log(`📝 [Friction Detection] Created friction signal: ${signal.frictionType} for entity ${signal.entityId}`);
    console.log(`   └─ Where intent died: ${signal.whereIntentDied}`);
    console.log(`   └─ Estimated monthly loss: $${signal.estimatedMonthlyLoss.toFixed(2)}`);
  }

  async getActiveSignals(userId: string, limit: number = 10) {
    const db = requireDb();
    return db
      .select()
      .from(revenueSignals)
      .where(
        and(
          eq(revenueSignals.userId, userId),
          sql`${revenueSignals.status} IN ('detected', 'queued')`,
          sql`${revenueSignals.expiresAt} > NOW() OR ${revenueSignals.expiresAt} IS NULL`
        )
      )
      .orderBy(desc(revenueSignals.priorityScore))
      .limit(limit);
  }

  async getFrictionSummary(userId: string): Promise<{
    totalMonthlyLoss: number;
    frictionByType: Record<FrictionType, { count: number; loss: number }>;
  }> {
    const db = requireDb();
    const activeSignals = await this.getActiveSignals(userId, 100);

    const frictionByType: Record<FrictionType, { count: number; loss: number }> = {
      view_no_cart: { count: 0, loss: 0 },
      cart_no_checkout: { count: 0, loss: 0 },
      checkout_drop: { count: 0, loss: 0 },
      purchase_no_upsell: { count: 0, loss: 0 },
    };

    let totalMonthlyLoss = 0;

    for (const signal of activeSignals) {
      const loss = parseFloat(signal.estimatedMonthlyLoss?.toString() || '0');
      totalMonthlyLoss += loss;

      if (signal.frictionType && signal.frictionType in frictionByType) {
        frictionByType[signal.frictionType as FrictionType].count += 1;
        frictionByType[signal.frictionType as FrictionType].loss += loss;
      }
    }

    return { totalMonthlyLoss, frictionByType };
  }
}

export const revenueDetectionEngine = new RevenueDetectionEngine();
