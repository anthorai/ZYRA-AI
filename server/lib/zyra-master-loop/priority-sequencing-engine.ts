/**
 * ZYRA PRIORITY & SEQUENCING ENGINE
 * 
 * Step 6 of the Master Loop: PRIORITY & SEQUENCING ENGINE
 * 
 * Global execution order (NON-BREAKABLE):
 *   1. Trust & Legitimacy
 *   2. Clarity & Intent
 *   3. Conversion Optimization
 *   4. Revenue Expansion
 *   5. SEO Maintenance
 *   6. Learning & Protection
 * 
 * Rules:
 *   - Lower risk first
 *   - Earlier funnel first
 *   - Protection beats growth
 *   - One main action per loop
 *   - Sub-actions execute in defined order
 */

import type { 
  MasterAction, 
  ActionId, 
  ExecutionPriority,
  RiskLevel 
} from './master-action-registry';
import { 
  masterActionRegistry, 
  ALL_ACTIONS,
  ACTIONS_BY_PRIORITY 
} from './master-action-registry';
import type { StoreSituation } from './store-situation-detector';
import type { PlanPermissions, ActionCategory, PermissionLevel } from './plan-permission-mapper';
import { planPermissionMapper } from './plan-permission-mapper';

export interface SequencedAction {
  action: MasterAction;
  sequenceOrder: number;
  allowed: boolean;
  permissionLevel: PermissionLevel;
  canAutoExecute: boolean;
  requiresApproval: boolean;
  skipReason: string | null;
  priorityScore: number;
}

export interface ActionPool {
  allowedActions: SequencedAction[];
  skippedActions: SequencedAction[];
  totalAvailable: number;
  totalSkipped: number;
  nextAction: SequencedAction | null;
}

const PRIORITY_ORDER: ExecutionPriority[] = [
  'trust_legitimacy',      // 1. Trust & Legitimacy
  'clarity_intent',        // 2. Clarity & Intent
  'conversion_optimization', // 3. Conversion Optimization
  'revenue_expansion',     // 4. Revenue Expansion
  'seo_maintenance',       // 5. SEO Maintenance
  'learning_protection',   // 6. Learning & Protection
];

const RISK_WEIGHTS: Record<RiskLevel, number> = {
  low: 3,    // Highest priority for low risk
  medium: 2,
  high: 1,   // Lowest priority for high risk
};

export class PrioritySequencingEngine {
  /**
   * Build the allowed action pool filtered by plan and situation
   */
  buildAllowedActionPool(
    permissions: PlanPermissions,
    situation: StoreSituation
  ): ActionPool {
    console.log(`📋 [Sequencing] Building action pool for ${permissions.plan} / ${situation}`);
    
    const effectivePermissions = planPermissionMapper.getEffectivePermissions(permissions, situation);
    const sequencedActions: SequencedAction[] = [];
    
    let sequenceOrder = 0;

    // Process actions in priority order
    for (const priority of PRIORITY_ORDER) {
      const priorityActions = ACTIONS_BY_PRIORITY[priority] || [];
      
      // Sort by risk level within each priority (low risk first)
      const sortedByRisk = [...priorityActions].sort((a, b) => {
        return RISK_WEIGHTS[b.riskLevel] - RISK_WEIGHTS[a.riskLevel];
      });

      for (const action of sortedByRisk) {
        sequenceOrder++;
        const sequenced = this.evaluateAction(
          action, 
          effectivePermissions, 
          situation, 
          sequenceOrder
        );
        sequencedActions.push(sequenced);
      }
    }

    // Separate allowed and skipped
    const allowedActions = sequencedActions.filter(a => a.allowed);
    const skippedActions = sequencedActions.filter(a => !a.allowed);

    // Get next action (first allowed action)
    const nextAction = allowedActions.length > 0 ? allowedActions[0] : null;

    console.log(`✅ [Sequencing] Pool built: ${allowedActions.length} allowed, ${skippedActions.length} skipped`);
    if (nextAction) {
      console.log(`   Next action: ${nextAction.action.name} (priority: ${nextAction.sequenceOrder})`);
    }

    return {
      allowedActions,
      skippedActions,
      totalAvailable: allowedActions.length,
      totalSkipped: skippedActions.length,
      nextAction,
    };
  }

  /**
   * Evaluate a single action for permission and safety
   */
  private evaluateAction(
    action: MasterAction,
    permissions: PlanPermissions,
    situation: StoreSituation,
    sequenceOrder: number
  ): SequencedAction {
    // Check category permission
    let permissionLevel: PermissionLevel = 'NONE';
    switch (action.category) {
      case 'FOUNDATION':
        permissionLevel = permissions.foundation;
        break;
      case 'GROWTH':
        permissionLevel = permissions.growth;
        break;
      case 'GUARD':
        permissionLevel = permissions.guard;
        break;
    }

    // Check if action is safe for this situation
    const isSafeForSituation = action.safeForSituation.includes(situation);
    
    // Determine if allowed
    let allowed = permissionLevel !== 'NONE' && isSafeForSituation;
    let skipReason: string | null = null;

    if (permissionLevel === 'NONE') {
      skipReason = `${action.category} actions not available on ${permissions.planName} plan`;
      allowed = false;
    } else if (permissionLevel === 'ROLLBACK_ONLY' && action.id !== 'underperforming_rollback') {
      skipReason = `Only rollback actions allowed for ${action.category} on ${permissions.planName} plan`;
      allowed = false;
    } else if (!isSafeForSituation) {
      skipReason = `Action not safe for ${situation} store situation`;
      allowed = false;
    }

    // Determine execution mode
    const canAutoExecute = permissionLevel === 'FULL' && action.riskLevel === 'low';
    const requiresApproval = !canAutoExecute;

    // Calculate priority score (higher = execute first)
    const priorityScore = this.calculatePriorityScore(action, situation, sequenceOrder);

    return {
      action,
      sequenceOrder,
      allowed,
      permissionLevel,
      canAutoExecute,
      requiresApproval,
      skipReason,
      priorityScore,
    };
  }

  /**
   * Calculate priority score for action ordering
   */
  private calculatePriorityScore(
    action: MasterAction,
    situation: StoreSituation,
    sequenceOrder: number
  ): number {
    let score = 1000 - sequenceOrder * 10; // Base: earlier sequence = higher score

    // Boost for lower risk
    score += RISK_WEIGHTS[action.riskLevel] * 50;

    // Boost for trust/clarity actions (earlier funnel)
    if (action.priority === 'trust_legitimacy') score += 100;
    if (action.priority === 'clarity_intent') score += 80;

    // Situation-based adjustments
    if (situation === 'NEW_FRESH') {
      // For new stores, boost low-risk foundation actions
      if (action.category === 'FOUNDATION' && action.riskLevel === 'low') {
        score += 50;
      }
      // Penalize growth actions
      if (action.category === 'GROWTH') {
        score -= 100;
      }
    } else if (situation === 'ENTERPRISE_SCALE') {
      // For enterprise, slightly boost learning actions
      if (action.priority === 'learning_protection') {
        score += 30;
      }
    }

    return score;
  }

  /**
   * Sequence actions according to the strict execution order
   */
  sequenceActions(actions: SequencedAction[]): SequencedAction[] {
    // Sort by priority score descending (higher score = execute first)
    return [...actions].sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Get the next action to execute from the pool
   * Returns null if no actions are available
   */
  getNextAction(pool: ActionPool): SequencedAction | null {
    if (pool.allowedActions.length === 0) return null;
    
    // Return highest priority action (first in sorted list)
    return pool.allowedActions[0];
  }

  /**
   * Get all actions in the specified priority tier
   */
  getActionsInPriorityTier(
    pool: ActionPool, 
    priority: ExecutionPriority
  ): SequencedAction[] {
    return pool.allowedActions.filter(
      a => a.action.priority === priority
    );
  }

  /**
   * Check if protection actions should block growth actions
   * Rule: Protection beats growth
   */
  shouldBlockGrowthActions(pool: ActionPool): { block: boolean; reason: string } {
    const guardActions = pool.allowedActions.filter(
      a => a.action.category === 'GUARD' && a.action.id !== 'conversion_pattern_learning'
    );

    // If there are pending rollback or freeze actions, block growth
    const hasRollbackPending = guardActions.some(
      a => a.action.id === 'underperforming_rollback'
    );
    const hasFreezePending = guardActions.some(
      a => a.action.id === 'risky_optimization_freeze'
    );

    if (hasRollbackPending) {
      return {
        block: true,
        reason: 'Pending rollback action must be resolved before growth actions',
      };
    }

    if (hasFreezePending) {
      return {
        block: true,
        reason: 'Optimization freeze is active - growth actions blocked',
      };
    }

    return { block: false, reason: '' };
  }

  /**
   * Validate that an action can be executed now
   */
  validateActionExecution(
    sequencedAction: SequencedAction,
    pool: ActionPool
  ): { valid: boolean; reason: string } {
    if (!sequencedAction.allowed) {
      return { valid: false, reason: sequencedAction.skipReason || 'Action not allowed' };
    }

    // Check if growth actions should be blocked
    if (sequencedAction.action.category === 'GROWTH') {
      const blockCheck = this.shouldBlockGrowthActions(pool);
      if (blockCheck.block) {
        return { valid: false, reason: blockCheck.reason };
      }
    }

    return { valid: true, reason: 'Action can be executed' };
  }

  /**
   * Get summary of the action pool for logging/display
   */
  getPoolSummary(pool: ActionPool): {
    byPriority: Record<ExecutionPriority, number>;
    byCategory: Record<ActionCategory, number>;
    byRisk: Record<RiskLevel, number>;
  } {
    const byPriority: Record<ExecutionPriority, number> = {
      trust_legitimacy: 0,
      clarity_intent: 0,
      conversion_optimization: 0,
      revenue_expansion: 0,
      seo_maintenance: 0,
      learning_protection: 0,
    };

    const byCategory: Record<ActionCategory, number> = {
      FOUNDATION: 0,
      GROWTH: 0,
      GUARD: 0,
    };

    const byRisk: Record<RiskLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
    };

    for (const sa of pool.allowedActions) {
      byPriority[sa.action.priority]++;
      byCategory[sa.action.category]++;
      byRisk[sa.action.riskLevel]++;
    }

    return { byPriority, byCategory, byRisk };
  }
}

export const prioritySequencingEngine = new PrioritySequencingEngine();
