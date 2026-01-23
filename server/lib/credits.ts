import { getUserUsageStats, incrementUsageStat } from "../db";
import { getUserSubscription, getSubscriptionPlanById } from "../db";
import { CREDIT_LIMITS, getPlanIdByName } from "./constants/plans";
import { FEATURE_CREDIT_COST, FeatureType } from "./constants/feature-credits";
import { AI_TOOL_CREDITS, AIToolId, getToolCredits, getToolCreditsPerProduct } from "@shared/ai-credits";
import { 
  ActionType, 
  calculateActionCreditCost, 
  calculateMonitoringCost,
  getCreditCostBreakdown,
  isActionAllowedForPlan,
  mapNextMoveActionToType,
  LEARNING_MONITORING_RATE,
} from "./constants/credit-consumption";

export interface CreditCheckResult {
  hasEnoughCredits: boolean;
  creditsUsed: number;
  creditsRemaining: number;
  creditLimit: number;
  creditCost?: number;
  message?: string;
}

export interface CreditBalance {
  creditsUsed: number;
  creditsRemaining: number;
  creditLimit: number;
  percentUsed: number;
  isLow: boolean;
  lowCreditThreshold: number;
}

export async function checkCredits(userId: string, featureType: FeatureType): Promise<CreditCheckResult> {
  const creditCost = FEATURE_CREDIT_COST[featureType];
  
  // Get user's current subscription
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    return {
      hasEnoughCredits: false,
      creditsUsed: 0,
      creditsRemaining: 0,
      creditLimit: 0,
      message: "No active subscription found"
    };
  }

  // Get subscription plan details
  const plan = await getSubscriptionPlanById(subscription.planId);
  if (!plan) {
    return {
      hasEnoughCredits: false,
      creditsUsed: 0,
      creditsRemaining: 0,
      creditLimit: 0,
      message: "Invalid subscription plan"
    };
  }

  // Get credit limit from plan
  const creditLimit = (plan.limits as any)?.credits || (CREDIT_LIMITS as any)[subscription.planId] || 0;

  // Get usage stats
  const stats = await getUserUsageStats(userId);
  const creditsUsed = stats?.creditsUsed || 0;
  const creditsRemaining = creditLimit - creditsUsed;

  return {
    hasEnoughCredits: creditsRemaining >= creditCost,
    creditsUsed,
    creditsRemaining,
    creditLimit,
    message: creditsRemaining < creditCost 
      ? `Insufficient credits. Required: ${creditCost}, Available: ${creditsRemaining}` 
      : undefined
  };
}

export async function consumeCredits(userId: string, featureType: FeatureType): Promise<boolean> {
  const creditCost = FEATURE_CREDIT_COST[featureType];
  
  // Check if user has enough credits
  const creditCheck = await checkCredits(userId, featureType);
  
  if (!creditCheck.hasEnoughCredits) {
    return false;
  }

  // Get current stats
  const stats = await getUserUsageStats(userId);
  const currentUsed = stats?.creditsUsed || 0;
  const newUsed = currentUsed + creditCost;
  const newRemaining = creditCheck.creditLimit - newUsed;

  // Update usage stats with absolute values
  await incrementUsageStat(userId, 'creditsUsed', creditCost);
  
  // Set remaining credits to absolute value
  const subscription = await getUserSubscription(userId);
  if (subscription) {
    const usageStats = await getUserUsageStats(userId);
    if (usageStats) {
      // Update with absolute value
      await incrementUsageStat(userId, 'creditsRemaining', -(usageStats.creditsRemaining || 0) + newRemaining);
    }
  }

  return true;
}

export async function initializeUserCredits(userId: string, planId: string): Promise<void> {
  const plan = await getSubscriptionPlanById(planId);
  if (!plan) return;

  const creditLimit = (plan.limits as any)?.credits || (CREDIT_LIMITS as any)[planId] || 0;

  // Get current stats
  const stats = await getUserUsageStats(userId);
  const currentUsed = stats?.creditsUsed || 0;
  const currentRemaining = stats?.creditsRemaining || 0;

  // Initialize credits to plan limit
  await incrementUsageStat(userId, 'creditsUsed', -currentUsed);
  await incrementUsageStat(userId, 'creditsRemaining', -currentRemaining + creditLimit);
}

export async function resetMonthlyCredits(userId: string): Promise<void> {
  const subscription = await getUserSubscription(userId);
  if (!subscription) return;

  const plan = await getSubscriptionPlanById(subscription.planId);
  if (!plan) return;

  const creditLimit = (plan.limits as any)?.credits || (CREDIT_LIMITS as any)[subscription.planId] || 0;

  // Get current stats
  const stats = await getUserUsageStats(userId);
  const currentUsed = stats?.creditsUsed || 0;
  const currentRemaining = stats?.creditsRemaining || 0;

  // Reset to absolute values (not incremental)
  await incrementUsageStat(userId, 'creditsUsed', -currentUsed);
  await incrementUsageStat(userId, 'creditsRemaining', -currentRemaining + creditLimit);
}

// Low credit threshold (20% of plan limit)
const LOW_CREDIT_THRESHOLD_PERCENT = 20;

/**
 * Get the user's current credit balance
 */
export async function getCreditBalance(userId: string): Promise<CreditBalance> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return {
      creditsUsed: 0,
      creditsRemaining: 0,
      creditLimit: 0,
      percentUsed: 0,
      isLow: false,
      lowCreditThreshold: 0,
    };
  }

  const plan = await getSubscriptionPlanById(subscription.planId);
  if (!plan) {
    return {
      creditsUsed: 0,
      creditsRemaining: 0,
      creditLimit: 0,
      percentUsed: 0,
      isLow: false,
      lowCreditThreshold: 0,
    };
  }

  const creditLimit = (plan.limits as any)?.credits || (CREDIT_LIMITS as any)[subscription.planId] || 0;
  const stats = await getUserUsageStats(userId);
  const creditsUsed = stats?.creditsUsed || 0;
  const creditsRemaining = Math.max(0, creditLimit - creditsUsed);
  const percentUsed = creditLimit > 0 ? Math.round((creditsUsed / creditLimit) * 100) : 0;
  const lowCreditThreshold = Math.ceil(creditLimit * (LOW_CREDIT_THRESHOLD_PERCENT / 100));
  const isLow = creditsRemaining <= lowCreditThreshold && creditsRemaining > 0;

  return {
    creditsUsed,
    creditsRemaining,
    creditLimit,
    percentUsed,
    isLow,
    lowCreditThreshold,
  };
}

/**
 * Check if user has enough credits for an AI tool operation
 */
export async function checkAIToolCredits(
  userId: string, 
  toolId: AIToolId, 
  quantity: number = 1
): Promise<CreditCheckResult> {
  const tool = AI_TOOL_CREDITS[toolId];
  if (!tool) {
    return {
      hasEnoughCredits: false,
      creditsUsed: 0,
      creditsRemaining: 0,
      creditLimit: 0,
      creditCost: 0,
      message: `Unknown AI tool: ${toolId}`
    };
  }

  // Calculate cost based on whether it's a per-item tool
  const perItemCost = (tool as any).creditsPerProduct || (tool as any).creditsPerImage || tool.credits;
  const totalCost = perItemCost * quantity;

  const balance = await getCreditBalance(userId);
  
  return {
    hasEnoughCredits: balance.creditsRemaining >= totalCost,
    creditsUsed: balance.creditsUsed,
    creditsRemaining: balance.creditsRemaining,
    creditLimit: balance.creditLimit,
    creditCost: totalCost,
    message: balance.creditsRemaining < totalCost 
      ? `Insufficient credits. Required: ${totalCost}, Available: ${balance.creditsRemaining}` 
      : undefined
  };
}

/**
 * Consume credits for an AI tool operation
 */
export async function consumeAIToolCredits(
  userId: string, 
  toolId: AIToolId, 
  quantity: number = 1
): Promise<{ success: boolean; creditsConsumed: number; message?: string }> {
  const creditCheck = await checkAIToolCredits(userId, toolId, quantity);
  
  if (!creditCheck.hasEnoughCredits) {
    return {
      success: false,
      creditsConsumed: 0,
      message: creditCheck.message
    };
  }

  const creditsToConsume = creditCheck.creditCost || 0;
  
  // Update usage stats
  await incrementUsageStat(userId, 'creditsUsed', creditsToConsume);
  
  // Update remaining credits
  const stats = await getUserUsageStats(userId);
  if (stats) {
    const newRemaining = creditCheck.creditLimit - (creditCheck.creditsUsed + creditsToConsume);
    await incrementUsageStat(userId, 'creditsRemaining', -(stats.creditsRemaining || 0) + newRemaining);
  }

  return {
    success: true,
    creditsConsumed: creditsToConsume
  };
}

/**
 * Plan-Aware Credit Consumption System
 * 
 * Credits represent AI thinking depth, SERP analysis, execution complexity,
 * and learning costs. Higher plans consume more per action because they
 * access deeper intelligence and more automation.
 */

export interface PlanAwareCreditCheckResult {
  hasEnoughCredits: boolean;
  creditsUsed: number;
  creditsRemaining: number;
  creditLimit: number;
  creditCost: number;
  actionAllowed: boolean;
  breakdown: string[];
  lowCreditMode: boolean;
  softNudgeMessage?: string;
}

export interface ConsumeActionCreditsResult {
  success: boolean;
  creditsConsumed: number;
  newBalance: number;
  message?: string;
  lowCreditWarning?: string;
}

/**
 * Check credits for a plan-aware action with full cost breakdown
 */
export async function checkActionCredits(
  userId: string,
  actionType: ActionType,
  options: {
    isAutoExecuted?: boolean;
    includesSERP?: boolean;
    riskLevel?: 'low' | 'medium' | 'high';
    quantity?: number;
  } = {}
): Promise<PlanAwareCreditCheckResult> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return {
      hasEnoughCredits: false,
      creditsUsed: 0,
      creditsRemaining: 0,
      creditLimit: 0,
      creditCost: 0,
      actionAllowed: false,
      breakdown: ['No active subscription'],
      lowCreditMode: false,
    };
  }

  const planId = subscription.planId;
  const balance = await getCreditBalance(userId);
  
  // Check if action is allowed for this plan
  if (!isActionAllowedForPlan(actionType, planId)) {
    return {
      hasEnoughCredits: false,
      creditsUsed: balance.creditsUsed,
      creditsRemaining: balance.creditsRemaining,
      creditLimit: balance.creditLimit,
      creditCost: 0,
      actionAllowed: false,
      breakdown: ['This action requires a higher plan'],
      lowCreditMode: balance.isLow,
      softNudgeMessage: 'Unlock this feature with Growth or Scale plan',
    };
  }

  // Calculate full credit cost with all multipliers
  const creditCost = calculateActionCreditCost(actionType, planId, options);
  const costBreakdown = getCreditCostBreakdown(actionType, planId, options);
  
  const hasEnoughCredits = balance.creditsRemaining >= creditCost;
  
  // Generate soft nudge messages for low credit situations
  let softNudgeMessage: string | undefined;
  if (!hasEnoughCredits) {
    softNudgeMessage = "ZYRA is prioritizing highest-impact actions. Some optimizations are queued for next cycle.";
  } else if (balance.isLow) {
    softNudgeMessage = "Credits running low. ZYRA is focusing on revenue-critical actions.";
  }

  return {
    hasEnoughCredits,
    creditsUsed: balance.creditsUsed,
    creditsRemaining: balance.creditsRemaining,
    creditLimit: balance.creditLimit,
    creditCost,
    actionAllowed: true,
    breakdown: costBreakdown.breakdown,
    lowCreditMode: balance.isLow,
    softNudgeMessage,
  };
}

/**
 * Consume credits for a plan-aware action
 * Deducts credits BEFORE execution (fail-safe approach)
 */
export async function consumeActionCredits(
  userId: string,
  actionType: ActionType,
  options: {
    isAutoExecuted?: boolean;
    includesSERP?: boolean;
    riskLevel?: 'low' | 'medium' | 'high';
    quantity?: number;
  } = {}
): Promise<ConsumeActionCreditsResult> {
  const creditCheck = await checkActionCredits(userId, actionType, options);
  
  if (!creditCheck.actionAllowed) {
    return {
      success: false,
      creditsConsumed: 0,
      newBalance: creditCheck.creditsRemaining,
      message: 'Action not available for your plan',
    };
  }
  
  if (!creditCheck.hasEnoughCredits) {
    return {
      success: false,
      creditsConsumed: 0,
      newBalance: creditCheck.creditsRemaining,
      message: creditCheck.softNudgeMessage || 'Insufficient credits',
      lowCreditWarning: "Higher plans unlock faster continuous optimization",
    };
  }

  const creditsToConsume = creditCheck.creditCost;
  
  // Deduct credits
  await incrementUsageStat(userId, 'creditsUsed', creditsToConsume);
  
  // Calculate new balance
  const newRemaining = creditCheck.creditsRemaining - creditsToConsume;
  const stats = await getUserUsageStats(userId);
  if (stats) {
    await incrementUsageStat(userId, 'creditsRemaining', -(stats.creditsRemaining || 0) + newRemaining);
  }

  // Generate warning if credits are now low
  let lowCreditWarning: string | undefined;
  const lowThreshold = Math.ceil(creditCheck.creditLimit * 0.2);
  if (newRemaining <= lowThreshold && newRemaining > 0) {
    lowCreditWarning = "ZYRA is prioritizing highest-impact actions";
  }

  return {
    success: true,
    creditsConsumed: creditsToConsume,
    newBalance: newRemaining,
    lowCreditWarning,
  };
}

/**
 * Schedule weekly monitoring credits for an executed action
 * Called after action execution to set up ongoing learning costs
 */
export async function scheduleMonitoringCredits(
  userId: string,
  executionCost: number
): Promise<{ weeklyMonitoringCost: number }> {
  const weeklyMonitoringCost = calculateMonitoringCost(executionCost);
  
  // In production, this would schedule a weekly job
  // For now, we return the cost for display purposes
  return { weeklyMonitoringCost };
}

/**
 * Get Next Move credit cost based on action type and user's plan
 */
export async function getNextMoveCreditCost(
  userId: string,
  nextMoveAction: string,
  riskLevel: 'low' | 'medium' | 'high' = 'low',
  isAutoExecuted: boolean = false
): Promise<{
  creditCost: number;
  breakdown: string[];
  actionAllowed: boolean;
  weeklyMonitoringCost: number;
}> {
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    return {
      creditCost: 0,
      breakdown: ['No subscription'],
      actionAllowed: false,
      weeklyMonitoringCost: 0,
    };
  }

  const actionType = mapNextMoveActionToType(nextMoveAction);
  const planId = subscription.planId;
  
  if (!isActionAllowedForPlan(actionType, planId)) {
    return {
      creditCost: 0,
      breakdown: ['Action requires higher plan'],
      actionAllowed: false,
      weeklyMonitoringCost: 0,
    };
  }

  const creditCost = calculateActionCreditCost(actionType, planId, {
    isAutoExecuted,
    riskLevel,
    includesSERP: true, // Next Move actions typically include SERP
  });
  
  const costBreakdown = getCreditCostBreakdown(actionType, planId, {
    isAutoExecuted,
    riskLevel,
    includesSERP: true,
  });

  const weeklyMonitoringCost = calculateMonitoringCost(creditCost);

  return {
    creditCost,
    breakdown: costBreakdown.breakdown,
    actionAllowed: true,
    weeklyMonitoringCost,
  };
}

/**
 * Reserve credits for rollback safety and monitoring
 * Always keep 5% of credit limit reserved
 */
export async function getReservedCredits(userId: string): Promise<number> {
  const balance = await getCreditBalance(userId);
  return Math.ceil(balance.creditLimit * 0.05);
}

/**
 * Check if user has credits available after reserving safety buffer
 */
export async function hasAvailableCreditsWithReserve(
  userId: string,
  requiredCredits: number
): Promise<boolean> {
  const balance = await getCreditBalance(userId);
  const reserved = await getReservedCredits(userId);
  const availableAfterReserve = balance.creditsRemaining - reserved;
  return availableAfterReserve >= requiredCredits;
}

// Re-export types and functions from credit-consumption
export type { ActionType } from "./constants/credit-consumption";
export { mapNextMoveActionToType } from "./constants/credit-consumption";
