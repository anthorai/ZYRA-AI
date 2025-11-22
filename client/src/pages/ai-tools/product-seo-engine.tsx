import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GradientPageHeader } from "@/components/ui/page-hero";
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/dashboard?tab=ai-tools')}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to AI Tools
        </Button>
      </div>

      <GradientPageHeader
        icon={<Zap className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" />}
        title="Ultimate Product SEO Engine"
        subtitle="AI-powered SEO Titles, Descriptions & Meta Optimization — All in one place"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Product Loader + AI Insights */}
        <div className="lg:col-span-1 space-y-6">
          {/* Section 1: Product Loader Panel */}
          <Card className="border-cyan-500/30 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm shadow-lg shadow-cyan-500/10" data-testid="card-product-loader">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-400">
                <Target className="w-5 h-5 drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]" />
                Product Loader
              </CardTitle>
              <CardDescription className="text-slate-400">
                Select a product to optimize
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {productsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full bg-slate-700/50" />
                  <Skeleton className="h-20 w-full bg-slate-700/50" />
                </div>
              ) : (
                <>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="border-cyan-500/30 bg-slate-800/50" data-testid="select-product">
                      <SelectValue placeholder="Select a product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedProduct && (
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-cyan-500/20 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-white">{selectedProduct.name}</h4>
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                          {selectedProduct.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-3">
                        {selectedProduct.description || selectedProduct.features || "No description available"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="font-semibold text-cyan-400">${selectedProduct.price}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Section 2: AI Ranking Insights Panel */}
          {generatedSEO && (
            <Card className="border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-slate-800/80 backdrop-blur-sm shadow-lg shadow-purple-500/10 animate-in fade-in-50 slide-in-from-bottom-4 duration-500" data-testid="card-ai-insights">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-400">
                  <BarChart3 className="w-5 h-5 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
                  AI Ranking Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* SEO Score */}
                {generatedSEO.seoScore && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Predicted SEO Score</span>
                      <span className="text-2xl font-bold text-cyan-400">
                        {generatedSEO.seoScore}/100
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${generatedSEO.seoScore}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Search Intent */}
                {generatedSEO.searchIntent && (
                  <div className="space-y-1">
                    <span className="text-sm text-slate-400">Primary Search Intent</span>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {generatedSEO.searchIntent}
                    </Badge>
                  </div>
                )}

                {/* Suggested Keywords */}
                {generatedSEO.suggestedKeywords && generatedSEO.suggestedKeywords.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm text-slate-400">Suggested Keywords</span>
                    <div className="flex flex-wrap gap-2">
                      {generatedSEO.suggestedKeywords.map((keyword, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="border-cyan-500/30 text-cyan-300 bg-cyan-500/10"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 3: Optimize Button */}
          <Card className="border-cyan-500/30 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm shadow-lg shadow-cyan-500/10">
            <CardContent className="pt-6">
              <Button
                onClick={handleOptimize}
                disabled={!selectedProduct || generateSEOMutation.isPending}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:shadow-2xl hover:shadow-cyan-500/60 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
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
            </CardContent>
          </Card>

          {/* Section 4: Output Tabs */}
          {generatedSEO && (
            <Card className="border-cyan-500/30 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm shadow-lg shadow-cyan-500/10 animate-in fade-in-50 slide-in-from-bottom-4 duration-500" data-testid="card-output">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <Eye className="w-5 h-5 drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]" />
                  Generated SEO Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 gap-2 bg-slate-800/50">
                    <TabsTrigger value="seo-title" data-testid="tab-seo-title">
                      SEO Title
                    </TabsTrigger>
                    <TabsTrigger value="description" data-testid="tab-description">
                      Description
                    </TabsTrigger>
                    <TabsTrigger value="meta-title" data-testid="tab-meta-title">
                      Meta Title
                    </TabsTrigger>
                    <TabsTrigger value="meta-desc" data-testid="tab-meta-desc">
                      Meta Desc
                    </TabsTrigger>
                    <TabsTrigger value="keywords" data-testid="tab-keywords">
                      Keywords
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="seo-title" className="space-y-4 mt-6">
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-cyan-500/20">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-semibold text-cyan-400">SEO Title</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(generatedSEO.seoTitle, "SEO Title")}
                          data-testid="button-copy-seo-title"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-white text-lg leading-relaxed" data-testid="text-seo-title">
                        {generatedSEO.seoTitle}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                        <span>{generatedSEO.seoTitle.length} characters</span>
                        {generatedSEO.seoTitle.length <= 60 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="description" className="space-y-4 mt-6">
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-cyan-500/20">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-semibold text-cyan-400">Product Description (Full)</h3>
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
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-cyan-500/20">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-semibold text-cyan-400">Meta Title</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(generatedSEO.metaTitle, "Meta Title")}
                          data-testid="button-copy-meta-title"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-white text-lg leading-relaxed" data-testid="text-meta-title">
                        {generatedSEO.metaTitle}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                        <span>{generatedSEO.metaTitle.length} characters</span>
                        {generatedSEO.metaTitle.length <= 60 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="meta-desc" className="space-y-4 mt-6">
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-cyan-500/20">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-semibold text-cyan-400">Meta Description</h3>
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
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                        <span>{generatedSEO.metaDescription.length} characters</span>
                        {generatedSEO.metaDescription.length <= 160 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="keywords" className="space-y-4 mt-6">
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-cyan-500/20">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-sm font-semibold text-cyan-400">SEO Keywords</h3>
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
                            className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-3 py-1"
                          >
                            <Hash className="w-3 h-3 mr-1" />
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Section 5: Action Buttons */}
          {generatedSEO && (
            <Card className="border-cyan-500/30 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm shadow-lg shadow-cyan-500/10 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCopyAll}
                    className="flex-1 border-cyan-500/30 hover:bg-cyan-500/10"
                    data-testid="button-copy-all"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => saveSEOMutation.mutate()}
                    disabled={saveSEOMutation.isPending}
                    className="flex-1 border-purple-500/30 hover:bg-purple-500/10"
                    data-testid="button-save"
                  >
                    {saveSEOMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save to History
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOptimize}
                    disabled={generateSEOMutation.isPending}
                    className="flex-1 border-cyan-500/30 hover:bg-cyan-500/10"
                    data-testid="button-regenerate"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    className="flex-1 border-cyan-500/30 hover:bg-cyan-500/10"
                    data-testid="button-export"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Empty State */}
      {!generatedSEO && !generateSEOMutation.isPending && (
        <Card className="border-cyan-500/20 bg-gradient-to-br from-slate-900/40 to-slate-800/40 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="w-16 h-16 text-cyan-500/50 mb-4 animate-pulse drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Ready to Optimize Your Product SEO
            </h3>
            <p className="text-slate-400 max-w-md">
              Select a product above and click "Optimize Product SEO" to generate AI-powered SEO content in seconds
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
