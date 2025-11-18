/**
 * Approval Executor - Executes approved actions from manual mode
 * 
 * When globalAutopilotEnabled = false (Manual Mode), AI creates pending_approvals
 * instead of directly executing actions. When user approves, this module executes them
 * by creating autonomous_action records and processing them through the established
 * action processor infrastructure.
 * 
 * This ensures approved actions follow the same execution path as autonomous actions,
 * maintaining consistency in safety guardrails, analytics, snapshots, and rollback functionality.
 */

import { requireDb } from '../db';
import { autonomousActions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { processAutonomousAction } from './autonomous-action-processor';
import { validateApproval } from './approval-safety-validator';

export interface ExecutionResult {
  success: boolean;
  actionId?: string;
  result?: any;
  error?: string;
  violationType?: string;
}

/**
 * Execute an approved action by creating an autonomous_action and processing it
 * through the standard action processor infrastructure.
 * 
 * SAFETY GUARDRAILS (enforced BEFORE action creation):
 * - Daily action limits (maxDailyActions)
 * - Catalog change percentage limits (maxCatalogChangePercent)
 * - Frequency caps (3/day, 5/week per customer per channel)
 * - Per-rule daily budgets (maxActionsPerDay)
 * - Cooldown periods (prevents rapid re-execution on same entity)
 * - Quiet hours (9 AM - 9 PM timezone-aware for marketing)
 * - Unsubscribe status (respects customer preferences)
 * - GDPR consent (validates marketing permissions)
 * 
 * EXECUTION FEATURES (applied during processing):
 * - Product snapshots (for rollback)
 * - Transactional safety
 * - Analytics tracking
 * - SEO meta updates
 */
export async function executeApprovedAction(
  userId: string,
  actionType: string,
  actionPayload: any,
  approvalId?: string,
  aiReasoning?: string
): Promise<ExecutionResult> {
  const db = requireDb();
  
  try {
    console.log(`✅ [Approval Executor] Executing approved action: ${actionType}`, { userId });

    // CRITICAL: Validate approval against safety guardrails BEFORE creating action
    // This prevents approving actions that would violate daily limits, frequency caps, etc.
    const validationResult = await validateApproval(userId, actionType, actionPayload);
    
    if (!validationResult.allowed) {
      console.warn(`⚠️  [Approval Executor] Action rejected by safety guardrails:`, validationResult.reason);
      
      return {
        success: false,
        error: validationResult.reason || 'Action violates safety guardrails',
        violationType: validationResult.violationType
      };
    }

    console.log(`✅ [Approval Executor] Safety checks passed`);

    // Determine entity type and ID from action type and payload
    const entityType = getEntityTypeFromAction(actionType);
    const entityId = getEntityIdFromPayload(actionPayload, actionType);

    // Create autonomous action record for this approval
    // This will be processed by the standard action processor
    const [actionRecord] = await db
      .insert(autonomousActions)
      .values({
        userId,
        actionType,
        entityType,
        entityId,
        status: 'pending',
        decisionReason: `Manual approval: ${aiReasoning || 'User approved'}`,
        ruleId: actionPayload.ruleId || null,
        payload: actionPayload,
        metadata: {
          approvalMode: 'manual',
          approvalId: approvalId || null,
          approvedAt: new Date()
        }
      })
      .returning();

    console.log(`📝 [Approval Executor] Created autonomous action: ${actionRecord.id}`);

    // Process the action through standard infrastructure
    // This ensures all safety guardrails, analytics, and rollback features are applied
    await processAutonomousAction(actionRecord);

    // Fetch the updated action to get the final result
    const [updatedAction] = await db
      .select()
      .from(autonomousActions)
      .where(eq(autonomousActions.id, actionRecord.id))
      .limit(1);

    const success = updatedAction.status === 'completed';
    
    console.log(`${success ? '✅' : '❌'} [Approval Executor] Action ${success ? 'completed' : 'failed'}: ${actionRecord.id}`);

    return {
      success,
      actionId: updatedAction.id,
      result: updatedAction.result
    };

  } catch (error) {
    console.error(`❌ [Approval Executor] Failed to execute approved action:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Helper function to determine entity type from action type
 */
function getEntityTypeFromAction(actionType: string): string {
  switch (actionType) {
    case 'optimize_seo':
    case 'adjust_price':
      return 'product';
    case 'send_campaign':
    case 'send_ab_test':
      return 'campaign';
    case 'send_cart_recovery':
      return 'cart';
    default:
      return 'unknown';
  }
}

/**
 * Helper function to extract entity ID from payload
 */
function getEntityIdFromPayload(payload: any, actionType: string): string | null {
  switch (actionType) {
    case 'optimize_seo':
    case 'adjust_price':
      return payload.productId || null;
    case 'send_campaign':
    case 'send_ab_test':
      return payload.campaignId || null;
    case 'send_cart_recovery':
      return payload.cartId || null;
    default:
      return payload.entityId || null;
  }
}
