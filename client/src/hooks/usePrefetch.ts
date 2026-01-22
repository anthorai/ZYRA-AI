/**
 * Prefetching Hooks for Instant Page Navigation
 * Preloads data before user navigates for zero-wait transitions
 */

import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';

// Routes and their associated data queries
const routeQueries: Record<string, string[]> = {
  '/dashboard': ['/api/dashboard-complete', '/api/products', '/api/credits/balance'],
  '/products': ['/api/products', '/api/shopify/status'],
  '/ai-tools/product-seo-engine': ['/api/products', '/api/credits/balance', '/api/store/currency'],
  '/ai-tools/bulk-optimization': ['/api/products', '/api/bulk-jobs'],
  '/settings/integrations': ['/api/shopify/status', '/api/settings/integrations'],
  '/admin': ['/api/admin/users-with-subscriptions', '/api/admin/analytics'],
};

// Prefetch data for a specific route
export function usePrefetchRoute() {
  const queryClient = useQueryClient();
  
  const prefetch = useCallback((route: string) => {
    const queries = routeQueries[route];
    if (!queries) return;
    
    queries.forEach(queryKey => {
      queryClient.prefetchQuery({
        queryKey: [queryKey],
        staleTime: 2 * 60 * 1000, // 2 minutes
      });
    });
  }, [queryClient]);
  
  return prefetch;
}

// Automatically prefetch on link hover
export function useLinkPrefetch(route: string) {
  const prefetch = usePrefetchRoute();
  const prefetchedRef = useRef(false);
  
  const onMouseEnter = useCallback(() => {
    if (!prefetchedRef.current) {
      prefetchedRef.current = true;
      prefetch(route);
    }
  }, [prefetch, route]);
  
  return { onMouseEnter };
}

// Prefetch adjacent routes based on current location
export function useAdjacentPrefetch() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const prefetchedRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    // Determine adjacent routes based on current location
    const adjacentRoutes: string[] = [];
    
    if (location === '/dashboard') {
      adjacentRoutes.push('/products', '/ai-tools/product-seo-engine');
    } else if (location.startsWith('/products')) {
      adjacentRoutes.push('/ai-tools/product-seo-engine', '/dashboard');
    } else if (location.startsWith('/ai-tools')) {
      adjacentRoutes.push('/products', '/dashboard');
    } else if (location.startsWith('/settings')) {
      adjacentRoutes.push('/dashboard');
    }
    
    // Prefetch after a short delay to not block initial render
    const timer = setTimeout(() => {
      adjacentRoutes.forEach(route => {
        if (prefetchedRef.current.has(route)) return;
        prefetchedRef.current.add(route);
        
        const queries = routeQueries[route];
        queries?.forEach(queryKey => {
          queryClient.prefetchQuery({
            queryKey: [queryKey],
            staleTime: 5 * 60 * 1000,
          });
        });
      });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [location, queryClient]);
}

// Preload critical assets (images, fonts, scripts)
export function usePreloadAssets(assets: { url: string; type: 'image' | 'font' | 'script' | 'style' }[]) {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    
    assets.forEach(({ url, type }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = type;
      
      if (type === 'font') {
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
      links.push(link);
    });
    
    return () => {
      links.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [assets]);
}

// Prefetch on visibility (intersection observer)
export function useVisibilityPrefetch(route: string) {
  const prefetch = usePrefetchRoute();
  const prefetchedRef = useRef(false);
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !prefetchedRef.current) {
          prefetchedRef.current = true;
          prefetch(route);
        }
      },
      { rootMargin: '100px' }
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [route, prefetch]);
  
  return ref;
}

// Smart data refresh based on visibility
export function useSmartRefresh(queryKey: string[], options?: { interval?: number; onlyWhenVisible?: boolean }) {
  const queryClient = useQueryClient();
  const isVisibleRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
      
      // Refresh data when tab becomes visible again
      if (isVisibleRef.current) {
        const queryState = queryClient.getQueryState(queryKey);
        const isStale = queryState && queryState.dataUpdatedAt < Date.now() - 60000;
        
        if (isStale) {
          queryClient.invalidateQueries({ queryKey });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    
    // Optional periodic refresh
    if (options?.interval && options.interval > 0) {
      intervalRef.current = setInterval(() => {
        if (!options.onlyWhenVisible || isVisibleRef.current) {
          queryClient.invalidateQueries({ queryKey });
        }
      }, options.interval);
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [queryClient, queryKey, options?.interval, options?.onlyWhenVisible]);
}
