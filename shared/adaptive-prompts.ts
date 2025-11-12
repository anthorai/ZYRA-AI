/**
 * Adaptive Prompt System
 * Dynamically updates AI prompts based on learned performance patterns
 * This enables the AI to learn from real product performance data
 */

import type { LearningPattern } from './schema';
import type { PerformancePattern } from './content-performance-analyzer';

export interface AdaptivePromptContext {
  category?: string;
  targetAudience?: string;
  priceRange?: string;
  framework?: string;
  productType?: string;
}

export interface EnhancedPrompt {
  systemPrompt: string;
  userPrompt: string;
  patterns: LearningPattern[];
  confidence: number;
}

/**
 * Generate enhanced prompt based on learned patterns
 */
export function generateAdaptivePrompt(
  basePrompt: string,
  context: AdaptivePromptContext,
  patterns: LearningPattern[]
): EnhancedPrompt {
  // Filter patterns relevant to this context
  const relevantPatterns = patterns.filter(pattern => {
    if (context.category && pattern.category !== context.category) return false;
    if (context.targetAudience && pattern.targetAudience !== context.targetAudience) return false;
    if (context.priceRange && pattern.priceRange !== context.priceRange) return false;
    if (context.framework && pattern.framework !== context.framework) return false;
    return pattern.isActive;
  });

  // Sort by success rate and confidence
  const topPatterns = relevantPatterns
    .sort((a, b) => {
      const scoreA = parseFloat(a.successRate || "0") * parseFloat(a.confidence || "0");
      const scoreB = parseFloat(b.successRate || "0") * parseFloat(b.confidence || "0");
      return scoreB - scoreA;
    })
    .slice(0, 5); // Use top 5 patterns

  if (topPatterns.length === 0) {
    return {
      systemPrompt: basePrompt,
      userPrompt: "",
      patterns: [],
      confidence: 0.5 // Default confidence when no patterns available
    };
  }

  // Build enhanced system prompt with learned insights
  const patternInsights = topPatterns.map(pattern => {
    const insights: string[] = [];
    
    if (pattern.patternData) {
      const elements = pattern.patternData as any;
      if (elements.wordCount) {
        insights.push(`Optimal word count: ~${elements.wordCount} words`);
      }
      if (elements.emotionalTone) {
        insights.push(`Use ${elements.emotionalTone} tone`);
      }
      if (elements.keyPhrases && Array.isArray(elements.keyPhrases)) {
        insights.push(`Include phrases like: ${elements.keyPhrases.slice(0, 3).join(', ')}`);
      }
      if (elements.structure) {
        insights.push(`Structure: ${elements.structure}`);
      }
      if (elements.urgencyLevel) {
        insights.push(`Urgency level: ${elements.urgencyLevel}`);
      }
    }
    
    return insights.join('. ');
  }).filter(Boolean);

  const enhancedSystemPrompt = `${basePrompt}

PERFORMANCE-BASED INSIGHTS:
Our data shows that ${context.category || 'this type of'} content performs best when:
${patternInsights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

These insights are based on ${topPatterns.length} high-performing examples with average success rate of ${calculateAverageSuccessRate(topPatterns)}%.

Apply these learnings while maintaining your creative approach and brand voice.`;

  // Calculate overall confidence
  const avgConfidence = topPatterns.reduce((sum, p) => sum + parseFloat(p.confidence || "0"), 0) / topPatterns.length;

  return {
    systemPrompt: enhancedSystemPrompt,
    userPrompt: "",
    patterns: topPatterns,
    confidence: avgConfidence
  };
}

/**
 * Calculate average success rate from patterns
 */
function calculateAverageSuccessRate(patterns: LearningPattern[]): number {
  if (patterns.length === 0) return 0;
  const total = patterns.reduce((sum, p) => sum + parseFloat(p.successRate || "0"), 0);
  return Math.round(total / patterns.length);
}

/**
 * Generate framework-specific adaptive prompt
 */
export function generateFrameworkAdaptivePrompt(
  framework: string,
  context: AdaptivePromptContext,
  patterns: LearningPattern[]
): string {
  const frameworkPatterns = patterns.filter(p => p.framework === framework && p.isActive);
  
  if (frameworkPatterns.length === 0) {
    return ""; // No additional guidance
  }

  const topPattern = frameworkPatterns
    .sort((a, b) => parseFloat(b.successRate || "0") - parseFloat(a.successRate || "0"))[0];

  const elements = topPattern.patternData as any;
  if (!elements) return "";

  const guidance: string[] = [];
  
  // Extract framework-specific insights
  if (framework === 'AIDA' && elements.attentionGrabbers) {
    guidance.push(`Attention phase: ${elements.attentionGrabbers}`);
  }
  if (framework === 'PAS' && elements.problemFocus) {
    guidance.push(`Problem focus: ${elements.problemFocus}`);
  }
  if (framework === 'FAB' && elements.featureEmphasis) {
    guidance.push(`Feature emphasis: ${elements.featureEmphasis}`);
  }
  if (framework === 'BAB' && elements.beforeAfter) {
    guidance.push(`Before/After contrast: ${elements.beforeAfter}`);
  }

  return guidance.length > 0 
    ? `\n\nFRAMEWORK OPTIMIZATION:\n${guidance.join('\n')}` 
    : "";
}

/**
 * Inject performance patterns into copywriting prompt
 */
export function enhanceCopywritingPrompt(
  originalPrompt: string,
  productContext: {
    category: string;
    audience: string;
    priceRange?: string;
  },
  patterns: LearningPattern[]
): string {
  const context: AdaptivePromptContext = {
    category: productContext.category,
    targetAudience: productContext.audience,
    priceRange: productContext.priceRange
  };

  const enhanced = generateAdaptivePrompt(originalPrompt, context, patterns);
  return enhanced.systemPrompt;
}

/**
 * Generate adaptive SEO optimization prompt
 */
export function generateAdaptiveSEOPrompt(
  basePrompt: string,
  category: string,
  patterns: LearningPattern[]
): string {
  const seoPatterns = patterns.filter(p => 
    p.patternType === 'seo_optimization' && 
    p.category === category &&
    p.isActive
  );

  if (seoPatterns.length === 0) return basePrompt;

  const topPattern = seoPatterns
    .sort((a, b) => parseFloat(b.successRate || "0") - parseFloat(a.successRate || "0"))[0];

  const elements = topPattern.patternData as any;
  const seoGuidance: string[] = [];

  if (elements?.keywordDensity) {
    seoGuidance.push(`Target keyword density: ${elements.keywordDensity}%`);
  }
  if (elements?.metaDescriptionLength) {
    seoGuidance.push(`Meta description: ${elements.metaDescriptionLength} characters optimal`);
  }
  if (elements?.headingStructure) {
    seoGuidance.push(`Use heading structure: ${elements.headingStructure}`);
  }
  if (elements?.imageAltTags) {
    seoGuidance.push(`Alt tag style: ${elements.imageAltTags}`);
  }

  return seoGuidance.length > 0
    ? `${basePrompt}\n\nSEO BEST PRACTICES (based on high-performing content):\n${seoGuidance.join('\n')}`
    : basePrompt;
}

/**
 * Create A/B testing variants with pattern-based differences
 */
export function generatePatternVariants(
  baseContent: string,
  patterns: LearningPattern[]
): Array<{ variant: string; patternId: string; hypothesis: string }> {
  const variants: Array<{ variant: string; patternId: string; hypothesis: string }> = [];

  // Test different patterns against each other
  patterns.slice(0, 3).forEach(pattern => {
    const elements = pattern.patternData as any;
    if (!elements) return;

    let hypothesis = "";
    let variantInstruction = baseContent;

    if (elements.emotionalTone) {
      hypothesis = `Testing ${elements.emotionalTone} tone vs baseline`;
      variantInstruction += `\n[VARIANT: Use ${elements.emotionalTone} emotional tone]`;
    } else if (elements.wordCount) {
      hypothesis = `Testing ${elements.wordCount} word length vs baseline`;
      variantInstruction += `\n[VARIANT: Target ${elements.wordCount} words]`;
    }

    if (hypothesis) {
      variants.push({
        variant: variantInstruction,
        patternId: pattern.id,
        hypothesis
      });
    }
  });

  return variants;
}

/**
 * Validate if content follows learned patterns
 */
export function validateAgainstPatterns(
  content: string,
  patterns: LearningPattern[]
): {
  score: number;
  matchedPatterns: string[];
  suggestions: string[];
} {
  const matchedPatterns: string[] = [];
  const suggestions: string[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  const wordCount = content.split(/\s+/).length;
  const lowerContent = content.toLowerCase();

  for (const pattern of patterns) {
    const elements = pattern.patternData as any;
    if (!elements) continue;

    let patternScore = 0;

    // Check word count alignment
    if (elements.wordCount) {
      const diff = Math.abs(wordCount - elements.wordCount);
      const tolerance = elements.wordCount * 0.2; // 20% tolerance
      if (diff <= tolerance) {
        patternScore += 25;
        matchedPatterns.push(`Word count within target range (${elements.wordCount}±20%)`);
      } else {
        suggestions.push(`Adjust word count to ~${elements.wordCount} words (currently ${wordCount})`);
      }
    }

    // Check key phrases
    if (elements.keyPhrases && Array.isArray(elements.keyPhrases)) {
      const matchedPhrases = elements.keyPhrases.filter((phrase: string) => 
        lowerContent.includes(phrase.toLowerCase())
      );
      if (matchedPhrases.length > 0) {
        patternScore += 25;
        matchedPatterns.push(`Contains ${matchedPhrases.length} key performing phrases`);
      } else {
        suggestions.push(`Consider including phrases: ${elements.keyPhrases.slice(0, 2).join(', ')}`);
      }
    }

    // Check emotional tone (simplified)
    if (elements.emotionalTone) {
      const toneWords = getToneWords(elements.emotionalTone);
      const hasTone = toneWords.some(word => lowerContent.includes(word));
      if (hasTone) {
        patternScore += 25;
        matchedPatterns.push(`Matches ${elements.emotionalTone} tone`);
      } else {
        suggestions.push(`Consider using more ${elements.emotionalTone} language`);
      }
    }

    // Weight by pattern confidence and accumulate
    const weight = parseFloat(pattern.confidence || "1");
    totalScore += patternScore * weight;
    totalWeight += weight;
  }

  // Normalize by total weight and clamp to 0-100
  const finalScore = totalWeight > 0 
    ? Math.min(100, Math.max(0, Math.round(totalScore / totalWeight))) 
    : 50;

  return {
    score: finalScore,
    matchedPatterns,
    suggestions
  };
}

/**
 * Get tone-specific words for validation
 */
function getToneWords(tone: string): string[] {
  const toneMap: Record<string, string[]> = {
    'urgent': ['now', 'today', 'limited', 'hurry', 'fast', 'immediately'],
    'persuasive': ['you', 'your', 'imagine', 'discover', 'proven', 'guaranteed'],
    'positive': ['best', 'great', 'amazing', 'excellent', 'perfect', 'love'],
    'professional': ['quality', 'reliable', 'professional', 'trusted', 'expert']
  };
  
  return toneMap[tone.toLowerCase()] || [];
}

/**
 * Get pattern-based content recommendations before generation
 */
export function getPreGenerationRecommendations(
  context: AdaptivePromptContext,
  patterns: LearningPattern[]
): string[] {
  const recommendations: string[] = [];
  
  const relevantPatterns = patterns.filter(p => {
    if (context.category && p.category !== context.category) return false;
    if (context.targetAudience && p.targetAudience !== context.targetAudience) return false;
    return p.isActive;
  }).sort((a, b) => parseFloat(b.successRate || "0") - parseFloat(a.successRate || "0"));

  if (relevantPatterns.length === 0) {
    recommendations.push("No performance data available yet for this category. Content will be generated using standard best practices.");
    return recommendations;
  }

  const topPattern = relevantPatterns[0];
  const elements = topPattern.patternData as any;

  recommendations.push(`This content type has ${relevantPatterns.length} learned patterns with ${topPattern.successRate}% success rate.`);
  
  if (elements?.wordCount) {
    recommendations.push(`Recommended length: ${elements.wordCount} words`);
  }
  if (elements?.emotionalTone) {
    recommendations.push(`Most effective tone: ${elements.emotionalTone}`);
  }
  if (elements?.structure) {
    recommendations.push(`Proven structure: ${elements.structure}`);
  }

  return recommendations;
}
