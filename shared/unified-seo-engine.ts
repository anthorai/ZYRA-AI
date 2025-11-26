/**
 * Unified SEO Engine - Core System
 * 
 * This is the centralized SEO generation system that ALL tools use
 * Ensures consistent quality across:
 * - Product SEO Engine
 * - Bulk Optimization
 * - Copywriting
 * - Alt-text generation
 * - Meta tags
 */

import type { MarketingFramework } from './marketing-frameworks';
import type { BrandDNA } from './brand-dna-analyzer';

export interface SEOGenerationInput {
  // Product Information
  productName: string;
  category?: string;
  keyFeatures?: string;
  targetAudience?: string;
  pricePoint?: 'budget' | 'mid-range' | 'premium' | 'luxury';
  
  // Context
  currentTitle?: string;
  currentDescription?: string;
  keywords?: string[];
  
  // Customization
  marketingFramework?: MarketingFramework;
  brandDNA?: BrandDNA;
  toneOverride?: string;
  
  // Output Formatting
  shopifyHtmlFormatting?: boolean;
  
  // Advanced
  competitorUrls?: string[];
  imageAnalysis?: ImageAnalysisResult;
  serp?: SERPPatternData;
}

export interface ImageAnalysisResult {
  colors: string[];
  style: 'professional' | 'casual' | 'luxury' | 'minimal' | 'vibrant';
  productType: string;
  detectedFeatures: string[];
  targetDemographic: string;
  useCase: string;
}

export interface SERPPatternData {
  topRankingTitlePatterns: string[];
  commonKeywords: string[];
  averageTitleLength: number;
  averageMetaLength: number;
  searchIntent: 'commercial' | 'informational' | 'navigational' | 'transactional';
  featureSnippetFormat?: string;
}

export interface UnifiedSEOOutput {
  // Core SEO Elements
  seoTitle: string;
  seoDescription: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  
  // Quality Metrics
  seoScore: number;
  readabilityScore: number;
  conversionScore: number;
  brandVoiceMatchScore: number;
  
  // Additional Insights
  searchIntent: 'commercial' | 'informational' | 'navigational' | 'transactional';
  suggestedKeywords: string[];
  competitorGaps: string[];
  
  // Shopify Ready
  shopifyTitle: string;
  shopifyDescription: string;
  shopifyTags: string[];
  
  // Metadata
  frameworkUsed: string;
  generatedAt: string;
  aiModel: string;
  confidence: number;
}

export interface SEOVariant {
  variant: 'A' | 'B' | 'C';
  type: 'seo-focused' | 'conversion-focused' | 'emotional-focused';
  output: UnifiedSEOOutput;
  expectedPerformance: {
    clickThroughRate: number;
    conversionLift: number;
    seoRanking: number;
  };
}

/**
 * Generate comprehensive SEO content using unified quality standards
 */
export async function generateUnifiedSEO(
  input: SEOGenerationInput,
  openaiClient: any,
  options?: {
    autoSelectFramework?: boolean;
    autoFetchSERP?: boolean;
    applyBrandDNA?: boolean;
  }
): Promise<UnifiedSEOOutput> {
  // This function orchestrates:
  // 1. SERP analysis (auto-fetch if enabled)
  // 2. Marketing framework selection (auto-select if enabled)
  // 3. Brand DNA application
  // 4. Quality scoring
  // 5. Shopify formatting
  
  try {
    // Step 1: Auto-fetch SERP analysis if enabled and not provided
    // NOTE: In production, this would call a SERP API service
    // For now, SERP data should be provided by the caller or will use defaults
    let serpData = input.serp;
    if (options?.autoFetchSERP && !serpData && typeof window === 'undefined') {
      // Server-side only - will be called from API routes
      console.log('SERP auto-fetch enabled but not yet implemented - using defaults');
    }
    
    // Step 2: Auto-select marketing framework if not provided
    // NOTE: Framework selection happens in API layer, not in shared code
    // This avoids server-only imports in shared files
    let selectedFramework = input.marketingFramework;
    if (options?.autoSelectFramework && !selectedFramework) {
      console.log('Framework auto-selection enabled but not provided - using defaults');
    }
    
    // Step 3: Build enhanced input with orchestrated data
    const enhancedInput: SEOGenerationInput = {
      ...input,
      serp: serpData || input.serp,
      marketingFramework: selectedFramework || input.marketingFramework,
    };
    
    // Step 4: Build prompts
    const prompt = buildUnifiedSEOPrompt(enhancedInput);
    const systemPrompt = getUnifiedSystemPrompt(enhancedInput.marketingFramework, enhancedInput.brandDNA);
    
    // Step 5: Select model
    const model = enhancedInput.brandDNA?.preferredModel || 'gpt-4o-mini';
    
    // Step 6: Generate content with OpenAI
    const response = await openaiClient.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: enhancedInput.brandDNA?.creativityLevel 
        ? enhancedInput.brandDNA.creativityLevel / 100 
        : 0.7,
      max_tokens: 1500,
    });

    const rawContent = response.choices[0].message.content;
    if (!rawContent) {
      throw new Error('Empty response from OpenAI');
    }
    
    // Parse and validate JSON response with Zod
    let rawOutput: any;
    try {
      rawOutput = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', rawContent);
      throw new Error('Invalid JSON response from OpenAI');
    }
    
    // Import validator
    const { validateSEOOutput, validatePostFormatting } = await import('./seo-output-validator');
    
    // Validate with Zod schema (includes fallbacks for missing fields)
    const validatedOutput = validateSEOOutput(rawOutput, {
      productName: input.productName,
      category: input.category,
    });
    
    // Step 7: Post-process and add quality scores
    const enhancedOutput = await enhanceWithQualityScores(validatedOutput, enhancedInput);
    
    // Step 8: Apply Shopify HTML formatting if requested
    if (input.shopifyHtmlFormatting) {
      enhancedOutput.seoDescription = ensureShopifyFormatting(enhancedOutput.seoDescription);
      enhancedOutput.shopifyDescription = enhancedOutput.seoDescription; // Sync both fields
      
      // Validate formatting didn't break anything
      const { validatePostFormatting } = await import('./seo-output-validator');
      const isValid = validatePostFormatting(enhancedOutput);
      if (!isValid) {
        console.warn('[SEO Engine] Post-formatting validation failed - some fields may be incomplete');
      }
    }
    
    // Step 9: Attach metadata
    enhancedOutput.frameworkUsed = selectedFramework?.name || 'Standard';
    enhancedOutput.aiModel = model;
    
    return enhancedOutput;
  } catch (error) {
    console.error('Error generating unified SEO:', error);
    throw new Error(`Failed to generate SEO content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate multiple SEO variants for A/B testing
 */
export async function generateSEOVariants(
  input: SEOGenerationInput,
  openaiClient: any,
  variantCount: number = 3
): Promise<SEOVariant[]> {
  const variants: SEOVariant[] = [];
  
  const variantTypes: Array<'seo-focused' | 'conversion-focused' | 'emotional-focused'> = [
    'seo-focused',
    'conversion-focused', 
    'emotional-focused'
  ];
  
  for (let i = 0; i < Math.min(variantCount, 3); i++) {
    const variantInput = {
      ...input,
      toneOverride: variantTypes[i]
    };
    
    const output = await generateUnifiedSEO(variantInput, openaiClient);
    
    variants.push({
      variant: ['A', 'B', 'C'][i] as 'A' | 'B' | 'C',
      type: variantTypes[i],
      output,
      expectedPerformance: predictPerformance(output, variantTypes[i])
    });
  }
  
  return variants;
}

/**
 * Build the comprehensive SEO generation prompt
 */
function buildUnifiedSEOPrompt(input: SEOGenerationInput): string {
  let prompt = `Generate comprehensive, high-quality SEO content for this product:

**PRODUCT INFORMATION**
Product Name: ${input.productName}
Category: ${input.category || 'General'}
Key Features: ${input.keyFeatures || 'Premium quality product'}
Target Audience: ${input.targetAudience || 'General consumers'}
Price Point: ${input.pricePoint || 'mid-range'}
`;

  if (input.currentTitle || input.currentDescription) {
    prompt += `\n**CURRENT CONTENT (for improvement)**
${input.currentTitle ? `Current Title: ${input.currentTitle}` : ''}
${input.currentDescription ? `Current Description: ${input.currentDescription}` : ''}
`;
  }

  if (input.keywords && input.keywords.length > 0) {
    prompt += `\n**TARGET KEYWORDS**
${input.keywords.join(', ')}
`;
  }

  if (input.serp) {
    prompt += `\n**SERP INSIGHTS**
Top-ranking titles follow these patterns: ${input.serp.topRankingTitlePatterns.join(', ')}
Common keywords in top results: ${input.serp.commonKeywords.join(', ')}
Search Intent: ${input.serp.searchIntent}
Optimal title length: ~${input.serp.averageTitleLength} characters
`;
  }

  if (input.imageAnalysis) {
    prompt += `\n**VISUAL ANALYSIS**
Product Style: ${input.imageAnalysis.style}
Detected Features: ${input.imageAnalysis.detectedFeatures.join(', ')}
Target Demographic: ${input.imageAnalysis.targetDemographic}
Use Case: ${input.imageAnalysis.useCase}
`;
  }

  prompt += `\n**GOLDEN SEO FORMULA - GENERATE ALL OF THE FOLLOWING:**

1. **SEO Title** (8-12 words): Keyword-rich, click-worthy title optimized for search engines
   - Must be exactly 8-12 words
   - Front-load primary keyword
   - Include power words
   - Create curiosity or urgency

2. **Full Product Description** (150-300 words): Structured, persuasive description with:
   - **IMPORTANT: Bold the product name using <strong>Product Name</strong> tags in the opening sentence**
   - Compelling opening that highlights main benefit (include bold product name here)
   - Feature list with benefits (not just features)
   - Use case scenarios and transformations
   - Natural keyword integration (avoid keyword stuffing)
   - Clear call to action
   - Scannable format with short paragraphs

3. **Meta Title** (50-60 characters): Optimized for search result previews
   - Exactly 50-60 characters
   - Include brand differentiator
   - Action-oriented language

4. **Meta Description** (130-150 characters): Compelling preview text for search results
   - Exactly 130-150 characters
   - Focus on unique value proposition
   - Include primary keyword naturally
   - Create urgency or curiosity
   - End with soft CTA

5. **SEO Keywords** (5-10 keywords): Most relevant, high-value keywords
   - Exactly 5-10 keywords
   - Mix of short-tail and long-tail
   - Include buyer intent keywords
   - Consider search volume and competition

6. **Shopify Tags** (10-15 tags): Practical tags for Shopify categorization
   - Product type, use case, features
   - Season, occasion if relevant

7. **Search Intent**: Primary intent (commercial, informational, navigational, or transactional)

8. **Suggested Keywords** (5-7): Additional high-value keywords to consider for future optimization

9. **Competitor Gaps** (3-5): Opportunities competitors are missing

**QUALITY REQUIREMENTS:**
- Natural, conversational tone (no robotic AI language)
- Clear value propositions
- Benefit-focused (not just feature lists)
- Scannable format
- SEO-optimized but human-readable
- Action-oriented CTAs
- No keyword stuffing
- Professional yet engaging
- **CRITICAL: The product name must appear in <strong> tags in the description opening**

Respond with JSON in this exact format:
{
  "seoTitle": "your seo title (8-12 words)",
  "seoDescription": "your full product description with <strong>Product Name</strong> bolded in opening (150-300 words)",
  "metaTitle": "your meta title (50-60 chars)",
  "metaDescription": "your meta description (130-150 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "shopifyTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "searchIntent": "commercial",
  "suggestedKeywords": ["keyword8", "keyword9", "keyword10"],
  "competitorGaps": ["gap1", "gap2", "gap3"]
}`;

  return prompt;
}

/**
 * Get unified system prompt with framework and brand DNA
 */
function getUnifiedSystemPrompt(
  framework?: MarketingFramework,
  brandDNA?: BrandDNA
): string {
  let systemPrompt = `You are Zyra AI - an expert SEO and conversion optimization specialist.

Your mission: Generate world-class, conversion-optimized SEO content that:
- Ranks highly in search engines
- Converts visitors into customers
- Sounds authentically human (never robotic)
- Follows proven marketing psychology
- Matches the brand's unique voice

CORE PRINCIPLES:
1. Quality over quantity - every word must earn its place
2. Benefits before features - what's in it for the customer?
3. Natural keyword integration - never force or stuff keywords
4. Emotional connection - speak to desires and pain points
5. Clear, scannable format - make it easy to read
6. Action-oriented - guide the reader to next steps
`;

  if (framework) {
    systemPrompt += `\n**MARKETING FRAMEWORK: ${framework.name}**
${framework.description}

Apply this framework's tone, structure, and psychological triggers throughout all content.
`;
  }

  if (brandDNA) {
    systemPrompt += `\n**BRAND VOICE DNA:**
- Writing Style: ${brandDNA.writingStyle}
- Typical Sentence Length: ${brandDNA.avgSentenceLength} words
- Emoji Usage: ${brandDNA.emojiFrequency}
- Key Phrases: ${brandDNA.keyPhrases.join(', ')}
- Tone Density: ${brandDNA.toneDensity}
- CTA Style: ${brandDNA.ctaStyle}

Match this exact brand voice throughout the content. This is how the brand naturally communicates.
`;
  }

  return systemPrompt;
}

/**
 * Enhance output with quality scores
 */
function enhanceWithQualityScores(
  rawOutput: any,
  input: SEOGenerationInput
): UnifiedSEOOutput {
  // Calculate quality scores
  const seoScore = calculateSEOScore(rawOutput, input);
  const readabilityScore = calculateReadabilityScore(rawOutput.seoDescription);
  const conversionScore = calculateConversionScore(rawOutput);
  const brandVoiceMatchScore = input.brandDNA 
    ? calculateBrandVoiceMatch(rawOutput, input.brandDNA)
    : 85;

  return {
    seoTitle: rawOutput.seoTitle || '',
    seoDescription: rawOutput.seoDescription || '',
    metaTitle: rawOutput.metaTitle || rawOutput.seoTitle || '',
    metaDescription: rawOutput.metaDescription || '',
    keywords: rawOutput.keywords || [],
    seoScore,
    readabilityScore,
    conversionScore,
    brandVoiceMatchScore,
    searchIntent: rawOutput.searchIntent || 'commercial',
    suggestedKeywords: rawOutput.suggestedKeywords || [],
    competitorGaps: rawOutput.competitorGaps || [],
    shopifyTitle: rawOutput.seoTitle?.substring(0, 255) || '',
    shopifyDescription: rawOutput.seoDescription || '',
    shopifyTags: rawOutput.shopifyTags || [],
    frameworkUsed: input.marketingFramework?.name || 'Standard',
    generatedAt: new Date().toISOString(),
    aiModel: input.brandDNA?.preferredModel || 'gpt-4o-mini',
    confidence: Math.round((seoScore + readabilityScore + conversionScore) / 3)
  };
}

/**
 * Calculate SEO score based on best practices
 */
function calculateSEOScore(output: any, input: SEOGenerationInput): number {
  let score = 100;
  
  // Title length (55-60 is optimal)
  const titleLength = output.seoTitle?.length || 0;
  if (titleLength < 30 || titleLength > 65) score -= 10;
  else if (titleLength >= 55 && titleLength <= 60) score += 5;
  
  // Meta description length (150-160 is optimal)
  const metaLength = output.metaDescription?.length || 0;
  if (metaLength < 120 || metaLength > 165) score -= 10;
  else if (metaLength >= 150 && metaLength <= 160) score += 5;
  
  // Keyword presence in title
  if (input.keywords && input.keywords.length > 0) {
    const titleLower = output.seoTitle?.toLowerCase() || '';
    const hasKeyword = input.keywords.some(kw => 
      titleLower.includes(kw.toLowerCase())
    );
    if (!hasKeyword) score -= 15;
  }
  
  // Description length (250-350 words is good)
  const wordCount = (output.seoDescription?.split(/\s+/) || []).length;
  if (wordCount < 150 || wordCount > 500) score -= 10;
  else if (wordCount >= 250 && wordCount <= 350) score += 5;
  
  // Has keywords array
  if (!output.keywords || output.keywords.length < 5) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate readability score (Flesch-like)
 */
function calculateReadabilityScore(text: string): number {
  if (!text) return 50;
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => count + estimateSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 50;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  // Simplified Flesch Reading Ease
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  // Normalize to 0-100 (higher is better)
  return Math.max(0, Math.min(100, score));
}

/**
 * Estimate syllables in a word (simple heuristic)
 */
function estimateSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;
  
  const vowels = word.match(/[aeiouy]+/g);
  let count = vowels ? vowels.length : 1;
  
  // Adjust for silent e
  if (word.endsWith('e')) count--;
  
  return Math.max(1, count);
}

/**
 * Calculate conversion potential score
 */
function calculateConversionScore(output: any): number {
  let score = 70;
  
  const description = output.seoDescription?.toLowerCase() || '';
  
  // Check for CTA
  const ctaPhrases = ['shop now', 'buy now', 'get yours', 'order today', 'discover', 'explore'];
  if (ctaPhrases.some(phrase => description.includes(phrase))) {
    score += 10;
  }
  
  // Check for benefit language
  const benefitWords = ['save', 'free', 'guarantee', 'quality', 'premium', 'best', 'perfect'];
  const benefitCount = benefitWords.filter(word => description.includes(word)).length;
  score += Math.min(15, benefitCount * 3);
  
  // Check for urgency
  const urgencyWords = ['limited', 'now', 'today', 'hurry', 'exclusive'];
  if (urgencyWords.some(word => description.includes(word))) {
    score += 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate brand voice match score
 */
function calculateBrandVoiceMatch(output: any, brandDNA: BrandDNA): number {
  let score = 80; // Base score
  
  const description = output.seoDescription || '';
  
  // Check key phrases usage
  const usedPhrases = brandDNA.keyPhrases.filter((phrase: string) => 
    description.toLowerCase().includes(phrase.toLowerCase())
  );
  score += Math.min(10, usedPhrases.length * 2);
  
  // Check emoji usage matches preference
  const emojiCount = (description.match(/[\uD800-\uDFFF]/g) || []).length;
  if (brandDNA.emojiFrequency === 'never' && emojiCount > 0) score -= 15;
  if (brandDNA.emojiFrequency === 'frequent' && emojiCount === 0) score -= 10;
  
  // Check average sentence length
  const sentences = description.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
  if (sentences.length > 0) {
    const avgLength = description.split(/\s+/).length / sentences.length;
    const diff = Math.abs(avgLength - brandDNA.avgSentenceLength);
    if (diff > 5) score -= Math.min(10, diff);
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Predict performance for A/B testing
 */
function predictPerformance(
  output: UnifiedSEOOutput,
  variantType: 'seo-focused' | 'conversion-focused' | 'emotional-focused'
): { clickThroughRate: number; conversionLift: number; seoRanking: number } {
  const basePerformance = {
    clickThroughRate: 2.5,
    conversionLift: 0,
    seoRanking: 50
  };
  
  // Adjust based on variant type
  switch (variantType) {
    case 'seo-focused':
      return {
        clickThroughRate: 2.8,
        conversionLift: 5,
        seoRanking: output.seoScore
      };
    case 'conversion-focused':
      return {
        clickThroughRate: 3.5,
        conversionLift: 15,
        seoRanking: output.seoScore - 5
      };
    case 'emotional-focused':
      return {
        clickThroughRate: 4.2,
        conversionLift: 25,
        seoRanking: output.seoScore - 10
      };
    default:
      return basePerformance;
  }
}

/**
 * Apply Shopify HTML formatting to description
 */
function ensureShopifyFormatting(description: string): string {
  if (!description) return '';
  
  let formatted = description;
  
  // Convert markdown-style bold to HTML strong
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Convert markdown-style italic to HTML em
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Convert double line breaks to paragraph tags
  const paragraphs = formatted.split('\n\n').filter(p => p.trim().length > 0);
  if (paragraphs.length > 1) {
    formatted = paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');
  }
  
  // Convert bullet lists (lines starting with - or *)
  formatted = formatted.replace(/^[\-\*]\s+(.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive <li> tags in <ul>
  formatted = formatted.replace(/(<li>.*?<\/li>\s*)+/gs, (match) => {
    return `<ul>\n${match}</ul>\n`;
  });
  
  // Clean up extra whitespace
  formatted = formatted.replace(/\n{3,}/g, '\n\n').trim();
  
  // Ensure line breaks are converted to <br> if not in paragraph/list
  formatted = formatted.replace(/(?<!>)\n(?!<)/g, '<br>\n');
  
  return formatted;
}