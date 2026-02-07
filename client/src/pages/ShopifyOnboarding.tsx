import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConnectionProgressCard, useConnectionProgress } from "@/components/ui/connection-progress-card";

export default function ShopifyOnboarding() {
  const [, setLocation] = useLocation();
  const connectionProgress = useConnectionProgress();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (hasInitialized) return;
    setHasInitialized(true);
    
    const params = new URLSearchParams(window.location.search);
    const shop = params.get('shop');
    const shopifyConnected = params.get('shopify_connected');
    const storeName = params.get('store_name');
    const error = params.get('error');
    
    // Check if returning from successful OAuth
    if (shopifyConnected === 'true') {
      // Clear the connecting state
      sessionStorage.removeItem('shopify_connecting');
      sessionStorage.removeItem('shopify_connect_time');
      
      // Show success animation
      connectionProgress.setStep('syncing');
      setTimeout(() => {
        connectionProgress.setComplete(storeName ? decodeURIComponent(storeName) : 'Your Shopify Store');
        
        // Clean up the URL
        params.delete('shopify_connected');
        params.delete('store_name');
        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', newUrl);
      }, 1200);
      return;
    }
    
    // Check if returning with an error
    if (error) {
      // Clear the connecting state
      sessionStorage.removeItem('shopify_connecting');
      sessionStorage.removeItem('shopify_connect_time');
      
      let errorMessage = "Connection failed. Please try again.";
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
      }
      
      connectionProgress.setError(errorMessage);
      
      // Clean up the URL
      params.delete('error');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
      return;
    }
    
    // Check if we were redirected from Shopify installation
    if (shop) {
      // Shopify installation detected - auto-initiate OAuth
      console.log('Shopify installation detected:', shop);
      connectionProgress.setStep('initializing');
      initiateShopifyOAuth();
    } else {
      // No shop parameter - installation must come from Shopify App Store (Policy 2.3.1)
      console.log('No shop parameter detected - must install from Shopify App Store');
      connectionProgress.setError('To connect your store, please install Zyra AI directly from the Shopify App Store. This ensures secure authentication and compliance with Shopify policies.');
    }
  }, [hasInitialized]);

  const initiateShopifyOAuth = async () => {
    try {
      // Step 1: Authenticating
      connectionProgress.setStep('authenticating');
      
      // Forward ALL query parameters from Shopify for proper HMAC verification
      const currentParams = new URLSearchParams(window.location.search);
      
      // Add a small delay for UX
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Initiate OAuth flow via public installation endpoint with complete query string
      const response = await fetch(`/api/shopify/install?${currentParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        redirect: 'manual'
      });

      if (response.type === 'opaqueredirect' || response.status === 0) {
        throw new Error('Server redirected instead of returning JSON. Please try installing from the Shopify App Store.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to initiate Shopify OAuth' }));
        throw new Error(errorData.error || 'Failed to initiate Shopify OAuth');
      }

      const { authUrl } = await response.json();
      
      // Step 2: Verifying - about to redirect
      connectionProgress.setStep('verifying');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Store connection state in sessionStorage for when user returns
      sessionStorage.setItem('shopify_connecting', 'true');
      sessionStorage.setItem('shopify_connect_time', Date.now().toString());
      
      // Redirect to Shopify for authentication
      console.log('Redirecting to Shopify OAuth:', authUrl);
      window.location.href = authUrl;
      
    } catch (err: any) {
      console.error('OAuth initiation error:', err);
      connectionProgress.setError(err.message || 'Failed to connect to Shopify. Please try again from the Shopify App Store.');
    }
  };

  const handleRetry = () => {
    // Reset and try again
    connectionProgress.reset();
    setHasInitialized(false);
  };

  const handleGoToDashboard = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <ConnectionProgressCard
        currentStep={connectionProgress.step}
        errorMessage={connectionProgress.error || undefined}
        storeName={connectionProgress.storeName || undefined}
        onRetry={handleRetry}
        onCancel={handleGoToDashboard}
        onComplete={handleGoToDashboard}
      />
    </div>
  );
}
