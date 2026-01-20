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
import OpenAI from 'openai';
import { cachedTextGeneration } from './ai-cache';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

    const creditCheck = await checkAIToolCredits(opportunity.userId, 'product-seo-engine', 1);
    if (!creditCheck.hasEnoughCredits) {
      return {
        success: false,
        opportunityId,
        creditsUsed: 0,
        changes: null,
        error: 'Insufficient credits',
      };
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

      const result = await this.performOptimization(opportunity);

      const creditResult = await consumeAIToolCredits(opportunity.userId, 'product-seo-engine', 1);
      const creditsUsed = creditResult.creditsConsumed;

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

  private async checkUserSettings(userId: string): Promise<{ enabled: boolean; reason?: string }> {
    const db = requireDb();
    const [settings] = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, userId))
      .limit(1);

    if (!settings) {
      return { enabled: false, reason: 'No automation settings found' };
    }

    if (!settings.globalAutopilotEnabled) {
      return { enabled: false, reason: 'Global autopilot disabled' };
    }

    if (!settings.autopilotEnabled) {
      return { enabled: false, reason: 'Autopilot disabled' };
    }

    return { enabled: true };
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
    opportunity: typeof revenueOpportunities.$inferSelect
  ): Promise<{ changes: any }> {
    if (opportunity.opportunityType === 'seo_optimization' && opportunity.entityId) {
      return this.optimizeSEO(opportunity.entityId, opportunity.userId);
    }

    if (opportunity.opportunityType === 'description_enhancement' && opportunity.entityId) {
      return this.enhanceDescription(opportunity.entityId, opportunity.userId);
    }

    return { changes: { type: 'no_op', reason: 'Unknown opportunity type' } };
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

    const prompt = `You are an SEO expert. Optimize this product for search engines.

Product: ${product.name}
Description: ${product.description || 'No description'}
Category: ${product.category}
Price: $${product.price}

Generate optimized SEO content:
1. SEO Title (50-60 chars, include keywords)
2. Meta Description (150-160 chars, compelling)
3. 5 relevant keywords

Respond in JSON:
{
  "seoTitle": "...",
  "metaDescription": "...",
  "keywords": ["...", "...", "...", "...", "..."],
  "seoScore": 85
}`;

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

    const prompt = `You are a conversion optimization expert. Enhance this product description to increase conversions.

Product: ${product.name}
Current Description: ${product.description || 'No description'}
Category: ${product.category}
Price: $${product.price}

Create an enhanced description that:
1. Highlights key benefits
2. Uses persuasive language
3. Includes social proof elements
4. Has a clear call-to-action

Respond in JSON:
{
  "enhancedDescription": "...",
  "keyBenefits": ["...", "...", "..."],
  "callToAction": "..."
}`;

    try {
      const content = await cachedTextGeneration(
        { prompt, model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 600 },
        async () => {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 600,
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
