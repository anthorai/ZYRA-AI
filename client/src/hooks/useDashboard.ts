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
  const isFullyAuthenticated = Boolean(isAuthenticated && user && session?.access_token && !loading);

  // PRODUCTION: Fetch real dashboard data from API
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard-complete"],
    enabled: isFullyAuthenticated, // Only fetch when fully authenticated
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    retry: 3,
  });

  // Initialize dashboard on first load
  const initializeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/dashboard/initialize");
    },
    onSuccess: () => {
      setIsInitialized(true);
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-complete"] });
      toast({
        title: "Dashboard Ready",
        description: "Your dashboard has been initialized successfully.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Initialization Error",
        description: error.message || "Failed to initialize dashboard",
        variant: "destructive",
      });
    },
  });

  // Track tool access
  const trackToolAccessMutation = useMutation({
    mutationFn: async (toolName: string) => {
      return await apiRequest("POST", "/api/dashboard/track-tool", { toolName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-complete"] });
    },
  });

  // Log activity
  const logActivityMutation = useMutation({
    mutationFn: async (activityData: any) => {
      return await apiRequest("POST", "/api/dashboard/log-activity", activityData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-complete"] });
    },
  });

  // Update usage statistics
  const updateUsageMutation = useMutation({
    mutationFn: async (data: any) => {
      const result = await apiRequest("POST", "/api/dashboard/update-usage", data);
      setLastUpdate(Date.now());
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-complete"] });
    },
  });

  // Refresh metrics
  const refreshMetricsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/dashboard/refresh-metrics");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-complete"] });
      toast({
        title: "Metrics Refreshed",
        description: "Your dashboard metrics have been updated successfully.",
      });
    },
  });

  // Auto-initialize on first load if authenticated
  useEffect(() => {
    if (isFullyAuthenticated && !isInitialized && !isLoading) {
      initializeMutation.mutate();
    }
  }, [isFullyAuthenticated, isInitialized, isLoading]);

  // Debug logging for troubleshooting
  useEffect(() => {
    console.log('🔍 useDashboard state:', {
      isAuthenticated,
      user: !!user,
      session: !!session,
      loading,
      isFullyAuthenticated,
      isLoading,
      isInitialized,
      dashboardData: !!dashboardData
    });
  }, [isAuthenticated, user, session, loading, isFullyAuthenticated, isLoading, isInitialized, dashboardData]);

  // Manual refresh with UI feedback
  const refreshMutation = useMutation({
    mutationFn: async () => {
      setIsRefreshing(true);
      const result = await refetch();
      setIsRefreshing(false);
      setLastUpdate(Date.now());
      return result;
    },
    onSuccess: () => {
      toast({
        title: "✅ Data refreshed successfully!",
        description: "Your dashboard data has been updated.",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      setIsRefreshing(false);
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to refresh dashboard data",
        variant: "destructive",
      });
    },
  });

  // Manual refresh function
  const refreshDashboard = useCallback(() => {
    refreshMutation.mutate();
  }, [refreshMutation]);

  // Track tool access
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

  // Generate formatted stats for display (real data only - no mock deltas)
  const formattedStats = dashboardData?.usageStats
    ? [
        {
          icon: "TrendingUp",
          title: "Total Revenue",
          value: `$${Math.floor(((dashboardData as any).usageStats?.totalRevenue || 0) / 100).toLocaleString()}`,
        },
        {
          icon: "ShoppingCart",
          title: "Orders",
          value: ((dashboardData as any).usageStats?.totalOrders || 0).toLocaleString(),
        },
        {
          icon: "Eye",
          title: "Conversion Rate",
          value: `${(((dashboardData as any).usageStats?.conversionRate || 0) / 100).toFixed(1)}%`,
        },
        {
          icon: "RotateCcw",
          title: "Cart Recovery",
          value: `${Math.floor(((dashboardData as any).usageStats?.cartRecoveryRate || 0) / 100)}%`,
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
export function useRealtimeSync(intervalMs = 30000) { // 30 seconds for production
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
