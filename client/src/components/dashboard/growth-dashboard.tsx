import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useDashboard } from "@/hooks/useDashboard";
import { useROISummary } from "@/hooks/use-roi-summary";
import { CardGrid } from "@/components/ui/standardized-layout";
import { GradientPageHeader } from "@/components/ui/page-hero";
import { ROISummaryCard } from "@/components/dashboard/roi-summary-card";
import { 
  ShoppingBag,
  Mail,
  MessageSquare,
  Search,
  TrendingUp,
  DollarSign,
  BarChart3,
  Zap,
  RefreshCw,
  Wand2,
  FileText,
  Bot,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingCart,
  Tag,
  Send
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsCard {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  actionText: string;
  category: 'metric' | 'performance' | 'growth';
}

export default function GrowthDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { dashboardData, isLoading, error, trackToolAccess } = useDashboard();
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Fetch real campaign stats with auto-refresh every 30 seconds
  const { data: campaignStats, isLoading: campaignStatsLoading, error: campaignStatsError } = useQuery<{
    totalCampaigns: number;
    emailCampaigns: number;
    smsCampaigns: number;
    sentCampaigns: number;
    totalSent: number;
    avgOpenRate: number;
    avgClickRate: number;
    avgConversionRate: number;
  }>({
    queryKey: ['/api/campaigns/stats'],
    enabled: !!dashboardData?.user,
    refetchInterval: 30000,
  });

  // Fetch real growth summary stats with auto-refresh every 30 seconds
  const { data: growthSummary, isLoading: growthSummaryLoading } = useQuery<{
    overallGrowth: number;
    totalAIImpact: number;
    productsOptimized: number;
    currentPeriodCampaigns: number;
    previousPeriodCampaigns: number;
    totalProducts: number;
    totalOrders: number;
  }>({
    queryKey: ['/api/analytics/growth-summary'],
    enabled: !!dashboardData?.user,
    refetchInterval: 30000,
  });

  // Fetch revenue trends for charts with auto-refresh every 30 seconds
  const [chartPeriod, setChartPeriod] = useState<'7' | '30' | '90'>('30');
  const { data: revenueTrends, isLoading: trendsLoading } = useQuery<{
    period: number;
    totalRevenue: number;
    totalOrders: number;
    trends: { date: string; revenue: number; orders: number; campaigns: number }[];
    summary: { avgDailyRevenue: number; avgDailyOrders: number; peakDay: any };
  }>({
    queryKey: ['/api/analytics/revenue-trends', { period: chartPeriod }],
    enabled: !!dashboardData?.user,
    refetchInterval: 30000,
  });

  // Fetch cart recovery data for conversion funnel with auto-refresh every 30 seconds
  const { data: cartRecoveryData, isLoading: cartRecoveryLoading } = useQuery<{
    overview: {
      totalCarts: number;
      recoveredCarts: number;
      recoveryRate: number;
      totalValue: number;
      recoveredValue: number;
      potentialRevenue: number;
      campaignsSent: number;
      conversionRate: number;
    };
  }>({
    queryKey: ['/api/analytics/cart-recovery'],
    enabled: !!dashboardData?.user,
    refetchInterval: 30000,
  });

  // Fetch ROI summary for revenue breakdown using shared hook
  const { data: roiSummary } = useROISummary();

  // State for daily report modal
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [reportDate, setReportDate] = useState<string>(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });

  // Fetch daily report data
  const { data: dailyReport, isLoading: dailyReportLoading, refetch: refetchDailyReport, error: dailyReportError } = useQuery<{
    reportDate: string;
    autopilotEnabled: boolean;
    summary: {
      totalActions: number;
      completed: number;
      failed: number;
      pending: number;
      successRate: number;
    };
    breakdown: {
      seoOptimizations: number;
      cartRecoveries: number;
      priceAdjustments: number;
      campaignsSent: number;
    };
    recentActions: Array<{
      id: string;
      type: string;
      status: string;
      description: string;
      createdAt: string;
      metadata: any;
    }>;
  }>({
    queryKey: [`/api/analytics/daily-report?date=${reportDate}`],
    enabled: showDailyReport && !!dashboardData?.user,
  });

  // Log campaign stats errors
  if (campaignStatsError) {
    console.error('Failed to fetch campaign stats:', campaignStatsError);
  }
  
  // Debug logging for GrowthDashboard
  console.log('🎯 GrowthDashboard state:', { isLoading, dashboardData: !!dashboardData, error, campaignStats });

  // Use real data from API or show loading skeletons
  const getAnalyticsCards = (): AnalyticsCard[] => {
    // Use real campaign and usage stats
    const usageStats = dashboardData?.usageStats || {
      productsOptimized: 0,
      conversionRate: 0,
      cartRecoveryRate: 0,
      seoOptimizationsUsed: 0,
      totalRevenue: 0,
      totalOrders: 0
    };

    const campaigns = campaignStats || {
      totalCampaigns: 0,
      emailCampaigns: 0,
      smsCampaigns: 0,
      sentCampaigns: 0,
      totalSent: 0,
      avgOpenRate: 0,
      avgClickRate: 0,
      avgConversionRate: 0
    };

    // Revenue data from ROI summary with safe defaults during loading
    const cartRecoveryRevenue = roiSummary?.currentMonth?.breakdown?.cartRecovery ?? 0;
    const campaignRevenue = roiSummary?.currentMonth?.breakdown?.campaigns ?? 0;
    const aiOptimizationRevenue = roiSummary?.currentMonth?.breakdown?.aiOptimization ?? 0;
    const recoveredCarts = cartRecoveryData?.overview?.recoveredCarts ?? 0;

    return [
      {
        id: 'cart-recovery',
        title: 'Cart Recovery',
        description: 'Revenue recovered from abandoned cart campaigns this month',
        icon: <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
        value: `$${(cartRecoveryRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: recoveredCarts > 0 ? `${recoveredCarts} carts recovered` : 'No recoveries yet',
        trend: cartRecoveryRevenue > 0 ? 'up' : 'neutral',
        actionText: 'View Details',
        category: 'metric'
      },
      {
        id: 'email-performance',
        title: 'Email Campaigns',
        description: 'Revenue generated from email marketing campaigns',
        icon: <Mail className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
        value: `$${(campaignRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: campaigns.emailCampaigns > 0 ? `${campaigns.avgOpenRate.toFixed(1)}% open rate, ${campaigns.emailCampaigns} sent` : 'No campaigns yet',
        trend: campaignRevenue > 0 ? 'up' : 'neutral',
        actionText: 'View Analytics',
        category: 'performance'
      },
      {
        id: 'ai-optimization',
        title: 'AI Optimization',
        description: 'Revenue lift from AI-enhanced product descriptions and SEO',
        icon: <Zap className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
        value: `$${(aiOptimizationRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: usageStats.productsOptimized > 0 ? `${usageStats.productsOptimized} products optimized` : 'No optimizations yet',
        trend: aiOptimizationRevenue > 0 ? 'up' : 'neutral',
        actionText: 'View Optimized',
        category: 'performance'
      },
      {
        id: 'seo-keyword-density',
        title: 'SEO Keyword Density',
        description: 'Keyword optimization and search ranking improvements',
        icon: <Search className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
        value: `${usageStats.seoOptimizationsUsed || 0}`,
        change: usageStats.seoOptimizationsUsed > 0 ? `+${usageStats.seoOptimizationsUsed} optimizations` : 'No SEO yet',
        trend: usageStats.seoOptimizationsUsed > 0 ? 'up' : 'neutral',
        actionText: 'View Keywords',
        category: 'growth'
      },
      {
        id: 'revenue-impact',
        title: 'Revenue Impact',
        description: 'Total revenue boost from Zyra AI optimizations this month',
        icon: <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
        value: `$${usageStats.totalRevenue?.toLocaleString() || '0'}`,
        change: usageStats.totalRevenue > 0 ? 'AI-driven growth' : 'Start optimizing',
        trend: usageStats.totalRevenue > 0 ? 'up' : 'neutral',
        actionText: 'View Breakdown',
        category: 'growth'
      },
      {
        id: 'total-campaigns',
        title: 'Total Campaigns',
        description: 'All marketing campaigns across email and SMS channels',
        icon: <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
        value: `${campaigns.totalCampaigns || 0}`,
        change: campaigns.sentCampaigns > 0 ? `${campaigns.sentCampaigns} sent, ${campaigns.totalSent} recipients` : 'Create first campaign',
        trend: campaigns.totalCampaigns > 0 ? 'up' : 'neutral',
        actionText: 'View Campaigns',
        category: 'growth'
      }
    ];
  };

  const analyticsCards = getAnalyticsCards();


  const handleAnalyticsAction = (cardId: string) => {
    // Navigation mapping for each analytics card
    const routeMapping = {
      'cart-recovery': '/analytics/cart-recovery',
      'ai-optimization': '/analytics/optimized-products',
      'optimized-products': '/analytics/optimized-products',
      'email-performance': '/analytics/email-performance',
      'sms-conversion': '/analytics/sms-conversion',
      'seo-keyword-density': '/analytics/seo-keyword-density',
      'content-roi': '/analytics/content-roi',
      'revenue-impact': '/analytics/revenue-impact',
      'seo-ranking-tracker': '/analytics/seo-ranking-tracker',
      'ab-test-results': '/analytics/ab-test-results',
      'total-campaigns': '/campaigns'
    };

    const route = routeMapping[cardId as keyof typeof routeMapping];
    if (route) {
      setLocation(route);
    } else {
      toast({
        title: "Coming Soon",
        description: "This analytics page is being developed.",
        duration: 3000,
      });
    }
  };

  // Update last updated timestamp when data refreshes
  useEffect(() => {
    if (campaignStats || growthSummary || revenueTrends || cartRecoveryData) {
      setLastUpdated(new Date());
    }
  }, [campaignStats, growthSummary, revenueTrends, cartRecoveryData]);

  // Manual refresh function
  const handleManualRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/campaigns/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/analytics/growth-summary'] });
    queryClient.invalidateQueries({ queryKey: ['/api/analytics/revenue-trends'] });
    queryClient.invalidateQueries({ queryKey: ['/api/analytics/cart-recovery'] });
    setLastUpdated(new Date());
    toast({
      title: "Dashboard Refreshed",
      description: "All analytics data has been updated",
      duration: 2000,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header */}
      <GradientPageHeader
        icon={<TrendingUp className="w-8 h-8 text-primary" />}
        title="Growth Command Center"
        subtitle="Monitor your business performance, track AI-powered optimizations, and analyze marketing campaigns in real-time"
      />

      {/* Daily Report Button */}
      <div className="flex justify-end">
        <Dialog open={showDailyReport} onOpenChange={setShowDailyReport}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
              data-testid="button-view-daily-report"
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">View</span> Daily Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                Autonomous Daily Report
              </DialogTitle>
              <DialogDescription>
                Summary of AI actions for {new Date(reportDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </DialogDescription>
            </DialogHeader>
            
            {/* Date Picker */}
            <div className="flex items-center gap-2 mb-4">
              <input 
                type="date" 
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-3 py-2 rounded-md border bg-background text-sm"
                data-testid="input-report-date"
              />
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => refetchDailyReport()}
                data-testid="button-refresh-report"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {dailyReportLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : dailyReportError ? (
              <div className="text-center py-8">
                <XCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
                <p className="text-red-500 font-medium">Failed to load report</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(dailyReportError as Error)?.message || 'Please try again later'}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => refetchDailyReport()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : dailyReport ? (
              <div className="space-y-6">
                {/* Mode Status */}
                <div className="flex items-center gap-2">
                  <Badge variant={dailyReport.autopilotEnabled ? "default" : "secondary"}>
                    {dailyReport.autopilotEnabled ? (
                      <><Bot className="w-3 h-3 mr-1" /> Autonomous Mode</>
                    ) : (
                      <><Clock className="w-3 h-3 mr-1" /> Manual Mode</>
                    )}
                  </Badge>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{dailyReport.summary.totalActions}</div>
                    <div className="text-xs text-muted-foreground">Total Actions</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-500">{dailyReport.summary.completed}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-500">{dailyReport.summary.failed}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold">{dailyReport.summary.successRate}%</div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                  </Card>
                </div>

                {/* Breakdown by Type */}
                <div>
                  <h4 className="font-semibold mb-3">Actions Breakdown</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Search className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="font-medium">{dailyReport.breakdown.seoOptimizations}</div>
                        <div className="text-xs text-muted-foreground">SEO Optimizations</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <ShoppingCart className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="font-medium">{dailyReport.breakdown.cartRecoveries}</div>
                        <div className="text-xs text-muted-foreground">Cart Recoveries</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Tag className="w-5 h-5 text-orange-500" />
                      <div>
                        <div className="font-medium">{dailyReport.breakdown.priceAdjustments}</div>
                        <div className="text-xs text-muted-foreground">Price Adjustments</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Send className="w-5 h-5 text-purple-500" />
                      <div>
                        <div className="font-medium">{dailyReport.breakdown.campaignsSent}</div>
                        <div className="text-xs text-muted-foreground">Campaigns Sent</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Actions */}
                {dailyReport.recentActions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Recent Actions</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {dailyReport.recentActions.map((action) => (
                        <div 
                          key={action.id} 
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/20"
                        >
                          {action.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : action.status === 'failed' ? (
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{action.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(action.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {action.type?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dailyReport.summary.totalActions === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No autonomous actions on this date</p>
                    <p className="text-sm">AI actions will appear here when scheduled tasks run</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Unable to load report</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* ROI Summary - Prominent display of total revenue generated */}
      <ROISummaryCard />

      {/* Analytics Cards Grid - Mobile-First Redesign */}
      <CardGrid>
        {isLoading ? (
          // Show skeleton loaders while data is loading
          (Array.from({ length: 6 }, (_, index) => (
            <Card key={`skeleton-${index}`} className="gradient-card rounded-2xl shadow-md border border-slate-700/30 sm:hover:shadow-lg transition-shadow duration-300">
              <div className="p-6 sm:p-5 md:p-6 flex flex-col space-y-5">
                <CardHeader className="p-0 space-y-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-slate-700 flex-shrink-0" />
                    <Skeleton className="h-6 w-32 bg-slate-700 rounded" />
                  </div>
                  <Skeleton className="h-4 w-full bg-slate-700 rounded" />
                  <Skeleton className="h-4 w-4/5 bg-slate-700 rounded" />
                </CardHeader>
                <Skeleton className="h-12 w-full bg-slate-700 rounded-lg mt-auto" />
              </div>
            </Card>
          )))
        ) : (
          analyticsCards.map((card) => (
          <Card 
            key={card.id} 
            className="gradient-card rounded-2xl shadow-md border border-slate-700/30 sm:hover:shadow-lg sm:hover:border-primary/40 transition-all duration-300"
            data-testid={`card-analytics-${card.id}`}
          >
            <div className="p-6 sm:p-5 md:p-6 flex flex-col space-y-5">
              <CardHeader className="p-0 space-y-4">
                {/* Icon & Title */}
                <div className="flex items-center space-x-3">
                  <div className="text-primary flex-shrink-0">
                    {card.icon}
                  </div>
                  <CardTitle className="text-lg sm:text-base md:text-lg lg:text-xl font-bold text-white leading-tight" data-testid={`text-title-${card.id}`}>
                    {card.title}
                  </CardTitle>
                </div>
                
                {/* Description */}
                <CardDescription className="text-slate-300 text-sm leading-relaxed line-clamp-2" data-testid={`text-description-${card.id}`}>
                  {card.description}
                </CardDescription>
              </CardHeader>
              
              {/* Action Button - Mobile Optimized */}
              <Button
                onClick={() => handleAnalyticsAction(card.id)}
                className="w-full h-12 sm:h-11 px-6 text-base sm:text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 mt-auto"
                data-testid={`button-action-${card.id}`}
              >
                <span className="hidden sm:inline-block mr-2">
                  <Wand2 className="w-4 h-4" />
                </span>
                {card.actionText}
              </Button>
            </div>
          </Card>
          ))
        )}
      </CardGrid>
      
      {/* Growth Summary */}
      <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card className="gradient-card rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            <div className="p-2 sm:p-2.5 md:p-3 rounded-full bg-slate-800/50 transition-all duration-300 flex-shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 stroke-2 text-primary" />
            </div>
            <div className="min-w-0">
              {growthSummaryLoading ? (
                <Skeleton className="h-5 sm:h-6 md:h-7 w-16 sm:w-20 bg-slate-700" />
              ) : (
                <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate">
                  {growthSummary?.overallGrowth !== undefined && growthSummary.overallGrowth !== 0 
                    ? `${growthSummary.overallGrowth > 0 ? '+' : ''}${growthSummary.overallGrowth}%`
                    : '0%'}
                </h3>
              )}
              <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Overall Growth</p>
            </div>
          </div>
        </Card>
        
        <Card className="gradient-card rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            <div className="p-2 sm:p-2.5 md:p-3 rounded-full bg-slate-800/50 transition-all duration-300 flex-shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 stroke-2 text-primary" />
            </div>
            <div className="min-w-0">
              {growthSummaryLoading ? (
                <Skeleton className="h-5 sm:h-6 md:h-7 w-20 sm:w-24 md:w-28 bg-slate-700" />
              ) : (
                <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate">
                  ${(growthSummary?.totalAIImpact || 0).toLocaleString()}
                </h3>
              )}
              <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Total AI Impact</p>
            </div>
          </div>
        </Card>
        
        <Card className="gradient-card rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            <div className="p-2 sm:p-2.5 md:p-3 rounded-full bg-slate-800/50 transition-all duration-300 flex-shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 stroke-2 text-primary" />
            </div>
            <div className="min-w-0">
              {growthSummaryLoading ? (
                <Skeleton className="h-5 sm:h-6 md:h-7 w-12 sm:w-16 bg-slate-700" />
              ) : (
                <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate">
                  {growthSummary?.productsOptimized || 0}
                </h3>
              )}
              <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Products Optimized</p>
            </div>
          </div>
        </Card>
      </div>
      {/* Visual Analytics Charts */}
      <div className="mt-6 sm:mt-8 md:mt-12">
        <Tabs defaultValue="revenue" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white">Performance Analytics</h2>
            <TabsList className="bg-slate-800/50 w-full sm:w-auto grid grid-cols-3 sm:flex">
              <TabsTrigger value="revenue" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-3">
                Revenue
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-3">
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="funnel" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-3">
                Funnel
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="revenue">
            <Card className="gradient-card rounded-xl sm:rounded-2xl">
              <CardHeader className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-white text-sm sm:text-base md:text-lg">Revenue Trends</CardTitle>
                    <CardDescription className="text-slate-300 text-xs sm:text-sm">
                      Daily revenue and order trends
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                    <Button
                      variant={chartPeriod === '7' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartPeriod('7')}
                      className={`h-7 sm:h-8 px-2 sm:px-3 text-xs ${chartPeriod === '7' ? 'bg-primary' : 'bg-transparent border-slate-600 text-slate-300'}`}
                    >
                      7D
                    </Button>
                    <Button
                      variant={chartPeriod === '30' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartPeriod('30')}
                      className={`h-7 sm:h-8 px-2 sm:px-3 text-xs ${chartPeriod === '30' ? 'bg-primary' : 'bg-transparent border-slate-600 text-slate-300'}`}
                    >
                      30D
                    </Button>
                    <Button
                      variant={chartPeriod === '90' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartPeriod('90')}
                      className={`h-7 sm:h-8 px-2 sm:px-3 text-xs ${chartPeriod === '90' ? 'bg-primary' : 'bg-transparent border-slate-600 text-slate-300'}`}
                    >
                      90D
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                {trendsLoading ? (
                  <div className="h-48 sm:h-80 flex items-center justify-center">
                    <Skeleton className="h-full w-full bg-slate-700" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 200 : 320}>
                    <LineChart data={revenueTrends?.trends || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      />
                      <Legend wrapperStyle={{ color: '#94a3b8' }} />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#00F0FF" 
                        strokeWidth={2}
                        dot={{ fill: '#00F0FF', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Revenue ($)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="orders" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                        name="Orders"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {revenueTrends && (
                  <div className="mt-3 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="text-center p-2 sm:p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-[10px] sm:text-sm">Avg Revenue</p>
                      <p className="text-white font-bold text-xs sm:text-lg mt-0.5 sm:mt-1">
                        ${revenueTrends.summary.avgDailyRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-2 sm:p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-[10px] sm:text-sm">Avg Orders</p>
                      <p className="text-white font-bold text-xs sm:text-lg mt-0.5 sm:mt-1">
                        {revenueTrends.summary.avgDailyOrders}
                      </p>
                    </div>
                    <div className="text-center p-2 sm:p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-[10px] sm:text-sm">Peak Day</p>
                      {revenueTrends.summary.peakDay?.date ? (
                        <>
                          <p className="text-white font-bold text-[10px] sm:text-sm mt-0.5 sm:mt-1">
                            {new Date(revenueTrends.summary.peakDay.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-primary text-[9px] sm:text-xs mt-0.5">
                            ${revenueTrends.summary.peakDay.revenue}
                          </p>
                        </>
                      ) : (
                        <p className="text-slate-500 text-[10px] sm:text-sm mt-0.5 sm:mt-1">N/A</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card className="gradient-card rounded-xl sm:rounded-2xl">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-white text-sm sm:text-base md:text-lg">Campaign Performance</CardTitle>
                <CardDescription className="text-slate-300 text-xs sm:text-sm">
                  Email and SMS campaign metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                {campaignStatsLoading ? (
                  <div className="h-48 sm:h-80 flex items-center justify-center">
                    <Skeleton className="h-full w-full bg-slate-700" />
                  </div>
                ) : campaignStats ? (
                  <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 200 : 320}>
                    <BarChart data={[
                      { metric: 'Open Rate', value: campaignStats.avgOpenRate, color: '#00F0FF' },
                      { metric: 'Click Rate', value: campaignStats.avgClickRate, color: '#8b5cf6' },
                      { metric: 'Conversion', value: campaignStats.avgConversionRate, color: '#10b981' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="metric" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                        formatter={(value: any) => `${value.toFixed(1)}%`}
                      />
                      <Bar dataKey="value" fill="#00F0FF" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-400">
                    No campaign data available
                  </div>
                )}
                {campaignStats && (
                  <div className="mt-3 sm:mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                    <div className="text-center p-2 sm:p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-[10px] sm:text-sm">Total</p>
                      <p className="text-white font-bold text-xs sm:text-lg mt-0.5 sm:mt-1">{campaignStats.totalCampaigns}</p>
                    </div>
                    <div className="text-center p-2 sm:p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-[10px] sm:text-sm">Sent</p>
                      <p className="text-white font-bold text-xs sm:text-lg mt-0.5 sm:mt-1">{campaignStats.sentCampaigns}</p>
                    </div>
                    <div className="text-center p-2 sm:p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-[10px] sm:text-sm">Email</p>
                      <p className="text-white font-bold text-xs sm:text-lg mt-0.5 sm:mt-1">{campaignStats.emailCampaigns}</p>
                    </div>
                    <div className="text-center p-2 sm:p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-[10px] sm:text-sm">SMS</p>
                      <p className="text-white font-bold text-xs sm:text-lg mt-0.5 sm:mt-1">{campaignStats.smsCampaigns}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funnel">
            <Card className="gradient-card rounded-xl sm:rounded-2xl">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-white text-sm sm:text-base md:text-lg">Cart Recovery Funnel</CardTitle>
                <CardDescription className="text-slate-300 text-xs sm:text-sm">
                  Abandoned cart recovery performance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                {cartRecoveryLoading ? (
                  <div className="h-48 sm:h-80 flex items-center justify-center">
                    <Skeleton className="h-full w-full bg-slate-700" />
                  </div>
                ) : cartRecoveryData ? (
                  <>
                    <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 200 : 320}>
                      <AreaChart data={[
                        { 
                          stage: 'Abandoned Carts', 
                          value: cartRecoveryData.overview.totalCarts,
                          percentage: 100 
                        },
                        { 
                          stage: 'Recovery Campaign Sent', 
                          value: cartRecoveryData.overview.campaignsSent,
                          percentage: cartRecoveryData.overview.totalCarts > 0 
                            ? (cartRecoveryData.overview.campaignsSent / cartRecoveryData.overview.totalCarts * 100).toFixed(1)
                            : 0
                        },
                        { 
                          stage: 'Successfully Recovered', 
                          value: cartRecoveryData.overview.recoveredCarts,
                          percentage: cartRecoveryData.overview.totalCarts > 0
                            ? (cartRecoveryData.overview.recoveredCarts / cartRecoveryData.overview.totalCarts * 100).toFixed(1)
                            : 0
                        }
                      ]}>
                        <defs>
                          <linearGradient id="funnelGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="stage" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                        <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#f1f5f9'
                          }}
                          formatter={(value: any, name: string, props: any) => {
                            if (name === 'value') {
                              return [`${value} (${props.payload.percentage}%)`, 'Count'];
                            }
                            return value;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#00F0FF" 
                          strokeWidth={2}
                          fill="url(#funnelGradient)" 
                          name="value"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="mt-3 sm:mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                      <div className="text-center p-2 sm:p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-[10px] sm:text-sm">Recovery</p>
                        <p className="text-white font-bold text-xs sm:text-lg mt-0.5 sm:mt-1">
                          {cartRecoveryData.overview.recoveryRate.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center p-2 sm:p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-[10px] sm:text-sm">Conversion</p>
                        <p className="text-white font-bold text-xs sm:text-lg mt-0.5 sm:mt-1">
                          {cartRecoveryData.overview.conversionRate.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center p-2 sm:p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-[10px] sm:text-sm">Recovered</p>
                        <p className="text-white font-bold text-xs sm:text-lg mt-0.5 sm:mt-1">
                          ${cartRecoveryData.overview.recoveredValue}
                        </p>
                      </div>
                      <div className="text-center p-2 sm:p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-[10px] sm:text-sm">Potential</p>
                        <p className="text-white font-bold text-xs sm:text-lg mt-0.5 sm:mt-1">
                          ${cartRecoveryData.overview.potentialRevenue}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-400">
                    No cart recovery data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* AI Performance Notice */}
      <div className="mt-4 sm:mt-8 p-3 sm:p-6 gradient-card rounded-xl sm:rounded-2xl bg-[#16162c]">
        <div className="flex items-start space-x-2 sm:space-x-4">
          <div className="transition-all duration-300 flex-shrink-0">
            <Zap className="w-4 h-4 sm:w-6 sm:h-6 stroke-2 text-primary" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm sm:text-lg mb-1 sm:mb-2">AI-Powered Growth</h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Your Zyra AI continuously analyzes customer behavior and optimizes conversion rates across all channels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}