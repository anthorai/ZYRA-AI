import { getUserUsageStats, incrementUsageStat } from "../db";
import { getUserSubscription, getSubscriptionPlanById } from "../db";
import { CREDIT_LIMITS } from "./constants/plans";
import { FEATURE_CREDIT_COST, FeatureType } from "./constants/feature-credits";
import { AI_TOOL_CREDITS, AIToolId, getToolCredits, getToolCreditsPerProduct } from "@shared/ai-credits";

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
