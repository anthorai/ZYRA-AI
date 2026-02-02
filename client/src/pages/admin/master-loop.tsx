/**
 * ZYRA Master Loop Admin Page
 * 
 * Admin-only page for monitoring and controlling the ZYRA Master Loop system.
 * Provides transparency into the autonomous optimization engine.
 */

import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMasterLoopState,
  useMasterLoopSituation,
  useMasterLoopActions,
  useMasterLoopActivities,
  useMasterLoopProof,
  useMasterLoopKPIBaseline,
  useMasterLoopRunCycle,
  useMasterLoopFreeze,
  useMasterLoopUnfreeze,
  useMasterLoopRefreshSituation,
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
  Database,
  BarChart3,
  Users,
  DollarSign,
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

const SITUATION_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline"; description: string }> = {
  NEW_FRESH: { label: "New Store", variant: "secondary", description: "Store is new with limited data. Focus on foundation building." },
  MEDIUM_GROWING: { label: "Growing", variant: "default", description: "Store has traction. Ready for growth optimizations." },
  ENTERPRISE_SCALE: { label: "Enterprise", variant: "outline", description: "High-volume store. Advanced guard actions available." },
};

const PERMISSION_COLORS: Record<string, string> = {
  FULL: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  LIMITED: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  ROLLBACK_ONLY: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  NONE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
};

export default function MasterLoopAdminPage() {
  const [showActions, setShowActions] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: stateData, isLoading: stateLoading, error: stateError } = useMasterLoopState();
  const { data: situationData, isLoading: situationLoading } = useMasterLoopSituation();
  const { data: actionsData, isLoading: actionsLoading } = useMasterLoopActions();
  const { data: activitiesData } = useMasterLoopActivities();
  const { data: proofData } = useMasterLoopProof();
  const { data: baselineData } = useMasterLoopKPIBaseline();
  
  const runCycle = useMasterLoopRunCycle();
  const freeze = useMasterLoopFreeze();
  const unfreeze = useMasterLoopUnfreeze();
  const refreshSituation = useMasterLoopRefreshSituation();

  const state = stateData?.state;
  const situation = situationData?.situation;
  const actions = actionsData?.actions;
  const activities = activitiesData?.activities || [];
  const proof = proofData?.proof;
  const baseline = baselineData?.baseline;

  const PhaseIcon = PHASE_ICONS[state?.phase || "idle"] || Activity;
  const phaseColor = PHASE_COLORS[state?.phase || "idle"];

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="page-title">
              <Activity className="h-6 w-6 text-primary" />
              ZYRA Master Loop
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor and control the autonomous optimization engine
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {state?.isFrozen ? (
              <Button
                variant="default"
                onClick={() => unfreeze.mutate()}
                disabled={unfreeze.isPending}
                data-testid="button-unfreeze-loop"
              >
                {unfreeze.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Unlock className="h-4 w-4 mr-2" />
                )}
                Unfreeze Loop
              </Button>
            ) : (
              <>
                <Button
                  variant="default"
                  onClick={() => runCycle.mutate()}
                  disabled={runCycle.isPending}
                  data-testid="button-run-cycle"
                >
                  {runCycle.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run Cycle
                </Button>
                <Button
                  variant="outline"
                  onClick={() => freeze.mutate("Manually paused by admin")}
                  disabled={freeze.isPending}
                  data-testid="button-freeze-loop"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Loop
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => refreshSituation.mutate()}
              disabled={refreshSituation.isPending}
              data-testid="button-refresh-situation"
            >
              {refreshSituation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Situation
            </Button>
          </div>
        </div>

        {stateError && (
          <Card className="mb-6 border-destructive">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>Error loading Master Loop state. Please check the backend connection.</span>
              </div>
            </CardContent>
          </Card>
        )}

        {stateLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="actions" data-testid="tab-actions">Actions Queue</TabsTrigger>
              <TabsTrigger value="activity" data-testid="tab-activity">Activity Log</TabsTrigger>
              <TabsTrigger value="metrics" data-testid="tab-metrics">Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Current Phase</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-muted ${phaseColor}`}>
                        <PhaseIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xl font-bold capitalize" data-testid="text-current-phase">
                          {state?.phase || "Idle"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {state?.cycleCount || 0} cycles completed
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Store Situation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {situationLoading ? (
                      <Skeleton className="h-16 w-full" />
                    ) : situation ? (
                      <div>
                        <Badge 
                          variant={SITUATION_BADGES[situation.classification]?.variant || "secondary"}
                          className="mb-2"
                          data-testid="badge-situation"
                        >
                          {SITUATION_BADGES[situation.classification]?.label || situation.classification}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {SITUATION_BADGES[situation.classification]?.description || situation.reason}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No situation detected</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Plan & Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 flex-wrap">
                      {state?.plan && (
                        <Badge variant="outline" data-testid="badge-plan">
                          {state.plan} Plan
                        </Badge>
                      )}
                      {state?.isFrozen ? (
                        <Badge variant="destructive" data-testid="badge-frozen">
                          <Lock className="h-3 w-3 mr-1" />
                          Frozen
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    {state?.isFrozen && state.freezeReason && (
                      <p className="text-sm text-destructive mt-2">{state.freezeReason}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Plan Permissions
                  </CardTitle>
                  <CardDescription>
                    What actions the current subscription plan allows
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {state?.permissions && Object.entries(state.permissions).map(([category, level]) => (
                      <div
                        key={category}
                        className={`p-4 rounded-lg border ${PERMISSION_COLORS[level as string] || PERMISSION_COLORS.NONE}`}
                      >
                        <div className="text-sm font-medium capitalize mb-1">{category}</div>
                        <div className="text-lg font-bold">{level as string}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {state?.nextAction && !state.isFrozen && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium" data-testid="text-next-action">Next Action: {state.nextAction}</div>
                          <div className="text-sm text-muted-foreground">Ready to execute on next cycle</div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="actions" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Available Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" data-testid="text-actions-available">
                      {state?.actionsAvailable || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      Skipped Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" data-testid="text-actions-skipped">
                      {state?.actionsSkipped || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Action Queue</CardTitle>
                  <CardDescription>
                    Prioritized list of available actions based on Trust, Clarity, Conversion, Revenue, SEO, Learning sequence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {actionsLoading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : actions?.allowed && actions.allowed.length > 0 ? (
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {actions.allowed.map((action, index) => (
                          <div
                            key={action.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                            data-testid={`action-item-${action.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                              <div>
                                <div className="font-medium">{action.name}</div>
                                <div className="text-sm text-muted-foreground">{action.description}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {action.category}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  action.riskLevel === 'low' ? 'border-green-500/30 text-green-500' :
                                  action.riskLevel === 'medium' ? 'border-yellow-500/30 text-yellow-500' :
                                  'border-red-500/30 text-red-500'
                                }`}
                              >
                                {action.riskLevel}
                              </Badge>
                              {action.requiresApproval && (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No actions available in the queue
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Activity Timeline
                  </CardTitle>
                  <CardDescription>
                    Recent Master Loop activities and events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activities.length > 0 ? (
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {activities.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                            data-testid={`activity-${activity.id}`}
                          >
                            <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                              activity.status === "completed" ? "bg-green-500" :
                              activity.status === "error" ? "bg-red-500" :
                              activity.status === "warning" ? "bg-yellow-500" :
                              "bg-blue-500"
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-sm">{activity.message}</span>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {activity.phase}
                                </Badge>
                              </div>
                              {activity.actionName && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  Action: {activity.actionName}
                                </div>
                              )}
                              {activity.details && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  {activity.details}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(activity.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No activity recorded yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Actions Executed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary" data-testid="text-actions-executed">
                      {proof?.actionsExecuted || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Rollbacks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" data-testid="text-rollbacks">
                      {proof?.rollbacksPerformed || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Revenue Delta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${(proof?.estimatedRevenueDelta || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`} data-testid="text-revenue-delta">
                      ${(proof?.estimatedRevenueDelta || 0).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {baseline && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      KPI Baseline
                    </CardTitle>
                    <CardDescription>
                      Baseline metrics captured for comparison
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Conversion Rate</div>
                        <div className="text-xl font-bold">{(baseline.conversionRate * 100).toFixed(2)}%</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Revenue</div>
                        <div className="text-xl font-bold">${baseline.revenue.toFixed(0)}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Cart Abandonment</div>
                        <div className="text-xl font-bold">{(baseline.cartAbandonmentRate * 100).toFixed(1)}%</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Bounce Rate</div>
                        <div className="text-xl font-bold">{(baseline.bounceRate * 100).toFixed(1)}%</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Avg Order Value</div>
                        <div className="text-xl font-bold">${baseline.averageOrderValue.toFixed(0)}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-3">
                      Last updated: {new Date(baseline.timestamp).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {situation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Store Situation Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Store Age</div>
                        <div className="text-xl font-bold">{situation.storeAgeInDays} days</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Total Orders</div>
                        <div className="text-xl font-bold">{situation.totalOrders}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Monthly Traffic</div>
                        <div className="text-xl font-bold">{situation.monthlyTraffic}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Monthly Revenue</div>
                        <div className="text-xl font-bold">${situation.monthlyRevenue.toFixed(0)}</div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-muted/30 border">
                      <div className="text-sm font-medium mb-1">Classification Reason</div>
                      <p className="text-sm text-muted-foreground">{situation.reason}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{situation.confidenceLevel} confidence</Badge>
                        <span className="text-xs text-muted-foreground">
                          Data score: {(situation.dataAvailabilityScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
