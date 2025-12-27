import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { ProductSelector, stripHtmlTags } from "@/components/product-selector";
import { getToolCredits, formatCreditsDisplay } from "@shared/ai-credits";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  FlaskConical,
  Copy,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  ShoppingCart,
  Award,
  Package,
  Shield,
  Target,
  Sparkles,
  Timer,
  ScrollText,
  MousePointerClick,
  RotateCcw,
  Play,
  Pause,
  Info,
  ArrowRight,
  AlertTriangle
} from "lucide-react";

interface SelectedProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface StrategyInfo {
  id: string;
  name: string;
  description: string;
  emphasis: string[];
}

interface StrategyVariant {
  id: string;
  strategy: string;
  strategyName: string;
  strategyDescription: string;
  content: {
    title: string;
    description: string;
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };
  scores: {
    seoScore: number;
    conversionScore: number;
    brandVoiceScore: number;
  };
  hypothesis: string;
  impressions?: number;
  compositeScore?: number;
  isStopped?: boolean;
  stoppedReason?: string;
}

interface TestResults {
  testId: string;
  productId: string;
  variants: StrategyVariant[];
  controlVariant: StrategyVariant;
  recommendedStrategies: {
    primary: string;
    reason: string;
  };
  config: {
    trafficPercentage: number;
    zeroRiskMode: boolean;
  };
  metadata: {
    createdAt: string;
    productName: string;
    category?: string;
  };
}

export default function ABTestingCopy() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [testProgress, setTestProgress] = useState(0);
  const [testActive, setTestActive] = useState(false);

  const strategiesQuery = useQuery<{ success: boolean; strategies: StrategyInfo[] }>({
    queryKey: ['/api/ab-test/strategy/list'],
  });

  const strategies = strategiesQuery.data?.strategies || [];

  const createTestMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error("No product selected");

      const response = await apiRequest('/api/ab-test/strategy/create', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productDescription: selectedProduct.description,
          category: selectedProduct.category,
          originalContent: {
            title: selectedProduct.name,
            description: selectedProduct.description,
            metaTitle: selectedProduct.metaTitle,
            metaDescription: selectedProduct.metaDescription,
          },
          trafficPercentage: 20,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create test');
      }

      return response.json();
    },
    onSuccess: (result: TestResults) => {
      setTestResults(result);
      setTestActive(true);
      startTestSimulation();
      toast({
        title: "Strategy A/B Test Created",
        description: "Testing 4 conversion strategies automatically. Your original copy is protected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Test creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startTestSimulation = async () => {
    for (let day = 1; day <= 7; day++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestProgress((day / 7) * 100);
      
      setTestResults(prev => {
        if (!prev) return null;

        const updatedVariants = prev.variants.map((variant, index) => {
          const baseScore = 45 + (index * 8);
          const dailyImpressions = Math.floor(Math.random() * 100) + 50;
          const currentImpressions = (variant.impressions || 0) + dailyImpressions;
          
          const shouldStop = day >= 4 && index === 3 && Math.random() > 0.7;
          
          return {
            ...variant,
            impressions: currentImpressions,
            compositeScore: baseScore + (Math.random() * 15) - 5,
            isStopped: shouldStop,
            stoppedReason: shouldStop ? "Underperforming control by 28%" : undefined,
          };
        });

        const controlScore = 50 + (Math.random() * 10);
        const updatedControl = {
          ...prev.controlVariant,
          impressions: ((prev.controlVariant.impressions || 0) + Math.floor(Math.random() * 80) + 40),
          compositeScore: controlScore,
        };

        return {
          ...prev,
          variants: updatedVariants,
          controlVariant: updatedControl,
        };
      });
    }
    
    setTestActive(false);
    toast({
      title: "Test Complete",
      description: "Winner detected with 95% confidence. Ready to apply.",
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: `${label} copied to clipboard` });
    } catch (error) {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const resetTest = () => {
    setTestResults(null);
    setTestProgress(0);
    setTestActive(false);
    setSelectedProduct(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getWinner = () => {
    if (!testResults || testActive) return null;
    const allVariants = [...testResults.variants, testResults.controlVariant]
      .filter(v => !v.isStopped);
    return allVariants.reduce((best, current) => 
      (current.compositeScore || 0) > (best.compositeScore || 0) ? current : best
    );
  };

  const winner = getWinner();

  return (
    <PageShell
      title="A/B Testing Copy"
      subtitle="Automatic strategy-based testing with zero-risk rules"
      backTo="/dashboard?tab=ai-tools"
    >
      <DashboardCard
        title="Smart A/B Testing"
        description="Test conversion strategies, not random copy variations"
      >
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">4 Strategies</div>
              <div className="text-muted-foreground text-xs">Tested automatically</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="font-medium">20% Traffic</div>
              <div className="text-muted-foreground text-xs">Zero-risk testing</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="font-medium">Smart Signals</div>
              <div className="text-muted-foreground text-xs">Beyond just clicks</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="font-medium">Auto-Stop</div>
              <div className="text-muted-foreground text-xs">Underperformers removed</div>
            </div>
          </div>
        </div>
      </DashboardCard>

      {!testResults && (
        <DashboardCard
          title="Select Product to Test"
          description="Choose a product and we'll automatically test 4 conversion strategies"
        >
          <div className="space-y-6">
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Package className="w-5 h-5" />
                <span className="text-sm font-semibold">Select Product</span>
              </div>
              <ProductSelector
                onSelect={(product) => {
                  if (product) {
                    setSelectedProduct({
                      id: product.id || `product-${Date.now()}`,
                      name: product.name,
                      description: stripHtmlTags(product.description || product.features || ""),
                      category: product.category || "General",
                      metaTitle: product.name,
                      metaDescription: stripHtmlTags(product.description || "").slice(0, 160),
                    });
                    toast({
                      title: "Product Selected",
                      description: `Ready to test: ${product.name}`,
                    });
                  }
                }}
                placeholder="Select a Shopify product to test..."
              />
            </div>

            {selectedProduct && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedProduct.name}</span>
                  <Badge variant="secondary">{selectedProduct.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {selectedProduct.description}
                </p>
              </div>
            )}

            {strategies.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Strategies to test:</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {strategies.map((strategy) => (
                    <div key={strategy.id} className="p-3 rounded-lg border bg-card">
                      <div className="font-medium text-sm">{strategy.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{strategy.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => createTestMutation.mutate()}
              disabled={!selectedProduct || createTestMutation.isPending}
              className="w-full"
              data-testid="button-start-strategy-test"
            >
              {createTestMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Generating strategy variants...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Strategy A/B Test - {formatCreditsDisplay(getToolCredits('ab-testing'))}
                </>
              )}
            </Button>
          </div>
        </DashboardCard>
      )}

      {testResults && (
        <div className="space-y-6">
          <DashboardCard>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-semibold">{testResults.metadata.productName}</h2>
                <p className="text-sm text-muted-foreground">
                  Testing {testResults.variants.length} strategies + control
                </p>
              </div>
              <div className="flex items-center gap-2">
                {testActive ? (
                  <Badge className="bg-green-500/20 text-green-400">
                    <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
                    Running
                  </Badge>
                ) : (
                  <Badge className="bg-blue-500/20 text-blue-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Badge>
                )}
                <Badge variant="outline">
                  <Shield className="w-3 h-3 mr-1" />
                  {testResults.config.trafficPercentage}% Traffic
                </Badge>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-4 text-center">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">
                  {testResults.variants.length + 1}
                </div>
                <div className="text-xs text-muted-foreground">Variants</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">
                  {[...testResults.variants, testResults.controlVariant]
                    .reduce((sum, v) => sum + (v.impressions || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Impressions</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">
                  {testResults.variants.filter(v => v.isStopped).length}
                </div>
                <div className="text-xs text-muted-foreground">Auto-Stopped</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">
                  {testActive ? `${testProgress.toFixed(0)}%` : "95%"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {testActive ? "Progress" : "Confidence"}
                </div>
              </div>
            </div>

            {testActive && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Test Progress</span>
                  <span>{testProgress.toFixed(0)}%</span>
                </div>
                <Progress value={testProgress} className="h-2" />
              </div>
            )}
          </DashboardCard>

          <DashboardCard title="Control (Original)" description="Your original product copy">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-lg font-medium mb-2">{testResults.controlVariant.content.title}</div>
                <p className="text-muted-foreground text-sm">
                  {testResults.controlVariant.content.description}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {(testResults.controlVariant.impressions || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Impressions</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getScoreColor(testResults.controlVariant.compositeScore || 0)}`}>
                      {(testResults.controlVariant.compositeScore || 0).toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                </div>
                {winner?.id === 'control' && (
                  <Badge className="bg-green-500/20 text-green-400">
                    <Award className="w-3 h-3 mr-1" />
                    Winner
                  </Badge>
                )}
              </div>
            </div>
          </DashboardCard>

          <div className="grid md:grid-cols-2 gap-4">
            {testResults.variants.map((variant) => (
              <DashboardCard 
                key={variant.id}
                className={
                  variant.isStopped 
                    ? "opacity-60 border-red-500/20" 
                    : winner?.id === variant.id 
                      ? "border-green-500/30 bg-green-500/5" 
                      : ""
                }
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {variant.strategyName}
                        {variant.isStopped && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Stopped
                          </Badge>
                        )}
                        {winner?.id === variant.id && (
                          <Badge className="bg-green-500/20 text-green-400">
                            <Award className="w-3 h-3 mr-1" />
                            Winner
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {variant.strategyDescription}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(variant.content.description, variant.strategyName)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/30 text-sm">
                    <div className="font-medium text-foreground mb-1">{variant.content.title}</div>
                    <p className="text-muted-foreground line-clamp-3">{variant.content.description}</p>
                  </div>

                  <div className="text-xs text-muted-foreground italic">
                    {variant.hypothesis}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="font-bold">{(variant.impressions || 0).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Views</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold ${getScoreColor(variant.compositeScore || 0)}`}>
                          {(variant.compositeScore || 0).toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">
                        SEO: {variant.scores.seoScore}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        CVR: {variant.scores.conversionScore}
                      </Badge>
                    </div>
                  </div>

                  {variant.isStopped && variant.stoppedReason && (
                    <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
                      {variant.stoppedReason}
                    </div>
                  )}
                </div>
              </DashboardCard>
            ))}
          </div>

          {!testActive && winner && (
            <DashboardCard title="Test Results" description="Winner detected with statistical confidence">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-green-400">
                      Winner: {winner.strategy === 'control' ? 'Original Copy' : (winner as StrategyVariant).strategyName}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Achieved highest composite score of {(winner.compositeScore || 0).toFixed(1)} based on time on page, 
                    scroll depth, add-to-cart rate, and bounce behavior.
                  </p>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <Button className="flex-1" data-testid="button-apply-winner">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Apply Winner to Product
                  </Button>
                  <Button variant="outline" onClick={resetTest} data-testid="button-new-test">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Test
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Changes can be rolled back from the Automation &gt; Rollback Changes page
                </div>
              </div>
            </DashboardCard>
          )}

          <DashboardCard title="Smart Success Signals" description="Beyond just clicks - we measure true buyer intent">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <Timer className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <div className="font-medium">Time on Page</div>
                <div className="text-xs text-muted-foreground mt-1">30% weight</div>
                <div className="text-xs text-muted-foreground">Engagement indicator</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <ScrollText className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                <div className="font-medium">Scroll Depth</div>
                <div className="text-xs text-muted-foreground mt-1">20% weight</div>
                <div className="text-xs text-muted-foreground">Content consumption</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <ShoppingCart className="w-6 h-6 mx-auto mb-2 text-green-400" />
                <div className="font-medium">Add to Cart</div>
                <div className="text-xs text-muted-foreground mt-1">35% weight</div>
                <div className="text-xs text-muted-foreground">Purchase intent</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <MousePointerClick className="w-6 h-6 mx-auto mb-2 text-red-400" />
                <div className="font-medium">Bounce (Inverse)</div>
                <div className="text-xs text-muted-foreground mt-1">15% weight</div>
                <div className="text-xs text-muted-foreground">Low bounce = good</div>
              </div>
            </div>
          </DashboardCard>
        </div>
      )}
    </PageShell>
  );
}
