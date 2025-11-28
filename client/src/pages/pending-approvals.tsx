import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { UnifiedHeader } from "@/components/ui/unified-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Bot, TrendingUp, Mail, ShoppingCart, DollarSign, AlertCircle, Sparkles, Info, Sun, Shield, CheckCircle2, XCircle, Clock, Zap } from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

type PendingApproval = {
  id: string;
  userId: string;
  actionType: "optimize_seo" | "send_campaign" | "send_cart_recovery" | "adjust_price";
  entityId: string | null;
  entityType: string | null;
  recommendedAction: any;
  aiReasoning: string;
  status: "pending" | "approved" | "rejected";
  priority: "low" | "medium" | "high" | "urgent";
  estimatedImpact: any;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  executedActionId: string | null;
};

type ActionTypeFilter = "all" | "optimize_seo" | "send_campaign" | "send_cart_recovery" | "adjust_price";

const ACTION_TYPE_LABELS: Record<string, { label: string; icon: any }> = {
  optimize_seo: { label: "SEO Optimization", icon: TrendingUp },
  send_campaign: { label: "Marketing Campaign", icon: Mail },
  send_cart_recovery: { label: "Cart Recovery", icon: ShoppingCart },
  adjust_price: { label: "Price Adjustment", icon: DollarSign },
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export default function PendingApprovals() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActionTypeFilter>("all");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "approve" | "reject" | null;
    approvalId: string | null;
    actionType: string | null;
  }>({
    open: false,
    type: null,
    approvalId: null,
    actionType: null,
  });

  // Fetch pending approvals
  const { data: approvals, isLoading } = useQuery<PendingApproval[]>({
    queryKey: ["/api/pending-approvals"],
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/pending-approvals/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Action Approved",
        description: "The AI recommendation has been approved and will be executed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve the action. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/pending-approvals/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Action Rejected",
        description: "The AI recommendation has been rejected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject the action. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter approvals by action type
  const filteredApprovals = approvals?.filter((approval) => {
    if (activeTab === "all") return approval.status === "pending";
    return approval.status === "pending" && approval.actionType === activeTab;
  }) || [];

  // Calculate summary statistics
  const pendingApprovals = approvals?.filter(a => a.status === "pending") || [];
  const summaryStats = {
    total: pendingApprovals.length,
    seo: pendingApprovals.filter(a => a.actionType === "optimize_seo").length,
    marketing: pendingApprovals.filter(a => a.actionType === "send_campaign").length,
    cartRecovery: pendingApprovals.filter(a => a.actionType === "send_cart_recovery").length,
    pricing: pendingApprovals.filter(a => a.actionType === "adjust_price").length,
    urgent: pendingApprovals.filter(a => a.priority === "urgent").length,
    high: pendingApprovals.filter(a => a.priority === "high").length,
  };

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.all(
        ids.map(id => 
          apiRequest("POST", `/api/pending-approvals/${id}/approve`)
            .catch(err => ({ error: true, id }))
        )
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "All Actions Approved",
        description: `${filteredApprovals.length} recommendations have been approved and will be executed.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Some actions failed to approve. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk reject mutation
  const bulkRejectMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.all(
        ids.map(id => 
          apiRequest("POST", `/api/pending-approvals/${id}/reject`)
            .catch(err => ({ error: true, id }))
        )
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pending-approvals"] });
      toast({
        title: "All Actions Rejected",
        description: `${filteredApprovals.length} recommendations have been rejected.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Some actions failed to reject. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBulkApprove = () => {
    const ids = filteredApprovals.map(a => a.id);
    bulkApproveMutation.mutate(ids);
  };

  const handleBulkReject = () => {
    const ids = filteredApprovals.map(a => a.id);
    bulkRejectMutation.mutate(ids);
  };

  // Handle approve/reject with confirmation
  const handleAction = (type: "approve" | "reject", approvalId: string, actionType: string) => {
    setConfirmDialog({
      open: true,
      type,
      approvalId,
      actionType,
    });
  };

  const handleConfirm = () => {
    if (!confirmDialog.approvalId || !confirmDialog.type) return;

    if (confirmDialog.type === "approve") {
      approveMutation.mutate(confirmDialog.approvalId);
    } else {
      rejectMutation.mutate(confirmDialog.approvalId);
    }

    setConfirmDialog({ open: false, type: null, approvalId: null, actionType: null });
  };

  const handleCancel = () => {
    setConfirmDialog({ open: false, type: null, approvalId: null, actionType: null });
  };

  const getActionIcon = (actionType: string) => {
    const IconComponent = ACTION_TYPE_LABELS[actionType]?.icon || Sparkles;
    return <IconComponent className="w-5 h-5" />;
  };

  const getActionLabel = (actionType: string) => {
    return ACTION_TYPE_LABELS[actionType]?.label || actionType;
  };

  // Morning Summary Component
  const MorningSummary = () => (
    <div className="mb-6 space-y-4">
      {/* Greeting and Safety Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-4 sm:p-6 border border-primary/20">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="p-3 bg-primary/20 rounded-full">
            <Sun className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold mb-1" data-testid="text-greeting">
              {getGreeting()}! Here's Your AI Report
            </h2>
            <p className="text-muted-foreground text-sm" data-testid="text-report-date">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* Safety Assurance */}
        <div className="mt-4 flex items-center gap-2 bg-emerald-500/10 rounded-md p-3 border border-emerald-500/20">
          <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm text-emerald-400" data-testid="text-safety-message">
            <strong>Protected Mode:</strong> Nothing is pushed to your Shopify store without your explicit approval below.
          </p>
        </div>
      </div>

      {/* Summary Stats Grid */}
      {summaryStats.total > 0 && (
        <div className="space-y-3">
          {/* Action Types Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card className="bg-card/50">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-primary" data-testid="stat-total">
                  {summaryStats.total}
                </div>
                <p className="text-xs text-muted-foreground">Total Pending</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-chart-2" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-chart-2" data-testid="stat-seo">
                  {summaryStats.seo}
                </div>
                <p className="text-xs text-muted-foreground">SEO Fixes</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Mail className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-blue-400" data-testid="stat-marketing">
                  {summaryStats.marketing}
                </div>
                <p className="text-xs text-muted-foreground">Marketing</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ShoppingCart className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-purple-400" data-testid="stat-cart">
                  {summaryStats.cartRecovery}
                </div>
                <p className="text-xs text-muted-foreground">Cart Recovery</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-400" data-testid="stat-pricing">
                  {summaryStats.pricing}
                </div>
                <p className="text-xs text-muted-foreground">Price Changes</p>
              </CardContent>
            </Card>
          </div>

          {/* Priority Row (only show if there are urgent/high priority items) */}
          {(summaryStats.urgent > 0 || summaryStats.high > 0) && (
            <div className="flex flex-wrap gap-3 justify-center">
              {summaryStats.urgent > 0 && (
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 px-3 py-1">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {summaryStats.urgent} Urgent
                </Badge>
              )}
              {summaryStats.high > 0 && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 px-3 py-1">
                  {summaryStats.high} High Priority
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      {filteredApprovals.length > 1 && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Quick Actions</p>
                  <p className="text-xs text-muted-foreground">
                    Review all {filteredApprovals.length} {activeTab === "all" ? "" : getActionLabel(activeTab)} recommendations at once
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleBulkApprove}
                  disabled={bulkApproveMutation.isPending || bulkRejectMutation.isPending}
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
                  data-testid="button-bulk-approve"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve All ({filteredApprovals.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBulkReject}
                  disabled={bulkApproveMutation.isPending || bulkRejectMutation.isPending}
                  className="flex-1 sm:flex-none"
                  data-testid="button-bulk-reject"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Empty state
  if (!isLoading && summaryStats.total === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <UnifiedHeader
          title="AI Morning Report"
          subtitle="Review and approve AI recommendations"
          backTo="/dashboard"
        />
        <div className="flex-1 p-4 sm:p-6">
          {/* Show greeting even when empty */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-4 sm:p-6 border border-primary/20 mb-6">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="p-3 bg-primary/20 rounded-full">
                <Sun className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold mb-1" data-testid="text-greeting-empty">
                  {getGreeting()}! All Clear
                </h2>
                <p className="text-muted-foreground text-sm">
                  {format(new Date(), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Card className="max-w-md w-full">
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-title">
                  No Pending Approvals
                </h3>
                <p className="text-muted-foreground text-sm" data-testid="text-empty-description">
                  Your AI has been working! All recommendations have been reviewed. 
                  New findings will appear here after the next scan.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Next scan: Daily at 2 AM</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <UnifiedHeader
        title="AI Morning Report"
        subtitle="Review and approve AI recommendations"
        backTo="/dashboard"
      />

      <div className="flex-1 p-4 sm:p-6">
        {/* Morning Summary */}
        <MorningSummary />

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActionTypeFilter)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="all" data-testid="tab-all">
              All ({summaryStats.total})
            </TabsTrigger>
            <TabsTrigger value="optimize_seo" data-testid="tab-seo">
              SEO ({summaryStats.seo})
            </TabsTrigger>
            <TabsTrigger value="send_campaign" data-testid="tab-marketing">
              Marketing ({summaryStats.marketing})
            </TabsTrigger>
            <TabsTrigger value="send_cart_recovery" data-testid="tab-cart">
              Cart ({summaryStats.cartRecovery})
            </TabsTrigger>
            <TabsTrigger value="adjust_price" data-testid="tab-pricing">
              Pricing ({summaryStats.pricing})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              filteredApprovals.map((approval) => (
                <Card key={approval.id} className="hover-elevate" data-testid={`card-approval-${approval.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="text-primary flex-shrink-0">{getActionIcon(approval.actionType)}</div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg" data-testid={`text-action-type-${approval.id}`}>
                            {getActionLabel(approval.actionType)}
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm" data-testid={`text-created-at-${approval.id}`}>
                            {formatDistanceToNow(new Date(approval.createdAt), { addSuffix: true })}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        className={PRIORITY_COLORS[approval.priority]}
                        data-testid={`badge-priority-${approval.id}`}
                      >
                        {approval.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">AI Reasoning</span>
                        </div>
                        <p className="text-sm text-muted-foreground" data-testid={`text-reasoning-${approval.id}`}>
                          {approval.aiReasoning}
                        </p>
                      </div>

                      {approval.estimatedImpact && (
                        <div className="bg-muted/50 rounded-md p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-chart-2" />
                            <span className="text-sm font-medium">Estimated Impact</span>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {Object.entries(approval.estimatedImpact).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key.replace(/_/g, " ")}:</span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => handleAction("approve", approval.id, approval.actionType)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      data-testid={`button-approve-${approval.id}`}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAction("reject", approval.id, approval.actionType)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="flex-1"
                      data-testid={`button-reject-${approval.id}`}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === "approve" ? "Approve Action" : "Reject Action"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === "approve" ? (
                <>
                  Are you sure you want to approve this{" "}
                  <strong>{confirmDialog.actionType && getActionLabel(confirmDialog.actionType)}</strong> recommendation?
                  The AI will execute this action automatically.
                </>
              ) : (
                <>
                  Are you sure you want to reject this{" "}
                  <strong>{confirmDialog.actionType && getActionLabel(confirmDialog.actionType)}</strong> recommendation?
                  This action will be discarded and not executed.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                confirmDialog.type === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-destructive hover:bg-destructive/90"
              }
            >
              {confirmDialog.type === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
