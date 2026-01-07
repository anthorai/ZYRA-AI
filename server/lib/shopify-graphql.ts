import fetch from 'node-fetch';

export interface ShopifyGraphQLProduct {
  id: string;
  legacyResourceId: string;
  title: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  status: string;
  publishedAt: string | null;
  updatedAt: string;
  variants: {
    edges: Array<{
      node: {
        id: string;
        legacyResourceId: string;
        title: string;
        price: string;
        sku: string;
      };
    }>;
  };
  images: {
    edges: Array<{
      node: {
        id: string;
        altText: string | null;
        url: string;
      };
    }>;
  };
  media: {
    edges: Array<{
      node: {
        id: string;
        alt: string | null;
        mediaContentType: string;
        preview?: {
          image?: {
            url: string;
          };
        };
      };
    }>;
  };
  metafields: {
    edges: Array<{
      node: {
        id: string;
        namespace: string;
        key: string;
        value: string;
        type: string;
      };
    }>;
  };
}

export interface ShopifyGraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: Record<string, unknown>;
  }>;
  extensions?: {
    cost?: {
      requestedQueryCost: number;
      actualQueryCost: number;
      throttleStatus: {
        maximumAvailable: number;
        currentlyAvailable: number;
        restoreRate: number;
      };
    };
  };
}

export class ShopifyGraphQLClient {
  private shop: string;
  private accessToken: string;
  private apiVersion = '2024-10';
  private requestQueue: Array<() => Promise<any>> = [];
  private lastRequestTime: number = 0;
  private readonly minRequestInterval: number = 100;
  private isProcessingQueue: boolean = false;

  constructor(shop: string, accessToken: string) {
    this.shop = shop;
    this.accessToken = accessToken;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.requestQueue.length > 0) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
          await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
        }
        
        const request = this.requestQueue.shift();
        if (request) {
          this.lastRequestTime = Date.now();
          try {
            await request();
          } catch (error) {
            console.error('Shopify GraphQL request failed:', error);
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

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

  async query<T>(query: string, variables?: Record<string, unknown>): Promise<ShopifyGraphQLResponse<T>> {
    return this.queueRequest(async () => {
      const url = `https://${this.shop}/admin/api/${this.apiVersion}/graphql.json`;
      
      let retries = 0;
      const maxRetries = 3;
      
      while (retries <= maxRetries) {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': this.accessToken,
          },
          body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          if (response.status === 429 && retries < maxRetries) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '2');
            console.warn(`Shopify GraphQL rate limit hit. Retrying after ${retryAfter}s (attempt ${retries + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            retries++;
            continue;
          }
          
          throw new Error(`Shopify GraphQL Error (${response.status}): ${errorText}`);
        }

        const result = await response.json() as ShopifyGraphQLResponse<T>;
        
        if (result.extensions?.cost?.throttleStatus) {
          const { currentlyAvailable, maximumAvailable } = result.extensions.cost.throttleStatus;
          if (currentlyAvailable / maximumAvailable < 0.1) {
            console.warn(`Shopify GraphQL throttle warning: ${currentlyAvailable}/${maximumAvailable} points available`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        return result;
      }
      
      throw new Error('Shopify GraphQL: Maximum retries exceeded');
    });
  }

  async getProduct(productId: string): Promise<ShopifyGraphQLProduct | null> {
    const gid = productId.includes('gid://') ? productId : `gid://shopify/Product/${productId}`;
    
    const response = await this.query<{ product: ShopifyGraphQLProduct }>(`
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          legacyResourceId
          title
          descriptionHtml
          vendor
          productType
          tags
          status
          publishedAt
          updatedAt
          variants(first: 100) {
            edges {
              node {
                id
                legacyResourceId
                title
                price
                sku
              }
            }
          }
          images(first: 50) {
            edges {
              node {
                id
                altText
                url
              }
            }
          }
          media(first: 50) {
            edges {
              node {
                id
                alt
                mediaContentType
                preview {
                  image {
                    url
                  }
                }
              }
            }
          }
          metafields(first: 20) {
            edges {
              node {
                id
                namespace
                key
                value
                type
              }
            }
          }
        }
      }
    `, { id: gid });

    if (response.errors?.length) {
      console.error('GraphQL errors fetching product:', response.errors);
      throw new Error(response.errors[0].message);
    }

    return response.data?.product || null;
  }

  async getAllProducts(first: number = 250, cursor?: string): Promise<{
    products: ShopifyGraphQLProduct[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    const response = await this.query<{
      products: {
        edges: Array<{ node: ShopifyGraphQLProduct; cursor: string }>;
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    }>(`
      query getAllProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          edges {
            cursor
            node {
              id
              legacyResourceId
              title
              descriptionHtml
              vendor
              productType
              tags
              status
              publishedAt
              updatedAt
              variants(first: 100) {
                edges {
                  node {
                    id
                    legacyResourceId
                    title
                    price
                    sku
                  }
                }
              }
              images(first: 10) {
                edges {
                  node {
                    id
                    altText
                    url
                  }
                }
              }
              media(first: 10) {
                edges {
                  node {
                    id
                    alt
                    mediaContentType
                    preview {
                      image {
                        url
                      }
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `, { first, after: cursor });

    if (response.errors?.length) {
      console.error('GraphQL errors fetching products:', response.errors);
      throw new Error(response.errors[0].message);
    }

    return {
      products: response.data?.products.edges.map(edge => edge.node) || [],
      pageInfo: response.data?.products.pageInfo || { hasNextPage: false, endCursor: null }
    };
  }

  async fetchAllProducts(): Promise<ShopifyGraphQLProduct[]> {
    const allProducts: ShopifyGraphQLProduct[] = [];
    let cursor: string | undefined = undefined;
    let hasNextPage = true;

    while (hasNextPage) {
      const result = await this.getAllProducts(250, cursor);
      allProducts.push(...result.products);
      hasNextPage = result.pageInfo.hasNextPage;
      cursor = result.pageInfo.endCursor || undefined;
    }

    return allProducts;
  }

  async updateProduct(productId: string, input: {
    title?: string;
    descriptionHtml?: string;
    productType?: string;
    tags?: string[];
    vendor?: string;
  }): Promise<ShopifyGraphQLProduct | null> {
    const gid = productId.includes('gid://') ? productId : `gid://shopify/Product/${productId}`;
    
    const response = await this.query<{
      productUpdate: {
        product: ShopifyGraphQLProduct;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(`
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            legacyResourceId
            title
            descriptionHtml
            vendor
            productType
            tags
            status
            updatedAt
            variants(first: 100) {
              edges {
                node {
                  id
                  legacyResourceId
                  title
                  price
                  sku
                }
              }
            }
            images(first: 50) {
              edges {
                node {
                  id
                  altText
                  url
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `, { input: { id: gid, ...input } });

    if (response.errors?.length) {
      console.error('GraphQL errors updating product:', response.errors);
      throw new Error(response.errors[0].message);
    }

    const userErrors = response.data?.productUpdate.userErrors;
    if (userErrors?.length) {
      throw new Error(`Product update failed: ${userErrors.map(e => e.message).join(', ')}`);
    }

    return response.data?.productUpdate.product || null;
  }

  async updateVariantPrice(variantId: string, price: string): Promise<void> {
    const gid = variantId.includes('gid://') ? variantId : `gid://shopify/ProductVariant/${variantId}`;
    
    const response = await this.query<{
      productVariantUpdate: {
        productVariant: { id: string; price: string };
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(`
      mutation updateVariantPrice($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant {
            id
            price
          }
          userErrors {
            field
            message
          }
        }
      }
    `, { input: { id: gid, price } });

    if (response.errors?.length) {
      throw new Error(response.errors[0].message);
    }

    const userErrors = response.data?.productVariantUpdate.userErrors;
    if (userErrors?.length) {
      throw new Error(`Variant update failed: ${userErrors.map(e => e.message).join(', ')}`);
    }
  }

  async updateProductImage(productId: string, imageId: string, altText: string): Promise<void> {
    const productGid = productId.includes('gid://') ? productId : `gid://shopify/Product/${productId}`;
    const mediaGid = imageId.includes('gid://shopify/MediaImage/') 
      ? imageId 
      : imageId.includes('gid://shopify/ProductImage/')
        ? imageId.replace('ProductImage', 'MediaImage')
        : `gid://shopify/MediaImage/${imageId}`;
    
    const response = await this.query<{
      productUpdateMedia: {
        media: Array<{ id: string; alt: string | null }>;
        mediaUserErrors: Array<{ field: string[]; message: string }>;
      };
    }>(`
      mutation productUpdateMedia($productId: ID!, $media: [UpdateMediaInput!]!) {
        productUpdateMedia(productId: $productId, media: $media) {
          media {
            id
            alt
          }
          mediaUserErrors {
            field
            message
          }
        }
      }
    `, { productId: productGid, media: [{ id: mediaGid, alt: altText }] });

    if (response.errors?.length) {
      throw new Error(response.errors[0].message);
    }

    const userErrors = response.data?.productUpdateMedia.mediaUserErrors;
    if (userErrors?.length) {
      throw new Error(`Image update failed: ${userErrors.map(e => e.message).join(', ')}`);
    }
  }

  async setProductMetafield(productId: string, namespace: string, key: string, value: string, type: string): Promise<void> {
    const productGid = productId.includes('gid://') ? productId : `gid://shopify/Product/${productId}`;
    
    const response = await this.query<{
      metafieldsSet: {
        metafields: Array<{ id: string; namespace: string; key: string; value: string }>;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(`
      mutation setMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      metafields: [{
        ownerId: productGid,
        namespace,
        key,
        value,
        type
      }]
    });

    if (response.errors?.length) {
      throw new Error(response.errors[0].message);
    }

    const userErrors = response.data?.metafieldsSet.userErrors;
    if (userErrors?.length) {
      throw new Error(`Metafield update failed: ${userErrors.map(e => e.message).join(', ')}`);
    }
  }

  async getShopInfo(): Promise<{ name: string; email: string; currencyCode: string; enabledPresentmentCurrencies: string[] } | null> {
    const response = await this.query<{
      shop: { name: string; email: string; currencyCode: string; enabledPresentmentCurrencies: string[] };
    }>(`
      query getShopInfo {
        shop {
          name
          email
          currencyCode
          enabledPresentmentCurrencies
        }
      }
    `);

    if (response.errors?.length) {
      console.error('GraphQL errors fetching shop info:', response.errors);
      return null;
    }

    return response.data?.shop || null;
  }

  async getShopCurrency(): Promise<{ currencyCode: string; enabledPresentmentCurrencies: string[] } | null> {
    const response = await this.query<{
      shop: { currencyCode: string; enabledPresentmentCurrencies: string[] };
    }>(`
      query ShopCurrency {
        shop {
          currencyCode
          enabledPresentmentCurrencies
        }
      }
    `);

    if (response.errors?.length) {
      console.error('GraphQL errors fetching shop currency:', response.errors);
      return null;
    }

    return response.data?.shop || null;
  }

  async testConnection(): Promise<boolean> {
    try {
      const shop = await this.getShopInfo();
      return !!shop;
    } catch (error) {
      console.error('Shopify GraphQL connection test failed:', error);
      return false;
    }
  }

  async createAppSubscription(
    planName: string,
    returnUrl: string,
    priceAmount: number,
    currencyCode: string = 'USD',
    interval: 'EVERY_30_DAYS' | 'ANNUAL' = 'EVERY_30_DAYS',
    test: boolean = false
  ): Promise<{ confirmationUrl: string; subscriptionId: string } | null> {
    const lineItems = [
      {
        plan: {
          appRecurringPricingDetails: {
            price: {
              amount: priceAmount,
              currencyCode: currencyCode
            },
            interval: interval
          }
        }
      }
    ];

    const response = await this.query<{
      appSubscriptionCreate: {
        appSubscription: {
          id: string;
          status: string;
        } | null;
        confirmationUrl: string | null;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(`
      mutation appSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!, $test: Boolean) {
        appSubscriptionCreate(
          name: $name
          returnUrl: $returnUrl
          lineItems: $lineItems
          test: $test
        ) {
          appSubscription {
            id
            status
          }
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }
    `, { name: planName, returnUrl, lineItems, test });

    if (response.errors?.length) {
      console.error('GraphQL errors creating app subscription:', response.errors);
      throw new Error(response.errors[0].message);
    }

    const userErrors = response.data?.appSubscriptionCreate.userErrors;
    if (userErrors?.length) {
      throw new Error(`Subscription creation failed: ${userErrors.map(e => e.message).join(', ')}`);
    }

    const result = response.data?.appSubscriptionCreate;
    if (!result?.confirmationUrl || !result?.appSubscription?.id) {
      return null;
    }

    return {
      confirmationUrl: result.confirmationUrl,
      subscriptionId: result.appSubscription.id
    };
  }

  async getAppSubscription(subscriptionId: string): Promise<{
    id: string;
    status: string;
    name: string;
    currentPeriodEnd: string | null;
  } | null> {
    const response = await this.query<{
      node: {
        id: string;
        status: string;
        name: string;
        currentPeriodEnd: string | null;
      } | null;
    }>(`
      query getAppSubscription($id: ID!) {
        node(id: $id) {
          ... on AppSubscription {
            id
            status
            name
            currentPeriodEnd
          }
        }
      }
    `, { id: subscriptionId });

    if (response.errors?.length) {
      console.error('GraphQL errors fetching app subscription:', response.errors);
      return null;
    }

    return response.data?.node || null;
  }

  async getCurrentActiveSubscription(): Promise<{
    id: string;
    status: string;
    name: string;
    currentPeriodEnd: string | null;
  } | null> {
    const response = await this.query<{
      currentAppInstallation: {
        activeSubscriptions: Array<{
          id: string;
          status: string;
          name: string;
          currentPeriodEnd: string | null;
        }>;
      };
    }>(`
      query getCurrentSubscription {
        currentAppInstallation {
          activeSubscriptions {
            id
            status
            name
            currentPeriodEnd
          }
        }
      }
    `);

    if (response.errors?.length) {
      console.error('GraphQL errors fetching current subscription:', response.errors);
      return null;
    }

    const subscriptions = response.data?.currentAppInstallation?.activeSubscriptions;
    return subscriptions?.[0] || null;
  }
}

export function graphqlProductToRest(product: ShopifyGraphQLProduct): {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  status: string;
  updated_at: string;
  variants: Array<{ id: number; title: string; price: string; sku: string }>;
  images: Array<{ id: number; src: string; alt: string; mediaId?: string }>;
} {
  const imageMediaMap = new Map<string, string>();
  if (product.media?.edges) {
    product.media.edges.forEach(edge => {
      if (edge.node.mediaContentType === 'IMAGE' && edge.node.preview?.image?.url) {
        imageMediaMap.set(edge.node.preview.image.url, edge.node.id);
      }
    });
  }

  return {
    id: parseInt(product.legacyResourceId),
    title: product.title,
    body_html: product.descriptionHtml,
    vendor: product.vendor,
    product_type: product.productType,
    tags: product.tags.join(', '),
    status: product.status.toLowerCase(),
    updated_at: product.updatedAt,
    variants: product.variants.edges.map(edge => ({
      id: parseInt(edge.node.legacyResourceId),
      title: edge.node.title,
      price: edge.node.price,
      sku: edge.node.sku || ''
    })),
    images: product.images.edges.map(edge => {
      const mediaId = imageMediaMap.get(edge.node.url) || 
        (product.media?.edges.find(m => m.node.mediaContentType === 'IMAGE')?.node.id);
      return {
        id: parseInt(edge.node.id.replace('gid://shopify/ProductImage/', '')),
        src: edge.node.url,
        alt: edge.node.altText || '',
        mediaId: mediaId
      };
    })
  };
}

export async function getShopifyGraphQLClient(shop: string, accessToken: string): Promise<ShopifyGraphQLClient> {
  const client = new ShopifyGraphQLClient(shop, accessToken);
  const isConnected = await client.testConnection();
  
  if (!isConnected) {
    throw new Error('Failed to connect to Shopify GraphQL API. Please check your credentials.');
  }
  
  return client;
}
