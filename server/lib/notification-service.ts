import { supabaseStorage } from "./supabase-storage";
import { InsertNotification } from "@shared/schema";

export type NotificationTriggerType = 
  | 'campaign_sent' 
  | 'campaign_failed' 
  | 'campaign_milestone'
  | 'billing_subscription_changed'
  | 'billing_payment_failed'
  | 'billing_payment_success'
  | 'billing_trial_ending'
  | 'ai_generation_complete'
  | 'ai_limit_reached'
  | 'ai_limit_warning'
  | 'performance_optimization_complete'
  | 'performance_issue_detected'
  | 'performance_milestone';

interface NotificationContext {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  actionLabel?: string;
}

export class NotificationService {
  static async createNotification(context: NotificationContext): Promise<void> {
    try {
      await supabaseStorage.createNotification({
        userId: context.userId,
        title: context.title,
        message: context.message,
        type: context.type || 'info',
        actionUrl: context.actionUrl,
        actionLabel: context.actionLabel,
        isRead: false
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  static async notifyCampaignSent(userId: string, campaignName: string, sentCount: number): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Campaign Sent Successfully',
      message: `Your campaign "${campaignName}" has been sent to ${sentCount} recipients.`,
      type: 'success',
      actionUrl: '/dashboard/campaigns',
      actionLabel: 'View Campaign'
    });
  }

  static async notifyCampaignFailed(userId: string, campaignName: string, reason: string): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Campaign Failed',
      message: `Your campaign "${campaignName}" failed to send. Reason: ${reason}`,
      type: 'error',
      actionUrl: '/dashboard/campaigns',
      actionLabel: 'Review Campaign'
    });
  }

  static async notifyCampaignMilestone(userId: string, campaignName: string, milestone: string): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Campaign Milestone Reached',
      message: `Your campaign "${campaignName}" has reached a milestone: ${milestone}`,
      type: 'success',
      actionUrl: '/dashboard/campaigns',
      actionLabel: 'View Details'
    });
  }

  static async notifySubscriptionChanged(userId: string, plan: string): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Subscription Updated',
      message: `Your subscription has been changed to ${plan} plan.`,
      type: 'success',
      actionUrl: '/dashboard/billing',
      actionLabel: 'View Billing'
    });
  }

  static async notifyPaymentFailed(userId: string, reason: string): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Payment Failed',
      message: `Your payment failed. ${reason}. Please update your payment method.`,
      type: 'error',
      actionUrl: '/dashboard/billing',
      actionLabel: 'Update Payment'
    });
  }

  static async notifyPaymentSuccess(userId: string, amount: number, plan: string): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Payment Successful',
      message: `Your payment of $${amount} for ${plan} plan was successful.`,
      type: 'success',
      actionUrl: '/dashboard/billing',
      actionLabel: 'View Invoice'
    });
  }

  static async notifyTrialEnding(userId: string, daysLeft: number): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Trial Ending Soon',
      message: `Your trial ends in ${daysLeft} days. Upgrade now to keep all features.`,
      type: 'warning',
      actionUrl: '/dashboard/billing',
      actionLabel: 'Upgrade Now'
    });
  }

  static async notifyAIGenerationComplete(userId: string, type: string, productName?: string): Promise<void> {
    const productText = productName ? ` for "${productName}"` : '';
    await this.createNotification({
      userId,
      title: 'AI Generation Complete',
      message: `Your ${type}${productText} has been generated successfully.`,
      type: 'success',
      actionUrl: '/dashboard/ai-tools',
      actionLabel: 'View Result'
    });
  }

  static async notifyAILimitReached(userId: string, plan: string, limit: number): Promise<void> {
    await this.createNotification({
      userId,
      title: 'AI Generation Limit Reached',
      message: `You've reached your ${plan} plan limit of ${limit} AI generations this month. Upgrade for more.`,
      type: 'warning',
      actionUrl: '/dashboard/billing',
      actionLabel: 'Upgrade Plan'
    });
  }

  static async notifyAILimitWarning(userId: string, remaining: number, total: number): Promise<void> {
    await this.createNotification({
      userId,
      title: 'AI Generation Limit Warning',
      message: `You have ${remaining} of ${total} AI generations remaining this month.`,
      type: 'info',
      actionUrl: '/dashboard/billing',
      actionLabel: 'View Usage'
    });
  }

  static async notifyPerformanceOptimizationComplete(userId: string, itemName: string, improvement: string): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Optimization Complete',
      message: `"${itemName}" has been optimized. ${improvement}`,
      type: 'success',
      actionUrl: '/dashboard/products',
      actionLabel: 'View Product'
    });
  }

  static async notifyPerformanceIssue(userId: string, issue: string): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Performance Issue Detected',
      message: `We detected a performance issue: ${issue}`,
      type: 'warning',
      actionUrl: '/dashboard',
      actionLabel: 'View Details'
    });
  }

  static async notifyPerformanceMilestone(userId: string, milestone: string): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Performance Milestone',
      message: `Congratulations! ${milestone}`,
      type: 'success',
      actionUrl: '/dashboard/analytics',
      actionLabel: 'View Analytics'
    });
  }
}
