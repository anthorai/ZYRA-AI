/**
 * ZYRA Master Loop Panel
 * 
 * Displays the current state of the ZYRA Master Loop system:
 * - Store situation classification
 * - Plan permissions
 * - Available actions queue
 * - Activity timeline
 * - Loop proof metrics
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useMasterLoopState,
  useMasterLoopSituation,
  useMasterLoopActions,
  useMasterLoopActivities,
  useMasterLoopProof,
  useMasterLoopRunCycle,
  useMasterLoopFreeze,
  useMasterLoopUnfreeze,
} from "@/hooks/use-master-loop";
import {
  Activity,
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Lock,
  Unlock,
  RefreshCw,
  Play,
  Pause,
  Brain,
  Target,
  Settings,
  ChevronRight,
} from "lucide-react";

const PHASE_ICONS: Record<string, typeof Activity> = {
  detect: Target,
  decide: Brain,
  execute: Zap,
  prove: TrendingUp,
  learn: Settings,
  idle: Clock,
  frozen: Lock,
};

const PHASE_COLORS: Record<string, string> = {
  detect: "text-blue-500",
  decide: "text-purple-500",
  execute: "text-orange-500",
  prove: "text-green-500",
  learn: "text-cyan-500",
  idle: "text-muted-foreground",
  frozen: "text-red-500",
};

const SITUATION_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  NEW_FRESH: { label: "New Store", variant: "secondary" },
  MEDIUM_GROWING: { label: "Growing", variant: "default" },
  ENTERPRISE_SCALE: { label: "Enterprise", variant: "outline" },
};

const PERMISSION_COLORS: Record<string, string> = {
  FULL: "bg-green-500/10 text-green-600 dark:text-green-400",
  LIMITED: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  ROLLBACK_ONLY: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  NONE: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function MasterLoopPanel() {
  const [showActions, setShowActions] = useState(false);
  
  const { data: stateData, isLoading: stateLoading } = useMasterLoopState();
  const { data: situationData } = useMasterLoopSituation();
  const { data: actionsData } = useMasterLoopActions();
  const { data: activitiesData } = useMasterLoopActivities();
  const { data: proofData } = useMasterLoopProof();
  
  const runCycle = useMasterLoopRunCycle();
  const freeze = useMasterLoopFreeze();
  const unfreeze = useMasterLoopUnfreeze();

  const state = stateData?.state;
  const situation = situationData?.situation;
  const actions = actionsData?.actions;
  const activities = activitiesData?.activities || [];
  const proof = proofData?.proof;

  if (stateLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Master Loop
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const PhaseIcon = PHASE_ICONS[state?.phase || "idle"] || Activity;
  const phaseColor = PHASE_COLORS[state?.phase || "idle"];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2" data-testid="master-loop-title">
            <Activity className="h-5 w-5" />
            ZYRA Master Loop
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {state?.isFrozen ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => unfreeze.mutate()}
                disabled={unfreeze.isPending}
                data-testid="button-unfreeze-loop"
              >
                <Unlock className="h-4 w-4 mr-1" />
                Unfreeze
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => runCycle.mutate()}
                  disabled={runCycle.isPending}
                  data-testid="button-run-cycle"
                >
                  {runCycle.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-1" />
                  )}
                  Run Cycle
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => freeze.mutate("Manually paused")}
                  disabled={freeze.isPending}
                  data-testid="button-freeze-loop"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phase & Status */}
        <div className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted/50 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-background ${phaseColor}`}>
              <PhaseIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-medium capitalize" data-testid="text-current-phase">
                {state?.phase || "Idle"}
              </div>
              <div className="text-xs text-muted-foreground">
                {state?.cycleCount || 0} cycles run
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {situation && (
              <Badge variant={SITUATION_BADGES[situation.classification]?.variant || "secondary"} data-testid="badge-situation">
                {SITUATION_BADGES[situation.classification]?.label || situation.classification}
              </Badge>
            )}
            {state?.plan && (
              <Badge variant="outline" data-testid="badge-plan">
                {state.plan}
              </Badge>
            )}
          </div>
        </div>

        {/* Freeze Warning */}
        {state?.isFrozen && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive" data-testid="alert-frozen">
            <Lock className="h-4 w-4" />
            <span className="text-sm">{state.freezeReason || "Loop is paused"}</span>
          </div>
        )}

        {/* Permissions Grid */}
        <div className="grid grid-cols-3 gap-2">
          {state?.permissions && Object.entries(state.permissions).map(([category, level]) => (
            <div
              key={category}
              className={`p-2 rounded-md text-center ${PERMISSION_COLORS[level] || PERMISSION_COLORS.NONE}`}
            >
              <div className="text-xs font-medium capitalize">{category}</div>
              <div className="text-xs opacity-80">{level}</div>
            </div>
          ))}
        </div>

        {/* Next Action */}
        {state?.nextAction && !state.isFrozen && (
          <div className="flex items-center justify-between p-3 rounded-md border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium" data-testid="text-next-action">Next: {state.nextAction}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {/* Actions Summary */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span data-testid="text-actions-available">{state?.actionsAvailable || 0} available</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span data-testid="text-actions-skipped">{state?.actionsSkipped || 0} skipped</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowActions(!showActions)}
            data-testid="button-toggle-actions"
          >
            {showActions ? "Hide" : "Show"} Actions
          </Button>
        </div>

        {/* Actions List */}
        {showActions && actions?.allowed && (
          <ScrollArea className="h-40 rounded-md border p-2">
            <div className="space-y-2">
              {actions.allowed.map((action, index) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
                  data-testid={`action-item-${action.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
                    <span>{action.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {action.riskLevel}
                    </Badge>
                    {action.requiresApproval && (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Activity Timeline */}
        {activities.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Activity
            </div>
            <ScrollArea className="h-32 rounded-md border p-2">
              <div className="space-y-2">
                {activities.slice(0, 10).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-2 text-xs"
                    data-testid={`activity-${activity.id}`}
                  >
                    <div className={`mt-1 w-2 h-2 rounded-full ${
                      activity.status === "completed" ? "bg-green-500" :
                      activity.status === "error" ? "bg-red-500" :
                      activity.status === "warning" ? "bg-yellow-500" :
                      "bg-blue-500"
                    }`} />
                    <div className="flex-1">
                      <div className="text-muted-foreground">{activity.message}</div>
                      {activity.actionName && (
                        <div className="text-xs opacity-60">{activity.actionName}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Proof Metrics */}
        {proof && (
          <div className="grid grid-cols-3 gap-3 pt-2 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-primary" data-testid="text-actions-executed">
                {proof.actionsExecuted}
              </div>
              <div className="text-xs text-muted-foreground">Executed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold" data-testid="text-rollbacks">
                {proof.rollbacksPerformed}
              </div>
              <div className="text-xs text-muted-foreground">Rollbacks</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-500" data-testid="text-revenue-delta">
                ${proof.estimatedRevenueDelta.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">Revenue</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
