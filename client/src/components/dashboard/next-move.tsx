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
  Sparkles
} from "lucide-react";

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
}

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
  blocked: { label: "Blocked", icon: <AlertCircle className="w-4 h-4" />, color: "text-red-400" },
};

export default function NextMove() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isApproving, setIsApproving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const { data, isLoading, error } = useQuery<NextMoveResponse>({
    queryKey: ['/api/next-move'],
    refetchInterval: 10000,
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

  const generateDemoMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/next-move/generate-demo', {});
    },
    onSuccess: () => {
      toast({
        title: "Demo Opportunity Created",
        description: "ZYRA has detected a new revenue opportunity.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/next-move'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Generate Demo",
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
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Actions Detected Yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              ZYRA continuously monitors your store for revenue opportunities. When ZYRA detects a high-impact action, it will appear here.
            </p>
            <Button
              variant="outline"
              onClick={() => generateDemoMutation.mutate()}
              disabled={generateDemoMutation.isPending}
              data-testid="button-generate-demo"
            >
              {generateDemoMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Demo Opportunity
                </>
              )}
            </Button>
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
        <Button 
          className="w-full"
          onClick={handleExecute}
          disabled={isExecuting || executeMutation.isPending}
          data-testid="button-execute"
        >
          {isExecuting || executeMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run Automatically
            </>
          )}
        </Button>
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
              Approving...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve & Run
            </>
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          {nextMove.creditCost} credits will be used
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
            <h1 className="text-xl font-bold text-foreground">Next Best Revenue Move</h1>
            <p className="text-sm text-muted-foreground">ZYRA's single most important action right now</p>
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
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-muted/30 border border-muted" data-testid="card-reason">
            <p className="text-sm text-foreground leading-relaxed" data-testid="text-reason">{nextMove.reason}</p>
          </div>

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

          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">Rollback Guarantee</span>
            </div>
            <span className="text-xs text-muted-foreground">Instant undo available</span>
          </div>

          {renderActionButton()}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground" data-testid="credits-info">
        <span data-testid="text-credits-remaining">Credits remaining: {data?.creditsRemaining?.toLocaleString() || 0} / {data?.creditLimit?.toLocaleString() || 0}</span>
        <span data-testid="text-action-cost">Action cost: {nextMove.creditCost} credits</span>
      </div>
    </div>
  );
}
