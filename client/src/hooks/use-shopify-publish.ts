import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface PublishContent {
  description?: string;
  seoTitle?: string;
  metaDescription?: string;
  imageAltTexts?: Array<{ imageId: string; altText: string }>;
}

export function useShopifyConnection() {
  return useQuery({
    queryKey: ['/api/shopify/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/shopify/status');
      const data = await response.json();
      return data;
    },
  });
}

export function useShopifyPublish() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ productId, content }: { productId: string; content: PublishContent }) => {
      const response = await apiRequest('POST', `/api/shopify/publish/${productId}`, { content });
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      toast({
        title: '✅ Published to Shopify!',
        description: 'Your AI-generated content is now live on your Shopify store.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Publishing Failed',
        description: error.message || 'Failed to publish content to Shopify',
        variant: 'destructive',
      });
    },
  });
}

export function useShopifyBulkPublish() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (products: Array<{ productId: string; content: PublishContent }>) => {
      const response = await apiRequest('POST', '/api/shopify/publish/bulk', { products });
      const data = await response.json();
      return data;
    },
    onSuccess: (data: any) => {
      toast({
        title: '✅ Bulk Publishing Complete!',
        description: `Successfully published ${data.published} products to Shopify. ${data.failed > 0 ? `${data.failed} failed.` : ''}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Bulk Publishing Failed',
        description: error.message || 'Failed to bulk publish content to Shopify',
        variant: 'destructive',
      });
    },
  });
}

export function useShopifyRollback() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest('POST', `/api/shopify/rollback/${productId}`);
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      toast({
        title: '↩️ Rollback Successful',
        description: 'Product has been restored to its original content.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Rollback Failed',
        description: error.message || 'Failed to rollback product',
        variant: 'destructive',
      });
    },
  });
}
