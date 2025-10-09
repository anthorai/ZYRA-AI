import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDashboard } from "@/hooks/useDashboard";
import { 
  ShoppingBag,
  Mail,
  MessageSquare,
  Search,
  TrendingUp,
  DollarSign,
  BarChart3,
  Zap
} from "lucide-react";

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
  
  // Fetch real campaign stats
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
        icon: <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-2 text-primary" />,
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
        icon: <Mail className="w-4 h-4 sm:w-5 sm:h-5 stroke-2 text-primary" />,
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
        icon: <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 stroke-2 text-primary" />,
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
        icon: <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-2 text-primary" />,
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
        icon: <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 stroke-2 text-primary" />,
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
        icon: <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 stroke-2 text-primary" />,
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
      'ab-test-results': '/analytics/ab-test-results'
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

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Growth Analytics Dashboard
            </h1>
            <p className="text-slate-300 text-sm sm:text-base lg:text-lg">
              Track your store's performance, optimization impact, and revenue growth powered by Zyra AI
            </p>
          </div>
        </div>
      </div>
      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch auto-rows-fr">
        {isLoading ? (
          // Show skeleton loaders while data is loading
          (Array.from({ length: 6 }, (_, index) => (
            <Card key={`skeleton-${index}`} className="gradient-card rounded-2xl border-slate-700/50 flex flex-col h-full">
              <CardHeader className="pb-4 min-h-[120px]">
                <div className="flex items-center justify-between mb-3 min-h-[48px]">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded bg-slate-700" />
                    <Skeleton className="h-5 w-32 bg-slate-700" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full ml-11 bg-slate-700 mb-2" />
                <Skeleton className="h-4 w-3/4 ml-11 bg-slate-700" />
              </CardHeader>
              <CardContent className="pt-0 pb-6 px-6 mt-auto">
                <Skeleton className="h-10 w-full bg-slate-700" />
              </CardContent>
            </Card>
          )))
        ) : (
          analyticsCards.map((card) => (
          <Card 
            key={card.id} 
            className="relative gradient-card rounded-2xl transition-all duration-300 hover:scale-105 border-slate-700/50 hover:shadow-cyan-500/30 flex flex-col h-full"
            data-testid={`card-analytics-${card.id}`}
          >
            <CardHeader className="pb-4 min-h-[120px]">
              {/* Card Header with Consistent Flex Layout */}
              <div className="flex items-center justify-between mb-3 min-h-[48px]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 transition-all duration-300">
                    {card.icon}
                  </div>
                  <CardTitle className="text-white font-bold text-sm sm:text-base lg:text-lg flex items-center whitespace-nowrap truncate" data-testid={`text-title-${card.id}`}>
                    {card.title}
                  </CardTitle>
                </div>
              </div>
              <CardDescription className="text-slate-300 text-xs sm:text-sm leading-relaxed ml-7 sm:ml-11 min-h-[40px]" data-testid={`text-description-${card.id}`}>
                {card.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-6 px-6 mt-auto">
              <Button
                onClick={() => handleAnalyticsAction(card.id)}
                className="gradient-button h-10 w-full font-medium transition-all duration-300 hover:scale-105"
                data-testid={`button-action-${card.id}`}
              >
                {card.actionText}
              </Button>
            </CardContent>
          </Card>
          ))
        )}
      </div>
      {/* Growth Summary */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="gradient-card rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-slate-800/50 transition-all duration-300">
              <TrendingUp className="w-6 h-6 stroke-2 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">+89%</h3>
              <p className="text-slate-300 text-sm">Overall Growth</p>
            </div>
          </div>
        </Card>
        
        <Card className="gradient-card rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-slate-800/50 transition-all duration-300">
              <DollarSign className="w-6 h-6 stroke-2 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">$45,623</h3>
              <p className="text-slate-300 text-sm">Total AI Impact</p>
            </div>
          </div>
        </Card>
        
        <Card className="gradient-card rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-slate-800/50 transition-all duration-300">
              <Zap className="w-6 h-6 stroke-2 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">247</h3>
              <p className="text-slate-300 text-sm">Products Optimized</p>
            </div>
          </div>
        </Card>
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