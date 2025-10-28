import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is actually a cron job from Vercel
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[Billing Cron] Starting billing tasks...');
    
    // Import and run billing tasks
    const { runBillingTasks } = await import('../../server/lib/trial-expiration-service');
    await runBillingTasks();
    
    console.log('[Billing Cron] Billing tasks completed successfully');
    res.status(200).json({ success: true, message: 'Billing tasks completed' });
  } catch (error) {
    console.error('[Billing Cron] Error:', error);
    res.status(500).json({ 
      error: 'Billing tasks failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
