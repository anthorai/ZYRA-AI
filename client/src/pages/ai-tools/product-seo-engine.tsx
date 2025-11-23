import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  BarChart3
} from "lucide-react";

interface Product {
  id: string;
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

export default function ProductSeoEngine() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [generatedSEO, setGeneratedSEO] = useState<SEOOutput | null>(null);
  const [activeTab, setActiveTab] = useState("seo-title");

  // Fetch user's products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

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

  const handleOptimize = () => {
    if (!selectedProduct) {
      toast({
        title: "No Product Selected",
        description: "Please select a product first",
        variant: "destructive",
      });
      return;
    }

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
                          {selectedProduct.description || selectedProduct.features || "No description available"}
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
            {/* Optimize Button Card */}
            <DashboardCard testId="card-optimize-button">
              <div>
                <Button
                  onClick={handleOptimize}
                  disabled={!selectedProduct || generateSEOMutation.isPending}
                  className="w-full h-14 text-lg font-semibold bg-primary hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  data-testid="button-optimize"
                >
                  {generateSEOMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Optimizing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
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
                      <TabsTrigger value="keywords" data-testid="tab-keywords" className="text-xs sm:text-sm">
                        Keywords
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="seo-title" className="space-y-4 mt-6">
                      <div className="p-5 rounded-lg border">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="text-sm font-semibold text-primary">SEO Title</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(generatedSEO.seoTitle, "SEO Title")}
                            data-testid="button-copy-seo-title"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-white text-lg leading-relaxed font-medium" data-testid="text-seo-title">
                          {generatedSEO.seoTitle}
                        </p>
                        <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-medium">{generatedSEO.seoTitle.length} characters</span>
                          {generatedSEO.seoTitle.length <= 60 ? (
                            <div className="flex items-center gap-1 text-green-400">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Optimal length</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-yellow-400">
                              <AlertCircle className="w-4 h-4" />
                              <span>Too long</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="description" className="space-y-4 mt-6">
                      <div className="p-5 rounded-lg border">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="text-sm font-semibold text-primary">Product Description (Full)</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(generatedSEO.seoDescription, "Description")}
                            data-testid="button-copy-description"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <div 
                          className="text-slate-200 leading-relaxed whitespace-pre-line" 
                          data-testid="text-description"
                        >
                          {generatedSEO.seoDescription}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="meta-title" className="space-y-4 mt-6">
                      <div className="p-5 rounded-lg border">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="text-sm font-semibold text-primary">Meta Title</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(generatedSEO.metaTitle, "Meta Title")}
                            data-testid="button-copy-meta-title"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-white text-lg leading-relaxed font-medium" data-testid="text-meta-title">
                          {generatedSEO.metaTitle}
                        </p>
                        <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-medium">{generatedSEO.metaTitle.length} characters</span>
                          {generatedSEO.metaTitle.length <= 60 ? (
                            <div className="flex items-center gap-1 text-green-400">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Optimal length</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-yellow-400">
                              <AlertCircle className="w-4 h-4" />
                              <span>Too long</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="meta-desc" className="space-y-4 mt-6">
                      <div className="p-5 rounded-lg border">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="text-sm font-semibold text-primary">Meta Description</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(generatedSEO.metaDescription, "Meta Description")}
                            data-testid="button-copy-meta-desc"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-slate-200 leading-relaxed" data-testid="text-meta-desc">
                          {generatedSEO.metaDescription}
                        </p>
                        <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-medium">{generatedSEO.metaDescription.length} characters</span>
                          {generatedSEO.metaDescription.length <= 160 ? (
                            <div className="flex items-center gap-1 text-green-400">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Optimal length</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-yellow-400">
                              <AlertCircle className="w-4 h-4" />
                              <span>Too long</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="keywords" className="space-y-4 mt-6">
                      <div className="p-5 rounded-lg border">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <h3 className="text-sm font-semibold text-primary">SEO Keywords</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(generatedSEO.keywords.join(", "), "Keywords")}
                            data-testid="button-copy-keywords"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2" data-testid="list-keywords">
                          {generatedSEO.keywords.map((keyword, idx) => (
                            <Badge 
                              key={idx} 
                              className="bg-primary/20 text-primary border-primary/30 px-3 py-1.5 text-sm"
                            >
                              <Hash className="w-3 h-3 mr-1" />
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
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
