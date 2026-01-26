import { requireDb } from '../db';
import { 
  detectionCache, 
  detectionStatus,
  revenueSignals,
  revenueOpportunities,
  products,
  automationSettings,
  storeConnections,
  usageStats,
  FrictionType,
  FRICTION_TYPE_LABELS,
  FoundationalActionType,
  FoundationalAction,
  FOUNDATIONAL_ACTION_LABELS,
  FOUNDATIONAL_ACTION_DESCRIPTIONS
} from '@shared/schema';
import { eq, and, desc, sql, gte, isNull, or, count } from 'drizzle-orm';

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

export class FastDetectionEngine {
  private progressCallbacks: Map<string, (progress: DetectionProgress) => void> = new Map();

  async emitProgress(userId: string, phase: DetectionPhase, complete: boolean = false, abortSignal?: { aborted: boolean }) {
    if (abortSignal?.aborted) {
      console.log(`⛔ [Detection Progress] Aborted - skipping ${phase} for user ${userId}`);
      return;
    }
    
    const callback = this.progressCallbacks.get(userId);
    if (callback) {
      callback({ phase, complete, timestamp: Date.now() });
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
          foundationalAction: foundationalAction || undefined,
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
          foundationalAction: foundationalAction || undefined,
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
   * Select ONE foundational action for a new store
   * Priority: SEO basics > Product copy clarity > Trust signals > Recovery setup
   */
  async selectFoundationalAction(userId: string): Promise<FoundationalAction | null> {
    const db = requireDb();
    
    // Get a product to work on (prioritize products with low revenue health score)
    const [targetProduct] = await db
      .select({ 
        id: products.id, 
        name: products.name,
        revenueHealthScore: products.revenueHealthScore
      })
      .from(products)
      .where(eq(products.userId, userId))
      .orderBy(sql`COALESCE(${products.revenueHealthScore}, 0) ASC`)
      .limit(1);
    
    // Priority order for foundational actions
    const priorityActions: FoundationalActionType[] = [
      'seo_basics',
      'product_copy_clarity', 
      'trust_signals',
      'recovery_setup'
    ];
    
    // For now, select based on what the product needs most
    let selectedType: FoundationalActionType = 'seo_basics';
    
    if (targetProduct) {
      const healthScore = targetProduct.revenueHealthScore || 0;
      if (healthScore < 30) {
        selectedType = 'seo_basics';
      } else if (healthScore < 60) {
        selectedType = 'product_copy_clarity';
      } else {
        selectedType = 'trust_signals';
      }
    } else {
      // No products - suggest recovery setup
      selectedType = 'recovery_setup';
    }
    
    const actionDetails = FOUNDATIONAL_ACTION_DESCRIPTIONS[selectedType];
    
    const foundationalAction: FoundationalAction = {
      type: selectedType,
      productId: targetProduct?.id,
      productName: targetProduct?.name || undefined,
      title: FOUNDATIONAL_ACTION_LABELS[selectedType],
      description: actionDetails.description,
      whyItHelps: actionDetails.whyItHelps,
      expectedImpact: actionDetails.expectedImpact,
      riskLevel: 'low'
    };
    
    console.log(`🔧 [Foundational Action] Selected "${selectedType}" for user ${userId}${targetProduct ? ` (product: ${targetProduct.name})` : ''}`);
    
    return foundationalAction;
  }
}

export const fastDetectionEngine = new FastDetectionEngine();
