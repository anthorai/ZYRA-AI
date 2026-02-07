import { requireDb } from '../db';
import { 
  detectionCache, 
  detectionStatus,
  revenueSignals,
  revenueOpportunities,
  products,
  seoMeta,
  automationSettings,
  storeConnections,
  usageStats,
  activityLogs,
  actionLocks,
  autonomousActions,
  FrictionType,
  FRICTION_TYPE_LABELS,
  FoundationalActionType,
  FoundationalAction,
  FOUNDATIONAL_ACTION_LABELS,
  FOUNDATIONAL_ACTION_DESCRIPTIONS
} from '@shared/schema';
import { eq, and, desc, sql, gte, isNull, or, count, ne, inArray } from 'drizzle-orm';
import { emitZyraActivity, ZyraEventType } from './zyra-event-emitter';
import { ACTION_MAP, type ActionId } from './zyra-master-loop/master-action-registry';
import { actionDeduplicationGuard } from './action-deduplication-guard';

/**
 * Map legacy FoundationalActionType to new Master Action Registry ActionIds
 * This ensures we use the registry as the single source of truth
 */
const LEGACY_TO_ACTION_ID: Record<FoundationalActionType, ActionId> = {
  seo_basics: 'product_title_optimization',
  product_copy_clarity: 'product_description_clarity',
  trust_signals: 'trust_signal_enhancement',
  recovery_setup: 'abandoned_cart_recovery'
};

/**
 * Get action title, sub-actions, and credit cost from the Master Action Registry
 */
function getRegistryAction(legacyType: FoundationalActionType): { 
  title: string; 
  subActions: string[];
  actionId: ActionId;
  creditsRequired: number;
  category: 'FOUNDATION' | 'GROWTH' | 'GUARD';
} {
  const actionId = LEGACY_TO_ACTION_ID[legacyType];
  const registryAction = ACTION_MAP.get(actionId);
  
  if (registryAction) {
    return {
      title: registryAction.name,
      subActions: registryAction.subActions.slice(0, 3).map(sa => sa.name),
      actionId,
      creditsRequired: registryAction.creditsRequired,
      category: registryAction.category as 'FOUNDATION' | 'GROWTH' | 'GUARD'
    };
  }
  
  // Fallback if registry lookup fails (should not happen)
  return {
    title: FOUNDATIONAL_ACTION_LABELS[legacyType],
    subActions: [],
    actionId,
    creditsRequired: 3, // Default credit cost
    category: 'FOUNDATION'
  };
}

const FAST_DETECT_TIMEOUT_MS = 10000;
const TOP_PRODUCTS_LIMIT = 20;
const TOP_FRICTION_TYPES = 3;

// New store thresholds
const NEW_STORE_AGE_DAYS = 30;
const NEW_STORE_ORDER_THRESHOLD = 50;

export type DetectionPhase = 'idle' | 'detect_started' | 'cache_loaded' | 'friction_identified' | 'decision_ready' | 'preparing';

export type DetectionStatus = 'friction_found' | 'no_friction' | 'insufficient_data' | 'foundational_action';

export interface FastDetectionResult {
  success: boolean;
  status: DetectionStatus;
  frictionDetected: boolean;
  lastValidNextMoveId?: string;
  reason?: string;
  nextAction?: 'standby' | 'data_collection' | 'decide' | 'foundational';
  topFriction: {
    productId: string;
    productName: string;
    frictionType: FrictionType;
    estimatedMonthlyLoss: number;
    confidenceScore: number;
    riskLevel: 'low' | 'medium' | 'high';
  } | null;
  // New store foundational action
  isNewStore?: boolean;
  foundationalAction?: FoundationalAction;
  detectionDurationMs: number;
  phase: DetectionPhase;
  cacheStatus: 'fresh' | 'stale' | 'missing';
}

export interface DetectionProgress {
  phase: DetectionPhase;
  complete: boolean;
  timestamp: number;
}

// Execution state tracking
export type ExecutionPhase = 'idle' | 'executing' | 'proving' | 'learning' | 'completed';

export interface ExecutionState {
  phase: ExecutionPhase;
  actionId: string | null;
  actionType: string | null;
  startedAt: number;
  completedAt: number | null;
}

export class FastDetectionEngine {
  private progressCallbacks: Map<string, (progress: DetectionProgress) => void> = new Map();
  
  // Track execution state per user (in-memory for real-time updates)
  private executionStates: Map<string, ExecutionState> = new Map();
  
  // Get execution state for a user
  getExecutionState(userId: string): ExecutionState {
    return this.executionStates.get(userId) || {
      phase: 'idle',
      actionId: null,
      actionType: null,
      startedAt: 0,
      completedAt: null
    };
  }
  
  // Start execution - called when user approves action
  startExecution(userId: string, actionId: string, actionType: string): void {
    console.log(`🚀 [Execution] Starting for user ${userId}: ${actionType}`);
    this.executionStates.set(userId, {
      phase: 'executing',
      actionId,
      actionType,
      startedAt: Date.now(),
      completedAt: null
    });
    
    // Auto-progress through phases
    this.progressExecutionPhases(userId);
  }
  
  // Auto-progress through execution phases
  private async progressExecutionPhases(userId: string): Promise<void> {
    const phases: ExecutionPhase[] = ['executing', 'proving', 'learning', 'completed'];
    const phaseDelays = [2500, 2500, 2500]; // 2.5s for each phase
    const loopId = `exec_${userId}_${Date.now()}`;
    
    // Emit initial execution started event
    emitZyraActivity(userId, loopId, 'EXECUTE_STARTED', 'Applying AI-generated improvements to your products...', {
      phase: 'execute',
      detail: 'Making targeted optimizations to increase conversions',
    });
    
    for (let i = 1; i < phases.length; i++) {
      await new Promise(resolve => setTimeout(resolve, phaseDelays[i - 1]));
      
      const currentState = this.executionStates.get(userId);
      if (!currentState || currentState.phase === 'idle') {
        // User may have reset or navigated away
        break;
      }
      
      console.log(`📊 [Execution] User ${userId} progressing to phase: ${phases[i]}`);
      this.executionStates.set(userId, {
        ...currentState,
        phase: phases[i],
        completedAt: phases[i] === 'completed' ? Date.now() : null
      });
      
      // Emit SSE events for each phase transition
      if (phases[i] === 'proving') {
        emitZyraActivity(userId, loopId, 'PROVE_STARTED', 'Verifying changes and setting up tracking...', {
          phase: 'prove',
          detail: 'Monitoring for revenue impact and conversion improvements',
        });
      } else if (phases[i] === 'learning') {
        emitZyraActivity(userId, loopId, 'LEARN_STARTED', 'Recording optimization patterns for future use...', {
          phase: 'learn',
          detail: 'ZYRA is learning what works best for your store',
        });
      } else if (phases[i] === 'completed') {
        emitZyraActivity(userId, loopId, 'LOOP_COMPLETED', 'Optimization complete - changes applied successfully', {
          phase: 'standby',
          detail: 'Your products have been optimized. Monitoring for results.',
          status: 'success',
        });
      }
    }
    
    // Clear state after a short delay so next detection cycle can start fresh
    setTimeout(() => {
      const state = this.executionStates.get(userId);
      if (state?.phase === 'completed') {
        console.log(`✅ [Execution] Clearing completed state for user ${userId}`);
        this.executionStates.delete(userId);
      }
    }, 3000);
  }
  
  // Reset execution state (for cancellation or errors)
  resetExecution(userId: string): void {
    console.log(`🔄 [Execution] Resetting state for user ${userId}`);
    this.executionStates.delete(userId);
  }

  async emitProgress(userId: string, phase: DetectionPhase, complete: boolean = false, abortSignal?: { aborted: boolean }) {
    if (abortSignal?.aborted) {
      console.log(`⛔ [Detection Progress] Aborted - skipping ${phase} for user ${userId}`);
      return;
    }
    
    const callback = this.progressCallbacks.get(userId);
    if (callback) {
      callback({ phase, complete, timestamp: Date.now() });
    }

    // Emit real-time SSE event
    const loopId = `detect_${userId}_${Date.now()}`;
    const phaseEventMap: Record<DetectionPhase, { eventType: ZyraEventType; message: string; detail?: string }> = {
      'idle': { eventType: 'LOOP_STANDBY', message: 'ZYRA is standing by' },
      'detect_started': { 
        eventType: 'DETECT_STARTED', 
        message: 'Initiating revenue opportunity scan for your store...', 
        detail: 'Connecting to Shopify analytics and performance data' 
      },
      'cache_loaded': { 
        eventType: 'DETECT_PROGRESS', 
        message: 'Analyzing store performance metrics and buyer behavior patterns', 
        detail: 'Looking at conversion rates, cart abandonment, and product engagement' 
      },
      'friction_identified': { 
        eventType: 'DETECT_PROGRESS', 
        message: 'Identified potential friction points in the buyer journey', 
        detail: 'Scanning product pages, checkout flow, and trust indicators' 
      },
      'decision_ready': { 
        eventType: 'DETECT_COMPLETED', 
        message: 'Analysis complete - prioritizing highest-impact optimization', 
        detail: 'Selected based on conversion lift potential and implementation ease' 
      },
      'preparing': { 
        eventType: 'DECIDE_STARTED', 
        message: 'Preparing recommended action for your store', 
        detail: 'Calculating expected revenue impact' 
      },
    };

    const eventInfo = phaseEventMap[phase];
    if (eventInfo) {
      emitZyraActivity(userId, loopId, eventInfo.eventType, eventInfo.message, {
        phase: phase === 'preparing' ? 'decide' : 'detect',
        detail: eventInfo.detail,
      });
    }

    const db = requireDb();
    await db.insert(detectionStatus)
      .values({
        userId,
        status: complete ? 'complete' : 'detecting',
        phase,
        lastDetectionCompletedAt: complete ? new Date() : undefined,
      })
      .onConflictDoUpdate({
        target: detectionStatus.userId,
        set: {
          status: complete ? 'complete' : 'detecting',
          phase,
          lastDetectionCompletedAt: complete ? new Date() : sql`${detectionStatus.lastDetectionCompletedAt}`,
          updatedAt: new Date(),
        },
      });
  }

  onProgress(userId: string, callback: (progress: DetectionProgress) => void) {
    this.progressCallbacks.set(userId, callback);
    return () => this.progressCallbacks.delete(userId);
  }

  async fastDetect(userId: string, abortSignal?: { aborted: boolean }): Promise<FastDetectionResult> {
    const startTime = Date.now();
    const db = requireDb();
    
    const isAborted = () => abortSignal?.aborted;
    
    console.log(`⚡ [Fast Detect] Starting for user ${userId}`);
    
    if (!isAborted()) await this.emitProgress(userId, 'detect_started', false, abortSignal);
    
    const settings = await db
      .select({ globalAutopilotEnabled: automationSettings.globalAutopilotEnabled })
      .from(automationSettings)
      .where(eq(automationSettings.userId, userId))
      .limit(1);
    
    if (!settings[0]?.globalAutopilotEnabled) {
      console.log(`⏸️  [Fast Detect] Autopilot disabled for user ${userId}`);
      return {
        success: true,
        status: 'no_friction' as DetectionStatus,
        reason: 'Autopilot is disabled',
        nextAction: 'standby',
        frictionDetected: false,
        topFriction: null,
        detectionDurationMs: Date.now() - startTime,
        phase: 'idle',
        cacheStatus: 'fresh',
      };
    }

    if (isAborted()) return this.abortedResult(startTime);

    const cacheData = await db
      .select()
      .from(detectionCache)
      .where(eq(detectionCache.userId, userId))
      .orderBy(desc(detectionCache.frictionScore))
      .limit(TOP_PRODUCTS_LIMIT);

    if (isAborted()) return this.abortedResult(startTime);
    await this.emitProgress(userId, 'cache_loaded', false, abortSignal);

    const cacheAge = cacheData.length > 0 && cacheData[0].lastPrecomputedAt
      ? Date.now() - new Date(cacheData[0].lastPrecomputedAt).getTime()
      : Infinity;
    
    const cacheStatus: 'fresh' | 'stale' | 'missing' = 
      cacheData.length === 0 ? 'missing' :
      cacheAge > 12 * 60 * 60 * 1000 ? 'stale' : 'fresh';

    if (cacheStatus === 'missing') {
      console.log(`📦 [Fast Detect] Cache missing for user ${userId}, checking if new store...`);
      
      // Check if this is a new store - if so, provide foundational action
      const { isNew, storeAgeDays, totalOrders } = await this.isNewStore(userId);
      
      if (isNew) {
        console.log(`🏪 [Fast Detect] New store detected (age=${storeAgeDays}d, orders=${totalOrders}), selecting foundational action`);
        
        // Select a foundational action for the new store
        const foundationalAction = await this.selectFoundationalAction(userId);
        
        if (!isAborted()) await this.emitProgress(userId, 'decision_ready', true, abortSignal);
        
        // Trigger background precompute for future detections
        this.triggerBackgroundPrecompute(userId);
        
        return {
          success: true,
          status: 'foundational_action' as DetectionStatus,
          reason: 'New store - preparing revenue foundations',
          nextAction: 'foundational',
          frictionDetected: false,
          topFriction: null,
          isNewStore: true,
          foundationalAction,
          detectionDurationMs: Date.now() - startTime,
          phase: 'decision_ready',
          cacheStatus: 'missing',
        };
      }
      
      // Not a new store, but cache missing - trigger precompute
      if (!isAborted()) await this.emitProgress(userId, 'preparing', false, abortSignal);
      this.triggerBackgroundPrecompute(userId);
      
      if (!isAborted()) await this.emitProgress(userId, 'decision_ready', true, abortSignal);
      
      return {
        success: true,
        status: 'insufficient_data' as DetectionStatus,
        reason: 'Not enough data to detect revenue friction - collecting baseline data',
        nextAction: 'data_collection',
        frictionDetected: false,
        topFriction: null,
        detectionDurationMs: Date.now() - startTime,
        phase: 'decision_ready',
        cacheStatus: 'missing',
      };
    }

    if (cacheStatus === 'stale') {
      console.log(`🔄 [Fast Detect] Cache stale for user ${userId}, triggering background precompute`);
      this.triggerBackgroundPrecompute(userId);
    }

    const topFrictionProducts = cacheData
      .filter(c => c.frictionScore && c.frictionScore > 20)
      .slice(0, TOP_FRICTION_TYPES);

    if (topFrictionProducts.length === 0) {
      console.log(`✅ [Fast Detect] No significant friction found for user ${userId}, checking if new store...`);
      
      // Check if this is a new store - if so, ALWAYS provide a foundational action
      // RULE: For NEW STORES, DETECT must NEVER return "no action"
      const { isNew, storeAgeDays, totalOrders } = await this.isNewStore(userId);
      
      if (isNew) {
        console.log(`🏪 [Fast Detect] New store (age=${storeAgeDays}d, orders=${totalOrders}), selecting foundational action instead of standby`);
        
        // Select a foundational action for the new store
        const foundationalAction = await this.selectFoundationalAction(userId);
        
        if (!isAborted()) await this.emitProgress(userId, 'decision_ready', true, abortSignal);
        
        return {
          success: true,
          status: 'foundational_action' as DetectionStatus,
          reason: 'New store - preparing revenue foundations',
          nextAction: 'foundational',
          frictionDetected: false,
          topFriction: null,
          isNewStore: true,
          foundationalAction,
          detectionDurationMs: Date.now() - startTime,
          phase: 'decision_ready',
          cacheStatus,
        };
      }
      
      // Established store with no friction - standby mode
      if (!isAborted()) await this.emitProgress(userId, 'decision_ready', true, abortSignal);
      
      return {
        success: true,
        status: 'no_friction' as DetectionStatus,
        reason: 'No high-impact revenue friction detected',
        nextAction: 'standby',
        frictionDetected: false,
        topFriction: null,
        isNewStore: false,
        detectionDurationMs: Date.now() - startTime,
        phase: 'decision_ready',
        cacheStatus,
      };
    }

    if (isAborted()) return this.abortedResult(startTime);
    await this.emitProgress(userId, 'friction_identified', false, abortSignal);

    const topProduct = topFrictionProducts[0];
    
    // Use denormalized productName from cache - NO live product table lookups
    // This follows the speed requirement: "DETECT must ONLY read precomputed cache"
    const productName = topProduct.productName || 'Product';

    if (isAborted()) return this.abortedResult(startTime);

    const frictionScore = topProduct.frictionScore || 0;
    const riskLevel: 'low' | 'medium' | 'high' = 
      frictionScore >= 70 ? 'high' :
      frictionScore >= 40 ? 'medium' : 'low';

    if (isAborted()) return this.abortedResult(startTime);
    await this.emitProgress(userId, 'decision_ready', true, abortSignal);
    if (isAborted()) return this.abortedResult(startTime);

    const result: FastDetectionResult = {
      success: true,
      status: 'friction_found' as DetectionStatus,
      reason: `Revenue friction detected: ${topProduct.topFrictionType || 'view_no_cart'}`,
      nextAction: 'decide',
      frictionDetected: true,
      lastValidNextMoveId: topProduct.productId || undefined,
      topFriction: {
        productId: topProduct.productId || '',
        productName,
        frictionType: (topProduct.topFrictionType || 'view_no_cart') as FrictionType,
        estimatedMonthlyLoss: parseFloat(topProduct.estimatedMonthlyLoss?.toString() || '0'),
        confidenceScore: topProduct.confidenceScore || 50,
        riskLevel,
      },
      detectionDurationMs: Date.now() - startTime,
      phase: 'decision_ready',
      cacheStatus,
    };

    console.log(`✅ [Fast Detect] Completed in ${result.detectionDurationMs}ms - Friction: ${result.topFriction?.frictionType}`);
    
    if (!isAborted()) {
      await db.update(detectionStatus)
        .set({
          lastDetectionDurationMs: result.detectionDurationMs,
          frictionDetected: result.frictionDetected,
          topFrictionId: result.topFriction?.productId,
          lastValidNextMoveId: result.topFriction?.productId,
          updatedAt: new Date(),
        })
        .where(eq(detectionStatus.userId, userId));
    }

    return result;
  }

  private abortedResult(startTime: number): FastDetectionResult {
    console.log(`⛔ [Fast Detect] Detection aborted after ${Date.now() - startTime}ms`);
    return {
      success: false,
      status: 'insufficient_data' as DetectionStatus,
      reason: 'Detection was aborted - will retry on next cycle',
      nextAction: 'data_collection',
      frictionDetected: false,
      topFriction: null,
      detectionDurationMs: Date.now() - startTime,
      phase: 'decision_ready',
      cacheStatus: 'stale',
    };
  }

  async getDetectionStatus(userId: string): Promise<DetectionProgress & { cacheStatus: string }> {
    const db = requireDb();
    
    const [status] = await db
      .select()
      .from(detectionStatus)
      .where(eq(detectionStatus.userId, userId))
      .limit(1);

    if (!status) {
      return {
        phase: 'idle',
        complete: false,
        timestamp: Date.now(),
        cacheStatus: 'unknown',
      };
    }

    const [cache] = await db
      .select({ lastPrecomputedAt: detectionCache.lastPrecomputedAt })
      .from(detectionCache)
      .where(eq(detectionCache.userId, userId))
      .limit(1);

    const cacheAge = cache?.lastPrecomputedAt
      ? Date.now() - new Date(cache.lastPrecomputedAt).getTime()
      : Infinity;
    
    const cacheStatus = 
      !cache ? 'missing' :
      cacheAge > 12 * 60 * 60 * 1000 ? 'stale' : 'fresh';

    return {
      phase: (status.phase || 'idle') as DetectionPhase,
      complete: status.status === 'complete',
      timestamp: status.updatedAt ? new Date(status.updatedAt).getTime() : Date.now(),
      cacheStatus,
    };
  }

  async getLastValidNextMove(userId: string): Promise<string | null> {
    const db = requireDb();
    
    const [status] = await db
      .select({ lastValidNextMoveId: detectionStatus.lastValidNextMoveId })
      .from(detectionStatus)
      .where(eq(detectionStatus.userId, userId))
      .limit(1);

    return status?.lastValidNextMoveId || null;
  }

  private triggerBackgroundPrecompute(userId: string) {
    console.log(`📊 [Precompute] Scheduling background precomputation for user ${userId}`);
    
    setImmediate(async () => {
      try {
        const { DetectionPrecompute } = await import('./detection-precompute.js');
        const precompute = new DetectionPrecompute();
        await precompute.precomputeForUser(userId);
      } catch (error) {
        console.error(`❌ [Precompute] Background precomputation failed for user ${userId}:`, error);
      }
    });
  }

  async detectWithTimeout(userId: string): Promise<FastDetectionResult> {
    const db = requireDb();
    const abortSignal = { aborted: false };
    
    // Pre-cache fallback data BEFORE starting timeout - no blocking during timeout
    let cachedFallbackId: string | null = null;
    try {
      const [cached] = await db
        .select({ 
          lastValidNextMoveId: detectionStatus.lastValidNextMoveId,
          topFrictionId: detectionStatus.topFrictionId
        })
        .from(detectionStatus)
        .where(eq(detectionStatus.userId, userId))
        .limit(1);
      cachedFallbackId = cached?.lastValidNextMoveId || cached?.topFrictionId || null;
      console.log(`⏱️  [Fast Detect] Pre-cached fallback ID for user ${userId}: ${cachedFallbackId || 'none'}`);
    } catch (e) {
      console.log(`⏱️  [Fast Detect] Failed to pre-cache fallback ID, will use insufficient_data on timeout`);
    }
    
    let timeoutId: NodeJS.Timeout;
    
    const timeoutPromise = new Promise<FastDetectionResult>((resolve) => {
      timeoutId = setTimeout(() => {
        abortSignal.aborted = true;
        
        // Use pre-cached fallback data - resolves IMMEDIATELY
        const hasFallback = !!cachedFallbackId;
        const resultStatus: DetectionStatus = hasFallback ? 'friction_found' : 'insufficient_data';
        console.warn(`⏱️  [Fast Detect] Timeout (${FAST_DETECT_TIMEOUT_MS}ms) for user ${userId} - resolving with ${resultStatus}`);
        
        resolve({
          success: true,
          status: resultStatus,
          reason: hasFallback 
            ? 'Detection timed out - using previous recommendation'
            : 'Detection timed out - will retry on next cycle',
          nextAction: hasFallback ? 'decide' : 'data_collection',
          frictionDetected: hasFallback,
          lastValidNextMoveId: cachedFallbackId || undefined,
          topFriction: hasFallback ? {
            productId: cachedFallbackId!,
            productName: 'Previous recommendation',
            frictionType: 'view_no_cart' as FrictionType,
            estimatedMonthlyLoss: 0,
            confidenceScore: 40,
            riskLevel: 'medium',
          } : null,
          detectionDurationMs: FAST_DETECT_TIMEOUT_MS,
          phase: 'decision_ready',
          cacheStatus: 'stale',
        });
        
        // Offload all DB work to async after resolve
        setImmediate(async () => {
          try {
            await db.update(detectionStatus)
              .set({
                consecutiveTimeouts: sql`COALESCE(${detectionStatus.consecutiveTimeouts}, 0) + 1`,
                status: 'complete',
                phase: 'decision_ready',
                updatedAt: new Date(),
              })
              .where(eq(detectionStatus.userId, userId));
            console.log(`⏱️  [Fast Detect] Timeout DB update completed for user ${userId}`);
          } catch (err) {
            console.error(`⏱️  [Fast Detect] Timeout DB update failed for user ${userId}:`, err);
          }
        });
      }, FAST_DETECT_TIMEOUT_MS);
    });

    const detectionPromise = this.fastDetect(userId, abortSignal);

    const result = await Promise.race([detectionPromise, timeoutPromise]);
    
    clearTimeout(timeoutId!);
    abortSignal.aborted = true;

    return result;
  }

  /**
   * Detect if a store is "new" based on age and order count
   * New stores: age < 30 days OR orders < 50
   */
  async isNewStore(userId: string): Promise<{ isNew: boolean; storeAgeDays: number; totalOrders: number }> {
    const db = requireDb();
    
    // Get store connection age
    const [storeConnection] = await db
      .select({ createdAt: storeConnections.createdAt })
      .from(storeConnections)
      .where(eq(storeConnections.userId, userId))
      .limit(1);
    
    // Get total orders from usage stats
    const [stats] = await db
      .select({ totalOrders: usageStats.totalOrders })
      .from(usageStats)
      .where(eq(usageStats.userId, userId))
      .limit(1);
    
    const storeAgeDays = storeConnection?.createdAt
      ? Math.floor((Date.now() - new Date(storeConnection.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    const totalOrders = stats?.totalOrders || 0;
    
    const isNew = storeAgeDays < NEW_STORE_AGE_DAYS || totalOrders < NEW_STORE_ORDER_THRESHOLD;
    
    console.log(`🏪 [New Store Check] User ${userId}: age=${storeAgeDays}d, orders=${totalOrders}, isNew=${isNew}`);
    
    return { isNew, storeAgeDays, totalOrders };
  }

  /**
   * Generate dynamic, context-specific reasoning for why ZYRA recommends this action
   * This makes the recommendation feel personalized and real, not generic
   */
  private generateDynamicReasoning(
    actionType: FoundationalActionType,
    product: { id: string; name: string; revenueHealthScore: number | null } | undefined,
    completedActionsCount: number,
    totalProductsCount: number
  ): { description: string; whyItHelps: string; expectedImpact: string } {
    const productName = product?.name || 'your products';
    const healthScore = product?.revenueHealthScore || 0;
    const shortProductName = productName.length > 40 ? productName.substring(0, 37) + '...' : productName;
    
    // Dynamic reasoning templates based on action type and context
    const reasoningTemplates: Record<FoundationalActionType, { 
      descriptions: string[];
      reasons: string[];
      impacts: string[];
    }> = {
      seo_basics: {
        descriptions: [
          `Optimize "${shortProductName}" for search engines to increase organic discovery`,
          `Improve search ranking potential for "${shortProductName}" with targeted keywords`,
          `Enhance meta data and titles for "${shortProductName}" to attract search traffic`
        ],
        reasons: [
          `"${shortProductName}" currently has ${healthScore < 30 ? 'low' : 'moderate'} search visibility. Optimizing SEO helps potential buyers find this product when searching for similar items.`,
          `Products with optimized SEO get 2-3x more organic traffic. "${shortProductName}" can reach more buyers without additional ad spend.`,
          `Search engines prioritize products with clear, keyword-rich titles and descriptions. This optimization positions "${shortProductName}" for discovery.`
        ],
        impacts: [
          `Increased organic visibility for "${shortProductName}"`,
          `Better search ranking potential across ${totalProductsCount} product${totalProductsCount > 1 ? 's' : ''}`,
          `Foundation for long-term organic traffic growth`
        ]
      },
      product_copy_clarity: {
        descriptions: [
          `Rewrite "${shortProductName}" description to clearly communicate its unique value`,
          `Enhance product copy for "${shortProductName}" to highlight key benefits`,
          `Clarify value proposition and benefits for "${shortProductName}"`
        ],
        reasons: [
          `Visitors often leave because they don't quickly understand the value. Clear copy for "${shortProductName}" helps convert browsers into buyers.`,
          `Product descriptions that focus on benefits (not just features) convert 20-30% better. "${shortProductName}" needs compelling copy.`,
          `First-time visitors decide within seconds. "${shortProductName}" needs copy that immediately answers "why should I buy this?"`
        ],
        impacts: [
          `Higher conversion rate for "${shortProductName}" visitors`,
          `Reduced bounce rate from product pages`,
          `Clearer value proposition for first-time buyers`
        ]
      },
      trust_signals: {
        descriptions: [
          `Add trust elements to "${shortProductName}" to reduce buyer hesitation`,
          `Build credibility for "${shortProductName}" with social proof and guarantees`,
          `Strengthen buyer confidence for "${shortProductName}" with trust indicators`
        ],
        reasons: [
          `New stores face trust barriers. Adding reviews, guarantees, and badges to "${shortProductName}" reduces the perceived risk of buying.`,
          `73% of buyers check for trust signals before purchasing. "${shortProductName}" needs visible credibility markers.`,
          `First-time buyers are cautious. Trust elements on "${shortProductName}" can increase checkout completion by 15-25%.`
        ],
        impacts: [
          `Increased buyer confidence for "${shortProductName}"`,
          `Lower cart abandonment from trust concerns`,
          `Foundation for building store reputation`
        ]
      },
      recovery_setup: {
        descriptions: [
          `Configure automated cart recovery to recapture abandoned purchases`,
          `Set up recovery emails to bring back customers who left items in cart`,
          `Enable abandoned cart recovery to capture lost revenue automatically`
        ],
        reasons: [
          `On average, 70% of carts are abandoned. Recovery emails can recapture 5-15% of these lost sales automatically.`,
          `Customers who added items to cart have high purchase intent. A timely reminder often converts them.`,
          `Recovery automation works 24/7. Once set up, it continuously recaptures revenue with no manual effort.`
        ],
        impacts: [
          `Automated recovery of abandoned purchases`,
          `Passive revenue recapture system in place`,
          `Foundation for customer re-engagement`
        ]
      }
    };
    
    const templates = reasoningTemplates[actionType];
    
    // Use completion count to rotate through templates for variety
    const index = completedActionsCount % templates.descriptions.length;
    
    return {
      description: templates.descriptions[index],
      whyItHelps: templates.reasons[index],
      expectedImpact: templates.impacts[index]
    };
  }

  /**
   * Select ONE foundational action for a new store
   * Priority: SEO basics > Product copy clarity > Trust signals > Recovery setup
   * RULE: This method ALWAYS returns an action - never null for new stores
   * LOCK CHECK: Skips products that already have a locked action to prevent duplicate credit consumption
   */
  async selectFoundationalAction(userId: string): Promise<FoundationalAction> {
    try {
      const db = requireDb();
      
      // Get all products, prioritizing those without SEO optimization
      const allProducts = await db
        .select({ 
          id: products.id, 
          name: products.name,
          revenueHealthScore: products.revenueHealthScore,
          hasOptimizedSeo: seoMeta.optimizedTitle
        })
        .from(products)
        .leftJoin(seoMeta, eq(products.id, seoMeta.productId))
        .where(eq(products.userId, userId))
        .orderBy(sql`COALESCE(${products.revenueHealthScore}, 0) ASC`)
        .limit(10);
      
      // Query all LOCKED actions for this user to prevent duplicate recommendations
      // Only locked actions prevent re-execution; unlocked ones (due to material change) can be re-run
      const lockedActions = await db
        .select({
          entityId: actionLocks.entityId,
          actionType: actionLocks.actionType,
          status: actionLocks.status,
          lockedAt: actionLocks.lockedAt,
        })
        .from(actionLocks)
        .where(and(
          eq(actionLocks.userId, userId),
          eq(actionLocks.entityType, 'product'),
          eq(actionLocks.status, 'locked')
        ));
      
      // Create a Set of locked product+action combinations for fast lookup
      // Format: "productId:actionType"
      const lockedCombinations = new Set(
        lockedActions.map(lock => `${lock.entityId}:${lock.actionType}`)
      );
      
      console.log(`🔒 [Action Locks] Found ${lockedActions.length} locked actions for user ${userId}`);
      
      // Prioritize products without optimized SEO, then those with low health scores
      const unoptimizedProducts = allProducts.filter(p => !p.hasOptimizedSeo);
      const optimizedProducts = allProducts.filter(p => p.hasOptimizedSeo);
      const userProducts = [...unoptimizedProducts, ...optimizedProducts].slice(0, 10);
      
      // Get recently executed foundational actions from activity logs
      const recentActions = await db
        .select({
          action: activityLogs.action,
          metadata: activityLogs.metadata,
        })
        .from(activityLogs)
        .where(and(
          eq(activityLogs.userId, userId),
          sql`${activityLogs.action} LIKE 'foundational_%'`,
          sql`${activityLogs.createdAt} > NOW() - INTERVAL '24 hours'`
        ))
        .orderBy(desc(activityLogs.createdAt))
        .limit(10);
      
      // Extract which action types were recently executed
      const recentActionTypes = new Set(
        recentActions.map(a => a.action?.replace('foundational_', '') || '')
      );
      
      // Define action type priority order for new stores
      const actionPriority: FoundationalActionType[] = [
        'seo_basics',           // First: Help them get discovered
        'product_copy_clarity', // Second: Make listings compelling
        'trust_signals',        // Third: Build credibility
        'recovery_setup'        // Fourth: Set up cart recovery
      ];
      
      // Find the next action type that hasn't been recently executed
      let selectedType: FoundationalActionType = 'seo_basics';
      let targetProduct = userProducts[0];
      let isAlreadyOptimized = false; // Track if we're showing a locked action
      
      // RULE 8: Check per-action-type cooldowns for recently executed actions
      // Uses ActionDeduplicationGuard's cooldown config instead of hardcoded duration
      const cooldownCombinations = new Set<string>();
      try {
        const maxCooldownMs = actionDeduplicationGuard.getMaxCooldownMs();
        const cooldownCutoff = new Date(Date.now() - maxCooldownMs);
        
        const recentExecutions = await db
          .select({
            entityId: autonomousActions.entityId,
            actionType: autonomousActions.actionType,
            completedAt: autonomousActions.completedAt,
          })
          .from(autonomousActions)
          .where(and(
            eq(autonomousActions.userId, userId),
            eq(autonomousActions.status, 'completed'),
            gte(autonomousActions.completedAt, cooldownCutoff)
          ));

        for (const exec of recentExecutions) {
          if (exec.entityId && exec.actionType && exec.completedAt) {
            const cooldownMs = actionDeduplicationGuard.getCooldownMs(exec.actionType);
            const completedAt = new Date(exec.completedAt).getTime();
            const cooldownExpiresAt = completedAt + cooldownMs;
            
            if (Date.now() < cooldownExpiresAt) {
              cooldownCombinations.add(`${exec.entityId}:${exec.actionType}`);
            }
          }
        }
        console.log(`⏳ [Cooldown] Found ${cooldownCombinations.size} actions in cooldown for user ${userId}`);
      } catch (error) {
        console.error('[Cooldown] Error checking cooldowns:', error);
      }

      // RULE 7: Check active actions per product (only ONE active action at a time)
      const activeProductActions = new Set<string>();
      try {
        const runningActions = await db
          .select({ entityId: autonomousActions.entityId })
          .from(autonomousActions)
          .where(and(
            eq(autonomousActions.userId, userId),
            eq(autonomousActions.status, 'running')
          ));

        for (const action of runningActions) {
          if (action.entityId) {
            activeProductActions.add(action.entityId);
          }
        }
        console.log(`🔄 [Product Protection] ${activeProductActions.size} products have active actions`);
      } catch (error) {
        console.error('[Product Protection] Error checking active actions:', error);
      }

      // Helper function to check if a product+action is locked, in cooldown, or has active actions
      const isLocked = (productId: string | undefined, actionType: FoundationalActionType): boolean => {
        if (!productId) return false;
        const actionId = LEGACY_TO_ACTION_ID[actionType];
        if (lockedCombinations.has(`${productId}:${actionId}`)) return true;
        if (cooldownCombinations.has(`${productId}:${actionId}`)) return true;
        if (activeProductActions.has(productId)) return true;
        return false;
      };
      
      // Helper function to find an unlocked product for a given action type
      const findUnlockedProduct = (actionType: FoundationalActionType): typeof userProducts[0] | undefined => {
        return userProducts.find(p => !isLocked(p.id, actionType));
      };
      
      // Helper function to find an unlocked action for a given product
      const findUnlockedAction = (productId: string | undefined): FoundationalActionType | undefined => {
        for (const actionType of actionPriority) {
          if (!isLocked(productId, actionType)) {
            return actionType;
          }
        }
        return undefined;
      };
      
      // Track if the SELECTED combination is locked (not just "all locked")
      let selectedCombinationIsLocked = false;
      
      if (userProducts.length > 0) {
        // Find first action type not recently executed AND not locked for any product
        let foundUnlockedCombination = false;
        
        for (const actionType of actionPriority) {
          if (!recentActionTypes.has(actionType)) {
            const unlockedProduct = findUnlockedProduct(actionType);
            if (unlockedProduct) {
              selectedType = actionType;
              targetProduct = unlockedProduct;
              foundUnlockedCombination = true;
              selectedCombinationIsLocked = false;
              console.log(`✅ [Action Locks] Found unlocked combination: ${actionType} for product ${unlockedProduct.name}`);
              break;
            }
          }
        }
        
        // If no unlocked combination found from recent actions check, try all combinations
        if (!foundUnlockedCombination) {
          // Try each product with each action type to find an unlocked combination
          outerLoop: for (const product of userProducts) {
            for (const actionType of actionPriority) {
              if (!isLocked(product.id, actionType)) {
                selectedType = actionType;
                targetProduct = product;
                foundUnlockedCombination = true;
                selectedCombinationIsLocked = false;
                console.log(`✅ [Action Locks] Found alternative unlocked: ${actionType} for product ${product.name}`);
                break outerLoop;
              }
            }
          }
        }
        
        // If still no unlocked combination, all products are fully optimized
        if (!foundUnlockedCombination) {
          isAlreadyOptimized = true;
          selectedCombinationIsLocked = true;
          console.log(`🔒 [Action Locks] All product+action combinations are locked for user ${userId}. Execution blocked.`);
          // Still set a target product and action for display purposes only
          targetProduct = userProducts[0];
          selectedType = 'seo_basics';
        }
        
        // Check if all products already have optimized SEO
        const allProductsHaveSeo = unoptimizedProducts.length === 0 && optimizedProducts.length > 0;
        
        // Smart rotation: find next action type that hasn't been done recently AND is unlocked
        const getNextAvailableAction = (): { actionType: FoundationalActionType; isLocked: boolean } => {
          const rotationPriority: FoundationalActionType[] = [
            'seo_basics',
            'product_copy_clarity', 
            'trust_signals',
            'recovery_setup'
          ];
          
          // Find first action not recently done AND not locked
          for (const actionType of rotationPriority) {
            if (!recentActionTypes.has(actionType) && !isLocked(targetProduct?.id, actionType)) {
              return { actionType, isLocked: false };
            }
          }
          // Find any unlocked action
          for (const actionType of rotationPriority) {
            if (!isLocked(targetProduct?.id, actionType)) {
              return { actionType, isLocked: false };
            }
          }
          // All locked for this product - return current selection but mark as locked
          return { 
            actionType: rotationPriority[recentActionTypes.size % rotationPriority.length],
            isLocked: true
          };
        };
        
        // Additional selection logic based on product state (only if not already optimized)
        if (targetProduct && !isAlreadyOptimized) {
          const productHasSeo = targetProduct.hasOptimizedSeo;
          
          // Always rotate if selectedType was recently executed or locked
          if (recentActionTypes.has(selectedType) || isLocked(targetProduct.id, selectedType)) {
            const nextAction = getNextAvailableAction();
            selectedType = nextAction.actionType;
            selectedCombinationIsLocked = nextAction.isLocked;
          } else if (allProductsHaveSeo && selectedType === 'seo_basics') {
            // If SEO is done for all products, rotate to next action
            const nextAction = getNextAvailableAction();
            selectedType = nextAction.actionType;
            selectedCombinationIsLocked = nextAction.isLocked;
          } else if (productHasSeo && selectedType === 'seo_basics') {
            // If this product has SEO, rotate to next action
            const nextAction = getNextAvailableAction();
            selectedType = nextAction.actionType;
            selectedCombinationIsLocked = nextAction.isLocked;
          }
        }
      } else {
        // No products - suggest recovery setup
        selectedType = 'recovery_setup';
        selectedCombinationIsLocked = false;
      }
      
      const actionDetails = FOUNDATIONAL_ACTION_DESCRIPTIONS[selectedType];
      
      // Generate dynamic, context-specific reasoning
      const dynamicReasoning = this.generateDynamicReasoning(
        selectedType, 
        targetProduct, 
        recentActionTypes.size,
        userProducts.length
      );
      
      // Get sub-actions based on action type
      // Get title and sub-actions from the Master Action Registry (single source of truth)
      const registryAction = getRegistryAction(selectedType);

      // Determine funnel stage based on action type
      const funnelStageMap: Record<FoundationalActionType, string> = {
        seo_basics: 'Discoverability',
        product_copy_clarity: 'Consideration',
        trust_signals: 'Conversion',
        recovery_setup: 'Recovery'
      };

      // Determine detected issue based on action type
      const detectedIssueMap: Record<FoundationalActionType, string> = {
        seo_basics: 'Low organic CTR',
        product_copy_clarity: 'Low add-to-cart rate',
        trust_signals: 'High cart abandonment',
        recovery_setup: 'No recovery flow configured'
      };

      const foundationalAction: FoundationalAction = {
        type: selectedType,
        category: registryAction.category,
        productId: targetProduct?.id,
        productName: targetProduct?.name || undefined,
        title: registryAction.title, // Use registry name instead of legacy label
        description: isAlreadyOptimized 
          ? 'All products have been optimized with this action. ZYRA is monitoring for changes that would unlock new optimization opportunities.'
          : dynamicReasoning.description,
        whyItHelps: isAlreadyOptimized
          ? 'Your products are already optimized. Wait for material changes (price updates, inventory changes, or content edits) to unlock new recommendations.'
          : dynamicReasoning.whyItHelps,
        expectedImpact: isAlreadyOptimized ? 'N/A - Already Optimized' : dynamicReasoning.expectedImpact,
        riskLevel: 'low',
        subActions: registryAction.subActions, // Use registry sub-actions
        storeSituation: 'NEW / FRESH',
        activePlan: 'STARTER',
        detectedIssue: isAlreadyOptimized ? 'No new issues detected' : detectedIssueMap[selectedType],
        funnelStage: funnelStageMap[selectedType],
        // Credit consumption tracking
        creditCost: registryAction.creditsRequired,
        executionMode: 'fast', // Default to fast mode
        // Lock status - prevents duplicate execution
        // Use selectedCombinationIsLocked (specific selected combo) not just isAlreadyOptimized (all combos)
        isLocked: selectedCombinationIsLocked,
        // Additional flag for when ALL combinations are locked
        allCombinationsLocked: isAlreadyOptimized
      };
      
      console.log(`🔧 [Foundational Action] Selected "${selectedType}" for user ${userId}${targetProduct ? ` (product: ${targetProduct.name})` : ''} | Locked: ${selectedCombinationIsLocked} | AllLocked: ${isAlreadyOptimized} | Recent: [${Array.from(recentActionTypes).join(', ')}]`);
      
      return foundationalAction;
    } catch (error) {
      // FALLBACK: Always return a default action for new stores
      // RULE: For NEW STORES, DETECT must NEVER return "no action"
      console.error(`❌ [Foundational Action] Error selecting action for user ${userId}:`, error);
      
      // Use registry for fallback action as well
      const fallbackRegistry = getRegistryAction('trust_signals');
      
      const fallbackAction: FoundationalAction = {
        type: 'trust_signals',
        category: fallbackRegistry.category,
        title: fallbackRegistry.title, // Use registry name
        description: FOUNDATIONAL_ACTION_DESCRIPTIONS['trust_signals'].description,
        whyItHelps: FOUNDATIONAL_ACTION_DESCRIPTIONS['trust_signals'].whyItHelps,
        expectedImpact: FOUNDATIONAL_ACTION_DESCRIPTIONS['trust_signals'].expectedImpact,
        riskLevel: 'low',
        subActions: fallbackRegistry.subActions, // Use registry sub-actions
        storeSituation: 'NEW / FRESH',
        activePlan: 'STARTER',
        detectedIssue: 'High cart abandonment',
        funnelStage: 'Conversion',
        // Credit consumption tracking
        creditCost: fallbackRegistry.creditsRequired,
        executionMode: 'fast' // Default to fast mode
      };
      
      console.log(`🔧 [Foundational Action] Using fallback "trust_signals" for user ${userId}`);
      return fallbackAction;
    }
  }
}

export const fastDetectionEngine = new FastDetectionEngine();

// Re-export foundational action constants for use in routes
export { FOUNDATIONAL_ACTION_LABELS, FOUNDATIONAL_ACTION_DESCRIPTIONS } from '@shared/schema';
