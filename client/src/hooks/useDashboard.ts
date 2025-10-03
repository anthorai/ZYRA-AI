import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Types for real-time dashboard data
export interface DashboardData {
  user: any;
  profile: any;
  usageStats: UsageStats | null;
  activityLogs: any[];
  toolsAccess: any[];
  realtimeMetrics: any[];
}

export interface UsageStats {
  totalRevenue: number;
  totalOrders: number;
  conversionRate: number;
  cartRecoveryRate: number;
  productsOptimized: number;
  emailsSent: number;
  smsSent: number;
  aiGenerationsUsed: number;
  seoOptimizationsUsed: number;
  lastUpdated: string;
}

// Main dashboard hook with real-time capabilities
export function useDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, user, session, loading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();

  // Check if user is truly authenticated with valid session and access token
  // For UI-only mode, just check if not loading to enable mock data
  const isFullyAuthenticated = Boolean(isAuthenticated && user && session?.access_token && !loading);
  const canUseMockData = !loading; // Enable mock data as soon as auth loading is done

  // Mock dashboard data for UI-only mode
  const mockDashboardData: DashboardData = {
    user: user,
    profile: { 
      id: user?.id, 
      email: user?.email, 
      fullName: "Demo User", 
      plan: "trial" 
    },
    usageStats: {
      totalRevenue: 125000,
      totalOrders: 342,
      conversionRate: 320,
      cartRecoveryRate: 1850,
      productsOptimized: 28,
      emailsSent: 1456,
      smsSent: 234,
      aiGenerationsUsed: 67,
      seoOptimizationsUsed: 45,
      lastUpdated: new Date().toISOString()
    },
    activityLogs: [
      {
        id: "1",
        action: "tool_accessed",
        description: "Used AI Product Generator",
        createdAt: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: "2", 
        action: "generated_product",
        description: "Generated product description for 'Premium Headphones'",
        createdAt: new Date(Date.now() - 600000).toISOString()
      }
    ],
    toolsAccess: [],
    realtimeMetrics: []
  };

  // Keep original query structure but use mock data
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard-complete"],
    queryFn: () => {
      console.log('🎭 Returning mock dashboard data...');
      return Promise.resolve(mockDashboardData);
    }, // Return mock data instead of API call
    enabled: canUseMockData, // Enable as soon as auth is not loading
    staleTime: Infinity, // Never consider the mock data stale
    gcTime: Infinity, // Keep in cache indefinitely
    refetchInterval: false, // Disable auto-refetch for mock data
    refetchIntervalInBackground: false,
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnReconnect: false, // Don't refetch on network reconnect
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: false, // Don't retry for mock data
  });

  // Keep mutation hook structure but disable API calls
  const initializeMutation = useMutation({
    mutationFn: async () => {
      console.log('🎭 Mock dashboard initialization...');
      return { message: "Mock initialization" };
    },
    onSuccess: () => {
      setIsInitialized(true);
      toast({
        title: "Dashboard Ready",
        description: "UI-only mode activated with mock data",
      });
    },
  });

  // Keep mutation hook structure but disable API calls
  const trackToolAccessMutation = useMutation({
    mutationFn: async (toolName: string) => {
      console.log('🎭 Mock tracking tool access:', toolName);
      return { message: "Mock tracking" };
    },
    onSuccess: () => {
      // Mock success
    },
  });

  // Keep mutation hook structures but disable API calls
  const logActivityMutation = useMutation({
    mutationFn: async (activityData: any) => {
      console.log('🎭 Mock activity logged:', activityData);
      return { message: "Mock activity logged" };
    },
  });

  const updateUsageMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('🎭 Mock usage stats update:', data);
      setLastUpdate(Date.now());
      return { message: "Mock usage updated" };
    },
  });

  const refreshMetricsMutation = useMutation({
    mutationFn: async () => {
      console.log('🎭 Mock metrics refresh...');
      return { message: "Mock metrics refreshed" };
    },
    onSuccess: () => {
      toast({
        title: "Metrics Refreshed",
        description: "Mock metrics have been updated",
      });
    },
  });

  // Auto-initialize for UI-only mode
  useEffect(() => {
    if (canUseMockData && !isInitialized) {
      console.log('🎭 Auto-initializing mock dashboard...');
      setIsInitialized(true);
    }
  }, [canUseMockData, isInitialized]);

  // Debug logging for troubleshooting
  useEffect(() => {
    console.log('🔍 useDashboard state:', {
      isAuthenticated,
      user: !!user,
      session: !!session,
      loading,
      canUseMockData,
      isLoading,
      isInitialized,
      dashboardData: !!dashboardData
    });
  }, [isAuthenticated, user, session, loading, canUseMockData, isLoading, isInitialized, dashboardData]);

  // Keep mutation hook structure but disable API calls
  const refreshMutation = useMutation({
    mutationFn: async () => {
      console.log('🎭 Mock dashboard refresh...');
      setIsRefreshing(true);
      return new Promise(resolve => {
        setTimeout(() => {
          setLastUpdate(Date.now());
          setIsRefreshing(false);
          resolve({ message: "Mock refresh complete" });
        }, 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Data refreshed successfully!",
        description: "Mock dashboard data has been updated.",
        duration: 3000,
      });
    },
  });

  // Manual refresh function with comprehensive functionality
  const refreshDashboard = useCallback(() => {
    refreshMutation.mutate();
  }, [refreshMutation]);

  // Track tool access with optimistic UI
  const trackToolAccess = useCallback(
    (toolName: string) => {
      trackToolAccessMutation.mutate(toolName);
    },
    [trackToolAccessMutation]
  );

  // Log user activity
  const logActivity = useCallback(
    (action: string, description: string, toolUsed?: string, metadata?: any) => {
      logActivityMutation.mutate({ action, description, toolUsed, metadata });
    },
    [logActivityMutation]
  );

  // Update usage statistics
  const updateUsageStats = useCallback(
    (statField: string, increment = 1) => {
      updateUsageMutation.mutate({ statField, increment });
    },
    [updateUsageMutation]
  );

  // Generate formatted stats for display
  const formattedStats = dashboardData?.usageStats
    ? [
        {
          icon: "TrendingUp",
          title: "Total Revenue",
          value: `$${Math.floor(((dashboardData as any).usageStats?.totalRevenue || 0) / 100).toLocaleString()}`,
          change: "+12.5%",
          positive: true,
        },
        {
          icon: "ShoppingCart",
          title: "Orders",
          value: ((dashboardData as any).usageStats?.totalOrders || 0).toLocaleString(),
          change: "+8.2%",
          positive: true,
        },
        {
          icon: "Eye",
          title: "Conversion Rate",
          value: `${(((dashboardData as any).usageStats?.conversionRate || 0) / 100).toFixed(1)}%`,
          change: "+2.1%",
          positive: true,
        },
        {
          icon: "RotateCcw",
          title: "Cart Recovery",
          value: `${Math.floor(((dashboardData as any).usageStats?.cartRecoveryRate || 0) / 100)}%`,
          change: "+15.3%",
          positive: true,
        },
      ]
    : [];

  return {
    // Data
    dashboardData,
    formattedStats,
    isLoading,
    error,
    isInitialized,
    lastUpdate,

    // Actions
    refreshDashboard,
    trackToolAccess,
    logActivity,
    updateUsageStats,
    refreshMetrics: refreshMetricsMutation.mutate,

    // Loading states
    isInitializing: initializeMutation.isPending,
    isTrackingTool: trackToolAccessMutation.isPending,
    isLoggingActivity: logActivityMutation.isPending,
    isUpdatingUsage: updateUsageMutation.isPending,
    isRefreshingMetrics: refreshMetricsMutation.isPending,
    isRefreshing,
  };
}

// Hook for skeleton loading states
export function useSkeletonLoader(isLoading: boolean, delay = 150) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading) {
      timer = setTimeout(() => {
        setShowSkeleton(true);
      }, delay);
    } else {
      setShowSkeleton(false);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isLoading, delay]);

  return showSkeleton;
}

// Hook for optimistic UI updates
export function useOptimisticAction<T extends any[], R>(
  action: (...args: T) => Promise<R>,
  optimisticUpdate?: (...args: T) => void,
  onError?: (error: any, ...args: T) => void
) {
  const [isPending, setIsPending] = useState(false);

  const execute = useCallback(
    async (...args: T): Promise<R | null> => {
      setIsPending(true);

      // Apply optimistic update immediately
      if (optimisticUpdate) {
        optimisticUpdate(...args);
      }

      try {
        const result = await action(...args);
        setIsPending(false);
        return result;
      } catch (error) {
        setIsPending(false);
        if (onError) {
          onError(error, ...args);
        }
        return null;
      }
    },
    [action, optimisticUpdate, onError]
  );

  return { execute, isPending };
}

// Hook for real-time data synchronization
export function useRealtimeSync(intervalMs = 5000) {
  const queryClient = useQueryClient();
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      // Invalidate dashboard queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-complete"] });
      setLastSync(new Date());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [queryClient, intervalMs]);

  return { lastSync };
}

// Hook for connection status monitoring
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnline, setLastOnline] = useState<Date>(new Date());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, lastOnline };
}