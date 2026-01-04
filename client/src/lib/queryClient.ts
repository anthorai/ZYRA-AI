import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

// Performance: Cache token to avoid repeated async calls
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// Get cached token or refresh if expired (< 30 seconds remaining)
async function getCachedToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && tokenExpiry > now + 30000) {
    return cachedToken;
  }
  
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    cachedToken = session.access_token;
    // JWT typically expires in 1 hour, cache for 55 minutes
    tokenExpiry = now + 55 * 60 * 1000;
    return cachedToken;
  }
  return null;
}

// Clear token cache on logout
export function clearTokenCache() {
  cachedToken = null;
  tokenExpiry = 0;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let text = "";
    try {
      const clonedRes = res.clone();
      text = await clonedRes.text();
      
      // If the response is the specific 401 Shopify reauth JSON, don't throw as a generic error
      // so that components can handle it gracefully.
      if (res.status === 401 && text.includes('"reauth":true')) {
        // Return without throwing to allow the caller to handle JSON parsing and redirect
        return;
      }
    } catch (e) {
      text = res.statusText;
    }
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to refresh the session token
async function refreshSessionToken(): Promise<string | null> {
  // Prevent concurrent refresh attempts
  if ((window as any)._isRefreshingToken) {
    console.log('🔄 Token refresh already in progress, waiting...');
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!(window as any)._isRefreshingToken) {
          clearInterval(checkInterval);
          getCachedToken().then(resolve);
        }
      }, 100);
    });
  }

  (window as any)._isRefreshingToken = true;
  console.log('🔄 Attempting to refresh session token...');
  
  try {
    // Force refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      console.error('❌ Failed to refresh session:', error?.message);
      // Clear stale cache on refresh failure
      cachedToken = null;
      tokenExpiry = 0;
      return null;
    }
    
    // CRITICAL: Update the cache with the new token to prevent refresh loops
    const newToken = data.session.access_token;
    cachedToken = newToken;
    tokenExpiry = Date.now() + 55 * 60 * 1000; // Cache for 55 minutes
    
    console.log('✅ Session refreshed successfully, cache updated');
    return newToken;
  } catch (error) {
    console.error('❌ Error refreshing session:', error);
    // Clear stale cache on error
    cachedToken = null;
    tokenExpiry = 0;
    return null;
  } finally {
    (window as any)._isRefreshingToken = false;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Performance: Use cached token instead of fetching each time
  const token = await getCachedToken();
  
  // Check if data is FormData (for file uploads)
  const isFormData = data instanceof FormData;
  
  const headers: Record<string, string> = {
    // Don't set Content-Type for FormData - browser will set it with boundary
    ...(data && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };

  let res = await fetch(url, {
    method,
    headers,
    body: data ? (isFormData ? data as FormData : JSON.stringify(data)) : undefined,
  });

  // If we get a 401, try refreshing the token and retrying once
  if (res.status === 401) {
    console.log('⚠️ Request failed with 401, attempting token refresh...');
    
    const newToken = await refreshSessionToken();
    
    if (newToken) {
      // Retry the request with the new token
      const newHeaders: Record<string, string> = {
        ...(data && !isFormData ? { "Content-Type": "application/json" } : {}),
        "Authorization": `Bearer ${newToken}`
      };

      res = await fetch(url, {
        method,
        headers: newHeaders,
        body: data ? (isFormData ? data as FormData : JSON.stringify(data)) : undefined,
      });
      
      console.log('✅ Request retried with refreshed token');
    } else {
      console.error('❌ Could not refresh token, user needs to re-authenticate');
      // Let the error propagate so AuthProvider can handle redirect
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get the current session token from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
      ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {})
    };

    let res = await fetch(queryKey.join("/") as string, {
      headers,
    });

    // If we get a 401, try refreshing the token and retrying once
    if (res.status === 401) {
      console.log('⚠️ Query failed with 401, attempting token refresh...');
      
      const newToken = await refreshSessionToken();
      
      if (newToken) {
        // Retry the request with the new token
        const newHeaders: Record<string, string> = {
          "Authorization": `Bearer ${newToken}`
        };

        res = await fetch(queryKey.join("/") as string, {
          headers: newHeaders,
        });
        
        console.log('✅ Query retried with refreshed token');
      } else {
        console.error('❌ Could not refresh token, user needs to re-authenticate');
        // Let the error propagate so AuthProvider can handle redirect
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer for instant access
      retry: 1,
      retryDelay: 500, // Faster retry
      networkMode: 'offlineFirst', // Use cache first for instant display
    },
    mutations: {
      retry: 1,
      retryDelay: 500,
      networkMode: 'offlineFirst',
    },
  },
});

// Prefetch commonly accessed data for instant access
export function prefetchCriticalData() {
  const prefetchQueries = [
    '/api/products',
    '/api/credits/balance',
    '/api/subscription-plans',
  ];
  
  prefetchQueries.forEach(queryKey => {
    queryClient.prefetchQuery({
      queryKey: [queryKey],
      staleTime: 5 * 60 * 1000,
    });
  });
}

// Smart invalidation - only invalidate if data is stale
export function smartInvalidate(queryKey: string[]) {
  const queryState = queryClient.getQueryState(queryKey);
  if (!queryState || queryState.isInvalidated) return;
  
  const isStale = queryState.dataUpdatedAt < Date.now() - 60000; // 1 minute
  if (isStale) {
    queryClient.invalidateQueries({ queryKey });
  }
}
