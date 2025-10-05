import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
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
  Store,
  Globe,
  Mail,
  MessageSquare,
  BarChart3,
  Key,
  Download,
  Trash2,
  Eye,
  Edit3,
  Lock,
  Smartphone,
  FileText,
  ExternalLink,
  Users,
  ArrowLeft
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
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [aiConfigModalOpen, setAiConfigModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [integrationsModalOpen, setIntegrationsModalOpen] = useState(false);

  // Handle back navigation
  const handleGoBack = () => {
    // Check if navigation came from a specific source
    const navigationSource = sessionStorage.getItem('navigationSource');
    if (navigationSource === 'ai-tools') {
      setLocation('/dashboard');
    } else if (navigationSource === 'automation') {
      setLocation('/dashboard');
    } else {
      // Default back to main dashboard
      setLocation('/dashboard');
    }
  };

  // Centralized auth error handler
  const handleAuthError = (error: any) => {
    if (error?.status === 401) {
      toast({
        title: "Authentication Required",
        description: "Redirecting to login page...",
        variant: "destructive",
        duration: 3000,
      });
      setTimeout(() => {
        setLocation('/login');
      }, 1000);
      return false;
    }
    return true;
  };

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

  // Mutation for updating preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/settings/preferences', 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/preferences'] });
      toast({
        title: "Preferences Updated",
        description: "Your AI preferences have been saved successfully",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      if (error?.status === 401) {
        handleAuthError(error);
      } else {
        toast({
          title: "Update Failed",
          description: error.message || "Failed to update preferences",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  });

  // Mutation for updating security settings
  const updateSecurityMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/settings/security', 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/security'] });
      toast({
        title: "Security Updated",
        description: "Your security settings have been saved",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      if (error?.status === 401) {
        handleAuthError(error);
      } else {
        toast({
          title: "Update Failed",
          description: error.message || "Failed to update security settings",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  });

  const handleSettingsAction = (cardId: string) => {
    // Handle specific navigation pages
    if (cardId === 'profile-account') {
      sessionStorage.setItem('navigationSource', 'settings');
      setLocation('/profile');
      return;
    }
    
    if (cardId === 'subscription-billing') {
      sessionStorage.setItem('navigationSource', 'settings');
      setLocation('/billing');
      return;
    }

    // Open interactive modals for each settings category
    switch (cardId) {
      case 'ai-preferences':
        setAiConfigModalOpen(true);
        break;
      case 'notifications-alerts':
        setNotificationsModalOpen(true);
        break;
      case 'security':
        setSecurityModalOpen(true);
        break;
      case 'integrations':
        setIntegrationsModalOpen(true);
        break;
      case 'support-resources':
        // For support, show a toast with helpful information
        toast({
          title: "Support Resources",
          description: "Access our help center, live chat, and community forums for assistance",
          duration: 4000,
        });
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
                      className="w-full font-medium transition-all duration-300 gradient-button hover:scale-105"
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
      {/* AI Preferences Modal */}
      <Dialog open={aiConfigModalOpen} onOpenChange={setAiConfigModalOpen}>
        <DialogContent className="sm:max-w-[500px] gradient-card border-0">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Brain className="w-5 h-5 text-primary" />
              <span>AI Preferences</span>
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Customize how Zyra AI adapts to your brand and creates content
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {preferencesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full bg-slate-700" />
                <Skeleton className="h-10 w-full bg-slate-700" />
                <Skeleton className="h-4 w-3/4 bg-slate-700" />
                <Skeleton className="h-10 w-full bg-slate-700" />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-white">Brand Voice</Label>
                  <Select 
                    value={userPreferences?.aiSettings?.defaultBrandVoice || "professional"}
                    onValueChange={(value) => {
                      updatePreferencesMutation.mutate({
                        aiSettings: {
                          ...(userPreferences?.aiSettings || {}),
                          defaultBrandVoice: value
                        }
                      });
                    }}
                  >
                    <SelectTrigger className="form-select text-white" data-testid="select-brand-voice">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="gradient-surface">
                      <SelectItem value="professional" data-testid="option-professional">Professional & Expert</SelectItem>
                      <SelectItem value="casual" data-testid="option-casual">Casual & Friendly</SelectItem>
                      <SelectItem value="luxury" data-testid="option-luxury">Luxury & Premium</SelectItem>
                      <SelectItem value="playful" data-testid="option-playful">Playful & Creative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-white">Content Style</Label>
                  <Select 
                    value={userPreferences?.aiSettings?.contentStyle || "seo"}
                    onValueChange={(value) => {
                      updatePreferencesMutation.mutate({
                        aiSettings: {
                          ...(userPreferences?.aiSettings || {}),
                          contentStyle: value
                        }
                      });
                    }}
                  >
                    <SelectTrigger className="form-select text-white" data-testid="select-content-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="gradient-surface">
                      <SelectItem value="seo" data-testid="option-seo">SEO-Optimized</SelectItem>
                      <SelectItem value="sales" data-testid="option-sales">Sales-Focused</SelectItem>
                      <SelectItem value="educational" data-testid="option-educational">Educational & Informative</SelectItem>
                      <SelectItem value="storytelling" data-testid="option-storytelling">Storytelling & Emotional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="bg-slate-700" />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-white">Auto-save AI Outputs</Label>
                    <p className="text-xs text-slate-400">Automatically save generated content to your library</p>
                  </div>
                  <Switch
                    checked={userPreferences?.aiSettings?.autoSaveOutputs || false}
                    onCheckedChange={(checked) => {
                      updatePreferencesMutation.mutate({
                        aiSettings: {
                          ...(userPreferences?.aiSettings || {}),
                          autoSaveOutputs: checked
                        }
                      });
                    }}
                    className="data-[state=checked]:bg-primary"
                    data-testid="switch-auto-save"
                  />
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setAiConfigModalOpen(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    data-testid="button-close-ai-modal"
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Security Settings Modal */}
      <Dialog open={securityModalOpen} onOpenChange={setSecurityModalOpen}>
        <DialogContent className="sm:max-w-[500px] gradient-card border-0">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>Security Settings</span>
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Manage your account security, 2FA, and login preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {securityLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full bg-slate-700" />
                <Skeleton className="h-10 w-full bg-slate-700" />
                <Skeleton className="h-4 w-3/4 bg-slate-700" />
                <Skeleton className="h-10 w-full bg-slate-700" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-white">Two-Factor Authentication</Label>
                    <p className="text-xs text-slate-400">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    checked={(securitySettings as any)?.twoFactorEnabled || false}
                    onCheckedChange={(checked) => {
                      updateSecurityMutation.mutate({
                        twoFactorEnabled: checked
                      });
                    }}
                    className="data-[state=checked]:bg-primary"
                    data-testid="switch-two-factor"
                  />
                </div>

                <Separator className="bg-slate-700" />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-white">Login Notifications</Label>
                    <p className="text-xs text-slate-400">Get notified when someone logs into your account</p>
                  </div>
                  <Switch
                    checked={(securitySettings as any)?.loginNotifications || false}
                    onCheckedChange={(checked) => {
                      updateSecurityMutation.mutate({
                        loginNotifications: checked
                      });
                    }}
                    className="data-[state=checked]:bg-primary"
                    data-testid="switch-login-notifications"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-white">Session Timeout</Label>
                  <Select 
                    value={(securitySettings as any)?.sessionTimeout?.toString() || "3600"}
                    onValueChange={(value) => {
                      updateSecurityMutation.mutate({
                        sessionTimeout: parseInt(value)
                      });
                    }}
                  >
                    <SelectTrigger className="form-select text-white" data-testid="select-session-timeout">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="gradient-surface">
                      <SelectItem value="1800" data-testid="option-30min">30 minutes</SelectItem>
                      <SelectItem value="3600" data-testid="option-1hour">1 hour</SelectItem>
                      <SelectItem value="7200" data-testid="option-2hours">2 hours</SelectItem>
                      <SelectItem value="21600" data-testid="option-6hours">6 hours</SelectItem>
                      <SelectItem value="86400" data-testid="option-24hours">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setSecurityModalOpen(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    data-testid="button-close-security-modal"
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Notifications Settings Modal */}
      <Dialog open={notificationsModalOpen} onOpenChange={setNotificationsModalOpen}>
        <DialogContent className="sm:max-w-[500px] gradient-card border-0">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Bell className="w-5 h-5 text-primary" />
              <span>Notification Settings</span>
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Control your email, in-app, and mobile notification preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {preferencesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full bg-slate-700" />
                <Skeleton className="h-10 w-full bg-slate-700" />
                <Skeleton className="h-4 w-3/4 bg-slate-700" />
                <Skeleton className="h-10 w-full bg-slate-700" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-white">Email Notifications</Label>
                    <p className="text-xs text-slate-400">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={userPreferences?.notificationSettings?.email || false}
                    onCheckedChange={(checked) => {
                      updatePreferencesMutation.mutate({
                        notificationSettings: {
                          ...(userPreferences?.notificationSettings || {}),
                          email: checked
                        }
                      });
                    }}
                    className="data-[state=checked]:bg-primary"
                    data-testid="switch-email-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-white">In-App Notifications</Label>
                    <p className="text-xs text-slate-400">Show notifications within the app</p>
                  </div>
                  <Switch
                    checked={userPreferences?.notificationSettings?.inApp || false}
                    onCheckedChange={(checked) => {
                      updatePreferencesMutation.mutate({
                        notificationSettings: {
                          ...(userPreferences?.notificationSettings || {}),
                          inApp: checked
                        }
                      });
                    }}
                    className="data-[state=checked]:bg-primary"
                    data-testid="switch-inapp-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-white">Push Notifications</Label>
                    <p className="text-xs text-slate-400">Receive mobile push notifications</p>
                  </div>
                  <Switch
                    checked={userPreferences?.notificationSettings?.push || false}
                    onCheckedChange={(checked) => {
                      updatePreferencesMutation.mutate({
                        notificationSettings: {
                          ...(userPreferences?.notificationSettings || {}),
                          push: checked
                        }
                      });
                    }}
                    className="data-[state=checked]:bg-primary"
                    data-testid="switch-push-notifications"
                  />
                </div>

                <Separator className="bg-slate-700" />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-white">AI Recommendations</Label>
                    <p className="text-xs text-slate-400">Get notified about AI-generated insights</p>
                  </div>
                  <Switch
                    checked={userPreferences?.notificationSettings?.aiRecommendations || false}
                    onCheckedChange={(checked) => {
                      updatePreferencesMutation.mutate({
                        notificationSettings: {
                          ...(userPreferences?.notificationSettings || {}),
                          aiRecommendations: checked
                        }
                      });
                    }}
                    className="data-[state=checked]:bg-primary"
                    data-testid="switch-ai-recommendations"
                  />
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setNotificationsModalOpen(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    data-testid="button-close-notifications-modal"
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Integrations Settings Modal */}
      <Dialog open={integrationsModalOpen} onOpenChange={setIntegrationsModalOpen}>
        <DialogContent className="sm:max-w-[600px] gradient-card border-0">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary" />
              <span>Integration Management</span>
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Connect and manage your external services and automation tools
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4 max-h-[500px] overflow-y-auto">
            {integrationsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full bg-slate-700 rounded-lg" />
                <Skeleton className="h-20 w-full bg-slate-700 rounded-lg" />
                <Skeleton className="h-20 w-full bg-slate-700 rounded-lg" />
              </div>
            ) : (
              <>
                {(integrations as any)?.length ? (
                  <div className="space-y-4">
                    {integrations.map((integration: any) => (
                      <Card key={integration.id} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                                <Zap className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="text-white font-medium">{integration.serviceName}</h4>
                                <p className="text-sm text-slate-400">{integration.serviceType}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={integration.isActive ? "default" : "secondary"}
                                className={integration.isActive ? 
                                  "bg-green-500/20 text-green-400" : 
                                  "bg-slate-500/20 text-slate-400"
                                }
                              >
                                {integration.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Switch
                                checked={integration.isActive}
                                onCheckedChange={(checked) => {
                                  toast({
                                    title: "Integration Updated",
                                    description: `${integration.serviceName} has been ${checked ? 'activated' : 'deactivated'}`,
                                    duration: 3000,
                                  });
                                }}
                                className="data-[state=checked]:bg-primary"
                                data-testid={`switch-integration-${integration.id}`}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Zap className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                    <h3 className="text-white font-medium mb-2">No Integrations Yet</h3>
                    <p className="text-slate-400 text-sm">Connect your first integration to get started</p>
                  </div>
                )}

                <div className="pt-4 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setIntegrationsModalOpen(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    data-testid="button-close-integrations-modal"
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}