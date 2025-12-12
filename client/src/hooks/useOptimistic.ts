/**
 * Optimistic Update Hooks for Instant UI Feedback
 * Provides instant visual feedback while async operations complete in background
 */

import { useState, useCallback, useRef } from 'react';
import { useQueryClient, useMutation, UseMutationOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Generic optimistic mutation hook
export function useOptimisticMutation<TData, TVariables, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onMutate?: (variables: TVariables) => TContext | Promise<TContext>;
    onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
    onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void;
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables, context: TContext | undefined) => void;
    invalidateQueries?: string[][];
  }
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onMutate: options?.onMutate,
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context as TContext);
      
      // Invalidate related queries
      options?.invalidateQueries?.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
    onError: options?.onError,
    onSettled: options?.onSettled,
  });
}

// Optimistic toggle hook (for likes, favorites, etc.)
export function useOptimisticToggle<T extends { id: string }>(
  queryKey: string[],
  toggleField: keyof T,
  apiEndpoint: string
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: T) => {
      const response = await apiRequest('POST', `${apiEndpoint}/${item.id}/toggle`);
      return response.json();
    },
    onMutate: async (item: T) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData<T[]>(queryKey);
      
      // Optimistically update
      queryClient.setQueryData<T[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map(i => 
          i.id === item.id 
            ? { ...i, [toggleField]: !i[toggleField] }
            : i
        );
      });
      
      return { previousData };
    },
    onError: (_err, _item, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// Optimistic list update hook
export function useOptimisticList<T extends { id: string }>(queryKey: string[]) {
  const queryClient = useQueryClient();
  
  const addItem = useCallback((newItem: T) => {
    queryClient.setQueryData<T[]>(queryKey, (old) => {
      if (!old) return [newItem];
      return [newItem, ...old];
    });
  }, [queryClient, queryKey]);
  
  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    queryClient.setQueryData<T[]>(queryKey, (old) => {
      if (!old) return old;
      return old.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
    });
  }, [queryClient, queryKey]);
  
  const removeItem = useCallback((id: string) => {
    queryClient.setQueryData<T[]>(queryKey, (old) => {
      if (!old) return old;
      return old.filter(item => item.id !== id);
    });
  }, [queryClient, queryKey]);
  
  const rollback = useCallback((previousData: T[]) => {
    queryClient.setQueryData(queryKey, previousData);
  }, [queryClient, queryKey]);
  
  return { addItem, updateItem, removeItem, rollback };
}

// Debounced mutation for rapid updates (like search input)
export function useDebouncedMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  delay: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);
  
  const mutate = useCallback((variables: TVariables) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsPending(true);
    
    timeoutRef.current = setTimeout(async () => {
      try {
        const result = await mutationFn(variables);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsPending(false);
      }
    }, delay);
  }, [mutationFn, delay]);
  
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setIsPending(false);
    }
  }, []);
  
  return { mutate, cancel, isPending, error, data };
}

// Instant action with background sync
export function useInstantAction<TInput, TOutput>(
  action: (input: TInput) => Promise<TOutput>,
  options?: {
    onOptimistic?: (input: TInput) => void;
    onSuccess?: (output: TOutput) => void;
    onError?: (error: Error) => void;
    retryCount?: number;
  }
) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const execute = useCallback(async (input: TInput): Promise<TOutput | null> => {
    setIsPending(true);
    setError(null);
    
    // Fire optimistic update immediately
    options?.onOptimistic?.(input);
    
    let lastError: Error | null = null;
    const retries = options?.retryCount ?? 2;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await action(input);
        options?.onSuccess?.(result);
        setIsPending(false);
        return result;
      } catch (err) {
        lastError = err as Error;
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
        }
      }
    }
    
    setError(lastError);
    options?.onError?.(lastError!);
    setIsPending(false);
    return null;
  }, [action, options]);
  
  return { execute, isPending, error };
}

// Batch mutations for bulk operations
export function useBatchMutation<TItem, TResult>(
  mutationFn: (item: TItem) => Promise<TResult>,
  options?: {
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
    onItemComplete?: (item: TItem, result: TResult) => void;
    onItemError?: (item: TItem, error: Error) => void;
  }
) {
  const [isPending, setIsPending] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  
  const executeBatch = useCallback(async (items: TItem[]): Promise<TResult[]> => {
    setIsPending(true);
    setProgress({ completed: 0, total: items.length });
    
    const concurrency = options?.concurrency ?? 3;
    const results: TResult[] = [];
    let completed = 0;
    
    // Process in batches
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (item) => {
          try {
            const result = await mutationFn(item);
            options?.onItemComplete?.(item, result);
            return result;
          } catch (err) {
            options?.onItemError?.(item, err as Error);
            throw err;
          }
        })
      );
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
        completed++;
        setProgress({ completed, total: items.length });
        options?.onProgress?.(completed, items.length);
      });
    }
    
    setIsPending(false);
    return results;
  }, [mutationFn, options]);
  
  return { executeBatch, isPending, progress };
}
