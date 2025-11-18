import { requireDb } from '../db';
import { products, competitorProducts, pricingRules, pricingSettings } from '@shared/schema';
import { eq, and, desc, sql, isNotNull } from 'drizzle-orm';

interface PricingDecision {
  shouldChangePrice: boolean;
  newPrice: string | null;
  reasoning: string;
  ruleId: string | null;
  competitorPrice: string | null;
  currentMargin: string | null;
  newMargin: string | null;
}

export class PricingRulesEngine {
  /**
   * Evaluate pricing rules for a single product
   */
  async evaluateProduct(productId: string, userId: string): Promise<PricingDecision> {
    try {
      const db = requireDb();

      // Get product details
      const [product] = await db
        .select()
        .from(products)
        .where(and(
          eq(products.id, productId),
          eq(products.userId, userId)
        ))
        .limit(1);

      if (!product) {
        return {
          shouldChangePrice: false,
          newPrice: null,
          reasoning: 'Product not found',
          ruleId: null,
          competitorPrice: null,
          currentMargin: null,
          newMargin: null,
        };
      }

      // Get competitor products for this product (matched competitors)
      const competitors = await db
        .select()
        .from(competitorProducts)
        .where(and(
          eq(competitorProducts.productId, productId),
          eq(competitorProducts.userId, userId),
          isNotNull(competitorProducts.currentPrice)
        ));

      if (competitors.length === 0) {
        return {
          shouldChangePrice: false,
          newPrice: null,
          reasoning: 'No competitor data available',
          ruleId: null,
          competitorPrice: null,
          currentMargin: null,
          newMargin: null,
        };
      }

      // Get pricing settings
      const [settings] = await db
        .select()
        .from(pricingSettings)
        .where(eq(pricingSettings.userId, userId))
        .limit(1);

      // Get active pricing rules sorted by priority
      const rules = await db
        .select()
        .from(pricingRules)
        .where(and(
          eq(pricingRules.userId, userId),
          eq(pricingRules.enabled, true)
        ))
        .orderBy(desc(pricingRules.priority));

      if (rules.length === 0) {
        return {
          shouldChangePrice: false,
          newPrice: null,
          reasoning: 'No active pricing rules configured',
          ruleId: null,
          competitorPrice: null,
          currentMargin: null,
          newMargin: null,
        };
      }

      // Find the best (lowest) competitor price
      const lowestCompetitor = competitors.reduce((prev, current) => {
        const prevPrice = parseFloat(prev.currentPrice || '0');
        const currentPrice = parseFloat(current.currentPrice || '0');
        return currentPrice < prevPrice && currentPrice > 0 ? current : prev;
      });

      const competitorPrice = parseFloat(lowestCompetitor.currentPrice || '0');
      const currentPrice = parseFloat(product.price);

      if (competitorPrice === 0) {
        return {
          shouldChangePrice: false,
          newPrice: null,
          reasoning: 'Invalid competitor price',
          ruleId: null,
          competitorPrice: lowestCompetitor.currentPrice,
          currentMargin: null,
          newMargin: null,
        };
      }

      // Evaluate each rule in priority order
      for (const rule of rules) {
        const decision = this.evaluateRule(
          rule,
          currentPrice,
          competitorPrice,
          settings
        );

        if (decision.shouldChangePrice) {
          return {
            ...decision,
            ruleId: rule.id,
            competitorPrice: lowestCompetitor.currentPrice,
          };
        }
      }

      return {
        shouldChangePrice: false,
        newPrice: null,
        reasoning: 'No rules triggered price change',
        ruleId: null,
        competitorPrice: lowestCompetitor.currentPrice,
        currentMargin: null,
        newMargin: null,
      };
    } catch (error) {
      console.error('[Pricing Rules Engine] Error evaluating product:', error);
      return {
        shouldChangePrice: false,
        newPrice: null,
        reasoning: 'Error evaluating product',
        ruleId: null,
        competitorPrice: null,
        currentMargin: null,
        newMargin: null,
      };
    }
  }

  /**
   * Evaluate a single pricing rule
   */
  private evaluateRule(
    rule: any,
    currentPrice: number,
    competitorPrice: number,
    settings: any
  ): PricingDecision {
    const conditions = rule.conditions as any;
    const actions = rule.actions as any;

    // Evaluate conditions
    let conditionsMet = false;

    switch (rule.ruleName.toLowerCase()) {
      case 'match competitor price':
        conditionsMet = this.evaluateMatchCondition(conditions, currentPrice, competitorPrice);
        break;

      case 'beat competitor by percentage':
        conditionsMet = this.evaluateBeatCondition(conditions, currentPrice, competitorPrice);
        break;

      case 'maintain minimum margin':
        conditionsMet = this.evaluateMarginCondition(conditions, currentPrice, competitorPrice);
        break;

      default:
        // Custom rule evaluation
        conditionsMet = this.evaluateCustomCondition(conditions, currentPrice, competitorPrice);
        break;
    }

    if (!conditionsMet) {
      return {
        shouldChangePrice: false,
        newPrice: null,
        reasoning: 'Conditions not met',
        ruleId: null,
        competitorPrice: null,
        currentMargin: null,
        newMargin: null,
      };
    }

    // Execute action to calculate new price
    const newPrice = this.calculateNewPrice(
      actions,
      currentPrice,
      competitorPrice,
      settings
    );

    if (!newPrice || newPrice === currentPrice) {
      return {
        shouldChangePrice: false,
        newPrice: null,
        reasoning: 'Calculated price equals current price',
        ruleId: null,
        competitorPrice: null,
        currentMargin: null,
        newMargin: null,
      };
    }

    const currentMargin = ((currentPrice - competitorPrice) / currentPrice * 100).toFixed(2);
    const newMargin = ((newPrice - competitorPrice) / newPrice * 100).toFixed(2);

    return {
      shouldChangePrice: true,
      newPrice: newPrice.toFixed(2),
      reasoning: `Rule "${rule.ruleName}" triggered: ${actions.strategy}`,
      ruleId: null, // Set by caller
      competitorPrice: null, // Set by caller
      currentMargin,
      newMargin,
    };
  }

  /**
   * Evaluate match competitor condition
   */
  private evaluateMatchCondition(conditions: any, currentPrice: number, competitorPrice: number): boolean {
    const priceDifference = Math.abs(currentPrice - competitorPrice);
    const percentageDifference = (priceDifference / currentPrice) * 100;
    
    // Trigger if our price is more than 5% different from competitor
    return percentageDifference > 5;
  }

  /**
   * Evaluate beat competitor condition
   */
  private evaluateBeatCondition(conditions: any, currentPrice: number, competitorPrice: number): boolean {
    // Trigger if competitor is cheaper than us
    return competitorPrice < currentPrice;
  }

  /**
   * Evaluate margin condition
   */
  private evaluateMarginCondition(conditions: any, currentPrice: number, competitorPrice: number): boolean {
    const minMarginPercent = parseFloat(conditions.minMarginPercent || '0');
    const currentMargin = ((currentPrice - competitorPrice) / currentPrice) * 100;
    
    // Trigger if current margin is below minimum
    return currentMargin < minMarginPercent;
  }

  /**
   * Evaluate custom condition
   */
  private evaluateCustomCondition(conditions: any, currentPrice: number, competitorPrice: number): boolean {
    // Generic evaluation for custom rules
    if (conditions.priceCompare) {
      switch (conditions.priceCompare) {
        case 'higher':
          return currentPrice > competitorPrice;
        case 'lower':
          return currentPrice < competitorPrice;
        case 'equal':
          return Math.abs(currentPrice - competitorPrice) < 0.01;
        default:
          return false;
      }
    }
    return false;
  }

  /**
   * Calculate new price based on action
   */
  private calculateNewPrice(
    actions: any,
    currentPrice: number,
    competitorPrice: number,
    settings: any
  ): number | null {
    let newPrice: number;

    switch (actions.strategy) {
      case 'match':
        newPrice = competitorPrice;
        break;

      case 'beat_by_percent':
        const beatPercent = parseFloat(actions.beatByPercent || '5');
        newPrice = competitorPrice * (1 - beatPercent / 100);
        break;

      case 'beat_by_amount':
        const beatAmount = parseFloat(actions.beatByAmount || '0');
        newPrice = competitorPrice - beatAmount;
        break;

      case 'maintain_margin':
        const marginPercent = parseFloat(actions.marginPercent || '10');
        // Price = Cost / (1 - Margin%)
        // Assuming competitor price is our cost for simplicity
        newPrice = competitorPrice / (1 - marginPercent / 100);
        break;

      default:
        return null;
    }

    // Apply bounds from settings
    if (settings) {
      const globalMinMargin = parseFloat(settings.globalMinMargin || '10');
      const globalMaxDiscount = parseFloat(settings.globalMaxDiscount || '30');

      // Enforce minimum margin
      const minPrice = competitorPrice / (1 - globalMinMargin / 100);
      if (newPrice < minPrice) {
        newPrice = minPrice;
      }

      // Enforce maximum discount
      const maxDiscount = currentPrice * (globalMaxDiscount / 100);
      const minPriceDiscount = currentPrice - maxDiscount;
      if (newPrice < minPriceDiscount) {
        newPrice = minPriceDiscount;
      }
    }

    return newPrice;
  }

  /**
   * Evaluate all products for a user and return decisions
   */
  async evaluateAllProducts(userId: string): Promise<Array<{ productId: string; decision: PricingDecision }>> {
    try {
      const db = requireDb();

      // Get all products with matched competitors
      const productsWithCompetitors = await db
        .select({
          productId: products.id,
          productName: products.name,
        })
        .from(products)
        .innerJoin(
          competitorProducts,
          and(
            eq(competitorProducts.productId, products.id),
            isNotNull(competitorProducts.currentPrice)
          )
        )
        .where(eq(products.userId, userId));

      // Remove duplicates
      const uniqueProducts = Array.from(
        new Map(productsWithCompetitors.map(p => [p.productId, p])).values()
      );

      console.log(`[Pricing Rules Engine] Evaluating ${uniqueProducts.length} products for user ${userId}`);

      const results = [];
      for (const product of uniqueProducts) {
        const decision = await this.evaluateProduct(product.productId, userId);
        if (decision.shouldChangePrice) {
          results.push({
            productId: product.productId,
            decision,
          });
        }
      }

      console.log(`[Pricing Rules Engine] Found ${results.length} products requiring price changes`);
      return results;
    } catch (error) {
      console.error('[Pricing Rules Engine] Error evaluating all products:', error);
      return [];
    }
  }
}

// Export singleton instance
export const pricingRulesEngine = new PricingRulesEngine();
