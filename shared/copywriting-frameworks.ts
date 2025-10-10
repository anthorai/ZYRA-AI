/**
 * Professional Copywriting Frameworks
 * Industry-standard frameworks used by top copywriters to drive conversions
 */

export interface CopywritingFramework {
  name: string;
  acronym: string;
  description: string;
  steps: string[];
  bestFor: string[];
  template: string;
}

export const COPYWRITING_FRAMEWORKS: CopywritingFramework[] = [
  {
    name: "Attention Interest Desire Action",
    acronym: "AIDA",
    description: "Classic marketing funnel framework that guides readers from awareness to action",
    steps: ["Attention", "Interest", "Desire", "Action"],
    bestFor: ["Product launches", "Sales pages", "Email campaigns", "Ad copy"],
    template: `You are a professional copywriter. Write compelling copy for "{product_name}" using the AIDA framework.

**Product Details:**
- Category: {category}
- Target Audience: {audience}
- Key Features: {features}
- Unique Value: {unique_value}

**AIDA Framework Structure:**
1. ATTENTION: Write a powerful headline that stops the scroll and grabs attention immediately
2. INTEREST: Build interest by highlighting the problem this solves or the opportunity it creates
3. DESIRE: Create desire by showcasing benefits, social proof, and emotional triggers
4. ACTION: End with a clear, compelling call-to-action that drives immediate conversion

**Requirements:**
- Use power words and emotional triggers
- Include benefit-focused language (not just features)
- Keep total length under {max_words} words
- Make it scannable with short paragraphs

Respond with JSON: { "headline": "attention-grabbing headline", "copy": "full AIDA copy", "cta": "call to action" }`
  },
  {
    name: "Problem Agitate Solution",
    acronym: "PAS",
    description: "Emotional framework that amplifies pain points before presenting the solution",
    steps: ["Problem", "Agitate", "Solution"],
    bestFor: ["Pain-point products", "B2B solutions", "Problem-solving services"],
    template: `You are an expert copywriter. Create persuasive copy for "{product_name}" using the PAS framework.

**Product Details:**
- Category: {category}
- Target Audience: {audience}
- Key Features: {features}
- Problem it Solves: {problem}

**PAS Framework Structure:**
1. PROBLEM: Identify the specific problem your audience faces (be relatable and specific)
2. AGITATE: Amplify the pain by exploring consequences and emotional impact of not solving it
3. SOLUTION: Present your product as the perfect solution with proof and benefits

**Requirements:**
- Use emotional language that resonates with pain points
- Include specific examples and scenarios
- Show empathy before presenting solution
- Keep under {max_words} words

Respond with JSON: { "problem": "problem statement", "agitation": "pain amplification", "solution": "your product as solution", "full_copy": "complete PAS copy" }`
  },
  {
    name: "Before After Bridge",
    acronym: "BAB",
    description: "Transformation framework showing the journey from problem to solution",
    steps: ["Before", "After", "Bridge"],
    bestFor: ["Transformation products", "Before/after results", "Lifestyle changes"],
    template: `You are a master copywriter. Write transformational copy for "{product_name}" using the BAB framework.

**Product Details:**
- Category: {category}
- Target Audience: {audience}
- Key Features: {features}
- Transformation: {transformation}

**BAB Framework Structure:**
1. BEFORE: Paint a vivid picture of the current struggle/pain (make it relatable)
2. AFTER: Show the amazing transformation and ideal outcome (create desire)
3. BRIDGE: Explain how your product is the bridge that makes this transformation possible

**Requirements:**
- Use vivid, sensory language for before/after contrast
- Make the transformation feel achievable and real
- Include emotional benefits alongside practical ones
- Keep under {max_words} words

Respond with JSON: { "before": "current state description", "after": "transformed state", "bridge": "how product enables transformation", "full_copy": "complete BAB copy" }`
  },
  {
    name: "Four Ps Formula",
    acronym: "4Ps",
    description: "Picture Promise Prove Push - comprehensive framework for complete sales copy",
    steps: ["Picture", "Promise", "Prove", "Push"],
    bestFor: ["Long-form sales", "Product pages", "Landing pages"],
    template: `You are a professional sales copywriter. Create high-converting copy for "{product_name}" using the 4Ps framework.

**Product Details:**
- Category: {category}
- Target Audience: {audience}
- Key Features: {features}
- Social Proof: {social_proof}

**4Ps Framework Structure:**
1. PICTURE: Paint a vivid picture of success/transformation with this product
2. PROMISE: Make a clear, compelling promise of what they'll achieve
3. PROVE: Provide proof through features, benefits, testimonials, or data
4. PUSH: Create urgency and push them to take action NOW

**Requirements:**
- Use storytelling for the picture phase
- Make promises specific and believable
- Include concrete proof points
- Create genuine urgency (scarcity, timing, opportunity cost)
- Keep under {max_words} words

Respond with JSON: { "picture": "success visualization", "promise": "clear promise", "proof": "evidence and credibility", "push": "urgency and CTA", "full_copy": "complete 4Ps copy" }`
  },
  {
    name: "Features Advantages Benefits",
    acronym: "FAB",
    description: "Technical framework that translates features into customer value",
    steps: ["Features", "Advantages", "Benefits"],
    bestFor: ["Technical products", "B2B sales", "Feature-rich products"],
    template: `You are a strategic copywriter. Write value-focused copy for "{product_name}" using the FAB framework.

**Product Details:**
- Category: {category}
- Target Audience: {audience}
- Key Features: {features}
- Technical Specs: {specs}

**FAB Framework Structure:**
1. FEATURES: List the key technical features and specifications
2. ADVANTAGES: Explain what advantages these features provide over alternatives
3. BENEFITS: Translate advantages into emotional and practical benefits for the customer

**Requirements:**
- Start technical, end emotional
- Use "which means..." to bridge advantages to benefits
- Include both rational and emotional benefits
- Make it scannable with bullet points
- Keep under {max_words} words

Respond with JSON: { "features": ["feature list"], "advantages": ["advantage list"], "benefits": ["benefit list"], "full_copy": "complete FAB copy" }`
  }
];

export interface PsychologicalTrigger {
  name: string;
  description: string;
  examples: string[];
  whenToUse: string[];
}

export const PSYCHOLOGICAL_TRIGGERS: PsychologicalTrigger[] = [
  {
    name: "Scarcity",
    description: "Create urgency through limited availability or time constraints",
    examples: [
      "Only 3 left in stock",
      "Limited time offer - 24 hours only",
      "Exclusive - only available to first 100 customers",
      "Last chance to get this price"
    ],
    whenToUse: ["Product launches", "Flash sales", "Limited editions", "Time-sensitive offers"]
  },
  {
    name: "Social Proof",
    description: "Leverage crowd behavior and testimonials to build trust",
    examples: [
      "Join 10,000+ satisfied customers",
      "Rated 4.9/5 stars by verified buyers",
      "As featured in Forbes, TechCrunch",
      "Trusted by leading brands like Apple, Google"
    ],
    whenToUse: ["New products", "Building credibility", "Overcoming objections", "High-consideration purchases"]
  },
  {
    name: "Authority",
    description: "Establish expertise and credibility through credentials",
    examples: [
      "Developed by Harvard scientists",
      "Recommended by leading dermatologists",
      "Award-winning design team",
      "20+ years of industry expertise"
    ],
    whenToUse: ["Professional products", "Health/wellness", "Technical solutions", "Premium offerings"]
  },
  {
    name: "Urgency",
    description: "Motivate immediate action through time pressure",
    examples: [
      "Sale ends at midnight",
      "Price increases tomorrow",
      "Flash deal - 2 hours left",
      "Don't miss out - offer expires soon"
    ],
    whenToUse: ["Sales promotions", "Product launches", "Seasonal campaigns", "Cart abandonment"]
  },
  {
    name: "Reciprocity",
    description: "Give value first to create obligation to return the favor",
    examples: [
      "Free sample with every purchase",
      "Get our complete guide - no credit card required",
      "Try it free for 30 days",
      "Bonus gift when you buy today"
    ],
    whenToUse: ["Lead generation", "Trial offers", "Building goodwill", "First-time buyers"]
  },
  {
    name: "Loss Aversion",
    description: "Emphasize what customers stand to lose by not acting",
    examples: [
      "Don't miss out on this opportunity",
      "Stop wasting money on inferior products",
      "You're leaving money on the table",
      "What's it costing you to wait?"
    ],
    whenToUse: ["High-ticket items", "Competitive markets", "Overcoming procrastination"]
  }
];

export interface IndustryTemplate {
  industry: string;
  toneGuidelines: string;
  keywordFocus: string[];
  emotionalTriggers: string[];
  avoidWords: string[];
  exampleCopy: string;
}

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    industry: "Fashion & Apparel",
    toneGuidelines: "Aspirational, trendy, confident, style-focused",
    keywordFocus: ["style", "trending", "exclusive", "designer", "runway", "collection", "luxury", "fashion-forward"],
    emotionalTriggers: ["confidence", "self-expression", "standing out", "feeling beautiful", "being admired"],
    avoidWords: ["cheap", "basic", "ordinary", "mass-produced"],
    exampleCopy: "Elevate your style with our exclusive designer collection. Each piece is crafted to make you feel confident and turn heads wherever you go."
  },
  {
    industry: "Technology & Electronics",
    toneGuidelines: "Innovative, cutting-edge, precise, feature-focused",
    keywordFocus: ["advanced", "smart", "innovative", "powerful", "next-gen", "seamless", "intelligent", "breakthrough"],
    emotionalTriggers: ["being ahead", "productivity", "efficiency", "innovation", "status"],
    avoidWords: ["complicated", "outdated", "slow", "limited"],
    exampleCopy: "Experience breakthrough performance with our next-gen processor. Intelligent design meets raw power for seamless productivity."
  },
  {
    industry: "Health & Wellness",
    toneGuidelines: "Caring, scientific, trustworthy, benefit-focused",
    keywordFocus: ["natural", "clinically-proven", "wellness", "healthy", "pure", "effective", "safe", "scientifically-backed"],
    emotionalTriggers: ["wellbeing", "vitality", "self-care", "longevity", "confidence"],
    avoidWords: ["chemical", "artificial", "risky", "unproven"],
    exampleCopy: "Clinically-proven, naturally-sourced wellness. Feel your best with our scientifically-backed formula trusted by health professionals."
  },
  {
    industry: "Home & Garden",
    toneGuidelines: "Warm, practical, lifestyle-focused, quality-oriented",
    keywordFocus: ["comfortable", "beautiful", "durable", "timeless", "cozy", "elegant", "functional", "quality"],
    emotionalTriggers: ["comfort", "pride", "sanctuary", "family", "memories"],
    avoidWords: ["flimsy", "temporary", "impersonal", "cold"],
    exampleCopy: "Transform your house into a home. Quality craftsmanship meets timeless design for spaces you'll love living in."
  },
  {
    industry: "Luxury & Premium",
    toneGuidelines: "Sophisticated, exclusive, refined, prestige-focused",
    keywordFocus: ["exclusive", "handcrafted", "bespoke", "premium", "elite", "distinguished", "masterpiece", "exceptional"],
    emotionalTriggers: ["status", "exclusivity", "refinement", "legacy", "excellence"],
    avoidWords: ["budget", "affordable", "mass-market", "common"],
    exampleCopy: "Exceptional craftsmanship for the distinguished few. Experience the prestige of owning a true masterpiece."
  },
  {
    industry: "Beauty & Cosmetics",
    toneGuidelines: "Empowering, transformative, luxurious, results-focused",
    keywordFocus: ["radiant", "flawless", "luminous", "transformative", "professional", "dermatologist-tested", "age-defying"],
    emotionalTriggers: ["beauty", "confidence", "transformation", "self-love", "admiration"],
    avoidWords: ["harsh", "drying", "irritating", "fake"],
    exampleCopy: "Reveal your radiant glow. Dermatologist-tested luxury that transforms your skin and elevates your confidence."
  }
];

export function getCopywritingFramework(acronym: string): CopywritingFramework | undefined {
  return COPYWRITING_FRAMEWORKS.find(f => f.acronym === acronym);
}

export function getIndustryTemplate(industry: string): IndustryTemplate | undefined {
  return INDUSTRY_TEMPLATES.find(t => t.industry.toLowerCase().includes(industry.toLowerCase()));
}

export function getPsychologicalTrigger(name: string): PsychologicalTrigger | undefined {
  return PSYCHOLOGICAL_TRIGGERS.find(t => t.name.toLowerCase() === name.toLowerCase());
}
