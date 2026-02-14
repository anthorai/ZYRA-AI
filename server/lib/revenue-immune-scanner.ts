import { db } from '../db';
import { products, seoMeta, scanActivity, automationSettings, autonomousActions, revenueAttribution } from '@shared/schema';
import { eq, and, gte, desc, sql, lt, isNull, or } from 'drizzle-orm';
import { ActionDeduplicationGuard } from './action-deduplication-guard';

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
  actionId?: string;
}

interface ScanResult {
  scanId: string;
  productsScanned: number;
  issuesDetected: IssueDetail[];
  fixesApplied: FixDetail[];
  estimatedRevenueProtected: number;
  durationMs: number;
}

const ISSUE_TO_ACTION_MAP: Record<string, { actionType: string; label: string }> = {
  seo_erosion: { actionType: 'optimize_seo', label: 'SEO Optimization' },
  weak_title: { actionType: 'optimize_seo', label: 'Title Optimization' },
  thin_content: { actionType: 'optimize_seo', label: 'Content Enhancement' },
  missing_meta: { actionType: 'optimize_seo', label: 'Meta Description Generation' },
  content_decay: { actionType: 'optimize_seo', label: 'Content Refresh' },
};

const SEVERITY_IMPACT: Record<string, number> = {
  high: 500,
  medium: 200,
  low: 50,
};

export class RevenueImmuneScanner {
  private static instance: RevenueImmuneScanner;
  private isScanning: Map<string, boolean> = new Map();
  private dedupGuard: ActionDeduplicationGuard;

  constructor() {
    this.dedupGuard = new ActionDeduplicationGuard();
  }

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

  private async createFixAction(
    userId: string,
    issue: IssueDetail,
    scanId: string
  ): Promise<FixDetail | null> {
    const mapping = ISSUE_TO_ACTION_MAP[issue.type];
    if (!mapping) {
      console.log(`[RevenueImmuneScanner] No action mapping for issue type: ${issue.type}`);
      return null;
    }

    try {
      const uniquenessCheck = await this.dedupGuard.checkActionTargetUniqueness(
        userId, 'product', issue.productId, mapping.actionType
      );
      if (!uniquenessCheck.allowed) {
        console.log(`[RevenueImmuneScanner] Dedup blocked (${uniquenessCheck.ruleTriggered}): ${mapping.actionType} on ${issue.productName} — ${uniquenessCheck.reason}`);
        return null;
      }

      const activeCheck = await this.dedupGuard.checkActiveActionLimit(
        userId, 'product', issue.productId
      );
      if (!activeCheck.allowed) {
        console.log(`[RevenueImmuneScanner] Active action limit: ${issue.productName} — ${activeCheck.reason}`);
        return null;
      }

      const cooldownCheck = await this.dedupGuard.checkCooldown(
        userId, 'product', issue.productId, mapping.actionType
      );
      if (!cooldownCheck.allowed) {
        console.log(`[RevenueImmuneScanner] Cooldown active: ${mapping.actionType} on ${issue.productName} — ${cooldownCheck.reason}`);
        return null;
      }

      const [action] = await db.insert(autonomousActions).values({
        userId,
        actionType: mapping.actionType,
        entityType: 'product',
        entityId: issue.productId,
        status: 'pending',
        decisionReason: `Revenue Immune System: ${issue.description}`,
        executedBy: 'revenue_immune_system',
        creditsUsed: 1,
        payload: {
          source: 'revenue_immune_scanner',
          scanId,
          issueType: issue.type,
          severity: issue.severity,
          actionLabel: mapping.label,
          productName: issue.productName,
        } as any,
      }).returning();

      console.log(`[RevenueImmuneScanner] Created fix action ${action.id}: ${mapping.label} for "${issue.productName}"`);

      return {
        type: mapping.label,
        productId: issue.productId,
        productName: issue.productName,
        description: `Auto-created ${mapping.label} to fix: ${issue.description}`,
        estimatedImpact: SEVERITY_IMPACT[issue.severity] || 100,
        actionId: action.id,
      };
    } catch (error) {
      console.error(`[RevenueImmuneScanner] Error creating fix for ${issue.productName}:`, error);
      return null;
    }
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

      console.log(`[RevenueImmuneScanner] Found ${issuesDetected.length} issues, creating fix actions...`);

      const highSeverityIssues = issuesDetected.filter(i => i.severity === 'high');
      const mediumSeverityIssues = issuesDetected.filter(i => i.severity === 'medium');
      const prioritizedIssues = [...highSeverityIssues, ...mediumSeverityIssues];

      const processedProducts = new Set<string>();
      const MAX_FIXES_PER_SCAN = 5;

      for (const issue of prioritizedIssues) {
        if (fixesApplied.length >= MAX_FIXES_PER_SCAN) {
          console.log(`[RevenueImmuneScanner] Reached max fixes per scan (${MAX_FIXES_PER_SCAN}), deferring remaining`);
          break;
        }

        if (processedProducts.has(issue.productId)) {
          continue;
        }

        const fix = await this.createFixAction(userId, issue, scanRecord.id);
        if (fix) {
          fixesApplied.push(fix);
          processedProducts.add(issue.productId);
        }
      }

      estimatedRevenueProtected = 0;

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

      console.log(`[RevenueImmuneScanner] Scan completed for user ${userId}: ${userProducts.length} products, ${issuesDetected.length} issues, ${fixesApplied.length} fix actions created`);

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

    const scanIssues = weeklyScans.reduce((sum, scan) => sum + (scan.issuesDetected ?? 0), 0);
    const scanFixes = weeklyScans.reduce((sum, scan) => sum + (scan.fixesApplied ?? 0), 0);
    const rollbacks = weeklyActions.filter(a => a.status === 'rolled_back').length;

    const actionIssuesDetected = weeklyActions.length;
    const actionFixesExecuted = weeklyActions.filter(a => a.status === 'completed').length;

    const weeklyAttributedRevenue = await db
      .select({ total: sql<string>`COALESCE(SUM(${revenueAttribution.revenueAmount}), 0)` })
      .from(revenueAttribution)
      .where(
        and(
          eq(revenueAttribution.userId, userId),
          gte(revenueAttribution.createdAt, startOfWeek)
        )
      );

    const realRevenue = parseFloat(weeklyAttributedRevenue[0]?.total ?? '0');

    return {
      scansPerformed: weeklyScans.length,
      issuesDetected: scanIssues + actionIssuesDetected,
      fixesExecuted: scanFixes + actionFixesExecuted,
      rollbacksNeeded: rollbacks,
      totalRevenueProtected: realRevenue,
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
