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

export interface FastDetectionResult {
  success: boolean;
  frictionDetected: boolean;
  lastValidNextMoveId?: string;
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
      if (!isAborted()) await this.emitProgress(userId, 'preparing', false, abortSignal);
      
      this.triggerBackgroundPrecompute(userId);
      
      return {
        success: true,
        frictionDetected: false,
        topFriction: null,
        detectionDurationMs: Date.now() - startTime,
        phase: 'preparing',
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
    return {
      success: false,
      frictionDetected: false,
      topFriction: null,
      detectionDurationMs: Date.now() - startTime,
      phase: 'idle',
      cacheStatus: 'fresh',
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
    
    let timeoutId: NodeJS.Timeout;
    
    const timeoutPromise = new Promise<FastDetectionResult>((resolve) => {
      timeoutId = setTimeout(async () => {
        abortSignal.aborted = true;
        console.warn(`⏱️  [Fast Detect] Timeout (${FAST_DETECT_TIMEOUT_MS}ms) for user ${userId}`);
        
        const [status] = await db
          .select({ 
            lastValidNextMoveId: detectionStatus.lastValidNextMoveId,
            topFrictionId: detectionStatus.topFrictionId
          })
          .from(detectionStatus)
          .where(eq(detectionStatus.userId, userId))
          .limit(1);
        
        await db.update(detectionStatus)
          .set({
            consecutiveTimeouts: sql`COALESCE(${detectionStatus.consecutiveTimeouts}, 0) + 1`,
            status: 'complete',
            phase: 'decision_ready',
            updatedAt: new Date(),
          })
          .where(eq(detectionStatus.userId, userId));
        
        const fallbackProductId = status?.lastValidNextMoveId || status?.topFrictionId;
        
        resolve({
          success: true,
          frictionDetected: !!fallbackProductId,
          lastValidNextMoveId: fallbackProductId || undefined,
          topFriction: fallbackProductId ? {
            productId: fallbackProductId,
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
