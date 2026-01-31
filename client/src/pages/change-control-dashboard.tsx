import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ChevronRight,
  Activity,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Timer,
  Menu,
  Upload,
  Filter,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

type ActionStatus = "pending" | "running" | "completed" | "failed" | "rolled_back" | "dry_run";
type ActionType = "optimize_seo" | "fix_product" | "send_cart_recovery" | "run_ab_test" | "adjust_price" | "content_refresh" | "discoverability" | "seo_basics" | "product_copy_clarity" | "trust_signals" | "cart_recovery";
type RiskLevel = "low" | "medium" | "high";
type FilterStatus = "all" | "applied" | "pending" | "rolled_back";

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

const ACTION_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  optimize_seo: { label: "SEO", icon: TrendingUp, color: "text-blue-400" },
  seo_basics: { label: "SEO Basics", icon: TrendingUp, color: "text-blue-400" },
  fix_product: { label: "Content", icon: FileText, color: "text-green-400" },
  product_copy_clarity: { label: "Copy Clarity", icon: FileText, color: "text-green-400" },
  send_cart_recovery: { label: "Recovery", icon: DollarSign, color: "text-yellow-400" },
  cart_recovery: { label: "Cart Recovery", icon: DollarSign, color: "text-yellow-400" },
  run_ab_test: { label: "A/B Test", icon: Activity, color: "text-purple-400" },
  adjust_price: { label: "Pricing", icon: DollarSign, color: "text-emerald-400" },
  content_refresh: { label: "Content", icon: FileText, color: "text-cyan-400" },
  discoverability: { label: "Discoverability", icon: Eye, color: "text-orange-400" },
  trust_signals: { label: "Trust Signals", icon: Shield, color: "text-indigo-400" },
};

const STATUS_CONFIG: Record<ActionStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: "Pending", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  running: { label: "Applying", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  completed: { label: "Applied", color: "text-green-400", bgColor: "bg-green-500/20" },
  failed: { label: "Failed", color: "text-red-400", bgColor: "bg-red-500/20" },
  rolled_back: { label: "Rolled Back", color: "text-slate-400", bgColor: "bg-slate-500/20" },
  dry_run: { label: "Preview", color: "text-purple-400", bgColor: "bg-purple-500/20" },
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

function getBeforeAfterContent(change: ChangeItem) {
  const before: Record<string, string> = {};
  const after: Record<string, string> = {};

  if (change.payload?.before) {
    if (change.payload.before.title) before["Product Title"] = change.payload.before.title;
    if (change.payload.before.description) before["Product Description"] = change.payload.before.description;
    if (change.payload.before.seoTitle) before["SEO Title"] = change.payload.before.seoTitle;
    if (change.payload.before.metaDescription) before["Meta Description"] = change.payload.before.metaDescription;
  }

  if (change.payload?.after) {
    if (change.payload.after.title) after["Product Title"] = change.payload.after.title;
    if (change.payload.after.description) after["Product Description"] = change.payload.after.description;
    if (change.payload.after.seoTitle) after["SEO Title"] = change.payload.after.seoTitle;
    if (change.payload.after.metaDescription) after["Meta Description"] = change.payload.after.metaDescription;
  }

  const optimized = change.payload?.optimizedCopy || change.result?.optimizedContent;
  if (optimized) {
    if (optimized.title) after["Product Title"] = optimized.title;
    if (optimized.description) after["Product Description"] = optimized.description;
    if (optimized.seoTitle) after["SEO Title"] = optimized.seoTitle;
    if (optimized.metaDescription) after["Meta Description"] = optimized.metaDescription;
  }

  return { before, after };
}

export default function ChangeControlDashboard() {
  const { toast } = useToast();
  const [selectedChange, setSelectedChange] = useState<ChangeItem | null>(null);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const { data: changes, isLoading: changesLoading, refetch } = useQuery<ChangeItem[]>({
    queryKey: ["/api/autonomous-actions"],
  });

  const { data: settings } = useQuery<AutomationSettings>({
    queryKey: ["/api/automation/settings"],
  });

  const filteredChanges = useMemo(() => {
    if (!changes) return [];
    switch (filterStatus) {
      case "applied":
        return changes.filter(c => c.status === "completed" || c.status === "dry_run");
      case "pending":
        return changes.filter(c => c.status === "pending");
      case "rolled_back":
        return changes.filter(c => c.status === "rolled_back");
      default:
        return changes;
    }
  }, [changes, filterStatus]);

  const rollbackMutation = useMutation({
    mutationFn: async (actionId: string) => {
      return await apiRequest("POST", `/api/autonomous-actions/${actionId}/rollback`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Change Rolled Back",
        description: "The change has been reversed on your Shopify store.",
      });
      setSelectedChange(null);
      setSelectedIds(new Set());
    },
    onError: (error: any) => {
      toast({
        title: "Rollback Failed",
        description: error?.message || "Unable to rollback this change. Please try again.",
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
        description: "The change has been applied to your Shopify store.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Push Failed",
        description: error?.message || "Unable to push this change. Please try again.",
        variant: "destructive",
      });
    },
  });

  const bulkRollbackMutation = useMutation({
    mutationFn: async (actionIds: string[]) => {
      const results = await Promise.allSettled(
        actionIds.map(id => apiRequest("POST", `/api/autonomous-actions/${id}/rollback`))
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) throw new Error(`${failed} rollbacks failed`);
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Bulk Rollback Complete",
        description: `${selectedIds.size} changes have been rolled back.`,
      });
      setSelectedIds(new Set());
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Some Rollbacks Failed",
        description: error?.message || "Some changes could not be rolled back.",
        variant: "destructive",
      });
    },
  });

  const bulkPushMutation = useMutation({
    mutationFn: async (actionIds: string[]) => {
      const results = await Promise.allSettled(
        actionIds.map(id => apiRequest("POST", `/api/autonomous-actions/${id}/push-to-shopify`))
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) throw new Error(`${failed} pushes failed`);
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Bulk Push Complete",
        description: `${selectedIds.size} changes have been pushed to Shopify.`,
      });
      setSelectedIds(new Set());
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Some Pushes Failed",
        description: error?.message || "Some changes could not be pushed.",
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
  const rolledBackChanges = changes?.filter(c => c.status === "rolled_back") || [];

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

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredChanges.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredChanges.map(c => c.id)));
    }
  };

  const canBulkRollback = useMemo(() => {
    return Array.from(selectedIds).some(id => {
      const change = changes?.find(c => c.id === id);
      return change && (change.status === "completed" || change.status === "dry_run");
    });
  }, [selectedIds, changes]);

  const canBulkPush = useMemo(() => {
    return Array.from(selectedIds).some(id => {
      const change = changes?.find(c => c.id === id);
      return change && change.status === "pending";
    });
  }, [selectedIds, changes]);

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        activeTab="change-control" 
        onTabChange={handleTabChange} 
        user={user} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'sm:ml-64 ml-0' : 'ml-0'
      }`}>
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

        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-auto">
          <div className="container max-w-7xl mx-auto space-y-6">
            
            {selectedIds.size > 0 && (
              <Card className="bg-primary/5 border-primary/30">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedIds.size === filteredChanges.length && filteredChanges.length > 0}
                        onCheckedChange={selectAll}
                        data-testid="checkbox-select-all"
                      />
                      <span className="text-sm font-medium">{selectedIds.size} selected</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {canBulkRollback && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const idsToRollback = Array.from(selectedIds).filter(id => {
                              const change = changes?.find(c => c.id === id);
                              return change && (change.status === "completed" || change.status === "dry_run");
                            });
                            if (idsToRollback.length > 0) {
                              bulkRollbackMutation.mutate(idsToRollback);
                            }
                          }}
                          disabled={bulkRollbackMutation.isPending}
                          className="gap-2"
                          data-testid="button-bulk-rollback"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Bulk Rollback ({Array.from(selectedIds).filter(id => {
                            const change = changes?.find(c => c.id === id);
                            return change && (change.status === "completed" || change.status === "dry_run");
                          }).length})
                        </Button>
                      )}
                      {canBulkPush && (
                        <Button
                          size="sm"
                          onClick={() => {
                            const idsToPush = Array.from(selectedIds).filter(id => {
                              const change = changes?.find(c => c.id === id);
                              return change && change.status === "pending";
                            });
                            if (idsToPush.length > 0) {
                              bulkPushMutation.mutate(idsToPush);
                            }
                          }}
                          disabled={bulkPushMutation.isPending}
                          className="gap-2"
                          data-testid="button-bulk-push"
                        >
                          <Upload className="w-4 h-4" />
                          Bulk Push to Shopify ({Array.from(selectedIds).filter(id => {
                            const change = changes?.find(c => c.id === id);
                            return change && change.status === "pending";
                          }).length})
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedIds(new Set())}
                        data-testid="button-clear-selection"
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                <TabsList>
                  <TabsTrigger value="all" className="gap-2" data-testid="tab-all">
                    <Filter className="w-4 h-4" />
                    All ({changes?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="applied" className="gap-2" data-testid="tab-applied">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Applied ({appliedChanges.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="gap-2" data-testid="tab-pending">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    Pending ({pendingChanges.length})
                  </TabsTrigger>
                  <TabsTrigger value="rolled_back" className="gap-2" data-testid="tab-rolled-back">
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                    Rolled Back ({rolledBackChanges.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2"
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {changesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-48 w-full rounded-lg" />
                    ))}
                  </div>
                ) : filteredChanges.length === 0 ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Bot className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Changes Found</h3>
                        <p className="text-muted-foreground text-sm max-w-md">
                          {filterStatus === "all" 
                            ? "ZYRA will show optimizations here after analyzing your store. Connect your Shopify store to get started."
                            : `No ${filterStatus === "applied" ? "applied" : filterStatus === "pending" ? "pending" : "rolled back"} changes found.`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredChanges.map((change) => {
                      const config = ACTION_TYPE_CONFIG[change.actionType] || ACTION_TYPE_CONFIG.optimize_seo;
                      const statusConfig = STATUS_CONFIG[change.status];
                      const riskLevel = getRiskLevel(change);
                      const riskConfig = RISK_CONFIG[riskLevel];
                      const Icon = config.icon;
                      const isSelected = selectedChange?.id === change.id;
                      const isChecked = selectedIds.has(change.id);
                      const isAutonomous = change.executedBy === "agent";
                      const { before, after } = getBeforeAfterContent(change);

                      return (
                        <Card 
                          key={change.id}
                          className={cn(
                            "cursor-pointer transition-all hover-elevate",
                            isSelected && "ring-2 ring-primary border-primary"
                          )}
                          data-testid={`card-change-${change.id}`}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start gap-3">
                              <Checkbox 
                                checked={isChecked}
                                onCheckedChange={() => toggleSelection(change.id)}
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`checkbox-${change.id}`}
                              />
                              <div className="flex-shrink-0">
                                {change.productImage ? (
                                  <img 
                                    src={change.productImage} 
                                    alt="" 
                                    className="w-14 h-14 rounded-md object-cover border border-border"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center">
                                    <Package className="w-7 h-7 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {change.productName || change.payload?.productName || "Unknown Product"}
                                </p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge variant="outline" className={cn("text-xs", config.color)}>
                                    <Icon className="w-3 h-3 mr-1" />
                                    {config.label}
                                  </Badge>
                                  <Badge variant="outline" className={cn("text-xs", statusConfig.bgColor, statusConfig.color)}>
                                    {statusConfig.label}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent 
                            className="pt-2 space-y-3"
                            onClick={() => setSelectedChange(isSelected ? null : change)}
                          >
                            <div className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <Clock className="w-3 h-3" />
                                <span>Optimized {formatDistanceToNow(new Date(change.createdAt), { addSuffix: true })}</span>
                              </div>
                              {change.completedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Completed: {format(new Date(change.completedAt), 'MMM d, yyyy h:mm a')}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={cn("text-xs", riskConfig.bgColor, riskConfig.color)}>
                                {riskConfig.label}
                              </Badge>
                              {isAutonomous && (
                                <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                                  <Bot className="w-3 h-3 mr-1" />
                                  Auto
                                </Badge>
                              )}
                              {change.publishedToShopify && (
                                <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Live
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              {change.status === "completed" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rollbackMutation.mutate(change.id);
                                  }}
                                  disabled={rollbackMutation.isPending}
                                  className="gap-1 text-xs flex-1"
                                  data-testid={`button-rollback-${change.id}`}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Rollback
                                </Button>
                              )}
                              {change.status === "pending" && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    pushToShopifyMutation.mutate(change.id);
                                  }}
                                  disabled={pushToShopifyMutation.isPending}
                                  className="gap-1 text-xs flex-1"
                                  data-testid={`button-push-${change.id}`}
                                >
                                  <Upload className="w-3 h-3" />
                                  Push to Shopify
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedChange(isSelected ? null : change)}
                                className="gap-1 text-xs"
                                data-testid={`button-details-${change.id}`}
                              >
                                <Eye className="w-3 h-3" />
                                Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {selectedChange ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Eye className="w-5 h-5 text-primary" />
                          Change Details
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedChange(null)}
                          data-testid="button-close-details"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        {selectedChange.productImage ? (
                          <img 
                            src={selectedChange.productImage} 
                            alt="" 
                            className="w-16 h-16 rounded-md object-cover border border-border"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{selectedChange.productName || "Unknown Product"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(selectedChange.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          Why ZYRA recommends this
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {selectedChange.decisionReason || "AI analysis identified optimization opportunities."}
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Expected Impact</p>
                            <p className="text-sm font-bold text-green-400">
                              +{formatCurrency(selectedChange.estimatedImpact?.expectedRevenue || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Confidence</p>
                            <p className="text-sm font-bold">
                              {selectedChange.estimatedImpact?.confidence || 85}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          All Field Changes
                        </h4>
                        
                        {(() => {
                          const { before, after } = getBeforeAfterContent(selectedChange);
                          const allFields = new Set([...Object.keys(before), ...Object.keys(after)]);
                          
                          if (allFields.size === 0) {
                            return (
                              <p className="text-sm text-muted-foreground italic">No field changes recorded.</p>
                            );
                          }

                          return (
                            <ScrollArea className="h-[300px] pr-2">
                              <div className="space-y-4">
                                {Array.from(allFields).map(field => (
                                  <div key={field} className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{field}</p>
                                    <div className="grid grid-cols-1 gap-2">
                                      <div className="p-2 rounded border bg-card">
                                        <p className="text-xs text-muted-foreground mb-1">Before</p>
                                        <p className="text-xs">{before[field] || <span className="italic text-muted-foreground">Empty</span>}</p>
                                      </div>
                                      <div className="p-2 rounded border border-primary/30 bg-primary/5">
                                        <p className="text-xs text-primary mb-1 flex items-center gap-1">
                                          <ArrowRight className="w-3 h-3" />
                                          After
                                        </p>
                                        <p className="text-xs font-medium">{after[field] || <span className="italic text-muted-foreground">Empty</span>}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          );
                        })()}
                      </div>

                      <Separator />

                      <div className="flex flex-wrap gap-2">
                        {selectedChange.status === "pending" && (
                          <>
                            <Button 
                              onClick={() => approveMutation.mutate(selectedChange.id)}
                              disabled={approveMutation.isPending}
                              className="gap-2 flex-1"
                              data-testid="button-approve-change"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => rejectMutation.mutate(selectedChange.id)}
                              disabled={rejectMutation.isPending}
                              className="gap-2"
                              data-testid="button-reject-change"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </Button>
                          </>
                        )}
                        {(selectedChange.status === "completed" || selectedChange.status === "dry_run") && (
                          <Button 
                            variant="destructive"
                            onClick={() => rollbackMutation.mutate(selectedChange.id)}
                            disabled={rollbackMutation.isPending}
                            className="gap-2 flex-1"
                            data-testid="button-rollback-change"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Rollback to Original
                          </Button>
                        )}
                        {selectedChange.status === "rolled_back" && (
                          <Badge variant="outline" className="bg-slate-500/20 text-slate-400">
                            This change has been rolled back
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
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

                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <p className="text-2xl font-bold text-green-400">{appliedChanges.length}</p>
                          <p className="text-xs text-muted-foreground">Applied</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <p className="text-2xl font-bold text-yellow-400">{pendingChanges.length}</p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <p className="text-2xl font-bold text-slate-400">{rolledBackChanges.length}</p>
                          <p className="text-xs text-muted-foreground">Rolled Back</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                              className="capitalize text-xs"
                              data-testid={`button-mode-${mode}`}
                            >
                              {mode === "safe" && "Low-Risk"}
                              {mode === "balanced" && "Balanced"}
                              {mode === "aggressive" && "Full Auto"}
                            </Button>
                          ))}
                        </div>
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

        <Footer />
      </div>
    </div>
  );
}
