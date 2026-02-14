import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Zap, 
  Search, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Eye,
  ArrowRight,
  Shield,
  Brain,
  BarChart3
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/ui/standardized-layout";
import { useStoreCurrency } from "@/hooks/use-store-currency";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  imageUrl?: string;
  productType?: string;
}

interface PowerModeHealth {
  serpApiAvailable: boolean;
  openaiAvailable: boolean;
  message: string;
}

interface CompetitorInsight {
  topCompetitorTitles: string[];
  keywordGaps: string[];
  contentOpportunities: string[];
  searchIntent: string;
  difficultyScore: number;
  confidenceScore: number;
}

interface PowerModeResult {
  productId: string;
  productName: string;
  serpAnalysis: {
    query: string;
    topResults: { position: number; title: string; description: string; url: string; domain: string }[];
    keywordClusters: { primary: string; secondary: string[]; longTail: string[]; lsi: string[] };
    titlePatterns: { averageLength: number; commonStructure: string; topModifiers: string[] };
    metaPatterns: { averageLength: number; emotionalTriggers: string[] };
    competitorInsights: { totalAnalyzed: number; topDomains: string[]; commonFeatures: string[] };
  };
  optimizedContent: {
    title: string;
    metaTitle: string;
    metaDescription: string;
    productDescription: string;
  };
  competitiveInsights: CompetitorInsight;
  expectedImpact: {
    estimatedRankingImprovement: string;
    estimatedRevenueImpact: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  creditCost: number;
}

export default function PowerModePage() {
  const { toast } = useToast();
  const { currency } = useStoreCurrency();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [targetKeyword, setTargetKeyword] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<PowerModeResult | null>(null);
  const [activeTab, setActiveTab] = useState("select");

  const { data: health, isLoading: loadingHealth } = useQuery<PowerModeHealth>({
    queryKey: ['/api/power-mode/health'],
    retry: false,
  });

  const { data: products, isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const analyzeMutation = useMutation({
    mutationFn: async ({ productId, targetKeyword }: { productId: string; targetKeyword?: string }) => {
      const response = await apiRequest('POST', '/api/power-mode/analyze', { productId, targetKeyword });
      return response.json();
    },
    onSuccess: (data: PowerModeResult) => {
      setAnalysisResult(data);
      setActiveTab("results");
      toast({
        title: "Analysis Complete",
        description: "Competitive intelligence gathered successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze product",
        variant: "destructive",
      });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async ({ productId, optimizedContent, creditCost }: { productId: string; optimizedContent: any; creditCost: number }) => {
      const response = await apiRequest('POST', '/api/power-mode/execute', { productId, optimizedContent, creditCost });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Optimization Applied",
        description: `Successfully optimized product. ${data.creditsUsed} credits used.`,
      });
      setAnalysisResult(null);
      setActiveTab("select");
      setSelectedProductId("");
    },
    onError: (error: any) => {
      toast({
        title: "Execution Failed",
        description: error.message || "Failed to apply optimization",
        variant: "destructive",
      });
    },
  });

  const selectedProduct = products?.find(p => p.id === selectedProductId);
  const isHealthy = health?.serpApiAvailable && health?.openaiAvailable;

  const handleAnalyze = () => {
    if (!selectedProductId) return;
    analyzeMutation.mutate({ productId: selectedProductId, targetKeyword: targetKeyword || undefined });
  };

  const handleExecute = () => {
    if (!analysisResult) return;
    executeMutation.mutate({
      productId: analysisResult.productId,
      optimizedContent: analysisResult.optimizedContent,
      creditCost: analysisResult.creditCost,
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="w-6 h-6 text-primary" data-testid="icon-power-mode" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">Power Mode</h1>
              <p className="text-muted-foreground" data-testid="text-page-description">
                Competitive Intelligence with Real-time Google SERP Analysis + AI
              </p>
            </div>
          </div>
        </div>

        {!isHealthy && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10" data-testid="alert-unavailable">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Power Mode Unavailable</AlertTitle>
            <AlertDescription>
              {health?.message || 'Required services are not configured. Please ensure DataForSEO and OpenAI credentials are set.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card data-testid="card-feature-serp">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Search className="w-8 h-8 text-primary" />
                <div>
                  <div className="font-semibold">Real-time SERP</div>
                  <div className="text-sm text-muted-foreground">Google top 10 analysis</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-feature-ai">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="font-semibold">AI Optimization</div>
                  <div className="text-sm text-muted-foreground">GPT-4o powered rewrites</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-feature-compete">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div>
                  <div className="font-semibold">Outrank Competitors</div>
                  <div className="text-sm text-muted-foreground">Beat top-ranking pages</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-4">
            <TabsTrigger value="select" data-testid="tab-select">Select Product</TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results" disabled={!analysisResult}>
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Choose Product to Optimize
                </CardTitle>
                <CardDescription>
                  Select a product and optionally specify a target keyword for competitive analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger data-testid="select-product">
                      <SelectValue placeholder="Select a product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProduct && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex gap-4">
                        {selectedProduct.imageUrl && (
                          <img 
                            src={selectedProduct.imageUrl} 
                            alt={selectedProduct.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{selectedProduct.title}</div>
                          <div className="text-sm text-muted-foreground">{formatCurrency(parseFloat(selectedProduct.price), currency)}</div>
                          {selectedProduct.productType && (
                            <Badge variant="outline" className="mt-1">{selectedProduct.productType}</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <Label>Target Keyword (Optional)</Label>
                  <Input
                    placeholder="e.g., wireless bluetooth headphones"
                    value={targetKeyword}
                    onChange={(e) => setTargetKeyword(e.target.value)}
                    data-testid="input-target-keyword"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use the product title as the search keyword
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">5 credits</span> per analysis
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!selectedProductId || !isHealthy || analyzeMutation.isPending}
                    data-testid="button-analyze"
                  >
                    {analyzeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Analyze Competition
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            {analysisResult && (
              <div className="space-y-6" data-testid="results-container">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card data-testid="card-confidence-score">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Confidence Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-confidence-score">{analysisResult.competitiveInsights.confidenceScore}%</div>
                      <p className="text-xs text-muted-foreground">Optimization success likelihood</p>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-difficulty-score">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Difficulty Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-difficulty-score">{analysisResult.competitiveInsights.difficultyScore}</div>
                      <p className="text-xs text-muted-foreground">Competitor strength</p>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-expected-revenue">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Expected Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="stat-expected-revenue">+${analysisResult.expectedImpact.estimatedRevenueImpact.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">{analysisResult.expectedImpact.estimatedRankingImprovement}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card data-testid="card-competitor-analysis">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Competitor Analysis
                    </CardTitle>
                    <CardDescription>
                      Analyzed {analysisResult.serpAnalysis.competitorInsights.totalAnalyzed} top-ranking pages
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div data-testid="section-competitor-titles">
                      <h4 className="font-medium mb-2">Top Competitor Titles</h4>
                      <div className="space-y-2">
                        {analysisResult.competitiveInsights.topCompetitorTitles.slice(0, 3).map((title, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm" data-testid={`competitor-title-${i}`}>
                            <Badge variant="outline" className="shrink-0">#{i + 1}</Badge>
                            <span className="text-muted-foreground">{title}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div data-testid="section-keyword-gaps">
                      <h4 className="font-medium mb-2">Keyword Gaps (Missing from your title)</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.competitiveInsights.keywordGaps.map((kw, i) => (
                          <Badge key={i} variant="secondary" data-testid={`keyword-gap-${i}`}>{kw}</Badge>
                        ))}
                      </div>
                    </div>

                    <div data-testid="section-content-opportunities">
                      <h4 className="font-medium mb-2">Content Opportunities</h4>
                      <ul className="space-y-1">
                        {analysisResult.competitiveInsights.contentOpportunities.map((opp, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm" data-testid={`content-opportunity-${i}`}>
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                            <span className="text-muted-foreground">{opp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-2" data-testid="section-search-intent">
                      <span className="text-sm font-medium">Search Intent:</span>
                      <Badge>{analysisResult.competitiveInsights.searchIntent}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Optimized Content Preview
                    </CardTitle>
                    <CardDescription>
                      AI-generated content to outrank competitors
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">New Title</Label>
                      <div className="p-3 bg-muted rounded-md font-medium" data-testid="preview-new-title">
                        {analysisResult.optimizedContent.title}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Meta Title</Label>
                      <div className="p-3 bg-muted rounded-md text-sm" data-testid="preview-meta-title">
                        {analysisResult.optimizedContent.metaTitle}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Meta Description</Label>
                      <div className="p-3 bg-muted rounded-md text-sm" data-testid="preview-meta-description">
                        {analysisResult.optimizedContent.metaDescription}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Product Description</Label>
                      <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap max-h-48 overflow-y-auto" data-testid="preview-product-description">
                        {analysisResult.optimizedContent.productDescription}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-action-panel">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getRiskColor(analysisResult.expectedImpact.riskLevel)} data-testid="badge-risk-level">
                            {analysisResult.expectedImpact.riskLevel.toUpperCase()} RISK
                          </Badge>
                          <span className="text-sm text-muted-foreground" data-testid="text-credit-cost">
                            {analysisResult.creditCost} credits
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Original content saved for instant rollback
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab("select")}
                          data-testid="button-cancel"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleExecute}
                          disabled={executeMutation.isPending}
                          data-testid="button-apply-optimization"
                        >
                          {executeMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Apply Optimization
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card className="mt-6 bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-orange-500/10 shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Power Mode Guidelines</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Power Mode uses real-time Google SERP data (5 credits per analysis)</li>
                  <li>Best used for high-value products where competitive ranking matters</li>
                  <li>All changes are reversible with one-click rollback</li>
                  <li>Manual approval required for all optimizations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
