import { db } from '../db';
import { products, seoMeta, scanActivity, automationSettings, autonomousActions } from '@shared/schema';
import { eq, and, gte, desc, sql, lt, isNull, or } from 'drizzle-orm';

interface IssueDetail {
  type: string;
  productId: string;
  productName: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface FixDetail {
  type: string;
  productId: string;
  productName: string;
  description: string;
  estimatedImpact: number;
}

interface ScanResult {
  scanId: string;
  productsScanned: number;
  issuesDetected: IssueDetail[];
  fixesApplied: FixDetail[];
  estimatedRevenueProtected: number;
  durationMs: number;
}

export class RevenueImmuneScanner {
  private static instance: RevenueImmuneScanner;
  private isScanning: Map<string, boolean> = new Map();

  static getInstance(): RevenueImmuneScanner {
    if (!RevenueImmuneScanner.instance) {
      RevenueImmuneScanner.instance = new RevenueImmuneScanner();
    }
    return RevenueImmuneScanner.instance;
  }

  async isProtectionEnabled(userId: string): Promise<boolean> {
    const settings = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, userId))
      .limit(1);
    
    return settings[0]?.globalAutopilotEnabled ?? false;
  }

  async runFullScan(userId: string): Promise<ScanResult | null> {
    if (this.isScanning.get(userId)) {
      console.log(`[RevenueImmuneScanner] Scan already in progress for user ${userId}`);
      return null;
    }

    const isEnabled = await this.isProtectionEnabled(userId);
    if (!isEnabled) {
      console.log(`[RevenueImmuneScanner] Protection disabled for user ${userId}`);
      return null;
    }

    this.isScanning.set(userId, true);
    const startTime = Date.now();
    const issuesDetected: IssueDetail[] = [];
    const fixesApplied: FixDetail[] = [];
    let estimatedRevenueProtected = 0;

    try {
      const [scanRecord] = await db
        .insert(scanActivity)
        .values({
          userId,
          scanType: 'full_scan',
          startedAt: new Date(),
          status: 'running',
          productsScanned: 0,
        })
        .returning();

      const userProducts = await db
        .select()
        .from(products)
        .where(eq(products.userId, userId));

      console.log(`[RevenueImmuneScanner] Scanning ${userProducts.length} products for user ${userId}`);

      for (const product of userProducts) {
        const productSeoData = await db
          .select()
          .from(seoMeta)
          .where(eq(seoMeta.productId, product.id))
          .limit(1);

        const seoScore = productSeoData[0]?.seoScore ?? 0;
        const hasMetaDescription = productSeoData[0]?.metaDescription && productSeoData[0].metaDescription.length > 20;
        const hasOptimizedTitle = productSeoData[0]?.optimizedTitle && productSeoData[0].optimizedTitle.length > 10;
        const titleLength = product.name?.length ?? 0;
        const descriptionLength = product.description?.length ?? 0;

        if (seoScore < 50) {
          issuesDetected.push({
            type: 'seo_erosion',
            productId: product.id,
            productName: product.name,
            severity: seoScore < 30 ? 'high' : 'medium',
            description: `SEO score is ${seoScore}/100 - below healthy threshold`,
          });
        }

        if (titleLength < 20) {
          issuesDetected.push({
            type: 'weak_title',
            productId: product.id,
            productName: product.name,
            severity: 'medium',
            description: `Product title is too short (${titleLength} chars) - may hurt discoverability`,
          });
        }

        if (descriptionLength < 100) {
          issuesDetected.push({
            type: 'thin_content',
            productId: product.id,
            productName: product.name,
            severity: descriptionLength < 50 ? 'high' : 'medium',
            description: `Product description is thin (${descriptionLength} chars) - impacts conversion`,
          });
        }

        if (!hasMetaDescription) {
          issuesDetected.push({
            type: 'missing_meta',
            productId: product.id,
            productName: product.name,
            severity: 'low',
            description: 'Missing or incomplete meta description',
          });
        }

        const lastUpdated = product.updatedAt ? new Date(product.updatedAt) : new Date(product.createdAt!);
        const daysSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceUpdate > 90) {
          issuesDetected.push({
            type: 'content_decay',
            productId: product.id,
            productName: product.name,
            severity: daysSinceUpdate > 180 ? 'high' : 'medium',
            description: `Content not updated in ${daysSinceUpdate} days - may appear stale`,
          });
        }
      }

      const highSeverityCount = issuesDetected.filter(i => i.severity === 'high').length;
      const mediumSeverityCount = issuesDetected.filter(i => i.severity === 'medium').length;
      estimatedRevenueProtected = (highSeverityCount * 500) + (mediumSeverityCount * 200);

      const durationMs = Date.now() - startTime;

      await db
        .update(scanActivity)
        .set({
          completedAt: new Date(),
          durationMs,
          productsScanned: userProducts.length,
          issuesDetected: issuesDetected.length,
          issueDetails: issuesDetected,
          fixesApplied: fixesApplied.length,
          fixDetails: fixesApplied,
          estimatedRevenueProtected: estimatedRevenueProtected.toString(),
          status: 'completed',
        })
        .where(eq(scanActivity.id, scanRecord.id));

      console.log(`[RevenueImmuneScanner] Scan completed for user ${userId}: ${userProducts.length} products, ${issuesDetected.length} issues found`);

      return {
        scanId: scanRecord.id,
        productsScanned: userProducts.length,
        issuesDetected,
        fixesApplied,
        estimatedRevenueProtected,
        durationMs,
      };
    } catch (error) {
      console.error(`[RevenueImmuneScanner] Error scanning for user ${userId}:`, error);
      return null;
    } finally {
      this.isScanning.set(userId, false);
    }
  }

  async getLatestScanActivity(userId: string, limit: number = 10): Promise<typeof scanActivity.$inferSelect[]> {
    return await db
      .select()
      .from(scanActivity)
      .where(eq(scanActivity.userId, userId))
      .orderBy(desc(scanActivity.createdAt))
      .limit(limit);
  }

  async getTodayScans(userId: string): Promise<typeof scanActivity.$inferSelect[]> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    return await db
      .select()
      .from(scanActivity)
      .where(
        and(
          eq(scanActivity.userId, userId),
          gte(scanActivity.createdAt, startOfToday)
        )
      )
      .orderBy(desc(scanActivity.createdAt));
  }

  async getWeeklyStats(userId: string): Promise<{
    scansPerformed: number;
    issuesDetected: number;
    fixesExecuted: number;
    rollbacksNeeded: number;
    totalRevenueProtected: number;
  }> {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyScans = await db
      .select()
      .from(scanActivity)
      .where(
        and(
          eq(scanActivity.userId, userId),
          gte(scanActivity.createdAt, startOfWeek)
        )
      );

    const weeklyActions = await db
      .select()
      .from(autonomousActions)
      .where(
        and(
          eq(autonomousActions.userId, userId),
          gte(autonomousActions.createdAt, startOfWeek)
        )
      );

    const totalIssues = weeklyScans.reduce((sum, scan) => sum + (scan.issuesDetected ?? 0), 0);
    const totalFixes = weeklyScans.reduce((sum, scan) => sum + (scan.fixesApplied ?? 0), 0);
    const totalRevenue = weeklyScans.reduce((sum, scan) => 
      sum + parseFloat(scan.estimatedRevenueProtected?.toString() ?? '0'), 0);
    const rollbacks = weeklyActions.filter(a => a.status === 'rolled_back').length;

    return {
      scansPerformed: weeklyScans.length,
      issuesDetected: totalIssues,
      fixesExecuted: totalFixes,
      rollbacksNeeded: rollbacks,
      totalRevenueProtected: totalRevenue,
    };
  }

  async getLastScanTimestamp(userId: string): Promise<Date | null> {
    const lastScan = await db
      .select({ completedAt: scanActivity.completedAt })
      .from(scanActivity)
      .where(
        and(
          eq(scanActivity.userId, userId),
          eq(scanActivity.status, 'completed')
        )
      )
      .orderBy(desc(scanActivity.completedAt))
      .limit(1);

    return lastScan[0]?.completedAt ?? null;
  }
}

export const revenueImmuneScanner = RevenueImmuneScanner.getInstance();
