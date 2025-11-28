export const ZYRA_PLANS = {
  FREE: "e613e6c0-3e31-4ba7-ba1d-9587c7b67547",
  STARTER: "357abaf6-3035-4a25-b178-b5602c09fa8a",
  GROWTH: "aaca603f-f064-44a7-87a4-485f84f19517",
  PRO: "5a02d7c5-031f-48fe-bbbd-42847b1c39df",
} as const;

export const CREDIT_LIMITS = {
  [ZYRA_PLANS.FREE]: 100,
  [ZYRA_PLANS.STARTER]: 1000,
  [ZYRA_PLANS.GROWTH]: 5000,
  [ZYRA_PLANS.PRO]: 20000,
} as const;

export const PLAN_NAMES = {
  [ZYRA_PLANS.FREE]: "7-Day Free Trial",
  [ZYRA_PLANS.STARTER]: "Starter",
  [ZYRA_PLANS.GROWTH]: "Growth",
  [ZYRA_PLANS.PRO]: "Pro",
} as const;

export const PLAN_PRICES = {
  [ZYRA_PLANS.FREE]: 0,
  [ZYRA_PLANS.STARTER]: 49,
  [ZYRA_PLANS.GROWTH]: 299,
  [ZYRA_PLANS.PRO]: 999,
} as const;

export const PLAN_DESCRIPTIONS = {
  [ZYRA_PLANS.FREE]: "New users exploring Zyra features",
  [ZYRA_PLANS.STARTER]: "Best for new Shopify stores just getting started",
  [ZYRA_PLANS.GROWTH]: "For scaling merchants ready to grow",
  [ZYRA_PLANS.PRO]: "For high-revenue brands & enterprises",
} as const;

export const PLAN_BY_NAME: Record<string, string> = {
  "7-Day Free Trial": ZYRA_PLANS.FREE,
  "trial": ZYRA_PLANS.FREE,
  "Starter": ZYRA_PLANS.STARTER,
  "starter": ZYRA_PLANS.STARTER,
  "Growth": ZYRA_PLANS.GROWTH,
  "growth": ZYRA_PLANS.GROWTH,
  "Pro": ZYRA_PLANS.PRO,
  "pro": ZYRA_PLANS.PRO,
} as const;

export function getPlanIdByName(planName: string): string {
  return PLAN_BY_NAME[planName] || ZYRA_PLANS.FREE;
}

export function getCreditLimitByPlanName(planName: string): number {
  const planId = getPlanIdByName(planName);
  return CREDIT_LIMITS[planId as keyof typeof CREDIT_LIMITS] || 100;
}

export type PlanId = typeof ZYRA_PLANS[keyof typeof ZYRA_PLANS];
