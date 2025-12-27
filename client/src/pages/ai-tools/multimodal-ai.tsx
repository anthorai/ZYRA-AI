import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { ProductSelector, stripHtmlTags } from "@/components/product-selector";
import { 
  Brain,
  Zap,
  CheckCircle,
  Clock,
  Eye,
  RotateCcw,
  Target,
  Sparkles,
  Shield,
  Settings,
  TrendingUp,
  Image as ImageIcon,
  FileText,
  Tag,
  AlertCircle,
  Play,
  Package,
  Search,
  Users,
  Palette,
  ArrowRight,
  RefreshCw
} from "lucide-react";

interface Product {
  id: string;
  shopifyId?: string;
  name: string;
  description?: string;
  category: string;
  price: string;
  image?: string;
  features?: string;
  tags?: string;
  isOptimized?: boolean;
}

type OptimizationStrategy = 
  | "search-intent-focused"
  | "image-led-conversion"
  | "balanced-organic-growth"
  | "trust-clarity-priority";

type SEOIntensity = "light" | "balanced" | "full";

interface MultimodalAnalysis {
  productId: string;
  productName: string;
  strategySelected: OptimizationStrategy;
  strategyLabel: string;
  reasonSummary: string;
  enginesActivated: {
    seoEngine: SEOIntensity;
    brandVoiceMemory: boolean;
    templates: boolean;
    conversionOptimization: boolean;
  };
  signals: {
    imageContentAlignment: number;
    contentIntentAlignment: number;
    overOptimizationRisk: "low" | "medium" | "high";
    searchIntent: "informational" | "commercial" | "transactional";
  };
  appliedChanges?: {
    title?: string;
    description?: string;
    metaTitle?: string;
    metaDescription?: string;
    tags?: string[];
  };
  rollbackId?: string;
}

interface BulkMultimodalResult {
  success: boolean;
  totalProducts: number;
  optimized: number;
  skipped: number;
  results: MultimodalAnalysis[];
}

const strategyDescriptions: Record<OptimizationStrategy, { label: string; description: string; icon: typeof Search }> = {
  "search-intent-focused": {
    label: "Search-Intent Focused",
    description: "Optimizes for matching user search queries and Google's understanding of search intent",
    icon: Search
  },
  "image-led-conversion": {
    label: "Image-Led Conversion",
    description: "Leverages strong visual signals to drive purchases when images tell the story",
    icon: ImageIcon
  },
  "balanced-organic-growth": {
    label: "Balanced Organic Growth",
    description: "Harmonizes SEO, conversion, and brand voice for sustainable rankings",
    icon: TrendingUp
  },
  "trust-clarity-priority": {
    label: "Trust & Clarity Priority",
    description: "Emphasizes clear messaging and trust signals for hesitant buyers",
    icon: Shield
  }
};

export default function MultimodalAI() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [analysisResults, setAnalysisResults] = useState<MultimodalAnalysis[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const analyzeAndApplyMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const response = await apiRequest("POST", "/api/multimodal/analyze-and-apply", {
        productIds,
        autoApply: true
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to analyze products");
      }
      return response.json();
    },
    onSuccess: (result: BulkMultimodalResult) => {
      setAnalysisResults(result.results);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/history'] });
      
      toast({
        title: "Optimization Complete",
        description: `Applied optimizations to ${result.optimized} of ${result.totalProducts} products`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Optimization Failed",
        description: error.message || "Failed to analyze and apply optimizations",
        variant: "destructive",
      });
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: async (rollbackId: string) => {
      const response = await apiRequest("POST", `/api/products/history/rollback/${rollbackId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to rollback changes");
      }
      return response.json();
    },
    onSuccess: (_, rollbackId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/history'] });
      
      setAnalysisResults(prev => prev.filter(r => r.rollbackId !== rollbackId));
      
      toast({
        title: "Changes Reverted",
        description: "Product has been restored to its previous state",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rollback Failed",
        description: error.message || "Failed to revert changes",
        variant: "destructive",
      });
    },
  });

  const handleAnalyzeProduct = () => {
    if (!selectedProductId) {
      toast({
        title: "No Product Selected",
        description: "Please select a product to analyze",
        variant: "destructive",
      });
      return;
    }
    analyzeAndApplyMutation.mutate([selectedProductId]);
  };

  const handleBulkAnalyze = () => {
    const eligibleProducts = products.filter(p => !p.isOptimized).slice(0, 10);
    if (eligibleProducts.length === 0) {
      toast({
        title: "No Eligible Products",
        description: "All products are already optimized or no products available",
        variant: "destructive",
      });
      return;
    }
    setIsBulkMode(true);
    analyzeAndApplyMutation.mutate(eligibleProducts.map(p => p.id));
  };

  const handleRollback = (rollbackId: string) => {
    rollbackMutation.mutate(rollbackId);
  };

  const getStrategyBadgeClass = (strategy: OptimizationStrategy): string => {
    switch (strategy) {
      case "search-intent-focused":
        return "bg-blue-500/20 text-blue-300";
      case "image-led-conversion":
        return "bg-purple-500/20 text-purple-300";
      case "balanced-organic-growth":
        return "bg-green-500/20 text-green-300";
      case "trust-clarity-priority":
        return "bg-amber-500/20 text-amber-300";
      default:
        return "bg-slate-500/20 text-slate-300";
    }
  };

  const getSEOIntensityBadge = (intensity: SEOIntensity) => {
    switch (intensity) {
      case "light":
        return <Badge className="bg-slate-500/20 text-slate-300">Light</Badge>;
      case "balanced":
        return <Badge className="bg-blue-500/20 text-blue-300">Balanced</Badge>;
      case "full":
        return <Badge className="bg-green-500/20 text-green-300">Full</Badge>;
    }
  };

  const unoptimizedCount = products.filter(p => !p.isOptimized).length;

  return (
    <PageShell
      title="Multimodal AI"
      subtitle="Intelligent optimization that analyzes images, content, and context together"
      backTo="/dashboard?tab=ai-tools"
    >
      {/* System Philosophy */}
      <DashboardCard
        title="Multimodal Intelligence Layer"
        description="Automatically selects the optimal organic optimization strategy for your products"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Brain className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">
                Multimodal AI analyzes product images, content, and store context together to automatically 
                apply the most effective organic optimization strategy - while keeping every change reversible with rollback.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">SEO Executes</p>
                <p className="text-xs text-muted-foreground truncate">Applies ranking strategies</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">Multimodal Decides</p>
                <p className="text-xs text-muted-foreground truncate">Selects best strategy</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">Rollback Protects</p>
                <p className="text-xs text-muted-foreground truncate">Instant revert available</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Product Selection */}
      <DashboardCard
        title="Select Product"
        description="Choose a product for intelligent multimodal analysis and optimization"
        headerAction={
          <Button
            onClick={handleBulkAnalyze}
            disabled={analyzeAndApplyMutation.isPending || unoptimizedCount === 0}
            variant="outline"
            data-testid="button-bulk-analyze"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Optimize All ({unoptimizedCount})
          </Button>
        }
      >
        <div className="space-y-4">
          <ProductSelector
            value={selectedProductId}
            onSelect={(product) => {
              if (product) {
                setSelectedProductId(product.id);
                setIsBulkMode(false);
              } else {
                setSelectedProductId("");
              }
            }}
            placeholder="Select a product for multimodal analysis..."
          />
          
          <Button
            onClick={handleAnalyzeProduct}
            disabled={!selectedProductId || analyzeAndApplyMutation.isPending}
            className="w-full"
            data-testid="button-analyze-apply"
          >
            {analyzeAndApplyMutation.isPending ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Analyzing & Applying...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Analyze & Apply Optimization
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            No manual input required. AI automatically collects and analyzes all product signals.
          </p>
        </div>
      </DashboardCard>

      {/* Loading State */}
      {analyzeAndApplyMutation.isPending && (
        <DashboardCard>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-72" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>Analyzing product images, content, and store context...</p>
              <p className="text-xs mt-1">Selecting optimal optimization strategy</p>
            </div>
          </div>
        </DashboardCard>
      )}

      {/* Results */}
      {analysisResults.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-semibold">
              {isBulkMode ? `Optimized ${analysisResults.length} Products` : "Optimization Applied"}
            </h2>
          </div>

          {analysisResults.map((result) => (
            <DashboardCard key={result.productId} className="border-2 border-primary/20">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Package className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <h3 className="font-semibold text-lg truncate">{result.productName}</h3>
                      <Badge className={getStrategyBadgeClass(result.strategySelected)}>
                        {result.strategyLabel}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {result.reasonSummary}
                    </p>
                  </div>
                  
                  {result.rollbackId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRollback(result.rollbackId!)}
                      disabled={rollbackMutation.isPending}
                      className="flex-shrink-0"
                      data-testid={`button-rollback-${result.productId}`}
                    >
                      {rollbackMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Revert Changes
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Engines Activated */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Engines Activated
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Search className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium">SEO Engine</span>
                      </div>
                      {getSEOIntensityBadge(result.enginesActivated.seoEngine)}
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium">Brand Voice</span>
                      </div>
                      <Badge className={result.enginesActivated.brandVoiceMemory ? "bg-green-500/20 text-green-300" : "bg-slate-500/20 text-slate-400"}>
                        {result.enginesActivated.brandVoiceMemory ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium">Templates</span>
                      </div>
                      <Badge className={result.enginesActivated.templates ? "bg-green-500/20 text-green-300" : "bg-slate-500/20 text-slate-400"}>
                        {result.enginesActivated.templates ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium">Conversion</span>
                      </div>
                      <Badge className={result.enginesActivated.conversionOptimization ? "bg-green-500/20 text-green-300" : "bg-slate-500/20 text-slate-400"}>
                        {result.enginesActivated.conversionOptimization ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Signal Analysis */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    Signal Analysis
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground mb-1">Image-Content Alignment</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${result.signals.imageContentAlignment}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{result.signals.imageContentAlignment}%</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground mb-1">Content-Intent Alignment</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${result.signals.contentIntentAlignment}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{result.signals.contentIntentAlignment}%</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground mb-1">Over-Optimization Risk</p>
                      <Badge className={
                        result.signals.overOptimizationRisk === "low" ? "bg-green-500/20 text-green-300" :
                        result.signals.overOptimizationRisk === "medium" ? "bg-amber-500/20 text-amber-300" :
                        "bg-red-500/20 text-red-300"
                      }>
                        {result.signals.overOptimizationRisk.charAt(0).toUpperCase() + result.signals.overOptimizationRisk.slice(1)}
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground mb-1">Search Intent</p>
                      <Badge className="bg-blue-500/20 text-blue-300">
                        {result.signals.searchIntent.charAt(0).toUpperCase() + result.signals.searchIntent.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Applied Changes Preview */}
                {result.appliedChanges && (
                  <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      Changes Applied
                    </h4>
                    <div className="space-y-2 text-sm">
                      {result.appliedChanges.title && (
                        <div>
                          <span className="text-muted-foreground">Title:</span>{" "}
                          <span className="text-foreground">{result.appliedChanges.title}</span>
                        </div>
                      )}
                      {result.appliedChanges.metaTitle && (
                        <div>
                          <span className="text-muted-foreground">Meta Title:</span>{" "}
                          <span className="text-foreground">{result.appliedChanges.metaTitle}</span>
                        </div>
                      )}
                      {result.appliedChanges.tags && result.appliedChanges.tags.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground">Tags:</span>
                          <div className="flex flex-wrap gap-1">
                            {result.appliedChanges.tags.slice(0, 5).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {result.appliedChanges.tags.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{result.appliedChanges.tags.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DashboardCard>
          ))}
        </div>
      )}

      {/* Optimization Strategies Reference */}
      <DashboardCard
        title="Available Strategies"
        description="Multimodal AI automatically selects the best strategy based on your product signals"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(strategyDescriptions).map(([key, strategy]) => {
            const Icon = strategy.icon;
            return (
              <div key={key} className="p-4 rounded-lg border hover-elevate">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm">{strategy.label}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {strategy.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DashboardCard>

      {/* Safety Information */}
      <DashboardCard className="bg-gradient-to-br from-green-900/10 to-emerald-900/10 border-green-500/20">
        <div className="flex items-start gap-4">
          <Shield className="w-6 h-6 text-green-400 flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-2">Rollback Protection</h3>
            <p className="text-sm text-muted-foreground">
              All optimizations are automatically saved with a snapshot of the original content. 
              Use the "Revert Changes" button on any optimization to instantly restore the previous version. 
              Your product data is always protected.
            </p>
          </div>
        </div>
      </DashboardCard>
    </PageShell>
  );
}
