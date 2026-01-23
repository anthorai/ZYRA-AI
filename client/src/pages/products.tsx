/**
 * Product Revenue Intelligence & Control System
 * 
 * This is NOT a product editor - merchants must NOT manually edit products.
 * Product Management is for supervision, trust, and revenue visibility.
 * Every product shows how ZYRA is protecting, optimizing, and contributing revenue.
 * 
 * Removing ZYRA must feel like losing product-level intelligence forever.
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Menu, ShoppingBag, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import Sidebar from "@/components/dashboard/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { PageContainer } from "@/components/ui/standardized-layout";
import { GradientPageHeader } from "@/components/ui/page-hero";
import { ProductIntelligenceCard, ProductIntelligenceCardSkeleton } from "@/components/products/ProductIntelligenceCard";
import { ProductDetailModal } from "@/components/products/ProductDetailModal";
import { ProductIntelligenceSummaryBar } from "@/components/products/ProductIntelligenceSummary";
import { TooltipProvider } from "@/components/ui/tooltip";

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

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      <div className="min-h-screen flex">
        <Sidebar 
          activeTab="products" 
          onTabChange={() => {}} 
          user={user} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-64' : 'ml-0'
        }`}>
          <header className="gradient-surface border-b border px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="flex-shrink-0"
                  data-testid="button-toggle-sidebar"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">Product Intelligence</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Revenue protection and optimization by ZYRA
                  </p>
                </div>
              </div>
              
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
          </header>

          <div className="flex-1 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <PageContainer>
                <GradientPageHeader
                  icon={<ShoppingBag className="w-8 h-8 text-primary" />}
                  title="Product Revenue Intelligence"
                  subtitle="ZYRA is protecting, monitoring, and optimizing your products. View revenue health, confidence scores, and action history."
                />

                <div className="space-y-6">
                  <ProductIntelligenceSummaryBar />
                  
                  <ProductIntelligenceGrid 
                    products={products} 
                    isLoading={isLoading}
                    onProductClick={setSelectedProduct}
                  />
                </div>
              </PageContainer>
            </div>
          </div>
        </div>

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
