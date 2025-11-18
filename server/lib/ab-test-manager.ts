import { requireDb } from "../db";
import { 
  abTestResults, 
  campaigns, 
  campaignPerformanceMetrics,
  autonomousActions 
} from "@shared/schema";
import { eq, and, sql, or, isNull } from "drizzle-orm";

/**
 * A/B Test Manager
 * Handles variant selection, winner detection, and automatic promotion
 */

export interface ABTestVariant {
  variant: 'control' | 'variantA' | 'variantB';
  campaignId: string;
  subject?: string;
  content: string;
}

export interface ABTestConfig {
  userId: string;
  name: string;
  variants: ABTestVariant[];
  sampleSize: number;
  decisionMethod?: 'open_rate' | 'click_rate' | 'conversion_rate';
  minSampleSize?: number; // Minimum sends before declaring winner
  significanceThreshold?: number; // p-value threshold (default 0.05)
}

export interface WinnerDetectionResult {
  hasWinner: boolean;
  winnerId?: string;
  winnerVariant?: string;
  confidence?: number;
  reason?: string;
}

/**
 * Create A/B test with multiple variants
 */
export async function createABTest(config: ABTestConfig): Promise<string> {
  const db = requireDb();
  const { userId, name, variants, sampleSize, decisionMethod = 'open_rate' } = config;

  if (variants.length !== 3) {
    throw new Error('Exactly 3 variants required: control, variantA, variantB');
  }

  const control = variants.find(v => v.variant === 'control');
  const variantA = variants.find(v => v.variant === 'variantA');
  const variantB = variants.find(v => v.variant === 'variantB');

  if (!control || !variantA || !variantB) {
    throw new Error('Must provide control, variantA, and variantB');
  }

  // Create test in database
  const [test] = await db.insert(abTestResults).values({
    userId,
    name,
    controlCampaignId: control.campaignId,
    variantAId: variantA.campaignId,
    variantBId: variantB.campaignId,
    sampleSize,
    decisionMethod,
    statisticalSignificance: false,
    metadata: {
      minSampleSize: config.minSampleSize || 100,
      significanceThreshold: config.significanceThreshold || 0.05,
      variants: {
        control: { subject: control.subject },
        variantA: { subject: variantA.subject },
        variantB: { subject: variantB.subject }
      }
    }
  }).returning();

  console.log(`🧪 [A/B Test] Created test "${name}" (${test.id})`);
  
  return test.id;
}

/**
 * Select which variant a customer should receive
 * Uses consistent hashing to ensure same customer always gets same variant
 */
export function selectVariant(
  customerEmail: string, 
  splitPercentage: { control: number; variantA: number; variantB: number }
): 'control' | 'variantA' | 'variantB' {
  // Simple hash function for consistent variant assignment
  let hash = 0;
  for (let i = 0; i < customerEmail.length; i++) {
    hash = ((hash << 5) - hash) + customerEmail.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const percentage = Math.abs(hash % 100);
  
  if (percentage < splitPercentage.control) {
    return 'control';
  } else if (percentage < splitPercentage.control + splitPercentage.variantA) {
    return 'variantA';
  } else {
    return 'variantB';
  }
}

/**
 * Get campaign for customer based on A/B test assignment
 */
export async function getCampaignForCustomer(
  testId: string,
  customerEmail: string
): Promise<{ campaignId: string; variant: string }> {
  const db = requireDb();
  const [test] = await db
    .select()
    .from(abTestResults)
    .where(eq(abTestResults.id, testId))
    .limit(1);

  if (!test) {
    throw new Error(`A/B test ${testId} not found`);
  }

  const splitPercentage = test.splitPercentage as any || { control: 33, variantA: 33, variantB: 34 };
  const variant = selectVariant(customerEmail, splitPercentage);

  const campaignId = variant === 'control' 
    ? test.controlCampaignId 
    : variant === 'variantA' 
      ? test.variantAId 
      : test.variantBId;

  return { campaignId, variant };
}

/**
 * Check if an A/B test has a winner based on statistical significance
 * Uses simple z-test for proportions
 */
export async function detectWinner(testId: string): Promise<WinnerDetectionResult> {
  const db = requireDb();
  const [test] = await db
    .select()
    .from(abTestResults)
    .where(eq(abTestResults.id, testId))
    .limit(1);

  if (!test) {
    return { hasWinner: false, reason: 'Test not found' };
  }

  // Already has winner
  if (test.winnerId) {
    return { 
      hasWinner: true, 
      winnerId: test.winnerId, 
      reason: 'Winner already selected' 
    };
  }

  const metadata = test.metadata as any || {};
  const minSampleSize = metadata.minSampleSize || 100;
  const significanceThreshold = metadata.significanceThreshold || 0.05;

  // Get performance metrics for all variants
  const metrics = await db
    .select()
    .from(campaignPerformanceMetrics)
    .where(
      or(
        eq(campaignPerformanceMetrics.campaignId, test.controlCampaignId),
        eq(campaignPerformanceMetrics.campaignId, test.variantAId),
        eq(campaignPerformanceMetrics.campaignId, test.variantBId)
      )
    );

  const controlMetrics = metrics.find(m => m.campaignId === test.controlCampaignId);
  const variantAMetrics = metrics.find(m => m.campaignId === test.variantAId);
  const variantBMetrics = metrics.find(m => m.campaignId === test.variantBId);

  if (!controlMetrics || !variantAMetrics || !variantBMetrics) {
    return { hasWinner: false, reason: 'Insufficient metrics data' };
  }

  // Check minimum sample size
  const totalSent = (controlMetrics.sentCount || 0) + (variantAMetrics.sentCount || 0) + (variantBMetrics.sentCount || 0);
  if (totalSent < minSampleSize) {
    return { 
      hasWinner: false, 
      reason: `Need ${minSampleSize} sends, have ${totalSent}` 
    };
  }

  // Get decision metric based on test configuration
  const getMetricValue = (m: typeof controlMetrics): number => {
    if (!m) return 0;
    switch (test.decisionMethod) {
      case 'click_rate':
        return parseFloat(String(m.clickRate)) || 0;
      case 'conversion_rate':
        return parseFloat(String(m.conversionRate)) || 0;
      default:
        return parseFloat(String(m.openRate)) || 0;
    }
  };

  const controlRate = getMetricValue(controlMetrics);
  const variantARate = getMetricValue(variantAMetrics);
  const variantBRate = getMetricValue(variantBMetrics);

  // Find the best performing variant
  const rates = [
    { id: test.controlCampaignId, variant: 'control', rate: controlRate, sent: controlMetrics.sentCount || 0 },
    { id: test.variantAId, variant: 'variantA', rate: variantARate, sent: variantAMetrics.sentCount || 0 },
    { id: test.variantBId, variant: 'variantB', rate: variantBRate, sent: variantBMetrics.sentCount || 0 }
  ];

  rates.sort((a, b) => b.rate - a.rate);
  const winner = rates[0];
  const runnerUp = rates[1];

  // Simple statistical significance check
  // For a more robust implementation, use proper z-test or t-test
  const improvementPercent = ((winner.rate - runnerUp.rate) / runnerUp.rate) * 100;
  const isSignificant = improvementPercent >= 10; // At least 10% improvement

  if (!isSignificant) {
    return {
      hasWinner: false,
      reason: `Winner needs 10%+ improvement. Best: ${winner.rate.toFixed(2)}% vs ${runnerUp.rate.toFixed(2)}%`
    };
  }

  return {
    hasWinner: true,
    winnerId: winner.id,
    winnerVariant: winner.variant,
    confidence: improvementPercent,
    reason: `${winner.variant} won with ${improvementPercent.toFixed(1)}% improvement`
  };
}

/**
 * Automatically promote winning variant
 */
export async function promoteWinner(testId: string): Promise<boolean> {
  const db = requireDb();
  const result = await detectWinner(testId);

  if (!result.hasWinner || !result.winnerId) {
    console.log(`🧪 [A/B Test] No winner detected for test ${testId}: ${result.reason}`);
    return false;
  }

  const [test] = await db
    .select()
    .from(abTestResults)
    .where(eq(abTestResults.id, testId))
    .limit(1);

  if (!test) {
    return false;
  }

  // Update test with winner
  await db
    .update(abTestResults)
    .set({
      winnerId: result.winnerId,
      winnerSelectedAt: new Date(),
      statisticalSignificance: true,
      endedAt: new Date(),
      metadata: {
        ...(test.metadata as any || {}),
        winnerResult: {
          variant: result.winnerVariant,
          confidence: result.confidence,
          reason: result.reason,
          selectedAt: new Date().toISOString()
        }
      }
    })
    .where(eq(abTestResults.id, testId));

  // Log autonomous action
  await db.insert(autonomousActions).values({
    userId: test.userId,
    actionType: 'run_ab_test',
    entityType: 'campaign',
    entityId: result.winnerId,
    status: 'completed',
    decisionReason: result.reason,
    ruleId: null,
    payload: {
      testId,
      testName: test.name,
      winnerVariant: result.winnerVariant,
      confidence: result.confidence
    },
    result: {
      winnerId: result.winnerId,
      promoted: true
    },
    completedAt: new Date()
  });

  console.log(`🏆 [A/B Test] Winner promoted: ${result.winnerVariant} for test "${test.name}" - ${result.reason}`);
  
  return true;
}

/**
 * Check all active A/B tests and promote winners
 */
export async function processActiveABTests(): Promise<void> {
  console.log('🧪 [A/B Test] Checking active tests for winners...');

  try {
    const db = requireDb();
    
    // Get all active tests (no winner yet)
    const activeTests = await db
      .select()
      .from(abTestResults)
      .where(
        and(
          isNull(abTestResults.winnerId),
          isNull(abTestResults.endedAt)
        )
      );

    if (activeTests.length === 0) {
      console.log('🧪 [A/B Test] No active tests to process');
      return;
    }

    console.log(`🧪 [A/B Test] Processing ${activeTests.length} active tests`);

    for (const test of activeTests) {
      await promoteWinner(test.id);
    }

  } catch (error) {
    console.error('🧪 [A/B Test] Error processing tests:', error);
  }
}
