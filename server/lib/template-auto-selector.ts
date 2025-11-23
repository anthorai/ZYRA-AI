/**
 * Smart Template Auto-Selector
 * 
 * Analyzes product attributes to recommend the best marketing framework
 * Learns from user behavior to improve recommendations over time
 */

import { MARKETING_FRAMEWORKS, recommendFramework, type MarketingFramework } from '../../shared/marketing-frameworks';

export interface ProductAttributes {
  productName: string;
  category?: string;
  pricePoint?: 'budget' | 'mid-range' | 'premium' | 'luxury';
  targetAudience?: string;
  currentDescription?: string;
  tags?: string[];
  price?: number;
}

export interface FrameworkRecommendation {
  framework: MarketingFramework;
  confidence: number; // 0-100
  reason: string;
  alternativeFrameworks: Array<{
    framework: MarketingFramework;
    confidence: number;
    reason: string;
  }>;
}

/**
 * Auto-select the best marketing framework for a product
 */
export function autoSelectFramework(
  product: ProductAttributes,
  userBehaviorData?: UserBehaviorData
): FrameworkRecommendation {
  // Score each framework based on product attributes
  const scores = MARKETING_FRAMEWORKS.map(framework => ({
    framework,
    score: scoreFrameworkFit(framework, product),
    reason: generateReason(framework, product)
  }));
  
  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score);
  
  // Adjust scores based on user behavior
  if (userBehaviorData) {
    adjustScoresBasedOnBehavior(scores, userBehaviorData);
    scores.sort((a, b) => b.score - a.score);
  }
  
  const topChoice = scores[0];
  const alternatives = scores.slice(1, 4); // Top 3 alternatives
  
  return {
    framework: topChoice.framework,
    confidence: Math.round(topChoice.score),
    reason: topChoice.reason,
    alternativeFrameworks: alternatives.map(alt => ({
      framework: alt.framework,
      confidence: Math.round(alt.score),
      reason: alt.reason
    }))
  };
}

/**
 * Score how well a framework fits the product
 */
function scoreFrameworkFit(
  framework: MarketingFramework,
  product: ProductAttributes
): number {
  let score = 50; // Base score
  
  const {category, pricePoint, targetAudience, tags = [], price} = product;
  const categoryLower = category?.toLowerCase() || '';
  const audienceLower = targetAudience?.toLowerCase() || '';
  const tagsLower = tags.map(t => t.toLowerCase());
  
  // Price Point Scoring
  if (pricePoint) {
    if (framework.id === 'luxury-premium' && (pricePoint === 'luxury' || pricePoint === 'premium')) {
      score += 30;
    } else if (framework.id === 'luxury-premium' && (pricePoint === 'budget')) {
      score -= 20;
    }
    
    if (framework.id === 'aggressive-sales' && pricePoint === 'budget') {
      score += 15;
    }
    
    if (framework.id === 'minimalist-premium' && pricePoint === 'mid-range') {
      score += 20;
    }
  }
  
  // Numerical Price Analysis
  if (price !== undefined) {
    if (price > 500 && framework.id === 'luxury-premium') score += 25;
    if (price < 50 && framework.id === 'aggressive-sales') score += 20;
    if (price >= 50 && price <= 200 && framework.id === 'minimalist-premium') score += 15;
  }
  
  // Category Scoring
  if (category) {
    // Check if category matches framework's best-for list
    const matchesBestFor = framework.bestFor.some(use => 
      categoryLower.includes(use.toLowerCase()) || use.toLowerCase().includes(categoryLower)
    );
    if (matchesBestFor) score += 25;
    
    // Check if category is in avoid-for list
    const matchesAvoidFor = framework.avoidFor.some(avoid => 
      categoryLower.includes(avoid.toLowerCase()) || avoid.toLowerCase().includes(categoryLower)
    );
    if (matchesAvoidFor) score -= 30;
  }
  
  // Audience Scoring
  if (targetAudience) {
    // Gen Z indicators
    if ((audienceLower.includes('gen z') || audienceLower.includes('teen') || 
         audienceLower.includes('youth') || audienceLower.includes('young')) &&
        framework.id === 'gen-z-viral') {
      score += 30;
    }
    
    // Professional/B2B indicators
    if ((audienceLower.includes('professional') || audienceLower.includes('b2b') || 
         audienceLower.includes('business') || audienceLower.includes('enterprise')) &&
        framework.id === 'technical-professional') {
      score += 25;
    }
    
    // Wellness/transformation seekers
    if ((audienceLower.includes('wellness') || audienceLower.includes('fitness') || 
         audienceLower.includes('health') || audienceLower.includes('transformation')) &&
        framework.id === 'emotional-transformation') {
      score += 25;
    }
  }
  
  // Tags Scoring
  tagsLower.forEach(tag => {
    if ((tag.includes('eco') || tag.includes('sustainable') || tag.includes('organic') || tag.includes('green')) &&
        framework.id === 'eco-friendly') {
      score += 20;
    }
    
    if ((tag.includes('luxury') || tag.includes('premium') || tag.includes('designer')) &&
        framework.id === 'luxury-premium') {
      score += 15;
    }
    
    if ((tag.includes('sale') || tag.includes('clearance') || tag.includes('limited')) &&
        framework.id === 'aggressive-sales') {
      score += 15;
    }
  });
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Generate a human-readable reason for the recommendation
 */
function generateReason(framework: MarketingFramework, product: ProductAttributes): string {
  const reasons: string[] = [];
  
  const {category, pricePoint, targetAudience, price} = product;
  
  // Price-based reasons
  if (pricePoint === 'luxury' || pricePoint === 'premium' || (price && price > 500)) {
    if (framework.id === 'luxury-premium') {
      reasons.push('Premium price point aligns with luxury positioning');
    }
  }
  
  if (pricePoint === 'budget' || (price && price < 50)) {
    if (framework.id === 'aggressive-sales') {
      reasons.push('Budget-friendly pricing benefits from urgency-driven sales copy');
    }
  }
  
  // Category-based reasons
  if (category) {
    const categoryLower = category.toLowerCase();
    
    if ((categoryLower.includes('eco') || categoryLower.includes('sustainable')) && 
        framework.id === 'eco-friendly') {
      reasons.push('Environmental focus matches eco-friendly framework');
    }
    
    if ((categoryLower.includes('fashion') || categoryLower.includes('apparel')) && 
        framework.id === 'gen-z-viral') {
      reasons.push('Fashion products thrive with trend-focused Gen Z appeal');
    }
    
    if (categoryLower.includes('home') && framework.id === 'minimalist-premium') {
      reasons.push('Home goods benefit from clean, functional messaging');
    }
  }
  
  // Audience-based reasons
  if (targetAudience) {
    const audienceLower = targetAudience.toLowerCase();
    
    if ((audienceLower.includes('gen z') || audienceLower.includes('youth')) && 
        framework.id === 'gen-z-viral') {
      reasons.push('Gen Z audience responds to authentic, trend-aware content');
    }
    
    if ((audienceLower.includes('professional') || audienceLower.includes('b2b')) && 
        framework.id === 'technical-professional') {
      reasons.push('Professional audience values detailed, spec-focused content');
    }
  }
  
  // Default reason if no specific matches
  if (reasons.length === 0) {
    reasons.push(`${framework.name} framework provides proven conversion patterns for this product type`);
  }
  
  return reasons.join('. ');
}

/**
 * User behavior data for learning
 */
export interface UserBehaviorData {
  userId: string;
  frameworkPreferences: Record<string, number>; // framework_id -> usage_count
  editedFrameworks: Record<string, number>; // framework_id -> edit_count
  successfulFrameworks: Record<string, number>; // framework_id -> success_count
  categoryPreferences: Record<string, string>; // category -> preferred_framework_id
}

/**
 * Adjust scores based on user's past behavior
 */
function adjustScoresBasedOnBehavior(
  scores: Array<{ framework: MarketingFramework; score: number; reason: string }>,
  behaviorData: UserBehaviorData
): void {
  scores.forEach(item => {
    const frameworkId = item.framework.id;
    
    // Boost frameworks the user has successfully used before
    const successCount = behaviorData.successfulFrameworks[frameworkId] || 0;
    if (successCount > 0) {
      item.score += Math.min(15, successCount * 3);
      item.reason += ' User has had success with this framework before.';
    }
    
    // Slightly penalize frameworks the user frequently edits (might not match their style)
    const editCount = behaviorData.editedFrameworks[frameworkId] || 0;
    const usageCount = behaviorData.frameworkPreferences[frameworkId] || 1;
    const editRatio = editCount / usageCount;
    
    if (editRatio > 0.7) {
      item.score -= 10;
      item.reason += ' Note: You typically customize this framework heavily.';
    }
    
    // Boost if user generally prefers this framework
    const preferenceCount = behaviorData.frameworkPreferences[frameworkId] || 0;
    if (preferenceCount > 5) {
      item.score += Math.min(10, preferenceCount);
      item.reason += ' This is one of your frequently used frameworks.';
    }
  });
}

/**
 * Learn from user's framework selection
 */
export function trackFrameworkUsage(
  userId: string,
  frameworkId: string,
  productCategory: string,
  wasEdited: boolean,
  wasSuccessful?: boolean
): void {
  // This would save to database in production
  // For now, it's a placeholder for the learning system
  console.log('Framework usage tracked:', {
    userId,
    frameworkId,
    productCategory,
    wasEdited,
    wasSuccessful
  });
  
  // In production, this would update the user_behavior_data table
  // and be used in future recommendations
}

/**
 * Get user's behavior data from database
 */
export async function getUserBehaviorData(userId: string): Promise<UserBehaviorData | undefined> {
  // This would fetch from database in production
  // For now, return undefined (no learning data yet)
  return undefined;
}

/**
 * Recommend framework with competitive analysis
 */
export function recommendWithCompetitorAnalysis(
  product: ProductAttributes,
  competitorFrameworks: string[]
): FrameworkRecommendation {
  const baseRecommendation = autoSelectFramework(product);
  
  // If competitors are all using the same framework, consider differentiation
  const competitorFrameworkSet = new Set(competitorFrameworks);
  
  if (competitorFrameworkSet.size === 1 && competitorFrameworks.length > 2) {
    // All competitors using same framework - consider alternative for differentiation
    const dominantFramework = competitorFrameworks[0];
    const alternatives = baseRecommendation.alternativeFrameworks;
    
    // Find a different but effective framework
    const differentiator = alternatives.find(
      alt => alt.framework.id !== dominantFramework && alt.confidence > 70
    );
    
    if (differentiator) {
      return {
        framework: differentiator.framework,
        confidence: differentiator.confidence,
        reason: `Stand out from competitors who all use ${dominantFramework}. ${differentiator.reason}`,
        alternativeFrameworks: [
          {
            framework: baseRecommendation.framework,
            confidence: baseRecommendation.confidence,
            reason: baseRecommendation.reason + ' (Match competitors)'
          },
          ...alternatives.filter(a => a.framework.id !== differentiator.framework.id)
        ]
      };
    }
  }
  
  return baseRecommendation;
}

/**
 * Batch recommend frameworks for multiple products
 */
export function batchRecommendFrameworks(
  products: ProductAttributes[]
): Map<string, FrameworkRecommendation> {
  const recommendations = new Map<string, FrameworkRecommendation>();
  
  products.forEach(product => {
    const recommendation = autoSelectFramework(product);
    recommendations.set(product.productName, recommendation);
  });
  
  return recommendations;
}
