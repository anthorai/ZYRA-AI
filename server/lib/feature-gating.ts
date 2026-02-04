/**
 * ZYRA ACTION-BASED PERMISSION SYSTEM
 * 
 * This file defines which ZYRA actions are available per subscription plan.
 * Actions are organized by category (Foundation, Growth, Guard) matching
 * the Master Action Registry's 51 actions.
 * 
 * Plan Permissions:
 *   FREE/STARTER - Foundation: FULL, Growth: LIMITED, Guard: ROLLBACK_ONLY
 *   GROWTH       - Foundation: FULL, Growth: FULL, Guard: LIMITED
 *   PRO (SCALE)  - Foundation: FULL, Growth: FULL, Guard: FULL
 */

import { ZYRA_PLANS } from "./constants/plans";
import type { ActionId } from "./zyra-master-loop/master-action-registry";

// ============================================================================
// ACTION CATEGORIES
// ============================================================================

export type ActionCategory = 'FOUNDATION' | 'GROWTH' | 'GUARD';

// Foundation Actions (10 main actions, 30 sub-actions) - Make the store trustworthy & searchable
export const FOUNDATION_ACTIONS: ActionId[] = [
  'trust_signal_enhancement',
  'friction_copy_removal',
  'product_description_clarity',
  'value_proposition_alignment',
  'above_fold_optimization',
  'product_title_optimization',
  'meta_optimization',
  'search_intent_alignment',
  'image_alt_text_optimization',
  'stale_seo_refresh',
];

// Growth Actions (3 main actions, 9 sub-actions) - Convert better & increase revenue
export const GROWTH_ACTIONS: ActionId[] = [
  'checkout_dropoff_mitigation',
  'abandoned_cart_recovery',
  'post_purchase_upsell',
];

// Guard Actions (4 main actions, 12 sub-actions) - Protect revenue & learn
export const GUARD_ACTIONS: ActionId[] = [
  'conversion_pattern_learning',
  'performance_baseline_update',
  'underperforming_rollback',
  'risky_optimization_freeze',
];

// All 17 main actions (51 sub-actions total)
export const ALL_ACTIONS: ActionId[] = [
  ...FOUNDATION_ACTIONS,
  ...GROWTH_ACTIONS,
  ...GUARD_ACTIONS,
];

// ============================================================================
// PLAN ACTION PERMISSIONS
// ============================================================================

export type PermissionLevel = 'NONE' | 'ROLLBACK_ONLY' | 'LIMITED' | 'FULL';

export interface PlanActionPermissions {
  foundation: PermissionLevel;
  growth: PermissionLevel;
  guard: PermissionLevel;
  maxDailyActions: number;
  maxCatalogChangePercent: number;
}

export const PLAN_ACTION_PERMISSIONS: Record<string, PlanActionPermissions> = {
  [ZYRA_PLANS.FREE]: {
    foundation: 'FULL',
    growth: 'LIMITED',
    guard: 'ROLLBACK_ONLY',
    maxDailyActions: 10,
    maxCatalogChangePercent: 5,
  },
  [ZYRA_PLANS.STARTER]: {
    foundation: 'FULL',
    growth: 'LIMITED',
    guard: 'ROLLBACK_ONLY',
    maxDailyActions: 10,
    maxCatalogChangePercent: 5,
  },
  [ZYRA_PLANS.GROWTH]: {
    foundation: 'FULL',
    growth: 'FULL',
    guard: 'LIMITED',
    maxDailyActions: 50,
    maxCatalogChangePercent: 15,
  },
  [ZYRA_PLANS.SCALE]: {
    foundation: 'FULL',
    growth: 'FULL',
    guard: 'FULL',
    maxDailyActions: 200,
    maxCatalogChangePercent: 30,
  },
};

// ============================================================================
// ACTION ACCESS FUNCTIONS
// ============================================================================

export function getActionCategory(actionId: ActionId): ActionCategory | null {
  if (FOUNDATION_ACTIONS.includes(actionId)) return 'FOUNDATION';
  if (GROWTH_ACTIONS.includes(actionId)) return 'GROWTH';
  if (GUARD_ACTIONS.includes(actionId)) return 'GUARD';
  return null; // Unknown action - deny access
}

export function getCategoryPermission(planId: string, category: ActionCategory): PermissionLevel {
  const permissions = PLAN_ACTION_PERMISSIONS[planId];
  if (!permissions) return 'NONE';
  
  switch (category) {
    case 'FOUNDATION': return permissions.foundation;
    case 'GROWTH': return permissions.growth;
    case 'GUARD': return permissions.guard;
    default: return 'NONE';
  }
}

export function hasActionAccess(planId: string, actionId: ActionId): boolean {
  const category = getActionCategory(actionId);
  if (!category) return false; // Unknown action - deny access
  const permission = getCategoryPermission(planId, category);
  return permission !== 'NONE';
}

export function canAutoExecuteAction(planId: string, actionId: ActionId): boolean {
  const category = getActionCategory(actionId);
  if (!category) return false; // Unknown action - deny access
  const permission = getCategoryPermission(planId, category);
  return permission === 'FULL';
}

export function getAvailableActions(planId: string): ActionId[] {
  const permissions = PLAN_ACTION_PERMISSIONS[planId];
  if (!permissions) return [];
  
  const available: ActionId[] = [];
  
  if (permissions.foundation !== 'NONE') {
    available.push(...FOUNDATION_ACTIONS);
  }
  if (permissions.growth !== 'NONE') {
    available.push(...GROWTH_ACTIONS);
  }
  if (permissions.guard !== 'NONE') {
    available.push(...GUARD_ACTIONS);
  }
  
  return available;
}

export function getPlanLimits(planId: string): { maxDailyActions: number; maxCatalogChangePercent: number } {
  const permissions = PLAN_ACTION_PERMISSIONS[planId];
  return {
    maxDailyActions: permissions?.maxDailyActions || 10,
    maxCatalogChangePercent: permissions?.maxCatalogChangePercent || 5,
  };
}

// ============================================================================
// LEGACY COMPATIBILITY (deprecated - use action-based functions above)
// ============================================================================

export type Feature = ActionId;

export const PLAN_FEATURES: Record<string, ActionId[]> = {
  [ZYRA_PLANS.FREE]: [...FOUNDATION_ACTIONS],
  [ZYRA_PLANS.STARTER]: [...FOUNDATION_ACTIONS, ...GROWTH_ACTIONS],
  [ZYRA_PLANS.GROWTH]: [...FOUNDATION_ACTIONS, ...GROWTH_ACTIONS, ...GUARD_ACTIONS],
  [ZYRA_PLANS.SCALE]: [...FOUNDATION_ACTIONS, ...GROWTH_ACTIONS, ...GUARD_ACTIONS],
};

export function hasFeatureAccess(planId: string, feature: Feature): boolean {
  return hasActionAccess(planId, feature as ActionId);
}

export function getAvailableFeatures(planId: string): Feature[] {
  return getAvailableActions(planId);
}
