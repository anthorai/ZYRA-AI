import OpenAI from 'openai';
import { eq, and } from 'drizzle-orm';
import type { IStorage } from '../storage';
import type { BulkOptimizationJob, BulkOptimizationItem, InsertBulkOptimizationItem } from '../../shared/schema';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is required for bulk optimization. Please set AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY environment variable.');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

interface ProductInput {
  productId?: string;
  productName: string;
  category?: string;
  keyFeatures?: string;
  targetAudience?: string;
}

interface BatchResult {
  itemId: string;
  success: boolean;
  data?: any;
  error?: string;
  tokensUsed?: number;
  processingTimeMs?: number;
}

export class BulkOptimizationService {
  private readonly BATCH_SIZE = 4; // Optimal: 4 products per AI call
  private readonly MAX_CONCURRENT_BATCHES = 3; // Process 3 batches in parallel
  private readonly RETRY_DELAY_MS = 2000; // 2 second delay between retries
  
  constructor(private storage: IStorage) {}

  /**
   * Create a new bulk optimization job
   */
  async createJob(userId: string, productIds: string[], name: string = 'Bulk Optimization Job', optimizationMode: 'fast' | 'competitive' = 'fast'): Promise<BulkOptimizationJob> {
    const jobName = optimizationMode === 'competitive' 
      ? `${name} (Competitive Intelligence)` 
      : `${name} (Fast Mode)`;
    
    return await this.storage.createBulkOptimizationJob({
      userId,
      name: jobName,
      totalItems: productIds.length,
      processedItems: 0,
      optimizedItems: 0,
      failedItems: 0,
      skippedItems: 0,
      status: 'pending',
      progressPercentage: 0,
      totalTokensUsed: 0,
      estimatedCost: '0',
      metadata: { optimizationMode }, // Store the mode for later processing
    });
  }

  /**
   * Get all jobs for a user
   */
  async getJobs(userId: string): Promise<BulkOptimizationJob[]> {
    return await this.storage.getBulkOptimizationJobs(userId);
  }

  /**
   * Get a single job with its items
   */
  async getJob(jobId: string): Promise<(BulkOptimizationJob & { items: BulkOptimizationItem[] }) | null> {
    const job = await this.storage.getBulkOptimizationJob(jobId);
    if (!job) return null;

    const items = await this.storage.getBulkOptimizationItems(jobId);
    return { ...job, items };
  }

  /**
   * Delete a job and all its items
   */
  async deleteJob(jobId: string): Promise<void> {
    await this.storage.deleteBulkOptimizationJob(jobId);
  }

  /**
   * Generate comprehensive SEO content using the unified Master Prompt
   * This is the same prompt used in the single-product SEO Engine
   */
  private async generateSEOContent(product: ProductInput): Promise<any> {
    const startTime = Date.now();
    
    const comprehensivePrompt = `You are an expert SEO specialist. Generate comprehensive SEO content for this product:

**Product Name:** ${product.productName}
**Category:** ${product.category || 'General'}
**Key Features:** ${product.keyFeatures || 'Premium quality product'}
**Target Audience:** ${product.targetAudience || 'General consumers'}

Generate ALL of the following in a single, optimized package:

1. **SEO Title** (under 60 characters): Keyword-rich, click-worthy title for search engines
2. **Full Product Description** (200-300 words): Structured, persuasive description with:
   - Compelling opening that highlights main benefit
   - Feature list with benefits
   - Use case scenarios
   - Call to action
   - Natural keyword integration
3. **Meta Title** (under 60 characters): Optimized for search result previews
4. **Meta Description** (under 160 characters): Compelling preview text for search results
5. **SEO Keywords** (5-7 keywords): Most relevant keywords for this product
6. **SEO Score** (0-100): Predicted ranking score based on optimization quality
7. **Search Intent**: Primary search intent (commercial, informational, navigational, or transactional)
8. **Suggested Keywords** (3-5): Additional high-value keywords to consider

Respond with JSON in this exact format:
{
  "seoTitle": "your seo title",
  "seoDescription": "your full product description with proper structure and formatting",
  "metaTitle": "your meta title",
  "metaDescription": "your meta description",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "seoScore": 85,
  "searchIntent": "commercial",
  "suggestedKeywords": ["keyword6", "keyword7", "keyword8"]
}`;

    try {
      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini", // Cost-optimized for bulk
        messages: [{ role: "user", content: comprehensivePrompt }],
        temperature: 0.7,
        max_tokens: 1200,
        response_format: { type: "json_object" },
      });

      // Robust error handling for malformed responses
      const messageContent = response.choices?.[0]?.message?.content;
      if (!messageContent) {
        throw new Error('Empty response from OpenAI API');
      }

      let result: any;
      try {
        result = JSON.parse(messageContent);
      } catch (parseError) {
        console.error('JSON parse error:', messageContent);
        throw new Error('Failed to parse OpenAI response as JSON');
      }

      // Validate required fields
      if (!result.seoTitle || !result.metaTitle || !result.metaDescription) {
        throw new Error('OpenAI response missing required fields');
      }

      const processingTimeMs = Date.now() - startTime;
      const tokensUsed = response.usage?.total_tokens || 0;

      return {
        seoTitle: result.seoTitle || '',
        seoDescription: result.seoDescription || '',
        metaTitle: result.metaTitle || '',
        metaDescription: result.metaDescription || '',
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
        seoScore: result.seoScore || 0,
        searchIntent: result.searchIntent || 'commercial',
        suggestedKeywords: Array.isArray(result.suggestedKeywords) ? result.suggestedKeywords : [],
        tokensUsed,
        processingTimeMs,
      };
    } catch (error: any) {
      console.error(`SEO generation error for ${product.productName}:`, error.message);
      throw error;
    }
  }

  /**
   * Process a single batch of products (3-5 products)
   * Uses Promise.allSettled to handle partial failures gracefully
   */
  private async processBatch(items: BulkOptimizationItem[], jobId: string): Promise<BatchResult[]> {
    console.log(`📦 Processing batch of ${items.length} products for job ${jobId}`);

    const promises = items.map(async (item): Promise<BatchResult> => {
      try {
        // Update item status to processing
        await this.storage.updateBulkOptimizationItem(item.id, {
          status: 'processing',
          updatedAt: new Date(),
        });

        // Generate SEO content using Master Prompt
        const result = await this.generateSEOContent({
          productId: item.productId || undefined,
          productName: item.productName,
          category: item.category || undefined,
          keyFeatures: item.keyFeatures || undefined,
          targetAudience: item.targetAudience || undefined,
        });

        // Update item with generated content
        await this.storage.updateBulkOptimizationItem(item.id, {
          status: 'optimized',
          seoTitle: result.seoTitle,
          seoDescription: result.seoDescription,
          metaTitle: result.metaTitle,
          metaDescription: result.metaDescription,
          keywords: result.keywords,
          seoScore: result.seoScore,
          searchIntent: result.searchIntent,
          suggestedKeywords: result.suggestedKeywords,
          tokensUsed: result.tokensUsed,
          processingTimeMs: result.processingTimeMs,
          updatedAt: new Date(),
        });

        return {
          itemId: item.id,
          success: true,
          data: result,
          tokensUsed: result.tokensUsed,
          processingTimeMs: result.processingTimeMs,
        };
      } catch (error: any) {
        console.error(`❌ Failed to process ${item.productName}:`, error.message);

        // Check if we should retry
        const shouldRetry = item.retryCount < item.maxRetries;
        
        await this.storage.updateBulkOptimizationItem(item.id, {
          status: shouldRetry ? 'retrying' : 'failed',
          errorMessage: error.message,
          retryCount: item.retryCount + 1,
          updatedAt: new Date(),
        });

        return {
          itemId: item.id,
          success: false,
          error: error.message,
        };
      }
    });

    const results = await Promise.allSettled(promises);
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : {
        itemId: 'unknown',
        success: false,
        error: 'Promise rejected',
      }
    );
  }

  /**
   * Process an entire bulk optimization job
   * Uses smart batching and parallel processing
   */
  async processJob(jobId: string): Promise<void> {
    console.log(`🚀 Starting bulk optimization job: ${jobId}`);

    try {
      // Update job status to processing
      await this.storage.updateBulkOptimizationJob(jobId, {
        status: 'processing',
        startedAt: new Date(),
        updatedAt: new Date(),
      });

      // Get all pending and retrying items for this job
      const allItems = await this.storage.getBulkOptimizationItems(jobId);
      const itemsToProcess = allItems.filter(
        item => item.status === 'pending' || item.status === 'retrying'
      );

      if (itemsToProcess.length === 0) {
        console.log('✅ No items to process');
        await this.storage.updateBulkOptimizationJob(jobId, {
          status: 'completed',
          completedAt: new Date(),
          progressPercentage: 100,
          updatedAt: new Date(),
        });
        return;
      }

      // Split items into batches
      const batches: BulkOptimizationItem[][] = [];
      for (let i = 0; i < itemsToProcess.length; i += this.BATCH_SIZE) {
        batches.push(itemsToProcess.slice(i, i + this.BATCH_SIZE));
      }

      console.log(`📊 Processing ${itemsToProcess.length} products in ${batches.length} batches`);

      let totalTokensUsed = 0;
      let processedCount = 0;

      // Process batches with concurrency control
      for (let i = 0; i < batches.length; i += this.MAX_CONCURRENT_BATCHES) {
        const batchGroup = batches.slice(i, i + this.MAX_CONCURRENT_BATCHES);
        
        // Process batches in parallel (up to MAX_CONCURRENT_BATCHES at a time)
        const batchResults = await Promise.all(
          batchGroup.map(batch => this.processBatch(batch, jobId))
        );

        // Update job progress (only count successful results)
        for (const results of batchResults) {
          for (const result of results) {
            // Only increment for valid results with itemId
            if (result.itemId && result.itemId !== 'unknown') {
              processedCount++;
              if (result.tokensUsed) {
                totalTokensUsed += result.tokensUsed;
              }
            }
          }
        }

        const progressPercentage = Math.round((processedCount / itemsToProcess.length) * 100);

        await this.storage.updateBulkOptimizationJob(jobId, {
          processedItems: processedCount,
          progressPercentage,
          totalTokensUsed,
          updatedAt: new Date(),
        });

        console.log(`📈 Progress: ${progressPercentage}% (${processedCount}/${itemsToProcess.length})`);
      }

      // Get final counts
      const finalItems = await this.storage.getBulkOptimizationItems(jobId);
      const optimizedCount = finalItems.filter(item => item.status === 'optimized').length;
      const failedCount = finalItems.filter(item => item.status === 'failed').length;
      const skippedCount = finalItems.filter(item => item.status === 'skipped').length;

      // Update job as completed
      await this.storage.updateBulkOptimizationJob(jobId, {
        status: 'completed',
        completedAt: new Date(),
        processedItems: processedCount,
        optimizedItems: optimizedCount,
        failedItems: failedCount,
        skippedItems: skippedCount,
        progressPercentage: 100,
        totalTokensUsed,
        estimatedCost: ((totalTokensUsed / 1000000) * 0.15).toFixed(4), // $0.15 per 1M tokens for GPT-4o-mini
        updatedAt: new Date(),
      });

      console.log(`✅ Job completed: ${optimizedCount} optimized, ${failedCount} failed, ${skippedCount} skipped`);
    } catch (error: any) {
      console.error(`❌ Job failed:`, error);
      
      await this.storage.updateBulkOptimizationJob(jobId, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date(),
        updatedAt: new Date(),
      });

      throw error;
    }
  }

  /**
   * Retry failed items in a job with exponential backoff
   */
  async retryFailedItems(jobId: string): Promise<void> {
    const items = await this.storage.getBulkOptimizationItems(jobId);
    const failedItems = items.filter(item => item.status === 'failed');

    if (failedItems.length === 0) {
      console.log('No failed items to retry');
      return;
    }

    console.log(`🔄 Retrying ${failedItems.length} failed items with exponential backoff`);

    // Reset failed items to pending
    for (const item of failedItems) {
      // Calculate exponential backoff delay: 2^retryCount * 2000ms
      const delayMs = Math.pow(2, item.retryCount) * this.RETRY_DELAY_MS;
      
      console.log(`⏱️  Waiting ${delayMs}ms before retrying ${item.productName}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));

      await this.storage.updateBulkOptimizationItem(item.id, {
        status: 'pending',
        errorMessage: null,
        updatedAt: new Date(),
      });
    }

    // Reprocess the job
    await this.processJob(jobId);
  }
}
