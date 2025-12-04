import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (isRedirecting) return;
    
    // Check for password recovery flow FIRST - this takes priority over everything
    const fullHash = window.location.hash;
    const fullSearch = window.location.search;
    const hashParams = new URLSearchParams(fullHash.substring(1));
    const searchParams = new URLSearchParams(fullSearch);
    
    const type = hashParams.get('type') || searchParams.get('type');
    const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
    
    console.log('AuthCallback - URL analysis:', {
      path: window.location.pathname,
      hashLength: fullHash.length,
      type,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });
    
    // Handle password recovery - redirect to reset password page with tokens
    if (type === 'recovery') {
      console.log('PASSWORD RECOVERY DETECTED in AuthCallback! Redirecting to reset-password...');
      setIsRedirecting(true);
      // Use window.location.href to ensure hash fragment is preserved
      window.location.href = `/reset-password${fullHash || fullSearch}`;
      return;
    }
    
    // Also check if we have tokens that might be for recovery (check URL for recovery indicators)
    if (accessToken && refreshToken) {
      // Check if this might be a recovery token by looking at the full URL
      if (fullHash.includes('type=recovery') || fullHash.includes('recovery') ||
          fullSearch.includes('type=recovery')) {
        console.log('Recovery tokens detected, redirecting to reset-password page');
        setIsRedirecting(true);
        window.location.href = `/reset-password${fullHash || fullSearch}`;
        return;
      }
    }

    // Check for Shopify-specific callback parameters
    const shopifyConnected = searchParams.get('shopify');
    const shopifyError = searchParams.get('shopify_error');

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
  }, [user, loading, setLocation, isRedirecting]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4" data-testid="text-callback-status">Completing sign in...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}