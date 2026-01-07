import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface StoreCurrencyData {
  currency: string;
}

export function useStoreCurrency() {
  const { data, isLoading, error } = useQuery<StoreCurrencyData>({
    queryKey: ['/api/store/currency'],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const syncCurrencyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/store/currency/sync');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store/currency'] });
    },
  });

  return {
    currency: data?.currency || 'USD',
    isLoading,
    error,
    syncCurrency: syncCurrencyMutation.mutate,
    isSyncing: syncCurrencyMutation.isPending,
  };
}
