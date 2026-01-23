import { requireDb } from '../db';
import { 
  detectionCache, 
  detectionStatus,
  products,
  contentPerformance,
  abandonedCarts,
  seoMeta,
  FrictionType
} from '@shared/schema';
import { eq, and, sql, gte, desc } from 'drizzle-orm';

const PRECOMPUTE_BATCH_SIZE = 50;

export class DetectionPrecompute {
  async precomputeForUser(userId: string): Promise<void> {
    const startTime = Date.now();
    const db = requireDb();
    
    console.log(`📊 [Precompute] Starting cache precomputation for user ${userId}`);
    
    await db.update(detectionStatus)
      .set({
        status: 'preparing',
        phase: 'cache_loading',
        updatedAt: new Date(),
      })
      .where(eq(detectionStatus.userId, userId));

    const userProducts = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
      })
      .from(products)
      .where(eq(products.userId, userId))
      .limit(100);

    console.log(`📊 [Precompute] Found ${userProducts.length} products for user ${userId}`);

    for (const product of userProducts) {
      await this.precomputeProductCache(userId, product);
    }

    await db.update(detectionStatus)
      .set({
        status: 'idle',
        phase: 'idle',
        updatedAt: new Date(),
      })
      .where(eq(detectionStatus.userId, userId));

    const duration = Date.now() - startTime;
    console.log(`✅ [Precompute] Completed in ${duration}ms for user ${userId}`);
  }

  private async precomputeProductCache(
    userId: string, 
    product: { id: string; name: string; price: string | null }
  ): Promise<void> {
    const db = requireDb();
    
    const [performance] = await db
      .select({
        views: contentPerformance.views,
        conversions: contentPerformance.conversions,
      })
      .from(contentPerformance)
      .where(
        and(
          eq(contentPerformance.userId, userId),
          eq(contentPerformance.productId, product.id)
        )
      )
      .limit(1);

    const views = performance?.views || 0;
    const conversions = performance?.conversions || 0;
    
    const viewToCartRate = views > 0 ? conversions / views : 0;
    const cartToCheckoutRate = 0.35;
    const checkoutToPurchaseRate = 0.65;

    let topFrictionType: FrictionType = 'view_no_cart';
    let frictionScore = 0;
    let estimatedMonthlyLoss = 0;

    const productPrice = parseFloat(product.price || '0');

    if (views >= 10 && viewToCartRate < 0.05) {
      topFrictionType = 'view_no_cart';
      frictionScore = Math.min(100, Math.round((0.05 - viewToCartRate) * 2000));
      const expectedConversions = views * 0.05;
      const lostConversions = expectedConversions - conversions;
      estimatedMonthlyLoss = lostConversions * productPrice;
    }

    const abandonedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(abandonedCarts)
      .where(
        and(
          eq(abandonedCarts.userId, userId),
          eq(abandonedCarts.status, 'abandoned'),
          sql`${abandonedCarts.createdAt} > NOW() - INTERVAL '30 days'`
        )
      );

    if ((abandonedCount[0]?.count || 0) >= 5) {
      const cartFrictionScore = Math.min(100, (abandonedCount[0]?.count || 0) * 5);
      if (cartFrictionScore > frictionScore) {
        topFrictionType = 'cart_no_checkout';
        frictionScore = cartFrictionScore;
      }
    }

    const confidenceScore = Math.min(90, 40 + (views / 5));

    await db.insert(detectionCache)
      .values({
        userId,
        productId: product.id,
        views7d: views,
        views14d: views,
        views30d: views,
        cartsAdded7d: conversions,
        cartsAdded14d: conversions,
        cartsAdded30d: conversions,
        viewToCartRate: viewToCartRate.toFixed(4),
        cartToCheckoutRate: cartToCheckoutRate.toFixed(4),
        checkoutToPurchaseRate: checkoutToPurchaseRate.toFixed(4),
        frictionScore,
        topFrictionType,
        estimatedMonthlyLoss: estimatedMonthlyLoss.toFixed(2),
        confidenceScore: Math.round(confidenceScore),
        lastPrecomputedAt: new Date(),
        isStale: false,
      })
      .onConflictDoUpdate({
        target: [detectionCache.userId, detectionCache.productId],
        set: {
          views7d: views,
          views14d: views,
          views30d: views,
          cartsAdded7d: conversions,
          cartsAdded14d: conversions,
          cartsAdded30d: conversions,
          viewToCartRate: viewToCartRate.toFixed(4),
          cartToCheckoutRate: cartToCheckoutRate.toFixed(4),
          checkoutToPurchaseRate: checkoutToPurchaseRate.toFixed(4),
          frictionScore,
          topFrictionType,
          estimatedMonthlyLoss: estimatedMonthlyLoss.toFixed(2),
          confidenceScore: Math.round(confidenceScore),
          lastPrecomputedAt: new Date(),
          isStale: false,
          updatedAt: new Date(),
        },
      })
      .catch((err) => {
        console.log(`⚠️ [Precompute] Insert failed for product ${product.id}, updating instead`);
        return db.update(detectionCache)
          .set({
            views7d: views,
            frictionScore,
            topFrictionType,
            estimatedMonthlyLoss: estimatedMonthlyLoss.toFixed(2),
            confidenceScore: Math.round(confidenceScore),
            lastPrecomputedAt: new Date(),
            isStale: false,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(detectionCache.userId, userId),
              eq(detectionCache.productId, product.id)
            )
          );
      });
  }

  async markCacheStale(userId: string): Promise<void> {
    const db = requireDb();
    
    await db.update(detectionCache)
      .set({ isStale: true, updatedAt: new Date() })
      .where(eq(detectionCache.userId, userId));
    
    console.log(`🔄 [Precompute] Marked cache as stale for user ${userId}`);
  }

  async schedulePrecompute(userId: string, delayMs: number = 0): Promise<void> {
    if (delayMs > 0) {
      setTimeout(() => {
        this.precomputeForUser(userId).catch(err => {
          console.error(`❌ [Precompute] Scheduled precompute failed for ${userId}:`, err);
        });
      }, delayMs);
    } else {
      await this.precomputeForUser(userId);
    }
  }
}

export const precomputeCache = new DetectionPrecompute();
