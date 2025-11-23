/**
 * Value Tracking Service
 * 
 * Tracks the dollar value delivered to merchants through Zyra AI's
 * premium features (SERP analysis, GPT-4o, Vision API, A/B testing, etc.)
 * 
 * This demonstrates ROI and justifies pricing by showing merchants:
 * "You've used $X worth of SEO tools this month"
 */

export interface FeatureUsage {
  featureName: string;
  usageCount: number;
  unitValue: number; // Dollar value per use
  totalValue: number; // usageCount × unitValue
  equivalentService?: string; // e.g., "SEMrush Pro"
}

export interface ValueSummary {
  userId: string;
  period: 'month' | 'week' | 'all-time';
  features: FeatureUsage[];
  totalValueDelivered: number;
  subscriptionCost: number;
  roi: number; // totalValueDelivered / subscriptionCost
}

/**
 * Feature value definitions
 * Based on market rates for equivalent standalone services
 */
export const FEATURE_VALUES = {
  // SERP Competitive Intelligence
  serpAnalysis: {
    value: 0.50, // $0.50 per analysis
    equivalent: 'SEMrush Keyword Research ($129/mo ÷ 250 searches)',
  },
  
  // Premium AI (GPT-4o vs GPT-4o-mini)
  premiumAI: {
    value: 0.05, // $0.05 per premium generation
    equivalent: 'Jasper AI Pro ($49/mo ÷ 1000 generations)',
  },
  
  // AI Image Analysis (Vision API)
  imageAnalysis: {
    value: 0.10, // $0.10 per image
    equivalent: 'Manual image description ($10/hr ÷ 100 images)',
  },
  
  // A/B Testing Variations
  abTesting: {
    value: 0.15, // $0.15 for 3 variations
    equivalent: 'Optimizely ($50/mo ÷ 333 tests)',
  },
  
  // Keyword Research
  keywordResearch: {
    value: 0.08, // $0.08 per keyword cluster
    equivalent: 'Ahrefs Keywords ($99/mo ÷ 1250 searches)',
  },
  
  // Brand DNA Training
  brandDNATraining: {
    value: 5.00, // $5 per training session
    equivalent: 'Professional brand voice audit ($500 one-time)',
  },
  
  // Bulk Optimization
  bulkOptimization: {
    value: 0.02, // $0.02 per product (in bulk)
    equivalent: 'Shopify SEO apps ($29/mo ÷ 1500 products)',
  },
} as const;

/**
 * Credit costs for each feature
 * Maps to the subscription plan credit system
 */
export const CREDIT_COSTS = {
  // Basic features (low credit cost)
  basicAI: 5, // GPT-4o-mini, simple descriptions
  imageAltText: 5, // Simple alt-text generation
  
  // Premium features (moderate credit cost)
  premiumAI: 10, // GPT-4o, professional quality
  serpAnalysis: 10, // Real-time competitor data
  imageAnalysis: 8, // Vision API analysis
  keywordResearch: 8, // Keyword clustering
  
  // Advanced features (higher credit cost)
  abTesting: 15, // 3 variations
  brandDNATraining: 50, // One-time training
  
  // Full package (everything)
  fullPackage: 30, // SERP + Premium AI + Image + Keywords
  
  // Bulk operations (discounted per unit)
  bulkOptimization: 5, // Per product in bulk (cheaper than individual)
} as const;

/**
 * Subscription plan credit allocations
 */
export const PLAN_CREDITS = {
  trial: 100, // 7-day trial
  starter: 1000, // $49/mo
  growth: 5000, // $299/mo
  pro: 20000, // $999/mo
} as const;

/**
 * Calculate value delivered for a feature usage
 */
export function calculateFeatureValue(
  featureName: keyof typeof FEATURE_VALUES,
  usageCount: number
): FeatureUsage {
  const featureConfig = FEATURE_VALUES[featureName];
  
  return {
    featureName,
    usageCount,
    unitValue: featureConfig.value,
    totalValue: usageCount * featureConfig.value,
    equivalentService: featureConfig.equivalent,
  };
}

/**
 * Calculate total value summary for a user
 */
export function calculateValueSummary(
  userId: string,
  featureUsages: Record<string, number>,
  subscriptionPlan: 'trial' | 'starter' | 'growth' | 'pro',
  period: 'month' | 'week' | 'all-time' = 'month'
): ValueSummary {
  const features: FeatureUsage[] = [];
  let totalValue = 0;

  // Calculate value for each feature
  Object.entries(featureUsages).forEach(([featureName, count]) => {
    if (count > 0 && featureName in FEATURE_VALUES) {
      const featureValue = calculateFeatureValue(
        featureName as keyof typeof FEATURE_VALUES,
        count
      );
      features.push(featureValue);
      totalValue += featureValue.totalValue;
    }
  });

  // Subscription costs
  const subscriptionCosts = {
    trial: 0,
    starter: 49,
    growth: 299,
    pro: 999,
  };

  const subscriptionCost = subscriptionCosts[subscriptionPlan];
  const roi = subscriptionCost > 0 ? totalValue / subscriptionCost : 0;

  return {
    userId,
    period,
    features,
    totalValueDelivered: totalValue,
    subscriptionCost,
    roi,
  };
}

/**
 * Get recommended features based on credit usage
 */
export function getRecommendedFeatures(
  creditsUsed: number,
  creditsRemaining: number,
  plan: 'trial' | 'starter' | 'growth' | 'pro'
): string[] {
  const recommendations: string[] = [];

  // If running low on credits
  if (creditsRemaining < PLAN_CREDITS[plan] * 0.2) {
    recommendations.push('Consider upgrading for more credits');
  }

  // If barely using credits
  if (creditsUsed < PLAN_CREDITS[plan] * 0.3) {
    recommendations.push('Try SERP analysis for competitive intelligence');
    recommendations.push('Use A/B testing to find best-performing copy');
  }

  // If using lots of basic features
  if (creditsUsed > PLAN_CREDITS[plan] * 0.5) {
    recommendations.push('Use bulk optimization to save credits');
  }

  return recommendations;
}

/**
 * Format value for display
 */
export function formatValueDisplay(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Example usage tracking (to be integrated with database)
 */
export interface UsageRecord {
  userId: string;
  featureName: keyof typeof FEATURE_VALUES;
  timestamp: Date;
  credits: number;
  metadata?: Record<string, any>;
}

/**
 * Mock function to track usage (replace with actual DB calls)
 */
export async function trackFeatureUsage(usage: UsageRecord): Promise<void> {
  console.log('[Value Tracking] Feature used:', {
    feature: usage.featureName,
    credits: usage.credits,
    value: FEATURE_VALUES[usage.featureName].value,
  });
  
  // TODO: Save to database
  // await db.insert(usageTracking).values(usage);
}
