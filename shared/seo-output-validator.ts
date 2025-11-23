/**
 * Zod Validation Schemas for SEO Output
 * 
 * Ensures OpenAI responses are properly validated and have all required fields
 * with sensible defaults to maintain "consistent output quality" guarantee
 */

import { z } from 'zod';

/**
 * Strict schema for validating OpenAI SEO generation responses
 */
export const seoOutputSchema = z.object({
  // Core SEO Fields (required with defaults)
  seoTitle: z.string().min(1).max(65).default('Premium Product'),
  seoDescription: z.string().min(50).max(500).default('High-quality product description'),
  metaTitle: z.string().min(1).max(65).default(''),
  metaDescription: z.string().min(50).max(165).default(''),
  
  // Keywords (array with minimum requirements)
  keywords: z.array(z.string()).min(5).max(20).default([]),
  suggestedKeywords: z.array(z.string()).max(10).default([]),
  
  // Shopify Fields
  shopifyTags: z.array(z.string()).max(20).default([]),
  
  // Search Intent
  searchIntent: z.enum(['commercial', 'informational', 'navigational', 'transactional']).default('commercial'),
  
  // Competitive Analysis
  competitorGaps: z.array(z.string()).max(10).default([]),
}).passthrough(); // Allow extra fields from AI

/**
 * Full unified SEO output schema with quality scores
 */
export const unifiedSEOOutputSchema = seoOutputSchema.extend({
  // Quality Scores
  seoScore: z.number().min(0).max(100).default(75),
  readabilityScore: z.number().min(0).max(100).default(70),
  conversionScore: z.number().min(0).max(100).default(70),
  brandVoiceMatchScore: z.number().min(0).max(100).default(85),
  confidence: z.number().min(0).max(100).default(75),
  
  // Shopify Optimized Fields
  shopifyTitle: z.string().max(255).optional(),
  shopifyDescription: z.string().optional(),
  
  // Metadata
  frameworkUsed: z.string().default('Standard'),
  aiModel: z.string().default('gpt-4o-mini'),
  generatedAt: z.string().default(() => new Date().toISOString()),
});

/**
 * Validate and sanitize OpenAI response with comprehensive error handling
 */
export function validateSEOOutput(rawOutput: unknown, context?: {
  productName?: string;
  category?: string;
}): z.infer<typeof unifiedSEOOutputSchema> {
  try {
    // Parse and validate with Zod
    const validated = unifiedSEOOutputSchema.parse(rawOutput);
    
    // Post-validation checks
    if (!validated.metaTitle || validated.metaTitle.length === 0) {
      validated.metaTitle = validated.seoTitle;
    }
    
    if (validated.keywords.length === 0 && context?.productName) {
      // Generate basic keywords from product name if none provided
      validated.keywords = [
        context.productName.toLowerCase(),
        ...(context.category ? [context.category.toLowerCase()] : []),
        'buy online',
        'premium quality',
        'free shipping'
      ].slice(0, 7);
    }
    
    // Ensure tags are populated
    if (validated.shopifyTags.length === 0 && context?.category) {
      validated.shopifyTags = [
        context.category,
        'bestseller',
        'new arrival',
        'featured'
      ];
    }
    
    return validated;
  } catch (error) {
    console.error('[Validator] SEO output validation failed:', error);
    
    // Return safe fallback with minimal valid structure
    return {
      seoTitle: context?.productName || 'Premium Product',
      seoDescription: `Discover our premium ${context?.productName || 'product'}. Shop now with free shipping and guaranteed quality.`,
      metaTitle: context?.productName || 'Premium Product',
      metaDescription: `Shop ${context?.productName || 'premium products'} online. High quality, competitive prices, fast shipping.`,
      keywords: context?.productName ? [context.productName.toLowerCase(), 'buy online', 'shop now'] : ['premium', 'quality', 'buy online'],
      shopifyTags: context?.category ? [context.category] : ['featured'],
      searchIntent: 'commercial' as const,
      suggestedKeywords: [],
      competitorGaps: [],
      seoScore: 60,
      readabilityScore: 70,
      conversionScore: 65,
      brandVoiceMatchScore: 70,
      confidence: 60,
      frameworkUsed: 'Standard',
      aiModel: 'fallback',
      generatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Validate output after HTML formatting to ensure nothing was broken
 */
export function validatePostFormatting(output: z.infer<typeof unifiedSEOOutputSchema>): boolean {
  // Check critical fields aren't empty after formatting
  if (!output.seoTitle || output.seoTitle.trim().length === 0) {
    console.warn('[Validator] seoTitle is empty after formatting');
    return false;
  }
  
  if (!output.seoDescription || output.seoDescription.trim().length === 0) {
    console.warn('[Validator] seoDescription is empty after formatting');
    return false;
  }
  
  // Check HTML didn't break structure
  if (output.shopifyDescription && output.shopifyDescription.includes('undefined')) {
    console.warn('[Validator] Shopify description contains "undefined"');
    return false;
  }
  
  // Ensure arrays weren't corrupted
  if (!Array.isArray(output.keywords) || output.keywords.length === 0) {
    console.warn('[Validator] Keywords array is invalid');
    return false;
  }
  
  return true;
}

/**
 * Schema for tracking framework usage in database
 */
export const frameworkUsageInsertSchema = z.object({
  userId: z.string().uuid(),
  frameworkId: z.string(),
  frameworkName: z.string(),
  productName: z.string(),
  productCategory: z.string().optional(),
  pricePoint: z.enum(['budget', 'mid-range', 'premium', 'luxury']).optional(),
  targetAudience: z.string().optional(),
  wasRecommended: z.boolean().default(false),
  recommendationConfidence: z.number().min(0).max(100).optional(),
  wasEdited: z.boolean().default(false),
  editedFields: z.array(z.string()).optional(),
  wasSuccessful: z.boolean().optional(),
  performanceScore: z.number().min(0).max(100).optional(),
  userRating: z.number().min(1).max(5).optional(),
  seoScore: z.number().min(0).max(100).optional(),
  conversionScore: z.number().min(0).max(100).optional(),
  brandVoiceMatchScore: z.number().min(0).max(100).optional(),
});

/**
 * Schema for template recommendations
 */
export const templateRecommendationInsertSchema = z.object({
  userId: z.string().uuid(),
  recommendedFrameworkId: z.string(),
  recommendedReason: z.string().optional(),
  recommendationConfidence: z.number().min(0).max(100),
  alternativeFrameworks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    confidence: z.number(),
    reason: z.string(),
  })).optional(),
  selectedFrameworkId: z.string(),
  matchedRecommendation: z.boolean(),
  productCategory: z.string().optional(),
  pricePoint: z.enum(['budget', 'mid-range', 'premium', 'luxury']).optional(),
  targetAudience: z.string().optional(),
});

export type FrameworkUsageInsert = z.infer<typeof frameworkUsageInsertSchema>;
export type TemplateRecommendationInsert = z.infer<typeof templateRecommendationInsertSchema>;
