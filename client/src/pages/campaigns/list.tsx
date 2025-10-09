import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
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
            onClick={() => setLocation('/dashboard')}
            variant="outline"
            className="mt-4"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark-theme-bg">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
              className="text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button
              onClick={() => setLocation("/campaigns/create")}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Marketing Campaigns</h1>
          <p className="text-slate-400">
            View and manage all your email and SMS campaigns
          </p>
        </div>

        {/* Empty State */}
        {(!campaigns || campaigns.length === 0) && (
          <Card className="dark-theme-bg border-slate-700">
            <CardContent className="py-12">
              <div className="text-center">
                <Mail className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">No campaigns yet</h3>
                <p className="text-slate-400 mb-6">
                  Create your first email or SMS campaign to start engaging with customers
                </p>
                <Button
                  onClick={() => setLocation("/campaigns/create")}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Campaign List */}
        {campaigns && campaigns.length > 0 && (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="dark-theme-bg border-slate-700 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {campaign.type === "email" ? (
                          <Mail className="w-5 h-5 text-primary" />
                        ) : (
                          <MessageSquare className="w-5 h-5 text-primary" />
                        )}
                        <CardTitle className="text-white text-xl">{campaign.name}</CardTitle>
                        {getStatusBadge(campaign.status)}
                      </div>
                      {campaign.type === "email" && campaign.subject && (
                        <CardDescription className="text-slate-300 font-medium">
                          Subject: {campaign.subject}
                        </CardDescription>
                      )}
                      <CardDescription className="text-slate-400 mt-1">
                        {campaign.message.length > 120 
                          ? `${campaign.message.substring(0, 120)}...` 
                          : campaign.message}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation(`/campaigns/${campaign.id}`)}
                        className="border-slate-600 text-slate-300 hover:bg-white/10"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {campaign.status === "sent" && (
                        <Button
                          size="sm"
                          onClick={() => setLocation(`/campaigns/${campaign.id}/analytics`)}
                          className="bg-primary/20 text-primary hover:bg-primary/30"
                        >
                          <BarChart className="w-4 h-4 mr-1" />
                          Analytics
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Scheduled/Sent Date */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-400">
                          {campaign.status === "sent" ? "Sent" : "Scheduled"}
                        </p>
                        <p className="text-sm text-white font-medium">
                          {formatDate(campaign.sentAt || campaign.scheduledFor)}
                        </p>
                      </div>
                    </div>

                    {/* Total Sent */}
                    {campaign.totalSent !== undefined && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-400">Recipients</p>
                          <p className="text-sm text-white font-medium">
                            {campaign.totalSent.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Open Rate */}
                    {campaign.type === "email" && campaign.openRate !== undefined && (
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-400">Open Rate</p>
                          <p className="text-sm text-white font-medium">
                            {campaign.openRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Click/Conversion Rate */}
                    {campaign.conversionRate !== undefined && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-400">Conversion</p>
                          <p className="text-sm text-white font-medium">
                            {campaign.conversionRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Audience */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-400">Audience</p>
                        <p className="text-sm text-white font-medium capitalize">
                          {campaign.audience.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
