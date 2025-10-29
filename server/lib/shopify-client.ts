import fetch from 'node-fetch';

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
  private apiVersion = '2025-10';
  
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
    const result = await this.makeRequest(`/products/${productId}.json`);
    return result.product;
  }

  async getProductMetafields(productId: string): Promise<any[]> {
    const result = await this.makeRequest(`/products/${productId}/metafields.json`);
    return result.metafields || [];
  }

  async updateProduct(productId: string, updates: ShopifyProductUpdate): Promise<ShopifyProduct> {
    const result = await this.makeRequest(`/products/${productId}.json`, 'PUT', {
      product: updates
    });
    return result.product;
  }

  async updateProductMetafields(productId: string, metafields: ShopifyMetafieldUpdate[]): Promise<void> {
    const existingMetafields = await this.getProductMetafields(productId);
    
    for (const metafield of metafields) {
      const existing = existingMetafields.find(
        m => m.namespace === metafield.namespace && m.key === metafield.key
      );
      
      if (existing) {
        await this.makeRequest(`/metafields/${existing.id}.json`, 'PUT', {
          metafield: {
            id: existing.id,
            value: metafield.value,
            type: metafield.type
          }
        });
      } else {
        await this.makeRequest(`/products/${productId}/metafields.json`, 'POST', {
          metafield: {
            ...metafield,
            owner_resource: 'product',
            owner_id: productId
          }
        });
      }
    }
  }

  async updateProductImage(productId: string, imageId: string, altText: string): Promise<void> {
    await this.makeRequest(`/products/${productId}/images/${imageId}.json`, 'PUT', {
      image: {
        id: parseInt(imageId),
        alt: altText
      }
    });
  }

  async getAllProducts(limit: number = 250): Promise<ShopifyProduct[]> {
    const result = await this.makeRequest(`/products.json?limit=${limit}`);
    return result.products;
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
    description?: string;
    seoTitle?: string;
    metaDescription?: string;
    imageAltTexts?: Array<{ imageId: string; altText: string }>;
  }): Promise<ShopifyProduct> {
    const updates: ShopifyProductUpdate = {};

    if (content.description) {
      updates.body_html = content.description;
    }

    const updatedProduct = await this.updateProduct(productId, updates);

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
      await this.makeRequest('/shop.json');
      return true;
    } catch (error) {
      console.error('Shopify connection test failed:', error);
      return false;
    }
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
