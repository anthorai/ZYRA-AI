import { requireDb } from '../db';
import { 
  detectionCache, 
  detectionStatus,
  revenueSignals,
  revenueOpportunities,
  products,
  seoMeta,
  FrictionType
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export interface DeepDetectionResult {
  improved: boolean;
  originalConfidence: number;
  newConfidence: number;
  additionalInsights: string[];
  serpAnalysisComplete: boolean;
}

export class DeepDetectionEngine {
  async deepDetect(userId: string, productId: string): Promise<DeepDetectionResult> {
    const startTime = Date.now();
    const db = requireDb();
    
    console.log(`🔬 [Deep Detect] Starting deep analysis for product ${productId}`);

    const [cacheEntry] = await db
      .select()
      .from(detectionCache)
      .where(
        and(
          eq(detectionCache.userId, userId),
          eq(detectionCache.productId, productId)
        )
      )
      .limit(1);

    if (!cacheEntry) {
      console.log(`⚠️  [Deep Detect] No cache entry found for product ${productId}`);
      return {
        improved: false,
        originalConfidence: 50,
        newConfidence: 50,
        additionalInsights: [],
        serpAnalysisComplete: false,
      };
    }

    const originalConfidence = cacheEntry.confidenceScore || 50;
    const insights: string[] = [];

    const [seo] = await db
      .select()
      .from(seoMeta)
      .where(eq(seoMeta.productId, productId))
      .limit(1);

    let confidenceBoost = 0;

    if (seo) {
      if ((seo.seoScore || 0) < 50) {
        insights.push('SEO score below average - title and description improvements recommended');
        confidenceBoost += 10;
      }
      
      if (!seo.metaDescription || seo.metaDescription.length < 100) {
        insights.push('Meta description too short or missing - reducing search visibility');
        confidenceBoost += 5;
      }
    }

    if (cacheEntry.viewToCartRate && parseFloat(cacheEntry.viewToCartRate) < 0.03) {
      insights.push('Very low view-to-cart rate suggests value proposition needs strengthening');
      confidenceBoost += 10;
    }

    const newConfidence = Math.min(95, originalConfidence + confidenceBoost);

    if (newConfidence > originalConfidence) {
      await db.update(detectionCache)
        .set({
          confidenceScore: newConfidence,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(detectionCache.userId, userId),
            eq(detectionCache.productId, productId)
          )
        );
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [Deep Detect] Completed in ${duration}ms - Confidence: ${originalConfidence} → ${newConfidence}`);

    return {
      improved: newConfidence > originalConfidence,
      originalConfidence,
      newConfidence,
      additionalInsights: insights,
      serpAnalysisComplete: false,
    };
  }

  async runSerpAnalysis(userId: string, productId: string): Promise<{ complete: boolean; competitorCount: number }> {
    console.log(`🌐 [Deep Detect] SERP analysis for product ${productId} (placeholder)`);
    
    return {
      complete: true,
      competitorCount: 0,
    };
  }

  async scheduleDeepDetect(userId: string, productId: string, delayMs: number = 5000): Promise<void> {
    console.log(`📅 [Deep Detect] Scheduling deep detection for ${productId} in ${delayMs}ms`);
    
    setTimeout(async () => {
      try {
        await this.deepDetect(userId, productId);
      } catch (error) {
        console.error(`❌ [Deep Detect] Failed for ${productId}:`, error);
      }
    }, delayMs);
  }
}

export const deepDetectionEngine = new DeepDetectionEngine();
