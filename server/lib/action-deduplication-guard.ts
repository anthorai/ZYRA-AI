/**
 * ZYRA AI — ACTION DEDUPLICATION GUARD
 * 
 * Enforces strict action deduplication, necessity-first execution,
 * and zero repetition without real need.
 * 
 * CORE PRINCIPLES:
 *   - Same action on same product = NEVER repeated
 *   - Loops are for DETECTION, not automatic re-execution
 *   - Silence is a valid outcome
 *   - One active action per product at a time
 *   - Cooldown periods after execution
 *   - Every decision is logged for transparency
 * 
 * ZYRA MUST PREFER DOING NOTHING OVER DOING TOO MUCH.
 */

import { db } from '../db';
import { actionLocks, autonomousActions, products } from '@shared/schema';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { generateContentHash } from './action-lock-service';

export interface ActionDecision {
  allowed: boolean;
  reason: string;
  ruleTriggered: string;
  actionType: string;
  targetId: string;
  targetType: string;
  timestamp: Date;
}

export interface CooldownConfig {
  defaultCooldownMs: number;
  actionCooldowns: Record<string, number>;
}

const DEFAULT_COOLDOWN_CONFIG: CooldownConfig = {
  defaultCooldownMs: 4 * 60 * 60 * 1000, // 4 hours default
  actionCooldowns: {
    trust_signal_enhancement: 6 * 60 * 60 * 1000,     // 6 hours
    product_description_clarity: 4 * 60 * 60 * 1000,   // 4 hours
    product_title_optimization: 4 * 60 * 60 * 1000,    // 4 hours
    meta_title_description_tags: 4 * 60 * 60 * 1000,   // 4 hours
    search_intent_alignment: 8 * 60 * 60 * 1000,       // 8 hours
    above_the_fold_optimization: 6 * 60 * 60 * 1000,   // 6 hours
    stale_seo_content_refresh: 12 * 60 * 60 * 1000,    // 12 hours
    checkout_dropoff_mitigation: 12 * 60 * 60 * 1000,  // 12 hours
    abandoned_cart_recovery: 8 * 60 * 60 * 1000,       // 8 hours
    post_purchase_upsell_enablement: 8 * 60 * 60 * 1000, // 8 hours
    store_conversion_pattern_learning: 24 * 60 * 60 * 1000, // 24 hours
    performance_baseline_update: 24 * 60 * 60 * 1000,  // 24 hours
    underperforming_change_rollback: 6 * 60 * 60 * 1000, // 6 hours
    risky_optimization_freeze: 6 * 60 * 60 * 1000,     // 6 hours
  },
};

export class ActionDeduplicationGuard {
  private decisionLog: Map<string, ActionDecision[]> = new Map();
  private maxDecisionLogPerUser = 100;
  private cooldownConfig: CooldownConfig;

  constructor(cooldownConfig?: Partial<CooldownConfig>) {
    this.cooldownConfig = {
      ...DEFAULT_COOLDOWN_CONFIG,
      ...cooldownConfig,
    };
  }

  /**
   * RULE 1 & 2: Check if action+target combination is already locked (executed and stable)
   * (ACTION TYPE) + (TARGET ID) uniqueness check
   */
  async checkActionTargetUniqueness(
    userId: string,
    entityType: string,
    entityId: string,
    actionType: string
  ): Promise<ActionDecision> {
    try {
      const existingLock = await db
        .select()
        .from(actionLocks)
        .where(
          and(
            eq(actionLocks.userId, userId),
            eq(actionLocks.entityType, entityType),
            eq(actionLocks.entityId, entityId),
            eq(actionLocks.actionType, actionType),
            eq(actionLocks.status, 'locked')
          )
        )
        .limit(1);

      if (existingLock.length > 0) {
        const lock = existingLock[0];
        
        // RULE 4: Material Change Detection
        // If content has materially changed since execution, auto-unlock and allow re-optimization
        if (lock.contentHashAtExecution && entityType === 'product') {
          const currentHash = await this.getProductContentHash(entityId);
          if (currentHash && currentHash !== lock.contentHashAtExecution) {
            // Content has changed — unlock the lock and allow re-execution
            await db.update(actionLocks)
              .set({ 
                status: 'unlocked', 
                unlockedAt: new Date(),
                unlockReason: 'material_change_detected',
                updatedAt: new Date(),
              })
              .where(eq(actionLocks.id, lock.id));
            
            console.log(`🔓 [Dedup Guard] RULE 4: Material change detected for ${actionType} on ${entityType}:${entityId} — lock released`);
            
            const materialChangeDecision: ActionDecision = {
              allowed: true,
              reason: `Material change detected — content hash changed since last execution. Re-optimization allowed.`,
              ruleTriggered: 'RULE_4_MATERIAL_CHANGE_UNLOCKED',
              actionType,
              targetId: entityId,
              targetType: entityType,
              timestamp: new Date(),
            };
            this.logDecision(userId, materialChangeDecision);
            return materialChangeDecision;
          }
        }
        
        const decision: ActionDecision = {
          allowed: false,
          reason: `Already optimized — ${actionType} was executed on this ${entityType} and is LOCKED. No re-execution without material change.`,
          ruleTriggered: 'RULE_1_GLOBAL_NON_REPETITION',
          actionType,
          targetId: entityId,
          targetType: entityType,
          timestamp: new Date(),
        };
        this.logDecision(userId, decision);
        return decision;
      }

      return {
        allowed: true,
        reason: 'No existing lock found — action eligible',
        ruleTriggered: 'NONE',
        actionType,
        targetId: entityId,
        targetType: entityType,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[Dedup Guard] Error checking action-target uniqueness:', error);
      return {
        allowed: false,
        reason: 'Could not verify action lock status — blocking for safety',
        ruleTriggered: 'SAFETY_BLOCK',
        actionType,
        targetId: entityId,
        targetType: entityType,
        timestamp: new Date(),
      };
    }
  }

  /**
   * RULE 7: Product Protection — Only ONE active action per product at a time
   * No parallel actions on the same product
   */
  async checkActiveActionLimit(
    userId: string,
    entityType: string,
    entityId: string
  ): Promise<ActionDecision> {
    try {
      const activeActions = await db
        .select()
        .from(autonomousActions)
        .where(
          and(
            eq(autonomousActions.userId, userId),
            eq(autonomousActions.entityType, entityType),
            eq(autonomousActions.entityId, entityId),
            eq(autonomousActions.status, 'running')
          )
        )
        .limit(1);

      if (activeActions.length > 0) {
        const decision: ActionDecision = {
          allowed: false,
          reason: `Product protection: Another action is already running on this ${entityType}. Only ONE active action per product at a time.`,
          ruleTriggered: 'RULE_7_PRODUCT_PROTECTION',
          actionType: 'any',
          targetId: entityId,
          targetType: entityType,
          timestamp: new Date(),
        };
        this.logDecision(userId, decision);
        return decision;
      }

      return {
        allowed: true,
        reason: 'No active actions on this product — eligible for new action',
        ruleTriggered: 'NONE',
        actionType: 'any',
        targetId: entityId,
        targetType: entityType,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[Dedup Guard] Error checking active action limit:', error);
      return {
        allowed: true,
        reason: 'Could not check active actions — allowing execution',
        ruleTriggered: 'NONE',
        actionType: 'any',
        targetId: entityId,
        targetType: entityType,
        timestamp: new Date(),
      };
    }
  }

  /**
   * RULE 8: Action Cooldown — Enforce minimum wait time after execution
   * No repeated edits in short time windows
   */
  async checkCooldown(
    userId: string,
    entityType: string,
    entityId: string,
    actionType: string
  ): Promise<ActionDecision> {
    try {
      const cooldownMs = this.cooldownConfig.actionCooldowns[actionType]
        || this.cooldownConfig.defaultCooldownMs;

      const cooldownThreshold = new Date(Date.now() - cooldownMs);

      const recentExecution = await db
        .select()
        .from(autonomousActions)
        .where(
          and(
            eq(autonomousActions.userId, userId),
            eq(autonomousActions.entityType, entityType),
            eq(autonomousActions.entityId, entityId),
            eq(autonomousActions.actionType, actionType),
            gte(autonomousActions.completedAt, cooldownThreshold)
          )
        )
        .orderBy(desc(autonomousActions.completedAt))
        .limit(1);

      if (recentExecution.length > 0) {
        const lastExecutedAt = recentExecution[0].completedAt;
        const remainingMs = lastExecutedAt
          ? cooldownMs - (Date.now() - new Date(lastExecutedAt).getTime())
          : 0;
        const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));

        const decision: ActionDecision = {
          allowed: false,
          reason: `Cooldown active: ${actionType} was executed on this ${entityType} recently. Wait ~${remainingHours}h before re-executing.`,
          ruleTriggered: 'RULE_8_ACTION_COOLDOWN',
          actionType,
          targetId: entityId,
          targetType: entityType,
          timestamp: new Date(),
        };
        this.logDecision(userId, decision);
        return decision;
      }

      return {
        allowed: true,
        reason: 'No recent execution found — cooldown clear',
        ruleTriggered: 'NONE',
        actionType,
        targetId: entityId,
        targetType: entityType,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[Dedup Guard] Error checking cooldown:', error);
      return {
        allowed: true,
        reason: 'Could not check cooldown — allowing execution',
        ruleTriggered: 'NONE',
        actionType,
        targetId: entityId,
        targetType: entityType,
        timestamp: new Date(),
      };
    }
  }

  /**
   * RULE 3: No Loop-Based Re-execution
   * Check if a new loop cycle has any NEW problems to solve
   * Returns true if there are genuinely new issues detected since last cycle
   */
  async hasNewProblems(userId: string): Promise<{
    hasNewIssues: boolean;
    reason: string;
    newIssueCount: number;
  }> {
    try {
      const lastCompletedAction = await db
        .select()
        .from(autonomousActions)
        .where(
          and(
            eq(autonomousActions.userId, userId),
            eq(autonomousActions.status, 'completed')
          )
        )
        .orderBy(desc(autonomousActions.completedAt))
        .limit(1);

      const sinceDate = lastCompletedAction.length > 0 && lastCompletedAction[0].completedAt
        ? new Date(lastCompletedAction[0].completedAt)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

      const unlockedActions = await db
        .select()
        .from(actionLocks)
        .where(
          and(
            eq(actionLocks.userId, userId),
            eq(actionLocks.status, 'unlocked'),
            gte(actionLocks.unlockedAt, sinceDate)
          )
        );

      const pendingActions = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(autonomousActions)
        .where(
          and(
            eq(autonomousActions.userId, userId),
            eq(autonomousActions.status, 'pending')
          )
        );

      const newUnlocked = unlockedActions.length;
      const pendingCount = Number(pendingActions[0]?.count) || 0;
      const totalNewIssues = newUnlocked + pendingCount;

      if (totalNewIssues === 0) {
        return {
          hasNewIssues: false,
          reason: 'No new problems detected. All products are stable. ZYRA does nothing.',
          newIssueCount: 0,
        };
      }

      return {
        hasNewIssues: true,
        reason: `${totalNewIssues} new issue(s) detected: ${newUnlocked} unlocked due to material changes, ${pendingCount} pending actions.`,
        newIssueCount: totalNewIssues,
      };
    } catch (error) {
      console.error('[Dedup Guard] Error checking for new problems:', error);
      return {
        hasNewIssues: false,
        reason: 'Could not check for new problems — defaulting to no action',
        newIssueCount: 0,
      };
    }
  }

  /**
   * MASTER GUARD: Run all deduplication checks for a specific action+target
   * This is the single entry point for all pre-execution validation
   * 
   * Returns a comprehensive decision with the first blocking rule or approval
   */
  async validateAction(
    userId: string,
    entityType: string,
    entityId: string,
    actionType: string
  ): Promise<ActionDecision> {
    console.log(`🛡️ [Dedup Guard] Validating: ${actionType} on ${entityType}:${entityId} for user ${userId}`);

    const uniquenessCheck = await this.checkActionTargetUniqueness(userId, entityType, entityId, actionType);
    if (!uniquenessCheck.allowed) {
      console.log(`🚫 [Dedup Guard] BLOCKED by ${uniquenessCheck.ruleTriggered}: ${uniquenessCheck.reason}`);
      return uniquenessCheck;
    }

    const activeCheck = await this.checkActiveActionLimit(userId, entityType, entityId);
    if (!activeCheck.allowed) {
      console.log(`🚫 [Dedup Guard] BLOCKED by ${activeCheck.ruleTriggered}: ${activeCheck.reason}`);
      const decision = { ...activeCheck, actionType };
      this.logDecision(userId, decision);
      return decision;
    }

    const cooldownCheck = await this.checkCooldown(userId, entityType, entityId, actionType);
    if (!cooldownCheck.allowed) {
      console.log(`🚫 [Dedup Guard] BLOCKED by ${cooldownCheck.ruleTriggered}: ${cooldownCheck.reason}`);
      return cooldownCheck;
    }

    const approved: ActionDecision = {
      allowed: true,
      reason: `All checks passed — action ${actionType} is APPROVED for execution on ${entityType}:${entityId}`,
      ruleTriggered: 'NONE',
      actionType,
      targetId: entityId,
      targetType: entityType,
      timestamp: new Date(),
    };

    console.log(`✅ [Dedup Guard] APPROVED: ${actionType} on ${entityType}:${entityId}`);
    this.logDecision(userId, approved);
    return approved;
  }

  /**
   * RULE 6: Sequential > Bulk — Get the single most critical issue for a product
   * If multiple issues exist on the same product, return only the highest priority one
   */
  async getMostCriticalIssue(
    userId: string,
    entityId: string
  ): Promise<{ actionType: string; severity: string } | null> {
    try {
      const unlockedActions = await db
        .select()
        .from(actionLocks)
        .where(
          and(
            eq(actionLocks.userId, userId),
            eq(actionLocks.entityId, entityId),
            eq(actionLocks.status, 'unlocked')
          )
        )
        .orderBy(desc(actionLocks.unlockedAt));

      if (unlockedActions.length === 0) {
        return null;
      }

      return {
        actionType: unlockedActions[0].actionType,
        severity: 'high',
      };
    } catch (error) {
      console.error('[Dedup Guard] Error getting most critical issue:', error);
      return null;
    }
  }

  /**
   * RULE 9: Transparency Logging — Log every decision
   */
  private logDecision(userId: string, decision: ActionDecision): void {
    const userLog = this.decisionLog.get(userId) || [];
    userLog.push(decision);

    if (userLog.length > this.maxDecisionLogPerUser) {
      userLog.shift();
    }

    this.decisionLog.set(userId, userLog);

    const status = decision.allowed ? 'EXECUTED' : 'BLOCKED';
    console.log(
      `📋 [Dedup Log] ${status} | Action: ${decision.actionType} | Target: ${decision.targetType}:${decision.targetId} | Rule: ${decision.ruleTriggered} | Reason: ${decision.reason}`
    );
  }

  /**
   * Get decision log for a user (for transparency API endpoints)
   */
  getDecisionLog(userId: string): ActionDecision[] {
    return this.decisionLog.get(userId) || [];
  }

  /**
   * Get summary stats for a user's action history
   */
  async getGuardStats(userId: string): Promise<{
    totalBlocked: number;
    totalApproved: number;
    activeActions: number;
    lockedActions: number;
    cooldownsActive: number;
    lastDecision: ActionDecision | null;
  }> {
    const decisions = this.decisionLog.get(userId) || [];
    const blocked = decisions.filter(d => !d.allowed).length;
    const approved = decisions.filter(d => d.allowed).length;

    try {
      const [activeCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(autonomousActions)
        .where(
          and(
            eq(autonomousActions.userId, userId),
            eq(autonomousActions.status, 'running')
          )
        );

      const [lockedCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(actionLocks)
        .where(
          and(
            eq(actionLocks.userId, userId),
            eq(actionLocks.status, 'locked')
          )
        );

      return {
        totalBlocked: blocked,
        totalApproved: approved,
        activeActions: Number(activeCount?.count) || 0,
        lockedActions: Number(lockedCount?.count) || 0,
        cooldownsActive: 0,
        lastDecision: decisions.length > 0 ? decisions[decisions.length - 1] : null,
      };
    } catch {
      return {
        totalBlocked: blocked,
        totalApproved: approved,
        activeActions: 0,
        lockedActions: 0,
        cooldownsActive: 0,
        lastDecision: decisions.length > 0 ? decisions[decisions.length - 1] : null,
      };
    }
  }

  /**
   * RULE 4: Generate content hash for a product to detect material changes
   * Hash includes title, description, price, and optimized copy — the fields
   * that, when changed, should allow re-optimization
   */
  async getProductContentHash(productId: string): Promise<string | null> {
    try {
      const [product] = await db
        .select({
          name: products.name,
          description: products.description,
          price: products.price,
        })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!product) return null;

      return generateContentHash({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
      });
    } catch (error) {
      console.error('[Dedup Guard] Error generating content hash:', error);
      return null;
    }
  }

  /**
   * Get cooldown duration in milliseconds for a specific action type
   * Used by FastDetectionEngine to enforce per-action cooldowns (RULE 8)
   */
  getCooldownMs(actionType: string): number {
    return this.cooldownConfig.actionCooldowns[actionType] || this.cooldownConfig.defaultCooldownMs;
  }

  /**
   * Get the maximum cooldown across all action types (for broad queries)
   */
  getMaxCooldownMs(): number {
    const values = Object.values(this.cooldownConfig.actionCooldowns);
    return values.length > 0 ? Math.max(...values) : this.cooldownConfig.defaultCooldownMs;
  }

  /**
   * RULE 10: Generate user-facing "no action needed" message
   */
  getNoActionMessage(entityType: string, entityId?: string): string {
    if (entityId) {
      return `No action needed. This ${entityType} is already optimized and stable.`;
    }
    return 'No action needed. All products are already optimized. ZYRA is monitoring for changes.';
  }
}

export const actionDeduplicationGuard = new ActionDeduplicationGuard();
