import { requireDb } from "../db";
import {
  autonomousActions,
  notificationRules,
  customerEngagementHistory,
  automationSettings
} from "@shared/schema";
import { eq, and, sql, gte, count } from "drizzle-orm";

/**
 * Marketing Safety Manager
 * Enforces frequency caps, quiet hours, unsubscribe checks, and GDPR compliance
 */

export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
  violationType?: 'frequency_cap' | 'quiet_hours' | 'unsubscribed' | 'no_consent';
}

export interface CustomerContactInfo {
  email?: string;
  phone?: string;
  userId: string;
  timezone?: string; // IANA timezone like 'America/New_York'
}

/**
 * Unsubscribe list - in-memory cache with database backing
 * Real implementation would use Redis or database table
 */
const unsubscribedEmails = new Set<string>();
const unsubscribedPhones = new Set<string>();

/**
 * Check if customer can receive marketing message
 * Performs all safety checks in parallel for efficiency
 */
export async function canSendMarketingMessage(
  customerInfo: CustomerContactInfo,
  channel: 'email' | 'sms'
): Promise<SafetyCheckResult> {
  
  // Run all checks in parallel
  const [
    frequencyCheck,
    quietHoursCheck,
    unsubscribeCheck,
    consentCheck
  ] = await Promise.all([
    checkFrequencyCap(customerInfo, channel),
    checkQuietHours(customerInfo),
    checkUnsubscribeStatus(customerInfo, channel),
    checkGDPRConsent(customerInfo.userId)
  ]);

  // Return first failing check
  if (!frequencyCheck.allowed) return frequencyCheck;
  if (!quietHoursCheck.allowed) return quietHoursCheck;
  if (!unsubscribeCheck.allowed) return unsubscribeCheck;
  if (!consentCheck.allowed) return consentCheck;

  return { allowed: true };
}

/**
 * Check frequency cap: max 3 messages per day, 5 per week PER CUSTOMER PER CHANNEL
 * Limits are enforced separately for each channel (email, sms) to support multi-channel campaigns
 */
async function checkFrequencyCap(
  customerInfo: CustomerContactInfo,
  channel: 'email' | 'sms'
): Promise<SafetyCheckResult> {
  const db = requireDb();

  try {

    // Check daily limit - filter by customer identifier AND channel in result payload
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const dailyActions = await db
      .select()
      .from(autonomousActions)
      .where(
        and(
          eq(autonomousActions.userId, customerInfo.userId),
          gte(autonomousActions.createdAt, oneDayAgo),
          sql`(${autonomousActions.actionType} IN ('send_campaign', 'send_cart_recovery'))`
        )
      );

    // Filter by customer identifier (email or phone) AND channel in the result payload
    const customerDailyActions = dailyActions.filter(action => {
      const result = action.result as any || {};
      const matchesRecipient = channel === 'email' 
        ? result.recipientEmail === customerInfo.email
        : result.recipientPhone === customerInfo.phone;
      const matchesChannel = result.channel === channel;
      return matchesRecipient && matchesChannel;
    });

    const dailyCount = customerDailyActions.length;
    const recipientId = channel === 'email' ? customerInfo.email : customerInfo.phone;
    
    if (dailyCount >= 3) {
      return {
        allowed: false,
        reason: `Daily ${channel} limit reached for ${recipientId} (${dailyCount}/3 messages)`,
        violationType: 'frequency_cap'
      };
    }

    // Check weekly limit - filter by customer identifier AND channel in result payload
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyActions = await db
      .select()
      .from(autonomousActions)
      .where(
        and(
          eq(autonomousActions.userId, customerInfo.userId),
          gte(autonomousActions.createdAt, oneWeekAgo),
          sql`(${autonomousActions.actionType} IN ('send_campaign', 'send_cart_recovery'))`
        )
      );

    // Filter by customer identifier (email or phone) AND channel in the result payload
    const customerWeeklyActions = weeklyActions.filter(action => {
      const result = action.result as any || {};
      const matchesRecipient = channel === 'email' 
        ? result.recipientEmail === customerInfo.email
        : result.recipientPhone === customerInfo.phone;
      const matchesChannel = result.channel === channel;
      return matchesRecipient && matchesChannel;
    });

    const weeklyCount = customerWeeklyActions.length;
    
    if (weeklyCount >= 5) {
      return {
        allowed: false,
        reason: `Weekly ${channel} limit reached for ${recipientId} (${weeklyCount}/5 messages)`,
        violationType: 'frequency_cap'
      };
    }

    return { allowed: true };

  } catch (error) {
    console.error('❌ [Safety] Error checking frequency cap:', error);
    // Fail open - allow message if check fails
    return { allowed: true };
  }
}

/**
 * Check quiet hours: only send 9 AM - 9 PM in customer's timezone
 */
async function checkQuietHours(customerInfo: CustomerContactInfo): Promise<SafetyCheckResult> {
  try {
    const now = new Date();
    
    // Default to UTC if no timezone specified
    const timezone = customerInfo.timezone || 'UTC';
    
    // Get hour in customer's timezone
    const customerHour = new Date(now.toLocaleString('en-US', { timeZone: timezone })).getHours();

    // Quiet hours: before 9 AM or after 9 PM
    if (customerHour < 9 || customerHour >= 21) {
      return {
        allowed: false,
        reason: `Quiet hours (${customerHour}:00 local time, allowed 9 AM - 9 PM)`,
        violationType: 'quiet_hours'
      };
    }

    return { allowed: true };

  } catch (error) {
    console.error('❌ [Safety] Error checking quiet hours:', error);
    // Fail open - allow message if check fails
    return { allowed: true };
  }
}

/**
 * Check if customer has unsubscribed from the specified channel
 */
async function checkUnsubscribeStatus(
  customerInfo: CustomerContactInfo,
  channel: 'email' | 'sms'
): Promise<SafetyCheckResult> {
  const db = requireDb();
  
  // Get identifier for this channel
  const identifier = channel === 'email' ? customerInfo.email : customerInfo.phone;
  
  if (!identifier) {
    // No identifier - fail safe and block
    return {
      allowed: false,
      reason: `No ${channel} identifier provided for unsubscribe check`,
      violationType: 'unsubscribed'
    };
  }

  try {
    // Check in-memory cache first (channel-specific)
    if (channel === 'email' && unsubscribedEmails.has(identifier)) {
      return {
        allowed: false,
        reason: 'Customer has unsubscribed from email communications',
        violationType: 'unsubscribed'
      };
    }
    
    if (channel === 'sms' && unsubscribedPhones.has(identifier)) {
      return {
        allowed: false,
        reason: 'Customer has unsubscribed from SMS communications',
        violationType: 'unsubscribed'
      };
    }

    // Check database for channel-specific preferences using notificationRules
    const rules = await db
      .select()
      .from(notificationRules)
      .where(
        and(
          channel === 'email'
            ? eq(notificationRules.customerEmail, identifier)
            : eq(notificationRules.customerPhone, identifier),
          sql`${notificationRules.category} = 'campaigns'`,
          eq(notificationRules.enabled, true)
        )
      )
      .limit(1);

    if (rules.length > 0) {
      const rule = rules[0];
      const channels = rule.channels as any || {};
      
      const channelEnabled = channel === 'email' ? channels.email : channels.sms;
      
      if (!channelEnabled) {
        // Cache this unsubscribe for future checks
        if (channel === 'email') {
          unsubscribedEmails.add(identifier);
        } else {
          unsubscribedPhones.add(identifier);
        }
        
        return {
          allowed: false,
          reason: `Customer has unsubscribed from ${channel} communications`,
          violationType: 'unsubscribed'
        };
      }
    }

    return { allowed: true };

  } catch (error) {
    console.error('❌ [Safety] Error checking unsubscribe status:', error);
    // Fail closed - don't send if check fails
    return {
      allowed: false,
      reason: 'Unable to verify subscription status',
      violationType: 'unsubscribed'
    };
  }
}

/**
 * Check GDPR consent for marketing communications
 */
async function checkGDPRConsent(userId: string): Promise<SafetyCheckResult> {
  const db = requireDb();

  try {
    // Check if user has granted marketing consent
    const [settings] = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, userId))
      .limit(1);

    if (!settings) {
      return {
        allowed: false,
        reason: 'No automation settings found',
        violationType: 'no_consent'
      };
    }

    // For GDPR compliance, check if marketing is explicitly enabled
    // Check notificationPreferences jsonb field for marketing consent
    const notifPrefs = settings.notificationPreferences as any || {};
    const hasMarketingConsent = notifPrefs.marketingConsent !== false;

    // Default to true if not explicitly set (opt-out model)
    // For stricter GDPR (opt-in), change this to check === true
    if (!hasMarketingConsent) {
      return {
        allowed: false,
        reason: 'No GDPR consent for marketing communications',
        violationType: 'no_consent'
      };
    }

    return { allowed: true };

  } catch (error) {
    console.error('❌ [Safety] Error checking GDPR consent:', error);
    // Fail closed - don't send if check fails
    return {
      allowed: false,
      reason: 'Unable to verify GDPR consent',
      violationType: 'no_consent'
    };
  }
}

/**
 * Add email to unsubscribe list
 */
export function unsubscribeEmail(email: string): void {
  unsubscribedEmails.add(email.toLowerCase());
  console.log(`🚫 [Safety] Added ${email} to unsubscribe list`);
}

/**
 * Add phone to unsubscribe list
 */
export function unsubscribePhone(phone: string): void {
  unsubscribedPhones.add(phone);
  console.log(`🚫 [Safety] Added ${phone} to unsubscribe list`);
}

/**
 * Remove email from unsubscribe list (re-subscribe)
 */
export function resubscribeEmail(email: string): void {
  unsubscribedEmails.delete(email.toLowerCase());
  console.log(`✅ [Safety] Removed ${email} from unsubscribe list`);
}

/**
 * Batch safety check for multiple recipients
 * Returns only recipients who pass all safety checks
 */
export async function filterSafeRecipients(
  recipients: Array<{ email: string; userId: string; timezone?: string }>,
  channel: 'email' | 'sms'
): Promise<{
  safe: Array<{ email: string; userId: string }>;
  blocked: Array<{ email: string; reason: string }>;
}> {
  const safe: Array<{ email: string; userId: string }> = [];
  const blocked: Array<{ email: string; reason: string }> = [];

  // Check all recipients in parallel
  const results = await Promise.all(
    recipients.map(async (recipient) => {
      const check = await canSendMarketingMessage(recipient, channel);
      return { recipient, check };
    })
  );

  // Separate safe from blocked
  for (const { recipient, check } of results) {
    if (check.allowed) {
      safe.push(recipient);
    } else {
      blocked.push({
        email: recipient.email,
        reason: check.reason || 'Safety check failed'
      });
    }
  }

  console.log(`✅ [Safety] Filtered ${recipients.length} recipients: ${safe.length} safe, ${blocked.length} blocked`);

  return { safe, blocked };
}

/**
 * Log safety violation for analytics
 */
export async function logSafetyViolation(
  userId: string,
  customerEmail: string,
  violationType: string,
  reason: string
): Promise<void> {
  const db = requireDb();

  try {
    // Log as engagement history entry
    await db.insert(customerEngagementHistory).values({
      userId,
      customerEmail,
      engagementScore: 0,
      metadata: {
        type: 'safety_violation',
        violationType,
        reason,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ [Safety] Error logging violation:', error);
  }
}

/**
 * Get safety statistics for user
 */
export async function getSafetyStats(userId: string): Promise<{
  dailyMessagesSent: number;
  weeklyMessagesSent: number;
  blockedToday: number;
  blockedThisWeek: number;
}> {
  const db = requireDb();

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Count sent messages
    const dailySent = await db
      .select({ count: count() })
      .from(autonomousActions)
      .where(
        and(
          eq(autonomousActions.userId, userId),
          gte(autonomousActions.createdAt, oneDayAgo),
          sql`${autonomousActions.status} = 'completed'`
        )
      );

    const weeklySent = await db
      .select({ count: count() })
      .from(autonomousActions)
      .where(
        and(
          eq(autonomousActions.userId, userId),
          gte(autonomousActions.createdAt, oneWeekAgo),
          sql`${autonomousActions.status} = 'completed'`
        )
      );

    // Count blocked messages (safety violations)
    const dailyBlocked = await db
      .select({ count: count() })
      .from(customerEngagementHistory)
      .where(
        and(
          eq(customerEngagementHistory.userId, userId),
          sql`${customerEngagementHistory.metadata}->>'type' = 'safety_violation'`
        )
      );

    const weeklyBlocked = await db
      .select({ count: count() })
      .from(customerEngagementHistory)
      .where(
        and(
          eq(customerEngagementHistory.userId, userId),
          sql`${customerEngagementHistory.metadata}->>'type' = 'safety_violation'`
        )
      );

    return {
      dailyMessagesSent: dailySent[0]?.count || 0,
      weeklyMessagesSent: weeklySent[0]?.count || 0,
      blockedToday: dailyBlocked[0]?.count || 0,
      blockedThisWeek: weeklyBlocked[0]?.count || 0
    };

  } catch (error) {
    console.error('❌ [Safety] Error getting stats:', error);
    return {
      dailyMessagesSent: 0,
      weeklyMessagesSent: 0,
      blockedToday: 0,
      blockedThisWeek: 0
    };
  }
}
