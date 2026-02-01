import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useZyraActivityStream } from "@/hooks/useZyraActivityStream";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import Sidebar from "@/components/dashboard/sidebar";
import Footer from "@/components/ui/footer";
import NotificationCenter from "@/components/dashboard/notification-center";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import { Menu } from "lucide-react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Shield,
  ArrowRight,
  Bot,
  Package,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Brain,
  Eye,
  Lightbulb,
  Activity,
  Target,
  Minus,
  Clock,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  Zap,
  Search,
  Wrench,
  Award,
  Radio,
  Coins,
  FileText,
  Type,
  Tag,
  ImageIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface TodayIssue {
  problemType: string;
  entityName: string;
  timestamp: string;
}

interface TodayFix {
  surfaceTouched: string;
  entityName: string;
  timestamp: string;
}

interface RevenueImmuneStatus {
  isActive: boolean;
  sensitivity: string;
  preventedRevenue: number;
  weeklyStats: {
    scansPerformed: number;
    fixesExecuted: number;
    rollbacksNeeded: number;
  };
  totalProductsMonitored: number;
  todayDetectedIssues: TodayIssue[];
  todayFixesExecuted: TodayFix[];
}

interface AutonomousAction {
  id: string;
  actionType: string;
  entityType: string | null;
  entityId: string | null;
  status: string;
  decisionReason: string | null;
  payload: any;
  result: any;
  estimatedImpact: {
    expectedRevenue?: number;
    confidence?: number;
  } | null;
  actualImpact: {
    revenue?: number;
    orders?: number;
    status?: 'positive' | 'negative' | 'neutral' | 'building';
  } | null;
  executedBy: string;
  createdAt: string;
  completedAt: string | null;
  rolledBackAt: string | null;
  productName: string | null;
  productImage: string | null;
}

interface LearningInsight {
  id: string;
  insight: string;
  confidence: number;
  actionType: string;
  createdAt: string;
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  optimize_seo: "SEO Optimization",
  generate_description: "Description Enhancement",
  fix_product: "Product Fix",
  pricing_optimization: "Price Adjustment",
  send_cart_recovery: "Cart Recovery",
  ab_test: "A/B Test",
};

const STORE_STATES = [
  { id: "preparing", label: "Preparing for Growth", icon: Target, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { id: "protecting", label: "Actively Protecting Revenue", icon: Shield, color: "text-green-400", bgColor: "bg-green-500/10" },
  { id: "expanding", label: "Expanding Discoverability Safely", icon: TrendingUp, color: "text-purple-400", bgColor: "bg-purple-500/10" },
];

function formatCurrency(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return "$0";
  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(value)) return "$0";
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export default function Reports() {
  const { user } = useAuth();

  const { data: actions, isLoading: actionsLoading } = useQuery<AutonomousAction[]>({
    queryKey: ["/api/autonomous-actions"],
    enabled: !!user,
  });

  const { data: learnings } = useQuery<LearningInsight[]>({
    queryKey: ["/api/zyra/learnings"],
    enabled: !!user,
  });

  const { data: revenueImmuneData } = useQuery<RevenueImmuneStatus>({
    queryKey: ["/api/revenue-immune/status"],
    enabled: !!user,
  });

  const { events: sseEvents, isConnected, isReconnecting } = useZyraActivityStream();

  const [todayReportExpanded, setTodayReportExpanded] = useState(true);

  const todayDetectedIssues = revenueImmuneData?.todayDetectedIssues || [];
  const todayFixesExecuted = revenueImmuneData?.todayFixesExecuted || [];
  const totalProductsMonitored = revenueImmuneData?.totalProductsMonitored || 0;
  const hasActivityToday = todayDetectedIssues.length > 0 || todayFixesExecuted.length > 0;

  const liveActivityLog = useMemo(() => {
    return sseEvents.slice(-10).map(event => {
      let icon = Activity;
      let color = "text-primary";
      let bgColor = "bg-primary/5";
      let borderColor = "border-primary/20";

      switch (event.phase) {
        case 'detect':
          icon = Search;
          color = "text-blue-500";
          bgColor = "bg-blue-500/5";
          borderColor = "border-blue-500/20";
          break;
        case 'decide':
          icon = Brain;
          color = "text-purple-500";
          bgColor = "bg-purple-500/5";
          borderColor = "border-purple-500/20";
          break;
        case 'execute':
          icon = Wrench;
          color = "text-orange-500";
          bgColor = "bg-orange-500/5";
          borderColor = "border-orange-500/20";
          break;
        case 'prove':
          icon = Award;
          color = "text-green-500";
          bgColor = "bg-green-500/5";
          borderColor = "border-green-500/20";
          break;
        case 'learn':
          icon = Lightbulb;
          color = "text-yellow-500";
          bgColor = "bg-yellow-500/5";
          borderColor = "border-yellow-500/20";
          break;
        case 'standby':
          icon = Eye;
          color = "text-muted-foreground";
          bgColor = "bg-muted/30";
          borderColor = "border-muted";
          break;
      }

      return {
        ...event,
        Icon: icon,
        color,
        bgColor,
        borderColor
      };
    }).reverse();
  }, [sseEvents]);

  const hasLiveActivity = liveActivityLog.length > 0;

  const completedActions = actions?.filter(a => a.status === "completed") || [];
  const rolledBackActions = actions?.filter(a => a.status === "rolled_back") || [];

  // Helper to extract what fields were changed from payload
  const getChangedFields = (action: any): string[] => {
    const fields: string[] = [];
    const payload = action.payload || action.result?.optimizedContent;
    const before = action.payload?.before || {};
    const after = action.payload?.after || payload || {};
    
    if (after.title && after.title !== before.title) fields.push('Title');
    if (after.description && after.description !== before.description) fields.push('Description');
    if (after.seoTitle && after.seoTitle !== before.seoTitle) fields.push('SEO Title');
    if (after.metaDescription && after.metaDescription !== before.metaDescription) fields.push('Meta Description');
    if (after.tags && JSON.stringify(after.tags) !== JSON.stringify(before.tags)) fields.push('Tags');
    if (after.images) fields.push('Images');
    
    // If no specific fields detected, use actionType
    if (fields.length === 0) {
      if (action.actionType?.includes('seo')) fields.push('SEO');
      else if (action.actionType?.includes('description')) fields.push('Description');
      else if (action.actionType?.includes('title')) fields.push('Title');
      else fields.push('Content');
    }
    
    return fields;
  };

  // Group actions by product for consolidated timeline view
  // Use productName as the grouping key since productId might be unique per action
  const groupedProductActions = useMemo(() => {
    const allActions = [...completedActions, ...rolledBackActions];
    const productMap = new Map<string, {
      productId: string;
      productName: string;
      productImage: string | null;
      actions: typeof allActions;
      totalRevenue: number;
      totalCredits: number;
      hasPositive: boolean;
      hasNegative: boolean;
      hasRolledBack: boolean;
      latestAction: Date;
      changedFields: Set<string>;
    }>();

    allActions.forEach(action => {
      // Group by product name (normalized) to merge same products
      const productName = action.productName?.trim() || "Product Update";
      const groupKey = productName.toLowerCase();
      const existing = productMap.get(groupKey);
      const revenue = action.actualImpact?.revenue || action.estimatedImpact?.expectedRevenue || 0;
      const actionAny = action as any;
      const credits = actionAny.creditsUsed || actionAny.creditCost || 0;
      const isPositive = action.actualImpact?.status === "positive";
      const isNegative = action.actualImpact?.status === "negative";
      const isRolledBack = action.status === "rolled_back";
      const actionDate = new Date(action.createdAt);
      const changedFields = getChangedFields(action);

      if (existing) {
        existing.actions.push(action);
        existing.totalRevenue += typeof revenue === 'number' ? revenue : parseFloat(revenue) || 0;
        existing.totalCredits += typeof credits === 'number' ? credits : parseFloat(credits) || 0;
        existing.hasPositive = existing.hasPositive || isPositive;
        existing.hasNegative = existing.hasNegative || isNegative;
        existing.hasRolledBack = existing.hasRolledBack || isRolledBack;
        changedFields.forEach(f => existing.changedFields.add(f));
        // Keep the most recent image
        if (!existing.productImage && action.productImage) {
          existing.productImage = action.productImage;
        }
        if (actionDate > existing.latestAction) {
          existing.latestAction = actionDate;
        }
      } else {
        productMap.set(groupKey, {
          productId: actionAny.productId || action.id,
          productName: productName,
          productImage: action.productImage || null,
          actions: [action],
          totalRevenue: typeof revenue === 'number' ? revenue : parseFloat(revenue) || 0,
          totalCredits: typeof credits === 'number' ? credits : parseFloat(credits) || 0,
          hasPositive: isPositive,
          hasNegative: isNegative,
          hasRolledBack: isRolledBack,
          latestAction: actionDate,
          changedFields: new Set(changedFields),
        });
      }
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.latestAction.getTime() - a.latestAction.getTime())
      .slice(0, 15);
  }, [completedActions, rolledBackActions]);

  const revenueGained = completedActions.reduce((sum, a) => {
    const impact = a.actualImpact?.revenue || a.estimatedImpact?.expectedRevenue || 0;
    return sum + (typeof impact === 'number' ? impact : parseFloat(impact) || 0);
  }, 0);

  const revenueProtected = rolledBackActions.reduce((sum, a) => {
    const impact = Math.abs(a.actualImpact?.revenue || 0);
    return sum + (typeof impact === 'number' ? impact : parseFloat(impact) || 0);
  }, 0);

  const netImpact = revenueGained + revenueProtected;

  const currentStoreState = completedActions.length > 5 
    ? STORE_STATES[1] 
    : completedActions.length > 0 
      ? STORE_STATES[2] 
      : STORE_STATES[0];

  const highImpactDecision = completedActions.find(a => 
    (a.actualImpact?.revenue || 0) > 50 || (a.estimatedImpact?.expectedRevenue || 0) > 50
  );

  const pendingActions = actions?.filter(a => a.status === "pending") || [];
  const nextMonitoring = pendingActions[0];

  const defaultLearnings: LearningInsight[] = [
    { id: "1", insight: "Benefit-first titles convert better for this store", confidence: 85, actionType: "optimize_seo", createdAt: new Date().toISOString() },
    { id: "2", insight: "SEO improvements show strongest results on high-traffic products", confidence: 78, actionType: "optimize_seo", createdAt: new Date().toISOString() },
    { id: "3", insight: "Product descriptions with clear benefits increase add-to-cart rate", confidence: 72, actionType: "generate_description", createdAt: new Date().toISOString() },
  ];

  const displayLearnings = learnings && learnings.length > 0 ? learnings : defaultLearnings;

  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    setSidebarOpen(false);
    if (tab === "reports") return;
    if (tab === "change-control") {
      setLocation("/change-control");
    } else {
      setLocation("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        activeTab="reports" 
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
                  ZYRA Report
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm lg:text-base hidden sm:block truncate" data-testid="text-page-subtitle">
                  What money did ZYRA make, protect, or influence for your store?
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
          <div className="container max-w-6xl mx-auto space-y-8">
        
        {/* SECTION 1: EXECUTIVE SUMMARY */}
        <Card className="bg-gradient-to-br from-primary/10 via-background to-green-500/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2" data-testid="title-executive-summary">
              <DollarSign className="w-6 h-6 text-green-400" />
              Executive Summary
            </CardTitle>
            <CardDescription>Based on ZYRA's automated revenue decisions</CardDescription>
          </CardHeader>
          <CardContent>
            {actionsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-card border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Revenue Impact</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="text-total-impact">{formatCurrency(netImpact)}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-xs text-green-400 uppercase tracking-wide mb-1">Revenue Gained</p>
                  <p className="text-3xl font-bold text-green-400" data-testid="text-revenue-gained">
                    <TrendingUp className="w-5 h-5 inline mr-1" />
                    {formatCurrency(revenueGained)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-xs text-blue-400 uppercase tracking-wide mb-1">Revenue Protected</p>
                  <p className="text-3xl font-bold text-blue-400" data-testid="text-revenue-protected">
                    <Shield className="w-5 h-5 inline mr-1" />
                    {formatCurrency(revenueProtected)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="text-xs text-primary uppercase tracking-wide mb-1">Net Impact</p>
                  <p className="text-3xl font-bold text-primary" data-testid="text-net-impact">
                    {formatCurrency(netImpact)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* TODAY'S REVENUE DEFENSE REPORT - Collapsible with Live SSE Stream */}
        <Card className="border-primary/20" data-testid="today-defense-report-card">
          <button 
            onClick={() => setTodayReportExpanded(!todayReportExpanded)}
            className="w-full flex items-center justify-between p-4 hover-elevate rounded-t-lg"
            data-testid="button-toggle-today-report"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 relative">
                <Clock className="w-5 h-5 text-primary" />
                {isConnected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">Today's Revenue Defense Report</h3>
                  {isConnected ? (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/30">
                      <Radio className="w-3 h-3 mr-1 animate-pulse" />
                      Live
                    </Badge>
                  ) : isReconnecting ? (
                    <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Reconnecting
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                      Connecting...
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Real-time protection activity from ZYRA engine</p>
              </div>
            </div>
            {todayReportExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          
          {todayReportExpanded && (
            <CardContent className="pt-0 pb-4 animate-in slide-in-from-top-2 duration-200">
              <Separator className="mb-4" />
              
              {/* Live SSE Activity Stream */}
              {hasLiveActivity && (
                <div className="mb-4" data-testid="live-sse-activity">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live Activity Stream</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {liveActivityLog.map((event) => (
                      <div 
                        key={event.id} 
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-all duration-300",
                          event.bgColor,
                          event.borderColor
                        )}
                        data-testid={`sse-event-${event.id}`}
                      >
                        <event.Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", event.color)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="outline" className={cn("text-xs", event.color, "border-current/30 bg-transparent")}>
                              {event.phase.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{event.message}</p>
                          {event.detail && (
                            <p className="text-xs text-muted-foreground mt-1">{event.detail}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Static Today's Activity from API */}
              {(hasActivityToday || !hasLiveActivity) && (
                <>
                  {hasLiveActivity && hasActivityToday && (
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today's Recorded Activity</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  
                  {!hasActivityToday && !hasLiveActivity ? (
                    <div className="space-y-3">
                      {totalProductsMonitored > 0 ? (
                        <>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-foreground">{totalProductsMonitored} products scanned</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-foreground">SEO checks completed</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-foreground">No revenue decay detected</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-foreground">Store fully protected today</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                          <Eye className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">Waiting for products to sync from Shopify</span>
                        </div>
                      )}
                    </div>
                  ) : hasActivityToday && (
                    <div className="space-y-3">
                      {todayDetectedIssues.map((issue, idx) => (
                        <div key={`issue-${idx}`} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">
                            Detected <span className="font-medium text-yellow-500">{issue.problemType}</span> on "{issue.entityName}"
                          </span>
                        </div>
                      ))}
                      {todayFixesExecuted.map((fix, idx) => (
                        <div key={`fix-${idx}`} className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">
                            Automatic repair applied to <span className="font-medium text-green-500">{fix.surfaceTouched}</span> on "{fix.entityName}"
                          </span>
                        </div>
                      ))}
                      {todayFixesExecuted.length > 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <RefreshCw className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-sm text-foreground">Live monitoring & rollback enabled</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SECTION 2: DECISION → RESULT TIMELINE */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Decision → Result Timeline
                </CardTitle>
                <CardDescription>DETECT → DECIDE → EXECUTE → PROVE</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {actionsLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                    </div>
                  ) : groupedProductActions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Bot className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Completed Decisions Yet</h3>
                      <p className="text-muted-foreground text-sm max-w-md">
                        ZYRA is analyzing your store. Completed revenue decisions will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                      <div className="space-y-4">
                        {groupedProductActions.map((productGroup) => {
                          const statusColor = productGroup.hasRolledBack 
                            ? "bg-blue-400" 
                            : productGroup.hasPositive 
                              ? "bg-green-400" 
                              : productGroup.hasNegative 
                                ? "bg-red-400" 
                                : "bg-yellow-400";
                          
                          return (
                            <div 
                              key={productGroup.productId} 
                              className="relative pl-10"
                              data-testid={`timeline-product-${productGroup.productId}`}
                            >
                              <div className={cn(
                                "absolute left-2.5 w-3 h-3 rounded-full border-2 border-background",
                                statusColor
                              )} />
                              
                              <div className="p-4 rounded-lg border bg-card">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0">
                                    {productGroup.productImage ? (
                                      <img 
                                        src={productGroup.productImage} 
                                        alt="" 
                                        className="w-14 h-14 rounded-md object-cover border"
                                      />
                                    ) : (
                                      <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center">
                                        <Package className="w-7 h-7 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                      <span className="font-medium text-sm">
                                        {productGroup.productName}
                                      </span>
                                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                                        {productGroup.actions.length} {productGroup.actions.length === 1 ? 'change' : 'changes'}
                                      </Badge>
                                    </div>
                                    
                                    {/* What was changed - consolidated view */}
                                    <div className="mb-3">
                                      <div className="flex items-center gap-2 flex-wrap mb-2">
                                        <span className="text-xs text-muted-foreground">Changed:</span>
                                        {Array.from(productGroup.changedFields).map((field) => {
                                          const fieldIcon = {
                                            'Title': Type,
                                            'Description': FileText,
                                            'SEO Title': Search,
                                            'Meta Description': Tag,
                                            'Tags': Tag,
                                            'Images': ImageIcon,
                                            'SEO': Search,
                                            'Content': FileText,
                                          }[field] || FileText;
                                          const FieldIcon = fieldIcon;
                                          return (
                                            <Badge 
                                              key={field}
                                              variant="outline" 
                                              className="text-xs bg-primary/10 text-primary border-primary/30"
                                            >
                                              <FieldIcon className="w-3 h-3 mr-1" />
                                              {field}
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                      
                                      {/* Show action breakdown */}
                                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                                        <span>{productGroup.actions.filter(a => a.executedBy === 'agent').length > 0 && (
                                          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
                                            {productGroup.actions.filter(a => a.executedBy === 'agent').length} Autonomous
                                          </Badge>
                                        )}</span>
                                        <span>{productGroup.actions.filter(a => a.executedBy !== 'agent').length > 0 && (
                                          <Badge variant="outline" className="text-xs bg-slate-500/10 text-slate-400 border-slate-500/20">
                                            {productGroup.actions.filter(a => a.executedBy !== 'agent').length} Manual
                                          </Badge>
                                        )}</span>
                                        {productGroup.hasRolledBack && (
                                          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                                            <RotateCcw className="w-3 h-3 mr-1" />
                                            Has Rollbacks
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Summary row */}
                                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/50">
                                      {productGroup.hasPositive ? (
                                        <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                          <TrendingUp className="w-3 h-3 mr-1" />
                                          +{formatCurrency(productGroup.totalRevenue)}
                                        </Badge>
                                      ) : productGroup.hasNegative ? (
                                        <Badge variant="outline" className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                                          <TrendingDown className="w-3 h-3 mr-1" />
                                          {formatCurrency(productGroup.totalRevenue)}
                                        </Badge>
                                      ) : productGroup.hasRolledBack ? (
                                        <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                                          <RotateCcw className="w-3 h-3 mr-1" />
                                          Loss Prevented
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                          <Minus className="w-3 h-3 mr-1" />
                                          Neutral
                                        </Badge>
                                      )}
                                      
                                      {/* Credits used */}
                                      {productGroup.totalCredits > 0 && (
                                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">
                                          <Coins className="w-3 h-3 mr-1" />
                                          {productGroup.totalCredits} credits
                                        </Badge>
                                      )}
                                      
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(productGroup.latestAction, { addSuffix: true })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* SECTION 5: CURRENT STORE STATE */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Current Store State
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "p-4 rounded-lg border flex items-center gap-3",
                  currentStoreState.bgColor
                )}>
                  <currentStoreState.icon className={cn("w-8 h-8", currentStoreState.color)} />
                  <div>
                    <p className={cn("font-medium", currentStoreState.color)} data-testid="text-store-state">
                      {currentStoreState.label}
                    </p>
                    <p className="text-xs text-muted-foreground">ZYRA is always working</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 6: NEXT EXPECTED VALUE */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Next Expected Value
                </CardTitle>
                <CardDescription>What ZYRA is monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                {nextMonitoring ? (
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium" data-testid="text-next-monitoring">
                          Monitoring {nextMonitoring.productName || "product"} for potential optimization
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {nextMonitoring.decisionReason || "Analyzing performance patterns"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50 border text-center">
                    <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground" data-testid="text-no-monitoring">
                      ZYRA is continuously analyzing your store for opportunities
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SECTION 4: WHAT ZYRA LEARNED */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  What ZYRA Learned
                </CardTitle>
                <CardDescription>Insights from the LEARN stage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayLearnings.slice(0, 3).map((learning, index) => (
                    <div 
                      key={learning.id || index} 
                      className="p-3 rounded-lg bg-muted/50 border"
                      data-testid={`learning-item-${index}`}
                    >
                      <div className="flex items-start gap-2">
                        <Brain className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm" data-testid={`text-learning-${index}`}>{learning.insight}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SECTION 3: BEFORE / AFTER SNAPSHOTS (for high-impact decisions) */}
        {highImpactDecision && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                High-Impact Decision Snapshot
              </CardTitle>
              <CardDescription>Before and after comparison for significant changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Before */}
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1">
                    Before
                  </p>
                  <div className="space-y-3">
                    {highImpactDecision.payload?.before?.title && (
                      <div>
                        <p className="text-xs text-muted-foreground">Product Title</p>
                        <p className="text-sm">{highImpactDecision.payload.before.title}</p>
                      </div>
                    )}
                    {highImpactDecision.payload?.before?.description && (
                      <div>
                        <p className="text-xs text-muted-foreground">Description</p>
                        <p className="text-sm line-clamp-2">{highImpactDecision.payload.before.description}</p>
                      </div>
                    )}
                    {highImpactDecision.payload?.before?.seoTitle && (
                      <div>
                        <p className="text-xs text-muted-foreground">SEO Title</p>
                        <p className="text-sm">{highImpactDecision.payload.before.seoTitle}</p>
                      </div>
                    )}
                    {highImpactDecision.payload?.before?.metaDescription && (
                      <div>
                        <p className="text-xs text-muted-foreground">Meta Description</p>
                        <p className="text-sm line-clamp-2">{highImpactDecision.payload.before.metaDescription}</p>
                      </div>
                    )}
                    {!highImpactDecision.payload?.before && (
                      <p className="text-sm text-muted-foreground italic">Original data not available</p>
                    )}
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue (baseline)</p>
                      <p className="text-lg font-medium">$0</p>
                    </div>
                  </div>
                </div>

                {/* After */}
                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                  <p className="text-xs text-primary uppercase tracking-wide mb-3 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    After
                  </p>
                  <div className="space-y-3">
                    {highImpactDecision.payload?.after?.title && (
                      <div>
                        <p className="text-xs text-muted-foreground">Product Title</p>
                        <p className="text-sm font-medium text-primary">{highImpactDecision.payload.after.title}</p>
                      </div>
                    )}
                    {highImpactDecision.payload?.after?.description && (
                      <div>
                        <p className="text-xs text-muted-foreground">Description</p>
                        <p className="text-sm line-clamp-2">{highImpactDecision.payload.after.description}</p>
                      </div>
                    )}
                    {(highImpactDecision.payload?.after?.seoTitle || highImpactDecision.result?.optimizedContent?.seoTitle) && (
                      <div>
                        <p className="text-xs text-muted-foreground">SEO Title</p>
                        <p className="text-sm font-medium text-primary">
                          {highImpactDecision.payload?.after?.seoTitle || highImpactDecision.result?.optimizedContent?.seoTitle}
                        </p>
                      </div>
                    )}
                    {(highImpactDecision.payload?.after?.metaDescription || highImpactDecision.result?.optimizedContent?.metaDescription) && (
                      <div>
                        <p className="text-xs text-muted-foreground">Meta Description</p>
                        <p className="text-sm line-clamp-2">
                          {highImpactDecision.payload?.after?.metaDescription || highImpactDecision.result?.optimizedContent?.metaDescription}
                        </p>
                      </div>
                    )}
                    {!highImpactDecision.payload?.after && !highImpactDecision.result?.optimizedContent && (
                      <p className="text-sm text-muted-foreground italic">Optimized content preview</p>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Revenue After</p>
                        <p className="text-lg font-medium text-green-400">
                          {formatCurrency(highImpactDecision.actualImpact?.revenue || highImpactDecision.estimatedImpact?.expectedRevenue || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Revenue Delta</p>
                        <p className="text-lg font-bold text-green-400 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          +{formatCurrency(highImpactDecision.actualImpact?.revenue || highImpactDecision.estimatedImpact?.expectedRevenue || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CONFIDENCE FOOTER */}
        <Card className="bg-gradient-to-r from-primary/10 to-green-500/10 border-primary/20">
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-3 text-center">
              <Bot className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium">ZYRA clearly earned its subscription.</p>
                <p className="text-sm text-muted-foreground">If you turn this off, you lose clarity and protection.</p>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
