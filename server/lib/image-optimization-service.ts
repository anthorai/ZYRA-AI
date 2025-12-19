import OpenAI from 'openai';
import { z } from 'zod';
import type { IStorage } from '../storage';
import type { BulkImageJob, BulkImageJobItem, ImageOptimizationHistory } from '../../shared/schema';
import { getShopifyClient } from './shopify-client';

// Zod schema for AI response validation
const AIVisionResponseSchema = z.object({
  altText: z.string().min(1).max(200),
  analysis: z.object({
    objects: z.array(z.string()),
    colors: z.array(z.string()),
    style: z.string(),
    useCase: z.string(),
    keywords: z.array(z.string()),
  }),
});

// Lazy initialize OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please set AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY environment variable.');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

interface ProductImageInfo {
  productId: string;
  productName: string;
  shopifyProductId?: string;
  images: {
    id: string;
    url: string;
    alt?: string;
    position: number;
  }[];
  hasImages: boolean;
  imageCount: number;
}

interface ImageOptimizationResult {
  imageId: string;
  imageUrl: string;
  oldAltText: string | null;
  newAltText: string;
  aiAnalysis: {
    objects: string[];
    colors: string[];
    style: string;
    useCase: string;
    keywords: string[];
  };
  tokensUsed: number;
  processingTimeMs: number;
}

export class ImageOptimizationService {
  private readonly BATCH_SIZE = 5; // Process 5 images at a time
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 2000;
  private readonly MAX_CONCURRENT_BATCHES = 2;

  constructor(private storage: IStorage) {}

  /**
   * Helper to delay execution
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch all images for selected products from Shopify
   */
  async fetchProductImages(
    userId: string,
    productIds: string[],
    shopifyClient: any
  ): Promise<ProductImageInfo[]> {
    const productImagesInfo: ProductImageInfo[] = [];

    for (const productId of productIds) {
      try {
        // Get product from local DB
        const product = await this.storage.getProduct(productId);
        if (!product) continue;

        // If product has Shopify ID, fetch images from Shopify
        if (product.shopifyId && shopifyClient) {
          try {
            const shopifyProduct = await shopifyClient.getProduct(product.shopifyId);
            const images = (shopifyProduct.images || []).map((img: any, index: number) => ({
              id: img.id.toString(),
              url: img.src,
              alt: img.alt || null,
              position: img.position || index + 1,
            }));

            productImagesInfo.push({
              productId: product.id,
              productName: product.name,
              shopifyProductId: product.shopifyId,
              images,
              hasImages: images.length > 0,
              imageCount: images.length,
            });
          } catch (shopifyError) {
            console.error(`Failed to fetch Shopify images for product ${productId}:`, shopifyError);
            // Product exists but couldn't fetch images
            productImagesInfo.push({
              productId: product.id,
              productName: product.name,
              shopifyProductId: product.shopifyId,
              images: [],
              hasImages: false,
              imageCount: 0,
            });
          }
        } else {
          // No Shopify integration - mark as no images
          productImagesInfo.push({
            productId: product.id,
            productName: product.name,
            images: [],
            hasImages: false,
            imageCount: 0,
          });
        }
      } catch (error) {
        console.error(`Error processing product ${productId}:`, error);
      }
    }

    return productImagesInfo;
  }

  /**
   * Create a bulk image optimization job
   */
  async createJob(
    userId: string,
    productImages: ProductImageInfo[]
  ): Promise<BulkImageJob> {
    const totalImages = productImages.reduce((sum, p) => sum + p.imageCount, 0);
    const missingImageProducts = productImages.filter(p => !p.hasImages).length;

    const job = await this.storage.createBulkImageJob({
      userId,
      name: `Image Optimization - ${new Date().toLocaleDateString()}`,
      status: 'pending',
      totalProducts: productImages.length,
      totalImages,
      processedImages: 0,
      optimizedImages: 0,
      failedImages: 0,
      missingImageProducts,
      progressPercentage: 0,
      totalTokensUsed: 0,
      estimatedCost: '0',
      aiModel: 'gpt-4o-mini',
    });

    // Create job items
    for (const productInfo of productImages) {
      await this.storage.createBulkImageJobItem({
        jobId: job.id,
        productId: productInfo.productId,
        productName: productInfo.productName,
        shopifyProductId: productInfo.shopifyProductId || null,
        imageCount: productInfo.imageCount,
        imageList: productInfo.images,
        status: productInfo.hasImages ? 'pending' : 'missing_image',
        errorMessage: productInfo.hasImages ? null : 'This product has no images',
      });
    }

    return job;
  }

  /**
   * Process a bulk image optimization job
   */
  async processJob(jobId: string, shopifyClient: any): Promise<void> {
    try {
      await this.storage.updateBulkImageJob(jobId, {
        status: 'processing',
        startedAt: new Date(),
      });

      const items = await this.storage.getBulkImageJobItems(jobId);
      const pendingItems = items.filter(item => item.status === 'pending');

      let processedCount = 0;
      let optimizedCount = 0;
      let failedCount = 0;
      let totalTokensUsed = 0;

      // Get job to ensure we have userId
      const job = await this.storage.getBulkImageJob(jobId);
      if (!job) throw new Error('Job not found');

      // Process items with batch control and retry logic
      for (let i = 0; i < pendingItems.length; i += this.BATCH_SIZE) {
        const batch = pendingItems.slice(i, i + this.BATCH_SIZE);
        
        await Promise.all(batch.map(async (item) => {
          let retryCount = 0;
          
          while (retryCount < this.MAX_RETRIES) {
            try {
              await this.storage.updateBulkImageJobItem(item.id, {
                status: 'processing',
                retryCount,
              });

              const images = (item.imageList as any[]) || [];
              const results: ImageOptimizationResult[] = [];

              for (const image of images) {
                try {
                  const result = await this.generateAltTextWithRetry(
                    image.url,
                    item.productName,
                    image.alt || null,
                    this.MAX_RETRIES
                  );
                  results.push(result);
                  optimizedCount++;
                  totalTokensUsed += result.tokensUsed;

                  // Save to history
                  await this.storage.createImageOptimizationHistory({
                    userId: job.userId,
                    productId: item.productId,
                    productName: item.productName,
                    shopifyProductId: item.shopifyProductId || null,
                    shopifyImageId: image.id,
                    imageUrl: image.url,
                    oldAltText: image.alt || null,
                    newAltText: result.newAltText,
                    aiAnalysis: result.aiAnalysis,
                    appliedToShopify: false,
                    jobId,
                  });
                } catch (imageError) {
                  console.error(`Failed to process image ${image.id}:`, imageError);
                  failedCount++;
                }
              }

              processedCount += images.length;

              await this.storage.updateBulkImageJobItem(item.id, {
                status: 'completed',
                tokensUsed: results.reduce((sum, r) => sum + r.tokensUsed, 0),
                processingTimeMs: results.reduce((sum, r) => sum + r.processingTimeMs, 0),
              });

              // Update job progress - guard against division by zero
              const totalImages = await this.getTotalImages(jobId);
              const progress = totalImages > 0 ? Math.round((processedCount / totalImages) * 100) : 0;
              
              await this.storage.updateBulkImageJob(jobId, {
                processedImages: processedCount,
                optimizedImages: optimizedCount,
                failedImages: failedCount,
                progressPercentage: progress,
                totalTokensUsed,
                estimatedCost: this.calculateCost(totalTokensUsed).toFixed(4),
              });

              break; // Success, exit retry loop
            } catch (itemError) {
              retryCount++;
              console.error(`Failed to process item ${item.id} (attempt ${retryCount}/${this.MAX_RETRIES}):`, itemError);
              
              if (retryCount >= this.MAX_RETRIES) {
                await this.storage.updateBulkImageJobItem(item.id, {
                  status: 'failed',
                  errorMessage: itemError instanceof Error ? itemError.message : 'Unknown error',
                  retryCount,
                });
              } else {
                await this.delay(this.RETRY_DELAY_MS * retryCount); // Exponential backoff
              }
            }
          }
        }));
      }

      await this.storage.updateBulkImageJob(jobId, {
        status: 'completed',
        completedAt: new Date(),
      });
    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);
      await this.storage.updateBulkImageJob(jobId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      });
    }
  }

  /**
   * Generate SEO-optimized alt-text using AI Vision with retry logic
   */
  private async generateAltTextWithRetry(
    imageUrl: string,
    productName: string,
    currentAlt: string | null,
    maxRetries: number
  ): Promise<ImageOptimizationResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.generateAltText(imageUrl, productName, currentAlt);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`AI Vision attempt ${attempt + 1}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries - 1) {
          await this.delay(this.RETRY_DELAY_MS * (attempt + 1));
        }
      }
    }
    
    throw lastError || new Error('Failed to generate alt-text after retries');
  }

  /**
   * Generate SEO-optimized alt-text using AI Vision
   */
  private async generateAltText(
    imageUrl: string,
    productName: string,
    currentAlt: string | null
  ): Promise<ImageOptimizationResult> {
    const startTime = Date.now();

    const prompt = `You are an expert in image accessibility and SEO optimization. Analyze this product image and generate a high-quality alt-text description.

Product Name: ${productName}
Current Alt-Text: ${currentAlt || 'None'}

Generate a new alt-text that:
1. Is 10-18 words long
2. Includes the product name naturally
3. Describes key visual elements (color, material, angle, background)
4. Uses SEO-friendly keywords relevant to the product category
5. Is accessibility-friendly and descriptive
6. Has NO emojis, NO full stops, NO SKU numbers
7. Sounds natural and engaging

Also provide a brief analysis including:
- Main objects/subjects detected
- Dominant colors
- Photography style (e.g., "product shot on white background", "lifestyle image", etc.)
- Suggested use case or target audience
- Top 3-5 relevant SEO keywords

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "altText": "your generated alt-text here",
  "analysis": {
    "objects": ["object1", "object2"],
    "colors": ["color1", "color2"],
    "style": "photography style description",
    "useCase": "suggested use case",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
}`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
        response_format: { type: 'json_object' }, // Enforce JSON response
      });

      const content = response.choices[0].message.content || '{}';
      
      // Validate response with Zod schema
      let parsedResult;
      try {
        const jsonData = JSON.parse(content);
        parsedResult = AIVisionResponseSchema.parse(jsonData);
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        throw new Error(`Invalid AI response format: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
      
      const processingTimeMs = Date.now() - startTime;
      
      // Safely handle token usage - may be undefined
      const tokensUsed = response.usage?.total_tokens ?? 0;

      return {
        imageId: imageUrl,
        imageUrl,
        oldAltText: currentAlt,
        newAltText: parsedResult.altText,
        aiAnalysis: parsedResult.analysis,
        tokensUsed,
        processingTimeMs,
      };
    } catch (error) {
      console.error('AI Vision error:', error);
      throw new Error(`Failed to generate alt-text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply optimized alt-text to Shopify
   */
  async applyToShopify(
    historyIds: string[],
    shopifyClient: any
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    // Fetch specific history records by IDs
    const historyItems = await this.storage.getImageOptimizationHistoryByIds(historyIds);

    for (const item of historyItems) {
      try {
        if (!item.shopifyProductId || !item.shopifyImageId) {
          console.error(`Missing Shopify IDs for history ${item.id}`);
          failed++;
          continue;
        }

        await shopifyClient.updateProductImage(
          item.shopifyProductId,
          item.shopifyImageId,
          item.newAltText
        );

        await this.storage.updateImageOptimizationHistory(item.id, {
          appliedToShopify: true,
          appliedAt: new Date(),
        });

        success++;
      } catch (error) {
        console.error(`Failed to apply alt-text for history ${item.id}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Get total images in a job
   */
  private async getTotalImages(jobId: string): Promise<number> {
    const job = await this.storage.getBulkImageJob(jobId);
    return job?.totalImages || 0;
  }

  /**
   * Calculate estimated cost based on tokens
   */
  private calculateCost(tokens: number): number {
    // GPT-4o-mini pricing: approximately $0.00015 per 1K tokens (input) + $0.0006 per 1K tokens (output)
    // Average for vision tasks: ~$0.0004 per 1K tokens
    return (tokens / 1000) * 0.0004;
  }

  /**
   * Get all jobs for a user
   */
  async getJobs(userId: string): Promise<BulkImageJob[]> {
    return await this.storage.getBulkImageJobs(userId);
  }

  /**
   * Get job details with items
   */
  async getJob(jobId: string): Promise<(BulkImageJob & { items: BulkImageJobItem[] }) | null> {
    const job = await this.storage.getBulkImageJob(jobId);
    if (!job) return null;

    const items = await this.storage.getBulkImageJobItems(jobId);
    return { ...job, items };
  }

  /**
   * Get optimization history
   */
  async getHistory(
    userId: string,
    filters?: { productId?: string; jobId?: string }
  ): Promise<ImageOptimizationHistory[]> {
    return await this.storage.getImageOptimizationHistory(userId, filters);
  }
}
