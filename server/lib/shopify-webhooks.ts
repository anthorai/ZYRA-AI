/**
 * Shopify Webhook Registration Utility
 * Registers app-specific webhooks with Shopify via GraphQL/REST APIs
 * 
 * NOTE: GDPR compliance webhooks (customers/data_request, customers/redact, shop/redact)
 * are configured in shopify.app.toml and handled by Shopify automatically during app deployment.
 * They should NOT be registered via API - only declared in the TOML config file.
 */

interface WebhookRegistration {
  topic: string;
  address: string;
  format: 'json';
}

/**
 * Get the production base URL for webhooks
 * CRITICAL: Always uses PRODUCTION_DOMAIN to ensure Shopify compliance
 * No fallback is allowed for compliance webhooks
 */
function getProductionBaseUrl(): string {
  // CRITICAL: Production domain is REQUIRED for Shopify GDPR compliance
  const productionDomain = process.env.PRODUCTION_DOMAIN;
  if (!productionDomain) {
    console.error('❌ CRITICAL: PRODUCTION_DOMAIN environment variable is not set!');
    console.error('❌ Shopify compliance webhooks will NOT work without a production domain.');
    console.error('❌ Set PRODUCTION_DOMAIN=https://yourdomain.com in your environment.');
    throw new Error('PRODUCTION_DOMAIN is required for Shopify compliance webhooks');
  }
  
  // Ensure proper format
  const url = productionDomain.startsWith('http') ? productionDomain : `https://${productionDomain}`;
  console.log('📍 Using production domain for webhooks:', url);
  return url;
}

/**
 * Register webhooks using GraphQL Admin API
 * This is the preferred method for 2024+
 */
async function registerWebhookViaGraphQL(
  shop: string,
  accessToken: string,
  topic: string,
  callbackUrl: string
): Promise<{ success: boolean; error?: string }> {
  // Convert REST topic format to GraphQL enum format
  // e.g., "customers/data_request" -> "CUSTOMERS_DATA_REQUEST"
  const graphqlTopic = topic.toUpperCase().replace(/\//g, '_');
  
  const mutation = `
    mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
      webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
        webhookSubscription {
          id
          topic
          endpoint {
            __typename
            ... on WebhookHttpEndpoint {
              callbackUrl
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          topic: graphqlTopic,
          webhookSubscription: {
            callbackUrl,
            format: 'JSON'
          }
        }
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }

    const data = await response.json();
    
    if (data.errors) {
      return { success: false, error: data.errors.map((e: any) => e.message).join(', ') };
    }
    
    const result = data.data?.webhookSubscriptionCreate;
    if (result?.userErrors?.length > 0) {
      return { success: false, error: result.userErrors.map((e: any) => e.message).join(', ') };
    }
    
    if (result?.webhookSubscription?.id) {
      return { success: true };
    }
    
    return { success: false, error: 'Unknown error - no webhook ID returned' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Delete existing webhook via GraphQL
 */
async function deleteWebhookViaGraphQL(
  shop: string,
  accessToken: string,
  webhookId: string
): Promise<boolean> {
  const mutation = `
    mutation webhookSubscriptionDelete($id: ID!) {
      webhookSubscriptionDelete(id: $id) {
        deletedWebhookSubscriptionId
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: mutation,
        variables: { id: webhookId }
      })
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get existing webhooks via GraphQL
 */
async function getExistingWebhooksViaGraphQL(
  shop: string,
  accessToken: string
): Promise<Array<{ id: string; topic: string; callbackUrl: string }>> {
  const query = `
    query {
      webhookSubscriptions(first: 50) {
        edges {
          node {
            id
            topic
            endpoint {
              __typename
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) return [];

    const data = await response.json();
    const edges = data.data?.webhookSubscriptions?.edges || [];
    
    return edges.map((edge: any) => ({
      id: edge.node.id,
      topic: edge.node.topic,
      callbackUrl: edge.node.endpoint?.callbackUrl || ''
    }));
  } catch {
    return [];
  }
}

/**
 * Register all mandatory Shopify webhooks for compliance
 * Uses production domain and tries GraphQL first, then REST as fallback
 * @param shop - The shop domain (e.g., mystore.myshopify.com)
 * @param accessToken - The Shopify access token
 * @param baseUrl - Optional override for base URL (defaults to PRODUCTION_DOMAIN)
 */
export async function registerShopifyWebhooks(
  shop: string,
  accessToken: string,
  baseUrl?: string
): Promise<{ success: boolean; registered: string[]; errors: string[] }> {
  const registered: string[] = [];
  const errors: string[] = [];

  // Always use production domain for webhooks
  const webhookBaseUrl = baseUrl || getProductionBaseUrl();
  
  console.log('📡 Registering Shopify webhooks for shop:', shop);
  console.log('📡 Using webhook base URL:', webhookBaseUrl);

  // Define app-specific webhooks to register via API
  // NOTE: GDPR compliance webhooks (customers/data_request, customers/redact, shop/redact)
  // are configured in shopify.app.toml and NOT registered here - Shopify handles them automatically
  const appWebhooks: WebhookRegistration[] = [
    {
      topic: 'app/uninstalled',
      address: `${webhookBaseUrl}/api/webhooks/shopify/app_uninstalled`,
      format: 'json'
    },
    {
      topic: 'orders/paid',
      address: `${webhookBaseUrl}/api/webhooks/shopify/orders/paid`,
      format: 'json'
    }
  ];

  // First, get existing webhooks via GraphQL
  console.log('📋 Fetching existing webhooks...');
  const existingWebhooks = await getExistingWebhooksViaGraphQL(shop, accessToken);
  console.log(`📋 Found ${existingWebhooks.length} existing webhooks`);

  for (const webhook of appWebhooks) {
    try {
      // Check if webhook already exists with correct URL
      const existingMatch = existingWebhooks.find(
        w => w.topic === webhook.topic.toUpperCase().replace(/\//g, '_') && 
             w.callbackUrl === webhook.address
      );
      
      if (existingMatch) {
        console.log(`✅ Webhook already registered: ${webhook.topic} -> ${webhook.address}`);
        registered.push(webhook.topic);
        continue;
      }

      // Delete any existing webhooks with same topic but different URL
      const existingWithTopic = existingWebhooks.filter(
        w => w.topic === webhook.topic.toUpperCase().replace(/\//g, '_')
      );
      
      for (const existing of existingWithTopic) {
        console.log(`🗑️ Deleting outdated webhook: ${webhook.topic} (old URL: ${existing.callbackUrl})`);
        await deleteWebhookViaGraphQL(shop, accessToken, existing.id);
      }

      // Try GraphQL first
      console.log(`📝 Registering webhook via GraphQL: ${webhook.topic}`);
      const graphqlResult = await registerWebhookViaGraphQL(
        shop,
        accessToken,
        webhook.topic,
        webhook.address
      );

      if (graphqlResult.success) {
        console.log(`✅ Registered webhook via GraphQL: ${webhook.topic} -> ${webhook.address}`);
        registered.push(webhook.topic);
        continue;
      }

      // If GraphQL fails, try REST API as fallback
      console.log(`⚠️ GraphQL failed (${graphqlResult.error}), trying REST API...`);
      
      // First delete existing via REST
      const existingWebhooksUrl = `https://${shop}/admin/api/2025-01/webhooks.json?topic=${webhook.topic}`;
      const existingResponse = await fetch(existingWebhooksUrl, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      if (existingResponse.ok) {
        const existingData = await existingResponse.json();
        const existingRestWebhooks = existingData.webhooks || [];

        for (const existing of existingRestWebhooks) {
          const deleteUrl = `https://${shop}/admin/api/2025-01/webhooks/${existing.id}.json`;
          await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
              'X-Shopify-Access-Token': accessToken
            }
          });
          console.log(`🗑️ Deleted existing REST webhook: ${webhook.topic}`);
        }
      }

      // Register via REST API
      const registerUrl = `https://${shop}/admin/api/2025-01/webhooks.json`;
      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ webhook })
      });

      if (response.ok) {
        console.log(`✅ Registered webhook via REST: ${webhook.topic} -> ${webhook.address}`);
        registered.push(webhook.topic);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to register webhook ${webhook.topic}:`, errorText);
        errors.push(`${webhook.topic}: ${errorText}`);
      }
    } catch (error) {
      console.error(`❌ Error registering webhook ${webhook.topic}:`, error);
      errors.push(`${webhook.topic}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log('📊 Webhook registration summary:', {
    baseUrl: webhookBaseUrl,
    registered: registered.length,
    failed: errors.length,
    topics: registered
  });

  return {
    success: errors.length === 0,
    registered,
    errors
  };
}

/**
 * Verify that app-specific webhooks are registered with correct URLs
 * NOTE: GDPR compliance webhooks are configured in shopify.app.toml and verified by Shopify during app review
 * @param shop - The shop domain
 * @param accessToken - The Shopify access token
 */
export async function verifyWebhooksRegistered(
  shop: string,
  accessToken: string
): Promise<{ allRegistered: boolean; missing: string[]; webhooks: Array<{ topic: string; url: string }> }> {
  // Only check app-specific webhooks registered via API
  // GDPR compliance webhooks (CUSTOMERS_DATA_REQUEST, CUSTOMERS_REDACT, SHOP_REDACT) 
  // are configured in shopify.app.toml and managed by Shopify
  const requiredTopics = [
    'APP_UNINSTALLED',
    'ORDERS_PAID'
  ];

  const productionBaseUrl = getProductionBaseUrl();

  try {
    const webhooks = await getExistingWebhooksViaGraphQL(shop, accessToken);
    const registeredTopics = webhooks.map(w => w.topic);
    
    const missing = requiredTopics.filter(topic => !registeredTopics.includes(topic));
    
    // Also check if URLs point to production domain
    const webhooksWithWrongUrl = webhooks.filter(
      w => requiredTopics.includes(w.topic) && !w.callbackUrl.startsWith(productionBaseUrl)
    );
    
    if (webhooksWithWrongUrl.length > 0) {
      console.log('⚠️ Webhooks with wrong URLs detected:', webhooksWithWrongUrl);
      webhooksWithWrongUrl.forEach(w => {
        if (!missing.includes(w.topic)) {
          missing.push(w.topic + ' (wrong URL)');
        }
      });
    }

    return {
      allRegistered: missing.length === 0,
      missing,
      webhooks: webhooks.map(w => ({ topic: w.topic, url: w.callbackUrl }))
    };
  } catch (error) {
    console.error('Error verifying webhooks:', error);
    return {
      allRegistered: false,
      missing: requiredTopics,
      webhooks: []
    };
  }
}

/**
 * Force re-register all webhooks with production URLs
 * Useful for fixing webhook URL issues
 */
export async function forceReregisterWebhooks(
  shop: string,
  accessToken: string
): Promise<{ success: boolean; registered: string[]; errors: string[] }> {
  console.log('🔄 Force re-registering all webhooks with production URLs...');
  
  // Get existing webhooks and delete them all first
  const existingWebhooks = await getExistingWebhooksViaGraphQL(shop, accessToken);
  
  for (const webhook of existingWebhooks) {
    console.log(`🗑️ Deleting webhook: ${webhook.topic}`);
    await deleteWebhookViaGraphQL(shop, accessToken, webhook.id);
  }
  
  // Now register fresh
  return registerShopifyWebhooks(shop, accessToken);
}
