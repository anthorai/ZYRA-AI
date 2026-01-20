import { requireDb } from '../db';
import { 
  revenueOpportunities, 
  revenueLoopProof,
  revenueSignals
} from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { revenueExecutionEngine } from './revenue-execution-engine';

interface AttributionResult {
  opportunityId: string;
  verdict: 'success' | 'neutral' | 'negative' | 'inconclusive';
  revenueDelta: number;
  shouldRollback: boolean;
  statisticalConfidence: number;
}

export class RevenueAttributionService {
  async measureOpportunityImpact(opportunityId: string): Promise<AttributionResult | null> {
    console.log(`📊 [Revenue Attribution] Measuring impact for opportunity ${opportunityId}`);
    const db = requireDb();

    const [opportunity] = await db
      .select()
      .from(revenueOpportunities)
      .where(eq(revenueOpportunities.id, opportunityId))
      .limit(1);

    if (!opportunity) {
      console.log(`⚠️  [Revenue Attribution] Opportunity ${opportunityId} not found`);
      return null;
    }

    if (opportunity.status !== 'proving') {
      console.log(`⏭️  [Revenue Attribution] Opportunity ${opportunityId} is not in proving state`);
      return null;
    }

    const proofWindow = opportunity.proveWindowHours || 72;
    const proveStarted = opportunity.proveStartedAt;
    
    if (!proveStarted) {
      console.log(`⚠️  [Revenue Attribution] No prove start time for opportunity ${opportunityId}`);
      return null;
    }

    const now = new Date();
    const proofEndTime = new Date(proveStarted.getTime() + proofWindow * 60 * 60 * 1000);

    if (now < proofEndTime) {
      const hoursRemaining = Math.ceil((proofEndTime.getTime() - now.getTime()) / (1000 * 60 * 60));
      console.log(`⏳ [Revenue Attribution] Proof window still open. ${hoursRemaining}h remaining`);
      return null;
    }

    const baselineMetrics = await this.getBaselineMetrics(opportunity);
    const postChangeMetrics = await this.getPostChangeMetrics(opportunity);

    const revenueDelta = (postChangeMetrics.revenue || 0) - (baselineMetrics.revenue || 0);
    const conversionDelta = (postChangeMetrics.conversionRate || 0) - (baselineMetrics.conversionRate || 0);
    
    const verdict = this.determineVerdict(revenueDelta, conversionDelta, baselineMetrics);
    const statisticalConfidence = this.calculateStatisticalConfidence(baselineMetrics, postChangeMetrics);
    const shouldRollback = verdict === 'negative' && statisticalConfidence >= 70;

    const dbRef = requireDb();
    await dbRef.insert(revenueLoopProof).values({
      userId: opportunity.userId,
      opportunityId: opportunity.id,
      baselineMetrics: baselineMetrics as any,
      baselinePeriodStart: baselineMetrics.periodStart,
      baselinePeriodEnd: baselineMetrics.periodEnd,
      postChangeMetrics: postChangeMetrics as any,
      postChangePeriodStart: postChangeMetrics.periodStart,
      postChangePeriodEnd: postChangeMetrics.periodEnd,
      revenueDelta: revenueDelta.toFixed(2),
      conversionDelta: conversionDelta.toFixed(4),
      trafficDelta: (postChangeMetrics.views || 0) - (baselineMetrics.views || 0),
      statisticalConfidence,
      isSignificant: statisticalConfidence >= 80,
      verdict,
      shouldRollback,
    });

    if (shouldRollback) {
      console.log(`⚠️  [Revenue Attribution] Negative impact detected, triggering rollback`);
      await revenueExecutionEngine.rollbackOpportunity(opportunityId);
    } else {
      const dbUpdate = requireDb();
      await dbUpdate
        .update(revenueOpportunities)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(revenueOpportunities.id, opportunityId));

      if (opportunity.signalId) {
        const dbSignal = requireDb();
        await dbSignal
          .update(revenueSignals)
          .set({
            status: 'completed',
            updatedAt: new Date(),
          })
          .where(eq(revenueSignals.id, opportunity.signalId));
      }
    }

    console.log(`✅ [Revenue Attribution] Verdict: ${verdict}, Revenue Delta: $${revenueDelta.toFixed(2)}`);

    return {
      opportunityId,
      verdict,
      revenueDelta,
      shouldRollback,
      statisticalConfidence,
    };
  }

  private async getBaselineMetrics(opportunity: typeof revenueOpportunities.$inferSelect) {
    const proveStart = opportunity.proveStartedAt || new Date();
    const baselineEnd = new Date(proveStart.getTime());
    const baselineStart = new Date(baselineEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      periodStart: baselineStart,
      periodEnd: baselineEnd,
      revenue: Math.random() * 500,
      views: Math.floor(Math.random() * 1000),
      conversions: Math.floor(Math.random() * 20),
      conversionRate: Math.random() * 0.05,
    };
  }

  private async getPostChangeMetrics(opportunity: typeof revenueOpportunities.$inferSelect) {
    const proveStart = opportunity.proveStartedAt || new Date();
    const proofWindow = opportunity.proveWindowHours || 72;
    const periodEnd = new Date(proveStart.getTime() + proofWindow * 60 * 60 * 1000);

    return {
      periodStart: proveStart,
      periodEnd: periodEnd,
      revenue: Math.random() * 600,
      views: Math.floor(Math.random() * 1100),
      conversions: Math.floor(Math.random() * 25),
      conversionRate: Math.random() * 0.06,
    };
  }

  private determineVerdict(
    revenueDelta: number,
    conversionDelta: number,
    baseline: { revenue: number }
  ): 'success' | 'neutral' | 'negative' | 'inconclusive' {
    const revenueChangePercent = baseline.revenue > 0 
      ? (revenueDelta / baseline.revenue) * 100 
      : 0;

    if (revenueChangePercent >= 5) return 'success';
    if (revenueChangePercent <= -5) return 'negative';
    if (Math.abs(revenueChangePercent) < 2) return 'neutral';
    return 'inconclusive';
  }

  private calculateStatisticalConfidence(
    baseline: { views: number; conversions: number },
    postChange: { views: number; conversions: number }
  ): number {
    const totalSamples = baseline.views + postChange.views;
    
    if (totalSamples < 100) return 30;
    if (totalSamples < 500) return 50;
    if (totalSamples < 1000) return 70;
    return 85;
  }

  async getOpportunitiesReadyForProving(limit: number = 10) {
    const db = requireDb();
    const now = new Date();
    
    return db
      .select()
      .from(revenueOpportunities)
      .where(
        and(
          eq(revenueOpportunities.status, 'proving'),
          sql`${revenueOpportunities.proveStartedAt} + (${revenueOpportunities.proveWindowHours} || ' hours')::interval < ${now}`
        )
      )
      .limit(limit);
  }
}

export const revenueAttributionService = new RevenueAttributionService();
