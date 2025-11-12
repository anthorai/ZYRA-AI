import { useState, useEffect } from "react";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { Zap, Mail, MessageSquare, BarChart3, Link2, Plus, X, ShoppingBag, CreditCard, Send, CheckCircle2, AlertCircle, Copy, ExternalLink, Info } from "lucide-react";
import { SiSendgrid, SiTwilio } from "react-icons/si";

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
  comingSoon?: boolean;
}

export default function IntegrationsPage() {
  const { toast } = useToast();
  
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
      isConnected: false,
      description: "Send marketing emails via Gmail",
      label: "For All Businesses 💼",
      tooltip: "Send AI-powered marketing & upsell emails directly from Zyra AI.",
      labelType: "optional",
      comingSoon: true
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
      labelType: "optional",
      comingSoon: true
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
      isConnected: false,
      description: "Track campaign performance",
      label: "Recommended for All Users 📈",
      tooltip: "Track website traffic, product performance, and conversions.",
      labelType: "recommended",
      comingSoon: true
    },
    {
      id: "meta-pixel",
      name: "Meta Pixel",
      type: "Analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      isConnected: false,
      description: "Facebook & Instagram tracking",
      label: "For Social Ad Sellers 🎯",
      tooltip: "Connect to Facebook & Instagram for retargeting and ad tracking.",
      labelType: "optional",
      comingSoon: true
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
      labelType: "advanced",
      comingSoon: true
    }
  ]);

  const [showApiKeyInput, setShowApiKeyInput] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [shopDomain, setShopDomain] = useState("");
  
  // Shopify setup state
  const [showShopifySetup, setShowShopifySetup] = useState(false);
  const [shopifyValidation, setShopifyValidation] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Check for success/error query parameters on mount (from Shopify OAuth redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const shopifyConnected = urlParams.get('shopify');
    
    if (shopifyConnected === 'connected') {
      toast({
        title: "Shopify Connected",
        description: "Your Shopify store has been successfully connected to Zyra AI!",
        duration: 5000,
      });
      
      // Update the integration status
      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === 'shopify'
            ? { ...integration, isConnected: true }
            : integration
        )
      );
      
      // Clean up the URL
      urlParams.delete('shopify');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
    
    // Handle specific Shopify error codes with helpful messages
    if (error) {
      let title = "Connection Failed";
      let description = "Please try again or click 'Setup Guide' for help.";
      
      switch (error) {
        case 'state_expired':
          title = "Session Expired";
          description = "Your connection attempt took too long and expired. Please try connecting again.";
          break;
        case 'hmac_failed':
          title = "Security Verification Failed";
          description = "Shopify security verification failed. This might indicate a configuration issue. Please check the Setup Guide.";
          break;
        case 'token_exchange_failed':
          title = "Authentication Failed";
          description = "Failed to authenticate with Shopify. Please verify your Shopify app credentials are correct.";
          break;
        case 'shop_info_failed':
          title = "Store Information Error";
          description = "Could not fetch your store information from Shopify. Please try again.";
          break;
        case 'db_save_failed':
          title = "Database Error";
          description = "Successfully connected to Shopify but couldn't save the connection. Please try again.";
          break;
        case 'shopify_connection_failed':
        default:
          title = "Shopify Connection Failed";
          description = "We couldn't connect to your Shopify store. Please try again or click 'Setup Guide' for help.";
          break;
      }
      
      toast({
        title,
        description,
        variant: "destructive",
        duration: 8000,
      });
      
      // Clean up the URL by removing the error parameter
      urlParams.delete('error');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [toast]);

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

  // Validate Shopify setup
  const validateShopifySetup = async () => {
    setIsValidating(true);
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
          description: "Please log in to validate Shopify setup",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/shopify/validate-setup', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to validate Shopify setup');
      }

      const data = await response.json();
      setShopifyValidation(data);
      setShowShopifySetup(true);

      if (data.ready) {
        toast({
          title: "Setup Validated",
          description: "Your Shopify configuration is ready!",
        });
      } else {
        toast({
          title: "Setup Incomplete",
          description: `${data.issues.length} issue(s) found. Check the setup guide.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Shopify validation error:', error);
      toast({
        title: "Validation Failed",
        description: "Failed to validate Shopify setup",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleConnect = async (id: string) => {
    // Special handling for Shopify OAuth
    if (id === 'shopify') {
      const shop = prompt('Enter your Shopify store domain (e.g., mystore.myshopify.com or just mystore):');
      if (!shop) return;

      try {
        // Sanitize shop domain: remove protocol, trailing slashes, and whitespace
        let cleanShop = shop.trim();
        cleanShop = cleanShop.replace(/^https?:\/\//, ''); // Remove http:// or https://
        cleanShop = cleanShop.replace(/\/$/, ''); // Remove trailing slash
        cleanShop = cleanShop.toLowerCase(); // Normalize to lowercase
        
        // If user just entered the store name (e.g., "mystore"), append .myshopify.com
        if (!cleanShop.includes('.')) {
          cleanShop = `${cleanShop}.myshopify.com`;
        }
        
        console.log('🔵 [SHOPIFY] Starting OAuth flow for shop:', cleanShop);
        console.log('🔵 [SHOPIFY] Original input:', shop, '→ Cleaned:', cleanShop);
        
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: sessionData } = await supabase.auth.getSession();
        let token = sessionData.session?.access_token || '';

        console.log('🔵 [SHOPIFY] Session token status:', !!token);

        // If no token, try refreshing the session
        if (!token) {
          console.log('🔵 [SHOPIFY] No token found, refreshing session...');
          const { data: refreshData } = await supabase.auth.refreshSession();
          token = refreshData.session?.access_token || '';
          console.log('🔵 [SHOPIFY] After refresh, token status:', !!token);
        }

        if (!token) {
          console.error('🔴 [SHOPIFY] No valid token available');
          toast({
            title: "Authentication Required",
            description: "Please log in again to connect Shopify",
            variant: "destructive",
            duration: 3000,
          });
          return;
        }

        console.log('🔵 [SHOPIFY] Making POST request to /api/shopify/auth...');
        console.log('🔵 [SHOPIFY] Request details:', {
          url: '/api/shopify/auth',
          method: 'POST',
          shop: cleanShop,
          hasToken: !!token,
          tokenLength: token.length
        });

        const response = await fetch('/api/shopify/auth', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ shop: cleanShop }),
          credentials: 'include'
        });

        console.log('🔵 [SHOPIFY] Response received:', {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('🔴 [SHOPIFY] Server error response:', errorData);
          throw new Error(errorData.error || 'Failed to initiate Shopify OAuth');
        }

        const data = await response.json();
        
        // Diagnostic logging for troubleshooting
        console.log('\n🔵 ========================================');
        console.log('🔵 SHOPIFY OAUTH INITIATED');
        console.log('🔵 ========================================');
        console.log('📍 Shop domain (cleaned):', cleanShop);
        console.log('🔗 Redirect URI:', data.redirectUri);
        console.log('🚀 Full auth URL:', data.authUrl);
        console.log('========================================\n');
        
        // Direct redirect to Shopify authorization (no popup)
        // After authorization, Shopify will redirect back to our callback
        // which will then redirect to settings page with success/error status
        console.log('🔄 Redirecting to Shopify authorization...');
        window.location.href = data.authUrl;
      } catch (error: any) {
        console.error('Shopify OAuth error:', error);
        const errorMessage = error.message || "Failed to connect to Shopify";
        const isRedirectUriError = errorMessage.includes('redirect_uri') || errorMessage.includes('invalid_request') || errorMessage.includes('not whitelisted');
        
        toast({
          title: "Connection Failed",
          description: isRedirectUriError
            ? "Redirect URI mismatch. Click 'Setup Guide' to get the correct URL for your Shopify app."
            : errorMessage,
          variant: "destructive",
          duration: 8000,
        });
        
        if (isRedirectUriError) {
          // Auto-open setup guide after a short delay
          setTimeout(() => validateShopifySetup(), 1000);
        }
      }
      return;
    }

    // Show input form if not already shown
    if (!showApiKeyInput) {
      setShowApiKeyInput(id);
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
    <PageShell
      title="Integrations"
      subtitle="Connect third-party services to enhance your Zyra AI experience"
      maxWidth="xl"
      spacing="normal"
      backTo="/settings"
    >
      {/* Connected Summary */}
      <DashboardCard 
        className="bg-primary/10"
        testId="card-integration-summary"
      >
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
      </DashboardCard>

      {/* Integrations List */}
      <TooltipProvider>
        <div className="space-y-4">
          {integrations.map((integration) => (
            <DashboardCard 
              key={integration.id} 
              className="relative"
              testId={`card-integration-${integration.id}`}
            >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${integration.isConnected ? 'bg-primary/20' : 'bg-slate-800/50'} flex-shrink-0`}>
                      <div className={integration.isConnected ? 'text-primary' : 'text-slate-400'}>
                        {integration.icon}
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-white font-semibold text-base sm:text-lg">{integration.name}</h3>
                        <Badge
                          variant={integration.isConnected ? "default" : "secondary"}
                          className={`text-xs ${integration.isConnected
                            ? "bg-green-500/20 text-green-400"
                            : "bg-slate-500/20 text-slate-400"
                          }`}
                        >
                          {integration.isConnected ? "Connected" : "Not Connected"}
                        </Badge>
                        {integration.comingSoon && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-xs"
                          >
                            Coming Soon
                          </Badge>
                        )}
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
                      
                      <p className="text-xs sm:text-sm text-slate-400 mt-2">{integration.type}</p>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1">{integration.description}</p>
                    </div>
                  </div>
                
                {integration.isConnected ? (
                  <Button
                    variant="outline"
                    onClick={() => handleDisconnect(integration.id, integration.name)}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 w-full sm:w-auto md:w-auto"
                    data-testid={`button-disconnect-${integration.id}`}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleConnect(integration.id)}
                    className="gradient-button w-full sm:w-auto md:w-auto"
                    disabled={integration.comingSoon}
                    data-testid={`button-connect-${integration.id}`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {integration.comingSoon ? "Coming Soon" : "Connect"}
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
            </DashboardCard>
        ))}
        </div>
      </TooltipProvider>
      
      {/* Shopify Setup Guide Dialog */}
      <Dialog open={showShopifySetup} onOpenChange={setShowShopifySetup}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Shopify Integration Setup Guide</DialogTitle>
            <DialogDescription className="text-slate-400">
              Follow these steps to connect your Shopify store to Zyra AI
            </DialogDescription>
          </DialogHeader>
          
          {shopifyValidation && (
            <div className="space-y-4 mt-4">
              {/* Validation Status */}
              <Alert className={shopifyValidation.ready ? "border-green-500/50 bg-green-500/10" : "border-yellow-500/50 bg-yellow-500/10"}>
                <div className="flex items-center gap-2">
                  {shopifyValidation.ready ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <div className="flex-1">
                    <AlertTitle className="text-white font-semibold">
                      {shopifyValidation.ready ? "Configuration Ready" : "Setup Required"}
                    </AlertTitle>
                    <AlertDescription className="text-slate-300">
                      {shopifyValidation.ready 
                        ? "Your Shopify integration is configured correctly. You can now connect your store."
                        : `${shopifyValidation.issues.length} issue(s) need to be resolved.`}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
              
              {/* Issues List */}
              {shopifyValidation.issues && shopifyValidation.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-white font-semibold">Issues Found:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {shopifyValidation.issues.map((issue: string, index: number) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Current Environment Alert */}
              {shopifyValidation.currentEnvironment === 'development' && !shopifyValidation.productionUrl && (
                <Alert className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <AlertTitle className="text-white font-semibold">Development Environment Detected</AlertTitle>
                  <AlertDescription className="text-slate-300 text-sm">
                    You're currently using a development URL. For production use with your custom domain (https://zzyraai.com), 
                    you need to set the <code className="text-yellow-400 bg-slate-800/50 px-1.5 py-0.5 rounded">PRODUCTION_DOMAIN</code> environment 
                    variable to <code className="text-yellow-400 bg-slate-800/50 px-1.5 py-0.5 rounded">https://zzyraai.com</code> in your Replit Secrets.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Redirect URI Section */}
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Step 1: Add Redirect URI to Shopify</h4>
                <p className="text-slate-300 text-sm">
                  Copy the redirect URI below and add it to your Shopify app's allowed redirect URLs. 
                  <strong className="text-white"> This URL MUST match exactly</strong> what's configured in your Shopify app, 
                  including the protocol (https://) and path (/api/shopify/callback).
                </p>
                
                <div className="space-y-2">
                  {shopifyValidation.productionUrl && (
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-green-500/30">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-green-400 mb-1 font-semibold">✓ Production URL (Use This):</p>
                          <code className="text-primary text-sm break-all font-mono">{shopifyValidation.productionUrl}</code>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(shopifyValidation.productionUrl, "Production URL")}
                          className="border-primary/50 text-primary hover:bg-primary/10"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {shopifyValidation.devUrl && (!shopifyValidation.productionUrl || shopifyValidation.productionUrl !== shopifyValidation.devUrl) && (
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-slate-400 mb-1">{shopifyValidation.productionUrl ? 'Development URL (for testing):' : 'Current URL:'}</p>
                          <code className="text-slate-300 text-sm break-all font-mono">{shopifyValidation.devUrl}</code>
                          {!shopifyValidation.productionUrl && (
                            <p className="text-xs text-yellow-400 mt-1">⚠️ Using development URL - set PRODUCTION_DOMAIN for production</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(shopifyValidation.devUrl, "Development URL")}
                          className="border-primary/50 text-primary hover:bg-primary/10"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Step-by-Step Instructions */}
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Step 2: Configure Shopify App</h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>
                    Go to your{" "}
                    <a
                      href={shopifyValidation.shopifyAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Shopify Partner Dashboard
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Click on your app (or create a new one if you haven't)</li>
                  <li>Go to <strong>Configuration</strong> (or <strong>App setup</strong>)</li>
                  <li>Scroll to the <strong>URLs</strong> section</li>
                  <li>Under <strong>Allowed redirection URL(s)</strong>, click <strong>Add URL</strong></li>
                  <li>Paste the redirect URI(s) you copied above</li>
                  <li>Click <strong>Save</strong></li>
                </ol>
              </div>
              
              {/* Next Steps */}
              {shopifyValidation.nextSteps && shopifyValidation.nextSteps.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-white font-semibold">Next Steps:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {shopifyValidation.nextSteps.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex items-center justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowShopifySetup(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Close
                </Button>
                <Button
                  onClick={validateShopifySetup}
                  disabled={isValidating}
                  className="gradient-button"
                >
                  {isValidating ? "Validating..." : "Re-validate Setup"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
