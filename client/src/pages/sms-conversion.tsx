import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, CardPageHeader } from "@/components/ui/standardized-layout";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Campaign } from "@shared/schema";
import { 
  MessageSquare, 
  TrendingUp, 
  DollarSign,
  Users,
  ShoppingCart,
  Eye,
  BarChart,
  AlertCircle,
  RefreshCw
} from "lucide-react";

export default function SmsConversion() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch campaigns from API
  const { data: allCampaigns, isLoading, error, isError } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns']
  });

  // Show toast notification when errors occur
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load SMS campaigns",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  // Filter for SMS campaigns only
  const smsCampaigns = allCampaigns?.filter(campaign => campaign.type === 'sms') || [];

  // Calculate metrics from real campaign data (with error guards)
  const totalSent = isError ? 0 : smsCampaigns.reduce((sum, campaign) => sum + (campaign.sentCount || 0), 0);
  const totalRevenue = isError ? 0 : smsCampaigns.reduce((sum, campaign) => {
    const metadata = campaign.metadata as any;
    return sum + (metadata?.revenue || 0);
  }, 0);
  
  // Calculate conversions from campaign metadata
  const totalConverted = isError ? 0 : smsCampaigns.reduce((sum, campaign) => {
    const metadata = campaign.metadata as any;
    return sum + (metadata?.conversions || 0);
  }, 0);
  
  const avgConversionRate = totalSent > 0 ? (totalConverted / totalSent * 100).toFixed(1) : '0.0';

  // Error State
  if (isError) {
    return (
      <div className="min-h-screen dark-theme-bg">
        <CardPageHeader title="SMS Conversion" />
        <PageContainer>
          <Card className="dark-theme-bg" data-testid="error-state">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Failed to Load SMS Campaigns</h3>
              <p className="text-red-400 mb-4">Please try again.</p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] })}
                className="gradient-button"
                data-testid="button-retry"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark-theme-bg">
      <CardPageHeader title="SMS Conversion" />
      <PageContainer>
        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card" data-testid="card-total-sms-sent">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="p-2 sm:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate" data-testid="text-total-sms-sent">
                      {totalSent.toLocaleString()}
                    </h3>
                    <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Total SMS Sent</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card" data-testid="card-total-conversions">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="p-2 sm:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate" data-testid="text-total-conversions">
                      {totalConverted}
                    </h3>
                    <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Conversions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card" data-testid="card-conversion-rate">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="p-2 sm:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate" data-testid="text-conversion-rate">
                      {avgConversionRate}%
                    </h3>
                    <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Conversion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card" data-testid="card-total-revenue">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="p-2 sm:p-3 rounded-full bg-slate-800/50 flex-shrink-0">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate" data-testid="text-total-revenue">
                      ${totalRevenue.toFixed(0)}
                    </h3>
                    <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Revenue Generated</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Campaign Performance */}
        <Card className="dark-theme-bg">
          <CardHeader>
            <CardTitle className="text-white">SMS Campaign Performance</CardTitle>
            <CardDescription className="text-slate-300">
              Track abandoned cart recovery and SMS marketing campaign results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-slate-800/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-full max-w-2xl" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <div key={j} className="text-center space-y-2">
                          <Skeleton className="h-6 w-16 mx-auto" />
                          <Skeleton className="h-4 w-20 mx-auto" />
                          <Skeleton className="h-5 w-16 mx-auto" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : smsCampaigns.length === 0 ? (
              <div className="text-center py-12" data-testid="empty-state-sms-campaigns">
                <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">No SMS campaigns yet</h3>
                <p className="text-slate-300 mb-6">Send your first SMS campaign to recover abandoned carts</p>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setLocation('/abandoned-cart-sms')}
                  data-testid="button-create-sms-campaign"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send SMS Campaign
                </Button>
              </div>
            ) : (
              smsCampaigns.map((campaign) => {
                const metadata = campaign.metadata as any || {};
                const sentCount = campaign.sentCount || 0;
                const delivered = metadata.delivered || sentCount;
                const clicked = metadata.clicked || 0;
                const conversions = metadata.conversions || 0;
                const revenue = metadata.revenue || 0;
                const deliveryRate = sentCount > 0 ? ((delivered / sentCount) * 100).toFixed(1) : '0.0';
                const clickRate = delivered > 0 ? ((clicked / delivered) * 100).toFixed(1) : '0.0';
                const conversionRate = clicked > 0 ? ((conversions / clicked) * 100).toFixed(1) : '0.0';
                const aov = conversions > 0 ? (revenue / conversions).toFixed(0) : '0';

                return (
                  <div key={campaign.id} className="bg-slate-800/30 rounded-lg p-4 space-y-3" data-testid={`campaign-${campaign.id}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-white font-semibold text-lg" data-testid={`campaign-name-${campaign.id}`}>
                          {campaign.name}
                        </h3>
                        <p className="text-slate-300 text-sm max-w-2xl" data-testid={`campaign-content-${campaign.id}`}>
                          {campaign.content}
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          {campaign.sentAt ? `Sent on ${new Date(campaign.sentAt).toLocaleDateString()}` : 
                           campaign.status === 'scheduled' ? `Scheduled for ${new Date(campaign.scheduledFor!).toLocaleDateString()}` : 
                           `Created ${new Date(campaign.createdAt!).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-slate-600 text-slate-300 hover:bg-white/10"
                          data-testid={`button-view-campaign-${campaign.id}`}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          className="gradient-button"
                          data-testid={`button-details-campaign-${campaign.id}`}
                        >
                          <BarChart className="w-4 h-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-white" data-testid={`campaign-sent-${campaign.id}`}>
                          {sentCount}
                        </p>
                        <p className="text-slate-400 text-sm">Sent</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-white" data-testid={`campaign-delivered-${campaign.id}`}>
                          {delivered}
                        </p>
                        <p className="text-slate-400 text-sm">Delivered</p>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs mt-1">
                          {deliveryRate}%
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-white" data-testid={`campaign-clicked-${campaign.id}`}>
                          {clicked}
                        </p>
                        <p className="text-slate-400 text-sm">Clicked</p>
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs mt-1">
                          {clickRate}%
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-white" data-testid={`campaign-conversions-${campaign.id}`}>
                          {conversions}
                        </p>
                        <p className="text-slate-400 text-sm">Converted</p>
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs mt-1">
                          {conversionRate}%
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-white" data-testid={`campaign-revenue-${campaign.id}`}>
                          ${revenue.toFixed(0)}
                        </p>
                        <p className="text-slate-400 text-sm">Revenue</p>
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 text-xs mt-1">
                          ${aov} AOV
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
}