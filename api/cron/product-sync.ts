import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is actually a cron job from Vercel
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[Product Sync Cron] Starting product sync...');
    
    // Import Supabase client
    const { supabase } = await import('../../server/lib/supabase');
    
    // Get all active Shopify connections
    const { data: connections } = await supabase
      .from('store_connections')
      .select('*')
      .eq('platform', 'shopify')
      .eq('status', 'active');
    
    if (!connections || connections.length === 0) {
      console.log('[Product Sync Cron] No active Shopify connections found');
      return res.status(200).json({ success: true, message: 'No stores to sync' });
    }
    
    console.log(`[Product Sync Cron] Found ${connections.length} active connections`);
    
    // Sync each store
    const results: Array<{ store: string; success: boolean; data?: any; error?: string }> = [];
    for (const connection of connections) {
      try {
        const userId = connection.user_id;
        console.log(`[Product Sync Cron] Syncing store ${connection.store_name} for user ${userId}`);
        
        // Call internal sync API with service token
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000';
          
        const response = await fetch(`${baseUrl}/api/shopify/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`
          },
          body: JSON.stringify({ userId })
        });
        
        if (response.ok) {
          const data = await response.json();
          results.push({ store: connection.store_name, success: true, data });
          console.log(`[Product Sync Cron] Successfully synced ${connection.store_name}`);
        } else {
          results.push({ store: connection.store_name, success: false, error: await response.text() });
          console.error(`[Product Sync Cron] Failed to sync ${connection.store_name}`);
        }
      } catch (error) {
        results.push({ 
          store: connection.store_name, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        console.error(`[Product Sync Cron] Error syncing ${connection.store_name}:`, error);
      }
    }
    
    console.log('[Product Sync Cron] Product sync completed');
    res.status(200).json({ 
      success: true, 
      message: 'Product sync completed', 
      results 
    });
  } catch (error) {
    console.error('[Product Sync Cron] Error:', error);
    res.status(500).json({ 
      error: 'Product sync failed',
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
