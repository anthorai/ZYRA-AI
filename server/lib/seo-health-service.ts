import { db } from "../db";
import { products, seoMeta, productSeoHistory, storeConnections } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

function getDb() {
  if (!db) {
    throw new Error("Database connection not available");
  }
  return db;
}

export interface SEOIssue {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'meta' | 'content' | 'technical' | 'schema' | 'performance';
  title: string;
  description: string;
  affectedProducts: number;
  impact: string;
  fixSuggestion: string;
  priority: number;
}

export interface SEOHealthScore {
  overall: number;
  categories: {
    meta: number;
    content: number;
    technical: number;
    schema: number;
  };
  trend: 'up' | 'down' | 'stable';
  previousScore: number;
}

export interface ProductSEOAudit {
  productId: string;
  productName: string;
  score: number;
  issues: {
    type: 'critical' | 'warning' | 'info';
    message: string;
    field: string;
  }[];
  hasMetaTitle: boolean;
  hasMetaDescription: boolean;
  hasAltText: boolean;
  hasKeywords: boolean;
  titleLength: number;
  descriptionLength: number;
  metaDescriptionLength: number;
  keywordCount: number;
}

export interface KeywordRanking {
  id: string;
  keyword: string;
  currentRank: number;
  previousRank: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  searchVolume: number | null;
  difficulty: 'Low' | 'Medium' | 'High';
  productName: string;
  productId: string;
  lastUpdate: string;
  seoScore: number;
}

export interface SchemaMarkup {
  productId: string;
  productName: string;
  schema: object;
  isValid: boolean;
  missingFields: string[];
}

interface CachedData<T> {
  data: T;
  timestamp: number;
}

const auditCache = new Map<string, CachedData<ProductSEOAudit[]>>();
const scoreCache = new Map<string, CachedData<SEOHealthScore>>();
const keywordsCache = new Map<string, CachedData<KeywordRanking[]>>();
const schemaCache = new Map<string, CachedData<SchemaMarkup[]>>();
const storeCache = new Map<string, CachedData<{ storeName: string; storeUrl: string } | null>>();
const CACHE_TTL = 30000;

function getCached<T>(cache: Map<string, CachedData<T>>, key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache<T>(cache: Map<string, CachedData<T>>, key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export class SEOHealthService {
  private static async getStoreInfo(userId: string): Promise<{ storeName: string; storeUrl: string } | null> {
    const cached = getCached(storeCache, userId);
    if (cached !== null) {
      return cached;
    }

    try {
      const stores = await getDb()
        .select({
          storeName: storeConnections.storeName,
          storeUrl: storeConnections.storeUrl
        })
        .from(storeConnections)
        .where(and(
          eq(storeConnections.userId, userId),
          eq(storeConnections.status, 'active')
        ))
        .limit(1);

      const storeInfo = stores.length > 0 
        ? { storeName: stores[0].storeName, storeUrl: stores[0].storeUrl || '' }
        : null;
      
      setCache(storeCache, userId, storeInfo);
      return storeInfo;
    } catch {
      return null;
    }
  }

  static async getStoreHealthScore(userId: string): Promise<SEOHealthScore> {
    const cached = getCached(scoreCache, userId);
    if (cached) {
      return cached;
    }

    const audits = await this.auditAllProducts(userId);
    
    if (audits.length === 0) {
      const emptyScore: SEOHealthScore = {
        overall: 0,
        categories: { meta: 0, content: 0, technical: 0, schema: 0 },
        trend: 'stable',
        previousScore: 0
      };
      setCache(scoreCache, userId, emptyScore);
      return emptyScore;
    }

    const avgScore = audits.reduce((sum, a) => sum + a.score, 0) / audits.length;
    
    const metaScore = this.calculateMetaScore(audits);
    const contentScore = this.calculateContentScore(audits);
    const technicalScore = this.calculateTechnicalScore(audits);
    const schemaScore = this.calculateSchemaScore(audits);

    const history = await getDb()
      .select()
      .from(productSeoHistory)
      .where(eq(productSeoHistory.userId, userId))
      .orderBy(desc(productSeoHistory.createdAt))
      .limit(20);

    let previousScore = Math.round(avgScore * 0.95);
    let trend: 'up' | 'down' | 'stable' = 'stable';

    if (history.length > 5) {
      const oldScores = history.slice(-5).map(h => h.seoScore || 0);
      const recentScores = history.slice(0, 5).map(h => h.seoScore || 0);
      const oldAvg = oldScores.reduce((a, b) => a + b, 0) / oldScores.length;
      const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      
      if (recentAvg > oldAvg + 5) trend = 'up';
      else if (recentAvg < oldAvg - 5) trend = 'down';
      previousScore = Math.round(oldAvg);
    }

    const result: SEOHealthScore = {
      overall: Math.round(avgScore),
      categories: {
        meta: Math.round(metaScore),
        content: Math.round(contentScore),
        technical: Math.round(technicalScore),
        schema: Math.round(schemaScore)
      },
      trend,
      previousScore
    };

    setCache(scoreCache, userId, result);
    return result;
  }

  static async getSEOIssues(userId: string): Promise<SEOIssue[]> {
    const audits = await this.auditAllProducts(userId);
    const issues: SEOIssue[] = [];

    const missingMetaTitle = audits.filter(a => !a.hasMetaTitle);
    if (missingMetaTitle.length > 0) {
      issues.push({
        id: 'missing-meta-title',
        type: 'critical',
        category: 'meta',
        title: 'Missing Meta Titles',
        description: 'Products without meta titles won\'t appear properly in search results',
        affectedProducts: missingMetaTitle.length,
        impact: 'High - Reduces click-through rate by up to 30%',
        fixSuggestion: 'Use the AI SEO Engine to generate optimized meta titles',
        priority: 1
      });
    }

    const missingMetaDesc = audits.filter(a => !a.hasMetaDescription);
    if (missingMetaDesc.length > 0) {
      issues.push({
        id: 'missing-meta-description',
        type: 'critical',
        category: 'meta',
        title: 'Missing Meta Descriptions',
        description: 'Products without meta descriptions rely on auto-generated snippets',
        affectedProducts: missingMetaDesc.length,
        impact: 'High - Missing descriptions can reduce CTR by 25%',
        fixSuggestion: 'Generate compelling meta descriptions with our AI tools',
        priority: 2
      });
    }

    const shortTitles = audits.filter(a => a.titleLength < 30 && a.titleLength > 0);
    if (shortTitles.length > 0) {
      issues.push({
        id: 'short-titles',
        type: 'warning',
        category: 'content',
        title: 'Short Product Titles',
        description: 'Product titles under 30 characters miss keyword opportunities',
        affectedProducts: shortTitles.length,
        impact: 'Medium - Short titles rank for fewer search queries',
        fixSuggestion: 'Expand titles to include key features and benefits',
        priority: 3
      });
    }

    const longTitles = audits.filter(a => a.titleLength > 60);
    if (longTitles.length > 0) {
      issues.push({
        id: 'long-titles',
        type: 'warning',
        category: 'content',
        title: 'Titles Too Long',
        description: 'Titles over 60 characters get truncated in search results',
        affectedProducts: longTitles.length,
        impact: 'Medium - Truncated titles reduce readability',
        fixSuggestion: 'Shorten titles to 50-60 characters for optimal display',
        priority: 4
      });
    }

    const shortDescriptions = audits.filter(a => a.descriptionLength < 100 && a.descriptionLength > 0);
    if (shortDescriptions.length > 0) {
      issues.push({
        id: 'short-descriptions',
        type: 'warning',
        category: 'content',
        title: 'Short Product Descriptions',
        description: 'Descriptions under 100 characters don\'t provide enough content for SEO',
        affectedProducts: shortDescriptions.length,
        impact: 'Medium - Thin content ranks poorly in Google',
        fixSuggestion: 'Expand descriptions to 150-300 characters minimum',
        priority: 5
      });
    }

    const missingKeywords = audits.filter(a => !a.hasKeywords);
    if (missingKeywords.length > 0) {
      issues.push({
        id: 'missing-keywords',
        type: 'info',
        category: 'meta',
        title: 'Missing Target Keywords',
        description: 'Products without defined keywords miss optimization opportunities',
        affectedProducts: missingKeywords.length,
        impact: 'Low - Keywords help with content optimization guidance',
        fixSuggestion: 'Define target keywords for each product category',
        priority: 6
      });
    }

    const missingAltText = audits.filter(a => !a.hasAltText);
    if (missingAltText.length > 0) {
      issues.push({
        id: 'missing-alt-text',
        type: 'warning',
        category: 'technical',
        title: 'Missing Image Alt Text',
        description: 'Images without alt text hurt accessibility and image search rankings',
        affectedProducts: missingAltText.length,
        impact: 'Medium - Alt text helps with Google Image search visibility',
        fixSuggestion: 'Use our AI Image Alt Text Generator to create descriptions',
        priority: 7
      });
    }

    return issues.sort((a, b) => a.priority - b.priority);
  }

  static async auditAllProducts(userId: string): Promise<ProductSEOAudit[]> {
    const cached = getCached(auditCache, userId);
    if (cached) {
      return cached;
    }

    const userProducts = await getDb()
      .select()
      .from(products)
      .leftJoin(seoMeta, eq(products.id, seoMeta.productId))
      .where(eq(products.userId, userId));

    const audits = userProducts.map(({ products: product, seo_meta: meta }) => {
      const issues: ProductSEOAudit['issues'] = [];
      let score = 100;

      const titleLength = product.name?.length || 0;
      const descriptionLength = product.description?.length || 0;
      const hasMetaTitle = !!meta?.seoTitle || !!meta?.optimizedTitle;
      const hasMetaDescription = !!meta?.metaDescription || !!meta?.optimizedMeta;
      const hasKeywords = !!meta?.keywords;
      const metaDescLength = (meta?.metaDescription || meta?.optimizedMeta)?.length || 0;
      
      const optimizedCopy = product.optimizedCopy as any;
      const hasAltText = !!(optimizedCopy?.altText || optimizedCopy?.imageAltText);

      if (!hasMetaTitle) {
        issues.push({ type: 'critical', message: 'Missing meta title', field: 'seoTitle' });
        score -= 20;
      }

      if (!hasMetaDescription) {
        issues.push({ type: 'critical', message: 'Missing meta description', field: 'metaDescription' });
        score -= 20;
      }

      if (titleLength < 30) {
        issues.push({ type: 'warning', message: 'Title too short (less than 30 chars)', field: 'name' });
        score -= 10;
      } else if (titleLength > 60) {
        issues.push({ type: 'warning', message: 'Title too long (over 60 chars)', field: 'name' });
        score -= 5;
      }

      if (descriptionLength < 100) {
        issues.push({ type: 'warning', message: 'Description too short', field: 'description' });
        score -= 10;
      }

      if (metaDescLength > 0 && metaDescLength < 120) {
        issues.push({ type: 'info', message: 'Meta description could be longer', field: 'metaDescription' });
        score -= 5;
      } else if (metaDescLength > 160) {
        issues.push({ type: 'info', message: 'Meta description may be truncated', field: 'metaDescription' });
        score -= 5;
      }

      if (!hasKeywords) {
        issues.push({ type: 'info', message: 'No target keywords defined', field: 'keywords' });
        score -= 5;
      }

      if (!hasAltText) {
        issues.push({ type: 'warning', message: 'Missing image alt text', field: 'altText' });
        score -= 10;
      }

      const keywordText = meta?.keywords || '';
      const keywordCount = keywordText ? keywordText.split(',').filter(k => k.trim()).length : 0;

      return {
        productId: product.id,
        productName: product.name,
        score: Math.max(0, score),
        issues,
        hasMetaTitle,
        hasMetaDescription,
        hasAltText,
        hasKeywords,
        titleLength,
        descriptionLength,
        metaDescriptionLength: metaDescLength,
        keywordCount
      };
    });

    setCache(auditCache, userId, audits);
    return audits;
  }

  static async auditSingleProduct(userId: string, productId: string): Promise<ProductSEOAudit | null> {
    const audits = await this.auditAllProducts(userId);
    return audits.find(a => a.productId === productId) || null;
  }

  static async getKeywordRankings(userId: string): Promise<KeywordRanking[]> {
    const cached = getCached(keywordsCache, userId);
    if (cached) {
      return cached;
    }

    const history = await getDb()
      .select()
      .from(productSeoHistory)
      .where(eq(productSeoHistory.userId, userId))
      .orderBy(desc(productSeoHistory.createdAt))
      .limit(100);

    if (history.length === 0) {
      setCache(keywordsCache, userId, []);
      return [];
    }

    const rankings: KeywordRanking[] = [];
    const keywordMap = new Map<string, { 
      entries: typeof history[0][], 
      productName: string, 
      productId: string 
    }>();

    for (const entry of history) {
      const keywords = entry.keywords as string[] || [];
      for (const keyword of keywords) {
        const key = keyword.toLowerCase().trim();
        if (key) {
          const existing = keywordMap.get(key);
          if (existing) {
            existing.entries.push(entry);
          } else {
            keywordMap.set(key, {
              entries: [entry],
              productName: entry.productName,
              productId: entry.productId || ''
            });
          }
        }
      }
    }

    for (const [keyword, data] of keywordMap) {
      const entries = data.entries.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      
      const latestEntry = entries[0];
      const previousEntry = entries.length > 1 ? entries[1] : null;
      
      const currentScore = latestEntry.seoScore || 50;
      const previousScore = previousEntry?.seoScore || currentScore;
      
      const currentRank = Math.max(1, Math.round((100 - currentScore) / 5) + 1);
      const previousRank = Math.max(1, Math.round((100 - previousScore) / 5) + 1);
      const change = previousRank - currentRank;
      
      const keywordLength = keyword.split(' ').length;
      let difficulty: 'Low' | 'Medium' | 'High' = 'Medium';
      if (keywordLength >= 4) difficulty = 'Low';
      else if (keywordLength <= 2) difficulty = 'High';
      
      rankings.push({
        id: latestEntry.id,
        keyword,
        currentRank,
        previousRank,
        change,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        searchVolume: null,
        difficulty,
        productName: data.productName,
        productId: data.productId,
        lastUpdate: new Date(latestEntry.createdAt || Date.now()).toISOString().split('T')[0],
        seoScore: currentScore
      });
    }

    const result = rankings
      .sort((a, b) => a.currentRank - b.currentRank)
      .slice(0, 20);

    setCache(keywordsCache, userId, result);
    return result;
  }

  static async generateProductSchema(userId: string, product: any, meta: any): Promise<SchemaMarkup> {
    const missingFields: string[] = [];
    
    if (!product.price) missingFields.push('price');
    if (!product.description) missingFields.push('description');
    if (!product.image) missingFields.push('image');
    if (!product.category) missingFields.push('category');

    const stockValue = product.stock ?? 0;
    const availability = stockValue > 0 
      ? "https://schema.org/InStock" 
      : "https://schema.org/OutOfStock";

    const storeInfo = await this.getStoreInfo(userId);
    const storeName = storeInfo?.storeName || 'Store';
    const storeUrl = storeInfo?.storeUrl || '';
    const productUrl = storeUrl 
      ? `${storeUrl.replace(/\/$/, '')}/products/${product.id}`
      : '';

    const productDescription = product.description || meta?.metaDescription || meta?.optimizedMeta || '';
    const productImage = product.image || '';
    const productPrice = product.price ? String(product.price) : '0';

    const schema: Record<string, any> = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "description": productDescription,
      "sku": product.sku || product.id,
      "brand": {
        "@type": "Brand",
        "name": storeName
      },
      "offers": {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": productPrice,
        "availability": availability,
        "seller": {
          "@type": "Organization",
          "name": storeName
        }
      }
    };

    if (productImage) {
      schema.image = productImage;
    }

    if (productUrl) {
      schema.offers.url = productUrl;
    }

    if (storeUrl) {
      schema.offers.seller.url = storeUrl;
    }

    return {
      productId: product.id,
      productName: product.name,
      schema,
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  static async getSchemaMarkups(userId: string): Promise<SchemaMarkup[]> {
    const cached = getCached(schemaCache, userId);
    if (cached) {
      return cached;
    }

    const userProducts = await getDb()
      .select()
      .from(products)
      .leftJoin(seoMeta, eq(products.id, seoMeta.productId))
      .where(eq(products.userId, userId))
      .limit(50);

    const schemas = await Promise.all(
      userProducts.map(({ products: product, seo_meta: meta }) => 
        this.generateProductSchema(userId, product, meta)
      )
    );

    setCache(schemaCache, userId, schemas);
    return schemas;
  }

  static async getSEORecommendations(userId: string): Promise<{
    quickWins: string[];
    improvements: string[];
    advanced: string[];
  }> {
    const audits = await this.auditAllProducts(userId);
    const issues = await this.getSEOIssues(userId);
    
    const quickWins: string[] = [];
    const improvements: string[] = [];
    const advanced: string[] = [];

    const criticalIssues = issues.filter(i => i.type === 'critical');
    const warningIssues = issues.filter(i => i.type === 'warning');

    if (criticalIssues.length > 0) {
      quickWins.push(`Fix ${criticalIssues.length} critical SEO issues to improve rankings fast`);
    }

    const avgScore = audits.length > 0 
      ? audits.reduce((sum, a) => sum + a.score, 0) / audits.length 
      : 0;

    if (avgScore < 50) {
      quickWins.push('Run bulk SEO optimization to improve all product pages at once');
    }

    if (issues.some(i => i.id === 'missing-meta-title')) {
      quickWins.push('Add meta titles to all products - this is the #1 ranking factor');
    }

    if (issues.some(i => i.id === 'missing-meta-description')) {
      improvements.push('Write compelling meta descriptions to improve click-through rates');
    }

    if (issues.some(i => i.id === 'short-descriptions')) {
      improvements.push('Expand product descriptions to 300+ words for better content signals');
    }

    if (issues.some(i => i.id === 'missing-alt-text')) {
      improvements.push('Add alt text to product images for Google Image search visibility');
    }

    if (warningIssues.length > 3) {
      advanced.push('Implement structured data (Schema.org) for rich snippets in search results');
    }

    advanced.push('Create a content strategy targeting long-tail keywords in your niche');
    advanced.push('Build backlinks from industry blogs and review sites');
    advanced.push('Optimize page load speed - Google Core Web Vitals affect rankings');

    return { quickWins, improvements, advanced };
  }

  private static calculateMetaScore(audits: ProductSEOAudit[]): number {
    if (audits.length === 0) return 0;
    
    const withMeta = audits.filter(a => a.hasMetaTitle && a.hasMetaDescription).length;
    const withKeywords = audits.filter(a => a.hasKeywords).length;
    
    return ((withMeta / audits.length) * 70) + ((withKeywords / audits.length) * 30);
  }

  private static calculateContentScore(audits: ProductSEOAudit[]): number {
    if (audits.length === 0) return 0;
    
    const goodTitles = audits.filter(a => a.titleLength >= 30 && a.titleLength <= 60).length;
    const goodDescriptions = audits.filter(a => a.descriptionLength >= 100).length;
    
    return ((goodTitles / audits.length) * 50) + ((goodDescriptions / audits.length) * 50);
  }

  private static calculateTechnicalScore(audits: ProductSEOAudit[]): number {
    if (audits.length === 0) return 0;
    
    const withAltText = audits.filter(a => a.hasAltText).length;
    const baseScore = 70;
    
    return baseScore + ((withAltText / audits.length) * 30);
  }

  private static calculateSchemaScore(audits: ProductSEOAudit[]): number {
    return 65;
  }
}
