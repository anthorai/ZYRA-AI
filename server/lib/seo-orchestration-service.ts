/**
 * SEO Orchestration Service
 * 
 * Server-side service that coordinates all Wave 1 SEO components:
 * - SERP pattern analysis
 * - Marketing framework auto-selection  
 * - Brand DNA loading and application
 * - Unified SEO engine generation
 * - Usage tracking and learning
 */

import { generateUnifiedSEO, type SEOGenerationInput, type UnifiedSEOOutput } from '../../shared/unified-seo-engine';
import { analyzeSERPPatterns } from './serp-analyzer';
import { autoSelectFramework, type ProductAttributes } from './template-auto-selector';
import { analyzeBrandDNA, type BrandDNA } from '../../shared/brand-dna-analyzer';

export interface OrchestrationOptions {
  enableSERPAnalysis?: boolean;
  enableFrameworkAutoSelection?: boolean;
  enableBrandDNA?: boolean;
  shopifyFormatting?: boolean;
  useAdvancedModel?: boolean;
}

export interface ProductSEORequest {
  // Product Data
  productName: string;
  category?: string;
  keyFeatures?: string;
  targetAudience?: string;
  pricePoint?: 'budget' | 'mid-range' | 'premium' | 'luxury';
  price?: number;
  
  // Current Content (for optimization)
  currentTitle?: string;
  currentDescription?: string;
  
  // Keywords
  keywords?: string[];
  
  // User Info
  userId: string;
  
  // Options
  options?: OrchestrationOptions;
}

export interface SEOOrchestrationResult extends UnifiedSEOOutput {
  // Metadata about the generation
  recommendedFramework?: {
    id: string;
    name: string;
    confidence: number;
    reason: string;
  };
  serpAnalysis?: {
    searchIntent: string;
    titlePatterns: string[];
    commonKeywords: string[];
  };
  brandDNAApplied?: boolean;
  generationTimeMs?: number;
}

/**
 * Main orchestration function - coordinates all SEO generation components
 */
export async function orchestrateSEOGeneration(
  request: ProductSEORequest,
  openaiClient: any,
  db?: any // Database connection for brand DNA and tracking
): Promise<SEOOrchestrationResult> {
  const startTime = Date.now();
  const opts = request.options || {};
  
  try {
    // Step 1: Fetch SERP patterns (if enabled)
    let serpData;
    if (opts.enableSERPAnalysis) {
      console.log(`[Orchestrator] Analyzing SERP patterns for "${request.productName}"`);
      serpData = await analyzeSERPPatterns({
        productName: request.productName,
        category: request.category,
        keywords: request.keywords
      });
    }
    
    // Step 2: Auto-select marketing framework (if enabled and not provided)
    let selectedFramework;
    let frameworkRecommendation;
    
    if (opts.enableFrameworkAutoSelection) {
      console.log('[Orchestrator] Auto-selecting marketing framework');
      const productAttrs: ProductAttributes = {
        productName: request.productName,
        category: request.category,
        pricePoint: request.pricePoint,
        targetAudience: request.targetAudience,
        price: request.price,
        currentDescription: request.currentDescription,
      };
      
      frameworkRecommendation = autoSelectFramework(productAttrs);
      selectedFramework = frameworkRecommendation.framework;
      
      console.log(`[Orchestrator] Selected framework: ${selectedFramework.name} (${frameworkRecommendation.confidence}% confidence)`);
    }
    
    // Step 3: Load brand DNA from database (if enabled)
    let brandDNA: BrandDNA | undefined;
    if (opts.enableBrandDNA && db) {
      console.log('[Orchestrator] Loading brand DNA for user', request.userId);
      brandDNA = await loadBrandDNA(request.userId, db);
      
      if (!brandDNA) {
        console.log('[Orchestrator] No brand DNA found - will use defaults');
      }
    }
    
    // Step 4: Build input for unified SEO engine
    const seoInput: SEOGenerationInput = {
      productName: request.productName,
      category: request.category,
      keyFeatures: request.keyFeatures,
      targetAudience: request.targetAudience,
      pricePoint: request.pricePoint,
      currentTitle: request.currentTitle,
      currentDescription: request.currentDescription,
      keywords: request.keywords,
      marketingFramework: selectedFramework,
      brandDNA,
      serp: serpData,
      shopifyHtmlFormatting: opts.shopifyFormatting !== false, // Default to true
    };
    
    // Step 5: Generate SEO content using unified engine
    console.log('[Orchestrator] Generating SEO content with unified engine');
    const output = await generateUnifiedSEO(seoInput, openaiClient);
    
    // Step 6: Track usage in database (for learning)
    if (db && selectedFramework) {
      await trackFrameworkUsage({
        userId: request.userId,
        frameworkId: selectedFramework.id,
        frameworkName: selectedFramework.name,
        productName: request.productName,
        productCategory: request.category,
        pricePoint: request.pricePoint,
        wasRecommended: opts.enableFrameworkAutoSelection || false,
        recommendationConfidence: frameworkRecommendation?.confidence,
        seoScore: output.seoScore,
        conversionScore: output.conversionScore,
        brandVoiceMatchScore: output.brandVoiceMatchScore,
      }, db);
    }
    
    // Step 7: Build comprehensive result
    const generationTimeMs = Date.now() - startTime;
    
    const result: SEOOrchestrationResult = {
      ...output,
      recommendedFramework: frameworkRecommendation ? {
        id: frameworkRecommendation.framework.id,
        name: frameworkRecommendation.framework.name,
        confidence: frameworkRecommendation.confidence,
        reason: frameworkRecommendation.reason,
      } : undefined,
      serpAnalysis: serpData ? {
        searchIntent: serpData.searchIntent,
        titlePatterns: serpData.topRankingTitlePatterns,
        commonKeywords: serpData.commonKeywords,
      } : undefined,
      brandDNAApplied: !!brandDNA,
      generationTimeMs,
    };
    
    console.log(`[Orchestrator] Generation complete in ${generationTimeMs}ms`);
    return result;
    
  } catch (error) {
    console.error('[Orchestrator] SEO generation failed:', error);
    throw error;
  }
}

/**
 * Load brand DNA from database
 */
async function loadBrandDNA(userId: string, db: any): Promise<BrandDNA | undefined> {
  try {
    const { getBrandDNAProfile } = await import('../services/wave1-persistence');
    const result = await getBrandDNAProfile(userId);
    return result || undefined;
  } catch (error) {
    console.error('[Orchestrator] Failed to load brand DNA:', error);
    return undefined;
  }
}

/**
 * Track framework usage for learning
 */
async function trackFrameworkUsage(
  usage: {
    userId: string;
    frameworkId: string;
    frameworkName: string;
    productName: string;
    productCategory?: string;
    pricePoint?: string;
    wasRecommended: boolean;
    recommendationConfidence?: number;
    seoScore?: number;
    conversionScore?: number;
    brandVoiceMatchScore?: number;
  },
  db: any
): Promise<void> {
  try {
    const { trackFrameworkUsage: persistUsage } = await import('../services/wave1-persistence');
    
    // Convert to proper insert format
    const usageData = {
      userId: usage.userId,
      frameworkId: usage.frameworkId,
      frameworkName: usage.frameworkName,
      productName: usage.productName,
      productCategory: usage.productCategory,
      pricePoint: usage.pricePoint as 'budget' | 'mid-range' | 'premium' | 'luxury' | undefined,
      wasRecommended: usage.wasRecommended,
      wasEdited: false, // Default to false since we track this after user edits
      recommendationConfidence: usage.recommendationConfidence,
      seoScore: usage.seoScore,
      conversionScore: usage.conversionScore,
      brandVoiceMatchScore: usage.brandVoiceMatchScore,
    };
    
    await persistUsage(usageData);
  } catch (error) {
    console.error('[Orchestrator] Failed to track usage:', error);
    // Don't throw - tracking failures shouldn't break generation
  }
}

/**
 * Train brand DNA from sample content
 */
export async function trainBrandDNA(
  userId: string,
  sampleTexts: string[],
  openaiClient: any,
  db: any
): Promise<BrandDNA> {
  console.log(`[Orchestrator] Training brand DNA for user ${userId} with ${sampleTexts.length} samples`);
  
  // Analyze brand voice from samples
  const trainingInput = {
    userId,
    sampleTexts,
    productCategory: undefined,
  };
  const brandDNA = await analyzeBrandDNA(trainingInput, userId, openaiClient);
  
  // Save to database
  const { saveBrandDNAProfile } = await import('../services/wave1-persistence');
  await saveBrandDNAProfile(userId, brandDNA);
  
  console.log('[Orchestrator] Brand DNA analysis complete and saved:', {
    writingStyle: brandDNA.writingStyle,
    toneDensity: brandDNA.toneDensity,
    avgSentenceLength: brandDNA.avgSentenceLength,
    confidenceScore: brandDNA.confidenceScore,
  });
  
  return brandDNA;
}

/**
 * Get framework recommendation without generating content
 */
export function getFrameworkRecommendation(
  product: ProductAttributes
): {
  framework: any;
  confidence: number;
  reason: string;
  alternatives: Array<{ framework: any; confidence: number; reason: string }>;
} {
  const recommendation = autoSelectFramework(product);
  return {
    framework: recommendation.framework,
    confidence: recommendation.confidence,
    reason: recommendation.reason,
    alternatives: recommendation.alternativeFrameworks,
  };
}
