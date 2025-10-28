import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to refresh the session token
async function refreshSessionToken(): Promise<string | null> {
  console.log('🔄 Attempting to refresh session token...');
  
  try {
    // Force refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      console.error('❌ Failed to refresh session:', error?.message);
      return null;
    }
    
    console.log('✅ Session refreshed successfully');
    return data.session.access_token;
  } catch (error) {
    console.error('❌ Error refreshing session:', error);
    return null;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get the current session token from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check if data is FormData (for file uploads)
  const isFormData = data instanceof FormData;
  
  const headers: Record<string, string> = {
    // Don't set Content-Type for FormData - browser will set it with boundary
    ...(data && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {})
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
      staleTime: 5 * 60 * 1000, // 5 minutes cache for better performance
      gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
      retry: 1, // Allow 1 retry for better reliability
      retryDelay: 1000, // Quick retry
    },
    mutations: {
      retry: 1, // Allow 1 retry for mutations too
      retryDelay: 1000,
    },
  },
});
