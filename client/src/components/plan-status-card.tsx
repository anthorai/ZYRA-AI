/**
 * Plan Status Card
 * 
 * Displays the active plan, credits remaining, and monthly reset date.
 * Uses soft nudges instead of "Upgrade required" messaging.
 */
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Coins, Zap, Clock, TrendingUp } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { usePlanExperience } from "@/hooks/use-plan-experience";
import { cn } from "@/lib/utils";
import { 
  PLAN_NAMES, 
  PLAN_PRICES, 
  EXECUTION_PRIORITY, 
  AUTONOMY_LEVELS,
  getPlanIdByName 
} from "@/lib/constants/plans";
import { format, formatDistanceToNow } from "date-fns";

interface PlanStatusData {
  planName: string;
  planId: string;
  creditsUsed: number;
  creditsRemaining: number;
  creditLimit: number;
  creditsResetDate: string | null;
  autonomyLevel: string;
  executionPriority: string;
}

export function PlanStatusCard() {
  const { balance, isLoading: creditsLoading, isLow } = useCredits();
  const { tier, language, getUpgradeNudge } = usePlanExperience();
  
  const { data: planStatus, isLoading: planLoading } = useQuery<PlanStatusData>({
    queryKey: ['/api/subscription/status'],
    staleTime: 60000,
  });

  if (creditsLoading || planLoading) {
    return (
      <Card data-testid="card-plan-status-loading">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const planName = planStatus?.planName || "Trial";
  const planId = getPlanIdByName(planName);
  const displayName = PLAN_NAMES[planId as keyof typeof PLAN_NAMES] || planName;
  const price = PLAN_PRICES[planId as keyof typeof PLAN_PRICES] || 0;
  const executionPriority = EXECUTION_PRIORITY[planId as keyof typeof EXECUTION_PRIORITY] || 'standard';
  const autonomyLevel = AUTONOMY_LEVELS[planId as keyof typeof AUTONOMY_LEVELS] || 'very_low';
  
  const creditsRemaining = balance?.creditsRemaining ?? planStatus?.creditsRemaining ?? 0;
  const creditLimit = balance?.creditLimit ?? planStatus?.creditLimit ?? 100;
  const percentUsed = creditLimit > 0 ? Math.round(((creditLimit - creditsRemaining) / creditLimit) * 100) : 0;
  const percentRemaining = 100 - percentUsed;
  
  const resetDate = planStatus?.creditsResetDate ? new Date(planStatus.creditsResetDate) : null;
  const resetLabel = resetDate 
    ? `Resets ${formatDistanceToNow(resetDate, { addSuffix: true })}`
    : "Monthly reset";

  const getExecutionLabel = () => {
    switch (executionPriority) {
      case 'priority': return 'Priority Speed';
      case 'fast': return 'Fast';
      default: return 'Standard';
    }
  };

  const getAutonomyLabel = () => {
    switch (autonomyLevel) {
      case 'high': return 'High Autonomy';
      case 'medium': return 'Medium Autonomy';
      default: return 'Manual Approval';
    }
  };

  const showSpeedNudge = tier === 'trial' || tier === 'starter';
  const showAutonomyNudge = tier !== 'scale';

  return (
    <Card data-testid="card-plan-status">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base font-medium">Your Plan</CardTitle>
          <Badge variant="secondary" data-testid="badge-plan-name">
            {displayName}
            {price > 0 && <span className="ml-1 opacity-70">${price}/mo</span>}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coins className="w-4 h-4" />
              <span>Credits</span>
            </div>
            <span className="font-medium" data-testid="text-credits-remaining">
              {creditsRemaining.toLocaleString()} / {creditLimit.toLocaleString()}
            </span>
          </div>
          <Progress 
            value={percentRemaining}
            className={`h-2 ${isLow ? '[&>div]:bg-amber-500' : ''}`}
            data-testid="progress-credits"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{percentUsed}% used</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {resetLabel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-muted/50 p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Zap className="w-3 h-3" />
              Speed
            </div>
            <div className="text-sm font-medium" data-testid="text-execution-speed">
              {getExecutionLabel()}
            </div>
          </div>
          <div className="rounded-md bg-muted/50 p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingUp className="w-3 h-3" />
              Autonomy
            </div>
            <div className="text-sm font-medium" data-testid="text-autonomy-level">
              {getAutonomyLabel()}
            </div>
          </div>
        </div>

        {isLow && (
          <div 
            className={cn(
              "flex items-center gap-2 text-xs text-muted-foreground",
              "py-1.5 px-2 rounded-md bg-amber-500/10"
            )}
            data-testid="nudge-credits-low"
          >
            <Coins className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>ZYRA will prioritize your highest-impact actions first</span>
          </div>
        )}

        {showSpeedNudge && !isLow && getUpgradeNudge('speed') && (
          <div 
            className={cn(
              "flex items-center gap-2 text-xs text-muted-foreground",
              "py-1.5 px-2 rounded-md bg-muted/30"
            )}
            data-testid="nudge-speed"
          >
            <Zap className="h-3.5 w-3.5 text-primary/70 shrink-0" />
            <span>{getUpgradeNudge('speed')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CompactPlanStatus() {
  const { balance, isLoading, isLow } = useCredits();
  const { tier } = usePlanExperience();

  if (isLoading || !balance) {
    return null;
  }

  const { creditsRemaining, creditLimit } = balance;
  const percentRemaining = creditLimit > 0 
    ? Math.round((creditsRemaining / creditLimit) * 100) 
    : 0;

  return (
    <div className="flex items-center gap-2" data-testid="compact-plan-status">
      <div className="flex items-center gap-1.5">
        <Coins className={`w-4 h-4 ${isLow ? 'text-amber-500' : 'text-muted-foreground'}`} />
        <span className={`text-sm font-medium ${isLow ? 'text-amber-500' : ''}`}>
          {creditsRemaining.toLocaleString()}
        </span>
      </div>
      <Progress 
        value={percentRemaining}
        className={`w-16 h-1.5 ${isLow ? '[&>div]:bg-amber-500' : ''}`}
      />
    </div>
  );
}

export function CreditUsageIndicator({ creditsUsed }: { creditsUsed: number }) {
  if (creditsUsed <= 0) return null;
  
  return (
    <Badge variant="outline" className="gap-1 text-xs" data-testid="badge-credits-used">
      <Coins className="w-3 h-3" />
      -{creditsUsed} credits
    </Badge>
  );
}
