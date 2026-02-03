/**
 * Power Mode Service
 * 
 * Combines real-time Google SERP analysis with AI to generate
 * competitive intelligence-driven product optimizations.
 * 
 * Power Mode provides:
 * - Real-time Google SERP analysis via DataForSEO
 * - Competitor title/meta comparison
 * - Search intent classification
 * - Content gap detection
 * - AI-powered competitive rewrites
 */

import { analyzeSERP, checkSERPHealth, type SERPAnalysis } from '../services/serp-analyzer';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface PowerModeInput {
  productName: string;
  productDescription?: string;
  currentTitle?: string;
  currentMetaDescription?: string;
  category?: string;
  price?: number;
  targetKeyword?: string;
  brandVoice?: {
    tone?: string;
    style?: string;
  };
}

export interface PowerModeOutput {
  serpAnalysis: SERPAnalysis;
  optimizedContent: {
    title: string;
    metaTitle: string;
    metaDescription: string;
    productDescription: string;
  };
  competitiveInsights: {
    topCompetitorTitles: string[];
    keywordGaps: string[];
    contentOpportunities: string[];
    searchIntent: string;
    difficultyScore: number;
    confidenceScore: number;
  };
  expectedImpact: {
    estimatedRankingImprovement: string;
    estimatedRevenueImpact: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  creditCost: number;
}

export interface PowerModeHealthStatus {
  serpApiAvailable: boolean;
  openaiAvailable: boolean;
  message: string;
}

export class PowerModeService {
  private static readonly POWER_MODE_CREDIT_COST = 5;

  async checkHealth(): Promise<PowerModeHealthStatus> {
    const serpHealth = await checkSERPHealth();
    const openaiAvailable = !!process.env.OPENAI_API_KEY;

    return {
      serpApiAvailable: serpHealth.available,
      openaiAvailable,
      message: serpHealth.available && openaiAvailable 
        ? 'Power Mode operational' 
        : `Issues: ${!serpHealth.available ? 'SERP API unavailable. ' : ''}${!openaiAvailable ? 'OpenAI unavailable.' : ''}`,
    };
  }

  async analyzeAndOptimize(input: PowerModeInput): Promise<PowerModeOutput> {
    const searchKeyword = input.targetKeyword || input.productName;
    
    const serpAnalysis = await analyzeSERP(searchKeyword, 'United States');
    
    const competitiveInsights = this.extractCompetitiveInsights(serpAnalysis, input);
    
    const optimizedContent = await this.generateAIOptimizedContent(input, serpAnalysis, competitiveInsights);
    
    const expectedImpact = this.calculateExpectedImpact(serpAnalysis, competitiveInsights);

    return {
      serpAnalysis,
      optimizedContent,
      competitiveInsights,
      expectedImpact,
      creditCost: PowerModeService.POWER_MODE_CREDIT_COST,
    };
  }

  private extractCompetitiveInsights(
    serp: SERPAnalysis,
    input: PowerModeInput
  ): PowerModeOutput['competitiveInsights'] {
    const topCompetitorTitles = serp.topResults.slice(0, 5).map(r => r.title);
    
    const currentTitleWords = new Set(
      (input.currentTitle || input.productName).toLowerCase().split(/\s+/)
    );
    const competitorWords = new Set(
      serp.keywordClusters.lsi.concat(serp.keywordClusters.secondary)
    );
    
    const keywordGaps = Array.from(competitorWords)
      .filter(kw => !currentTitleWords.has(kw.toLowerCase()))
      .slice(0, 8);
    
    const contentOpportunities: string[] = [];
    
    if (serp.titlePatterns.topModifiers.length > 0) {
      const missingModifiers = serp.titlePatterns.topModifiers.filter(
        mod => !(input.currentTitle || '').toLowerCase().includes(mod)
      );
      if (missingModifiers.length > 0) {
        contentOpportunities.push(`Add power modifiers: ${missingModifiers.join(', ')}`);
      }
    }
    
    if (input.currentTitle && input.currentTitle.length < serp.titlePatterns.averageLength - 10) {
      contentOpportunities.push(`Expand title length (competitors average ${serp.titlePatterns.averageLength} chars)`);
    }
    
    if (serp.metaPatterns.emotionalTriggers.length > 0) {
      contentOpportunities.push(`Use emotional triggers: ${serp.metaPatterns.emotionalTriggers.slice(0, 3).join(', ')}`);
    }
    
    contentOpportunities.push(`Follow structure: ${serp.titlePatterns.commonStructure}`);
    
    const searchIntent = this.inferSearchIntent(serp);
    
    const topDomainStrength = serp.competitorInsights.topDomains.filter(d => 
      ['amazon.com', 'walmart.com', 'ebay.com', 'target.com'].some(big => d.includes(big))
    ).length;
    const difficultyScore = Math.min(100, 30 + (topDomainStrength * 15) + (serp.topResults.length * 5));
    
    const confidenceScore = Math.max(50, 95 - difficultyScore + keywordGaps.length * 2);

    return {
      topCompetitorTitles,
      keywordGaps,
      contentOpportunities,
      searchIntent,
      difficultyScore,
      confidenceScore,
    };
  }

  private inferSearchIntent(serp: SERPAnalysis): string {
    const allContent = serp.topResults.map(r => r.title + ' ' + r.description).join(' ').toLowerCase();
    
    if (allContent.includes('buy') || allContent.includes('price') || allContent.includes('shop now')) {
      return 'transactional';
    }
    if (allContent.includes('how to') || allContent.includes('guide') || allContent.includes('what is')) {
      return 'informational';
    }
    if (allContent.includes('review') || allContent.includes('best') || allContent.includes('vs')) {
      return 'commercial investigation';
    }
    return 'commercial';
  }

  private async generateAIOptimizedContent(
    input: PowerModeInput,
    serp: SERPAnalysis,
    insights: PowerModeOutput['competitiveInsights']
  ): Promise<PowerModeOutput['optimizedContent']> {
    const systemPrompt = `You are ZYRA, an AI SEO specialist for Shopify stores.

Your job is to generate SEO-optimized product content that outranks competitors on Google.

COMPETITOR ANALYSIS:
Top ranking titles:
${insights.topCompetitorTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Common title structure: ${serp.titlePatterns.commonStructure}
Average title length: ${serp.titlePatterns.averageLength} characters
Power modifiers used: ${serp.titlePatterns.topModifiers.join(', ') || 'none detected'}
Emotional triggers: ${serp.metaPatterns.emotionalTriggers.join(', ') || 'none detected'}

KEYWORD INTELLIGENCE:
Primary keyword: ${serp.keywordClusters.primary}
Secondary keywords: ${serp.keywordClusters.secondary.join(', ')}
LSI keywords: ${serp.keywordClusters.lsi.slice(0, 10).join(', ')}
Keyword gaps (missing from current): ${insights.keywordGaps.join(', ')}

Search intent: ${insights.searchIntent}

BRAND VOICE:
${input.brandVoice?.tone ? `Tone: ${input.brandVoice.tone}` : 'Professional and trustworthy'}
${input.brandVoice?.style ? `Style: ${input.brandVoice.style}` : 'Clear and benefit-focused'}

Generate content that:
1. Follows the winning title structure
2. Incorporates missing keywords naturally
3. Uses appropriate power modifiers
4. Matches or exceeds competitor quality
5. Maintains brand voice consistency
6. Optimizes for the detected search intent

Respond ONLY with valid JSON matching this structure:
{
  "title": "SEO-optimized product title (50-60 chars)",
  "metaTitle": "Meta title for search engines (50-60 chars)",
  "metaDescription": "Compelling meta description with call-to-action (140-160 chars)",
  "productDescription": "3-4 paragraph product description with benefits, features, and value proposition"
}`;

    const userPrompt = `Optimize this product for Google rankings:

Product Name: ${input.productName}
${input.currentTitle ? `Current Title: ${input.currentTitle}` : ''}
${input.category ? `Category: ${input.category}` : ''}
${input.price ? `Price: $${input.price}` : ''}
${input.productDescription ? `Current Description: ${input.productDescription.slice(0, 500)}...` : ''}

Create optimized content that will outrank these competitors while maintaining authenticity.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        title: parsed.title || input.productName,
        metaTitle: parsed.metaTitle || parsed.title || input.productName,
        metaDescription: parsed.metaDescription || '',
        productDescription: parsed.productDescription || input.productDescription || '',
      };
    } catch (error) {
      console.error('[PowerMode] AI generation error:', error);
      return {
        title: input.currentTitle || input.productName,
        metaTitle: input.currentTitle || input.productName,
        metaDescription: input.currentMetaDescription || '',
        productDescription: input.productDescription || '',
      };
    }
  }

  private calculateExpectedImpact(
    serp: SERPAnalysis,
    insights: PowerModeOutput['competitiveInsights']
  ): PowerModeOutput['expectedImpact'] {
    const avgPosition = serp.topResults.length > 0 
      ? serp.topResults.reduce((sum, r) => sum + r.position, 0) / serp.topResults.length 
      : 5;
    
    const improvementPotential = Math.max(1, 10 - avgPosition);
    const rankingImprovement = improvementPotential > 3 
      ? `+${Math.round(improvementPotential)} positions` 
      : 'Marginal improvement expected';
    
    const baseRevenue = 50;
    const confidenceMultiplier = insights.confidenceScore / 100;
    const difficultyMultiplier = 1 - (insights.difficultyScore / 200);
    const estimatedRevenueImpact = Math.round(baseRevenue * confidenceMultiplier * difficultyMultiplier * 10) / 10;
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (insights.difficultyScore > 70) {
      riskLevel = 'medium';
    }
    if (insights.difficultyScore > 85 || insights.confidenceScore < 50) {
      riskLevel = 'high';
    }

    return {
      estimatedRankingImprovement: rankingImprovement,
      estimatedRevenueImpact,
      riskLevel,
    };
  }

  getCreditCost(): number {
    return PowerModeService.POWER_MODE_CREDIT_COST;
  }
}

export const powerModeService = new PowerModeService();
