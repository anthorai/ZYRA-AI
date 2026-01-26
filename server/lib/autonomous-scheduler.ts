import cron from 'node-cron';
import { db, getUserById } from '../db';
import { autonomousActions, autonomousRules, automationSettings, products, seoMeta, pricingSettings } from '@shared/schema';
import { eq, and, lt, sql } from 'drizzle-orm';
import { competitorScraper } from './competitor-scraper';
import { pricingRulesEngine } from './pricing-rules-engine';
import { priceCalculator } from './price-calculator';

/**
 * Autonomous Job Scheduler
 * 
 * Manages scheduled tasks for autonomous operations:
 * - Daily SEO audits
 * - Product optimization checks
 * - Cart recovery triggers
 * - A/B test evaluations
 */

interface RuleCondition {
  type: string;
  metric?: string;
  threshold?: number;
  count_gt?: number;
  window?: number;
}

interface RuleAction {
  type: string;
  template_id?: string;
}

interface Rule {
  id: string;
  name: string;
  if: RuleCondition;
  then: RuleAction[];
  publish?: string;
  priority?: number;
  cooldown?: number;
}

// Track running jobs to prevent overlaps
const runningJobs = new Set<string>();

/**
 * Evaluate a rule condition against a product or entity
 */
async function evaluateRuleCondition(
  condition: RuleCondition,
  context: { productId?: string; userId?: string }
): Promise<boolean> {
  if (condition.type === 'metric_below') {
    if (!context.productId || !condition.metric || condition.threshold === undefined) {
      return false;
    }

    // Check SEO score
    if (condition.metric === 'seo_score') {
      const seoData = await db
        .select()
        .from(seoMeta)
        .where(eq(seoMeta.productId, context.productId))
        .limit(1);

      if (seoData.length > 0 && seoData[0].seoScore !== null) {
        return seoData[0].seoScore < condition.threshold;
      }
      // If no SEO score, consider it low
      return true;
    }
  }

  return false;
}

/**
 * Execute rule actions
 */
async function executeRuleActions(
  actions: RuleAction[],
  context: { productId?: string; userId: string; ruleId: string; dryRun?: boolean }
): Promise<void> {
  for (const action of actions) {
    const isDryRun = context.dryRun ?? false;
    console.log(`🔧 [Autonomous] ${isDryRun ? 'Preview' : 'Executing'} action: ${action.type} for product ${context.productId}`);

    // CRITICAL FIX: Check for existing pending/running actions BEFORE inserting
    // Include actionType to allow multi-action rules (e.g., optimize + notify)
    // For dry-run mode, also check for existing dry_run actions
    const statusFilter = isDryRun 
      ? sql`${autonomousActions.status} = 'dry_run'`
      : sql`${autonomousActions.status} IN ('pending', 'running')`;
    
    const existingAction = await db
      .select()
      .from(autonomousActions)
      .where(
        and(
          eq(autonomousActions.userId, context.userId),
          eq(autonomousActions.actionType, action.type),
          context.productId ? eq(autonomousActions.entityId, context.productId) : sql`true`,
          eq(autonomousActions.ruleId, context.ruleId),
          statusFilter
        )
      )
      .limit(1);

    if (existingAction.length > 0) {
      console.log(`⏭️  [Autonomous] Skipping duplicate ${action.type} action for product ${context.productId}`);
      continue; // Skip duplicate
    }

    // Create autonomous action record
    await db.insert(autonomousActions).values({
      userId: context.userId,
      actionType: action.type,
      entityType: 'product',
      entityId: context.productId,
      status: isDryRun ? 'dry_run' : 'pending',
      decisionReason: isDryRun 
        ? `[DRY RUN] Would be triggered by rule: ${context.ruleId}` 
        : `Triggered by rule: ${context.ruleId}`,
      ruleId: context.ruleId,
      executedBy: 'agent',
    });

    // Actual execution will happen in the action processor (unless dry-run)
  }
}

/**
 * Check cooldown for a rule + product combination
 */
async function checkCooldown(
  ruleId: string,
  productId: string,
  cooldownSeconds: number
): Promise<boolean> {
  const cooldownTime = new Date(Date.now() - cooldownSeconds * 1000);

  const recentActions = await db
    .select()
    .from(autonomousActions)
    .where(
      and(
        eq(autonomousActions.ruleId, ruleId),
        eq(autonomousActions.entityId, productId),
        sql`${autonomousActions.createdAt} > ${cooldownTime}`
      )
    )
    .limit(1);

  // If there are recent actions, cooldown is active
  return recentActions.length === 0;
}

/**
 * Daily SEO Audit Job
 * Scans all products with autopilot enabled and checks if they need SEO optimization
 */
export async function runDailySEOAudit(): Promise<void> {
  const jobId = 'daily-seo-audit';

  if (runningJobs.has(jobId)) {
    console.log('⏳ [SEO Audit] Already running, skipping...');
    return;
  }

  runningJobs.add(jobId);
  console.log('🤖 [SEO Audit] Starting daily SEO audit...');

  try {
    // Get all users with autopilot enabled (must have BOTH globalAutopilotEnabled AND autopilotEnabled = true)
    const usersWithAutopilot = await db
      .select()
      .from(automationSettings)
      .where(
        and(
          eq(automationSettings.globalAutopilotEnabled, true),
          eq(automationSettings.autopilotEnabled, true)
        )
      );

    console.log(`📊 [SEO Audit] Found ${usersWithAutopilot.length} users with autopilot enabled`);

    for (const settings of usersWithAutopilot) {
      try {
        // Check if user has SEO optimization enabled
        const enabledActions = settings.enabledActionTypes as string[];
        if (!enabledActions?.includes('optimize_seo')) {
          continue;
        }

        // Get user's active rules
        const userRules = await db
          .select()
          .from(autonomousRules)
          .where(
            and(
              eq(autonomousRules.userId, settings.userId),
              eq(autonomousRules.enabled, true)
            )
          )
          .orderBy(sql`${autonomousRules.priority} DESC`);

        // Also get global rules
        const globalRules = await db
          .select()
          .from(autonomousRules)
          .where(
            and(
              eq(autonomousRules.isGlobal, true),
              eq(autonomousRules.enabled, true)
            )
          )
          .orderBy(sql`${autonomousRules.priority} DESC`);

        const allRules = [...globalRules, ...userRules];

        // Get user's products
        const userProducts = await db
          .select()
          .from(products)
          .where(eq(products.userId, settings.userId));

        console.log(`🔍 [SEO Audit] Checking ${userProducts.length} products for user ${settings.userId}`);

        // SAFETY FIX: Enforce maxDailyActions limit
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todaysActions = await db
          .select()
          .from(autonomousActions)
          .where(
            and(
              eq(autonomousActions.userId, settings.userId),
              sql`${autonomousActions.createdAt} >= ${todayStart}`
            )
          );

        const maxDailyActions = settings.maxDailyActions ?? 10;
        const actionsRemaining = maxDailyActions - todaysActions.length;
        
        if (actionsRemaining <= 0) {
          console.log(`⏸️  [SEO Audit] User ${settings.userId} has reached daily action limit (${maxDailyActions})`);
          continue;
        }

        // SAFETY: Enforce maxCatalogChangePercent limit
        const totalProducts = userProducts.length;
        const maxCatalogChangePercent = settings.maxCatalogChangePercent ?? 5;
        // Ensure at least 1 product can be changed when autopilot is enabled
        const maxCatalogChanges = Math.max(1, Math.ceil(totalProducts * (maxCatalogChangePercent / 100)));
        
        // Get unique products changed today
        const uniqueProductsChanged = new Set(
          todaysActions.map((action: typeof autonomousActions.$inferSelect) => action.entityId)
        );
        
        const catalogChangesRemaining = maxCatalogChanges - uniqueProductsChanged.size;
        
        if (catalogChangesRemaining <= 0) {
          console.log(`⏸️  [SEO Audit] User ${settings.userId} has reached catalog change limit: ${uniqueProductsChanged.size}/${maxCatalogChanges} products (${maxCatalogChangePercent}%)`);
          continue;
        }

        console.log(`📊 [SEO Audit] User ${settings.userId} can change ${catalogChangesRemaining} more products today (${maxCatalogChangePercent}% limit)`);
        console.log(`📊 [SEO Audit] User ${settings.userId} can create ${actionsRemaining} more actions today`);

        let actionsCreated = 0;

        // Evaluate rules against each product
        for (const product of userProducts) {
          // Check if we've hit the daily limit mid-loop
          if (actionsCreated >= actionsRemaining) {
            console.log(`⏸️  [SEO Audit] Reached daily action limit for user ${settings.userId}`);
            break;
          }
          
          // Check if we've hit the catalog change limit mid-loop
          if (uniqueProductsChanged.size >= maxCatalogChanges) {
            console.log(`⏸️  [SEO Audit] Reached catalog change limit for user ${settings.userId}: ${uniqueProductsChanged.size}/${maxCatalogChanges} products`);
            break;
          }
          
          for (const rule of allRules) {
            try {
              const ruleJson = rule.ruleJson as Rule;

              // SAFETY FIX: Use ?? instead of || for null handling
              const cooldownSeconds = rule.cooldownSeconds ?? 86400;
              
              // Check cooldown
              const canRun = await checkCooldown(
                rule.id,
                product.id,
                cooldownSeconds
              );

              if (!canRun) {
                continue;
              }

              // Evaluate condition
              const matches = await evaluateRuleCondition(ruleJson.if, {
                productId: product.id,
                userId: settings.userId,
              });

              if (matches) {
                const isDryRun = settings.dryRunMode ?? false;
                console.log(`✅ [SEO Audit] Rule "${rule.name}" matched for product: ${product.name}${isDryRun ? ' (DRY RUN)' : ''}`);

                // Execute actions (or create dry-run preview)
                await executeRuleActions(ruleJson.then, {
                  productId: product.id,
                  userId: settings.userId,
                  ruleId: rule.id,
                  dryRun: isDryRun,
                });

                actionsCreated++;
                uniqueProductsChanged.add(product.id); // Track catalog changes
              }
            } catch (error) {
              console.error(`❌ [SEO Audit] Error evaluating rule ${rule.id}:`, error);
            }
          }
        }

        console.log(`✅ [SEO Audit] Created ${actionsCreated} actions for user ${settings.userId}`);
      } catch (error) {
        console.error(`❌ [SEO Audit] Error processing user ${settings.userId}:`, error);
      }
    }

    console.log('✅ [SEO Audit] Daily SEO audit completed');

    // Process all pending actions created by the audit
    console.log('🔄 [SEO Audit] Processing pending actions...');
    const { processPendingActions } = await import('./autonomous-action-processor');
    await processPendingActions();
  } catch (error) {
    console.error('❌ [SEO Audit] Fatal error:', error);
  } finally {
    runningJobs.delete(jobId);
  }
}

/**
 * Send morning report email to users with autopilot enabled
 * Shows what autonomous actions happened yesterday
 */
async function sendMorningReports(): Promise<void> {
  const jobId = 'morning-reports';
  
  if (runningJobs.has(jobId)) {
    console.log('⏭️  [Morning Reports] Already running, skipping');
    return;
  }

  runningJobs.add(jobId);

  try {
    console.log('📧 [Morning Reports] Starting morning report generation...');
    
    const { getDb } = await import('../db');
    const { automationSettings, autonomousActions, users } = await import('@shared/schema');
    const { sendEmail } = await import('../services/email-service');
    const { and, eq, sql } = await import('drizzle-orm');
    const db = getDb();

    // Get yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all users with autopilot enabled (must have BOTH globalAutopilotEnabled AND autopilotEnabled = true)
    const settings = await db
      .select()
      .from(automationSettings)
      .where(
        and(
          eq(automationSettings.globalAutopilotEnabled, true),
          eq(automationSettings.autopilotEnabled, true)
        )
      );

    console.log(`📊 [Morning Reports] Found ${settings.length} users with autopilot enabled`);

    let reportsSent = 0;

    for (const setting of settings) {
      try {
        // Get user info
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, setting.userId))
          .limit(1);

        if (user.length === 0 || !user[0].email) {
          console.log(`⏭️  [Morning Reports] No email for user ${setting.userId}`);
          continue;
        }

        // Get yesterday's actions for this user
        const actions = await db
          .select()
          .from(autonomousActions)
          .where(
            and(
              eq(autonomousActions.userId, setting.userId),
              sql`${autonomousActions.createdAt} >= ${yesterday}`,
              sql`${autonomousActions.createdAt} < ${today}`
            )
          );

        // Skip if no activity yesterday
        if (actions.length === 0) {
          console.log(`⏭️  [Morning Reports] No activity for user ${setting.userId}, skipping email`);
          continue;
        }

        // Calculate stats
        const totalActions = actions.length;
        const completed = actions.filter(a => a.status === 'completed').length;
        const failed = actions.filter(a => a.status === 'failed').length;
        const successRate = totalActions > 0 ? Math.round((completed / totalActions) * 100) : 0;
        const seoOptimizations = actions.filter(a => a.actionType === 'optimize_seo' && a.status === 'completed').length;
        const cartRecoveries = actions.filter(a => a.actionType === 'send_cart_recovery' && a.status === 'completed').length;

        // Send email
        await sendEmail({
          to: user[0].email,
          subject: `🌅 Morning Report: ${totalActions} Autonomous Actions Yesterday`,
          html: generateMorningReportHTML({
            userName: user[0].fullName || user[0].email.split('@')[0],
            totalActions,
            completed,
            failed,
            successRate,
            seoOptimizations,
            cartRecoveries,
            actions: actions.slice(0, 5), // Show top 5 actions
          }),
        });

        reportsSent++;
        console.log(`✅ [Morning Reports] Sent report to ${user[0].email}`);

      } catch (error) {
        console.error(`❌ [Morning Reports] Error sending report to user ${setting.userId}:`, error);
      }
    }

    console.log(`✅ [Morning Reports] Sent ${reportsSent} morning reports`);

  } catch (error) {
    console.error('❌ [Morning Reports] Fatal error:', error);
  } finally {
    runningJobs.delete(jobId);
  }
}

/**
 * Generate HTML for morning report email
 */
function generateMorningReportHTML(data: {
  userName: string;
  totalActions: number;
  completed: number;
  failed: number;
  successRate: number;
  seoOptimizations: number;
  cartRecoveries: number;
  actions: any[];
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
        .stat-card { background: #f7f7f7; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 32px; font-weight: bold; color: #667eea; margin: 0; }
        .stat-label { font-size: 14px; color: #666; margin: 5px 0 0 0; }
        .success { color: #10b981; }
        .section { background: white; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .section h2 { margin-top: 0; font-size: 18px; color: #333; }
        .action-item { padding: 12px; background: #f9f9f9; border-left: 3px solid #667eea; margin-bottom: 10px; border-radius: 4px; }
        .action-title { font-weight: bold; color: #333; }
        .action-meta { font-size: 13px; color: #666; margin-top: 4px; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge-success { background: #d1fae5; color: #065f46; }
        .badge-failed { background: #fee2e2; color: #991b1b; }
        .footer { text-align: center; color: #666; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌅 Good Morning, ${data.userName}!</h1>
        <p>Here's what your AI Store Manager did while you slept</p>
      </div>

      <div class="stats">
        <div class="stat-card">
          <p class="stat-value">${data.totalActions}</p>
          <p class="stat-label">Total Actions</p>
        </div>
        <div class="stat-card">
          <p class="stat-value success">${data.successRate}%</p>
          <p class="stat-label">Success Rate</p>
        </div>
        <div class="stat-card">
          <p class="stat-value">${data.seoOptimizations}</p>
          <p class="stat-label">Products Optimized</p>
        </div>
        <div class="stat-card">
          <p class="stat-value">${data.cartRecoveries}</p>
          <p class="stat-label">Cart Recoveries</p>
        </div>
      </div>

      ${data.actions.length > 0 ? `
        <div class="section">
          <h2>📋 Recent Actions</h2>
          ${data.actions.map(action => {
            const isCompleted = action.status === 'completed';
            const badgeClass = isCompleted ? 'badge-success' : 'badge-failed';
            const actionType = action.actionType === 'optimize_seo' ? '✨ SEO Optimization' : '🛒 Cart Recovery';
            
            return `
              <div class="action-item">
                <div class="action-title">${actionType}</div>
                <div class="action-meta">
                  <span class="badge ${badgeClass}">${isCompleted ? 'Completed' : 'Failed'}</span>
                  ${action.decisionReason ? `<br>${action.decisionReason}` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="${process.env.VITE_PUBLIC_URL || 'https://zyraai.com'}/ai-tools/activity-timeline" class="cta-button">
          View Full Activity Timeline
        </a>
      </div>

      <div class="footer">
        <p><strong>Zyra AI - Your Autonomous Store Manager</strong></p>
        <p>This is an automated report from your AI Store Manager.</p>
        <p>You're receiving this because you have Autopilot enabled.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Run daily pricing scan
 * Scrapes competitor prices and evaluates pricing rules
 */
async function runDailyPricingScan(): Promise<void> {
  const jobId = 'pricing-scan';
  
  if (runningJobs.has(jobId)) {
    console.log('⏭️  [Pricing Scan] Already running, skipping');
    return;
  }

  runningJobs.add(jobId);

  try {
    console.log('💰 [Pricing Scan] Starting daily pricing scan...');
    
    const { requireDb } = await import('../db');
    const { pricingSettings, autonomousActions, automationSettings } = await import('@shared/schema');
    const { eq, and, sql, gte } = await import('drizzle-orm');
    const db = requireDb();

    // Get all users with pricing automation enabled
    const settings = await db
      .select()
      .from(pricingSettings)
      .where(eq(pricingSettings.pricingAutomationEnabled, true));

    console.log(`📊 [Pricing Scan] Found ${settings.length} users with pricing automation enabled`);

    let totalActions = 0;

    for (const setting of settings) {
      try {
        const userId = setting.userId;

        // Check if autopilot is enabled for this user
        const [autoSettings] = await db
          .select()
          .from(automationSettings)
          .where(eq(automationSettings.userId, userId))
          .limit(1);

        if (!autoSettings || !autoSettings.globalAutopilotEnabled || !autoSettings.autopilotEnabled) {
          console.log(`⏭️  [Pricing Scan] Autopilot disabled for user ${userId}, skipping`);
          continue;
        }

        // Check if in dry-run mode
        const isDryRun = autoSettings.dryRunMode ?? false;

        // 1. Scrape competitor prices
        console.log(`🔍 [Pricing Scan] Scraping competitors for user ${userId}...`);
        const scrapeResult = await competitorScraper.scrapeAllForUser(userId);
        console.log(`✅ [Pricing Scan] Scraped ${scrapeResult.success} competitors (${scrapeResult.failed} failed)`);

        // 2. Evaluate pricing rules
        console.log(`📐 [Pricing Scan] Evaluating pricing rules for user ${userId}...`);
        const decisions = await pricingRulesEngine.evaluateAllProducts(userId);
        console.log(`💡 [Pricing Scan] Found ${decisions.length} products requiring price changes`);

        // 3. Check daily action limits
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const maxDailyActions = autoSettings.maxDailyActions || 10;
        
        const actionsToday = await db
          .select({ count: sql<number>`count(*)` })
          .from(autonomousActions)
          .where(
            and(
              eq(autonomousActions.userId, userId),
              eq(autonomousActions.actionType, 'price_change'),
              sql`${autonomousActions.createdAt} >= ${today}`
            )
          );

        const currentActionCount = Number(actionsToday[0]?.count || 0);
        const remainingActions = Math.max(0, maxDailyActions - currentActionCount);

        console.log(`📊 [Pricing Scan] User ${userId}: ${currentActionCount}/${maxDailyActions} daily actions used, ${remainingActions} remaining`);

        // 4. Check maxCatalogChangePercent limit from automation settings
        const { products: productsTable } = await import('@shared/schema');
        const totalProducts = await db
          .select({ count: sql<number>`count(*)` })
          .from(productsTable)
          .where(eq(productsTable.userId, userId));
        
        const productCount = Number(totalProducts[0]?.count || 0);
        const maxCatalogChangePercent = parseFloat(autoSettings.maxCatalogChangePercent || '20');
        
        // 🛡️ SAFETY: Ensure at least 1 product can change if catalog has products
        // Prevents small catalogs (<5 products at 20%) from being locked out
        let maxProductsToChange = Math.floor((productCount * maxCatalogChangePercent) / 100);
        if (productCount > 0 && maxProductsToChange === 0) {
          maxProductsToChange = 1; // Allow at least 1 change for small catalogs
        }
        
        // Apply most restrictive limit
        const effectiveLimit = Math.min(remainingActions, maxProductsToChange);
        
        console.log(`📊 [Pricing Scan] Catalog limits: ${productCount} total products, max ${maxProductsToChange} (${maxCatalogChangePercent}%) can change`);
        console.log(`📊 [Pricing Scan] Effective limit: ${effectiveLimit} changes allowed`);

        // 🛡️ SAFETY: Warn if effective limit is zero
        if (effectiveLimit === 0) {
          console.log(`⚠️  [Pricing Scan] User ${userId}: Effective limit is 0 - no price changes will be created`);
          if (remainingActions === 0) {
            console.log(`   Reason: Daily action limit reached (${currentActionCount}/${maxDailyActions} used today)`);
          } else if (maxProductsToChange === 0) {
            console.log(`   Reason: Catalog change limit too restrictive (${productCount} products * ${maxCatalogChangePercent}% = 0)`);
          }
          // Still log summary even if no actions created
          console.log(`📊 [Pricing Scan] User ${userId} summary:`);
          console.log(`   - Decisions evaluated: ${decisions.length}`);
          console.log(`   - Created: 0 price changes (limit is 0)`);
          console.log(`   - Postponed: ${decisions.length} decisions waiting for next run`);
          continue; // Skip to next user
        }

        // 5. Create price change actions - iterate until we hit the limit
        // This ensures cooldown skips don't waste the allowance
        let createdCount = 0;
        let skippedCooldown = 0;
        let skippedDuplicate = 0;
        let processedCount = 0;

        // Iterate through decisions until we create enough actions or run out
        for (const { productId, decision } of decisions) {
          // Stop if we've reached the effective limit
          if (createdCount >= effectiveLimit) {
            break;
          }
          
          processedCount++;
          // Check cooldown period (default 7 days) from automation settings
          const cooldownDays = parseFloat(autoSettings.changeCooldownDays || '7');
          const cooldownTime = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000);
          
          const recentPriceChanges = await db
            .select()
            .from(autonomousActions)
            .where(
              and(
                eq(autonomousActions.userId, userId),
                eq(autonomousActions.actionType, 'price_change'),
                eq(autonomousActions.entityId, productId),
                sql`${autonomousActions.status} = 'completed'`,
                sql`${autonomousActions.completedAt} > ${cooldownTime}`
              )
            )
            .limit(1);

          if (recentPriceChanges.length > 0) {
            const lastChange = recentPriceChanges[0].completedAt;
            const daysSince = Math.floor((Date.now() - new Date(lastChange!).getTime()) / (1000 * 60 * 60 * 24));
            console.log(`⏭️  [Pricing Scan] Skipping product ${productId}: changed ${daysSince} days ago (cooldown: ${cooldownDays} days)`);
            skippedCooldown++;
            continue;
          }

          // Check for existing pending/running actions
          const statusFilter = isDryRun 
            ? sql`${autonomousActions.status} = 'dry_run'`
            : sql`${autonomousActions.status} IN ('pending', 'running')`;
          
          const existingAction = await db
            .select()
            .from(autonomousActions)
            .where(
              and(
                eq(autonomousActions.userId, userId),
                eq(autonomousActions.actionType, 'price_change'),
                eq(autonomousActions.entityId, productId),
                statusFilter
              )
            )
            .limit(1);

          if (existingAction.length > 0) {
            console.log(`⏭️  [Pricing Scan] Skipping duplicate price_change for product ${productId}`);
            skippedDuplicate++;
            continue;
          }

          // 🛡️ SAFETY: Check if approval is required based on price change magnitude
          const requiresApproval = await priceCalculator.requiresApproval(
            userId,
            parseFloat(decision.currentMargin || '0'), // Using current margin as proxy for old price
            parseFloat(decision.newPrice || '0')
          );
          
          if (requiresApproval) {
            console.log(`🛡️ [Pricing Scan] Approval required for product ${productId}: change exceeds threshold`);
          }

          // Create autonomous action
          await db.insert(autonomousActions).values({
            userId,
            actionType: 'price_change',
            entityType: 'product',
            entityId: productId,
            status: isDryRun ? 'dry_run' : (requiresApproval ? 'pending_approval' : 'pending'),
            decisionReason: isDryRun 
              ? `[DRY RUN] ${decision.reasoning}` 
              : decision.reasoning,
            ruleId: decision.ruleId,
            payload: {
              oldPrice: decision.currentMargin, // TODO: get actual current price
              newPrice: decision.newPrice,
              competitorPrice: decision.competitorPrice,
              currentMargin: decision.currentMargin,
              newMargin: decision.newMargin,
            },
            executedBy: 'agent',
          });

          totalActions++;
          createdCount++;
          console.log(`✅ [Pricing Scan] Created price_change action for product ${productId} (${decision.newPrice})`);
        }

        // Log safety guardrail statistics with accurate tracking
        const notProcessed = Math.max(0, decisions.length - processedCount);
        const totalSkipped = skippedCooldown + skippedDuplicate;
        
        console.log(`📊 [Pricing Scan] User ${userId} summary:`);
        console.log(`   - Decisions evaluated: ${decisions.length}`);
        console.log(`   - Processed: ${processedCount}`);
        console.log(`   - Created: ${createdCount} price changes`);
        console.log(`   - Skipped total: ${totalSkipped}`);
        console.log(`     • Cooldown: ${skippedCooldown}`);
        console.log(`     • Duplicate: ${skippedDuplicate}`);
        console.log(`   - Not processed (limit reached): ${notProcessed}`);
        
        // Log why we stopped if there are unprocessed decisions
        if (notProcessed > 0) {
          if (createdCount >= effectiveLimit) {
            const limitType = effectiveLimit === remainingActions ? 'daily action limit' : 'catalog change limit';
            console.log(`⚠️  [Pricing Scan] Hit ${limitType} for user ${userId}: ${notProcessed} changes postponed to next run`);
          } else {
            console.log(`ℹ️  [Pricing Scan] ${notProcessed} decisions not processed (all eligible products processed)`);
          }
        }
        
        if (createdCount === 0 && decisions.length > 0) {
          console.log(`⚠️  [Pricing Scan] No actions created despite ${decisions.length} decisions (all skipped due to cooldown/duplicates)`);
        }
      } catch (error) {
        console.error(`❌ [Pricing Scan] Error processing user ${setting.userId}:`, error);
        continue;
      }
    }

    console.log(`✅ [Pricing Scan] Completed - created ${totalActions} price change actions`);
  } catch (error) {
    console.error('❌ [Pricing Scan] Error during pricing scan:', error);
  } finally {
    runningJobs.delete(jobId);
  }
}

/**
 * Run hourly marketing campaign scan
 * Evaluates customers for marketing automation triggers
 */
async function runMarketingCampaignScan(): Promise<void> {
  const jobId = 'marketing-scan';

  if (runningJobs.has(jobId)) {
    console.log('⏭️  [Marketing Scan] Already running, skipping');
    return;
  }

  runningJobs.add(jobId);

  try {
    console.log('📧 [Marketing Scan] Starting marketing campaign scan...');

    const { requireDb } = await import('../db');
    const { marketingAutomationRules, automationSettings, autonomousActions, abandonedCarts } = await import('@shared/schema');
    const { marketingRulesEngine } = await import('./marketing-rules-engine');
    const { eq, and, sql } = await import('drizzle-orm');
    const db = requireDb();

    // Get all users with autopilot enabled (must have BOTH globalAutopilotEnabled AND autopilotEnabled = true)
    const settings = await db
      .select()
      .from(automationSettings)
      .where(
        and(
          eq(automationSettings.globalAutopilotEnabled, true),
          eq(automationSettings.autopilotEnabled, true)
        )
      );

    console.log(`📊 [Marketing Scan] Found ${settings.length} users with autopilot enabled`);

    let totalCampaigns = 0;

    for (const setting of settings) {
      try {
        const userId = setting.userId;

        // Check if marketing actions are enabled
        const enabledActions = setting.enabledActionTypes as string[];
        if (!enabledActions?.includes('send_marketing_campaign')) {
          console.log(`⏭️  [Marketing Scan] Marketing campaigns disabled for user ${userId}`);
          continue;
        }

        // Check if in dry-run mode
        const isDryRun = setting.dryRunMode ?? false;

        // Get all active marketing automation rules for this user
        const rules = await db
          .select()
          .from(marketingAutomationRules)
          .where(and(
            eq(marketingAutomationRules.userId, userId),
            eq(marketingAutomationRules.enabled, true)
          ));

        if (rules.length === 0) {
          console.log(`⏭️  [Marketing Scan] No active marketing rules for user ${userId}`);
          continue;
        }

        console.log(`📐 [Marketing Scan] Evaluating marketing rules for user ${userId} (${rules.length} active rules)...`);

        // Evaluate all customers for this user
        const decisions = await marketingRulesEngine.evaluateAllCustomers(userId);
        console.log(`💡 [Marketing Scan] Found ${decisions.length} customers requiring campaigns`);

        if (decisions.length === 0) {
          continue;
        }

        // Check daily action limits
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const maxDailyActions = setting.maxDailyActions || 10;

        const actionsToday = await db
          .select({ count: sql<number>`count(*)` })
          .from(autonomousActions)
          .where(and(
            eq(autonomousActions.userId, userId),
            eq(autonomousActions.actionType, 'send_marketing_campaign'),
            sql`${autonomousActions.createdAt} >= ${today}`
          ));

        const actionCount = Number(actionsToday[0]?.count || 0);
        const remainingActions = Math.max(0, maxDailyActions - actionCount);

        if (remainingActions === 0) {
          console.log(`⚠️  [Marketing Scan] Daily action limit reached for user ${userId} (${actionCount}/${maxDailyActions})`);
          continue;
        }

        console.log(`📊 [Marketing Scan] User ${userId} can create ${remainingActions} more marketing actions today`);

        // Create campaign actions (respect daily limit)
        let created = 0;
        let skippedInvalid = 0;
        for (const { customerEmail, decision } of decisions.slice(0, remainingActions)) {
          try {
            // Validate decision has all required metadata
            if (!decision.shouldSendCampaign || !decision.ruleId) {
              continue;
            }

            if (!customerEmail || !Array.isArray(decision.channels) || decision.channels.length === 0) {
              console.warn(`⚠️  [Marketing Scan] Skipping invalid decision for ${customerEmail || 'unknown'} - missing customerEmail or channels (${JSON.stringify(decision.channels)})`);
              skippedInvalid++;
              continue;
            }

            // Create autonomous action for this campaign
            await db.insert(autonomousActions).values({
              userId,
              actionType: 'send_marketing_campaign',
              entityType: 'customer',
              entityId: customerEmail,
              status: isDryRun ? 'dry_run' : 'pending',
              decisionReason: decision.reason,
              ruleId: decision.ruleId,
              payload: {
                ruleId: decision.ruleId,
                customerEmail,
                channels: decision.channels,
                campaignTemplateId: decision.campaignTemplateId || null,
                triggerType: decision.metadata?.triggerType || 'unknown',
                cartId: decision.metadata?.context?.cartId || null,
              },
              estimatedImpact: {
                expectedAction: 'send_campaign',
                channels: decision.channels,
                templateId: decision.campaignTemplateId,
              },
              dryRun: isDryRun,
            });

            created++;
            totalCampaigns++;
            console.log(`✅ [Marketing Scan] Created campaign action for ${customerEmail} (rule: ${decision.ruleId}${isDryRun ? ' - DRY RUN' : ''})`);
          } catch (error) {
            console.error(`❌ [Marketing Scan] Error creating action for ${customerEmail}:`, error);
          }
        }

        if (skippedInvalid > 0) {
          console.warn(`⚠️  [Marketing Scan] Skipped ${skippedInvalid} invalid decisions (missing required metadata)`);
        }

        if (created > 0) {
          console.log(`✅ [Marketing Scan] Created ${created} marketing campaign actions for user ${userId}${isDryRun ? ' (DRY RUN)' : ''}`);
        }

        // Log if we hit limits
        if (decisions.length > remainingActions) {
          const skipped = decisions.length - remainingActions;
          console.log(`⚠️  [Marketing Scan] Skipped ${skipped} campaigns due to daily limit for user ${userId}`);
        }
      } catch (error) {
        console.error(`❌ [Marketing Scan] Error processing user ${setting.userId}:`, error);
        continue;
      }
    }

    console.log(`✅ [Marketing Scan] Completed - created ${totalCampaigns} marketing campaign actions`);
  } catch (error) {
    console.error('❌ [Marketing Scan] Error during marketing scan:', error);
  } finally {
    runningJobs.delete(jobId);
  }
}

/**
 * Run Unified ZYRA Revenue Loop
 * Uses the new unified loop controller: DETECT → DECIDE → EXECUTE → PROVE → LEARN
 * 
 * CORE LAW: If an action does NOT directly affect revenue,
 * ZYRA must NOT detect it, decide on it, execute it, or show it.
 */
async function runUnifiedZyraLoop(): Promise<void> {
  const jobId = 'zyra-unified-loop';
  if (runningJobs.has(jobId)) {
    console.log(`⏭️  [ZYRA Loop] Skipping unified loop - already running`);
    return;
  }

  runningJobs.add(jobId);
  console.log('🔄 [ZYRA Loop] Starting unified revenue loop...');

  try {
    const { zyraRevenueLoop } = await import('./zyra-revenue-loop');
    
    const settings = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.globalAutopilotEnabled, true));

    console.log(`📊 [ZYRA Loop] Found ${settings.length} users with revenue protection enabled`);

    for (const setting of settings) {
      try {
        const isDryRun = setting.dryRunMode ?? false;
        const hasAutonomy = setting.autopilotEnabled ?? false;
        
        console.log(`🔄 [ZYRA Loop] Running cycle for user ${setting.userId}`);
        console.log(`   Mode: ${hasAutonomy ? 'Autonomous (earned)' : 'Manual approval (default)'}${isDryRun ? ' [DRY RUN]' : ''}`);
        
        const result = await zyraRevenueLoop.runFullCycle(setting.userId, false);
        
        console.log(`   Revenue signals found: ${result.detected}`);
        console.log(`   Next move selected: ${result.decided ? 'Yes (awaiting approval)' : 'None available'}`);
        console.log(`   Actions executed: ${result.executed ? 'Yes' : 'No (requires approval)'}`);
        console.log(`   Revenue impact measured: ${result.proved} actions`);
        console.log(`   Intelligence updated: ${result.learned} patterns`);
        console.log(`   Cycle completed in ${result.cycleTime}ms`);
        
      } catch (error) {
        console.error(`❌ [ZYRA Loop] Error processing user ${setting.userId}:`, error);
      }
    }

    console.log('✅ [ZYRA Loop] Revenue protection cycle completed');
  } catch (error) {
    console.error('❌ [ZYRA Loop] Error during revenue loop:', error);
  } finally {
    runningJobs.delete(jobId);
  }
}

/**
 * Run Revenue Loop Scan (Legacy)
 * Executes the complete DETECT→DECIDE→EXECUTE→PROVE→LEARN cycle
 */
async function runRevenueLoopScan(): Promise<void> {
  const jobId = 'revenue-loop-scan';
  if (runningJobs.has(jobId)) {
    console.log(`⏭️  [Revenue Loop] Skipping - already running`);
    return;
  }

  runningJobs.add(jobId);
  console.log('🔄 [Revenue Loop] Starting revenue loop scan...');

  try {
    const { RevenueDetectionEngine } = await import('./revenue-detection-engine');
    const { RevenuePriorityService } = await import('./revenue-priority-service');
    const { RevenueExecutionEngine } = await import('./revenue-execution-engine');
    const { RevenueAttributionService } = await import('./revenue-attribution-service');
    const { StoreLearningService } = await import('./store-learning-service');

    const settings = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.globalAutopilotEnabled, true));

    console.log(`📊 [Revenue Loop] Found ${settings.length} users with autopilot enabled`);

    for (const setting of settings) {
      try {
        const detectionEngine = new RevenueDetectionEngine();
        const priorityService = new RevenuePriorityService();
        const executionEngine = new RevenueExecutionEngine();
        const attributionService = new RevenueAttributionService();
        const learningService = new StoreLearningService();

        console.log(`🔍 [Revenue Loop] DETECT phase for user ${setting.userId}`);
        const defaultTypes = ['seo_optimization', 'description_enhancement', 'general_optimization'];
        const enabledTypes = (setting.enabledActionTypes as string[]) || defaultTypes;
        
        await detectionEngine.detectSignals(setting.userId);
        
        const activeSignals = await detectionEngine.getActiveSignals(setting.userId, 20);
        const { revenueOpportunities } = await import('@shared/schema');
        console.log(`   Found ${activeSignals.length} active signals`);

        const signalTypeToOpportunityType: Record<string, string> = {
          'poor_seo_score': 'seo_optimization',
          'high_traffic_low_conversion': 'description_enhancement',
        };

        for (const signal of activeSignals) {
          if (signal.status !== 'detected') continue;
          
          const predictedOppType = signalTypeToOpportunityType[signal.signalType] || 'general_optimization';
          if (!enabledTypes.includes(predictedOppType)) {
            console.log(`   ⏭️  Signal ${signal.id} would create disabled type ${predictedOppType}`);
            continue;
          }
          
          const [existingOpp] = await db
            .select({ id: revenueOpportunities.id })
            .from(revenueOpportunities)
            .where(eq(revenueOpportunities.signalId, signal.id))
            .limit(1);
          
          if (existingOpp) {
            console.log(`   ⏭️  Signal ${signal.id} already has opportunity ${existingOpp.id}`);
            continue;
          }
          
          try {
            const oppId = await priorityService.createOpportunityFromSignal(signal.id);
            if (oppId) {
              console.log(`   📋 Created opportunity ${oppId} from signal ${signal.id}`);
            }
          } catch (error) {
            console.log(`   ⚠️  Failed to create opportunity from signal ${signal.id}:`, error);
          }
        }

        console.log(`⚡ [Revenue Loop] EXECUTE phase for user ${setting.userId}`);
        const maxActions = setting.maxDailyActions || 5;
        const pendingOpportunities = await priorityService.getPendingOpportunities(setting.userId, maxActions * 2);
        
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const executedToday = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(autonomousActions)
          .where(and(
            eq(autonomousActions.userId, setting.userId),
            eq(autonomousActions.status, 'completed'),
            sql`${autonomousActions.completedAt} >= ${todayStart.toISOString()}`
          ));
        const todayCount = executedToday[0]?.count || 0;
        const remainingToday = Math.max(0, maxActions - todayCount);
        console.log(`   Daily limit: ${maxActions}, executed today: ${todayCount}, remaining: ${remainingToday}`);
        
        let executedCount = 0;
        for (const opp of pendingOpportunities) {
          if (executedCount >= remainingToday) {
            console.log(`   ⏭️  Daily limit reached, stopping execution`);
            break;
          }
          if (!enabledTypes.includes(opp.opportunityType || 'seo_optimization')) {
            console.log(`   ⏭️  Skipping ${opp.id} - type ${opp.opportunityType} not enabled`);
            continue;
          }
          const result = await executionEngine.executeOpportunity(opp.id);
          if (result.success) {
            console.log(`   ✅ Executed opportunity ${opp.id} (${result.creditsUsed} credits)`);
            executedCount++;
          }
        }

        console.log(`📏 [Revenue Loop] PROVE phase for user ${setting.userId}`);
        const { revenueLoopProof } = await import('@shared/schema');
        const provingOpportunities = await attributionService.getOpportunitiesReadyForProving(20);
        const provenOpportunityIds: string[] = [];
        
        for (const opp of provingOpportunities) {
          if (opp.userId !== setting.userId) continue;
          const attribution = await attributionService.measureOpportunityImpact(opp.id);
          if (attribution) {
            provenOpportunityIds.push(opp.id);
            if (attribution.verdict === 'success') {
              console.log(`   ✅ Proven success: ${opp.id} with $${attribution.revenueDelta.toFixed(2)} revenue delta`);
            } else if (attribution.verdict === 'negative') {
              console.log(`   ⚠️  Proven negative: ${opp.id} (rollback: ${attribution.shouldRollback})`);
            } else {
              console.log(`   📊 Proven ${attribution.verdict}: ${opp.id}`);
            }
          }
        }

        console.log(`🧠 [Revenue Loop] LEARN phase for user ${setting.userId}`);
        
        for (const oppId of provenOpportunityIds) {
          const [proof] = await db
            .select()
            .from(revenueLoopProof)
            .where(eq(revenueLoopProof.opportunityId, oppId))
            .orderBy(sql`${revenueLoopProof.createdAt} DESC`)
            .limit(1);
          
          if (proof) {
            try {
              await learningService.learnFromAttribution(proof.id);
              console.log(`   📚 Learned from proof ${proof.id} (verdict: ${proof.verdict})`);
            } catch (error) {
              console.log(`   ⚠️  Error learning from proof ${proof.id}:`, error);
            }
          }
        }
        
        const stats = await learningService.getStoreLearningStats(setting.userId);
        console.log(`   Store learning stats: ${stats.totalInsights || 0} insights, ${stats.successfulPatterns || 0} successful patterns`);

      } catch (error) {
        console.error(`❌ [Revenue Loop] Error processing user ${setting.userId}:`, error);
      }
    }

    console.log('✅ [Revenue Loop] Completed revenue loop scan');
  } catch (error) {
    console.error('❌ [Revenue Loop] Error during revenue loop scan:', error);
  } finally {
    runningJobs.delete(jobId);
  }
}

/**
 * Initialize autonomous scheduler
 * Sets up cron jobs for various autonomous tasks
 */
export function initializeAutonomousScheduler(): void {
  console.log('🤖 [Autonomous Scheduler] Initializing...');

  // Daily SEO Audit - runs every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ [Scheduler] Triggering daily SEO audit...');
    await runDailySEOAudit();
  });

  // Morning Report Email - runs every day at 8 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ [Scheduler] Sending morning reports...');
    await sendMorningReports();
  });

  // Daily Pricing Scan - runs every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ [Scheduler] Running daily pricing scan...');
    await runDailyPricingScan();
  });

  // Hourly Marketing Campaign Scan - runs every hour at :15
  cron.schedule('15 * * * *', async () => {
    console.log('⏰ [Scheduler] Running marketing campaign scan...');
    await runMarketingCampaignScan();
  });

  // Unified ZYRA Loop - runs every 15 minutes (primary loop)
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ [Scheduler] Running unified ZYRA revenue loop...');
    await runUnifiedZyraLoop();
  });

  // Legacy Revenue Loop Scan - runs every 30 minutes (fallback)
  cron.schedule('*/30 * * * *', async () => {
    console.log('⏰ [Scheduler] Running legacy revenue loop scan...');
    await runRevenueLoopScan();
  });

  console.log('✅ [Autonomous Scheduler] Initialized - ZYRA Loop (Every 15 min), Daily SEO audit (2 AM), Morning Reports (8 AM), Pricing Scan (Midnight), Marketing Campaigns (Hourly at :15), and Legacy Revenue Loop (Every 30 min)');
}
