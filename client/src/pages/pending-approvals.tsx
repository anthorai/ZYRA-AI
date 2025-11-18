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
import { Check, X, Bot, TrendingUp, Mail, ShoppingCart, DollarSign, AlertCircle, Sparkles, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
      return await apiRequest(`/api/pending-approvals/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
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
      return await apiRequest(`/api/pending-approvals/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
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

  // Empty state
  if (!isLoading && filteredApprovals.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <UnifiedHeader
          title="Pending Approvals"
          subtitle="Review and approve AI recommendations"
          backTo="/dashboard"
        />
        <div className="flex-1 p-4 sm:p-6 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-title">
                No Pending Approvals
              </h3>
              <p className="text-muted-foreground text-sm" data-testid="text-empty-description">
                {activeTab === "all"
                  ? "All AI recommendations have been reviewed. New recommendations will appear here when created."
                  : `No pending ${getActionLabel(activeTab)} recommendations at this time.`}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <UnifiedHeader
        title="Pending Approvals"
        subtitle="Review and approve AI recommendations"
        backTo="/dashboard"
      />

      <div className="flex-1 p-4 sm:p-6">
        {/* Manual Mode Disclaimer */}
        <Alert className="mb-6 border-blue-500/30 bg-blue-500/10" data-testid="alert-manual-mode-disclaimer">
          <Info className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-sm text-muted-foreground" data-testid="text-disclaimer-message">
            <strong className="text-foreground">Manual Mode:</strong> Approved actions execute immediately.
            Marketing and cart recovery messages may be sent outside quiet hours (9 AM - 9 PM).
            For fully autonomous operation with all safety guardrails, switch to Autonomous Mode in settings.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActionTypeFilter)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="all" data-testid="tab-all">
              All
            </TabsTrigger>
            <TabsTrigger value="optimize_seo" data-testid="tab-seo">
              SEO
            </TabsTrigger>
            <TabsTrigger value="send_campaign" data-testid="tab-marketing">
              Marketing
            </TabsTrigger>
            <TabsTrigger value="send_cart_recovery" data-testid="tab-cart">
              Cart Recovery
            </TabsTrigger>
            <TabsTrigger value="adjust_price" data-testid="tab-pricing">
              Pricing
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
