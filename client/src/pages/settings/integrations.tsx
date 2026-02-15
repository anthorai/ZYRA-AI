import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
import { ConnectionProgressCard, useConnectionProgress } from "@/components/ui/connection-progress-card";
import { Mail, Link2, Plus, X, ShoppingBag, CreditCard, Send, CheckCircle2, AlertCircle, Copy, ExternalLink, Info, Loader2 } from "lucide-react";
import { SiSendgrid } from "react-icons/si";

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

export default function IntegrationsPage({ embedded }: { embedded?: boolean }) {
  const { toast } = useToast();
  
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "shopify",
      name: "Shopify",
      type: "E-Commerce Platform",
      icon: <ShoppingBag className="w-5 h-5" />,
      isConnected: false,
      description: "Install Zyra AI from the Shopify App Store to sync your products, collections, and analytics. Authentication is handled securely through Shopify.",
      label: "For Shopify Sellers",
      tooltip: "Install from the Shopify App Store to connect your store. This ensures secure authentication compliant with Shopify policies.",
      labelType: "recommended"
    },
    {
      id: "email-service",
      name: "Email Service",
      type: "Email Marketing",
      icon: <Mail className="w-5 h-5" />,
      isConnected: false,
      description: "Connect SendGrid or Brevo to send marketing emails, abandoned cart recovery, and transactional emails. Choose your preferred provider.",
      label: "For Email Marketers",
      tooltip: "Send AI-powered email campaigns, cart recovery emails, and track performance with detailed analytics.",
      labelType: "recommended"
    }
  ]);

  const [showApiKeyInput, setShowApiKeyInput] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [emailProvider, setEmailProvider] = useState<"sendgrid" | "brevo">("sendgrid");
  const [fromEmail, setFromEmail] = useState("");
  
  // Shopify setup state
  const [showShopifySetup, setShowShopifySetup] = useState(false);
  const [shopifyValidation, setShopifyValidation] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  // Success banner state - shows when store is connected
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  
  // Shopify connection progress modal state
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const connectionProgress = useConnectionProgress();
  const [, setLocation] = useLocation();

  // Check for success/error query parameters on mount (from Shopify OAuth redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const shopifyConnected = urlParams.get('shopify');
    const shopifyConnectedNew = urlParams.get('shopify_connected');
    const storeName = urlParams.get('store_name');
    
    // Check if we were in the middle of connecting (returning from Shopify OAuth)
    const wasConnecting = sessionStorage.getItem('shopify_connecting');
    
    // Handle both legacy and new success parameters
    if (shopifyConnected === 'connected' || shopifyConnectedNew === 'true') {
      // Clear the connecting state
      sessionStorage.removeItem('shopify_connecting');
      sessionStorage.removeItem('shopify_connect_time');
      
      // Show the connection progress modal with complete state
      setShowConnectionModal(true);
      connectionProgress.setStep('syncing');
      
      // Animate through final steps
      setTimeout(() => {
        connectionProgress.setComplete(storeName || 'Your Shopify Store');
        
        // Update the integration status
        setIntegrations(prev =>
          prev.map(integration =>
            integration.id === 'shopify'
              ? { ...integration, isConnected: true }
              : integration
          )
        );
        
        // Show visible success banner too
        setShowSuccessBanner(true);
        
        // Auto-hide banner after 10 seconds
        setTimeout(() => setShowSuccessBanner(false), 10000);
      }, 1200);
      
      // Clean up the URL
      urlParams.delete('shopify');
      urlParams.delete('shopify_connected');
      urlParams.delete('store_name');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
    
    // Handle specific Shopify error codes with helpful messages
    if (error) {
      // Clear the connecting state
      sessionStorage.removeItem('shopify_connecting');
      sessionStorage.removeItem('shopify_connect_time');
      
      let errorMessage = "Please try again or click 'Setup Guide' for help.";
      
      switch (error) {
        case 'state_expired':
          errorMessage = "Your connection attempt took too long and expired. Please try connecting again.";
          break;
        case 'hmac_failed':
          errorMessage = "Shopify security verification failed. This might indicate a configuration issue.";
          break;
        case 'token_exchange_failed':
          errorMessage = "Failed to authenticate with Shopify. Please verify your Shopify app credentials are correct.";
          break;
        case 'shop_info_failed':
          errorMessage = "Could not fetch your store information from Shopify. Please try again.";
          break;
        case 'db_save_failed':
          errorMessage = "Successfully connected to Shopify but couldn't save the connection. Please try again.";
          break;
        case 'shopify_connection_failed':
        default:
          errorMessage = "We couldn't connect to your Shopify store. Please try again.";
          break;
      }
      
      // Show error in connection modal if we were connecting
      if (wasConnecting) {
        setShowConnectionModal(true);
        connectionProgress.setError(errorMessage);
      } else {
        // Show toast as fallback
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 8000,
        });
      }
      
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

            const wasStillConnecting = sessionStorage.getItem('shopify_connecting');
            if (wasStillConnecting) {
              sessionStorage.removeItem('shopify_connecting');
              sessionStorage.removeItem('shopify_connect_time');
              setShowConnectionModal(true);
              connectionProgress.setStep('syncing');
              setTimeout(() => {
                connectionProgress.setComplete(shopifyData.shopDomain || shopifyData.storeName || 'Your Shopify Store');
                setShowSuccessBanner(true);
                setTimeout(() => setShowSuccessBanner(false), 10000);
              }, 800);
            }
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
              // Special handling for email-service - check for sendgrid or brevo providers
              if (integration.id === 'email-service') {
                const emailSetting = integrationSettings.find(
                  (s: any) => s.integrationType === 'email' && (s.provider === 'sendgrid' || s.provider === 'brevo')
                );
                if (emailSetting && emailSetting.isActive) {
                  return { 
                    ...integration, 
                    isConnected: true,
                    name: emailSetting.provider === 'sendgrid' ? 'SendGrid' : 'Brevo'
                  };
                }
                return integration;
              }
              
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

        // Fetch Twilio connection status specifically
        const twilioResponse = await fetch('/api/twilio/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (twilioResponse.ok) {
          const twilioData = await twilioResponse.json();
          if (twilioData.isConnected) {
            setIntegrations(prev =>
              prev.map(integration =>
                integration.id === 'twilio'
                  ? { ...integration, isConnected: true }
                  : integration
              )
            );
          }
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


  // Initiate Shopify connection with progress modal
  const initiateShopifyConnection = async () => {
    // Reset and show the connection modal
    connectionProgress.reset();
    setShowConnectionModal(true);
    connectionProgress.setStep('initializing');

    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: sessionData } = await supabase.auth.getSession();
      let token = sessionData.session?.access_token || '';

      if (!token) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        token = refreshData.session?.access_token || '';
      }

      if (!token) {
        connectionProgress.setError("Please log in to connect your Shopify store");
        return;
      }

      // Step 1: Authenticating
      connectionProgress.setStep('authenticating');
      await new Promise(resolve => setTimeout(resolve, 800)); // Brief delay for UX

      // Call the API to initiate OAuth and get the redirect URL
      const response = await fetch('/api/shopify/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to initiate connection');
      }

      const data = await response.json();
      
      if (data.authUrl) {
        // Step 2: Verifying - about to redirect
        connectionProgress.setStep('verifying');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Store connection state in sessionStorage for when user returns
        sessionStorage.setItem('shopify_connecting', 'true');
        sessionStorage.setItem('shopify_connect_time', Date.now().toString());
        
        // Redirect to Shopify OAuth URL
        window.location.href = data.authUrl;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error: any) {
      console.error('Shopify connect error:', error);
      connectionProgress.setError(error.message || "Failed to initiate Shopify connection. Please try again.");
    }
  };

  const handleConnect = async (id: string) => {
    // Shopify connection - show progress modal and redirect to OAuth flow
    if (id === 'shopify') {
      initiateShopifyConnection();
      return;
    }

    // Show input form if not already shown
    if (!showApiKeyInput) {
      setShowApiKeyInput(id);
      return;
    }

    // Validate and save credentials for Email Service (SendGrid or Brevo)
    if (id === 'email-service') {
      if (!apiKey.trim()) {
        toast({
          title: "API Key Required",
          description: `Please enter your ${emailProvider === 'sendgrid' ? 'SendGrid' : 'Brevo'} API key`,
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      if (!fromEmail.trim()) {
        toast({
          title: "From Email Required",
          description: "Please enter the email address to send from",
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
            description: "Please log in again to connect your email service",
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
            provider: emailProvider,
            credentials: {
              apiKey: apiKey.trim()
            },
            settings: {
              fromEmail: fromEmail.trim()
            },
            isActive: true
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Failed to save ${emailProvider} credentials`);
        }

        setIntegrations(prev =>
          prev.map(integration =>
            integration.id === 'email-service'
              ? { ...integration, isConnected: true, name: emailProvider === 'sendgrid' ? 'SendGrid' : 'Brevo' }
              : integration
          )
        );
        
        toast({
          title: `${emailProvider === 'sendgrid' ? 'SendGrid' : 'Brevo'} Connected`,
          description: "Your email service has been securely connected",
          duration: 3000,
        });
        
        setShowApiKeyInput(null);
        setApiKey("");
        setFromEmail("");
      } catch (error) {
        console.error('Email service connection error:', error);
        toast({
          title: "Connection Failed",
          description: `Failed to connect ${emailProvider === 'sendgrid' ? 'SendGrid' : 'Brevo'}. Please check your API key.`,
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
      
      // For email-service, look for email type integration
      let integrationToDelete;
      if (id === 'email-service') {
        integrationToDelete = integrationSettings.find(
          (s: any) => s.integrationType === 'email' && (s.provider === 'sendgrid' || s.provider === 'brevo')
        );
      } else {
        integrationToDelete = integrationSettings.find(
          (s: any) => s.provider === id
        );
      }

      if (!integrationToDelete) {
        // Integration not found in backend, just update frontend
        setIntegrations(prev =>
          prev.map(integration =>
            integration.id === id
              ? { ...integration, isConnected: false, ...(id === 'email-service' ? { name: 'Email Service' } : {}) }
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
            ? { ...integration, isConnected: false, ...(id === 'email-service' ? { name: 'Email Service' } : {}) }
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

  const content = (
    <>
      {/* Success Banner - Shows when store is connected */}
      {showSuccessBanner && (
        <Alert className="mb-6 bg-green-500/20 border-green-500/50" data-testid="alert-shopify-success">
          <CheckCircle2 className="h-5 w-5 text-green-400" />
          <AlertTitle className="text-green-400 text-lg font-semibold">Store Connected Successfully!</AlertTitle>
          <AlertDescription className="text-green-300">
            Your Shopify store has been connected to Zyra AI. You can now sync products, optimize listings, and access all e-commerce features.
          </AlertDescription>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2 text-green-400 hover:text-green-300"
            onClick={() => setShowSuccessBanner(false)}
            data-testid="button-dismiss-success"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* Connected Summary */}
      <div
        className="flex items-center justify-between gap-3 flex-wrap p-4 sm:p-5"
        style={{
          background: '#0F152B',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '14px',
        }}
        data-testid="card-integration-summary"
      >
        <div className="flex items-center space-x-3">
          <Link2 className="w-6 h-6" style={{ color: '#00F0FF' }} />
          <div>
            <h3 className="font-semibold text-lg" style={{ color: '#E6F7FF' }}>
              {integrations.filter(i => i.isConnected).length} Active Integrations
            </h3>
            <p className="text-sm" style={{ color: '#7C86B8' }}>
              {integrations.filter(i => !i.isConnected).length} more available to connect
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          data-testid="button-add-integration"
          style={{
            background: 'transparent',
            border: '1px solid rgba(0,240,255,0.4)',
            color: '#00F0FF',
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </Button>
      </div>

      {/* Integrations List */}
      <TooltipProvider>
        <div className="space-y-5">
          {integrations.map((integration) => {
            const accentColor = integration.id === 'shopify' ? '#22C55E' : '#00F0FF';
            const iconColor = integration.isConnected ? accentColor : `${accentColor}CC`;

            return (
              <div
                key={integration.id}
                className="relative overflow-hidden"
                style={{
                  background: '#121833',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '14px',
                }}
                data-testid={`card-integration-${integration.id}`}
              >
                <div
                  className="absolute top-0 left-0 bottom-0 w-[3px]"
                  style={{ background: accentColor, borderRadius: '14px 0 0 14px' }}
                />
                <div className="p-4 sm:p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-1">
                    <div className="p-3 rounded-lg flex-shrink-0" style={{ background: `${accentColor}15` }}>
                      <div style={{ color: iconColor }}>
                        {integration.icon}
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base sm:text-lg" style={{ color: '#E6F7FF' }}>{integration.name}</h3>
                        <Badge
                          className="text-xs no-default-hover-elevate no-default-active-elevate"
                          style={integration.isConnected ? {
                            background: 'rgba(34,197,94,0.15)',
                            color: '#9EFFC3',
                            border: '1px solid rgba(34,197,94,0.35)',
                          } : {
                            background: 'rgba(255,210,125,0.1)',
                            color: '#FFD27D',
                            border: '1px solid rgba(255,210,125,0.25)',
                          }}
                          data-testid={`badge-status-${integration.id}`}
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
                      
                      <p className="text-xs sm:text-sm mt-2" style={{ color: '#7C86B8' }}>{integration.type}</p>
                      <p className="text-xs sm:text-sm mt-1" style={{ color: '#A9B4E5' }}>{integration.description}</p>
                    </div>
                  </div>
                
                {integration.isConnected ? (
                  <Button
                    variant="outline"
                    onClick={() => handleDisconnect(integration.id, integration.name)}
                    className="border-red-500/50 text-red-400 w-full sm:w-auto md:w-auto"
                    data-testid={`button-disconnect-${integration.id}`}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleConnect(integration.id)}
                    className="w-full sm:w-auto md:w-auto border-0 font-semibold"
                    disabled={integration.comingSoon}
                    style={{
                      background: '#00F0FF',
                      color: '#04141C',
                    }}
                    data-testid={`button-connect-${integration.id}`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {integration.comingSoon ? "Coming Soon" : "Connect"}
                  </Button>
                )}
                </div>
              
              {showApiKeyInput === integration.id && !integration.isConnected && integration.id !== 'shopify' && (
                <div className="mt-4 space-y-3 p-4 bg-slate-800/50 rounded-lg">
                  {integration.id === 'email-service' ? (
                    <>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-white">Choose Email Provider</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={emailProvider === 'sendgrid' ? 'default' : 'outline'}
                              onClick={() => setEmailProvider('sendgrid')}
                              className={emailProvider === 'sendgrid' ? 'gradient-button' : 'border-slate-600 text-slate-300'}
                              data-testid="button-select-sendgrid"
                            >
                              <SiSendgrid className="w-4 h-4 mr-2" />
                              SendGrid
                            </Button>
                            <Button
                              type="button"
                              variant={emailProvider === 'brevo' ? 'default' : 'outline'}
                              onClick={() => setEmailProvider('brevo')}
                              className={emailProvider === 'brevo' ? 'gradient-button' : 'border-slate-600 text-slate-300'}
                              data-testid="button-select-brevo"
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Brevo
                            </Button>
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm">
                          {emailProvider === 'sendgrid' ? (
                            <>Get your API key from <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SendGrid Settings</a></>
                          ) : (
                            <>Get your API key from <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Brevo API Keys</a></>
                          )}
                        </p>
                        <div className="space-y-2">
                          <Label htmlFor="email-api-key" className="text-white">
                            {emailProvider === 'sendgrid' ? 'SendGrid' : 'Brevo'} API Key
                          </Label>
                          <Input
                            id="email-api-key"
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={emailProvider === 'sendgrid' ? 'SG.xxxxxxxxxxxxx' : 'xkeysib-xxxxxxxxxxxxx'}
                            className="bg-slate-900/50 border-slate-600 text-white"
                            data-testid="input-email-api-key"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="from-email" className="text-white">
                            From Email Address
                          </Label>
                          <Input
                            id="from-email"
                            type="email"
                            value={fromEmail}
                            onChange={(e) => setFromEmail(e.target.value)}
                            placeholder="yourstore@example.com"
                            className="bg-slate-900/50 border-slate-600 text-white"
                            data-testid="input-from-email"
                          />
                          <p className="text-xs text-slate-400">This email must be verified with your provider</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          onClick={() => handleConnect(integration.id)}
                          className="gradient-button"
                          disabled={!apiKey || !fromEmail}
                          data-testid="button-connect-email-service"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowApiKeyInput(null);
                            setApiKey("");
                            setFromEmail("");
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
                </div>
              </div>
        );
        })}
        </div>
      </TooltipProvider>
      
      {/* Shopify Connection Progress Modal */}
      <Dialog open={showConnectionModal} onOpenChange={(open) => {
        // Only allow closing if not in progress (error or complete state)
        if (!open && (connectionProgress.step === 'error' || connectionProgress.step === 'complete')) {
          setShowConnectionModal(false);
        }
      }}>
        <DialogContent className="!max-w-sm !bg-transparent !border-none !shadow-none !p-0 !outline-none !ring-0 [&>button]:hidden">
          <ConnectionProgressCard
            currentStep={connectionProgress.step}
            errorMessage={connectionProgress.error || undefined}
            storeName={connectionProgress.storeName || undefined}
            onRetry={() => {
              initiateShopifyConnection();
            }}
            onCancel={() => {
              setShowConnectionModal(false);
              connectionProgress.reset();
            }}
            onComplete={() => {
              setShowConnectionModal(false);
              setLocation('/dashboard');
            }}
          />
        </DialogContent>
      </Dialog>

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

    </>
  );

  if (embedded) {
    return <div className="space-y-6">{content}</div>;
  }

  return (
    <PageShell
      title="Integrations"
      subtitle="Connect third-party services to enhance your Zyra AI experience"
      maxWidth="xl"
      spacing="normal"
      useHistoryBack={true}
    >
      {content}
    </PageShell>
  );
}
