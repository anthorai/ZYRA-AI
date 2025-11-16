import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Check for Shopify-specific callback parameters
    const params = new URLSearchParams(window.location.search);
    const shopifyConnected = params.get('shopify');
    const shopifyError = params.get('shopify_error');

    // Handle Shopify OAuth callback
    if (shopifyConnected === 'connected') {
      // Shopify successfully connected - redirect to integrations page
      setLocation('/settings/integrations?shopify=connected');
      return;
    }

    if (shopifyError) {
      // Shopify connection failed - redirect to integrations page with error
      setLocation(`/settings/integrations?error=${shopifyError}`);
      return;
    }

    // Handle regular OAuth flow (e.g., Google)
    if (!loading) {
      if (user) {
        setLocation('/dashboard');
      } else {
        // If no user after callback, redirect back to auth
        setLocation('/auth');
      }
    }
  }, [user, loading, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4" data-testid="text-callback-status">Completing sign in...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}