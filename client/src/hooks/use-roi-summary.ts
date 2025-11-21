import { useQuery } from "@tanstack/react-query";

export interface ROISummaryData {
  currentMonth: {
    total: number;
    period: string;
    breakdown: {
      cartRecovery: number;
      campaigns: number;
      aiOptimization: number;
    };
  };
  previousMonth: {
    total: number;
    period: string;
    breakdown: {
      cartRecovery: number;
      campaigns: number;
      aiOptimization: number;
    };
  };
  comparison: {
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
}

/**
 * Shared hook for ROI summary data with loading guards and stable defaults
 * Prevents duplicate API calls and TypeErrors from toLocaleString on undefined
 */
export function useROISummary() {
  const query = useQuery<ROISummaryData>({
    queryKey: ['/api/analytics/roi-summary'],
    refetchInterval: 30000,
  });

  // Return safe defaults during loading to prevent TypeErrors
  const safeData: ROISummaryData = query.data ?? {
    currentMonth: {
      total: 0,
      period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      breakdown: {
        cartRecovery: 0,
        campaigns: 0,
        aiOptimization: 0,
      },
    },
    previousMonth: {
      total: 0,
      period: '',
      breakdown: {
        cartRecovery: 0,
        campaigns: 0,
        aiOptimization: 0,
      },
    },
    comparison: {
      change: 0,
      trend: 'neutral' as const,
    },
  };

  return {
    ...query,
    data: safeData,
  };
}
