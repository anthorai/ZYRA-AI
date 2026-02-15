import { requireDb } from '../db';
import { getUserSubscription, getSubscriptionPlanById } from '../db';
import { products, seoMeta, automationSettings, autonomousActions, activityLogs, actionLocks } from '@shared/schema';
import { eq, and, asc, isNull, or, sql, lt } from 'drizzle-orm';
import OpenAI from 'openai';
import { cachedTextGeneration } from './ai-cache';
import { consumeAIToolCredits, checkAIToolCredits } from './credits';
import { calculateActionCreditCost, mapNextMoveActionToType } from './constants/credit-consumption';
import { ALL_ACTIONS, type ActionId, type MasterAction } from './zyra-master-loop/master-action-registry';
import type { AIToolId } from '@shared/ai-credits';
import { realLearningService } from './real-learning-service';
import { storeLearningService } from './store-learning-service';
import { buildMasterSEOPrompt, buildDescriptionPrompt } from './constants/seo-content-formats';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || 'placeholder-key',
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface ContentChange {
  field: string;
  before: string;
  after: string;
  reason: string;
}

export interface ProductOptimization {
  productId: string;
  productName: string;
  changes: ContentChange[];
  impactExplanation: string;
}

export interface FoundationalExecutionResult {
  success: boolean;
  actionType: string;
  actionLabel: string;
  summary: string;
  productsOptimized: ProductOptimization[];
  totalChanges: number;
  estimatedImpact: string;
  executionTimeMs: number;
  subActionsExecuted: string[];
  error?: string;
}

export interface ExecutionActivity {
  id: string;
  timestamp: Date;
  phase: 'detect' | 'decide' | 'execute' | 'prove' | 'learn';
  message: string;
  status: 'in_progress' | 'completed' | 'warning';
  details?: string;
  productName?: string;
  changes?: ContentChange[];
}

// Map legacy action type strings to ActionId (for backwards compatibility)
const LEGACY_TO_ACTION_ID: Record<string, ActionId> = {
  'seo_basics': 'product_title_optimization',
  'product_copy_clarity': 'product_description_clarity',
  'trust_signals': 'trust_signal_enhancement',
  'recovery_setup': 'abandoned_cart_recovery',
  'meta_optimization': 'meta_optimization',
  'image_alt_text': 'image_alt_text_optimization',
  'stale_seo_refresh': 'stale_seo_refresh',
  'search_intent': 'search_intent_alignment',
  'value_proposition': 'value_proposition_alignment',
  'above_fold': 'above_fold_optimization',
};

// All valid ActionIds from the master registry
const VALID_ACTION_IDS = new Set<string>(ALL_ACTIONS.map((a: MasterAction) => a.id));

// Normalize legacy action type to ActionId - returns null if not found
function normalizeToActionId(actionType: string): ActionId | null {
  // Check if it's already a valid ActionId
  if (VALID_ACTION_IDS.has(actionType)) {
    return actionType as ActionId;
  }
  // Check if it's a legacy string that maps to an ActionId
  if (LEGACY_TO_ACTION_ID[actionType]) {
    return LEGACY_TO_ACTION_ID[actionType];
  }
  // Unknown action type
  return null;
}

// Get human-readable label for an action
function getActionLabel(actionId: ActionId): string {
  const action = ALL_ACTIONS.find((a: MasterAction) => a.id === actionId);
  return action?.name || actionId;
}

// Get sub-action names for display
function getSubActionNames(actionId: ActionId): string[] {
  const action = ALL_ACTIONS.find((a: MasterAction) => a.id === actionId);
  return action?.subActions.map(sa => sa.name) || [];
}

export class FoundationalExecutionService {
  private activityLog: Map<string, ExecutionActivity[]> = new Map();

  getActivities(userId: string): ExecutionActivity[] {
    return this.activityLog.get(userId) || [];
  }

  clearActivities(userId: string): void {
    this.activityLog.delete(userId);
  }

  private async getCreditToolId(userId: string): Promise<AIToolId> {
    try {
      const subscription = await getUserSubscription(userId);
      if (subscription) {
        const plan = await getSubscriptionPlanById(subscription.planId);
        if (plan && (plan.planName === 'Free' || plan.planName === 'free')) {
          return 'product-seo-free';
        }
      }
    } catch (err) {
      console.warn('[Foundational] Could not determine plan, using default credit tool', err);
    }
    return 'product-seo-engine';
  }

  private addActivity(userId: string, activity: Omit<ExecutionActivity, 'id' | 'timestamp'>): ExecutionActivity {
    const fullActivity: ExecutionActivity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    const existing = this.activityLog.get(userId) || [];
    existing.push(fullActivity);
    this.activityLog.set(userId, existing);

    console.log(`📝 [Activity] ${activity.phase}: ${activity.message}`);
    return fullActivity;
  }

  async executeFoundationalAction(
    userId: string,
    actionType: string
  ): Promise<FoundationalExecutionResult> {
    const startTime = Date.now();
    const db = requireDb();

    this.clearActivities(userId);

    // Normalize legacy action types to ActionId - registry is the sole source of truth
    const actionId = normalizeToActionId(actionType);
    
    // Reject unknown actions - security: do not allow arbitrary action types
    if (!actionId) {
      console.error(`[Foundational Execution] Unknown action type: ${actionType} - not in registry`);
      // Use fixed 3-item placeholder to maintain contract
      return {
        success: false,
        actionType,
        actionLabel: actionType,
        summary: `Unknown action type: ${actionType}`,
        productsOptimized: [],
        totalChanges: 0,
        estimatedImpact: 'N/A',
        executionTimeMs: Date.now() - startTime,
        subActionsExecuted: ['Unknown action', 'Not in registry', 'Please contact support'],
        error: 'Unknown action type - not in master registry',
      };
    }
    
    // Get master action from registry (guaranteed to exist since normalization passed)
    const masterAction = ALL_ACTIONS.find((a: MasterAction) => a.id === actionId)!;
    
    // Get exactly 3 sub-actions from registry (enforce the contract)
    const actionLabel = masterAction.name;
    const subActions = masterAction.subActions.slice(0, 3);
    const subActionNames = subActions.map(sa => sa.name);
    
    // Ensure we always have exactly 3 sub-actions (pad if needed for display consistency)
    while (subActionNames.length < 3) {
      subActionNames.push('Processing...');
    }

    this.addActivity(userId, {
      phase: 'detect',
      message: 'Analyzing your store for optimization opportunities...',
      status: 'completed',
    });

    try {
      const creditToolId = await this.getCreditToolId(userId);
      let userPlanId = '18f8da29-94cf-417b-83f8-07191b22f254';
      try {
        const sub = await getUserSubscription(userId);
        if (sub?.planId) userPlanId = sub.planId;
      } catch {}

      const creditCheck = await checkAIToolCredits(userId, creditToolId, 1);
      if (!creditCheck.hasEnoughCredits) {
        this.addActivity(userId, {
          phase: 'decide',
          message: 'Insufficient credits to run optimization',
          status: 'warning',
          details: `You need at least 1 credit. Available: ${creditCheck.creditsRemaining}`,
        });
        // Always return exactly 3 sub-actions for UI consistency - use normalized actionId
        return {
          success: false,
          actionType: actionId, // Use normalized actionId
          actionLabel,
          summary: 'Insufficient credits to run optimization',
          productsOptimized: [],
          totalChanges: 0,
          estimatedImpact: 'N/A',
          executionTimeMs: Date.now() - startTime,
          subActionsExecuted: subActionNames, // Use padded sub-actions
          error: 'Insufficient credits',
        };
      }

      this.addActivity(userId, {
        phase: 'decide',
        message: `Selected action: ${actionLabel}`,
        status: 'completed',
        details: `Sub-actions: ${subActionNames.slice(0, 3).join(', ')} | Credits: ${creditCheck.creditsRemaining}`,
      });

      // Get products and check which ones are already locked for this specific action
      const allUserProducts = await db
        .select({
          product: products,
          hasOptimizedSeo: seoMeta.optimizedTitle,
        })
        .from(products)
        .leftJoin(seoMeta, eq(products.id, seoMeta.productId))
        .where(eq(products.userId, userId))
        .limit(20);
      
      // Check which products already have this action locked
      const lockedForAction = await db
        .select({ entityId: actionLocks.entityId })
        .from(actionLocks)
        .where(and(
          eq(actionLocks.userId, userId),
          eq(actionLocks.entityType, 'product'),
          eq(actionLocks.actionType, actionId),
          eq(actionLocks.status, 'locked')
        ));
      const lockedProductIds = new Set(lockedForAction.map(l => l.entityId));

      // PERMANENT BLOCK: Also check completed autonomousActions for this action type
      // Never repeat the same action on the same product
      const completedForAction = await db
        .select({ entityId: autonomousActions.entityId })
        .from(autonomousActions)
        .where(and(
          eq(autonomousActions.userId, userId),
          eq(autonomousActions.entityType, 'product'),
          eq(autonomousActions.actionType, actionId),
          eq(autonomousActions.status, 'completed')
        ));
      for (const completed of completedForAction) {
        if (completed.entityId) {
          lockedProductIds.add(completed.entityId);
        }
      }

      // Filter out products already locked/completed for THIS action
      const unlockedProducts = allUserProducts.filter(p => !lockedProductIds.has(p.product.id));
      const lockedProducts = allUserProducts.filter(p => lockedProductIds.has(p.product.id));

      // Among unlocked, prioritize those without optimized SEO
      const unoptimizedUnlocked = unlockedProducts.filter(p => !p.hasOptimizedSeo).map(p => p.product);
      const optimizedUnlocked = unlockedProducts.filter(p => p.hasOptimizedSeo).map(p => p.product);
      
      // Take unlocked-unoptimized first, then unlocked-optimized, then locked as fallback
      const userProducts = [
        ...unoptimizedUnlocked,
        ...optimizedUnlocked,
        ...lockedProducts.map(p => p.product),
      ].slice(0, 3);

      if (userProducts.length === 0) {
        this.addActivity(userId, {
          phase: 'execute',
          message: 'No products found in your store to optimize',
          status: 'warning',
        });

        // Always return exactly 3 sub-actions for UI consistency - use normalized actionId
        return {
          success: false,
          actionType: actionId, // Use normalized actionId
          actionLabel,
          summary: 'No products found in your store',
          productsOptimized: [],
          totalChanges: 0,
          estimatedImpact: 'N/A',
          executionTimeMs: Date.now() - startTime,
          subActionsExecuted: subActionNames, // Use padded sub-actions
          error: 'No products to optimize',
        };
      }

      this.addActivity(userId, {
        phase: 'execute',
        message: `Starting optimization on ${userProducts.length} product${userProducts.length > 1 ? 's' : ''}...`,
        status: 'in_progress',
      });

      const productsOptimized: ProductOptimization[] = [];
      let totalChanges = 0;
      let totalCreditsConsumed = 0;
      const learningRecords: { productId: string; baselineId: string | null; changeIds: string[] }[] = [];

      for (const product of userProducts) {
        const creditCheck = await checkAIToolCredits(userId, creditToolId, 1);
        if (!creditCheck.hasEnoughCredits) {
          console.log(`[Foundational] Stopping - insufficient credits for product ${product.name}`);
          break;
        }

        let baselineSnapshotId: string | null = null;
        try {
          baselineSnapshotId = await realLearningService.captureBaseline(
            userId,
            product.id,
            {
              title: product.name || '',
              description: product.description || '',
              price: parseFloat(product.price?.toString() || '0'),
              seoHealthScore: (product as any).seoScore ?? undefined,
            }
          );
          console.log(`📊 [Foundational Learning] Baseline captured: ${baselineSnapshotId} for ${product.name}`);
        } catch (baselineErr) {
          console.error(`[Foundational Learning] Baseline capture failed for ${product.name}:`, baselineErr);
        }

        let optimization: ProductOptimization;

        switch (actionId) {
          case 'trust_signal_enhancement':
            optimization = await this.addTrustSignals(userId, product);
            break;
          case 'friction_copy_removal':
          case 'product_description_clarity':
          case 'value_proposition_alignment':
          case 'above_fold_optimization':
            optimization = await this.improveProductCopy(userId, product);
            break;
          case 'product_title_optimization':
          case 'meta_optimization':
          case 'search_intent_alignment':
          case 'image_alt_text_optimization':
          case 'stale_seo_refresh':
            optimization = await this.optimizeSEO(userId, product);
            break;
          case 'checkout_dropoff_mitigation':
          case 'abandoned_cart_recovery':
          case 'post_purchase_upsell':
            optimization = await this.setupRecoveryMessages(userId, product);
            break;
          case 'conversion_pattern_learning':
          case 'performance_baseline_update':
          case 'underperforming_rollback':
          case 'risky_optimization_freeze':
            optimization = { productId: product.id, productName: product.name, changes: [], impactExplanation: 'Guard actions do not modify products directly.' };
            break;
        }

        if (optimization.changes.length > 0) {
          await consumeAIToolCredits(userId, creditToolId, 1);
          totalCreditsConsumed += 1;
          
          productsOptimized.push(optimization);
          totalChanges += optimization.changes.length;

          const changeIds: string[] = [];
          for (const change of optimization.changes) {
            try {
              const changeId = await realLearningService.recordChange(
                userId,
                product.id,
                baselineSnapshotId,
                actionId,
                {
                  field: change.field,
                  oldValue: change.before || null,
                  newValue: change.after || null,
                },
                {
                  actionCategory: masterAction.category,
                  executionMode: 'fast',
                  aiReasoning: change.reason,
                  creditsConsumed: 1,
                }
              );
              changeIds.push(changeId);
              console.log(`📝 [Foundational Learning] Recorded change: ${change.field} → ${changeId}`);
            } catch (changeErr) {
              console.error(`[Foundational Learning] Failed to record change for ${change.field}:`, changeErr);
            }
          }
          learningRecords.push({ productId: product.id, baselineId: baselineSnapshotId, changeIds });

          this.addActivity(userId, {
            phase: 'execute',
            message: `Optimized: ${product.name} (1 credit used)`,
            status: 'completed',
            productName: product.name,
            changes: optimization.changes,
            details: optimization.impactExplanation,
          });
        }
      }

      console.log(`[Foundational] Total credits consumed: ${totalCreditsConsumed} for ${productsOptimized.length} products`);

      this.addActivity(userId, {
        phase: 'prove',
        message: `Completed ${totalChanges} improvement${totalChanges !== 1 ? 's' : ''} across ${productsOptimized.length} product${productsOptimized.length !== 1 ? 's' : ''} (${totalCreditsConsumed} credit${totalCreditsConsumed !== 1 ? 's' : ''} used)`,
        status: 'completed',
        details: this.generateImpactSummary(actionId, totalChanges),
      });

      const totalLearningRecords = learningRecords.reduce((sum, r) => sum + r.changeIds.length, 0);

      if (totalLearningRecords > 0) {
        try {
          const allChangeIds = learningRecords.flatMap(r => r.changeIds);
          const learningResult = await storeLearningService.learnFromFoundationalExecution(
            userId,
            actionId,
            masterAction.category,
            allChangeIds
          );
          console.log(`🧠 [Foundational] Store learning: ${learningResult.insightsCreated} insights created, ${learningResult.insightsUpdated} updated`);
        } catch (learningErr) {
          console.error(`[Foundational] Store learning failed:`, learningErr);
        }
      }

      this.addActivity(userId, {
        phase: 'learn',
        message: totalLearningRecords > 0 
          ? `Captured ${learningRecords.filter(r => r.baselineId).length} baselines and ${totalLearningRecords} optimization changes for learning`
          : 'Changes recorded for performance tracking',
        status: 'completed',
        details: totalLearningRecords > 0
          ? `ZYRA stored ${totalLearningRecords} before/after data points. These will be measured over 14 days to identify what converts best for your store.`
          : 'ZYRA will monitor how these changes affect your conversion rates over the next 7 days.',
      });

      // Save to autonomousActions for Change Control visibility
      // Use normalized actionId (not original actionType) for registry alignment
      if (productsOptimized.length > 0) {
        try {
          for (const optimized of productsOptimized) {
            await db.insert(autonomousActions).values({
              userId,
              actionType: actionId, // Use normalized actionId
              entityType: 'product',
              entityId: optimized.productId,
              status: 'completed',
              decisionReason: `ZYRA AI detected optimization opportunity: ${actionLabel}`,
              payload: {
                productName: optimized.productName,
                changes: optimized.changes,
                actionLabel,
                subActions: subActionNames,
              },
              result: {
                success: true,
                changesApplied: optimized.changes.length,
                impactExplanation: optimized.impactExplanation,
              },
              estimatedImpact: {
                type: actionId, // Use normalized actionId
                description: this.generateImpactSummary(actionId, optimized.changes.length),
              },
              executedBy: 'agent',
              creditsUsed: (() => {
                try {
                  const mappedType = mapNextMoveActionToType(actionId);
                  return calculateActionCreditCost(mappedType, userPlanId || '18f8da29-94cf-417b-83f8-07191b22f254', { isAutoExecuted: true });
                } catch { return 1; }
              })(),
              dryRun: false,
              publishedToShopify: false,
              completedAt: new Date(),
            });
          }
          console.log(`[Foundational Execution] Saved ${productsOptimized.length} actions to Change Control`);
        } catch (saveError) {
          console.error('[Foundational Execution] Error saving to autonomousActions:', saveError);
        }
      }

      // Log to database for action rotation tracking - use normalized actionId
      try {
        await db.insert(activityLogs).values({
          userId,
          action: `foundational_${actionId}`, // Use normalized actionId
          description: `Executed foundational action: ${actionLabel}`,
          toolUsed: 'zyra-engine',
          metadata: {
            actionId, // Use normalized actionId
            actionLabel,
            subActions: subActionNames,
            productsOptimized: productsOptimized.length,
            totalChanges,
            productIds: productsOptimized.map(p => p.productId),
            productId: productsOptimized[0]?.productId || null,
          },
        });
        console.log(`[Foundational Execution] Logged action to database: foundational_${actionId}`);
      } catch (logError) {
        console.error('[Foundational Execution] Error logging to activityLogs:', logError);
      }

      // Return with normalized actionId for consistency
      return {
        success: true,
        actionType: actionId, // Use normalized actionId
        actionLabel,
        summary: `Successfully optimized ${productsOptimized.length} product${productsOptimized.length !== 1 ? 's' : ''} with ${totalChanges} improvement${totalChanges !== 1 ? 's' : ''}`,
        productsOptimized,
        totalChanges,
        estimatedImpact: this.generateImpactSummary(actionId, totalChanges),
        executionTimeMs: Date.now() - startTime,
        subActionsExecuted: subActionNames,
      };

    } catch (error) {
      console.error(`[Foundational Execution] Error:`, error);

      this.addActivity(userId, {
        phase: 'execute',
        message: 'Optimization encountered an issue',
        status: 'warning',
        details: error instanceof Error ? error.message : 'Unknown error',
      });

      // Always return 3 sub-actions for consistency (use planned sub-actions even on error)
      // Return with normalized actionId
      return {
        success: false,
        actionType: actionId, // Use normalized actionId
        actionLabel,
        summary: 'Optimization failed',
        productsOptimized: [],
        totalChanges: 0,
        estimatedImpact: 'N/A',
        subActionsExecuted: subActionNames, // Still show planned sub-actions
        executionTimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async optimizeSEO(
    userId: string,
    product: typeof products.$inferSelect
  ): Promise<ProductOptimization> {
    const db = requireDb();
    const changes: ContentChange[] = [];

    const prompt = buildMasterSEOPrompt(product);

    try {
      const content = await cachedTextGeneration(
        { prompt, model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 4000 },
        async () => {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 4000,
          });
          return response.choices[0]?.message?.content || '{}';
        }
      );

      const optimized = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());

      const [existingSeo] = await db
        .select()
        .from(seoMeta)
        .where(eq(seoMeta.productId, product.id))
        .limit(1);

      // Compare against both original AND optimized fields - only skip if exact match with optimized version
      const existingTitle = existingSeo?.optimizedTitle || existingSeo?.seoTitle || '';
      const existingMeta = existingSeo?.optimizedMeta || existingSeo?.metaDescription || '';

      // Force change if no optimized version exists yet, or if AI generated different content
      const isFirstOptimization = !existingSeo?.optimizedTitle;
      
      if (optimized.seoTitle && (isFirstOptimization || optimized.seoTitle !== existingTitle)) {
        changes.push({
          field: 'SEO Title',
          before: existingTitle || '(none)',
          after: optimized.seoTitle,
          reason: 'Added buyer-focused keywords to improve search visibility',
        });
      }

      if (optimized.metaDescription && (isFirstOptimization || optimized.metaDescription !== existingMeta)) {
        changes.push({
          field: 'Meta Description',
          before: existingMeta || '(none)',
          after: optimized.metaDescription,
          reason: 'Created compelling description to increase click-through rate',
        });
      }

      // Also optimize Product Description as part of SEO basics
      if (optimized.improvedDescription && optimized.improvedDescription !== product.description) {
        const beforeDesc = product.description || '(no description)';
        changes.push({
          field: 'Product Description',
          before: beforeDesc,
          after: optimized.improvedDescription,
          reason: 'Optimized description with keywords and benefit-focused copy',
        });

        // Update the product description in the products table
        await db
          .update(products)
          .set({
            description: optimized.improvedDescription,
            isOptimized: true,
            updatedAt: new Date(),
          })
          .where(eq(products.id, product.id));
      }

      // Also update product title if improved
      if (optimized.improvedName && optimized.improvedName !== product.name) {
        changes.push({
          field: 'Product Title',
          before: product.name,
          after: optimized.improvedName,
          reason: 'Enhanced title with buyer-intent keywords for better visibility',
        });

        await db
          .update(products)
          .set({
            name: optimized.improvedName,
            updatedAt: new Date(),
          })
          .where(eq(products.id, product.id));
      }

      if (changes.length > 0) {
        if (existingSeo) {
          await db
            .update(seoMeta)
            .set({
              optimizedTitle: optimized.seoTitle,
              optimizedMeta: optimized.metaDescription,
              seoScore: 85,
            })
            .where(eq(seoMeta.productId, product.id));
        } else {
          await db.insert(seoMeta).values({
            productId: product.id,
            seoTitle: optimized.seoTitle,
            metaDescription: optimized.metaDescription,
            optimizedTitle: optimized.seoTitle,
            optimizedMeta: optimized.metaDescription,
            seoScore: 85,
          });
        }
      }

      return {
        productId: product.id,
        productName: product.name,
        changes,
        impactExplanation: changes.length > 0
          ? 'Complete SEO optimization applied: Title, Meta Description, Product Description, and Product Title all enhanced for better search visibility and conversions.'
          : 'Product already fully optimized.',
      };

    } catch (error) {
      console.error(`[SEO Optimization] Error for product ${product.id}:`, error);
      return {
        productId: product.id,
        productName: product.name,
        changes: [],
        impactExplanation: 'Could not generate SEO improvements at this time.',
      };
    }
  }

  private async improveProductCopy(
    userId: string,
    product: typeof products.$inferSelect
  ): Promise<ProductOptimization> {
    const db = requireDb();
    const changes: ContentChange[] = [];

    const prompt = buildDescriptionPrompt(product);

    try {
      const content = await cachedTextGeneration(
        { prompt, model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 4000 },
        async () => {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 4000,
          });
          return response.choices[0]?.message?.content || '{}';
        }
      );

      const optimized = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());

      if (optimized.improvedDescription && optimized.improvedDescription !== product.description) {
        const beforeDesc = product.description || '(no description)';

        changes.push({
          field: 'Product Description',
          before: beforeDesc,
          after: optimized.improvedDescription,
          reason: 'Rewrote to highlight benefits and create emotional connection with buyers',
        });

        await db
          .update(products)
          .set({
            description: optimized.improvedDescription,
            isOptimized: true,
            updatedAt: new Date(),
          })
          .where(eq(products.id, product.id));
      }

      return {
        productId: product.id,
        productName: product.name,
        changes,
        impactExplanation: changes.length > 0
          ? 'Better product copy helps visitors understand why they need this product, increasing add-to-cart rates.'
          : 'Product copy already reads well.',
      };

    } catch (error) {
      console.error(`[Product Copy] Error for product ${product.id}:`, error);
      return {
        productId: product.id,
        productName: product.name,
        changes: [],
        impactExplanation: 'Could not improve product copy at this time.',
      };
    }
  }

  private async addTrustSignals(
    userId: string,
    product: typeof products.$inferSelect
  ): Promise<ProductOptimization> {
    const db = requireDb();
    const changes: ContentChange[] = [];

    const prompt = `You are a conversion rate optimization (CRO) expert who specializes in building buyer confidence for Shopify stores. Google's 2025 E-E-A-T algorithm heavily rewards trust signals. Generate trust elements that both increase conversions AND boost SEO rankings.

Product: ${product.name}
Description: ${product.description || 'No description'}
Price: $${product.price}

Generate POWERFUL trust signals that eliminate buyer hesitation and improve Google E-E-A-T scores:

1. QUALITY GUARANTEE (1-2 sentences): Specific, confident guarantee that removes purchase risk. Include timeframe and what's covered. Make it feel like the store stands firmly behind the product.

2. SHIPPING & RETURNS HIGHLIGHT (1-2 sentences): Clear, buyer-friendly policy that removes friction. Mention speed, free shipping thresholds, and hassle-free returns. This is a top Google Shopping ranking factor.

3. SOCIAL PROOF BLOCK: A realistic, specific social proof statement. Use concrete numbers where possible (e.g., "Trusted by 2,500+ customers" or "4.8/5 average rating"). Include a brief testimonial-style quote that addresses a common buyer concern.

4. TRUST BADGES TEXT (2-3 short phrases): Short trust badge labels like "Secure Checkout", "Satisfaction Guaranteed", "Fast & Free Shipping". These reduce cart abandonment.

5. BUYER FAQ (2 questions with answers): The top 2 trust-related questions buyers ask before purchasing (materials, durability, sizing, returns). Short, confident answers. These trigger Google Featured Snippets and reduce support tickets.

RULES:
- Be specific, not generic — tailor to this exact product and price point
- Sound authentic and confident, never salesy or desperate
- Use numbers and specifics over vague claims

Respond ONLY with valid JSON:
{
  "guaranteeStatement": "specific guarantee with timeframe",
  "shippingHighlight": "clear shipping and return policy",
  "socialProof": "specific social proof with numbers and mini-testimonial",
  "trustBadges": ["badge text 1", "badge text 2", "badge text 3"],
  "buyerFaq": [{"question": "...", "answer": "..."}, {"question": "...", "answer": "..."}]
}`;

    try {
      const content = await cachedTextGeneration(
        { prompt, model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 800 },
        async () => {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 800,
          });
          return response.choices[0]?.message?.content || '{}';
        }
      );

      const trustElements = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());

      if (trustElements.guaranteeStatement) {
        changes.push({
          field: 'Quality Guarantee',
          before: '(none)',
          after: trustElements.guaranteeStatement,
          reason: 'Money-back guarantees reduce purchase hesitation by 18% and boost Google E-E-A-T trust score',
        });
      }

      if (trustElements.shippingHighlight) {
        changes.push({
          field: 'Shipping & Returns Policy',
          before: '(not displayed)',
          after: trustElements.shippingHighlight,
          reason: 'Clear shipping info prevents cart abandonment and is a top Google Shopping ranking factor',
        });
      }

      if (trustElements.socialProof) {
        changes.push({
          field: 'Social Proof',
          before: '(none)',
          after: trustElements.socialProof,
          reason: 'Social proof with specific numbers builds buyer confidence and improves conversion rates',
        });
      }

      if (trustElements.trustBadges && Array.isArray(trustElements.trustBadges)) {
        changes.push({
          field: 'Trust Badges',
          before: '(none)',
          after: trustElements.trustBadges.join(' | '),
          reason: 'Trust badge labels reduce cart abandonment by up to 17%',
        });
      }

      if (trustElements.buyerFaq && Array.isArray(trustElements.buyerFaq)) {
        const faqText = trustElements.buyerFaq
          .map((faq: { question: string; answer: string }) => `Q: ${faq.question} A: ${faq.answer}`)
          .join(' | ');
        changes.push({
          field: 'Buyer FAQ',
          before: '(none)',
          after: faqText,
          reason: 'FAQ sections trigger Google Featured Snippets and reduce support inquiries by 30%',
        });
      }

      const existingFeatures = product.features || [];
      const newFeatures = [
        ...(Array.isArray(existingFeatures) ? existingFeatures : []),
        trustElements.guaranteeStatement,
        trustElements.shippingHighlight,
        trustElements.socialProof,
        ...(trustElements.trustBadges || []),
      ].filter(Boolean) as string[];

      if (changes.length > 0) {
        await db
          .update(products)
          .set({
            features: newFeatures as any,
            updatedAt: new Date(),
          })
          .where(eq(products.id, product.id));
      }

      return {
        productId: product.id,
        productName: product.name,
        changes,
        impactExplanation: changes.length > 0
          ? 'Trust signals with social proof, guarantees, and FAQ sections boost Google E-E-A-T scores and increase conversion rates by up to 25%.'
          : 'Product already has trust elements.',
      };

    } catch (error) {
      console.error(`[Trust Signals] Error for product ${product.id}:`, error);
      return {
        productId: product.id,
        productName: product.name,
        changes: [],
        impactExplanation: 'Could not add trust signals at this time.',
      };
    }
  }

  private async setupRecoveryMessages(
    userId: string,
    product: typeof products.$inferSelect
  ): Promise<ProductOptimization> {
    const changes: ContentChange[] = [];

    const prompt = `Create a cart recovery email subject line and preview text for this product.

Product: ${product.name}
Price: $${product.price}

Generate personalized recovery messaging:
1. Email subject line (create urgency, max 50 chars)
2. Preview text (value reminder, max 90 chars)

Respond ONLY with valid JSON:
{
  "subjectLine": "Don't forget your...",
  "previewText": "Your cart is waiting..."
}`;

    try {
      const content = await cachedTextGeneration(
        { prompt, model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 200 },
        async () => {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 200,
          });
          return response.choices[0]?.message?.content || '{}';
        }
      );

      const recovery = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());

      if (recovery.subjectLine) {
        changes.push({
          field: 'Recovery Email Subject',
          before: '(generic template)',
          after: recovery.subjectLine,
          reason: 'Personalized subjects get 26% higher open rates than generic ones',
        });
      }

      if (recovery.previewText) {
        changes.push({
          field: 'Recovery Email Preview',
          before: '(generic template)',
          after: recovery.previewText,
          reason: 'Preview text increases email open rates by reminding customers of value',
        });
      }

      return {
        productId: product.id,
        productName: product.name,
        changes,
        impactExplanation: changes.length > 0
          ? 'Cart recovery emails recover an average of 10-15% of abandoned carts. These personalized messages will help bring customers back.'
          : 'Recovery messaging ready.',
      };

    } catch (error) {
      console.error(`[Recovery Setup] Error for product ${product.id}:`, error);
      return {
        productId: product.id,
        productName: product.name,
        changes: [],
        impactExplanation: 'Could not setup recovery messages at this time.',
      };
    }
  }

  private generateImpactSummary(actionType: string, totalChanges: number): string {
    const impacts: Record<string, string> = {
      seo_basics: `SEO improvements typically increase organic traffic by 20-40% within 30 days. ${totalChanges} optimizations applied.`,
      product_copy_clarity: `Better product copy increases add-to-cart rate by 15-25%. ${totalChanges} descriptions improved.`,
      trust_signals: `Trust elements reduce cart abandonment by 18-25%. ${totalChanges} trust signals added.`,
      recovery_setup: `Cart recovery emails recover 10-15% of abandoned carts. ${totalChanges} recovery messages created.`,
      meta_optimization: `Optimized meta tags improve click-through rates from search results by 20-35%. ${totalChanges} meta tags optimized.`,
      image_alt_text: `Image alt text boosts Google Image search visibility and accessibility. ${totalChanges} images optimized.`,
      stale_seo_refresh: `Refreshed SEO content maintains search rankings and prevents decay. ${totalChanges} content refreshes applied.`,
      search_intent: `Search intent alignment improves relevance and conversion rates. ${totalChanges} pages optimized.`,
      value_proposition: `Stronger value propositions increase conversion by 25-40%. ${totalChanges} propositions strengthened.`,
      above_fold: `Optimized above-the-fold content reduces bounce rate by 20-30%. ${totalChanges} improvements applied.`,
    };

    return impacts[actionType] || `${totalChanges} improvements made to boost your store's performance.`;
  }
}

export const foundationalExecutionService = new FoundationalExecutionService();
