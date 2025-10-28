import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is actually a cron job from Vercel
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[Campaign Cron] Starting campaign processing...');
    
    // Import and run campaign scheduler
    const { processScheduledCampaigns } = await import('../../server/lib/campaign-scheduler');
    await processScheduledCampaigns();
    
    console.log('[Campaign Cron] Campaign processing completed');
    res.status(200).json({ success: true, message: 'Campaigns processed' });
  } catch (error) {
    console.error('[Campaign Cron] Error:', error);
    res.status(500).json({ 
      error: 'Campaign processing failed',
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
