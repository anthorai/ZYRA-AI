/**
 * Conversion Tracking Library
 * Tracks product performance before/after AI optimization to measure revenue lift
 * 
 * INTEGRATION GUIDE:
 * 
 * 1. When optimizing a product (e.g., in AI copywriting or SEO tools):
 *    ```typescript
 *    import { recordProductOptimization } from './lib/conversion-tracking';
 *    
 *    await recordProductOptimization(userId, productId, {
 *      views: 100,        // Total views before optimization
 *      conversions: 2,    // Total conversions before optimization
 *      revenue: 90        // Total revenue before optimization
 *    });
 *    ```
 * 
 * 2. When a product sale occurs (e.g., Shopify webhook handler):
 *    ```typescript
 *    import { trackProductSale } from './lib/conversion-tracking';
 *    
 *    await trackProductSale(userId, productId, saleAmount, {
 *      totalViews: 150,       // Current total views
 *      totalConversions: 5,   // Current total conversions
 *      totalRevenue: 225      // Current total revenue
 *    });
 *    ```
 *    This automatically calculates lift and creates revenue attribution records.
 * 
 * 3. Revenue attribution records are automatically queried by `/api/analytics/roi-summary`
 *    and displayed in the ROI dashboard.
 */

import { db } from "../db";
import { products, revenueAttribution } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

interface ProductPerformance {
  productId: string;
  views: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

interface ConversionLiftResult {
  productId: string;
  baselineConversionRate: number;
  currentConversionRate: number;
  liftPercentage: number;
  liftRevenue: number;
}

/**
 * Record a product optimization event
 * This captures the baseline performance before AI optimization
 */
export async function recordProductOptimization(
  userId: string,
  productId: string,
  baseline: {
    views: number;
    conversions: number;
    revenue: number;
  }
): Promise<void> {
  if (!db) {
    console.warn('[Conversion Tracking] Database not initialized');
    return;
  }

  try {
    // Update product record with baseline metrics nested under 'conversionMetrics' key
    // This preserves existing AI-generated copy in optimizedCopy
    await db
      .update(products)
      .set({
        // Use jsonb_set to nest metrics under 'conversionMetrics' without destroying existing data
        optimizedCopy: sql`
          jsonb_set(
            COALESCE(optimized_copy, '{}'::jsonb),
            '{conversionMetrics}',
            jsonb_build_object(
              'baselineViews', ${baseline.views}::int,
              'baselineConversions', ${baseline.conversions}::int,
              'baselineRevenue', ${baseline.revenue}::numeric,
              'baselineConversionRate', ${(baseline.conversions / Math.max(baseline.views, 1)) * 100}::numeric,
              'optimizedAt', NOW()
            )
          )
        `,
        isOptimized: true,
        updatedAt: sql`NOW()`
      })
      .where(
        and(
          eq(products.id, productId),
          eq(products.userId, userId)
        )
      );

    console.log(`[Conversion Tracking] Recorded baseline for product ${productId}:`, {
      views: baseline.views,
      conversions: baseline.conversions,
      conversionRate: ((baseline.conversions / Math.max(baseline.views, 1)) * 100).toFixed(2) + '%'
    });
  } catch (error) {
    console.error('[Conversion Tracking] Error recording optimization:', error);
    throw error;
  }
}

/**
 * Calculate conversion lift for an optimized product
 * Compares current performance against baseline
 */
export async function calculateConversionLift(
  userId: string,
  productId: string,
  current: {
    views: number;
    conversions: number;
    revenue: number;
  }
): Promise<ConversionLiftResult | null> {
  if (!db) {
    console.warn('[Conversion Tracking] Database not initialized');
    return null;
  }

  try {
    // Get product with baseline metrics
    const [product] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.userId, userId),
          eq(products.isOptimized, true)
        )
      );

    if (!product || !product.optimizedCopy) {
      console.warn('[Conversion Tracking] No baseline data found for product:', productId);
      return null;
    }

    const optimizedData = product.optimizedCopy as any;
    const metrics = optimizedData?.conversionMetrics;
    
    if (!metrics) {
      console.warn('[Conversion Tracking] No conversion metrics found for product:', productId);
      return null;
    }

    const baselineViews = metrics.baselineViews || 0;
    const baselineConversions = metrics.baselineConversions || 0;
    const baselineRevenue = parseFloat(metrics.baselineRevenue || '0');

    if (baselineViews === 0) {
      console.warn('[Conversion Tracking] Baseline views is 0, cannot calculate lift');
      return null;
    }

    // Calculate conversion rates
    const baselineConversionRate = (baselineConversions / baselineViews) * 100;
    const currentConversionRate = (current.conversions / Math.max(current.views, 1)) * 100;

    // Calculate lift
    const liftPercentage = ((currentConversionRate - baselineConversionRate) / Math.max(baselineConversionRate, 0.01)) * 100;

    // Calculate lift revenue (revenue that wouldn't have happened without optimization)
    // Formula: (current revenue) - (baseline conversion rate * current views * baseline avg order value)
    const baselineAvgOrderValue = baselineRevenue / Math.max(baselineConversions, 1);
    const expectedRevenueWithoutOptimization = (baselineConversionRate / 100) * current.views * baselineAvgOrderValue;
    const liftRevenue = Math.max(0, current.revenue - expectedRevenueWithoutOptimization);

    const result: ConversionLiftResult = {
      productId,
      baselineConversionRate,
      currentConversionRate,
      liftPercentage,
      liftRevenue
    };

    console.log(`[Conversion Tracking] Calculated lift for product ${productId}:`, {
      baseline: `${baselineConversionRate.toFixed(2)}%`,
      current: `${currentConversionRate.toFixed(2)}%`,
      lift: `${liftPercentage.toFixed(1)}%`,
      liftRevenue: `$${liftRevenue.toFixed(2)}`
    });

    return result;
  } catch (error) {
    console.error('[Conversion Tracking] Error calculating lift:', error);
    return null;
  }
}

/**
 * Attribute revenue lift to AI optimization
 * Creates a revenue attribution record for tracking
 */
export async function attributeConversionLift(
  userId: string,
  productId: string,
  liftRevenue: number,
  metadata?: Record<string, any>
): Promise<void> {
  if (!db) {
    console.warn('[Conversion Tracking] Database not initialized');
    return;
  }

  if (liftRevenue <= 0) {
    console.log('[Conversion Tracking] No positive lift revenue to attribute');
    return;
  }

  try {
    await db.insert(revenueAttribution).values({
      userId,
      source: 'ai_optimization',
      revenueAmount: liftRevenue.toString(),
      metadata: {
        productId,
        attributionMethod: 'conversion_lift',
        ...metadata
      }
    });

    console.log(`[Conversion Tracking] Attributed $${liftRevenue.toFixed(2)} to AI optimization for product ${productId}`);
  } catch (error) {
    console.error('[Conversion Tracking] Error attributing revenue:', error);
    throw error;
  }
}

/**
 * Track a product sale and calculate/attribute lift if optimized
 * This should be called when a sale is made
 */
export async function trackProductSale(
  userId: string,
  productId: string,
  saleAmount: number,
  currentMetrics: {
    totalViews: number;
    totalConversions: number;
    totalRevenue: number;
  }
): Promise<void> {
  if (!db) {
    console.warn('[Conversion Tracking] Database not initialized');
    return;
  }

  try {
    // Check if product is optimized
    const [product] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.userId, userId),
          eq(products.isOptimized, true)
        )
      );

    if (!product) {
      // Not an optimized product, no lift to track
      return;
    }

    // Calculate lift
    const lift = await calculateConversionLift(userId, productId, {
      views: currentMetrics.totalViews,
      conversions: currentMetrics.totalConversions,
      revenue: currentMetrics.totalRevenue
    });

    if (lift && lift.liftRevenue > 0) {
      // Attribute the lift revenue
      await attributeConversionLift(userId, productId, lift.liftRevenue, {
        saleAmount,
        liftPercentage: lift.liftPercentage,
        baselineConversionRate: lift.baselineConversionRate,
        currentConversionRate: lift.currentConversionRate
      });
    }
  } catch (error) {
    console.error('[Conversion Tracking] Error tracking product sale:', error);
  }
}

/**
 * Helper function to estimate conversion lift for all optimized products
 * Used when actual tracking data isn't available yet
 */
export async function estimateConversionLiftRevenue(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  if (!db) {
    console.warn('[Conversion Tracking] Database not initialized');
    return 0;
  }

  try {
    // Get optimized products count
    const optimizedProducts = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.userId, userId),
          eq(products.isOptimized, true)
        )
      );

    // Conservative estimation:
    // - 100 monthly visits per product (industry average for small e-commerce)
    // - 0.3% conversion lift (conservative for AI optimization)
    // - $45 average order value
    const monthlyVisitsPerProduct = 100;
    const conversionLiftPercentage = 0.003; // 0.3%
    const avgOrderValue = 45;

    const estimatedRevenue = optimizedProducts.length * 
                             monthlyVisitsPerProduct * 
                             conversionLiftPercentage * 
                             avgOrderValue;

    console.log(`[Conversion Tracking] Estimated lift revenue: $${estimatedRevenue.toFixed(2)} (${optimizedProducts.length} products)`);

    return estimatedRevenue;
  } catch (error) {
    console.error('[Conversion Tracking] Error estimating lift revenue:', error);
    return 0;
  }
}
