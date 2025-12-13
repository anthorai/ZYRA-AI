import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationCenter from "@/components/dashboard/notification-center";
import { UnifiedHeader } from "@/components/ui/unified-header";
import { DashboardCard, MetricCard } from "@/components/ui/dashboard-card";
import { PageShell } from "@/components/ui/page-shell";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Search, 
  TrendingUp, 
  BarChart3,
  Target,
  Award,
  User, 
  LogOut, 
  Settings as SettingsIcon,
  Eye,
  RefreshCw,
  Package,
  AlertCircle
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  tags: string | null;
  price: string;
  category: string;
  isOptimized: boolean;
  createdAt: Date;
}

interface KeywordData {
  keyword: string;
  density: number;
  target: number;
  status: "optimal" | "good" | "low" | "high";
}

interface ProductAnalysis {
  id: string;
  productName: string;
  primaryKeywords: KeywordData[];
  seoScore: number;
  lastAnalyzed: string;
}

// Function to extract and analyze keywords from product text
function analyzeKeywordDensity(product: Product): ProductAnalysis {
  const combinedText = [
    product.name || '',
    product.description || '',
    product.tags || ''
  ].join(' ').toLowerCase();

  // Remove common stop words and extract meaningful words
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'your', 'our', 'their']);
  
  // Extract words and count frequency
  const words = combinedText
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Extract bigrams (two-word phrases)
  const bigrams: Record<string, number> = {};
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
      bigrams[bigram] = (bigrams[bigram] || 0) + 1;
    }
  }

  // Combine single words and bigrams
  const allKeywords = { ...wordCount, ...bigrams };
  
  // Sort by frequency and take top keywords
  const sortedKeywords = Object.entries(allKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Calculate total word count for density calculation
  const totalWords = words.length;

  // Generate keyword data with density calculations
  const primaryKeywords: KeywordData[] = sortedKeywords.slice(0, 4).map(([keyword, count]) => {
    const density = totalWords > 0 ? (count / totalWords) * 100 : 0;
    
    // Determine target density based on keyword length
    const isPhrase = keyword.includes(' ');
    const target = isPhrase ? 2.5 : 3.5;

    // Determine status based on density relative to target
    let status: "optimal" | "good" | "low" | "high";
    const ratio = density / target;
    
    if (ratio >= 0.9 && ratio <= 1.1) {
      status = "optimal";
    } else if (ratio >= 0.7 && ratio < 0.9) {
      status = "good";
    } else if (ratio > 1.1) {
      status = "high";
    } else {
      status = "low";
    }

    return {
      keyword,
      density: parseFloat(density.toFixed(1)),
      target,
      status
    };
  });

  // Calculate SEO score based on keyword optimization
  let seoScore = 0;
  primaryKeywords.forEach(kw => {
    if (kw.status === "optimal") seoScore += 25;
    else if (kw.status === "good") seoScore += 20;
    else if (kw.status === "low") seoScore += 10;
    else seoScore += 15; // high
  });

  // Add bonus points for having description and tags
  if (product.description && product.description.length > 50) seoScore += 10;
  if (product.tags && product.tags.length > 0) seoScore += 10;

  return {
    id: product.id,
    productName: product.name,
    primaryKeywords,
    seoScore: Math.min(100, seoScore),
    lastAnalyzed: new Date().toISOString().split('T')[0]
  };
}

export default function SeoKeywordDensity() {
  const { user, appUser, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch products using React Query
  const { data: products, isLoading, error, isError, refetch } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: !!user,
  });

  // Show toast notification when errors occur
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load products",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const handleLogout = () => {
    logout();
    setLocation("/auth");
  };

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: "Analysis Refreshed",
      description: "Keyword analysis has been updated with latest product data.",
    });
  };

  // Analyze products when data is available (with error guards)
  const keywordAnalysis: ProductAnalysis[] = (!isError && products)
    ? products.map(product => analyzeKeywordDensity(product))
    : [];

  // Calculate summary statistics (with error guards)
  const totalProducts = isError ? 0 : keywordAnalysis.length;
  const avgSeoScore = (isError || totalProducts === 0) ? 0
    : keywordAnalysis.reduce((sum, p) => sum + p.seoScore, 0) / totalProducts;
  const optimalKeywords = isError ? 0 : keywordAnalysis.reduce(
    (sum, p) => sum + p.primaryKeywords.filter(k => k.status === "optimal").length,
    0
  );
  const avgDensity = (isError || totalProducts === 0) ? 0
    : keywordAnalysis.reduce((sum, p) => 
        sum + p.primaryKeywords.reduce((s, k) => s + k.density, 0) / Math.max(p.primaryKeywords.length, 1),
        0
      ) / totalProducts;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal": return "bg-green-500/20 text-green-400";
      case "good": return "bg-blue-500/20 text-blue-400";
      case "low": return "bg-yellow-500/20 text-yellow-400";
      case "high": return "bg-orange-500/20 text-orange-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "optimal": return <Award className="w-4 h-4" />;
      case "good": return <TrendingUp className="w-4 h-4" />;
      case "low": return <Target className="w-4 h-4" />;
      case "high": return <BarChart3 className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  // Right actions (notification center only)
  const rightActions = (
    <NotificationCenter />
  );

  return (
    <PageShell
      title="SEO Keyword Density"
      subtitle="Keyword optimization and search ranking improvements"
      rightActions={rightActions}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <MetricCard
          icon={<Search className="w-6 h-6" />}
          title="Products Analyzed"
          value={isLoading ? "..." : totalProducts}
          testId="card-products-analyzed"
        />
        <MetricCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Avg SEO Score"
          value={isLoading ? "..." : avgSeoScore.toFixed(1)}
          testId="card-avg-seo-score"
        />
        <MetricCard
          icon={<Award className="w-6 h-6" />}
          title="Optimal Keywords"
          value={isLoading ? "..." : optimalKeywords}
          testId="card-optimal-keywords"
        />
        <MetricCard
          icon={<Target className="w-6 h-6" />}
          title="Avg Density"
          value={isLoading ? "..." : `${avgDensity.toFixed(1)}%`}
          testId="card-avg-density"
        />
      </div>

      {/* Keyword Analysis */}
      <DashboardCard
        title={
          <div className="flex items-center justify-between w-full gap-4">
            <div>
              <h3 className="text-white text-xl font-semibold">Product Keyword Analysis</h3>
              <p className="text-slate-300 text-sm mt-1">
                AI-powered keyword density analysis and SEO optimization recommendations
              </p>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading}
              className="gradient-button flex-shrink-0"
              data-testid="button-refresh-analysis"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4" data-testid="loading-state">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-800/30 rounded-lg p-4 space-y-4">
                  <Skeleton className="h-6 w-64" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-32 w-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12" data-testid="error-state">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">Failed to Load Products</h3>
              <p className="text-slate-400 mb-4">
                Unable to fetch product data. Please try again.
              </p>
              <Button onClick={() => refetch()} className="gradient-button" data-testid="button-retry">
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && keywordAnalysis.length === 0 && (
            <div className="text-center py-12" data-testid="empty-state">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">No Products Found</h3>
              <p className="text-slate-400 mb-4">
                Add products to your store to see keyword density analysis and SEO recommendations.
              </p>
              <Button onClick={() => setLocation("/products/manage")} className="gradient-button" data-testid="button-add-products">
                Add Products
              </Button>
            </div>
          )}

          {/* Products List */}
          {!isLoading && !error && keywordAnalysis.length > 0 && keywordAnalysis.map((product) => (
            <div 
              key={product.id} 
              className="bg-slate-800/30 rounded-lg p-4 space-y-4"
              data-testid={`card-product-${product.id}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg" data-testid={`text-product-name-${product.id}`}>
                    {product.productName}
                  </h3>
                  <div className="flex items-center space-x-3 mt-2">
                    <Badge 
                      variant="secondary" 
                      className={`${
                        product.seoScore >= 80 
                          ? 'bg-green-500/20 text-green-400' 
                          : product.seoScore >= 70 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                      data-testid={`badge-seo-score-${product.id}`}
                    >
                      SEO Score: {product.seoScore}
                    </Badge>
                    <span className="text-slate-400 text-sm" data-testid={`text-last-analyzed-${product.id}`}>
                      Last analyzed: {new Date(product.lastAnalyzed).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-slate-600 text-slate-300 hover:bg-white/10"
                    onClick={() => setLocation(`/products/manage`)}
                    data-testid={`button-view-${product.id}`}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {product.primaryKeywords.map((kw, index) => (
                  <div 
                    key={index} 
                    className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl bg-slate-900/50 p-3 sm:p-4 md:p-6"
                    data-testid={`card-keyword-${product.id}-${index}`}
                  >
                    <div className="flex items-center justify-between mb-2 min-w-0">
                      <span className="text-white font-medium text-base sm:text-lg md:text-xl truncate" data-testid={`text-keyword-${product.id}-${index}`}>
                        {kw.keyword}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`text-[10px] sm:text-xs flex-shrink-0 ${getStatusColor(kw.status)}`}
                        data-testid={`badge-keyword-status-${product.id}-${index}`}
                      >
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(kw.status)}
                          <span className="truncate">{kw.status}</span>
                        </div>
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] sm:text-xs md:text-sm">
                        <span className="text-slate-400 truncate">Current:</span>
                        <span className="text-white font-semibold truncate" data-testid={`text-density-current-${product.id}-${index}`}>
                          {kw.density}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] sm:text-xs md:text-sm">
                        <span className="text-slate-400 truncate">Target:</span>
                        <span className="text-slate-300 truncate" data-testid={`text-density-target-${product.id}-${index}`}>
                          {kw.target}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
    </PageShell>
  );
}
