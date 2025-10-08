import { getUserUsageStats, incrementUsageStat } from "../db";
import { getUserSubscription, getSubscriptionPlanById } from "../db";
import { CREDIT_LIMITS } from "./constants/plans";
import { FEATURE_CREDIT_COST, FeatureType } from "./constants/feature-credits";

export interface CreditCheckResult {
  hasEnoughCredits: boolean;
  creditsUsed: number;
  creditsRemaining: number;
  creditLimit: number;
  message?: string;
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
