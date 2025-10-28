/**
 * AI Prompt Template System
 * Provides dynamic, configurable prompts for various AI features
 */

export interface PromptTemplate {
  feature: string;
  brandVoice: string;
  template: string;
  maxWords?: number;
  placeholders: string[];
}

export interface PromptVariables {
  [key: string]: string | number;
}

// Comprehensive prompt templates for different AI features
export const AI_PROMPT_TEMPLATES: PromptTemplate[] = [
  // Product Description Templates
  {
    feature: "Product Description",
    brandVoice: "sales",
    template: `Create a compelling sales-focused product description for "{product_name}" in the {category} category. 
Target audience: {audience}. Key features: {features}. 
Make it persuasive, benefit-focused, and include a clear call-to-action. Keep it under {max_words} words.
Respond with JSON in this format: { "description": "your description here" }`,
    maxWords: 150,
    placeholders: ["product_name", "category", "audience", "features", "max_words"]
  },
  {
    feature: "Product Description",
    brandVoice: "seo",
    template: `Create an SEO-optimized product description for "{product_name}" in the {category} category.
Target audience: {audience}. Key features: {features}. Keywords to include: {keywords}.
Include relevant keywords naturally, focus on search-friendly language, and maintain readability.
Keep it under {max_words} words.
Respond with JSON in this format: { "description": "your description here" }`,
    maxWords: 160,
    placeholders: ["product_name", "category", "audience", "features", "keywords", "max_words"]
  },
  {
    feature: "Product Description",
    brandVoice: "casual",
    template: `Create a casual, friendly product description for "{product_name}" in the {category} category.
Target audience: {audience}. Key features: {features}.
Use conversational tone, emojis where appropriate, and make it relatable and fun.
Keep it under {max_words} words.
Respond with JSON in this format: { "description": "your description here" }`,
    maxWords: 150,
    placeholders: ["product_name", "category", "audience", "features", "max_words"]
  },
  {
    feature: "Product Description",
    brandVoice: "professional",
    template: `Create a professional, technical product description for "{product_name}" in the {category} category.
Target audience: {audience}. Key features: {features}. Technical specifications: {specs}.
Focus on accuracy, detailed specifications, and professional terminology.
Keep it under {max_words} words.
Respond with JSON in this format: { "description": "your description here" }`,
    maxWords: 200,
    placeholders: ["product_name", "category", "audience", "features", "specs", "max_words"]
  },

  // SEO Meta Description Templates
  {
    feature: "SEO Meta Description",
    brandVoice: "standard",
    template: `Generate an SEO-optimized meta description for "{product_name}" in the {category} category.
Include primary keywords: {primary_keywords}. Secondary keywords: {secondary_keywords}.
Make it compelling for search results, include benefits, and ensure it's exactly {max_characters} characters or less.
Respond with JSON in this format: { "meta_description": "your meta description here" }`,
    maxWords: 160,
    placeholders: ["product_name", "category", "primary_keywords", "secondary_keywords", "max_characters"]
  },

  // Email Marketing Templates
  {
    feature: "Email Marketing",
    brandVoice: "promotional",
    template: `Create a promotional email for "{product_name}" targeting {audience}.
Promotion type: {promotion_type}. Discount/offer: {offer_details}.
Include compelling subject line, engaging body text, and strong call-to-action.
Keep the email body under {max_words} words.
Respond with JSON in this format: { "subject": "email subject", "body": "email body content" }`,
    maxWords: 200,
    placeholders: ["product_name", "audience", "promotion_type", "offer_details", "max_words"]
  },
  {
    feature: "Email Marketing",
    brandVoice: "educational",
    template: `Create an educational email about "{product_name}" for {audience}.
Educational focus: {educational_topic}. Key benefits to highlight: {key_benefits}.
Make it informative, valuable, and subtly promotional.
Keep the email body under {max_words} words.
Respond with JSON in this format: { "subject": "email subject", "body": "email body content" }`,
    maxWords: 250,
    placeholders: ["product_name", "audience", "educational_topic", "key_benefits", "max_words"]
  },

  // Social Media Templates
  {
    feature: "Social Media Post",
    brandVoice: "engaging",
    template: `Create an engaging social media post for "{product_name}" on {platform}.
Post type: {post_type}. Target audience: {audience}. Key message: {key_message}.
Include relevant hashtags, emojis, and call-to-action appropriate for {platform}.
Keep it under {max_characters} characters.
Respond with JSON in this format: { "post": "social media post content", "hashtags": ["hashtag1", "hashtag2"] }`,
    maxWords: 50,
    placeholders: ["product_name", "platform", "post_type", "audience", "key_message", "max_characters"]
  }
];

/**
 * Process a prompt template by replacing placeholders with actual values
 */
export function processPromptTemplate(
  feature: string,
  brandVoice: string,
  variables: PromptVariables
): string {
  // Find the matching template
  const template = AI_PROMPT_TEMPLATES.find(
    (t) => t.feature === feature && t.brandVoice === brandVoice
  );

  if (!template) {
    throw new Error(`No template found for feature: ${feature}, brandVoice: ${brandVoice}`);
  }

  // Start with the template
  let processedPrompt = template.template;

  // Replace placeholders with actual values using a function to avoid $ expansion issues
  template.placeholders.forEach((placeholder) => {
    const value = variables[placeholder];
    if (value !== undefined) {
      // Handle both string and number values
      const stringValue = typeof value === 'string' ? value : String(value);
      processedPrompt = processedPrompt.replace(
        new RegExp(`{${placeholder}}`, 'g'),
        () => stringValue
      );
    }
  });

  // Add defaults for common placeholders if not provided and template uses them
  if (processedPrompt.includes('{max_words}') && !variables.max_words) {
    processedPrompt = processedPrompt.replace(/{max_words}/g, () => String(template.maxWords || 150));
  }
  
  if (processedPrompt.includes('{max_characters}') && !variables.max_characters) {
    processedPrompt = processedPrompt.replace(/{max_characters}/g, () => String(160)); // Default for meta descriptions
  }

  return processedPrompt;
}

/**
 * Get available brand voices for a specific feature
 */
export function getAvailableBrandVoices(feature: string): string[] {
  return AI_PROMPT_TEMPLATES
    .filter((t) => t.feature === feature)
    .map((t) => t.brandVoice);
}

/**
 * Get available features
 */
export function getAvailableFeatures(): string[] {
  const uniqueFeatures = new Set(AI_PROMPT_TEMPLATES.map((t) => t.feature));
  return Array.from(uniqueFeatures);
}

/**
 * Get required placeholders for a specific feature and brand voice
 */
export function getRequiredPlaceholders(feature: string, brandVoice: string): string[] {
  const template = AI_PROMPT_TEMPLATES.find(
    (t) => t.feature === feature && t.brandVoice === brandVoice
  );
  return template?.placeholders || [];
}