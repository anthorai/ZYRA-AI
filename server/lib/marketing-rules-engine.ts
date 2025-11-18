import { requireDb } from "../db";
import { and, eq, desc, gte, sql, isNotNull, or, lt } from "drizzle-orm";
import { 
  marketingAutomationRules,
  abandonedCarts,
  campaignEvents,
  campaigns,
  customerEngagementHistory,
  sendTimePreferences,
  autonomousActions,
} from "@shared/schema";

/**
 * Marketing Rules Engine
 * Evaluates marketing automation rules to determine when to auto-send campaigns
 */

export interface MarketingDecision {
  shouldSendCampaign: boolean;
  reason: string;
  ruleId: string | null;
  campaignTemplateId: string | null;
  channels: string[];
  customerEmail: string | null;
  metadata?: any;
}

export interface CustomerContext {
  email: string;
  userId: string;
  engagementScore?: number;
  segment?: string;
  lastOpenDate?: Date | null;
  lastClickDate?: Date | null;
  lastPurchaseDate?: Date | null;
  cartValue?: number;
  cartAbandonedAt?: Date;
}

export class MarketingRulesEngine {
  /**
   * Evaluate a customer against active marketing automation rules
   */
  async evaluateCustomer(customerEmail: string, userId: string, context?: Partial<CustomerContext>): Promise<MarketingDecision> {
    try {
      const db = requireDb();

      // Get customer engagement data
      const [engagement] = await db
        .select()
        .from(customerEngagementHistory)
        .where(and(
          eq(customerEngagementHistory.customerEmail, customerEmail),
          eq(customerEngagementHistory.userId, userId)
        ))
        .limit(1);

      const customerContext: CustomerContext = {
        email: customerEmail,
        userId,
        engagementScore: engagement?.engagementScore,
        segment: engagement?.segment || 'warm',
        lastOpenDate: engagement?.lastOpenDate,
        lastClickDate: engagement?.lastClickDate,
        lastPurchaseDate: engagement?.lastPurchaseDate,
        ...context,
      };

      // Get active marketing automation rules sorted by priority
      const rules = await db
        .select()
        .from(marketingAutomationRules)
        .where(and(
          or(
            eq(marketingAutomationRules.userId, userId),
            sql`${marketingAutomationRules.userId} IS NULL` // Global presets
          ),
          eq(marketingAutomationRules.enabled, true)
        ))
        .orderBy(desc(marketingAutomationRules.priority));

      console.log(`[Marketing Rules Engine] Evaluating ${rules.length} rules for customer ${customerEmail}`);

      // Evaluate each rule in priority order
      for (const rule of rules) {
        // Check cooldown
        const cooldownActive = await this.checkCooldown(rule.id, customerEmail, rule.cooldownSeconds || 86400);
        if (cooldownActive) {
          console.log(`[Marketing Rules Engine] Rule ${rule.name} skipped - customer in cooldown`);
          continue;
        }

        // Check daily action limit
        const limitReached = await this.checkDailyLimit(rule.id, userId, rule.maxActionsPerDay || 10);
        if (limitReached) {
          console.log(`[Marketing Rules Engine] Rule ${rule.name} skipped - daily limit reached`);
          continue;
        }

        // Evaluate rule conditions
        const decision = await this.evaluateRule(rule, customerContext);

        if (decision.shouldSendCampaign) {
          console.log(`[Marketing Rules Engine] Rule ${rule.name} triggered for ${customerEmail}`);
          // Ensure channels is a non-empty array
          const channels = Array.isArray(rule.channels) && rule.channels.length > 0
            ? rule.channels
            : ['email'];
          
          return {
            ...decision,
            ruleId: rule.id,
            campaignTemplateId: rule.campaignTemplateId,
            channels,
            customerEmail,
            metadata: {
              ...decision.metadata,
              triggerType: rule.triggerType,
              context: customerContext,
            },
          };
        }
      }

      // No rules triggered
      return {
        shouldSendCampaign: false,
        reason: 'No marketing automation rules triggered',
        ruleId: null,
        campaignTemplateId: null,
        channels: [],
        customerEmail,
      };
    } catch (error) {
      console.error('[Marketing Rules Engine] Error evaluating customer:', error);
      return {
        shouldSendCampaign: false,
        reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ruleId: null,
        campaignTemplateId: null,
        channels: [],
        customerEmail,
      };
    }
  }

  /**
   * Evaluate a single marketing rule
   */
  private async evaluateRule(rule: any, context: CustomerContext): Promise<MarketingDecision> {
    const conditions = rule.conditions as any;
    let conditionsMet = false;
    let reason = '';

    // Evaluate based on trigger type
    switch (rule.triggerType) {
      case 'cart_abandoned':
        ({ conditionsMet, reason } = await this.evaluateCartAbandonedTrigger(conditions, context));
        break;

      case 'inactive_customer':
        ({ conditionsMet, reason } = this.evaluateInactiveCustomerTrigger(conditions, context));
        break;

      case 'purchase_anniversary':
        ({ conditionsMet, reason } = this.evaluatePurchaseAnniversaryTrigger(conditions, context));
        break;

      case 'product_view':
        ({ conditionsMet, reason } = this.evaluateProductViewTrigger(conditions, context));
        break;

      case 'low_stock':
        ({ conditionsMet, reason } = await this.evaluateLowStockTrigger(conditions, context));
        break;

      case 'price_drop':
        ({ conditionsMet, reason } = await this.evaluatePriceDropTrigger(conditions, context));
        break;

      case 'new_arrival':
        ({ conditionsMet, reason } = await this.evaluateNewArrivalTrigger(conditions, context));
        break;

      case 'custom':
        ({ conditionsMet, reason } = this.evaluateCustomTrigger(conditions, context));
        break;

      default:
        return {
          shouldSendCampaign: false,
          reason: `Unknown trigger type: ${rule.triggerType}`,
          ruleId: null,
          campaignTemplateId: null,
          channels: [],
          customerEmail: context.email,
        };
    }

    return {
      shouldSendCampaign: conditionsMet,
      reason,
      ruleId: rule.id,
      campaignTemplateId: rule.campaignTemplateId,
      channels: rule.channels || ['email'],
      customerEmail: context.email,
      metadata: {
        triggerType: rule.triggerType,
        conditions,
        context,
      },
    };
  }

  /**
   * Check if customer is in cooldown period for a rule
   */
  private async checkCooldown(ruleId: string, customerEmail: string, cooldownSeconds: number): Promise<boolean> {
    try {
      const db = requireDb();
      const cooldownDate = new Date(Date.now() - cooldownSeconds * 1000);

      const [recentAction] = await db
        .select()
        .from(autonomousActions)
        .where(and(
          eq(autonomousActions.actionType, 'send_marketing_campaign'),
          sql`${autonomousActions.payload}->>'ruleId' = ${ruleId}`,
          sql`${autonomousActions.payload}->>'customerEmail' = ${customerEmail}`,
          gte(autonomousActions.createdAt, cooldownDate)
        ))
        .limit(1);

      return !!recentAction;
    } catch (error) {
      console.error('[Marketing Rules Engine] Error checking cooldown:', error);
      return false; // Fail open - allow campaign if check fails
    }
  }

  /**
   * Check if daily action limit has been reached for a rule
   */
  private async checkDailyLimit(ruleId: string, userId: string, maxActionsPerDay: number): Promise<boolean> {
    try {
      const db = requireDb();
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const actionCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(autonomousActions)
        .where(and(
          eq(autonomousActions.userId, userId),
          eq(autonomousActions.actionType, 'send_marketing_campaign'),
          sql`${autonomousActions.payload}->>'ruleId' = ${ruleId}`,
          gte(autonomousActions.createdAt, startOfDay)
        ));

      const count = Number(actionCount[0]?.count || 0);
      return count >= maxActionsPerDay;
    } catch (error) {
      console.error('[Marketing Rules Engine] Error checking daily limit:', error);
      return false; // Fail open - allow campaign if check fails
    }
  }

  /**
   * Evaluate cart abandoned trigger
   */
  private async evaluateCartAbandonedTrigger(
    conditions: any,
    context: CustomerContext
  ): Promise<{ conditionsMet: boolean; reason: string }> {
    if (!context.cartAbandonedAt) {
      return { conditionsMet: false, reason: 'No abandoned cart found' };
    }

    const hoursAgo = (Date.now() - context.cartAbandonedAt.getTime()) / (1000 * 60 * 60);
    const minHours = conditions.minHoursAbandoned || 1;
    const maxHours = conditions.maxHoursAbandoned || 72;
    const minCartValue = conditions.minCartValue || 0;

    // Check time window
    if (hoursAgo < minHours) {
      return { conditionsMet: false, reason: `Cart abandoned too recently (${hoursAgo.toFixed(1)}h < ${minHours}h)` };
    }

    if (hoursAgo > maxHours) {
      return { conditionsMet: false, reason: `Cart abandoned too long ago (${hoursAgo.toFixed(1)}h > ${maxHours}h)` };
    }

    // Check cart value
    if (context.cartValue && context.cartValue < minCartValue) {
      return { conditionsMet: false, reason: `Cart value too low ($${context.cartValue} < $${minCartValue})` };
    }

    return {
      conditionsMet: true,
      reason: `Cart abandoned ${hoursAgo.toFixed(1)}h ago with value $${context.cartValue || 0}`,
    };
  }

  /**
   * Evaluate inactive customer trigger
   */
  private evaluateInactiveCustomerTrigger(
    conditions: any,
    context: CustomerContext
  ): { conditionsMet: boolean; reason: string } {
    const daysInactive = conditions.daysInactive || 30;
    const targetSegment = conditions.segment || 'cold';

    // Check segment match
    if (context.segment !== targetSegment && targetSegment !== 'all') {
      return { conditionsMet: false, reason: `Customer segment ${context.segment} doesn't match target ${targetSegment}` };
    }

    // Check last activity
    const lastActivity = context.lastOpenDate || context.lastClickDate || context.lastPurchaseDate;
    if (!lastActivity) {
      return { conditionsMet: true, reason: 'Customer has no recorded activity' };
    }

    const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActivity >= daysInactive) {
      return {
        conditionsMet: true,
        reason: `Customer inactive for ${daysSinceActivity.toFixed(0)} days (threshold: ${daysInactive})`,
      };
    }

    return {
      conditionsMet: false,
      reason: `Customer active ${daysSinceActivity.toFixed(0)} days ago (threshold: ${daysInactive})`,
    };
  }

  /**
   * Evaluate purchase anniversary trigger
   */
  private evaluatePurchaseAnniversaryTrigger(
    conditions: any,
    context: CustomerContext
  ): { conditionsMet: boolean; reason: string } {
    if (!context.lastPurchaseDate) {
      return { conditionsMet: false, reason: 'No purchase history found' };
    }

    const daysSincePurchase = (Date.now() - context.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24);
    const anniversaryDays = conditions.anniversaryDays || 365;
    const windowDays = conditions.windowDays || 7; // Send within ±7 days of anniversary

    const daysDifference = Math.abs(daysSincePurchase - anniversaryDays);

    if (daysDifference <= windowDays) {
      return {
        conditionsMet: true,
        reason: `Purchase anniversary approaching (${daysSincePurchase.toFixed(0)} days since last purchase)`,
      };
    }

    return {
      conditionsMet: false,
      reason: `Not near purchase anniversary (${daysSincePurchase.toFixed(0)} days, target: ${anniversaryDays}±${windowDays})`,
    };
  }

  /**
   * Evaluate product view trigger
   */
  private evaluateProductViewTrigger(
    conditions: any,
    context: CustomerContext
  ): { conditionsMet: boolean; reason: string } {
    // This would require product view tracking data
    // For now, return false - to be implemented with product view tracking
    return {
      conditionsMet: false,
      reason: 'Product view tracking not yet implemented',
    };
  }

  /**
   * Evaluate low stock trigger
   */
  private async evaluateLowStockTrigger(
    conditions: any,
    context: CustomerContext
  ): Promise<{ conditionsMet: boolean; reason: string }> {
    // This would require checking product stock levels
    // For now, return false - to be implemented with inventory tracking
    return {
      conditionsMet: false,
      reason: 'Low stock alerts not yet implemented',
    };
  }

  /**
   * Evaluate price drop trigger
   */
  private async evaluatePriceDropTrigger(
    conditions: any,
    context: CustomerContext
  ): Promise<{ conditionsMet: boolean; reason: string }> {
    // This would require tracking product price changes and customer wishlists
    // For now, return false - to be implemented with price tracking
    return {
      conditionsMet: false,
      reason: 'Price drop alerts not yet implemented',
    };
  }

  /**
   * Evaluate new arrival trigger
   */
  private async evaluateNewArrivalTrigger(
    conditions: any,
    context: CustomerContext
  ): Promise<{ conditionsMet: boolean; reason: string }> {
    // This would require tracking new product arrivals and customer preferences
    // For now, return false - to be implemented with new product tracking
    return {
      conditionsMet: false,
      reason: 'New arrival notifications not yet implemented',
    };
  }

  /**
   * Evaluate custom trigger conditions
   */
  private evaluateCustomTrigger(
    conditions: any,
    context: CustomerContext
  ): { conditionsMet: boolean; reason: string } {
    // Generic evaluation for custom rules
    let allConditionsMet = true;
    const reasons: string[] = [];

    // Check engagement score threshold
    if (conditions.minEngagementScore !== undefined) {
      if (!context.engagementScore || context.engagementScore < conditions.minEngagementScore) {
        allConditionsMet = false;
        reasons.push(`Engagement score too low (${context.engagementScore || 0} < ${conditions.minEngagementScore})`);
      }
    }

    // Check segment
    if (conditions.targetSegment && context.segment !== conditions.targetSegment) {
      allConditionsMet = false;
      reasons.push(`Segment mismatch (${context.segment} !== ${conditions.targetSegment})`);
    }

    // Check time-based conditions
    if (conditions.daysSinceLastEmail !== undefined) {
      // Would need to check campaign events - placeholder for now
      reasons.push('Time-based conditions require campaign event tracking');
    }

    if (allConditionsMet) {
      return { conditionsMet: true, reason: 'All custom conditions met' };
    }

    return { conditionsMet: false, reason: reasons.join('; ') || 'Custom conditions not met' };
  }

  /**
   * Evaluate all eligible customers for a user
   */
  async evaluateAllCustomers(userId: string): Promise<Array<{ customerEmail: string; decision: MarketingDecision }>> {
    try {
      const db = requireDb();

      // Get all unique customer emails from engagement history and abandoned carts
      const engagementCustomers = await db
        .select({ email: customerEngagementHistory.customerEmail })
        .from(customerEngagementHistory)
        .where(eq(customerEngagementHistory.userId, userId));

      const cartCustomers = await db
        .select({
          email: abandonedCarts.customerEmail,
          cartValue: abandonedCarts.cartValue,
          abandonedAt: abandonedCarts.abandonedAt,
          cartId: abandonedCarts.id,
        })
        .from(abandonedCarts)
        .where(and(
          eq(abandonedCarts.userId, userId),
          eq(abandonedCarts.status, 'abandoned')
        ));

      // Combine and deduplicate with cart context
      const allEmails = [
        ...engagementCustomers.map((c: { email: string }) => c.email),
        ...cartCustomers.filter((c: { email: string | null }) => c.email).map((c: { email: string | null }) => c.email!),
      ];
      const uniqueEmails = Array.from(new Set(allEmails));

      // Create a map of cart data by email for quick lookup
      const cartDataMap = new Map();
      cartCustomers.forEach((cart: any) => {
        if (cart.email) {
          cartDataMap.set(cart.email, {
            cartValue: cart.cartValue ? parseFloat(cart.cartValue) : 0,
            cartAbandonedAt: cart.abandonedAt,
            cartId: cart.cartId,
          });
        }
      });

      console.log(`[Marketing Rules Engine] Evaluating ${uniqueEmails.length} customers for user ${userId}`);

      const results = [];
      for (const email of uniqueEmails) {
        // Get cart context if available
        const cartContext = cartDataMap.get(email) || {};
        
        // Evaluate customer with cart context
        const decision = await this.evaluateCustomer(email, userId, cartContext);
        
        if (decision.shouldSendCampaign) {
          results.push({
            customerEmail: email,
            decision,
          });
        }
      }

      console.log(`[Marketing Rules Engine] Found ${results.length} customers requiring campaigns`);
      return results;
    } catch (error) {
      console.error('[Marketing Rules Engine] Error evaluating all customers:', error);
      return [];
    }
  }
}

// Export singleton instance
export const marketingRulesEngine = new MarketingRulesEngine();
