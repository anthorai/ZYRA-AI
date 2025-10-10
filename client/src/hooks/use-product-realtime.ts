import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Product {
  id: string;
  name: string;
  userId: string;
  shopifyId: string | null;
  isOptimized: boolean;
  updatedAt: string;
}

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Product;
  old: Product;
}

export function useProductRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Setting up realtime subscription for products...');
    setIsSubscribed(true);

    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const { eventType, new: newRecord, old: oldRecord } = payload as RealtimePayload;
          
          console.log('📡 Realtime product update:', eventType, newRecord);
          setLastUpdate(new Date());

          switch (eventType) {
            case 'INSERT':
              toast({
                title: '✨ New Product Added',
                description: `${newRecord.name} has been added to your catalog`,
              });
              break;
            case 'UPDATE':
              if (newRecord.isOptimized && !oldRecord.isOptimized) {
                toast({
                  title: '🚀 Product Optimized',
                  description: `${newRecord.name} has been AI-optimized`,
                });
              }
              break;
            case 'DELETE':
              toast({
                title: '🗑️ Product Removed',
                description: `${oldRecord.name} has been removed from your catalog`,
                variant: 'destructive',
              });
              break;
          }

          // Invalidate products query to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['/api/products'] });
        }
      )
      .subscribe((status: string) => {
        console.log('📡 Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to product updates');
        }
      });

    return () => {
      console.log('🔌 Unsubscribing from product updates');
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [user?.id, queryClient, toast]);

  return {
    isSubscribed,
    lastUpdate,
  };
}
