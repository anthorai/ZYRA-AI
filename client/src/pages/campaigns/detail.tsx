import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/ui/page-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Mail, 
  MessageSquare, 
  Calendar,
  TrendingUp,
  Eye,
  Users,
  Clock,
  ArrowLeft,
  Send,
  Edit,
  Trash2,
  MousePointerClick,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  type: "email" | "sms";
  subject?: string;
  message?: string;
  content?: string;
  status: "draft" | "scheduled" | "sent" | "failed";
  scheduledFor?: string;
  sentAt?: string;
  audience?: string;
  totalSent?: number;
  openRate?: number;
  clickRate?: number;
  conversionRate?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function CampaignDetailPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/campaigns/:id");
  const campaignId = params?.id;
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: campaign, isLoading, error } = useQuery<Campaign>({
    queryKey: ['/api/campaigns', campaignId],
    enabled: !!campaignId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/campaigns/${campaignId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campaign Deleted",
        description: "The campaign has been permanently deleted.",
      });
      setLocation("/campaigns");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete campaign",
        variant: "destructive",
      });
    },
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
      <Badge variant={config.variant} className="capitalize text-sm px-3 py-1">
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return "N/A";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen dark-theme-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-300">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen dark-theme-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load campaign</p>
          <Button
            onClick={() => setLocation("/campaigns")}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  const messageContent = campaign.message || campaign.content || '';

  return (
    <PageShell
      title={campaign.name}
      subtitle={`${campaign.type === 'email' ? 'Email' : 'SMS'} Campaign`}
      backTo="/campaigns"
      rightActions={
        <div className="flex gap-2 flex-wrap">
          {campaign.status === 'draft' && (
            <>
              <Button
                variant="outline"
                className="text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10"
                onClick={() => setShowDeleteDialog(true)}
                data-testid="button-delete-header"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation(`/campaigns/${campaign.id}/edit`)}
                data-testid="button-edit-campaign"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                className="gradient-button"
                data-testid="button-send-campaign"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Details Card */}
          <Card className="gradient-card border-slate-700/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {campaign.type === "email" ? (
                      <Mail className="w-6 h-6 text-primary" />
                    ) : (
                      <MessageSquare className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">{campaign.name}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {campaign.type === 'email' ? 'Email Campaign' : 'SMS Campaign'}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(campaign.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaign.type === 'email' && campaign.subject && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-1">Subject Line</h4>
                  <p className="text-white font-medium">{campaign.subject}</p>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Message Content</h4>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <p className="text-slate-300 whitespace-pre-wrap">{messageContent}</p>
                </div>
              </div>

              {campaign.audience && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-1">Target Audience</h4>
                  <Badge variant="secondary" className="capitalize">
                    {campaign.audience}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card className="gradient-card border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaign.createdAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                    <div>
                      <p className="text-sm text-slate-400">Created</p>
                      <p className="text-white">{formatDate(campaign.createdAt)}</p>
                    </div>
                  </div>
                )}
                {campaign.scheduledFor && campaign.status === 'scheduled' && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <div>
                      <p className="text-sm text-slate-400">Scheduled For</p>
                      <p className="text-white">{formatDate(campaign.scheduledFor)}</p>
                    </div>
                  </div>
                )}
                {campaign.sentAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="text-sm text-slate-400">Sent</p>
                      <p className="text-white">{formatDate(campaign.sentAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Performance Stats */}
          <Card className="gradient-card border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300 text-sm">Recipients</span>
                </div>
                <span className="text-white font-semibold">
                  {campaign.totalSent?.toLocaleString() || '0'}
                </span>
              </div>

              {campaign.type === 'email' && (
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300 text-sm">Open Rate</span>
                  </div>
                  <span className="text-white font-semibold">
                    {campaign.openRate?.toFixed(1) || '0'}%
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300 text-sm">Click Rate</span>
                </div>
                <span className="text-white font-semibold">
                  {campaign.clickRate?.toFixed(1) || '0'}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300 text-sm">Conversion</span>
                </div>
                <span className="text-white font-semibold">
                  {campaign.conversionRate?.toFixed(1) || '0'}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="gradient-card border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setLocation("/campaigns")}
                data-testid="button-back-to-list"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Campaigns
              </Button>
              {campaign.status === 'draft' && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => setShowDeleteDialog(true)}
                  data-testid="button-delete-campaign"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Campaign
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete "{campaign.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
