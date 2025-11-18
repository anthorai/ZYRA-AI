/**
 * Approval Safety Validator - Preflight safety checks for manual approvals
 * 
 * Before executing an approved action, this module validates that it doesn't violate
 * any of the safety guardrails that autonomous schedulers enforce:
 * - Daily action limits
 * - Catalog change percentage limits
 * - Frequency caps (for marketing/cart recovery)
 * - Per-rule budgets
 * - Cooldown periods
 * - Quiet hours
 * - Unsubscribe status
 * - GDPR consent
 */

import { requireDb } from '../db';
import { automationSettings, autonomousActions, autonomousRules } from '@shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export interface SafetyValidationResult {
  allowed: boolean;
  reason?: string;
  violationType?: string;
}

/**
 * Validate an approval against all applicable safety guardrails
 */
export async function validateApproval(
  userId: string,
  actionType: string,
  actionPayload: any
): Promise<SafetyValidationResult> {
  
  // Route to appropriate validator based on action type
  switch (actionType) {
    case 'optimize_seo':
      return await validateSEOAction(userId, actionPayload);
      
    case 'adjust_price':
      return await validatePricingAction(userId, actionPayload);
      
    case 'send_campaign':
    case 'send_ab_test':
      return await validateMarketingAction(userId, actionPayload);
      
    case 'send_cart_recovery':
      return await validateCartRecoveryAction(userId, actionPayload);
      
    default:
      return { allowed: true }; // Unknown action types pass through
  }
}

/**
 * Validate SEO optimization action
 */
async function validateSEOAction(userId: string, payload: any): Promise<SafetyValidationResult> {
  const db = requireDb();
  
  try {
    // Get user's automation settings
    const [settings] = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, userId))
      .limit(1);

    if (!settings) {
      return { allowed: false, reason: 'No automation settings found' };
    }

    // Check daily action limit
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todaysActions = await db
      .select()
      .from(autonomousActions)
      .where(
        and(
          eq(autonomousActions.userId, userId),
          sql`${autonomousActions.createdAt} >= ${todayStart}`
        )
      );

    const maxDailyActions = settings.maxDailyActions ?? 10;
    
    if (todaysActions.length >= maxDailyActions) {
      return {
        allowed: false,
        reason: `Daily action limit reached (${todaysActions.length}/${maxDailyActions} actions today)`,
        violationType: 'daily_limit'
      };
    }

    // Check catalog change percentage limit
    const { products } = await import('@shared/schema');
    const totalProducts = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.userId, userId));

    const productCount = Number(totalProducts[0]?.count || 0);
    const maxCatalogChangePercent = settings.maxCatalogChangePercent ?? 5;
    const maxCatalogChanges = Math.max(1, Math.ceil(productCount * (maxCatalogChangePercent / 100)));
    
    // Get unique products changed today
    const uniqueProductsChanged = new Set(
      todaysActions
        .filter((a: typeof autonomousActions.$inferSelect) => a.actionType === 'optimize_seo' && a.entityId)
        .map((a: typeof autonomousActions.$inferSelect) => a.entityId)
    );
    
    if (uniqueProductsChanged.size >= maxCatalogChanges) {
      return {
        allowed: false,
        reason: `Catalog change limit reached (${uniqueProductsChanged.size}/${maxCatalogChanges} products, ${maxCatalogChangePercent}% limit)`,
        violationType: 'catalog_limit'
      };
    }

    // Check cooldown if ruleId is provided
    if (payload.ruleId && payload.productId) {
      const cooldownResult = await checkSEOCooldown(userId, payload.ruleId, payload.productId);
      if (!cooldownResult.allowed) {
        return cooldownResult;
      }
    }

    return { allowed: true };
    
  } catch (error) {
    console.error('❌ [Safety Validator] Error validating SEO action:', error);
    // Fail closed - reject if validation fails
    return {
      allowed: false,
      reason: 'Unable to validate action safety',
      violationType: 'validation_error'
    };
  }
}

/**
 * Validate pricing action
 */
async function validatePricingAction(userId: string, payload: any): Promise<SafetyValidationResult> {
  // Reuse SEO validator logic (same limits apply)
  return await validateSEOAction(userId, payload);
}

/**
 * Validate marketing campaign action
 */
async function validateMarketingAction(userId: string, payload: any): Promise<SafetyValidationResult> {
  const db = requireDb();
  
  try {
    // CRITICAL: Validate that payload has required recipient identifiers
    const channel = payload.channel || 'email';
    const recipientEmail = payload.customerEmail || payload.recipientEmail;
    const recipientPhone = payload.customerPhone || payload.recipientPhone;
    
    if (channel === 'email' && !recipientEmail) {
      return {
        allowed: false,
        reason: 'Marketing payload missing recipient email address',
        violationType: 'invalid_payload'
      };
    }
    
    if (channel === 'sms' && !recipientPhone) {
      return {
        allowed: false,
        reason: 'Marketing payload missing recipient phone number',
        violationType: 'invalid_payload'
      };
    }
    
    // Import marketing safety functions
    const { canSendMarketingMessage } = await import('./marketing-safety-manager');
    
    // Extract customer info from payload
    const customerInfo = {
      userId,
      email: recipientEmail,
      phone: recipientPhone,
      timezone: payload.timezone || 'UTC'
    };
    
    // Run all marketing safety checks (frequency caps, quiet hours, GDPR, unsubscribe)
    const safetyResult = await canSendMarketingMessage(customerInfo, channel);
    
    if (!safetyResult.allowed) {
      return {
        allowed: false,
        reason: safetyResult.reason,
        violationType: safetyResult.violationType
      };
    }

    // CRITICAL: Check database for existing pending approvals using normalized columns
    // This prevents race conditions via database-level unique constraint
    const { pendingApprovals } = await import('@shared/schema');
    
    // Query using normalized recipient columns (not JSON parsing)
    // This leverages the partial unique indexes for race condition prevention
    const existingApprovals = await db
      .select()
      .from(pendingApprovals)
      .where(
        and(
          eq(pendingApprovals.userId, userId),
          eq(pendingApprovals.status, 'pending'),
          sql`${pendingApprovals.actionType} IN ('send_campaign', 'send_cart_recovery')`,
          eq(pendingApprovals.channel, channel),
          // Match by recipient identifier for this channel
          channel === 'email'
            ? eq(pendingApprovals.recipientEmail, recipientEmail!)
            : eq(pendingApprovals.recipientPhone, recipientPhone!)
        )
      );

    if (existingApprovals.length > 0) {
      return {
        allowed: false,
        reason: `${existingApprovals.length} pending approval(s) for this ${channel} recipient already exist. Please wait for them to be processed first.`,
        violationType: 'pending_approval_exists'
      };
    }

    // Check per-rule daily limit if ruleId is provided
    if (payload.ruleId) {
      const ruleLimit = await checkMarketingRuleLimit(userId, payload.ruleId);
      if (!ruleLimit.allowed) {
        return ruleLimit;
      }
    }

    return { allowed: true };
    
  } catch (error) {
    console.error('❌ [Safety Validator] Error validating marketing action:', error);
    return {
      allowed: false,
      reason: 'Unable to validate marketing action safety',
      violationType: 'validation_error'
    };
  }
}

/**
 * Validate cart recovery action
 */
async function validateCartRecoveryAction(userId: string, payload: any): Promise<SafetyValidationResult> {
  // Cart recovery uses same safety checks as marketing
  return await validateMarketingAction(userId, payload);
}

/**
 * Check SEO rule cooldown
 */
async function checkSEOCooldown(
  userId: string,
  ruleId: string,
  productId: string
): Promise<SafetyValidationResult> {
  const db = requireDb();
  
  try {
    // Get rule's cooldown setting
    const [rule] = await db
      .select()
      .from(autonomousRules)
      .where(eq(autonomousRules.id, ruleId))
      .limit(1);

    if (!rule) {
      return { allowed: true }; // No rule found, allow
    }

    const cooldownSeconds = rule.cooldownSeconds ?? 86400; // Default 24 hours
    const cooldownDate = new Date(Date.now() - cooldownSeconds * 1000);

    // Check for recent actions on this product by this rule
    const recentActions = await db
      .select()
      .from(autonomousActions)
      .where(
        and(
          eq(autonomousActions.userId, userId),
          eq(autonomousActions.entityId, productId),
          eq(autonomousActions.ruleId, ruleId),
          gte(autonomousActions.createdAt, cooldownDate)
        )
      )
      .limit(1);

    if (recentActions.length > 0) {
      const lastAction = recentActions[0];
      const timeSince = Date.now() - lastAction.createdAt.getTime();
      const hoursRemaining = Math.ceil((cooldownSeconds * 1000 - timeSince) / (1000 * 60 * 60));
      
      return {
        allowed: false,
        reason: `Cooldown period active (wait ${hoursRemaining} more hours)`,
        violationType: 'cooldown'
      };
    }

    return { allowed: true };
    
  } catch (error) {
    console.error('❌ [Safety Validator] Error checking cooldown:', error);
    return { allowed: true }; // Fail open for cooldown checks
  }
}

/**
 * Check marketing rule daily limit
 */
async function checkMarketingRuleLimit(
  userId: string,
  ruleId: string
): Promise<SafetyValidationResult> {
  const db = requireDb();
  
  try {
    // Get rule's max actions per day
    const [rule] = await db
      .select()
      .from(autonomousRules)
      .where(eq(autonomousRules.id, ruleId))
      .limit(1);

    if (!rule) {
      return { allowed: true }; // No rule found, allow
    }

    const ruleJson = rule.ruleJson as any;
    const maxActionsPerDay = ruleJson?.maxActionsPerDay;

    if (!maxActionsPerDay) {
      return { allowed: true }; // No limit set
    }

    // Count today's actions for this rule
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const actionCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(autonomousActions)
      .where(
        and(
          eq(autonomousActions.userId, userId),
          eq(autonomousActions.ruleId, ruleId),
          gte(autonomousActions.createdAt, startOfDay)
        )
      );

    const count = Number(actionCount[0]?.count || 0);

    if (count >= maxActionsPerDay) {
      return {
        allowed: false,
        reason: `Rule daily limit reached (${count}/${maxActionsPerDay} actions today)`,
        violationType: 'rule_limit'
      };
    }

    return { allowed: true };
    
  } catch (error) {
    console.error('❌ [Safety Validator] Error checking rule limit:', error);
    return { allowed: true }; // Fail open for rule limit checks
  }
}
