import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/dashboard/sidebar";
import Footer from "@/components/ui/footer";
import NotificationCenter from "@/components/dashboard/notification-center";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import { 
  Check, 
  X, 
  RotateCcw, 
  TrendingUp, 
  Shield, 
  Clock,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Bot,
  Lock,
  Eye,
  Package,
  FileText,
  Image,
  Tag,
  ChevronRight,
  Activity,
  Zap,
  Settings2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  XCircle,
  Timer,
  Menu
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

type ActionStatus = "pending" | "running" | "completed" | "failed" | "rolled_back" | "dry_run";
type ActionType = "optimize_seo" | "fix_product" | "send_cart_recovery" | "run_ab_test" | "adjust_price" | "content_refresh" | "discoverability";
type RiskLevel = "low" | "medium" | "high";

interface ChangeItem {
  id: string;
  userId: string;
  actionType: ActionType;
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

interface AutomationSettings {
  id: string;
  globalAutopilotEnabled: boolean;
  autopilotEnabled: boolean;
  autopilotMode: "safe" | "balanced" | "aggressive";
  dryRunMode: boolean;
  autoPublishEnabled: boolean;
  maxDailyActions: number;
}

const ACTION_TYPE_CONFIG: Record<ActionType, { label: string; icon: any; color: string }> = {
  optimize_seo: { label: "SEO", icon: TrendingUp, color: "text-blue-400" },
  fix_product: { label: "Content", icon: FileText, color: "text-green-400" },
  send_cart_recovery: { label: "Recovery", icon: DollarSign, color: "text-yellow-400" },
  run_ab_test: { label: "A/B Test", icon: Activity, color: "text-purple-400" },
  adjust_price: { label: "Pricing", icon: DollarSign, color: "text-emerald-400" },
  content_refresh: { label: "Content", icon: FileText, color: "text-cyan-400" },
  discoverability: { label: "Discoverability", icon: Eye, color: "text-orange-400" },
};

const STATUS_CONFIG: Record<ActionStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: "Pending Approval", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  running: { label: "Applying", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  completed: { label: "Applied", color: "text-green-400", bgColor: "bg-green-500/20" },
  failed: { label: "Failed", color: "text-red-400", bgColor: "bg-red-500/20" },
  rolled_back: { label: "Rolled Back", color: "text-slate-400", bgColor: "bg-slate-500/20" },
  dry_run: { label: "Monitoring Impact", color: "text-purple-400", bgColor: "bg-purple-500/20" },
};

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  low: { label: "Low Risk", color: "text-green-400", bgColor: "bg-green-500/20 border-green-500/30" },
  medium: { label: "Medium Risk", color: "text-yellow-400", bgColor: "bg-yellow-500/20 border-yellow-500/30" },
  high: { label: "High Risk", color: "text-red-400", bgColor: "bg-red-500/20 border-red-500/30" },
};

function getRiskLevel(item: ChangeItem): RiskLevel {
  const impact = item.estimatedImpact;
  if (!impact) return "low";
  const revenueChange = Math.abs(parseFloat(impact?.expectedRevenue || "0"));
  if (revenueChange > 500) return "high";
  if (revenueChange > 100) return "medium";
  return "low";
}

function formatCurrency(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return "$0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
}

export default function ChangeControlDashboard() {
  const { toast } = useToast();
  const [selectedChange, setSelectedChange] = useState<ChangeItem | null>(null);
  const [settingsExpanded, setSettingsExpanded] = useState(true);

  const { data: changes, isLoading: changesLoading } = useQuery<ChangeItem[]>({
    queryKey: ["/api/autonomous-actions"],
  });

  const { data: settings } = useQuery<AutomationSettings>({
    queryKey: ["/api/automation/settings"],
  });

  const rollbackMutation = useMutation({
    mutationFn: async (actionId: string) => {
      return await apiRequest("POST", `/api/autonomous-actions/${actionId}/rollback`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Change Rolled Back",
        description: "The change has been instantly reversed. Your Shopify store is updated.",
      });
      setSelectedChange(null);
    },
    onError: () => {
      toast({
        title: "Rollback Failed",
        description: "Unable to rollback this change. Please try again.",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (approvalId: string) => {
      return await apiRequest("POST", `/api/pending-approvals/${approvalId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pending-approvals"] });
      toast({
        title: "Change Approved",
        description: "ZYRA will push this change to your Shopify store.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (approvalId: string) => {
      return await apiRequest("POST", `/api/pending-approvals/${approvalId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pending-approvals"] });
      toast({
        title: "Change Rejected",
        description: "ZYRA will not apply this change.",
      });
      setSelectedChange(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<AutomationSettings>) => {
      return await apiRequest("PATCH", "/api/automation/settings", newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your control preferences have been saved.",
      });
    },
  });

  const pendingChanges = changes?.filter(c => c.status === "pending") || [];
  const appliedChanges = changes?.filter(c => c.status === "completed") || [];
  const recentChanges = changes?.slice(0, 20) || [];

  const totalRevenueImpact = appliedChanges.reduce((sum, c) => {
    const impact = parseFloat(c.actualImpact?.revenue || c.estimatedImpact?.expectedRevenue || "0");
    return sum + impact;
  }, 0);

  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    setSidebarOpen(false);
    if (tab === "change-control") return;
    if (tab === "reports") {
      setLocation("/reports");
    } else {
      setLocation("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        activeTab="change-control" 
        onTabChange={handleTabChange} 
        user={user} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'sm:ml-64 ml-0' : 'ml-0'
      }`}>
        {/* Header - Same as Dashboard */}
        <header className="gradient-surface border-b px-3 sm:px-6 py-2 sm:py-4 flex-shrink-0 sticky top-0 z-50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
                data-testid="button-toggle-sidebar"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="font-bold text-white text-sm sm:text-lg lg:text-xl xl:text-2xl truncate" data-testid="text-page-title">
                  Change Control
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm lg:text-base hidden sm:block truncate" data-testid="text-page-subtitle">
                  Full visibility and control over every AI-driven change
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1 sm:gap-3 flex-shrink-0">
              <NotificationCenter />
              <AvatarMenu />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-auto">
          <div className="container max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Change Timeline
                    </CardTitle>
                    <CardDescription>Every action ZYRA has taken or proposes</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(pendingChanges.length > 0 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-muted")} data-testid="badge-pending-count">
                      {pendingChanges.length} Pending
                    </Badge>
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30" data-testid="badge-applied-count">
                      {appliedChanges.length} Applied
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {changesLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : recentChanges.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Bot className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Changes Yet</h3>
                      <p className="text-muted-foreground text-sm max-w-md">
                        ZYRA will show proposed and applied changes here. Connect your Shopify store to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentChanges.map((change) => {
                        const config = ACTION_TYPE_CONFIG[change.actionType] || ACTION_TYPE_CONFIG.optimize_seo;
                        const statusConfig = STATUS_CONFIG[change.status];
                        const riskLevel = getRiskLevel(change);
                        const riskConfig = RISK_CONFIG[riskLevel];
                        const Icon = config.icon;
                        const isSelected = selectedChange?.id === change.id;
                        const isAutonomous = change.executedBy === "agent";

                        return (
                          <button
                            key={change.id}
                            onClick={() => setSelectedChange(isSelected ? null : change)}
                            className={cn(
                              "w-full text-left p-4 rounded-lg border transition-all",
                              isSelected 
                                ? "bg-primary/10 border-primary/50" 
                                : "bg-card hover-elevate border-border"
                            )}
                            data-testid={`change-item-${change.id}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                {change.productImage ? (
                                  <img 
                                    src={change.productImage} 
                                    alt="" 
                                    className="w-12 h-12 rounded-md object-cover border border-border"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                                    <Package className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm truncate">
                                    {change.productName || change.payload?.productName || "Unknown Product"}
                                  </span>
                                  <Badge variant="outline" className={cn("text-xs", config.color)}>
                                    <Icon className="w-3 h-3 mr-1" />
                                    {config.label}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge variant="outline" className={cn("text-xs", statusConfig.bgColor, statusConfig.color)}>
                                    {statusConfig.label}
                                  </Badge>
                                  <Badge variant="outline" className={cn("text-xs", riskConfig.bgColor, riskConfig.color)}>
                                    {riskConfig.label}
                                  </Badge>
                                  {isAutonomous && (
                                    <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                                      <Bot className="w-3 h-3 mr-1" />
                                      Auto
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(change.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                              <ChevronRight className={cn(
                                "w-5 h-5 text-muted-foreground transition-transform",
                                isSelected && "rotate-90"
                              )} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {selectedChange && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    Change Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Why ZYRA recommends this
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedChange.decisionReason || "This change was identified through AI analysis of your product performance and market trends."}
                    </p>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Expected Revenue Impact</p>
                        <p className="text-lg font-bold text-green-400">
                          +{formatCurrency(selectedChange.estimatedImpact?.expectedRevenue || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Confidence Score</p>
                        <p className="text-lg font-bold">
                          {selectedChange.estimatedImpact?.confidence || 85}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      What will change
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border bg-card">
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Before</p>
                        <div className="space-y-3">
                          {selectedChange.payload?.before?.title && (
                            <div>
                              <p className="text-xs text-muted-foreground">Product Title</p>
                              <p className="text-sm">{selectedChange.payload.before.title}</p>
                            </div>
                          )}
                          {selectedChange.payload?.before?.description && (
                            <div>
                              <p className="text-xs text-muted-foreground">Description</p>
                              <p className="text-sm line-clamp-3">{selectedChange.payload.before.description}</p>
                            </div>
                          )}
                          {selectedChange.payload?.before?.seoTitle && (
                            <div>
                              <p className="text-xs text-muted-foreground">SEO Title</p>
                              <p className="text-sm">{selectedChange.payload.before.seoTitle}</p>
                            </div>
                          )}
                          {selectedChange.payload?.before?.metaDescription && (
                            <div>
                              <p className="text-xs text-muted-foreground">Meta Description</p>
                              <p className="text-sm line-clamp-2">{selectedChange.payload.before.metaDescription}</p>
                            </div>
                          )}
                          {!selectedChange.payload?.before && (
                            <p className="text-sm text-muted-foreground italic">Original content data not available</p>
                          )}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                        <p className="text-xs text-primary mb-2 uppercase tracking-wide flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          After
                        </p>
                        <div className="space-y-3">
                          {selectedChange.payload?.after?.title && (
                            <div>
                              <p className="text-xs text-muted-foreground">Product Title</p>
                              <p className="text-sm font-medium text-primary">{selectedChange.payload.after.title}</p>
                            </div>
                          )}
                          {selectedChange.payload?.after?.description && (
                            <div>
                              <p className="text-xs text-muted-foreground">Description</p>
                              <p className="text-sm line-clamp-3">{selectedChange.payload.after.description}</p>
                            </div>
                          )}
                          {selectedChange.payload?.after?.seoTitle && (
                            <div>
                              <p className="text-xs text-muted-foreground">SEO Title</p>
                              <p className="text-sm font-medium text-primary">{selectedChange.payload.after.seoTitle}</p>
                            </div>
                          )}
                          {selectedChange.payload?.after?.metaDescription && (
                            <div>
                              <p className="text-xs text-muted-foreground">Meta Description</p>
                              <p className="text-sm line-clamp-2">{selectedChange.payload.after.metaDescription}</p>
                            </div>
                          )}
                          {(selectedChange.payload?.optimizedCopy || selectedChange.result?.optimizedContent) && (
                            <>
                              {(selectedChange.payload?.optimizedCopy?.seoTitle || selectedChange.result?.optimizedContent?.seoTitle) && (
                                <div>
                                  <p className="text-xs text-muted-foreground">SEO Title</p>
                                  <p className="text-sm font-medium text-primary">
                                    {selectedChange.payload?.optimizedCopy?.seoTitle || selectedChange.result?.optimizedContent?.seoTitle}
                                  </p>
                                </div>
                              )}
                              {(selectedChange.payload?.optimizedCopy?.metaDescription || selectedChange.result?.optimizedContent?.metaDescription) && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Meta Description</p>
                                  <p className="text-sm line-clamp-2">
                                    {selectedChange.payload?.optimizedCopy?.metaDescription || selectedChange.result?.optimizedContent?.metaDescription}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                          {!selectedChange.payload?.after && !selectedChange.payload?.optimizedCopy && !selectedChange.result?.optimizedContent && (
                            <p className="text-sm text-muted-foreground italic">Optimized content preview not available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-wrap gap-3">
                    {selectedChange.status === "pending" && (
                      <>
                        <Button 
                          onClick={() => approveMutation.mutate(selectedChange.id)}
                          disabled={approveMutation.isPending}
                          className="gap-2"
                          data-testid="button-approve-change"
                        >
                          <Check className="w-4 h-4" />
                          Approve & Push to Shopify
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => rejectMutation.mutate(selectedChange.id)}
                          disabled={rejectMutation.isPending}
                          className="gap-2"
                          data-testid="button-reject-change"
                        >
                          <X className="w-4 h-4" />
                          Reject Change
                        </Button>
                      </>
                    )}
                    {(selectedChange.status === "completed" || selectedChange.status === "dry_run") && (
                      <>
                        <Button 
                          variant="destructive"
                          onClick={() => rollbackMutation.mutate(selectedChange.id)}
                          disabled={rollbackMutation.isPending}
                          className="gap-2"
                          data-testid="button-rollback-change"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Undo Change Instantly
                        </Button>
                        <Button variant="outline" className="gap-2" data-testid="button-lock-change">
                          <Lock className="w-4 h-4" />
                          Lock Change
                        </Button>
                      </>
                    )}
                    {selectedChange.status === "rolled_back" && (
                      <Badge variant="outline" className="bg-slate-500/20 text-slate-400">
                        This change has been rolled back
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Revenue Impact
                </CardTitle>
                <CardDescription>Only what matters: money</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30">
                  <p className="text-xs text-green-400 uppercase tracking-wide mb-1">Total Revenue Added</p>
                  <p className="text-3xl font-bold text-green-400" data-testid="text-total-revenue">{formatCurrency(totalRevenueImpact)}</p>
                  <p className="text-xs text-muted-foreground mt-1" data-testid="text-applied-count">From {appliedChanges.length} applied changes</p>
                </div>

                {selectedChange && selectedChange.status === "completed" && (
                  <div className="space-y-3">
                    <Separator />
                    <h4 className="text-sm font-medium">Selected Change Impact</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Revenue Delta</p>
                        <p className="text-lg font-bold text-green-400" data-testid="text-revenue-delta">
                          +{formatCurrency(selectedChange.actualImpact?.revenue || selectedChange.estimatedImpact?.expectedRevenue || 0)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Orders Influenced</p>
                        <p className="text-lg font-bold" data-testid="text-orders-influenced">
                          {selectedChange.actualImpact?.orders || 0}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-2">Impact Timeline</p>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Timer className="w-3 h-3 text-yellow-400" />
                          <span>Decision</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-blue-400" />
                          <span>Executed</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                          <span>Result</span>
                        </div>
                      </div>
                    </div>

                    {selectedChange.actualImpact?.status && (
                      <Badge 
                        variant="outline"
                        className={cn(
                          selectedChange.actualImpact.status === "positive" 
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : selectedChange.actualImpact.status === "negative"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        )}
                      >
                        {selectedChange.actualImpact.status === "positive" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {selectedChange.actualImpact.status === "negative" && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {selectedChange.actualImpact.status === "building" && <Activity className="w-3 h-3 mr-1" />}
                        {selectedChange.actualImpact.status === "positive" ? "Positive Impact" : 
                         selectedChange.actualImpact.status === "negative" ? "Negative Impact - Rollback Suggested" : 
                         "Impact Building"}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <button 
                  onClick={() => setSettingsExpanded(!settingsExpanded)}
                  className="w-full flex items-center justify-between"
                  data-testid="button-toggle-settings"
                >
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Safety & Control
                    </CardTitle>
                    <CardDescription>Your automation preferences</CardDescription>
                  </div>
                  {settingsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </CardHeader>
              {settingsExpanded && (
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Enable Autopilot</Label>
                      <p className="text-xs text-muted-foreground">Let ZYRA auto-apply low-risk changes</p>
                    </div>
                    <Switch 
                      checked={settings?.autopilotEnabled || false}
                      onCheckedChange={(checked) => updateSettingsMutation.mutate({ autopilotEnabled: checked })}
                      data-testid="switch-autopilot"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Auto-Publish to Shopify</Label>
                      <p className="text-xs text-muted-foreground">Automatically push approved changes</p>
                    </div>
                    <Switch 
                      checked={settings?.autoPublishEnabled || false}
                      onCheckedChange={(checked) => updateSettingsMutation.mutate({ autoPublishEnabled: checked })}
                      data-testid="switch-auto-publish"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Preview Mode</Label>
                      <p className="text-xs text-muted-foreground">See changes before they go live</p>
                    </div>
                    <Switch 
                      checked={settings?.dryRunMode || false}
                      onCheckedChange={(checked) => updateSettingsMutation.mutate({ dryRunMode: checked })}
                      data-testid="switch-dry-run"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm">Autonomy Level</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["safe", "balanced", "aggressive"] as const).map((mode) => (
                        <Button
                          key={mode}
                          variant={settings?.autopilotMode === mode ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateSettingsMutation.mutate({ autopilotMode: mode })}
                          className="capitalize"
                          data-testid={`button-mode-${mode}`}
                        >
                          {mode === "safe" && "Low-Risk Only"}
                          {mode === "balanced" && "Balanced"}
                          {mode === "aggressive" && "Full Auto"}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {settings?.autopilotMode === "safe" && "Only auto-apply changes with minimal risk"}
                      {settings?.autopilotMode === "balanced" && "Auto-apply low and medium risk changes"}
                      {settings?.autopilotMode === "aggressive" && "Auto-apply all changes except high-risk"}
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm">Daily Action Limit</Label>
                    <p className="text-xs text-muted-foreground">
                      Max {settings?.maxDailyActions || 10} changes per day
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Bot className="w-8 h-8 text-primary flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">ZYRA is watching</h4>
                    <p className="text-xs text-muted-foreground">
                      Your AI growth manager is continuously analyzing your store and finding opportunities to increase revenue.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
