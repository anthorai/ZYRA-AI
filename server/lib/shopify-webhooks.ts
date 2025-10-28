/**
 * Shopify Webhook Registration Utility
 * Automatically registers mandatory compliance webhooks with Shopify
 */

interface WebhookRegistration {
  topic: string;
  address: string;
  format: 'json';
}

/**
 * Register all mandatory Shopify webhooks for compliance
 * @param shop - The shop domain (e.g., mystore.myshopify.com)
 * @param accessToken - The Shopify access token
 * @param baseUrl - The base URL of your app (e.g., https://yourapp.com)
 */
export async function registerShopifyWebhooks(
  shop: string,
  accessToken: string,
  baseUrl: string
): Promise<{ success: boolean; registered: string[]; errors: string[] }> {
  const registered: string[] = [];
  const errors: string[] = [];

  // Define all mandatory webhooks
  const mandatoryWebhooks: WebhookRegistration[] = [
    {
      topic: 'app/uninstalled',
      address: `${baseUrl}/api/webhooks/shopify/app_uninstalled`,
      format: 'json'
    },
    {
      topic: 'customers/data_request',
      address: `${baseUrl}/api/webhooks/shopify/customers/data_request`,
      format: 'json'
    },
    {
      topic: 'customers/redact',
      address: `${baseUrl}/api/webhooks/shopify/customers/redact`,
      format: 'json'
    },
    {
      topic: 'shop/redact',
      address: `${baseUrl}/api/webhooks/shopify/shop/redact`,
      format: 'json'
    }
  ];

  console.log('📡 Registering Shopify webhooks for shop:', shop);

  for (const webhook of mandatoryWebhooks) {
    try {
      // Check if webhook already exists
      const existingWebhooksUrl = `https://${shop}/admin/api/2025-10/webhooks.json?topic=${webhook.topic}`;
      const existingResponse = await fetch(existingWebhooksUrl, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      if (existingResponse.ok) {
        const existingData = await existingResponse.json();
        const existingWebhooks = existingData.webhooks || [];

        // Delete existing webhooks with the same topic to avoid duplicates
        for (const existing of existingWebhooks) {
          const deleteUrl = `https://${shop}/admin/api/2025-10/webhooks/${existing.id}.json`;
          await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
              'X-Shopify-Access-Token': accessToken
            }
          });
          console.log(`🗑️ Deleted existing webhook: ${webhook.topic}`);
        }
      }

      // Register new webhook
      const registerUrl = `https://${shop}/admin/api/2025-10/webhooks.json`;
      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ webhook })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Registered webhook: ${webhook.topic} -> ${webhook.address}`);
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
    registered: registered.length,
    failed: errors.length
  });

  return {
    success: errors.length === 0,
    registered,
    errors
  };
}

/**
 * Verify that all mandatory webhooks are registered
 * @param shop - The shop domain
 * @param accessToken - The Shopify access token
 */
export async function verifyWebhooksRegistered(
  shop: string,
  accessToken: string
): Promise<{ allRegistered: boolean; missing: string[] }> {
  const requiredTopics = [
    'app/uninstalled',
    'customers/data_request',
    'customers/redact',
    'shop/redact'
  ];

  try {
    const response = await fetch(`https://${shop}/admin/api/2025-10/webhooks.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch webhooks');
    }

    const data = await response.json();
    const webhooks = data.webhooks || [];
    const registeredTopics = webhooks.map((w: any) => w.topic);

    const missing = requiredTopics.filter(topic => !registeredTopics.includes(topic));

    return {
      allRegistered: missing.length === 0,
      missing
    };
  } catch (error) {
    console.error('Error verifying webhooks:', error);
    return {
      allRegistered: false,
      missing: requiredTopics
    };
  }
}
