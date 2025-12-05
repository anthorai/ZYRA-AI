import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Link2,
  Clock,
  Package,
  ShoppingCart,
  Webhook,
  Play,
  Pause,
  RotateCcw,
  Upload,
  Settings2,
  Zap,
  Store,
  Activity,
  AlertCircle,
} from "lucide-react";

interface WebhookStatus {
  id: string;
  name: string;
  topic: string;
  status: "active" | "inactive" | "error";
  lastTriggered: string | null;
  errorCount: number;
}

interface SyncStats {
  productsSynced: number;
  lastProductSync: string;
  ordersSynced: number;
  syncErrors: number;
}

interface ShopifyError {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  retryable: boolean;
}

interface AutoPublishSettings {
  enabled: boolean;
  delayMinutes: number;
  queuedCount: number;
}

const initialWebhooks: WebhookStatus[] = [
  {
    id: "1",
    name: "Orders Created",
    topic: "orders/create",
    status: "active",
    lastTriggered: new Date(Date.now() - 300000).toISOString(),
    errorCount: 0,
  },
  {
    id: "2",
    name: "Orders Updated",
    topic: "orders/updated",
    status: "active",
    lastTriggered: new Date(Date.now() - 600000).toISOString(),
    errorCount: 0,
  },
  {
    id: "3",
    name: "Products Created",
    topic: "products/create",
    status: "active",
    lastTriggered: new Date(Date.now() - 1800000).toISOString(),
    errorCount: 0,
  },
  {
    id: "4",
    name: "Products Updated",
    topic: "products/update",
    status: "active",
    lastTriggered: new Date(Date.now() - 900000).toISOString(),
    errorCount: 2,
  },
  {
    id: "5",
    name: "Products Deleted",
    topic: "products/delete",
    status: "inactive",
    lastTriggered: null,
    errorCount: 0,
  },
  {
    id: "6",
    name: "Customer Data Request",
    topic: "customers/data_request",
    status: "active",
    lastTriggered: new Date(Date.now() - 86400000 * 3).toISOString(),
    errorCount: 0,
  },
  {
    id: "7",
    name: "Customer Redact",
    topic: "customers/redact",
    status: "error",
    lastTriggered: new Date(Date.now() - 86400000).toISOString(),
    errorCount: 5,
  },
  {
    id: "8",
    name: "Shop Redact",
    topic: "shop/redact",
    status: "active",
    lastTriggered: null,
    errorCount: 0,
  },
];

const initialSyncStats: SyncStats = {
  productsSynced: 1247,
  lastProductSync: new Date(Date.now() - 3600000).toISOString(),
  ordersSynced: 3891,
  syncErrors: 12,
};

const initialErrors: ShopifyError[] = [
  {
    id: "1",
    type: "Webhook Delivery Failed",
    message: "Connection timeout when delivering customers/redact webhook",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    retryable: true,
  },
  {
    id: "2",
    type: "Product Sync Error",
    message: "Failed to sync product SKU-12345: Invalid variant data",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    retryable: true,
  },
  {
    id: "3",
    type: "API Rate Limit",
    message: "Rate limit exceeded: 40/40 requests. Retry after 2 seconds.",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    retryable: false,
  },
  {
    id: "4",
    type: "Authentication Error",
    message: "Access token expired for store: my-store.myshopify.com",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    retryable: true,
  },
];

const initialAutoPublish: AutoPublishSettings = {
  enabled: true,
  delayMinutes: 5,
  queuedCount: 3,
};

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

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
  testId,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
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
    <div className="p-4 rounded-lg bg-muted/30" data-testid={testId}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <Icon className={`h-4 w-4 ${variantStyles[variant]}`} />
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold" data-testid={`${testId}-value`}>{value}</span>
        {description && (
          <span className="text-xs text-muted-foreground mt-1">{description}</span>
        )}
      </div>
    </div>
  );
}

export default function ShopifyControlsPage() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiSecretVisible, setApiSecretVisible] = useState(false);
  const [webhooks, setWebhooks] = useState<WebhookStatus[]>(initialWebhooks);
  const [syncStats, setSyncStats] = useState<SyncStats>(initialSyncStats);
  const [errors, setErrors] = useState<ShopifyError[]>(initialErrors);
  const [autoPublish, setAutoPublish] = useState<AutoPublishSettings>(initialAutoPublish);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const apiKey = "shpka_••••••••••••••••••••••";
  const apiSecret = "shpss_••••••••••••••••••••••";
  const webhookUrl = "https://zyra.ai/api/webhooks/shopify";
  const apiVersion = "2024-01";
  const storeCount = 3;
  const lastSyncTime = new Date(Date.now() - 1800000).toISOString();

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsTestingConnection(false);
    
    toast({
      title: "Connection Successful",
      description: "Successfully connected to Shopify API",
    });
  };

  const handleWebhookToggle = (webhookId: string, enabled: boolean) => {
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === webhookId ? { ...w, status: enabled ? "active" : "inactive" } : w
      )
    );

    const webhook = webhooks.find((w) => w.id === webhookId);
    toast({
      title: enabled ? "Webhook Enabled" : "Webhook Disabled",
      description: `${webhook?.name} has been ${enabled ? "enabled" : "disabled"}`,
    });
  };

  const handleTestWebhook = async (webhookId: string) => {
    const webhook = webhooks.find((w) => w.id === webhookId);
    
    toast({
      title: "Test Webhook Sent",
      description: `Test payload sent to ${webhook?.name}`,
    });
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsSyncing(false);

    setSyncStats((prev) => ({
      ...prev,
      lastProductSync: new Date().toISOString(),
    }));

    toast({
      title: "Sync Complete",
      description: "All products and orders have been synced successfully",
    });
  };

  const handleRetryError = (errorId: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== errorId));
    
    toast({
      title: "Retry Initiated",
      description: "The operation is being retried",
    });
  };

  const handleAutoPublishToggle = (enabled: boolean) => {
    setAutoPublish((prev) => ({ ...prev, enabled }));
    
    toast({
      title: enabled ? "Auto-Publish Enabled" : "Auto-Publish Disabled",
      description: enabled
        ? "Optimized products will be automatically published to Shopify"
        : "Automatic publishing has been disabled",
    });
  };

  const handleDelayChange = (value: string) => {
    const delay = parseInt(value, 10);
    setAutoPublish((prev) => ({ ...prev, delayMinutes: delay }));
    
    toast({
      title: "Delay Updated",
      description: `Publishing delay set to ${delay} minutes`,
    });
  };

  const getStatusBadge = (status: "active" | "inactive" | "error") => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="secondary">
            <Pause className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
    }
  };

  const activeWebhooksCount = webhooks.filter((w) => w.status === "active").length;
  const errorWebhooksCount = webhooks.filter((w) => w.status === "error").length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="heading-shopify-controls">
              Shopify Controls
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage Shopify integration settings and monitor sync status
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant={isConnected ? "default" : "destructive"}
              className={isConnected ? "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30" : ""}
              data-testid="badge-connection-status"
            >
              {isConnected ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
            <Badge variant="outline" data-testid="badge-store-count">
              <Store className="h-3 w-3 mr-1" />
              {storeCount} Stores
            </Badge>
          </div>
        </div>

        <Card data-testid="section-integration-status">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Shopify Integration Status
            </CardTitle>
            <CardDescription>
              Overview of your Shopify connection and sync status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Connection Status"
                value={isConnected ? "Connected" : "Disconnected"}
                icon={isConnected ? CheckCircle : XCircle}
                variant={isConnected ? "success" : "danger"}
                testId="stat-connection-status"
              />
              <StatCard
                title="Last Sync"
                value={formatTimeAgo(lastSyncTime)}
                icon={RefreshCw}
                description={formatDateTime(lastSyncTime)}
                testId="stat-last-sync"
              />
              <StatCard
                title="API Version"
                value={apiVersion}
                icon={Zap}
                description="Shopify Admin API"
                testId="stat-api-version"
              />
              <StatCard
                title="Connected Stores"
                value={storeCount}
                icon={Store}
                description="Active store connections"
                testId="stat-store-count"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="section-api-configuration">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Manage your Shopify API credentials and webhook settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type={apiKeyVisible ? "text" : "password"}
                    value={apiKeyVisible ? "shpka_1a2b3c4d5e6f7g8h9i0j" : apiKey}
                    readOnly
                    className="font-mono"
                    data-testid="input-api-key"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setApiKeyVisible(!apiKeyVisible)}
                    data-testid="button-toggle-api-key"
                  >
                    {apiKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-secret">API Secret</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-secret"
                    type={apiSecretVisible ? "text" : "password"}
                    value={apiSecretVisible ? "shpss_9z8y7x6w5v4u3t2s1r0q" : apiSecret}
                    readOnly
                    className="font-mono"
                    data-testid="input-api-secret"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setApiSecretVisible(!apiSecretVisible)}
                    data-testid="button-toggle-api-secret"
                  >
                    {apiSecretVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm"
                    data-testid="input-webhook-url"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      toast({
                        title: "Copied",
                        description: "Webhook URL copied to clipboard",
                      });
                    }}
                    data-testid="button-copy-webhook-url"
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="w-full"
                data-testid="button-test-connection"
              >
                {isTestingConnection ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="section-sync-status">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Sync Status
              </CardTitle>
              <CardDescription>
                Product and order synchronization metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  title="Products Synced"
                  value={syncStats.productsSynced.toLocaleString()}
                  icon={Package}
                  testId="stat-products-synced"
                />
                <StatCard
                  title="Last Product Sync"
                  value={formatTimeAgo(syncStats.lastProductSync)}
                  icon={Clock}
                  testId="stat-last-product-sync"
                />
                <StatCard
                  title="Orders Synced"
                  value={syncStats.ordersSynced.toLocaleString()}
                  icon={ShoppingCart}
                  testId="stat-orders-synced"
                />
                <StatCard
                  title="Sync Errors"
                  value={syncStats.syncErrors}
                  icon={AlertTriangle}
                  variant={syncStats.syncErrors > 0 ? "warning" : "default"}
                  testId="stat-sync-errors"
                />
              </div>

              <Button
                onClick={handleForceSync}
                disabled={isSyncing}
                className="w-full"
                variant="outline"
                data-testid="button-force-sync"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Force Sync All
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="section-webhook-status">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook Status
              </CardTitle>
              <CardDescription>
                Monitor and manage Shopify webhooks
                <Badge variant="outline" className="ml-2">
                  {activeWebhooksCount}/{webhooks.length} active
                </Badge>
                {errorWebhooksCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {errorWebhooksCount} errors
                  </Badge>
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Webhook</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Triggered</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id} data-testid={`row-webhook-${webhook.id}`}>
                    <TableCell className="font-medium">{webhook.name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {webhook.topic}
                    </TableCell>
                    <TableCell>{getStatusBadge(webhook.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimeAgo(webhook.lastTriggered)}
                    </TableCell>
                    <TableCell>
                      {webhook.errorCount > 0 ? (
                        <Badge variant="outline" className="text-red-600 dark:text-red-400">
                          {webhook.errorCount}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTestWebhook(webhook.id)}
                          title="Test webhook"
                          data-testid={`button-test-webhook-${webhook.id}`}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={webhook.status === "active"}
                          onCheckedChange={(checked) => handleWebhookToggle(webhook.id, checked)}
                          data-testid={`switch-webhook-${webhook.id}`}
                          aria-label={`Toggle ${webhook.name}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="section-error-log">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Error Log
              </CardTitle>
              <CardDescription>
                Recent Shopify-related errors and issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errors.length > 0 ? (
                <div className="space-y-3">
                  {errors.map((error) => (
                    <div
                      key={error.id}
                      className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 rounded-lg bg-muted/30"
                      data-testid={`error-item-${error.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-red-600 dark:text-red-400">
                            {error.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(error.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm mt-2 text-muted-foreground">{error.message}</p>
                      </div>
                      {error.retryable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetryError(error.id)}
                          className="flex-shrink-0"
                          data-testid={`button-retry-error-${error.id}`}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No errors to display</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="section-auto-publish">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Auto-Publish Settings
              </CardTitle>
              <CardDescription>
                Configure automatic publishing of optimized products to Shopify
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/30">
                <div className="flex-1">
                  <h4 className="font-medium">Auto-Publish Optimized Products</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically publish products after AI optimization completes
                  </p>
                </div>
                <Switch
                  checked={autoPublish.enabled}
                  onCheckedChange={handleAutoPublishToggle}
                  data-testid="switch-auto-publish"
                  aria-label="Toggle auto-publish"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publish-delay">Publishing Delay</Label>
                <p className="text-xs text-muted-foreground">
                  Wait time before publishing after optimization
                </p>
                <Select
                  value={autoPublish.delayMinutes.toString()}
                  onValueChange={handleDelayChange}
                  disabled={!autoPublish.enabled}
                >
                  <SelectTrigger data-testid="select-publish-delay">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Immediate</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/30">
                <div>
                  <h4 className="font-medium">Publish Queue Status</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Products waiting to be published
                  </p>
                </div>
                <Badge
                  variant={autoPublish.queuedCount > 0 ? "default" : "secondary"}
                  data-testid="badge-queue-count"
                >
                  {autoPublish.queuedCount} in queue
                </Badge>
              </div>

              {autoPublish.queuedCount > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setAutoPublish((prev) => ({ ...prev, queuedCount: 0 }));
                    toast({
                      title: "Queue Published",
                      description: "All queued products have been published to Shopify",
                    });
                  }}
                  data-testid="button-publish-queue"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Publish All Queued ({autoPublish.queuedCount})
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
