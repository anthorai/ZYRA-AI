import { useQuery } from '@tanstack/react-query';

interface LearnedPattern {
  type: string;
  name: string;
  value: string;
  successRate: string | null;
  confidence: number | null;
}

interface LearningStats {
  baselinesCaptured: number;
  totalChangesRecorded: number;
  changesEvaluated: number;
  successfulOptimizations: number;
  failedOptimizations: number;
  successRate: string;
  patternsLearned: number;
  highConfidencePatterns: number;
  totalRevenueLift: string;
  topPatterns: LearnedPattern[];
}

export function useLearningStats() {
  return useQuery<LearningStats>({
    queryKey: ['/api/mode-credits/learning-stats'],
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useLearnedPatterns(actionType?: string, minConfidence: number = 60) {
  const params = new URLSearchParams();
  if (actionType) params.set('actionType', actionType);
  params.set('minConfidence', minConfidence.toString());
  
  const queryString = params.toString();
  const url = `/api/mode-credits/learned-patterns${queryString ? `?${queryString}` : ''}`;
  
  return useQuery<{ patterns: LearnedPattern[] }>({
    queryKey: ['/api/mode-credits/learned-patterns', actionType, minConfidence],
    queryFn: async () => {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch learned patterns');
      return response.json();
    },
    refetchInterval: 120000,
    staleTime: 60000,
  });
}
