/**
 * ZYRA AI Plan Access Controller
 * 
 * Enforces plan-based restrictions for all ZYRA actions following the revenue loop:
 * DETECT → DECIDE → EXECUTE → PROVE → LEARN
 * 
 * PLAN HIERARCHY:
 * - Starter+ ($49): Manual approval required, single-product only, basic features
 * - Growth ($249): Auto-run low-risk actions, bulk optimization, advanced recovery
 * - Scale ($499): Full autonomy, SERP competitive intelligence, per-action controls
 * 
 * ENFORCEMENT RULES:
 * - This controller is called BEFORE any action execution
 * - Restrictions are enforced in backend logic, not just UI
 * - Every action still supports rollback and revenue tracking regardless of plan
 */

import { ZYRA_PLANS, getPlanIdByName, PLAN_NAMES } from './constants/plans';

// ============================================
// PLAN FEATURE DEFINITIONS
// ============================================

export type ActionType = 
  | 'optimize_seo'
  | 'bulk_optimize_seo'
  | 'adjust_price'
  | 'bulk_adjust_price'
  | 'send_cart_recovery'
  | 'advanced_cart_recovery'
  | 'post_purchase_upsell'
  | 'send_campaign'
  | 'competitive_intelligence'
  | 'brand_voice_optimization'
  | 'scheduled_content_refresh'
  | 'per_product_autonomy'
  | 'per_action_autonomy';

export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high';

export type AutonomyLevel = 'manual' | 'semi_auto' | 'auto' | 'full_auto';

export type ExecutionSpeed = 'standard' | 'fast' | 'priority';

// Risk classification for actions
export const ACTION_RISK_LEVELS: Record<ActionType, RiskLevel> = {
  'optimize_seo': 'low',
  'bulk_optimize_seo': 'medium',
  'adjust_price': 'medium',
  'bulk_adjust_price': 'high',
  'send_cart_recovery': 'low',
  'advanced_cart_recovery': 'medium',
  'post_purchase_upsell': 'low',
  'send_campaign': 'medium',
  'competitive_intelligence': 'low',
  'brand_voice_optimization': 'low',
  'scheduled_content_refresh': 'low',
  'per_product_autonomy': 'medium',
  'per_action_autonomy': 'high',
};

// Very low risk actions that can auto-run even on Starter+
export const VERY_LOW_RISK_ACTIONS = [
  'image_alt_text',      // Image alt-text optimization
  'minor_seo_meta',      // Minor SEO meta tag fixes
];

// ============================================
// PLAN CAPABILITY DEFINITIONS
// ============================================

interface PlanCapabilities {
  // Autonomy settings
  autonomyLevel: AutonomyLevel;
  executionSpeed: ExecutionSpeed;
  
  // Feature access
  allowedActions: ActionType[];
  maxActionsPerDay: number;
  maxProductsPerBulkAction: number;
  
  // Automation controls
  canAutoRunLowRisk: boolean;
  canAutoRunMediumRisk: boolean;
  canAutoRunHighRisk: boolean;
  requiresApprovalForMostActions: boolean;
  
  // Advanced features
  hasSerpIntelligence: boolean;
  hasBrandVoiceIntelligence: boolean;
  hasScheduledRefresh: boolean;
  hasAdvancedCartRecovery: boolean;
  hasUnlimitedUpsells: boolean;
  hasPerProductAutonomy: boolean;
  hasPerActionAutonomy: boolean;
  
  // Cart recovery limits
  maxCartRecoveryChannels: number; // 1 = SMS OR email, 2 = both
  
  // Behavior messages
  approvalMessage: string;
  executedMessage: string;
}

export const PLAN_CAPABILITIES: Record<string, PlanCapabilities> = {
  // ============================================
  // STARTER+ ($49) - "Powerful but cautious assistant"
  // ============================================
  [ZYRA_PLANS.STARTER]: {
    autonomyLevel: 'manual',
    executionSpeed: 'standard',
    
    allowedActions: [
      'optimize_seo',
      'send_cart_recovery',
      'post_purchase_upsell',
      'brand_voice_optimization',
    ],
    maxActionsPerDay: 10,
    maxProductsPerBulkAction: 1, // Single-product only
    
    canAutoRunLowRisk: false,
    canAutoRunMediumRisk: false,
    canAutoRunHighRisk: false,
    requiresApprovalForMostActions: true,
    
    hasSerpIntelligence: false,
    hasBrandVoiceIntelligence: true, // Basic brand voice
    hasScheduledRefresh: false,
    hasAdvancedCartRecovery: false,
    hasUnlimitedUpsells: false,
    hasPerProductAutonomy: false,
    hasPerActionAutonomy: false,
    
    maxCartRecoveryChannels: 1, // SMS OR email, not both
    
    approvalMessage: "Approve to apply this change safely.",
    executedMessage: "Action executed after your approval.",
  },

  // ============================================
  // GROWTH ($249) - "Trusted autonomous operator"
  // ============================================
  [ZYRA_PLANS.GROWTH]: {
    autonomyLevel: 'semi_auto',
    executionSpeed: 'fast',
    
    allowedActions: [
      'optimize_seo',
      'bulk_optimize_seo',
      'adjust_price',
      'send_cart_recovery',
      'advanced_cart_recovery',
      'post_purchase_upsell',
      'send_campaign',
      'brand_voice_optimization',
      'scheduled_content_refresh',
    ],
    maxActionsPerDay: 50,
    maxProductsPerBulkAction: 100,
    
    canAutoRunLowRisk: true,
    canAutoRunMediumRisk: false,
    canAutoRunHighRisk: false,
    requiresApprovalForMostActions: false,
    
    hasSerpIntelligence: false,
    hasBrandVoiceIntelligence: true, // Full brand voice
    hasScheduledRefresh: true,
    hasAdvancedCartRecovery: true,
    hasUnlimitedUpsells: true,
    hasPerProductAutonomy: false,
    hasPerActionAutonomy: false,
    
    maxCartRecoveryChannels: 2, // Both SMS and email
    
    approvalMessage: "This action requires your approval before execution.",
    executedMessage: "ZYRA applied this automatically based on proven results.",
  },

  // ============================================
  // SCALE ($499) - "Hands-free revenue engine"
  // ============================================
  [ZYRA_PLANS.SCALE]: {
    autonomyLevel: 'full_auto',
    executionSpeed: 'priority',
    
    allowedActions: [
      'optimize_seo',
      'bulk_optimize_seo',
      'adjust_price',
      'bulk_adjust_price',
      'send_cart_recovery',
      'advanced_cart_recovery',
      'post_purchase_upsell',
      'send_campaign',
      'competitive_intelligence',
      'brand_voice_optimization',
      'scheduled_content_refresh',
      'per_product_autonomy',
      'per_action_autonomy',
    ],
    maxActionsPerDay: 200,
    maxProductsPerBulkAction: 1000,
    
    canAutoRunLowRisk: true,
    canAutoRunMediumRisk: true,
    canAutoRunHighRisk: false, // Still requires approval for high-risk
    requiresApprovalForMostActions: false,
    
    hasSerpIntelligence: true, // Real-time SERP competitive intelligence
    hasBrandVoiceIntelligence: true,
    hasScheduledRefresh: true,
    hasAdvancedCartRecovery: true,
    hasUnlimitedUpsells: true,
    hasPerProductAutonomy: true,
    hasPerActionAutonomy: true,
    
    maxCartRecoveryChannels: 2,
    
    approvalMessage: "This high-impact action requires your approval.",
    executedMessage: "ZYRA optimized this automatically to maximize revenue.",
  },

  // ============================================
  // FREE TRIAL - Same as Starter+ with limits
  // ============================================
  [ZYRA_PLANS.FREE]: {
    autonomyLevel: 'manual',
    executionSpeed: 'standard',
    
    allowedActions: [
      'optimize_seo',
      'send_cart_recovery',
      'post_purchase_upsell',
    ],
    maxActionsPerDay: 5, // Limited during trial
    maxProductsPerBulkAction: 1,
    
    canAutoRunLowRisk: false,
    canAutoRunMediumRisk: false,
    canAutoRunHighRisk: false,
    requiresApprovalForMostActions: true,
    
    hasSerpIntelligence: false,
    hasBrandVoiceIntelligence: false,
    hasScheduledRefresh: false,
    hasAdvancedCartRecovery: false,
    hasUnlimitedUpsells: false,
    hasPerProductAutonomy: false,
    hasPerActionAutonomy: false,
    
    maxCartRecoveryChannels: 1,
    
    approvalMessage: "Approve to apply this change safely.",
    executedMessage: "Action executed after your approval.",
  },
};

// ============================================
// ACCESS CONTROL FUNCTIONS
// ============================================

export interface PlanAccessResult {
  allowed: boolean;
  reason?: string;
  requiresApproval: boolean;
  planName: string;
  upgradeHint?: string;
}

/**
 * Get plan capabilities for a user's plan
 */
export function getPlanCapabilities(planName: string): PlanCapabilities {
  const planId = getPlanIdByName(planName);
  return PLAN_CAPABILITIES[planId] || PLAN_CAPABILITIES[ZYRA_PLANS.FREE];
}

/**
 * Check if an action is allowed for the user's plan
 * This is the main enforcement function called before any action execution
 */
export function checkActionAccess(
  planName: string,
  actionType: ActionType,
  options?: {
    productCount?: number;      // For bulk actions
    isAutoExecution?: boolean;  // True if triggered automatically (not manually approved)
  }
): PlanAccessResult {
  const planId = getPlanIdByName(planName);
  const capabilities = PLAN_CAPABILITIES[planId] || PLAN_CAPABILITIES[ZYRA_PLANS.FREE];
  const displayPlanName = PLAN_NAMES[planId as keyof typeof PLAN_NAMES] || 'Free Trial';
  
  // Check if action type is allowed for this plan
  if (!capabilities.allowedActions.includes(actionType)) {
    return {
      allowed: false,
      reason: `This action is not available on your current plan.`,
      requiresApproval: true,
      planName: displayPlanName,
      upgradeHint: getUpgradeHintForAction(actionType),
    };
  }
  
  // Check bulk action limits
  const productCount = options?.productCount || 1;
  if (productCount > capabilities.maxProductsPerBulkAction) {
    return {
      allowed: false,
      reason: `Your plan allows optimizing up to ${capabilities.maxProductsPerBulkAction} products at once.`,
      requiresApproval: true,
      planName: displayPlanName,
      upgradeHint: `Upgrade to process up to ${getHigherPlanLimit(planId, 'maxProductsPerBulkAction')} products at once.`,
    };
  }
  
  // Determine if approval is required based on risk level and plan
  const riskLevel = ACTION_RISK_LEVELS[actionType] || 'medium';
  const isAutoExecution = options?.isAutoExecution || false;
  
  let requiresApproval = true;
  
  if (isAutoExecution) {
    // Check if this plan can auto-execute based on risk level
    switch (riskLevel) {
      case 'very_low':
        // Very low risk can auto-run on all plans
        requiresApproval = false;
        break;
      case 'low':
        requiresApproval = !capabilities.canAutoRunLowRisk;
        break;
      case 'medium':
        requiresApproval = !capabilities.canAutoRunMediumRisk;
        break;
      case 'high':
        requiresApproval = !capabilities.canAutoRunHighRisk;
        break;
    }
  } else {
    // Manual execution with approval
    requiresApproval = false;
  }
  
  // If auto-execution is requested but plan requires approval, block it
  if (isAutoExecution && requiresApproval) {
    return {
      allowed: false,
      reason: `Automatic execution of ${riskLevel}-risk actions requires approval on your plan.`,
      requiresApproval: true,
      planName: displayPlanName,
      upgradeHint: `Upgrade to enable automatic execution of ${riskLevel}-risk actions.`,
    };
  }
  
  return {
    allowed: true,
    requiresApproval,
    planName: displayPlanName,
  };
}

/**
 * Check if SERP competitive intelligence is available
 */
export function hasSerpAccess(planName: string): boolean {
  const capabilities = getPlanCapabilities(planName);
  return capabilities.hasSerpIntelligence;
}

/**
 * Check if bulk operations are allowed
 */
export function canUseBulkOperations(planName: string): boolean {
  const capabilities = getPlanCapabilities(planName);
  return capabilities.maxProductsPerBulkAction > 1;
}

/**
 * Get the maximum products allowed for bulk operations
 */
export function getMaxBulkProducts(planName: string): number {
  const capabilities = getPlanCapabilities(planName);
  return capabilities.maxProductsPerBulkAction;
}

/**
 * Get execution speed multiplier for action processing
 * Standard = 1x, Fast = 1.5x, Priority = 2x
 */
export function getExecutionSpeedMultiplier(planName: string): number {
  const capabilities = getPlanCapabilities(planName);
  switch (capabilities.executionSpeed) {
    case 'priority': return 2.0;
    case 'fast': return 1.5;
    default: return 1.0;
  }
}

/**
 * Get the daily action limit for a plan
 */
export function getDailyActionLimit(planName: string): number {
  const capabilities = getPlanCapabilities(planName);
  return capabilities.maxActionsPerDay;
}

/**
 * Check if plan has advanced cart recovery (multi-channel, escalation)
 */
export function hasAdvancedCartRecovery(planName: string): boolean {
  const capabilities = getPlanCapabilities(planName);
  return capabilities.hasAdvancedCartRecovery;
}

/**
 * Get cart recovery channel limit
 */
export function getCartRecoveryChannelLimit(planName: string): number {
  const capabilities = getPlanCapabilities(planName);
  return capabilities.maxCartRecoveryChannels;
}

/**
 * Check if scheduled content refresh is available
 */
export function hasScheduledRefresh(planName: string): boolean {
  const capabilities = getPlanCapabilities(planName);
  return capabilities.hasScheduledRefresh;
}

/**
 * Check if per-product autonomy controls are available
 */
export function hasPerProductAutonomy(planName: string): boolean {
  const capabilities = getPlanCapabilities(planName);
  return capabilities.hasPerProductAutonomy;
}

/**
 * Get the appropriate message for action execution based on plan
 */
export function getExecutionMessage(planName: string, wasAutoExecuted: boolean): string {
  const capabilities = getPlanCapabilities(planName);
  return wasAutoExecuted ? capabilities.executedMessage : capabilities.approvalMessage;
}

/**
 * Determine if an action should auto-execute or require approval
 */
export function shouldAutoExecute(
  planName: string,
  actionType: ActionType,
  overrideSettings?: { forceApproval?: boolean; forceAuto?: boolean }
): boolean {
  if (overrideSettings?.forceApproval) return false;
  if (overrideSettings?.forceAuto) return true;
  
  const capabilities = getPlanCapabilities(planName);
  const riskLevel = ACTION_RISK_LEVELS[actionType] || 'medium';
  
  // Check VERY_LOW_RISK_ACTIONS for any plan
  if (VERY_LOW_RISK_ACTIONS.includes(actionType as any)) {
    return true;
  }
  
  switch (riskLevel) {
    case 'very_low':
      return true; // All plans auto-run very low risk
    case 'low':
      return capabilities.canAutoRunLowRisk;
    case 'medium':
      return capabilities.canAutoRunMediumRisk;
    case 'high':
      return capabilities.canAutoRunHighRisk;
    default:
      return false;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getUpgradeHintForAction(actionType: ActionType): string {
  const upgradeHints: Record<ActionType, string> = {
    'optimize_seo': 'Upgrade to access SEO optimization.',
    'bulk_optimize_seo': 'Upgrade to Growth for bulk SEO optimization.',
    'adjust_price': 'Upgrade to Growth for pricing optimization.',
    'bulk_adjust_price': 'Upgrade to Scale for bulk pricing changes.',
    'send_cart_recovery': 'Upgrade to access cart recovery.',
    'advanced_cart_recovery': 'Upgrade to Growth for advanced cart recovery.',
    'post_purchase_upsell': 'Upgrade to access post-purchase upsells.',
    'send_campaign': 'Upgrade to Growth for marketing campaigns.',
    'competitive_intelligence': 'Upgrade to Scale for real-time SERP competitive intelligence.',
    'brand_voice_optimization': 'Upgrade to access brand voice optimization.',
    'scheduled_content_refresh': 'Upgrade to Growth for scheduled content refresh.',
    'per_product_autonomy': 'Upgrade to Scale for per-product autonomy controls.',
    'per_action_autonomy': 'Upgrade to Scale for per-action autonomy controls.',
  };
  return upgradeHints[actionType] || 'Upgrade to access this feature.';
}

function getHigherPlanLimit(currentPlanId: string, limitType: keyof PlanCapabilities): number {
  // Return the next tier's limit
  if (currentPlanId === ZYRA_PLANS.FREE || currentPlanId === ZYRA_PLANS.STARTER) {
    return PLAN_CAPABILITIES[ZYRA_PLANS.GROWTH][limitType] as number;
  }
  if (currentPlanId === ZYRA_PLANS.GROWTH) {
    return PLAN_CAPABILITIES[ZYRA_PLANS.SCALE][limitType] as number;
  }
  return PLAN_CAPABILITIES[ZYRA_PLANS.SCALE][limitType] as number;
}

/**
 * Validate that a user's plan allows the requested action
 * This is called by the approval executor and action processor
 */
export interface PlanValidationResult {
  allowed: boolean;
  reason?: string;
  violationType?: 'plan_restriction' | 'feature_locked' | 'limit_exceeded';
  requiresApproval?: boolean;
}

export async function validatePlanAccess(
  userId: string,
  planName: string,
  actionType: string,
  options?: {
    productCount?: number;
    isAutoExecution?: boolean;
  }
): Promise<PlanValidationResult> {
  const result = checkActionAccess(
    planName,
    actionType as ActionType,
    options
  );
  
  if (!result.allowed) {
    return {
      allowed: false,
      reason: result.reason,
      violationType: 'plan_restriction',
      requiresApproval: result.requiresApproval,
    };
  }
  
  return {
    allowed: true,
    requiresApproval: result.requiresApproval,
  };
}
