/**
 * ZYRA AI Credit Consumption System
 * 
 * Credits represent:
 * - AI thinking depth
 * - SERP analysis depth
 * - Execution complexity
 * - Risk & learning cost
 * 
 * Higher plans consume more credits per action because they:
 * - Run deeper intelligence
 * - Auto-execute more often
 * - Access advanced SERP data
 */

import { ZYRA_PLANS, getPlanIdByName } from './plans';

export type ActionType = 
  | 'product_seo_optimization'
  | 'bulk_product_optimization'
  | 'image_alt_text_optimization'
  | 'cart_recovery_setup'
  | 'post_purchase_upsell'
  | 'competitive_analysis'
  | 'email_campaign_optimization'
  | 'pricing_optimization'
  | 'marketing_automation';

/**
 * Base credit costs by action type and plan level
 * Higher plans = deeper AI analysis = higher base cost
 */
export const BASE_CREDIT_COSTS: Record<ActionType, Record<string, number>> = {
  product_seo_optimization: {
    [ZYRA_PLANS.FREE]: 6,
    [ZYRA_PLANS.STARTER]: 120,
    [ZYRA_PLANS.GROWTH]: 220,
    [ZYRA_PLANS.SCALE]: 350,
  },
  bulk_product_optimization: {
    [ZYRA_PLANS.FREE]: 0,      // Not allowed
    [ZYRA_PLANS.STARTER]: 0,   // Not allowed
    [ZYRA_PLANS.GROWTH]: 400,  // Per 10 products
    [ZYRA_PLANS.SCALE]: 700,   // Per 10 products
  },
  image_alt_text_optimization: {
    [ZYRA_PLANS.FREE]: 4,
    [ZYRA_PLANS.STARTER]: 30,
    [ZYRA_PLANS.GROWTH]: 60,
    [ZYRA_PLANS.SCALE]: 90,
  },
  cart_recovery_setup: {
    [ZYRA_PLANS.FREE]: 8,
    [ZYRA_PLANS.STARTER]: 150,
    [ZYRA_PLANS.GROWTH]: 300,
    [ZYRA_PLANS.SCALE]: 450,
  },
  post_purchase_upsell: {
    [ZYRA_PLANS.FREE]: 8,
    [ZYRA_PLANS.STARTER]: 120,
    [ZYRA_PLANS.GROWTH]: 250,
    [ZYRA_PLANS.SCALE]: 400,
  },
  competitive_analysis: {
    [ZYRA_PLANS.FREE]: 10,
    [ZYRA_PLANS.STARTER]: 100,
    [ZYRA_PLANS.GROWTH]: 180,
    [ZYRA_PLANS.SCALE]: 280,
  },
  email_campaign_optimization: {
    [ZYRA_PLANS.FREE]: 6,
    [ZYRA_PLANS.STARTER]: 80,
    [ZYRA_PLANS.GROWTH]: 150,
    [ZYRA_PLANS.SCALE]: 250,
  },
  pricing_optimization: {
    [ZYRA_PLANS.FREE]: 8,
    [ZYRA_PLANS.STARTER]: 100,
    [ZYRA_PLANS.GROWTH]: 200,
    [ZYRA_PLANS.SCALE]: 320,
  },
  marketing_automation: {
    [ZYRA_PLANS.FREE]: 8,
    [ZYRA_PLANS.STARTER]: 90,
    [ZYRA_PLANS.GROWTH]: 180,
    [ZYRA_PLANS.SCALE]: 300,
  },
};

/**
 * SERP Intelligence Multiplier
 * Higher plans get deeper SERP analysis which costs more
 */
export const SERP_MULTIPLIERS: Record<string, number> = {
  [ZYRA_PLANS.FREE]: 1.0,     // No SERP analysis
  [ZYRA_PLANS.STARTER]: 1.2,  // Limited SERP
  [ZYRA_PLANS.GROWTH]: 1.6,   // Standard SERP
  [ZYRA_PLANS.SCALE]: 2.2,    // Advanced SERP with competitor deep-dive
};

/**
 * Autonomy Multiplier
 * Auto-executed actions require higher confidence checks and monitoring
 */
export const AUTONOMY_MULTIPLIERS: Record<string, number> = {
  [ZYRA_PLANS.FREE]: 1.0,     // Manual only
  [ZYRA_PLANS.STARTER]: 1.0,  // Mostly manual
  [ZYRA_PLANS.GROWTH]: 1.3,   // Semi-autonomous
  [ZYRA_PLANS.SCALE]: 1.6,    // Full autonomy
};

/**
 * Learning & Monitoring Cost
 * Percentage of execution cost charged weekly for ongoing monitoring
 */
export const LEARNING_MONITORING_RATE = 0.10; // 10% of execution cost per week

/**
 * Actions that include SERP analysis
 */
export const SERP_ENABLED_ACTIONS: ActionType[] = [
  'product_seo_optimization',
  'bulk_product_optimization',
  'competitive_analysis',
];

/**
 * Actions that can be auto-executed
 */
export const AUTONOMY_ENABLED_ACTIONS: ActionType[] = [
  'product_seo_optimization',
  'bulk_product_optimization',
  'image_alt_text_optimization',
  'cart_recovery_setup',
  'post_purchase_upsell',
  'pricing_optimization',
  'marketing_automation',
];

/**
 * Risk levels affect credit cost
 * Higher risk = more validation = more credits
 */
export const RISK_MULTIPLIERS: Record<'low' | 'medium' | 'high', number> = {
  low: 1.0,
  medium: 1.15,
  high: 1.35,
};

/**
 * Calculate the total credit cost for an action
 */
export function calculateActionCreditCost(
  actionType: ActionType,
  planId: string,
  options: {
    isAutoExecuted?: boolean;
    includesSERP?: boolean;
    riskLevel?: 'low' | 'medium' | 'high';
    quantity?: number;
  } = {}
): number {
  const {
    isAutoExecuted = false,
    includesSERP = SERP_ENABLED_ACTIONS.includes(actionType),
    riskLevel = 'low',
    quantity = 1,
  } = options;

  // Get base cost for this action and plan
  const baseCost = BASE_CREDIT_COSTS[actionType]?.[planId] || 0;
  
  if (baseCost === 0) {
    return 0; // Action not allowed for this plan
  }

  let totalCost = baseCost;

  // Apply SERP multiplier if action uses SERP analysis
  if (includesSERP) {
    const serpMultiplier = SERP_MULTIPLIERS[planId] || 1.0;
    totalCost = totalCost * serpMultiplier;
  }

  // Apply autonomy multiplier if action is auto-executed
  if (isAutoExecuted && AUTONOMY_ENABLED_ACTIONS.includes(actionType)) {
    const autonomyMultiplier = AUTONOMY_MULTIPLIERS[planId] || 1.0;
    totalCost = totalCost * autonomyMultiplier;
  }

  // Apply risk multiplier
  const riskMultiplier = RISK_MULTIPLIERS[riskLevel];
  totalCost = totalCost * riskMultiplier;

  // Apply quantity for bulk operations
  totalCost = totalCost * quantity;

  return Math.ceil(totalCost);
}

/**
 * Calculate weekly monitoring cost for an action
 */
export function calculateMonitoringCost(executionCost: number): number {
  return Math.ceil(executionCost * LEARNING_MONITORING_RATE);
}

/**
 * Get base credit cost for an action type and plan
 */
export function getBaseCreditCost(actionType: ActionType, planId: string): number {
  return BASE_CREDIT_COSTS[actionType]?.[planId] || 0;
}

/**
 * Check if an action is allowed for a plan
 */
export function isActionAllowedForPlan(actionType: ActionType, planId: string): boolean {
  return getBaseCreditCost(actionType, planId) > 0;
}

/**
 * Get estimated monthly consumption for a plan
 * Used to show users how credits drain over time
 */
export function getEstimatedMonthlyConsumption(planId: string): {
  minPercent: number;
  maxPercent: number;
  description: string;
} {
  switch (planId) {
    case ZYRA_PLANS.FREE:
      return { minPercent: 50, maxPercent: 80, description: 'Light usage during trial' };
    case ZYRA_PLANS.STARTER:
      return { minPercent: 70, maxPercent: 90, description: 'ZYRA is actively optimizing your store' };
    case ZYRA_PLANS.GROWTH:
      return { minPercent: 80, maxPercent: 95, description: 'Deep autonomous optimization running' };
    case ZYRA_PLANS.SCALE:
      return { minPercent: 90, maxPercent: 100, description: 'Maximum AI intelligence deployed' };
    default:
      return { minPercent: 50, maxPercent: 80, description: 'Usage varies by activity' };
  }
}

/**
 * Get credit cost breakdown for display
 */
export function getCreditCostBreakdown(
  actionType: ActionType,
  planId: string,
  options: {
    isAutoExecuted?: boolean;
    includesSERP?: boolean;
    riskLevel?: 'low' | 'medium' | 'high';
  } = {}
): {
  baseCost: number;
  serpCost: number;
  autonomyCost: number;
  riskCost: number;
  totalCost: number;
  breakdown: string[];
} {
  const {
    isAutoExecuted = false,
    includesSERP = SERP_ENABLED_ACTIONS.includes(actionType),
    riskLevel = 'low',
  } = options;

  const baseCost = BASE_CREDIT_COSTS[actionType]?.[planId] || 0;
  const breakdown: string[] = [];

  if (baseCost === 0) {
    return {
      baseCost: 0,
      serpCost: 0,
      autonomyCost: 0,
      riskCost: 0,
      totalCost: 0,
      breakdown: ['Action not available for your plan'],
    };
  }

  let runningTotal = baseCost;
  breakdown.push(`Base AI analysis: ${baseCost} credits`);

  let serpCost = 0;
  if (includesSERP) {
    const serpMultiplier = SERP_MULTIPLIERS[planId] || 1.0;
    serpCost = Math.ceil(baseCost * (serpMultiplier - 1));
    runningTotal = Math.ceil(runningTotal * serpMultiplier);
    if (serpCost > 0) {
      breakdown.push(`SERP intelligence (×${serpMultiplier}): +${serpCost} credits`);
    }
  }

  let autonomyCost = 0;
  if (isAutoExecuted && AUTONOMY_ENABLED_ACTIONS.includes(actionType)) {
    const autonomyMultiplier = AUTONOMY_MULTIPLIERS[planId] || 1.0;
    const priorTotal = runningTotal;
    runningTotal = Math.ceil(runningTotal * autonomyMultiplier);
    autonomyCost = runningTotal - priorTotal;
    if (autonomyCost > 0) {
      breakdown.push(`Auto-execution monitoring (×${autonomyMultiplier}): +${autonomyCost} credits`);
    }
  }

  let riskCost = 0;
  if (riskLevel !== 'low') {
    const riskMultiplier = RISK_MULTIPLIERS[riskLevel];
    const priorTotal = runningTotal;
    runningTotal = Math.ceil(runningTotal * riskMultiplier);
    riskCost = runningTotal - priorTotal;
    breakdown.push(`${riskLevel} risk validation (×${riskMultiplier}): +${riskCost} credits`);
  }

  return {
    baseCost,
    serpCost,
    autonomyCost,
    riskCost,
    totalCost: runningTotal,
    breakdown,
  };
}

/**
 * Map Next Move action types to credit action types
 * Comprehensive mapping covering all possible Next Move action type strings
 */
export function mapNextMoveActionToType(nextMoveAction: string): ActionType {
  const mapping: Record<string, ActionType> = {
    // SEO-related
    'seo_optimization': 'product_seo_optimization',
    'product_seo': 'product_seo_optimization',
    'title_rewrite': 'product_seo_optimization',
    'description_enhancement': 'product_seo_optimization',
    'refresh': 'product_seo_optimization',
    
    // Bulk operations
    'bulk_seo': 'bulk_product_optimization',
    'bulk_optimization': 'bulk_product_optimization',
    
    // Image optimization
    'image_optimization': 'image_alt_text_optimization',
    
    // Cart recovery
    'cart_recovery': 'cart_recovery_setup',
    
    // Upsell
    'upsell': 'post_purchase_upsell',
    'upsell_optimization': 'post_purchase_upsell',
    
    // Competitive analysis
    'competitor_analysis': 'competitive_analysis',
    
    // Email
    'email_optimization': 'email_campaign_optimization',
    
    // Pricing
    'price_optimization': 'pricing_optimization',
    'price_adjustment': 'pricing_optimization',
    
    // Marketing
    'marketing_campaign': 'marketing_automation',
    
    // Rollback (use lowest cost action)
    'rollback': 'image_alt_text_optimization',
  };
  
  return mapping[nextMoveAction] || 'product_seo_optimization';
}
