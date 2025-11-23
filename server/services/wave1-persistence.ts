/**
 * Wave 1 Database Persistence Service
 * 
 * Handles all database operations for:
 * - Brand DNA profiles
 * - Framework usage tracking
 * - Template recommendations
 * - Edit pattern learning
 */

import { db } from '../db';
import { 
  brandDnaProfiles, 
  brandDnaEditPatterns,
  marketingFrameworkUsage,
  templateRecommendations,
  type BrandDnaProfile,
  type InsertBrandDnaProfile,
  type MarketingFrameworkUsage,
  type TemplateRecommendation,
} from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { BrandDNA } from '../../shared/brand-dna-analyzer';
import type { FrameworkUsageInsert, TemplateRecommendationInsert } from '../../shared/seo-output-validator';

/**
 * Get or create brand DNA profile for a user
 */
export async function getBrandDNAProfile(userId: string): Promise<BrandDNA | null> {
  try {
    const profile = await db.query.brandDnaProfiles.findFirst({
      where: eq(brandDnaProfiles.userId, userId),
    });
    
    if (!profile) {
      return null;
    }
    
    // Convert database format to BrandDNA format
    return convertDBProfileToBrandDNA(profile);
  } catch (error) {
    console.error('[Wave1DB] Failed to get brand DNA profile:', error);
    return null;
  }
}

/**
 * Save brand DNA profile to database
 */
export async function saveBrandDNAProfile(userId: string, brandDNA: BrandDNA): Promise<void> {
  try {
    const profileData: InsertBrandDnaProfile = {
      userId,
      writingStyle: brandDNA.writingStyle,
      avgSentenceLength: brandDNA.avgSentenceLength,
      avgParagraphLength: brandDNA.avgParagraphLength || 50,
      complexityLevel: brandDNA.complexityLevel || 'moderate',
      toneDensity: brandDNA.toneDensity,
      personalityTraits: brandDNA.personalityTraits || [],
      emotionalRange: brandDNA.emotionalRange || 'moderate',
      formalityScore: brandDNA.formalityScore || 60,
      keyPhrases: brandDNA.keyPhrases,
      powerWords: brandDNA.powerWords || [],
      avoidedWords: brandDNA.avoidedWords || [],
      vocabularyLevel: brandDNA.vocabularyLevel || 'intermediate',
      jargonFrequency: brandDNA.jargonFrequency || 'moderate',
      ctaStyle: brandDNA.ctaStyle,
      ctaFrequency: brandDNA.ctaFrequency || 'moderate',
      headlineStyle: brandDNA.headlineStyle || 'statement-based',
      listingStyle: brandDNA.listingStyle || 'bullets',
      emojiFrequency: brandDNA.emojiFrequency,
      punctuationStyle: brandDNA.punctuationStyle || 'standard',
      capitalizationStyle: brandDNA.capitalizationStyle || 'standard',
      benefitFocusRatio: brandDNA.benefitFocusRatio || 60,
      socialProofUsage: brandDNA.socialProofUsage || 'occasional',
      urgencyTactics: brandDNA.urgencyTactics || 'subtle',
      storytellingFrequency: brandDNA.storytellingFrequency || 'moderate',
      keywordDensity: brandDNA.keywordDensity || 'moderate',
      seoVsConversion: brandDNA.seoVsConversion || 'balanced',
      coreValues: brandDNA.coreValues || [],
      brandPersonality: brandDNA.brandPersonality,
      uniqueSellingPoints: brandDNA.uniqueSellingPoints || [],
      targetAudienceInsights: brandDNA.targetAudienceInsights || [],
      preferredModel: brandDNA.preferredModel || 'gpt-4o-mini',
      creativityLevel: brandDNA.creativityLevel || 70,
      sampleTexts: brandDNA.sampleTexts || [],
      confidenceScore: brandDNA.confidenceScore || 50,
    };
    
    // Upsert (insert or update)
    await db.insert(brandDnaProfiles)
      .values(profileData)
      .onConflictDoUpdate({
        target: brandDnaProfiles.userId,
        set: {
          ...profileData,
          updatedAt: new Date(),
        },
      });
    
    console.log(`[Wave1DB] Brand DNA profile saved for user ${userId}`);
  } catch (error) {
    console.error('[Wave1DB] Failed to save brand DNA profile:', error);
    throw error;
  }
}

/**
 * Track framework usage for learning
 */
export async function trackFrameworkUsage(usage: FrameworkUsageInsert): Promise<void> {
  try {
    await db.insert(marketingFrameworkUsage).values(usage);
    console.log(`[Wave1DB] Framework usage tracked: ${usage.frameworkName} for ${usage.productName}`);
  } catch (error) {
    console.error('[Wave1DB] Failed to track framework usage:', error);
    // Don't throw - tracking failures shouldn't break the main flow
  }
}

/**
 * Record template recommendation for learning
 */
export async function recordTemplateRecommendation(recommendation: TemplateRecommendationInsert): Promise<void> {
  try {
    await db.insert(templateRecommendations).values(recommendation);
    console.log(`[Wave1DB] Template recommendation recorded for user ${recommendation.userId}`);
  } catch (error) {
    console.error('[Wave1DB] Failed to record template recommendation:', error);
    // Don't throw - tracking failures shouldn't break the main flow
  }
}

/**
 * Get framework usage statistics for a user
 */
export async function getFrameworkStats(userId: string): Promise<{
  topFrameworks: Array<{ frameworkId: string; frameworkName: string; count: number }>;
  avgSeoScore: number;
  avgConversionScore: number;
  totalUsage: number;
}> {
  try {
    const usageRecords = await db.query.marketingFrameworkUsage.findMany({
      where: eq(marketingFrameworkUsage.userId, userId),
      orderBy: [desc(marketingFrameworkUsage.createdAt)],
      limit: 100,
    });
    
    if (usageRecords.length === 0) {
      return {
        topFrameworks: [],
        avgSeoScore: 0,
        avgConversionScore: 0,
        totalUsage: 0,
      };
    }
    
    // Calculate framework frequency
    const frameworkCounts: Record<string, { name: string; count: number }> = {};
    let totalSeoScore = 0;
    let totalConversionScore = 0;
    let scoreCount = 0;
    
    usageRecords.forEach(record => {
      // Count frameworks
      if (!frameworkCounts[record.frameworkId]) {
        frameworkCounts[record.frameworkId] = {
          name: record.frameworkName,
          count: 0,
        };
      }
      frameworkCounts[record.frameworkId].count++;
      
      // Sum scores
      if (record.seoScore) {
        totalSeoScore += record.seoScore;
        scoreCount++;
      }
      if (record.conversionScore) {
        totalConversionScore += record.conversionScore;
      }
    });
    
    // Get top 5 frameworks
    const topFrameworks = Object.entries(frameworkCounts)
      .map(([id, data]) => ({
        frameworkId: id,
        frameworkName: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      topFrameworks,
      avgSeoScore: scoreCount > 0 ? Math.round(totalSeoScore / scoreCount) : 0,
      avgConversionScore: scoreCount > 0 ? Math.round(totalConversionScore / scoreCount) : 0,
      totalUsage: usageRecords.length,
    };
  } catch (error) {
    console.error('[Wave1DB] Failed to get framework stats:', error);
    return {
      topFrameworks: [],
      avgSeoScore: 0,
      avgConversionScore: 0,
      totalUsage: 0,
    };
  }
}

/**
 * Learn from user edits to improve brand DNA
 */
export async function learnFromEdit(
  userId: string,
  brandDnaId: string | null,
  originalText: string,
  editedText: string,
  editType: 'tone' | 'length' | 'structure' | 'keywords' | 'cta' | 'other'
): Promise<void> {
  try {
    // Analyze what changed
    const learnedInsight = analyzeEditPattern(originalText, editedText, editType);
    
    await db.insert(brandDnaEditPatterns).values({
      userId,
      brandDnaId,
      originalText,
      editedText,
      editType,
      learnedInsight,
    });
    
    console.log(`[Wave1DB] Edit pattern learned for user ${userId}: ${editType}`);
  } catch (error) {
    console.error('[Wave1DB] Failed to learn from edit:', error);
  }
}

/**
 * Helper: Convert database profile to BrandDNA format
 */
function convertDBProfileToBrandDNA(profile: BrandDnaProfile): BrandDNA {
  return {
    writingStyle: profile.writingStyle as BrandDNA['writingStyle'],
    avgSentenceLength: profile.avgSentenceLength,
    toneDensity: profile.toneDensity as BrandDNA['toneDensity'],
    keyPhrases: (profile.keyPhrases as string[]) || [],
    powerWords: (profile.powerWords as string[]) || [],
    avoidedWords: (profile.avoidedWords as string[]) || [],
    ctaStyle: profile.ctaStyle,
    emojiFrequency: profile.emojiFrequency as BrandDNA['emojiFrequency'],
    formalityScore: profile.formalityScore,
    seoVsConversion: profile.seoVsConversion as BrandDNA['seoVsConversion'],
    brandPersonality: profile.brandPersonality || undefined,
    preferredModel: profile.preferredModel as 'gpt-4o' | 'gpt-4o-mini',
    creativityLevel: profile.creativityLevel,
    confidenceScore: profile.confidenceScore,
    
    // Optional fields
    avgParagraphLength: profile.avgParagraphLength,
    complexityLevel: profile.complexityLevel as BrandDNA['complexityLevel'],
    personalityTraits: (profile.personalityTraits as string[]) || [],
    emotionalRange: profile.emotionalRange as BrandDNA['emotionalRange'],
    vocabularyLevel: profile.vocabularyLevel,
    jargonFrequency: profile.jargonFrequency as BrandDNA['jargonFrequency'],
    ctaFrequency: profile.ctaFrequency as BrandDNA['ctaFrequency'],
    headlineStyle: profile.headlineStyle,
    listingStyle: profile.listingStyle as BrandDNA['listingStyle'],
    punctuationStyle: profile.punctuationStyle as BrandDNA['punctuationStyle'],
    capitalizationStyle: profile.capitalizationStyle as BrandDNA['capitalizationStyle'],
    benefitFocusRatio: profile.benefitFocusRatio,
    socialProofUsage: profile.socialProofUsage as BrandDNA['socialProofUsage'],
    urgencyTactics: profile.urgencyTactics as BrandDNA['urgencyTactics'],
    storytellingFrequency: profile.storytellingFrequency as BrandDNA['storytellingFrequency'],
    keywordDensity: profile.keywordDensity as BrandDNA['keywordDensity'],
    coreValues: (profile.coreValues as string[]) || [],
    uniqueSellingPoints: (profile.uniqueSellingPoints as string[]) || [],
    targetAudienceInsights: (profile.targetAudienceInsights as string[]) || [],
    sampleTexts: (profile.sampleTexts as string[]) || [],
  };
}

/**
 * Helper: Analyze edit patterns to extract insights
 */
function analyzeEditPattern(
  original: string,
  edited: string,
  editType: string
): string {
  const origLength = original.length;
  const editLength = edited.length;
  const lengthChange = editLength - origLength;
  
  switch (editType) {
    case 'tone':
      return `User prefers ${editLength > origLength ? 'more expressive' : 'more concise'} tone`;
    case 'length':
      return `User adjusted length by ${lengthChange > 0 ? '+' : ''}${lengthChange} characters`;
    case 'structure':
      return 'User reorganized content structure';
    case 'keywords':
      return 'User modified keyword placement';
    case 'cta':
      return 'User adjusted call-to-action wording';
    default:
      return `User made ${editType} edits`;
  }
}
