/**
 * SERP-Enhanced Prompt System
 * 
 * Generates SEO-optimized product content based on REAL Google top-ranking 
 * ecommerce patterns using the ZYRA GOOGLE ECOMMERCE RANKING ANALYZER.
 * 
 * This system combines:
 * - Real-time SERP competitor data
 * - AI pattern inference (when SERP data unavailable)
 * - Google E-E-A-T principles
 * - Professional copywriting frameworks
 */

import type { SERPAnalysis } from './serp-analyzer';
import { SEO_CONTENT_FORMATS } from '../lib/constants/seo-content-formats';

interface ProductInput {
  productName: string;
  productDescription?: string;
  category?: string;
  price?: number;
  features?: string[];
  benefits?: string[];
  targetAudience?: string;
}

interface BrandVoice {
  writingStyle?: string;
  tone?: string;
  vocabulary?: string[];
}

interface SERPEnhancedOutput {
  seo_title: string;
  meta_title: string;
  meta_description: string;
  product_description: string;
  keyword_cluster: {
    primary: string;
    secondary: string;
    long_tail: string[];
    lsi: string[];
  };
  seo_tags: string[];
  alt_text: string[];
}

/**
 * Build the SERP-enhanced system instruction
 */
function buildSystemInstruction(): string {
  return `SYSTEM INSTRUCTION — ZYRA GOOGLE ECOMMERCE RANKING ANALYZER

Your job is to generate SEO-optimized product content based on REAL Google top-ranking ecommerce patterns.

You must simulate and analyze the structure, keywords, patterns, tone, and ranking signals used by the highest ranking ecommerce results for any product category.

If SERP API data is provided, analyze it directly.
If SERP API data is NOT provided, use SERP Pattern Inference based on Google's known ecommerce ranking behaviors.

Your responsibilities:

1. Identify Product Category
   - Infer product niche from product name, features, and target audience.
   - Align with global ecommerce categories: Amazon, Flipkart, Walmart, BestBuy, Etsy, etc.

2. Understand Google Top Ranking Patterns
   Analyze or infer patterns from high-ranking pages:
   - Title structure (Primary keyword + Core attribute + USP)
   - Meta title behavior
   - Meta description length, structure, emotional trigger
   - Keyword clustering (primary, secondary, long-tail, LSI)
   - Product description structure used by top stores
   - Benefit-first copywriting
   - Call-to-action patterns
   - Competitor keyword usage
   - Search intent signals (transactional, commercial, informational)

3. SERP API Integration (IF data is provided)
   - Extract titles, meta tags, snippets, product data, and shopping results.
   - Detect frequency of repeated keywords.
   - Identify winning attributes and conversion drivers.
   - Build "ranking keyword clusters" from competitor pages.

4. SERP Pattern Inference (IF real data is not provided)
   - Use Google ecommerce ranking behavior learned from training.
   - Apply common structures used by top ranking product pages.
   - Detect buyer intent patterns (e.g., "Best", "Buy", "High Speed", "Premium", "2024").
   - Predict what Google expects for this category based on known ecommerce SEO rules.

5. Generate NEW SEO Content Optimized to Outrank Competitors
   Produce:
   - SEO Title (rank-focused)
   - Meta Title (50–60 chars)
   - Meta Description (140–160 chars)
   - High-conversion Product Description with this EXACT structure:
       * Hook Paragraph (2-3 sentences opening with primary benefit)
       * Benefit-Driven Bullets (3-5 points, each starting with benefit in bold)
       * Lifestyle/Value Paragraph (2-3 sentences with sensory language)
       * Mini-FAQ (2 buyer objection questions — targets Featured Snippets)
   - Keyword Cluster:
       * Primary keyword
       * Secondary keyword
       * 3 Long-tail keywords
       * 5 LSI keywords
   - SEO Tags
   - ALT-TEXT for images: Generate 2-3 variations using format "Product Name + Key Visual Feature + Context/Use Case" (max 125 chars each). Never start with "Image of" or "Photo of". Describe what is visually shown.

6. Ranking Optimization Rules
   - Maximize CTR by using strong modifiers.
   - Include high-intent keywords early in titles.
   - Ensure keyword density is natural, not stuffed.
   - Follow Google EEAT principles in description:
       * Expertise
       * Experience
       * Authority
       * Trustworthiness

7. Voice, Tone & Brand Rules
   - Apply the user's brand voice memory (if stored).
   - Maintain tone consistency across all outputs.
   - Adapt tone based on product category and audience.

8. Output Format
   ALWAYS respond in clean structured JSON with these exact fields:
   {
     "seo_title": "SEO-optimized title for search results (50-70 chars)",
     "meta_title": "Meta title for Google results (50-60 chars)",
     "meta_description": "Compelling description with primary keyword + benefit + CTA (140-160 chars)",
     "product_description": "Full HTML-formatted description with: Hook Paragraph → Benefit-Driven Bullets → Lifestyle/Value Paragraph → Mini-FAQ with answers. Use <p>, <ul><li>, <strong>, <h3> tags",
     "keyword_cluster": {
       "primary": "Main buyer-intent keyword",
       "secondary": "Related keyword variation",
       "long_tail": ["4+ word buyer phrase", "another long-tail phrase", "third long-tail phrase"],
       "lsi": ["semantic keyword 1", "semantic keyword 2", "semantic keyword 3", "semantic keyword 4", "semantic keyword 5"]
     },
     "seo_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
     "alt_text": ["Product Name + Feature + Context (max 125 chars)", "Product Name + Different Feature + Use Case (max 125 chars)", "Product Name + Visual Detail + Context (max 125 chars)"]
   }

Your goal:  
Generate SEO content that matches AND surpasses the Google top-ranking ecommerce results for this product category, using either real SERP data or SERP pattern inference.

END OF SYSTEM INSTRUCTION.`;
}

/**
 * Build user prompt with SERP data integration
 */
function buildUserPrompt(
  product: ProductInput,
  serpAnalysis?: SERPAnalysis,
  brandVoice?: BrandVoice
): string {
  let prompt = `Generate SEO-optimized content for the following product:\n\n`;

  // Product details
  prompt += `**Product Name:** ${product.productName}\n`;
  if (product.productDescription) {
    prompt += `**Description:** ${product.productDescription}\n`;
  }
  if (product.category) {
    prompt += `**Category:** ${product.category}\n`;
  }
  if (product.price) {
    prompt += `**Price:** $${product.price}\n`;
  }
  if (product.features && product.features.length > 0) {
    prompt += `**Features:** ${product.features.join(', ')}\n`;
  }
  if (product.targetAudience) {
    prompt += `**Target Audience:** ${product.targetAudience}\n`;
  }

  prompt += `\n`;

  // SERP Analysis Data (if available)
  if (serpAnalysis) {
    prompt += `**REAL SERP DATA FROM GOOGLE TOP 10 RESULTS:**\n\n`;
    
    // Top competitor titles
    prompt += `**Top Ranking Titles:**\n`;
    serpAnalysis.topResults.slice(0, 5).forEach((result, index) => {
      prompt += `${index + 1}. ${result.title}\n`;
    });
    prompt += `\n`;

    // Title patterns detected
    prompt += `**Detected Title Patterns:**\n`;
    prompt += `- Average Length: ${serpAnalysis.titlePatterns.averageLength} characters\n`;
    prompt += `- Common Structure: ${serpAnalysis.titlePatterns.commonStructure}\n`;
    if (serpAnalysis.titlePatterns.topModifiers.length > 0) {
      prompt += `- Top Modifiers Used: ${serpAnalysis.titlePatterns.topModifiers.join(', ')}\n`;
    }
    prompt += `\n`;

    // Keyword clusters from competitors
    prompt += `**Competitor Keyword Clusters:**\n`;
    prompt += `- Primary: ${serpAnalysis.keywordClusters.primary}\n`;
    if (serpAnalysis.keywordClusters.secondary.length > 0) {
      prompt += `- Secondary: ${serpAnalysis.keywordClusters.secondary.join(', ')}\n`;
    }
    if (serpAnalysis.keywordClusters.lsi.length > 0) {
      prompt += `- LSI Keywords: ${serpAnalysis.keywordClusters.lsi.slice(0, 5).join(', ')}\n`;
    }
    prompt += `\n`;

    // Meta description patterns
    prompt += `**Meta Description Patterns:**\n`;
    prompt += `- Average Length: ${serpAnalysis.metaPatterns.averageLength} characters\n`;
    if (serpAnalysis.metaPatterns.emotionalTriggers.length > 0) {
      prompt += `- Emotional Triggers Used: ${serpAnalysis.metaPatterns.emotionalTriggers.join(', ')}\n`;
    }
    prompt += `\n`;

    // Competitor insights
    prompt += `**Competitor Insights:**\n`;
    prompt += `- Total Analyzed: ${serpAnalysis.competitorInsights.totalAnalyzed} pages\n`;
    prompt += `- Common Features: ${serpAnalysis.competitorInsights.commonFeatures.slice(0, 8).join(', ')}\n`;
    prompt += `\n`;

    prompt += `**INSTRUCTION:** Use these REAL competitor patterns to generate content that MATCHES and SURPASSES the top-ranking results.\n\n`;
  } else {
    prompt += `**INSTRUCTION:** SERP data not available. Use SERP Pattern Inference based on Google's known ecommerce ranking behaviors for this product category.\n\n`;
  }

  // Brand voice integration
  if (brandVoice) {
    prompt += `**Brand Voice Requirements:**\n`;
    if (brandVoice.writingStyle) {
      prompt += `- Writing Style: ${brandVoice.writingStyle}\n`;
    }
    if (brandVoice.tone) {
      prompt += `- Tone: ${brandVoice.tone}\n`;
    }
    if (brandVoice.vocabulary && brandVoice.vocabulary.length > 0) {
      prompt += `- Key Vocabulary: ${brandVoice.vocabulary.slice(0, 10).join(', ')}\n`;
    }
    prompt += `\n`;
  }

  prompt += `Generate complete SEO content in JSON format following the system instruction.`;

  return prompt;
}

/**
 * Generate SERP-enhanced SEO content using OpenAI
 */
export async function generateSERPEnhancedContent(
  openaiClient: any,
  product: ProductInput,
  serpAnalysis?: SERPAnalysis,
  brandVoice?: BrandVoice,
  model: string = 'gpt-4o'
): Promise<SERPEnhancedOutput> {
  const systemInstruction = buildSystemInstruction();
  const userPrompt = buildUserPrompt(product, serpAnalysis, brandVoice);

  console.log('[SERP Prompts] Generating content with', {
    model,
    hasSERPData: !!serpAnalysis,
    hasBrandVoice: !!brandVoice,
  });

  try {
    const completion = await openaiClient.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: systemInstruction,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from OpenAI');
    }

    const output = JSON.parse(content) as SERPEnhancedOutput;

    console.log('[SERP Prompts] Generation successful:', {
      titleLength: output.meta_title?.length || 0,
      descLength: output.meta_description?.length || 0,
      keywordsCount: output.keyword_cluster?.lsi?.length || 0,
    });

    return output;
  } catch (error) {
    console.error('[SERP Prompts] Generation error:', error);
    throw error;
  }
}

/**
 * Generate multiple A/B testing variations
 */
export async function generateABTestVariations(
  openaiClient: any,
  product: ProductInput,
  serpAnalysis?: SERPAnalysis,
  brandVoice?: BrandVoice,
  variationCount: number = 3
): Promise<SERPEnhancedOutput[]> {
  console.log(`[SERP Prompts] Generating ${variationCount} A/B test variations`);

  const variations: SERPEnhancedOutput[] = [];

  // Generate variations with slightly different temperature/creativity
  const temperatures = [0.6, 0.7, 0.8];

  for (let i = 0; i < variationCount; i++) {
    const variation = await generateSERPEnhancedContent(
      openaiClient,
      product,
      serpAnalysis,
      brandVoice,
      'gpt-4o',
    );
    variations.push(variation);
  }

  console.log(`[SERP Prompts] Generated ${variations.length} variations successfully`);
  return variations;
}
