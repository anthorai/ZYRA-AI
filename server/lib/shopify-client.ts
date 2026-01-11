import fetch from 'node-fetch';
import { ShopifyGraphQLClient, graphqlProductToRest } from './shopify-graphql';

/**
 * Custom error class for Shopify app uninstalled detection
 * Thrown when API returns 401/403, indicating the app was uninstalled
 * and the access token is no longer valid
 */
export class ShopifyAppUninstalledError extends Error {
  public readonly shop: string;
  public readonly statusCode: number;
  
  constructor(shop: string, statusCode: number, message?: string) {
    super(message || `Shopify app appears to be uninstalled from ${shop}. Access token is invalid.`);
    this.name = 'ShopifyAppUninstalledError';
    this.shop = shop;
    this.statusCode = statusCode;
  }
}

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  variants: Array<{
    id: number;
    price: string;
    sku: string;
  }>;
  images: Array<{
    id: number;
    src: string;
    alt: string;
  }>;
}

export interface ShopifyProductUpdate {
  title?: string;
  body_html?: string;
  product_type?: string;
  tags?: string;
  vendor?: string;
}

export interface ShopifyMetafieldUpdate {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export class ShopifyClient {
  private shop: string;
  private accessToken: string;
  private apiVersion = '2025-01';
  private graphqlClient: ShopifyGraphQLClient;
  
  // Rate limiting: Shopify REST Admin API allows 2 requests/second with burst of 40
  private requestQueue: Array<() => Promise<any>> = [];
  private lastRequestTime: number = 0;
  private readonly minRequestInterval: number = 500; // 500ms = 2 requests/second
  private readonly maxBurstRequests: number = 40;
  private requestsInBurst: number = 0;
  private burstStartTime: number = 0;
  private isProcessingQueue: boolean = false;

  constructor(shop: string, accessToken: string) {
    this.shop = shop;
    this.accessToken = accessToken;
    this.graphqlClient = new ShopifyGraphQLClient(shop, accessToken);
  }

  /**
   * Rate limiting queue processor - ensures requests respect Shopify's rate limits
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.requestQueue.length > 0) {
        const now = Date.now();
        
        // Reset burst counter if 1 second has passed
        if (now - this.burstStartTime > 1000) {
          this.requestsInBurst = 0;
          this.burstStartTime = now;
        }
        
        // Check if we've exceeded burst limit
        if (this.requestsInBurst >= this.maxBurstRequests) {
          // Wait until burst window resets
          const waitTime = 1000 - (now - this.burstStartTime);
          if (waitTime > 0) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
          this.requestsInBurst = 0;
          this.burstStartTime = Date.now();
        }
        
        // Enforce minimum interval between requests
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
          await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
        }
        
        const request = this.requestQueue.shift();
        if (request) {
          this.lastRequestTime = Date.now();
          this.requestsInBurst++;
          
          // Execute request and handle errors gracefully
          try {
            await request();
          } catch (error) {
            // Log error but continue processing queue
            console.error('Shopify API request failed:', error);
            // Error is already propagated to the caller via promise rejection in queueRequest
          }
        }
      }
    } finally {
      // Always clear the flag, even if an error occurs
      this.isProcessingQueue = false;
    }
  }

  /**
   * Add request to rate-limited queue
   */
  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    return this.queueRequest(async () => {
      const url = `https://${this.shop}/admin/api/${this.apiVersion}${endpoint}`;
      
      const headers: any = {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
      };

      const options: any = {
        method,
        headers,
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      // Retry loop for 429 errors (in-place, not re-queued)
      let retries = 0;
      const maxRetries = 3;
      
      while (retries <= maxRetries) {
        const response = await fetch(url, options);

        // Check for rate limit headers and log warnings
        const rateLimitRemaining = response.headers.get('X-Shopify-Shop-Api-Call-Limit');
        if (rateLimitRemaining) {
          const [used, total] = rateLimitRemaining.split('/').map(Number);
          if (used / total > 0.9) {
            console.warn(`⚠️  Shopify API rate limit warning: ${used}/${total} requests used`);
          }
        }

        if (!response.ok) {
          const errorText = await response.text();
          
          // Handle 401/403 - indicates app was uninstalled or access token revoked
          // This is a fallback detection mechanism for when webhooks fail
          if (response.status === 401 || response.status === 403) {
            console.error(`🔴 [SHOPIFY_CLIENT] Access denied (${response.status}) for shop ${this.shop}. App may be uninstalled.`);
            throw new ShopifyAppUninstalledError(this.shop, response.status, errorText);
          }
          
          // Handle 429 Too Many Requests with in-place retry
          if (response.status === 429 && retries < maxRetries) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '2');
            console.warn(`Shopify rate limit hit. Retrying after ${retryAfter}s (attempt ${retries + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            retries++;
            continue; // Retry in-place without re-queuing
          }
          
          throw new Error(`Shopify API Error (${response.status}): ${errorText}`);
        }

        // Handle 204 No Content responses
        if (response.status === 204) {
          return null;
        }

        return await response.json();
      }
      
      throw new Error('Shopify API: Maximum retries exceeded');
    });
  }

  async getProduct(productId: string): Promise<ShopifyProduct> {
    const graphqlProduct = await this.graphqlClient.getProduct(productId);
    if (!graphqlProduct) {
      throw new Error(`Product ${productId} not found`);
    }
    return graphqlProductToRest(graphqlProduct);
  }

  async getProductMetafields(productId: string): Promise<any[]> {
    const graphqlProduct = await this.graphqlClient.getProduct(productId);
    if (!graphqlProduct) {
      return [];
    }
    return graphqlProduct.metafields.edges.map(edge => ({
      id: edge.node.id,
      namespace: edge.node.namespace,
      key: edge.node.key,
      value: edge.node.value,
      type: edge.node.type
    }));
  }

  async updateProduct(productId: string, updates: ShopifyProductUpdate): Promise<ShopifyProduct> {
    const graphqlInput: {
      title?: string;
      descriptionHtml?: string;
      productType?: string;
      tags?: string[];
      vendor?: string;
    } = {};

    if (updates.title) graphqlInput.title = updates.title;
    if (updates.body_html) graphqlInput.descriptionHtml = updates.body_html;
    if (updates.product_type) graphqlInput.productType = updates.product_type;
    if (updates.tags) graphqlInput.tags = updates.tags.split(',').map(t => t.trim());
    if (updates.vendor) graphqlInput.vendor = updates.vendor;

    const graphqlProduct = await this.graphqlClient.updateProduct(productId, graphqlInput);
    if (!graphqlProduct) {
      throw new Error(`Failed to update product ${productId}`);
    }
    return graphqlProductToRest(graphqlProduct);
  }

  async updateProductMetafields(productId: string, metafields: ShopifyMetafieldUpdate[]): Promise<void> {
    for (const metafield of metafields) {
      await this.graphqlClient.setProductMetafield(
        productId,
        metafield.namespace,
        metafield.key,
        metafield.value,
        metafield.type
      );
    }
  }

  async updateProductImage(productId: string, imageId: string, altText: string): Promise<void> {
    await this.graphqlClient.updateProductImage(productId, imageId, altText);
  }

  async updateVariantPrice(variantId: number, price: string): Promise<void> {
    await this.graphqlClient.updateVariantPrice(variantId.toString(), price);
  }

  async updateProductPrice(productId: string, price: string): Promise<void> {
    const product = await this.getProduct(productId);
    
    if (!product.variants || product.variants.length === 0) {
      throw new Error(`Product ${productId} has no variants to update price`);
    }

    for (const variant of product.variants) {
      await this.updateVariantPrice(variant.id, price);
    }
  }

  async getAllProducts(limit: number = 250): Promise<ShopifyProduct[]> {
    const graphqlProducts = await this.graphqlClient.fetchAllProducts();
    return graphqlProducts.map(graphqlProductToRest);
  }

  async updateProductSEO(productId: string, seoTitle: string, metaDescription: string): Promise<void> {
    await this.updateProductMetafields(productId, [
      {
        namespace: 'global',
        key: 'title_tag',
        value: seoTitle,
        type: 'single_line_text_field'
      },
      {
        namespace: 'global',
        key: 'description_tag',
        value: metaDescription,
        type: 'single_line_text_field'
      }
    ]);
  }

  async publishAIContent(productId: string, content: {
    title?: string;
    description?: string;
    seoTitle?: string;
    metaDescription?: string;
    tags?: string[] | string;
    imageAltTexts?: Array<{ imageId: string; altText: string }>;
  }): Promise<ShopifyProduct> {
    const updates: ShopifyProductUpdate = {};

    // Update product title if provided
    if (content.title) {
      updates.title = content.title;
    }

    if (content.description) {
      updates.body_html = content.description;
    }

    // Add tags if provided - Shopify expects tags as comma-separated string
    if (content.tags) {
      // Handle both array and string formats
      if (Array.isArray(content.tags) && content.tags.length > 0) {
        updates.tags = content.tags.join(', ');
      } else if (typeof content.tags === 'string' && content.tags.trim()) {
        updates.tags = content.tags;
      }
    }

    // Only update product if there are actual changes to make
    let updatedProduct: ShopifyProduct;
    if (Object.keys(updates).length > 0) {
      updatedProduct = await this.updateProduct(productId, updates);
    } else {
      // If no product updates, just fetch current product
      updatedProduct = await this.getProduct(productId);
    }

    if (content.seoTitle && content.metaDescription) {
      await this.updateProductSEO(productId, content.seoTitle, content.metaDescription);
    }

    if (content.imageAltTexts && content.imageAltTexts.length > 0) {
      for (const { imageId, altText } of content.imageAltTexts) {
        await this.updateProductImage(productId, imageId, altText);
      }
    }

    return updatedProduct;
  }

  async testConnection(): Promise<boolean> {
    try {
      return await this.graphqlClient.testConnection();
    } catch (error) {
      console.error('Shopify connection test failed:', error);
      return false;
    }
  }

  getGraphQLClient(): ShopifyGraphQLClient {
    return this.graphqlClient;
  }
}

export async function getShopifyClient(shop: string, accessToken: string): Promise<ShopifyClient> {
  const client = new ShopifyClient(shop, accessToken);
  const isConnected = await client.testConnection();
  
  if (!isConnected) {
    throw new Error('Failed to connect to Shopify. Please check your credentials.');
  }
  
  return client;
}

/**
 * Helper function to handle ShopifyAppUninstalledError and mark the store as disconnected
 * Call this in catch blocks when handling Shopify API errors
 * 
 * @param error - The error that was caught
 * @param storage - The storage instance to update the connection
 * @returns true if the error was a ShopifyAppUninstalledError and was handled, false otherwise
 */
export async function handleShopifyUninstallError(
  error: unknown,
  storage: { 
    getStoreConnectionsByShopDomain: (shopDomain: string) => Promise<Array<{ id: string; platform: string; storeUrl?: string | null; storeName?: string | null }>>;
    updateStoreConnection: (id: string, updates: any) => Promise<any>;
  }
): Promise<boolean> {
  if (!(error instanceof ShopifyAppUninstalledError)) {
    return false;
  }
  
  const shopDomain = error.shop;
  console.log(`🔄 [FALLBACK_UNINSTALL] Detected uninstalled app for shop: ${shopDomain}. Marking as disconnected...`);
  
  try {
    // Find ALL connections for this shop (handle duplicates properly)
    const connections = await storage.getStoreConnectionsByShopDomain(shopDomain);
    
    if (connections.length > 0) {
      for (const connection of connections) {
        await storage.updateStoreConnection(connection.id, {
          status: 'disconnected',
          isConnected: false,
          accessToken: 'REVOKED_VIA_API_ERROR',
          updatedAt: new Date()
        });
        console.log(`✅ [FALLBACK_UNINSTALL] Store disconnected via fallback: ${connection.id} (${connection.storeName || shopDomain})`);
      }
      return true;
    } else {
      console.warn(`⚠️ [FALLBACK_UNINSTALL] No connection found for shop: ${shopDomain}`);
      return false;
    }
  } catch (dbError) {
    console.error('❌ [FALLBACK_UNINSTALL] Failed to mark store as disconnected:', dbError);
    return false;
  }
}
