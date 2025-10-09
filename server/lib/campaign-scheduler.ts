import { supabaseStorage } from "./supabase-storage";
import { sendEmail, sendBulkEmails } from "./sendgrid-client";
import { sendSMS, sendBulkSMS } from "./twilio-client";
import { generateSecureToken } from "./tracking-token";
import { db } from "../db";
import { trackingTokens } from "@shared/schema";

export async function processScheduledCampaigns() {
  console.log('[Campaign Scheduler] Checking for scheduled campaigns...');

  try {
    // Get all campaigns that are scheduled and ready to send
    const now = new Date();
    
    // Get all scheduled campaigns using the storage layer
    // Note: We'll filter by scheduledFor in code since we can't query by date directly
    const allCampaigns = await supabaseStorage.getAllCampaigns();
    
    const campaigns = allCampaigns.filter((c: any) => 
      c.status === 'scheduled' && 
      c.scheduledFor && 
      new Date(c.scheduledFor) <= now
    );

    if (campaigns.length === 0) {
      console.log('[Campaign Scheduler] No scheduled campaigns to process');
      return { processed: 0, errors: 0 };
    }

    console.log(`[Campaign Scheduler] Found ${campaigns.length} campaigns to send`);

    let processed = 0;
    let errors = 0;

    for (const campaign of campaigns) {
      try {
        const recipientList = campaign.recipientList as string[] || [];
        
        if (recipientList.length === 0) {
          console.log(`[Campaign Scheduler] Skipping campaign ${campaign.id} - no recipients`);
          continue;
        }

        let sentCount = 0;
        const errorList: any[] = [];

        // Send based on campaign type
        if (campaign.type === 'email') {
          // Generate and store tracking tokens for each recipient
          const messages = await Promise.all(recipientList.map(async (email) => {
            // Generate secure random token
            const token = generateSecureToken();
            
            // Store tracking token in database
            try {
              await db.insert(trackingTokens).values({
                token,
                campaignId: campaign.id,
                userId: campaign.userId,
                recipientEmail: email,
              });
            } catch (error: any) {
              console.error(`[Campaign Scheduler] Error storing tracking token:`, error);
            }
            
            // Build tracking pixel URL with https:// protocol
            const baseUrl = process.env.REPLIT_DOMAINS 
              ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
              : 'http://localhost:5000';
            const trackingPixel = `<img src="${baseUrl}/track/${token}" width="1" height="1" style="display:none" alt="" />`;
            
            return {
              to: email,
              subject: campaign.subject || 'No Subject',
              html: campaign.content + trackingPixel
            };
          }));

          try {
            const result = await sendBulkEmails(messages);
            sentCount = result.count;
          } catch (error: any) {
            console.error(`[Campaign Scheduler] Email error for campaign ${campaign.id}:`, error);
            errorList.push({ error: error.message });
          }
        } else if (campaign.type === 'sms') {
          const messages = recipientList.map(phone => ({
            to: phone,
            message: campaign.content
          }));

          const result = await sendBulkSMS(messages);
          sentCount = result.sent;
          errorList.push(...result.errors);
        }

        // Update campaign status
        try {
          await supabaseStorage.updateCampaign(campaign.id, {
            status: 'sent',
            sentAt: new Date() as any,
            sentCount
          });
          console.log(`[Campaign Scheduler] Successfully sent campaign ${campaign.id} to ${sentCount} recipients`);
          processed++;
        } catch (updateError: any) {
          console.error(`[Campaign Scheduler] Error updating campaign ${campaign.id}:`, updateError);
          errors++;
        }

        // Track activity
        await supabaseStorage.trackActivity({
          userId: campaign.userId,
          action: 'scheduled_campaign_sent',
          description: `Scheduled ${campaign.type} campaign sent: ${campaign.name}`,
          metadata: { campaignId: campaign.id, type: campaign.type, sentCount },
          toolUsed: 'campaigns'
        });

      } catch (error: any) {
        console.error(`[Campaign Scheduler] Error processing campaign ${campaign.id}:`, error);
        errors++;
      }
    }

    console.log(`[Campaign Scheduler] Completed: ${processed} processed, ${errors} errors`);
    return { processed, errors };

  } catch (error: any) {
    console.error('[Campaign Scheduler] Fatal error:', error);
    return { processed: 0, errors: 1 };
  }
}
