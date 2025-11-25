import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Share, 
  CheckCircle,
  Clock,
  Package,
  TrendingUp,
  Zap,
  ExternalLink,
  AlertCircle,
  Store,
  RefreshCw
} from "lucide-react";

function stripHtml(html: string | undefined | null): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface Product {
  id: string;
  name: string;
  description: string;
  optimizedDescription?: string;
  originalDescription?: string;
  tags?: string[];
  originalTags?: string[];
  isOptimized: boolean;
  shopifyId?: string;
  imageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
}

interface SeoMeta {
  productId: string;
  seoTitle?: string;
  optimizedTitle?: string;
  metaDescription?: string;
  optimizedMeta?: string;
  keywords?: string;
}

export default function ShopifyPublish() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set());
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: shopifyStatus, isLoading: statusLoading, isError: statusError, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/shopify/status'],
    retry: 1,
  });

  const { data: seoMetaData } = useQuery<SeoMeta[]>({
    queryKey: ['/api/seo-meta'],
  });

  const optimizedProducts = products?.filter(p => p.isOptimized && p.shopifyId) || [];
  const seoMetaMap = new Map(seoMetaData?.map(s => [s.productId, s]) || []);

  const publishMutation = useMutation({
    mutationFn: async (productId: string) => {
      const product = optimizedProducts.find(p => p.id === productId);
      const seoMeta = seoMetaMap.get(productId);
      
      if (!product) throw new Error('Product not found');

      const content = {
        description: product.optimizedDescription || product.description,
        seoTitle: seoMeta?.optimizedTitle || seoMeta?.seoTitle || product.name,
        metaDescription: seoMeta?.optimizedMeta || seoMeta?.metaDescription || '',
        tags: product.tags || []
      };

      const response = await apiRequest('POST', `/api/shopify/publish/${productId}`, { content });
      return response;
    },
    onSuccess: (_, productId) => {
      setPublishingIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      setPublishedIds(prev => new Set(prev).add(productId));
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Product Published",
        description: "Product successfully updated in your Shopify store",
      });
    },
    onError: (error, productId) => {
      setPublishingIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      toast({
        title: "Publish Failed",
        description: error instanceof Error ? error.message : "Failed to publish product",
        variant: "destructive"
      });
    }
  });

  const bulkPublishMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const productsToPublish = productIds.map(productId => {
        const product = optimizedProducts.find(p => p.id === productId);
        const seoMeta = seoMetaMap.get(productId);
        
        return {
          productId,
          content: {
            description: product?.optimizedDescription || product?.description || '',
            seoTitle: seoMeta?.optimizedTitle || seoMeta?.seoTitle || product?.name || '',
            metaDescription: seoMeta?.optimizedMeta || seoMeta?.metaDescription || '',
            tags: product?.tags || []
          }
        };
      });

      const response = await apiRequest('POST', '/api/shopify/publish/bulk', { products: productsToPublish });
      let data;
      try {
        data = await response.json();
      } catch {
        data = { success: true };
      }
      return { productIds, results: data };
    },
    onSuccess: ({ productIds, results }) => {
      const successfulIds: string[] = [];
      const failedIds: string[] = [];
      
      if (results.results && Array.isArray(results.results)) {
        results.results.forEach((result: any) => {
          if (result.success) {
            successfulIds.push(result.productId);
          }
        });
      }
      
      if (results.errors && Array.isArray(results.errors)) {
        results.errors.forEach((error: any) => {
          failedIds.push(error.productId);
        });
      }
      
      if (successfulIds.length === 0 && failedIds.length === 0 && results.success) {
        successfulIds.push(...productIds);
      }
      
      setPublishingIds(prev => {
        const next = new Set(prev);
        productIds.forEach(id => next.delete(id));
        return next;
      });
      
      if (successfulIds.length > 0) {
        setPublishedIds(prev => {
          const next = new Set(prev);
          successfulIds.forEach(id => next.add(id));
          return next;
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      if (failedIds.length > 0 && successfulIds.length > 0) {
        toast({
          title: "Partial Success",
          description: `Published ${successfulIds.length} products. ${failedIds.length} failed.`,
          variant: "destructive"
        });
      } else if (failedIds.length > 0) {
        toast({
          title: "Publish Failed",
          description: `Failed to publish ${failedIds.length} products.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "All Products Published",
          description: `Successfully published ${successfulIds.length} products to your Shopify store`,
        });
      }
    },
    onError: (error, productIds) => {
      setPublishingIds(prev => {
        const next = new Set(prev);
        productIds.forEach(id => next.delete(id));
        return next;
      });
      toast({
        title: "Bulk Publish Failed",
        description: error instanceof Error ? error.message : "Failed to publish products",
        variant: "destructive"
      });
    }
  });

  const handlePublishSingle = async (productId: string) => {
    setPublishingIds(prev => new Set(prev).add(productId));
    publishMutation.mutate(productId);
  };

  const handlePublishAll = async () => {
    const unpublishedIds = optimizedProducts
      .filter(p => !publishedIds.has(p.id))
      .map(p => p.id);
    
    if (unpublishedIds.length === 0) {
      toast({
        title: "Nothing to Publish",
        description: "All products have already been published",
      });
      return;
    }

    setPublishingIds(new Set(unpublishedIds));
    bulkPublishMutation.mutate(unpublishedIds);
  };

  const isConnected = shopifyStatus && (shopifyStatus as any).isConnected;
  const isPublishing = publishingIds.size > 0 || bulkPublishMutation.isPending;
  const publishedCount = publishedIds.size;
  const remainingCount = optimizedProducts.length - publishedCount;

  if (statusError) {
    return (
      <PageShell
        title="Shopify Publish"
        subtitle="Publish your AI-optimized products directly to your Shopify store"
      >
        <DashboardCard>
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Connection Error</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Unable to check your Shopify connection status. Please try again.
            </p>
            <Button
              onClick={() => refetchStatus()}
              className="bg-primary text-primary-foreground"
              data-testid="button-retry-status"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </DashboardCard>
      </PageShell>
    );
  }

  if (productsLoading || statusLoading) {
    return (
      <PageShell
        title="Shopify Publish"
        subtitle="Publish your AI-optimized products directly to your Shopify store"
      >
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (!isConnected) {
    return (
      <PageShell
        title="Shopify Publish"
        subtitle="Publish your AI-optimized products directly to your Shopify store"
      >
        <DashboardCard>
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Connect Your Shopify Store</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              To publish optimized products, you need to connect your Shopify store first.
            </p>
            <Button
              onClick={() => setLocation('/integrations')}
              className="bg-primary text-primary-foreground"
              data-testid="button-connect-shopify"
            >
              <Store className="w-4 h-4 mr-2" />
              Connect Shopify Store
            </Button>
          </div>
        </DashboardCard>
      </PageShell>
    );
  }

  if (optimizedProducts.length === 0) {
    return (
      <PageShell
        title="Shopify Publish"
        subtitle="Publish your AI-optimized products directly to your Shopify store"
      >
        <DashboardCard>
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Optimized Products</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              You don't have any optimized products linked to Shopify yet. Optimize your products first, then come back to publish them.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => setLocation('/automation/smart-bulk-suggestions')}
                className="bg-primary text-primary-foreground"
                data-testid="button-go-optimize"
              >
                <Zap className="w-4 h-4 mr-2" />
                Optimize Products
              </Button>
              <Button
                onClick={() => refetchProducts()}
                variant="outline"
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </DashboardCard>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Shopify Publish"
      subtitle="Publish your AI-optimized products directly to your Shopify store"
    >
      <DashboardCard
        title="Ready to Publish"
        description="Your optimized products are ready to be published to your Shopify store"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-primary mb-2" data-testid="text-products-ready">
              {optimizedProducts.length}
            </div>
            <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Products Ready</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2" data-testid="text-products-published">
              {publishedCount}
            </div>
            <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Published</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2" data-testid="text-products-remaining">
              {remainingCount}
            </div>
            <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Remaining</div>
          </div>
        </div>

        <Button
          onClick={handlePublishAll}
          disabled={isPublishing || remainingCount === 0}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 font-medium text-lg py-6"
          data-testid="button-publish-all"
        >
          {isPublishing ? (
            <>
              <Clock className="w-5 h-5 mr-2 animate-spin" />
              Publishing {publishingIds.size} products...
            </>
          ) : remainingCount === 0 ? (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              All Products Published
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Publish All to Shopify ({remainingCount} products)
            </>
          )}
        </Button>
      </DashboardCard>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Optimized Product Content</h2>
        
        {optimizedProducts.map((product) => {
          const seoMeta = seoMetaMap.get(product.id);
          const isProductPublishing = publishingIds.has(product.id);
          const isProductPublished = publishedIds.has(product.id);
          const optimizedTitle = seoMeta?.optimizedTitle || seoMeta?.seoTitle || product.name;
          const optimizedDesc = product.optimizedDescription || product.description;
          const optimizedMeta = seoMeta?.optimizedMeta || seoMeta?.metaDescription || '';
          const keywords = seoMeta?.keywords?.split(',').map(k => k.trim()).filter(Boolean) || product.tags || [];
          const originalTags = product.originalTags || [];

          return (
            <DashboardCard
              key={product.id}
              testId={`card-product-${product.id}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                      <h3 className="text-base sm:text-lg md:text-xl text-white truncate min-w-0" data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-green-500/20 text-green-400">Optimized</Badge>
                      {product.shopifyId && (
                        <Badge className="bg-blue-500/20 text-blue-400">Linked to Shopify</Badge>
                      )}
                      {isProductPublished && (
                        <Badge className="bg-purple-500/20 text-purple-400">Published</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handlePublishSingle(product.id)}
                    disabled={isProductPublishing || isProductPublished}
                    className={isProductPublished 
                      ? "bg-green-600 hover:bg-green-600 text-white" 
                      : "bg-purple-600 hover:bg-purple-700 text-white"}
                    data-testid={`button-publish-${product.id}`}
                  >
                    {isProductPublishing ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : isProductPublished ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Published
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Publish
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-slate-300 font-medium mb-3">Original Content</h4>
                    <div className="bg-slate-800/30 p-4 rounded-lg space-y-2">
                      <div>
                        <span className="text-slate-400 text-sm font-medium">Title:</span>
                        <p className="text-slate-300 text-sm mt-1">{product.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm font-medium">Description:</span>
                        <p className="text-slate-300 text-sm mt-1 line-clamp-3">
                          {stripHtml(product.originalDescription || product.description) || 'No description'}
                        </p>
                      </div>
                      {originalTags.length > 0 && (
                        <div>
                          <span className="text-slate-400 text-sm font-medium">Tags:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {originalTags.slice(0, 5).map((tag, idx) => (
                              <span key={idx} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                            {originalTags.length > 5 && (
                              <span className="text-xs text-slate-400">+{originalTags.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-slate-300 font-medium mb-3">AI-Optimized Content</h4>
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-primary/20 space-y-2">
                      <div>
                        <span className="text-slate-400 text-sm font-medium">SEO Title:</span>
                        <p className="text-slate-100 text-sm mt-1 font-medium">{optimizedTitle}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm font-medium">Description:</span>
                        <p className="text-slate-100 text-sm mt-1 line-clamp-3">{stripHtml(optimizedDesc)}</p>
                      </div>
                      {optimizedMeta && (
                        <div>
                          <span className="text-slate-400 text-sm font-medium">Meta Description:</span>
                          <p className="text-slate-100 text-sm mt-1 line-clamp-2">{optimizedMeta}</p>
                        </div>
                      )}
                      {keywords.length > 0 && (
                        <div>
                          <span className="text-slate-400 text-sm font-medium">Keywords:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {keywords.slice(0, 5).map((tag, idx) => (
                              <span key={idx} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                            {keywords.length > 5 && (
                              <span className="text-xs text-slate-400">+{keywords.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pt-4 border-t border-slate-700/50">
                  <div className="text-center">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-400 mx-auto mb-1 flex-shrink-0" />
                    <div className="text-[10px] sm:text-xs md:text-sm text-slate-300">SEO Optimized</div>
                    <div className="text-xs sm:text-sm font-bold text-green-400">
                      {seoMeta ? 'Yes' : 'Basic'}
                    </div>
                  </div>
                  <div className="text-center">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-400 mx-auto mb-1 flex-shrink-0" />
                    <div className="text-[10px] sm:text-xs md:text-sm text-slate-300">Keywords</div>
                    <div className="text-xs sm:text-sm font-bold text-blue-400">{keywords.length}</div>
                  </div>
                  <div className="text-center">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-400 mx-auto mb-1 flex-shrink-0" />
                    <div className="text-[10px] sm:text-xs md:text-sm text-slate-300">Shopify Status</div>
                    <div className="text-xs sm:text-sm font-bold text-purple-400">
                      {isProductPublished ? 'Synced' : 'Ready'}
                    </div>
                  </div>
                </div>
              </div>
            </DashboardCard>
          );
        })}
      </div>
    </PageShell>
  );
}
