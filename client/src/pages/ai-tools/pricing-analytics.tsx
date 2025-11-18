import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from "recharts";

interface AnalyticsData {
  summary: {
    totalChanges: number;
    appliedChanges: number;
    pendingChanges: number;
    rolledBackChanges: number;
  };
  revenue: {
    before: number;
    after: number;
    increase: number;
    increasePercent: number;
  };
  performance: {
    winRate: number;
    profitableChanges: number;
    totalApplied: number;
    averageMarginImprovement: number;
  };
  competitors: {
    total: number;
    active: number;
    avgPriceDifference: number;
  };
  trends: Array<{
    date: string;
    priceChanges: number;
    applied: number;
    revenueImpact: number;
    winRate: number;
  }>;
}

export default function PricingAnalytics() {
  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/pricing/analytics'],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <PageShell 
        title="Pricing Analytics" 
        description="Track your pricing automation performance and revenue impact"
      >
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </PageShell>
    );
  }

  if (!analytics) {
    return (
      <PageShell 
        title="Pricing Analytics" 
        description="Track your pricing automation performance and revenue impact"
      >
        <DashboardCard
          title="No Data Available"
          description="Start using pricing automation to see analytics data."
          icon={Activity}
        />
      </PageShell>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <PageShell 
      title="Pricing Analytics" 
      description="Track your pricing automation performance and revenue impact over the last 30 days"
    >
      <div className="space-y-6">
        {/* Summary Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-total-changes">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Changes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-changes">
                {analytics.summary.totalChanges}
              </div>
              <p className="text-xs text-muted-foreground">
                Price changes in last 30 days
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-applied-changes">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applied</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-applied-changes">
                {analytics.summary.appliedChanges}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully applied to products
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-changes">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-changes">
                {analytics.summary.pendingChanges}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval or execution
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-rolled-back-changes">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rolled Back</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="text-rolled-back-changes">
                {analytics.summary.rolledBackChanges}
              </div>
              <p className="text-xs text-muted-foreground">
                Reverted price changes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-revenue-before">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Before</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-revenue-before">
                {formatCurrency(analytics.revenue.before)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total revenue before pricing changes
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-revenue-after">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue After</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-revenue-after">
                {formatCurrency(analytics.revenue.after)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total revenue after pricing changes
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-revenue-increase">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Increase</CardTitle>
              <TrendingUp className={`h-4 w-4 ${analytics.revenue.increase >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${analytics.revenue.increase >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-revenue-increase">
                {formatCurrency(analytics.revenue.increase)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatPercent(analytics.revenue.increasePercent)} change
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-win-rate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-win-rate">
                {analytics.performance.winRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.performance.profitableChanges} of {analytics.performance.totalApplied} changes profitable
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance & Competitor Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card data-testid="card-margin-improvement">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Margin Improvement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-bold" data-testid="text-margin-improvement">
                  {formatPercent(analytics.performance.averageMarginImprovement)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Average margin improvement per price change
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profitable Changes</span>
                  <span className="font-medium" data-testid="text-profitable-count">
                    {analytics.performance.profitableChanges}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Applied</span>
                  <span className="font-medium" data-testid="text-total-applied">
                    {analytics.performance.totalApplied}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-competitor-stats">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Competitor Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Competitors Tracked</span>
                  <span className="font-medium" data-testid="text-competitors-total">
                    {analytics.competitors.total}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Monitoring</span>
                  <span className="font-medium" data-testid="text-competitors-active">
                    {analytics.competitors.active}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Price Difference</span>
                  <span className={`font-medium ${analytics.competitors.avgPriceDifference >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-price-difference">
                    {formatCurrency(analytics.competitors.avgPriceDifference)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.competitors.avgPriceDifference >= 0 
                  ? 'Your prices are higher on average - maintaining premium positioning'
                  : 'Your prices are lower on average - competitive positioning'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 30-Day Trends Chart */}
        <Card data-testid="card-trends-chart">
          <CardHeader>
            <CardTitle>30-Day Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.trends}>
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
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString();
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="priceChanges" 
                    stroke="hsl(var(--primary))" 
                    name="Total Changes"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="applied" 
                    stroke="hsl(var(--chart-2))" 
                    name="Applied Changes"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Impact Chart */}
        <Card data-testid="card-revenue-chart">
          <CardHeader>
            <CardTitle>Daily Revenue Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.trends}>
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
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString();
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenueImpact" 
                    fill="hsl(var(--chart-3))" 
                    name="Revenue Impact"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Win Rate Trend */}
        <Card data-testid="card-winrate-chart">
          <CardHeader>
            <CardTitle>Win Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.trends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis className="text-xs" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString();
                    }}
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="winRate" 
                    stroke="hsl(var(--chart-4))" 
                    name="Win Rate %"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
