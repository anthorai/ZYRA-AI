/**
 * A/B Testing Service for SEO Content
 * 
 * UPGRADED: Strategy-based automatic testing with zero-risk rules
 * - Tests conversion strategies, not random text
 * - SEO-safe, brand-voice aligned variants
 * - Smart success signals beyond clicks
 * - Store-wide learning from results
 */

import OpenAI from 'openai';
import type { SEOGenerationInput } from '../../shared/unified-seo-engine';
import { generateUnifiedSEO } from '../../shared/unified-seo-engine';
import type { MarketingFramework } from '../../shared/marketing-frameworks';
import { MARKETING_FRAMEWORKS } from '../../shared/marketing-frameworks';

// ============================================================================
// STRATEGY-BASED VARIANT GENERATION (NEW - UPGRADED)
// ============================================================================

/**
 * Conversion strategies for copy testing
 * Each strategy focuses on a different psychological approach
 */
export const COPY_TEST_STRATEGIES = {
  seo_clarity: {
    id: 'seo_clarity',
    name: 'SEO + Clarity Focus',
    description: 'Optimizes for search visibility with clear, scannable copy',
    framework: 'minimalist-premium',
    emphasis: [
      'Primary keywords in first sentence',
      'Clear product benefits',
      'Scannable bullet points',
      'Natural keyword placement',
      'Concise, direct language'
    ],
    promptModifier: 'Focus on SEO optimization and clarity. Use primary keywords naturally in the first sentence. Make the copy scannable with clear benefits. Avoid fluff - every word should serve SEO or conversion.'
  },
  benefit_first: {
    id: 'benefit_first',
    name: 'Benefit-First Conversion',
    description: 'Leads with customer benefits, not features',
    framework: 'emotional-transformation',
    emphasis: [
      'Open with transformation/outcome',
      'Pain points addressed early',
      'Customer-focused language (you/your)',
      'Emotional resonance',
      'Clear value proposition'
    ],
    promptModifier: 'Lead with customer benefits and transformation. Start with what the customer gains, not product features. Use "you" language. Address pain points and show the solution. Focus on emotional connection.'
  },
  trust_reassurance: {
    id: 'trust_reassurance',
    name: 'Trust & Reassurance',
    description: 'Builds confidence through social proof and guarantees',
    framework: 'technical-professional',
    emphasis: [
      'Quality assurance messaging',
      'Warranty/guarantee mentions',
      'Professional credibility',
      'Safety and reliability',
      'Customer satisfaction focus'
    ],
    promptModifier: 'Build trust and reduce purchase anxiety. Emphasize quality guarantees, professional standards, and reliability. Use reassuring language about durability, safety, and customer satisfaction. Include credibility indicators.'
  },
  urgency_light: {
    id: 'urgency_light',
    name: 'Urgency-Light CTA',
    description: 'Subtle urgency without aggressive sales tactics',
    framework: 'aggressive-sales',
    emphasis: [
      'Soft scarcity signals',
      'Limited availability hints',
      'Action-oriented language',
      'Value-based urgency',
      'No aggressive countdown timers'
    ],
    promptModifier: 'Add subtle urgency without being pushy. Use soft scarcity ("while supplies last", "popular item"). Include action-oriented CTAs. Create desire through value, not pressure. Avoid aggressive sales language.'
  }
} as const;

export type CopyTestStrategy = keyof typeof COPY_TEST_STRATEGIES;

/**
 * Strategy variant for product copy testing
 */
export interface StrategyVariant {
  id: string;
  strategy: CopyTestStrategy | 'control';
  strategyName: string;
  strategyDescription: string;
  content: {
    title: string;
    description: string;
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };
  scores: {
    seoScore: number;
    conversionScore: number;
    brandVoiceScore: number;
  };
  hypothesis: string;
}

/**
 * Configuration for strategy-based A/B test
 */
export interface StrategyTestConfig {
  productId: string;
  productName: string;
  productDescription: string;
  category?: string;
  originalContent?: {
    title?: string;
    description?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  strategies?: CopyTestStrategy[]; // Defaults to all 4 strategies
  brandVoice?: string;
}

/**
 * Results from strategy-based variant generation
 */
export interface StrategyTestResults {
  testId: string;
  productId: string;
  variants: StrategyVariant[];
  controlVariant: StrategyVariant;
  recommendedStrategies: {
    primary: CopyTestStrategy;
    reason: string;
  };
  metadata: {
    createdAt: string;
    productName: string;
    category?: string;
    strategiesUsed: string[];
  };
}

/**
 * Generate strategy-based copy variants for A/B testing
 * This is the UPGRADED version - no manual input required
 */
export async function generateStrategyVariants(
  config: StrategyTestConfig,
  openaiClient: OpenAI
): Promise<StrategyTestResults> {
  const { 
    productId, 
    productName, 
    productDescription, 
    category,
    originalContent,
    strategies = ['seo_clarity', 'benefit_first', 'trust_reassurance', 'urgency_light'],
    brandVoice 
  } = config;

  console.log(`[Strategy A/B] Generating ${strategies.length} strategy variants for ${productName}`);

  // Create control variant from original content
  const controlVariant: StrategyVariant = {
    id: 'control',
    strategy: 'control',
    strategyName: 'Original Copy',
    strategyDescription: 'The original product copy (control)',
    content: {
      title: originalContent?.title || productName,
      description: originalContent?.description || productDescription,
      metaTitle: originalContent?.metaTitle || productName,
      metaDescription: originalContent?.metaDescription || productDescription.slice(0, 160),
      keywords: [],
    },
    scores: {
      seoScore: 50,
      conversionScore: 50,
      brandVoiceScore: 100,
    },
    hypothesis: 'Control variant - original copy for baseline comparison',
  };

  // Generate strategy variants in parallel
  const variantPromises = strategies.map(async (strategyKey, index) => {
    const strategy = COPY_TEST_STRATEGIES[strategyKey];
    
    try {
      const productInput: SEOGenerationInput = {
        productName,
        productDescription,
        category: category || 'General',
        marketingFramework: strategy.framework,
        brandVoice: brandVoice,
        shopifyHtmlFormatting: false,
      };

      // Generate with strategy-specific prompt modifications
      const seoOutput = await generateUnifiedSEO(
        {
          ...productInput,
          customPromptPrefix: strategy.promptModifier,
        },
        openaiClient
      );

      return {
        id: `variant-${strategyKey}`,
        strategy: strategyKey,
        strategyName: strategy.name,
        strategyDescription: strategy.description,
        content: {
          title: seoOutput.seoTitle,
          description: seoOutput.seoDescription,
          metaTitle: seoOutput.metaTitle || seoOutput.seoTitle,
          metaDescription: seoOutput.metaDescription || seoOutput.seoDescription.slice(0, 160),
          keywords: seoOutput.keywords || [],
        },
        scores: {
          seoScore: seoOutput.seoScore || 75,
          conversionScore: seoOutput.conversionScore || 70,
          brandVoiceScore: seoOutput.brandVoiceMatchScore || 85,
        },
        hypothesis: generateStrategyHypothesis(strategyKey),
      } as StrategyVariant;
    } catch (error) {
      console.error(`[Strategy A/B] Failed to generate ${strategyKey} variant:`, error);
      throw error;
    }
  });

  const variants = await Promise.all(variantPromises);

  // Recommend primary strategy based on category
  const recommendation = recommendPrimaryStrategy(variants, category);

  const testId = `strategy-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    testId,
    productId,
    variants,
    controlVariant,
    recommendedStrategies: recommendation,
    metadata: {
      createdAt: new Date().toISOString(),
      productName,
      category,
      strategiesUsed: strategies,
    },
  };
}

/**
 * Generate hypothesis for why a strategy might perform well
 */
function generateStrategyHypothesis(strategy: CopyTestStrategy): string {
  const hypotheses: Record<CopyTestStrategy, string> = {
    seo_clarity: 'May improve organic visibility and reduce bounce rate through clearer value proposition',
    benefit_first: 'May increase add-to-cart rate by immediately connecting with customer needs',
    trust_reassurance: 'May reduce purchase hesitation and cart abandonment through increased confidence',
    urgency_light: 'May improve conversion rate through subtle motivation without alienating customers',
  };
  return hypotheses[strategy];
}

/**
 * Recommend primary strategy based on scores and category
 */
function recommendPrimaryStrategy(
  variants: StrategyVariant[],
  category?: string
): { primary: CopyTestStrategy; reason: string } {
  // Category-based recommendations
  const categoryRecommendations: Record<string, CopyTestStrategy> = {
    'Electronics': 'trust_reassurance',
    'Fashion & Apparel': 'benefit_first',
    'Beauty & Personal Care': 'benefit_first',
    'Home & Garden': 'seo_clarity',
    'Sports & Outdoors': 'urgency_light',
    'Health & Wellness': 'trust_reassurance',
  };

  // Check for category match
  if (category && categoryRecommendations[category]) {
    return {
      primary: categoryRecommendations[category],
      reason: `${categoryRecommendations[category]} typically performs well for ${category} products`,
    };
  }

  // Default: highest combined score
  const scoredVariants = variants
    .filter(v => v.strategy !== 'control')
    .map(v => ({
      strategy: v.strategy as CopyTestStrategy,
      totalScore: v.scores.seoScore * 0.35 + v.scores.conversionScore * 0.45 + v.scores.brandVoiceScore * 0.2,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  return {
    primary: scoredVariants[0]?.strategy || 'seo_clarity',
    reason: 'Highest predicted conversion potential based on content analysis',
  };
}

// ============================================================================
// SMART SUCCESS SIGNALS CALCULATION
// ============================================================================

/**
 * Metrics weights for composite score calculation
 */
export interface SuccessSignalWeights {
  timeOnPage: number;      // 0.30 - Time spent on page
  scrollDepth: number;     // 0.20 - How far users scroll
  addToCart: number;       // 0.35 - Add to cart actions
  bounce: number;          // 0.15 - Bounce rate (inverse)
}

/**
 * Raw metrics from tracking
 */
export interface RawSuccessSignals {
  impressions: number;
  totalTimeOnPage: number;      // Total seconds across all views
  totalScrollDepth: number;     // Total percentage across all views
  addToCartCount: number;
  bounceCount: number;
}

/**
 * Calculate composite score from smart success signals
 * NOT just clicks - buyer intent signals
 */
export function calculateCompositeScore(
  signals: RawSuccessSignals,
  weights: SuccessSignalWeights = { timeOnPage: 0.3, scrollDepth: 0.2, addToCart: 0.35, bounce: 0.15 }
): { compositeScore: number; breakdown: Record<string, number> } {
  if (signals.impressions === 0) {
    return { compositeScore: 0, breakdown: { timeOnPage: 0, scrollDepth: 0, addToCart: 0, bounce: 0 } };
  }

  // Calculate averages
  const avgTimeOnPage = signals.totalTimeOnPage / signals.impressions;
  const avgScrollDepth = signals.totalScrollDepth / signals.impressions;
  const addToCartRate = (signals.addToCartCount / signals.impressions) * 100;
  const bounceRate = (signals.bounceCount / signals.impressions) * 100;

  // Normalize scores to 0-100 scale
  // Time on page: 0-180s mapped to 0-100 (3 minutes is excellent)
  const timeScore = Math.min(100, (avgTimeOnPage / 180) * 100);
  
  // Scroll depth: already 0-100%
  const scrollScore = avgScrollDepth;
  
  // Add to cart: 0-10% mapped to 0-100 (10% is excellent)
  const cartScore = Math.min(100, (addToCartRate / 10) * 100);
  
  // Bounce rate: inverse - lower is better (0-100% mapped to 100-0)
  const bounceScore = Math.max(0, 100 - bounceRate);

  // Calculate weighted composite
  const compositeScore = 
    timeScore * weights.timeOnPage +
    scrollScore * weights.scrollDepth +
    cartScore * weights.addToCart +
    bounceScore * weights.bounce;

  return {
    compositeScore: Math.round(compositeScore * 100) / 100,
    breakdown: {
      timeOnPage: Math.round(timeScore * 100) / 100,
      scrollDepth: Math.round(scrollScore * 100) / 100,
      addToCart: Math.round(cartScore * 100) / 100,
      bounce: Math.round(bounceScore * 100) / 100,
    },
  };
}

/**
 * Check if a variant should be auto-stopped due to poor performance
 * Zero-risk testing: protect sales during testing
 */
export function shouldAutoStopVariant(
  variantScore: number,
  controlScore: number,
  impressions: number,
  minImpressions: number = 50
): { shouldStop: boolean; reason?: string } {
  // Need minimum data before making decisions
  if (impressions < minImpressions) {
    return { shouldStop: false };
  }

  // Stop if significantly underperforming control (>25% worse)
  const performanceRatio = variantScore / (controlScore || 1);
  if (performanceRatio < 0.75) {
    return {
      shouldStop: true,
      reason: `Underperforming control by ${((1 - performanceRatio) * 100).toFixed(0)}%`,
    };
  }

  return { shouldStop: false };
}

/**
 * Determine if we have a statistically significant winner
 */
export function detectWinner(
  variants: Array<{ id: string; compositeScore: number; impressions: number }>,
  minImpressions: number = 100,
  minConfidence: number = 95
): { hasWinner: boolean; winnerId?: string; confidence?: number; reason?: string } {
  // Filter variants with sufficient data
  const qualified = variants.filter(v => v.impressions >= minImpressions);
  
  if (qualified.length < 2) {
    return { hasWinner: false, reason: 'Insufficient data for comparison' };
  }

  // Sort by composite score
  qualified.sort((a, b) => b.compositeScore - a.compositeScore);
  
  const leader = qualified[0];
  const runnerUp = qualified[1];

  // Calculate improvement percentage
  const improvement = ((leader.compositeScore - runnerUp.compositeScore) / runnerUp.compositeScore) * 100;

  // Simple confidence calculation based on sample size and improvement
  // More sophisticated statistical tests could be added
  const baseSampleConfidence = Math.min(50, (leader.impressions / 200) * 50);
  const improvementConfidence = Math.min(50, improvement * 5);
  const confidence = Math.min(99, baseSampleConfidence + improvementConfidence);

  if (confidence >= minConfidence) {
    return {
      hasWinner: true,
      winnerId: leader.id,
      confidence: Math.round(confidence),
      reason: `${improvement.toFixed(1)}% better composite score with ${confidence.toFixed(0)}% confidence`,
    };
  }

  return { hasWinner: false, reason: `Confidence ${confidence.toFixed(0)}% below threshold ${minConfidence}%` };
}

// ============================================================================
// LEGACY A/B TESTING (BACKWARD COMPATIBLE)
// ============================================================================

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
  productInput: SEOGenerationInput;
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
    const variantInput: SEOGenerationInput = {
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
  productInput: SEOGenerationInput,
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
