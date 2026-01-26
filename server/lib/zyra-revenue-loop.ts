/**
 * ZYRA REVENUE LOOP CONTROLLER
 * 
 * The ONLY loop ZYRA can use:
 * DETECT → DECIDE → EXECUTE → PROVE → LEARN → repeat
 * 
 * CORE LAW: If an action does NOT directly affect revenue,
 * ZYRA must NOT detect it, decide on it, execute it, or show it.
 * 
 * AUTONOMY MODEL:
 * - Manual approval is DEFAULT for all plans
 * - Autonomy is EARNED, never assumed
 * - Autonomy is GRANULAR (per product, per action type, per risk level)
 * - Every action supports: before/after preview, approval, rollback, revenue tracking
 */

import { requireDb } from '../db';
import { 
  revenueSignals, 
  revenueOpportunities,
  revenueLoopProof,
  storeLearningInsights,
  automationSettings,
  subscriptions,
  products,
  usageStats,
  autonomousActions,
  detectionCache,
  FRICTION_TYPE_LABELS
} from '@shared/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { revenueDetectionEngine } from './revenue-detection-engine';
import { revenueExecutionEngine } from './revenue-execution-engine';
import { revenueAttributionService } from './revenue-attribution-service';
import { storeLearningService } from './store-learning-service';
import { ZYRA_PLANS, AUTONOMY_LEVELS, PLAN_NAMES } from './constants/plans';

const REVENUE_ONLY_SIGNAL_TYPES = new Set([
  'abandoned_cart_pattern',
  'checkout_drop',
  'view_no_cart',
  'cart_no_checkout',
  'purchase_no_upsell',
  'pricing_opportunity',
  'revenue_drop',
  'low_conversion',
  'high_traffic_low_conversion',
  'cart_abandonment',
]);

const REVENUE_ONLY_ACTION_TYPES = new Set([
  'cart_recovery',
  'pricing_protection',
  'revenue_protection',
  'revenue_recovery',
  'product_content_fix',
  'checkout_optimization',
  'upsell_opportunity',
]);

function isRevenueSignal(signalType: string | null): boolean {
  if (!signalType) return false;
  return REVENUE_ONLY_SIGNAL_TYPES.has(signalType);
}

function isRevenueAction(actionType: string | null): boolean {
  if (!actionType) return false;
  return REVENUE_ONLY_ACTION_TYPES.has(actionType);
}

function sanitizeActionType(actionType: string | null): string {
  if (!actionType) return 'revenue_recovery';
  
  const legacyMappings: Record<string, string> = {
    'seo_optimization': 'product_content_fix',
    'optimize_seo': 'product_content_fix',
    'description_enhancement': 'product_content_fix',
    'price_adjustment': 'pricing_protection',
    'marketing_campaign': 'revenue_recovery',
  };
  
  if (legacyMappings[actionType]) {
    return legacyMappings[actionType];
  }
  
  if (REVENUE_ONLY_ACTION_TYPES.has(actionType)) {
    return actionType;
  }
  
  return 'revenue_recovery';
}

export type LoopStage = 
  | 'checking_performance'
  | 'identifying_hesitation'
  | 'estimating_loss'
  | 'selecting_action'
  | 'preparing_action'
  | 'executing_action'
  | 'measuring_impact'
  | 'improving_decisions'
  | 'idle';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface LoopState {
  stage: LoopStage;
  stageLabel: string;
  lastUpdated: Date;
  currentAction: {
    productId: string | null;
    productName: string | null;
    actionType: string | null;
    expectedRevenue: number;
    riskLevel: RiskLevel | null;
    status: string;
  } | null;
}

export interface LoopCycleResult {
  detected: number;
  decided: string | null;
  executed: boolean;
  proved: number;
  learned: number;
  cycleTime: number;
}

interface RevenueAction {
  id: string;
  opportunityId: string;
  productId: string | null;
  productName: string | null;
  productImage: string | null;
  actionType: string;
  whatWillChange: string;
  expectedRevenueImpact: number;
  estimatedMonthlyLoss: number;
  riskLevel: RiskLevel;
  confidenceScore: number;
  whyThisProduct: string;
  whyThisAction: string;
  whyNow: string;
  whyItIsSafe: string;
  requiresApproval: boolean;
  autonomyGranted: boolean;
  canAutoExecute: boolean;
  score: number;
}

const STAGE_LABELS: Record<LoopStage, string> = {
  checking_performance: 'Checking store performance',
  identifying_hesitation: 'Identifying buyer hesitation',
  estimating_loss: 'Estimating lost revenue',
  selecting_action: 'Selecting highest-impact move',
  preparing_action: 'Preparing next revenue action',
  executing_action: 'Executing approved improvement',
  measuring_impact: 'Measuring revenue impact',
  improving_decisions: 'Improving future decisions',
  idle: 'Monitoring for revenue opportunities',
};

const loopStateCache = new Map<string, LoopState>();

export class ZyraRevenueLoop {
  private updateLoopState(userId: string, stage: LoopStage, action: LoopState['currentAction'] = null) {
    const state: LoopState = {
      stage,
      stageLabel: STAGE_LABELS[stage],
      lastUpdated: new Date(),
      currentAction: action,
    };
    loopStateCache.set(userId, state);
    return state;
  }

  getLoopState(userId: string): LoopState {
    return loopStateCache.get(userId) || {
      stage: 'idle',
      stageLabel: STAGE_LABELS.idle,
      lastUpdated: new Date(),
      currentAction: null,
    };
  }

  /**
   * FAST DECIDE from pre-scored cache (target <1 second)
   * Uses decisionScore computed by background precompute worker
   * 
   * Gates:
   * - executionPayloadReady = true (payload exists)
   * - isStale = false (cache is fresh)
   * - recommendedActionType is revenue-whitelisted
   */
  private async decideFromCache(userId: string): Promise<RevenueAction | null> {
    const db = requireDb();
    
    // Cache freshness threshold: 6 hours
    const freshnessThreshold = new Date(Date.now() - 6 * 60 * 60 * 1000);
    
    // Get top pre-scored decision from cache with quality gates
    const [topCached] = await db
      .select()
      .from(detectionCache)
      .where(
        and(
          eq(detectionCache.userId, userId),
          sql`${detectionCache.frictionScore} > 20`,
          sql`${detectionCache.decisionScore} > 0`,
          eq(detectionCache.executionPayloadReady, true),
          eq(detectionCache.isStale, false),
          sql`${detectionCache.lastPrecomputedAt} > ${freshnessThreshold}`
        )
      )
      .orderBy(desc(detectionCache.decisionScore))
      .limit(1);

    if (!topCached || !topCached.productId) {
      return null;
    }
    
    // Verify action type is revenue-whitelisted (use isRevenueAction for ACTION types)
    const actionType = sanitizeActionType(topCached.recommendedActionType);
    if (!isRevenueAction(actionType)) {
      console.log(`⏭️  [ZYRA Loop] Cached action type not revenue-whitelisted: ${actionType}`);
      return null;
    }
    console.log(`⚡ [ZYRA Loop] Cache fast-path hit for action: ${actionType}`);

    const subscription = await this.getUserSubscription(userId);
    const planId = subscription?.planId || ZYRA_PLANS.FREE;
    
    const riskLevel = (topCached.riskLevel as RiskLevel) || 'medium';
    const confidenceScore = topCached.confidenceScore || 50;
    const expectedRevenue = parseFloat(topCached.expectedRevenueImpact?.toString() || '0');
    const estimatedLoss = parseFloat(topCached.estimatedMonthlyLoss?.toString() || '0');
    // actionType already validated above as revenue-whitelisted
    
    const canAutoExecute = this.canAutoExecute(planId, riskLevel, confidenceScore);
    const autonomyGranted = await this.checkAutonomyGranted(userId, topCached.productId, actionType, riskLevel);

    // Create action from cached data - no additional DB lookups needed
    const action: RevenueAction = {
      id: topCached.id,
      opportunityId: '',
      productId: topCached.productId,
      productName: topCached.productName || 'Product',
      productImage: topCached.productImage || null,
      actionType,
      whatWillChange: this.describeCachedChange(topCached.topFrictionType),
      expectedRevenueImpact: expectedRevenue,
      estimatedMonthlyLoss: estimatedLoss,
      riskLevel,
      confidenceScore,
      whyThisProduct: `This product has a friction score of ${topCached.frictionScore} - buyers are hesitating`,
      whyThisAction: `${FRICTION_TYPE_LABELS[topCached.topFrictionType as keyof typeof FRICTION_TYPE_LABELS] || 'Revenue friction'} detected`,
      whyNow: `Estimated monthly loss: $${estimatedLoss.toFixed(2)}`,
      whyItIsSafe: this.generateWhySafe(riskLevel),
      requiresApproval: !canAutoExecute,
      autonomyGranted,
      canAutoExecute: canAutoExecute && autonomyGranted,
      score: parseFloat(topCached.decisionScore?.toString() || '0'),
    };

    // Create opportunity from cached decision
    const opportunity = await this.createOpportunityFromCache(userId, topCached, action);
    action.opportunityId = opportunity.id;

    this.updateLoopState(userId, 'preparing_action', {
      productId: action.productId,
      productName: action.productName,
      actionType: action.actionType,
      expectedRevenue: action.expectedRevenueImpact,
      riskLevel: action.riskLevel,
      status: action.requiresApproval ? 'awaiting_approval' : 'ready',
    });

    return action;
  }

  private describeCachedChange(frictionType: string | null): string {
    const descriptions: Record<string, string> = {
      'view_no_cart': 'Improve product content to increase add-to-cart rate',
      'cart_no_checkout': 'Optimize checkout flow to reduce cart abandonment',
      'checkout_drop': 'Send recovery email to re-engage buyer',
      'purchase_no_upsell': 'Send personalized product recommendations',
    };
    return descriptions[frictionType || ''] || 'Optimize product for better conversion';
  }

  private async createOpportunityFromCache(userId: string, cached: any, action: RevenueAction) {
    const db = requireDb();
    
    // Derive confidenceLevel from cached confidenceScore (0-100)
    const cachedConfidence = cached.confidenceScore || 50;
    const confidenceLevel = cachedConfidence >= 70 ? 'high' : cachedConfidence >= 40 ? 'medium' : 'low';
    
    const [opportunity] = await db.insert(revenueOpportunities)
      .values({
        userId,
        opportunityType: action.actionType,
        entityType: 'product',
        entityId: cached.productId,
        status: action.requiresApproval ? 'pending' : 'approved',
        safetyScore: 100 - (action.riskLevel === 'high' ? 30 : action.riskLevel === 'medium' ? 15 : 5),
        confidenceLevel,
        estimatedRevenueLift: action.expectedRevenueImpact.toString(),
        frictionType: cached.topFrictionType,
        frictionDescription: action.whatWillChange,
        estimatedRecovery: action.estimatedMonthlyLoss.toString(),
        actionPlan: {
          type: action.actionType,
          productId: cached.productId,
          productName: cached.productName,
          whatWillChange: action.whatWillChange,
          whyThisProduct: action.whyThisProduct,
          whyThisAction: action.whyThisAction,
          whyNow: action.whyNow,
          whyItIsSafe: action.whyItIsSafe,
          executionPayload: cached.executionPayload,
          rollbackPayload: cached.rollbackPayload,
        },
        originalContent: cached.originalContent || null,
        proposedContent: cached.proposedContent || null,
        rollbackData: cached.rollbackPayload,
      })
      .returning();

    return opportunity;
  }

  /**
   * PHASE 1: DETECT - Revenue Surveillance
   * 
   * ZYRA continuously reads precomputed revenue signals
   * and detects ONLY money-related risks or opportunities.
   * 
   * Detection MUST:
   * - Use cached aggregates
   * - Complete in seconds
   * - Never block UI
   */
  async detect(userId: string): Promise<{ signalsDetected: number; signals: any[] }> {
    console.log(`🔍 [ZYRA Loop] DETECT phase for user ${userId}`);
    this.updateLoopState(userId, 'checking_performance');

    const settings = await this.getUserSettings(userId);
    if (!settings || !settings.globalAutopilotEnabled) {
      console.log(`⏸️  [ZYRA Loop] Autopilot disabled for user ${userId}`);
      this.updateLoopState(userId, 'idle');
      return { signalsDetected: 0, signals: [] };
    }

    this.updateLoopState(userId, 'identifying_hesitation');
    const result = await revenueDetectionEngine.detectSignals(userId);

    this.updateLoopState(userId, 'estimating_loss');
    console.log(`✅ [ZYRA Loop] DETECT complete: ${result.signalsDetected} signals found`);

    return result;
  }

  /**
   * PHASE 2: DECIDE - Capital Priority Engine (SPEED OPTIMIZED)
   * 
   * ZYRA ALWAYS selects ONE action only.
   * Decision formula: (Expected Revenue × Confidence) ÷ Risk
   * 
   * SPEED UPGRADE: Uses pre-scored decisionScore from detection_cache
   * Target time: <1 second
   */
  async decide(userId: string): Promise<RevenueAction | null> {
    console.log(`🎯 [ZYRA Loop] DECIDE phase for user ${userId}`);
    const decideStart = Date.now();
    this.updateLoopState(userId, 'selecting_action');
    const db = requireDb();

    // FAST PATH: Try pre-scored cache first (target <1 second)
    const cachedDecision = await this.decideFromCache(userId);
    if (cachedDecision) {
      console.log(`⚡ [ZYRA Loop] FAST DECIDE from cache in ${Date.now() - decideStart}ms`);
      return cachedDecision;
    }

    // FALLBACK: Use traditional signal-based approach
    console.log(`📊 [ZYRA Loop] Using fallback signal-based DECIDE`);
    const activeSignals = await db
      .select()
      .from(revenueSignals)
      .where(
        and(
          eq(revenueSignals.userId, userId),
          inArray(revenueSignals.status, ['detected', 'queued']),
          sql`${revenueSignals.expiresAt} > NOW() OR ${revenueSignals.expiresAt} IS NULL`
        )
      )
      .orderBy(desc(revenueSignals.priorityScore))
      .limit(50);

    if (activeSignals.length === 0) {
      console.log(`⏸️  [ZYRA Loop] No active revenue signals to decide on`);
      this.updateLoopState(userId, 'idle');
      return null;
    }

    const revenueOnlySignals = activeSignals.filter(signal => {
      const signalType = signal.signalType;
      const hasRevenueDelta = parseFloat(signal.estimatedRevenueDelta?.toString() || '0') > 0;
      
      const isWhitelisted = isRevenueSignal(signalType);
      
      if (!isWhitelisted) {
        console.log(`⏭️  [ZYRA Loop] Rejecting non-revenue signal type: ${signalType}`);
        return false;
      }
      
      if (!hasRevenueDelta) {
        console.log(`⏭️  [ZYRA Loop] Rejecting signal with no revenue impact: ${signalType}`);
        return false;
      }
      
      return true;
    });

    if (revenueOnlySignals.length === 0) {
      console.log(`⏸️  [ZYRA Loop] No revenue-impacting signals to decide on`);
      this.updateLoopState(userId, 'idle');
      return null;
    }

    const subscription = await this.getUserSubscription(userId);
    const planId = subscription?.planId || ZYRA_PLANS.FREE;
    const autonomyLevel = AUTONOMY_LEVELS[planId as keyof typeof AUTONOMY_LEVELS] || 'very_low';

    const scoredSignals = revenueOnlySignals.map(signal => {
      const estimatedRevenue = parseFloat(signal.estimatedRevenueDelta?.toString() || '0');
      const confidence = signal.confidenceScore || 50;
      const riskLevel = this.signalToRiskLevel(signal);
      const riskDivisor = { low: 1, medium: 2, high: 3 }[riskLevel];
      
      const score = (estimatedRevenue * (confidence / 100)) / riskDivisor;
      
      return { signal, score, estimatedRevenue, confidence, riskLevel };
    });

    scoredSignals.sort((a, b) => b.score - a.score);
    const topSignal = scoredSignals[0];

    if (!topSignal) {
      this.updateLoopState(userId, 'idle');
      return null;
    }

    let product = null;
    if (topSignal.signal.entityType === 'product' && topSignal.signal.entityId) {
      const [productData] = await db
        .select()
        .from(products)
        .where(eq(products.id, topSignal.signal.entityId))
        .limit(1);
      product = productData;
    }

    const canAutoExecute = this.canAutoExecute(planId, topSignal.riskLevel, topSignal.confidence);
    const requiresApproval = !canAutoExecute;
    const actionType = this.mapSignalToActionType(topSignal.signal.signalType);
    const autonomyGranted = await this.checkAutonomyGranted(
      userId, 
      topSignal.signal.entityId || null,
      actionType,
      topSignal.riskLevel
    );

    const monthlyLoss = parseFloat(topSignal.signal.estimatedMonthlyLoss?.toString() || '0');

    const action: RevenueAction = {
      id: topSignal.signal.id,
      opportunityId: '',
      productId: topSignal.signal.entityId || null,
      productName: product?.name || null,
      productImage: product?.image || null,
      actionType: this.mapSignalToActionType(topSignal.signal.signalType),
      whatWillChange: this.describeChange(topSignal.signal),
      expectedRevenueImpact: topSignal.estimatedRevenue,
      estimatedMonthlyLoss: monthlyLoss,
      riskLevel: topSignal.riskLevel,
      confidenceScore: topSignal.confidence,
      whyThisProduct: this.generateWhyProduct(product, topSignal.signal),
      whyThisAction: this.generateWhyAction(topSignal.signal),
      whyNow: this.generateWhyNow(topSignal.signal, monthlyLoss),
      whyItIsSafe: this.generateWhySafe(topSignal.riskLevel),
      requiresApproval,
      autonomyGranted,
      canAutoExecute: canAutoExecute && autonomyGranted,
      score: topSignal.score,
    };

    const opportunity = await this.createOrUpdateOpportunity(userId, topSignal.signal, action);
    action.opportunityId = opportunity.id;

    this.updateLoopState(userId, 'preparing_action', {
      productId: action.productId,
      productName: action.productName,
      actionType: action.actionType,
      expectedRevenue: action.expectedRevenueImpact,
      riskLevel: action.riskLevel,
      status: requiresApproval ? 'awaiting_approval' : 'ready',
    });

    console.log(`✅ [ZYRA Loop] DECIDE complete: Selected ${action.actionType} for ${action.productName || 'store'}`);
    console.log(`   Score: ${action.score.toFixed(2)}, Confidence: ${action.confidenceScore}%, Risk: ${action.riskLevel}`);

    return action;
  }

  /**
   * PHASE 3: EXECUTE - Controlled Operations
   * 
   * When executing:
   * - Show product name + image
   * - Show exactly what will change
   * - Show expected revenue impact
   * - Show risk level
   * - Require approval unless autonomy is granted
   * - Log every change, enable one-click rollback
   */
  async execute(userId: string, opportunityId: string, approved: boolean = false): Promise<{
    success: boolean;
    message: string;
    opportunityId: string;
    creditsUsed: number;
  }> {
    console.log(`🚀 [ZYRA Loop] EXECUTE phase for opportunity ${opportunityId}`);
    const db = requireDb();

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
      return { success: false, message: 'Opportunity not found', opportunityId, creditsUsed: 0 };
    }

    const settings = await this.getUserSettings(userId);
    if (!settings?.globalAutopilotEnabled) {
      return { success: false, message: 'Revenue protection is disabled', opportunityId, creditsUsed: 0 };
    }

    const riskLevel = this.safetyScoreToRisk(opportunity.safetyScore);
    const subscription = await this.getUserSubscription(userId);
    const planId = subscription?.planId || ZYRA_PLANS.FREE;
    const confidence = this.confidenceLevelToScore(opportunity.confidenceLevel);
    
    const hasAutonomy = settings?.autopilotEnabled ?? false;
    const canAuto = hasAutonomy && this.canAutoExecute(planId, riskLevel, confidence);
    const actionType = sanitizeActionType(opportunity.opportunityType);
    const autonomyGranted = hasAutonomy && await this.checkAutonomyGranted(
      userId,
      opportunity.entityId || null,
      actionType,
      riskLevel
    );

    if (!approved && !(canAuto && autonomyGranted)) {
      this.updateLoopState(userId, 'preparing_action', {
        productId: opportunity.entityId,
        productName: null,
        actionType: actionType,
        expectedRevenue: parseFloat(opportunity.estimatedRevenueLift?.toString() || '0'),
        riskLevel,
        status: 'awaiting_approval',
      });
      return { 
        success: false, 
        message: 'This action requires your approval', 
        opportunityId, 
        creditsUsed: 0 
      };
    }

    this.updateLoopState(userId, 'executing_action', {
      productId: opportunity.entityId,
      productName: null,
      actionType: actionType,
      expectedRevenue: parseFloat(opportunity.estimatedRevenueLift?.toString() || '0'),
      riskLevel,
      status: 'executing',
    });

    const result = await revenueExecutionEngine.executeOpportunity(opportunityId);

    if (result.success) {
      console.log(`✅ [ZYRA Loop] EXECUTE complete: ${opportunityId}`);
      this.updateLoopState(userId, 'measuring_impact');
    } else {
      console.log(`❌ [ZYRA Loop] EXECUTE failed: ${result.error}`);
      this.updateLoopState(userId, 'idle');
    }

    return {
      success: result.success,
      message: result.success ? 'Action executed successfully' : (result.error || 'Execution failed'),
      opportunityId,
      creditsUsed: result.creditsUsed,
    };
  }

  /**
   * PHASE 4: PROVE - Financial Proof Only
   * 
   * ZYRA must prove results using ONLY:
   * - Revenue change (₹ / $)
   * - Per-product impact
   * - Before vs after timeline
   * 
   * NO vanity metrics (CTR, impressions, rankings)
   */
  async prove(userId: string): Promise<{
    provedCount: number;
    results: {
      opportunityId: string;
      verdict: string;
      revenueDelta: number;
      rolledBack: boolean;
    }[];
  }> {
    console.log(`📊 [ZYRA Loop] PROVE phase for user ${userId}`);
    this.updateLoopState(userId, 'measuring_impact');
    const db = requireDb();

    const opportunitiesReady = await revenueAttributionService.getOpportunitiesReadyForProving(10);
    const userOpportunities = opportunitiesReady.filter(o => o.userId === userId);

    const results: {
      opportunityId: string;
      verdict: string;
      revenueDelta: number;
      rolledBack: boolean;
    }[] = [];

    for (const opp of userOpportunities) {
      const result = await revenueAttributionService.measureOpportunityImpact(opp.id);
      if (result) {
        results.push({
          opportunityId: result.opportunityId,
          verdict: result.verdict,
          revenueDelta: result.revenueDelta,
          rolledBack: result.shouldRollback,
        });

        if (result.shouldRollback) {
          console.log(`⏪ [ZYRA Loop] Auto-rollback triggered for ${opp.id}: Revenue dropped $${Math.abs(result.revenueDelta).toFixed(2)}`);
        } else if (result.verdict === 'success') {
          console.log(`💰 [ZYRA Loop] PROVED: Action made $${result.revenueDelta.toFixed(2)}`);
        }
      }
    }

    console.log(`✅ [ZYRA Loop] PROVE complete: ${results.length} opportunities measured`);
    return { provedCount: results.length, results };
  }

  /**
   * PHASE 5: LEARN - Compounding Store Intelligence
   * 
   * ZYRA learns from every outcome:
   * - What converts for THIS store
   * - What language works
   * - What risks are safe
   * - What timing works
   * 
   * Learning improves confidence scores and unlocks safer autonomy
   */
  async learn(userId: string): Promise<{ insightsUpdated: number; patternsIdentified: string[] }> {
    console.log(`🧠 [ZYRA Loop] LEARN phase for user ${userId}`);
    this.updateLoopState(userId, 'improving_decisions');
    const db = requireDb();

    const recentProofs = await db
      .select()
      .from(revenueLoopProof)
      .where(
        and(
          eq(revenueLoopProof.userId, userId),
          sql`${revenueLoopProof.createdAt} > NOW() - INTERVAL '24 hours'`
        )
      )
      .orderBy(desc(revenueLoopProof.createdAt))
      .limit(20);

    let totalUpdated = 0;
    const allPatterns: string[] = [];

    for (const proof of recentProofs) {
      const result = await storeLearningService.learnFromAttribution(proof.id);
      if (result) {
        totalUpdated += result.insightsCreated + result.insightsUpdated;
        allPatterns.push(...result.patternsIdentified);
      }
    }

    this.updateLoopState(userId, 'idle');
    console.log(`✅ [ZYRA Loop] LEARN complete: ${totalUpdated} insights updated`);

    return { insightsUpdated: totalUpdated, patternsIdentified: allPatterns };
  }

  /**
   * Run a complete DETECT → DECIDE → EXECUTE → PROVE → LEARN cycle
   */
  async runFullCycle(userId: string, autoApprove: boolean = false): Promise<LoopCycleResult> {
    const startTime = Date.now();
    console.log(`🔄 [ZYRA Loop] Starting full cycle for user ${userId}`);

    const detectResult = await this.detect(userId);
    const decision = await this.decide(userId);
    
    let executed = false;
    if (decision && (decision.canAutoExecute || autoApprove)) {
      const execResult = await this.execute(userId, decision.opportunityId, autoApprove);
      executed = execResult.success;
    }

    const proveResult = await this.prove(userId);
    
    // LEARN runs ASYNCHRONOUSLY - never blocks the loop
    // This follows the speed upgrade requirement: "Learning must be ASYNCHRONOUS ONLY"
    setImmediate(() => {
      this.learn(userId).catch(err => {
        console.error(`⚠️ [ZYRA Loop] Async LEARN failed for user ${userId}:`, err);
      });
    });

    const cycleTime = Date.now() - startTime;
    console.log(`✅ [ZYRA Loop] Full cycle complete in ${cycleTime}ms (LEARN running async)`);

    return {
      detected: detectResult.signalsDetected,
      decided: decision?.opportunityId || null,
      executed,
      proved: proveResult.provedCount,
      learned: 0, // LEARN runs async, count not available immediately
      cycleTime,
    };
  }

  /**
   * Get the current status in BUSINESS language (no technical jargon)
   */
  getBusinessStatus(userId: string): {
    stage: string;
    description: string;
    action: {
      product: string | null;
      type: string | null;
      expectedImpact: string;
      risk: string | null;
      status: string;
    } | null;
  } {
    const state = this.getLoopState(userId);
    
    return {
      stage: state.stageLabel,
      description: this.getStageDescription(state.stage),
      action: state.currentAction ? {
        product: state.currentAction.productName,
        type: this.humanizeActionType(state.currentAction.actionType),
        expectedImpact: `$${state.currentAction.expectedRevenue.toFixed(0)}`,
        risk: state.currentAction.riskLevel,
        status: this.humanizeStatus(state.currentAction.status),
      } : null,
    };
  }

  private async getUserSettings(userId: string) {
    const db = requireDb();
    const [settings] = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, userId))
      .limit(1);
    return settings;
  }

  private async getUserSubscription(userId: string) {
    const db = requireDb();
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);
    return sub;
  }

  private signalToRiskLevel(signal: typeof revenueSignals.$inferSelect): RiskLevel {
    const confidence = signal.confidenceScore || 50;
    if (confidence >= 80) return 'low';
    if (confidence >= 50) return 'medium';
    return 'high';
  }

  private safetyScoreToRisk(safetyScore: number | null): RiskLevel {
    if (safetyScore === null) return 'medium';
    if (safetyScore >= 80) return 'low';
    if (safetyScore >= 50) return 'medium';
    return 'high';
  }

  private confidenceLevelToScore(level: string | null): number {
    switch (level) {
      case 'high': return 85;
      case 'medium': return 60;
      case 'low': return 35;
      default: return 50;
    }
  }

  private canAutoExecute(planId: string, riskLevel: RiskLevel, confidence: number): boolean {
    if (confidence < 70) return false;
    
    const autonomyLevel = AUTONOMY_LEVELS[planId as keyof typeof AUTONOMY_LEVELS] || 'very_low';
    
    switch (autonomyLevel) {
      case 'very_low': return false;
      case 'medium': return riskLevel === 'low';
      case 'high': return riskLevel === 'low' || riskLevel === 'medium';
      default: return false;
    }
  }

  private async checkAutonomyGranted(
    userId: string,
    productId: string | null,
    actionType: string,
    riskLevel: RiskLevel
  ): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    if (!settings) return false;

    if (settings.dryRunMode) return false;

    const enabledActions = settings.enabledActionTypes as string[] || [];
    if (!enabledActions.includes(actionType) && !enabledActions.includes('all')) {
      return false;
    }

    if (riskLevel === 'high') {
      return false;
    }

    return true;
  }

  private mapSignalToActionType(signalType: string | null): string {
    const mapping: Record<string, string> = {
      'abandoned_cart_pattern': 'cart_recovery',
      'checkout_drop': 'cart_recovery',
      'view_no_cart': 'product_content_fix',
      'cart_no_checkout': 'checkout_optimization',
      'purchase_no_upsell': 'upsell_opportunity',
      'pricing_opportunity': 'pricing_protection',
      'revenue_drop': 'revenue_protection',
      'low_conversion': 'product_content_fix',
      'high_traffic_low_conversion': 'product_content_fix',
      'cart_abandonment': 'cart_recovery',
    };
    
    if (signalType && mapping[signalType]) {
      return mapping[signalType];
    }
    
    return sanitizeActionType(signalType);
  }

  private mapActionTypeToBusinessLabel(actionType: string): string {
    const sanitizedType = sanitizeActionType(actionType);
    
    const labels: Record<string, string> = {
      'product_content_fix': 'Remove buyer hesitation',
      'cart_recovery': 'Recover abandoned sale',
      'pricing_protection': 'Protect profit margin',
      'revenue_protection': 'Stop revenue leak',
      'revenue_recovery': 'Recover lost revenue',
      'checkout_optimization': 'Fix checkout friction',
      'upsell_opportunity': 'Increase order value',
    };
    return labels[sanitizedType] || 'Revenue action';
  }

  private describeChange(signal: typeof revenueSignals.$inferSelect): string {
    const frictionType = signal.frictionType;
    
    switch (frictionType) {
      case 'view_no_cart':
        return 'Improve product title and description to make value clearer';
      case 'cart_no_checkout':
        return 'Send recovery email with urgency trigger';
      case 'checkout_drop':
        return 'Add trust signals and streamline checkout flow';
      case 'purchase_no_upsell':
        return 'Add relevant product recommendations post-purchase';
      default:
        return 'Optimize product content to increase conversions';
    }
  }

  private generateWhyProduct(product: typeof products.$inferSelect | null, signal: typeof revenueSignals.$inferSelect): string {
    const name = product?.name || 'This product';
    const frictionType = signal.frictionType;
    
    switch (frictionType) {
      case 'view_no_cart':
        return `"${name}" is getting views but buyers aren't adding to cart - value isn't clear enough`;
      case 'cart_no_checkout':
        return `"${name}" is being added to cart but buyers are hesitating before checkout`;
      case 'checkout_drop':
        return `"${name}" sales are dying at checkout - final trust barrier needs fixing`;
      default:
        return `"${name}" has buyer intent that isn't converting to money`;
    }
  }

  private generateWhyAction(signal: typeof revenueSignals.$inferSelect): string {
    const frictionType = signal.frictionType;
    
    switch (frictionType) {
      case 'view_no_cart':
        return 'Clearer product messaging removes doubt and builds buying confidence';
      case 'cart_no_checkout':
        return 'Targeted follow-up catches buyers while intent is still warm';
      case 'checkout_drop':
        return 'Trust signals at checkout remove final risk fear';
      default:
        return 'Targeted action directly addresses where money is being lost';
    }
  }

  private generateWhyNow(signal: typeof revenueSignals.$inferSelect, monthlyLoss: number): string {
    if (monthlyLoss > 500) {
      return `This friction is costing approximately $${monthlyLoss.toLocaleString()}/month in lost revenue`;
    }
    return 'This friction is active and fixable - waiting means more lost sales';
  }

  private generateWhySafe(riskLevel: RiskLevel): string {
    switch (riskLevel) {
      case 'low':
        return 'This is a low-risk action with instant rollback if revenue drops';
      case 'medium':
        return 'Moderate change with full rollback capability - your original content is preserved';
      case 'high':
        return 'Higher-impact change but fully reversible - ZYRA will auto-rollback if needed';
    }
  }

  private async createOrUpdateOpportunity(
    userId: string,
    signal: typeof revenueSignals.$inferSelect,
    action: RevenueAction
  ) {
    const db = requireDb();
    
    const existingOpp = await db
      .select()
      .from(revenueOpportunities)
      .where(
        and(
          eq(revenueOpportunities.userId, userId),
          eq(revenueOpportunities.signalId, signal.id),
          inArray(revenueOpportunities.status, ['pending', 'approved', 'executing'])
        )
      )
      .limit(1);

    if (existingOpp.length > 0) {
      return existingOpp[0];
    }

    const [opportunity] = await db
      .insert(revenueOpportunities)
      .values({
        userId,
        entityType: signal.entityType || 'product',
        entityId: signal.entityId,
        signalId: signal.id,
        opportunityType: action.actionType,
        actionPlan: {
          description: action.whatWillChange,
          whyProduct: action.whyThisProduct,
          whyAction: action.whyThisAction,
          whyNow: action.whyNow,
          whySafe: action.whyItIsSafe,
        },
        estimatedRevenueLift: action.expectedRevenueImpact.toFixed(2),
        confidenceLevel: action.confidenceScore >= 70 ? 'high' : action.confidenceScore >= 40 ? 'medium' : 'low',
        safetyScore: action.riskLevel === 'low' ? 90 : action.riskLevel === 'medium' ? 60 : 30,
        status: action.requiresApproval ? 'pending' : 'approved',
        frictionType: signal.frictionType,
        frictionDescription: signal.whereIntentDied,
        estimatedRecovery: action.estimatedMonthlyLoss.toFixed(2),
      })
      .returning();

    await db
      .update(revenueSignals)
      .set({ 
        status: 'queued',
        updatedAt: new Date(),
      })
      .where(eq(revenueSignals.id, signal.id));

    return opportunity;
  }

  private getStageDescription(stage: LoopStage): string {
    switch (stage) {
      case 'checking_performance':
        return 'ZYRA is analyzing your store\'s revenue performance';
      case 'identifying_hesitation':
        return 'ZYRA is finding where buyers are hesitating';
      case 'estimating_loss':
        return 'ZYRA is calculating how much revenue is at risk';
      case 'selecting_action':
        return 'ZYRA is choosing the highest-impact action';
      case 'preparing_action':
        return 'ZYRA is preparing the next revenue action for your review';
      case 'executing_action':
        return 'ZYRA is making the approved improvement';
      case 'measuring_impact':
        return 'ZYRA is tracking the revenue impact of recent actions';
      case 'improving_decisions':
        return 'ZYRA is learning from results to make better decisions';
      case 'idle':
        return 'ZYRA is monitoring your store for revenue opportunities';
    }
  }

  private humanizeActionType(actionType: string | null): string {
    return this.mapActionTypeToBusinessLabel(actionType || 'revenue_recovery');
  }

  private humanizeStatus(status: string): string {
    switch (status) {
      case 'awaiting_approval': return 'Waiting for your approval';
      case 'ready': return 'Ready to execute';
      case 'executing': return 'In progress';
      case 'completed': return 'Completed';
      case 'proving': return 'Measuring results';
      default: return status;
    }
  }
}

export const zyraRevenueLoop = new ZyraRevenueLoop();
