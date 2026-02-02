/**
 * ZYRA PLAN PERMISSION MAPPER
 * 
 * Step 2-3 of the Master Loop: READ ACTIVE SUBSCRIPTION PLAN & UNLOCK ACTION TYPES
 * 
 * Plans define POWER:
 *   STARTER - Foundation FULL, Growth LIMITED, Guard ROLLBACK_ONLY
 *   GROWTH  - Foundation FULL, Growth FULL, Guard LIMITED
 *   ENTERPRISE - Foundation FULL, Growth FULL, Guard FULL
 * 
 * PLAN OVERRIDES STORE SITUATION.
 * ZYRA is FORBIDDEN from executing actions not unlocked by plan.
 */

import { requireDb } from '../../db';
import { subscriptions, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { ZYRA_PLANS, PLAN_NAMES, PLAN_BY_NAME } from '../constants/plans';
import type { StoreSituation } from './store-situation-detector';

export type MasterLoopPlan = 'STARTER' | 'GROWTH' | 'ENTERPRISE';
export type ActionCategory = 'FOUNDATION' | 'GROWTH' | 'GUARD';
export type PermissionLevel = 'NONE' | 'ROLLBACK_ONLY' | 'LIMITED' | 'FULL';

export interface PlanPermissions {
  plan: MasterLoopPlan;
  planId: string;
  planName: string;
  foundation: PermissionLevel;
  growth: PermissionLevel;
  guard: PermissionLevel;
  maxDailyActions: number;
  maxCatalogChangePercent: number;
  rollbackEnabled: boolean;
  learningEnabled: boolean;
}

export interface ActionPermissionCheck {
  allowed: boolean;
  permissionLevel: PermissionLevel;
  reason: string;
  requiresApproval: boolean;
  canAutoExecute: boolean;
}

// Map internal plan IDs to Master Loop plans
// Free and Starter both map to STARTER (most cautious)
// Growth maps to GROWTH
// Pro/Scale maps to ENTERPRISE
const PLAN_TO_MASTER_LOOP: Record<string, MasterLoopPlan> = {
  [ZYRA_PLANS.FREE]: 'STARTER',
  [ZYRA_PLANS.STARTER]: 'STARTER',
  [ZYRA_PLANS.GROWTH]: 'GROWTH',
  [ZYRA_PLANS.SCALE]: 'ENTERPRISE',
};

// Plan permission matrix from the Master Loop spec
const PLAN_PERMISSION_MATRIX: Record<MasterLoopPlan, {
  foundation: PermissionLevel;
  growth: PermissionLevel;
  guard: PermissionLevel;
  maxDailyActions: number;
  maxCatalogChangePercent: number;
}> = {
  STARTER: {
    foundation: 'FULL',
    growth: 'LIMITED',
    guard: 'ROLLBACK_ONLY',
    maxDailyActions: 10,
    maxCatalogChangePercent: 5,
  },
  GROWTH: {
    foundation: 'FULL',
    growth: 'FULL',
    guard: 'LIMITED',
    maxDailyActions: 50,
    maxCatalogChangePercent: 15,
  },
  ENTERPRISE: {
    foundation: 'FULL',
    growth: 'FULL',
    guard: 'FULL',
    maxDailyActions: 200,
    maxCatalogChangePercent: 30,
  },
};

// Situation modifiers - reduce permissions based on store situation
const SITUATION_MODIFIERS: Record<StoreSituation, {
  foundationModifier: number; // 1 = no change, 0.5 = reduce by one level
  growthModifier: number;
  guardModifier: number;
  requiresExtraApproval: boolean;
}> = {
  NEW_FRESH: {
    foundationModifier: 1, // Foundation stays FULL
    growthModifier: 0.5, // Growth reduced
    guardModifier: 0.5, // Guard reduced
    requiresExtraApproval: true,
  },
  MEDIUM_GROWING: {
    foundationModifier: 1,
    growthModifier: 1,
    guardModifier: 0.75,
    requiresExtraApproval: false,
  },
  ENTERPRISE_SCALE: {
    foundationModifier: 1,
    growthModifier: 1,
    guardModifier: 1,
    requiresExtraApproval: false,
  },
};

function reducePermissionLevel(level: PermissionLevel, modifier: number): PermissionLevel {
  if (modifier >= 1) return level;
  
  const levels: PermissionLevel[] = ['NONE', 'ROLLBACK_ONLY', 'LIMITED', 'FULL'];
  const currentIndex = levels.indexOf(level);
  const reduction = Math.ceil((1 - modifier) * 2); // 0.5 modifier = 1 level reduction
  const newIndex = Math.max(0, currentIndex - reduction);
  
  return levels[newIndex];
}

export class PlanPermissionMapper {
  async getActivePlan(userId: string): Promise<PlanPermissions> {
    console.log(`🔑 [Plan Permissions] Getting active plan for user ${userId}`);
    const db = requireDb();

    // Get user's subscription
    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const [subscription] = await db
      .select({ planId: subscriptions.planId, status: subscriptions.status })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    // Determine plan ID
    let planId: string = ZYRA_PLANS.FREE; // Default to free
    
    if (subscription?.planId && subscription.status === 'active') {
      planId = subscription.planId;
    } else if (user?.plan) {
      // Map plan name to plan ID
      planId = PLAN_BY_NAME[user.plan] || ZYRA_PLANS.FREE;
    }

    const masterLoopPlan = PLAN_TO_MASTER_LOOP[planId] || 'STARTER';
    const permissions = PLAN_PERMISSION_MATRIX[masterLoopPlan];
    const planName = PLAN_NAMES[planId as keyof typeof PLAN_NAMES] || 'Free';

    console.log(`✅ [Plan Permissions] User ${userId} has plan: ${planName} (${masterLoopPlan})`);

    return {
      plan: masterLoopPlan,
      planId,
      planName,
      foundation: permissions.foundation,
      growth: permissions.growth,
      guard: permissions.guard,
      maxDailyActions: permissions.maxDailyActions,
      maxCatalogChangePercent: permissions.maxCatalogChangePercent,
      rollbackEnabled: permissions.guard !== 'NONE',
      learningEnabled: permissions.guard === 'LIMITED' || permissions.guard === 'FULL',
    };
  }

  getEffectivePermissions(
    planPermissions: PlanPermissions,
    situation: StoreSituation
  ): PlanPermissions & { requiresExtraApproval: boolean } {
    const modifier = SITUATION_MODIFIERS[situation];

    // PLAN OVERRIDES STORE SITUATION - permission levels are NOT reduced by situation.
    // Situation only affects:
    // 1. Whether extra approval is required (for safety)
    // 2. Max daily actions for NEW_FRESH stores (conservative approach)
    // 3. Max catalog change percent for NEW_FRESH stores
    const effectivePermissions: PlanPermissions & { requiresExtraApproval: boolean } = {
      ...planPermissions,
      // CRITICAL: Permission levels come directly from plan, NOT modified by situation
      foundation: planPermissions.foundation,
      growth: planPermissions.growth,
      guard: planPermissions.guard,
      // Situation affects safety, not capability
      requiresExtraApproval: modifier.requiresExtraApproval,
    };

    // For NEW_FRESH stores only: reduce volume, not capability
    if (situation === 'NEW_FRESH') {
      effectivePermissions.maxDailyActions = Math.floor(planPermissions.maxDailyActions / 2);
      effectivePermissions.maxCatalogChangePercent = Math.floor(planPermissions.maxCatalogChangePercent / 2);
    }

    console.log(`📊 [Plan Permissions] Effective permissions for ${planPermissions.plan} in ${situation}:`);
    console.log(`   Foundation: ${effectivePermissions.foundation}, Growth: ${effectivePermissions.growth}, Guard: ${effectivePermissions.guard}`);
    console.log(`   Extra approval required: ${effectivePermissions.requiresExtraApproval}`);

    return effectivePermissions;
  }

  checkActionPermission(
    actionCategory: ActionCategory,
    permissions: PlanPermissions,
    situation: StoreSituation
  ): ActionPermissionCheck {
    const effectivePermissions = this.getEffectivePermissions(permissions, situation);
    const modifier = SITUATION_MODIFIERS[situation];

    let permissionLevel: PermissionLevel;
    switch (actionCategory) {
      case 'FOUNDATION':
        permissionLevel = effectivePermissions.foundation;
        break;
      case 'GROWTH':
        permissionLevel = effectivePermissions.growth;
        break;
      case 'GUARD':
        permissionLevel = effectivePermissions.guard;
        break;
      default:
        permissionLevel = 'NONE';
    }

    const allowed = permissionLevel !== 'NONE';
    const canAutoExecute = permissionLevel === 'FULL' && !modifier.requiresExtraApproval;
    const requiresApproval = !canAutoExecute || modifier.requiresExtraApproval;

    let reason = '';
    if (!allowed) {
      reason = `${actionCategory} actions are not available on ${permissions.planName} plan`;
    } else if (permissionLevel === 'ROLLBACK_ONLY') {
      reason = `Only rollback actions allowed for ${actionCategory} on ${permissions.planName} plan`;
    } else if (permissionLevel === 'LIMITED') {
      reason = `Limited ${actionCategory} actions available - approval required for high-risk actions`;
    } else {
      reason = `Full ${actionCategory} permission granted`;
    }

    if (modifier.requiresExtraApproval) {
      reason += ` (Extra approval required for ${situation} store)`;
    }

    return {
      allowed,
      permissionLevel,
      reason,
      requiresApproval,
      canAutoExecute,
    };
  }

  isRollbackAllowed(permissions: PlanPermissions): boolean {
    return permissions.guard !== 'NONE';
  }

  isLearningAllowed(permissions: PlanPermissions): boolean {
    return permissions.guard === 'LIMITED' || permissions.guard === 'FULL';
  }
}

export const planPermissionMapper = new PlanPermissionMapper();
