/**
 * Product Intelligence Tab
 * 
 * Embedded version of Product Intelligence for use in dashboard tabs.
 * This is NOT a product editor - merchants view intelligence, control autonomy,
 * but cannot manually edit products.
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import { PageContainer } from "@/components/ui/standardized-layout";
import { ProductIntelligenceCard, ProductIntelligenceCardSkeleton } from "@/components/products/ProductIntelligenceCard";
import { ProductDetailModal } from "@/components/products/ProductDetailModal";
import { ProductIntelligenceSummaryBar } from "@/components/products/ProductIntelligenceSummary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

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

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await apiRequest("POST", "/api/shopify/sync-products");
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

  const userPlan = (user as any)?.plan || 'trial';

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageContainer>
          <div className="flex items-center justify-end mb-6">
            <Button 
              onClick={handleSync}
              disabled={isSyncing}
              variant="outline"
              className="flex-shrink-0"
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
