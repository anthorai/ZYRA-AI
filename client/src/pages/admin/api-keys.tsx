import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import {
  Key,
  Plus,
  RefreshCw,
  Power,
  PlayCircle,
  AlertTriangle,
  BarChart3,
  Shield,
  Clock,
  Activity,
  DollarSign,
  Zap,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface APIKey {
  id: string;
  serviceName: string;
  keyPrefix: string;
  status: "active" | "inactive" | "expired";
  lastUsed: string | null;
  usageCount: number;
  rateLimit: number;
  createdAt: string;
  expiresAt: string | null;
  lastRotated: string;
}

interface ServiceUsage {
  service: string;
  calls: number;
  errors: number;
  cost: number;
}

interface RateLimitSetting {
  service: string;
  limit: number;
  used: number;
}

const SERVICES = [
  { id: "openai", name: "OpenAI API", color: "#10B981" },
  { id: "stripe", name: "Stripe API", color: "#6366F1" },
  { id: "sendgrid", name: "SendGrid API", color: "#3B82F6" },
  { id: "twilio", name: "Twilio API", color: "#EF4444" },
  { id: "supabase", name: "Supabase API", color: "#22C55E" },
  { id: "shopify", name: "Shopify API", color: "#95BF47" },
  { id: "paypal", name: "PayPal API", color: "#003087" },
];

const mockAPIKeys: APIKey[] = [
  {
    id: "1",
    serviceName: "OpenAI API",
    keyPrefix: "sk-proj-...",
    status: "active",
    lastUsed: new Date(Date.now() - 300000).toISOString(),
    usageCount: 15420,
    rateLimit: 60,
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    lastRotated: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: "2",
    serviceName: "Stripe API",
    keyPrefix: "sk_live_...",
    status: "active",
    lastUsed: new Date(Date.now() - 600000).toISOString(),
    usageCount: 8750,
    rateLimit: 100,
    createdAt: new Date(Date.now() - 86400000 * 180).toISOString(),
    expiresAt: null,
    lastRotated: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  {
    id: "3",
    serviceName: "SendGrid API",
    keyPrefix: "SG.xxxxx...",
    status: "active",
    lastUsed: new Date(Date.now() - 3600000).toISOString(),
    usageCount: 45230,
    rateLimit: 500,
    createdAt: new Date(Date.now() - 86400000 * 120).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 60).toISOString(),
    lastRotated: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
  {
    id: "4",
    serviceName: "Twilio API",
    keyPrefix: "ACxxxxx...",
    status: "inactive",
    lastUsed: new Date(Date.now() - 86400000 * 7).toISOString(),
    usageCount: 2340,
    rateLimit: 50,
    createdAt: new Date(Date.now() - 86400000 * 200).toISOString(),
    expiresAt: null,
    lastRotated: new Date(Date.now() - 86400000 * 90).toISOString(),
  },
  {
    id: "5",
    serviceName: "Supabase API",
    keyPrefix: "sbp_xxx...",
    status: "active",
    lastUsed: new Date(Date.now() - 60000).toISOString(),
    usageCount: 127850,
    rateLimit: 1000,
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    expiresAt: null,
    lastRotated: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: "6",
    serviceName: "Shopify API",
    keyPrefix: "shpat_x...",
    status: "expired",
    lastUsed: new Date(Date.now() - 86400000 * 14).toISOString(),
    usageCount: 5670,
    rateLimit: 40,
    createdAt: new Date(Date.now() - 86400000 * 365).toISOString(),
    expiresAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastRotated: new Date(Date.now() - 86400000 * 180).toISOString(),
  },
  {
    id: "7",
    serviceName: "PayPal API",
    keyPrefix: "PAYPAL_...",
    status: "active",
    lastUsed: new Date(Date.now() - 7200000).toISOString(),
    usageCount: 3420,
    rateLimit: 30,
    createdAt: new Date(Date.now() - 86400000 * 150).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 180).toISOString(),
    lastRotated: new Date(Date.now() - 86400000 * 75).toISOString(),
  },
];

const mockUsageStats: ServiceUsage[] = [
  { service: "OpenAI", calls: 15420, errors: 45, cost: 127.50 },
  { service: "Stripe", calls: 8750, errors: 12, cost: 0 },
  { service: "SendGrid", calls: 45230, errors: 89, cost: 45.23 },
  { service: "Twilio", calls: 2340, errors: 23, cost: 18.72 },
  { service: "Supabase", calls: 127850, errors: 156, cost: 25.00 },
  { service: "Shopify", calls: 5670, errors: 34, cost: 0 },
  { service: "PayPal", calls: 3420, errors: 8, cost: 0 },
];

const mockRateLimits: RateLimitSetting[] = [
  { service: "OpenAI API", limit: 60, used: 45 },
  { service: "Stripe API", limit: 100, used: 23 },
  { service: "SendGrid API", limit: 500, used: 312 },
  { service: "Twilio API", limit: 50, used: 0 },
  { service: "Supabase API", limit: 1000, used: 789 },
  { service: "Shopify API", limit: 40, used: 0 },
  { service: "PayPal API", limit: 30, used: 12 },
];

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return "Never";
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

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
}

function getExpirationWarning(expiresAt: string | null): { warning: boolean; daysLeft: number | null } {
  if (!expiresAt) return { warning: false, daysLeft: null };
  const expDate = new Date(expiresAt);
  const now = new Date();
  const diffMs = expDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return { warning: daysLeft <= 30 && daysLeft > 0, daysLeft };
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
  testId,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "danger";
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
        <span className="text-2xl font-bold" data-testid={`${testId}-value`}>
          {value}
        </span>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function APIKeysPage() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<APIKey[]>(mockAPIKeys);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newKeyService, setNewKeyService] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [newKeyRateLimit, setNewKeyRateLimit] = useState("60");
  const [showKeyValue, setShowKeyValue] = useState(false);
  const [globalRateLimit, setGlobalRateLimit] = useState("5000");
  const [rotatingKeyId, setRotatingKeyId] = useState<string | null>(null);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);

  const activeKeys = apiKeys.filter((k) => k.status === "active").length;
  const expiredKeys = apiKeys.filter((k) => k.status === "expired").length;
  const expiringKeys = apiKeys.filter((k) => {
    const { warning } = getExpirationWarning(k.expiresAt);
    return warning && k.status === "active";
  }).length;
  const totalUsage = apiKeys.reduce((sum, k) => sum + k.usageCount, 0);

  const handleAddKey = () => {
    if (!newKeyService || !newKeyValue) {
      toast({
        title: "Error",
        description: "Please select a service and enter the API key",
        variant: "destructive",
      });
      return;
    }

    const service = SERVICES.find((s) => s.id === newKeyService);
    const newKey: APIKey = {
      id: Date.now().toString(),
      serviceName: service?.name || newKeyService,
      keyPrefix: newKeyValue.substring(0, 8) + "...",
      status: "active",
      lastUsed: null,
      usageCount: 0,
      rateLimit: parseInt(newKeyRateLimit),
      createdAt: new Date().toISOString(),
      expiresAt: null,
      lastRotated: new Date().toISOString(),
    };

    setApiKeys([...apiKeys, newKey]);
    toast({
      title: "API Key Added",
      description: `Successfully added ${service?.name} API key`,
    });

    setIsAddDialogOpen(false);
    setNewKeyService("");
    setNewKeyValue("");
    setNewKeyDescription("");
    setNewKeyRateLimit("60");
    setShowKeyValue(false);
  };

  const handleRotateKey = (keyId: string) => {
    setRotatingKeyId(keyId);
    setTimeout(() => {
      setApiKeys(apiKeys.map((k) =>
        k.id === keyId
          ? { ...k, lastRotated: new Date().toISOString(), keyPrefix: "new_key_..." }
          : k
      ));
      toast({
        title: "Key Rotated",
        description: "API key has been successfully rotated",
      });
      setRotatingKeyId(null);
    }, 1500);
  };

  const handleToggleKey = (keyId: string) => {
    setApiKeys(apiKeys.map((k) =>
      k.id === keyId
        ? { ...k, status: k.status === "active" ? "inactive" : "active" }
        : k
    ));
    const key = apiKeys.find((k) => k.id === keyId);
    toast({
      title: key?.status === "active" ? "Key Disabled" : "Key Enabled",
      description: `${key?.serviceName} key has been ${key?.status === "active" ? "disabled" : "enabled"}`,
    });
  };

  const handleTestKey = (keyId: string) => {
    setTestingKeyId(keyId);
    setTimeout(() => {
      const success = Math.random() > 0.2;
      toast({
        title: success ? "Connection Successful" : "Connection Failed",
        description: success
          ? "API key is valid and working correctly"
          : "Failed to connect. Please check the key and try again.",
        variant: success ? "default" : "destructive",
      });
      setTestingKeyId(null);
    }, 2000);
  };

  const handleUpdateGlobalRateLimit = (value: string) => {
    setGlobalRateLimit(value);
    toast({
      title: "Rate Limit Updated",
      description: `Global rate limit set to ${value} calls/minute`,
    });
  };

  const getStatusBadge = (status: APIKey["status"]) => {
    const variants = {
      active: { variant: "default" as const, icon: CheckCircle, label: "Active" },
      inactive: { variant: "secondary" as const, icon: Power, label: "Inactive" },
      expired: { variant: "destructive" as const, icon: XCircle, label: "Expired" },
    };
    const config = variants[status];
    return (
      <Badge variant={config.variant} className="gap-1">
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="heading-api-keys">
              API Key Management
            </h1>
            <p className="text-muted-foreground">
              Manage external API keys and monitor usage across services
            </p>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            data-testid="button-add-api-key"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add API Key
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Keys"
            value={activeKeys}
            icon={Key}
            variant="success"
            description="Currently in use"
            testId="stat-active-keys"
          />
          <StatCard
            title="Total API Calls"
            value={totalUsage.toLocaleString()}
            icon={Activity}
            description="This month"
            testId="stat-total-calls"
          />
          <StatCard
            title="Expiring Soon"
            value={expiringKeys}
            icon={AlertTriangle}
            variant={expiringKeys > 0 ? "warning" : "default"}
            description="Within 30 days"
            testId="stat-expiring-keys"
          />
          <StatCard
            title="Expired Keys"
            value={expiredKeys}
            icon={XCircle}
            variant={expiredKeys > 0 ? "danger" : "default"}
            description="Need attention"
            testId="stat-expired-keys"
          />
        </div>

        <Card data-testid="section-api-keys-table">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              All external API keys configured for the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Key Prefix</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Usage (Month)</TableHead>
                  <TableHead>Rate Limit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => {
                  const { warning, daysLeft } = getExpirationWarning(key.expiresAt);
                  return (
                    <TableRow key={key.id} data-testid={`row-api-key-${key.id}`}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{key.serviceName}</span>
                          {warning && (
                            <span className="text-xs text-yellow-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Expires in {daysLeft} days
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {key.keyPrefix}
                      </TableCell>
                      <TableCell>{getStatusBadge(key.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatTimeAgo(key.lastUsed)}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {key.usageCount.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground text-xs ml-1">
                          calls
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{key.rateLimit}/min</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRotateKey(key.id)}
                            disabled={rotatingKeyId === key.id || key.status === "expired"}
                            data-testid={`button-rotate-${key.id}`}
                            title="Rotate Key"
                          >
                            <RefreshCw
                              className={`h-4 w-4 ${
                                rotatingKeyId === key.id ? "animate-spin" : ""
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleKey(key.id)}
                            disabled={key.status === "expired"}
                            data-testid={`button-toggle-${key.id}`}
                            title={key.status === "active" ? "Disable" : "Enable"}
                          >
                            <Power
                              className={`h-4 w-4 ${
                                key.status === "active"
                                  ? "text-green-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTestKey(key.id)}
                            disabled={testingKeyId === key.id || key.status !== "active"}
                            data-testid={`button-test-${key.id}`}
                            title="Test Connection"
                          >
                            <PlayCircle
                              className={`h-4 w-4 ${
                                testingKeyId === key.id ? "animate-pulse" : ""
                              }`}
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="section-usage-statistics">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Usage Statistics
              </CardTitle>
              <CardDescription>
                API calls, error rates, and cost estimates per service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  API Calls This Month
                </Label>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockUsageStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="service"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="calls" radius={[4, 4, 0, 0]}>
                        {mockUsageStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={SERVICES[index]?.color || "#6366F1"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Error Rates & Costs
                </Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Errors</TableHead>
                      <TableHead>Error Rate</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockUsageStats.map((stat) => (
                      <TableRow
                        key={stat.service}
                        data-testid={`row-usage-${stat.service.toLowerCase()}`}
                      >
                        <TableCell className="font-medium">
                          {stat.service}
                        </TableCell>
                        <TableCell>{stat.errors}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              stat.errors / stat.calls > 0.01
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {((stat.errors / stat.calls) * 100).toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {stat.cost > 0 ? (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {stat.cost.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Free</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-rate-limits">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Rate Limit Settings
              </CardTitle>
              <CardDescription>
                Configure global and per-service rate limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <Label htmlFor="global-rate-limit">Global Rate Limit</Label>
                  <p className="text-xs text-muted-foreground">
                    Maximum total API calls per minute
                  </p>
                </div>
                <Select
                  value={globalRateLimit}
                  onValueChange={handleUpdateGlobalRateLimit}
                >
                  <SelectTrigger
                    className="w-[140px]"
                    data-testid="select-global-rate-limit"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">1,000/min</SelectItem>
                    <SelectItem value="2500">2,500/min</SelectItem>
                    <SelectItem value="5000">5,000/min</SelectItem>
                    <SelectItem value="10000">10,000/min</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Per-Service Rate Limits
                </Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Limit</TableHead>
                      <TableHead>Current Usage</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockRateLimits.map((limit) => {
                      const usagePercent = (limit.used / limit.limit) * 100;
                      return (
                        <TableRow
                          key={limit.service}
                          data-testid={`row-rate-limit-${limit.service.toLowerCase().replace(/\s/g, "-")}`}
                        >
                          <TableCell className="font-medium">
                            {limit.service}
                          </TableCell>
                          <TableCell>{limit.limit}/min</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    usagePercent > 80
                                      ? "bg-red-500"
                                      : usagePercent > 50
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {limit.used}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {usagePercent > 80 ? (
                              <Badge variant="destructive">High</Badge>
                            ) : usagePercent > 50 ? (
                              <Badge variant="outline">Moderate</Badge>
                            ) : (
                              <Badge variant="secondary">Normal</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="section-security">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Key Rotation
            </CardTitle>
            <CardDescription>
              Key rotation schedules, last rotation dates, and security alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Rotation Schedule</span>
                </div>
                <p className="text-2xl font-bold">Every 90 days</p>
                <p className="text-xs text-muted-foreground">
                  Recommended for security compliance
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Last Rotation</span>
                </div>
                <p className="text-2xl font-bold">15 days ago</p>
                <p className="text-xs text-muted-foreground">
                  Supabase API key was last rotated
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Keys Rotated</span>
                </div>
                <p className="text-2xl font-bold">23</p>
                <p className="text-xs text-muted-foreground">
                  Total rotations this year
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Security Alerts
              </Label>
              <div className="space-y-2">
                {apiKeys
                  .filter((k) => {
                    const { warning } = getExpirationWarning(k.expiresAt);
                    return warning || k.status === "expired";
                  })
                  .map((key) => {
                    const { daysLeft } = getExpirationWarning(key.expiresAt);
                    return (
                      <div
                        key={key.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          key.status === "expired"
                            ? "bg-red-500/10"
                            : "bg-yellow-500/10"
                        }`}
                        data-testid={`alert-key-${key.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle
                            className={`h-5 w-5 ${
                              key.status === "expired"
                                ? "text-red-500"
                                : "text-yellow-500"
                            }`}
                          />
                          <div>
                            <p className="font-medium">{key.serviceName}</p>
                            <p className="text-xs text-muted-foreground">
                              {key.status === "expired"
                                ? "Key has expired - rotate immediately"
                                : `Expires in ${daysLeft} days - schedule rotation`}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={key.status === "expired" ? "destructive" : "outline"}
                          onClick={() => handleRotateKey(key.id)}
                          disabled={rotatingKeyId === key.id}
                          data-testid={`button-alert-rotate-${key.id}`}
                        >
                          <RefreshCw
                            className={`h-4 w-4 mr-1 ${
                              rotatingKeyId === key.id ? "animate-spin" : ""
                            }`}
                          />
                          Rotate Now
                        </Button>
                      </div>
                    );
                  })}
                {apiKeys.filter((k) => {
                  const { warning } = getExpirationWarning(k.expiresAt);
                  return warning || k.status === "expired";
                }).length === 0 && (
                  <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">
                      All API keys are healthy and up to date
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Key Rotation History
              </Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Rotated</TableHead>
                    <TableHead>Days Since Rotation</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => {
                    const daysSinceRotation = Math.floor(
                      (Date.now() - new Date(key.lastRotated).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return (
                      <TableRow
                        key={key.id}
                        data-testid={`row-rotation-${key.id}`}
                      >
                        <TableCell className="font-medium">
                          {key.serviceName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(key.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(key.lastRotated)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              daysSinceRotation > 90
                                ? "text-red-500"
                                : daysSinceRotation > 60
                                ? "text-yellow-500"
                                : ""
                            }
                          >
                            {daysSinceRotation} days
                          </span>
                        </TableCell>
                        <TableCell>
                          {daysSinceRotation > 90 ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : daysSinceRotation > 60 ? (
                            <Badge variant="outline">Due Soon</Badge>
                          ) : (
                            <Badge variant="secondary">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent data-testid="dialog-add-api-key">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Add New API Key
              </DialogTitle>
              <DialogDescription>
                Configure a new external API key for the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Select
                  value={newKeyService}
                  onValueChange={setNewKeyService}
                >
                  <SelectTrigger data-testid="select-service">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICES.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showKeyValue ? "text" : "password"}
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    placeholder="Enter your API key"
                    data-testid="input-api-key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowKeyValue(!showKeyValue)}
                    data-testid="button-toggle-key-visibility"
                  >
                    {showKeyValue ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={newKeyDescription}
                  onChange={(e) => setNewKeyDescription(e.target.value)}
                  placeholder="E.g., Production key for AI features"
                  data-testid="input-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate-limit">Rate Limit (calls/min)</Label>
                <Select
                  value={newKeyRateLimit}
                  onValueChange={setNewKeyRateLimit}
                >
                  <SelectTrigger data-testid="select-rate-limit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 calls/min</SelectItem>
                    <SelectItem value="60">60 calls/min</SelectItem>
                    <SelectItem value="100">100 calls/min</SelectItem>
                    <SelectItem value="500">500 calls/min</SelectItem>
                    <SelectItem value="1000">1,000 calls/min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                data-testid="button-cancel-add-key"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddKey}
                data-testid="button-save-api-key"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
