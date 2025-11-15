import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { PageContainer } from "@/components/ui/standardized-layout";
import { 
  Settings as SettingsIcon,
  User,
  CreditCard,
  Brain,
  Bell,
  Zap,
  Shield,
  HelpCircle,
  Store
} from "lucide-react";

interface SettingsCard {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  features: string[];
  actionText: string;
  category: 'account' | 'billing' | 'preferences' | 'integrations' | 'security' | 'support';
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Mock settings data for UI-only mode
  const mockUserPreferences = {
    id: "1",
    userId: "1",
    aiSettings: {
      defaultBrandVoice: "professional",
      contentStyle: "seo",
      autoSaveOutputs: true,
      scheduledUpdates: true,
      brandMemory: true
    },
    notificationSettings: {
      email: true,
      inApp: true,
      push: false,
      sms: false,
      campaignAlerts: true,
      performanceAlerts: true,
      billingAlerts: true,
      aiRecommendations: true
    },
    uiPreferences: {
      language: "en",
      timezone: "UTC",
      theme: "dark",
      dashboardLayout: "default"
    },
    privacySettings: {
      analyticsOptOut: false,
      dataSharing: true,
      marketingEmails: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockSecuritySettings = {
    id: "1",
    twoFactorEnabled: false,
    lastPasswordChange: new Date(Date.now() - 2592000000).toISOString(),
    activeSessions: 1,
    passwordStrength: "strong"
  };

  const mockIntegrations = [
    {
      id: "1",
      name: "Shopify",
      type: "ecommerce",
      isConnected: true,
      lastSync: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  // Use mock data instead of API calls
  const userPreferences = mockUserPreferences;
  const preferencesLoading = false;
  const preferencesError = null;
  const securitySettings = mockSecuritySettings;
  const securityLoading = false;
  const securityError = null;
  const integrations = mockIntegrations;
  const integrationsLoading = false;
  const integrationsError = null;

  const settingsCards: SettingsCard[] = [
    {
      id: 'profile-account',
      title: 'Profile & Account',
      description: 'Manage your personal information, connected stores, and language preferences',
      icon: <User className="w-5 h-5 stroke-2 text-primary" />,
      features: ['Edit Profile (name, email, image)', 'Change Password', 'Connected Stores (Shopify, WooCommerce)', 'Multi-language UI + Auto-translation'],
      actionText: 'Manage Profile',
      category: 'account'
    },
    {
      id: 'subscription-billing',
      title: 'Subscription & Billing',
      description: 'View current plan, upgrade options, billing history, and payment methods',
      icon: <CreditCard className="w-5 h-5 stroke-2 text-primary" />,
      features: ['Current Plan Overview', 'Upgrade/Downgrade Plans', 'Billing History & Invoices', 'Payment Method Management'],
      actionText: 'View Billing',
      category: 'billing'
    },
    {
      id: 'ai-preferences',
      title: 'AI Preferences',
      description: 'Customize AI behavior, brand voice, content style, and automation settings',
      icon: <Brain className="w-5 h-5 stroke-2 text-primary" />,
      features: ['Brand Voice Memory (Luxury, Casual, Gen Z)', 'Default Content Style (Sales, SEO)', 'Auto-save AI Outputs', 'Scheduled AI Updates (3-6 months)'],
      actionText: 'Configure AI',
      category: 'preferences'
    },
    {
      id: 'notifications-alerts',
      title: 'Notifications & Alerts',
      description: 'Control email notifications, in-app alerts, and mobile push settings',
      icon: <Bell className="w-5 h-5 stroke-2 text-primary" />,
      features: ['Email Notifications (Campaigns, Billing)', 'In-app Performance Alerts', 'Mobile Push Notifications', 'AI Recommendation Alerts'],
      actionText: 'Set Notifications',
      category: 'preferences'
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'Connect email providers, SMS services, analytics tools, and automation platforms',
      icon: <Zap className="w-5 h-5 stroke-2 text-primary" />,
      features: ['Email (Gmail, Outlook, SMTP)', 'SMS (Twilio, Vonage)', 'Analytics (Google Analytics, Meta Pixel)', 'Zapier / Make Automation'],
      actionText: 'Manage Integrations',
      category: 'integrations'
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Two-factor authentication, login activity, API keys, and data management',
      icon: <Shield className="w-5 h-5 stroke-2 text-primary" />,
      features: ['Two-Factor Authentication (2FA)', 'Login Activity Log', 'API Key Management', 'Data Export/Delete (GDPR)'],
      actionText: 'Security Settings',
      category: 'security'
    },
    {
      id: 'support-resources',
      title: 'Support & Resources',
      description: 'Access help center, contact support, submit feedback, and join community',
      icon: <HelpCircle className="w-5 h-5 stroke-2 text-primary" />,
      features: ['Help Center (FAQs, Docs, Tutorials)', 'Contact Support (Live Chat, Email)', 'Feedback & Feature Requests', 'Community Forum / Slack'],
      actionText: 'Get Support',
      category: 'support'
    }
  ];


  const handleSettingsAction = (cardId: string) => {
    // Handle all navigation pages
    sessionStorage.setItem('navigationSource', 'settings');
    
    switch (cardId) {
      case 'profile-account':
        setLocation('/profile');
        break;
      case 'subscription-billing':
        setLocation('/billing');
        break;
      case 'ai-preferences':
        setLocation('/settings/ai-preferences');
        break;
      case 'notifications-alerts':
        setLocation('/settings/notifications');
        break;
      case 'security':
        setLocation('/settings/security');
        break;
      case 'integrations':
        setLocation('/settings/integrations');
        break;
      case 'support-resources':
        setLocation('/settings/support');
        break;
      default:
        toast({
          title: "Feature Coming Soon",
          description: `${settingsCards.find(c => c.id === cardId)?.title} settings will be available in the next update`,
          duration: 3000,
        });
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <div className="flex items-center justify-center space-x-2">
          <SettingsIcon className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            Settings Hub
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Customize your workspace, manage integrations, and control your account preferences
        </p>
      </div>

      {/* Settings Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {settingsCards.map((card) => {
          // Determine if this card should show loading state
          const isLoading = (
            (card.id === 'ai-preferences' && preferencesLoading) ||
            (card.id === 'security' && securityLoading) ||
            (card.id === 'integrations' && integrationsLoading) ||
            (card.id === 'notifications-alerts' && preferencesLoading)
          );

          return (
            <Card 
              key={card.id} 
              className="group relative overflow-hidden gradient-card rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border border-slate-700/50 hover:border-primary/30"
              data-testid={`card-settings-${card.id}`}
            >
              <div className="h-full p-3 sm:p-4 md:p-6 flex flex-col">
                <CardHeader className="p-0 flex-1 space-y-2 sm:space-y-3">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="text-primary flex-shrink-0">
                        {card.icon}
                      </div>
                      <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white leading-tight" data-testid={`text-title-${card.id}`}>
                        {card.title}
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3" data-testid={`text-description-${card.id}`}>
                    {card.description}
                  </CardDescription>
                </CardHeader>
                
                <div className="flex justify-center mt-3 sm:mt-4">
                  <Button
                    onClick={() => handleSettingsAction(card.id)}
                    disabled={isLoading}
                    className="gradient-button w-full h-9 sm:h-10 text-xs sm:text-sm font-semibold"
                    data-testid={`button-action-${card.id}`}
                  >
                    {isLoading ? 'Loading...' : card.actionText}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {/* Quick Actions */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card tabIndex={0} className="group relative overflow-hidden gradient-card rounded-xl shadow-md hover:shadow-lg focus:shadow-lg transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900 p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-slate-800/50 transition-all duration-300">
              <Store className="w-5 h-5 stroke-2 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">2 Stores</h3>
              <p className="text-slate-300 text-sm">Connected</p>
            </div>
          </div>
        </Card>
        
        <Card tabIndex={0} className="group relative overflow-hidden gradient-card rounded-xl shadow-md hover:shadow-lg focus:shadow-lg transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900 p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-slate-800/50 transition-all duration-300">
              <Zap className="w-5 h-5 stroke-2 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">8 Active</h3>
              <p className="text-slate-300 text-sm">Integrations</p>
            </div>
          </div>
        </Card>
        
        <Card tabIndex={0} className="group relative overflow-hidden gradient-card rounded-xl shadow-md hover:shadow-lg focus:shadow-lg transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900 p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-slate-800/50 transition-all duration-300">
              <Shield className="w-5 h-5 stroke-2 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Secure</h3>
              <p className="text-slate-300 text-sm">2FA Enabled</p>
            </div>
          </div>
        </Card>
      </div>
      {/* Account Status */}
      <div className="mt-8 p-6 gradient-card rounded-xl bg-[#16162c]">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 flex items-center justify-center transition-all duration-300">
            <div className="w-5 h-5 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 stroke-2 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-2">Account Configuration</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Your Zyra AI account is fully configured with AI preferences optimized for your brand voice. 
              All integrations are active and security features are enabled. Your settings sync across 
              all connected stores and devices for a seamless experience.
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-green-400">All Systems Operational</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-blue-400">Pro Plan Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}