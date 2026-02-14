import { requireDb } from '../db';
import { 
  storeLearningInsights, 
  revenueLoopProof, 
  revenueOpportunities,
  revenueSignals,
  optimizationChanges,
  baselineSnapshots
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

interface LearningResult {
  insightsCreated: number;
  insightsUpdated: number;
  patternsIdentified: string[];
}

interface PatternData {
  signalType: string;
  opportunityType: string;
  category?: string;
  successIndicators: string[];
}

export class StoreLearningService {
  async learnFromAttribution(proofId: string): Promise<LearningResult | null> {
    console.log(`🧠 [Store Learning] Learning from proof ${proofId}`);
    const db = requireDb();

    const [proof] = await db
      .select()
      .from(revenueLoopProof)
      .where(eq(revenueLoopProof.id, proofId))
      .limit(1);

    if (!proof) {
      console.log(`⚠️  [Store Learning] Proof ${proofId} not found`);
      return null;
    }

    const [opportunity] = await db
      .select()
      .from(revenueOpportunities)
      .where(eq(revenueOpportunities.id, proof.opportunityId))
      .limit(1);

    if (!opportunity) {
      return null;
    }

    let signal = null;
    if (opportunity.signalId) {
      [signal] = await db
        .select()
        .from(revenueSignals)
        .where(eq(revenueSignals.id, opportunity.signalId))
        .limit(1);
    }

    const result: LearningResult = {
      insightsCreated: 0,
      insightsUpdated: 0,
      patternsIdentified: [],
    };

    const patternData: PatternData = {
      signalType: signal?.signalType || 'unknown',
      opportunityType: opportunity.opportunityType,
      category: 'global',
      successIndicators: [],
    };

    const isSuccess = proof.verdict === 'success';
    const insightType = isSuccess ? 'effective_pattern' : 'ineffective_pattern';
    const revenueLift = parseFloat(proof.revenueDelta?.toString() || '0');

    const existingInsight = await this.findSimilarInsight(
      proof.userId,
      insightType,
      patternData.signalType,
      patternData.opportunityType
    );

    if (existingInsight) {
      const dbUpdate = requireDb();
      const newExamplesCount = (existingInsight.examplesCount || 0) + 1;
      const currentAvgLift = parseFloat(existingInsight.averageRevenueLift?.toString() || '0');
      const newAvgLift = ((currentAvgLift * (newExamplesCount - 1)) + revenueLift) / newExamplesCount;
      
      const currentSuccessRate = parseFloat(existingInsight.successRate?.toString() || '50');
      const successContribution = isSuccess ? 100 : 0;
      const newSuccessRate = ((currentSuccessRate * (newExamplesCount - 1)) + successContribution) / newExamplesCount;

      const newConfidence = Math.min(100, 50 + (newExamplesCount * 5));

      await dbUpdate
        .update(storeLearningInsights)
        .set({
          examplesCount: newExamplesCount,
          averageRevenueLift: newAvgLift.toFixed(2),
          successRate: newSuccessRate.toFixed(2),
          confidenceScore: newConfidence,
          timesApplied: (existingInsight.timesApplied || 0) + 1,
          lastValidatedAt: new Date(),
          lastAppliedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(storeLearningInsights.id, existingInsight.id));

      result.insightsUpdated++;
      result.patternsIdentified.push(`Updated: ${patternData.signalType} -> ${patternData.opportunityType}`);
      
      console.log(`📈 [Store Learning] Updated insight ${existingInsight.id}, confidence: ${newConfidence}%`);
    } else {
      const dbInsert = requireDb();
      await dbInsert.insert(storeLearningInsights).values({
        userId: proof.userId,
        insightType,
        category: patternData.category,
        patternData: patternData as any,
        examplesCount: 1,
        averageRevenueLift: revenueLift.toFixed(2),
        successRate: isSuccess ? '100.00' : '0.00',
        confidenceScore: 55,
        lastValidatedAt: new Date(),
        timesApplied: 1,
        lastAppliedAt: new Date(),
        isActive: true,
      });

      result.insightsCreated++;
      result.patternsIdentified.push(`Created: ${patternData.signalType} -> ${patternData.opportunityType}`);
      
      console.log(`🆕 [Store Learning] Created new ${insightType} insight`);
    }

    console.log(`✅ [Store Learning] Learning complete: ${result.insightsCreated} created, ${result.insightsUpdated} updated`);

    return result;
  }

  private async findSimilarInsight(
    userId: string,
    insightType: string,
    signalType: string,
    opportunityType: string
  ) {
    const db = requireDb();
    const [insight] = await db
      .select()
      .from(storeLearningInsights)
      .where(
        and(
          eq(storeLearningInsights.userId, userId),
          eq(storeLearningInsights.insightType, insightType),
          eq(storeLearningInsights.isActive, true),
          sql`${storeLearningInsights.patternData}->>'signalType' = ${signalType}`,
          sql`${storeLearningInsights.patternData}->>'opportunityType' = ${opportunityType}`
        )
      )
      .limit(1);

    return insight;
  }

  async getEffectivePatterns(userId: string, category?: string) {
    const db = requireDb();
    const conditions = [
      eq(storeLearningInsights.userId, userId),
      eq(storeLearningInsights.insightType, 'effective_pattern'),
      eq(storeLearningInsights.isActive, true),
      sql`${storeLearningInsights.confidenceScore} >= 60`,
    ];

    if (category) {
      conditions.push(eq(storeLearningInsights.category, category));
    }

    return db
      .select()
      .from(storeLearningInsights)
      .where(and(...conditions))
      .orderBy(desc(storeLearningInsights.successRate));
  }

  async getIneffectivePatterns(userId: string, category?: string) {
    const db = requireDb();
    const conditions = [
      eq(storeLearningInsights.userId, userId),
      eq(storeLearningInsights.insightType, 'ineffective_pattern'),
      eq(storeLearningInsights.isActive, true),
      sql`${storeLearningInsights.confidenceScore} >= 60`,
    ];

    if (category) {
      conditions.push(eq(storeLearningInsights.category, category));
    }

    return db
      .select()
      .from(storeLearningInsights)
      .where(and(...conditions))
      .orderBy(desc(storeLearningInsights.confidenceScore));
  }

  async shouldAvoidPattern(
    userId: string,
    signalType: string,
    opportunityType: string
  ): Promise<boolean> {
    const db = requireDb();
    const [ineffectivePattern] = await db
      .select()
      .from(storeLearningInsights)
      .where(
        and(
          eq(storeLearningInsights.userId, userId),
          eq(storeLearningInsights.insightType, 'ineffective_pattern'),
          eq(storeLearningInsights.isActive, true),
          sql`${storeLearningInsights.confidenceScore} >= 80`,
          sql`${storeLearningInsights.patternData}->>'signalType' = ${signalType}`,
          sql`${storeLearningInsights.patternData}->>'opportunityType' = ${opportunityType}`
        )
      )
      .limit(1);

    return !!ineffectivePattern;
  }

  async getStoreLearningStats(userId: string) {
    const db = requireDb();
    const allInsights = await db
      .select()
      .from(storeLearningInsights)
      .where(
        and(
          eq(storeLearningInsights.userId, userId),
          eq(storeLearningInsights.isActive, true)
        )
      );

    const effectivePatterns = allInsights.filter(i => i.insightType === 'effective_pattern');
    const ineffectivePatterns = allInsights.filter(i => i.insightType === 'ineffective_pattern');

    const totalExamples = allInsights.reduce((sum, i) => sum + (i.examplesCount || 0), 0);
    const avgConfidence = allInsights.length > 0
      ? allInsights.reduce((sum, i) => sum + (i.confidenceScore || 0), 0) / allInsights.length
      : 0;

    return {
      totalInsights: allInsights.length,
      effectivePatterns: effectivePatterns.length,
      ineffectivePatterns: ineffectivePatterns.length,
      totalExamples,
      averageConfidence: Math.round(avgConfidence),
    };
  }

  async learnFromFoundationalExecution(
    userId: string,
    actionId: string,
    actionCategory: string,
    changeIds: string[]
  ): Promise<LearningResult> {
    console.log(`🧠 [Store Learning] Learning from foundational execution: ${actionId} (${changeIds.length} changes)`);
    const db = requireDb();

    const result: LearningResult = {
      insightsCreated: 0,
      insightsUpdated: 0,
      patternsIdentified: [],
    };

    if (changeIds.length === 0) return result;

    const changes = await db
      .select()
      .from(optimizationChanges)
      .where(
        and(
          eq(optimizationChanges.userId, userId),
          sql`${optimizationChanges.id} = ANY(${changeIds})`
        )
      );

    if (changes.length === 0) return result;

    const patternData: PatternData = {
      signalType: 'foundational_optimization',
      opportunityType: actionId,
      category: actionCategory,
      successIndicators: changes.map(c => c.changeField || 'unknown_field'),
    };

    const insightType = 'effective_pattern';

    const existingInsight = await this.findSimilarInsight(
      userId,
      insightType,
      patternData.signalType,
      patternData.opportunityType
    );

    if (existingInsight) {
      const newExamplesCount = (existingInsight.examplesCount || 0) + changes.length;
      const newConfidence = Math.min(100, 50 + (newExamplesCount * 3));

      await db
        .update(storeLearningInsights)
        .set({
          examplesCount: newExamplesCount,
          confidenceScore: newConfidence,
          timesApplied: (existingInsight.timesApplied || 0) + 1,
          lastValidatedAt: new Date(),
          lastAppliedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(storeLearningInsights.id, existingInsight.id));

      result.insightsUpdated++;
      result.patternsIdentified.push(`Updated: ${actionCategory} -> ${actionId} (${newExamplesCount} examples)`);
      console.log(`📈 [Store Learning] Updated foundational insight ${existingInsight.id}, confidence: ${newConfidence}%`);
    } else {
      await db.insert(storeLearningInsights).values({
        userId,
        insightType,
        category: actionCategory,
        patternData: patternData as any,
        examplesCount: changes.length,
        averageRevenueLift: '0.00',
        successRate: '100.00',
        confidenceScore: 55,
        lastValidatedAt: new Date(),
        timesApplied: 1,
        lastAppliedAt: new Date(),
        isActive: true,
      });

      result.insightsCreated++;
      result.patternsIdentified.push(`Created: ${actionCategory} -> ${actionId}`);
      console.log(`🆕 [Store Learning] Created new foundational insight for ${actionId}`);
    }

    console.log(`✅ [Store Learning] Foundational learning complete: ${result.insightsCreated} created, ${result.insightsUpdated} updated`);
    return result;
  }
}

export const storeLearningService = new StoreLearningService();
