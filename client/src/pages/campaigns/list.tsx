import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { 
  Mail, 
  MessageSquare, 
  Calendar,
  TrendingUp,
  Eye,
  BarChart,
  Plus,
  Clock
} from "lucide-react";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  type: "email" | "sms";
  subject?: string;
  message: string;
  status: "draft" | "scheduled" | "sent" | "failed";
  scheduledFor?: string;
  sentAt?: string;
  audience: string;
  totalSent?: number;
  openRate?: number;
  clickRate?: number;
  conversionRate?: number;
  createdAt: string;
}

export default function CampaignListPage() {
  const [, setLocation] = useLocation();

  const { data: campaigns, isLoading, error } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });

  const getStatusBadge = (status: Campaign['status']) => {
    const variants: Record<Campaign['status'], { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      scheduled: { variant: "default", label: "Scheduled" },
      sent: { variant: "outline", label: "Sent" },
      failed: { variant: "destructive", label: "Failed" },
    };
    
    const config = variants[status] || variants.draft;
    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen dark-theme-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-300">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen dark-theme-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Failed to load campaigns</p>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageShell
      title="Campaigns"
      subtitle="Manage your email and SMS marketing campaigns"
      
      rightActions={
        <Button
          onClick={() => setLocation("/campaigns/create")}
          className="gradient-button h-9 sm:h-10 font-semibold"
          data-testid="button-create-campaign"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <span className="truncate">Create Campaign</span>
        </Button>
      }
    >
      {/* Empty State */}
      {(!campaigns || campaigns.length === 0) && (
        <DashboardCard testId="card-empty-campaigns">
          <div className="text-center py-8">
            <Mail className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4 opacity-50 flex-shrink-0" />
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No campaigns yet</h3>
            <p className="text-slate-400 mb-6 text-sm sm:text-base">
              Create your first email or SMS campaign to start engaging with customers
            </p>
            <Button
              onClick={() => setLocation("/campaigns/create")}
              className="gradient-button h-9 sm:h-10 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
              Create Your First Campaign
            </Button>
          </div>
        </DashboardCard>
      )}

      {/* Campaign Grid */}
      {campaigns && campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="group relative overflow-hidden gradient-card rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border border-slate-700/50 hover:border-primary/30">
              <div className="h-full p-3 sm:p-4 md:p-6 flex flex-col">
                <CardHeader className="p-0 flex-1 space-y-2 sm:space-y-3">
                  <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="text-primary flex-shrink-0">
                        {campaign.type === "email" ? (
                          <Mail className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                        ) : (
                          <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                        )}
                      </div>
                      <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white leading-tight truncate min-w-0">
                        {campaign.name}
                      </CardTitle>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(campaign.status)}
                    </div>
                  </div>
                  {campaign.type === "email" && campaign.subject && (
                    <CardDescription className="text-slate-300 font-medium text-xs sm:text-sm truncate">
                      Subject: {campaign.subject}
                    </CardDescription>
                  )}
                  <CardDescription className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3">
                    {campaign.message.length > 80 
                      ? `${campaign.message.substring(0, 80)}...` 
                      : campaign.message}
                  </CardDescription>
                </CardHeader>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  {/* Date */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 truncate">
                        {campaign.status === "sent" ? "Sent" : "Scheduled"}
                      </p>
                    </div>
                    <p className="text-[10px] sm:text-xs md:text-sm text-white font-medium truncate">
                      {format(new Date(campaign.sentAt || campaign.scheduledFor || new Date()), "MMM d, yyyy")}
                    </p>
                  </div>

                  {/* Total Sent */}
                  {campaign.totalSent !== undefined && (
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                        <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 truncate">Recipients</p>
                      </div>
                      <p className="text-[10px] sm:text-xs md:text-sm text-white font-medium truncate">
                        {campaign.totalSent.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Open Rate */}
                  {campaign.type === "email" && campaign.openRate !== undefined && (
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                        <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 truncate">Open Rate</p>
                      </div>
                      <p className="text-[10px] sm:text-xs md:text-sm text-white font-medium truncate">
                        {campaign.openRate.toFixed(1)}%
                      </p>
                    </div>
                  )}

                  {/* Conversion Rate */}
                  {campaign.conversionRate !== undefined && (
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                        <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 truncate">Conversion</p>
                      </div>
                      <p className="text-[10px] sm:text-xs md:text-sm text-white font-medium truncate">
                        {campaign.conversionRate.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setLocation(`/campaigns/${campaign.id}`)}
                    className="gradient-button w-full h-9 sm:h-10 text-xs sm:text-sm font-semibold"
                    data-testid={`button-view-${campaign.id}`}
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="truncate">View Details</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
