import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, Sparkles, ExternalLink, Store } from "lucide-react";

export default function ShopifyOnboarding() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'detecting' | 'authenticating' | 'error' | 'install_required'>('detecting');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check if we were redirected from Shopify installation
    const params = new URLSearchParams(window.location.search);
    const shop = params.get('shop');
    
    if (shop) {
      // Shopify installation detected - auto-initiate OAuth
      console.log('Shopify installation detected:', shop);
      setStatus('authenticating');
      initiateShopifyOAuth();
    } else {
      // No shop parameter - installation must come from Shopify App Store (Policy 2.3.1)
      console.log('No shop parameter detected - must install from Shopify App Store');
      setStatus('install_required');
    }
  }, []);

  const initiateShopifyOAuth = async () => {
    try {
      // Forward ALL query parameters from Shopify for proper HMAC verification
      // This includes shop, hmac, timestamp, host, and any other parameters Shopify sends
      const currentParams = new URLSearchParams(window.location.search);
      
      // Initiate OAuth flow via public installation endpoint with complete query string
      const response = await fetch(`/api/shopify/install?${currentParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate Shopify OAuth');
      }

      const { authUrl } = await response.json();
      
      // Redirect to Shopify for authentication
      console.log('Redirecting to Shopify OAuth:', authUrl);
      window.location.href = authUrl;
      
    } catch (err: any) {
      console.error('OAuth initiation error:', err);
      setStatus('error');
      setError(err.message || 'Failed to connect to Shopify. Please try again from the Shopify App Store.');
    }
  };

  const handleGoToDashboard = () => {
    setLocation('/dashboard');
  };

  const handleOpenShopifyAppStore = () => {
    // Open Shopify App Store (replace with actual app listing URL when published)
    window.open('https://apps.shopify.com', '_blank');
  };

  if (status === 'detecting') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md gradient-card border-0">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Detecting Installation...</h2>
              <p className="text-slate-400">
                Checking your Shopify installation details
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'authenticating') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md gradient-card border-0">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Zyra AI!</h2>
              <p className="text-slate-400 mb-4">
                Connecting your Shopify store to unlock AI-powered optimization
              </p>
              <div className="flex items-center justify-center space-x-2 text-primary">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Redirecting to Shopify...</span>
              </div>
            </div>
            
            <Alert className="bg-slate-800/50 border-primary/20">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="text-slate-300 text-left">
                You'll be redirected to Shopify to authorize Zyra AI. After authorization, you'll be brought back to your dashboard.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md gradient-card border-0">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Connection Failed</h2>
              <p className="text-slate-400 mb-6">
                {error}
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleOpenShopifyAppStore}
                className="gradient-button w-full"
                data-testid="button-retry-from-app-store"
              >
                <Store className="w-4 h-4 mr-2" />
                Try Again from Shopify App Store
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={handleGoToDashboard}
                variant="outline"
                className="w-full border-slate-600 text-slate-300"
                data-testid="button-go-to-dashboard"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Install required - Shopify 2.3.1 Compliance
  // Installation must be initiated from Shopify-owned surfaces only
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md gradient-card border-0">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Store className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Install from Shopify</h2>
            <p className="text-slate-400 mb-6">
              To connect your store, please install Zyra AI directly from the Shopify App Store. This ensures secure authentication and compliance with Shopify policies.
            </p>
          </div>
          
          <Alert className="bg-slate-800/50 border-primary/20 mb-6">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription className="text-slate-300 text-left">
              After installing from the Shopify App Store, you'll be automatically connected and redirected to your dashboard.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <Button
              onClick={handleOpenShopifyAppStore}
              className="gradient-button w-full"
              data-testid="button-install-from-shopify"
            >
              <Store className="w-4 h-4 mr-2" />
              Open Shopify App Store
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={handleGoToDashboard}
              variant="outline"
              className="w-full border-slate-600 text-slate-300"
              data-testid="button-go-to-dashboard"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
