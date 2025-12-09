import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import {
  Users,
  TrendingUp,
  Zap,
  AlertTriangle,
  DollarSign,
  Activity,
  Brain,
  RefreshCw,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChartIcon,
  Target,
  UserPlus,
  CreditCard,
  Inbox,
} from "lucide-react";

interface ErrorLog {
  id: string;
  errorType: string;
  message: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  resolved: boolean;
  createdAt: string;
  userId?: string;
}

interface ErrorLogsResponse {
  errors: ErrorLog[];
  total: number;
  limit: number;
  offset: number;
}

interface AnalyticsSummaryResponse {
  users: {
    total: number;
    newThisWeek: number;
  };
  subscriptions: {
    active: number;
    byType: Array<{ type: string; count: number }>;
  };
  aiUsage: {
    totalTokens: number;
    totalCost: number;
  };
}

interface UserGrowthDataPoint {
  date: string;
  users: number;
  newSignups: number;
}

interface DailyActiveUsersDataPoint {
  day: string;
  dau: number;
  returning: number;
  new: number;
}

interface UserGrowthResponse {
  userGrowth: UserGrowthDataPoint[];
  dailyActiveUsers: DailyActiveUsersDataPoint[];
  retentionRate: number;
  retentionTrend: string;
}

interface FeatureUsageDataPoint {
  feature: string;
  usage: number;
  adoption: number;
}

interface UsageByPlanDataPoint {
  name: string;
  value: number;
  color: string;
}

interface FeatureUsageResponse {
  featureUsage: FeatureUsageDataPoint[];
  usageByPlan: UsageByPlanDataPoint[];
}

interface AITokenUsageDataPoint {
  date: string;
  tokens: number;
  cost: number;
}

interface TokensByFeatureDataPoint {
  name: string;
  value: number;
  color: string;
}

interface AITokenUsageResponse {
  tokenUsage: AITokenUsageDataPoint[];
  tokensByFeature: TokensByFeatureDataPoint[];
  todayTokens: number;
  weekTokens: number;
  monthTokens: number;
  weekTrend: string;
}

interface RevenueDataPoint {
  month: string;
  mrr: number;
  arpu: number;
}

interface RevenueByPlanDataPoint {
  name: string;
  value: number;
  color: string;
  revenue: number;
}

interface RevenueAnalyticsResponse {
  revenueData: RevenueDataPoint[];
  revenueByPlan: RevenueByPlanDataPoint[];
  trialConversion: number;
  trialConversionTrend: string;
  churnRate: number;
  churnRateTrend: string;
  ltv: number;
}

const CHART_COLORS = ["#A78BFA", "#00F0FF", "#34D399", "#F59E0B", "#94A3B8"];

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendDirection,
  isLoading = false,
  testId,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  isLoading?: boolean;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold" data-testid={`${testId}-value`}>
              {value}
            </span>
            {trend && (
              <span
                className={`flex items-center text-xs ${
                  trendDirection === "up"
                    ? "text-green-500"
                    : trendDirection === "down"
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              >
                {trendDirection === "up" && <ArrowUpRight className="mr-0.5 h-3 w-3" />}
                {trendDirection === "down" && <ArrowDownRight className="mr-0.5 h-3 w-3" />}
                {trend}
              </span>
            )}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ChartLoadingSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className={`h-[${height}px] flex flex-col items-center justify-center space-y-4`}>
      <Skeleton className="h-40 w-40 rounded-lg" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

function EmptyState({ message, icon: Icon = Inbox }: { message: string; icon?: React.ElementType }) {
  return (
    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <Icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>{message}</p>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function AdminAnalytics() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");

  const { data: errorLogsData, isLoading: errorsLoading, refetch: refetchErrors } = useQuery<ErrorLogsResponse>({
    queryKey: ["/api/admin/error-logs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/error-logs?limit=50&resolved=false");
      return res.json();
    },
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<AnalyticsSummaryResponse>({
    queryKey: ["/api/admin/analytics-summary"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/analytics-summary");
      return res.json();
    },
  });

  const { data: userGrowthData, isLoading: userGrowthLoading } = useQuery<UserGrowthResponse>({
    queryKey: ["/api/admin/user-growth-data"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/user-growth-data");
      return res.json();
    },
  });

  const { data: featureUsageData, isLoading: featureUsageLoading } = useQuery<FeatureUsageResponse>({
    queryKey: ["/api/admin/feature-usage"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/feature-usage");
      return res.json();
    },
  });

  const { data: aiTokenData, isLoading: aiTokenLoading } = useQuery<AITokenUsageResponse>({
    queryKey: ["/api/admin/ai-token-usage"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/ai-token-usage");
      return res.json();
    },
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery<RevenueAnalyticsResponse>({
    queryKey: ["/api/admin/revenue-analytics"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/revenue-analytics");
      return res.json();
    },
  });

  const resolveErrorMutation = useMutation({
    mutationFn: async (errorId: string) => {
      const res = await apiRequest("PATCH", `/api/admin/error-logs/${errorId}/resolve`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Error Resolved",
        description: "The error has been marked as resolved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/error-logs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve error",
        variant: "destructive",
      });
    },
  });

  const errors = errorLogsData?.errors || [];
  const totalErrors = errorLogsData?.total || 0;

  const errorsByType = errors.reduce((acc: Record<string, number>, err) => {
    acc[err.errorType] = (acc[err.errorType] || 0) + 1;
    return acc;
  }, {});

  const errorTypeChartData = Object.entries(errorsByType).map(([name, value], index) => ({
    name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    value,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const userGrowthChartData = userGrowthData?.userGrowth || [];
  const dailyActiveUsersChartData = userGrowthData?.dailyActiveUsers || [];
  const featureUsageChartData = featureUsageData?.featureUsage || [];
  const usageByPlanChartData = featureUsageData?.usageByPlan || [];
  const aiTokenUsageChartData = aiTokenData?.tokenUsage || [];
  const tokensByFeatureChartData = aiTokenData?.tokensByFeature || [];
  const revenueChartData = revenueData?.revenueData || [];
  const revenueByPlanChartData = revenueData?.revenueByPlan || [];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold" data-testid="heading-admin-analytics">
            System Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and metrics for the platform
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-features">
              <BarChart3 className="w-4 h-4 mr-2" />
              Features
            </TabsTrigger>
            <TabsTrigger value="ai-usage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-ai-usage">
              <Brain className="w-4 h-4 mr-2" />
              AI Usage
            </TabsTrigger>
            <TabsTrigger value="errors" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-errors">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Errors
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-revenue">
              <DollarSign className="w-4 h-4 mr-2" />
              Revenue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6" data-testid="content-users">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Users"
                value={analyticsData?.users?.total?.toLocaleString() || "0"}
                icon={Users}
                trend="+12.5% this month"
                trendDirection="up"
                isLoading={analyticsLoading}
                testId="stat-total-users"
              />
              <StatCard
                title="Daily Active Users"
                value={dailyActiveUsersChartData.length > 0 
                  ? dailyActiveUsersChartData[dailyActiveUsersChartData.length - 1]?.dau?.toLocaleString() || "0"
                  : "0"}
                icon={Activity}
                trend="+8.3% vs last week"
                trendDirection="up"
                isLoading={userGrowthLoading}
                testId="stat-dau"
              />
              <StatCard
                title="New This Week"
                value={analyticsData?.users?.newThisWeek?.toLocaleString() || "0"}
                icon={UserPlus}
                trend="Last 7 days"
                trendDirection="neutral"
                isLoading={analyticsLoading}
                testId="stat-new-signups"
              />
              <StatCard
                title="Retention Rate"
                value={userGrowthData?.retentionRate ? `${userGrowthData.retentionRate}%` : "0%"}
                icon={Target}
                trend={userGrowthData?.retentionTrend || ""}
                trendDirection="up"
                isLoading={userGrowthLoading}
                testId="stat-retention"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="chart-user-growth">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    User Growth
                  </CardTitle>
                  <CardDescription>Total users and new signups over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {userGrowthLoading ? (
                    <ChartLoadingSkeleton />
                  ) : userGrowthChartData.length === 0 ? (
                    <EmptyState message="No user growth data available" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={userGrowthChartData}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="users"
                          stroke="#A78BFA"
                          fillOpacity={1}
                          fill="url(#colorUsers)"
                          name="Total Users"
                        />
                        <Line type="monotone" dataKey="newSignups" stroke="#00F0FF" strokeWidth={2} name="New Signups" dot={{ fill: "#00F0FF" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="chart-dau">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Daily Active Users
                  </CardTitle>
                  <CardDescription>Returning vs new users by day of week</CardDescription>
                </CardHeader>
                <CardContent>
                  {userGrowthLoading ? (
                    <ChartLoadingSkeleton />
                  ) : dailyActiveUsersChartData.length === 0 ? (
                    <EmptyState message="No daily active users data available" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dailyActiveUsersChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="returning" stackId="a" fill="#A78BFA" name="Returning Users" />
                        <Bar dataKey="new" stackId="a" fill="#00F0FF" name="New Users" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-6" data-testid="content-features">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="chart-feature-usage">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Feature Usage
                  </CardTitle>
                  <CardDescription>Most used features by total usage count</CardDescription>
                </CardHeader>
                <CardContent>
                  {featureUsageLoading ? (
                    <ChartLoadingSkeleton height={350} />
                  ) : featureUsageChartData.length === 0 ? (
                    <EmptyState message="No feature usage data available" />
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={featureUsageChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis type="category" dataKey="feature" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} width={120} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                        <Bar dataKey="usage" fill="#A78BFA" name="Usage Count" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="chart-usage-by-plan">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Usage by Plan Type
                  </CardTitle>
                  <CardDescription>Feature usage distribution by subscription plan</CardDescription>
                </CardHeader>
                <CardContent>
                  {featureUsageLoading ? (
                    <ChartLoadingSkeleton />
                  ) : usageByPlanChartData.length === 0 ? (
                    <EmptyState message="No usage by plan data available" />
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={usageByPlanChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {usageByPlanChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              color: "hsl(var(--foreground))",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {usageByPlanChartData.map((item, index) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || CHART_COLORS[index % CHART_COLORS.length] }} />
                            <span className="text-sm text-muted-foreground">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card data-testid="table-feature-adoption">
              <CardHeader>
                <CardTitle>Feature Adoption Rates</CardTitle>
                <CardDescription>Percentage of users who have used each feature</CardDescription>
              </CardHeader>
              <CardContent>
                {featureUsageLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : featureUsageChartData.length === 0 ? (
                  <EmptyState message="No feature adoption data available" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead>Total Usage</TableHead>
                        <TableHead>Adoption Rate</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {featureUsageChartData.map((feature) => (
                        <TableRow key={feature.feature} data-testid={`row-feature-${feature.feature.toLowerCase().replace(/\s+/g, "-")}`}>
                          <TableCell className="font-medium">{feature.feature}</TableCell>
                          <TableCell>{feature.usage.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${feature.adoption}%` }}
                                />
                              </div>
                              <span className="text-sm">{feature.adoption}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={feature.adoption >= 50 ? "default" : feature.adoption >= 25 ? "secondary" : "outline"}>
                              {feature.adoption >= 50 ? "High" : feature.adoption >= 25 ? "Medium" : "Low"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-usage" className="space-y-6" data-testid="content-ai-usage">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Tokens Used"
                value={analyticsData?.aiUsage?.totalTokens?.toLocaleString() || "0"}
                icon={Zap}
                description="All-time token usage"
                isLoading={analyticsLoading}
                testId="stat-tokens-today"
              />
              <StatCard
                title="Tokens This Week"
                value={(aiTokenData?.weekTokens || 0).toLocaleString()}
                icon={Zap}
                trend={aiTokenData?.weekTrend || ""}
                trendDirection="up"
                isLoading={aiTokenLoading}
                testId="stat-tokens-week"
              />
              <StatCard
                title="Tokens This Month"
                value={aiTokenData?.monthTokens 
                  ? (aiTokenData.monthTokens / 1000000).toFixed(2) + "M"
                  : "0"}
                icon={Zap}
                description={`${((aiTokenData?.monthTokens || 0) / 1000000).toFixed(2)}M tokens consumed`}
                isLoading={aiTokenLoading}
                testId="stat-tokens-month"
              />
              <StatCard
                title="Total AI Cost"
                value={`$${(analyticsData?.aiUsage?.totalCost || 0).toFixed(2)}`}
                icon={DollarSign}
                description="All-time AI costs"
                isLoading={analyticsLoading}
                testId="stat-ai-cost"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="chart-token-usage-trend">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Token Usage Trend
                  </CardTitle>
                  <CardDescription>Daily AI token consumption over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {aiTokenLoading ? (
                    <ChartLoadingSkeleton />
                  ) : aiTokenUsageChartData.length === 0 ? (
                    <EmptyState message="No token usage data available" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={aiTokenUsageChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                          formatter={(value: number) => [value.toLocaleString(), "Tokens"]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="tokens"
                          stroke="#00F0FF"
                          strokeWidth={2}
                          dot={{ fill: "#00F0FF" }}
                          name="Tokens"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="chart-tokens-by-feature">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Usage by Feature
                  </CardTitle>
                  <CardDescription>Token distribution across AI features</CardDescription>
                </CardHeader>
                <CardContent>
                  {aiTokenLoading ? (
                    <ChartLoadingSkeleton />
                  ) : tokensByFeatureChartData.length === 0 ? (
                    <EmptyState message="No token distribution data available" />
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={tokensByFeatureChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {tokensByFeatureChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              color: "hsl(var(--foreground))",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {tokensByFeatureChartData.map((item, index) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || CHART_COLORS[index % CHART_COLORS.length] }} />
                            <span className="text-sm text-muted-foreground">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="errors" className="space-y-6" data-testid="content-errors">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Errors"
                value={totalErrors}
                icon={AlertTriangle}
                description="Unresolved errors"
                isLoading={errorsLoading}
                testId="stat-total-errors"
              />
              <StatCard
                title="Critical Errors"
                value={errors.filter((e) => e.errorType === "api_error" || e.errorType === "database_error").length}
                icon={AlertTriangle}
                description="Requires immediate attention"
                isLoading={errorsLoading}
                testId="stat-critical-errors"
              />
              <StatCard
                title="Errors Today"
                value={errors.filter((e) => new Date(e.createdAt).toDateString() === new Date().toDateString()).length}
                icon={Clock}
                description="In the last 24 hours"
                isLoading={errorsLoading}
                testId="stat-errors-today"
              />
              <StatCard
                title="Resolution Rate"
                value="N/A"
                icon={CheckCircle}
                description="Coming soon"
                isLoading={errorsLoading}
                testId="stat-resolution-rate"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="chart-errors-by-type">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Errors by Type
                  </CardTitle>
                  <CardDescription>Distribution of error types</CardDescription>
                </CardHeader>
                <CardContent>
                  {errorsLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <Skeleton className="h-40 w-40 rounded-full" />
                    </div>
                  ) : errorTypeChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={errorTypeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {errorTypeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        <p>No unresolved errors</p>
                      </div>
                    </div>
                  )}
                  {errorTypeChartData.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                      {errorTypeChartData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="section-recent-errors">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Recent Errors
                    </CardTitle>
                    <CardDescription>Latest unresolved errors</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchErrors()} data-testid="button-refresh-errors">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {errorsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : errors.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {errors.slice(0, 10).map((error) => (
                        <div
                          key={error.id}
                          className="p-3 rounded-lg bg-muted/30 space-y-2"
                          data-testid={`error-item-${error.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="destructive" className="text-xs">
                                  {error.errorType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                </Badge>
                                {error.endpoint && (
                                  <Badge variant="outline" className="text-xs">
                                    {error.method} {error.endpoint}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm mt-1 text-muted-foreground truncate">{error.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {formatTimeAgo(error.createdAt)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resolveErrorMutation.mutate(error.id)}
                              disabled={resolveErrorMutation.isPending}
                              data-testid={`button-resolve-${error.id}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        <p>No unresolved errors</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6" data-testid="content-revenue">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Active Subscriptions"
                value={analyticsData?.subscriptions?.active?.toLocaleString() || "0"}
                icon={CreditCard}
                description="Currently active subscribers"
                isLoading={analyticsLoading}
                testId="stat-mrr"
              />
              <StatCard
                title="Subscription Breakdown"
                value={analyticsData?.subscriptions?.byType?.map(s => `${s.type}: ${s.count}`).join(", ") || "No data"}
                icon={Users}
                description="By plan type"
                isLoading={analyticsLoading}
                testId="stat-arpu"
              />
              <StatCard
                title="Trial Conversion"
                value={revenueData?.trialConversion ? `${revenueData.trialConversion}%` : "0%"}
                icon={Target}
                trend={revenueData?.trialConversionTrend || ""}
                trendDirection="up"
                isLoading={revenueLoading}
                testId="stat-conversion"
              />
              <StatCard
                title="Churn Rate"
                value={revenueData?.churnRate ? `${revenueData.churnRate}%` : "0%"}
                icon={ArrowDownRight}
                trend={revenueData?.churnRateTrend || ""}
                trendDirection="up"
                isLoading={revenueLoading}
                testId="stat-churn"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="chart-mrr-trend">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    MRR Trend
                  </CardTitle>
                  <CardDescription>Monthly recurring revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {revenueLoading ? (
                    <ChartLoadingSkeleton />
                  ) : revenueChartData.length === 0 ? (
                    <EmptyState message="No MRR data available" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={revenueChartData}>
                        <defs>
                          <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(value) => `$${value / 1000}k`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, "MRR"]}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="mrr"
                          stroke="#34D399"
                          fillOpacity={1}
                          fill="url(#colorMRR)"
                          name="MRR"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="chart-revenue-by-plan">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Revenue by Plan
                  </CardTitle>
                  <CardDescription>Revenue distribution across subscription plans</CardDescription>
                </CardHeader>
                <CardContent>
                  {revenueLoading ? (
                    <ChartLoadingSkeleton />
                  ) : revenueByPlanChartData.length === 0 ? (
                    <EmptyState message="No revenue by plan data available" />
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={revenueByPlanChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          >
                            {revenueByPlanChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              color: "hsl(var(--foreground))",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {revenueByPlanChartData.map((item, index) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || CHART_COLORS[index % CHART_COLORS.length] }} />
                            <span className="text-sm text-muted-foreground">{item.name}: {item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card data-testid="section-revenue-summary">
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
                <CardDescription>Key revenue metrics breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : revenueByPlanChartData.length === 0 ? (
                  <EmptyState message="No revenue summary data available" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {revenueByPlanChartData.slice(0, 3).map((plan) => (
                      <div key={plan.name} className="p-4 rounded-lg bg-muted/30 text-center">
                        <p className="text-sm text-muted-foreground">{plan.name} Revenue</p>
                        <p className="text-2xl font-bold mt-1">${(plan.revenue || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{plan.value}% of total</p>
                      </div>
                    ))}
                    <div className="p-4 rounded-lg bg-muted/30 text-center">
                      <p className="text-sm text-muted-foreground">LTV (Lifetime Value)</p>
                      <p className="text-2xl font-bold mt-1">${revenueData?.ltv?.toLocaleString() || "0"}</p>
                      <p className="text-xs text-muted-foreground">Average customer value</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
