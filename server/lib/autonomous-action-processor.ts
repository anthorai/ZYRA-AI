import { db } from '../db';
import { autonomousActions, products, seoMeta, productSnapshots } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import OpenAI from 'openai';
import { cachedTextGeneration } from './ai-cache';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Autonomous Action Processor
 * 
 * Processes pending autonomous actions and executes them
 */

/**
 * Generate SEO content using AI
 */
async function generateSEOContent(product: any): Promise<{
  seoTitle: string;
  metaDescription: string;
  seoScore: number;
}> {
  const prompt = `You are an SEO expert. Analyze this product and generate optimized SEO content.

Product: ${product.name}
Description: ${product.description || 'No description available'}
Category: ${product.category}
Price: ${product.price}

Generate:
1. An optimized SEO title (50-60 characters, include key benefits and product name)
2. A meta description (150-160 characters, compelling and keyword-rich)
3. Calculate an SEO score (0-100) based on content quality

Format your response as JSON:
{
  "seoTitle": "...",
  "metaDescription": "...",
  "seoScore": 85
}`;

  try {
    const content = await cachedTextGeneration(
      {
        prompt,
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 500,
      },
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

    const parsed = JSON.parse(content);

    return {
      seoTitle: parsed.seoTitle || product.name,
      metaDescription: parsed.metaDescription || product.description?.substring(0, 160) || '',
      seoScore: parsed.seoScore || 70,
    };
  } catch (error) {
    console.error('❌ [SEO Generation] Error:', error);
    
    // Fallback to basic SEO
    return {
      seoTitle: product.name,
      metaDescription: product.description?.substring(0, 160) || '',
      seoScore: 50,
    };
  }
}

/**
 * Execute optimize_seo action
 */
async function executeOptimizeSEO(action: any): Promise<void> {
  console.log(`🔧 [Action Processor] Processing optimize_seo for product ${action.entityId}`);

  try {
    // SAFETY FIX: Verify autopilot is still enabled before executing
    const { automationSettings } = await import('@shared/schema');
    const settings = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, action.userId))
      .limit(1);

    if (settings.length === 0 || !settings[0].autopilotEnabled) {
      console.log(`⏸️  [Action Processor] Autopilot disabled for user ${action.userId}, skipping action`);
      
      await db
        .update(autonomousActions)
        .set({
          status: 'cancelled' as any,
          result: { reason: 'autopilot_disabled' } as any,
        })
        .where(eq(autonomousActions.id, action.id));
      
      return;
    }

    // Get the product
    const productResult = await db
      .select()
      .from(products)
      .where(eq(products.id, action.entityId))
      .limit(1);

    if (productResult.length === 0) {
      throw new Error('Product not found');
    }

    const product = productResult[0];

    // Get existing SEO meta before changes
    const existingSeoMeta = await db
      .select()
      .from(seoMeta)
      .where(eq(seoMeta.productId, product.id))
      .limit(1);

    // Create snapshot before changes (includes both product and seoMeta)
    await db.insert(productSnapshots).values({
      productId: product.id,
      actionId: action.id,
      snapshotData: {
        product: product,
        seoMeta: existingSeoMeta[0] || null,
      } as any,
      reason: 'before_optimization',
    });

    // Generate SEO content
    const seoContent = await generateSEOContent(product);

    if (existingSeoMeta.length > 0) {
      // Update existing
      await db
        .update(seoMeta)
        .set({
          seoTitle: seoContent.seoTitle,
          metaDescription: seoContent.metaDescription,
          seoScore: seoContent.seoScore,
        })
        .where(eq(seoMeta.productId, product.id));
    } else {
      // Create new
      await db.insert(seoMeta).values({
        productId: product.id,
        seoTitle: seoContent.seoTitle,
        metaDescription: seoContent.metaDescription,
        seoScore: seoContent.seoScore,
      });
    }

    // Update action status
    await db
      .update(autonomousActions)
      .set({
        status: 'completed',
        completedAt: new Date(),
        result: {
          seoTitle: seoContent.seoTitle,
          metaDescription: seoContent.metaDescription,
          seoScore: seoContent.seoScore,
        } as any,
        actualImpact: {
          seoScoreChange: seoContent.seoScore - (existingSeoMeta[0]?.seoScore || 0),
        } as any,
      })
      .where(eq(autonomousActions.id, action.id));

    console.log(`✅ [Action Processor] Optimized SEO for product: ${product.name}`);
    console.log(`   - SEO Score: ${seoContent.seoScore}`);
    console.log(`   - Title: ${seoContent.seoTitle}`);
  } catch (error) {
    console.error(`❌ [Action Processor] Error optimizing SEO:`, error);

    // Mark action as failed
    await db
      .update(autonomousActions)
      .set({
        status: 'failed',
        completedAt: new Date(),
        result: {
          error: error instanceof Error ? error.message : String(error),
        } as any,
      })
      .where(eq(autonomousActions.id, action.id));
  }
}

/**
 * Process a single autonomous action
 */
export async function processAutonomousAction(action: any): Promise<void> {
  console.log(`🤖 [Action Processor] Processing action ${action.id}: ${action.actionType}`);

  // Update status to running
  await db
    .update(autonomousActions)
    .set({
      status: 'running',
    })
    .where(eq(autonomousActions.id, action.id));

  // Execute based on action type
  switch (action.actionType) {
    case 'optimize_seo':
      await executeOptimizeSEO(action);
      break;

    case 'fix_product':
      // TODO: Implement product fixing
      console.log('⏭️  [Action Processor] fix_product not implemented yet');
      break;

    case 'send_cart_recovery':
      // TODO: Implement cart recovery
      console.log('⏭️  [Action Processor] send_cart_recovery not implemented yet');
      break;

    default:
      console.log(`⚠️  [Action Processor] Unknown action type: ${action.actionType}`);
      await db
        .update(autonomousActions)
        .set({
          status: 'failed',
          completedAt: new Date(),
          result: {
            error: `Unknown action type: ${action.actionType}`,
          } as any,
        })
        .where(eq(autonomousActions.id, action.id));
  }
}

/**
 * Process all pending autonomous actions
 */
export async function processPendingActions(): Promise<void> {
  console.log('🔄 [Action Processor] Checking for pending actions...');

  try {
    // Get all pending actions
    const pendingActions = await db
      .select()
      .from(autonomousActions)
      .where(eq(autonomousActions.status, 'pending'))
      .limit(10); // Process max 10 at a time

    if (pendingActions.length === 0) {
      console.log('✅ [Action Processor] No pending actions');
      return;
    }

    console.log(`📋 [Action Processor] Found ${pendingActions.length} pending actions`);

    // Process each action
    for (const action of pendingActions) {
      await processAutonomousAction(action);
    }

    console.log('✅ [Action Processor] Completed processing pending actions');
  } catch (error) {
    console.error('❌ [Action Processor] Error processing actions:', error);
  }
}
