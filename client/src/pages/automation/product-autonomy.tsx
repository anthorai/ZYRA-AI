import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Package,
  Shield,
  Zap,
  Lock,
  Unlock,
  Search,
  Filter,
  ChevronRight,
  Settings,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/ui/standardized-layout";
import { RevenueDelta } from "@/components/ui/revenue-delta";

interface ProductAutonomy {
  productId: string;
  productName: string;
  productImage?: string;
  category: string;
  seoScore?: number;
  autonomyLevel: 'full' | 'approve_only' | 'disabled';
  enabledActions: string[];
  riskTolerance: 'low' | 'medium' | 'high';
  lastOptimized?: string;
  totalRevenueLift?: number;
}

interface AutonomyStats {
  totalProducts: number;
  fullAutonomy: number;
  approveOnly: number;
  disabled: number;
}

const ACTION_TYPES = [
  { id: 'optimize_seo', label: 'SEO Optimization', description: 'Title, meta, keywords' },
  { id: 'rewrite_description', label: 'Description Rewrite', description: 'AI-powered copy' },
  { id: 'update_images', label: 'Image Alt Text', description: 'Accessibility & SEO' },
  { id: 'price_adjustment', label: 'Price Suggestions', description: 'Dynamic pricing' },
];

export default function ProductAutonomy() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [autonomyFilter, setAutonomyFilter] = useState("all");

  const { data: products, isLoading } = useQuery<ProductAutonomy[]>({
    queryKey: ['/api/product-autonomy'],
  });

  const { data: stats } = useQuery<AutonomyStats>({
    queryKey: ['/api/product-autonomy/stats'],
  });

  const { data: categories } = useQuery<string[]>({
    queryKey: ['/api/products/categories'],
  });

  const updateAutonomy = useMutation({
    mutationFn: async ({ productId, updates }: { productId: string; updates: Partial<ProductAutonomy> }) => {
      return await apiRequest('PUT', `/api/product-autonomy/${productId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-autonomy'] });
      queryClient.invalidateQueries({ queryKey: ['/api/product-autonomy/stats'] });
      toast({
        title: "Autonomy updated",
        description: "Product autonomy settings have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update autonomy settings",
        variant: "destructive",
      });
    },
  });

  const bulkUpdateAutonomy = useMutation({
    mutationFn: async ({ level, productIds }: { level: string; productIds?: string[] }) => {
      return await apiRequest('PUT', '/api/product-autonomy/bulk', { level, productIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-autonomy'] });
      queryClient.invalidateQueries({ queryKey: ['/api/product-autonomy/stats'] });
      toast({
        title: "Bulk update complete",
        description: "Product autonomy settings have been updated.",
      });
    },
  });

  const filteredProducts = (products || []).filter((p) => {
    const matchesSearch = p.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    const matchesAutonomy = autonomyFilter === "all" || p.autonomyLevel === autonomyFilter;
    return matchesSearch && matchesCategory && matchesAutonomy;
  });

  const getAutonomyBadge = (level: string) => {
    switch (level) {
      case 'full':
        return <Badge className="bg-green-500/10 text-green-500 dark:bg-green-400/10 dark:text-green-400 border-green-500/20">Full Auto</Badge>;
      case 'approve_only':
        return <Badge className="bg-yellow-500/10 text-yellow-500 dark:bg-yellow-400/10 dark:text-yellow-400 border-yellow-500/20">Approve Only</Badge>;
      case 'disabled':
        return <Badge className="bg-muted text-muted-foreground">Disabled</Badge>;
      default:
        return null;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low':
        return <Badge variant="outline" className="text-green-500 dark:text-green-400 border-green-500/30">Low Risk</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-yellow-500 dark:text-yellow-400 border-yellow-500/30">Med Risk</Badge>;
      case 'high':
        return <Badge variant="outline" className="text-orange-500 dark:text-orange-400 border-orange-500/30">High Risk</Badge>;
      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="page-title">
              <Settings className="w-6 h-6 text-primary" />
              Product Autonomy Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Control how ZYRA optimizes each product individually
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card data-testid="stat-total">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalProducts || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Products</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-full-auto">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10 dark:bg-green-400/10">
                  <Unlock className="w-5 h-5 text-green-500 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.fullAutonomy || 0}</p>
                  <p className="text-xs text-muted-foreground">Full Autonomy</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-approve-only">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-500/10 dark:bg-yellow-400/10">
                  <Shield className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.approveOnly || 0}</p>
                  <p className="text-xs text-muted-foreground">Approve Only</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-disabled">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.disabled || 0}</p>
                  <p className="text-xs text-muted-foreground">Disabled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle>Per-Product Autonomy</CardTitle>
                <CardDescription>
                  Grant or restrict ZYRA's ability to optimize each product
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkUpdateAutonomy.mutate({ level: 'approve_only' })}
                  disabled={bulkUpdateAutonomy.isPending}
                  data-testid="button-bulk-approve-only"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  All to Approve Only
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkUpdateAutonomy.mutate({ level: 'full' })}
                  disabled={bulkUpdateAutonomy.isPending}
                  data-testid="button-bulk-full-auto"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  All to Full Auto
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(categories || []).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={autonomyFilter} onValueChange={setAutonomyFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-autonomy">
                  <SelectValue placeholder="Autonomy Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="full">Full Auto</SelectItem>
                  <SelectItem value="approve_only">Approve Only</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No products found</p>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div 
                      key={product.productId} 
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 dark:bg-muted/20 hover-elevate"
                      data-testid={`product-row-${product.productId}`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {product.productImage ? (
                          <img 
                            src={product.productImage} 
                            alt={product.productName}
                            className="w-12 h-12 rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{product.productName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{product.category}</Badge>
                            {product.seoScore !== undefined && (
                              <span className="text-xs text-muted-foreground">SEO: {product.seoScore}/100</span>
                            )}
                            {product.totalRevenueLift !== undefined && product.totalRevenueLift !== 0 && (
                              <RevenueDelta 
                                value={product.totalRevenueLift} 
                                size="sm"
                                showSign={true}
                                data-testid={`revenue-delta-${product.productId}`}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {getAutonomyBadge(product.autonomyLevel)}
                        {getRiskBadge(product.riskTolerance)}
                        
                        <Select
                          value={product.autonomyLevel}
                          onValueChange={(value) => updateAutonomy.mutate({ 
                            productId: product.productId, 
                            updates: { autonomyLevel: value as 'full' | 'approve_only' | 'disabled' } 
                          })}
                        >
                          <SelectTrigger className="w-[140px]" data-testid={`select-autonomy-${product.productId}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">
                              <span className="flex items-center gap-2">
                                <Zap className="w-3 h-3" /> Full Auto
                              </span>
                            </SelectItem>
                            <SelectItem value="approve_only">
                              <span className="flex items-center gap-2">
                                <Shield className="w-3 h-3" /> Approve Only
                              </span>
                            </SelectItem>
                            <SelectItem value="disabled">
                              <span className="flex items-center gap-2">
                                <Lock className="w-3 h-3" /> Disabled
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card data-testid="autonomy-explanation">
          <CardContent className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="p-3 rounded-full bg-green-500/10 dark:bg-green-400/10 w-fit mx-auto mb-3">
                  <Zap className="w-6 h-6 text-green-500 dark:text-green-400" />
                </div>
                <h3 className="font-medium mb-1">Full Autonomy</h3>
                <p className="text-sm text-muted-foreground">
                  ZYRA optimizes automatically without approval. Best for trusted, high-performing products.
                </p>
              </div>
              <div className="text-center p-4">
                <div className="p-3 rounded-full bg-yellow-500/10 dark:bg-yellow-400/10 w-fit mx-auto mb-3">
                  <Shield className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                </div>
                <h3 className="font-medium mb-1">Approve Only</h3>
                <p className="text-sm text-muted-foreground">
                  ZYRA suggests optimizations but waits for your approval. Default for new products.
                </p>
              </div>
              <div className="text-center p-4">
                <div className="p-3 rounded-full bg-muted w-fit mx-auto mb-3">
                  <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">Disabled</h3>
                <p className="text-sm text-muted-foreground">
                  ZYRA will not touch this product. Use for products with custom copy or special requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
