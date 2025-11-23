/**
 * Brand DNA Analyzer - True Brand Voice Learning System
 * 
 * Goes beyond basic "brand voice memory" to become a complete Brand DNA system
 * that learns and replicates your unique writing style across all content
 */

export interface BrandDNA {
  userId: string;
  
  // Writing Style Analysis
  writingStyle: 'formal' | 'casual' | 'professional' | 'playful' | 'luxury' | 'technical';
  avgSentenceLength: number;
  avgParagraphLength: number;
  complexityLevel: 'simple' | 'moderate' | 'complex' | 'expert';
  
  // Tone & Voice
  toneDensity: 'minimal' | 'balanced' | 'rich' | 'intense';
  personalityTraits: string[];
  emotionalRange: 'reserved' | 'moderate' | 'expressive' | 'intense';
  formalityScore: number; // 0-100
  
  // Language Patterns
  keyPhrases: string[];
  powerWords: string[];
  avoidedWords: string[];
  vocabularyLevel: string;
  jargonFrequency: 'none' | 'rare' | 'moderate' | 'heavy';
  
  // Structural Patterns
  ctaStyle: string;
  ctaFrequency: 'rare' | 'moderate' | 'frequent';
  headlineStyle: string;
  listingStyle: 'bullets' | 'numbers' | 'paragraphs' | 'mixed';
  
  // Visual & Formatting
  emojiFrequency: 'never' | 'rare' | 'moderate' | 'frequent';
  punctuationStyle: 'minimal' | 'standard' | 'expressive';
  capitalizationStyle: 'standard' | 'title-case' | 'creative';
  
  // Content Strategy
  benefitFocusRatio: number; // Features vs Benefits ratio
  socialProofUsage: 'never' | 'occasional' | 'frequent';
  urgencyTactics: 'none' | 'subtle' | 'moderate' | 'aggressive';
  storytellingFrequency: 'rare' | 'moderate' | 'frequent';
  
  // SEO Preferences
  keywordDensity: 'light' | 'moderate' | 'heavy';
  seoVsConversion: 'seo-focused' | 'balanced' | 'conversion-focused';
  
  // Brand Values & Messaging
  coreValues: string[];
  brandPersonality: string;
  uniqueSellingPoints: string[];
  targetAudienceInsights: string[];
  
  // Technical Preferences
  preferredModel: 'gpt-4o-mini' | 'gpt-4o';
  creativityLevel: number; // 0-100
  
  // Learning Data
  sampleTexts: string[];
  editPatterns: EditPattern[];
  lastUpdated: string;
  confidenceScore: number; // How well we understand the brand (0-100)
}

export interface EditPattern {
  originalText: string;
  editedText: string;
  editType: 'tone' | 'length' | 'structure' | 'keywords' | 'cta' | 'other';
  timestamp: string;
  learnedFrom: string; // What was learned from this edit
}

export interface BrandDNATrainingInput {
  sampleTexts: string[];
  productDescriptions?: string[];
  emailCampaigns?: string[];
  socialPosts?: string[];
  websiteCopy?: string[];
  additionalGuidelines?: string;
}

/**
 * Analyze brand voice from sample texts and create Brand DNA profile
 */
export async function analyzeBrandDNA(
  input: BrandDNATrainingInput,
  userId: string,
  openaiClient: any
): Promise<BrandDNA> {
  const allTexts = [
    ...input.sampleTexts,
    ...(input.productDescriptions || []),
    ...(input.emailCampaigns || []),
    ...(input.socialPosts || []),
    ...(input.websiteCopy || [])
  ];
  
  if (allTexts.length === 0) {
    throw new Error('At least one sample text is required for brand DNA analysis');
  }
  
  // Use AI to deeply analyze the brand voice
  const analysisPrompt = `Analyze the following brand content samples and create a comprehensive Brand DNA profile.

**Sample Texts:**
${allTexts.map((text, i) => `Sample ${i + 1}:\n${text}`).join('\n\n---\n\n')}

${input.additionalGuidelines ? `\n**Additional Guidelines:**\n${input.additionalGuidelines}` : ''}

**Analyze and extract:**

1. **Writing Style**: Formal, casual, professional, playful, luxury, or technical?
2. **Average Sentence Length**: Count words in typical sentences
3. **Tone Density**: Minimal, balanced, rich, or intense?
4. **Personality Traits**: List 5-7 key personality characteristics
5. **Emotional Range**: Reserved, moderate, expressive, or intense?
6. **Formality Score**: 0-100 (0 = very casual, 100 = very formal)
7. **Key Phrases**: Extract 10-15 frequently used phrases unique to this brand
8. **Power Words**: List 10-15 impactful words this brand uses often
9. **Avoided Words**: List words/phrases this brand seems to avoid
10. **CTA Style**: How does the brand ask for action? (Example CTAs)
11. **CTA Frequency**: Rare, moderate, or frequent?
12. **Emoji Frequency**: Never, rare, moderate, or frequent?
13. **Benefit vs Feature Ratio**: What % is benefits vs features? (0-100)
14. **Social Proof Usage**: Never, occasional, or frequent?
15. **Urgency Tactics**: None, subtle, moderate, or aggressive?
16. **Storytelling Frequency**: Rare, moderate, or frequent?
17. **Keyword Density**: Light, moderate, or heavy?
18. **Core Values**: List 3-5 brand values evident in the writing
19. **Brand Personality**: Describe in 2-3 sentences
20. **Unique Selling Points**: What makes this brand different?

Respond with JSON in this format:
{
  "writingStyle": "professional",
  "avgSentenceLength": 15,
  "toneDensity": "balanced",
  "personalityTraits": ["confident", "helpful", "innovative"],
  "emotionalRange": "moderate",
  "formalityScore": 65,
  "keyPhrases": ["phrase1", "phrase2"],
  "powerWords": ["word1", "word2"],
  "avoidedWords": ["word1", "word2"],
  "ctaStyle": "Direct and action-oriented: Shop Now, Get Started",
  "ctaFrequency": "moderate",
  "emojiFrequency": "rare",
  "benefitFocusRatio": 70,
  "socialProofUsage": "frequent",
  "urgencyTactics": "subtle",
  "storytellingFrequency": "moderate",
  "keywordDensity": "moderate",
  "coreValues": ["quality", "innovation"],
  "brandPersonality": "description",
  "uniqueSellingPoints": ["usp1", "usp2"]
}`;

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: "system",
        content: "You are an expert brand voice analyst. Analyze writing samples to extract deep brand DNA insights."
      },
      { role: "user", content: analysisPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const analysis = JSON.parse(response.choices[0].message.content || "{}");
  
  // Build comprehensive Brand DNA profile
  const brandDNA: BrandDNA = {
    userId,
    writingStyle: analysis.writingStyle || 'professional',
    avgSentenceLength: analysis.avgSentenceLength || 15,
    avgParagraphLength: estimateAvgParagraphLength(allTexts),
    complexityLevel: determineComplexity(analysis.avgSentenceLength, analysis.formalityScore),
    toneDensity: analysis.toneDensity || 'balanced',
    personalityTraits: analysis.personalityTraits || [],
    emotionalRange: analysis.emotionalRange || 'moderate',
    formalityScore: analysis.formalityScore || 60,
    keyPhrases: analysis.keyPhrases || [],
    powerWords: analysis.powerWords || [],
    avoidedWords: analysis.avoidedWords || [],
    vocabularyLevel: determineVocabularyLevel(allTexts),
    jargonFrequency: analysis.jargonFrequency || 'moderate',
    ctaStyle: analysis.ctaStyle || 'action-oriented',
    ctaFrequency: analysis.ctaFrequency || 'moderate',
    headlineStyle: extractHeadlineStyle(allTexts),
    listingStyle: detectListingStyle(allTexts),
    emojiFrequency: analysis.emojiFrequency || 'rare',
    punctuationStyle: detectPunctuationStyle(allTexts),
    capitalizationStyle: detectCapitalizationStyle(allTexts),
    benefitFocusRatio: analysis.benefitFocusRatio || 60,
    socialProofUsage: analysis.socialProofUsage || 'occasional',
    urgencyTactics: analysis.urgencyTactics || 'subtle',
    storytellingFrequency: analysis.storytellingFrequency || 'moderate',
    keywordDensity: analysis.keywordDensity || 'moderate',
    seoVsConversion: determineSEOBalance(analysis.keywordDensity, analysis.benefitFocusRatio),
    coreValues: analysis.coreValues || [],
    brandPersonality: analysis.brandPersonality || '',
    uniqueSellingPoints: analysis.uniqueSellingPoints || [],
    targetAudienceInsights: extractAudienceInsights(allTexts),
    preferredModel: 'gpt-4o-mini',
    creativityLevel: analysis.formalityScore > 70 ? 40 : 70,
    sampleTexts: allTexts,
    editPatterns: [],
    lastUpdated: new Date().toISOString(),
    confidenceScore: calculateConfidenceScore(allTexts.length, analysis)
  };
  
  return brandDNA;
}

/**
 * Learn from user edits to improve Brand DNA
 */
export function learnFromEdit(
  brandDNA: BrandDNA,
  originalText: string,
  editedText: string
): BrandDNA {
  const editPattern: EditPattern = {
    originalText,
    editedText,
    editType: detectEditType(originalText, editedText),
    timestamp: new Date().toISOString(),
    learnedFrom: analyzeWhatWasLearned(originalText, editedText)
  };
  
  const updatedDNA = { ...brandDNA };
  updatedDNA.editPatterns.push(editPattern);
  
  // Update patterns based on edits
  if (editPattern.editType === 'tone') {
    // Adjust tone preferences
  } else if (editPattern.editType === 'length') {
    // Adjust length preferences
  }
  
  // Increase confidence as we learn more
  updatedDNA.confidenceScore = Math.min(100, updatedDNA.confidenceScore + 2);
  updatedDNA.lastUpdated = new Date().toISOString();
  
  return updatedDNA;
}

/**
 * Generate content that matches Brand DNA
 */
export function applyBrandDNA(
  content: string,
  brandDNA: BrandDNA
): string {
  // This would be used in prompts to guide AI to match brand voice
  // For now, returns guidance string
  return `Apply this Brand DNA: ${JSON.stringify(brandDNA, null, 2)}`;
}

// Helper functions

function estimateAvgParagraphLength(texts: string[]): number {
  let totalWords = 0;
  let totalParagraphs = 0;
  
  texts.forEach(text => {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    totalParagraphs += paragraphs.length;
    paragraphs.forEach(p => {
      totalWords += p.split(/\s+/).length;
    });
  });
  
  return totalParagraphs > 0 ? Math.round(totalWords / totalParagraphs) : 50;
}

function determineComplexity(
  avgSentenceLength: number,
  formalityScore: number
): 'simple' | 'moderate' | 'complex' | 'expert' {
  const score = (avgSentenceLength + formalityScore) / 2;
  
  if (score < 30) return 'simple';
  if (score < 60) return 'moderate';
  if (score < 80) return 'complex';
  return 'expert';
}

function determineVocabularyLevel(texts: string[]): string {
  const allText = texts.join(' ').toLowerCase();
  const words = allText.split(/\s+/);
  const uniqueWords = new Set(words);
  const vocabularyRichness = uniqueWords.size / words.length;
  
  if (vocabularyRichness < 0.3) return 'basic';
  if (vocabularyRichness < 0.5) return 'intermediate';
  if (vocabularyRichness < 0.7) return 'advanced';
  return 'expert';
}

function extractHeadlineStyle(texts: string[]): string {
  // Simple heuristic - could be enhanced
  const hasQuestions = texts.some(t => t.includes('?'));
  const hasNumbers = texts.some(t => /\d/.test(t));
  
  if (hasNumbers && hasQuestions) return 'varied';
  if (hasNumbers) return 'data-driven';
  if (hasQuestions) return 'curiosity-driven';
  return 'statement-based';
}

function detectListingStyle(texts: string[]): 'bullets' | 'numbers' | 'paragraphs' | 'mixed' {
  const allText = texts.join('\n');
  
  const hasBullets = /[•\-\*]/.test(allText);
  const hasNumbers = /\d+\./.test(allText);
  
  if (hasBullets && hasNumbers) return 'mixed';
  if (hasBullets) return 'bullets';
  if (hasNumbers) return 'numbers';
  return 'paragraphs';
}

function detectPunctuationStyle(texts: string[]): 'minimal' | 'standard' | 'expressive' {
  const allText = texts.join(' ');
  const expressivePunct = (allText.match(/[!?…]/g) || []).length;
  const totalSentences = (allText.match(/[.!?]/g) || []).length;
  
  if (totalSentences === 0) return 'standard';
  
  const ratio = expressivePunct / totalSentences;
  
  if (ratio < 0.1) return 'minimal';
  if (ratio < 0.3) return 'standard';
  return 'expressive';
}

function detectCapitalizationStyle(texts: string[]): 'standard' | 'title-case' | 'creative' {
  // Simple detection - could be enhanced
  const allText = texts.join(' ');
  const hasAllCaps = /\b[A-Z]{3,}\b/.test(allText);
  const titleCaseCount = (allText.match(/\b[A-Z][a-z]+\s[A-Z][a-z]+/g) || []).length;
  
  if (hasAllCaps) return 'creative';
  if (titleCaseCount > 5) return 'title-case';
  return 'standard';
}

function determineSEOBalance(
  keywordDensity: string,
  benefitRatio: number
): 'seo-focused' | 'balanced' | 'conversion-focused' {
  if (keywordDensity === 'heavy') return 'seo-focused';
  if (benefitRatio > 70) return 'conversion-focused';
  return 'balanced';
}

function extractAudienceInsights(texts: string[]): string[] {
  // Simple extraction - would use AI for better results
  const insights: string[] = [];
  const allText = texts.join(' ').toLowerCase();
  
  if (allText.includes('professional') || allText.includes('business')) {
    insights.push('B2B / Professional audience');
  }
  if (allText.includes('affordable') || allText.includes('budget')) {
    insights.push('Price-conscious consumers');
  }
  if (allText.includes('premium') || allText.includes('luxury')) {
    insights.push('High-end market');
  }
  
  return insights;
}

function calculateConfidenceScore(sampleCount: number, analysis: any): number {
  let score = 50; // Base
  
  // More samples = higher confidence
  score += Math.min(30, sampleCount * 5);
  
  // Rich analysis = higher confidence
  if (analysis.keyPhrases?.length > 5) score += 10;
  if (analysis.powerWords?.length > 5) score += 10;
  
  return Math.min(100, score);
}

function detectEditType(original: string, edited: string): EditPattern['editType'] {
  const origLength = original.length;
  const editLength = edited.length;
  
  if (Math.abs(origLength - editLength) > 50) return 'length';
  
  // Simple heuristics - could be enhanced with NLP
  if (edited.includes('!') && !original.includes('!')) return 'tone';
  if (edited.split(/\s+/).length !== original.split(/\s+/).length) return 'structure';
  
  return 'other';
}

function analyzeWhatWasLearned(original: string, edited: string): string {
  // Simple analysis - would use AI for better insights
  if (edited.length > original.length) {
    return 'User prefers more detailed content';
  } else if (edited.length < original.length) {
    return 'User prefers concise content';
  }
  return 'User adjusted phrasing';
}
