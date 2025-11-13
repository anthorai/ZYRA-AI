import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardCard } from '@/components/ui/dashboard-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ShopifyPublishDialog } from '@/components/shopify/publish-dialog';
import { PublishContent, useShopifyBulkPublish } from '@/hooks/use-shopify-publish';
import { useProductRealtime } from '@/hooks/use-product-realtime';
import { CardGrid } from '@/components/ui/standardized-layout';
import { PageShell } from '@/components/ui/page-shell';
import {
  Package,
  Search,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  shopifyId: string | null;
  isOptimized: boolean;
  optimizedCopy: PublishContent | null;
  category: string;
  price: string;
  image: string;
}

// Separate ProductCard component to handle image loading state properly
function ProductCard({ 
  product, 
  canBeSelected, 
  isSelected, 
  onToggleSelection,
  onPublishClick 
}: { 
  product: Product;
  canBeSelected: boolean;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onPublishClick: (product: Product) => void;
}) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <DashboardCard 
      size="sm"
      className="group relative overflow-hidden rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border border-slate-700/50 hover:border-primary/30"
      testId={`card-product-${product.id}`}
    >
      {canBeSelected && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(product.id)}
            className="bg-white"
          />
        </div>
      )}
      
      <div className="h-full flex flex-col">
        <div className="flex-1 space-y-2 sm:space-y-3">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="text-primary flex-shrink-0">
                {product.image && !imageError ? (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageError(true);
                        setImageLoading(false);
                      }}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <Package className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                )}
              </div>
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white leading-tight truncate">
                {product.name}
              </h3>
            </div>
            {product.isOptimized && (
              <Badge className="bg-green-500 text-white text-xs px-2 py-1 rounded-full hover:bg-green-500 flex-shrink-0 ml-2">
                <Sparkles className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="hidden sm:inline">AI</span>
              </Badge>
            )}
          </div>
          
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3">
            {product.description || 'No description'}
          </p>

          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400">Price:</span>
              <span className="font-semibold text-primary">${product.price}</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400">Category:</span>
              <Badge variant="outline" className="text-xs truncate max-w-[120px]">{product.category}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400 truncate">Shopify:</span>
              {product.shopifyId ? (
                <Badge variant="outline" className="gap-1 text-xs flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                  <span className="hidden sm:inline">Synced</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-xs flex-shrink-0">
                  <AlertCircle className="w-3 h-3 text-yellow-600 flex-shrink-0" />
                  <span className="hidden sm:inline">Not Synced</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-3 sm:mt-4">
          {product.shopifyId && product.isOptimized ? (
            <Button
              onClick={() => onPublishClick(product)}
              className="w-full px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 border-0 font-semibold rounded-lg bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95"
            >
              <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="truncate hidden sm:inline">Publish to Shopify</span>
              <span className="truncate sm:hidden">Publish</span>
            </Button>
          ) : product.shopifyId ? (
            <Button 
              onClick={() => window.location.href = `/ai-tools/professional-copywriting?productId=${product.id}`}
              className="w-full px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 border-0 font-semibold rounded-lg bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="truncate hidden sm:inline">Generate AI Content</span>
              <span className="truncate sm:hidden">Generate</span>
            </Button>
          ) : (
            <Button 
              disabled
              className="w-full px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 border-0 font-semibold rounded-lg bg-primary text-primary-foreground opacity-50 cursor-not-allowed"
            >
              <span className="truncate hidden sm:inline">Sync with Shopify First</span>
              <span className="truncate sm:hidden">Sync First</span>
            </Button>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}

export default function ManageProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const bulkPublishMutation = useShopifyBulkPublish();

  // Enable real-time product updates
  useProductRealtime();

  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/products');
      const data = await response.json();
      return data as Product[];
    },
  });

  const syncProductsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/shopify/sync', { syncType: 'manual' });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      const totalSynced = (data.added || 0) + (data.updated || 0);
      const details = [];
      if (data.added > 0) details.push(`${data.added} added`);
      if (data.updated > 0) details.push(`${data.updated} updated`);
      
      toast({
        title: '✅ Products Synced!',
        description: `Successfully synced ${totalSynced} products from Shopify${details.length > 0 ? ` (${details.join(', ')})` : ''}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shopify/sync-status'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Sync Failed',
        description: error.message || 'Failed to sync products from Shopify',
        variant: 'destructive',
      });
    },
  });

  const handlePublishClick = (product: Product) => {
    if (!product.optimizedCopy) {
      toast({
        title: 'No AI Content',
        description: 'Generate AI content for this product first before publishing.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedProduct(product);
    setPublishDialogOpen(true);
  };

  const handleBulkPublish = async () => {
    const productsToPublish = products?.filter(
      (p) => selectedProductIds.includes(p.id) && p.shopifyId && p.optimizedCopy
    );

    if (!productsToPublish || productsToPublish.length === 0) {
      toast({
        title: 'No Products Selected',
        description: 'Select products with AI content to publish.',
        variant: 'destructive',
      });
      return;
    }

    const publishData = productsToPublish.map((p) => ({
      productId: p.id,
      content: p.optimizedCopy!,
    }));

    try {
      await bulkPublishMutation.mutateAsync(publishData);
      setSelectedProductIds([]);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    } catch (error) {
      // Error is already handled by the mutation's onError callback
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredPublishableProducts?.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredPublishableProducts?.map((p) => p.id) || []);
    }
  };

  // Global stats (not affected by search filter)
  const shopifyProducts = products?.filter((p) => p.shopifyId);
  const allOptimizedProducts = products?.filter((p) => p.isOptimized); // All AI optimized (for stats)

  // Filtered products for display
  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Publishable products from filtered results (for select-all checkbox)
  const filteredPublishableProducts = filteredProducts?.filter((p) => p.shopifyId && p.isOptimized);

  // Auto-clear selections when filtered products change (deselect hidden products)
  useEffect(() => {
    if (filteredPublishableProducts && selectedProductIds.length > 0) {
      const visibleIds = new Set(filteredPublishableProducts.map(p => p.id));
      const updatedSelections = selectedProductIds.filter(id => visibleIds.has(id));
      
      if (updatedSelections.length !== selectedProductIds.length) {
        setSelectedProductIds(updatedSelections);
      }
    }
  }, [filteredPublishableProducts, searchQuery]);

  if (isLoading) {
    return (
      <PageShell hideHeader>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell hideHeader maxWidth="xl" spacing="normal">
      {/* Search and Action Buttons */}
      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 sm:pl-12 pr-4 py-2 sm:py-3 text-sm sm:text-base bg-slate-800/50 border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/50 transition-all"
            data-testid="input-search-products"
          />
        </div>
        <div className="flex gap-2 w-full">
          {selectedProductIds.length > 0 && (
            <Button
              onClick={handleBulkPublish}
              disabled={bulkPublishMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-[#000000] font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all hover:shadow-lg hover:shadow-primary/30"
              data-testid="button-bulk-publish"
            >
              {bulkPublishMutation.isPending ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Publishing {selectedProductIds.length}...</span>
                  <span className="sm:hidden">Publish ({selectedProductIds.length})</span>
                </>
              ) : (
                <>
                  <Layers className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Publish {selectedProductIds.length}</span>
                  <span className="sm:hidden">Publish ({selectedProductIds.length})</span>
                </>
              )}
            </Button>
          )}
          <Button
            onClick={() => syncProductsMutation.mutate()}
            disabled={syncProductsMutation.isPending}
            className="flex-1 bg-primary hover:bg-primary/90 text-[#000000] font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all hover:shadow-lg hover:shadow-primary/30"
            data-testid="button-sync-shopify"
          >
            {syncProductsMutation.isPending ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                <span className="hidden sm:inline">Syncing...</span>
                <span className="sm:hidden">Syncing...</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Sync from Shopify</span>
                <span className="sm:hidden">Sync</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <DashboardCard size="sm" className="border-slate-700/50" testId="stat-card-total">
          <div className="p-3 sm:p-4">
            <p className="text-slate-400 text-xs">Total</p>
            <p className="text-xl sm:text-2xl text-white font-bold" data-testid="stat-total-products">{products?.length || 0}</p>
          </div>
        </DashboardCard>
        <DashboardCard size="sm" className="border-slate-700/50" testId="stat-card-synced">
          <div className="p-3 sm:p-4">
            <p className="text-slate-400 text-xs">Synced</p>
            <p className="text-xl sm:text-2xl text-white font-bold" data-testid="stat-synced-products">{shopifyProducts?.length || 0}</p>
          </div>
        </DashboardCard>
        <DashboardCard size="sm" className="border-slate-700/50" testId="stat-card-ai">
          <div className="p-3 sm:p-4">
            <p className="text-slate-400 text-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              AI
            </p>
            <p className="text-xl sm:text-2xl text-white font-bold" data-testid="stat-optimized-products">{allOptimizedProducts?.length || 0}</p>
          </div>
        </DashboardCard>
      </div>

      {/* Select All */}
      {filteredPublishableProducts && filteredPublishableProducts.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedProductIds.length === filteredPublishableProducts.length}
            onCheckedChange={toggleSelectAll}
            id="select-all"
            data-testid="checkbox-select-all"
          />
          <label
            htmlFor="select-all"
            className="text-sm font-medium cursor-pointer"
          >
            Select All ({filteredPublishableProducts.length})
          </label>
        </div>
      )}

      {/* Products Grid */}
      <CardGrid>
        {filteredProducts?.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            canBeSelected={!!(product.shopifyId && product.isOptimized)}
            isSelected={selectedProductIds.includes(product.id)}
            onToggleSelection={toggleProductSelection}
            onPublishClick={handlePublishClick}
          />
        ))}
      </CardGrid>

      {filteredProducts?.length === 0 && (
        <DashboardCard testId="card-no-products">
          <div className="text-center space-y-3 py-8">
            <Package className="w-16 h-16 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">No Products Found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'Sync products from Shopify to get started'}
            </p>
          </div>
        </DashboardCard>
      )}

      {/* Publish Dialog */}
      {selectedProduct && (
        <ShopifyPublishDialog
          open={publishDialogOpen}
          onOpenChange={setPublishDialogOpen}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          content={selectedProduct.optimizedCopy || {}}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/products'] });
          }}
        />
      )}
    </PageShell>
  );
}
