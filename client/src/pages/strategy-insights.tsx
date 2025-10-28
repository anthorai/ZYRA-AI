import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageContainer } from "@/components/ui/standardized-layout";
import { Sparkles, TrendingUp, Target, Zap, AlertCircle, Lightbulb, BarChart3, Mail, MessageSquare, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { apiRequest } from '@/lib/queryClient';

export default function StrategyInsights() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategyResult, setStrategyResult] = useState<{
    strategy: string;
    model: string;
    tokensUsed: number;
    timestamp: string;
  } | null>(null);

  // Form state
  const [brandOverview, setBrandOverview] = useState('');
  const [analyticsData, setAnalyticsData] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [goal, setGoal] = useState('');
  const [includeCompetitorAnalysis, setIncludeCompetitorAnalysis] = useState(false);

  // Fetch user's analytics data to auto-populate
  const { data: campaignStats } = useQuery<any>({
    queryKey: ['/api/campaigns/stats'],
  });

  const { data: growthSummary } = useQuery<any>({
    queryKey: ['/api/analytics/growth-summary'],
  });

  // Auto-populate analytics data when available
  const autoFillAnalytics = () => {
    if (campaignStats && growthSummary) {
      const analyticsText = `Recent Performance:
- Total Campaigns: ${campaignStats.totalCampaigns || 0}
- Email Campaigns: ${campaignStats.emailCampaigns || 0} (${campaignStats.avgOpenRate?.toFixed(1) || 0}% open rate, ${campaignStats.avgClickRate?.toFixed(1) || 0}% click rate)
- SMS Campaigns: ${campaignStats.smsCampaigns || 0} (${campaignStats.avgConversionRate?.toFixed(1) || 0}% conversion)
- Products Optimized: ${growthSummary.productsOptimized || 0} / ${growthSummary.totalProducts || 0}
- Overall Growth: ${growthSummary.overallGrowth?.toFixed(1) || 0}%
- AI Impact: ${growthSummary.totalAIImpact || 0} optimizations`;
      
      setAnalyticsData(analyticsText);
      toast({
        title: "Analytics Auto-Filled",
        description: "Your recent performance data has been populated",
        duration: 2000,
      });
    }
  };

  const generateStrategy = async () => {
    if (!brandOverview.trim() || !goal.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide brand overview and goal",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest('POST', '/api/strategy-insights', {
        brandOverview,
        analyticsData,
        targetAudience,
        goal,
        includeCompetitorAnalysis,
      });

      const result = await response.json();
      setStrategyResult(result);
      
      toast({
        title: "Strategy Generated! 🎯",
        description: `Advanced insights powered by ${result.model}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Strategy generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate strategy insights",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen dark-theme-bg">
      <PageContainer>
        
        <div className="flex items-center space-x-2">
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            <Zap className="w-3 h-3 mr-1" />
            Premium AI Model
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Advanced Reasoning
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Input Form */}
          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary" />
              <span>Business Context</span>
            </CardTitle>
            <CardDescription>
              Provide details about your store for strategic analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Brand Overview */}
            <div className="space-y-2">
              <Label htmlFor="brandOverview" className="text-sm font-medium">
                Brand Overview *
              </Label>
              <Textarea
                id="brandOverview"
                placeholder="Describe your brand, products, unique value proposition..."
                value={brandOverview}
                onChange={(e) => setBrandOverview(e.target.value)}
                className="min-h-[100px] bg-gray-900 border-gray-600 text-white"
              />
            </div>

            {/* Goal */}
            <div className="space-y-2">
              <Label htmlFor="goal" className="text-sm font-medium">
                Goal *
              </Label>
              <Input
                id="goal"
                placeholder="Increase conversion rate by 25% in Q2"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
              />
            </div>

            {/* Analytics Data */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="analyticsData" className="text-sm font-medium">
                  Recent Performance Data
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={autoFillAnalytics}
                  className="text-primary hover:text-primary/80 h-auto p-1"
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Auto-fill
                </Button>
              </div>
              <Textarea
                id="analyticsData"
                placeholder="Campaign metrics, revenue, conversion rates..."
                value={analyticsData}
                onChange={(e) => setAnalyticsData(e.target.value)}
                className="min-h-[100px] bg-gray-900 border-gray-600 text-white"
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label htmlFor="targetAudience" className="text-sm font-medium">
                Target Audience
              </Label>
              <Input
                id="targetAudience"
                placeholder="Millennials, tech enthusiasts, eco-conscious shoppers..."
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
              />
            </div>

            {/* Competitor Analysis Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  Include Competitive Analysis
                </Label>
                <p className="text-xs text-gray-400">
                  Add differentiation strategies vs competitors
                </p>
              </div>
              <Switch
                checked={includeCompetitorAnalysis}
                onCheckedChange={setIncludeCompetitorAnalysis}
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateStrategy}
              disabled={isGenerating || !brandOverview.trim() || !goal.trim()}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Analyzing with GPT-4o...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Strategy
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Strategy Output */}
        <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <span>Strategic Insights</span>
            </CardTitle>
            <CardDescription>
              Data-driven recommendations and actionable campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!strategyResult ? (
              <div className="space-y-4 text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-gray-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-gray-300 font-medium">No Strategy Generated Yet</p>
                  <p className="text-gray-400 text-sm">
                    Fill in your business context and generate strategic insights
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mt-6 max-w-sm mx-auto">
                  <div className="p-3 sm:p-4 md:p-6 bg-gray-800/30 rounded-lg overflow-hidden">
                    <Mail className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">Email Strategy</p>
                  </div>
                  <div className="p-3 sm:p-4 md:p-6 bg-gray-800/30 rounded-lg overflow-hidden">
                    <MessageSquare className="w-5 h-5 text-green-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">SMS Campaigns</p>
                  </div>
                  <div className="p-3 sm:p-4 md:p-6 bg-gray-800/30 rounded-lg overflow-hidden">
                    <Search className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">SEO Tactics</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Strategy Metadata */}
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      {strategyResult.model}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {strategyResult.tokensUsed} tokens
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(strategyResult.timestamp).toLocaleString()}
                  </span>
                </div>

                {/* Strategy Content */}
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="bg-gray-900/50 rounded-lg p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                    <ReactMarkdown
                      components={{
                        h1: (props) => <h1 className="text-2xl font-bold text-white mb-4 mt-6 first:mt-0" {...props} />,
                        h2: (props) => <h2 className="text-xl font-semibold text-gray-200 mb-3 mt-5" {...props} />,
                        h3: (props) => <h3 className="text-lg font-medium text-gray-300 mb-2 mt-4" {...props} />,
                        p: (props) => <p className="text-gray-300 mb-3 leading-relaxed" {...props} />,
                        ul: (props) => <ul className="list-disc list-inside space-y-1 mb-3 text-gray-300" {...props} />,
                        ol: (props) => <ol className="list-decimal list-inside space-y-1 mb-3 text-gray-300" {...props} />,
                        li: (props) => <li className="ml-2" {...props} />,
                        strong: (props) => <strong className="text-white font-semibold" {...props} />,
                        em: (props) => <em className="text-primary" {...props} />,
                        code: (props) => <code className="bg-gray-700 px-1.5 py-0.5 rounded text-sm text-primary" {...props} />,
                      }}
                    >
                      {strategyResult.strategy}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(strategyResult.strategy);
                      toast({
                        title: "Copied to Clipboard",
                        description: "Strategy insights copied successfully",
                        duration: 2000,
                      });
                    }}
                    className="flex-1"
                  >
                    Copy Strategy
                  </Button>
                  <Button
                    onClick={() => setStrategyResult(null)}
                    variant="ghost"
                    className="flex-1"
                  >
                    Generate New
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

        {/* Info Card */}
        <Card className="bg-gray-800/50 border-gray-700 border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-purple-400 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Premium AI Model</h4>
                <p className="text-sm text-gray-300">
                  Strategy AI uses GPT-4o for advanced reasoning and deep analysis. This provides superior insights compared to basic AI tools, with strategic recommendations tailored to your specific business context.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
}
