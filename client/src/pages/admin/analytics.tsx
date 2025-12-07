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

const userGrowthData = [
  { date: "Nov 1", users: 1245, newSignups: 45 },
  { date: "Nov 5", users: 1312, newSignups: 67 },
  { date: "Nov 10", users: 1398, newSignups: 86 },
  { date: "Nov 15", users: 1524, newSignups: 126 },
  { date: "Nov 20", users: 1687, newSignups: 163 },
  { date: "Nov 25", users: 1845, newSignups: 158 },
  { date: "Nov 30", users: 2012, newSignups: 167 },
  { date: "Dec 1", users: 2089, newSignups: 77 },
  { date: "Dec 3", users: 2156, newSignups: 67 },
  { date: "Dec 5", users: 2234, newSignups: 78 },
];

const dailyActiveUsersData = [
  { day: "Mon", dau: 456, returning: 312, new: 144 },
  { day: "Tue", dau: 523, returning: 378, new: 145 },
  { day: "Wed", dau: 498, returning: 356, new: 142 },
  { day: "Thu", dau: 567, returning: 412, new: 155 },
  { day: "Fri", dau: 612, returning: 445, new: 167 },
  { day: "Sat", dau: 478, returning: 334, new: 144 },
  { day: "Sun", dau: 389, returning: 267, new: 122 },
];

const featureUsageData = [
  { feature: "Product SEO", usage: 2847, adoption: 78 },
  { feature: "AI Descriptions", usage: 2156, adoption: 65 },
  { feature: "Bulk Optimization", usage: 1834, adoption: 52 },
  { feature: "Campaign Manager", usage: 1523, adoption: 45 },
  { feature: "Cart Recovery", usage: 1245, adoption: 38 },
  { feature: "Competitor Analysis", usage: 987, adoption: 28 },
  { feature: "A/B Testing", usage: 756, adoption: 22 },
  { feature: "Brand Voice", usage: 534, adoption: 16 },
];

const usageByPlanData = [
  { name: "Pro", value: 45, color: "#A78BFA" },
  { name: "Growth", value: 32, color: "#00F0FF" },
  { name: "Starter", value: 18, color: "#34D399" },
  { name: "Trial", value: 5, color: "#94A3B8" },
];

const aiTokenUsageData = [
  { date: "Nov 25", tokens: 45234, cost: 0.45 },
  { date: "Nov 26", tokens: 52187, cost: 0.52 },
  { date: "Nov 27", tokens: 48923, cost: 0.49 },
  { date: "Nov 28", tokens: 61234, cost: 0.61 },
  { date: "Nov 29", tokens: 58456, cost: 0.58 },
  { date: "Nov 30", tokens: 67890, cost: 0.68 },
  { date: "Dec 1", tokens: 72345, cost: 0.72 },
  { date: "Dec 2", tokens: 68234, cost: 0.68 },
  { date: "Dec 3", tokens: 75678, cost: 0.76 },
  { date: "Dec 4", tokens: 81234, cost: 0.81 },
  { date: "Dec 5", tokens: 78456, cost: 0.78 },
];

const tokensByFeatureData = [
  { name: "SEO Engine", value: 35, color: "#A78BFA" },
  { name: "AI Descriptions", value: 28, color: "#00F0FF" },
  { name: "Competitor Analysis", value: 18, color: "#34D399" },
  { name: "A/B Testing", value: 12, color: "#F59E0B" },
  { name: "Other", value: 7, color: "#94A3B8" },
];

const revenueData = [
  { month: "Jul", mrr: 8234, arpu: 42 },
  { month: "Aug", mrr: 9456, arpu: 44 },
  { month: "Sep", mrr: 10823, arpu: 45 },
  { month: "Oct", mrr: 12145, arpu: 47 },
  { month: "Nov", mrr: 14567, arpu: 49 },
  { month: "Dec", mrr: 16234, arpu: 51 },
];

const revenueByPlanData = [
  { name: "Pro ($199)", value: 58, color: "#A78BFA" },
  { name: "Growth ($99)", value: 32, color: "#00F0FF" },
  { name: "Starter ($49)", value: 10, color: "#34D399" },
];

const CHART_COLORS = ["#A78BFA", "#00F0FF", "#34D399", "#F59E0B", "#94A3B8"];

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendDirection,
  isMock = false,
  isLoading = false,
  testId,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  isMock?: boolean;
  isLoading?: boolean;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
          {isMock && (
            <Badge variant="outline" className="ml-2 text-xs">
              mock
            </Badge>
          )}
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

  const todayTokens = 78456;
  const weekTokens = 523456;
  const monthTokens = 2145678;
  const estimatedCost = (monthTokens / 1000000) * 0.01;

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
                value="567"
                icon={Activity}
                trend="+8.3% vs last week"
                trendDirection="up"
                isMock
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
                value="84.2%"
                icon={Target}
                trend="+2.1% this month"
                trendDirection="up"
                isMock
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
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={userGrowthData}>
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
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyActiveUsersData}>
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
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={featureUsageData} layout="vertical">
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
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={usageByPlanData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {usageByPlanData.map((entry, index) => (
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
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {usageByPlanData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="table-feature-adoption">
              <CardHeader>
                <CardTitle>Feature Adoption Rates</CardTitle>
                <CardDescription>Percentage of users who have used each feature</CardDescription>
              </CardHeader>
              <CardContent>
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
                    {featureUsageData.map((feature) => (
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
                value={weekTokens.toLocaleString()}
                icon={Zap}
                trend="+12.8% vs last week"
                trendDirection="up"
                isMock
                testId="stat-tokens-week"
              />
              <StatCard
                title="Tokens This Month"
                value={(monthTokens / 1000000).toFixed(2) + "M"}
                icon={Zap}
                description="2.15M tokens consumed"
                isMock
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
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={aiTokenUsageData}>
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
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={tokensByFeatureData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {tokensByFeatureData.map((entry, index) => (
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
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {tokensByFeatureData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                  </div>
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
                value="76%"
                icon={CheckCircle}
                trend="+5% this week"
                trendDirection="up"
                isMock
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
                value="24.5%"
                icon={Target}
                trend="+3.2% this month"
                trendDirection="up"
                isMock
                testId="stat-conversion"
              />
              <StatCard
                title="Churn Rate"
                value="2.8%"
                icon={ArrowDownRight}
                trend="-0.4% this month"
                trendDirection="up"
                isMock
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
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData}>
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
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={revenueByPlanData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {revenueByPlanData.map((entry, index) => (
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
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {revenueByPlanData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-muted-foreground">{item.name}: {item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="section-revenue-summary">
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
                <CardDescription>Key revenue metrics breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground">Pro Plan Revenue</p>
                    <p className="text-2xl font-bold mt-1">$9,415</p>
                    <p className="text-xs text-muted-foreground">58% of total</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground">Growth Plan Revenue</p>
                    <p className="text-2xl font-bold mt-1">$5,195</p>
                    <p className="text-xs text-muted-foreground">32% of total</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground">Starter Plan Revenue</p>
                    <p className="text-2xl font-bold mt-1">$1,623</p>
                    <p className="text-xs text-muted-foreground">10% of total</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground">LTV (Lifetime Value)</p>
                    <p className="text-2xl font-bold mt-1">$612</p>
                    <p className="text-xs text-muted-foreground">12 months avg</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
