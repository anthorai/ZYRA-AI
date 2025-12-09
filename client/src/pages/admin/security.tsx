import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Users,
  AlertTriangle,
  Lock,
  Ban,
  Activity,
  Clock,
  MapPin,
  Monitor,
  LogOut,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Globe,
  UserX,
  Zap,
  Inbox,
} from "lucide-react";

interface SecurityOverview {
  activeSessions: number;
  failedLogins24h: number;
  suspiciousActivityCount: number;
  twoFactorAdoptionRate: number;
  totalUsers: number;
  usersWithTwoFactor: number;
}

interface IPBan {
  id: string;
  ipAddress: string;
  reason: string;
  bannedAt: string;
  expiresAt: string | null;
  bannedBy: string;
}

interface ActiveSession {
  id: string;
  userId: string;
  userEmail: string;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastSeenAt: string;
  createdAt: string;
}

interface LoginLog {
  id: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  location: string;
  success: boolean;
  failureReason: string | null;
  createdAt: string;
}

interface SuspiciousActivity {
  id: string;
  type: "multiple_failed_logins" | "unusual_location" | "rapid_requests";
  description: string;
  ipAddress: string;
  userId: string | null;
  userEmail: string | null;
  severity: "low" | "medium" | "high";
  createdAt: string;
  resolved: boolean;
}

interface AdminActivityLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  target: string;
  details: string;
  createdAt: string;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
  isLoading = false,
  testId,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "danger";
  isLoading?: boolean;
  testId: string;
}) {
  const variantStyles = {
    default: "text-muted-foreground",
    success: "text-green-500",
    warning: "text-yellow-500",
    danger: "text-red-500",
  };

  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${variantStyles[variant]}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <span className="text-2xl font-bold" data-testid={`${testId}-value`}>
            {value}
          </span>
        )}
        {description && !isLoading && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {isLoading && <Skeleton className="h-3 w-32 mt-1" />}
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 3, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: cols }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-4 w-20" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="p-3 rounded-full bg-muted mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

function SessionSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

export default function SecurityCenter() {
  const { toast } = useToast();
  const [sessionTimeout, setSessionTimeout] = useState("3600");
  const [loginStatusFilter, setLoginStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [isAddIPDialogOpen, setIsAddIPDialogOpen] = useState(false);
  const [newIPAddress, setNewIPAddress] = useState("");
  const [newIPReason, setNewIPReason] = useState("");
  const [newIPExpiration, setNewIPExpiration] = useState("permanent");
  const [isForceLogoutDialogOpen, setIsForceLogoutDialogOpen] = useState(false);
  const [sessionToTerminate, setSessionToTerminate] = useState<ActiveSession | null>(null);
  const [ipToUnban, setIPToUnban] = useState<IPBan | null>(null);

  const { data: securityOverview, isLoading: isLoadingOverview } = useQuery<SecurityOverview>({
    queryKey: ["/api/admin/security-overview"],
  });

  const { data: ipBans = [], isLoading: isLoadingIPBans } = useQuery<IPBan[]>({
    queryKey: ["/api/admin/ip-bans"],
  });

  const { data: activeSessions = [], isLoading: isLoadingSessions } = useQuery<ActiveSession[]>({
    queryKey: ["/api/admin/active-sessions"],
  });

  const { data: loginLogs = [], isLoading: isLoadingLoginLogs } = useQuery<LoginLog[]>({
    queryKey: ["/api/admin/login-logs"],
  });

  const { data: suspiciousActivities = [], isLoading: isLoadingSuspicious } = useQuery<SuspiciousActivity[]>({
    queryKey: ["/api/admin/suspicious-activity"],
  });

  const { data: adminActivityLogs = [], isLoading: isLoadingAdminLogs } = useQuery<AdminActivityLog[]>({
    queryKey: ["/api/admin/admin-activity-logs"],
  });

  const filteredLoginLogs = loginLogs.filter((log) => {
    if (loginStatusFilter === "all") return true;
    if (loginStatusFilter === "success") return log.success;
    return !log.success;
  });

  const addIPBanMutation = useMutation({
    mutationFn: async (data: { ipAddress: string; reason: string; expiration: string }) => {
      return apiRequest("/api/admin/ip-bans", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ip-bans"] });
      toast({
        title: "IP Banned",
        description: `Successfully banned IP ${newIPAddress}`,
      });
      setIsAddIPDialogOpen(false);
      setNewIPAddress("");
      setNewIPReason("");
      setNewIPExpiration("permanent");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to ban IP address",
        variant: "destructive",
      });
    },
  });

  const unbanIPMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/ip-bans/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ip-bans"] });
      toast({
        title: "IP Unbanned",
        description: `Successfully unbanned IP ${ipToUnban?.ipAddress}`,
      });
      setIPToUnban(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unban IP address",
        variant: "destructive",
      });
    },
  });

  const terminateSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiRequest(`/api/admin/active-sessions/${sessionId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/active-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security-overview"] });
      toast({
        title: "Session Terminated",
        description: `Successfully terminated session for ${sessionToTerminate?.userEmail}`,
      });
      setSessionToTerminate(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to terminate session",
        variant: "destructive",
      });
    },
  });

  const forceLogoutAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/admin/force-logout-all", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/active-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security-overview"] });
      toast({
        title: "Force Logout Initiated",
        description: "All users have been logged out. They will need to sign in again.",
      });
      setIsForceLogoutDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to force logout all users",
        variant: "destructive",
      });
    },
  });

  const handleAddIPBan = () => {
    if (!newIPAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter an IP address",
        variant: "destructive",
      });
      return;
    }

    addIPBanMutation.mutate({
      ipAddress: newIPAddress,
      reason: newIPReason,
      expiration: newIPExpiration,
    });
  };

  const handleUnbanIP = () => {
    if (!ipToUnban) return;
    unbanIPMutation.mutate(ipToUnban.id);
  };

  const handleTerminateSession = () => {
    if (!sessionToTerminate) return;
    terminateSessionMutation.mutate(sessionToTerminate.id);
  };

  const handleForceLogoutAll = () => {
    forceLogoutAllMutation.mutate();
  };

  const handleUpdateSessionTimeout = (value: string) => {
    setSessionTimeout(value);
    const timeoutLabels: Record<string, string> = {
      "900": "15 minutes",
      "1800": "30 minutes",
      "3600": "1 hour",
      "14400": "4 hours",
      "86400": "24 hours",
    };

    toast({
      title: "Session Timeout Updated",
      description: `Session timeout set to ${timeoutLabels[value]}`,
    });
  };

  const getSeverityBadge = (severity: "low" | "medium" | "high") => {
    const variants = {
      low: "secondary",
      medium: "outline",
      high: "destructive",
    } as const;

    return (
      <Badge variant={variants[severity]}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const getActivityIcon = (type: SuspiciousActivity["type"]) => {
    switch (type) {
      case "multiple_failed_logins":
        return <UserX className="h-4 w-4 text-red-500" />;
      case "unusual_location":
        return <MapPin className="h-4 w-4 text-yellow-500" />;
      case "rapid_requests":
        return <Zap className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold" data-testid="heading-security-center">
            Security Center
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage security settings, sessions, and activity
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Sessions"
            value={securityOverview?.activeSessions ?? 0}
            icon={Users}
            description="Currently logged in users"
            isLoading={isLoadingOverview}
            testId="stat-active-sessions"
          />
          <StatCard
            title="Failed Logins (24h)"
            value={securityOverview?.failedLogins24h ?? 0}
            icon={XCircle}
            variant="warning"
            description="In the last 24 hours"
            isLoading={isLoadingOverview}
            testId="stat-failed-logins"
          />
          <StatCard
            title="Suspicious Activity"
            value={securityOverview?.suspiciousActivityCount ?? 0}
            icon={AlertTriangle}
            variant="danger"
            description="Unresolved alerts"
            isLoading={isLoadingOverview}
            testId="stat-suspicious-activity"
          />
          <StatCard
            title="2FA Adoption"
            value={`${securityOverview?.twoFactorAdoptionRate ?? 0}%`}
            icon={ShieldCheck}
            variant="success"
            description={securityOverview ? `${securityOverview.usersWithTwoFactor} of ${securityOverview.totalUsers} users` : undefined}
            isLoading={isLoadingOverview}
            testId="stat-2fa-adoption"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="section-ip-ban-list">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5" />
                  IP Ban List
                </CardTitle>
                <CardDescription>Manage blocked IP addresses</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddIPDialogOpen(true)}
                data-testid="button-add-ip-ban"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add IP
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingIPBans ? (
                <TableSkeleton rows={3} cols={5} />
              ) : ipBans.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Banned</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ipBans.map((ban) => (
                      <TableRow key={ban.id} data-testid={`row-ip-ban-${ban.id}`}>
                        <TableCell className="font-mono text-sm">
                          {ban.ipAddress}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">
                          {ban.reason}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(ban.bannedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {ban.expiresAt ? (
                            <span className="text-sm">
                              {new Date(ban.expiresAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <Badge variant="outline">Permanent</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIPToUnban(ban)}
                            data-testid={`button-unban-${ban.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={Ban}
                  title="No banned IPs"
                  description="No IP addresses are currently banned"
                />
              )}
            </CardContent>
          </Card>

          <Card data-testid="section-session-management">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Session Management
              </CardTitle>
              <CardDescription>Configure session settings and manage active sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="session-timeout">Session Timeout</Label>
                  <p className="text-xs text-muted-foreground">
                    Auto-logout inactive users after
                  </p>
                </div>
                <Select
                  value={sessionTimeout}
                  onValueChange={handleUpdateSessionTimeout}
                >
                  <SelectTrigger className="w-[140px]" data-testid="select-session-timeout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="900">15 minutes</SelectItem>
                    <SelectItem value="1800">30 minutes</SelectItem>
                    <SelectItem value="3600">1 hour</SelectItem>
                    <SelectItem value="14400">4 hours</SelectItem>
                    <SelectItem value="86400">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Force Logout All Users</Label>
                  <p className="text-xs text-muted-foreground">
                    Terminate all active sessions immediately
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsForceLogoutDialogOpen(true)}
                  disabled={forceLogoutAllMutation.isPending}
                  data-testid="button-force-logout-all"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Force Logout
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Active Sessions ({isLoadingSessions ? "..." : activeSessions.length})</Label>
                </div>
                {isLoadingSessions ? (
                  <SessionSkeleton />
                ) : activeSessions.length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {activeSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        data-testid={`session-item-${session.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-muted">
                            {getDeviceIcon(session.deviceType)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{session.userEmail}</p>
                            <p className="text-xs text-muted-foreground">
                              {session.browser} on {session.os} - {session.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(session.lastSeenAt)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSessionToTerminate(session)}
                            data-testid={`button-terminate-${session.id}`}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No active sessions"
                    description="No users are currently logged in"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="section-login-activity">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Login Activity Log
              </CardTitle>
              <CardDescription>Recent login attempts across all users</CardDescription>
            </div>
            <Select
              value={loginStatusFilter}
              onValueChange={(v) => setLoginStatusFilter(v as typeof loginStatusFilter)}
            >
              <SelectTrigger className="w-[120px]" data-testid="select-login-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {isLoadingLoginLogs ? (
              <TableSkeleton rows={5} cols={5} />
            ) : filteredLoginLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoginLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-login-log-${log.id}`}>
                      <TableCell className="font-medium">{log.userEmail}</TableCell>
                      <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{log.location}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimeAgo(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        {log.success ? (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={Activity}
                title="No login activity"
                description="No login attempts have been recorded yet"
              />
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="section-suspicious-activity">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Suspicious Activity Alerts
              </CardTitle>
              <CardDescription>Potential security threats detected by the system</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSuspicious ? (
                <ActivitySkeleton />
              ) : suspiciousActivities.length > 0 ? (
                <div className="space-y-3">
                  {suspiciousActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        activity.resolved ? "bg-muted/20" : "bg-muted/40"
                      }`}
                      data-testid={`suspicious-activity-${activity.id}`}
                    >
                      <div className="p-2 rounded-md bg-muted">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getSeverityBadge(activity.severity)}
                          {activity.resolved && (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mt-1">{activity.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="font-mono">{activity.ipAddress}</span>
                          {activity.userEmail && <span>{activity.userEmail}</span>}
                          <span>{formatTimeAgo(activity.createdAt)}</span>
                        </div>
                      </div>
                      {!activity.resolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-resolve-${activity.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ShieldCheck}
                  title="No suspicious activity"
                  description="No security threats have been detected"
                />
              )}
            </CardContent>
          </Card>

          <Card data-testid="section-admin-activity">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Activity Log
              </CardTitle>
              <CardDescription>Recent administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAdminLogs ? (
                <ActivitySkeleton />
              ) : adminActivityLogs.length > 0 ? (
                <div className="space-y-3">
                  {adminActivityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                      data-testid={`admin-activity-${log.id}`}
                    >
                      <div className="p-2 rounded-md bg-primary/10">
                        <Lock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span className="font-medium">{log.adminEmail}</span>
                          {" → "}
                          <span className="font-mono">{log.target}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {log.details}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTimeAgo(log.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Shield}
                  title="No admin activity"
                  description="No administrative actions have been recorded yet"
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={isAddIPDialogOpen} onOpenChange={setIsAddIPDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ban IP Address</DialogTitle>
              <DialogDescription>
                Add an IP address to the ban list. This will prevent all access from this IP.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ip-address">IP Address</Label>
                <Input
                  id="ip-address"
                  placeholder="e.g., 192.168.1.100"
                  value={newIPAddress}
                  onChange={(e) => setNewIPAddress(e.target.value)}
                  data-testid="input-ip-address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ban-reason">Reason</Label>
                <Textarea
                  id="ban-reason"
                  placeholder="Why is this IP being banned?"
                  value={newIPReason}
                  onChange={(e) => setNewIPReason(e.target.value)}
                  data-testid="input-ban-reason"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration">Expiration</Label>
                <Select value={newIPExpiration} onValueChange={setNewIPExpiration}>
                  <SelectTrigger data-testid="select-ban-expiration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddIPDialogOpen(false)}
                data-testid="button-cancel-ban"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddIPBan} 
                disabled={addIPBanMutation.isPending}
                data-testid="button-confirm-ban"
              >
                <Ban className="h-4 w-4 mr-1" />
                Ban IP
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!ipToUnban} onOpenChange={() => setIPToUnban(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unban IP Address?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to unban{" "}
                <span className="font-mono font-medium">{ipToUnban?.ipAddress}</span>?
                This will allow access from this IP address again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-unban">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleUnbanIP} 
                disabled={unbanIPMutation.isPending}
                data-testid="button-confirm-unban"
              >
                Unban
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!sessionToTerminate} onOpenChange={() => setSessionToTerminate(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Terminate Session?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to terminate the session for{" "}
                <span className="font-medium">{sessionToTerminate?.userEmail}</span>?
                They will be logged out immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-terminate">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleTerminateSession}
                disabled={terminateSessionMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-terminate"
              >
                Terminate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isForceLogoutDialogOpen} onOpenChange={setIsForceLogoutDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Force Logout All Users?</AlertDialogTitle>
              <AlertDialogDescription>
                This will terminate all active sessions immediately. All users will need to
                sign in again. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-force-logout">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleForceLogoutAll}
                disabled={forceLogoutAllMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-force-logout"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Force Logout All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
