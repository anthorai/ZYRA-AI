/**
 * ZYRA AI Execution Modes & Credit Pricing
 * 
 * Based on Master Consumption Credit Pricing System:
 * - Fast Mode: AI-powered optimization using proven internal patterns (default)
 * - Competitive Intelligence: Real-time Google SERP analysis + AI (premium, 3× cost)
 * 
 * Credits are consumed ONLY when a REAL ACTION is EXECUTED.
 * Credits are NOT consumed for monitoring, detection, scanning, or recommendations.
 */

import { ZYRA_PLANS } from './plans';

// ============================================================================
// EXECUTION MODES
// ============================================================================

export type ExecutionMode = 'fast' | 'competitive_intelligence';

export const EXECUTION_MODES = {
  FAST: 'fast' as ExecutionMode,
  COMPETITIVE_INTELLIGENCE: 'competitive_intelligence' as ExecutionMode,
} as const;

export const EXECUTION_MODE_NAMES = {
  [EXECUTION_MODES.FAST]: 'Fast Mode',
  [EXECUTION_MODES.COMPETITIVE_INTELLIGENCE]: 'Competitive Intelligence',
} as const;

export const EXECUTION_MODE_DESCRIPTIONS = {
  [EXECUTION_MODES.FAST]: 'AI-powered optimization using proven internal patterns. Faster processing, lower credit consumption.',
  [EXECUTION_MODES.COMPETITIVE_INTELLIGENCE]: 'Real-time Google SERP analysis + AI. Competitor benchmarking, higher credit consumption.',
} as const;

// Competitive Intelligence costs 3× more than Fast Mode
export const COMPETITIVE_INTELLIGENCE_MULTIPLIER = 3;

// ============================================================================
// FOUNDATION ACTIONS - One-time, Persistent, Strong Execution
// ============================================================================

export type FoundationActionType =
  | 'trust_signal_enhancement'
  | 'friction_copy_removal'
  | 'product_description_clarity'
  | 'value_proposition_alignment'
  | 'above_the_fold_optimization'
  | 'product_title_optimization'
  | 'meta_title_description_tags'
  | 'search_intent_alignment'
  | 'image_alt_text_optimization'
  | 'stale_seo_content_refresh';

export const FOUNDATION_ACTIONS: Record<FoundationActionType, {
  name: string;
  description: string;
  fastModeCredits: number;
  competitiveCredits: number;
}> = {
  trust_signal_enhancement: {
    name: 'Trust Signal Enhancement',
    description: 'Add trust badges, reviews, guarantees to product pages',
    fastModeCredits: 60,
    competitiveCredits: 105,
  },
  friction_copy_removal: {
    name: 'Friction Copy Removal',
    description: 'Remove hesitation-inducing language from product copy',
    fastModeCredits: 58,
    competitiveCredits: 90,
  },
  product_description_clarity: {
    name: 'Product Description Clarity',
    description: 'Enhance product descriptions for better clarity and conversion',
    fastModeCredits: 60,
    competitiveCredits: 135,
  },
  value_proposition_alignment: {
    name: 'Value Proposition Alignment',
    description: 'Align product value proposition with buyer intent',
    fastModeCredits: 58,
    competitiveCredits: 105,
  },
  above_the_fold_optimization: {
    name: 'Above-the-Fold Optimization',
    description: 'Optimize visible content before page scroll',
    fastModeCredits: 62,
    competitiveCredits: 150,
  },
  product_title_optimization: {
    name: 'Product Title Optimization',
    description: 'SEO-optimize product titles for search and clicks',
    fastModeCredits: 55,
    competitiveCredits: 60,
  },
  meta_title_description_tags: {
    name: 'Meta Title/Description/Tags',
    description: 'Optimize meta tags for search engine visibility',
    fastModeCredits: 58,
    competitiveCredits: 75,
  },
  search_intent_alignment: {
    name: 'Search Intent Alignment',
    description: 'Align content with user search intent patterns',
    fastModeCredits: 62,
    competitiveCredits: 165,
  },
  image_alt_text_optimization: {
    name: 'Image Alt-Text Optimization',
    description: 'Generate SEO-friendly alt text for product images',
    fastModeCredits: 55,
    competitiveCredits: 45,
  },
  stale_seo_content_refresh: {
    name: 'Stale SEO Content Refresh',
    description: 'Update outdated SEO content for improved rankings',
    fastModeCredits: 62,
    competitiveCredits: 180,
  },
};

// Total Foundation Cycle Credits (avg ~59 credits per action, 499 credits = 8-9 actions)
export const TOTAL_FOUNDATION_FAST_CREDITS = 590;
export const TOTAL_FOUNDATION_COMPETITIVE_CREDITS = 1110;

// ============================================================================
// GROWTH ACTIONS - Revenue Recovery & Expansion
// ============================================================================

export type GrowthActionType =
  | 'checkout_dropoff_mitigation'
  | 'abandoned_cart_recovery'
  | 'post_purchase_upsell_enablement';

export const GROWTH_ACTIONS: Record<GrowthActionType, {
  name: string;
  description: string;
  fastModeCredits: number;
  competitiveCredits: number;
  requiresConfidenceThreshold: boolean;
}> = {
  checkout_dropoff_mitigation: {
    name: 'Checkout Drop-Off Mitigation',
    description: 'Reduce cart abandonment at checkout stage',
    fastModeCredits: 180,
    competitiveCredits: 540,
    requiresConfidenceThreshold: true,
  },
  abandoned_cart_recovery: {
    name: 'Abandoned Cart Recovery',
    description: 'Automated recovery campaigns for abandoned carts',
    fastModeCredits: 220,
    competitiveCredits: 660,
    requiresConfidenceThreshold: true,
  },
  post_purchase_upsell_enablement: {
    name: 'Post-Purchase Upsell Enablement',
    description: 'Enable upsell opportunities after purchase',
    fastModeCredits: 160,
    competitiveCredits: 480,
    requiresConfidenceThreshold: true,
  },
};

// ============================================================================
// GUARD & INTELLIGENCE ACTIONS - Pro Plan Only
// Always run in Competitive Intelligence Mode
// ============================================================================

export type GuardActionType =
  | 'store_conversion_pattern_learning'
  | 'performance_baseline_update'
  | 'underperforming_change_rollback'
  | 'risky_optimization_freeze';

export const GUARD_ACTIONS: Record<GuardActionType, {
  name: string;
  description: string;
  credits: number;
  proOnly: boolean;
  requiresLogging: boolean;
}> = {
  store_conversion_pattern_learning: {
    name: 'Store Conversion Pattern Learning',
    description: 'Learn and adapt to store-specific conversion patterns',
    credits: 300,
    proOnly: true,
    requiresLogging: true,
  },
  performance_baseline_update: {
    name: 'Performance Baseline Update',
    description: 'Update performance benchmarks and expectations',
    credits: 200,
    proOnly: true,
    requiresLogging: true,
  },
  underperforming_change_rollback: {
    name: 'Underperforming Change Rollback',
    description: 'Automatically rollback changes that hurt performance',
    credits: 150,
    proOnly: true,
    requiresLogging: true,
  },
  risky_optimization_freeze: {
    name: 'Risky Optimization Freeze',
    description: 'Freeze potentially risky optimizations for review',
    credits: 100,
    proOnly: true,
    requiresLogging: true,
  },
};

// ============================================================================
// PLAN-BASED MODE ACCESS
// ============================================================================

export interface PlanModeAccess {
  fastModeAccess: 'full' | 'limited' | 'none';
  competitiveIntelligenceAccess: 'full' | 'limited' | 'none';
  maxCompetitiveActionsPerMonth: number | null;
  maxCompetitiveActionsPerCycle: number | null;
  guardActionsAllowed: boolean;
  requiresUserApproval: boolean;
  autoRecommendCompetitive: boolean;
}

export const PLAN_MODE_ACCESS: Record<string, PlanModeAccess> = {
  [ZYRA_PLANS.FREE]: {
    fastModeAccess: 'limited',
    competitiveIntelligenceAccess: 'none',
    maxCompetitiveActionsPerMonth: 0,
    maxCompetitiveActionsPerCycle: 0,
    guardActionsAllowed: false,
    requiresUserApproval: true,
    autoRecommendCompetitive: false,
  },
  [ZYRA_PLANS.STARTER]: {
    fastModeAccess: 'full',
    competitiveIntelligenceAccess: 'limited',
    maxCompetitiveActionsPerMonth: 2,
    maxCompetitiveActionsPerCycle: 1,
    guardActionsAllowed: false,
    requiresUserApproval: true,
    autoRecommendCompetitive: false,
  },
  [ZYRA_PLANS.GROWTH]: {
    fastModeAccess: 'full',
    competitiveIntelligenceAccess: 'full',
    maxCompetitiveActionsPerMonth: null, // Unlimited
    maxCompetitiveActionsPerCycle: null,
    guardActionsAllowed: false,
    requiresUserApproval: true, // Explicit user approval required
    autoRecommendCompetitive: false,
  },
  [ZYRA_PLANS.SCALE]: {
    fastModeAccess: 'full',
    competitiveIntelligenceAccess: 'full',
    maxCompetitiveActionsPerMonth: null, // Unlimited
    maxCompetitiveActionsPerCycle: null,
    guardActionsAllowed: true,
    requiresUserApproval: true, // User confirmation still required
    autoRecommendCompetitive: true, // Zyra may recommend automatically
  },
};

// ============================================================================
// UNIFIED ACTION TYPE (All action categories combined)
// ============================================================================

export type ZyraActionType = FoundationActionType | GrowthActionType | GuardActionType;

export type ActionCategory = 'foundation' | 'growth' | 'guard';

export function getActionCategory(actionType: ZyraActionType): ActionCategory {
  if (actionType in FOUNDATION_ACTIONS) return 'foundation';
  if (actionType in GROWTH_ACTIONS) return 'growth';
  if (actionType in GUARD_ACTIONS) return 'guard';
  return 'foundation'; // Default fallback
}

// ============================================================================
// CREDIT CALCULATION FUNCTIONS
// ============================================================================

export function getActionCredits(
  actionType: ZyraActionType,
  mode: ExecutionMode
): number {
  // Foundation Actions
  if (actionType in FOUNDATION_ACTIONS) {
    const action = FOUNDATION_ACTIONS[actionType as FoundationActionType];
    return mode === 'competitive_intelligence' 
      ? action.competitiveCredits 
      : action.fastModeCredits;
  }

  // Growth Actions
  if (actionType in GROWTH_ACTIONS) {
    const action = GROWTH_ACTIONS[actionType as GrowthActionType];
    return mode === 'competitive_intelligence'
      ? action.competitiveCredits
      : action.fastModeCredits;
  }

  // Guard Actions - Always Competitive Intelligence Mode
  if (actionType in GUARD_ACTIONS) {
    const action = GUARD_ACTIONS[actionType as GuardActionType];
    return action.credits;
  }

  return 0;
}

export function isActionAllowedForPlan(
  actionType: ZyraActionType,
  planId: string,
  mode: ExecutionMode
): { allowed: boolean; reason?: string } {
  const access = PLAN_MODE_ACCESS[planId];
  if (!access) {
    return { allowed: false, reason: 'Unknown plan' };
  }

  // Guard actions are Pro-only
  if (actionType in GUARD_ACTIONS) {
    if (!access.guardActionsAllowed) {
      return { allowed: false, reason: 'Guard actions require Pro plan' };
    }
    return { allowed: true };
  }

  // Check mode access
  if (mode === 'competitive_intelligence') {
    if (access.competitiveIntelligenceAccess === 'none') {
      return { allowed: false, reason: 'Competitive Intelligence not available on your plan' };
    }
    // For limited access, caller must check monthly limit separately
    return { allowed: true };
  }

  // Fast mode
  if (access.fastModeAccess === 'none') {
    return { allowed: false, reason: 'Fast Mode not available on your plan' };
  }

  return { allowed: true };
}

export function getStarterCompetitiveWarning(): string {
  return `⚠️ Premium Analysis Warning
Competitive Intelligence uses real-time Google SERP data
and paid external APIs.
This action will consume significantly more credits.
Starter plans have limited access to prevent overuse.`;
}

// ============================================================================
// MATERIAL CHANGE CONDITIONS (for re-execution)
// ============================================================================

export type MaterialChangeType =
  | 'product_content_changed'
  | 'product_added_removed'
  | 'store_theme_changed'
  | 'policy_pages_edited'
  | 'traffic_intent_changed'
  | 'conversion_drop_detected'
  | 'merchant_approved_reoptimization';

export const MATERIAL_CHANGE_DESCRIPTIONS: Record<MaterialChangeType, string> = {
  product_content_changed: 'Product content was changed manually',
  product_added_removed: 'New product added or removed from store',
  store_theme_changed: 'Store theme changed or reset',
  policy_pages_edited: 'Policy pages edited externally',
  traffic_intent_changed: 'Traffic intent changed (ads, keywords, funnel)',
  conversion_drop_detected: 'Statistically significant conversion drop detected',
  merchant_approved_reoptimization: 'Merchant explicitly approved re-optimization',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getAllActionTypes(): ZyraActionType[] {
  return [
    ...Object.keys(FOUNDATION_ACTIONS) as FoundationActionType[],
    ...Object.keys(GROWTH_ACTIONS) as GrowthActionType[],
    ...Object.keys(GUARD_ACTIONS) as GuardActionType[],
  ];
}

export function getActionDetails(actionType: ZyraActionType): {
  name: string;
  description: string;
  category: ActionCategory;
  fastModeCredits: number;
  competitiveCredits: number;
  proOnly: boolean;
} {
  if (actionType in FOUNDATION_ACTIONS) {
    const action = FOUNDATION_ACTIONS[actionType as FoundationActionType];
    return {
      name: action.name,
      description: action.description,
      category: 'foundation',
      fastModeCredits: action.fastModeCredits,
      competitiveCredits: action.competitiveCredits,
      proOnly: false,
    };
  }

  if (actionType in GROWTH_ACTIONS) {
    const action = GROWTH_ACTIONS[actionType as GrowthActionType];
    return {
      name: action.name,
      description: action.description,
      category: 'growth',
      fastModeCredits: action.fastModeCredits,
      competitiveCredits: action.competitiveCredits,
      proOnly: false,
    };
  }

  if (actionType in GUARD_ACTIONS) {
    const action = GUARD_ACTIONS[actionType as GuardActionType];
    return {
      name: action.name,
      description: action.description,
      category: 'guard',
      fastModeCredits: action.credits, // Guard actions only run in CI mode
      competitiveCredits: action.credits,
      proOnly: action.proOnly,
    };
  }

  throw new Error(`Unknown action type: ${actionType}`);
}

export function formatCreditCostDisplay(
  actionType: ZyraActionType,
  mode: ExecutionMode
): string {
  const credits = getActionCredits(actionType, mode);
  return `${credits} credit${credits === 1 ? '' : 's'}`;
}

export function getModeDisplayInfo(mode: ExecutionMode): {
  name: string;
  description: string;
  badge: 'default' | 'premium';
} {
  if (mode === 'competitive_intelligence') {
    return {
      name: EXECUTION_MODE_NAMES[mode],
      description: EXECUTION_MODE_DESCRIPTIONS[mode],
      badge: 'premium',
    };
  }
  return {
    name: EXECUTION_MODE_NAMES[mode],
    description: EXECUTION_MODE_DESCRIPTIONS[mode],
    badge: 'default',
  };
}
