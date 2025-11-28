import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getToolCredits, getToolCreditsPerProduct } from "@shared/ai-credits";

export interface CreditBalance {
  creditsUsed: number;
  creditsRemaining: number;
  creditLimit: number;
  percentUsed: number;
  isLow: boolean;
  lowCreditThreshold: number;
}

export interface CreditCheckResult {
  hasEnoughCredits: boolean;
  creditsUsed: number;
  creditsRemaining: number;
  creditLimit: number;
  creditCost?: number;
  message?: string;
}

export function useCredits() {
  const { toast } = useToast();

  const { data: balance, isLoading, refetch } = useQuery<CreditBalance>({
    queryKey: ['/api/credits/balance'],
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const checkCreditsMutation = useMutation({
    mutationFn: async ({ toolId, quantity = 1 }: { toolId: string; quantity?: number }) => {
      const response = await apiRequest('POST', '/api/credits/check', { toolId, quantity });
      return await response.json() as CreditCheckResult;
    },
  });

  const consumeCreditsMutation = useMutation({
    mutationFn: async ({ toolId, quantity = 1 }: { toolId: string; quantity?: number }) => {
      const response = await apiRequest('POST', '/api/credits/consume', { toolId, quantity });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credits/balance'] });
    },
    onError: (error: any) => {
      toast({
        title: "Insufficient Credits",
        description: error.message || "You don't have enough credits for this operation.",
        variant: "destructive",
      });
    },
  });

  const checkCredits = async (toolId: string, quantity: number = 1): Promise<CreditCheckResult> => {
    try {
      const result = await checkCreditsMutation.mutateAsync({ toolId, quantity });
      return result;
    } catch (error: any) {
      return {
        hasEnoughCredits: false,
        creditsUsed: 0,
        creditsRemaining: 0,
        creditLimit: 0,
        creditCost: 0,
        message: error.message || "Failed to check credits"
      };
    }
  };

  const consumeCredits = async (toolId: string, quantity: number = 1): Promise<boolean> => {
    try {
      await consumeCreditsMutation.mutateAsync({ toolId, quantity });
      return true;
    } catch (error) {
      return false;
    }
  };

  const hasEnoughCredits = (toolId: string, quantity: number = 1): boolean => {
    if (!balance) return true;
    const cost = quantity > 1 
      ? getToolCreditsPerProduct(toolId) * quantity 
      : getToolCredits(toolId);
    return balance.creditsRemaining >= cost;
  };

  const showLowCreditWarning = () => {
    if (balance?.isLow) {
      toast({
        title: "Low Credits Warning",
        description: `You have ${balance.creditsRemaining} credits remaining. Consider upgrading your plan.`,
        variant: "destructive",
      });
    }
  };

  return {
    balance,
    isLoading,
    refetch,
    checkCredits,
    consumeCredits,
    hasEnoughCredits,
    showLowCreditWarning,
    isLow: balance?.isLow ?? false,
    creditsRemaining: balance?.creditsRemaining ?? 0,
    creditLimit: balance?.creditLimit ?? 0,
    percentUsed: balance?.percentUsed ?? 0,
  };
}
