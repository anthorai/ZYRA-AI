import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  Zap,
  TrendingUp,
  Shield,
  Clock,
  RotateCcw,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  CircleDollarSign,
  ShieldCheck,
  ShoppingCart,
  CreditCard,
  Package,
  type LucideIcon
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ShopifyConnectionGate, WarmUpMode } from "@/components/zyra/store-connection-gate";
import type { StoreReadiness } from "@shared/schema";

interface NextMoveAction {
  id: string;
  actionType: string;
  productId: string | null;
  productName: string | null;
  reason: string;
  expectedRevenue: number;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'ready' | 'awaiting_approval' | 'executing' | 'monitoring' | 'completed' | 'blocked' | 'no_action';
  planRequired: string;
  creditCost: number;
  createdAt: Date;
  executedAt: Date | null;
  completedAt: Date | null;
  score: number;
  opportunityId: string;
  rollbackAvailable: boolean;
  // Layer 1: Decision Transparency
  decisionReasons: string[];
  // Layer 2: Opportunity Cost
  opportunityCostMonthly: number;
  // Credit value justification
  creditValueRatio: number;
  // FRICTION CONTEXT (new friction-focused fields)
  frictionType?: 'view_no_cart' | 'cart_no_checkout' | 'checkout_drop' | 'purchase_no_upsell';
  frictionDescription?: string;
  whereIntentDied?: string;
  estimatedMonthlyLoss?: number;
}

// Friction type labels for display
const FRICTION_TYPE_LABELS: Record<string, string> = {
  view_no_cart: 'View → No Add to Cart',
  cart_no_checkout: 'Cart → No Checkout',
  checkout_drop: 'Checkout Drop',
  purchase_no_upsell: 'Purchase → No Upsell'
};

const FRICTION_TYPE_ICONS: Record<string, LucideIcon> = {
  view_no_cart: Eye,
  cart_no_checkout: ShoppingCart,
  checkout_drop: CreditCard,
  purchase_no_upsell: Package
};

interface NextMoveResponse {
  nextMove: NextMoveAction | null;
  userPlan: string;
  planId: string;
  creditsRemaining: number;
  creditLimit: number;
  canAutoExecute: boolean;
  requiresApproval: boolean;
  blockedReason: string | null;
  executionSpeed: string;
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  product_seo: "SEO Optimization",
  seo_optimization: "SEO Optimization",
  cart_recovery: "Cart Recovery",
  upsell: "Smart Upsell",
  rollback: "Rollback Change",
  refresh: "Content Refresh",
  title_rewrite: "Title Optimization",
  description_enhancement: "Description Enhancement",
  price_adjustment: "Price Optimization",
};

const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  high: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  ready: { label: "Ready to Execute", icon: <Zap className="w-4 h-4" />, color: "text-emerald-400" },
  awaiting_approval: { label: "Awaiting Your Approval", icon: <Clock className="w-4 h-4" />, color: "text-amber-400" },
  executing: { label: "ZYRA is Executing...", icon: <Loader2 className="w-4 h-4 animate-spin" />, color: "text-primary" },
  monitoring: { label: "Monitoring Results", icon: <Target className="w-4 h-4" />, color: "text-blue-400" },
  completed: { label: "Completed", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-400" },
  blocked: { label: "Queued for Next Cycle", icon: <Clock className="w-4 h-4" />, color: "text-amber-400" },
};

export default function NextMove() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isApproving, setIsApproving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isReasonsOpen, setIsReasonsOpen] = useState(false);

  // CRITICAL: Check store readiness before showing Next Move
  // ZYRA must NEVER run if Shopify is not connected
  const { data: storeReadiness, isLoading: isReadinessLoading } = useQuery<StoreReadiness>({
    queryKey: ['/api/store-readiness'],
    refetchInterval: 30000,
  });

  const { data, isLoading, error } = useQuery<NextMoveResponse>({
    queryKey: ['/api/next-move'],
    refetchInterval: 10000,
    // Only fetch next move if store is ready
    enabled: storeReadiness?.state === 'ready',
  });

  const approveMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      return apiRequest('POST', '/api/next-move/approve', { opportunityId });
    },
    onSuccess: () => {
      toast({
        title: "Next Move Approved",
        description: "ZYRA is now executing this action.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/next-move'] });
      queryClient.invalidateQueries({ queryKey: ['/api/credits/balance'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      return apiRequest('POST', '/api/next-move/execute', { opportunityId });
    },
    onSuccess: () => {
      toast({
        title: "Execution Started",
        description: "ZYRA is now executing this action.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/next-move'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Execution Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      return apiRequest('POST', '/api/next-move/rollback', { opportunityId });
    },
    onSuccess: () => {
      toast({
        title: "Rolled Back",
        description: "The action has been rolled back successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/next-move'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Rollback Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  const handleApprove = async () => {
    if (!data?.nextMove) return;
    setIsApproving(true);
    try {
      await approveMutation.mutateAsync(data.nextMove.opportunityId);
    } finally {
      setIsApproving(false);
    }
  };

  const handleExecute = async () => {
    if (!data?.nextMove) return;
    setIsExecuting(true);
    try {
      await executeMutation.mutateAsync(data.nextMove.opportunityId);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRollback = () => {
    if (!data?.nextMove) return;
    rollbackMutation.mutate(data.nextMove.opportunityId);
  };

  // Loading state for store readiness check
  if (isReadinessLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center space-y-4">
          <Brain className="w-12 h-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Checking store connection...</p>
        </div>
      </div>
    );
  }

  // STATE 1: Shopify not connected - show connection gate
  // ZYRA must NEVER run if Shopify is not connected
  if (storeReadiness?.state === 'not_connected') {
    return <ShopifyConnectionGate readiness={storeReadiness} />;
  }

  // STATE 2: Shopify connected but warming up - show preparation screen
  // No optimizations allowed, only data ingestion
  if (storeReadiness?.state === 'warming_up') {
    return <WarmUpMode readiness={storeReadiness} />;
  }

  // STATE 3: Ready - continue to show Next Move
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center space-y-4">
          <Brain className="w-12 h-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">ZYRA is analyzing opportunities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-muted-foreground">Failed to load next move</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/next-move'] })}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const nextMove = data?.nextMove;

  if (!nextMove) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Next Best Revenue Move</h1>
            <p className="text-sm text-muted-foreground">ZYRA's single most important action right now</p>
          </div>
        </div>

        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-muted-foreground animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">ZYRA is Analyzing Your Store</h3>
            <p className="text-muted-foreground max-w-md">
              ZYRA continuously monitors your store for revenue opportunities. When ZYRA detects a friction point blocking your revenue, the recommended action will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const riskStyle = RISK_COLORS[nextMove.riskLevel] || RISK_COLORS.medium;
  const statusConfig = STATUS_CONFIG[nextMove.status] || STATUS_CONFIG.awaiting_approval;
  const actionLabel = ACTION_TYPE_LABELS[nextMove.actionType] || nextMove.actionType;

  const renderActionButton = () => {
    if (nextMove.status === 'blocked') {
      return (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-sm text-red-400">{data?.blockedReason || 'This action is blocked'}</p>
          </div>
          <Button variant="outline" className="w-full" disabled>
            <AlertCircle className="w-4 h-4 mr-2" />
            Action Blocked
          </Button>
        </div>
      );
    }

    if (nextMove.status === 'executing' || nextMove.status === 'monitoring') {
      return (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">ZYRA is working on this...</span>
            </div>
          </div>
          {nextMove.rollbackAvailable && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleRollback}
              disabled={rollbackMutation.isPending}
              data-testid="button-rollback"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {rollbackMutation.isPending ? 'Rolling back...' : 'Rollback if needed'}
            </Button>
          )}
        </div>
      );
    }

    if (nextMove.status === 'completed') {
      return (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Completed Successfully</span>
            </div>
          </div>
          {nextMove.rollbackAvailable && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleRollback}
              disabled={rollbackMutation.isPending}
              data-testid="button-rollback"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {rollbackMutation.isPending ? 'Rolling back...' : 'Rollback'}
            </Button>
          )}
        </div>
      );
    }

    if (data?.canAutoExecute && !data?.requiresApproval) {
      return (
        <div className="space-y-2">
          <Button 
            className="w-full"
            onClick={handleExecute}
            disabled={isExecuting || executeMutation.isPending}
            data-testid="button-execute"
          >
            {isExecuting || executeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ZYRA is executing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                ZYRA Will Execute Now
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Auto-execution enabled for your plan
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <Button 
          className="w-full"
          onClick={handleApprove}
          disabled={isApproving || approveMutation.isPending}
          data-testid="button-approve"
        >
          {isApproving || approveMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ZYRA is preparing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Let ZYRA Execute
            </>
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          ZYRA will execute this decision and monitor results
        </p>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">One Friction ZYRA Will Remove</h1>
            <p className="text-sm text-muted-foreground">Where buyer intent exists but money isn't happening</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs" data-testid="badge-user-plan">
            {data?.userPlan}
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid="badge-execution-speed">
            {data?.executionSpeed === 'priority' ? 'Priority' : data?.executionSpeed === 'fast' ? 'Fast' : 'Standard'} Speed
          </Badge>
        </div>
      </div>

      <Card className="gradient-surface border-primary/20 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
        
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground" data-testid="text-action-type">{actionLabel}</CardTitle>
                {nextMove.productName && (
                  <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-product-name">
                    Product: {nextMove.productName}
                  </p>
                )}
              </div>
            </div>
            <div className={`flex items-center gap-2 ${statusConfig.color}`} data-testid="status-indicator">
              {statusConfig.icon}
              <span className="text-sm font-medium" data-testid="text-status">{statusConfig.label}</span>
            </div>
          </div>
          
          {/* FRICTION CONTEXT - Show where money is leaking */}
          {nextMove.frictionType && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20" data-testid="friction-context">
              <div className="flex items-start gap-3">
                <div className="text-red-400">
                  {(() => {
                    const Icon = FRICTION_TYPE_ICONS[nextMove.frictionType] || AlertCircle;
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-red-400 border-red-500/30 text-xs">
                      Friction Detected
                    </Badge>
                    <span className="text-sm font-medium text-red-400">
                      {FRICTION_TYPE_LABELS[nextMove.frictionType] || nextMove.frictionType}
                    </span>
                  </div>
                  {nextMove.whereIntentDied && (
                    <p className="text-sm text-muted-foreground">
                      Where intent died: <span className="text-foreground">{nextMove.whereIntentDied}</span>
                    </p>
                  )}
                  {nextMove.estimatedMonthlyLoss && nextMove.estimatedMonthlyLoss > 0 && (
                    <p className="text-sm text-red-400 mt-1 font-medium">
                      Money leaking: ${nextMove.estimatedMonthlyLoss.toLocaleString()}/month
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Main reason - ZYRA's decision statement */}
          <div className="p-4 rounded-lg bg-muted/30 border border-muted" data-testid="card-reason">
            <p className="text-sm text-foreground leading-relaxed" data-testid="text-reason">{nextMove.reason}</p>
          </div>

          {/* Layer 1: Decision Transparency - Collapsible "Why ZYRA chose this move" */}
          <Collapsible open={isReasonsOpen} onOpenChange={setIsReasonsOpen}>
            <CollapsibleTrigger asChild>
              <button 
                className="flex items-center justify-between w-full p-3 rounded-lg bg-primary/5 border border-primary/20 text-left group"
                data-testid="button-toggle-reasons"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Why ZYRA chose this move</span>
                </div>
                {isReasonsOpen ? (
                  <ChevronUp className="w-4 h-4 text-primary" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-primary" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="p-4 rounded-lg bg-muted/20 border border-muted space-y-2" data-testid="card-decision-reasons">
                {nextMove.decisionReasons?.map((reason, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{reason}</p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Layer 2: Opportunity Cost - What if you do nothing */}
          {nextMove.opportunityCostMonthly > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-500/5 border border-amber-500/20" data-testid="opportunity-cost">
              <CircleDollarSign className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-sm text-amber-400">
                If skipped, estimated revenue left on table this month: <span className="font-semibold">${nextMove.opportunityCostMonthly.toLocaleString()}</span>
              </span>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" data-testid="metrics-grid">
            <div className="p-3 rounded-lg bg-muted/20 text-center" data-testid="metric-revenue">
              <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground" data-testid="text-expected-revenue">${nextMove.expectedRevenue.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Expected Revenue</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 text-center" data-testid="metric-confidence">
              <Target className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground" data-testid="text-confidence">{nextMove.confidenceScore}%</p>
              <p className="text-xs text-muted-foreground">Confidence</p>
            </div>
            <div className={`p-3 rounded-lg text-center ${riskStyle.bg} ${riskStyle.border} border`} data-testid="metric-risk">
              <Shield className={`w-5 h-5 mx-auto mb-1 ${riskStyle.text}`} />
              <p className={`text-lg font-bold capitalize ${riskStyle.text}`} data-testid="text-risk-level">{nextMove.riskLevel}</p>
              <p className="text-xs text-muted-foreground">Risk Level</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 text-center" data-testid="metric-score">
              <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground" data-testid="text-priority-score">{nextMove.score.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Priority Score</p>
            </div>
          </div>

          {/* Layer 3: Reversible Commitment - System Guarantee Promise */}
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20" data-testid="rollback-promise">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-400">ZYRA will automatically undo this if revenue drops</p>
                <p className="text-xs text-muted-foreground mt-0.5">Rollback snapshot created before execution. One-click instant recovery.</p>
              </div>
            </div>
          </div>

          {renderActionButton()}
        </CardContent>
      </Card>

      {/* Low Credit Soft Nudge - inspiring message, not blocking */}
      {data && data.creditLimit > 0 && (() => {
        const percentUsed = Math.round((1 - (data.creditsRemaining / data.creditLimit)) * 100);
        const isLow = data.creditsRemaining <= data.creditLimit * 0.2 && data.creditsRemaining > 0;
        const isVeryLow = data.creditsRemaining <= data.creditLimit * 0.1 && data.creditsRemaining > 0;
        const isExhausted = data.creditsRemaining <= 0;
        
        if (isExhausted) {
          return (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20" data-testid="nudge-exhausted">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-400 font-medium">ZYRA is prioritizing highest-impact actions</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Some optimizations are queued for next cycle. Higher plans unlock faster continuous optimization.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        
        if (isVeryLow) {
          return (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20" data-testid="nudge-very-low">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-400 font-medium">Credits running low ({percentUsed}% used)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ZYRA is focusing on revenue-critical actions. Your credits will refresh at the start of your next billing cycle.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        
        if (isLow) {
          return (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20" data-testid="nudge-low">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-primary font-medium">ZYRA is working efficiently ({percentUsed}% credits deployed)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Deep AI analysis is consuming credits as expected. Higher plans unlock more autonomous actions.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        
        return null;
      })()}

      {/* Credit Justification - reframe credits as growth fuel */}
      <div className="p-3 rounded-lg bg-muted/20 border border-muted" data-testid="credits-info">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground" data-testid="text-credits-remaining">
              Credits available: <span className="text-foreground font-medium">{data?.creditsRemaining?.toLocaleString() || 0}</span> / {data?.creditLimit?.toLocaleString() || 0}
            </span>
          </div>
          {/* Full credit value justification statement */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" data-testid="credit-value-statement">
            <span className="text-muted-foreground">
              Action cost: <span className="text-foreground font-medium">{nextMove.creditCost} credits</span>
            </span>
            <span className="text-muted-foreground hidden sm:inline">·</span>
            <span className="text-muted-foreground">
              Estimated return: <span className="text-emerald-400 font-medium">${nextMove.expectedRevenue.toLocaleString()}</span>
            </span>
            {nextMove.creditValueRatio > 0 && (
              <>
                <span className="text-muted-foreground hidden sm:inline">·</span>
                <span className="text-emerald-400 font-medium" data-testid="text-credit-value">
                  ≈ ${nextMove.creditValueRatio.toFixed(2)} per credit
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
