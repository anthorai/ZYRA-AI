export const SEO_CONTENT_FORMATS = {
  PRODUCT_TITLE: {
    format: 'Primary Keyword + Key Feature + Differentiator',
    maxLength: 70,
    rules: [
      'Front-load the most important buyer-intent keyword',
      'Include one key product feature or benefit',
      'Add a differentiator (material, use case, or unique selling point)',
      'Keep under 70 characters',
      'Capitalize major words (title case)',
      'Never stuff keywords — must read naturally',
    ],
    examples: [
      'Organic Cotton Tote Bag - Reusable & Eco-Friendly Shopping Bag',
      'Wireless Noise-Cancelling Headphones - 40hr Battery for Travel',
      'Handmade Leather Wallet - Slim RFID Blocking Bifold for Men',
    ],
  },

  META_TITLE: {
    format: 'Primary Keyword + Key Benefit | Brand Name',
    minLength: 50,
    maxLength: 60,
    rules: [
      'Front-load the primary buyer-intent keyword in the first 3 words',
      'Include one compelling benefit after the keyword',
      'End with pipe separator and brand name',
      'Must be between 50-60 characters (Google truncates beyond 60)',
      'Use power words: Best, Premium, Top, Official, Exclusive',
      'Match searcher intent — what would a buyer type into Google?',
    ],
    examples: [
      'Best Organic Cotton Tote Bag for Daily Use | EcoStore',
      'Premium Wireless Headphones with Active Noise Cancelling | SoundMax',
      'Handmade Italian Leather Wallet - Slim & RFID Safe | LeatherCraft',
    ],
  },

  META_DESCRIPTION: {
    format: 'Primary Keyword + Core Benefit + Social Proof/Trust Signal + CTA',
    minLength: 140,
    maxLength: 160,
    rules: [
      'Include primary keyword within the first 20 words',
      'Highlight the #1 benefit that makes a buyer click',
      'Add a trust signal: free shipping, warranty, rating, reviews, material quality',
      'End with a clear CTA: Shop now, Order today, Get yours, Free shipping available',
      'Must be between 140-160 characters (Google truncates beyond 160)',
      'This appears directly in Google search results — it must drive clicks',
      'Use emotional triggers: Transform, Discover, Upgrade, Experience',
      'Never duplicate the meta title — provide NEW information',
    ],
    examples: [
      'Shop our premium organic cotton tote bag. Durable, eco-friendly & perfect for everyday use. Rated 4.8/5 by 2000+ customers. Free shipping over $50!',
      'Experience studio-quality sound with 40hr battery life. Active noise cancelling for travel & work. 30-day money-back guarantee. Order now!',
      'Handcrafted Italian leather wallet with RFID protection. Slim bifold design fits 8 cards. Free engraving available. Shop the collection today!',
    ],
  },

  PRODUCT_DESCRIPTION: {
    format: 'Hook Paragraph + Benefit-Driven Bullets + Lifestyle/Value Paragraph + Mini-FAQ',
    wordCount: { min: 150, max: 300 },
    structure: {
      hookParagraph: {
        sentences: '2-3',
        purpose: 'Lead with the #1 benefit and primary keyword. Answer "why should I buy this?" Create emotional connection. Include the main keyword naturally in the first sentence.',
      },
      benefitBullets: {
        count: '3-5',
        format: '<strong>Benefit</strong> — Feature explanation with long-tail keyword',
        purpose: 'Each bullet starts with the BENEFIT in bold, then explains the feature. Use long-tail keywords buyers actually search for.',
      },
      lifestyleParagraph: {
        sentences: '2-3',
        purpose: 'Paint a picture of the buyer using this product. Use sensory/power words (transform, effortless, premium, ultimate). Include semantic keywords related to the product category.',
      },
      miniFAQ: {
        count: 2,
        format: '<h3>Question?</h3><p>Answer</p>',
        purpose: 'Address the top 2 purchase objections. These trigger Google Featured Snippets and People Also Ask boxes.',
      },
    },
    htmlFormatting: [
      'Use <p> for paragraphs',
      'Use <ul><li> for benefit bullets',
      'Use <strong> for emphasis and benefit highlights',
      'Use <h3> for FAQ question headers',
      'Never use <h1> or <h2> (reserved for page-level headings)',
    ],
    rules: [
      'Primary keyword appears 2-4 times naturally (never keyword-stuff)',
      'Include 2-3 long-tail buyer-intent keywords (e.g., "best [product] for [use case]")',
      'Write for humans first, Google second',
      'Every sentence must add value — zero filler or fluff',
      'Tone: confident, helpful, authentic — never salesy or pushy',
      'Bold the product name 2-3 times throughout the description',
      'Include at least one specific number or measurement for credibility',
    ],
  },

  IMAGE_ALT_TEXT: {
    format: 'Product Name + Key Visual Feature + Context/Use Case',
    maxLength: 125,
    rules: [
      'Describe what is visually shown in the image accurately',
      'Include the product name and primary keyword',
      'Add one key visual feature: color, material, size, or style',
      'Optionally add use context: "being used for...", "displayed on...", "worn with..."',
      'Keep under 125 characters (screen readers truncate beyond this)',
      'Never start with "Image of" or "Photo of" — just describe directly',
      'Never keyword-stuff — describe naturally as if speaking to someone who cannot see the image',
      'Each image alt text should be unique — never repeat the same alt text across images',
    ],
    examples: [
      'Organic cotton tote bag in natural beige color held by woman at farmers market',
      'Black wireless noise-cancelling headphones with premium leather ear cushions',
      'Slim brown Italian leather bifold wallet showing 8 card slots and cash pocket',
      'Close-up of handstitched leather texture on premium wallet exterior',
    ],
  },

  KEYWORD_CLUSTER: {
    structure: {
      primary: 'The single most important buyer-intent keyword (what someone types into Google to find this exact product)',
      secondary: 'A closely related keyword that captures a different angle or variation',
      longTail: {
        count: 3,
        format: 'Natural phrases with 4+ words that buyers actually search',
        examples: ['best organic tote bag for grocery shopping', 'eco-friendly reusable shopping bag large'],
      },
      lsi: {
        count: 5,
        format: 'Semantically related terms Google uses to understand topic depth',
        examples: ['sustainable', 'cotton canvas', 'reusable', 'grocery bag', 'eco-conscious'],
      },
    },
    rules: [
      'Primary keyword must match transactional/commercial search intent',
      'Long-tail keywords should include modifiers: best, top, buy, for [use case], [year]',
      'LSI keywords are NOT synonyms — they are related concepts that prove topical authority',
      'Include at least one question-format long-tail for People Also Ask targeting',
    ],
  },

  SEO_TAGS: {
    count: { min: 5, max: 10 },
    rules: [
      'Mix of head terms (1-2 words) and long-tail phrases (3-5 words)',
      'Include brand name as one tag',
      'Include product category as one tag',
      'Include at least 2 benefit-focused tags',
      'Tags should map to actual search queries buyers use',
    ],
  },

  GOOGLE_RANKING_PRINCIPLES: [
    'E-E-A-T: Demonstrate Experience, Expertise, Authoritativeness, Trustworthiness in every piece of content',
    'Helpful Content: Every word must serve the buyer — answer their questions, address objections, highlight benefits',
    'Mobile-First: Content must be scannable — short paragraphs, clear bullets, bold key terms',
    'Search Intent: Match transactional/commercial intent for product pages — buyers want to purchase, not learn',
    'Featured Snippets: Structure FAQ content to win Google "People Also Ask" boxes',
    'Keyword Placement: Primary keyword in title, first paragraph, one subheading, meta description, alt text, and naturally 2-4 times in body',
    'Content Freshness: Include current year or season references when relevant',
    'Internal Linking: Reference related products or categories when applicable',
    'Structured Data: Generate content compatible with Product, FAQ, and Review schema markup',
  ],
};

export function buildMasterSEOPrompt(product: {
  name: string;
  description?: string | null;
  category?: string | null;
  price?: number | string | null;
}): string {
  const f = SEO_CONTENT_FORMATS;

  return `You are a world-class e-commerce SEO strategist who specializes in making Shopify products rank #1 on Google. Apply the latest 2025 Google ranking factors (E-E-A-T, Helpful Content, mobile-first indexing) to fully optimize this product listing.

Product Name: ${product.name}
Description: ${product.description || 'No description'}
Category: ${product.category || 'General'}
Price: ${product.price || 'Not specified'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MASTER SEO CONTENT FORMAT — FOLLOW EXACTLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate ALL of the following fields:

1. PRODUCT TITLE (max ${f.PRODUCT_TITLE.maxLength} chars)
   Format: "${f.PRODUCT_TITLE.format}"
   Rules: ${f.PRODUCT_TITLE.rules.join('. ')}

2. META TITLE / SEO TITLE (${f.META_TITLE.minLength}-${f.META_TITLE.maxLength} chars)
   Format: "${f.META_TITLE.format}"
   Rules: ${f.META_TITLE.rules.join('. ')}

3. META DESCRIPTION (${f.META_DESCRIPTION.minLength}-${f.META_DESCRIPTION.maxLength} chars)
   Format: "${f.META_DESCRIPTION.format}"
   Rules: ${f.META_DESCRIPTION.rules.join('. ')}

4. PRODUCT DESCRIPTION (${f.PRODUCT_DESCRIPTION.wordCount.min}-${f.PRODUCT_DESCRIPTION.wordCount.max} words)
   Structure (follow this EXACT order):
   a) HOOK PARAGRAPH (${f.PRODUCT_DESCRIPTION.structure.hookParagraph.sentences} sentences): ${f.PRODUCT_DESCRIPTION.structure.hookParagraph.purpose}
   b) BENEFIT-DRIVEN BULLETS (${f.PRODUCT_DESCRIPTION.structure.benefitBullets.count} points): Format each as "${f.PRODUCT_DESCRIPTION.structure.benefitBullets.format}". ${f.PRODUCT_DESCRIPTION.structure.benefitBullets.purpose}
   c) LIFESTYLE/VALUE PARAGRAPH (${f.PRODUCT_DESCRIPTION.structure.lifestyleParagraph.sentences} sentences): ${f.PRODUCT_DESCRIPTION.structure.lifestyleParagraph.purpose}
   d) MINI-FAQ (${f.PRODUCT_DESCRIPTION.structure.miniFAQ.count} questions): ${f.PRODUCT_DESCRIPTION.structure.miniFAQ.purpose}
   
   HTML Formatting: ${f.PRODUCT_DESCRIPTION.htmlFormatting.join('. ')}
   Content Rules: ${f.PRODUCT_DESCRIPTION.rules.join('. ')}

5. IMAGE ALT TEXT (max ${f.IMAGE_ALT_TEXT.maxLength} chars each)
   Format: "${f.IMAGE_ALT_TEXT.format}"
   Rules: ${f.IMAGE_ALT_TEXT.rules.join('. ')}
   Generate 2-3 alt text variations for different product images.

6. KEYWORD CLUSTER
   - Primary: ${f.KEYWORD_CLUSTER.structure.primary}
   - Secondary: ${f.KEYWORD_CLUSTER.structure.secondary}
   - Long-tail (${f.KEYWORD_CLUSTER.structure.longTail.count}): ${f.KEYWORD_CLUSTER.structure.longTail.format}
   - LSI (${f.KEYWORD_CLUSTER.structure.lsi.count}): ${f.KEYWORD_CLUSTER.structure.lsi.format}

7. SEO TAGS (${f.SEO_TAGS.count.min}-${f.SEO_TAGS.count.max} tags)
   ${f.SEO_TAGS.rules.join('. ')}

GOOGLE RANKING PRINCIPLES TO FOLLOW:
${f.GOOGLE_RANKING_PRINCIPLES.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Respond ONLY with valid JSON:
{
  "improvedName": "optimized product title",
  "seoTitle": "meta title for search results (50-60 chars)",
  "metaTitle": "same as seoTitle — the search engine preview title",
  "metaDescription": "compelling meta description with CTA (140-160 chars)",
  "improvedDescription": "Full HTML-formatted description with hook + bullets + lifestyle + mini-FAQ",
  "altTexts": ["alt text 1", "alt text 2", "alt text 3"],
  "keywordCluster": {
    "primary": "main keyword",
    "secondary": "secondary keyword",
    "longTail": ["phrase 1", "phrase 2", "phrase 3"],
    "lsi": ["term 1", "term 2", "term 3", "term 4", "term 5"]
  },
  "seoTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seoScore": 85
}`;
}

export function buildQuickSEOPrompt(product: {
  name: string;
  description?: string | null;
  category?: string | null;
  price?: number | string | null;
}): string {
  const f = SEO_CONTENT_FORMATS;

  return `You are a world-class e-commerce SEO strategist. Apply 2025 Google ranking factors (E-E-A-T, Helpful Content, mobile-first) to generate optimized SEO content.

Product: ${product.name}
Description: ${product.description || 'No description available'}
Category: ${product.category || 'General'}
Price: ${product.price || 'Not specified'}

Generate using these EXACT formats:
1. SEO Title (${f.META_TITLE.minLength}-${f.META_TITLE.maxLength} chars): Format "${f.META_TITLE.format}" — front-load the most important buyer-intent keyword
2. Meta Description (${f.META_DESCRIPTION.minLength}-${f.META_DESCRIPTION.maxLength} chars): Format "${f.META_DESCRIPTION.format}" — include primary keyword + emotional benefit + CTA like "Shop now" or "Free shipping"
3. Keywords (5-7): Mix of buyer-intent head terms and long-tail phrases that actual shoppers search
4. SEO Score (0-100): Based on keyword placement, E-E-A-T signals, content quality, buyer-intent alignment
5. Alt Text (2 variations, max ${f.IMAGE_ALT_TEXT.maxLength} chars each): Format "${f.IMAGE_ALT_TEXT.format}" — describe the product visually with keyword

Respond in JSON:
{
  "seoTitle": "keyword-optimized meta title",
  "metaDescription": "compelling description with keyword and CTA",
  "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"],
  "seoScore": 85,
  "altTexts": ["product alt text 1", "product alt text 2"]
}`;
}

export function buildDescriptionPrompt(product: {
  name: string;
  description?: string | null;
  category?: string | null;
  price?: number | string | null;
}): string {
  const f = SEO_CONTENT_FORMATS;

  return `You are an elite e-commerce copywriter and SEO strategist. Create a product description that ranks on Google and converts browsers into buyers using the 2025 viral SEO formula.

Product: ${product.name}
Current Description: ${product.description || 'No description'}
Category: ${product.category || 'General'}
Price: ${product.price || 'Not specified'}

Write using this EXACT STRUCTURE (${f.PRODUCT_DESCRIPTION.wordCount.min}-${f.PRODUCT_DESCRIPTION.wordCount.max} words total):

1. ENHANCED DESCRIPTION with this exact structure:
   a) OPENING HOOK (${f.PRODUCT_DESCRIPTION.structure.hookParagraph.sentences} sentences): ${f.PRODUCT_DESCRIPTION.structure.hookParagraph.purpose}
   b) BENEFIT-DRIVEN BULLETS (${f.PRODUCT_DESCRIPTION.structure.benefitBullets.count} points): Format each as "${f.PRODUCT_DESCRIPTION.structure.benefitBullets.format}". ${f.PRODUCT_DESCRIPTION.structure.benefitBullets.purpose}
   c) LIFESTYLE PARAGRAPH (${f.PRODUCT_DESCRIPTION.structure.lifestyleParagraph.sentences} sentences): ${f.PRODUCT_DESCRIPTION.structure.lifestyleParagraph.purpose}
   d) MINI-FAQ (${f.PRODUCT_DESCRIPTION.structure.miniFAQ.count} questions with answers): ${f.PRODUCT_DESCRIPTION.structure.miniFAQ.purpose}

2. COMPELLING HEADLINE: A benefit-first headline with keyword (under ${f.PRODUCT_TITLE.maxLength} chars). Format: "${f.PRODUCT_TITLE.format}"

3. KEY BENEFITS: 3-5 benefit statements that double as search-friendly phrases

4. CALL-TO-ACTION: Benefit-focused CTA that creates urgency without being pushy

5. IMAGE ALT TEXT: 2 alt text variations (max ${f.IMAGE_ALT_TEXT.maxLength} chars each). Format: "${f.IMAGE_ALT_TEXT.format}"

RULES:
- Write for humans first, SEO second
- Primary keyword 2-4 times naturally
- Use HTML: <p>, <ul><li>, <strong>, <h3> for FAQ
- No filler — every sentence must sell or inform
- Tone: confident, helpful, authentic
- Bold the product name 2-3 times throughout

Respond ONLY with valid JSON:
{
  "improvedDescription": "Full HTML-formatted description with all sections",
  "headline": "benefit-first keyword-rich headline",
  "keyBenefits": ["benefit 1", "benefit 2", "benefit 3"],
  "callToAction": "compelling CTA text",
  "altTexts": ["alt text 1", "alt text 2"]
}`;
}
