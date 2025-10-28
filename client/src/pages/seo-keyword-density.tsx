import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationCenter from "@/components/dashboard/notification-center";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
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

  const handleGoBack = () => {
    window.history.back();
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

  return (
    <div className="min-h-screen dark-theme-bg">
      {/* Header */}
      <header className="dark-theme-bg backdrop-blur-sm border-b border-border/50 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl">
        <div className="flex items-center">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl truncate">
                SEO Keyword Density
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Keyword optimization and search ranking improvements
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
            <NotificationCenter />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full text-slate-200 hover:text-primary transition-all duration-300 ease-in-out"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={appUser?.fullName || "User"} />
                    <AvatarFallback className="dark-theme-bg text-primary">
                      {appUser?.fullName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 gradient-surface text-white" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-bold text-white text-sm">{appUser?.fullName || "User"}</p>
                    <p className="text-xs text-slate-300">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-slate-700/30" />
                <DropdownMenuItem
                  className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer"
                  onClick={() => setLocation("/profile")}
                  data-testid="menu-profile"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer"
                  onClick={() => setLocation("/billing")}
                  data-testid="menu-settings"
                >
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700/30" />
                <DropdownMenuItem
                  className="text-red-300 hover:text-red-200 hover:bg-red-500/20 focus:text-red-200 focus:bg-red-500/20 cursor-pointer"
                  onClick={handleLogout}
                  data-testid="menu-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0">
                <div className="p-2 sm:p-2.5 md:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mb-1" />
                  ) : (
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate" data-testid="text-products-analyzed">
                      {totalProducts}
                    </h3>
                  )}
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Products Analyzed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0">
                <div className="p-2 sm:p-2.5 md:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mb-1" />
                  ) : (
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate" data-testid="text-avg-seo-score">
                      {avgSeoScore.toFixed(1)}
                    </h3>
                  )}
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Avg SEO Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0">
                <div className="p-2 sm:p-2.5 md:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mb-1" />
                  ) : (
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate" data-testid="text-optimal-keywords">
                      {optimalKeywords}
                    </h3>
                  )}
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Optimal Keywords</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0">
                <div className="p-2 sm:p-2.5 md:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mb-1" />
                  ) : (
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate" data-testid="text-avg-density">
                      {avgDensity.toFixed(1)}%
                    </h3>
                  )}
                  <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Avg Density</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Keyword Analysis */}
        <Card className="dark-theme-bg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Product Keyword Analysis</CardTitle>
                <CardDescription className="text-slate-300">
                  AI-powered keyword density analysis and SEO optimization recommendations
                </CardDescription>
              </div>
              <Button 
                onClick={handleRefresh} 
                disabled={isLoading}
                className="gradient-button"
                data-testid="button-refresh-analysis"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
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
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              kw.status === 'optimal' ? 'bg-green-500' :
                              kw.status === 'good' ? 'bg-blue-500' :
                              kw.status === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${Math.min((kw.density / kw.target) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
