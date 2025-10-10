import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
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

  const res = await fetch(url, {
    method,
    headers,
    body: data ? (isFormData ? data as FormData : JSON.stringify(data)) : undefined,
  });

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

    const res = await fetch(queryKey.join("/") as string, {
      headers,
    });

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
