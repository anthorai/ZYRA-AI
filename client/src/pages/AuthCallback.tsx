import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Check for password recovery flow - this takes priority
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);
    
    const type = hashParams.get('type') || searchParams.get('type');
    const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
    const code = hashParams.get('code') || searchParams.get('code');
    
    // Handle password recovery - redirect to reset password page with tokens
    if (type === 'recovery') {
      console.log('Password recovery detected, redirecting to reset-password page');
      // Preserve the hash/search params so reset-password page can use them
      const redirectUrl = `/reset-password${window.location.hash || window.location.search}`;
      setLocation(redirectUrl);
      return;
    }
    
    // Also check if we have an access_token without explicit type (some Supabase versions)
    if (accessToken && !type) {
      // Check if this might be a recovery token by looking at the full URL
      const fullHash = window.location.hash;
      if (fullHash.includes('type=recovery') || fullHash.includes('recovery')) {
        console.log('Recovery token detected in hash, redirecting to reset-password page');
        setLocation(`/reset-password${fullHash}`);
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