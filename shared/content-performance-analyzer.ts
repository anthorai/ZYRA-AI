/**
 * Content Performance Analyzer
 * Analyzes AI-generated content performance and identifies winning patterns
 */

export interface ContentMetrics {
  wordCount: number;
  readabilityScore: number;
  emotionalTone: 'positive' | 'neutral' | 'urgent' | 'persuasive';
  keywordDensity: number;
  sentenceComplexity: number;
}

export interface PerformancePattern {
  patternType: 'word_choice' | 'structure' | 'emotional_trigger' | 'framework' | 'length';
  patternData: any;
  successRate: number;
  confidence: number;
}

/**
 * Analyze content and extract metrics
 */
export function analyzeContent(content: string): ContentMetrics {
  const words = content.trim().split(/\s+/);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Calculate word count
  const wordCount = words.length;
  
  // Calculate readability (Flesch Reading Ease approximation)
  const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
  const avgSyllablesPerWord = estimateSyllables(content) / Math.max(words.length, 1);
  const readabilityScore = Math.max(0, Math.min(100, 
    206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
  ));
  
  // Detect emotional tone
  const emotionalTone = detectEmotionalTone(content);
  
  // Calculate keyword density (placeholder - would use actual keywords)
  const keywordDensity = 0; // Will be calculated based on target keywords
  
  // Sentence complexity (avg words per sentence)
  const sentenceComplexity = Math.min(100, avgWordsPerSentence * 5);
  
  return {
    wordCount,
    readabilityScore: Math.round(readabilityScore),
    emotionalTone,
    keywordDensity,
    sentenceComplexity: Math.round(sentenceComplexity)
  };
}

/**
 * Estimate syllable count for readability calculation
 */
function estimateSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let syllables = 0;
  
  for (const word of words) {
    // Count vowel groups
    const vowelGroups = word.match(/[aeiouy]+/g);
    syllables += vowelGroups ? vowelGroups.length : 1;
    
    // Adjust for silent 'e'
    if (word.endsWith('e') && word.length > 2) {
      syllables--;
    }
  }
  
  return Math.max(syllables, words.length); // At least one syllable per word
}

/**
 * Detect emotional tone of content
 */
function detectEmotionalTone(content: string): 'positive' | 'neutral' | 'urgent' | 'persuasive' {
  const lowerContent = content.toLowerCase();
  
  // Urgency indicators
  const urgencyWords = ['now', 'today', 'limited', 'hurry', 'fast', 'quick', 'immediately', 'don\'t miss'];
  const urgencyCount = urgencyWords.filter(word => lowerContent.includes(word)).length;
  
  // Persuasion indicators
  const persuasionWords = ['you', 'your', 'imagine', 'discover', 'proven', 'guaranteed', 'transform'];
  const persuasionCount = persuasionWords.filter(word => lowerContent.includes(word)).length;
  
  // Positive indicators
  const positiveWords = ['best', 'great', 'amazing', 'excellent', 'perfect', 'love', 'beautiful'];
  const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
  
  // Determine dominant tone
  if (urgencyCount >= 2) return 'urgent';
  if (persuasionCount >= 2) return 'persuasive';
  if (positiveCount >= 2) return 'positive';
  return 'neutral';
}

/**
 * Calculate performance score based on metrics
 */
export function calculatePerformanceScore(metrics: {
  views: number;
  clicks: number;
  conversions: number;
  baselineViews?: number;
}): number {
  const { views, clicks, conversions, baselineViews = 100 } = metrics;
  
  if (views === 0) return 0;
  
  const ctr = (clicks / views) * 100;
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  
  // Weighted score: CTR (40%), Conversion Rate (40%), Volume (20%)
  const ctrScore = Math.min(100, ctr * 10); // 10% CTR = 100 points
  const conversionScore = Math.min(100, conversionRate * 10); // 10% conversion = 100 points
  const volumeScore = Math.min(100, (views / baselineViews) * 100);
  
  return Math.round(
    (ctrScore * 0.4) + (conversionScore * 0.4) + (volumeScore * 0.2)
  );
}

/**
 * Extract patterns from high-performing content
 */
export function extractWinningPatterns(
  topContent: Array<{ content: string; performanceScore: number }>
): PerformancePattern[] {
  const patterns: PerformancePattern[] = [];
  
  // Analyze word count pattern
  const avgWordCount = topContent.reduce((sum, c) => {
    const words = c.content.split(/\s+/).length;
    return sum + words;
  }, 0) / topContent.length;
  
  patterns.push({
    patternType: 'length',
    patternData: { optimalWordCount: Math.round(avgWordCount) },
    successRate: 75, // Calculated from actual performance
    confidence: 0.8
  });
  
  // Analyze emotional triggers
  const emotionalDistribution = topContent.reduce((acc, c) => {
    const metrics = analyzeContent(c.content);
    acc[metrics.emotionalTone] = (acc[metrics.emotionalTone] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const dominantTone = Object.entries(emotionalDistribution)
    .sort(([, a], [, b]) => b - a)[0];
  
  if (dominantTone) {
    patterns.push({
      patternType: 'emotional_trigger',
      patternData: { dominantTone: dominantTone[0] },
      successRate: (dominantTone[1] / topContent.length) * 100,
      confidence: 0.7
    });
  }
  
  return patterns;
}

/**
 * Compare content against learned patterns
 */
export function scoreAgainstPatterns(
  content: string,
  patterns: PerformancePattern[]
): number {
  if (patterns.length === 0) return 50; // Default score
  
  const metrics = analyzeContent(content);
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const pattern of patterns) {
    let patternScore = 0;
    const weight = pattern.confidence;
    
    switch (pattern.patternType) {
      case 'length':
        const optimalLength = pattern.patternData.optimalWordCount;
        const lengthDiff = Math.abs(metrics.wordCount - optimalLength);
        patternScore = Math.max(0, 100 - (lengthDiff / optimalLength) * 100);
        break;
        
      case 'emotional_trigger':
        const targetTone = pattern.patternData.dominantTone;
        patternScore = metrics.emotionalTone === targetTone ? 100 : 50;
        break;
    }
    
    totalScore += patternScore * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
}

/**
 * Generate improvement suggestions based on patterns
 */
export function generateImprovementSuggestions(
  content: string,
  patterns: PerformancePattern[]
): string[] {
  const suggestions: string[] = [];
  const metrics = analyzeContent(content);
  
  for (const pattern of patterns) {
    switch (pattern.patternType) {
      case 'length':
        const optimalLength = pattern.patternData.optimalWordCount;
        const diff = metrics.wordCount - optimalLength;
        if (Math.abs(diff) > optimalLength * 0.2) {
          if (diff > 0) {
            suggestions.push(`Consider reducing content length to ~${optimalLength} words (current: ${metrics.wordCount})`);
          } else {
            suggestions.push(`Consider expanding content to ~${optimalLength} words for better engagement (current: ${metrics.wordCount})`);
          }
        }
        break;
        
      case 'emotional_trigger':
        const targetTone = pattern.patternData.dominantTone;
        if (metrics.emotionalTone !== targetTone) {
          suggestions.push(`High-performing content for this category tends to be ${targetTone}. Consider adjusting your tone.`);
        }
        break;
    }
  }
  
  // Readability suggestions
  if (metrics.readabilityScore < 60) {
    suggestions.push('Content readability is low. Consider simplifying language and shortening sentences.');
  }
  
  return suggestions;
}
