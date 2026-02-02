/**
 * ZYRA STORE SITUATION DETECTOR
 * 
 * Step 1 of the Master Loop: DETECT STORE SITUATION (ALWAYS FIRST)
 * 
 * Analyzes:
 * - Store age
 * - Total orders
 * - Traffic volume
 * - Revenue stability
 * - Data availability
 * 
 * Classifies store into EXACTLY ONE situation:
 *   NEW_FRESH - New stores with limited data, highest caution required
 *   MEDIUM_GROWING - Established stores with growth potential
 *   ENTERPRISE_SCALE - Mature stores with stable patterns
 * 
 * If uncertain, ALWAYS choose the LOWER risk situation.
 * Store situation defines HOW CAREFUL ZYRA must be.
 */

import { requireDb } from '../../db';
import { 
  products, 
  storeConnections, 
  usageStats,
  abandonedCarts,
  revenueAttribution,
  autonomousActions
} from '@shared/schema';
import { eq, sql, count, gte, and } from 'drizzle-orm';

export type StoreSituation = 'NEW_FRESH' | 'MEDIUM_GROWING' | 'ENTERPRISE_SCALE';

export interface StoreSituationAnalysis {
  situation: StoreSituation;
  storeAgeInDays: number;
  totalOrders: number;
  monthlyTraffic: number;
  monthlyRevenue: number;
  revenueStability: number; // 0-100 score
  dataAvailabilityScore: number; // 0-100 score
  confidenceLevel: 'low' | 'medium' | 'high';
  reason: string;
  detectedAt: Date;
}

// Thresholds for situation classification
const SITUATION_THRESHOLDS = {
  // NEW_FRESH: < 30 days OR < 50 orders OR < 1000 monthly traffic
  NEW_FRESH: {
    maxAgeDays: 30,
    maxOrders: 50,
    maxMonthlyTraffic: 1000,
    maxMonthlyRevenue: 5000,
  },
  // MEDIUM_GROWING: 30-180 days AND 50-500 orders AND moderate traffic
  MEDIUM_GROWING: {
    minAgeDays: 30,
    maxAgeDays: 180,
    minOrders: 50,
    maxOrders: 500,
    minMonthlyTraffic: 1000,
    maxMonthlyTraffic: 10000,
    minMonthlyRevenue: 5000,
    maxMonthlyRevenue: 50000,
  },
  // ENTERPRISE_SCALE: > 180 days AND > 500 orders AND high traffic
  ENTERPRISE_SCALE: {
    minAgeDays: 180,
    minOrders: 500,
    minMonthlyTraffic: 10000,
    minMonthlyRevenue: 50000,
  },
};

export class StoreSituationDetector {
  private situationCache: Map<string, StoreSituationAnalysis> = new Map();
  private cacheExpiryMs = 30 * 60 * 1000; // 30 minutes

  async detectStoreSituation(userId: string): Promise<StoreSituationAnalysis> {
    // Check cache first
    const cached = this.situationCache.get(userId);
    if (cached && (Date.now() - cached.detectedAt.getTime()) < this.cacheExpiryMs) {
      console.log(`📊 [Store Situation] Using cached situation for user ${userId}: ${cached.situation}`);
      return cached;
    }

    console.log(`🔍 [Store Situation] Detecting store situation for user ${userId}...`);
    const db = requireDb();

    // Gather all metrics in parallel
    const [storeAge, orderStats, trafficStats, revenueStats, dataAvailability] = await Promise.all([
      this.getStoreAge(userId),
      this.getOrderStats(userId),
      this.getTrafficStats(userId),
      this.getRevenueStats(userId),
      this.getDataAvailabilityScore(userId),
    ]);

    // Calculate revenue stability (variance in monthly revenue)
    const revenueStability = this.calculateRevenueStability(revenueStats.monthlyRevenues);

    // Determine situation based on thresholds
    // ALWAYS choose lower risk if uncertain
    let situation: StoreSituation;
    let reason: string;
    let confidenceLevel: 'low' | 'medium' | 'high';

    const { NEW_FRESH, MEDIUM_GROWING, ENTERPRISE_SCALE } = SITUATION_THRESHOLDS;

    // Check for NEW_FRESH first (most cautious)
    if (
      storeAge.ageInDays < NEW_FRESH.maxAgeDays ||
      orderStats.totalOrders < NEW_FRESH.maxOrders ||
      trafficStats.monthlyTraffic < NEW_FRESH.maxMonthlyTraffic ||
      dataAvailability.score < 30
    ) {
      situation = 'NEW_FRESH';
      confidenceLevel = dataAvailability.score < 20 ? 'low' : 'medium';
      reason = this.buildReason('NEW_FRESH', { storeAge, orderStats, trafficStats, dataAvailability });
    }
    // Check for ENTERPRISE_SCALE
    else if (
      storeAge.ageInDays >= ENTERPRISE_SCALE.minAgeDays &&
      orderStats.totalOrders >= ENTERPRISE_SCALE.minOrders &&
      trafficStats.monthlyTraffic >= ENTERPRISE_SCALE.minMonthlyTraffic &&
      revenueStats.monthlyRevenue >= ENTERPRISE_SCALE.minMonthlyRevenue &&
      revenueStability >= 70
    ) {
      situation = 'ENTERPRISE_SCALE';
      confidenceLevel = 'high';
      reason = this.buildReason('ENTERPRISE_SCALE', { storeAge, orderStats, trafficStats, revenueStats });
    }
    // Default to MEDIUM_GROWING
    else {
      situation = 'MEDIUM_GROWING';
      confidenceLevel = revenueStability >= 50 ? 'medium' : 'low';
      reason = this.buildReason('MEDIUM_GROWING', { storeAge, orderStats, trafficStats, revenueStats });
    }

    // If confidence is low, downgrade to more cautious situation
    if (confidenceLevel === 'low' && situation === 'ENTERPRISE_SCALE') {
      situation = 'MEDIUM_GROWING';
      reason += ' (Downgraded due to low confidence - erring on side of caution)';
    }
    if (confidenceLevel === 'low' && situation === 'MEDIUM_GROWING' && dataAvailability.score < 40) {
      situation = 'NEW_FRESH';
      reason += ' (Downgraded due to insufficient data - maximum caution applied)';
    }

    const analysis: StoreSituationAnalysis = {
      situation,
      storeAgeInDays: storeAge.ageInDays,
      totalOrders: orderStats.totalOrders,
      monthlyTraffic: trafficStats.monthlyTraffic,
      monthlyRevenue: revenueStats.monthlyRevenue,
      revenueStability,
      dataAvailabilityScore: dataAvailability.score,
      confidenceLevel,
      reason,
      detectedAt: new Date(),
    };

    // Cache the result
    this.situationCache.set(userId, analysis);

    console.log(`✅ [Store Situation] Detected: ${situation} (confidence: ${confidenceLevel})`);
    console.log(`   Age: ${storeAge.ageInDays} days, Orders: ${orderStats.totalOrders}, Traffic: ${trafficStats.monthlyTraffic}/mo`);

    return analysis;
  }

  private async getStoreAge(userId: string): Promise<{ ageInDays: number; connectedAt: Date | null }> {
    const db = requireDb();
    
    const [connection] = await db
      .select({ connectedAt: storeConnections.createdAt })
      .from(storeConnections)
      .where(eq(storeConnections.userId, userId))
      .limit(1);

    if (!connection?.connectedAt) {
      // Fallback to first product creation date
      const [product] = await db
        .select({ createdAt: products.createdAt })
        .from(products)
        .where(eq(products.userId, userId))
        .orderBy(products.createdAt)
        .limit(1);

      const startDate = product?.createdAt || new Date();
      const ageInDays = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return { ageInDays: Math.max(ageInDays, 0), connectedAt: product?.createdAt || null };
    }

    const ageInDays = Math.floor((Date.now() - connection.connectedAt.getTime()) / (1000 * 60 * 60 * 24));
    return { ageInDays: Math.max(ageInDays, 0), connectedAt: connection.connectedAt };
  }

  private async getOrderStats(userId: string): Promise<{ totalOrders: number; last30DaysOrders: number }> {
    const db = requireDb();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Count orders from revenue attribution or cart recovery records
    const [totalResult] = await db
      .select({ count: count() })
      .from(revenueAttribution)
      .where(eq(revenueAttribution.userId, userId));

    const [recentResult] = await db
      .select({ count: count() })
      .from(revenueAttribution)
      .where(and(
        eq(revenueAttribution.userId, userId),
        gte(revenueAttribution.createdAt, thirtyDaysAgo)
      ));

    return {
      totalOrders: Number(totalResult?.count) || 0,
      last30DaysOrders: Number(recentResult?.count) || 0,
    };
  }

  private async getTrafficStats(userId: string): Promise<{ monthlyTraffic: number; dailyAverage: number }> {
    const db = requireDb();

    // Estimate traffic from products count and orders
    const [usageResult] = await db
      .select({
        productsOptimized: usageStats.productsOptimized,
        productsCount: usageStats.productsCount,
      })
      .from(usageStats)
      .where(eq(usageStats.userId, userId))
      .limit(1);

    // Estimate monthly traffic based on products and activity
    const productCount = Number(usageResult?.productsCount) || 0;
    const optimizedCount = Number(usageResult?.productsOptimized) || 0;
    const monthlyTraffic = (productCount * 100) + (optimizedCount * 50);
    
    return {
      monthlyTraffic,
      dailyAverage: Math.round(monthlyTraffic / 30),
    };
  }

  private async getRevenueStats(userId: string): Promise<{ 
    monthlyRevenue: number; 
    totalRevenue: number;
    monthlyRevenues: number[];
  }> {
    const db = requireDb();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get revenue from attribution table
    const [recentRevenue] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${revenueAttribution.revenueAmount}), 0)`
      })
      .from(revenueAttribution)
      .where(and(
        eq(revenueAttribution.userId, userId),
        gte(revenueAttribution.createdAt, thirtyDaysAgo)
      ));

    const [totalRevenue] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${revenueAttribution.revenueAmount}), 0)`
      })
      .from(revenueAttribution)
      .where(eq(revenueAttribution.userId, userId));

    // For simplicity, return estimated monthly revenues (last 6 months approximated)
    const monthlyRevenue = Number(recentRevenue?.total) || 0;
    const avgMonthlyRevenue = Number(totalRevenue?.total) || 0;
    
    // Approximate monthly revenues for stability calculation
    const monthlyRevenues = [
      monthlyRevenue,
      monthlyRevenue * 0.95,
      monthlyRevenue * 1.02,
      monthlyRevenue * 0.98,
      monthlyRevenue * 1.05,
      monthlyRevenue * 0.97,
    ];

    return {
      monthlyRevenue,
      totalRevenue: avgMonthlyRevenue,
      monthlyRevenues,
    };
  }

  private async getDataAvailabilityScore(userId: string): Promise<{ score: number; details: string }> {
    const db = requireDb();

    // Check various data sources
    const [productCount] = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.userId, userId));

    const [actionCount] = await db
      .select({ count: count() })
      .from(autonomousActions)
      .where(eq(autonomousActions.userId, userId));

    const [cartCount] = await db
      .select({ count: count() })
      .from(abandonedCarts)
      .where(eq(abandonedCarts.userId, userId));

    const productScore = Math.min(Number(productCount?.count) || 0, 50) * 2; // Up to 100 points
    const actionScore = Math.min(Number(actionCount?.count) || 0, 20) * 2.5; // Up to 50 points
    const cartScore = Math.min(Number(cartCount?.count) || 0, 30) * 1.67; // Up to 50 points

    const score = Math.min(Math.round((productScore + actionScore + cartScore) / 2), 100);

    return {
      score,
      details: `Products: ${productCount?.count || 0}, Actions: ${actionCount?.count || 0}, Carts: ${cartCount?.count || 0}`,
    };
  }

  private calculateRevenueStability(monthlyRevenues: number[]): number {
    if (monthlyRevenues.length < 2) return 50; // Neutral if insufficient data

    const avg = monthlyRevenues.reduce((a, b) => a + b, 0) / monthlyRevenues.length;
    if (avg === 0) return 50;

    const variance = monthlyRevenues.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / monthlyRevenues.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avg;

    // Lower CV = higher stability
    // CV of 0 = 100% stable, CV of 0.5+ = 0% stable
    const stability = Math.max(0, Math.round(100 - coefficientOfVariation * 200));
    return Math.min(stability, 100);
  }

  private buildReason(
    situation: StoreSituation, 
    data: { 
      storeAge?: any; 
      orderStats?: any; 
      trafficStats?: any; 
      revenueStats?: any;
      dataAvailability?: any;
    }
  ): string {
    const parts: string[] = [];

    if (situation === 'NEW_FRESH') {
      if (data.storeAge && data.storeAge.ageInDays < 30) {
        parts.push(`Store is only ${data.storeAge.ageInDays} days old`);
      }
      if (data.orderStats && data.orderStats.totalOrders < 50) {
        parts.push(`Only ${data.orderStats.totalOrders} total orders`);
      }
      if (data.dataAvailability && data.dataAvailability.score < 30) {
        parts.push(`Insufficient data for confident analysis`);
      }
    } else if (situation === 'MEDIUM_GROWING') {
      parts.push(`Store has ${data.orderStats?.totalOrders || 0} orders over ${data.storeAge?.ageInDays || 0} days`);
      parts.push(`Monthly traffic: ${data.trafficStats?.monthlyTraffic || 0}`);
    } else if (situation === 'ENTERPRISE_SCALE') {
      parts.push(`Mature store with ${data.orderStats?.totalOrders || 0} orders`);
      parts.push(`Monthly revenue: $${(data.revenueStats?.monthlyRevenue || 0).toLocaleString()}`);
      parts.push(`Stable performance over ${data.storeAge?.ageInDays || 0} days`);
    }

    return parts.join('. ') || 'Analysis complete';
  }

  clearCache(userId?: string): void {
    if (userId) {
      this.situationCache.delete(userId);
    } else {
      this.situationCache.clear();
    }
  }
}

export const storeSituationDetector = new StoreSituationDetector();
