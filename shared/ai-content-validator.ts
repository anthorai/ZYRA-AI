/**
 * AI Content Pre-Validation Layer
 * Validates all AI-generated content before delivery to ensure quality standards
 * This prevents low-quality outputs from reaching users
 */

import { analyzeContent, type ContentMetrics } from './content-performance-analyzer';
import { validateAgainstPatterns } from './adaptive-prompts';
import type { LearningPattern } from './schema';

export interface ValidationResult {
  passed: boolean;
  overallScore: number;
  seoScore: number;
  readabilityScore: number;
  emotionalScore: number;
  brandConsistencyScore: number;
  issues: ValidationIssue[];
  suggestions: string[];
  metrics: ContentMetrics;
}

export interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'seo' | 'readability' | 'emotion' | 'brand' | 'length' | 'structure';
  message: string;
}

export interface ValidationConfig {
  minOverallScore?: number;
  minReadabilityScore?: number;
  minSEOScore?: number;
  requireBrandConsistency?: boolean;
  brandVoice?: {
    tone: string;
    keywords: string[];
    avoidWords: string[];
  };
  targetAudience?: string;
  category?: string;
}

const DEFAULT_CONFIG: ValidationConfig = {
  minOverallScore: 60,
  minReadabilityScore: 60,
  minSEOScore: 50,
  requireBrandConsistency: true
};

/**
 * Main validation function - validates AI content before delivery
 */
export function validateAIContent(
  content: string,
  contentType: 'product_description' | 'meta_description' | 'seo_content' | 'email_copy' | 'ad_copy',
  patterns: LearningPattern[] = [],
  config: ValidationConfig = DEFAULT_CONFIG
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const suggestions: string[] = [];
  
  // Merge with defaults
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // 1. Analyze content metrics
  const metrics = analyzeContent(content);

  // 2. Validate readability
  const readabilityScore = validateReadability(content, metrics, contentType, issues, suggestions);

  // 3. Validate SEO quality
  const seoScore = validateSEO(content, contentType, metrics, issues, suggestions);

  // 4. Validate emotional tone
  const emotionalScore = validateEmotionalTone(content, metrics, finalConfig, issues, suggestions);

  // 5. Validate brand consistency
  const brandConsistencyScore = validateBrandConsistency(
    content, 
    issues, 
    suggestions,
    finalConfig.brandVoice
  );

  // 6. Validate against learned patterns
  let patternScore = 50; // Default
  if (patterns.length > 0) {
    const patternValidation = validateAgainstPatterns(content, patterns);
    patternScore = patternValidation.score;
    suggestions.push(...patternValidation.suggestions);
  }

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    (readabilityScore * 0.25) +
    (seoScore * 0.25) +
    (emotionalScore * 0.15) +
    (brandConsistencyScore * 0.15) +
    (patternScore * 0.20)
  );

  // Determine if validation passed
  const passed = 
    overallScore >= (finalConfig.minOverallScore || 60) &&
    readabilityScore >= (finalConfig.minReadabilityScore || 60) &&
    seoScore >= (finalConfig.minSEOScore || 50) &&
    issues.filter(i => i.severity === 'critical').length === 0;

  return {
    passed,
    overallScore,
    seoScore,
    readabilityScore,
    emotionalScore,
    brandConsistencyScore,
    issues,
    suggestions,
    metrics
  };
}

/**
 * Validate readability of content
 */
function validateReadability(
  content: string,
  metrics: ContentMetrics,
  contentType: string,
  issues: ValidationIssue[],
  suggestions: string[]
): number {
  let score = metrics.readabilityScore;

  // Check if content is too complex
  if (metrics.readabilityScore < 50) {
    issues.push({
      severity: 'warning',
      category: 'readability',
      message: 'Content is too complex for general audience. Readability score: ' + metrics.readabilityScore
    });
    suggestions.push('Simplify language and shorten sentences to improve readability');
  }

  // Check if content is too simple (may lack professionalism)
  if (metrics.readabilityScore > 90 && contentType !== 'ad_copy') {
    issues.push({
      severity: 'info',
      category: 'readability',
      message: 'Content may be too simple. Consider adding more detail.'
    });
  }

  // Check sentence complexity
  if (metrics.sentenceComplexity > 80) {
    issues.push({
      severity: 'warning',
      category: 'readability',
      message: 'Sentences are too long. Average complexity: ' + metrics.sentenceComplexity
    });
    suggestions.push('Break up long sentences into shorter, clearer statements');
  }

  // Adjust score based on content type expectations
  if (contentType === 'ad_copy' && metrics.readabilityScore > 80) {
    score += 10; // Bonus for simple ad copy
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Validate SEO quality
 */
function validateSEO(
  content: string,
  contentType: string,
  metrics: ContentMetrics,
  issues: ValidationIssue[],
  suggestions: string[]
): number {
  let score = 70; // Base SEO score

  // Length validation by content type
  const lengthGuidelines: Record<string, { min: number; max: number; optimal: number }> = {
    'product_description': { min: 100, max: 300, optimal: 200 },
    'meta_description': { min: 120, max: 160, optimal: 155 },
    'seo_content': { min: 300, max: 2000, optimal: 800 },
    'email_copy': { min: 50, max: 500, optimal: 150 },
    'ad_copy': { min: 50, max: 150, optimal: 80 }
  };

  const guideline = lengthGuidelines[contentType];
  if (guideline) {
    if (metrics.wordCount < guideline.min) {
      score -= 20;
      issues.push({
        severity: 'warning',
        category: 'seo',
        message: `Content too short for ${contentType}. Current: ${metrics.wordCount} words, minimum: ${guideline.min}`
      });
      suggestions.push(`Expand content to at least ${guideline.min} words for better SEO`);
    } else if (metrics.wordCount > guideline.max) {
      score -= 10;
      issues.push({
        severity: 'info',
        category: 'seo',
        message: `Content may be too long for ${contentType}. Current: ${metrics.wordCount} words, maximum: ${guideline.max}`
      });
      suggestions.push(`Consider condensing to under ${guideline.max} words`);
    } else if (Math.abs(metrics.wordCount - guideline.optimal) < 20) {
      score += 10; // Bonus for optimal length
    }
  }

  // Check for keyword stuffing (placeholder - would use actual keywords)
  if (metrics.keywordDensity > 5) {
    score -= 15;
    issues.push({
      severity: 'warning',
      category: 'seo',
      message: 'Possible keyword stuffing detected'
    });
    suggestions.push('Reduce keyword density to appear more natural');
  }

  // Meta description specific checks
  if (contentType === 'meta_description') {
    if (content.length < 120) {
      score -= 20;
      issues.push({
        severity: 'critical',
        category: 'seo',
        message: 'Meta description too short (< 120 characters)'
      });
    }
    if (content.length > 160) {
      score -= 20;
      issues.push({
        severity: 'critical',
        category: 'seo',
        message: 'Meta description too long (> 160 characters) - will be truncated in search results'
      });
    }
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Validate emotional tone appropriateness
 */
function validateEmotionalTone(
  content: string,
  metrics: ContentMetrics,
  config: ValidationConfig,
  issues: ValidationIssue[],
  suggestions: string[]
): number {
  let score = 70; // Base emotional score

  // Validate tone matches expected brand voice
  if (config.brandVoice?.tone) {
    const expectedTone = config.brandVoice.tone.toLowerCase();
    const actualTone = metrics.emotionalTone.toLowerCase();
    
    if (expectedTone !== actualTone) {
      score -= 20;
      issues.push({
        severity: 'warning',
        category: 'emotion',
        message: `Tone mismatch. Expected: ${expectedTone}, Got: ${actualTone}`
      });
      suggestions.push(`Adjust content to match ${expectedTone} tone`);
    } else {
      score += 15; // Bonus for matching tone
    }
  }

  // Check for appropriate emotional appeal based on content type
  const lowerContent = content.toLowerCase();
  const hasEmotionalWords = ['love', 'hate', 'amazing', 'terrible', 'awesome', 'horrible']
    .some(word => lowerContent.includes(word));

  if (!hasEmotionalWords && metrics.emotionalTone === 'neutral') {
    issues.push({
      severity: 'info',
      category: 'emotion',
      message: 'Content lacks emotional appeal - consider adding more engaging language'
    });
    suggestions.push('Include power words to create stronger emotional connection');
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Validate brand consistency
 */
function validateBrandConsistency(
  content: string,
  issues: ValidationIssue[],
  suggestions: string[],
  brandVoice?: { tone: string; keywords: string[]; avoidWords: string[] }
): number {
  if (!brandVoice) {
    return 50; // Neutral score when no brand voice is configured
  }

  let score = 70;
  const lowerContent = content.toLowerCase();

  // Check for required brand keywords
  if (brandVoice.keywords && brandVoice.keywords.length > 0) {
    const foundKeywords = brandVoice.keywords.filter(kw => 
      lowerContent.includes(kw.toLowerCase())
    );
    
    const keywordCoverage = foundKeywords.length / brandVoice.keywords.length;
    score += Math.round(keywordCoverage * 20); // Up to +20 for keyword coverage

    if (keywordCoverage < 0.3) {
      issues.push({
        severity: 'info',
        category: 'brand',
        message: 'Content lacks key brand terms'
      });
      suggestions.push(`Consider including brand keywords: ${brandVoice.keywords.slice(0, 3).join(', ')}`);
    }
  }

  // Check for words to avoid
  if (brandVoice.avoidWords && brandVoice.avoidWords.length > 0) {
    const foundAvoidWords = brandVoice.avoidWords.filter(word => 
      lowerContent.includes(word.toLowerCase())
    );
    
    if (foundAvoidWords.length > 0) {
      score -= foundAvoidWords.length * 10;
      issues.push({
        severity: 'warning',
        category: 'brand',
        message: `Content contains words to avoid: ${foundAvoidWords.join(', ')}`
      });
      suggestions.push(`Remove or replace: ${foundAvoidWords.join(', ')}`);
    }
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Quick validation - returns true/false without detailed analysis
 */
export function quickValidate(
  content: string,
  minScore: number = 60
): boolean {
  if (!content || content.trim().length === 0) return false;
  
  const metrics = analyzeContent(content);
  
  // Quick checks
  if (metrics.wordCount < 10) return false; // Too short
  if (metrics.readabilityScore < 40) return false; // Too complex
  
  return true;
}

/**
 * Get validation summary for logging
 */
export function getValidationSummary(result: ValidationResult): string {
  const status = result.passed ? '✓ PASSED' : '✗ FAILED';
  const criticalIssues = result.issues.filter(i => i.severity === 'critical').length;
  const warnings = result.issues.filter(i => i.severity === 'warning').length;
  
  return `${status} | Score: ${result.overallScore}/100 | Critical: ${criticalIssues} | Warnings: ${warnings}`;
}

/**
 * Auto-improve content based on validation results
 */
export function generateImprovementPrompt(
  originalContent: string,
  validationResult: ValidationResult
): string {
  if (validationResult.passed) {
    return originalContent; // No improvement needed
  }

  const improvements: string[] = [
    `Original content score: ${validationResult.overallScore}/100`,
    '\nRequired improvements:'
  ];

  // Add critical issues
  const criticalIssues = validationResult.issues.filter(i => i.severity === 'critical');
  if (criticalIssues.length > 0) {
    improvements.push('\nCRITICAL:');
    criticalIssues.forEach(issue => improvements.push(`- ${issue.message}`));
  }

  // Add suggestions
  if (validationResult.suggestions.length > 0) {
    improvements.push('\nSuggestions:');
    validationResult.suggestions.slice(0, 5).forEach(s => improvements.push(`- ${s}`));
  }

  // Add target metrics
  improvements.push('\nTarget metrics:');
  improvements.push(`- Readability: ${validationResult.readabilityScore}/100 → 70+`);
  improvements.push(`- SEO: ${validationResult.seoScore}/100 → 70+`);
  improvements.push(`- Overall: ${validationResult.overallScore}/100 → 70+`);

  return `${improvements.join('\n')}\n\nOriginal content:\n${originalContent}`;
}
