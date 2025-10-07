import { supabaseStorage } from "./supabase-storage";
import { sendEmail, sendBulkEmails } from "./sendgrid-client";
import { sendSMS, sendBulkSMS } from "./twilio-client";

export async function processScheduledCampaigns() {
  console.log('[Campaign Scheduler] Checking for scheduled campaigns...');

  try {
    // Get all campaigns scheduled for now or earlier that haven't been sent
    const now = new Date();
    const { data: campaigns, error } = await (supabaseStorage as any).supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now.toISOString());

    if (error) {
      console.error('[Campaign Scheduler] Error fetching scheduled campaigns:', error);
      return { processed: 0, errors: 1 };
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('[Campaign Scheduler] No scheduled campaigns to process');
      return { processed: 0, errors: 0 };
    }

    console.log(`[Campaign Scheduler] Found ${campaigns.length} campaigns to send`);

    let processed = 0;
    let errors = 0;

    for (const campaign of campaigns) {
      try {
        const recipientList = campaign.recipient_list as string[] || [];
        
        if (recipientList.length === 0) {
          console.log(`[Campaign Scheduler] Skipping campaign ${campaign.id} - no recipients`);
          continue;
        }

        let sentCount = 0;
        const errorList: any[] = [];

        // Send based on campaign type
        if (campaign.type === 'email') {
          const messages = recipientList.map(email => ({
            to: email,
            subject: campaign.subject || 'No Subject',
            html: campaign.content
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
        const { error: updateError } = await (supabaseStorage as any).supabase
          .from('campaigns')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            sent_count: sentCount
          })
          .eq('id', campaign.id);

        if (updateError) {
          console.error(`[Campaign Scheduler] Error updating campaign ${campaign.id}:`, updateError);
          errors++;
        } else {
          console.log(`[Campaign Scheduler] Successfully sent campaign ${campaign.id} to ${sentCount} recipients`);
          processed++;
        }

        // Track activity
        await supabaseStorage.trackActivity({
          userId: campaign.user_id,
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
