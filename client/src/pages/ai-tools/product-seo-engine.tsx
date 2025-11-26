import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { ProductSelector, stripHtmlTags } from "@/components/product-selector";
import { formatCurrency } from "@/lib/utils";
import { 
  Zap, 
  Sparkles, 
  TrendingUp, 
  Target, 
  Search, 
  Copy, 
  Save, 
  RefreshCw, 
  Download, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Hash,
  Eye,
  BarChart3,
  Rocket,
  Trophy,
  Users,
  CheckCheck,
  ClipboardCheck,
  Upload,
  Check,
  Tag
} from "lucide-react";

interface Product {
  id: string;
  shopifyId?: string;
  name: string;
  description?: string;
  features?: string;
  category: string;
  price: string;
}

interface SEOOutput {
  seoTitle: string;
  seoDescription: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  seoScore?: number;
  searchIntent?: string;
  suggestedKeywords?: string[];
}

interface SERPResult {
  position: number;
  title: string;
  description: string;
  url: string;
  domain: string;
}

interface SERPAnalysis {
  query: string;
  topResults: SERPResult[];
  keywordClusters: {
    primary: string;
    secondary: string[];
    longTail: string[];
    lsi: string[];
  };
  titlePatterns: {
    averageLength: number;
    commonStructure: string;
    topModifiers: string[];
  };
  metaPatterns: {
    averageLength: number;
    emotionalTriggers: string[];
  };
  competitorInsights: {
    totalAnalyzed: number;
    topDomains: string[];
    commonFeatures: string[];
  };
  cached?: boolean;
}

type OptimizationMode = 'fast' | 'competitive';

export default function ProductSeoEngine() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [generatedSEO, setGeneratedSEO] = useState<SEOOutput | null>(null);
  const [activeTab, setActiveTab] = useState("seo-title");
  const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>('fast');
  const [serpAnalysis, setSerpAnalysis] = useState<SERPAnalysis | null>(null);

  // Fetch user's products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Auto-select product from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const productId = params.get('productId');
    if (productId && products?.some(p => p.id === productId)) {
      setSelectedProductId(productId);
    }
  }, [searchString, products]);

  // Fetch store currency
  const { data: storeData } = useQuery<{ currency: string }>({
    queryKey: ['/api/store/currency'],
  });
  const currency = storeData?.currency || 'USD';

  // Get selected product
  const selectedProduct = products?.find(p => p.id === selectedProductId);

  // Generate SEO mutation
  const generateSEOMutation = useMutation({
    mutationFn: async (productData: { productName: string; keyFeatures: string; targetAudience: string; category: string }) => {
      const response = await apiRequest("POST", "/api/generate-product-seo", productData);
      return await response.json();
    },
    onSuccess: (data: SEOOutput) => {
      setGeneratedSEO(data);
      toast({
        title: "SEO Generated Successfully!",
        description: "Your product SEO has been optimized with AI.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate SEO content",
        variant: "destructive",
      });
    },
  });

  // SERP Analysis mutation
  const serpAnalysisMutation = useMutation({
    mutationFn: async (keyword: string) => {
      const response = await apiRequest("POST", "/api/serp/analyze", { keyword });
      return await response.json();
    },
    onSuccess: (data: { success: boolean; analysis: SERPAnalysis }) => {
      if (data.success) {
        setSerpAnalysis(data.analysis);
        toast({
          title: "Competitor Analysis Complete!",
          description: `Analyzed top ${data.analysis.topResults.length} Google rankings${data.analysis.cached ? ' (cached)' : ''}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "SERP Analysis Failed",
        description: error.message || "Failed to fetch competitor data",
        variant: "destructive",
      });
      // Fallback to fast mode
      setOptimizationMode('fast');
    },
  });

  // Save SEO mutation
  const saveSEOMutation = useMutation({
    mutationFn: async () => {
      if (!generatedSEO || !selectedProduct) return;
      const response = await apiRequest("POST", "/api/save-product-seo", {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        ...generatedSEO,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Saved Successfully!",
        description: "SEO content has been saved to your history.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/product-seo-history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save SEO content",
        variant: "destructive",
      });
    },
  });

  // State to track which field is being applied
  const [applyingField, setApplyingField] = useState<string | null>(null);
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());

  // Apply SEO to Shopify mutation
  const applyToShopifyMutation = useMutation({
    mutationFn: async (content: { 
      description?: string; 
      seoTitle?: string; 
      metaDescription?: string;
      fieldName?: string;
    }) => {
      if (!selectedProduct?.id) throw new Error("No product selected");
      
      const response = await apiRequest("POST", `/api/shopify/publish/${selectedProduct.id}`, {
        content: {
          description: content.description,
          seoTitle: content.seoTitle,
          metaDescription: content.metaDescription,
        }
      });
      return { ...(await response.json()), fieldName: content.fieldName };
    },
    onSuccess: (data) => {
      if (data.fieldName) {
        setAppliedFields(prev => new Set(prev).add(data.fieldName));
      }
      toast({
        title: "Applied to Shopify!",
        description: data.fieldName 
          ? `${data.fieldName} has been updated on your Shopify store.`
          : "All SEO content has been published to your Shopify store.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error: any) => {
      toast({
        title: "Apply Failed",
        description: error.message || "Failed to apply content to Shopify. Make sure your store is connected.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setApplyingField(null);
    },
  });

  // Handle applying individual fields to Shopify
  const handleApplyField = async (fieldName: string, content: { 
    description?: string; 
    seoTitle?: string; 
    metaDescription?: string;
    tags?: string[];
  }) => {
    if (!selectedProduct?.shopifyId) {
      toast({
        title: "Not Connected to Shopify",
        description: "This product is not linked to a Shopify store.",
        variant: "destructive",
      });
      return;
    }
    
    setApplyingField(fieldName);
    applyToShopifyMutation.mutate({ ...content, fieldName });
  };

  // Handle applying all fields to Shopify
  const handleApplyAllToShopify = async () => {
    if (!generatedSEO || !selectedProduct?.shopifyId) {
      toast({
        title: "Cannot Apply",
        description: selectedProduct?.shopifyId 
          ? "No SEO content generated yet." 
          : "This product is not linked to a Shopify store.",
        variant: "destructive",
      });
      return;
    }
    
    setApplyingField('all');
    applyToShopifyMutation.mutate({
      description: generatedSEO.seoDescription,
      seoTitle: generatedSEO.metaTitle,
      metaDescription: generatedSEO.metaDescription,
      tags: generatedSEO.keywords, // Push tags to Shopify
      fieldName: 'All Fields',
    });
  };

  const handleOptimize = async () => {
    if (!selectedProduct) {
      toast({
        title: "No Product Selected",
        description: "Please select a product first",
        variant: "destructive",
      });
      return;
    }

    // Clear previous results and reset applied fields
    setGeneratedSEO(null);
    setSerpAnalysis(null);
    setAppliedFields(new Set());

    // If competitive mode, try to fetch SERP data first
    if (optimizationMode === 'competitive') {
      try {
        const keyword = selectedProduct.name;
        await serpAnalysisMutation.mutateAsync(keyword);
      } catch (error) {
        // SERP analysis failed - fall back to fast mode
        console.error('SERP analysis failed, falling back to fast mode:', error);
        setOptimizationMode('fast');
        toast({
          title: "Switched to Fast Mode",
          description: "Competitor analysis unavailable. Using fast AI-only optimization.",
        });
      }
    }

    // Generate SEO (will use SERP data if available from successful competitive mode)
    generateSEOMutation.mutate({
      productName: selectedProduct.name,
      keyFeatures: selectedProduct.features || selectedProduct.description || "Premium quality product",
      targetAudience: "General consumers",
      category: selectedProduct.category,
    });
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopyAll = async () => {
    if (!generatedSEO) return;
    
    const allContent = `
SEO Title: ${generatedSEO.seoTitle}

Product Description:
${generatedSEO.seoDescription}

Meta Title: ${generatedSEO.metaTitle}

Meta Description: ${generatedSEO.metaDescription}

Keywords: ${generatedSEO.keywords.join(", ")}
    `.trim();

    await handleCopy(allContent, "All SEO Content");
  };

  const handleExport = () => {
    if (!generatedSEO || !selectedProduct) return;

    const exportData = {
      product: selectedProduct.name,
      generatedAt: new Date().toISOString(),
      ...generatedSEO,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedProduct.name.replace(/\s+/g, "-").toLowerCase()}-seo.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported!",
      description: "SEO content exported successfully",
    });
  };


  return (
    <PageShell
      title="Ultimate Product SEO Engine"
      subtitle="AI-powered SEO Titles, Descriptions & Meta Optimization — All in one place"
      backTo="/dashboard?tab=ai-tools"
      maxWidth="xl"
      spacing="normal"
    >
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar: Product Loader + AI Insights */}
          <div className="lg:col-span-1 space-y-6">
            {/* Product Loader Card */}
            <DashboardCard 
              title="Product Loader"
              description="Select a product to optimize"
              testId="card-product-loader"
            >
                {productsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-28 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-300">Choose Shopify Product</label>
                      <ProductSelector
                        value={selectedProductId}
                        onSelect={(product) => setSelectedProductId(product?.id || "")}
                        placeholder="Search and select product..."
                      />
                    </div>

                    {selectedProduct && (
                      <div className="p-5 rounded-lg border space-y-4 animate-in fade-in-50 duration-300">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-semibold text-white leading-tight">{selectedProduct.name}</h4>
                          <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0">
                            {selectedProduct.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
                          {stripHtmlTags(selectedProduct.description || selectedProduct.features || "No description available")}
                        </p>
                        <div className="pt-3 border-t border-slate-700/50">
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(parseFloat(selectedProduct.price), currency)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </DashboardCard>

            {/* SERP Competitor Insights Card */}
            {serpAnalysis && (
              <DashboardCard 
                title="Competitor Intelligence"
                description={`Analyzing ${serpAnalysis.topResults.length} top Google rankings${serpAnalysis.cached ? ' (cached)' : ''}`}
                testId="card-serp-insights"
                className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
              >
                <div className="space-y-6">
                  {/* Top Competitor Domains */}
                  <div className="space-y-3">
                    <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Top Competitors
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {serpAnalysis.competitorInsights.topDomains.slice(0, 5).map((domain, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="border-slate-600 text-slate-300 bg-slate-800/50"
                        >
                          #{idx + 1} {domain}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Title Pattern Insights */}
                  <div className="space-y-3">
                    <span className="text-sm font-medium text-slate-300">Winning Title Pattern</span>
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <p className="text-sm text-primary font-medium">
                        {serpAnalysis.titlePatterns.commonStructure}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Avg length: {serpAnalysis.titlePatterns.averageLength} chars
                      </p>
                    </div>
                  </div>

                  {/* Top Modifiers */}
                  {serpAnalysis.titlePatterns.topModifiers.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-sm font-medium text-slate-300">Winning Modifiers</span>
                      <div className="flex flex-wrap gap-2">
                        {serpAnalysis.titlePatterns.topModifiers.slice(0, 6).map((modifier, idx) => (
                          <Badge 
                            key={idx} 
                            className="bg-primary/20 text-primary border-primary/30"
                          >
                            {modifier}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Keyword Clusters */}
                  <div className="space-y-3">
                    <span className="text-sm font-medium text-slate-300">Keyword Opportunities</span>
                    <div className="space-y-2">
                      {serpAnalysis.keywordClusters.secondary.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {serpAnalysis.keywordClusters.secondary.slice(0, 8).map((keyword, idx) => (
                            <Badge 
                              key={idx} 
                              variant="outline" 
                              className="border-primary/30 text-primary bg-primary/10 text-xs"
                            >
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Common Features */}
                  {serpAnalysis.competitorInsights.commonFeatures.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-sm font-medium text-slate-300">Common Features Mentioned</span>
                      <div className="flex flex-wrap gap-2">
                        {serpAnalysis.competitorInsights.commonFeatures.slice(0, 6).map((feature, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="border-slate-600 text-slate-300 bg-slate-800/50 text-xs"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DashboardCard>
            )}

            {/* AI Ranking Insights Card */}
            {generatedSEO && (
              <DashboardCard 
                title="AI Ranking Insights"
                testId="card-ai-insights"
                className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
              >
                <div className="space-y-6">
                  {/* SEO Score */}
                  {generatedSEO.seoScore && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-300">Predicted SEO Score</span>
                        <span className="text-3xl font-bold text-primary">
                          {generatedSEO.seoScore}/100
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${generatedSEO.seoScore}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Search Intent */}
                  {generatedSEO.searchIntent && (
                    <div className="space-y-3">
                      <span className="text-sm font-medium text-slate-300">Primary Search Intent</span>
                      <div>
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          {generatedSEO.searchIntent}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Suggested Keywords */}
                  {generatedSEO.suggestedKeywords && generatedSEO.suggestedKeywords.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-sm font-medium text-slate-300">Suggested Keywords</span>
                      <div className="flex flex-wrap gap-2">
                        {generatedSEO.suggestedKeywords.map((keyword, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="border-primary/30 text-primary bg-primary/10"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DashboardCard>
            )}
          </div>

          {/* Right Main Area: Optimize + Output */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mode Selector Card */}
            <DashboardCard 
              title="Optimization Mode"
              description="Choose your SEO generation strategy"
              testId="card-mode-selector"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fast Mode */}
                <button
                  onClick={() => setOptimizationMode('fast')}
                  disabled={generateSEOMutation.isPending || serpAnalysisMutation.isPending}
                  className={`relative p-5 rounded-lg border-2 transition-all duration-200 text-left hover-elevate active-elevate-2 disabled:opacity-50 ${
                    optimizationMode === 'fast'
                      ? 'border-primary bg-primary/10'
                      : 'border-slate-700 bg-slate-800/30'
                  }`}
                  data-testid="button-mode-fast"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Zap className={`w-6 h-6 shrink-0 ${optimizationMode === 'fast' ? 'text-primary' : 'text-slate-400'}`} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">Fast Mode</h4>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        AI-powered SEO using proven patterns
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                      10 credits
                    </Badge>
                    <span className="text-xs text-slate-400">2-3 sec</span>
                  </div>
                  {optimizationMode === 'fast' && (
                    <div className="absolute -top-2 -right-2">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    </div>
                  )}
                </button>

                {/* Competitive Intelligence Mode */}
                <button
                  onClick={() => setOptimizationMode('competitive')}
                  disabled={generateSEOMutation.isPending || serpAnalysisMutation.isPending}
                  className={`relative p-5 rounded-lg border-2 transition-all duration-200 text-left hover-elevate active-elevate-2 disabled:opacity-50 ${
                    optimizationMode === 'competitive'
                      ? 'border-primary bg-primary/10'
                      : 'border-slate-700 bg-slate-800/30'
                  }`}
                  data-testid="button-mode-competitive"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Trophy className={`w-6 h-6 shrink-0 ${optimizationMode === 'competitive' ? 'text-primary' : 'text-slate-400'}`} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">Competitive Intelligence</h4>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        Real-time Google SERP analysis + AI
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                      30 credits
                    </Badge>
                    <span className="text-xs text-slate-400">5-8 sec</span>
                  </div>
                  {optimizationMode === 'competitive' && (
                    <div className="absolute -top-2 -right-2">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    </div>
                  )}
                </button>
              </div>
            </DashboardCard>

            {/* Optimize Button Card */}
            <DashboardCard testId="card-optimize-button">
              <div>
                <Button
                  onClick={handleOptimize}
                  disabled={!selectedProduct || generateSEOMutation.isPending || serpAnalysisMutation.isPending}
                  className="w-full h-14 text-lg font-semibold bg-primary hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  data-testid="button-optimize"
                >
                  {serpAnalysisMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing Competitors...
                    </>
                  ) : generateSEOMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Optimizing with AI...
                    </>
                  ) : (
                    <>
                      {optimizationMode === 'competitive' ? (
                        <Trophy className="w-5 h-5 mr-2" />
                      ) : (
                        <Sparkles className="w-5 h-5 mr-2" />
                      )}
                      Optimize Product SEO
                    </>
                  )}
                </Button>
              </div>
            </DashboardCard>

            {/* Empty State - Shown when no content */}
            {!generatedSEO && !generateSEOMutation.isPending && (
              <DashboardCard testId="card-empty-state">
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="relative">
                    <Sparkles className="w-20 h-20 text-primary/50 mb-6 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Ready to Optimize Your Product SEO
                  </h3>
                  <p className="text-slate-300 max-w-lg text-base leading-relaxed">
                    Select a product above and click "Optimize Product SEO" to generate AI-powered SEO content in seconds
                  </p>
                </div>
              </DashboardCard>
            )}

            {/* Generated Content Output */}
            {generatedSEO && (
              <DashboardCard 
                title="Generated SEO Content"
                description="Review and copy your optimized content"
                testId="card-output"
                className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
              >
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 gap-2 p-1">
                      <TabsTrigger value="seo-title" data-testid="tab-seo-title" className="text-xs sm:text-sm">
                        SEO Title
                      </TabsTrigger>
                      <TabsTrigger value="description" data-testid="tab-description" className="text-xs sm:text-sm">
                        Description
                      </TabsTrigger>
                      <TabsTrigger value="meta-title" data-testid="tab-meta-title" className="text-xs sm:text-sm">
                        Meta Title
                      </TabsTrigger>
                      <TabsTrigger value="meta-desc" data-testid="tab-meta-desc" className="text-xs sm:text-sm">
                        Meta Desc
                      </TabsTrigger>
                      <TabsTrigger value="tags" data-testid="tab-tags" className="text-xs sm:text-sm">
                        Tags
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="seo-title" className="space-y-4 mt-6">
                      <div className="p-5 rounded-lg border">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="text-sm font-semibold text-primary">SEO Title</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Golden Formula: 8-12 words</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(generatedSEO.seoTitle, "SEO Title")}
                              data-testid="button-copy-seo-title"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={appliedFields.has('SEO Title') ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleApplyField('SEO Title', { seoTitle: generatedSEO.metaTitle })}
                              disabled={applyingField === 'SEO Title' || !selectedProduct?.shopifyId}
                              data-testid="button-apply-seo-title"
                              className={appliedFields.has('SEO Title') ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              {applyingField === 'SEO Title' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : appliedFields.has('SEO Title') ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <p className="text-white text-lg leading-relaxed font-medium" data-testid="text-seo-title">
                          {generatedSEO.seoTitle}
                        </p>
                        <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="font-medium">{generatedSEO.seoTitle.split(/\s+/).filter(Boolean).length} words</span>
                          {(() => {
                            const wordCount = generatedSEO.seoTitle.split(/\s+/).filter(Boolean).length;
                            if (wordCount >= 8 && wordCount <= 12) {
                              return (
                                <div className="flex items-center gap-1 text-green-400">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Optimal (8-12 words)</span>
                                </div>
                              );
                            } else if (wordCount < 8) {
                              return (
                                <div className="flex items-center gap-1 text-yellow-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Too short (need 8-12 words)</span>
                                </div>
                              );
                            } else {
                              return (
                                <div className="flex items-center gap-1 text-yellow-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Too long (need 8-12 words)</span>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="description" className="space-y-4 mt-6">
                      <div className="p-5 rounded-lg border">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="text-sm font-semibold text-primary">Product Description</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Golden Formula: 150-300 words, Title bolded 3-4x</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(generatedSEO.seoDescription.replace(/<[^>]*>/g, ''), "Description")}
                              data-testid="button-copy-description"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={appliedFields.has('Description') ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleApplyField('Description', { description: generatedSEO.seoDescription })}
                              disabled={applyingField === 'Description' || !selectedProduct?.shopifyId}
                              data-testid="button-apply-description"
                              className={appliedFields.has('Description') ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              {applyingField === 'Description' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : appliedFields.has('Description') ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div 
                          className="text-slate-200 leading-relaxed prose prose-invert prose-sm max-w-none [&_strong]:text-primary [&_strong]:font-bold" 
                          data-testid="text-description"
                          dangerouslySetInnerHTML={{ 
                            __html: DOMPurify.sanitize(generatedSEO.seoDescription, {
                              ALLOWED_TAGS: ['strong', 'b', 'br', 'p', 'ul', 'li'],
                              ALLOWED_ATTR: []
                            })
                          }}
                        />
                        <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="font-medium">
                            {generatedSEO.seoDescription.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length} words
                          </span>
                          {(() => {
                            const wordCount = generatedSEO.seoDescription.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
                            if (wordCount >= 150 && wordCount <= 300) {
                              return (
                                <div className="flex items-center gap-1 text-green-400">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Optimal (150-300 words)</span>
                                </div>
                              );
                            } else if (wordCount < 150) {
                              return (
                                <div className="flex items-center gap-1 text-yellow-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Too short (need 150-300 words)</span>
                                </div>
                              );
                            } else {
                              return (
                                <div className="flex items-center gap-1 text-yellow-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Too long (need 150-300 words)</span>
                                </div>
                              );
                            }
                          })()}
                          {(() => {
                            const strongMatches = generatedSEO.seoDescription.match(/<strong>.*?<\/strong>/gi) || [];
                            const boldCount = strongMatches.length;
                            if (boldCount >= 3 && boldCount <= 4) {
                              return (
                                <div className="flex items-center gap-1 text-green-400">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Title bolded {boldCount}x</span>
                                </div>
                              );
                            } else if (boldCount < 3) {
                              return (
                                <div className="flex items-center gap-1 text-yellow-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Title bolded {boldCount}x (need 3-4x)</span>
                                </div>
                              );
                            } else {
                              return (
                                <div className="flex items-center gap-1 text-yellow-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Title bolded {boldCount}x (need 3-4x)</span>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="meta-title" className="space-y-4 mt-6">
                      <div className="p-5 rounded-lg border">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="text-sm font-semibold text-primary">Meta Title</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Golden Formula: 50-60 characters</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(generatedSEO.metaTitle, "Meta Title")}
                              data-testid="button-copy-meta-title"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={appliedFields.has('Meta Title') ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleApplyField('Meta Title', { seoTitle: generatedSEO.metaTitle })}
                              disabled={applyingField === 'Meta Title' || !selectedProduct?.shopifyId}
                              data-testid="button-apply-meta-title"
                              className={appliedFields.has('Meta Title') ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              {applyingField === 'Meta Title' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : appliedFields.has('Meta Title') ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <p className="text-white text-lg leading-relaxed font-medium" data-testid="text-meta-title">
                          {generatedSEO.metaTitle}
                        </p>
                        <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="font-medium">{generatedSEO.metaTitle.length} characters</span>
                          {(() => {
                            const charCount = generatedSEO.metaTitle.length;
                            if (charCount >= 50 && charCount <= 60) {
                              return (
                                <div className="flex items-center gap-1 text-green-400">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Optimal (50-60 chars)</span>
                                </div>
                              );
                            } else if (charCount < 50) {
                              return (
                                <div className="flex items-center gap-1 text-yellow-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Too short (need 50-60 chars)</span>
                                </div>
                              );
                            } else {
                              return (
                                <div className="flex items-center gap-1 text-yellow-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Too long (need 50-60 chars)</span>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="meta-desc" className="space-y-4 mt-6">
                      <div className="p-5 rounded-lg border">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="text-sm font-semibold text-primary">Meta Description</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Golden Formula: 130-150 characters</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(generatedSEO.metaDescription, "Meta Description")}
                              data-testid="button-copy-meta-desc"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={appliedFields.has('Meta Description') ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleApplyField('Meta Description', { metaDescription: generatedSEO.metaDescription })}
                              disabled={applyingField === 'Meta Description' || !selectedProduct?.shopifyId}
                              data-testid="button-apply-meta-desc"
                              className={appliedFields.has('Meta Description') ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              {applyingField === 'Meta Description' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : appliedFields.has('Meta Description') ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <p className="text-slate-200 leading-relaxed" data-testid="text-meta-desc">
                          {generatedSEO.metaDescription}
                        </p>
                        <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="font-medium">{generatedSEO.metaDescription.length} characters</span>
                          {(() => {
                            const charCount = generatedSEO.metaDescription.length;
                            if (charCount >= 130 && charCount <= 150) {
                              return (
                                <div className="flex items-center gap-1 text-green-400">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Optimal (130-150 chars)</span>
                                </div>
                              );
                            } else if (charCount < 130) {
                              return (
                                <div className="flex items-center gap-1 text-yellow-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Too short (need 130-150 chars)</span>
                                </div>
                              );
                            } else {
                              return (
                                <div className="flex items-center gap-1 text-yellow-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Too long (need 130-150 chars)</span>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="tags" className="space-y-4 mt-6">
                      <div className="p-5 rounded-lg border">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <h3 className="text-sm font-semibold text-primary">Product Tags</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Golden Formula: 5-10 tags for Shopify</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(generatedSEO.keywords.join(", "), "Tags")}
                              data-testid="button-copy-tags"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={appliedFields.has('Tags') ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleApplyField('Tags', { tags: generatedSEO.keywords })}
                              disabled={applyingField === 'Tags' || !selectedProduct?.shopifyId}
                              data-testid="button-apply-tags"
                              className={appliedFields.has('Tags') ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              {applyingField === 'Tags' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : appliedFields.has('Tags') ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2" data-testid="list-tags">
                          {generatedSEO.keywords.map((tag, idx) => (
                            <Badge 
                              key={idx} 
                              className="bg-primary/20 text-primary border-primary/30 px-3 py-1.5 text-sm"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="font-medium">{generatedSEO.keywords.length} tags</span>
                          {(() => {
                            const tagCount = generatedSEO.keywords.length;
                            if (tagCount >= 5 && tagCount <= 10) {
                              return (
                                <div className="flex items-center gap-1 text-green-400">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Optimal (5-10 tags)</span>
                                </div>
                              );
                            } else if (tagCount < 5) {
                              return (
                                <div className="flex items-center gap-1 text-yellow-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Too few (need 5-10 tags)</span>
                                </div>
                              );
                            } else {
                              return (
                                <div className="flex items-center gap-1 text-yellow-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Too many (need 5-10 tags)</span>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
              </DashboardCard>
            )}

            {/* Apply to All Shopify Fields Button */}
            {generatedSEO && (
              <DashboardCard 
                testId="card-apply-all"
                className="animate-in fade-in-50 slide-in-from-bottom-4 duration-600"
              >
                <Button
                  onClick={handleApplyAllToShopify}
                  disabled={applyingField === 'all' || !selectedProduct?.shopifyId}
                  className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700 hover:shadow-2xl hover:shadow-green-600/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-apply-shopify"
                >
                  {applyingField === 'all' ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Applying to Shopify...
                    </>
                  ) : appliedFields.has('All Fields') ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Applied to Shopify
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Apply All to Shopify Product
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-slate-400 mt-3">
                  {!selectedProduct?.shopifyId 
                    ? "This product is not linked to Shopify. Import products from your Shopify store first."
                    : "Directly updates your Shopify product with all generated SEO content"
                  }
                </p>
              </DashboardCard>
            )}

            {/* Action Buttons */}
            {generatedSEO && (
              <DashboardCard 
                testId="card-actions"
                className="animate-in fade-in-50 slide-in-from-bottom-4 duration-700"
              >
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Button
                      variant="outline"
                      onClick={handleCopyAll}
                      data-testid="button-copy-all"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => saveSEOMutation.mutate()}
                      disabled={saveSEOMutation.isPending}
                      data-testid="button-save"
                    >
                      {saveSEOMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleOptimize}
                      disabled={generateSEOMutation.isPending}
                      data-testid="button-regenerate"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleExport}
                      data-testid="button-export"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
              </DashboardCard>
            )}
          </div>
        </div>
    </PageShell>
  );
}
