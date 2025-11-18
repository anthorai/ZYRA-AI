import { requireDb } from '../db';
import { products, competitorProducts } from '@shared/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';

interface ProductMatch {
  productId: string;
  confidence: number; // 0-100
  matchReason: 'sku_exact' | 'title_high' | 'title_medium' | 'manual';
}

/**
 * Calculate Jaro-Winkler similarity between two strings
 * Returns a value between 0 (completely different) and 1 (identical)
 */
function jaroWinklerSimilarity(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;

  if (m === 0 && n === 0) return 1.0;
  if (m === 0 || n === 0) return 0.0;

  // Normalize strings (lowercase, trim)
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();

  if (str1 === str2) return 1.0;

  const matchDistance = Math.floor(Math.max(m, n) / 2) - 1;
  const s1Matches = new Array(m).fill(false);
  const s2Matches = new Array(n).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < m; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, n);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || str1[i] !== str2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Find transpositions
  let k = 0;
  for (let i = 0; i < m; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  const jaro = (matches / m + matches / n + (matches - transpositions / 2) / matches) / 3;

  // Jaro-Winkler uses a prefix scale
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(m, n)); i++) {
    if (str1[i] === str2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

/**
 * Normalize product title for better matching
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Remove common brand prefixes/suffixes
    .replace(/\b(new|brand new|official|authentic|original)\b/gi, '')
    // Remove special characters but keep spaces
    .replace(/[^\w\s]/g, ' ')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export class ProductMatcher {
  /**
   * Find the best matching product for a competitor product title
   */
  async findBestMatch(
    userId: string,
    competitorTitle: string,
    competitorSku?: string | null
  ): Promise<ProductMatch | null> {
    try {
      const db = requireDb();
      
      // Get all user's products
      const userProducts = await db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
        })
        .from(products)
        .where(eq(products.userId, userId));

      if (userProducts.length === 0) {
        return null;
      }

      // 1. Try exact SKU match first (highest confidence)
      if (competitorSku) {
        const skuMatch = userProducts.find(
          (p) => p.sku && p.sku.toLowerCase() === competitorSku.toLowerCase()
        );
        if (skuMatch) {
          return {
            productId: skuMatch.id,
            confidence: 100,
            matchReason: 'sku_exact',
          };
        }
      }

      // 2. Try title similarity matching
      const normalizedCompetitorTitle = normalizeTitle(competitorTitle);
      let bestMatch: ProductMatch | null = null;
      let bestSimilarity = 0;

      for (const product of userProducts) {
        const normalizedProductTitle = normalizeTitle(product.name);
        const similarity = jaroWinklerSimilarity(normalizedProductTitle, normalizedCompetitorTitle);

        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          
          // Determine confidence and match reason
          let confidence: number;
          let matchReason: 'title_high' | 'title_medium';

          if (similarity >= 0.85) {
            confidence = Math.round(similarity * 100);
            matchReason = 'title_high';
          } else if (similarity >= 0.70) {
            confidence = Math.round(similarity * 100);
            matchReason = 'title_medium';
          } else {
            // Don't return matches below 70% similarity
            continue;
          }

          bestMatch = {
            productId: product.id,
            confidence,
            matchReason,
          };
        }
      }

      return bestMatch;
    } catch (error) {
      console.error('[Product Matcher] Error finding match:', error);
      return null;
    }
  }

  /**
   * Auto-match all unmatched competitor products for a user
   */
  async autoMatchCompetitors(userId: string): Promise<{
    total: number;
    matched: number;
    skipped: number;
  }> {
    try {
      const db = requireDb();
      
      // Get all competitor products without a productId (unmatched)
      const unmatchedCompetitors = await db
        .select()
        .from(competitorProducts)
        .where(
          and(
            eq(competitorProducts.userId, userId),
            isNull(competitorProducts.productId)
          )
        );

      let matchedCount = 0;
      let skippedCount = 0;

      console.log(`[Product Matcher] Auto-matching ${unmatchedCompetitors.length} competitors for user ${userId}`);

      for (const competitor of unmatchedCompetitors) {
        if (!competitor.productTitle) {
          skippedCount++;
          continue;
        }

        const match = await this.findBestMatch(
          userId,
          competitor.productTitle,
          competitor.competitorSku
        );

        if (match && match.confidence >= 70) {
          // Update competitor product with matched productId
          await db
            .update(competitorProducts)
            .set({
              productId: match.productId,
              matchConfidence: match.confidence,
              updatedAt: new Date(),
            })
            .where(eq(competitorProducts.id, competitor.id));

          matchedCount++;
          console.log(
            `[Product Matcher] ✓ Matched ${competitor.competitorName} to product (${match.confidence}% confidence, ${match.matchReason})`
          );
        } else {
          skippedCount++;
          console.log(`[Product Matcher] ✗ No good match found for ${competitor.competitorName}`);
        }
      }

      return {
        total: unmatchedCompetitors.length,
        matched: matchedCount,
        skipped: skippedCount,
      };
    } catch (error) {
      console.error('[Product Matcher] Error auto-matching:', error);
      throw error;
    }
  }

  /**
   * Manually match a competitor product to a specific product
   */
  async manualMatch(competitorId: string, productId: string, userId: string): Promise<boolean> {
    try {
      const db = requireDb();
      
      // Verify both competitor and product belong to the user
      const [competitor] = await db
        .select()
        .from(competitorProducts)
        .where(
          and(
            eq(competitorProducts.id, competitorId),
            eq(competitorProducts.userId, userId)
          )
        )
        .limit(1);

      const [product] = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.id, productId),
            eq(products.userId, userId)
          )
        )
        .limit(1);

      if (!competitor || !product) {
        return false;
      }

      // Update competitor with manual match
      await db
        .update(competitorProducts)
        .set({
          productId,
          matchConfidence: 100,
          updatedAt: new Date(),
        })
        .where(eq(competitorProducts.id, competitorId));

      console.log(`[Product Matcher] Manual match: ${competitor.competitorName} → ${product.name}`);
      return true;
    } catch (error) {
      console.error('[Product Matcher] Error with manual match:', error);
      return false;
    }
  }

  /**
   * Unmatch a competitor product
   */
  async unmatch(competitorId: string, userId: string): Promise<boolean> {
    try {
      const db = requireDb();
      
      const [competitor] = await db
        .select()
        .from(competitorProducts)
        .where(
          and(
            eq(competitorProducts.id, competitorId),
            eq(competitorProducts.userId, userId)
          )
        )
        .limit(1);

      if (!competitor) {
        return false;
      }

      await db
        .update(competitorProducts)
        .set({
          productId: null,
          matchConfidence: null,
          updatedAt: new Date(),
        })
        .where(eq(competitorProducts.id, competitorId));

      console.log(`[Product Matcher] Unmatched: ${competitor.competitorName}`);
      return true;
    } catch (error) {
      console.error('[Product Matcher] Error unmatching:', error);
      return false;
    }
  }
}

// Export singleton instance
export const productMatcher = new ProductMatcher();
