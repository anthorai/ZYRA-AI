/**
 * Product Revenue Intelligence Engine
 * 
 * Implements the ONE-MODULE LOOP (DETECT → DECIDE → EXECUTE → PROVE → LEARN)
 * for product-level revenue optimization.
 * 
 * Purpose: Make ZYRA irreplaceable by providing per-product intelligence that
 * creates switching cost through historical learning and proven attribution.
 */

import { supabaseStorage } from './supabase-storage';
import type { Product } from '@shared/schema';

export type ProtectionStatus = 'protecting' | 'monitoring' | 'not_active';
export type AutonomyLevel = 'manual' | 'low_risk_auto' | 'full_autonomy';

export interface ProductIntelligence {
  productId: string;
  revenueHealthScore: number; // 0-100
  protectionStatus: ProtectionStatus;
  revenueAdded: number;
  confidenceIndex: number; // 0-100
  autonomyLevel: AutonomyLevel;
  lastActionAt: Date | null;
  actionsCount: number;
  healthCategory: 'healthy' | 'at_risk' | 'revenue_leak';
  confidenceTrend: 'up' | 'down' | 'stable';
}

export interface ProductActionHistoryItem {
  id: string;
  actionType: string;
  actionDescription: string;
  expectedRevenueImpact: number | null;
  actualRevenueImpact: number | null;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
}

export interface ProductIntelligenceSummary {
  totalProducts: number;
  revenueProtected: number;
  productsAtRisk: number;
  productsFullyOptimized: number;
  avgConfidence: number;
}

/**
 * Calculate Revenue Health Score for a product
 * 
 * Score is calculated using deterministic factors:
 * - Conversion rate vs category average (25%)
 * - SEO score from audits (20%)
 * - Cart abandonment involvement (15%)
 * - ZYRA optimization status (15%)
 * - Historical ZYRA success on this product (15%)
 * - Traffic vs revenue mismatch signal (10%)
 */
export function calculateRevenueHealthScore(
  product: Product,
  seoScore: number = 0,
  conversionRate: number = 0,
  categoryAvgConversion: number = 0.025,
  cartAbandonmentRate: number = 0,
  zyraSuccessRate: number = 0
): number {
  let score = 0;
  
  // Conversion rate component (25 points max)
  // Above average = full points, at average = 15, below = proportional
  const conversionRatio = categoryAvgConversion > 0 
    ? conversionRate / categoryAvgConversion 
    : 1;
  score += Math.min(25, Math.round(conversionRatio * 15));
  
  // SEO score component (20 points max)
  score += Math.round((seoScore / 100) * 20);
  
  // Cart abandonment component (15 points max) - lower is better
  const abandonmentScore = Math.max(0, 15 - Math.round(cartAbandonmentRate * 15));
  score += abandonmentScore;
  
  // ZYRA optimization status (15 points)
  if (product.isOptimized) {
    score += 15;
  } else if (product.protectionStatus === 'monitoring') {
    score += 8;
  }
  
  // Historical ZYRA success (15 points max)
  score += Math.round(zyraSuccessRate * 15);
  
  // Traffic/revenue mismatch signal (10 points) - simplified
  // If product has optimized copy, assume better alignment
  if (product.optimizedCopy) {
    score += 10;
  } else if (product.description && product.description.length > 50) {
    score += 5;
  }
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Determine health category based on score
 */
export function getHealthCategory(score: number): 'healthy' | 'at_risk' | 'revenue_leak' {
  if (score >= 70) return 'healthy';
  if (score >= 40) return 'at_risk';
  return 'revenue_leak';
}

/**
 * Calculate ZYRA Confidence Index for a product
 * 
 * Confidence increases with:
 * - Number of successful actions (35%)
 * - Accuracy of predictions vs actuals (30%)
 * - Time observing this product (20%)
 * - Consistency of improvements (15%)
 */
export function calculateConfidenceIndex(
  actionsCount: number,
  predictionAccuracy: number = 0.7,
  daysSinceCreated: number = 0,
  improvementConsistency: number = 0.5
): number {
  let confidence = 0;
  
  // Action count component (35 points max)
  // More actions = more learning = higher confidence
  const actionScore = Math.min(35, Math.round(Math.log10(actionsCount + 1) * 20));
  confidence += actionScore;
  
  // Prediction accuracy component (30 points max)
  confidence += Math.round(predictionAccuracy * 30);
  
  // Time observing component (20 points max)
  // Confidence builds over time (max after ~90 days)
  const timeScore = Math.min(20, Math.round((daysSinceCreated / 90) * 20));
  confidence += timeScore;
  
  // Improvement consistency (15 points max)
  confidence += Math.round(improvementConsistency * 15);
  
  return Math.min(100, Math.max(0, confidence));
}

/**
 * Determine protection status based on product state
 */
export function determineProtectionStatus(product: Product): ProtectionStatus {
  // Protecting: ZYRA has actively optimized and is monitoring
  if (product.isOptimized && product.lastZyraActionAt) {
    return 'protecting';
  }
  
  // Monitoring: Product is synced and ZYRA is analyzing
  if (product.shopifyId) {
    return 'monitoring';
  }
  
  // Not Active: No Shopify connection or manual product
  return 'not_active';
}

/**
 * Get autonomy level based on user plan
 */
export function getAutonomyLevelForPlan(
  planName: string,
  currentLevel?: string
): AutonomyLevel {
  const normalizedPlan = planName?.toLowerCase() || 'trial';
  
  // Starter+ and trial: Manual only (no auto-execution)
  if (normalizedPlan === 'trial' || normalizedPlan === 'starter' || normalizedPlan === 'starter+') {
    return 'manual';
  }
  
  // Growth: Partial autonomy (low-risk auto)
  if (normalizedPlan === 'growth') {
    return currentLevel === 'manual' ? 'manual' : 'low_risk_auto';
  }
  
  // Scale/Pro: Full autonomy available
  if (normalizedPlan === 'scale' || normalizedPlan === 'pro') {
    return currentLevel as AutonomyLevel || 'full_autonomy';
  }
  
  return 'manual';
}

/**
 * Calculate revenue attributed to ZYRA for a product
 * Based on proven, measured revenue from action history
 */
export async function calculateRevenueAdded(
  userId: string,
  productId: string
): Promise<number> {
  try {
    const history = await supabaseStorage.getProductActionHistory(userId, productId);
    if (!history || history.length === 0) return 0;
    
    // Sum all actual revenue impacts from completed actions
    const totalRevenue = history
      .filter((action: any) => action.status === 'completed' && action.actualRevenueImpact)
      .reduce((sum: number, action: any) => sum + parseFloat(action.actualRevenueImpact || '0'), 0);
    
    return Math.round(totalRevenue * 100) / 100;
  } catch (error) {
    console.error('Error calculating revenue added:', error);
    return 0;
  }
}

/**
 * Get full product intelligence for a single product
 */
export async function getProductIntelligence(
  userId: string,
  product: Product
): Promise<ProductIntelligence> {
  // Calculate SEO score based on product optimization status and content quality
  // This is a deterministic calculation based on product attributes
  let seoScore = 40; // Base score
  
  // Boost for optimization
  if (product.isOptimized) {
    seoScore += 30;
  }
  
  // Boost for having a description
  if (product.description && product.description.length > 50) {
    seoScore += 15;
  }
  
  // Boost for having optimized copy
  if (product.optimizedCopy) {
    seoScore += 15;
  }
  
  seoScore = Math.min(100, seoScore);
  
  // Calculate days since created
  const daysSinceCreated = product.createdAt 
    ? Math.floor((Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  // Get actions count (from product or calculate)
  const actionsCount = product.zyraActionsCount || 0;
  
  // Calculate scores
  const revenueHealthScore = calculateRevenueHealthScore(product, seoScore);
  const confidenceIndex = calculateConfidenceIndex(actionsCount, 0.7, daysSinceCreated);
  const protectionStatus = determineProtectionStatus(product);
  
  // Get revenue added
  const revenueAdded = await calculateRevenueAdded(userId, product.id);
  
  // Determine confidence trend (simplified - based on recent actions)
  const confidenceTrend: 'up' | 'down' | 'stable' = 
    actionsCount > 5 ? 'up' : 
    actionsCount > 0 ? 'stable' : 'down';
  
  return {
    productId: product.id,
    revenueHealthScore,
    protectionStatus,
    revenueAdded,
    confidenceIndex,
    autonomyLevel: (product.autonomyLevel as AutonomyLevel) || 'manual',
    lastActionAt: product.lastZyraActionAt || null,
    actionsCount,
    healthCategory: getHealthCategory(revenueHealthScore),
    confidenceTrend,
  };
}

/**
 * Get intelligence summary for all user products
 */
export async function getProductIntelligenceSummary(
  userId: string
): Promise<ProductIntelligenceSummary> {
  try {
    const allProducts = await supabaseStorage.getProducts(userId);
    const connections = await supabaseStorage.getStoreConnections(userId);
    const activeConnection = connections.find((c: any) => c.platform === 'shopify' && c.status === 'active');
    const activeStoreDomain = activeConnection?.storeUrl?.replace('https://', '').replace('http://', '').replace(/\/$/, '') || '';
    const anyProductHasDomain = (allProducts || []).some(p => !!p.shopDomain);
    
    const products = (allProducts || []).filter(p => {
      if (!p.shopifyId) return false;
      if (anyProductHasDomain && activeStoreDomain) {
        return p.shopDomain === activeStoreDomain;
      }
      return true;
    });
    if (products.length === 0) {
      return {
        totalProducts: 0,
        revenueProtected: 0,
        productsAtRisk: 0,
        productsFullyOptimized: 0,
        avgConfidence: 0,
      };
    }
    
    let totalRevenue = 0;
    let atRiskCount = 0;
    let optimizedCount = 0;
    let totalConfidence = 0;
    
    for (const product of products) {
      const intelligence = await getProductIntelligence(userId, product);
      
      totalRevenue += intelligence.revenueAdded;
      totalConfidence += intelligence.confidenceIndex;
      
      if (intelligence.healthCategory === 'at_risk' || intelligence.healthCategory === 'revenue_leak') {
        atRiskCount++;
      }
      
      if (product.isOptimized) {
        optimizedCount++;
      }
    }
    
    return {
      totalProducts: products.length,
      revenueProtected: Math.round(totalRevenue * 100) / 100,
      productsAtRisk: atRiskCount,
      productsFullyOptimized: optimizedCount,
      avgConfidence: Math.round(totalConfidence / products.length),
    };
  } catch (error) {
    console.error('Error getting product intelligence summary:', error);
    return {
      totalProducts: 0,
      revenueProtected: 0,
      productsAtRisk: 0,
      productsFullyOptimized: 0,
      avgConfidence: 0,
    };
  }
}

/**
 * Record a ZYRA action for a product (adds to memory moat)
 */
export async function recordProductAction(
  userId: string,
  productId: string,
  actionType: string,
  actionDescription: string,
  expectedRevenueImpact: number | null = null,
  rollbackData: any = null
): Promise<string | null> {
  try {
    const action = await supabaseStorage.createProductActionHistory({
      userId,
      productId,
      actionType,
      actionDescription,
      expectedRevenueImpact: expectedRevenueImpact?.toString() || null,
      actualRevenueImpact: null,
      status: 'pending',
      rollbackData,
    });
    
    // Increment product's action count
    await supabaseStorage.incrementProductActionsCount(productId);
    
    return action?.id || null;
  } catch (error) {
    console.error('Error recording product action:', error);
    return null;
  }
}

/**
 * Complete a product action with measured results
 */
export async function completeProductAction(
  actionId: string,
  actualRevenueImpact: number | null = null
): Promise<boolean> {
  try {
    await supabaseStorage.updateProductActionHistory(actionId, {
      status: 'completed',
      actualRevenueImpact: actualRevenueImpact?.toString() || null,
      completedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error completing product action:', error);
    return false;
  }
}
