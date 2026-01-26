import { requireDb } from '../db';
import { 
  detectionCache, 
  detectionStatus,
  revenueSignals,
  revenueOpportunities,
  products,
  automationSettings,
  FrictionType,
  FRICTION_TYPE_LABELS
} from '@shared/schema';
import { eq, and, desc, sql, gte, isNull, or } from 'drizzle-orm';

const FAST_DETECT_TIMEOUT_MS = 10000;
const TOP_PRODUCTS_LIMIT = 20;
const TOP_FRICTION_TYPES = 3;

export type DetectionPhase = 'idle' | 'detect_started' | 'cache_loaded' | 'friction_identified' | 'decision_ready' | 'preparing';

export type DetectionStatus = 'friction_found' | 'no_friction' | 'insufficient_data';

export interface FastDetectionResult {
  success: boolean;
  status: DetectionStatus;
  frictionDetected: boolean;
  lastValidNextMoveId?: string;
  reason?: string;
  nextAction?: 'standby' | 'data_collection' | 'decide';
  topFriction: {
    productId: string;
    productName: string;
    frictionType: FrictionType;
    estimatedMonthlyLoss: number;
    confidenceScore: number;
    riskLevel: 'low' | 'medium' | 'high';
  } | null;
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
      console.log(`📦 [Fast Detect] Cache missing for user ${userId}, triggering precompute`);
      // Emit preparing phase first (data collection starting)
      if (!isAborted()) await this.emitProgress(userId, 'preparing', false, abortSignal);
      
      this.triggerBackgroundPrecompute(userId);
      
      // Mark detection as complete since we've determined the outcome (insufficient data)
      // This allows the UI to show the "collecting baseline data" message and stop spinner
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
      console.log(`✅ [Fast Detect] No significant friction found for user ${userId}`);
      if (!isAborted()) await this.emitProgress(userId, 'decision_ready', true, abortSignal);
      
      return {
        success: true,
        status: 'no_friction' as DetectionStatus,
        reason: 'No high-impact revenue friction detected',
        nextAction: 'standby',
        frictionDetected: false,
        topFriction: null,
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
}

export const fastDetectionEngine = new FastDetectionEngine();
