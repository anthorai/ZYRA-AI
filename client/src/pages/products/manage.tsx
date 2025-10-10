import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ShopifyPublishDialog } from '@/components/shopify/publish-dialog';
import { PublishContent, useShopifyBulkPublish } from '@/hooks/use-shopify-publish';
import { ProductSyncStatus } from '@/components/products/product-sync-status';
import { useProductRealtime } from '@/hooks/use-product-realtime';
import {
  Package,
  Search,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
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
    const publishableProducts = filteredProducts?.filter(
      (p) => p.shopifyId && p.optimizedCopy
    );
    
    if (selectedProductIds.length === publishableProducts?.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(publishableProducts?.map((p) => p.id) || []);
    }
  };

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const shopifyProducts = filteredProducts?.filter((p) => p.shopifyId);
  const optimizedProducts = shopifyProducts?.filter((p) => p.isOptimized);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8" />
            Manage Products
          </h1>
          <p className="text-muted-foreground mt-1">
            Sync products from Shopify and publish AI-generated content
          </p>
        </div>
        <div className="flex gap-2">
          {selectedProductIds.length > 0 && (
            <Button
              onClick={handleBulkPublish}
              disabled={bulkPublishMutation.isPending}
              className="gap-2"
              variant="default"
            >
              {bulkPublishMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing {selectedProductIds.length}...
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  Publish {selectedProductIds.length} to Shopify
                </>
              )}
            </Button>
          )}
          <Button
            onClick={() => syncProductsMutation.mutate()}
            disabled={syncProductsMutation.isPending}
            className="gap-2"
            variant="outline"
          >
            {syncProductsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                Sync from Shopify
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sync Status Widget */}
      <ProductSyncStatus 
        variant="full" 
        onSyncClick={() => syncProductsMutation.mutate()} 
        isSyncing={syncProductsMutation.isPending}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Products</CardDescription>
            <CardTitle className="text-3xl">{products?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Synced with Shopify</CardDescription>
            <CardTitle className="text-3xl">{shopifyProducts?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>AI Optimized</CardDescription>
            <CardTitle className="text-3xl">{optimizedProducts?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Bulk Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {optimizedProducts && optimizedProducts.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedProductIds.length === optimizedProducts.length}
              onCheckedChange={toggleSelectAll}
              id="select-all"
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer"
            >
              Select All ({optimizedProducts.length})
            </label>
          </div>
        )}
      </div>

      {/* Products List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts?.map((product) => {
          const canBeSelected = product.shopifyId && product.isOptimized;
          const isSelected = selectedProductIds.includes(product.id);
          
          return (
          <Card key={product.id} className="overflow-hidden relative">
            {canBeSelected && (
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleProductSelection(product.id)}
                  className="bg-white"
                />
              </div>
            )}
            <div className="aspect-video bg-muted relative">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              {product.isOptimized && (
                <Badge className="absolute top-2 right-2 bg-green-500 gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Optimized
                </Badge>
              )}
            </div>
            <CardHeader>
              <CardTitle className="line-clamp-1">{product.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {product.description || 'No description'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="outline">{product.category}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold">${product.price}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shopify Status</span>
                {product.shopifyId ? (
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    Synced
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <AlertCircle className="w-3 h-3 text-yellow-600" />
                    Not Synced
                  </Badge>
                )}
              </div>

              <div className="pt-2 space-y-2">
                {product.shopifyId && product.isOptimized ? (
                  <Button
                    onClick={() => handlePublishClick(product)}
                    className="w-full gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Publish to Shopify
                  </Button>
                ) : product.shopifyId ? (
                  <Button variant="outline" className="w-full gap-2" asChild>
                    <a href={`/ai-tools/professional-copywriting?productId=${product.id}`}>
                      <Sparkles className="w-4 h-4" />
                      Generate AI Content
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Sync with Shopify First
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {filteredProducts?.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <Package className="w-16 h-16 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">No Products Found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'Sync products from Shopify to get started'}
            </p>
          </div>
        </Card>
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
    </div>
  );
}
