import { requireDb } from '../db';
import { 
  revenueOpportunities, 
  revenueSignals,
  products, 
  seoMeta, 
  productSnapshots,
  autonomousActions,
  automationSettings
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { consumeAIToolCredits, checkAIToolCredits } from './credits';
import { calculateActionCreditCost, mapNextMoveActionToType } from './constants/credit-consumption';
import OpenAI from 'openai';
import { cachedTextGeneration } from './ai-cache';
import { PowerModeService } from './power-mode-service';
import { buildQuickSEOPrompt, buildDescriptionPrompt } from './constants/seo-content-formats';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || 'placeholder-key',
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface ExecutionResult {
  success: boolean;
  opportunityId: string;
  creditsUsed: number;
  changes: any;
  error?: string;
}

export class RevenueExecutionEngine {
  async executeOpportunity(opportunityId: string): Promise<ExecutionResult> {
    console.log(`🚀 [Revenue Execution] Starting execution for opportunity ${opportunityId}`);
    const db = requireDb();

    const [opportunity] = await db
      .select()
      .from(revenueOpportunities)
      .where(eq(revenueOpportunities.id, opportunityId))
      .limit(1);

    if (!opportunity) {
      return {
        success: false,
        opportunityId,
        creditsUsed: 0,
        changes: null,
        error: 'Opportunity not found',
      };
    }

    const settings = await this.checkUserSettings(opportunity.userId);
    if (!settings.enabled) {
      return {
        success: false,
        opportunityId,
        creditsUsed: 0,
        changes: null,
        error: settings.reason || 'Autopilot disabled',
      };
    }

    const actionTypeForCredits = mapNextMoveActionToType(opportunity.opportunityType);
    const userSub = await db.query.subscriptions.findFirst({
      where: eq(require('@shared/schema').subscriptions.userId, opportunity.userId),
    });
    const planId = userSub?.planId || '18f8da29-94cf-417b-83f8-07191b22f254';
    const creditCost = settings.powerModeEnabled 
      ? calculateActionCreditCost(actionTypeForCredits, planId, { isAutoExecuted: true }) * 2
      : calculateActionCreditCost(actionTypeForCredits, planId, { isAutoExecuted: true });
    const creditToolId = settings.powerModeEnabled ? 'power-mode' : 'product-seo-engine';
    const creditCheck = await checkAIToolCredits(opportunity.userId, creditToolId, creditCost);
    if (!creditCheck.hasEnoughCredits) {
      if (settings.powerModeEnabled) {
        console.log(`⚠️ [Revenue Execution] Insufficient Power Mode credits, checking standard credits`);
        const fallbackCheck = await checkAIToolCredits(opportunity.userId, 'product-seo-engine', 1);
        if (!fallbackCheck.hasEnoughCredits) {
          return {
            success: false,
            opportunityId,
            creditsUsed: 0,
            changes: null,
            error: 'Insufficient credits for both Power Mode and standard optimization',
          };
        }
        settings.powerModeEnabled = false;
      } else {
        return {
          success: false,
          opportunityId,
          creditsUsed: 0,
          changes: null,
          error: 'Insufficient credits',
        };
      }
    }

    try {
      await db
        .update(revenueOpportunities)
        .set({
          status: 'executing',
          executedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(revenueOpportunities.id, opportunityId));

      await this.createSnapshot(opportunity);

      const result = await this.performOptimization(opportunity, settings.powerModeEnabled);

      let creditsUsed = result.creditsUsed || 0;
      if (creditsUsed === 0) {
        const creditResult = await consumeAIToolCredits(opportunity.userId, 'product-seo-engine', creditCost);
        creditsUsed = creditResult.creditsConsumed;
      }

      const [action] = await db
        .insert(autonomousActions)
        .values({
          userId: opportunity.userId,
          actionType: opportunity.opportunityType,
          entityType: opportunity.entityType,
          entityId: opportunity.entityId,
          status: 'completed',
          decisionReason: `Revenue loop optimization: ${opportunity.opportunityType}`,
          payload: {
            opportunityId,
            actionPlan: opportunity.actionPlan,
          },
          result: result.changes,
          estimatedImpact: {
            revenueLift: opportunity.estimatedRevenueLift,
          },
          executedBy: 'agent',
          creditsUsed: creditsUsed,
          completedAt: new Date(),
        })
        .returning();

      await db
        .update(revenueOpportunities)
        .set({
          status: 'proving',
          proveStartedAt: new Date(),
          autonomousActionId: action.id,
          creditsUsed,
          proposedContent: result.changes,
          updatedAt: new Date(),
        })
        .where(eq(revenueOpportunities.id, opportunityId));

      if (opportunity.signalId) {
        await db
          .update(revenueSignals)
          .set({
            status: 'executing',
            updatedAt: new Date(),
          })
          .where(eq(revenueSignals.id, opportunity.signalId));
      }

      console.log(`✅ [Revenue Execution] Completed execution for opportunity ${opportunityId}`);

      return {
        success: true,
        opportunityId,
        creditsUsed,
        changes: result.changes,
      };
    } catch (error) {
      console.error(`❌ [Revenue Execution] Error:`, error);

      await db
        .update(revenueOpportunities)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(revenueOpportunities.id, opportunityId));

      return {
        success: false,
        opportunityId,
        creditsUsed: 0,
        changes: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkUserSettings(userId: string): Promise<{ enabled: boolean; powerModeEnabled: boolean; reason?: string }> {
    const db = requireDb();
    const [settings] = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, userId))
      .limit(1);

    if (!settings) {
      return { enabled: false, powerModeEnabled: false, reason: 'No automation settings found' };
    }

    if (!settings.globalAutopilotEnabled) {
      return { enabled: false, powerModeEnabled: false, reason: 'Global autopilot disabled' };
    }

    if (!settings.autopilotEnabled) {
      return { enabled: false, powerModeEnabled: false, reason: 'Autopilot disabled' };
    }

    return { enabled: true, powerModeEnabled: settings.powerModeEnabled || false };
  }

  private async createSnapshot(opportunity: typeof revenueOpportunities.$inferSelect): Promise<void> {
    const db = requireDb();
    if (opportunity.entityType !== 'product' || !opportunity.entityId) return;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, opportunity.entityId))
      .limit(1);

    if (!product) return;

    const [seo] = await db
      .select()
      .from(seoMeta)
      .where(eq(seoMeta.productId, opportunity.entityId))
      .limit(1);

    await db.insert(productSnapshots).values({
      productId: product.id,
      snapshotData: {
        product: {
          name: product.name,
          description: product.description,
          price: product.price,
          features: product.features,
        },
        seo: seo ? {
          seoTitle: seo.seoTitle,
          metaDescription: seo.metaDescription,
          keywords: seo.keywords,
          seoScore: seo.seoScore,
        } : null,
        opportunityId: opportunity.id,
      },
      reason: 'revenue_loop_execution',
    });

    console.log(`📸 [Revenue Execution] Created snapshot for product ${product.id}`);
  }

  private async performOptimization(
    opportunity: typeof revenueOpportunities.$inferSelect,
    powerModeEnabled: boolean = false
  ): Promise<{ changes: any; creditsUsed?: number }> {
    // FAST PATH: Use pre-built execution payload ONLY when actual content exists
    // Payload must have real optimized content - not just metadata
    const actionPlan = opportunity.actionPlan as any;
    const payload = actionPlan?.executionPayload;
    
    // Strict content check: must have ACTUAL content to apply, not just frictionType/metadata
    const hasRealContent = payload && (
      payload.optimizedTitle || 
      payload.optimizedDescription || 
      payload.metaTitle || 
      payload.metaDescription
    );
    
    if (hasRealContent && payload.ready === true) {
      console.log(`⚡ [Revenue Execution] Using pre-built execution payload (fast path)`);
      const fastResult = await this.executeFromPrebuiltPayload(opportunity, payload);
      if (fastResult.success) {
        return { changes: fastResult.changes, creditsUsed: 1 };
      }
      // Fall through to slow path if fast execution fails
      console.log(`⚠️ [Revenue Execution] Pre-built payload execution failed, falling back to slow path`);
    } else if (payload?.ready) {
      // Payload exists but lacks content - log and fall back
      console.log(`📊 [Revenue Execution] Payload has metadata only, using AI-powered slow path`);
    }

    // SLOW PATH: Generate content via AI (existing behavior)
    if (opportunity.opportunityType === 'seo_optimization' && opportunity.entityId) {
      if (powerModeEnabled) {
        return this.optimizeSEOWithPowerMode(opportunity.entityId, opportunity.userId);
      }
      return this.optimizeSEO(opportunity.entityId, opportunity.userId);
    }

    if (opportunity.opportunityType === 'description_enhancement' && opportunity.entityId) {
      if (powerModeEnabled) {
        return this.optimizeSEOWithPowerMode(opportunity.entityId, opportunity.userId);
      }
      return this.enhanceDescription(opportunity.entityId, opportunity.userId);
    }

    // Handle ZYRA revenue action types from cache
    const actionType = opportunity.opportunityType;
    if (['product_content_fix', 'cart_recovery', 'checkout_optimization', 'upsell_opportunity'].includes(actionType)) {
      if (opportunity.entityId) {
        if (powerModeEnabled) {
          return this.optimizeSEOWithPowerMode(opportunity.entityId, opportunity.userId);
        }
        return this.optimizeSEO(opportunity.entityId, opportunity.userId);
      }
    }

    return { changes: { type: 'no_op', reason: 'Unknown opportunity type' } };
  }

  /**
   * Execute using pre-built payload from detection cache
   * Target execution time: 1-3 seconds (no AI calls needed)
   * 
   * Fast path: Uses pre-generated content if available
   * Friction-based path: Marks product for optimization when friction detected
   */
  private async executeFromPrebuiltPayload(
    opportunity: typeof revenueOpportunities.$inferSelect,
    payload: any
  ): Promise<{ success: boolean; changes: any }> {
    const executeStart = Date.now();
    const db = requireDb();

    try {
      if (!opportunity.entityId) {
        return { success: false, changes: { error: 'No entity ID' } };
      }

      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, opportunity.entityId))
        .limit(1);

      if (!product) {
        return { success: false, changes: { error: 'Product not found' } };
      }

      // Apply pre-built content changes
      const updatedFields: any = {
        isOptimized: true,
        updatedAt: new Date(),
      };

      // Use payload's pre-generated content if available
      if (payload.optimizedTitle) {
        updatedFields.name = payload.optimizedTitle;
      }
      if (payload.optimizedDescription) {
        updatedFields.description = payload.optimizedDescription;
      }

      // Track what action was taken based on friction type
      const actionTaken = this.getActionForFriction(payload.frictionType, product);

      await db.update(products)
        .set(updatedFields)
        .where(eq(products.id, opportunity.entityId));

      // Update SEO metadata if provided in payload
      if (payload.metaTitle || payload.metaDescription) {
        const [existingSeo] = await db
          .select()
          .from(seoMeta)
          .where(eq(seoMeta.productId, opportunity.entityId))
          .limit(1);

        if (existingSeo) {
          await db.update(seoMeta)
            .set({
              seoTitle: payload.metaTitle || existingSeo.seoTitle,
              metaDescription: payload.metaDescription || existingSeo.metaDescription,
              seoScore: payload.seoScore || existingSeo.seoScore,
            })
            .where(eq(seoMeta.productId, opportunity.entityId));
        } else if (payload.metaTitle) {
          await db.insert(seoMeta).values({
            productId: opportunity.entityId,
            seoTitle: payload.metaTitle,
            metaDescription: payload.metaDescription || '',
            seoScore: payload.seoScore || 70,
          });
        }
      }

      // Consume credits for execution
      await consumeAIToolCredits(opportunity.userId, 'product-seo-engine', 1);

      const executionTime = Date.now() - executeStart;
      console.log(`⚡ [Revenue Execution] Pre-built payload executed in ${executionTime}ms`);

      return {
        success: true,
        changes: {
          type: 'prebuilt_payload_execution',
          productId: opportunity.entityId,
          productName: product.name,
          appliedChanges: updatedFields,
          actionTaken,
          executionTimeMs: executionTime,
          frictionType: payload.frictionType,
          targetImprovement: payload.targetImprovement,
        },
      };
    } catch (error) {
      console.error(`❌ [Revenue Execution] Pre-built payload error:`, error);
      return { success: false, changes: { error: error instanceof Error ? error.message : 'Unknown error' } };
    }
  }

  private getActionForFriction(frictionType: string | null, product: any): string {
    const actions: Record<string, string> = {
      'view_no_cart': `Optimized product listing to improve add-to-cart conversion`,
      'cart_no_checkout': `Flagged for checkout flow optimization`,
      'checkout_drop': `Queued for cart recovery sequence`,
      'purchase_no_upsell': `Enabled for post-purchase recommendations`,
    };
    return actions[frictionType || ''] || 'Product marked for optimization';
  }

  private async optimizeSEOWithPowerMode(productId: string, userId: string): Promise<{ changes: any; creditsUsed: number }> {
    const db = requireDb();
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return { changes: { error: 'Product not found' }, creditsUsed: 0 };
    }

    const powerModeService = new PowerModeService();
    const health = await powerModeService.checkHealth();
    
    if (!health.serpApiAvailable || !health.openaiAvailable) {
      console.log(`⚠️ [Power Mode] Not available (${health.message}), falling back to standard optimization`);
      const fallbackResult = await this.optimizeSEO(productId, userId);
      await consumeAIToolCredits(userId, 'product-seo-engine', 1);
      return { changes: { ...fallbackResult.changes, fallbackReason: 'power_mode_unavailable' }, creditsUsed: 1 };
    }

    const creditCheck = await checkAIToolCredits(userId, 'power-mode', 5);
    if (!creditCheck.hasEnoughCredits) {
      console.log(`⚠️ [Power Mode] Insufficient credits, falling back to standard optimization`);
      const fallbackResult = await this.optimizeSEO(productId, userId);
      await consumeAIToolCredits(userId, 'product-seo-engine', 1);
      return { changes: { ...fallbackResult.changes, fallbackReason: 'insufficient_power_mode_credits' }, creditsUsed: 1 };
    }

    try {
      console.log(`🚀 [Power Mode] Starting SERP analysis for product ${product.name}`);
      
      const powerModeResult = await powerModeService.analyzeAndOptimize({
        productName: product.name,
        productDescription: product.description || undefined,
        currentTitle: product.name,
        category: product.category || undefined,
        price: product.price ? Number(product.price) : undefined,
      });

      const [existingSeo] = await db
        .select()
        .from(seoMeta)
        .where(eq(seoMeta.productId, productId))
        .limit(1);

      if (existingSeo) {
        await db.update(seoMeta)
          .set({
            seoTitle: powerModeResult.optimizedContent.metaTitle,
            metaDescription: powerModeResult.optimizedContent.metaDescription,
            seoScore: powerModeResult.competitiveInsights.confidenceScore,
          })
          .where(eq(seoMeta.productId, productId));
      } else {
        await db.insert(seoMeta).values({
          productId,
          seoTitle: powerModeResult.optimizedContent.metaTitle,
          metaDescription: powerModeResult.optimizedContent.metaDescription,
          seoScore: powerModeResult.competitiveInsights.confidenceScore,
        });
      }

      await db.update(products)
        .set({
          name: powerModeResult.optimizedContent.title,
          description: powerModeResult.optimizedContent.productDescription,
          isOptimized: true,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));

      await consumeAIToolCredits(userId, 'power-mode', 5);

      console.log(`✅ [Power Mode] Completed optimization for ${product.name}`);

      return {
        changes: {
          type: 'power_mode_seo_optimization',
          previous: {
            title: product.name,
            description: product.description,
            metaTitle: existingSeo?.seoTitle,
            metaDescription: existingSeo?.metaDescription,
          },
          optimized: {
            title: powerModeResult.optimizedContent.title,
            description: powerModeResult.optimizedContent.productDescription,
            metaTitle: powerModeResult.optimizedContent.metaTitle,
            metaDescription: powerModeResult.optimizedContent.metaDescription,
          },
          serpAnalysis: {
            competitorCount: powerModeResult.serpAnalysis.competitorInsights.totalAnalyzed,
            searchIntent: powerModeResult.competitiveInsights.searchIntent,
            confidenceScore: powerModeResult.competitiveInsights.confidenceScore,
            difficultyScore: powerModeResult.competitiveInsights.difficultyScore,
          },
          expectedImpact: powerModeResult.expectedImpact,
        },
        creditsUsed: 5,
      };
    } catch (error) {
      console.error(`❌ [Power Mode] Error:`, error);
      const fallbackResult = await this.optimizeSEO(productId, userId);
      await consumeAIToolCredits(userId, 'product-seo-engine', 1);
      return { changes: { ...fallbackResult.changes, fallbackReason: 'power_mode_error' }, creditsUsed: 1 };
    }
  }

  private async optimizeSEO(productId: string, userId: string): Promise<{ changes: any }> {
    const db = requireDb();
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return { changes: { error: 'Product not found' } };
    }

    const prompt = buildQuickSEOPrompt(product);

    try {
      const content = await cachedTextGeneration(
        { prompt, model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 500 },
        async () => {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 500,
          });
          return response.choices[0]?.message?.content || '{}';
        }
      );

      const optimized = JSON.parse(content);

      const [existingSeo] = await db
        .select()
        .from(seoMeta)
        .where(eq(seoMeta.productId, productId))
        .limit(1);

      if (existingSeo) {
        await db
          .update(seoMeta)
          .set({
            optimizedTitle: optimized.seoTitle,
            optimizedMeta: optimized.metaDescription,
            keywords: optimized.keywords?.join(', '),
            seoScore: optimized.seoScore,
          })
          .where(eq(seoMeta.productId, productId));
      } else {
        await db.insert(seoMeta).values({
          productId,
          seoTitle: optimized.seoTitle,
          metaDescription: optimized.metaDescription,
          optimizedTitle: optimized.seoTitle,
          optimizedMeta: optimized.metaDescription,
          keywords: optimized.keywords?.join(', '),
          seoScore: optimized.seoScore,
        });
      }

      return {
        changes: {
          type: 'seo_optimization',
          productId,
          before: existingSeo ? {
            seoTitle: existingSeo.seoTitle,
            metaDescription: existingSeo.metaDescription,
            seoScore: existingSeo.seoScore,
          } : null,
          after: optimized,
        },
      };
    } catch (error) {
      console.error(`❌ [Revenue Execution] SEO optimization error:`, error);
      return { changes: { error: 'SEO optimization failed' } };
    }
  }

  private async enhanceDescription(productId: string, userId: string): Promise<{ changes: any }> {
    const db = requireDb();
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return { changes: { error: 'Product not found' } };
    }

    const prompt = buildDescriptionPrompt(product);

    try {
      const content = await cachedTextGeneration(
        { prompt, model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 1200 },
        async () => {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1200,
          });
          return response.choices[0]?.message?.content || '{}';
        }
      );

      const enhanced = JSON.parse(content);

      await db
        .update(products)
        .set({
          optimizedCopy: enhanced,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));

      return {
        changes: {
          type: 'description_enhancement',
          productId,
          before: {
            description: product.description,
          },
          after: enhanced,
        },
      };
    } catch (error) {
      console.error(`❌ [Revenue Execution] Description enhancement error:`, error);
      return { changes: { error: 'Description enhancement failed' } };
    }
  }

  async rollbackOpportunity(opportunityId: string): Promise<boolean> {
    const db = requireDb();
    console.log(`⏪ [Revenue Execution] Rolling back opportunity ${opportunityId}`);

    const [opportunity] = await db
      .select()
      .from(revenueOpportunities)
      .where(eq(revenueOpportunities.id, opportunityId))
      .limit(1);

    if (!opportunity || !opportunity.rollbackData) {
      console.log(`⚠️  [Revenue Execution] No rollback data for opportunity ${opportunityId}`);
      return false;
    }

    try {
      const rollbackData = opportunity.rollbackData as any;

      if (opportunity.entityType === 'product' && opportunity.entityId) {
        if (rollbackData.seoTitle || rollbackData.metaDescription) {
          await db
            .update(seoMeta)
            .set({
              seoTitle: rollbackData.seoTitle,
              metaDescription: rollbackData.metaDescription,
            })
            .where(eq(seoMeta.productId, opportunity.entityId));
        }

        if (rollbackData.description) {
          await db
            .update(products)
            .set({
              description: rollbackData.description,
              updatedAt: new Date(),
            })
            .where(eq(products.id, opportunity.entityId));
        }
      }

      await db
        .update(revenueOpportunities)
        .set({
          status: 'rolled_back',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(revenueOpportunities.id, opportunityId));

      if (opportunity.signalId) {
        await db
          .update(revenueSignals)
          .set({
            status: 'rolled_back',
            updatedAt: new Date(),
          })
          .where(eq(revenueSignals.id, opportunity.signalId));
      }

      console.log(`✅ [Revenue Execution] Rollback completed for opportunity ${opportunityId}`);
      return true;
    } catch (error) {
      console.error(`❌ [Revenue Execution] Rollback error:`, error);
      return false;
    }
  }
}

export const revenueExecutionEngine = new RevenueExecutionEngine();
