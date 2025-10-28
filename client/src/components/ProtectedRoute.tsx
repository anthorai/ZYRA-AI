import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useAuth();
  const [, setLocation] = useLocation();
  const hasRedirected = useRef(false);

  // Handle case where auth context might be temporarily unavailable (development hot reloads)
  const { user, isLoading, isAuthenticated } = auth || { 
    user: null, 
    isLoading: true, 
    isAuthenticated: false 
  };

  useEffect(() => {
    // Only redirect if auth is fully loaded and we're definitely not authenticated
    if (!isLoading && !isAuthenticated && !hasRedirected.current && auth) {
      hasRedirected.current = true;
      setLocation("/auth");
    }
    
    // Reset redirect flag when user becomes authenticated
    if (isAuthenticated) {
      hasRedirected.current = false;
    }
  }, [isLoading, isAuthenticated, setLocation, auth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark-theme-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}