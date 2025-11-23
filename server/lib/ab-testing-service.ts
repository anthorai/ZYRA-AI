/**
 * A/B Testing Service for SEO Content
 * 
 * Generates multiple variants of SEO content and tracks performance
 * to determine which marketing frameworks and styles perform best
 */

import OpenAI from 'openai';
import type { UnifiedSEOInput } from '../../shared/unified-seo-engine';
import { generateUnifiedSEO } from '../../shared/unified-seo-engine';
import type { MarketingFramework } from '../../shared/marketing-frameworks';
import { MARKETING_FRAMEWORKS } from '../../shared/marketing-frameworks';

export interface ABTestVariant {
  id: string;
  name: string;
  frameworkId: string;
  frameworkName: string;
  seoOutput: {
    seoTitle: string;
    seoDescription: string;
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    seoScore: number;
    conversionScore: number;
    brandVoiceMatchScore: number;
  };
  hypothesis: string; // Why this variant might perform better
}

export interface ABTestConfig {
  productInput: UnifiedSEOInput;
  numVariants: number; // 2-4 variants recommended
  focusMetric: 'clicks' | 'conversions' | 'engagement' | 'balanced';
  frameworkIds?: string[]; // Specific frameworks to test, or auto-select
}

export interface ABTestResults {
  testId: string;
  variants: ABTestVariant[];
  recommendation: {
    variantId: string;
    reason: string;
    confidenceScore: number;
  };
  metadata: {
    createdAt: string;
    productName: string;
    category?: string;
  };
}

/**
 * Generate A/B test variants for SEO content
 */
export async function generateABTestVariants(
  config: ABTestConfig,
  openaiClient: OpenAI
): Promise<ABTestResults> {
  const { productInput, numVariants, focusMetric, frameworkIds } = config;
  
  console.log(`[A/B Test] Generating ${numVariants} variants for ${productInput.productName}`);
  
  // Select frameworks to test
  const frameworksToTest = selectFrameworksForTesting(
    frameworkIds,
    numVariants,
    productInput,
    focusMetric
  );
  
  // Generate variants in parallel
  const variantPromises = frameworksToTest.map(async (framework, index) => {
    const variantInput: UnifiedSEOInput = {
      ...productInput,
      marketingFramework: framework.id,
      shopifyHtmlFormatting: false, // Get clean text for A/B testing
    };
    
    try {
      const seoOutput = await generateUnifiedSEO(variantInput, openaiClient);
      
      const hypothesis = generateHypothesis(framework, focusMetric);
      
      return {
        id: `variant-${index + 1}`,
        name: `Variant ${String.fromCharCode(65 + index)}: ${framework.name}`,
        frameworkId: framework.id,
        frameworkName: framework.name,
        seoOutput: {
          seoTitle: seoOutput.seoTitle,
          seoDescription: seoOutput.seoDescription,
          metaTitle: seoOutput.metaTitle || seoOutput.seoTitle,
          metaDescription: seoOutput.metaDescription || seoOutput.seoDescription,
          keywords: seoOutput.keywords,
          seoScore: seoOutput.seoScore || 75,
          conversionScore: seoOutput.conversionScore || 70,
          brandVoiceMatchScore: seoOutput.brandVoiceMatchScore || 85,
        },
        hypothesis,
      };
    } catch (error) {
      console.error(`[A/B Test] Failed to generate variant ${index + 1}:`, error);
      throw error;
    }
  });
  
  const variants = await Promise.all(variantPromises);
  
  // Analyze and recommend best variant
  const recommendation = recommendBestVariant(variants, focusMetric);
  
  const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    testId,
    variants,
    recommendation,
    metadata: {
      createdAt: new Date().toISOString(),
      productName: productInput.productName,
      category: productInput.category,
    },
  };
}

/**
 * Select which frameworks to test based on config
 */
function selectFrameworksForTesting(
  frameworkIds: string[] | undefined,
  numVariants: number,
  productInput: UnifiedSEOInput,
  focusMetric: string
): MarketingFramework[] {
  // If specific frameworks requested, use those
  if (frameworkIds && frameworkIds.length > 0) {
    return frameworkIds
      .map(id => MARKETING_FRAMEWORKS.find(f => f.id === id))
      .filter(Boolean)
      .slice(0, numVariants) as MarketingFramework[];
  }
  
  // Auto-select diverse frameworks based on focus metric
  const frameworks: MarketingFramework[] = [];
  
  switch (focusMetric) {
    case 'clicks':
      // Frameworks known for high click-through rates
      frameworks.push(
        MARKETING_FRAMEWORKS.find(f => f.id === 'aggressive-sales')!,
        MARKETING_FRAMEWORKS.find(f => f.id === 'gen-z-viral')!,
        MARKETING_FRAMEWORKS.find(f => f.id === 'emotional-transformation')!
      );
      break;
      
    case 'conversions':
      // Frameworks optimized for conversions
      frameworks.push(
        MARKETING_FRAMEWORKS.find(f => f.id === 'luxury-premium')!,
        MARKETING_FRAMEWORKS.find(f => f.id === 'technical-professional')!,
        MARKETING_FRAMEWORKS.find(f => f.id === 'emotional-transformation')!
      );
      break;
      
    case 'engagement':
      // Frameworks that drive engagement
      frameworks.push(
        MARKETING_FRAMEWORKS.find(f => f.id === 'gen-z-viral')!,
        MARKETING_FRAMEWORKS.find(f => f.id === 'eco-friendly')!,
        MARKETING_FRAMEWORKS.find(f => f.id === 'emotional-transformation')!
      );
      break;
      
    case 'balanced':
    default:
      // Mix of different styles
      frameworks.push(
        MARKETING_FRAMEWORKS.find(f => f.id === 'luxury-premium')!,
        MARKETING_FRAMEWORKS.find(f => f.id === 'aggressive-sales')!,
        MARKETING_FRAMEWORKS.find(f => f.id === 'minimalist-premium')!
      );
      break;
  }
  
  return frameworks.filter(Boolean).slice(0, numVariants);
}

/**
 * Generate hypothesis for why this framework might perform well
 */
function generateHypothesis(
  framework: MarketingFramework,
  focusMetric: string
): string {
  const metricMap = {
    clicks: 'click-through rate',
    conversions: 'conversion rate',
    engagement: 'user engagement',
    balanced: 'overall performance',
  };
  
  return `This ${framework.name} variant may achieve higher ${metricMap[focusMetric as keyof typeof metricMap]} by ${framework.description.toLowerCase()}`;
}

/**
 * Recommend the best variant based on predicted performance
 */
function recommendBestVariant(
  variants: ABTestVariant[],
  focusMetric: string
): { variantId: string; reason: string; confidenceScore: number } {
  // Score each variant based on focus metric
  const scoredVariants = variants.map(variant => {
    let score = 0;
    let weightedFactors: string[] = [];
    
    switch (focusMetric) {
      case 'clicks':
        // Prioritize title appeal and keyword optimization
        score = variant.seoOutput.seoScore * 0.6 + variant.seoOutput.conversionScore * 0.4;
        weightedFactors = ['SEO optimization', 'title appeal'];
        break;
        
      case 'conversions':
        // Prioritize conversion elements and brand voice
        score = variant.seoOutput.conversionScore * 0.5 + 
                variant.seoOutput.brandVoiceMatchScore * 0.3 + 
                variant.seoOutput.seoScore * 0.2;
        weightedFactors = ['conversion elements', 'brand alignment'];
        break;
        
      case 'engagement':
        // Balance all factors
        score = (variant.seoOutput.seoScore + 
                 variant.seoOutput.conversionScore + 
                 variant.seoOutput.brandVoiceMatchScore) / 3;
        weightedFactors = ['balanced appeal'];
        break;
        
      case 'balanced':
      default:
        // Weighted average of all scores
        score = variant.seoOutput.seoScore * 0.4 + 
                variant.seoOutput.conversionScore * 0.35 + 
                variant.seoOutput.brandVoiceMatchScore * 0.25;
        weightedFactors = ['SEO quality', 'conversion potential', 'brand voice'];
        break;
    }
    
    return {
      variant,
      score,
      weightedFactors,
    };
  });
  
  // Sort by score (highest first)
  scoredVariants.sort((a, b) => b.score - a.score);
  
  const best = scoredVariants[0];
  const confidence = Math.min(95, Math.round(best.score));
  
  const reason = `Scores highest on ${best.weightedFactors.join(' and ')} with ${best.variant.frameworkName} framework (${confidence}% confidence)`;
  
  return {
    variantId: best.variant.id,
    reason,
    confidenceScore: confidence,
  };
}

/**
 * Calculate performance metrics for a live A/B test
 */
export interface VariantPerformance {
  variantId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  clickThroughRate: number;
  conversionRate: number;
  revenue: number;
}

export function calculateABTestWinner(
  performances: VariantPerformance[],
  minimumSampleSize: number = 100
): { winnerId: string; confidence: number; reason: string } | null {
  // Filter variants with enough data
  const qualifiedVariants = performances.filter(
    p => p.impressions >= minimumSampleSize
  );
  
  if (qualifiedVariants.length === 0) {
    return null;
  }
  
  // Sort by conversion rate (primary metric)
  qualifiedVariants.sort((a, b) => b.conversionRate - a.conversionRate);
  
  const winner = qualifiedVariants[0];
  const runnerUp = qualifiedVariants[1];
  
  if (!runnerUp) {
    return {
      winnerId: winner.variantId,
      confidence: 50,
      reason: 'Only one variant has sufficient data',
    };
  }
  
  // Calculate statistical significance (simplified)
  const improvement = ((winner.conversionRate - runnerUp.conversionRate) / runnerUp.conversionRate) * 100;
  const confidence = Math.min(99, Math.round(60 + improvement * 2));
  
  return {
    winnerId: winner.variantId,
    confidence,
    reason: `${improvement.toFixed(1)}% higher conversion rate (${winner.conversions} vs ${runnerUp.conversions} conversions)`,
  };
}
