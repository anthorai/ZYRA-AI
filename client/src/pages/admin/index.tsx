import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  CreditCard,
  Zap,
  Ticket,
  DollarSign,
  AlertTriangle,
  Database,
  Brain,
  Mail,
  ShoppingBag,
  UserPlus,
  ArrowUpRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";

interface UserWithSubscription {
  id: string;
  email: string;
  fullName: string;
  plan: string;
  createdAt: string;
  subscription?: {
    status: string;
  };
}

interface PaginatedUsersResponse {
  users: UserWithSubscription[];
  pagination: {
    total: number;
  };
}

interface ErrorLog {
  id: string;
  resolved: boolean;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  status: string;
  created_at: string;
  subject: string;
  user: {
    email: string;
  };
}

interface SystemHealthResponse {
  timestamp: string;
  overallStatus: string;
  services: {
    database: { status: string; message: string };
    aiEngine: { status: string; message: string };
    emailService: { status: string; message: string };
    shopifyIntegration: { status: string; message: string; activeConnections?: number };
  };
}

interface AnalyticsSummaryResponse {
  timestamp: string;
  users: {
    total: number;
    signupsToday: number;
    signupsThisWeek: number;
    signupsThisMonth: number;
  };
  subscriptions: {
    active: number;
  };
  featureUsage: Array<{ feature: string; totalUsage: number }>;
  aiUsage: {
    totalGenerations: number;
    totalTokensUsed: number;
  };
}

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
        <CardTitle className="text-sm font-medium text-muted-foreground xl:whitespace-nowrap">
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
                {trendDirection === "up" && <TrendingUp className="mr-0.5 h-3 w-3" />}
                {trendDirection === "down" && <TrendingDown className="mr-0.5 h-3 w-3" />}
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

function SystemHealthItem({
  name,
  status,
  icon: Icon,
  testId,
}: {
  name: string;
  status: "online" | "degraded" | "offline" | "checking";
  icon: React.ElementType;
  testId: string;
}) {
  const statusConfig = {
    online: {
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      label: "Online",
      icon: CheckCircle,
    },
    degraded: {
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      label: "Degraded",
      icon: AlertTriangle,
    },
    offline: {
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      label: "Offline",
      icon: XCircle,
    },
    checking: {
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      label: "Checking...",
      icon: RefreshCw,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
      data-testid={testId}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md ${config.bgColor}`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>
        <span className="font-medium">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusIcon
          className={`h-4 w-4 ${config.color} ${
            status === "checking" ? "animate-spin" : ""
          }`}
        />
        <span className={`text-sm ${config.color}`}>{config.label}</span>
      </div>
    </div>
  );
}

function ActivityItem({
  type,
  title,
  description,
  time,
  testId,
}: {
  type: "signup" | "subscription" | "system";
  title: string;
  description: string;
  time: string;
  testId: string;
}) {
  const typeConfig = {
    signup: {
      icon: UserPlus,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    subscription: {
      icon: CreditCard,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    system: {
      icon: Activity,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg hover-elevate"
      data-testid={testId}
    >
      <div className={`p-2 rounded-md ${config.bgColor} flex-shrink-0`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
        <Clock className="h-3 w-3" />
        <span>{time}</span>
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

function mapApiStatusToComponentStatus(apiStatus: string): "online" | "degraded" | "offline" | "checking" {
  switch (apiStatus) {
    case "operational":
      return "online";
    case "degraded":
    case "no_connections":
    case "not_configured":
      return "degraded";
    case "unavailable":
    case "error":
      return "offline";
    default:
      return "checking";
  }
}

export default function AdminDashboard() {
  const { data: usersResponse, isLoading: usersLoading } = useQuery<PaginatedUsersResponse>({
    queryKey: ["/api/admin/users-with-subscriptions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users-with-subscriptions?page=1&limit=50");
      return res.json();
    },
  });

  const { data: errorLogs, isLoading: errorsLoading } = useQuery<ErrorLog[]>({
    queryKey: ["/api/admin/error-logs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/error-logs");
      const data = await res.json();
      return data.errors || [];
    },
  });

  const { data: supportTickets, isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/admin/support-tickets"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/support-tickets");
      return res.json();
    },
  });

  const { data: systemHealth, isLoading: healthLoading } = useQuery<SystemHealthResponse>({
    queryKey: ["/api/admin/system-health"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/system-health");
      return res.json();
    },
    retry: false,
  });

  const { data: analyticsSummary, isLoading: analyticsLoading } = useQuery<AnalyticsSummaryResponse>({
    queryKey: ["/api/admin/analytics-summary"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/analytics-summary");
      return res.json();
    },
  });

  const totalUsers = usersResponse?.pagination?.total || usersResponse?.users?.length || 0;
  const users = usersResponse?.users || [];

  const activeSubscriptions = users.filter(
    (u) => u.subscription?.status === "active" && u.plan?.toLowerCase() !== "free" && !u.plan?.toLowerCase().includes("trial")
  ).length;

  const openTickets = supportTickets?.filter((t) => t.status === "open" || t.status === "in_progress").length || 0;

  const errorLogsArray = Array.isArray(errorLogs) ? errorLogs : [];
  const unresolvedErrors = errorLogsArray.filter((e) => !e.resolved).length;
  const errorRate = errorLogsArray.length
    ? ((unresolvedErrors / errorLogsArray.length) * 100).toFixed(1)
    : "0";

  const recentSignups = users
    .filter((u) => u.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentTickets = supportTickets
    ?.filter((t) => t.created_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3) || [];

  const aiCreditsToday = analyticsSummary?.aiUsage?.totalGenerations 
    ? analyticsSummary.aiUsage.totalGenerations.toLocaleString()
    : "N/A";

  const databaseStatus = healthLoading 
    ? "checking" 
    : mapApiStatusToComponentStatus(systemHealth?.services?.database?.status || "");
  
  const aiEngineStatus = healthLoading 
    ? "checking" 
    : mapApiStatusToComponentStatus(systemHealth?.services?.aiEngine?.status || "");
  
  const emailServiceStatus = healthLoading 
    ? "checking" 
    : mapApiStatusToComponentStatus(systemHealth?.services?.emailService?.status || "");
  
  const shopifyStatus = healthLoading 
    ? "checking" 
    : mapApiStatusToComponentStatus(systemHealth?.services?.shopifyIntegration?.status || "");

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold" data-testid="heading-admin-dashboard">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            System overview and key metrics at a glance
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Users"
            value={totalUsers}
            icon={Users}
            trend="+12% this month"
            trendDirection="up"
            isLoading={usersLoading}
            testId="stat-total-users"
          />
          <StatCard
            title="Active Subscriptions"
            value={activeSubscriptions}
            icon={CreditCard}
            description="Paid plans only"
            isLoading={usersLoading}
            testId="stat-active-subscriptions"
          />
          <StatCard
            title="AI Generations"
            value={aiCreditsToday}
            icon={Zap}
            description="Total AI generations"
            isLoading={analyticsLoading}
            testId="stat-ai-credits"
          />
          <StatCard
            title="Open Tickets"
            value={openTickets}
            icon={Ticket}
            description="Awaiting response"
            isLoading={ticketsLoading}
            testId="stat-open-tickets"
          />
          <StatCard
            title="Revenue This Month"
            value="Coming soon"
            icon={DollarSign}
            description="Payment analytics pending"
            testId="stat-revenue"
          />
          <StatCard
            title="Error Rate"
            value={`${errorRate}%`}
            icon={AlertTriangle}
            description={`${unresolvedErrors} unresolved`}
            isLoading={errorsLoading}
            testId="stat-error-rate"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="section-recent-activity">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest events across the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {usersLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : (
                <>
                  {recentSignups.map((user, index) => (
                    <ActivityItem
                      key={user.id}
                      type="signup"
                      title="New User Signup"
                      description={user.email}
                      time={formatTimeAgo(user.createdAt)}
                      testId={`activity-signup-${index}`}
                    />
                  ))}
                  {recentTickets.map((ticket, index) => (
                    <ActivityItem
                      key={ticket.id}
                      type="system"
                      title="Support Ticket"
                      description={ticket.subject || "New ticket received"}
                      time={formatTimeAgo(ticket.created_at)}
                      testId={`activity-ticket-${index}`}
                    />
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="section-system-health">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health
              </CardTitle>
              <CardDescription>Status of core system components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SystemHealthItem
                name="Database"
                status={databaseStatus}
                icon={Database}
                testId="health-database"
              />
              <SystemHealthItem
                name="AI Engine"
                status={aiEngineStatus}
                icon={Brain}
                testId="health-ai-engine"
              />
              <SystemHealthItem
                name="Email Service"
                status={emailServiceStatus}
                icon={Mail}
                testId="health-email"
              />
              <SystemHealthItem
                name="Shopify Integration"
                status={shopifyStatus}
                icon={ShoppingBag}
                testId="health-shopify"
              />
            </CardContent>
          </Card>
        </div>

        <Card data-testid="section-quick-actions">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <a
                href="/admin/subscriptions"
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/30 hover-elevate text-center"
                data-testid="action-manage-users"
              >
                <Users className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Manage Users</span>
              </a>
              <a
                href="/admin/support-inbox"
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/30 hover-elevate text-center"
                data-testid="action-support-inbox"
              >
                <Ticket className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Support Inbox</span>
              </a>
              <a
                href="/admin/ai-engine"
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/30 hover-elevate text-center"
                data-testid="action-ai-controls"
              >
                <Brain className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">AI Controls</span>
              </a>
              <a
                href="/admin/analytics"
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/30 hover-elevate text-center"
                data-testid="action-analytics"
              >
                <TrendingUp className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Analytics</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
