import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/ui/page-shell";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import type { products } from "@shared/schema";
import { 
  ShoppingBag, 
  TrendingUp, 
  Calendar,
  Eye,
  Edit,
  AlertCircle,
  RefreshCw,
  Sparkles,
  FileText,
  Heading,
  DollarSign,
  Tag,
  AlertTriangle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

type Product = typeof products.$inferSelect;

interface AISuggestion {
  type: 'description' | 'title' | 'pricing' | 'tags';
  severity: 'info' | 'warning' | 'success';
  message: string;
  reason: string;
}

// Helper function to strip HTML tags from text
function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// AI-powered suggestion analyzer
function analyzeProduct(product: any): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const optimizedCopy = product.optimizedCopy as any;
  
  // Description Analysis
  const originalDesc = stripHtmlTags(product.originalDescription || product.description || '');
  const optimizedDesc = stripHtmlTags(optimizedCopy?.description || product.description || '');
  
  if (originalDesc.length < 100 && optimizedDesc.length < 100) {
    suggestions.push({
      type: 'description',
      severity: 'warning',
      message: 'Description is too short',
      reason: 'Product descriptions under 100 characters may hurt SEO and conversions. Consider expanding to 150-300 words.'
    });
  } else if (optimizedDesc.length > originalDesc.length * 1.3) {
    suggestions.push({
      type: 'description',
      severity: 'success',
      message: 'Description significantly improved',
      reason: `AI expanded description by ${Math.round(((optimizedDesc.length - originalDesc.length) / originalDesc.length) * 100)}%, adding valuable product details.`
    });
  }
  
  // Title Analysis
  const originalTitle = product.name || '';
  const optimizedTitle = optimizedCopy?.title || optimizedCopy?.productName || '';
  
  if (optimizedTitle && optimizedTitle !== originalTitle) {
    if (optimizedTitle.length > originalTitle.length) {
      suggestions.push({
        type: 'title',
        severity: 'success',
        message: 'Title optimized for better SEO',
        reason: 'AI enhanced title with keywords and descriptive terms for better search visibility.'
      });
    }
  } else if (originalTitle.length < 30) {
    suggestions.push({
      type: 'title',
      severity: 'info',
      message: 'Title could be more descriptive',
      reason: 'Titles between 50-70 characters tend to perform better in search results.'
    });
  }
  
  // Pricing Analysis
  const price = parseFloat(product.price?.toString() || '0');
  if (price === 0) {
    suggestions.push({
      type: 'pricing',
      severity: 'warning',
      message: 'Price not set',
      reason: 'Products without prices cannot be sold. Set a competitive price based on market research.'
    });
  } else if (!product.tags || product.tags.length === 0) {
    suggestions.push({
      type: 'pricing',
      severity: 'info',
      message: 'Add tags for better categorization',
      reason: 'Product tags help with internal search and customer discovery.'
    });
  }
  
  // Tags Analysis
  const productTags = optimizedCopy?.keywords || product.tags || '';
  const tagCount = productTags ? productTags.split(',').filter((t: string) => t.trim()).length : 0;
  
  if (tagCount === 0) {
    suggestions.push({
      type: 'tags',
      severity: 'warning',
      message: 'No product tags found',
      reason: 'Product tags help with search visibility, categorization, and customer discovery.'
    });
  } else if (tagCount < 5) {
    suggestions.push({
      type: 'tags',
      severity: 'info',
      message: 'Consider adding more tags',
      reason: `Currently have ${tagCount} tags. Optimal is 5-10 tags for better discoverability.`
    });
  } else if (tagCount >= 5) {
    suggestions.push({
      type: 'tags',
      severity: 'success',
      message: 'Tags well optimized',
      reason: `Product has ${tagCount} tags for excellent search visibility and categorization.`
    });
  }
  
  return suggestions;
}

function SuggestionCard({ suggestions, activeTab }: { suggestions: AISuggestion[], activeTab: string }) {
  const filteredSuggestions = suggestions.filter(s => s.type === activeTab);
  
  if (filteredSuggestions.length === 0) return null;
  
  return (
    <div className="space-y-2">
      {filteredSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className={`p-3 rounded-lg border ${
            suggestion.severity === 'warning'
              ? 'bg-yellow-500/10 border-yellow-500/30'
              : suggestion.severity === 'success'
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-blue-500/10 border-blue-500/30'
          }`}
          data-testid={`suggestion-${suggestion.type}-${index}`}
        >
          <div className="flex items-start gap-2">
            {suggestion.severity === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            ) : suggestion.severity === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm ${
                suggestion.severity === 'warning'
                  ? 'text-yellow-300'
                  : suggestion.severity === 'success'
                  ? 'text-green-300'
                  : 'text-blue-300'
              }`}>
                {suggestion.message}
              </p>
              <p className="text-slate-400 text-xs mt-1">{suggestion.reason}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductCard({ product, currency }: { product: Product, currency: string }) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('description');
  const optimizedCopy = product.optimizedCopy as any;
  const originalCopy = product.originalCopy as any;
  
  // Extract data - use originalCopy for pre-optimization content, optimizedCopy for AI-enhanced content
  // originalCopy is saved when content is first published to Shopify (contains the original state)
  const originalDesc = stripHtmlTags(originalCopy?.description || product.originalDescription || '');
  const optimizedDesc = stripHtmlTags(optimizedCopy?.description || '');
  const originalTitle = originalCopy?.seoTitle || product.name || '';
  const optimizedTitle = optimizedCopy?.title || optimizedCopy?.productName || '';
  const keywords = optimizedCopy?.keywords || '';
  
  // Get AI suggestions
  const suggestions = analyzeProduct(product);
  
  return (
    <Card className="gradient-card rounded-xl shadow-lg border border-slate-700/50" data-testid={`card-product-${product.id}`}>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Optimized
              </Badge>
              <span className="text-slate-400 text-sm">
                {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                }) : 'Recently'}
              </span>
            </div>
            <h3 className="text-white font-bold text-xl mb-1 break-words" data-testid={`text-product-name-${product.id}`}>
              {product.name}
            </h3>
            {product.category && (
              <p className="text-slate-400 text-sm">{product.category}</p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button 
              size="sm" 
              variant="outline" 
              className="border-slate-600 text-slate-300"
              onClick={() => setLocation(`/products/${product.id}`)}
              data-testid={`button-view-${product.id}`}
            >
              <Eye className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">View</span>
            </Button>
            <Button 
              size="sm" 
              className="bg-primary text-primary-foreground"
              onClick={() => setLocation(`/products/${product.id}`)}
              data-testid={`button-edit-${product.id}`}
            >
              <Edit className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 mb-4">
            <TabsTrigger value="description" className="text-xs sm:text-sm" data-testid={`tab-description-${product.id}`}>
              <FileText className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Description</span>
              <span className="sm:hidden">Desc</span>
            </TabsTrigger>
            <TabsTrigger value="title" className="text-xs sm:text-sm" data-testid={`tab-title-${product.id}`}>
              <Heading className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Title</span>
              <span className="sm:hidden">Title</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs sm:text-sm" data-testid={`tab-pricing-${product.id}`}>
              <DollarSign className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Pricing</span>
              <span className="sm:hidden">Price</span>
            </TabsTrigger>
            <TabsTrigger value="tags" className="text-xs sm:text-sm" data-testid={`tab-tags-${product.id}`}>
              <Tag className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Tags</span>
              <span className="sm:hidden">Tags</span>
            </TabsTrigger>
          </TabsList>

          {/* Description Tab */}
          <TabsContent value="description" className="space-y-4" data-testid={`content-description-${product.id}`}>
            <SuggestionCard suggestions={suggestions} activeTab="description" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-slate-300 font-medium text-sm">Original Description</h4>
                  <Badge variant="outline" className="text-xs">{originalDesc.length} chars</Badge>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 min-h-[120px]">
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {originalDesc || 'Original description not captured (product was optimized before backup was implemented)'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-slate-300 font-medium text-sm">AI-Optimized Description</h4>
                    <Sparkles className="w-3 h-3 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">{optimizedDesc.length} chars</Badge>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-primary/20 min-h-[120px]">
                  <p className="text-slate-200 text-sm leading-relaxed">
                    {optimizedDesc || 'No AI-optimized description generated yet'}
                  </p>
                </div>
              </div>
            </div>
            
            {optimizedDesc && originalDesc && optimizedDesc.length > originalDesc.length && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>+{optimizedDesc.length - originalDesc.length} characters added by AI</span>
              </div>
            )}
          </TabsContent>

          {/* Title Tab */}
          <TabsContent value="title" className="space-y-4" data-testid={`content-title-${product.id}`}>
            <SuggestionCard suggestions={suggestions} activeTab="title" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-slate-300 font-medium text-sm">Original Title</h4>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                  <p className="text-slate-400 text-base font-medium">
                    {originalTitle || product.name || 'No original title'}
                  </p>
                  <p className="text-slate-500 text-xs mt-2">{(originalTitle || product.name || '').length} characters</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-slate-300 font-medium text-sm">AI-Optimized Title</h4>
                  {optimizedTitle && <Sparkles className="w-3 h-3 text-primary" />}
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-primary/20">
                  <p className="text-slate-200 text-base font-medium">
                    {optimizedTitle || 'No AI-optimized title generated yet'}
                  </p>
                  <p className="text-slate-400 text-xs mt-2">{optimizedTitle ? optimizedTitle.length : 0} characters</p>
                </div>
              </div>
            </div>
            
            {optimizedTitle && originalTitle && optimizedTitle !== originalTitle && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <ArrowRight className="w-4 h-4" />
                <span>Title enhanced for better SEO and clarity</span>
              </div>
            )}
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-4" data-testid={`content-pricing-${product.id}`}>
            <SuggestionCard suggestions={suggestions} activeTab="pricing" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardDescription className="text-slate-400 text-xs">Current Price</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-white text-2xl font-bold">
                    {formatCurrency(parseFloat(product.price?.toString() || '0'), currency)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardDescription className="text-slate-400 text-xs">Stock Level</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${
                    (product.stock || 0) > 10 ? 'text-green-400' : 
                    (product.stock || 0) > 0 ? 'text-yellow-400' : 
                    'text-red-400'
                  }`}>
                    {product.stock || 0}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardDescription className="text-slate-400 text-xs">Category</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-white text-base font-medium truncate">
                    {product.category || 'Uncategorized'}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {product.tags && (
              <div className="space-y-2">
                <h4 className="text-slate-300 font-medium text-sm">Product Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {product.tags.split(',').map((tag: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="bg-slate-800/50 border-slate-600">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="space-y-4" data-testid={`content-tags-${product.id}`}>
            <SuggestionCard suggestions={suggestions} activeTab="tags" />
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-slate-300 font-medium text-sm">Product Tags</h4>
                    {keywords && <Sparkles className="w-3 h-3 text-primary" />}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {keywords ? keywords.split(',').filter((t: string) => t.trim()).length : 0} tags
                  </Badge>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-primary/20 min-h-[100px]">
                  {keywords ? (
                    <div className="flex flex-wrap gap-2">
                      {keywords.split(',').map((tag: string, idx: number) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="bg-primary/20 text-primary border-primary/30"
                        >
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No tags generated yet</p>
                  )}
                </div>
                <p className="text-slate-500 text-xs">
                  Optimal: 5-10 tags for better search visibility and categorization
                </p>
              </div>
              
              {product.tags && product.tags !== keywords && (
                <div className="space-y-2">
                  <h4 className="text-slate-300 font-medium text-sm">Original Shopify Tags</h4>
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                    <div className="flex flex-wrap gap-2">
                      {product.tags.split(',').map((tag: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="bg-slate-800/50 border-slate-600">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {keywords && keywords.split(',').filter((t: string) => t.trim()).length >= 5 && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tags optimized for search visibility and Shopify integration</span>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function OptimizedProducts() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch store currency
  const { data: storeData } = useQuery<{ currency: string }>({
    queryKey: ['/api/store/currency'],
    enabled: !!user,
  });
  const currency = storeData?.currency || 'USD';

  // Fetch optimized products from API
  const { data: products = [], isLoading, error, isError, refetch } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: !!user,
  });

  // Filter only optimized products
  const optimizedProducts = isError ? [] : products.filter((p) => p.isOptimized === true);

  // Calculate statistics
  const totalOptimized = isError ? 0 : optimizedProducts.length;
  
  // Calculate products optimized this week
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
        title="AI-Optimized Products"
        subtitle="Products enhanced with AI-powered descriptions, titles, and SEO"
      >
        <Card className="gradient-card border-red-500/30">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">Failed to Load Products</h3>
            <p className="text-slate-300 mb-6">
              We couldn't load your optimized products. Please try again.
            </p>
            <Button
              onClick={() => refetch()}
              className="bg-primary text-primary-foreground"
              data-testid="button-retry"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="AI-Optimized Products"
      subtitle="Products enhanced with AI-powered descriptions, titles, and SEO optimization"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="gradient-card border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-300">Total Optimized</CardTitle>
            <ShoppingBag className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white" data-testid="card-total-optimized">
              {isLoading ? "..." : totalOptimized}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              AI-enhanced products
            </p>
          </CardContent>
        </Card>
        
        <Card className="gradient-card border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-300">Total Products</CardTitle>
            <TrendingUp className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white" data-testid="card-total-products">
              {isLoading ? "..." : products.length}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              In your catalog
            </p>
          </CardContent>
        </Card>
        
        <Card className="gradient-card border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-300">This Week</CardTitle>
            <Calendar className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white" data-testid="card-this-week">
              {isLoading ? "..." : optimizedThisWeek}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Optimized in last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      <div className="space-y-6">
        {isLoading ? (
          <Card className="gradient-card">
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading optimized products...</p>
            </CardContent>
          </Card>
        ) : optimizedProducts.length === 0 ? (
          <Card className="gradient-card border-slate-700/50">
            <CardContent className="p-12 text-center">
              <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-xl mb-2">No Optimized Products Yet</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Start optimizing your products with AI to see them here. Our AI will enhance descriptions, titles, and SEO for better conversions.
              </p>
              <Button
                onClick={() => window.location.href = '/products'}
                className="bg-primary text-primary-foreground"
              >
                Go to Products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          optimizedProducts.map((product) => (
            <ProductCard key={product.id} product={product} currency={currency} />
          ))
        )}
      </div>
    </PageShell>
  );
}
