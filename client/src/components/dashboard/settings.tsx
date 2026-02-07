import { useQuery } from "@tanstack/react-query";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { StoreConnection, IntegrationSettings, SecuritySettings, UserPreferences } from "@shared/schema";

const ACCENT_COLORS: Record<string, string> = {
  'profile-account': '#00F0FF',
  'subscription-billing': '#A78BFA',
  'ai-preferences': '#22C55E',
  'notifications-alerts': '#F59E0B',
  'integrations': '#3B82F6',
  'security': '#EF4444',
  'support-resources': '#06B6D4',
};

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
  const [, setLocation] = useLocation();

  const { data: storeConnections, isLoading: storesLoading } = useQuery<StoreConnection[]>({
    queryKey: ['/api/store-connections'],
  });

  const { data: integrations, isLoading: integrationsLoading } = useQuery<IntegrationSettings[]>({
    queryKey: ['/api/integration-settings'],
  });

  const { data: securitySettings, isLoading: securityLoading } = useQuery<SecuritySettings>({
    queryKey: ['/api/security-settings'],
  });

  const { data: userPreferences, isLoading: preferencesLoading } = useQuery<UserPreferences>({
    queryKey: ['/api/user/preferences'],
  });

  const settingsCards: SettingsCard[] = [
    {
      id: 'profile-account',
      title: 'Profile & Account',
      description: 'Manage your personal information, connected stores, and language preferences',
      icon: <User className="w-5 h-5 stroke-2" />,
      features: ['Edit Profile (name, email, image)', 'Change Password', 'Connected Stores (Shopify, WooCommerce)', 'Multi-language UI + Auto-translation'],
      actionText: 'Manage Profile',
      category: 'account'
    },
    {
      id: 'subscription-billing',
      title: 'Subscription & Billing',
      description: 'View current plan, upgrade options, billing history, and payment methods',
      icon: <CreditCard className="w-5 h-5 stroke-2" />,
      features: ['Current Plan Overview', 'Upgrade/Downgrade Plans', 'Billing History & Invoices', 'Payment Method Management'],
      actionText: 'View Billing',
      category: 'billing'
    },
    {
      id: 'ai-preferences',
      title: 'AI Preferences',
      description: 'Customize AI behavior, brand voice, content style, and automation settings',
      icon: <Brain className="w-5 h-5 stroke-2" />,
      features: ['Brand Voice Memory (Luxury, Casual, Gen Z)', 'Default Content Style (Sales, SEO)', 'Auto-save AI Outputs', 'Scheduled AI Updates (3-6 months)'],
      actionText: 'Configure AI',
      category: 'preferences'
    },
    {
      id: 'notifications-alerts',
      title: 'Notifications & Alerts',
      description: 'Control email notifications, in-app alerts, and mobile push settings',
      icon: <Bell className="w-5 h-5 stroke-2" />,
      features: ['Email Notifications (Campaigns, Billing)', 'In-app Performance Alerts', 'Mobile Push Notifications', 'AI Recommendation Alerts'],
      actionText: 'Set Notifications',
      category: 'preferences'
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'Connect email providers, SMS services, analytics tools, and automation platforms',
      icon: <Zap className="w-5 h-5 stroke-2" />,
      features: ['Email (Gmail, Outlook, SMTP)', 'SMS (Twilio, Vonage)', 'Analytics (Google Analytics, Meta Pixel)', 'Zapier / Make Automation'],
      actionText: 'Manage Integrations',
      category: 'integrations'
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Two-factor authentication, login activity, API keys, and data management',
      icon: <Shield className="w-5 h-5 stroke-2" />,
      features: ['Two-Factor Authentication (2FA)', 'Login Activity Log', 'API Key Management', 'Data Export/Delete (GDPR)'],
      actionText: 'Security Settings',
      category: 'security'
    },
    {
      id: 'support-resources',
      title: 'Support & Resources',
      description: 'Access help center, contact support, submit feedback, and join community',
      icon: <HelpCircle className="w-5 h-5 stroke-2" />,
      features: ['Help Center (FAQs, Docs, Tutorials)', 'Contact Support (Live Chat, Email)', 'Feedback & Feature Requests', 'Community Forum / Slack'],
      actionText: 'Get Support',
      category: 'support'
    }
  ];


  const handleSettingsAction = (cardId: string) => {
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
      <div className="text-center space-y-4 mb-8">
        <div className="flex items-center justify-center space-x-2">
          <SettingsIcon className="w-8 h-8 text-[#00F0FF]" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00F0FF] to-blue-400 bg-clip-text text-transparent">
            Settings Hub
          </h1>
        </div>
        <p className="text-[#A9B4E5] text-lg max-w-2xl mx-auto">
          Customize your workspace, manage integrations, and control your account preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {settingsCards.map((card) => {
          const isLoading = (
            (card.id === 'ai-preferences' && preferencesLoading) ||
            (card.id === 'security' && securityLoading) ||
            (card.id === 'integrations' && integrationsLoading) ||
            (card.id === 'notifications-alerts' && preferencesLoading)
          );

          const accentColor = ACCENT_COLORS[card.id] || '#00F0FF';

          return (
            <Card 
              key={card.id} 
              className="group relative overflow-hidden rounded-2xl transition-all duration-300 border border-white/[0.06] hover:border-white/[0.12]"
              style={{
                background: '#131A33',
                boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
              }}
              data-testid={`card-settings-${card.id}`}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px] rounded-sm"
                style={{ backgroundColor: accentColor }}
              />
              <div className="h-full p-3 sm:p-4 md:p-6 pl-5 sm:pl-6 md:pl-8 flex flex-col">
                <CardHeader className="p-0 flex-1 space-y-2 sm:space-y-3">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="flex-shrink-0" style={{ color: accentColor }}>
                        {card.icon}
                      </div>
                      <CardTitle
                        className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold leading-tight"
                        style={{ color: '#E6F7FF' }}
                        data-testid={`text-title-${card.id}`}
                      >
                        {card.title}
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription
                    className="text-xs sm:text-sm leading-relaxed line-clamp-3"
                    style={{ color: '#A9B4E5' }}
                    data-testid={`text-description-${card.id}`}
                  >
                    {card.description}
                  </CardDescription>
                </CardHeader>
                
                <div className="flex justify-center mt-3 sm:mt-4">
                  <Button
                    onClick={() => handleSettingsAction(card.id)}
                    disabled={isLoading}
                    className="w-full h-9 sm:h-10 text-xs sm:text-sm font-semibold border-0 rounded-lg transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #00F0FF, #00FFE5)',
                      color: '#04141C',
                      boxShadow: '0 6px 20px rgba(0,240,255,0.45)',
                    }}
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

      <div
        className="mt-12 rounded-xl border"
        style={{
          background: '#0F1C2E',
          borderColor: 'rgba(255,255,255,0.06)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
          <div className="p-5 sm:p-6">
            <div className="flex items-center space-x-4">
              <div
                className="p-3 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)' }}
              >
                <Store className="w-5 h-5 stroke-2" style={{ color: '#22C55E' }} />
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: '#9EFFC3' }} data-testid="text-stores-count">
                  {storesLoading ? <Skeleton className="h-6 w-16" /> : `${storeConnections?.length || 0} Store${(storeConnections?.length || 0) !== 1 ? 's' : ''}`}
                </h3>
                <p className="text-sm" style={{ color: '#7C86B8' }}>Connected</p>
              </div>
            </div>
          </div>
          
          <div className="p-5 sm:p-6">
            <div className="flex items-center space-x-4">
              <div
                className="p-3 rounded-full"
                style={{ background: 'rgba(0,240,255,0.12)' }}
              >
                <Zap className="w-5 h-5 stroke-2" style={{ color: '#00F0FF' }} />
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: '#A5F3FC' }} data-testid="text-integrations-count">
                  {integrationsLoading ? <Skeleton className="h-6 w-16" /> : `${integrations?.length || 0} Active`}
                </h3>
                <p className="text-sm" style={{ color: '#7C86B8' }}>Integrations</p>
              </div>
            </div>
          </div>
          
          <div className="p-5 sm:p-6">
            <div className="flex items-center space-x-4">
              <div
                className="p-3 rounded-full"
                style={{
                  background: securitySettings?.twoFactorEnabled
                    ? 'rgba(34,197,94,0.12)'
                    : 'rgba(239,68,68,0.12)',
                }}
              >
                <Shield
                  className="w-5 h-5 stroke-2"
                  style={{
                    color: securitySettings?.twoFactorEnabled ? '#22C55E' : '#EF4444',
                  }}
                />
              </div>
              <div>
                <h3
                  className="font-bold text-lg"
                  style={{
                    color: securitySettings?.twoFactorEnabled ? '#9EFFC3' : '#FCA5A5',
                  }}
                  data-testid="text-security-status"
                >
                  {securityLoading ? <Skeleton className="h-6 w-16" /> : (securitySettings?.twoFactorEnabled ? 'Secure' : 'Unsecured')}
                </h3>
                <span className="text-sm block" style={{ color: '#7C86B8' }}>
                  {securityLoading ? <Skeleton className="h-4 w-24" /> : (securitySettings?.twoFactorEnabled ? '2FA Enabled' : '2FA Disabled')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="mt-8 rounded-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0E3B44, #122B3A)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-sm"
          style={{ backgroundColor: '#00F0FF' }}
        />
        <div className="p-6 pl-8">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <SettingsIcon className="w-5 h-5 stroke-2" style={{ color: '#00F0FF' }} />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#E6F7FF' }}>Account Configuration</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#B6C2FF' }}>
                Your Zyra AI account is fully configured with AI preferences optimized for your brand voice. 
                All integrations are active and security features are enabled. Your settings sync across 
                all connected stores and devices for a seamless experience.
              </p>
              <div className="flex items-center space-x-4 mt-4 flex-wrap gap-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
                  <span className="text-sm" style={{ color: '#9EFFC3' }}>All Systems Operational</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00F0FF' }} />
                  <span className="text-sm" style={{ color: '#A5F3FC' }}>Pro Plan Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
