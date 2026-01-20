import { requireDb } from '../db';
import { 
  revenueSignals, 
  revenueOpportunities, 
  storeLearningInsights,
  products,
  seoMeta
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

interface PriorityFactors {
  revenueImpact: number;
  confidence: number;
  safety: number;
  historicalSuccess: number;
  urgency: number;
}

interface PriorityResult {
  score: number;
  factors: PriorityFactors;
  opportunityType: string;
  actionPlan: any;
}

const PRIORITY_WEIGHTS = {
  REVENUE_IMPACT: 0.35,
  CONFIDENCE: 0.25,
  SAFETY: 0.20,
  HISTORICAL_SUCCESS: 0.10,
  URGENCY: 0.10,
};

export class RevenuePriorityService {
  async prioritizeSignal(signalId: string): Promise<PriorityResult | null> {
    const db = requireDb();
    const [signal] = await db
      .select()
      .from(revenueSignals)
      .where(eq(revenueSignals.id, signalId))
      .limit(1);

    if (!signal) {
      console.log(`⚠️  [Priority Service] Signal ${signalId} not found`);
      return null;
    }

    console.log(`📊 [Priority Service] Calculating priority for signal ${signalId}`);

    const factors = await this.calculateFactors(signal);
    const score = this.calculateWeightedScore(factors);
    const { opportunityType, actionPlan } = await this.generateActionPlan(signal);

    const dbRef = requireDb();
    await dbRef
      .update(revenueSignals)
      .set({
        priorityScore: Math.round(score),
        priorityFactors: factors as any,
        updatedAt: new Date(),
      })
      .where(eq(revenueSignals.id, signalId));

    console.log(`✅ [Priority Service] Signal ${signalId} scored ${Math.round(score)}/100`);

    return {
      score,
      factors,
      opportunityType,
      actionPlan,
    };
  }

  private async calculateFactors(signal: typeof revenueSignals.$inferSelect): Promise<PriorityFactors> {
    const revenueImpact = this.calculateRevenueImpactScore(signal);
    const confidence = signal.confidenceScore || 50;
    const safety = await this.calculateSafetyScore(signal);
    const historicalSuccess = await this.getHistoricalSuccessRate(signal.userId, signal.signalType);
    const urgency = this.calculateUrgencyScore(signal);

    return {
      revenueImpact,
      confidence,
      safety,
      historicalSuccess,
      urgency,
    };
  }

  private calculateRevenueImpactScore(signal: typeof revenueSignals.$inferSelect): number {
    const estimatedDelta = parseFloat(signal.estimatedRevenueDelta?.toString() || '0');
    
    if (estimatedDelta >= 1000) return 100;
    if (estimatedDelta >= 500) return 80;
    if (estimatedDelta >= 200) return 60;
    if (estimatedDelta >= 100) return 40;
    if (estimatedDelta >= 50) return 20;
    return 10;
  }

  private async calculateSafetyScore(signal: typeof revenueSignals.$inferSelect): Promise<number> {
    const signalType = signal.signalType;
    
    const safetySores: Record<string, number> = {
      'poor_seo_score': 90,
      'high_traffic_low_conversion': 85,
      'competitor_opportunity': 80,
      'seasonal_trend': 75,
      'price_optimization': 50,
      'revenue_drop': 60,
      'abandoned_cart_pattern': 95,
      'inventory_alert': 70,
    };

    return safetySores[signalType] || 70;
  }

  private async getHistoricalSuccessRate(userId: string, signalType: string): Promise<number> {
    const db = requireDb();
    const [insight] = await db
      .select()
      .from(storeLearningInsights)
      .where(
        and(
          eq(storeLearningInsights.userId, userId),
          sql`${storeLearningInsights.patternData}->>'signalType' = ${signalType}`,
          eq(storeLearningInsights.isActive, true)
        )
      )
      .limit(1);

    if (insight && insight.successRate) {
      return Math.min(100, parseFloat(insight.successRate.toString()));
    }

    return 60;
  }

  private calculateUrgencyScore(signal: typeof revenueSignals.$inferSelect): number {
    if (!signal.expiresAt) return 50;

    const now = new Date();
    const expires = new Date(signal.expiresAt);
    const hoursRemaining = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursRemaining <= 24) return 100;
    if (hoursRemaining <= 48) return 80;
    if (hoursRemaining <= 72) return 60;
    if (hoursRemaining <= 168) return 40;
    return 20;
  }

  private calculateWeightedScore(factors: PriorityFactors): number {
    return (
      factors.revenueImpact * PRIORITY_WEIGHTS.REVENUE_IMPACT +
      factors.confidence * PRIORITY_WEIGHTS.CONFIDENCE +
      factors.safety * PRIORITY_WEIGHTS.SAFETY +
      factors.historicalSuccess * PRIORITY_WEIGHTS.HISTORICAL_SUCCESS +
      factors.urgency * PRIORITY_WEIGHTS.URGENCY
    );
  }

  private async generateActionPlan(signal: typeof revenueSignals.$inferSelect) {
    switch (signal.signalType) {
      case 'poor_seo_score':
        return {
          opportunityType: 'seo_optimization',
          actionPlan: {
            action: 'optimize_seo',
            target: 'product',
            targetId: signal.entityId,
            changes: ['title', 'meta_description', 'keywords'],
          },
        };
      
      case 'high_traffic_low_conversion':
        return {
          opportunityType: 'description_enhancement',
          actionPlan: {
            action: 'enhance_description',
            target: 'product',
            targetId: signal.entityId,
            changes: ['description', 'features', 'cta'],
          },
        };
      
      default:
        return {
          opportunityType: 'general_optimization',
          actionPlan: {
            action: 'review_and_optimize',
            target: signal.entityType,
            targetId: signal.entityId,
          },
        };
    }
  }

  async createOpportunityFromSignal(signalId: string): Promise<string | null> {
    const db = requireDb();
    const priority = await this.prioritizeSignal(signalId);
    if (!priority) return null;

    const [signal] = await db
      .select()
      .from(revenueSignals)
      .where(eq(revenueSignals.id, signalId))
      .limit(1);

    if (!signal) return null;

    let originalContent = {};
    if (signal.entityType === 'product' && signal.entityId) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, signal.entityId))
        .limit(1);

      const [seo] = await db
        .select()
        .from(seoMeta)
        .where(eq(seoMeta.productId, signal.entityId))
        .limit(1);

      if (product) {
        originalContent = {
          name: product.name,
          description: product.description,
          seoTitle: seo?.seoTitle,
          metaDescription: seo?.metaDescription,
        };
      }
    }

    const [opportunity] = await db
      .insert(revenueOpportunities)
      .values({
        userId: signal.userId,
        signalId: signal.id,
        opportunityType: priority.opportunityType,
        entityType: signal.entityType,
        entityId: signal.entityId,
        actionPlan: priority.actionPlan,
        originalContent,
        estimatedRevenueLift: signal.estimatedRevenueDelta,
        confidenceLevel: priority.factors.confidence >= 70 ? 'high' : priority.factors.confidence >= 40 ? 'medium' : 'low',
        safetyScore: Math.round(priority.factors.safety),
        rollbackData: originalContent,
        status: 'pending',
      })
      .returning();

    await db
      .update(revenueSignals)
      .set({
        status: 'queued',
        updatedAt: new Date(),
      })
      .where(eq(revenueSignals.id, signalId));

    console.log(`✅ [Priority Service] Created opportunity ${opportunity.id} from signal ${signalId}`);

    return opportunity.id;
  }

  async getPendingOpportunities(userId: string, limit: number = 10) {
    const db = requireDb();
    return db
      .select()
      .from(revenueOpportunities)
      .where(
        and(
          eq(revenueOpportunities.userId, userId),
          eq(revenueOpportunities.status, 'pending')
        )
      )
      .orderBy(desc(revenueOpportunities.estimatedRevenueLift))
      .limit(limit);
  }
}

export const revenuePriorityService = new RevenuePriorityService();
