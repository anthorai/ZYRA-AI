/**
 * Helper function to create pending approvals with properly populated normalized fields.
 * 
 * This ensures the database-level unique indexes work correctly by extracting
 * recipient information from the action payload and storing it in dedicated columns.
 * 
 * USAGE: Schedulers should call this when globalAutopilotEnabled = false (Manual Mode)
 */

import { requireDb } from '../db';
import { pendingApprovals } from '@shared/schema';

export interface CreatePendingApprovalParams {
  userId: string;
  actionType: 'optimize_seo' | 'send_campaign' | 'send_cart_recovery' | 'adjust_price';
  entityId?: string;
  entityType?: string;
  recommendedAction: any; // Full action payload
  aiReasoning: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimatedImpact?: any;
}

/**
 * Extract normalized recipient data from action payload
 */
function extractRecipientData(actionType: string, payload: any): {
  recipientEmail: string | null;
  recipientPhone: string | null;
  channel: string | null;
} {
  // Only extract for marketing/cart recovery actions
  if (actionType !== 'send_campaign' && actionType !== 'send_cart_recovery') {
    return {
      recipientEmail: null,
      recipientPhone: null,
      channel: null
    };
  }

  const recipientEmail = payload.customerEmail || payload.recipientEmail || null;
  const recipientPhone = payload.customerPhone || payload.recipientPhone || null;
  const channel = payload.channel || (recipientEmail ? 'email' : 'sms');

  return {
    recipientEmail,
    recipientPhone,
    channel
  };
}

/**
 * Create a pending approval with normalized recipient fields populated.
 * 
 * This ensures database-level unique constraints work correctly to prevent
 * race conditions when multiple approvals are executed simultaneously.
 */
export async function createPendingApproval(params: CreatePendingApprovalParams): Promise<string> {
  const db = requireDb();
  
  // Extract normalized recipient data for unique constraint
  const { recipientEmail, recipientPhone, channel } = extractRecipientData(
    params.actionType,
    params.recommendedAction
  );

  // Create pending approval with normalized fields
  const [approval] = await db
    .insert(pendingApprovals)
    .values({
      userId: params.userId,
      actionType: params.actionType,
      entityId: params.entityId || null,
      entityType: params.entityType || null,
      recommendedAction: params.recommendedAction,
      aiReasoning: params.aiReasoning,
      priority: params.priority || 'medium',
      estimatedImpact: params.estimatedImpact || null,
      status: 'pending',
      // CRITICAL: Populate normalized fields for unique constraint
      recipientEmail,
      recipientPhone,
      channel
    })
    .returning();

  console.log(`✅ [Pending Approval] Created: ${approval.id} (${params.actionType})`);
  
  return approval.id;
}
