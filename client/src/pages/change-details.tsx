import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/dashboard/sidebar";

function stripHtmlTags(html: string): string {
  if (!html) return '';
  let text = html;
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<li[^>]*>/gi, '  \u2022 ');
  text = text.replace(/<\/ul>|<\/ol>/gi, '\n');
  text = text.replace(/<[^>]*>/g, '');
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}
import Footer from "@/components/ui/footer";
import NotificationCenter from "@/components/dashboard/notification-center";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import { 
  ArrowLeft,
  Check, 
  X, 
  RotateCcw, 
  Package,
  Zap,
  Sparkles,
  Upload,
  ArrowRight,
  Clock,
  FileText,
  Tag,
  Menu,
  DollarSign,
  Activity
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

type ActionStatus = "pending" | "approved" | "completed" | "failed" | "rolled_back" | "rejected" | "dry_run";

interface ChangeItem {
  id: string;
  userId: string;
  actionType: string;
  entityType: string | null;
  entityId: string | null;
  status: ActionStatus;
  decisionReason: string | null;
  ruleId: string | null;
  payload: any;
  result: any;
  estimatedImpact: any;
  actualImpact: any;
  executedBy: string;
  dryRun: boolean;
  publishedToShopify: boolean;
  createdAt: string;
  completedAt: string | null;
  rolledBackAt: string | null;
  productName?: string;
  productImage?: string;
}

interface FieldChange {
  field: string;
  before: string;
  after: string;
  reason?: string;
}

function getStatusBadge(status: ActionStatus) {
  const statusConfig: Record<ActionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
    pending: { label: "Pending", variant: "outline", className: "border-yellow-500/50 text-yellow-400" },
    approved: { label: "Approved", variant: "outline", className: "border-blue-500/50 text-blue-400" },
    completed: { label: "Applied", variant: "default", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    dry_run: { label: "Preview", variant: "outline", className: "border-cyan-500/50 text-cyan-400" },
    failed: { label: "Failed", variant: "destructive", className: "" },
    rolled_back: { label: "Rolled Back", variant: "outline", className: "border-slate-500/50 text-slate-400" },
    rejected: { label: "Rejected", variant: "outline", className: "border-red-500/50 text-red-400" },
  };
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

function formatCurrency(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return "$0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
}

function normalizeFieldLabel(field: string): string {
  const normalizations: Record<string, string> = {
    'title': 'Title Tag',
    'Product Title': 'Title Tag',
    'description': 'Product Description',
    'seoTitle': 'Meta Title',
    'SEO Title': 'Meta Title',
    'metaDescription': 'Meta Description',
  };
  return normalizations[field] || field;
}

function extractFieldChanges(change: ChangeItem): FieldChange[] {
  const changesMap = new Map<string, FieldChange>();

  if (change.payload?.changes && Array.isArray(change.payload.changes)) {
    for (const fieldChange of change.payload.changes) {
      const normalizedField = normalizeFieldLabel(fieldChange.field || "Unknown Field");
      const existing = changesMap.get(normalizedField);
      changesMap.set(normalizedField, {
        field: normalizedField,
        before: existing?.before || (fieldChange.before !== undefined && fieldChange.before !== null ? String(fieldChange.before) : ""),
        after: existing?.after || (fieldChange.after !== undefined && fieldChange.after !== null ? String(fieldChange.after) : ""),
        reason: existing?.reason || fieldChange.reason,
      });
    }
  }

  if (change.result?.changes && Array.isArray(change.result.changes)) {
    for (const fieldChange of change.result.changes) {
      const normalizedField = normalizeFieldLabel(fieldChange.field || "Unknown Field");
      const existing = changesMap.get(normalizedField);
      if (!existing) {
        changesMap.set(normalizedField, {
          field: normalizedField,
          before: fieldChange.before !== undefined && fieldChange.before !== null ? String(fieldChange.before) : "",
          after: fieldChange.after !== undefined && fieldChange.after !== null ? String(fieldChange.after) : "",
          reason: fieldChange.reason,
        });
      } else if (!existing.after && fieldChange.after) {
        existing.after = String(fieldChange.after);
      }
    }
  }

  if (change.payload?.before && typeof change.payload.before === 'object') {
    const fieldMappings = [
      { key: 'title', label: 'Title Tag' },
      { key: 'description', label: 'Product Description' },
      { key: 'seoTitle', label: 'Meta Title' },
      { key: 'metaDescription', label: 'Meta Description' },
    ];
    
    for (const mapping of fieldMappings) {
      if (change.payload.before[mapping.key] || change.payload?.after?.[mapping.key]) {
        const existing = changesMap.get(mapping.label);
        if (!existing) {
          changesMap.set(mapping.label, {
            field: mapping.label,
            before: change.payload.before[mapping.key] || "",
            after: change.payload?.after?.[mapping.key] || "",
          });
        } else {
          if (!existing.before && change.payload.before[mapping.key]) {
            existing.before = change.payload.before[mapping.key];
          }
          if (!existing.after && change.payload?.after?.[mapping.key]) {
            existing.after = change.payload?.after?.[mapping.key];
          }
        }
      }
    }
  }

  const optimized = change.payload?.optimizedCopy || change.result?.optimizedContent;
  if (optimized && typeof optimized === 'object') {
    const fieldMappings = [
      { key: 'title', label: 'Title Tag' },
      { key: 'description', label: 'Product Description' },
      { key: 'seoTitle', label: 'Meta Title' },
      { key: 'metaDescription', label: 'Meta Description' },
    ];
    
    for (const mapping of fieldMappings) {
      if (optimized[mapping.key]) {
        const existing = changesMap.get(mapping.label);
        if (!existing) {
          changesMap.set(mapping.label, {
            field: mapping.label,
            before: "",
            after: optimized[mapping.key],
          });
        } else if (!existing.after) {
          existing.after = optimized[mapping.key];
        }
      }
    }
  }

  return Array.from(changesMap.values());
}

export default function ChangeDetailsPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams();
  const actionId = params.id;
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const handleTabChange = (tab: string) => {
    navigate(`/${tab}`);
  };

  const { data: changes, isLoading: changesLoading } = useQuery<ChangeItem[]>({
    queryKey: ["/api/autonomous-actions"],
  });

  const change = changes?.find(c => c.id === actionId);

  const rollbackMutation = useMutation({
    mutationFn: async (actionId: string) => {
      return await apiRequest("POST", `/api/autonomous-actions/${actionId}/rollback`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Change rolled back",
        description: "The product has been restored to its original state.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rollback failed",
        description: error.message || "Failed to rollback the change.",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (actionId: string) => {
      return await apiRequest("POST", `/api/autonomous-actions/${actionId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Change approved",
        description: "The optimization has been approved and will be applied.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Approval failed",
        description: error.message || "Failed to approve the change.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (actionId: string) => {
      return await apiRequest("POST", `/api/autonomous-actions/${actionId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Change rejected",
        description: "The optimization has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection failed",
        description: error.message || "Failed to reject the change.",
        variant: "destructive",
      });
    },
  });

  const pushToShopifyMutation = useMutation({
    mutationFn: async (actionId: string) => {
      return await apiRequest("POST", `/api/autonomous-actions/${actionId}/push-to-shopify`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Pushed to Shopify",
        description: "The changes have been published to your Shopify store.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Push failed",
        description: error.message || "Failed to push changes to Shopify.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || changesLoading) {
    return (
      <div className="min-h-screen flex dark-theme-bg">
        <Sidebar 
          activeTab="change-control" 
          onTabChange={handleTabChange} 
          user={user} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 border-b border-border dark-theme-bg/95 backdrop-blur">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSidebarOpen(true)}
                  data-testid="button-mobile-menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <Skeleton className="h-8 w-48" />
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!change) {
    return (
      <div className="min-h-screen flex dark-theme-bg">
        <Sidebar 
          activeTab="change-control" 
          onTabChange={handleTabChange} 
          user={user} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 border-b border-border dark-theme-bg/95 backdrop-blur">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/change-control")}
                  className="gap-2"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
            <Card className="max-w-md w-full">
              <CardContent className="pt-6 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold mb-2">Change Not Found</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  The change you're looking for doesn't exist or has been removed.
                </p>
                <Button onClick={() => navigate("/change-control")} data-testid="button-go-back">
                  Go Back to Change Control
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const fieldChanges = extractFieldChanges(change);
  const productName = change.productName || change.payload?.productName || "Unknown Product";
  const actionLabel = change.payload?.actionLabel || change.actionType;
  const aiMode = change.payload?.aiMode || change.result?.aiMode;

  return (
    <div className="min-h-screen flex dark-theme-bg">
      <Sidebar 
          activeTab="change-control" 
          onTabChange={handleTabChange} 
          user={user} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 border-b border-border dark-theme-bg/95 backdrop-blur">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
                data-testid="button-mobile-menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/change-control")}
                className="gap-2"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Change Control
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <NotificationCenter />
              <AvatarMenu />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  {change.productImage ? (
                    <img 
                      src={change.productImage} 
                      alt="" 
                      className="w-20 h-20 rounded-lg object-cover border border-border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      {getStatusBadge(change.status)}
                      {aiMode === 'fast' && (
                        <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 gap-1">
                          <Zap className="w-3 h-3" />
                          Fast Mode
                        </Badge>
                      )}
                      {aiMode === 'quality' && (
                        <Badge variant="outline" className="border-amber-500/50 text-amber-400 gap-1">
                          <Sparkles className="w-3 h-3" />
                          Quality Mode
                        </Badge>
                      )}
                      {change.publishedToShopify && (
                        <Badge variant="outline" className="border-green-500/50 text-green-400 gap-1">
                          <Check className="w-3 h-3" />
                          Published
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl mb-1" data-testid="text-product-name">{productName}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Tag className="w-3 h-3" />
                      {actionLabel}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Expected Impact</p>
                    <p className="text-lg font-bold text-green-400">
                      +{formatCurrency(change.estimatedImpact?.expectedRevenue || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                    <p className="text-lg font-bold">
                      {change.estimatedImpact?.confidence || 85}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Created</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(change.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Fields Changed</p>
                    <p className="text-lg font-bold">{fieldChanges.length}</p>
                  </div>
                </div>

                {change.decisionReason && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Why ZYRA recommends this
                    </h4>
                    <p className="text-sm text-muted-foreground">{change.decisionReason}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {change.status === "pending" && (
                    <>
                      <Button 
                        onClick={() => approveMutation.mutate(change.id)}
                        disabled={approveMutation.isPending}
                        className="gap-2"
                        data-testid="button-approve"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => rejectMutation.mutate(change.id)}
                        disabled={rejectMutation.isPending}
                        className="gap-2"
                        data-testid="button-reject"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  {(change.status === "completed" || change.status === "dry_run" || change.status === "pending" || change.status === "rolled_back") && 
                   !change.publishedToShopify && (
                    <Button 
                      variant="outline"
                      onClick={() => pushToShopifyMutation.mutate(change.id)}
                      disabled={pushToShopifyMutation.isPending}
                      className="gap-2"
                      data-testid="button-push-shopify"
                    >
                      <Upload className="w-4 h-4" />
                      Push to Shopify
                    </Button>
                  )}
                  {(change.status === "completed" || change.status === "dry_run") && (
                    <Button 
                      variant="destructive"
                      onClick={() => rollbackMutation.mutate(change.id)}
                      disabled={rollbackMutation.isPending}
                      className="gap-2"
                      data-testid="button-rollback"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Rollback
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Before & After Comparison
              </h2>

              {fieldChanges.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No field changes recorded for this optimization.</p>
                  </CardContent>
                </Card>
              ) : (
                fieldChanges.map((fieldChange, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary" />
                        {fieldChange.field}
                      </CardTitle>
                      {fieldChange.reason && (
                        <CardDescription>{fieldChange.reason}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-muted/30 border border-muted">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-xs border-slate-500/50 text-slate-400">
                              Before
                            </Badge>
                            {!fieldChange.before && (
                              <span className="text-xs text-muted-foreground italic">Not Optimized</span>
                            )}
                          </div>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {fieldChange.before ? stripHtmlTags(fieldChange.before) : (
                              <span className="text-muted-foreground italic">Empty or not set</span>
                            )}
                          </div>
                        </div>

                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-xs border-green-500/50 text-green-400 gap-1">
                              <ArrowRight className="w-3 h-3" />
                              After
                            </Badge>
                            <span className="text-xs text-green-400">Optimized</span>
                          </div>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
                            {fieldChange.after ? stripHtmlTags(fieldChange.after) : (
                              <span className="text-muted-foreground italic">No changes</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {change.result && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Execution Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <p className="text-sm font-medium">
                        {change.result.success ? "Successful" : "Failed"}
                      </p>
                    </div>
                    {change.result.changesApplied !== undefined && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Changes Applied</p>
                        <p className="text-sm font-medium">{change.result.changesApplied}</p>
                      </div>
                    )}
                  </div>
                  {change.result.impactExplanation && (
                    <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-sm text-green-400">{change.result.impactExplanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
