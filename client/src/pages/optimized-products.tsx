import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardCard, MetricCard } from "@/components/ui/dashboard-card";
import { PageShell } from "@/components/ui/page-shell";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { products } from "@shared/schema";
import { 
  ShoppingBag, 
  TrendingUp, 
  Calendar,
  Eye,
  Edit,
  AlertCircle,
  RefreshCw
} from "lucide-react";

type Product = typeof products.$inferSelect;

// Helper function to strip HTML tags from text
function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export default function OptimizedProducts() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch optimized products from API
  const { data: products = [], isLoading, error, isError } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: !!user,
  });

  // Filter only optimized products
  const optimizedProducts = isError ? [] : products.filter((p) => p.isOptimized === true);

  // Calculate statistics (guarded against errors)
  const totalOptimized = isError ? 0 : optimizedProducts.length;
  
  // Calculate products optimized this week (guarded against errors)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const optimizedThisWeek = isError ? 0 : optimizedProducts.filter((p: any) => {
    const updatedDate = new Date(p.updatedAt);
    return updatedDate >= oneWeekAgo;
  }).length;

  // Show toast notification on error
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load products",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  // Error state
  if (isError) {
    return (
      <PageShell
        title="Optimized Products"
        subtitle="AI-enhanced product descriptions and SEO optimization"
      >
        <DashboardCard testId="error-state">
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">Failed to Load Products</h3>
            <p className="text-slate-300 mb-6">
              We couldn't load your optimized products. Please try again.
            </p>
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/products'] })}
              className="gradient-button"
              data-testid="button-retry"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </DashboardCard>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Optimized Products"
      subtitle="AI-enhanced product descriptions and SEO optimization"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <MetricCard
          icon={<ShoppingBag className="w-6 h-6" />}
          title="Total Optimized"
          value={isLoading ? "..." : totalOptimized}
          testId="card-total-optimized"
        />
        <MetricCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Total Products"
          value={isLoading ? "..." : products.length}
          testId="card-total-products"
        />
        <MetricCard
          icon={<Calendar className="w-6 h-6" />}
          title="This Week"
          value={isLoading ? "..." : optimizedThisWeek}
          testId="card-this-week"
        />
      </div>

      {/* Products List */}
      <DashboardCard
        title="Recently Optimized Products"
        description="Products enhanced with AI-generated descriptions and SEO optimization"
      >
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">
              Loading optimized products...
            </div>
          ) : optimizedProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No optimized products yet. Start optimizing your products to see them here.
            </div>
          ) : (
            optimizedProducts.map((product: any) => {
              const optimizedCopy = product.optimizedCopy as any;
              const optimizedDescription = optimizedCopy?.description || product.description;
              const originalDesc = product.originalDescription || product.description;
              
              return (
                <div key={product.id} className="bg-slate-800/30 rounded-lg p-4 space-y-4" data-testid={`card-product-${product.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-lg" data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                          Optimized
                        </Badge>
                        <span className="text-slate-400 text-sm">
                          {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-slate-600 text-slate-300 hover:bg-white/10"
                        onClick={() => setLocation(`/products/${product.id}`)}
                        data-testid={`button-view-${product.id}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        className="gradient-button"
                        onClick={() => setLocation(`/products/${product.id}`)}
                        data-testid={`button-edit-${product.id}`}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-slate-300 font-medium mb-2">Original Description</h4>
                      <p className="text-slate-400 text-sm bg-slate-900/50 p-3 rounded">
                        {stripHtmlTags(originalDesc) || 'No original description'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-slate-300 font-medium mb-2">AI-Optimized Description</h4>
                      <p className="text-slate-300 text-sm bg-slate-800/50 p-3 rounded border border-primary/20">
                        {stripHtmlTags(optimizedDescription) || 'No optimized description'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DashboardCard>
    </PageShell>
  );
}
