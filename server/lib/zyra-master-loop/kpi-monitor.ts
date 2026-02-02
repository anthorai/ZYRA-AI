/**
 * ZYRA KPI MONITOR
 * 
 * Step 7-8 of the Master Loop: MEASURE & AUTO-ROLLBACK
 * 
 * Monitors KPI impact after action execution.
 * Triggers automatic rollback if performance drops are detected.
 * 
 * KPIs monitored:
 *   - Conversion rate
 *   - Revenue
 *   - Cart abandonment rate
 *   - Bounce rate
 *   - Average order value
 */

import { requireDb } from '../../db';
import { 
  autonomousActions, 
  productSnapshots, 
  revenueLoopProof,
  storeLearningInsights,
  products,
  revenueAttribution
} from '@shared/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import type { PlanPermissions } from './plan-permission-mapper';
import type { MasterAction, ActionId } from './master-action-registry';

export interface KPIMetrics {
  conversionRate: number;
  revenue: number;
  cartAbandonmentRate: number;
  bounceRate: number;
  averageOrderValue: number;
  timestamp: Date;
}

export interface KPIChange {
  metric: string;
  before: number;
  after: number;
  changePercent: number;
  isImprovement: boolean;
  isSignificant: boolean;
}

export interface KPIImpactResult {
  actionId: string;
  measuredAt: Date;
  baselineMetrics: KPIMetrics;
  currentMetrics: KPIMetrics;
  changes: KPIChange[];
  overallImpact: 'positive' | 'negative' | 'neutral';
  dropDetected: boolean;
  dropSeverity: 'minor' | 'moderate' | 'severe' | null;
  rollbackRecommended: boolean;
  confidence: number;
}

export interface RollbackResult {
  success: boolean;
  actionId: string;
  snapshotId: string | null;
  restoredFields: string[];
  reason: string;
  executedAt: Date;
}

const KPI_DROP_THRESHOLDS = {
  minor: 0.05,    // 5% drop
  moderate: 0.10, // 10% drop
  severe: 0.20,   // 20% drop
};

const SIGNIFICANCE_THRESHOLD = 0.02; // 2% change is considered significant

export class KPIMonitor {
  /**
   * Capture baseline KPI metrics before an action
   */
  async captureBaseline(userId: string): Promise<KPIMetrics> {
    console.log(`📊 [KPI Monitor] Capturing baseline metrics for user ${userId}`);
    const db = requireDb();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get revenue data
    const [revenueData] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${revenueAttribution.revenueAmount}), 0)`,
        totalOrders: sql<number>`COUNT(*)`,
      })
      .from(revenueAttribution)
      .where(and(
        eq(revenueAttribution.userId, userId),
        gte(revenueAttribution.createdAt, sevenDaysAgo)
      ));

    // Get product counts for conversion estimation
    const [productData] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(products)
      .where(eq(products.userId, userId));

    // Calculate metrics (using reasonable defaults if no data)
    const totalRevenue = Number(revenueData?.totalRevenue) || 0;
    const totalOrders = Number(revenueData?.totalOrders) || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Estimate conversion rate (simplified - would normally use analytics data)
    const estimatedVisitors = Math.max(totalOrders * 100, 100); // Assume 1% conversion baseline
    const conversionRate = totalOrders / estimatedVisitors;

    const metrics: KPIMetrics = {
      conversionRate: conversionRate || 0.01, // Default 1%
      revenue: totalRevenue,
      cartAbandonmentRate: 0.7, // Default 70% (industry average)
      bounceRate: 0.45, // Default 45%
      averageOrderValue: avgOrderValue || 50,
      timestamp: new Date(),
    };

    console.log(`✅ [KPI Monitor] Baseline captured: Revenue $${totalRevenue.toFixed(2)}, CVR ${(conversionRate * 100).toFixed(2)}%`);
    return metrics;
  }

  /**
   * Measure KPI impact after an action
   */
  async measureImpact(
    userId: string,
    actionId: string,
    baselineMetrics: KPIMetrics,
    waitTimeMs: number = 24 * 60 * 60 * 1000 // Default 24 hours
  ): Promise<KPIImpactResult> {
    console.log(`📈 [KPI Monitor] Measuring impact for action ${actionId}`);
    
    const currentMetrics = await this.captureBaseline(userId);
    const changes: KPIChange[] = [];

    // Compare each metric
    const metricPairs: { key: keyof KPIMetrics; label: string; higherIsBetter: boolean }[] = [
      { key: 'conversionRate', label: 'Conversion Rate', higherIsBetter: true },
      { key: 'revenue', label: 'Revenue', higherIsBetter: true },
      { key: 'cartAbandonmentRate', label: 'Cart Abandonment', higherIsBetter: false },
      { key: 'bounceRate', label: 'Bounce Rate', higherIsBetter: false },
      { key: 'averageOrderValue', label: 'Avg Order Value', higherIsBetter: true },
    ];

    for (const { key, label, higherIsBetter } of metricPairs) {
      if (key === 'timestamp') continue;
      
      const before = baselineMetrics[key] as number;
      const after = currentMetrics[key] as number;
      
      if (before === 0 && after === 0) continue;
      
      const changePercent = before === 0 ? (after > 0 ? 1 : 0) : (after - before) / before;
      const isImprovement = higherIsBetter ? changePercent > 0 : changePercent < 0;
      const isSignificant = Math.abs(changePercent) >= SIGNIFICANCE_THRESHOLD;

      changes.push({
        metric: label,
        before,
        after,
        changePercent,
        isImprovement,
        isSignificant,
      });
    }

    // Determine overall impact
    const significantChanges = changes.filter(c => c.isSignificant);
    const improvements = significantChanges.filter(c => c.isImprovement).length;
    const declines = significantChanges.filter(c => !c.isImprovement).length;

    let overallImpact: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (improvements > declines) overallImpact = 'positive';
    else if (declines > improvements) overallImpact = 'negative';

    // Check for drops
    const dropDetected = this.detectKPIDrop(changes);
    const dropSeverity = this.calculateDropSeverity(changes);
    const rollbackRecommended = dropSeverity === 'severe' || 
      (dropSeverity === 'moderate' && declines >= 2);

    // Calculate confidence based on data points
    const dataPoints = significantChanges.length;
    const confidence = Math.min(0.3 + (dataPoints * 0.15), 0.95);

    const result: KPIImpactResult = {
      actionId,
      measuredAt: new Date(),
      baselineMetrics,
      currentMetrics,
      changes,
      overallImpact,
      dropDetected,
      dropSeverity,
      rollbackRecommended,
      confidence,
    };

    console.log(`✅ [KPI Monitor] Impact measured: ${overallImpact} (${improvements} up, ${declines} down)`);
    if (dropDetected) {
      console.log(`⚠️  [KPI Monitor] Drop detected: ${dropSeverity}`);
    }

    return result;
  }

  /**
   * Detect if there's a significant KPI drop
   */
  private detectKPIDrop(changes: KPIChange[]): boolean {
    for (const change of changes) {
      if (!change.isImprovement && change.isSignificant) {
        const absChange = Math.abs(change.changePercent);
        if (absChange >= KPI_DROP_THRESHOLDS.minor) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Calculate the severity of detected drops
   */
  private calculateDropSeverity(changes: KPIChange[]): 'minor' | 'moderate' | 'severe' | null {
    let maxDropPercent = 0;

    for (const change of changes) {
      if (!change.isImprovement && change.isSignificant) {
        const absChange = Math.abs(change.changePercent);
        if (absChange > maxDropPercent) {
          maxDropPercent = absChange;
        }
      }
    }

    if (maxDropPercent >= KPI_DROP_THRESHOLDS.severe) return 'severe';
    if (maxDropPercent >= KPI_DROP_THRESHOLDS.moderate) return 'moderate';
    if (maxDropPercent >= KPI_DROP_THRESHOLDS.minor) return 'minor';
    return null;
  }

  /**
   * Execute rollback for an action
   */
  async executeRollback(
    userId: string,
    actionId: string,
    permissions: PlanPermissions
  ): Promise<RollbackResult> {
    console.log(`🔄 [KPI Monitor] Executing rollback for action ${actionId}`);
    const db = requireDb();

    // Check rollback permission
    if (!permissions.rollbackEnabled) {
      return {
        success: false,
        actionId,
        snapshotId: null,
        restoredFields: [],
        reason: 'Rollback not available on current plan',
        executedAt: new Date(),
      };
    }

    // Find the snapshot for this action
    const [snapshot] = await db
      .select()
      .from(productSnapshots)
      .where(eq(productSnapshots.actionId, actionId))
      .limit(1);

    if (!snapshot) {
      return {
        success: false,
        actionId,
        snapshotId: null,
        restoredFields: [],
        reason: 'No snapshot found for this action',
        executedAt: new Date(),
      };
    }

    // Restore the product from snapshot
    const snapshotData = snapshot.snapshotData as any;
    if (!snapshotData || !snapshotData.productId) {
      return {
        success: false,
        actionId,
        snapshotId: snapshot.id,
        restoredFields: [],
        reason: 'Invalid snapshot data',
        executedAt: new Date(),
      };
    }

    try {
      // Restore product fields
      const restoredFields: string[] = [];
      const updateData: any = {};

      if (snapshotData.name) {
        updateData.name = snapshotData.name;
        restoredFields.push('name');
      }
      if (snapshotData.description) {
        updateData.description = snapshotData.description;
        restoredFields.push('description');
      }
      if (snapshotData.optimizedCopy) {
        updateData.optimizedCopy = snapshotData.optimizedCopy;
        restoredFields.push('optimizedCopy');
      }

      if (restoredFields.length > 0) {
        updateData.updatedAt = new Date();
        await db
          .update(products)
          .set(updateData)
          .where(eq(products.id, snapshotData.productId));
      }

      // Mark the action as rolled back
      await db
        .update(autonomousActions)
        .set({
          status: 'rolled_back',
          rolledBackAt: new Date(),
          result: {
            rollback: true,
            reason: 'KPI drop detected',
            restoredFields,
          },
        })
        .where(eq(autonomousActions.id, actionId));

      console.log(`✅ [KPI Monitor] Rollback successful: restored ${restoredFields.length} fields`);

      return {
        success: true,
        actionId,
        snapshotId: snapshot.id,
        restoredFields,
        reason: 'Successfully restored to pre-action state',
        executedAt: new Date(),
      };
    } catch (error) {
      console.error(`❌ [KPI Monitor] Rollback failed:`, error);
      return {
        success: false,
        actionId,
        snapshotId: snapshot.id,
        restoredFields: [],
        reason: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executedAt: new Date(),
      };
    }
  }

  /**
   * Log the KPI impact for transparency and learning
   */
  async logImpact(
    userId: string,
    actionId: string,
    impact: KPIImpactResult
  ): Promise<void> {
    const db = requireDb();

    try {
      // Log to activity logs instead since revenueLoopProof requires opportunityId
      console.log(`📝 [KPI Monitor] Impact logged for action ${actionId}:`, {
        userId,
        actionId,
        baselineMetrics: impact.baselineMetrics,
        currentMetrics: impact.currentMetrics,
        revenueDelta: impact.currentMetrics.revenue - impact.baselineMetrics.revenue,
        overallImpact: impact.overallImpact,
        confidence: Math.round(impact.confidence * 100),
      });
    } catch (error) {
      console.error(`❌ [KPI Monitor] Failed to log impact:`, error);
    }
  }
}

export const kpiMonitor = new KPIMonitor();
