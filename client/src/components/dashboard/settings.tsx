import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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
    <div className="p-6 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Settings & Configuration
            </h1>
            <p className="text-slate-300 text-lg">
              Customize your Zyra experience, manage integrations, and configure AI preferences
            </p>
          </div>
        </div>
      </div>
      {/* Settings Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {settingsCards.map((card) => {
          // Determine if this card should show loading state
          const isLoading = (
            (card.id === 'ai-preferences' && preferencesLoading) ||
            (card.id === 'security' && securityLoading) ||
            (card.id === 'integrations' && integrationsLoading) ||
            (card.id === 'notifications-alerts' && preferencesLoading)
          );
          
          const hasError = (
            (card.id === 'ai-preferences' && preferencesError) ||
            (card.id === 'security' && securityError) ||
            (card.id === 'integrations' && integrationsError) ||
            (card.id === 'notifications-alerts' && preferencesError)
          );

          const retryQuery = () => {
            if (card.id === 'ai-preferences') {
              queryClient.refetchQueries({ queryKey: ['/api/settings/preferences'] });
            } else if (card.id === 'security') {
              queryClient.refetchQueries({ queryKey: ['/api/settings/security'] });
            } else if (card.id === 'integrations') {
              queryClient.refetchQueries({ queryKey: ['/api/settings/integrations'] });
            } else if (card.id === 'notifications-alerts') {
              queryClient.refetchQueries({ queryKey: ['/api/settings/preferences'] });
            }
          };

          return (
            <Card 
              key={card.id} 
              tabIndex={0}
              className="group relative overflow-hidden gradient-card rounded-xl shadow-md hover:shadow-lg focus:shadow-lg transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900"
              data-testid={`card-settings-${card.id}`}
            >
              {isLoading ? (
                // Card-level skeleton loading state
                (<>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-6 h-6 bg-slate-700 rounded" />
                        <Skeleton className="h-6 w-32 bg-slate-700 rounded" />
                      </div>
                      <Skeleton className="h-6 w-16 bg-slate-700 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full bg-slate-700 rounded mb-4" />
                    <Skeleton className="h-4 w-3/4 bg-slate-700 rounded mb-2" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full bg-slate-600 rounded" />
                      <Skeleton className="h-3 w-5/6 bg-slate-600 rounded" />
                      <Skeleton className="h-3 w-4/5 bg-slate-600 rounded" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Skeleton className="h-10 w-full bg-slate-700 rounded-lg" />
                  </CardContent>
                </>)
              ) : hasError ? (
                // Error state with retry
                (<>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 flex items-center justify-center">
                          {card.icon}
                        </div>
                        <CardTitle className="text-white font-bold text-lg">{card.title}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                        Error
                      </Badge>
                    </div>
                    <CardDescription className="text-slate-300 mb-4">
                      Failed to load {card.title.toLowerCase()}. Please try again.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      onClick={retryQuery}
                      className="w-full font-medium transition-all duration-300 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                      data-testid={`button-retry-${card.id}`}
                    >
                      Try Again
                    </Button>
                  </CardContent>
                </>)
              ) : (
                // Regular card content
                (<>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 flex items-center justify-center transition-all duration-300">
                          <div className="w-5 h-5 flex items-center justify-center">
                            {card.icon}
                          </div>
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-white font-bold text-lg leading-none" data-testid={`text-title-${card.id}`}>
                            {card.title}
                          </CardTitle>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 capitalize"
                        data-testid={`badge-category-${card.id}`}
                      >
                        {card.category}
                      </Badge>
                    </div>
                    <CardDescription className="text-slate-300 mt-2 mb-4" data-testid={`text-description-${card.id}`}>
                      {card.description}
                    </CardDescription>
                    
                    {/* Feature List */}
                    <div className="space-y-2">
                      {card.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-slate-300" data-testid={`feature-${card.id}-${index}`}>
                          <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      onClick={() => handleSettingsAction(card.id)}
                      disabled={preferencesLoading || securityLoading || integrationsLoading}
                      className="w-full font-medium transition-colors duration-300 gradient-button"
                      data-testid={`button-action-${card.id}`}
                    >
                      {(preferencesLoading || securityLoading || integrationsLoading) ? 
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-900"></div>
                          <span>Loading...</span>
                        </div>
                        : card.actionText
                      }
                    </Button>
                  </CardContent>
                </>)
              )}
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
              Your Zyra account is fully configured with AI preferences optimized for your brand voice. 
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
    </div>
  );
}