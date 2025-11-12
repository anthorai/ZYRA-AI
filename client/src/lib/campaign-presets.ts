import { ShoppingCart, Sparkles, Heart, Megaphone, Mail, Gift } from "lucide-react";

export type CampaignPreset = {
  id: string;
  name: string;
  description: string;
  icon: any;
  goalType: string;
  type: 'email' | 'sms';
  defaultSubject?: string;
  defaultContent: string;
  defaultAudience: string;
  color: string;
};

export const campaignPresets: CampaignPreset[] = [
  {
    id: 'cart_recovery',
    name: 'Cart Recovery',
    description: 'Re-engage customers who abandoned their carts with personalized reminders',
    icon: ShoppingCart,
    goalType: 'conversion',
    type: 'email',
    defaultSubject: 'You left something behind...',
    defaultContent: `Hi there!

We noticed you left some items in your cart. Don't miss out on your favorites!

[Cart Items Here]

Complete your purchase now and get FREE SHIPPING on orders over $50.

[Shop Now Button]`,
    defaultAudience: 'abandoned_cart',
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'welcome',
    name: 'Welcome Series',
    description: 'Greet new customers and introduce them to your brand',
    icon: Heart,
    goalType: 'engagement',
    type: 'email',
    defaultSubject: 'Welcome to [Your Brand]!',
    defaultContent: `Welcome aboard!

We're thrilled to have you join our community. Here's what you can expect:

✓ Exclusive deals and promotions
✓ New product announcements  
✓ Tips and inspiration

Get started with 15% off your first order using code: WELCOME15

[Explore Now]`,
    defaultAudience: 'recent_customers',
    color: 'from-pink-500 to-purple-500'
  },
  {
    id: 'winback',
    name: 'Win-Back Campaign',
    description: 'Re-engage inactive customers with special offers',
    icon: Sparkles,
    goalType: 'retention',
    type: 'email',
    defaultSubject: 'We miss you! Here\'s 20% off to come back',
    defaultContent: `We miss you!

It's been a while since your last visit. We'd love to have you back!

Here's an exclusive 20% OFF coupon just for you:
Code: COMEBACK20

[Shop Now]

This offer expires in 7 days, so don't wait!`,
    defaultAudience: 'inactive_customers',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'product_launch',
    name: 'Product Launch',
    description: 'Announce new products to your customer base',
    icon: Megaphone,
    goalType: 'engagement',
    type: 'email',
    defaultSubject: 'Introducing: [New Product Name]',
    defaultContent: `Exciting News!

We're thrilled to introduce our latest product: [Product Name]

[Product Description]

Key Features:
• Feature 1
• Feature 2
• Feature 3

Pre-order now and get 10% off!

[Learn More]`,
    defaultAudience: 'all',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'promotional',
    name: 'Promotional Campaign',
    description: 'Drive sales with time-limited offers and discounts',
    icon: Gift,
    goalType: 'conversion',
    type: 'email',
    defaultSubject: 'Flash Sale: 50% OFF Everything!',
    defaultContent: `Limited Time Offer!

Get 50% OFF sitewide for the next 24 hours only!

No code needed - discount applied automatically at checkout.

Sale ends: [End Date]

[Shop Now]

*Exclusions may apply`,
    defaultAudience: 'all',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'cart_recovery_sms',
    name: 'Cart Recovery SMS',
    description: 'Quick SMS reminder for abandoned carts',
    icon: ShoppingCart,
    goalType: 'conversion',
    type: 'sms',
    defaultContent: 'Hi! You left items in your cart. Complete your order now and get FREE shipping! [Link]',
    defaultAudience: 'abandoned_cart',
    color: 'from-purple-500 to-indigo-500'
  },
  {
    id: 'custom',
    name: 'Start from Scratch',
    description: 'Create a custom campaign tailored to your needs',
    icon: Mail,
    goalType: 'custom',
    type: 'email',
    defaultSubject: '',
    defaultContent: '',
    defaultAudience: 'all',
    color: 'from-gray-500 to-slate-500'
  }
];

export function getPresetById(id: string): CampaignPreset | undefined {
  return campaignPresets.find(preset => preset.id === id);
}

export function getPresetsByType(type: 'email' | 'sms'): CampaignPreset[] {
  return campaignPresets.filter(preset => preset.type === type || preset.id === 'custom');
}
