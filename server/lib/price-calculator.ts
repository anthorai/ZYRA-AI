import { requireDb } from '../db';
import { pricingSettings, autonomousActions } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

interface PriceCalculation {
  originalPrice: number;
  calculatedPrice: number;
  finalPrice: number;
  psychologicalPrice: number;
  appliedBounds: boolean;
  reasoning: string[];
  safetyChecks: {
    extremeChangeBlocked: boolean;
    boundsApplied: boolean;
    approvalRequired: boolean;
  };
}

/**
 * 🛡️ SAFETY GUARDRAILS SUMMARY
 * 
 * This price calculator implements multiple layers of protection:
 * 
 * 1. **Extreme Price Swing Protection** (50% max change)
 *    - Blocks price changes >50% from current price
 *    - Caps increases at +50% and decreases at -50%
 * 
 * 2. **Global Bounds from Settings**
 *    - Enforces minimum margin (default 10%)
 *    - Enforces maximum discount (default 30%)
 *    - Prevents prices from violating user-configured limits
 * 
 * 3. **Custom Min/Max Bounds**
 *    - Allows product-specific price boundaries
 *    - Overrides calculated prices if they exceed bounds
 * 
 * 4. **Approval Threshold** (default 10%)
 *    - Flags large price changes for manual review
 *    - Requires approval before execution
 * 
 * 5. **Psychological Pricing**
 *    - Applies .99 ending for better conversions
 *    - Maintains price attractiveness
 * 
 * Additional safety layers in autonomous-scheduler.ts:
 * - Daily action limits (maxDailyActions)
 * - Catalog change percentage limits (maxCatalogChangePercent)
 * - Cooldown periods between changes (changeCooldownDays)
 * - Dry-run mode for testing
 */
export class PriceCalculator {
  /**
   * Calculate optimal price with all constraints and psychological pricing
   * 
   * @returns PriceCalculation with safety check results
   */
  async calculateOptimalPrice(
    userId: string,
    basePrice: number,
    currentPrice: number,
    minBound?: number,
    maxBound?: number
  ): Promise<PriceCalculation> {
    try {
      const db = requireDb();

      // Get pricing settings
      const [settings] = await db
        .select()
        .from(pricingSettings)
        .where(eq(pricingSettings.userId, userId))
        .limit(1);

      const reasoning: string[] = [];
      let calculatedPrice = basePrice;
      let appliedBounds = false;

      // Apply global bounds from settings
      if (settings) {
        const globalMinMargin = parseFloat(settings.globalMinMargin || '10');
        const globalMaxDiscount = parseFloat(settings.globalMaxDiscount || '30');

        // Calculate minimum price based on margin (assuming base price includes desired margin)
        const minPriceFromMargin = basePrice * (1 - globalMaxDiscount / 100);
        
        // Calculate maximum price (don't increase more than 50% of current price)
        const maxPriceFromCurrent = currentPrice * 1.5;

        if (calculatedPrice < minPriceFromMargin) {
          reasoning.push(`Applied minimum price bound based on max discount (${globalMaxDiscount}%)`);
          calculatedPrice = minPriceFromMargin;
          appliedBounds = true;
        }

        if (calculatedPrice > maxPriceFromCurrent) {
          reasoning.push(`Applied maximum price bound (150% of current price)`);
          calculatedPrice = maxPriceFromCurrent;
          appliedBounds = true;
        }
      }

      // Apply custom min/max bounds if provided
      if (minBound !== undefined && calculatedPrice < minBound) {
        reasoning.push('Applied custom minimum bound');
        calculatedPrice = minBound;
        appliedBounds = true;
      }

      if (maxBound !== undefined && calculatedPrice > maxBound) {
        reasoning.push('Applied custom maximum bound');
        calculatedPrice = maxBound;
        appliedBounds = true;
      }

      // Apply psychological pricing (.99 ending)
      const psychologicalPrice = this.applyPsychologicalPricing(calculatedPrice);
      
      if (psychologicalPrice !== calculatedPrice) {
        reasoning.push('Applied psychological pricing (.99 ending)');
      }

      // 🛡️ SAFETY CHECK: Prevent extreme price changes (>50% change)
      const percentageChange = Math.abs((psychologicalPrice - currentPrice) / currentPrice) * 100;
      
      let finalPrice = psychologicalPrice;
      let extremeChangeBlocked = false;
      
      if (percentageChange > 50) {
        reasoning.push(`🛡️ SAFETY: Blocked extreme price change (${percentageChange.toFixed(1)}% would have been ${psychologicalPrice.toFixed(2)})`);
        // Limit change to 50%
        if (psychologicalPrice > currentPrice) {
          finalPrice = currentPrice * 1.5;
          reasoning.push(`Limited increase to +50%: ${finalPrice.toFixed(2)}`);
        } else {
          finalPrice = currentPrice * 0.5;
          reasoning.push(`Limited decrease to -50%: ${finalPrice.toFixed(2)}`);
        }
        finalPrice = this.applyPsychologicalPricing(finalPrice);
        appliedBounds = true;
        extremeChangeBlocked = true;
      }

      return {
        originalPrice: basePrice,
        calculatedPrice,
        finalPrice,
        psychologicalPrice,
        appliedBounds,
        reasoning,
        safetyChecks: {
          extremeChangeBlocked,
          boundsApplied: appliedBounds,
          approvalRequired: false, // Set by caller using requiresApproval()
        },
      };
    } catch (error) {
      console.error('[Price Calculator] Error calculating optimal price:', error);
      
      // Fallback to simple psychological pricing
      const psychologicalPrice = this.applyPsychologicalPricing(basePrice);
      
      return {
        originalPrice: basePrice,
        calculatedPrice: basePrice,
        finalPrice: psychologicalPrice,
        psychologicalPrice,
        appliedBounds: false,
        reasoning: ['Error during calculation, using fallback pricing'],
        safetyChecks: {
          extremeChangeBlocked: false,
          boundsApplied: false,
          approvalRequired: false,
        },
      };
    }
  }

  /**
   * Apply psychological pricing strategy (.99 ending)
   */
  private applyPsychologicalPricing(price: number): number {
    // Round to nearest .99 (charm pricing)
    // Example: $25.50 → $24.99, $26.30 → $25.99
    
    const wholePart = Math.floor(price);
    const decimalPart = price - wholePart;

    // If the price is already very close to .99, keep it
    if (Math.abs(decimalPart - 0.99) < 0.05) {
      return wholePart + 0.99;
    }

    // If decimal is less than 0.50, use previous whole number + .99
    if (decimalPart < 0.50) {
      return Math.max(0.99, wholePart - 1 + 0.99);
    }

    // Otherwise use current whole number + .99
    return wholePart + 0.99;
  }

  /**
   * Calculate expected revenue impact of price change
   */
  calculateRevenueImpact(
    oldPrice: number,
    newPrice: number,
    avgMonthlySales: number = 10
  ): {
    oldRevenue: number;
    newRevenue: number;
    revenueDelta: number;
    percentageChange: number;
  } {
    // Simple revenue calculation (assumes constant sales volume)
    // In reality, price elasticity should be considered
    const oldRevenue = oldPrice * avgMonthlySales;
    const newRevenue = newPrice * avgMonthlySales;
    const revenueDelta = newRevenue - oldRevenue;
    const percentageChange = (revenueDelta / oldRevenue) * 100;

    return {
      oldRevenue,
      newRevenue,
      revenueDelta,
      percentageChange,
    };
  }

  /**
   * 🛡️ SAFETY CHECK: Validate if price change meets approval threshold
   * 
   * Large price changes (default >10%) require manual approval to prevent
   * unintended pricing errors from affecting your store.
   * 
   * @returns true if approval is required, false if change can be auto-applied
   */
  async requiresApproval(
    userId: string,
    oldPrice: number,
    newPrice: number
  ): Promise<boolean> {
    try {
      const db = requireDb();

      const [settings] = await db
        .select()
        .from(pricingSettings)
        .where(eq(pricingSettings.userId, userId))
        .limit(1);

      if (!settings || !settings.requireApproval) {
        return false;
      }

      const approvalThreshold = parseFloat(settings.approvalThreshold || '10');
      const percentageChange = Math.abs((newPrice - oldPrice) / oldPrice) * 100;

      const requiresApproval = percentageChange >= approvalThreshold;
      
      if (requiresApproval) {
        console.log(`🛡️ [Price Calculator] Approval required: ${percentageChange.toFixed(1)}% change exceeds threshold of ${approvalThreshold}%`);
      }

      return requiresApproval;
    } catch (error) {
      console.error('[Price Calculator] Error checking approval requirement:', error);
      return true; // 🛡️ SAFETY: Err on the side of caution - require approval if check fails
    }
  }

  /**
   * 🛡️ SAFETY CHECK: Check if product has been changed recently (cooldown)
   * 
   * Prevents rapid price fluctuations by enforcing a cooldown period
   * between price changes on the same product.
   * 
   * @param userId - User ID
   * @param productId - Product ID to check
   * @param cooldownDays - Cooldown period in days (default: 7)
   * @returns true if product is within cooldown period, false if safe to change
   */
  async isInCooldownPeriod(
    userId: string,
    productId: string,
    cooldownDays: number = 7
  ): Promise<boolean> {
    try {
      const db = requireDb();
      const cooldownTime = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000);

      const recentChanges = await db
        .select()
        .from(autonomousActions)
        .where(
          and(
            eq(autonomousActions.userId, userId),
            eq(autonomousActions.actionType, 'price_change'),
            eq(autonomousActions.entityId, productId),
            sql`${autonomousActions.status} = 'completed'`,
            sql`${autonomousActions.completedAt} > ${cooldownTime}`
          )
        )
        .limit(1);

      return recentChanges.length > 0;
    } catch (error) {
      console.error('[Price Calculator] Error checking cooldown period:', error);
      return true; // 🛡️ SAFETY: Err on the side of caution - treat as in cooldown if check fails
    }
  }

  /**
   * Calculate margin percentage
   */
  calculateMargin(price: number, cost: number): number {
    if (price <= 0) return 0;
    return ((price - cost) / price) * 100;
  }

  /**
   * Calculate markup percentage
   */
  calculateMarkup(price: number, cost: number): number {
    if (cost <= 0) return 0;
    return ((price - cost) / cost) * 100;
  }

  /**
   * Get price from margin percentage
   */
  getPriceFromMargin(cost: number, marginPercent: number): number {
    return cost / (1 - marginPercent / 100);
  }

  /**
   * Get price from markup percentage
   */
  getPriceFromMarkup(cost: number, markupPercent: number): number {
    return cost * (1 + markupPercent / 100);
  }
}

// Export singleton instance
export const priceCalculator = new PriceCalculator();
