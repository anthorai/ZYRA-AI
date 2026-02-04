/**
 * ZYRA Action Lock Service
 * 
 * Manages action locks to prevent duplicate credit consumption.
 * Once an action is executed, verified, and marked STABLE:
 * - The action is LOCKED
 * - The action will NOT re-run
 * - The action will NOT re-consume credits
 * 
 * Re-execution is ONLY allowed if material change is detected.
 */

import { db } from '../db';
import { actionLocks, competitiveIntelligenceUsage, materialChanges } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createHash } from 'crypto';
import {
  ExecutionMode,
  ZyraActionType,
  getActionCategory,
  MaterialChangeType,
  MATERIAL_CHANGE_DESCRIPTIONS,
} from './constants/execution-modes';
import { ZYRA_PLANS } from './constants/plans';

// ============================================================================
// Content Hash Functions
// ============================================================================

export function generateContentHash(content: Record<string, any>): string {
  const normalized = JSON.stringify(content, Object.keys(content).sort());
  return createHash('sha256').update(normalized).digest('hex').substring(0, 32);
}

// ============================================================================
// Action Lock Management
// ============================================================================

export interface ActionLockCheckResult {
  isLocked: boolean;
  lockId?: string;
  lockedAt?: Date;
  executionMode?: string;
  creditsConsumed?: number;
  message: string;
  canReExecute: boolean;
  reExecuteReason?: string;
}

export async function checkActionLock(
  userId: string,
  entityType: string,
  entityId: string,
  actionType: ZyraActionType
): Promise<ActionLockCheckResult> {
  try {
    const existingLock = await db
      .select()
      .from(actionLocks)
      .where(
        and(
          eq(actionLocks.userId, userId),
          eq(actionLocks.entityType, entityType),
          eq(actionLocks.entityId, entityId),
          eq(actionLocks.actionType, actionType)
        )
      )
      .limit(1);

    if (existingLock.length === 0) {
      return {
        isLocked: false,
        message: 'No existing optimization found',
        canReExecute: true,
      };
    }

    const lock = existingLock[0];

    if (lock.status === 'unlocked') {
      return {
        isLocked: false,
        lockId: lock.id,
        lockedAt: lock.lockedAt ?? undefined,
        executionMode: lock.executionMode,
        creditsConsumed: lock.creditsConsumed,
        message: 'Previous optimization unlocked due to material change',
        canReExecute: true,
        reExecuteReason: lock.unlockReason ?? undefined,
      };
    }

    return {
      isLocked: true,
      lockId: lock.id,
      lockedAt: lock.lockedAt ?? undefined,
      executionMode: lock.executionMode,
      creditsConsumed: lock.creditsConsumed,
      message: 'Already optimized — no credits used',
      canReExecute: false,
    };
  } catch (error) {
    console.error('Error checking action lock:', error);
    return {
      isLocked: false,
      message: 'Could not check lock status',
      canReExecute: true,
    };
  }
}

export async function createActionLock(
  userId: string,
  entityType: string,
  entityId: string,
  actionType: ZyraActionType,
  executionMode: ExecutionMode,
  creditsConsumed: number,
  contentHash?: string
): Promise<{ success: boolean; lockId?: string; error?: string }> {
  try {
    const category = getActionCategory(actionType);

    const result = await db
      .insert(actionLocks)
      .values({
        userId,
        entityType,
        entityId,
        actionType,
        actionCategory: category,
        executionMode,
        creditsConsumed,
        status: 'locked',
        contentHashAtExecution: contentHash,
      })
      .onConflictDoUpdate({
        target: [actionLocks.userId, actionLocks.entityType, actionLocks.entityId, actionLocks.actionType],
        set: {
          executionMode,
          creditsConsumed,
          status: 'locked',
          lockedAt: sql`NOW()`,
          contentHashAtExecution: contentHash,
          unlockedAt: null,
          unlockReason: null,
          updatedAt: sql`NOW()`,
        },
      })
      .returning({ id: actionLocks.id });

    return { success: true, lockId: result[0]?.id };
  } catch (error) {
    console.error('Error creating action lock:', error);
    return { success: false, error: 'Failed to create action lock' };
  }
}

export async function unlockAction(
  lockId: string,
  unlockReason: MaterialChangeType
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(actionLocks)
      .set({
        status: 'unlocked',
        unlockedAt: sql`NOW()`,
        unlockReason,
        updatedAt: sql`NOW()`,
      })
      .where(eq(actionLocks.id, lockId));

    return { success: true };
  } catch (error) {
    console.error('Error unlocking action:', error);
    return { success: false, error: 'Failed to unlock action' };
  }
}

export async function verifyActionLock(
  lockId: string,
  result: 'stable' | 'needs_review' | 'failed'
): Promise<{ success: boolean }> {
  try {
    await db
      .update(actionLocks)
      .set({
        verifiedAt: sql`NOW()`,
        verificationResult: result,
        updatedAt: sql`NOW()`,
      })
      .where(eq(actionLocks.id, lockId));

    return { success: true };
  } catch (error) {
    console.error('Error verifying action lock:', error);
    return { success: false };
  }
}

// ============================================================================
// Material Change Detection
// ============================================================================

export async function detectMaterialChange(
  userId: string,
  entityType: string,
  entityId: string,
  newContentHash: string,
  changeType: MaterialChangeType,
  detectedBy: 'webhook' | 'scan' | 'user_triggered'
): Promise<{ hasChange: boolean; locksUnlocked: number }> {
  try {
    // Find all locked actions for this entity
    const lockedActions = await db
      .select()
      .from(actionLocks)
      .where(
        and(
          eq(actionLocks.userId, userId),
          eq(actionLocks.entityType, entityType),
          eq(actionLocks.entityId, entityId),
          eq(actionLocks.status, 'locked')
        )
      );

    if (lockedActions.length === 0) {
      return { hasChange: false, locksUnlocked: 0 };
    }

    // Check if content has actually changed
    const hasContentChange = lockedActions.some(
      lock => lock.contentHashAtExecution !== newContentHash
    );

    if (!hasContentChange && changeType !== 'merchant_approved_reoptimization') {
      return { hasChange: false, locksUnlocked: 0 };
    }

    // Unlock all affected actions
    const lockIds = lockedActions.map(l => l.id);
    
    for (const lockId of lockIds) {
      await unlockAction(lockId, changeType);
    }

    // Log the material change
    const oldHash = lockedActions[0]?.contentHashAtExecution;
    await db.insert(materialChanges).values({
      userId,
      entityType,
      entityId,
      changeType,
      changeDescription: MATERIAL_CHANGE_DESCRIPTIONS[changeType],
      contentHashBefore: oldHash,
      contentHashAfter: newContentHash,
      locksUnlocked: lockIds.length,
      actionLockIds: lockIds,
      detectedBy,
    });

    return { hasChange: true, locksUnlocked: lockIds.length };
  } catch (error) {
    console.error('Error detecting material change:', error);
    return { hasChange: false, locksUnlocked: 0 };
  }
}

// ============================================================================
// Competitive Intelligence Usage Tracking
// ============================================================================

export async function getCompetitiveIntelligenceUsageThisMonth(
  userId: string
): Promise<{ count: number; creditsConsumed: number }> {
  try {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const usage = await db
      .select()
      .from(competitiveIntelligenceUsage)
      .where(
        and(
          eq(competitiveIntelligenceUsage.userId, userId),
          eq(competitiveIntelligenceUsage.monthYear, monthYear)
        )
      );

    return {
      count: usage.length,
      creditsConsumed: usage.reduce((sum, u) => sum + u.creditsConsumed, 0),
    };
  } catch (error) {
    console.error('Error getting CI usage:', error);
    return { count: 0, creditsConsumed: 0 };
  }
}

export async function recordCompetitiveIntelligenceUsage(
  userId: string,
  actionType: ZyraActionType,
  creditsConsumed: number,
  actionLockId?: string
): Promise<{ success: boolean }> {
  try {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await db.insert(competitiveIntelligenceUsage).values({
      userId,
      actionType,
      actionLockId,
      creditsConsumed,
      monthYear,
      userConfirmedAt: sql`NOW()`,
      warningShown: true,
    });

    return { success: true };
  } catch (error) {
    console.error('Error recording CI usage:', error);
    return { success: false };
  }
}

export async function checkCompetitiveIntelligenceLimit(
  userId: string,
  planId: string
): Promise<{
  allowed: boolean;
  currentCount: number;
  maxAllowed: number | null;
  message?: string;
}> {
  // Starter plan has limited CI access
  if (planId === ZYRA_PLANS.STARTER) {
    const usage = await getCompetitiveIntelligenceUsageThisMonth(userId);
    const maxAllowed = 2;

    if (usage.count >= maxAllowed) {
      return {
        allowed: false,
        currentCount: usage.count,
        maxAllowed,
        message: `You've used all ${maxAllowed} Competitive Intelligence actions this month. Upgrade to Growth or Pro for unlimited access.`,
      };
    }

    return {
      allowed: true,
      currentCount: usage.count,
      maxAllowed,
      message: `${maxAllowed - usage.count} Competitive Intelligence action${usage.count === 1 ? '' : 's'} remaining this month`,
    };
  }

  // Free plan has no CI access
  if (planId === ZYRA_PLANS.FREE) {
    return {
      allowed: false,
      currentCount: 0,
      maxAllowed: 0,
      message: 'Competitive Intelligence requires Starter plan or higher',
    };
  }

  // Growth and Scale have unlimited CI access
  const usage = await getCompetitiveIntelligenceUsageThisMonth(userId);
  return {
    allowed: true,
    currentCount: usage.count,
    maxAllowed: null,
    message: 'Unlimited Competitive Intelligence access',
  };
}

// ============================================================================
// Get Lock History for Entity
// ============================================================================

export async function getEntityLockHistory(
  userId: string,
  entityType: string,
  entityId: string
): Promise<Array<{
  actionType: string;
  actionCategory: string;
  executionMode: string;
  creditsConsumed: number;
  status: string;
  lockedAt: Date | null;
  verificationResult: string | null;
}>> {
  try {
    const locks = await db
      .select({
        actionType: actionLocks.actionType,
        actionCategory: actionLocks.actionCategory,
        executionMode: actionLocks.executionMode,
        creditsConsumed: actionLocks.creditsConsumed,
        status: actionLocks.status,
        lockedAt: actionLocks.lockedAt,
        verificationResult: actionLocks.verificationResult,
      })
      .from(actionLocks)
      .where(
        and(
          eq(actionLocks.userId, userId),
          eq(actionLocks.entityType, entityType),
          eq(actionLocks.entityId, entityId)
        )
      )
      .orderBy(desc(actionLocks.lockedAt));

    return locks;
  } catch (error) {
    console.error('Error getting entity lock history:', error);
    return [];
  }
}

// ============================================================================
// Bulk Check for Multiple Entities
// ============================================================================

export async function checkBulkActionLocks(
  userId: string,
  entityType: string,
  entityIds: string[],
  actionType: ZyraActionType
): Promise<Map<string, ActionLockCheckResult>> {
  const results = new Map<string, ActionLockCheckResult>();

  try {
    const locks = await db
      .select()
      .from(actionLocks)
      .where(
        and(
          eq(actionLocks.userId, userId),
          eq(actionLocks.entityType, entityType),
          eq(actionLocks.actionType, actionType)
        )
      );

    // Create a map of existing locks by entity ID
    const lockMap = new Map(locks.map(l => [l.entityId, l]));

    for (const entityId of entityIds) {
      const lock = lockMap.get(entityId);

      if (!lock) {
        results.set(entityId, {
          isLocked: false,
          message: 'No existing optimization found',
          canReExecute: true,
        });
      } else if (lock.status === 'unlocked') {
        results.set(entityId, {
          isLocked: false,
          lockId: lock.id,
          lockedAt: lock.lockedAt ?? undefined,
          executionMode: lock.executionMode,
          creditsConsumed: lock.creditsConsumed,
          message: 'Previous optimization unlocked due to material change',
          canReExecute: true,
          reExecuteReason: lock.unlockReason ?? undefined,
        });
      } else {
        results.set(entityId, {
          isLocked: true,
          lockId: lock.id,
          lockedAt: lock.lockedAt ?? undefined,
          executionMode: lock.executionMode,
          creditsConsumed: lock.creditsConsumed,
          message: 'Already optimized — no credits used',
          canReExecute: false,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error checking bulk action locks:', error);
    // Return all as unlocked on error to allow execution
    for (const entityId of entityIds) {
      results.set(entityId, {
        isLocked: false,
        message: 'Could not check lock status',
        canReExecute: true,
      });
    }
    return results;
  }
}
