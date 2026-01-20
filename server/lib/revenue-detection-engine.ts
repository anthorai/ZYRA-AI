import { requireDb } from '../db';
import { 
  products, 
  seoMeta, 
  revenueSignals, 
  automationSettings,
  contentPerformance
} from '@shared/schema';
import { eq, and, lt, sql, desc, gt, gte } from 'drizzle-orm';

export interface DetectionResult {
  signalsDetected: number;
  signals: Array<{
    type: string;
    entityId: string;
    estimatedRevenueDelta: number;
    confidenceScore: number;
  }>;
}

const SIGNAL_THRESHOLDS = {
  POOR_SEO_SCORE: 60,
  MIN_VIEWS_FOR_CONVERSION_ANALYSIS: 10,
  LOW_CONVERSION_THRESHOLD: 0.02,
  REVENUE_DROP_THRESHOLD: 0.15,
};

export class RevenueDetectionEngine {
  async detectSignals(userId: string): Promise<DetectionResult> {
    console.log(`🔍 [Revenue Detection] Starting signal detection for user ${userId}`);
    const db = requireDb();
    
    const settings = await this.getUserSettings(userId);
    if (!settings || !settings.globalAutopilotEnabled) {
      console.log(`⏸️  [Revenue Detection] Autopilot disabled for user ${userId}`);
      return { signalsDetected: 0, signals: [] };
    }

    const signals: DetectionResult['signals'] = [];

    const [poorSeoSignals, highTrafficLowConversionSignals] = await Promise.all([
      this.detectPoorSeoProducts(userId),
      this.detectHighTrafficLowConversion(userId),
    ]);

    signals.push(...poorSeoSignals, ...highTrafficLowConversionSignals);

    for (const signal of signals) {
      await this.persistSignal(userId, signal);
    }

    console.log(`✅ [Revenue Detection] Detected ${signals.length} signals for user ${userId}`);
    return {
      signalsDetected: signals.length,
      signals,
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

  private async detectPoorSeoProducts(userId: string): Promise<DetectionResult['signals']> {
    const db = requireDb();
    const signals: DetectionResult['signals'] = [];

    const userProducts = await db
      .select({
        product: products,
        seo: seoMeta,
      })
      .from(products)
      .leftJoin(seoMeta, eq(seoMeta.productId, products.id))
      .where(eq(products.userId, userId));

    for (const { product, seo } of userProducts) {
      const seoScore = seo?.seoScore ?? 0;
      
      if (seoScore < SIGNAL_THRESHOLDS.POOR_SEO_SCORE) {
        const productPrice = parseFloat(product.price?.toString() || '0');
        const estimatedLift = 0.05;
        const estimatedRevenueDelta = productPrice * estimatedLift * 30;
        
        signals.push({
          type: 'poor_seo_score',
          entityId: product.id,
          estimatedRevenueDelta,
          confidenceScore: Math.max(20, 80 - seoScore),
        });
      }
    }

    return signals;
  }

  private async detectHighTrafficLowConversion(userId: string): Promise<DetectionResult['signals']> {
    const db = requireDb();
    const signals: DetectionResult['signals'] = [];

    const performanceData = await db
      .select({
        productId: contentPerformance.productId,
        views: contentPerformance.views,
        conversions: contentPerformance.conversions,
        clickThroughRate: contentPerformance.clickThroughRate,
        product: products,
      })
      .from(contentPerformance)
      .innerJoin(products, eq(products.id, contentPerformance.productId))
      .where(
        and(
          eq(contentPerformance.userId, userId),
          gte(contentPerformance.views, SIGNAL_THRESHOLDS.MIN_VIEWS_FOR_CONVERSION_ANALYSIS)
        )
      );

    for (const data of performanceData) {
      if (!data.productId || !data.product) continue;
      
      const views = data.views ?? 0;
      const conversions = data.conversions ?? 0;
      const conversionRate = views > 0 ? conversions / views : 0;

      if (conversionRate < SIGNAL_THRESHOLDS.LOW_CONVERSION_THRESHOLD && views >= SIGNAL_THRESHOLDS.MIN_VIEWS_FOR_CONVERSION_ANALYSIS) {
        const productPrice = parseFloat(data.product.price?.toString() || '0');
        const potentialConversions = views * 0.03;
        const estimatedRevenueDelta = (potentialConversions - conversions) * productPrice;

        if (estimatedRevenueDelta > 10) {
          signals.push({
            type: 'high_traffic_low_conversion',
            entityId: data.productId,
            estimatedRevenueDelta,
            confidenceScore: Math.min(90, 50 + (views / 10)),
          });
        }
      }
    }

    return signals;
  }

  private async persistSignal(
    userId: string, 
    signal: DetectionResult['signals'][0]
  ): Promise<void> {
    const db = requireDb();
    const existingSignal = await db
      .select()
      .from(revenueSignals)
      .where(
        and(
          eq(revenueSignals.userId, userId),
          eq(revenueSignals.entityId, signal.entityId),
          eq(revenueSignals.signalType, signal.type as any),
          sql`${revenueSignals.status} IN ('detected', 'queued')`
        )
      )
      .limit(1);

    if (existingSignal.length > 0) {
      console.log(`⏭️  [Revenue Detection] Signal already exists for entity ${signal.entityId}`);
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(revenueSignals).values({
      userId,
      signalType: signal.type as any,
      entityType: 'product',
      entityId: signal.entityId,
      signalData: {
        type: signal.type,
        detectionMethod: 'automated_scan',
      },
      estimatedRevenueDelta: signal.estimatedRevenueDelta.toFixed(2),
      confidenceScore: signal.confidenceScore,
      status: 'detected',
      expiresAt,
    });

    console.log(`📝 [Revenue Detection] Created signal: ${signal.type} for entity ${signal.entityId}`);
  }

  async getActiveSignals(userId: string, limit: number = 10) {
    const db = requireDb();
    return db
      .select()
      .from(revenueSignals)
      .where(
        and(
          eq(revenueSignals.userId, userId),
          sql`${revenueSignals.status} IN ('detected', 'queued')`,
          sql`${revenueSignals.expiresAt} > NOW() OR ${revenueSignals.expiresAt} IS NULL`
        )
      )
      .orderBy(desc(revenueSignals.priorityScore))
      .limit(limit);
  }
}

export const revenueDetectionEngine = new RevenueDetectionEngine();
