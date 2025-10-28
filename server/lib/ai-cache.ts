import crypto from 'crypto';
import { getCached, setCached, CacheConfig } from './cache';

/**
 * AI Cache Statistics
 */
export interface AICacheStats {
  hits: number;
  misses: number;
  totalCalls: number;
  estimatedSavings: number; // in USD
}

let cacheStats: AICacheStats = {
  hits: 0,
  misses: 0,
  totalCalls: 0,
  estimatedSavings: 0
};

/**
 * Generate a consistent cache key from AI request parameters
 */
export function generateAICacheKey(params: {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  imageUrl?: string;
}): string {
  const normalized = {
    prompt: params.prompt.trim(),
    model: params.model || 'gpt-4o-mini',
    temperature: params.temperature ?? 0.7,
    maxTokens: params.maxTokens ?? 1000,
    imageUrl: params.imageUrl || ''
  };

  // Create hash of parameters for consistent cache key
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex')
    .substring(0, 32);

  return `ai:${normalized.model}:${hash}`;
}

/**
 * Estimate cost savings from cache hit
 * Based on OpenAI pricing (approximate)
 */
function estimateCostSavings(model: string, tokens: number): number {
  const pricing = {
    'gpt-4o': 0.000005 * tokens, // $5 per 1M tokens
    'gpt-4o-mini': 0.00000015 * tokens, // $0.15 per 1M tokens
    'gpt-4o-2024-08-06': 0.000005 * tokens,
    'default': 0.000001 * tokens
  };

  return pricing[model as keyof typeof pricing] || pricing.default;
}

/**
 * Cached AI text generation wrapper
 */
export async function cachedTextGeneration<T = string>(
  params: {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  },
  generateFn: () => Promise<T>
): Promise<T> {
  const cacheKey = generateAICacheKey(params);
  cacheStats.totalCalls++;

  // Try to get from cache
  const cached = await getCached<T>(cacheKey, CacheConfig.AI_RESPONSE);
  
  if (cached !== null) {
    cacheStats.hits++;
    // Estimate savings (rough approximation)
    const estimatedTokens = params.maxTokens || 1000;
    cacheStats.estimatedSavings += estimateCostSavings(params.model || 'gpt-4o-mini', estimatedTokens);
    
    console.log(`[AI Cache HIT] ${cacheKey.substring(0, 20)}... (Total hits: ${cacheStats.hits})`);
    return cached;
  }

  // Cache miss - generate new response
  cacheStats.misses++;
  console.log(`[AI Cache MISS] ${cacheKey.substring(0, 20)}... (Total misses: ${cacheStats.misses})`);
  
  const result = await generateFn();
  
  // Store in cache for future use
  await setCached(cacheKey, result, CacheConfig.AI_RESPONSE);
  
  return result;
}

/**
 * Cached AI vision analysis wrapper (for image alt-text)
 */
export async function cachedVisionAnalysis<T = string>(
  params: {
    prompt: string;
    imageUrl: string;
    model?: string;
    maxTokens?: number;
  },
  analyzeFn: () => Promise<T>
): Promise<T> {
  const cacheKey = generateAICacheKey(params);
  cacheStats.totalCalls++;

  // Try to get from cache
  const cached = await getCached<T>(cacheKey, CacheConfig.AI_RESPONSE);
  
  if (cached !== null) {
    cacheStats.hits++;
    cacheStats.estimatedSavings += estimateCostSavings(params.model || 'gpt-4o-mini', params.maxTokens || 300);
    
    console.log(`[AI Vision Cache HIT] ${cacheKey.substring(0, 20)}... (Total hits: ${cacheStats.hits})`);
    return cached;
  }

  // Cache miss - analyze image
  cacheStats.misses++;
  console.log(`[AI Vision Cache MISS] ${cacheKey.substring(0, 20)}... (Total misses: ${cacheStats.misses})`);
  
  const result = await analyzeFn();
  
  // Store in cache
  await setCached(cacheKey, result, CacheConfig.AI_RESPONSE);
  
  return result;
}

/**
 * Get current cache statistics
 */
export function getAICacheStats(): AICacheStats {
  return {
    ...cacheStats,
    hitRate: cacheStats.totalCalls > 0 
      ? (cacheStats.hits / cacheStats.totalCalls) * 100 
      : 0
  } as AICacheStats & { hitRate: number };
}

/**
 * Reset cache statistics (useful for testing/debugging)
 */
export function resetAICacheStats(): void {
  cacheStats = {
    hits: 0,
    misses: 0,
    totalCalls: 0,
    estimatedSavings: 0
  };
}
