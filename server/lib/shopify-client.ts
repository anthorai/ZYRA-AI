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

  constructor(shop: string, accessToken: string) {
    this.shop = shop;
    this.accessToken = accessToken;
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
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

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API Error (${response.status}): ${errorText}`);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return null;
    }

    return await response.json();
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
    for (const metafield of metafields) {
      await this.makeRequest(`/products/${productId}/metafields.json`, 'POST', {
        metafield: {
          ...metafield,
          owner_resource: 'product',
          owner_id: productId
        }
      });
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
