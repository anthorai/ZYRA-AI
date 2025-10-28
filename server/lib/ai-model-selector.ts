/**
 * AI Model Selection Utility
 * Determines which OpenAI model to use based on task complexity
 */

export type AITaskType = 
  | 'seo_optimization'
  | 'product_description'
  | 'upsell_suggestion'
  | 'image_alt_text'
  | 'email_marketing'
  | 'blog_content'
  | 'social_captions'
  | 'ad_copy'
  | 'video_scripts'
  | 'professional_copywriting'
  | 'strategy_insights'
  | 'campaign_strategy'
  | 'deep_analytics';

export type AIModel = 'gpt-4o-mini' | 'gpt-4o';

/**
 * Model configuration for each task type
 */
export const MODEL_CONFIG: Record<AITaskType, {
  model: AIModel;
  temperature: number;
  maxTokens: number;
  description: string;
}> = {
  // GPT-4o Mini - Fast, cost-effective for basic tasks
  seo_optimization: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 500,
    description: 'SEO title and meta description generation'
  },
  product_description: {
    model: 'gpt-4o-mini',
    temperature: 0.75,
    maxTokens: 800,
    description: 'Product description generation'
  },
  upsell_suggestion: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 300,
    description: 'Product upsell recommendations'
  },
  image_alt_text: {
    model: 'gpt-4o-mini',
    temperature: 0.6,
    maxTokens: 200,
    description: 'Image alt-text generation'
  },
  email_marketing: {
    model: 'gpt-4o-mini',
    temperature: 0.75,
    maxTokens: 600,
    description: 'Email campaign content'
  },
  blog_content: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1500,
    description: 'Blog post generation'
  },
  social_captions: {
    model: 'gpt-4o-mini',
    temperature: 0.8,
    maxTokens: 300,
    description: 'Social media captions'
  },
  ad_copy: {
    model: 'gpt-4o-mini',
    temperature: 0.8,
    maxTokens: 400,
    description: 'Ad copy generation'
  },
  video_scripts: {
    model: 'gpt-4o-mini',
    temperature: 0.75,
    maxTokens: 1000,
    description: 'Video script creation'
  },
  professional_copywriting: {
    model: 'gpt-4o-mini',
    temperature: 0.75,
    maxTokens: 1200,
    description: 'Multi-agent copywriting pipeline'
  },
  
  // GPT-4o - Advanced reasoning for strategic tasks
  strategy_insights: {
    model: 'gpt-4o',
    temperature: 0.65,
    maxTokens: 2000,
    description: 'Deep analytics insights and missed opportunities'
  },
  campaign_strategy: {
    model: 'gpt-4o',
    temperature: 0.65,
    maxTokens: 2000,
    description: 'Advanced campaign strategy generation'
  },
  deep_analytics: {
    model: 'gpt-4o',
    temperature: 0.65,
    maxTokens: 2000,
    description: 'Data-driven performance analysis'
  }
};

/**
 * Get the appropriate model configuration for a task
 */
export function getModelForTask(taskType: AITaskType) {
  return MODEL_CONFIG[taskType] || MODEL_CONFIG.product_description;
}

/**
 * Check if a task uses GPT-4o (premium model)
 */
export function isPremiumTask(taskType: AITaskType): boolean {
  return MODEL_CONFIG[taskType]?.model === 'gpt-4o';
}

/**
 * Get model name for API call
 */
export function getModelName(taskType: AITaskType): string {
  const config = getModelForTask(taskType);
  return config.model;
}

/**
 * Get token cost estimation (per 1M tokens)
 */
export const TOKEN_COSTS = {
  'gpt-4o-mini': {
    input: 0.15,  // $0.15 per 1M input tokens
    output: 0.60  // $0.60 per 1M output tokens
  },
  'gpt-4o': {
    input: 2.50,  // $2.50 per 1M input tokens
    output: 10.00 // $10.00 per 1M output tokens
  }
};

/**
 * Estimate cost for a task
 */
export function estimateTaskCost(
  taskType: AITaskType,
  inputTokens: number,
  outputTokens: number
): number {
  const config = getModelForTask(taskType);
  const costs = TOKEN_COSTS[config.model];
  
  const inputCost = (inputTokens / 1000000) * costs.input;
  const outputCost = (outputTokens / 1000000) * costs.output;
  
  return inputCost + outputCost;
}

/**
 * User subscription plan types for Zyra Engine
 */
export type SubscriptionPlan = 'free' | 'starter' | 'growth' | 'pro' | 'trial';

/**
 * Determine model based on user's subscription plan and task complexity
 * 
 * PRO Plan Rules (Zyra Engine Guidelines):
 * - Use GPT-4o for deep reasoning, tone optimization, A/B testing
 * - Use GPT-4o for strategy insights, campaign strategy, professional copywriting
 * 
 * Standard/Free Plan Rules:
 * - Use GPT-4o-mini for all lightweight tasks (titles, alt text, bulk updates)
 * - Restricted from advanced strategic features
 */
export function getModelForPlan(
  taskType: AITaskType, 
  userPlan: SubscriptionPlan = 'free'
): {
  model: AIModel;
  temperature: number;
  maxTokens: number;
  description: string;
} {
  const baseConfig = MODEL_CONFIG[taskType];
  
  // PRO plan gets access to GPT-4o for advanced tasks
  if (userPlan === 'pro' || userPlan === 'growth') {
    // Upgrade specific tasks to GPT-4o for PRO users
    if (taskType === 'professional_copywriting') {
      return {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 1500,
        description: 'Premium multi-agent copywriting with GPT-4o'
      };
    }
    
    // Strategy tasks always use GPT-4o
    if (['strategy_insights', 'campaign_strategy', 'deep_analytics'].includes(taskType)) {
      return baseConfig;
    }
  }
  
  // Free/Starter plans use GPT-4o-mini for all tasks
  if ((userPlan === 'free' || userPlan === 'starter' || userPlan === 'trial') && 
      baseConfig.model === 'gpt-4o') {
    // Downgrade to mini for non-PRO users
    return {
      model: 'gpt-4o-mini',
      temperature: baseConfig.temperature,
      maxTokens: Math.min(baseConfig.maxTokens, 1000),
      description: `${baseConfig.description} (Limited - Upgrade to PRO for GPT-4o)`
    };
  }
  
  return baseConfig;
}

/**
 * Check if user has access to premium GPT-4o features
 */
export function hasPremiumAccess(userPlan: SubscriptionPlan): boolean {
  return userPlan === 'pro' || userPlan === 'growth';
}

/**
 * Get model type name for display (Zyra Engine context)
 */
export function getModelDisplayName(taskType: AITaskType, userPlan: SubscriptionPlan = 'free'): string {
  const config = getModelForPlan(taskType, userPlan);
  return config.model === 'gpt-4o' ? 'GPT-4o (PRO)' : 'GPT-4o-mini (FAST MODE)';
}
