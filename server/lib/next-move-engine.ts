/**
 * ZYRA Next Move Decision Engine
 * 
 * Selects exactly ONE authoritative revenue action from all detected opportunities.
 * Uses scoring formula: NextMoveScore = (Expected_Revenue_Impact × Confidence_Score) ÷ Risk_Level
 * 
 * Plan-based execution rules:
 * - Starter+ ($49): ALWAYS requires approval, only very low-risk auto-actions
 * - Growth ($249): Auto-run low-risk, medium-risk requires approval
 * - Scale ($499): Auto-run most actions, approval only for high-risk
 */

import { db } from "../db";
import { revenueOpportunities, autonomousActions, usageStats, subscriptions, products } from "@shared/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { ZYRA_PLANS, AUTONOMY_LEVELS, CREDIT_LIMITS, EXECUTION_PRIORITY, PLAN_NAMES } from "./constants/plans";
import { 
  ActionType,
  calculateActionCreditCost,
  getCreditCostBreakdown,
  mapNextMoveActionToType,
  isActionAllowedForPlan,
} from "./constants/credit-consumption";

export type RiskLevel = 'low' | 'medium' | 'high';
export type NextMoveStatus = 'ready' | 'awaiting_approval' | 'executing' | 'monitoring' | 'completed' | 'blocked' | 'no_action';

export interface NextMoveAction {
  id: string;
  actionType: string;
  productId: string | null;
  productName: string | null;
  reason: string;
  expectedRevenue: number;
  confidenceScore: number;
  riskLevel: RiskLevel;
  status: NextMoveStatus;
  planRequired: string;
  creditCost: number;
  createdAt: Date;
  executedAt: Date | null;
  completedAt: Date | null;
  score: number;
  opportunityId: string;
  rollbackAvailable: boolean;
}

export interface NextMoveResponse {
  nextMove: NextMoveAction | null;
  userPlan: string;
  planId: string;
  creditsRemaining: number;
  creditLimit: number;
  canAutoExecute: boolean;
  requiresApproval: boolean;
  blockedReason: string | null;
  executionSpeed: string;
}

const RISK_LEVEL_SCORES: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/**
 * Calculate plan-aware credit cost for a Next Move action
 * Uses the new credit consumption system with SERP and autonomy multipliers
 */
function getPlanAwareCreditCost(
  opportunityType: string,
  planId: string,
  riskLevel: RiskLevel,
  isAutoExecuted: boolean = false
): { creditCost: number; breakdown: string[] } {
  const actionType = mapNextMoveActionToType(opportunityType);
  
  // Check if action is allowed for this plan
  if (!isActionAllowedForPlan(actionType, planId)) {
    return { creditCost: 0, breakdown: ['Action requires higher plan'] };
  }
  
  const creditCost = calculateActionCreditCost(actionType, planId, {
    isAutoExecuted,
    riskLevel,
    includesSERP: true, // Next Move actions typically include SERP analysis
  });
  
  const costBreakdown = getCreditCostBreakdown(actionType, planId, {
    isAutoExecuted,
    riskLevel,
    includesSERP: true,
  });
  
  return { creditCost, breakdown: costBreakdown.breakdown };
}

function calculateNextMoveScore(
  expectedRevenue: number,
  confidenceScore: number,
  riskLevel: RiskLevel
): number {
  const riskDivisor = RISK_LEVEL_SCORES[riskLevel] || 2;
  return (expectedRevenue * (confidenceScore / 100)) / riskDivisor;
}

function confidenceLevelToScore(level: string | null): number {
  switch (level) {
    case 'high': return 85;
    case 'medium': return 60;
    case 'low': return 35;
    default: return 50;
  }
}

function safetyScoreToRiskLevel(safetyScore: number | null): RiskLevel {
  if (safetyScore === null) return 'medium';
  if (safetyScore >= 80) return 'low';
  if (safetyScore >= 50) return 'medium';
  return 'high';
}

function canAutoExecute(planId: string, riskLevel: RiskLevel): boolean {
  const autonomyLevel = AUTONOMY_LEVELS[planId as keyof typeof AUTONOMY_LEVELS] || 'very_low';
  
  switch (autonomyLevel) {
    case 'very_low':
      return false;
    case 'medium':
      return riskLevel === 'low';
    case 'high':
      return riskLevel === 'low' || riskLevel === 'medium';
    default:
      return false;
  }
}

function requiresApproval(planId: string, riskLevel: RiskLevel): boolean {
  const autonomyLevel = AUTONOMY_LEVELS[planId as keyof typeof AUTONOMY_LEVELS] || 'very_low';
  
  switch (autonomyLevel) {
    case 'very_low':
      return true;
    case 'medium':
      return riskLevel !== 'low';
    case 'high':
      return riskLevel === 'high';
    default:
      return true;
  }
}

export async function getNextMove(userId: string): Promise<NextMoveResponse> {
  if (!db) {
    throw new Error('Database not available');
  }

  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const planId = subscription?.planId || ZYRA_PLANS.FREE;
  const planName = PLAN_NAMES[planId as keyof typeof PLAN_NAMES] || '7-Day Free Trial';
  const creditLimit = CREDIT_LIMITS[planId as keyof typeof CREDIT_LIMITS] || 100;
  const executionSpeed = EXECUTION_PRIORITY[planId as keyof typeof EXECUTION_PRIORITY] || 'standard';

  const [credits] = await db
    .select()
    .from(usageStats)
    .where(eq(usageStats.userId, userId))
    .limit(1);

  const creditsRemaining = credits?.creditsRemaining || 0;

  const opportunities = await db
    .select({
      id: revenueOpportunities.id,
      userId: revenueOpportunities.userId,
      entityType: revenueOpportunities.entityType,
      entityId: revenueOpportunities.entityId,
      opportunityType: revenueOpportunities.opportunityType,
      actionPlan: revenueOpportunities.actionPlan,
      estimatedRevenueLift: revenueOpportunities.estimatedRevenueLift,
      confidenceLevel: revenueOpportunities.confidenceLevel,
      safetyScore: revenueOpportunities.safetyScore,
      status: revenueOpportunities.status,
      createdAt: revenueOpportunities.createdAt,
    })
    .from(revenueOpportunities)
    .where(
      and(
        eq(revenueOpportunities.userId, userId),
        inArray(revenueOpportunities.status, ['pending', 'approved', 'executing'])
      )
    )
    .orderBy(desc(revenueOpportunities.safetyScore), desc(revenueOpportunities.createdAt))
    .limit(50);

  if (opportunities.length === 0) {
    return {
      nextMove: null,
      userPlan: planName,
      planId,
      creditsRemaining,
      creditLimit,
      canAutoExecute: false,
      requiresApproval: true,
      blockedReason: null,
      executionSpeed,
    };
  }

  let scoredOpportunities = opportunities.map(opp => {
    const expectedRevenue = parseFloat(opp.estimatedRevenueLift?.toString() || '0');
    const confidence = confidenceLevelToScore(opp.confidenceLevel);
    const risk = safetyScoreToRiskLevel(opp.safetyScore);
    const score = calculateNextMoveScore(expectedRevenue, confidence, risk);
    
    // Use plan-aware credit cost with SERP and autonomy multipliers
    const isAutoExecutable = canAutoExecute(planId, risk);
    const { creditCost, breakdown: creditBreakdown } = getPlanAwareCreditCost(
      opp.opportunityType || 'seo_optimization',
      planId,
      risk,
      isAutoExecutable
    );
    
    const actionPlanData = opp.actionPlan as { description?: string } | null;
    const description = actionPlanData?.description || `ZYRA detected a ${opp.opportunityType} opportunity`;
    
    return {
      ...opp,
      expectedRevenue,
      confidence,
      risk,
      score,
      creditCost,
      creditBreakdown,
      description,
    };
  });

  scoredOpportunities.sort((a, b) => b.score - a.score);

  const topOpportunity = scoredOpportunities[0];

  let productName: string | null = null;
  if (topOpportunity.entityType === 'product' && topOpportunity.entityId) {
    const [product] = await db
      .select({ name: products.name })
      .from(products)
      .where(eq(products.id, topOpportunity.entityId))
      .limit(1);
    productName = product?.name || null;
  }

  const isAutoExecutable = canAutoExecute(planId, topOpportunity.risk);
  const needsApproval = requiresApproval(planId, topOpportunity.risk);

  let blockedReason: string | null = null;
  let status: NextMoveStatus = 'ready';

  if (creditsRemaining < topOpportunity.creditCost) {
    blockedReason = 'Insufficient credits for this action';
    status = 'blocked';
  } else if (topOpportunity.status === 'executing') {
    status = 'executing';
  } else if (needsApproval && topOpportunity.status === 'pending') {
    status = 'awaiting_approval';
  } else if (isAutoExecutable) {
    status = 'ready';
  }

  const nextMove: NextMoveAction = {
    id: topOpportunity.id,
    actionType: topOpportunity.opportunityType || 'seo_optimization',
    productId: topOpportunity.entityId,
    productName,
    reason: topOpportunity.description,
    expectedRevenue: topOpportunity.expectedRevenue,
    confidenceScore: topOpportunity.confidence,
    riskLevel: topOpportunity.risk,
    status,
    planRequired: planName,
    creditCost: topOpportunity.creditCost,
    createdAt: topOpportunity.createdAt || new Date(),
    executedAt: null,
    completedAt: null,
    score: topOpportunity.score,
    opportunityId: topOpportunity.id,
    rollbackAvailable: true,
  };

  return {
    nextMove,
    userPlan: planName,
    planId,
    creditsRemaining,
    creditLimit,
    canAutoExecute: isAutoExecutable,
    requiresApproval: needsApproval,
    blockedReason,
    executionSpeed,
  };
}

export async function approveNextMove(userId: string, opportunityId: string): Promise<{ success: boolean; message: string; actionId?: string }> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  const [opportunity] = await db
    .select()
    .from(revenueOpportunities)
    .where(
      and(
        eq(revenueOpportunities.id, opportunityId),
        eq(revenueOpportunities.userId, userId)
      )
    )
    .limit(1);

  if (!opportunity) {
    return { success: false, message: 'Opportunity not found' };
  }

  const [credits] = await db
    .select()
    .from(usageStats)
    .where(eq(usageStats.userId, userId))
    .limit(1);

  // Get user's subscription plan for plan-aware credit cost
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  
  const planId = subscription?.planId || ZYRA_PLANS.FREE;
  const riskLevel = safetyScoreToRiskLevel(opportunity.safetyScore);
  
  // Calculate plan-aware credit cost
  const { creditCost } = getPlanAwareCreditCost(
    opportunity.opportunityType || 'seo_optimization',
    planId,
    riskLevel,
    false // Manual approval, not auto-executed
  );
  
  const creditsRemaining = credits?.creditsRemaining || 0;

  if (creditsRemaining < creditCost) {
    return { 
      success: false, 
      message: 'ZYRA is prioritizing highest-impact actions. Some optimizations are queued for next cycle.' 
    };
  }

  await db
    .update(usageStats)
    .set({
      creditsRemaining: creditsRemaining - creditCost,
      creditsUsed: (credits?.creditsUsed || 0) + creditCost,
    })
    .where(eq(usageStats.userId, userId));

  await db
    .update(revenueOpportunities)
    .set({
      status: 'approved',
      creditsUsed: creditCost,
    })
    .where(eq(revenueOpportunities.id, opportunityId));

  const actionPlanData = opportunity.actionPlan as { description?: string } | null;
  const description = actionPlanData?.description || 'Next Move approved by user';

  const [action] = await db
    .insert(autonomousActions)
    .values({
      userId,
      actionType: opportunity.opportunityType || 'seo_optimization',
      entityType: opportunity.entityType,
      entityId: opportunity.entityId,
      status: 'pending',
      decisionReason: description,
      estimatedImpact: {
        opportunityId: opportunity.id,
        expectedRevenue: opportunity.estimatedRevenueLift,
        confidenceLevel: opportunity.confidenceLevel,
      },
    })
    .returning();

  await db
    .update(revenueOpportunities)
    .set({ autonomousActionId: action.id })
    .where(eq(revenueOpportunities.id, opportunityId));

  return { success: true, message: 'Next Move approved and queued for execution', actionId: action.id };
}

export async function executeNextMove(userId: string, opportunityId: string): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  await db
    .update(revenueOpportunities)
    .set({ status: 'executing', executedAt: new Date() })
    .where(
      and(
        eq(revenueOpportunities.id, opportunityId),
        eq(revenueOpportunities.userId, userId)
      )
    );

  const [opportunity] = await db
    .select()
    .from(revenueOpportunities)
    .where(eq(revenueOpportunities.id, opportunityId))
    .limit(1);

  if (opportunity?.autonomousActionId) {
    await db
      .update(autonomousActions)
      .set({ status: 'running' })
      .where(eq(autonomousActions.id, opportunity.autonomousActionId));
  }

  return { success: true, message: 'Next Move is now executing' };
}

export async function rollbackNextMove(userId: string, opportunityId: string): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  await db
    .update(revenueOpportunities)
    .set({ status: 'rolled_back' })
    .where(
      and(
        eq(revenueOpportunities.id, opportunityId),
        eq(revenueOpportunities.userId, userId)
      )
    );

  return { success: true, message: 'Next Move has been rolled back' };
}

export async function generateDemoNextMove(userId: string): Promise<{ success: boolean; opportunityId?: string }> {
  if (!db) {
    return { success: false };
  }

  const demoOpportunities = [
    {
      opportunityType: 'seo_optimization',
      entityType: 'product',
      actionPlan: {
        description: 'ZYRA detected weak SEO signals on your top-selling product. Optimizing title and meta description could increase organic traffic by 23%.',
        changes: ['title', 'meta_description'],
      },
      estimatedRevenueLift: '847.00',
      confidenceLevel: 'high',
      safetyScore: 92,
    },
    {
      opportunityType: 'cart_recovery',
      entityType: 'cart',
      actionPlan: {
        description: 'ZYRA identified 12 abandoned carts worth $2,340 in the last 24 hours. Automated recovery emails could recover 15-25% of this revenue.',
        changes: ['send_recovery_email'],
      },
      estimatedRevenueLift: '468.00',
      confidenceLevel: 'high',
      safetyScore: 95,
    },
    {
      opportunityType: 'upsell',
      entityType: 'product',
      actionPlan: {
        description: 'ZYRA analyzed purchase patterns and found a high-converting upsell opportunity. Customers who buy Product A are 4x more likely to buy Product B.',
        changes: ['create_upsell_bundle'],
      },
      estimatedRevenueLift: '1250.00',
      confidenceLevel: 'medium',
      safetyScore: 75,
    },
  ];

  const randomOpp = demoOpportunities[Math.floor(Math.random() * demoOpportunities.length)];

  const [inserted] = await db
    .insert(revenueOpportunities)
    .values({
      userId,
      opportunityType: randomOpp.opportunityType,
      entityType: randomOpp.entityType,
      actionPlan: randomOpp.actionPlan,
      estimatedRevenueLift: randomOpp.estimatedRevenueLift,
      confidenceLevel: randomOpp.confidenceLevel,
      safetyScore: randomOpp.safetyScore,
    })
    .returning();

  return { success: true, opportunityId: inserted.id };
}
