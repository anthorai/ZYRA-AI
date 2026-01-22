/**
 * ZYRA AI Subscription Plans Configuration
 * 
 * Defines plan IDs, pricing, features, and capabilities for each tier.
 * The plan system enforces different levels of autonomy, features, and execution speed.
 */

export const ZYRA_PLANS = {
  FREE: "e613e6c0-3e31-4ba7-ba1d-9587c7b67547",      // 7-Day Free Trial
  STARTER: "357abaf6-3035-4a25-b178-b5602c09fa8a",  // Starter+ ($49)
  GROWTH: "aaca603f-f064-44a7-87a4-485f84f19517",   // Growth ($249)
  SCALE: "5a02d7c5-031f-48fe-bbbd-42847b1c39df",    // Scale ($499)
} as const;

export const CREDIT_LIMITS = {
  [ZYRA_PLANS.FREE]: 100,
  [ZYRA_PLANS.STARTER]: 1000,
  [ZYRA_PLANS.GROWTH]: 6000,
  [ZYRA_PLANS.SCALE]: 15000,
} as const;

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
  [ZYRA_PLANS.FREE]: "7-Day Free Trial",
  [ZYRA_PLANS.STARTER]: "Starter+",
  [ZYRA_PLANS.GROWTH]: "Growth",
  [ZYRA_PLANS.SCALE]: "Scale",
} as const;

export const PLAN_PRICES = {
  [ZYRA_PLANS.FREE]: 0,
  [ZYRA_PLANS.STARTER]: 49,
  [ZYRA_PLANS.GROWTH]: 249,
  [ZYRA_PLANS.SCALE]: 499,
} as const;

export const PLAN_DESCRIPTIONS = {
  [ZYRA_PLANS.FREE]: "New users exploring ZYRA features",
  [ZYRA_PLANS.STARTER]: "Powerful but cautious assistant - manual approval required",
  [ZYRA_PLANS.GROWTH]: "Trusted autonomous operator - auto-runs low-risk actions",
  [ZYRA_PLANS.SCALE]: "Hands-free revenue engine - full autonomy with intelligence",
} as const;

export const PLAN_BY_NAME: Record<string, string> = {
  "7-Day Free Trial": ZYRA_PLANS.FREE,
  "trial": ZYRA_PLANS.FREE,
  "free": ZYRA_PLANS.FREE,
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
  return CREDIT_LIMITS[planId as keyof typeof CREDIT_LIMITS] || 100;
}

export type PlanId = typeof ZYRA_PLANS[keyof typeof ZYRA_PLANS];
