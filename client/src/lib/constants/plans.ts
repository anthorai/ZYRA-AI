/**
 * ZYRA AI Subscription Plans Configuration (Client-side)
 * 
 * Must match server/lib/constants/plans.ts for consistency
 */

export const ZYRA_PLANS = {
  FREE: "18f8da29-94cf-417b-83f8-07191b22f254",     // Free (7-day trial with 150 credits, then 50 credits/month)
  STARTER: "357abaf6-3035-4a25-b178-b5602c09fa8a",  // Starter ($49, 1,000 credits)
  GROWTH: "aaca603f-f064-44a7-87a4-485f84f19517",   // Growth ($249, 6,000 credits)
  SCALE: "5a02d7c5-031f-48fe-bbbd-42847b1c39df",    // Pro ($499, 15,000 credits)
} as const;

export const CREDIT_LIMITS = {
  [ZYRA_PLANS.FREE]: 50,       // Regular Free plan monthly credits (150 during 7-day trial)
  [ZYRA_PLANS.STARTER]: 1000,
  [ZYRA_PLANS.GROWTH]: 6000,
  [ZYRA_PLANS.SCALE]: 15000,
} as const;

// Free plan trial bonus - new accounts get 150 credits for 7 days
export const FREE_PLAN_TRIAL_CREDITS = 150;
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
  [ZYRA_PLANS.FREE]: "Free to install - 7-day trial with 150 credits, then 50/month",
  [ZYRA_PLANS.STARTER]: "Powerful but cautious assistant - manual approval required",
  [ZYRA_PLANS.GROWTH]: "Trusted autonomous operator - auto-runs low-risk actions",
  [ZYRA_PLANS.SCALE]: "Hands-free revenue engine - full autonomy with intelligence",
} as const;

// Plan autonomy levels for UI display
export const PLAN_AUTONOMY = {
  [ZYRA_PLANS.FREE]: 'manual',
  [ZYRA_PLANS.STARTER]: 'manual',
  [ZYRA_PLANS.GROWTH]: 'semi_auto',
  [ZYRA_PLANS.SCALE]: 'full_auto',
} as const;

// Plan feature flags for conditional UI rendering
export const PLAN_FEATURES = {
  [ZYRA_PLANS.FREE]: {
    bulkOptimization: false,
    serpIntelligence: false,
    advancedCartRecovery: false,
    scheduledRefresh: false,
    perProductAutonomy: false,
    autoExecution: false,
    powerMode: false,
  },
  [ZYRA_PLANS.STARTER]: {
    bulkOptimization: false,
    serpIntelligence: false,
    advancedCartRecovery: false,
    scheduledRefresh: false,
    perProductAutonomy: false,
    autoExecution: false,
    powerMode: false,
  },
  [ZYRA_PLANS.GROWTH]: {
    bulkOptimization: true,
    serpIntelligence: false,
    advancedCartRecovery: true,
    scheduledRefresh: true,
    perProductAutonomy: false,
    autoExecution: true,
    powerMode: true,
  },
  [ZYRA_PLANS.SCALE]: {
    bulkOptimization: true,
    serpIntelligence: true,
    advancedCartRecovery: true,
    scheduledRefresh: true,
    perProductAutonomy: true,
    autoExecution: true,
    powerMode: true,
  },
} as const;

export const PLAN_BY_NAME: Record<string, string> = {
  "Free": ZYRA_PLANS.FREE_PLAN,
  "free": ZYRA_PLANS.FREE_PLAN,
  "free_plan": ZYRA_PLANS.FREE_PLAN,
  "7-Day Free Trial": ZYRA_PLANS.FREE,
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
  return PLAN_BY_NAME[planName] || ZYRA_PLANS.FREE_PLAN;
}

export function getPlanFeatures(planName: string) {
  const planId = getPlanIdByName(planName);
  return PLAN_FEATURES[planId as keyof typeof PLAN_FEATURES] || PLAN_FEATURES[ZYRA_PLANS.FREE_PLAN];
}

export type PlanId = typeof ZYRA_PLANS[keyof typeof ZYRA_PLANS];
