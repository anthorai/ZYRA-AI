import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
  AlertCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Play,
  ListChecks,
  Target,
  Eye
} from "lucide-react";

function stripHtml(html: string | undefined | null): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface ProductAudit {
  productId: string;
  productName: string;
  score: number;
  issues: Array<{
    type: 'critical' | 'warning' | 'info';
    message: string;
    field: string;
  }>;
  hasMetaTitle: boolean;
  hasMetaDescription: boolean;
  hasAltText: boolean;
  hasKeywords: boolean;
  titleLength: number;
  descriptionLength: number;
  metaDescriptionLength: number;
  keywordCount: number;
}

interface GeneratedFix {
  productId: string;
  productName: string;
  original: {
    title: string;
    description: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  suggested: {
    seoTitle: string;
    seoDescription: string;
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    seoScore: number;
  };
  status: 'pending' | 'generating' | 'ready' | 'applied' | 'skipped' | 'error';
  error?: string;
}

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

export default function SmartBulkSuggestions() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [generatedFixes, setGeneratedFixes] = useState<Map<string, GeneratedFix>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("analyze");

  const { data: products = [], isLoading: isLoadingProducts, error: productsError } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: auditData, isLoading: isLoadingAudit, refetch: refetchAudit } = useQuery<ProductAudit[]>({
    queryKey: ['/api/seo-health/audit'],
    enabled: analysisComplete,
  });

  useEffect(() => {
    if (productsError) {
      toast({
        title: "Error",
        description: productsError instanceof Error ? productsError.message : "Failed to load products",
        variant: "destructive",
      });
    }
  }, [productsError, toast]);

  const productIssues = useMemo(() => {
    if (!auditData) return [];
    return auditData.filter(p => p.score < 80 || p.issues.length > 0)
      .sort((a, b) => a.score - b.score);
  }, [auditData]);

  const handleAnalyzeStore = async () => {
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
    setGeneratedFixes(new Map());
    setSelectedProducts(new Set());

    toast({
      title: "Analyzing Your Store",
      description: "AI is scanning all products for optimization opportunities...",
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    await refetchAudit();
    
    setIsAnalyzing(false);
    setAnalysisComplete(true);

    toast({
      title: "Analysis Complete",
      description: `Found ${productIssues.length} products with optimization opportunities`,
    });
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAllProducts = () => {
    if (selectedProducts.size === productIssues.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(productIssues.map(p => p.productId)));
    }
  };

  const toggleExpanded = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const generateAISuggestions = async () => {
    if (selectedProducts.size === 0) {
      toast({
        title: "No Products Selected",
        description: "Please select at least one product to generate suggestions.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setActiveTab("suggestions");

    const selectedProductsList = productIssues.filter(p => selectedProducts.has(p.productId));
    const productsData = products.filter(p => selectedProducts.has(p.id));
    let completed = 0;

    for (const audit of selectedProductsList) {
      const productData = productsData.find(p => p.id === audit.productId);
      if (!productData) continue;

      setGeneratedFixes(prev => {
        const newMap = new Map(prev);
        newMap.set(audit.productId, {
          productId: audit.productId,
          productName: audit.productName,
          original: {
            title: productData.name,
            description: productData.description || '',
          },
          suggested: {
            seoTitle: '',
            seoDescription: '',
            metaTitle: '',
            metaDescription: '',
            keywords: [],
            seoScore: 0
          },
          status: 'generating'
        });
        return newMap;
      });

      try {
        const res = await apiRequest('POST', '/api/generate-product-seo', {
          productName: productData.name,
          keyFeatures: productData.description || 'High-quality product',
          targetAudience: 'General consumers',
          category: productData.category || 'General',
          price: productData.price
        });
        const response = await res.json();

        setGeneratedFixes(prev => {
          const newMap = new Map(prev);
          newMap.set(audit.productId, {
            productId: audit.productId,
            productName: audit.productName,
            original: {
              title: productData.name,
              description: productData.description || '',
            },
            suggested: {
              seoTitle: response.seoTitle || response.metaTitle || productData.name,
              seoDescription: response.seoDescription || response.metaDescription || '',
              metaTitle: response.metaTitle || response.seoTitle || productData.name,
              metaDescription: response.metaDescription || '',
              keywords: response.keywords || [],
              seoScore: response.seoScore || 0
            },
            status: 'ready'
          });
          return newMap;
        });
        setExpandedProducts(prev => new Set(prev).add(audit.productId));
      } catch (error) {
        setGeneratedFixes(prev => {
          const newMap = new Map(prev);
          newMap.set(audit.productId, {
            productId: audit.productId,
            productName: audit.productName,
            original: {
              title: productData.name,
              description: productData.description || '',
            },
            suggested: {
              seoTitle: '',
              seoDescription: '',
              metaTitle: '',
              metaDescription: '',
              keywords: [],
              seoScore: 0
            },
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to generate'
          });
          return newMap;
        });
      }

      completed++;
      setGenerationProgress((completed / selectedProductsList.length) * 100);
    }

    setIsGenerating(false);
    toast({
      title: "Suggestions Generated",
      description: `AI generated suggestions for ${completed} products`,
    });
  };

  const applyFixMutation = useMutation({
    mutationFn: async (productId: string) => {
      const fix = generatedFixes.get(productId);
      if (!fix || fix.status !== 'ready') throw new Error('No fix available');

      const finalTitle = fix.suggested.seoTitle || fix.suggested.metaTitle;
      const finalDescription = fix.suggested.metaDescription || fix.suggested.seoDescription;

      const response = await apiRequest('PATCH', `/api/products/${productId}/seo`, {
        seoTitle: finalTitle,
        metaDescription: finalDescription,
        keywords: fix.suggested.keywords,
        seoScore: fix.suggested.seoScore
      });
      return { productId, response };
    },
    onSuccess: ({ productId }) => {
      setGeneratedFixes(prev => {
        const newMap = new Map(prev);
        const fix = newMap.get(productId);
        if (fix) {
          newMap.set(productId, { ...fix, status: 'applied' });
        }
        return newMap;
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/seo-health/audit'] });
      toast({
        title: "Fix Applied",
        description: "Product SEO has been optimized",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply fix",
        variant: "destructive"
      });
    }
  });

  const applyAllFixes = async () => {
    const readyFixes = Array.from(generatedFixes.values()).filter(f => f.status === 'ready');
    
    if (readyFixes.length === 0) {
      toast({
        title: "No Fixes Ready",
        description: "Generate suggestions first before applying",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Applying All Fixes",
      description: `Optimizing ${readyFixes.length} products...`,
    });

    for (const fix of readyFixes) {
      try {
        await applyFixMutation.mutateAsync(fix.productId);
      } catch {
        continue;
      }
    }

    const appliedCount = Array.from(generatedFixes.values()).filter(f => f.status === 'applied').length;
    toast({
      title: "Batch Update Complete",
      description: `Successfully optimized ${appliedCount} products`,
    });
  };

  const skipFix = (productId: string) => {
    setGeneratedFixes(prev => {
      const newMap = new Map(prev);
      const fix = newMap.get(productId);
      if (fix) {
        newMap.set(productId, { ...fix, status: 'skipped' });
      }
      return newMap;
    });
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <FileText className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-400 bg-red-400/20';
      case 'warning': return 'text-yellow-400 bg-yellow-400/20';
      case 'info': return 'text-blue-400 bg-blue-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const totalIssues = productIssues.reduce((sum, p) => sum + p.issues.length, 0);
  const criticalIssues = productIssues.reduce((sum, p) => 
    sum + p.issues.filter(i => i.type === 'critical').length, 0
  );
  const readyFixes = Array.from(generatedFixes.values()).filter(f => f.status === 'ready').length;
  const appliedFixes = Array.from(generatedFixes.values()).filter(f => f.status === 'applied').length;

  return (
    <PageShell
      title="Smart Bulk Suggestions"
      subtitle="AI-powered store analysis with actionable SEO improvements"
    >
      {isLoadingProducts ? (
        <DashboardCard>
          <div className="space-y-4">
            <Skeleton className="h-8 w-64 mb-2" data-testid="skeleton-title" />
            <Skeleton className="h-4 w-96" data-testid="skeleton-description" />
            <Skeleton className="h-32 w-full" data-testid="skeleton-content" />
          </div>
        </DashboardCard>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="analyze" className="flex items-center gap-2" data-testid="tab-analyze">
              <Search className="w-4 h-4" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2" data-testid="tab-suggestions">
              <Sparkles className="w-4 h-4" />
              Suggestions
              {readyFixes > 0 && (
                <Badge variant="secondary" className="ml-1">{readyFixes}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="applied" className="flex items-center gap-2" data-testid="tab-applied">
              <CheckCircle2 className="w-4 h-4" />
              Applied
              {appliedFixes > 0 && (
                <Badge variant="secondary" className="ml-1">{appliedFixes}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-6">
            <DashboardCard
              title="Store Analysis"
              description="Scan your product catalog to find SEO improvement opportunities"
            >
              {!analysisComplete ? (
                <div className="text-center py-8">
                  {products.length === 0 ? (
                    <div className="space-y-4" data-testid="empty-state">
                      <PackageX className="w-16 h-16 mx-auto text-slate-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-200 mb-2">No Products Found</h3>
                        <p className="text-slate-400 text-sm mb-4">
                          Add products to your store to start analyzing
                        </p>
                        <Button
                          onClick={() => setLocation('/products/manage')}
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
                        size="lg"
                        className="text-lg px-8"
                        data-testid="button-analyze"
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
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
                          Scanning for CTR issues, SEO problems, and missing content...
                        </p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary" data-testid="stat-products">
                        {productIssues.length}
                      </div>
                      <div className="text-slate-400 text-sm">Need Attention</div>
                    </div>
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-red-400" data-testid="stat-critical">
                        {criticalIssues}
                      </div>
                      <div className="text-slate-400 text-sm">Critical Issues</div>
                    </div>
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-400" data-testid="stat-total-issues">
                        {totalIssues}
                      </div>
                      <div className="text-slate-400 text-sm">Total Issues</div>
                    </div>
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-400" data-testid="stat-optimized">
                        {products.length - productIssues.length}
                      </div>
                      <div className="text-slate-400 text-sm">Already Optimized</div>
                    </div>
                  </div>

                  {productIssues.length > 0 && (
                    <div className="flex items-center justify-between border-t border-slate-700 pt-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedProducts.size === productIssues.length && productIssues.length > 0}
                          onCheckedChange={selectAllProducts}
                          data-testid="checkbox-select-all"
                        />
                        <span className="text-slate-300 text-sm">
                          {selectedProducts.size === 0 
                            ? 'Select products to optimize' 
                            : `${selectedProducts.size} selected`}
                        </span>
                      </div>
                      <Button
                        onClick={generateAISuggestions}
                        disabled={selectedProducts.size === 0 || isGenerating}
                        data-testid="button-generate-suggestions"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate AI Suggestions ({selectedProducts.size})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </DashboardCard>

            {analysisComplete && productIssues.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Products Needing Optimization
                </h3>
                
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {productIssues.map((product) => (
                      <Card 
                        key={product.productId}
                        className="border-slate-700/50 bg-slate-800/30"
                        data-testid={`card-product-${product.productId}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={selectedProducts.has(product.productId)}
                              onCheckedChange={() => toggleProductSelection(product.productId)}
                              className="mt-1"
                              data-testid={`checkbox-product-${product.productId}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-white truncate" data-testid={`title-${product.productId}`}>
                                  {product.productName}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <Badge className={getSeverityColor(product.issues[0]?.type || 'info')}>
                                    {product.issues.length} issues
                                  </Badge>
                                  <span className={`font-bold ${getScoreColor(product.score)}`} data-testid={`score-${product.productId}`}>
                                    {product.score}/100
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {product.issues.slice(0, 3).map((issue, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className={`text-xs ${getSeverityColor(issue.type)}`}
                                    data-testid={`issue-badge-${product.productId}-${idx}`}
                                  >
                                    {getIssueIcon(issue.type)}
                                    <span className="ml-1">{issue.message}</span>
                                  </Badge>
                                ))}
                                {product.issues.length > 3 && (
                                  <Badge variant="outline" className="text-xs text-slate-400">
                                    +{product.issues.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {analysisComplete && productIssues.length === 0 && products.length > 0 && (
              <DashboardCard testId="all-optimized">
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    All Products Are Optimized
                  </h3>
                  <p className="text-slate-300">
                    Your {products.length} products meet SEO best practices.
                  </p>
                </div>
              </DashboardCard>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-6">
            {isGenerating && (
              <DashboardCard>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-primary animate-pulse" />
                    <div>
                      <h3 className="font-semibold text-white">Generating AI Suggestions</h3>
                      <p className="text-slate-400 text-sm">
                        Analyzing products and creating optimized SEO content...
                      </p>
                    </div>
                  </div>
                  <Progress value={generationProgress} className="h-2" data-testid="progress-generation" />
                  <p className="text-slate-400 text-sm text-center">
                    {Math.round(generationProgress)}% complete
                  </p>
                </div>
              </DashboardCard>
            )}

            {!isGenerating && generatedFixes.size === 0 && (
              <DashboardCard>
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Suggestions Yet</h3>
                  <p className="text-slate-400 mb-4">
                    Select products in the Analyze tab and click "Generate AI Suggestions"
                  </p>
                  <Button onClick={() => setActiveTab("analyze")} data-testid="button-go-analyze">
                    <Search className="w-4 h-4 mr-2" />
                    Go to Analyze
                  </Button>
                </div>
              </DashboardCard>
            )}

            {!isGenerating && readyFixes > 0 && (
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {readyFixes} Suggestions Ready
                </h3>
                <Button
                  onClick={applyAllFixes}
                  disabled={applyFixMutation.isPending}
                  data-testid="button-apply-all"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Apply All Fixes
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {Array.from(generatedFixes.values())
                .filter(f => f.status === 'ready' || f.status === 'generating')
                .map((fix) => (
                <Card 
                  key={fix.productId}
                  className="border-slate-700/50 bg-slate-800/30"
                  data-testid={`card-suggestion-${fix.productId}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        {fix.status === 'generating' ? (
                          <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-primary" />
                        )}
                        {fix.productName}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {fix.status === 'ready' && fix.suggested.seoScore > 0 && (
                          <Badge className="bg-green-500/20 text-green-300">
                            Score: {fix.suggested.seoScore}/100
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleExpanded(fix.productId)}
                          data-testid={`button-expand-${fix.productId}`}
                        >
                          {expandedProducts.has(fix.productId) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {expandedProducts.has(fix.productId) && fix.status === 'ready' && (
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-400" />
                            Current (Before)
                          </h4>
                          <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg space-y-2">
                            <div>
                              <span className="text-xs text-slate-500">Title:</span>
                              <p className="text-slate-300 text-sm">{fix.original.title}</p>
                            </div>
                            <div>
                              <span className="text-xs text-slate-500">Description:</span>
                              <p className="text-slate-400 text-sm line-clamp-3">
                                {stripHtml(fix.original.description) || 'No description'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            AI Optimized (After)
                          </h4>
                          <div className="p-3 bg-green-900/20 border border-green-500/20 rounded-lg space-y-2">
                            <div>
                              <span className="text-xs text-slate-500">SEO Title:</span>
                              <p className="text-green-300 text-sm font-medium">{fix.suggested.seoTitle}</p>
                            </div>
                            <div>
                              <span className="text-xs text-slate-500">Meta Description:</span>
                              <p className="text-green-200 text-sm">
                                {fix.suggested.metaDescription || fix.suggested.seoDescription}
                              </p>
                            </div>
                            {fix.suggested.keywords.length > 0 && (
                              <div>
                                <span className="text-xs text-slate-500">Keywords:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {fix.suggested.keywords.slice(0, 5).map((kw, i) => (
                                    <Badge key={i} variant="outline" className="text-xs text-green-300">
                                      {kw}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
                        <Button
                          variant="ghost"
                          onClick={() => skipFix(fix.productId)}
                          data-testid={`button-skip-${fix.productId}`}
                        >
                          Skip
                        </Button>
                        <Button
                          onClick={() => applyFixMutation.mutate(fix.productId)}
                          disabled={applyFixMutation.isPending}
                          data-testid={`button-apply-${fix.productId}`}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Apply Fix
                        </Button>
                      </div>
                    </CardContent>
                  )}
                  
                  {fix.status === 'generating' && (
                    <CardContent>
                      <div className="flex items-center gap-2 text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Generating AI suggestions...</span>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="applied" className="space-y-6">
            {appliedFixes === 0 ? (
              <DashboardCard>
                <div className="text-center py-12">
                  <ListChecks className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Fixes Applied Yet</h3>
                  <p className="text-slate-400">
                    Apply suggestions from the Suggestions tab to see them here
                  </p>
                </div>
              </DashboardCard>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    {appliedFixes} Products Optimized
                  </h3>
                </div>
                
                {Array.from(generatedFixes.values())
                  .filter(f => f.status === 'applied')
                  .map((fix) => (
                  <Card 
                    key={fix.productId}
                    className="border-green-500/30 bg-green-900/10"
                    data-testid={`card-applied-${fix.productId}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <div>
                            <h4 className="font-medium text-white">{fix.productName}</h4>
                            <p className="text-sm text-green-300">
                              SEO optimized with score: {fix.suggested.seoScore}/100
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-500/20 text-green-300">
                          Applied
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </PageShell>
  );
}
