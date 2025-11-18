import { db } from '../db';
import { autonomousActions, products, seoMeta, productSnapshots, abandonedCarts, pricingSnapshots, priceChanges } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import OpenAI from 'openai';
import { cachedTextGeneration } from './ai-cache';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { priceCalculator } from './price-calculator';
import { getShopifyClient } from './shopify-client';

// Initialize email and SMS clients
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

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
 * Generate personalized cart recovery message using AI
 */
async function generateCartRecoveryMessage(cartData: any): Promise<{
  subject: string;
  emailBody: string;
  smsBody: string;
}> {
  const cartItems = cartData.cartItems || [];
  const itemsList = cartItems.map((item: any) => `- ${item.title || item.name} ($${item.price})`).join('\n');
  
  const prompt = `You are a friendly e-commerce assistant helping recover abandoned shopping carts. Generate a personalized, warm recovery message.

Cart Details:
- Customer Name: ${cartData.customerName || 'Valued Customer'}
- Cart Value: $${cartData.cartValue}
- Items in cart:
${itemsList}
- Checkout URL: ${cartData.checkoutUrl}

Generate:
1. Email subject line (compelling, creates urgency, max 50 chars)
2. Email body (warm, personal, highlights cart value, includes checkout link, 2-3 paragraphs)
3. SMS message (concise, friendly, under 160 chars, includes short link)

Guidelines:
- Be friendly and helpful, not pushy
- Create subtle urgency without being aggressive
- Highlight the value they're missing
- Make it easy to complete purchase
- Use customer's name if provided

Format as JSON:
{
  "subject": "...",
  "emailBody": "...",
  "smsBody": "..."
}`;

  try {
    const content = await cachedTextGeneration(
      {
        prompt,
        model: 'gpt-4o-mini',
        temperature: 0.8, // Higher for creative copy
        maxTokens: 600,
      },
      async () => {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 600,
        });
        return response.choices[0]?.message?.content || '{}';
      }
    );

    const parsed = JSON.parse(content);

    return {
      subject: parsed.subject || `Complete your purchase - $${cartData.cartValue} waiting!`,
      emailBody: parsed.emailBody || `Hi ${cartData.customerName || 'there'},\n\nYou left items in your cart! Complete your purchase now: ${cartData.checkoutUrl}`,
      smsBody: parsed.smsBody || `Your $${cartData.cartValue} cart is waiting! Complete checkout: ${cartData.checkoutUrl}`,
    };
  } catch (error) {
    console.error('❌ [Cart Recovery] Error generating message:', error);
    
    // Fallback to generic message
    return {
      subject: `Complete your purchase - $${cartData.cartValue} waiting!`,
      emailBody: `Hi ${cartData.customerName || 'there'},\n\nYou left ${cartItems.length} item(s) in your cart worth $${cartData.cartValue}.\n\nComplete your purchase now: ${cartData.checkoutUrl}\n\nBest regards,\nYour Store`,
      smsBody: `Your $${cartData.cartValue} cart is waiting! Complete checkout: ${cartData.checkoutUrl}`,
    };
  }
}

/**
 * Send cart recovery email via SendGrid
 */
async function sendCartRecoveryEmail(
  customerEmail: string,
  subject: string,
  body: string
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ [Cart Recovery] SendGrid API key not configured');
    return false;
  }

  if (!process.env.SENDGRID_FROM_EMAIL) {
    console.error('❌ [Cart Recovery] SendGrid from email not configured');
    return false;
  }

  try {
    await sgMail.send({
      to: customerEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    });

    console.log(`✅ [Cart Recovery] Email sent to ${customerEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ [Cart Recovery] Error sending email:`, error);
    return false;
  }
}

/**
 * Send cart recovery SMS via Twilio
 */
async function sendCartRecoverySMS(
  customerPhone: string,
  body: string
): Promise<boolean> {
  if (!twilioClient) {
    console.error('❌ [Cart Recovery] Twilio not configured');
    return false;
  }

  if (!process.env.TWILIO_PHONE_NUMBER) {
    console.error('❌ [Cart Recovery] Twilio phone number not configured');
    return false;
  }

  try {
    await twilioClient.messages.create({
      to: customerPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
      body,
    });

    console.log(`✅ [Cart Recovery] SMS sent to ${customerPhone}`);
    return true;
  } catch (error) {
    console.error(`❌ [Cart Recovery] Error sending SMS:`, error);
    return false;
  }
}

/**
 * Execute send_cart_recovery action
 */
async function executeCartRecovery(action: any): Promise<void> {
  console.log(`🛒 [Action Processor] Processing cart recovery for cart ${action.entityId}`);

  try {
    // SAFETY: Verify cart recovery is still enabled
    const { automationSettings } = await import('@shared/schema');
    const settings = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, action.userId))
      .limit(1);

    if (settings.length === 0 || !settings[0].cartRecoveryEnabled) {
      console.log(`⏸️  [Action Processor] Cart recovery disabled for user ${action.userId}, skipping action`);
      
      await db
        .update(autonomousActions)
        .set({
          status: 'failed',
          completedAt: new Date(),
          result: { reason: 'cart_recovery_disabled', skipped: true } as any,
        })
        .where(eq(autonomousActions.id, action.id));
      return;
    }

    // Get cart data
    const cart = await db
      .select()
      .from(abandonedCarts)
      .where(eq(abandonedCarts.id, action.entityId))
      .limit(1);

    if (cart.length === 0) {
      throw new Error(`Cart ${action.entityId} not found`);
    }

    const cartData = cart[0];

    // Generate personalized recovery message using AI
    const message = await generateCartRecoveryMessage({
      customerName: cartData.customerName,
      customerEmail: cartData.customerEmail,
      cartValue: cartData.cartValue,
      cartItems: cartData.cartItems,
      checkoutUrl: cartData.checkoutUrl,
    });

    // Send via configured channel
    const channel = settings[0].recoveryChannel;
    let emailSent = false;
    let smsSent = false;
    const results: any = {
      channel,
      message,
    };

    if (channel === 'email' || channel === 'both') {
      if (cartData.customerEmail) {
        emailSent = await sendCartRecoveryEmail(
          cartData.customerEmail,
          message.subject,
          message.emailBody
        );
        results.emailSent = emailSent;
      } else {
        console.log(`⚠️  [Cart Recovery] No customer email for cart ${cartData.id}`);
        results.emailSent = false;
        results.emailError = 'No customer email';
      }
    }

    if (channel === 'sms' || channel === 'both') {
      if (cartData.customerPhone) {
        smsSent = await sendCartRecoverySMS(
          cartData.customerPhone,
          message.smsBody
        );
        results.smsSent = smsSent;
      } else {
        console.log(`⚠️  [Cart Recovery] No customer phone for cart ${cartData.id}`);
        results.smsSent = false;
        results.smsError = 'No customer phone';
      }
    }

    const success = emailSent || smsSent;

    if (success) {
      // CRITICAL FIX: Update abandoned cart record after successful delivery
      // This prevents duplicate sends and tracks delivery status
      // Note: recoveryAttempts already incremented by scheduler
      await db
        .update(abandonedCarts)
        .set({
          lastContactedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(abandonedCarts.id, cartData.id));

      // Mark action as completed
      await db
        .update(autonomousActions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          result: results as any,
        })
        .where(eq(autonomousActions.id, action.id));

      console.log(`✅ [Action Processor] Cart recovery sent for cart ${cartData.id}`);
    } else {
      throw new Error('Failed to send recovery message via any channel');
    }
  } catch (error) {
    console.error(`❌ [Action Processor] Error in cart recovery:`, error);

    // CRITICAL FIX: Update cart timestamp even on failure
    // This ensures we track ALL contact attempts (success or failure)
    // Prevents retry loops and maintains accurate audit trail
    const cartId = action.payload?.cartValue ? action.entityId : null;
    if (cartId && db) {
      try {
        await db
          .update(abandonedCarts)
          .set({
            lastContactedAt: new Date(), // Track attempt time regardless of delivery outcome
            updatedAt: new Date(),
          })
          .where(eq(abandonedCarts.id, cartId));
      } catch (updateError) {
        console.error(`❌ [Action Processor] Failed to update cart timestamp:`, updateError);
        // Continue with action failure marking even if cart update fails
      }
    }

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
 * Execute price_change action
 */
async function executePriceChange(action: any): Promise<void> {
  console.log(`💰 [Action Processor] Processing price_change for product ${action.entityId}`);

  try {
    // SAFETY: Verify pricing automation is still enabled
    const { pricingSettings, automationSettings } = await import('@shared/schema');
    const [autoSettings] = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, action.userId))
      .limit(1);

    if (!autoSettings || !autoSettings.autopilotEnabled) {
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

    const [settings] = await db
      .select()
      .from(pricingSettings)
      .where(eq(pricingSettings.userId, action.userId))
      .limit(1);

    if (!settings || !settings.pricingAutomationEnabled) {
      console.log(`⏸️  [Action Processor] Pricing automation disabled for user ${action.userId}, skipping action`);
      
      await db
        .update(autonomousActions)
        .set({
          status: 'cancelled' as any,
          result: { reason: 'pricing_automation_disabled' } as any,
        })
        .where(eq(autonomousActions.id, action.id));
      
      return;
    }

    // Get the product
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, action.entityId))
      .limit(1);

    if (!product) {
      throw new Error('Product not found');
    }

    const oldPrice = parseFloat(product.price);
    const payload = action.payload as any;
    const newPrice = parseFloat(payload?.newPrice || '0');

    if (newPrice <= 0) {
      throw new Error('Invalid new price');
    }

    // Calculate optimal price with all safety checks
    const calculation = await priceCalculator.calculateOptimalPrice(
      action.userId,
      newPrice,
      oldPrice
    );

    const finalPrice = calculation.finalPrice;

    // Create pricing snapshot BEFORE changes
    await db.insert(pricingSnapshots).values({
      productId: product.id,
      userId: action.userId,
      oldPrice: oldPrice.toFixed(2),
      newPrice: finalPrice.toFixed(2),
      reason: 'autonomous_pricing',
      actionId: action.id,
      snapshotData: {
        product,
        calculation,
        reasoning: action.decisionReason,
      } as any,
    });

    console.log(`💵 [Price Change] ${product.name}: $${oldPrice} → $${finalPrice}`);

    // CRITICAL: Two-phase commit for atomicity
    // Phase 1: Update Shopify (external system, cannot rollback easily)
    // Phase 2: Update database in transaction (can rollback)
    // If Phase 1 fails → action fails, nothing changed
    // If Phase 2 fails → attempt Shopify rollback, mark action failed
    
    let shopifyUpdated = false;
    let shopifyClient: any = null;
    let store: any = null;

    if (product.shopifyId) {
      console.log(`🔗 [Price Change] Updating Shopify product ${product.shopifyId} to $${finalPrice}`);
      
      // Get user's Shopify credentials
      const { shopifyStores } = await import('@shared/schema');
      [store] = await db
        .select()
        .from(shopifyStores)
        .where(eq(shopifyStores.userId, action.userId))
        .limit(1);

      if (!store || !store.shop || !store.accessToken) {
        throw new Error(`No Shopify credentials found for user ${action.userId}. Cannot update live store price.`);
      }

      // Update Shopify FIRST (if this fails, action fails immediately)
      shopifyClient = await getShopifyClient(store.shop, store.accessToken);
      await shopifyClient.updateProductPrice(product.shopifyId, finalPrice.toFixed(2));
      shopifyUpdated = true;
      console.log(`✅ [Price Change] Shopify updated successfully`);
    }

    // TRANSACTIONAL SAFETY: Wrap ALL database updates in a single transaction
    // If any DB operation fails, transaction rolls back atomically
    try {
      await db.transaction(async (tx) => {
        // Update product price
        await tx
          .update(products)
          .set({
            price: finalPrice.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(products.id, product.id));

        // Record price change
        await tx.insert(priceChanges).values({
          userId: action.userId,
          productId: product.id,
          oldPrice: oldPrice.toFixed(2),
          newPrice: finalPrice.toFixed(2),
          changeReason: action.decisionReason || 'Autonomous pricing rule',
          triggeredBy: 'autonomous',
          actionId: action.id,
          appliedAt: new Date(),
          revenueImpact: calculation.reasoning.join('; '),
        });

        // Calculate impact metrics
        const priceDelta = finalPrice - oldPrice;
        const percentageChange = ((priceDelta / oldPrice) * 100).toFixed(2);

        // Mark action as completed
        await tx
          .update(autonomousActions)
          .set({
            status: 'completed',
            completedAt: new Date(),
            result: {
              oldPrice: oldPrice.toFixed(2),
              newPrice: finalPrice.toFixed(2),
              priceDelta: priceDelta.toFixed(2),
              percentageChange,
              reasoning: calculation.reasoning,
            } as any,
            actualImpact: {
              priceChange: priceDelta.toFixed(2),
              percentageChange,
            } as any,
          })
          .where(eq(autonomousActions.id, action.id));

        console.log(`✅ [Action Processor] Database transaction committed`);
      });

      // Success - both Shopify and database updated
      const percentageChange = (((finalPrice - oldPrice) / oldPrice) * 100).toFixed(2);
      console.log(`✅ [Action Processor] Price updated for product: ${product.name}`);
      console.log(`   - Old Price: $${oldPrice}`);
      console.log(`   - New Price: $${finalPrice}`);
      console.log(`   - Change: ${percentageChange}%`);
    } catch (dbError) {
      console.error(`❌ [Price Change] Database transaction failed:`, dbError);
      
      // CRITICAL: Shopify was updated but DB transaction failed
      // Attempt compensating rollback to Shopify with retries
      let rollbackSucceeded = false;
      let rollbackAttempts = 0;
      const maxRollbackAttempts = 3;
      
      if (shopifyUpdated && shopifyClient && product.shopifyId) {
        while (rollbackAttempts < maxRollbackAttempts && !rollbackSucceeded) {
          rollbackAttempts++;
          try {
            console.warn(`⚠️  [Price Change] Attempting Shopify rollback to $${oldPrice} (attempt ${rollbackAttempts}/${maxRollbackAttempts})`);
            await shopifyClient.updateProductPrice(product.shopifyId, oldPrice.toFixed(2));
            rollbackSucceeded = true;
            console.log(`✅ [Price Change] Shopify rollback successful - price reverted to $${oldPrice}`);
          } catch (rollbackError) {
            console.error(`❌ [Price Change] Rollback attempt ${rollbackAttempts} failed:`, rollbackError);
            if (rollbackAttempts < maxRollbackAttempts) {
              // Wait before retry with exponential backoff
              const delay = Math.min(1000 * Math.pow(2, rollbackAttempts), 5000);
              console.log(`   Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        // If all rollback attempts failed, persist reconciliation need
        if (!rollbackSucceeded) {
          console.error(`❌ [Price Change] CRITICAL: All ${maxRollbackAttempts} Shopify rollback attempts failed!`);
          console.error(`   Shopify has price $${finalPrice} but database has $${oldPrice}`);
          console.error(`   Creating reconciliation record for product ${product.id}`);
          
          // DURABLE RECONCILIATION TRACKING: Persist divergence to action record
          // This ensures operators can detect and fix the inconsistency
          let reconciliationPersisted = false;
          try {
            await db
              .update(autonomousActions)
              .set({
                status: 'failed',
                completedAt: new Date(),
                result: {
                  error: `Database transaction failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
                  needsReconciliation: true,
                  reconciliationDetails: {
                    shopifyPrice: finalPrice.toFixed(2),
                    databasePrice: oldPrice.toFixed(2),
                    shopifyId: product.shopifyId,
                    productId: product.id,
                    productName: product.name,
                    rollbackAttempts: maxRollbackAttempts,
                    timestamp: new Date().toISOString(),
                  },
                } as any,
              })
              .where(eq(autonomousActions.id, action.id));
            
            reconciliationPersisted = true;
            console.error(`✅ [Price Change] Reconciliation record persisted in action ${action.id}`);
          } catch (persistError) {
            console.error(`❌ [Price Change] Failed to persist reconciliation record:`, persistError);
            // reconciliationPersisted remains false, outer catch will mark action as failed
          }
          
          // Re-throw with reconciliation status
          if (reconciliationPersisted) {
            throw new Error(`RECONCILIATION_PERSISTED: Database transaction failed and Shopify rollback failed after ${maxRollbackAttempts} attempts.`);
          } else {
            throw new Error(`RECONCILIATION_FAILED_TO_PERSIST: Could not persist reconciliation record. Shopify has $${finalPrice}, DB has $${oldPrice}.`);
          }
        }
      }
      
      // Re-throw error to mark action as failed (rollback succeeded, so no divergence)
      throw new Error(`Database transaction failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
    }
  } catch (error) {
    console.error(`❌ [Action Processor] Error changing price:`, error);

    // CRITICAL: Handle reconciliation scenarios properly
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Case 1: Reconciliation was successfully persisted
    if (errorMessage.includes('RECONCILIATION_PERSISTED:')) {
      console.error(`⚠️  [Action Processor] Reconciliation record already persisted, skipping duplicate update`);
      // The action record was already updated with needsReconciliation=true
      // Do NOT overwrite it here - the reconciliation details are preserved
      return;
    }
    
    // Case 2: Reconciliation persistence failed - action still needs to be marked failed
    if (errorMessage.includes('RECONCILIATION_FAILED_TO_PERSIST:')) {
      console.error(`❌ [Action Processor] Reconciliation persistence failed - marking action as failed with error details`);
      // Fall through to mark action as failed with full error message
      // This ensures the action doesn't stay in 'running' status forever
    }

    // Mark action as failed (for all non-persisted-reconciliation errors)
    await db
      .update(autonomousActions)
      .set({
        status: 'failed',
        completedAt: new Date(),
        result: {
          error: errorMessage,
        } as any,
      })
      .where(eq(autonomousActions.id, action.id));
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

    // Create snapshot BEFORE transaction - this persists even if AI/updates fail
    // This ensures we have a record of attempted changes for debugging
    await db.insert(productSnapshots).values({
      productId: product.id,
      actionId: action.id,
      snapshotData: {
        product: product,
        seoMeta: existingSeoMeta[0] || null,
      } as any,
      reason: 'before_optimization',
    });

    // Generate SEO content BEFORE transaction
    // If this fails, catch block marks action as failed (no transaction conflict)
    const seoContent = await generateSEOContent(product);

    // TRANSACTIONAL SAFETY: Wrap only database updates in transaction
    // If updates fail, they roll back atomically (snapshot and AI result persist)
    await db.transaction(async (tx) => {

      if (existingSeoMeta.length > 0) {
        // Update existing
        await tx
          .update(seoMeta)
          .set({
            seoTitle: seoContent.seoTitle,
            metaDescription: seoContent.metaDescription,
            seoScore: seoContent.seoScore,
          })
          .where(eq(seoMeta.productId, product.id));
      } else {
        // Create new
        await tx.insert(seoMeta).values({
          productId: product.id,
          seoTitle: seoContent.seoTitle,
          metaDescription: seoContent.metaDescription,
          seoScore: seoContent.seoScore,
        });
      }

      // Update action status
      await tx
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
    });
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

  // SAFETY: Skip dry-run actions BEFORE updating status
  // Dry-run actions are preview-only and should never be executed
  if (action.status === 'dry_run') {
    console.log(`⏭️  [Action Processor] Skipping dry-run action ${action.id} (preview only)`);
    return;
  }

  // Update status to running (only for pending actions)
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
      await executeCartRecovery(action);
      break;

    case 'price_change':
      await executePriceChange(action);
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
