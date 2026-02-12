/**
 * Product Intelligence Tab
 * 
 * Embedded version of Product Intelligence for use in dashboard tabs.
 * This is NOT a product editor - merchants view intelligence, control autonomy,
 * but cannot manually edit products.
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, RefreshCw, Store, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product, StoreConnection } from "@shared/schema";
import { PageContainer } from "@/components/ui/standardized-layout";
import { ProductIntelligenceCard, ProductIntelligenceCardSkeleton } from "@/components/products/ProductIntelligenceCard";
import { ProductDetailModal } from "@/components/products/ProductDetailModal";
import { ProductIntelligenceSummaryBar } from "@/components/products/ProductIntelligenceSummary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { DashboardCard } from "@/components/ui/dashboard-card";

function ProductIntelligenceGrid({ 
  products, 
  isLoading, 
  onProductClick 
}: { 
  products: Product[]; 
  isLoading: boolean; 
  onProductClick: (product: Product) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductIntelligenceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No products synced yet</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Connect your Shopify store to sync products
        </p>
        <p className="text-xs text-muted-foreground">
          Once synced, ZYRA will analyze and optimize each product automatically
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductIntelligenceCard 
          key={product.id} 
          product={product}
          onClick={() => onProductClick(product)}
        />
      ))}
    </div>
  );
}

export function ProductIntelligenceTab() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Check for connected stores
  const { data: storeConnections = [], isLoading: storesLoading } = useQuery<StoreConnection[]>({
    queryKey: ['/api/store-connections'],
  });

  const activeStores = storeConnections
    .filter(store => store.platform === 'shopify' && store.status === 'active')
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const connectedStore = activeStores[0];
  const hasConnectedStore = !!connectedStore;

  const { data: allProducts = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: hasConnectedStore,
  });

  const products = allProducts;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await apiRequest("POST", "/api/shopify/sync");
      await queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/products/intelligence/summary'] });
      toast({
        title: "Products synced",
        description: "ZYRA is now analyzing your product catalog.",
      });
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message || "Could not sync products from Shopify.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectStore = () => {
    setLocation('/settings/integrations');
  };

  const userPlan = (user as any)?.plan || 'trial';
  const isLoading = storesLoading || (hasConnectedStore && productsLoading);

  // Show connect store message if no store is connected
  if (!storesLoading && !hasConnectedStore) {
    return (
      <TooltipProvider>
        <PageContainer>
          <DashboardCard className="text-center py-12">
            <Store className="w-16 h-16 mx-auto text-primary mb-6" />
            <h3 className="text-xl font-semibold mb-3 text-foreground">Connect Your Store</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Connect your Shopify store to unlock Product Intelligence. ZYRA will automatically analyze, monitor, and optimize your products for maximum revenue.
            </p>
            <Button 
              onClick={handleConnectStore}
              className="gradient-button"
              data-testid="button-connect-store"
            >
              Connect Shopify Store
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DashboardCard>
        </PageContainer>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageContainer>
          <div className="flex items-center justify-between mb-6">
            {/* Show connected store info */}
            {connectedStore && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Store className="w-4 h-4 text-primary" />
                <span>Connected: <span className="text-foreground font-medium">{connectedStore.storeName}</span></span>
              </div>
            )}
            <Button 
              onClick={handleSync}
              disabled={isSyncing}
              className="flex-shrink-0 bg-slate-700 text-white border border-slate-600"
              data-testid="button-sync-products"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Products'}
            </Button>
          </div>

          <div className="space-y-6">
            <ProductIntelligenceSummaryBar />
            
            <ProductIntelligenceGrid 
              products={products} 
              isLoading={isLoading}
              onProductClick={setSelectedProduct}
            />
          </div>
        </PageContainer>

        <ProductDetailModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          userPlan={userPlan}
        />
      </div>
    </TooltipProvider>
  );
}
