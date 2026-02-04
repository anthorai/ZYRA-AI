/**
 * ZYRA AI Subscription Plans Configuration
 * 
 * Defines plan IDs, pricing, features, and capabilities for each tier.
 * The plan system enforces different levels of autonomy, features, and execution speed.
 */

export const ZYRA_PLANS = {
  FREE: "18f8da29-94cf-417b-83f8-07191b22f254",     // Free (7-day trial with 499 credits)
  STARTER: "357abaf6-3035-4a25-b178-b5602c09fa8a",  // Starter ($49, 2,000 credits/month)
  GROWTH: "aaca603f-f064-44a7-87a4-485f84f19517",   // Growth ($249, 10,000 credits/month)
  SCALE: "5a02d7c5-031f-48fe-bbbd-42847b1c39df",    // Pro ($499, 20,000 credits/month)
} as const;

export const CREDIT_LIMITS = {
  [ZYRA_PLANS.FREE]: 499,       // Free plan: 499 credits for 7-day trial
  [ZYRA_PLANS.STARTER]: 2000,   // Starter: 2,000 credits/month
  [ZYRA_PLANS.GROWTH]: 10000,   // Growth: 10,000 credits/month
  [ZYRA_PLANS.SCALE]: 20000,    // Pro: 20,000 credits/month
} as const;

// Free plan trial - 499 credits for 7 days
export const FREE_PLAN_TRIAL_CREDITS = 499;
export const FREE_PLAN_TRIAL_DAYS = 7;

export const EXECUTION_PRIORITY = {
  [ZYRA_PLANS.FREE]: 'standard',
  [ZYRA_PLANS.STARTER]: 'standard',
  [ZYRA_PLANS.GROWTH]: 'fast',
  [ZYRA_PLANS.SCALE]: 'priority',
} as const;

export const AUTONOMY_LEVELS = {
  [ZYRA_PLANS.FREE]: 'very_low',
  [ZYRA_PLANS.STARTER]: 'very_low',
  [ZYRA_PLANS.GROWTH]: 'medium',
  [ZYRA_PLANS.SCALE]: 'high',
} as const;

export const PLAN_NAMES = {
  [ZYRA_PLANS.FREE]: "Free",
  [ZYRA_PLANS.STARTER]: "Starter",
  [ZYRA_PLANS.GROWTH]: "Growth",
  [ZYRA_PLANS.SCALE]: "Pro",
} as const;

export const PLAN_PRICES = {
  [ZYRA_PLANS.FREE]: 0,
  [ZYRA_PLANS.STARTER]: 49,
  [ZYRA_PLANS.GROWTH]: 249,
  [ZYRA_PLANS.SCALE]: 499,
} as const;

export const PLAN_DESCRIPTIONS = {
  [ZYRA_PLANS.FREE]: "Free to install - 499 credits for 7-day trial",
  [ZYRA_PLANS.STARTER]: "Smart growth with 2,000 credits/month - manual approval required",
  [ZYRA_PLANS.GROWTH]: "Trusted autonomous operator with 10,000 credits/month",
  [ZYRA_PLANS.SCALE]: "Hands-free revenue engine with 20,000 credits/month",
} as const;

export const PLAN_BY_NAME: Record<string, string> = {
  "Free": ZYRA_PLANS.FREE,
  "free": ZYRA_PLANS.FREE,
  "free_plan": ZYRA_PLANS.FREE,
  "trial": ZYRA_PLANS.FREE,
  "Starter+": ZYRA_PLANS.STARTER,
  "Starter": ZYRA_PLANS.STARTER,
  "starter": ZYRA_PLANS.STARTER,
  "starter+": ZYRA_PLANS.STARTER,
  "Growth": ZYRA_PLANS.GROWTH,
  "growth": ZYRA_PLANS.GROWTH,
  "Scale": ZYRA_PLANS.SCALE,
  "scale": ZYRA_PLANS.SCALE,
  "Pro": ZYRA_PLANS.SCALE,
  "pro": ZYRA_PLANS.SCALE,
} as const;

export function getPlanIdByName(planName: string): string {
  return PLAN_BY_NAME[planName] || ZYRA_PLANS.FREE;
}

export function getCreditLimitByPlanName(planName: string): number {
  const planId = getPlanIdByName(planName);
  return CREDIT_LIMITS[planId as keyof typeof CREDIT_LIMITS] || 499;
}

export type PlanId = typeof ZYRA_PLANS[keyof typeof ZYRA_PLANS];
