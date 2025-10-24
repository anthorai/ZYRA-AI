import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Zap, ArrowLeft, Mail, MessageSquare, BarChart3, Link2, Plus, X, ShoppingBag, CreditCard, Send } from "lucide-react";
import { SiPaypal, SiSendgrid, SiTwilio } from "react-icons/si";

interface Integration {
  id: string;
  name: string;
  type: string;
  icon: JSX.Element;
  isConnected: boolean;
  description: string;
  label: string;
  tooltip: string;
  labelType: "recommended" | "optional" | "advanced";
}

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "shopify",
      name: "Shopify",
      type: "E-Commerce Platform",
      icon: <ShoppingBag className="w-5 h-5" />,
      isConnected: false,
      description: "Sync your Shopify products, collections, and analytics with Zyra AI to enable real-time optimization, auto publishing, and sales automation.",
      label: "For Shopify Sellers 🛒",
      tooltip: "Required to sync products, analytics, and automation between Zyra AI & your Shopify store.",
      labelType: "recommended"
    },
    {
      id: "paypal",
      name: "PayPal",
      type: "Payment Gateway",
      icon: <SiPaypal className="w-5 h-5" />,
      isConnected: false,
      description: "Accept international payments with PayPal. Enable checkout for global customers with credit cards, debit cards, and PayPal accounts.",
      label: "For Global Sellers 🌍",
      tooltip: "Required to process international payments and enable PayPal checkout for your customers.",
      labelType: "recommended"
    },
    {
      id: "sendgrid",
      name: "SendGrid",
      type: "Email Marketing",
      icon: <SiSendgrid className="w-5 h-5" />,
      isConnected: false,
      description: "Send marketing emails, abandoned cart recovery, and transactional emails with SendGrid. Includes email analytics and delivery tracking.",
      label: "For Email Marketers 📧",
      tooltip: "Send AI-powered email campaigns, cart recovery emails, and track performance with detailed analytics.",
      labelType: "recommended"
    },
    {
      id: "gmail",
      name: "Gmail",
      type: "Email Provider",
      icon: <Mail className="w-5 h-5" />,
      isConnected: true,
      description: "Send marketing emails via Gmail",
      label: "For All Businesses 💼",
      tooltip: "Send AI-powered marketing & upsell emails directly from Zyra AI.",
      labelType: "optional"
    },
    {
      id: "outlook",
      name: "Outlook",
      type: "Email Provider",
      icon: <Mail className="w-5 h-5" />,
      isConnected: false,
      description: "Microsoft email integration",
      label: "For B2B & Corporate Teams 🧾",
      tooltip: "Sync Outlook accounts for enterprise-level communication.",
      labelType: "optional"
    },
    {
      id: "twilio",
      name: "Twilio",
      type: "SMS Service",
      icon: <SiTwilio className="w-5 h-5" />,
      isConnected: false,
      description: "Send SMS campaigns, abandoned cart recovery, and order notifications via Twilio. Track delivery and engagement rates.",
      label: "For Ecom Sellers & Marketers 📲",
      tooltip: "Send SMS campaigns, abandoned cart alerts, and promotions to boost sales.",
      labelType: "recommended"
    },
    {
      id: "analytics",
      name: "Google Analytics",
      type: "Analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      isConnected: true,
      description: "Track campaign performance",
      label: "Recommended for All Users 📈",
      tooltip: "Track website traffic, product performance, and conversions.",
      labelType: "recommended"
    },
    {
      id: "meta-pixel",
      name: "Meta Pixel",
      type: "Analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      isConnected: true,
      description: "Facebook & Instagram tracking",
      label: "For Social Ad Sellers 🎯",
      tooltip: "Connect to Facebook & Instagram for retargeting and ad tracking.",
      labelType: "optional"
    },
    {
      id: "zapier",
      name: "Zapier",
      type: "Automation",
      icon: <Zap className="w-5 h-5" />,
      isConnected: false,
      description: "Connect with 5000+ apps",
      label: "For Agencies & Power Users ⚙️",
      tooltip: "Automate workflows across 5000+ apps and marketing tools.",
      labelType: "advanced"
    }
  ]);

  const [showApiKeyInput, setShowApiKeyInput] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [shopDomain, setShopDomain] = useState("");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalClientSecret, setPaypalClientSecret] = useState("");

  // Fetch integration connection statuses on mount
  useEffect(() => {
    const fetchIntegrationStatuses = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: sessionData } = await supabase.auth.getSession();
        let token = sessionData.session?.access_token || '';

        // If no token, try refreshing the session
        if (!token) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          token = refreshData.session?.access_token || '';
        }

        // If still no token, user is not authenticated - skip status check
        if (!token) {
          return;
        }

        // Fetch Shopify connection status
        const shopifyResponse = await fetch('/api/shopify/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        if (shopifyResponse.ok) {
          const shopifyData = await shopifyResponse.json();
          if (shopifyData.isConnected) {
            setIntegrations(prev =>
              prev.map(integration =>
                integration.id === 'shopify'
                  ? { ...integration, isConnected: true }
                  : integration
              )
            );
          }
        }

        // Fetch all integration settings (PayPal, SendGrid, etc.)
        const integrationsResponse = await fetch('/api/settings/integrations', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (integrationsResponse.ok) {
          const integrationSettings = await integrationsResponse.json();
          
          // Update integration status based on saved settings
          setIntegrations(prev =>
            prev.map(integration => {
              const setting = integrationSettings.find(
                (s: any) => s.provider === integration.id
              );
              if (setting && setting.isActive) {
                return { ...integration, isConnected: true };
              }
              return integration;
            })
          );
        }
      } catch (error) {
        console.error('Failed to fetch integration statuses:', error);
      }
    };

    fetchIntegrationStatuses();
  }, []);

  // Helper function to get label color based on type and connection status
  const getLabelStyles = (labelType: "recommended" | "optional" | "advanced", isConnected: boolean) => {
    const baseStyles = "px-3 py-1 rounded-full text-xs font-medium transition-all duration-300";
    
    if (isConnected) {
      // Connected - neon glow effect
      switch (labelType) {
        case "recommended":
          return `${baseStyles} bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.5)]`;
        case "optional":
          return `${baseStyles} bg-[#FF00F5]/20 text-[#FF00F5] border border-[#FF00F5] shadow-[0_0_10px_rgba(255,0,245,0.5)]`;
        case "advanced":
          return `${baseStyles} bg-[#00FFE5]/20 text-[#00FFE5] border border-[#00FFE5] shadow-[0_0_10px_rgba(0,255,229,0.5)]`;
      }
    } else {
      // Disconnected - dimmed gray
      return `${baseStyles} bg-slate-500/10 text-slate-400 border border-slate-600/50`;
    }
  };

  const handleConnect = async (id: string) => {
    // Special handling for Shopify OAuth
    if (id === 'shopify') {
      const shop = prompt('Enter your Shopify store domain (e.g., mystore.myshopify.com or just mystore):');
      if (!shop) return;

      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: sessionData } = await supabase.auth.getSession();
        let token = sessionData.session?.access_token || '';

        // If no token, try refreshing the session
        if (!token) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          token = refreshData.session?.access_token || '';
        }

        if (!token) {
          toast({
            title: "Authentication Required",
            description: "Please log in again to connect Shopify",
            variant: "destructive",
            duration: 3000,
          });
          return;
        }

        const response = await fetch('/api/shopify/auth', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ shop: shop.trim() }),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to initiate Shopify OAuth');
        }

        const data = await response.json();
        
        // Open OAuth popup
        const popup = window.open(
          data.authUrl,
          'Shopify OAuth',
          'width=600,height=700'
        );

        // Listen for OAuth completion
        const messageHandler = (event: MessageEvent) => {
          // Validate message origin and source
          if (event.origin !== window.location.origin || event.source !== popup) {
            return; // Ignore messages from other origins or windows
          }

          if (event.data.type === 'shopify-connected') {
            if (event.data.success) {
              setIntegrations(prev =>
                prev.map(integration =>
                  integration.id === 'shopify'
                    ? { ...integration, isConnected: true }
                    : integration
                )
              );
              
              toast({
                title: "Shopify Connected",
                description: "Your Shopify store has been successfully connected",
                duration: 3000,
              });
            } else {
              toast({
                title: "Connection Failed",
                description: event.data.error || "Failed to connect to Shopify",
                variant: "destructive",
                duration: 3000,
              });
            }
            window.removeEventListener('message', messageHandler);
          }
        };

        window.addEventListener('message', messageHandler);

        // Cleanup listener if popup is closed without completing OAuth
        const checkPopupClosed = setInterval(() => {
          if (popup && popup.closed) {
            clearInterval(checkPopupClosed);
            window.removeEventListener('message', messageHandler);
          }
        }, 1000);
      } catch (error) {
        console.error('Shopify OAuth error:', error);
        toast({
          title: "Connection Failed",
          description: "Failed to connect to Shopify. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
      return;
    }

    // Show input form if not already shown
    if (!showApiKeyInput) {
      setShowApiKeyInput(id);
      return;
    }

    // Validate and save credentials for PayPal
    if (id === 'paypal') {
      if (!paypalClientId.trim() || !paypalClientSecret.trim()) {
        toast({
          title: "Credentials Required",
          description: "Please enter both PayPal Client ID and Client Secret",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: sessionData } = await supabase.auth.getSession();
        let token = sessionData.session?.access_token || '';

        if (!token) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          token = refreshData.session?.access_token || '';
        }

        if (!token) {
          toast({
            title: "Authentication Required",
            description: "Please log in again to connect PayPal",
            variant: "destructive",
            duration: 3000,
          });
          return;
        }

        const response = await fetch('/api/settings/integrations', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            integrationType: 'payment',
            provider: 'paypal',
            credentials: {
              clientId: paypalClientId.trim(),
              clientSecret: paypalClientSecret.trim()
            },
            isActive: true
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to save PayPal credentials');
        }

        setIntegrations(prev =>
          prev.map(integration =>
            integration.id === 'paypal'
              ? { ...integration, isConnected: true }
              : integration
          )
        );
        
        toast({
          title: "PayPal Connected",
          description: "Your PayPal credentials have been securely saved",
          duration: 3000,
        });
        
        setShowApiKeyInput(null);
        setPaypalClientId("");
        setPaypalClientSecret("");
      } catch (error) {
        console.error('PayPal connection error:', error);
        toast({
          title: "Connection Failed",
          description: "Failed to connect PayPal. Please check your credentials.",
          variant: "destructive",
          duration: 3000,
        });
      }
      return;
    }

    // Validate and save credentials for SendGrid
    if (id === 'sendgrid') {
      if (!apiKey.trim()) {
        toast({
          title: "API Key Required",
          description: "Please enter your SendGrid API key",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: sessionData } = await supabase.auth.getSession();
        let token = sessionData.session?.access_token || '';

        if (!token) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          token = refreshData.session?.access_token || '';
        }

        if (!token) {
          toast({
            title: "Authentication Required",
            description: "Please log in again to connect SendGrid",
            variant: "destructive",
            duration: 3000,
          });
          return;
        }

        const response = await fetch('/api/settings/integrations', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            integrationType: 'email',
            provider: 'sendgrid',
            credentials: {
              apiKey: apiKey.trim()
            },
            isActive: true
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to save SendGrid credentials');
        }

        setIntegrations(prev =>
          prev.map(integration =>
            integration.id === 'sendgrid'
              ? { ...integration, isConnected: true }
              : integration
          )
        );
        
        toast({
          title: "SendGrid Connected",
          description: "Your SendGrid API key has been securely saved",
          duration: 3000,
        });
        
        setShowApiKeyInput(null);
        setApiKey("");
      } catch (error) {
        console.error('SendGrid connection error:', error);
        toast({
          title: "Connection Failed",
          description: "Failed to connect SendGrid. Please check your API key.",
          variant: "destructive",
          duration: 3000,
        });
      }
      return;
    }

    // Generic API key flow for other integrations
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter an API key to connect",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === id
          ? { ...integration, isConnected: true }
          : integration
      )
    );
    
    toast({
      title: "Integration Connected",
      description: `Successfully connected to ${integrations.find(i => i.id === id)?.name}`,
      duration: 3000,
    });
    
    setShowApiKeyInput(null);
    setApiKey("");
  };

  const handleDisconnect = async (id: string, name: string) => {
    // Special handling for Shopify disconnect
    if (id === 'shopify') {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: sessionData } = await supabase.auth.getSession();
        let token = sessionData.session?.access_token || '';

        // If no token, try refreshing the session
        if (!token) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          token = refreshData.session?.access_token || '';
        }

        if (!token) {
          toast({
            title: "Authentication Required",
            description: "Please log in again to disconnect Shopify",
            variant: "destructive",
            duration: 3000,
          });
          return;
        }

        const response = await fetch('/api/shopify/disconnect', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to disconnect Shopify');
        }

        setIntegrations(prev =>
          prev.map(integration =>
            integration.id === 'shopify'
              ? { ...integration, isConnected: false }
              : integration
          )
        );
        
        toast({
          title: "Shopify Disconnected",
          description: "Your Shopify store has been disconnected",
          duration: 3000,
        });
      } catch (error) {
        console.error('Shopify disconnect error:', error);
        toast({
          title: "Disconnection Failed",
          description: "Failed to disconnect Shopify. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
      return;
    }

    // Disconnect PayPal, SendGrid, and other integrations by deleting from backend
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: sessionData } = await supabase.auth.getSession();
      let token = sessionData.session?.access_token || '';

      if (!token) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        token = refreshData.session?.access_token || '';
      }

      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in again to disconnect",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      // Fetch all integrations to find the ID of the one to delete
      const integrationsResponse = await fetch('/api/settings/integrations', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!integrationsResponse.ok) {
        throw new Error('Failed to fetch integrations');
      }

      const integrationSettings = await integrationsResponse.json();
      const integrationToDelete = integrationSettings.find(
        (s: any) => s.provider === id
      );

      if (!integrationToDelete) {
        // Integration not found in backend, just update frontend
        setIntegrations(prev =>
          prev.map(integration =>
            integration.id === id
              ? { ...integration, isConnected: false }
              : integration
          )
        );
        
        toast({
          title: "Integration Disconnected",
          description: `${name} has been disconnected`,
          duration: 3000,
        });
        return;
      }

      // Delete the integration from backend
      const deleteResponse = await fetch(`/api/settings/integrations/${integrationToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete integration');
      }

      // Update frontend state
      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === id
            ? { ...integration, isConnected: false }
            : integration
        )
      );
      
      toast({
        title: "Integration Disconnected",
        description: `${name} has been disconnected and credentials removed`,
        duration: 3000,
      });
    } catch (error) {
      console.error(`${name} disconnect error:`, error);
      toast({
        title: "Disconnection Failed",
        description: `Failed to disconnect ${name}. Please try again.`,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/settings')}
          className="text-slate-300 hover:text-white hover:bg-slate-800"
          data-testid="button-back-to-settings"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Settings
        </Button>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="p-3 rounded-lg bg-primary/20">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Integrations
          </h1>
          <p className="text-slate-300 text-lg mt-1">
            Connect email providers, SMS services, analytics tools, and automation platforms
          </p>
        </div>
      </div>

      {/* Connected Summary */}
      <Card className="gradient-card border-0 bg-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link2 className="w-6 h-6 text-primary" />
              <div>
                <h3 className="text-white font-semibold text-lg">
                  {integrations.filter(i => i.isConnected).length} Active Integrations
                </h3>
                <p className="text-slate-400 text-sm">
                  {integrations.filter(i => !i.isConnected).length} more available to connect
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary/20"
              data-testid="button-add-integration"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integrations List */}
      <TooltipProvider>
        <div className="space-y-4">
          {integrations.map((integration) => (
            <Card key={integration.id} className="gradient-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${integration.isConnected ? 'bg-primary/20' : 'bg-slate-800/50'}`}>
                      <div className={integration.isConnected ? 'text-primary' : 'text-slate-400'}>
                        {integration.icon}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-white font-semibold">{integration.name}</h3>
                        <Badge
                          variant={integration.isConnected ? "default" : "secondary"}
                          className={integration.isConnected
                            ? "bg-green-500/20 text-green-400"
                            : "bg-slate-500/20 text-slate-400"
                          }
                        >
                          {integration.isConnected ? "Connected" : "Not Connected"}
                        </Badge>
                      </div>
                      
                      {/* Glowing Label with Tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className={getLabelStyles(integration.labelType, integration.isConnected)}
                            style={{ display: 'inline-block', cursor: 'help' }}
                          >
                            {integration.label}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent 
                          className="bg-slate-900 border-slate-700 text-slate-200 max-w-xs"
                          side="bottom"
                        >
                          <p className="text-sm">{integration.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <p className="text-sm text-slate-400 mt-2">{integration.type}</p>
                      <p className="text-sm text-slate-300 mt-1">{integration.description}</p>
                    </div>
                  </div>
                
                {integration.isConnected ? (
                  <Button
                    variant="outline"
                    onClick={() => handleDisconnect(integration.id, integration.name)}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    data-testid={`button-disconnect-${integration.id}`}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleConnect(integration.id)}
                    className="gradient-button"
                    data-testid={`button-connect-${integration.id}`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                )}
                </div>
              
              {showApiKeyInput === integration.id && !integration.isConnected && (
                <div className="mt-4 space-y-3 p-4 bg-slate-800/50 rounded-lg">
                  {integration.id === 'shopify' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="shop-domain" className="text-white">
                          Shopify Store Domain
                        </Label>
                        <Input
                          id="shop-domain"
                          type="text"
                          value={shopDomain}
                          onChange={(e) => setShopDomain(e.target.value)}
                          placeholder="mystore.myshopify.com or mystore"
                          className="bg-slate-900/50 border-slate-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="access-token" className="text-white">
                          Admin API Access Token
                        </Label>
                        <Input
                          id="access-token"
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="shpat_xxxxxxxxxxxxx"
                          className="bg-slate-900/50 border-slate-600 text-white"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleConnect(integration.id)}
                          className="gradient-button"
                          disabled={!shopDomain || !apiKey}
                        >
                          Connect Store
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowApiKeyInput(null);
                            setApiKey("");
                            setShopDomain("");
                          }}
                          className="border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : integration.id === 'paypal' ? (
                    <>
                      <p className="text-slate-300 text-sm mb-3">
                        Get your PayPal API credentials from the <a href="https://developer.paypal.com/dashboard/applications" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PayPal Developer Dashboard</a>
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="paypal-client-id" className="text-white">
                          PayPal Client ID
                        </Label>
                        <Input
                          id="paypal-client-id"
                          type="text"
                          value={paypalClientId}
                          onChange={(e) => setPaypalClientId(e.target.value)}
                          placeholder="AXXXXXXXXXXXxxxxxxx"
                          className="bg-slate-900/50 border-slate-600 text-white"
                          data-testid="input-paypal-client-id"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paypal-client-secret" className="text-white">
                          PayPal Client Secret
                        </Label>
                        <Input
                          id="paypal-client-secret"
                          type="password"
                          value={paypalClientSecret}
                          onChange={(e) => setPaypalClientSecret(e.target.value)}
                          placeholder="EXXXXXXXXXXXxxxxxxx"
                          className="bg-slate-900/50 border-slate-600 text-white"
                          data-testid="input-paypal-client-secret"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleConnect(integration.id)}
                          className="gradient-button"
                          disabled={!paypalClientId || !paypalClientSecret}
                          data-testid="button-connect-paypal"
                        >
                          <SiPaypal className="w-4 h-4 mr-2" />
                          Connect PayPal
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowApiKeyInput(null);
                            setPaypalClientId("");
                            setPaypalClientSecret("");
                          }}
                          className="border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : integration.id === 'sendgrid' ? (
                    <>
                      <p className="text-slate-300 text-sm mb-3">
                        Get your SendGrid API key from <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SendGrid Settings</a>
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="sendgrid-api-key" className="text-white">
                          SendGrid API Key
                        </Label>
                        <Input
                          id="sendgrid-api-key"
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="SG.xxxxxxxxxxxxx"
                          className="bg-slate-900/50 border-slate-600 text-white"
                          data-testid="input-sendgrid-api-key"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleConnect(integration.id)}
                          className="gradient-button"
                          disabled={!apiKey}
                          data-testid="button-connect-sendgrid"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Connect SendGrid
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowApiKeyInput(null);
                            setApiKey("");
                          }}
                          className="border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Label htmlFor={`api-key-${integration.id}`} className="text-white">
                        API Key for {integration.name}
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id={`api-key-${integration.id}`}
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Enter your API key"
                          className="bg-slate-900/50 border-slate-600 text-white"
                          data-testid={`input-api-key-${integration.id}`}
                        />
                        <Button
                          onClick={() => handleConnect(integration.id)}
                          className="gradient-button"
                          data-testid={`button-submit-api-key-${integration.id}`}
                        >
                          Connect
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowApiKeyInput(null);
                            setApiKey("");
                          }}
                          className="border-slate-600 text-slate-300 hover:bg-slate-800"
                          data-testid={`button-cancel-api-key-${integration.id}`}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
