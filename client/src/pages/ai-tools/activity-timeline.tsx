import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Undo2,
  Sparkles,
  AlertCircle,
  ShoppingCart,
  Mail,
  MessageSquare,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Zap
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AutonomousAction {
  id: string;
  actionType: string;
  status: string;
  entityId: string;
  entityType: string;
  decisionReason?: string;
  payload?: any;
  result: any;
  createdAt: string;
  completedAt: string | null;
}

interface AutopilotStats {
  totalActions: number;
  completedActions: number;
  failedActions: number;
  successRate: number;
  seoOptimizations: number;
  cartRecoveries: number;
  dailyBreakdown: {
    date: string;
    actions: number;
    completed: number;
    failed: number;
  }[];
}

export default function ActivityTimeline() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [actionFilter, setActionFilter] = useState<string>("all");

  // Fetch autopilot statistics
  const { data: stats, isLoading: statsLoading } = useQuery<AutopilotStats>({
    queryKey: ['/api/autopilot/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch autonomous actions
  const { data: actions, isLoading } = useQuery<AutonomousAction[]>({
    queryKey: ['/api/autonomous-actions'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Rollback mutation
  const rollback = useMutation({
    mutationFn: async (actionId: string) => {
      return await apiRequest('POST', `/api/autonomous-actions/${actionId}/rollback`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/autonomous-actions'] });
      toast({
        title: "Action rolled back",
        description: "The change has been reverted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rollback failed",
        description: error.message || "Failed to rollback action",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'rolled_back':
        return <Undo2 className="w-4 h-4 text-orange-500" />;
      case 'dry_run':
        return <Activity className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'rolled_back':
        return <Badge variant="secondary" className="bg-orange-500">Rolled Back</Badge>;
      case 'dry_run':
        return <Badge variant="secondary" className="bg-blue-500">Preview (Dry Run)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionTitle = (action: AutonomousAction) => {
    switch (action.actionType) {
      case 'optimize_seo':
        return 'SEO Optimization';
      case 'fix_product':
        return 'Product Fix';
      case 'send_cart_recovery':
        const channel = action.payload?.channel || 'email';
        if (channel === 'both') return 'Cart Recovery (Email + SMS)';
        if (channel === 'sms') return 'Cart Recovery (SMS)';
        return 'Cart Recovery (Email)';
      case 'price_change':
        return 'Dynamic Pricing Adjustment';
      default:
        return action.actionType;
    }
  };

  const getActionIcon = (action: AutonomousAction) => {
    if (action.actionType === 'send_cart_recovery') {
      return <ShoppingCart className="w-4 h-4 text-primary" />;
    }
    if (action.actionType === 'price_change') {
      return <DollarSign className="w-4 h-4 text-primary" />;
    }
    return <Sparkles className="w-4 h-4 text-primary" />;
  };

  // Filter actions based on selected filter
  const filteredActions = actions?.filter(action => {
    if (actionFilter === "all") return true;
    return action.actionType === actionFilter;
  }) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading activity...</div>
        </div>
      </div>
    );
  }

  return (
    <PageShell
      title="ZYRA Activity Timeline"
      subtitle="View all autonomous actions performed by ZYRA"
      backTo="/dashboard"
    >

      {/* Stats Overview */}
      {stats && !statsLoading && stats.totalActions > 0 && (
        <div className="mb-6 space-y-4">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
                <Zap className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-actions">{stats.totalActions}</div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Target className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500" data-testid="stat-success-rate">{stats.successRate}%</div>
                <p className="text-xs text-muted-foreground">{stats.completedActions} completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SEO Optimizations</CardTitle>
                <Sparkles className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-seo-optimizations">{stats.seoOptimizations}</div>
                <p className="text-xs text-muted-foreground">Products improved</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cart Recoveries</CardTitle>
                <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-cart-recoveries">{stats.cartRecoveries}</div>
                <p className="text-xs text-muted-foreground">Recovery attempts</p>
              </CardContent>
            </Card>
          </div>

          {/* Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Activity Over Time
              </CardTitle>
              <CardDescription>Autonomous actions in the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.dailyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actions" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Total Actions"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    name="Completed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failed" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    name="Failed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {!actions || actions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No activity yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Enable Autopilot in settings to start autonomous optimizations. Your AI will scan your store daily and make improvements automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Action Type Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filter by Action Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={actionFilter} onValueChange={setActionFilter} data-testid="tabs-action-filter">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all" data-testid="tab-all">
                    All
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {actions.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="optimize_seo" data-testid="tab-seo">
                    SEO
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {actions.filter(a => a.actionType === 'optimize_seo').length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="price_change" data-testid="tab-pricing">
                    Pricing
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {actions.filter(a => a.actionType === 'price_change').length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="send_cart_recovery" data-testid="tab-cart">
                    Cart Recovery
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {actions.filter(a => a.actionType === 'send_cart_recovery').length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="fix_product" data-testid="tab-fixes">
                    Fixes
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {actions.filter(a => a.actionType === 'fix_product').length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Filtered Actions List */}
          {filteredActions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No {actionFilter === "all" ? "" : actionFilter.replace('_', ' ')} actions yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  This type of action hasn't been performed yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {filteredActions.map((action) => (
            <Card key={action.id} data-testid={`card-action-${action.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(action.status)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getActionIcon(action)}
                        {getActionTitle(action)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {action.createdAt && formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(action.status)}
                    {action.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-rollback-${action.id}`}
                        onClick={() => rollback.mutate(action.id)}
                        disabled={rollback.isPending}
                      >
                        <Undo2 className="w-4 h-4 mr-1" />
                        Rollback
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Decision Reason */}
                  {action.decisionReason && (
                    <div>
                      <div className="text-sm font-medium mb-1">Reasoning</div>
                      <div className="text-sm text-muted-foreground">
                        {action.decisionReason}
                      </div>
                    </div>
                  )}

                  {/* Cart Recovery Details */}
                  {action.actionType === 'send_cart_recovery' && action.payload && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-md">
                      {action.payload.cartValue && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Cart Value</div>
                          <div className="text-sm font-medium flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {parseFloat(action.payload.cartValue).toFixed(2)} {action.payload.currency || 'USD'}
                          </div>
                        </div>
                      )}
                      {action.payload.attemptNumber && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Attempt</div>
                          <div className="text-sm font-medium">
                            {action.payload.attemptNumber} of {action.payload.maxAttempts || 3}
                          </div>
                        </div>
                      )}
                      {action.payload.channel && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Channel</div>
                          <div className="text-sm font-medium flex items-center gap-1">
                            {action.payload.channel === 'email' && <Mail className="w-3 h-3" />}
                            {action.payload.channel === 'sms' && <MessageSquare className="w-3 h-3" />}
                            {action.payload.channel === 'both' && (
                              <>
                                <Mail className="w-3 h-3" />
                                <MessageSquare className="w-3 h-3" />
                              </>
                            )}
                            {action.payload.channel.charAt(0).toUpperCase() + action.payload.channel.slice(1)}
                          </div>
                        </div>
                      )}
                      {action.payload.customerEmail && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Customer</div>
                          <div className="text-sm font-medium truncate">
                            {action.payload.customerName || action.payload.customerEmail.split('@')[0]}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cart Recovery Result */}
                  {action.actionType === 'send_cart_recovery' && action.result && action.status === 'completed' && (
                    <div>
                      <div className="text-sm font-medium mb-1">Delivery Status</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {action.result.emailSent !== undefined && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            Email: {action.result.emailSent ? '✓ Sent' : '✗ Failed'}
                          </div>
                        )}
                        {action.result.smsSent !== undefined && (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-3 h-3" />
                            SMS: {action.result.smsSent ? '✓ Sent' : '✗ Failed'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SEO Result */}
                  {action.actionType === 'optimize_seo' && action.result && action.status === 'completed' && (
                    <div>
                      <div className="text-sm font-medium mb-1">Changes Made</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {action.result.seoTitle && (
                          <div>
                            <span className="font-medium">SEO Title:</span> {action.result.seoTitle}
                          </div>
                        )}
                        {action.result.metaDescription && (
                          <div>
                            <span className="font-medium">Meta Description:</span> {action.result.metaDescription}
                          </div>
                        )}
                        {action.result.seoScore && (
                          <div>
                            <span className="font-medium">SEO Score:</span> {action.result.seoScore}/100
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price Change Details */}
                  {action.actionType === 'price_change' && action.payload && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-md">
                      {action.payload.productName && (
                        <div className="col-span-2">
                          <div className="text-xs text-muted-foreground mb-1">Product</div>
                          <div className="text-sm font-medium">
                            {action.payload.productName}
                          </div>
                        </div>
                      )}
                      {action.payload.oldPrice != null && !isNaN(parseFloat(action.payload.oldPrice)) && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Previous Price</div>
                          <div className="text-sm font-medium">
                            ${parseFloat(action.payload.oldPrice).toFixed(2)}
                          </div>
                        </div>
                      )}
                      {action.payload.newPrice != null && !isNaN(parseFloat(action.payload.newPrice)) && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">New Price</div>
                          <div className="text-sm font-medium flex items-center gap-1">
                            ${parseFloat(action.payload.newPrice).toFixed(2)}
                            {action.payload.oldPrice != null && 
                             action.payload.newPrice != null && 
                             !isNaN(parseFloat(action.payload.oldPrice)) && 
                             !isNaN(parseFloat(action.payload.newPrice)) && (() => {
                              const oldPrice = parseFloat(action.payload.oldPrice);
                              const newPrice = parseFloat(action.payload.newPrice);
                              if (oldPrice === 0) return null; // Prevent division by zero
                              const change = ((newPrice - oldPrice) / oldPrice * 100).toFixed(1);
                              const isIncrease = newPrice > oldPrice;
                              return (
                                <span className={`text-xs flex items-center gap-0.5 ${isIncrease ? 'text-red-500' : 'text-green-500'}`}>
                                  {isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {isIncrease ? '+' : ''}{change}%
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                      {action.payload.competitorPrice != null && !isNaN(parseFloat(action.payload.competitorPrice)) && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Competitor Price</div>
                          <div className="text-sm font-medium">
                            ${parseFloat(action.payload.competitorPrice).toFixed(2)}
                          </div>
                        </div>
                      )}
                      {action.payload.strategy && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Strategy</div>
                          <div className="text-sm font-medium capitalize">
                            {action.payload.strategy.replace(/_/g, ' ')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Price Change Revenue Impact */}
                  {action.actionType === 'price_change' && 
                   action.result?.revenueImpact && 
                   action.status === 'completed' &&
                   (action.result.revenueImpact.estimatedMonthlyImpact != null || 
                    action.result.revenueImpact.marginChange != null) && (
                    <div>
                      <div className="text-sm font-medium mb-1">Revenue Impact Estimate</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {action.result.revenueImpact.estimatedMonthlyImpact != null && 
                         !isNaN(parseFloat(action.result.revenueImpact.estimatedMonthlyImpact)) && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3" />
                            Estimated Monthly Impact: ${parseFloat(action.result.revenueImpact.estimatedMonthlyImpact).toFixed(2)}
                          </div>
                        )}
                        {action.result.revenueImpact.marginChange != null && 
                         !isNaN(parseFloat(action.result.revenueImpact.marginChange)) && (
                          <div className="flex items-center gap-2">
                            <Target className="w-3 h-3" />
                            Margin Change: {parseFloat(action.result.revenueImpact.marginChange).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {action.result?.error && action.status === 'failed' && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-sm">
                        {action.result.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
            </>
          )}
        </div>
      )}
    </PageShell>
  );
}
