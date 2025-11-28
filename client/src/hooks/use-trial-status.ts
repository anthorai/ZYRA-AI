import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface TrialStatus {
  isOnTrial: boolean;
  trialEndDate: string | null;
  daysRemaining: number;
  shouldShowWelcome: boolean;
  lastWelcomeAt: string | null;
  plan: string;
}

interface MarkWelcomeResult {
  success: boolean;
  error?: string;
}

export function useTrialStatus() {
  const { data: trialStatus, isLoading, error } = useQuery<TrialStatus>({
    queryKey: ['/api/trial/status'],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const markWelcomeShownMutation = useMutation<MarkWelcomeResult, Error>({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', '/api/trial/status', {});
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to mark welcome as shown');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trial/status'] });
    },
    onError: (error) => {
      console.error('[Trial Status] Failed to mark welcome as shown:', error);
    },
  });

  const markWelcomeShown = async (): Promise<boolean> => {
    try {
      await markWelcomeShownMutation.mutateAsync();
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    trialStatus,
    isLoading,
    error,
    isOnTrial: trialStatus?.isOnTrial ?? false,
    daysRemaining: trialStatus?.daysRemaining ?? 0,
    shouldShowWelcome: trialStatus?.shouldShowWelcome ?? false,
    trialEndDate: trialStatus?.trialEndDate ? new Date(trialStatus.trialEndDate) : null,
    markWelcomeShown,
    isMarkingShown: markWelcomeShownMutation.isPending,
    markWelcomeError: markWelcomeShownMutation.error,
  };
}
