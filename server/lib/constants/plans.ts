export const ZYRA_PLANS = {
  FREE: "ca64a1a6-cb0f-4554-bdfa-b330288162ef",
  STARTER: "217988c7-7a95-445b-a133-7233c41d4b1a",
  GROWTH: "6c32ee7f-e6e3-49b1-9faf-719d757f2170",
  PRO: "6d63b409-6ea5-4da8-82f1-cd79f00be90b",
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

export type PlanId = typeof ZYRA_PLANS[keyof typeof ZYRA_PLANS];
