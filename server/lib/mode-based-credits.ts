/**
 * ZYRA AI Mode-Based Credit Consumption System
 * 
 * This is the master credit consumption controller that:
 * - Prices actions correctly in credits based on execution mode
 * - Enforces mode-based credit consumption
 * - Prevents repeated, wasteful, or silent credit usage
 * - Protects margins while delivering merchant value
 * 
 * Credits are consumed ONLY when a REAL ACTION is EXECUTED.
 * Credits are NOT consumed for: Monitoring, Detection, Scanning, Verification, Recommendations
 */

import { getUserUsageStats, incrementUsageStat, getUserSubscription, getSubscriptionPlanById } from '../db';
import { CREDIT_LIMITS, ZYRA_PLANS, PLAN_NAMES } from './constants/plans';
import {
  ExecutionMode,
  EXECUTION_MODES,
  EXECUTION_MODE_NAMES,
  ZyraActionType,
  FoundationActionType,
  GrowthActionType,
  GuardActionType,
  ActionCategory,
  getActionCredits,
  getActionCategory,
  getActionDetails,
  isActionAllowedForPlan,
  getStarterCompetitiveWarning,
  PLAN_MODE_ACCESS,
  FOUNDATION_ACTIONS,
  GROWTH_ACTIONS,
  GUARD_ACTIONS,
} from './constants/execution-modes';
import {
  checkActionLock,
  createActionLock,
  checkCompetitiveIntelligenceLimit,
  recordCompetitiveIntelligenceUsage,
  generateContentHash,
} from './action-lock-service';
import { realLearningService } from './real-learning-service';

// ============================================================================
// Types
// ============================================================================

export interface ModeBasedCreditCheckResult {
  allowed: boolean;
  isLocked: boolean;
  hasEnoughCredits: boolean;
  creditCost: number;
  creditsRemaining: number;
  creditLimit: number;
  executionMode: ExecutionMode;
  actionDetails: {
    name: string;
    description: string;
    category: ActionCategory;
  };
  message: string;
  warnings: string[];
  requiresConfirmation: boolean;
  confirmationMessage?: string;
}

export interface ExecuteActionResult {
  success: boolean;
  creditsConsumed: number;
  lockId?: string;
  changeId?: string | null;
  baselineSnapshotId?: string | null;
  message: string;
  newBalance: number;
}

export interface CreditCostPreview {
  fastModeCredits: number;
  competitiveCredits: number;
  selectedModeCredits: number;
  savings: number;
  modeRecommendation: 'fast' | 'competitive_intelligence' | 'either';
  modeRecommendationReason: string;
}

// ============================================================================
// Credit Check Functions
// ============================================================================

export async function checkModeBasedCredits(
  userId: string,
  actionType: ZyraActionType,
  mode: ExecutionMode,
  entityType: string,
  entityId: string
): Promise<ModeBasedCreditCheckResult> {
  const warnings: string[] = [];
  let requiresConfirmation = false;
  let confirmationMessage: string | undefined;

  // Get user subscription
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    return {
      allowed: false,
      isLocked: false,
      hasEnoughCredits: false,
      creditCost: 0,
      creditsRemaining: 0,
      creditLimit: 0,
      executionMode: mode,
      actionDetails: getActionDetails(actionType),
      message: 'No active subscription found',
      warnings: [],
      requiresConfirmation: false,
    };
  }

  const planId = subscription.planId;
  const planName = PLAN_NAMES[planId as keyof typeof PLAN_NAMES] || 'Unknown';

  // Check if action is allowed for this plan and mode
  const actionCheck = isActionAllowedForPlan(actionType, planId, mode);
  if (!actionCheck.allowed) {
    return {
      allowed: false,
      isLocked: false,
      hasEnoughCredits: false,
      creditCost: 0,
      creditsRemaining: 0,
      creditLimit: CREDIT_LIMITS[planId as keyof typeof CREDIT_LIMITS] || 0,
      executionMode: mode,
      actionDetails: getActionDetails(actionType),
      message: actionCheck.reason || 'Action not allowed for your plan',
      warnings: [],
      requiresConfirmation: false,
    };
  }

  // Check action lock status (prevent duplicate execution)
  const lockCheck = await checkActionLock(userId, entityType, entityId, actionType);
  if (lockCheck.isLocked) {
    return {
      allowed: false,
      isLocked: true,
      hasEnoughCredits: true, // Doesn't matter, action is locked
      creditCost: 0,
      creditsRemaining: 0,
      creditLimit: CREDIT_LIMITS[planId as keyof typeof CREDIT_LIMITS] || 0,
      executionMode: mode,
      actionDetails: getActionDetails(actionType),
      message: lockCheck.message,
      warnings: ['Locked until store changes'],
      requiresConfirmation: false,
    };
  }

  // Check Competitive Intelligence limits for Starter plan
  if (mode === 'competitive_intelligence') {
    const ciLimit = await checkCompetitiveIntelligenceLimit(userId, planId);
    if (!ciLimit.allowed) {
      return {
        allowed: false,
        isLocked: false,
        hasEnoughCredits: false,
        creditCost: 0,
        creditsRemaining: 0,
        creditLimit: CREDIT_LIMITS[planId as keyof typeof CREDIT_LIMITS] || 0,
        executionMode: mode,
        actionDetails: getActionDetails(actionType),
        message: ciLimit.message || 'Competitive Intelligence limit reached',
        warnings: [],
        requiresConfirmation: false,
      };
    }

    // Show warning for Starter plan
    if (planId === ZYRA_PLANS.STARTER) {
      requiresConfirmation = true;
      confirmationMessage = getStarterCompetitiveWarning();
      warnings.push(`${ciLimit.currentCount}/${ciLimit.maxAllowed} Competitive Intelligence actions used this month`);
    }

    // Credit warning for all plans using CI
    warnings.push('Competitive Intelligence uses 3× more credits than Fast Mode');
  }

  // Calculate credit cost
  const creditCost = getActionCredits(actionType, mode);

  // Get current balance
  const plan = await getSubscriptionPlanById(planId);
  const creditLimit = (plan?.limits as any)?.credits || CREDIT_LIMITS[planId as keyof typeof CREDIT_LIMITS] || 0;
  const stats = await getUserUsageStats(userId);
  const creditsUsed = stats?.creditsUsed || 0;
  const creditsRemaining = Math.max(0, creditLimit - creditsUsed);

  const hasEnoughCredits = creditsRemaining >= creditCost;

  if (!hasEnoughCredits) {
    warnings.push(`Insufficient credits. Need ${creditCost}, have ${creditsRemaining}`);
  }

  // Low credit warning (20% threshold)
  const lowThreshold = Math.ceil(creditLimit * 0.2);
  if (hasEnoughCredits && creditsRemaining <= lowThreshold) {
    warnings.push('Credits running low. ZYRA is focusing on revenue-critical actions.');
  }

  return {
    allowed: hasEnoughCredits && !lockCheck.isLocked,
    isLocked: lockCheck.isLocked,
    hasEnoughCredits,
    creditCost,
    creditsRemaining,
    creditLimit,
    executionMode: mode,
    actionDetails: getActionDetails(actionType),
    message: hasEnoughCredits 
      ? `Ready to execute with ${creditCost} credits` 
      : `Insufficient credits (need ${creditCost}, have ${creditsRemaining})`,
    warnings,
    requiresConfirmation,
    confirmationMessage,
  };
}

// ============================================================================
// Credit Consumption Functions
// ============================================================================

export async function executeAndConsumeCredits(
  userId: string,
  actionType: ZyraActionType,
  mode: ExecutionMode,
  entityType: string,
  entityId: string,
  entityContent?: Record<string, any>
): Promise<ExecuteActionResult> {
  // First, do a full check
  const check = await checkModeBasedCredits(userId, actionType, mode, entityType, entityId);

  if (!check.allowed) {
    return {
      success: false,
      creditsConsumed: 0,
      message: check.message,
      newBalance: check.creditsRemaining,
    };
  }

  const creditCost = check.creditCost;
  const subscription = await getUserSubscription(userId);
  const planId = subscription?.planId || ZYRA_PLANS.FREE;

  try {
    // =========================================================================
    // REAL LEARNING: Capture baseline before optimization
    // =========================================================================
    let baselineSnapshotId: string | null = null;
    
    if (entityType === 'product' && entityContent) {
      try {
        baselineSnapshotId = await realLearningService.captureBaseline(
          userId,
          entityId,
          {
            title: entityContent.title || '',
            description: entityContent.description || '',
            price: parseFloat(entityContent.price?.toString() || '0'),
            seoHealthScore: entityContent.seoHealthScore,
          },
          {
            pageViews: entityContent.pageViews || 0,
            addToCartCount: entityContent.addToCartCount || 0,
            addToCartRate: entityContent.addToCartRate || 0,
            purchaseCount: entityContent.purchaseCount || 0,
            conversionRate: entityContent.conversionRate || 0,
            totalRevenue: entityContent.totalRevenue || 0,
            seoHealthScore: entityContent.seoHealthScore || 0,
          }
        );
        console.log(`📊 [Credits] Baseline captured: ${baselineSnapshotId}`);
      } catch (baselineError) {
        console.error('Error capturing baseline:', baselineError);
        // Don't fail the execution if baseline capture fails
      }
    }

    // Consume credits
    await incrementUsageStat(userId, 'creditsUsed', creditCost);

    // Update remaining credits
    const stats = await getUserUsageStats(userId);
    const newRemaining = check.creditLimit - (check.creditsRemaining - creditCost + (stats?.creditsUsed || 0));
    if (stats) {
      await incrementUsageStat(userId, 'creditsRemaining', -(stats.creditsRemaining || 0) + Math.max(0, check.creditsRemaining - creditCost));
    }

    // Create content hash for change detection
    const contentHash = entityContent ? generateContentHash(entityContent) : undefined;

    // Create action lock
    const lockResult = await createActionLock(
      userId,
      entityType,
      entityId,
      actionType,
      mode,
      creditCost,
      contentHash
    );

    // Record Competitive Intelligence usage for tracking
    if (mode === 'competitive_intelligence') {
      await recordCompetitiveIntelligenceUsage(userId, actionType, creditCost, lockResult.lockId);
    }

    // =========================================================================
    // REAL LEARNING: Record the optimization change
    // =========================================================================
    let changeId: string | null = null;
    
    if (entityType === 'product' && entityContent) {
      try {
        // Determine what field was changed based on action type
        const changeField = getChangeFieldFromActionType(actionType);
        
        changeId = await realLearningService.recordChange(
          userId,
          entityId,
          baselineSnapshotId,
          actionType,
          {
            field: changeField,
            oldValue: entityContent[`old_${changeField}`] || entityContent.originalValue || null,
            newValue: entityContent[`new_${changeField}`] || entityContent.newValue || null,
          },
          {
            actionCategory: getActionCategory(actionType),
            executionMode: mode,
            aiReasoning: entityContent.aiReasoning || null,
            serpDataUsed: mode === 'competitive_intelligence',
            keywordsAdded: entityContent.keywordsAdded,
            patternsApplied: entityContent.patternsApplied,
            creditsConsumed: creditCost,
          }
        );
        console.log(`📝 [Credits] Change recorded: ${changeId}`);
      } catch (changeError) {
        console.error('Error recording change:', changeError);
        // Don't fail the execution if change recording fails
      }
    }

    return {
      success: true,
      creditsConsumed: creditCost,
      lockId: lockResult.lockId,
      changeId,
      baselineSnapshotId,
      message: `Action executed successfully. ${creditCost} credits consumed.`,
      newBalance: Math.max(0, check.creditsRemaining - creditCost),
    };
  } catch (error) {
    console.error('Error executing action:', error);
    return {
      success: false,
      creditsConsumed: 0,
      message: 'Failed to execute action',
      newBalance: check.creditsRemaining,
    };
  }
}

/**
 * Map action type to the primary field being changed
 */
function getChangeFieldFromActionType(actionType: ZyraActionType): string {
  const fieldMap: Record<string, string> = {
    // Foundation actions
    'product_title_optimization': 'title',
    'product_description_enhancement': 'description',
    'meta_title_optimization': 'meta_title',
    'meta_description_optimization': 'meta_description',
    'image_alt_text_optimization': 'image_alt_text',
    'seo_keyword_optimization': 'keywords',
    
    // Growth actions
    'search_intent_alignment': 'description',
    'conversion_copy_rewrite': 'description',
    'trust_signal_injection': 'description',
    'price_perception_optimization': 'price_presentation',
    'scarcity_urgency_messaging': 'urgency_messaging',
    'cross_sell_bundle_suggestions': 'cross_sells',
    
    // Guard actions
    'stale_seo_content_refresh': 'description',
    'broken_link_detection': 'links',
    'image_quality_check': 'images',
    'inventory_sync_validation': 'inventory',
  };
  
  return fieldMap[actionType] || 'content';
}

// ============================================================================
// Cost Preview Functions
// ============================================================================

export function getCreditCostPreview(
  actionType: ZyraActionType,
  selectedMode: ExecutionMode
): CreditCostPreview {
  const fastModeCredits = getActionCredits(actionType, 'fast');
  const competitiveCredits = getActionCredits(actionType, 'competitive_intelligence');
  const selectedModeCredits = selectedMode === 'competitive_intelligence' ? competitiveCredits : fastModeCredits;
  const savings = selectedMode === 'fast' ? competitiveCredits - fastModeCredits : 0;

  // Determine recommendation based on action type
  const category = getActionCategory(actionType);
  let modeRecommendation: 'fast' | 'competitive_intelligence' | 'either' = 'fast';
  let modeRecommendationReason = 'Fast Mode is recommended for most optimizations';

  if (category === 'guard') {
    modeRecommendation = 'competitive_intelligence';
    modeRecommendationReason = 'Guard actions always use Competitive Intelligence for maximum accuracy';
  } else if (actionType === 'search_intent_alignment' || actionType === 'stale_seo_content_refresh') {
    modeRecommendation = 'either';
    modeRecommendationReason = 'Consider Competitive Intelligence for better search ranking insights';
  }

  return {
    fastModeCredits,
    competitiveCredits,
    selectedModeCredits,
    savings,
    modeRecommendation,
    modeRecommendationReason,
  };
}

export function getFullCycleCredits(mode: ExecutionMode): {
  foundationCredits: number;
  growthCredits: number;
  totalCredits: number;
  actions: Array<{ name: string; credits: number }>;
} {
  const foundationActions = Object.entries(FOUNDATION_ACTIONS).map(([key, action]) => ({
    name: action.name,
    credits: mode === 'competitive_intelligence' ? action.competitiveCredits : action.fastModeCredits,
  }));

  const growthActions = Object.entries(GROWTH_ACTIONS).map(([key, action]) => ({
    name: action.name,
    credits: mode === 'competitive_intelligence' ? action.competitiveCredits : action.fastModeCredits,
  }));

  const foundationCredits = foundationActions.reduce((sum, a) => sum + a.credits, 0);
  const growthCredits = growthActions.reduce((sum, a) => sum + a.credits, 0);

  return {
    foundationCredits,
    growthCredits,
    totalCredits: foundationCredits + growthCredits,
    actions: [...foundationActions, ...growthActions],
  };
}

// ============================================================================
// Display Helper Functions
// ============================================================================

export function formatCreditDisplay(credits: number): string {
  return credits === 1 ? '1 credit' : `${credits} credits`;
}

export function getModeDisplayBadge(mode: ExecutionMode): {
  label: string;
  variant: 'default' | 'premium';
  icon: string;
} {
  if (mode === 'competitive_intelligence') {
    return {
      label: 'Competitive Intelligence',
      variant: 'premium',
      icon: '🔍',
    };
  }
  return {
    label: 'Fast Mode',
    variant: 'default',
    icon: '⚡',
  };
}

export function getCreditBreakdown(
  actionType: ZyraActionType,
  mode: ExecutionMode
): {
  baseCost: number;
  modeName: string;
  modeMultiplier: string;
  breakdown: string[];
} {
  const details = getActionDetails(actionType);
  const baseCost = details.fastModeCredits;
  const finalCost = getActionCredits(actionType, mode);

  const breakdown: string[] = [];
  breakdown.push(`Base ${details.name}: ${baseCost} credits`);

  if (mode === 'competitive_intelligence') {
    const serpCost = finalCost - baseCost;
    breakdown.push(`SERP Intelligence (×3): +${serpCost} credits`);
  }

  breakdown.push(`Total: ${finalCost} credits`);

  return {
    baseCost,
    modeName: EXECUTION_MODE_NAMES[mode],
    modeMultiplier: mode === 'competitive_intelligence' ? '×3' : '×1',
    breakdown,
  };
}

// ============================================================================
// Plan Estimate Functions
// ============================================================================

export function getEstimatedCyclesPerPlan(mode: ExecutionMode): Record<string, number> {
  const cycleCredits = getFullCycleCredits(mode).foundationCredits;

  return {
    [ZYRA_PLANS.FREE]: Math.floor(499 / cycleCredits),
    [ZYRA_PLANS.STARTER]: Math.floor(2000 / cycleCredits),
    [ZYRA_PLANS.GROWTH]: Math.floor(10000 / cycleCredits),
    [ZYRA_PLANS.SCALE]: Math.floor(20000 / cycleCredits),
  };
}

// ============================================================================
// Validation Functions
// ============================================================================

export function validateActionTypeExists(actionType: string): actionType is ZyraActionType {
  return (
    actionType in FOUNDATION_ACTIONS ||
    actionType in GROWTH_ACTIONS ||
    actionType in GUARD_ACTIONS
  );
}

export function validateExecutionMode(mode: string): mode is ExecutionMode {
  return mode === 'fast' || mode === 'competitive_intelligence';
}
