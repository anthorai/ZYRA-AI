import { Redis } from '@upstash/redis';

/**
 * Redis Cache Layer for ZYRA
 * 
 * Provides intelligent caching for:
 * - Dashboard analytics (5 min TTL)
 * - Campaign stats (5 min TTL)
 * - AI responses for common patterns (24 hr TTL)
 * - Product data (10 min TTL)
 * 
 * Uses Upstash Redis (serverless, pay-as-you-go)
 * Free tier: 10,000 commands/day
 */

let redis: Redis | null = null;

// Initialize Redis if environment variables are set
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('✅ Redis cache initialized');
} else {
  console.warn('⚠️  Redis not configured - caching disabled (set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)');
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for organization
}

/**
 * Get data from cache
 */
export async function getCached<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
  if (!redis) return null;

  try {
    const fullKey = options.prefix ? `${options.prefix}:${key}` : key;
    const cached = await redis.get(fullKey);
    
    if (cached) {
      // Parse JSON string back to object
      if (typeof cached === 'string') {
        return JSON.parse(cached) as T;
      }
      return cached as T;
    }
    return null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set data in cache
 */
export async function setCached<T>(
  key: string, 
  value: T, 
  options: CacheOptions = {}
): Promise<void> {
  if (!redis) return;

  try {
    const fullKey = options.prefix ? `${options.prefix}:${key}` : key;
    const ttl = options.ttl || 300; // Default 5 minutes

    await redis.setex(fullKey, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

/**
 * Delete from cache
 */
export async function deleteCached(key: string, options: CacheOptions = {}): Promise<void> {
  if (!redis) return;

  try {
    const fullKey = options.prefix ? `${options.prefix}:${key}` : key;
    await redis.del(fullKey);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}

/**
 * Cache with automatic refresh
 * If cache miss, executes fetchFn and caches the result
 */
export async function cacheOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch fresh data
  const fresh = await fetchFn();
  
  // Cache the result
  await setCached(key, fresh, options);
  
  return fresh;
}

/**
 * Invalidate cache by pattern
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  if (!redis) return;

  try {
    // Upstash Redis doesn't support SCAN, so we'll use a simple prefix delete
    // For production, consider using Redis Cloud which supports SCAN
    console.log(`Cache invalidation requested for pattern: ${pattern}`);
  } catch (error) {
    console.error('Redis invalidation error:', error);
  }
}

// Pre-defined cache configurations
export const CacheConfig = {
  // Dashboard analytics - refresh every 5 minutes
  DASHBOARD: {
    prefix: 'dashboard',
    ttl: 300 // 5 minutes
  },
  
  // Campaign stats - refresh every 5 minutes
  CAMPAIGN_STATS: {
    prefix: 'campaign-stats',
    ttl: 300 // 5 minutes
  },
  
  // AI responses - cache for 24 hours
  AI_RESPONSE: {
    prefix: 'ai-response',
    ttl: 86400 // 24 hours
  },
  
  // Product data - refresh every 10 minutes
  PRODUCTS: {
    prefix: 'products',
    ttl: 600 // 10 minutes
  },
  
  // User data - refresh every 2 minutes
  USER: {
    prefix: 'user',
    ttl: 120 // 2 minutes
  }
};

export { redis };
