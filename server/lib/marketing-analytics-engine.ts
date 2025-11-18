import { requireDb } from "../db";
import {
  campaigns,
  campaignPerformanceMetrics,
  autonomousActions,
  abTestResults,
  cartRecoverySequences,
  customerEngagementHistory
} from "@shared/schema";
import { eq, and, sql, gte, desc, count, avg, sum } from "drizzle-orm";
import { getCached, setCached, CacheConfig } from "./cache";

/**
 * Marketing Analytics Engine
 * Aggregates campaign performance metrics, trends, and ROI calculations
 */

export interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  convertedCount: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
  cost: number;
  roi: number;
}

export interface MarketingOverview {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  averageOpenRate: number;
  averageClickRate: number;
  averageConversionRate: number;
  totalRevenue: number;
  totalCost: number;
  overallROI: number;
  weeklyTrend: {
    sent: number[];
    opened: number[];
    clicked: number[];
    revenue: number[];
  };
}

export interface ABTestSummary {
  testId: string;
  testName: string;
  status: 'active' | 'completed';
  variants: Array<{
    name: string;
    sentCount: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }>;
  winner?: string;
  confidence?: number;
}

/**
 * Get comprehensive campaign metrics with caching
 */
export async function getCampaignMetrics(
  campaignId: string,
  userId: string
): Promise<CampaignMetrics | null> {
  const db = requireDb();

  // Try cache first
  const cacheKey = `${userId}:${campaignId}`;
  const cached = await getCached<CampaignMetrics>(cacheKey, CacheConfig.CAMPAIGN_STATS);
  if (cached) {
    return cached;
  }

  try {
    // Get campaign details
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.userId, userId)
        )
      )
      .limit(1);

    if (!campaign) {
      return null;
    }

    // Get performance metrics
    const [metrics] = await db
      .select()
      .from(campaignPerformanceMetrics)
      .where(eq(campaignPerformanceMetrics.campaignId, campaignId))
      .limit(1);

    if (!metrics) {
      // Return default metrics if none exist
      const result: CampaignMetrics = {
        campaignId,
        campaignName: campaign.name,
        sentCount: campaign.sentCount || 0,
        openedCount: 0,
        clickedCount: 0,
        convertedCount: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
        revenue: 0,
        cost: 0,
        roi: 0
      };

      // Cache for 5 minutes
      await setCached(cacheKey, result, CacheConfig.CAMPAIGN_STATS);
      return result;
    }

    // Calculate rates
    const sentCount = metrics.sentCount || 0;
    const openRate = sentCount > 0 
      ? ((metrics.openedCount || 0) / sentCount) * 100 
      : 0;
    const clickRate = sentCount > 0 
      ? ((metrics.clickedCount || 0) / sentCount) * 100 
      : 0;
    const conversionRate = sentCount > 0 
      ? ((metrics.convertedCount || 0) / sentCount) * 100 
      : 0;

    const revenue = parseFloat(String(metrics.revenue)) || 0;
    const cost = parseFloat(String(metrics.cost)) || 0;
    const roi = cost > 0 
      ? ((revenue - cost) / cost) * 100 
      : 0;

    const result: CampaignMetrics = {
      campaignId,
      campaignName: campaign.name,
      sentCount,
      openedCount: metrics.openedCount || 0,
      clickedCount: metrics.clickedCount || 0,
      convertedCount: metrics.convertedCount || 0,
      openRate,
      clickRate,
      conversionRate,
      revenue,
      cost,
      roi
    };

    // Cache for 5 minutes
    await setCached(cacheKey, result, CacheConfig.CAMPAIGN_STATS);
    return result;

  } catch (error) {
    console.error('❌ [Analytics] Error getting campaign metrics:', error);
    return null;
  }
}

/**
 * Get marketing overview with 7-day trends
 */
export async function getMarketingOverview(userId: string): Promise<MarketingOverview> {
  const db = requireDb();

  // Try cache first
  const cacheKey = `${userId}:marketing_overview`;
  const cached = await getCached<MarketingOverview>(cacheKey, CacheConfig.DASHBOARD);
  if (cached) {
    return cached;
  }

  try {
    // Get all user's campaigns
    const userCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId));

    const totalCampaigns = userCampaigns.length;
    const activeCampaigns = userCampaigns.filter(c => c.status === 'sent' || c.status === 'sending').length;

    // Get all performance metrics for user's campaigns
    const campaignIds = userCampaigns.map(c => c.id);
    
    let metricsData: any[] = [];
    if (campaignIds.length > 0) {
      metricsData = await db
        .select()
        .from(campaignPerformanceMetrics)
        .where(eq(campaignPerformanceMetrics.userId, userId));
    }

    // Aggregate totals
    const totals = metricsData.reduce((acc, m) => ({
      sent: acc.sent + (m.sentCount || 0),
      opened: acc.opened + (m.openedCount || 0),
      clicked: acc.clicked + (m.clickedCount || 0),
      converted: acc.converted + (m.convertedCount || 0),
      revenue: acc.revenue + (parseFloat(String(m.revenue)) || 0),
      cost: acc.cost + (parseFloat(String(m.cost)) || 0)
    }), {
      sent: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      revenue: 0,
      cost: 0
    });

    // Calculate average rates
    const averageOpenRate = totals.sent > 0 ? (totals.opened / totals.sent) * 100 : 0;
    const averageClickRate = totals.sent > 0 ? (totals.clicked / totals.sent) * 100 : 0;
    const averageConversionRate = totals.sent > 0 ? (totals.converted / totals.sent) * 100 : 0;
    const overallROI = totals.cost > 0 ? ((totals.revenue - totals.cost) / totals.cost) * 100 : 0;

    // Generate 7-day trend (placeholder - real implementation would query historical data)
    const weeklyTrend = await get7DayTrend(userId);

    const result: MarketingOverview = {
      totalCampaigns,
      activeCampaigns,
      totalSent: totals.sent,
      totalOpened: totals.opened,
      totalClicked: totals.clicked,
      totalConverted: totals.converted,
      averageOpenRate,
      averageClickRate,
      averageConversionRate,
      totalRevenue: totals.revenue,
      totalCost: totals.cost,
      overallROI,
      weeklyTrend
    };

    // Cache for 10 minutes
    await setCached(cacheKey, result, CacheConfig.DASHBOARD);
    return result;

  } catch (error) {
    console.error('❌ [Analytics] Error getting marketing overview:', error);
    throw error;
  }
}

/**
 * Get 7-day trend data
 */
async function get7DayTrend(userId: string): Promise<{
  sent: number[];
  opened: number[];
  clicked: number[];
  revenue: number[];
}> {
  const db = requireDb();

  try {
    // Get actions for last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const actions = await db
      .select()
      .from(autonomousActions)
      .where(
        and(
          eq(autonomousActions.userId, userId),
          gte(autonomousActions.createdAt, sevenDaysAgo),
          sql`${autonomousActions.actionType} IN ('send_campaign', 'send_cart_recovery')`
        )
      )
      .orderBy(desc(autonomousActions.createdAt));

    // Group by day
    const trendData = {
      sent: new Array(7).fill(0),
      opened: new Array(7).fill(0),
      clicked: new Array(7).fill(0),
      revenue: new Array(7).fill(0)
    };

    const now = new Date();
    
    for (const action of actions) {
      const createdAt = new Date(action.createdAt || now);
      const daysAgo = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysAgo >= 0 && daysAgo < 7) {
        const dayIndex = 6 - daysAgo; // Most recent day at index 6
        trendData.sent[dayIndex]++;
        
        // Get metrics from result
        const result = action.result as any || {};
        if (result.opened) trendData.opened[dayIndex]++;
        if (result.clicked) trendData.clicked[dayIndex]++;
        if (result.revenue) trendData.revenue[dayIndex] += parseFloat(result.revenue) || 0;
      }
    }

    return trendData;

  } catch (error) {
    console.error('❌ [Analytics] Error getting 7-day trend:', error);
    return {
      sent: new Array(7).fill(0),
      opened: new Array(7).fill(0),
      clicked: new Array(7).fill(0),
      revenue: new Array(7).fill(0)
    };
  }
}

/**
 * Get A/B test summaries
 */
export async function getABTestSummaries(userId: string): Promise<ABTestSummary[]> {
  const db = requireDb();

  try {
    // Get all A/B tests for user
    const tests = await db
      .select()
      .from(abTestResults)
      .where(eq(abTestResults.userId, userId))
      .orderBy(desc(abTestResults.startedAt));

    const summaries: ABTestSummary[] = [];

    for (const test of tests) {
      // Get metrics for each variant
      const controlMetrics = await db
        .select()
        .from(campaignPerformanceMetrics)
        .where(eq(campaignPerformanceMetrics.campaignId, test.controlCampaignId))
        .limit(1);

      const variantAMetrics = await db
        .select()
        .from(campaignPerformanceMetrics)
        .where(eq(campaignPerformanceMetrics.campaignId, test.variantAId))
        .limit(1);

      const variantBMetrics = await db
        .select()
        .from(campaignPerformanceMetrics)
        .where(eq(campaignPerformanceMetrics.campaignId, test.variantBId))
        .limit(1);

      const getRate = (metrics: any[], type: 'open' | 'click' | 'conversion') => {
        if (!metrics[0]) return 0;
        const m = metrics[0];
        const sent = m.sentCount || 0;
        if (sent === 0) return 0;

        if (type === 'open') {
          return ((m.openedCount || 0) / sent) * 100;
        } else if (type === 'click') {
          return ((m.clickedCount || 0) / sent) * 100;
        } else {
          return ((m.convertedCount || 0) / sent) * 100;
        }
      };

      summaries.push({
        testId: test.id,
        testName: test.name,
        status: test.winnerId ? 'completed' : 'active',
        variants: [
          {
            name: 'Control',
            sentCount: controlMetrics[0]?.sentCount || 0,
            openRate: getRate(controlMetrics, 'open'),
            clickRate: getRate(controlMetrics, 'click'),
            conversionRate: getRate(controlMetrics, 'conversion')
          },
          {
            name: 'Variant A',
            sentCount: variantAMetrics[0]?.sentCount || 0,
            openRate: getRate(variantAMetrics, 'open'),
            clickRate: getRate(variantAMetrics, 'click'),
            conversionRate: getRate(variantAMetrics, 'conversion')
          },
          {
            name: 'Variant B',
            sentCount: variantBMetrics[0]?.sentCount || 0,
            openRate: getRate(variantBMetrics, 'open'),
            clickRate: getRate(variantBMetrics, 'click'),
            conversionRate: getRate(variantBMetrics, 'conversion')
          }
        ],
        winner: test.winnerId 
          ? (test.winnerId === test.controlCampaignId ? 'Control' 
            : test.winnerId === test.variantAId ? 'Variant A' 
            : 'Variant B')
          : undefined,
        confidence: test.metadata ? (test.metadata as any).winnerResult?.confidence : undefined
      });
    }

    return summaries;

  } catch (error) {
    console.error('❌ [Analytics] Error getting A/B test summaries:', error);
    return [];
  }
}

/**
 * Get cart recovery analytics
 */
export async function getCartRecoveryAnalytics(userId: string): Promise<{
  totalSequences: number;
  pendingSequences: number;
  sentSequences: number;
  convertedSequences: number;
  conversionRate: number;
  averageRecoveryTime: number; // hours
  totalRevenue: number;
}> {
  const db = requireDb();

  try {
    const sequences = await db
      .select()
      .from(cartRecoverySequences)
      .where(eq(cartRecoverySequences.userId, userId));

    const totalSequences = sequences.length;
    const pendingSequences = sequences.filter(s => s.status === 'pending').length;
    const sentSequences = sequences.filter(s => s.status === 'sent').length;
    const convertedSequences = sequences.filter(s => s.status === 'converted').length;
    
    const conversionRate = sentSequences > 0 
      ? (convertedSequences / sentSequences) * 100 
      : 0;

    // Calculate average recovery time
    const convertedWithTimestamps = sequences.filter(s => 
      s.status === 'converted' && s.sentAt && s.convertedAt
    );

    let averageRecoveryTime = 0;
    if (convertedWithTimestamps.length > 0) {
      const totalHours = convertedWithTimestamps.reduce((sum, s) => {
        const sent = new Date(s.sentAt!).getTime();
        const converted = new Date(s.convertedAt!).getTime();
        const hours = (converted - sent) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      
      averageRecoveryTime = totalHours / convertedWithTimestamps.length;
    }

    // Placeholder for revenue - would need to join with orders table
    const totalRevenue = 0;

    return {
      totalSequences,
      pendingSequences,
      sentSequences,
      convertedSequences,
      conversionRate,
      averageRecoveryTime,
      totalRevenue
    };

  } catch (error) {
    console.error('❌ [Analytics] Error getting cart recovery analytics:', error);
    throw error;
  }
}

/**
 * Update campaign performance metrics
 * Called when tracking pixels fire or conversions happen
 */
export async function updateCampaignMetrics(
  campaignId: string,
  userId: string,
  event: 'open' | 'click' | 'conversion',
  revenue?: number
): Promise<void> {
  const db = requireDb();

  try {
    // Get or create metrics record
    const [existing] = await db
      .select()
      .from(campaignPerformanceMetrics)
      .where(eq(campaignPerformanceMetrics.campaignId, campaignId))
      .limit(1);

    if (existing) {
      // Update existing metrics
      const updates: any = {
        lastUpdatedAt: new Date()
      };

      if (event === 'open') {
        updates.openedCount = (existing.openedCount || 0) + 1;
      } else if (event === 'click') {
        updates.clickedCount = (existing.clickedCount || 0) + 1;
      } else if (event === 'conversion') {
        updates.convertedCount = (existing.convertedCount || 0) + 1;
        if (revenue) {
          const currentRevenue = parseFloat(String(existing.revenue)) || 0;
          updates.revenue = (currentRevenue + revenue).toString();
        }
      }

      // Recalculate rates
      const sentCount = existing.sentCount || 0;
      if (sentCount > 0) {
        updates.openRate = ((updates.openedCount || existing.openedCount || 0) / sentCount * 100).toString();
        updates.clickRate = ((updates.clickedCount || existing.clickedCount || 0) / sentCount * 100).toString();
        updates.conversionRate = ((updates.convertedCount || existing.convertedCount || 0) / sentCount * 100).toString();
        
        const totalRevenue = parseFloat(String(updates.revenue || existing.revenue)) || 0;
        const cost = parseFloat(String(existing.cost)) || 0;
        updates.roi = cost > 0 ? (((totalRevenue - cost) / cost) * 100).toString() : '0';
      }

      await db
        .update(campaignPerformanceMetrics)
        .set(updates)
        .where(eq(campaignPerformanceMetrics.id, existing.id));

    } else {
      // Create new metrics record
      await db.insert(campaignPerformanceMetrics).values({
        userId,
        campaignId,
        sentCount: 0,
        openedCount: event === 'open' ? 1 : 0,
        clickedCount: event === 'click' ? 1 : 0,
        convertedCount: event === 'conversion' ? 1 : 0,
        revenue: revenue?.toString() || '0'
      });
    }

    console.log(`📊 [Analytics] Updated ${event} metrics for campaign ${campaignId}`);

  } catch (error) {
    console.error('❌ [Analytics] Error updating campaign metrics:', error);
  }
}
