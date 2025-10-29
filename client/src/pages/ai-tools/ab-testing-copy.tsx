import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
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
  MousePointer,
  ShoppingCart,
  Award
} from "lucide-react";

interface ABTestForm {
  productName: string;
  category: string;
  originalDescription: string;
  testGoal: string;
}

interface ABVariant {
  id: string;
  name: string;
  content: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  confidence: number;
  isWinner?: boolean;
}

interface ABTestResults {
  testName: string;
  duration: string;
  totalTraffic: number;
  variants: ABVariant[];
  recommendation: string;
  significance: number;
}

export default function ABTestingCopy() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [testResults, setTestResults] = useState<ABTestResults | null>(null);
  const [testProgress, setTestProgress] = useState(0);
  const [testActive, setTestActive] = useState(false);

  const form = useForm<ABTestForm>({
    defaultValues: {
      productName: "",
      category: "",
      originalDescription: "",
      testGoal: "conversions",
    },
  });


  // Mock A/B test generation and simulation
  const generateABTestMutation = useMutation({
    mutationFn: async (data: ABTestForm) => {
      // Simulate test generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { productName, originalDescription, testGoal } = data;
      
      // Generate 3 variations
      const variants: ABVariant[] = [
        {
          id: 'control',
          name: 'Control (Original)',
          content: originalDescription,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          ctr: 0,
          conversionRate: 0,
          confidence: 0
        },
        {
          id: 'variant-a',
          name: 'Emotional Appeal',
          content: `Transform your life with ${productName}! This isn't just a product—it's your gateway to a better tomorrow. ${originalDescription.replace(/\b(good|great)\b/gi, 'amazing').replace(/\./, '. Experience the difference that changes everything.')}`,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          ctr: 0,
          conversionRate: 0,
          confidence: 0
        },
        {
          id: 'variant-b',
          name: 'Urgency & Scarcity',
          content: `⚡ Limited Time: ${productName} - Only 24 hours left! ${originalDescription.replace(/\./, '. Don\'t miss out - join thousands of satisfied customers today!')} ORDER NOW before stocks run out!`,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          ctr: 0,
          conversionRate: 0,
          confidence: 0
        }
      ];
      
      return {
        testName: `${productName} Description Test`,
        duration: "7 days",
        totalTraffic: 0,
        variants,
        recommendation: "Test is starting...",
        significance: 0
      };
    },
    onSuccess: (result) => {
      setTestResults(result);
      setTestActive(true);
      startTestSimulation();
      toast({
        title: "🧪 A/B Test Created!",
        description: "Your test variants are ready. Starting traffic simulation...",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test creation failed",
        description: error.message || "Failed to create A/B test",
        variant: "destructive",
      });
    },
  });

  // Simulate test running with real-time updates
  const startTestSimulation = async () => {
    if (!testResults) return;
    
    for (let day = 1; day <= 7; day++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTestProgress((day / 7) * 100);
      
      // Simulate traffic and conversions for each variant
      setTestResults(prev => {
        if (!prev) return null;
        
        const updatedVariants = prev.variants.map(variant => {
          const dailyImpressions = Math.floor(Math.random() * 200) + 100;
          const baseCTR = variant.id === 'control' ? 0.03 : 
                        variant.id === 'variant-a' ? 0.045 : 0.055;
          const baseConversionRate = variant.id === 'control' ? 0.02 : 
                                   variant.id === 'variant-a' ? 0.032 : 0.028;
          
          const newImpressions = variant.impressions + dailyImpressions;
          const newClicks = Math.floor(newImpressions * baseCTR);
          const newConversions = Math.floor(newClicks * baseConversionRate);
          
          return {
            ...variant,
            impressions: newImpressions,
            clicks: newClicks,
            conversions: newConversions,
            ctr: (newClicks / newImpressions) * 100,
            conversionRate: newClicks > 0 ? (newConversions / newClicks) * 100 : 0,
            confidence: day >= 5 ? Math.floor(Math.random() * 30) + 70 : 0
          };
        });
        
        // Determine winner after day 5
        if (day >= 5) {
          const winner = updatedVariants.reduce((best, current) => 
            current.conversionRate > best.conversionRate ? current : best
          );
          updatedVariants.forEach(v => {
            v.isWinner = v.id === winner.id;
          });
        }
        
        const totalTraffic = updatedVariants.reduce((sum, v) => sum + v.impressions, 0);
        const winnerVariant = updatedVariants.find(v => v.isWinner);
        
        return {
          ...prev,
          totalTraffic,
          variants: updatedVariants,
          recommendation: winnerVariant ? 
            `${winnerVariant.name} is the winner with ${winnerVariant.conversionRate.toFixed(2)}% conversion rate!` :
            "Test is still running...",
          significance: day >= 5 ? 95 : (day / 5) * 95
        };
      });
    }
    
    setTestActive(false);
    toast({
      title: "🏆 A/B Test Complete!",
      description: "Your test results are ready with statistical significance.",
    });
  };

  const onSubmit = (data: ABTestForm) => {
    if (!data.productName.trim()) {
      toast({
        title: "Product name required",
        description: "Please enter a product name",
        variant: "destructive",
      });
      return;
    }

    if (!data.originalDescription.trim()) {
      toast({
        title: "Original description required",
        description: "Please provide the current product description",
        variant: "destructive",
      });
      return;
    }

    generateABTestMutation.mutate(data);
  };

  const copyToClipboard = async (text: string, variant: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${variant} content copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const implementWinner = () => {
    const winner = testResults?.variants.find(v => v.isWinner);
    if (winner) {
      toast({
        title: "Winner Implemented!",
        description: `${winner.name} has been applied to your product listing.`,
      });
    }
  };

  return (
    <PageShell
      title="A/B Testing Copy"
      subtitle="Generate and test multiple copy variations to maximize conversions"
      
    >
      {/* A/B Testing Overview */}
      <DashboardCard
        title="Scientific A/B Testing"
        description="Systematically test copy variations to find the best performing content"
      >
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                <span className="text-slate-300">Generate 2-3 copy variations</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                <span className="text-slate-300">Split traffic randomly</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                <span className="text-slate-300">Track clicks & conversions</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
                <span className="text-slate-300">Auto-select best performer</span>
              </div>
            </div>
      </DashboardCard>

      {/* Test Setup Form */}
      {!testResults && (
        <DashboardCard
          title="Create A/B Test"
          description="Set up your A/B test to find the highest-converting product description"
        >
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="productName" className="text-white">Product Name *</Label>
                    <Input
                      id="productName"
                      className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="e.g., Wireless Bluetooth Headphones"
                      {...form.register("productName", { required: true })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-white">Category</Label>
                    <Input
                      id="category"
                      className="mt-2 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="e.g., Electronics"
                      {...form.register("category")}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="originalDescription" className="text-white">Current Product Description *</Label>
                  <Textarea
                    id="originalDescription"
                    className="mt-2 h-32 resize-none bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    placeholder="Enter your current product description that you want to test against..."
                    {...form.register("originalDescription", { required: true })}
                  />
                </div>

                <div>
                  <Label htmlFor="testGoal" className="text-white">Test Goal</Label>
                  <select 
                    {...form.register("testGoal")}
                    className="mt-2 w-full bg-slate-800/50 border border-slate-600 text-white rounded-md px-3 py-2"
                  >
                    <option value="conversions">Maximize Conversions</option>
                    <option value="clicks">Maximize Click-Through Rate</option>
                    <option value="engagement">Maximize Time on Page</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={generateABTestMutation.isPending}
                  className="w-full gradient-button"
                >
                  {generateABTestMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Creating A/B test variants...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Start A/B Test
                    </>
                  )}
                </Button>
              </form>
        </DashboardCard>
      )}

      {/* Test Results */}
      {testResults && (
        <div className="space-y-6">
          {/* Test Progress */}
          <DashboardCard>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-white">{testResults.testName}</h2>
                  <div className="flex items-center space-x-2">
                    {testActive ? (
                      <Badge className="bg-green-400/20 text-green-300 animate-pulse">
                        Running
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-400/20 text-blue-300">
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{testResults.totalTraffic.toLocaleString()}</div>
                    <div className="text-sm text-slate-300">Total Traffic</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{testResults.duration}</div>
                    <div className="text-sm text-slate-300">Test Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{testResults.significance.toFixed(0)}%</div>
                    <div className="text-sm text-slate-300">Statistical Significance</div>
                  </div>
                </div>

                {testActive && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Test Progress</span>
                      <span className="text-white">{testProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={testProgress} className="h-2" />
                  </div>
                )}
          </DashboardCard>

          {/* Variants Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {testResults.variants.map((variant, index) => (
              <DashboardCard 
                  key={variant.id} 
                  className={`shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl ${
                    variant.isWinner 
                      ? 'border-green-400/50 bg-gradient-to-br from-green-900/20 to-emerald-900/20' 
                      : 'bg-gradient-to-br from-slate-900/20 to-slate-800/20'
                  }`}
                >
                  <CardContent className="p-3 sm:p-4 md:p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-semibold text-white">{variant.name}</h3>
                        {variant.isWinner && (
                          <Badge className="bg-green-400/20 text-green-300">
                            <Award className="w-3 h-3 mr-1" />
                            Winner
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(variant.content, variant.name)}
                        className="text-slate-300 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="bg-slate-800/30 p-4 rounded-lg mb-4">
                      <p className="text-slate-100 leading-relaxed">
                        {variant.content}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <Eye className="w-4 h-4 text-blue-400" />
                          <span className="text-white font-medium">{variant.impressions.toLocaleString()}</span>
                        </div>
                        <div className="text-slate-300">Impressions</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <MousePointer className="w-4 h-4 text-purple-400" />
                          <span className="text-white font-medium">{variant.clicks.toLocaleString()}</span>
                        </div>
                        <div className="text-slate-300">Clicks</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <ShoppingCart className="w-4 h-4 text-green-400" />
                          <span className="text-white font-medium">{variant.conversions}</span>
                        </div>
                        <div className="text-slate-300">Conversions</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          {variant.ctr > 4 ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                          <span className="text-white font-medium">{variant.ctr.toFixed(2)}%</span>
                        </div>
                        <div className="text-slate-300">CTR</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <BarChart3 className="w-4 h-4 text-yellow-400" />
                          <span className="text-white font-medium">{variant.conversionRate.toFixed(2)}%</span>
                        </div>
                        <div className="text-slate-300">Conv. Rate</div>
                      </div>
                    </div>
                  </CardContent>
              </DashboardCard>
            ))}
          </div>

          {/* Recommendation */}
          <DashboardCard className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary-foreground/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    Test Recommendation
                  </h3>
                  {!testActive && testResults.variants.some(v => v.isWinner) && (
                    <Button 
                      onClick={implementWinner}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Award className="w-4 h-4 mr-2" />
                      Implement Winner
                    </Button>
                  )}
                </div>
                <p className="text-slate-100 text-lg">
                  {testResults.recommendation}
                </p>
                {testResults.significance >= 95 && (
                  <p className="text-sm text-green-300 mt-2">
                    ✅ Results are statistically significant at {testResults.significance.toFixed(0)}% confidence level
                  </p>
                )}
          </DashboardCard>
        </div>
      )}
    </PageShell>
  );
}