import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  CircleDot,
  Target,
  Zap,
  BadgeCheck,
  Lightbulb,
  TrendingUp,
  Activity,
  Clock,
  Store,
  DollarSign,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface RevenueLoopStatsResponse {
  timestamp: string;
  engineStatus: 'operational' | 'idle' | 'error';
  signals: {
    total: number;
    today: number;
  };
  opportunities: {
    total: number;
    executed: number;
    pendingApproval: number;
  };
  proofs: {
    total: number;
    totalRevenue: number;
    weekRevenue: number;
  };
  stores: {
    active: number;
  };
  insights: {
    total: number;
  };
}

function PhaseCard({
  phase,
  title,
  description,
  icon: Icon,
  value,
  subValue,
  color,
  isLoading,
  testId,
}: {
  phase: number;
  title: string;
  description: string;
  icon: React.ElementType;
  value: number | string;
  subValue?: string;
  color: string;
  isLoading: boolean;
  testId: string;
}) {
  return (
    <Card className="relative overflow-visible" data-testid={testId}>
      <div className={`absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-bold ${color} text-white`}>
        Phase {phase}
      </div>
      <CardHeader className="pt-6 pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-20" />
        ) : (
          <div className="flex flex-col">
            <span className="text-3xl font-bold">{value}</span>
            {subValue && (
              <span className="text-xs text-muted-foreground mt-1">{subValue}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EngineStatusBadge({ status, isLoading }: { status: string; isLoading: boolean }) {
  if (isLoading) {
    return <Skeleton className="h-6 w-24" />;
  }

  const config = {
    operational: {
      variant: "default" as const,
      icon: CheckCircle,
      label: "Operational",
      className: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    idle: {
      variant: "secondary" as const,
      icon: Clock,
      label: "Idle",
      className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
    error: {
      variant: "destructive" as const,
      icon: AlertCircle,
      label: "Error",
      className: "bg-red-500/10 text-red-500 border-red-500/20",
    },
  };

  const statusConfig = config[status as keyof typeof config] || config.idle;
  const StatusIcon = statusConfig.icon;

  return (
    <Badge variant="outline" className={`${statusConfig.className} gap-1`}>
      <StatusIcon className="h-3 w-3" />
      {statusConfig.label}
    </Badge>
  );
}

export default function AdminRevenueLoop() {
  const { data: stats, isLoading } = useQuery<RevenueLoopStatsResponse>({
    queryKey: ["/api/admin/revenue-loop-stats"],
    refetchInterval: 30000,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const executionRate = stats?.opportunities?.total 
    ? Math.round((stats.opportunities.executed / stats.opportunities.total) * 100) 
    : 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold" data-testid="heading-revenue-loop">
                Revenue Loop Engine
              </h1>
              <EngineStatusBadge status={stats?.engineStatus || 'idle'} isLoading={isLoading} />
            </div>
            <p className="text-muted-foreground">
              Autonomous revenue optimization across all connected stores
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            <span>Auto-refreshes every 30s</span>
          </div>
        </div>

        <Card data-testid="section-loop-overview">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              DETECT → DECIDE → EXECUTE → PROVE → LEARN
            </CardTitle>
            <CardDescription>
              The autonomous revenue optimization cycle running across all stores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <PhaseCard
                phase={1}
                title="DETECT"
                description="Revenue signals identified"
                icon={CircleDot}
                value={stats?.signals?.total || 0}
                subValue={`+${stats?.signals?.today || 0} today`}
                color="bg-blue-500"
                isLoading={isLoading}
                testId="phase-detect"
              />
              <PhaseCard
                phase={2}
                title="DECIDE"
                description="Opportunities created"
                icon={Target}
                value={stats?.opportunities?.total || 0}
                subValue={`${stats?.opportunities?.pendingApproval || 0} pending`}
                color="bg-purple-500"
                isLoading={isLoading}
                testId="phase-decide"
              />
              <PhaseCard
                phase={3}
                title="EXECUTE"
                description="Actions completed"
                icon={Zap}
                value={stats?.opportunities?.executed || 0}
                subValue={`${executionRate}% execution rate`}
                color="bg-amber-500"
                isLoading={isLoading}
                testId="phase-execute"
              />
              <PhaseCard
                phase={4}
                title="PROVE"
                description="Revenue attributed"
                icon={BadgeCheck}
                value={formatCurrency(stats?.proofs?.totalRevenue || 0)}
                subValue={`${stats?.proofs?.total || 0} proofs generated`}
                color="bg-green-500"
                isLoading={isLoading}
                testId="phase-prove"
              />
              <PhaseCard
                phase={5}
                title="LEARN"
                description="Store insights captured"
                icon={Lightbulb}
                value={stats?.insights?.total || 0}
                subValue="Patterns learned"
                color="bg-cyan-500"
                isLoading={isLoading}
                testId="phase-learn"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="section-performance">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>Key performance indicators for the revenue loop</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Execution Rate</span>
                  <span className="font-medium">{executionRate}%</span>
                </div>
                <Progress value={executionRate} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <DollarSign className="h-4 w-4" />
                    <span>Total Proven Revenue</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold mt-2">
                      {formatCurrency(stats?.proofs?.totalRevenue || 0)}
                    </p>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <TrendingUp className="h-4 w-4" />
                    <span>This Week</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold mt-2">
                      {formatCurrency(stats?.proofs?.weekRevenue || 0)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-stores">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Active Stores
              </CardTitle>
              <CardDescription>Stores with revenue loop activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                {isLoading ? (
                  <Skeleton className="h-24 w-24 rounded-full" />
                ) : (
                  <div className="text-center">
                    <div className="text-6xl font-bold text-primary">
                      {stats?.stores?.active || 0}
                    </div>
                    <p className="text-muted-foreground mt-2">
                      Stores actively generating revenue signals
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pending Approvals</p>
                    <p className="text-sm text-muted-foreground">
                      Opportunities awaiting store owner approval
                    </p>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {stats?.opportunities?.pendingApproval || 0}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="section-loop-cycle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Continuous Improvement Cycle
            </CardTitle>
            <CardDescription>
              How ZYRA autonomously optimizes store revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-2 py-4">
              {[
                { icon: CircleDot, label: "Detect Signals", color: "text-blue-500" },
                { icon: Target, label: "Create Opportunities", color: "text-purple-500" },
                { icon: Zap, label: "Execute Actions", color: "text-amber-500" },
                { icon: BadgeCheck, label: "Prove Revenue", color: "text-green-500" },
                { icon: Lightbulb, label: "Learn & Improve", color: "text-cyan-500" },
              ].map((step, index, arr) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30">
                    <step.icon className={`h-6 w-6 ${step.color}`} />
                    <span className="text-xs font-medium">{step.label}</span>
                  </div>
                  {index < arr.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              This cycle runs continuously, learning from each action to improve future optimizations
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
