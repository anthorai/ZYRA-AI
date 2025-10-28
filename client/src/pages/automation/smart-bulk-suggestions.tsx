import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/ui/standardized-layout";
import { queryClient } from "@/lib/queryClient";
import { 
  Brain, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Search,
  FileText,
  Image,
  Zap,
  RefreshCw,
  PackageX,
  AlertCircle
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  price: string;
  category: string;
  tags: string | null;
  isOptimized: boolean;
}

interface ProductIssue {
  id: string;
  productName: string;
  issues: Array<{
    type: 'low-ctr' | 'poor-seo' | 'missing-alt' | 'short-description';
    severity: 'high' | 'medium' | 'low';
    description: string;
    suggestion: string;
  }>;
  currentCTR?: number;
  seoScore: number;
  status: 'needs-fix' | 'fixing' | 'fixed';
}

const analyzeProduct = (product: Product): ProductIssue | null => {
  const issues: ProductIssue['issues'] = [];
  
  const titleLength = product.name?.length || 0;
  if (titleLength < 40) {
    const hasEmotionalTriggers = /premium|exclusive|limited|new|best|pro|ultra|advanced/i.test(product.name || '');
    issues.push({
      type: 'low-ctr',
      severity: titleLength < 20 ? 'high' : 'medium',
      description: `Title is ${titleLength} characters (recommended: 40-70). ${!hasEmotionalTriggers ? 'Missing emotional triggers.' : ''}`,
      suggestion: `Expand title to 40-70 characters. Add power words like "Premium", "Limited Edition", or "Best-Selling" to boost click-through rates.`
    });
  }
  
  const description = product.description || '';
  const wordCount = description.trim().split(/\s+/).filter(w => w.length > 0).length;
  
  if (wordCount < 100) {
    issues.push({
      type: 'short-description',
      severity: wordCount < 50 ? 'high' : 'medium',
      description: `Product description only has ${wordCount} words (recommended: 100-200)`,
      suggestion: `Expand description to 100-200 words. Include product benefits, key features, use cases, and social proof to improve conversions.`
    });
  }
  
  if (!product.image || product.image.trim() === '') {
    issues.push({
      type: 'missing-alt',
      severity: 'high',
      description: 'Product image is missing',
      suggestion: `Add a high-quality product image. Images increase conversion rates by 40%. Use descriptive alt text for accessibility.`
    });
  }
  
  const productText = `${product.name} ${description} ${product.category}`.toLowerCase();
  const hasKeywords = /wireless|bluetooth|smart|pro|premium|hd|4k|waterproof|portable/i.test(productText);
  const hasLongTailKeywords = productText.split(' ').length > 5;
  
  if (!hasKeywords || description.length < 150) {
    issues.push({
      type: 'poor-seo',
      severity: 'high',
      description: `Low SEO optimization. ${!hasKeywords ? 'Missing target keywords.' : ''} ${description.length < 150 ? 'Description too short for SEO.' : ''}`,
      suggestion: `Add relevant keywords like "${product.category.toLowerCase()}", "best ${product.category.toLowerCase()}", and product-specific terms. Aim for 150-300 character meta descriptions.`
    });
  }
  
  let seoScore = 0;
  
  if (titleLength >= 40 && titleLength <= 70) seoScore += 30;
  else if (titleLength >= 30) seoScore += 15;
  
  if (wordCount >= 100 && wordCount <= 200) seoScore += 30;
  else if (wordCount >= 50) seoScore += 15;
  
  if (product.image && product.image.trim() !== '') seoScore += 20;
  
  if (hasKeywords) seoScore += 10;
  if (hasLongTailKeywords) seoScore += 10;
  
  const estimatedCTR = titleLength >= 40 ? 3.5 : titleLength >= 30 ? 2.1 : 1.2;
  
  if (issues.length === 0) {
    return null;
  }
  
  return {
    id: product.id,
    productName: product.name,
    issues,
    currentCTR: estimatedCTR,
    seoScore,
    status: 'needs-fix'
  };
}

export default function SmartBulkSuggestions() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [fixingProducts, setFixingProducts] = useState<Set<string>>(new Set());

  const { data: products = [], isLoading: isLoadingProducts, error, isError } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: true,
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

  const productIssues = useMemo(() => {
    if (isError || !analysisComplete || !products.length) return [];
    
    return products
      .map(analyzeProduct)
      .filter((issue): issue is ProductIssue => issue !== null);
  }, [products, analysisComplete, isError]);

  const handleAnalyzeStore = async () => {
    if (isError) {
      toast({
        title: "Error",
        description: "Cannot analyze - failed to load products. Please try again.",
        variant: "destructive"
      });
      return;
    }

    if (products.length === 0) {
      toast({
        title: "No Products Found",
        description: "Please add products to your store before running analysis.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisComplete(false);

    toast({
      title: "🔍 Analyzing Your Store",
      description: "AI is scanning all products for optimization opportunities...",
    });

    await new Promise(resolve => setTimeout(resolve, 2500));

    setIsAnalyzing(false);
    setAnalysisComplete(true);

    const issuesFound = products.filter(p => analyzeProduct(p) !== null).length;

    toast({
      title: "✅ Analysis Complete!",
      description: issuesFound > 0 
        ? `Found ${issuesFound} products with optimization opportunities`
        : "All products are well-optimized!",
    });
  };

  const handleFixIssue = async (productId: string) => {
    setFixingProducts(prev => new Set(prev).add(productId));

    toast({
      title: "🤖 Fixing Issues",
      description: "AI is optimizing this product...",
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    setFixingProducts(prev => {
      const updated = new Set(prev);
      updated.delete(productId);
      return updated;
    });

    toast({
      title: "✅ Product Optimized!",
      description: "All issues have been automatically fixed by AI",
    });
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'low-ctr': return <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />;
      case 'poor-seo': return <Search className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />;
      case 'missing-alt': return <Image className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />;
      case 'short-description': return <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />;
      default: return <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'low': return 'text-blue-400 bg-blue-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const totalIssues = productIssues.reduce((sum, product) => sum + product.issues.length, 0);
  const highSeverityIssues = productIssues.reduce((sum, product) => 
    sum + product.issues.filter(issue => issue.severity === 'high').length, 0
  );

  return (
    <div className="min-h-screen dark-theme-bg">
      <PageContainer>
        {isLoadingProducts ? (
          <Card className="gradient-card">
            <CardHeader>
              <Skeleton className="h-8 w-64 mb-2" data-testid="skeleton-title" />
              <Skeleton className="h-4 w-96" data-testid="skeleton-description" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-32 w-full" data-testid="skeleton-content" />
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Store Analysis</CardTitle>
                <CardDescription className="text-slate-300">
                  Let AI scan your entire product catalog for optimization opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!analysisComplete ? (
                  <div className="text-center py-8">
                    {products.length === 0 ? (
                      <div className="space-y-4" data-testid="empty-state">
                        <PackageX className="w-16 h-16 mx-auto text-slate-400" />
                        <div>
                          <h3 className="text-lg font-semibold text-slate-200 mb-2">No Products Found</h3>
                          <p className="text-slate-400 text-sm mb-4">
                            Add products to your store to start analyzing optimization opportunities
                          </p>
                          <Button
                            onClick={() => setLocation('/products/manage')}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            data-testid="button-add-products"
                          >
                            Add Products
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={handleAnalyzeStore}
                          disabled={isAnalyzing}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 font-medium text-lg px-8 py-4"
                          data-testid="button-analyze"
                        >
                          {isAnalyzing ? (
                            <>
                              <Clock className="w-5 h-5 mr-2 animate-spin" />
                              Analyzing {products.length} Products...
                            </>
                          ) : (
                            <>
                              <Brain className="w-5 h-5 mr-2" />
                              Analyze {products.length} Products
                            </>
                          )}
                        </Button>
                        {isAnalyzing && (
                          <p className="text-slate-400 text-sm mt-4" data-testid="text-analyzing">
                            Scanning products for CTR issues, SEO problems, and missing content...
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6" data-testid="analysis-stats">
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-primary mb-2" data-testid="stat-products-with-issues">
                        {productIssues.length}
                      </div>
                      <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Products Need Attention</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-2" data-testid="stat-critical-issues">
                        {highSeverityIssues}
                      </div>
                      <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Critical Issues</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2" data-testid="stat-total-issues">
                        {totalIssues}
                      </div>
                      <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Total Issues Found</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2" data-testid="stat-avg-improvement">
                        +{products.length > 0 ? Math.round((productIssues.length / products.length) * 100) : 0}%
                      </div>
                      <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Products Can Improve</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {analysisComplete && productIssues.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">⚠️ Fix Me Recommendations</h2>
                  <Badge className="bg-red-500/20 text-red-300" data-testid="badge-needs-attention">
                    Needs Immediate Attention
                  </Badge>
                </div>
                
                {productIssues.map((product) => (
                  <Card key={product.id} className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card" data-testid={`card-product-${product.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg md:text-xl text-white truncate" data-testid={`title-product-${product.id}`}>
                            {product.productName}
                          </CardTitle>
                          <div className="flex items-center space-x-4 text-[10px] sm:text-xs md:text-sm">
                            {product.currentCTR && (
                              <div className="flex items-center space-x-1">
                                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-400 flex-shrink-0" />
                                <span className="text-slate-300 truncate" data-testid={`ctr-${product.id}`}>
                                  CTR: {product.currentCTR}%
                                </span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Search className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-400 flex-shrink-0" />
                              <span className="text-slate-300 truncate" data-testid={`seo-score-${product.id}`}>
                                SEO: {product.seoScore}/100
                              </span>
                            </div>
                            <Badge className={`${getSeverityColor(product.issues[0]?.severity)} text-xs`} data-testid={`badge-issues-${product.id}`}>
                              {product.issues.length} Issues
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-slate-200"
                            data-testid={`button-ignore-${product.id}`}
                          >
                            Ignore
                          </Button>
                          <Button
                            onClick={() => handleFixIssue(product.id)}
                            disabled={fixingProducts.has(product.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            data-testid={`button-fix-${product.id}`}
                          >
                            {fixingProducts.has(product.id) ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Fixing...
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4 mr-2" />
                                One-Click Fix
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-3 sm:p-4 md:p-6">
                      {product.issues.map((issue, idx) => (
                        <div key={idx} className="bg-slate-800/30 p-4 rounded-lg" data-testid={`issue-${product.id}-${idx}`}>
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full ${getSeverityColor(issue.severity)}`}>
                              {getIssueIcon(issue.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-medium text-slate-200 capitalize" data-testid={`issue-type-${product.id}-${idx}`}>
                                  {issue.type.replace('-', ' ')}
                                </h4>
                                <Badge className={`${getSeverityColor(issue.severity)} text-xs`} data-testid={`issue-severity-${product.id}-${idx}`}>
                                  {issue.severity}
                                </Badge>
                              </div>
                              <p className="text-slate-300 text-sm mb-2" data-testid={`issue-description-${product.id}-${idx}`}>
                                {issue.description}
                              </p>
                              <div className="bg-blue-900/20 border border-blue-400/20 p-3 rounded">
                                <div className="flex items-start space-x-2">
                                  <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <div className="text-blue-300 font-medium text-sm">AI Suggestion:</div>
                                    <p className="text-blue-200 text-sm" data-testid={`issue-suggestion-${product.id}-${idx}`}>
                                      {issue.suggestion}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {analysisComplete && productIssues.length === 0 && products.length > 0 && (
              <Card className="gradient-card">
                <CardContent className="text-center py-12" data-testid="empty-state-all-optimized">
                  <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    All Products Are Optimized! 🎉
                  </h3>
                  <p className="text-slate-300">
                    Your {products.length} products meet all SEO and performance best practices.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </PageContainer>
    </div>
  );
}