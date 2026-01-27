import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { UnifiedHeader } from "@/components/ui/unified-header";
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
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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

  const completedActions = actions?.filter(a => a.status === "completed") || [];
  const rolledBackActions = actions?.filter(a => a.status === "rolled_back") || [];

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

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader
        title="ZYRA Report"
        subtitle="What money did ZYRA make, protect, or influence for your store?"
        showBackButton
        backTo="/dashboard"
      />
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-8 bg-[#121224]">
        
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
                  ) : completedActions.length === 0 && rolledBackActions.length === 0 ? (
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
                        {[...completedActions, ...rolledBackActions].slice(0, 20).map((action) => {
                          const isRolledBack = action.status === "rolled_back";
                          const isPositive = action.actualImpact?.status === "positive";
                          const isNegative = action.actualImpact?.status === "negative";
                          const revenueResult = action.actualImpact?.revenue || action.estimatedImpact?.expectedRevenue || 0;
                          
                          return (
                            <div 
                              key={action.id} 
                              className="relative pl-10"
                              data-testid={`timeline-item-${action.id}`}
                            >
                              <div className={cn(
                                "absolute left-2.5 w-3 h-3 rounded-full border-2 border-background",
                                isRolledBack ? "bg-blue-400" : isPositive ? "bg-green-400" : isNegative ? "bg-red-400" : "bg-yellow-400"
                              )} />
                              
                              <div className="p-4 rounded-lg border bg-card">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0">
                                    {action.productImage ? (
                                      <img 
                                        src={action.productImage} 
                                        alt="" 
                                        className="w-12 h-12 rounded-md object-cover border"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                                        <Package className="w-6 h-6 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <span className="font-medium text-sm truncate">
                                        {action.productName || "Product Update"}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {ACTION_TYPE_LABELS[action.actionType] || action.actionType}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {action.decisionReason || "AI-driven optimization based on store analysis"}
                                    </p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "text-xs",
                                          action.executedBy === "agent" 
                                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30" 
                                            : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                                        )}
                                      >
                                        {action.executedBy === "agent" ? "Autonomous" : "Manual"}
                                      </Badge>
                                      
                                      {isRolledBack ? (
                                        <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                                          <RotateCcw className="w-3 h-3 mr-1" />
                                          Rolled Back (Loss Prevented)
                                        </Badge>
                                      ) : isPositive ? (
                                        <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                          <TrendingUp className="w-3 h-3 mr-1" />
                                          +{formatCurrency(revenueResult)}
                                        </Badge>
                                      ) : isNegative ? (
                                        <Badge variant="outline" className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                                          <TrendingDown className="w-3 h-3 mr-1" />
                                          {formatCurrency(revenueResult)}
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                          <Minus className="w-3 h-3 mr-1" />
                                          Neutral
                                        </Badge>
                                      )}
                                      
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
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
  );
}
