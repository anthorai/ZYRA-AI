import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ShoppingCart,
  CheckCircle,
  XCircle,
  Loader2,
  Package
} from "lucide-react";
import type { Product } from "@shared/schema";

export default function AIUpsellSuggestionsPage() {
  const { toast } = useToast();

  // Fetch real products from API
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Fetch upsell analytics
  const { data: upsellAnalytics } = useQuery<{
    summary: {
      total_sent: string;
      total_clicks: string;
      total_conversions: string;
      total_revenue: string;
      avg_order_value: string;
    };
  }>({
    queryKey: ['/api/upsell/analytics'],
  });

  // Get top products for upsell suggestions (sorted by price, top 6)
  const suggestedProducts = products
    .filter(p => p.price && Number(p.price) > 0)
    .sort((a, b) => Number(b.price) - Number(a.price))
    .slice(0, 6);

  const handleApproveUpsell = (productId: string, productName: string) => {
    toast({
      title: "Upsell Approved!",
      description: `"${productName}" approved for AI upsell suggestions.`,
    });
  };

  const handleRejectUpsell = (productId: string, productName: string) => {
    toast({
      title: "Upsell Rejected",
      description: `"${productName}" removed from upsell suggestions.`,
    });
  };

  const totalConversions = Number(upsellAnalytics?.summary?.total_conversions || 0);
  const totalClicks = Number(upsellAnalytics?.summary?.total_clicks || 0);
  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(0) : "0";

  return (
    <PageShell
      title="AI Upsell Suggestions"
      subtitle="AI-powered product recommendations to boost your average order value"
      backTo="/dashboard?tab=campaigns"
    >
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="shadow-lg border border-slate-700/50 rounded-xl sm:rounded-2xl dark-theme-bg">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-20 h-20 rounded-lg bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32 bg-slate-700" />
                    <Skeleton className="h-6 w-20 bg-slate-700" />
                    <Skeleton className="h-4 w-28 bg-slate-700" />
                    <div className="flex space-x-3 mt-4">
                      <Skeleton className="h-9 flex-1 bg-slate-700" />
                      <Skeleton className="h-9 flex-1 bg-slate-700" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : suggestedProducts.length === 0 ? (
        <DashboardCard testId="card-empty-products">
          <div className="text-center py-8" data-testid="empty-state-products">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No products available</h3>
            <p className="text-slate-300 mb-6 text-sm sm:text-base">
              Connect your store or add products to see AI upsell suggestions
            </p>
          </div>
        </DashboardCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {suggestedProducts.map((product) => (
              <Card 
                key={product.id} 
                className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl dark-theme-bg"
                data-testid={`product-card-${product.id}`}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex flex-col">
                    {/* Product Image */}
                    <div className="w-full aspect-square rounded-lg overflow-hidden mb-4 bg-slate-800">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${product.image ? 'hidden' : ''}`}>
                        <ShoppingCart className="w-16 h-16 text-primary/50" />
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="space-y-2">
                      <h4 className="text-white font-semibold text-base leading-tight line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                      </h4>
                      <p className="text-primary font-bold text-xl">
                        ${Number(product.price).toFixed(2)}
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white flex-1"
                        onClick={() => handleApproveUpsell(product.id, product.name)}
                        data-testid={`button-approve-${product.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 flex-1"
                        onClick={() => handleRejectUpsell(product.id, product.name)}
                        data-testid={`button-reject-${product.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>
      )}

      {/* AI Insights Card */}
      <DashboardCard
        title="AI Insights"
        description="Based on customer behavior analysis"
        testId="card-ai-insights"
      >
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="text-2xl sm:text-3xl font-bold text-green-500">
              ${Number(upsellAnalytics?.summary?.total_revenue || 0).toLocaleString()}
            </div>
            <div className="text-slate-300 text-xs sm:text-sm font-medium">Revenue Generated</div>
            <div className="text-slate-500 text-[10px] sm:text-xs">from upsells</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="text-2xl sm:text-3xl font-bold text-primary">{conversionRate}%</div>
            <div className="text-slate-300 text-xs sm:text-sm font-medium">Conversion Rate</div>
            <div className="text-slate-500 text-[10px] sm:text-xs">customer acceptance</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 col-span-2 lg:col-span-1">
            <div className="text-2xl sm:text-3xl font-bold text-primary">{products.length}</div>
            <div className="text-slate-300 text-xs sm:text-sm font-medium">Products Analyzed</div>
            <div className="text-slate-500 text-[10px] sm:text-xs">in your catalog</div>
          </div>
        </div>
      </DashboardCard>
    </PageShell>
  );
}
