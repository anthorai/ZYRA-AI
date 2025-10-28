import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useDashboard } from "@/hooks/useDashboard";
import { CardGrid } from "@/components/ui/standardized-layout";
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
  Wand2
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

    return [
      {
        id: 'optimized-products',
        title: 'Optimized Products',
        description: 'Products enhanced by Zyra AI with improved descriptions and SEO',
        icon: <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
        value: usageStats.productsOptimized?.toString() || '0',
        change: usageStats.productsOptimized > 0 ? `+${usageStats.productsOptimized} optimized` : 'No products yet',
        trend: usageStats.productsOptimized > 0 ? 'up' : 'neutral',
        actionText: 'View Products',
        category: 'metric'
      },
      {
        id: 'email-performance',
        title: 'Email Performance',
        description: 'Email open rates and click-through performance analytics',
        icon: <Mail className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
        value: campaigns.emailCampaigns > 0 ? `${campaigns.avgOpenRate.toFixed(1)}%` : '0%',
        change: campaigns.emailCampaigns > 0 ? `${campaigns.emailCampaigns} campaigns sent` : 'No campaigns yet',
        trend: campaigns.avgOpenRate > 0 ? 'up' : 'neutral',
        actionText: 'View Analytics',
        category: 'performance'
      },
      {
        id: 'sms-conversion',
        title: 'SMS Conversion',
        description: 'SMS recovery campaigns and sales conversion tracking',
        icon: <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
        value: campaigns.smsCampaigns > 0 ? `${campaigns.avgConversionRate.toFixed(1)}%` : '0%',
        change: campaigns.smsCampaigns > 0 ? `${campaigns.smsCampaigns} SMS sent` : 'No SMS campaigns yet',
        trend: campaigns.avgConversionRate > 0 ? 'up' : 'neutral',
        actionText: 'View Campaigns',
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
    <div className="max-w-7xl mx-auto space-y-8">
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
      <div className="mt-12">
        <Tabs defaultValue="revenue" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Performance Analytics</h2>
            <TabsList className="bg-slate-800/50">
              <TabsTrigger value="revenue" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Revenue Trends
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Campaign Performance
              </TabsTrigger>
              <TabsTrigger value="funnel" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Conversion Funnel
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="revenue">
            <Card className="gradient-card rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Revenue Trends</CardTitle>
                    <CardDescription className="text-slate-300">
                      Daily revenue and order trends from cart recovery
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={chartPeriod === '7' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartPeriod('7')}
                      className={chartPeriod === '7' ? 'bg-primary' : 'bg-transparent border-slate-600 text-slate-300'}
                    >
                      7D
                    </Button>
                    <Button
                      variant={chartPeriod === '30' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartPeriod('30')}
                      className={chartPeriod === '30' ? 'bg-primary' : 'bg-transparent border-slate-600 text-slate-300'}
                    >
                      30D
                    </Button>
                    <Button
                      variant={chartPeriod === '90' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartPeriod('90')}
                      className={chartPeriod === '90' ? 'bg-primary' : 'bg-transparent border-slate-600 text-slate-300'}
                    >
                      90D
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {trendsLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <Skeleton className="h-full w-full bg-slate-700" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
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
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-sm">Avg Daily Revenue</p>
                      <p className="text-white font-bold text-lg mt-1">
                        ${revenueTrends.summary.avgDailyRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-sm">Avg Daily Orders</p>
                      <p className="text-white font-bold text-lg mt-1">
                        {revenueTrends.summary.avgDailyOrders}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-sm">Peak Revenue Day</p>
                      {revenueTrends.summary.peakDay?.date ? (
                        <>
                          <p className="text-white font-bold text-sm mt-1">
                            {new Date(revenueTrends.summary.peakDay.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-primary text-xs mt-0.5">
                            ${revenueTrends.summary.peakDay.revenue}
                          </p>
                        </>
                      ) : (
                        <p className="text-slate-500 text-sm mt-1">N/A</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card className="gradient-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white">Campaign Performance</CardTitle>
                <CardDescription className="text-slate-300">
                  Email and SMS campaign metrics overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaignStatsLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <Skeleton className="h-full w-full bg-slate-700" />
                  </div>
                ) : campaignStats ? (
                  <ResponsiveContainer width="100%" height={320}>
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
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-sm">Total Campaigns</p>
                      <p className="text-white font-bold text-lg mt-1">{campaignStats.totalCampaigns}</p>
                    </div>
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-sm">Sent Campaigns</p>
                      <p className="text-white font-bold text-lg mt-1">{campaignStats.sentCampaigns}</p>
                    </div>
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-sm">Email Campaigns</p>
                      <p className="text-white font-bold text-lg mt-1">{campaignStats.emailCampaigns}</p>
                    </div>
                    <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-slate-400 text-sm">SMS Campaigns</p>
                      <p className="text-white font-bold text-lg mt-1">{campaignStats.smsCampaigns}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funnel">
            <Card className="gradient-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white">Cart Recovery Conversion Funnel</CardTitle>
                <CardDescription className="text-slate-300">
                  Track abandoned cart recovery performance from cart to conversion
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cartRecoveryLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <Skeleton className="h-full w-full bg-slate-700" />
                  </div>
                ) : cartRecoveryData ? (
                  <>
                    <ResponsiveContainer width="100%" height={320}>
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
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-sm">Recovery Rate</p>
                        <p className="text-white font-bold text-lg mt-1">
                          {cartRecoveryData.overview.recoveryRate.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-sm">Conversion Rate</p>
                        <p className="text-white font-bold text-lg mt-1">
                          {cartRecoveryData.overview.conversionRate.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-sm">Recovered Value</p>
                        <p className="text-white font-bold text-lg mt-1">
                          ${cartRecoveryData.overview.recoveredValue}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-400 text-sm">Potential Revenue</p>
                        <p className="text-white font-bold text-lg mt-1">
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
      <div className="mt-8 p-6 gradient-card rounded-2xl bg-[#16162c]">
        <div className="flex items-start space-x-4">
          <div className="transition-all duration-300">
            <Zap className="w-6 h-6 stroke-2 text-primary" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-2">AI-Powered Growth Intelligence</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Your Zyra AI is continuously analyzing customer behavior, optimizing product descriptions, and improving 
              conversion rates. The dashboard shows real-time performance metrics across all optimization channels 
              including email campaigns, SMS recovery, SEO improvements, and content ROI tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}