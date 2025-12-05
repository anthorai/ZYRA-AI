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

  const mockSecurityOverview: SecurityOverview = {
    activeSessions: 47,
    failedLogins24h: 12,
    suspiciousActivityCount: 3,
    twoFactorAdoptionRate: 34,
    totalUsers: 156,
    usersWithTwoFactor: 53,
  };

  const mockIPBans: IPBan[] = [
    {
      id: "1",
      ipAddress: "192.168.1.100",
      reason: "Multiple failed login attempts",
      bannedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
      bannedBy: "admin@zyra.ai",
    },
    {
      id: "2",
      ipAddress: "10.0.0.55",
      reason: "Suspected bot activity",
      bannedAt: new Date(Date.now() - 86400000).toISOString(),
      expiresAt: null,
      bannedBy: "admin@zyra.ai",
    },
    {
      id: "3",
      ipAddress: "172.16.0.88",
      reason: "API abuse detected",
      bannedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      bannedBy: "system",
    },
  ];

  const mockActiveSessions: ActiveSession[] = [
    {
      id: "1",
      userId: "user-1",
      userEmail: "john@example.com",
      deviceType: "desktop",
      browser: "Chrome",
      os: "Windows",
      ipAddress: "203.0.113.50",
      location: "New York, US",
      lastSeenAt: new Date(Date.now() - 300000).toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "2",
      userId: "user-2",
      userEmail: "sarah@example.com",
      deviceType: "mobile",
      browser: "Safari",
      os: "iOS",
      ipAddress: "198.51.100.75",
      location: "London, UK",
      lastSeenAt: new Date(Date.now() - 60000).toISOString(),
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "3",
      userId: "user-3",
      userEmail: "mike@example.com",
      deviceType: "tablet",
      browser: "Firefox",
      os: "Android",
      ipAddress: "192.0.2.123",
      location: "Toronto, CA",
      lastSeenAt: new Date(Date.now() - 1800000).toISOString(),
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
  ];

  const mockLoginLogs: LoginLog[] = [
    {
      id: "1",
      userId: "user-1",
      userEmail: "john@example.com",
      ipAddress: "203.0.113.50",
      location: "New York, US",
      success: true,
      failureReason: null,
      createdAt: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: "2",
      userId: "user-4",
      userEmail: "attacker@suspicious.com",
      ipAddress: "192.168.1.100",
      location: "Unknown",
      success: false,
      failureReason: "Invalid password",
      createdAt: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: "3",
      userId: "user-2",
      userEmail: "sarah@example.com",
      ipAddress: "198.51.100.75",
      location: "London, UK",
      success: true,
      failureReason: null,
      createdAt: new Date(Date.now() - 900000).toISOString(),
    },
    {
      id: "4",
      userId: "user-5",
      userEmail: "test@example.com",
      ipAddress: "10.0.0.55",
      location: "Moscow, RU",
      success: false,
      failureReason: "Account locked",
      createdAt: new Date(Date.now() - 1200000).toISOString(),
    },
    {
      id: "5",
      userId: "user-3",
      userEmail: "mike@example.com",
      ipAddress: "192.0.2.123",
      location: "Toronto, CA",
      success: true,
      failureReason: null,
      createdAt: new Date(Date.now() - 1500000).toISOString(),
    },
  ];

  const mockSuspiciousActivities: SuspiciousActivity[] = [
    {
      id: "1",
      type: "multiple_failed_logins",
      description: "15 failed login attempts from same IP in 5 minutes",
      ipAddress: "192.168.1.100",
      userId: null,
      userEmail: null,
      severity: "high",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      resolved: false,
    },
    {
      id: "2",
      type: "unusual_location",
      description: "Login from unusual location detected",
      ipAddress: "203.0.113.99",
      userId: "user-6",
      userEmail: "alex@example.com",
      severity: "medium",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      resolved: false,
    },
    {
      id: "3",
      type: "rapid_requests",
      description: "500+ API requests in 1 minute from single IP",
      ipAddress: "10.0.0.55",
      userId: null,
      userEmail: null,
      severity: "high",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      resolved: true,
    },
  ];

  const mockAdminActivityLogs: AdminActivityLog[] = [
    {
      id: "1",
      adminId: "admin-1",
      adminEmail: "admin@zyra.ai",
      action: "Banned IP",
      target: "192.168.1.100",
      details: "Multiple failed login attempts",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "2",
      adminId: "admin-1",
      adminEmail: "admin@zyra.ai",
      action: "Reset User Password",
      target: "john@example.com",
      details: "User requested password reset",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "3",
      adminId: "admin-2",
      adminEmail: "superadmin@zyra.ai",
      action: "Changed Session Timeout",
      target: "System Settings",
      details: "Session timeout changed from 1h to 4h",
      createdAt: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      id: "4",
      adminId: "admin-1",
      adminEmail: "admin@zyra.ai",
      action: "Terminated Session",
      target: "user@example.com",
      details: "Admin terminated user session manually",
      createdAt: new Date(Date.now() - 21600000).toISOString(),
    },
  ];

  const filteredLoginLogs = mockLoginLogs.filter((log) => {
    if (loginStatusFilter === "all") return true;
    if (loginStatusFilter === "success") return log.success;
    return !log.success;
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

    toast({
      title: "IP Banned",
      description: `Successfully banned IP ${newIPAddress}`,
    });

    setIsAddIPDialogOpen(false);
    setNewIPAddress("");
    setNewIPReason("");
    setNewIPExpiration("permanent");
  };

  const handleUnbanIP = () => {
    if (!ipToUnban) return;

    toast({
      title: "IP Unbanned",
      description: `Successfully unbanned IP ${ipToUnban.ipAddress}`,
    });

    setIPToUnban(null);
  };

  const handleTerminateSession = () => {
    if (!sessionToTerminate) return;

    toast({
      title: "Session Terminated",
      description: `Successfully terminated session for ${sessionToTerminate.userEmail}`,
    });

    setSessionToTerminate(null);
  };

  const handleForceLogoutAll = () => {
    toast({
      title: "Force Logout Initiated",
      description: "All users have been logged out. They will need to sign in again.",
    });

    setIsForceLogoutDialogOpen(false);
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
            value={mockSecurityOverview.activeSessions}
            icon={Users}
            description="Currently logged in users"
            testId="stat-active-sessions"
          />
          <StatCard
            title="Failed Logins (24h)"
            value={mockSecurityOverview.failedLogins24h}
            icon={XCircle}
            variant="warning"
            description="In the last 24 hours"
            testId="stat-failed-logins"
          />
          <StatCard
            title="Suspicious Activity"
            value={mockSecurityOverview.suspiciousActivityCount}
            icon={AlertTriangle}
            variant="danger"
            description="Unresolved alerts"
            testId="stat-suspicious-activity"
          />
          <StatCard
            title="2FA Adoption"
            value={`${mockSecurityOverview.twoFactorAdoptionRate}%`}
            icon={ShieldCheck}
            variant="success"
            description={`${mockSecurityOverview.usersWithTwoFactor} of ${mockSecurityOverview.totalUsers} users`}
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
              {mockIPBans.length > 0 ? (
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
                    {mockIPBans.map((ban) => (
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
                <div className="text-center py-8 text-muted-foreground">
                  No IP addresses are currently banned
                </div>
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
                  data-testid="button-force-logout-all"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Force Logout
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Active Sessions ({mockActiveSessions.length})</Label>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {mockActiveSessions.map((session) => (
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
            <CardContent className="space-y-3">
              {mockSuspiciousActivities.map((activity) => (
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
            <CardContent className="space-y-3">
              {mockAdminActivityLogs.map((log) => (
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
              <Button onClick={handleAddIPBan} data-testid="button-confirm-ban">
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
              <AlertDialogAction onClick={handleUnbanIP} data-testid="button-confirm-unban">
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
