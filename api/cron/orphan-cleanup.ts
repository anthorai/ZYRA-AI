import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Daily Cron Job: Clean up orphaned products
 * 
 * This job runs daily to catch any products that were deleted from Shopify
 * but weren't caught by the webhook (e.g., due to webhook failures).
 * 
 * It fetches products from Shopify for each active connection and removes
 * any products from our database that no longer exist in Shopify.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log(`[Orphan Cleanup Cron] 🧹 Starting at ${timestamp}`);
  
  // Verify this is actually a cron job from Vercel or internal service
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET || process.env.INTERNAL_SERVICE_TOKEN;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[Orphan Cleanup Cron] ❌ Unauthorized access attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Import Supabase client and database
    const { supabase } = await import('../../server/lib/supabase');
    const { db } = await import('../../server/db');
    const { products, seoMeta, storeConnections } = await import('../../shared/schema');
    const { eq, and, isNotNull } = await import('drizzle-orm');
    
    // Get all active Shopify connections
    const { data: connections, error: connError } = await supabase
      .from('store_connections')
      .select('*')
      .eq('platform', 'shopify')
      .eq('status', 'active');
    
    if (connError) {
      throw new Error(`Failed to fetch connections: ${connError.message}`);
    }
    
    if (!connections || connections.length === 0) {
      console.log('[Orphan Cleanup Cron] ℹ️ No active Shopify connections found');
      return res.status(200).json({ 
        success: true, 
        message: 'No stores to clean',
        duration: Date.now() - startTime
      });
    }
    
    console.log(`[Orphan Cleanup Cron] Found ${connections.length} active connection(s)`);
    
    const results: Array<{ 
      store: string; 
      userId: string; 
      orphansDeleted: number; 
      success: boolean; 
      error?: string 
    }> = [];
    
    for (const connection of connections) {
      const userId = connection.user_id;
      const storeUrl = connection.store_url;
      const storeName = connection.store_name || storeUrl || 'Unknown';
      const accessToken = connection.access_token;
      
      if (!storeUrl || !accessToken) {
        results.push({
          store: storeName,
          userId,
          orphansDeleted: 0,
          success: false,
          error: 'Missing store URL or access token'
        });
        continue;
      }
      
      try {
        console.log(`[Orphan Cleanup Cron] Processing store: ${storeName}`);
        
        // Fetch ALL products from Shopify with pagination
        // Use status=any to include active, draft, and archived products
        let allShopifyProducts: any[] = [];
        let pageInfo: string | null = null;
        let isFirstRequest = true;
        
        do {
          const url = isFirstRequest
            ? `${storeUrl}/admin/api/2025-10/products.json?limit=250&status=any`
            : `${storeUrl}/admin/api/2025-10/products.json?limit=250&page_info=${pageInfo}`;
          
          const shopifyResponse = await fetch(url, {
            headers: { 'X-Shopify-Access-Token': accessToken }
          });
          
          if (!shopifyResponse.ok) {
            const errorText = await shopifyResponse.text();
            throw new Error(`Shopify API error: ${shopifyResponse.status} - ${errorText}`);
          }
          
          // Always parse the response body
          const shopifyData = await shopifyResponse.json();
          const fetchedProducts = shopifyData.products || [];
          allShopifyProducts = [...allShopifyProducts, ...fetchedProducts];
          
          // Parse Link header for next pagination cursor
          const linkHeader = shopifyResponse.headers.get('Link') || '';
          const nextLink = linkHeader.split(',').find((l: string) => l.includes('rel="next"'));
          pageInfo = nextLink ? (nextLink.match(/page_info=([^>&]*)/)?.[1] || null) : null;
          isFirstRequest = false;
        } while (pageInfo);
        
        const shopifyProductIds = allShopifyProducts.map((p: any) => p.id.toString());
        
        console.log(`[Orphan Cleanup Cron] Shopify has ${allShopifyProducts.length} products for ${storeName}`);
        
        // Find orphaned products in our database
        if (!db) {
          throw new Error('Database connection not available');
        }
        
        const userProducts = await db
          .select({ id: products.id, shopifyId: products.shopifyId, name: products.name })
          .from(products)
          .where(and(
            eq(products.userId, userId),
            isNotNull(products.shopifyId)
          ));
        
        let orphansDeleted = 0;
        
        const localProductCount = userProducts.filter(p => p.shopifyId).length;
        
        // SAFEGUARD: Skip cleanup if Shopify returns significantly fewer products
        // This prevents mass deletion during API errors or rate limiting
        if (allShopifyProducts.length < localProductCount * 0.5 && localProductCount > 10) {
          console.warn(`[Orphan Cleanup Cron] ⚠️ Skipping cleanup for ${storeName}: Shopify returned ${allShopifyProducts.length} products but we have ${localProductCount} locally. Possible API issue.`);
          results.push({
            store: storeName,
            userId,
            orphansDeleted: 0,
            success: true,
            error: 'Skipped: Shopify returned fewer products than expected'
          });
          continue;
        }
        
        for (const product of userProducts) {
          if (product.shopifyId && !shopifyProductIds.includes(product.shopifyId)) {
            try {
              // Delete the orphaned product
              await db!.delete(products).where(eq(products.id, product.id));
              
              // Clean up related SEO meta
              await db!.delete(seoMeta).where(eq(seoMeta.productId, product.id));
              
              orphansDeleted++;
              console.log(`[Orphan Cleanup Cron] 🗑️ Deleted orphan: ${product.name} (${product.shopifyId})`);
            } catch (deleteError) {
              console.error(`[Orphan Cleanup Cron] ⚠️ Failed to delete:`, deleteError);
            }
          }
        }
        
        results.push({
          store: storeName,
          userId,
          orphansDeleted,
          success: true
        });
        
        if (orphansDeleted > 0) {
          console.log(`[Orphan Cleanup Cron] ✅ Cleaned ${orphansDeleted} orphan(s) from ${storeName}`);
        } else {
          console.log(`[Orphan Cleanup Cron] ✅ No orphans found in ${storeName}`);
        }
      } catch (storeError) {
        const errorMsg = storeError instanceof Error ? storeError.message : String(storeError);
        console.error(`[Orphan Cleanup Cron] ❌ Error processing ${storeName}:`, errorMsg);
        results.push({
          store: storeName,
          userId,
          orphansDeleted: 0,
          success: false,
          error: errorMsg
        });
      }
    }
    
    const totalOrphansDeleted = results.reduce((sum, r) => sum + r.orphansDeleted, 0);
    const successCount = results.filter(r => r.success).length;
    const duration = Date.now() - startTime;
    
    console.log(`[Orphan Cleanup Cron] 🏁 Completed in ${duration}ms`, {
      storesProcessed: connections.length,
      storesSucceeded: successCount,
      totalOrphansDeleted
    });
    
    res.status(200).json({
      success: true,
      message: `Cleaned ${totalOrphansDeleted} orphaned product(s) from ${successCount}/${connections.length} store(s)`,
      results,
      duration
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Orphan Cleanup Cron] ❌ Fatal error:', errorMsg);
    res.status(500).json({
      success: false,
      error: 'Orphan cleanup failed',
      message: errorMsg,
      duration: Date.now() - startTime
    });
  }
}
