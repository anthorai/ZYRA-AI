export const AI_TOOL_CREDITS = {
  'product-seo-engine': {
    name: 'Product SEO Engine',
    credits: 5,
    description: 'Full SEO optimization (title, meta, keywords)',
  },
  'product-seo-fast': {
    name: 'Product SEO (Fast Mode)',
    credits: 5,
    description: 'AI-powered SEO using proven patterns',
  },
  'product-seo-competitive': {
    name: 'Product SEO (Competitive Intelligence)',
    credits: 15,
    description: 'Real-time Google SERP analysis + AI',
  },
  'bulk-optimization': {
    name: 'Bulk Optimization',
    creditsPerProduct: 2,
    credits: 2,
    description: 'Batch SEO processing per product',
  },
  'image-alt-text': {
    name: 'AI Image Alt-Text',
    credits: 1,
    creditsPerImage: 1,
    description: 'Generate alt-text for images',
  },
  'dynamic-templates': {
    name: 'Dynamic Templates',
    credits: 3,
    description: 'Template-based content generation',
  },
  'brand-voice': {
    name: 'Brand Voice Memory',
    credits: 10,
    description: 'Complex AI brand voice training',
  },
  'multimodal-ai': {
    name: 'Multimodal AI',
    credits: 8,
    description: 'Image + text content processing',
  },
  'ab-testing': {
    name: 'A/B Testing Copy',
    credits: 6,
    description: 'Multiple version generation',
  },
  'strategy-insights': {
    name: 'Strategy Insights',
    credits: 15,
    description: 'Premium GPT-4o strategy analysis',
  },
  'smart-bulk-suggestions': {
    name: 'Smart Bulk Suggestions',
    creditsPerProduct: 2,
    credits: 2,
    description: 'AI-powered batch SEO fixes per product',
  },
  'serp-analysis': {
    name: 'SERP Competitive Analysis',
    credits: 10,
    description: 'Google ranking competitor analysis',
  },
  'product-description': {
    name: 'Product Description',
    credits: 3,
    description: 'AI-generated product description',
  },
  'email-campaign': {
    name: 'Email Campaign',
    credits: 4,
    description: 'AI-generated email content',
  },
  'sms-campaign': {
    name: 'SMS Campaign',
    credits: 2,
    description: 'AI-generated SMS content',
  },
} as const;

export type AIToolId = keyof typeof AI_TOOL_CREDITS;

export function getToolCredits(toolId: string): number {
  const tool = AI_TOOL_CREDITS[toolId as AIToolId];
  return tool?.credits ?? 1;
}

export function getToolCreditsPerProduct(toolId: string): number {
  const tool = AI_TOOL_CREDITS[toolId as AIToolId];
  return (tool as any)?.creditsPerProduct ?? tool?.credits ?? 1;
}

export function formatCreditsDisplay(credits: number): string {
  return credits === 1 ? '1 credit' : `${credits} credits`;
}
