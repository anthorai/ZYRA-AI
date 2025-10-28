import { db } from "../db";
import { users, subscriptions, subscriptionPlans, notifications, notificationAnalytics } from "../../shared/schema";
import { eq, and, lt, gte, lte, sql } from "drizzle-orm";

/**
 * Checks for users with expired trials and handles subscription updates
 * This should be called periodically (e.g., via a cron job or scheduled task)
 */
export async function handleExpiredTrials(): Promise<{
  processedCount: number;
  errors: string[];
}> {
  const now = new Date();
  const errors: string[] = [];
  let processedCount = 0;

  try {
    // Find users with expired trials that haven't been converted
    const expiredTrialUsers = await db
      .select()
      .from(users)
      .where(
        and(
          lt(users.trialEndDate, now),
          eq(users.plan, "trial")
        )
      );

    console.log(`[Trial Service] Found ${expiredTrialUsers.length} expired trial users`);

    // Get the "Starter" plan as default fallback
    const starterPlan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.planName, "Starter"))
      .limit(1);

    if (!starterPlan || starterPlan.length === 0) {
      errors.push("No starter plan found for trial conversion");
      return { processedCount: 0, errors };
    }

    for (const user of expiredTrialUsers) {
      try {
        // Check if user already has an active subscription
        const existingSubscription = await db
          .select()
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.userId, user.id),
              eq(subscriptions.status, "active")
            )
          )
          .limit(1);

        if (existingSubscription && existingSubscription.length > 0) {
          // User already has active subscription - get the plan slug from subscription
          const activePlan = await db
            .select()
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, existingSubscription[0].planId))
            .limit(1);

          if (activePlan && activePlan.length > 0) {
            // Update user plan to match subscription's plan NAME (slug)
            await db
              .update(users)
              .set({ plan: activePlan[0].planName })
              .where(eq(users.id, user.id));
          }
          
          processedCount++;
          continue;
        }

        // No active subscription - update subscription to "past_due" to trigger payment
        const userSubscriptions = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, user.id))
          .limit(1);

        if (userSubscriptions && userSubscriptions.length > 0) {
          // Update existing subscription to past_due
          await db
            .update(subscriptions)
            .set({ 
              status: "past_due",
              trialEnd: now,
            })
            .where(eq(subscriptions.id, userSubscriptions[0].id));
        } else {
          // Create new subscription in past_due state
          await db
            .insert(subscriptions)
            .values({
              userId: user.id,
              planId: starterPlan[0].id,
              status: "past_due",
              trialEnd: now,
              currentPeriodStart: now,
              currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
            });
        }

        // Update user status to reflect trial ended
        await db
          .update(users)
          .set({ plan: "past_due" })
          .where(eq(users.id, user.id));

        console.log(`[Trial Service] Processed expired trial for user ${user.id}`);
        processedCount++;

        // Send trial expiration notification
        try {
          await db.insert(notifications).values({
            userId: user.id,
            title: '🔒 Trial Expired - Upgrade Required',
            message: 'Your Zyra AI trial has expired. Upgrade to a paid plan to restore access to your products, campaigns, and AI tools. Your data is safe and will be available once you upgrade.',
            type: 'error',
            link: '/settings/billing',
            isRead: false
          });
          console.log(`[Trial Service] Sent expiration notification to user ${user.id}`);
        } catch (notifError) {
          console.error(`[Trial Service] Failed to send notification:`, notifError);
        }

      } catch (error: any) {
        const errorMsg = `Failed to process user ${user.id}: ${error.message}`;
        console.error(`[Trial Service] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    return { processedCount, errors };
  } catch (error: any) {
    const errorMsg = `Trial expiration service failed: ${error.message}`;
    console.error(`[Trial Service] ${errorMsg}`);
    return { processedCount, errors: [errorMsg] };
  }
}

/**
 * Handles auto-billing for subscriptions at the end of billing period
 * This should be called periodically to process renewals
 */
export async function handleSubscriptionRenewals(): Promise<{
  processedCount: number;
  errors: string[];
}> {
  const now = new Date();
  const errors: string[] = [];
  let processedCount = 0;

  try {
    // Find subscriptions that have reached their billing period end
    const dueSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          lt(subscriptions.currentPeriodEnd, now),
          eq(subscriptions.status, "active"),
          eq(subscriptions.cancelAtPeriodEnd, false)
        )
      );

    console.log(`[Billing Service] Found ${dueSubscriptions.length} subscriptions due for renewal`);

    for (const subscription of dueSubscriptions) {
      try {
        // Calculate next billing period
        const nextPeriodStart = subscription.currentPeriodEnd || now;
        const nextPeriodEnd = new Date(nextPeriodStart);
        
        // Get subscription plan to determine interval
        const plan = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, subscription.planId))
          .limit(1);

        if (!plan || plan.length === 0) {
          errors.push(`Plan not found for subscription ${subscription.id}`);
          continue;
        }

        // Calculate next period end based on interval
        if (plan[0].interval === "year") {
          nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
        } else {
          nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
        }

        // Update subscription with new billing period
        await db
          .update(subscriptions)
          .set({
            currentPeriodStart: nextPeriodStart,
            currentPeriodEnd: nextPeriodEnd,
            updatedAt: now,
          })
          .where(eq(subscriptions.id, subscription.id));

        console.log(`[Billing Service] Renewed subscription ${subscription.id} until ${nextPeriodEnd}`);
        processedCount++;

        // TODO: Trigger payment via payment gateway webhook or API
        // This would integrate with Razorpay/PayPal subscription APIs

      } catch (error: any) {
        const errorMsg = `Failed to renew subscription ${subscription.id}: ${error.message}`;
        console.error(`[Billing Service] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    return { processedCount, errors };
  } catch (error: any) {
    const errorMsg = `Subscription renewal service failed: ${error.message}`;
    console.error(`[Billing Service] ${errorMsg}`);
    return { processedCount, errors: [errorMsg] };
  }
}

/**
 * Send proactive trial expiration notifications BEFORE trials expire
 * Notification schedule: 7 days, 3 days, 1 day before expiration
 */
export async function sendTrialExpirationNotifications(): Promise<{
  processedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processedCount = 0;

  const notificationSchedules = [
    { days: 7, title: 'Welcome to Zyra AI Trial! 🎉', message: 'Your 7-day trial has started! Explore all features including AI-powered product descriptions, SEO optimization, and smart marketing automation. Upgrade anytime to keep your data and unlock unlimited access.', type: 'info' as const },
    { days: 3, title: 'Trial Ending Soon - 3 Days Left', message: 'Your Zyra AI trial expires in 3 days. Upgrade now to continue optimizing your products and automating your marketing campaigns. Choose from Starter, Growth, or Pro plans.', type: 'warning' as const },
    { days: 1, title: '⚠️ Trial Expires Tomorrow', message: 'Your Zyra AI trial ends tomorrow! Upgrade now to avoid losing access to your AI-generated content, SEO optimizations, and marketing campaigns. All your data will be preserved.', type: 'warning' as const }
  ];

  try {
    for (const schedule of notificationSchedules) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + schedule.days);
      targetDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      // Find users with trial ending on target date who are still on trial plan
      const usersToNotify = await db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          plan: users.plan,
          trialEndDate: users.trialEndDate
        })
        .from(users)
        .where(
          and(
            eq(users.plan, 'trial'),
            gte(users.trialEndDate, targetDate),
            lte(users.trialEndDate, nextDay)
          )
        );

      console.log(`[Trial Notifications] Found ${usersToNotify.length} users for ${schedule.days}-day notification`);
      
      for (const user of usersToNotify) {
        try {
          // Check if notification already sent
          const existingNotification = await db
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.userId, user.id),
                eq(notifications.title, schedule.title)
              )
            )
            .limit(1);

          if (existingNotification.length > 0) {
            continue; // Skip duplicate
          }

          // Create in-app notification
          const [notification] = await db
            .insert(notifications)
            .values({
              userId: user.id,
              title: schedule.title,
              message: schedule.message,
              type: schedule.type,
              link: '/settings/billing',
              isRead: false
            })
            .returning();

          // Track analytics
          await db.insert(notificationAnalytics).values({
            userId: user.id,
            notificationId: notification.id,
            category: 'billing',
            channelType: 'in_app',
            delivered: true,
            deliveredAt: new Date()
          });

          // Log for future email integration
          console.log(`[Trial Notifications] ✅ Sent to ${user.email}: ${schedule.title}`, {
            notificationId: notification.id,
            // Future integration points:
            emailStatus: 'NOT_CONFIGURED', // Will be 'SENT' once SendGrid is integrated
            smsStatus: 'NOT_CONFIGURED'    // Will be 'SENT' once Twilio is integrated
          });

          processedCount++;
        } catch (error: any) {
          const errorMsg = `Failed to notify user ${user.id}: ${error.message}`;
          console.error(`[Trial Notifications] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
    }

    return { processedCount, errors };
  } catch (error: any) {
    const errorMsg = `Trial notification service failed: ${error.message}`;
    console.error(`[Trial Notifications] ${errorMsg}`);
    return { processedCount, errors: [errorMsg] };
  }
}

/**
 * Get trial status summary for admin dashboard
 */
export async function getTrialStatusSummary() {
  const now = new Date();
  const threeDays = new Date(now);
  threeDays.setDate(threeDays.getDate() + 3);
  
  const sevenDays = new Date(now);
  sevenDays.setDate(sevenDays.getDate() + 7);

  const trialUsers = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      trialEndDate: users.trialEndDate
    })
    .from(users)
    .where(eq(users.plan, 'trial'));

  const summary = {
    total: trialUsers.length,
    expired: trialUsers.filter((u: any) => u.trialEndDate && new Date(u.trialEndDate) < now).length,
    expiringToday: trialUsers.filter((u: any) => {
      if (!u.trialEndDate) return false;
      const endDate = new Date(u.trialEndDate);
      endDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return endDate.getTime() === today.getTime();
    }).length,
    expiringIn3Days: trialUsers.filter((u: any) => u.trialEndDate && new Date(u.trialEndDate) <= threeDays && new Date(u.trialEndDate) > now).length,
    expiringIn7Days: trialUsers.filter((u: any) => u.trialEndDate && new Date(u.trialEndDate) <= sevenDays && new Date(u.trialEndDate) > now).length,
    active: trialUsers.filter((u: any) => u.trialEndDate && new Date(u.trialEndDate) > now).length
  };

  return summary;
}

/**
 * Main scheduled task that runs both trial expiration and renewal checks
 */
export async function runBillingTasks(): Promise<void> {
  console.log("[Billing Tasks] Starting scheduled billing tasks...");
  
  // Send proactive trial expiration notifications
  const notificationResults = await sendTrialExpirationNotifications();
  console.log(`[Billing Tasks] Notifications: ${notificationResults.processedCount} sent, ${notificationResults.errors.length} errors`);
  
  // Handle expired trials
  const trialResults = await handleExpiredTrials();
  console.log(`[Billing Tasks] Trial processing: ${trialResults.processedCount} processed, ${trialResults.errors.length} errors`);
  
  // Handle subscription renewals
  const renewalResults = await handleSubscriptionRenewals();
  console.log(`[Billing Tasks] Renewals: ${renewalResults.processedCount} processed, ${renewalResults.errors.length} errors`);
  
  console.log("[Billing Tasks] Completed billing tasks");
}
