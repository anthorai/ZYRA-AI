import cron from 'node-cron';
import { db, getUserById } from '../db';
import { autonomousActions, autonomousRules, automationSettings, products, seoMeta } from '@shared/schema';
import { eq, and, lt, sql } from 'drizzle-orm';

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
    // Get all users with autopilot enabled
    const usersWithAutopilot = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.autopilotEnabled, true));

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

  // For testing, also run every 5 minutes (comment out in production)
  // cron.schedule('*/5 * * * *', async () => {
  //   console.log('⏰ [Scheduler] Running test SEO audit...');
  //   await runDailySEOAudit();
  // });

  console.log('✅ [Autonomous Scheduler] Initialized - Daily SEO audit scheduled for 2 AM');
}
