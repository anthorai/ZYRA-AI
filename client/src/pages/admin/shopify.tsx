import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  ExternalLink,
} from "lucide-react";

interface StoreConnection {
  id: string;
  userId: number;
  platform: string;
  storeName: string | null;
  storeUrl: string;
  accessToken: string | null;
  refreshToken: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SyncStats {
  productsSynced: number;
  lastProductSync: string | null;
  ordersSynced: number;
  syncErrors: number;
}

interface AutoPublishSettings {
  enabled: boolean;
  delayMinutes: number;
  queuedCount: number;
}

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

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
  testId,
  isLoading = false,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
  testId: string;
  isLoading?: boolean;
}) {
  const variantStyles = {
    default: "text-muted-foreground",
    success: "text-green-500",
    warning: "text-yellow-500",
    danger: "text-red-500",
  };

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg bg-muted/30" data-testid={testId}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <Skeleton className="h-8 w-16" />
          {description && <Skeleton className="h-3 w-24 mt-1" />}
        </div>
      </div>
    );
  }

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
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiSecretVisible, setApiSecretVisible] = useState(false);
  const [autoPublish, setAutoPublish] = useState<AutoPublishSettings>({
    enabled: false,
    delayMinutes: 5,
    queuedCount: 0,
  });

  const { data: storesData, isLoading: isLoadingStores, refetch: refetchStores } = useQuery<StoreConnection[]>({
    queryKey: ['/api/stores/connected'],
  });

  const { data: productsData, isLoading: isLoadingProducts } = useQuery<{ products: any[], total: number }>({
    queryKey: ['/api/products'],
  });

  const { data: setupData, isLoading: isLoadingSetup } = useQuery<{
    isReady?: boolean;
    ready?: boolean;
    config?: { hasApiKey?: boolean; hasApiSecret?: boolean };
    checks?: { hasApiKey?: boolean; hasApiSecret?: boolean };
    issues?: string[];
  }>({
    queryKey: ['/api/shopify/validate-setup'],
  });

  const shopifyStores = storesData?.filter(s => s.platform === 'shopify') || [];
  const isConnected = shopifyStores.length > 0 && shopifyStores.some(s => s.isActive);
  const storeCount = shopifyStores.length;
  const lastSyncTime = shopifyStores.length > 0 
    ? shopifyStores.reduce((latest, store) => {
        if (!store.lastSyncAt) return latest;
        if (!latest) return store.lastSyncAt;
        return new Date(store.lastSyncAt) > new Date(latest) ? store.lastSyncAt : latest;
      }, null as string | null)
    : null;

  const syncStats: SyncStats = {
    productsSynced: productsData?.total || 0,
    lastProductSync: lastSyncTime,
    ordersSynced: 0,
    syncErrors: 0,
  };

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/shopify/sync');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stores/connected'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Sync Complete",
        description: "Products have been synced successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync with Shopify",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/shopify/validate-setup');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.isReady) {
        toast({
          title: "Connection Valid",
          description: "Shopify API configuration is correct",
        });
      } else {
        toast({
          title: "Configuration Issues",
          description: data.issues?.join(', ') || "Please check your Shopify setup",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Connection Test Failed",
        description: "Unable to validate Shopify connection",
        variant: "destructive",
      });
    },
  });

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
      description: delay === 0 ? "Publishing set to immediate" : `Publishing delay set to ${delay} minutes`,
    });
  };

  const isLoading = isLoadingStores || isLoadingProducts;
  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/shopify`
    : '/api/webhooks/shopify';

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
            {isLoading ? (
              <>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
              </>
            ) : (
              <>
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
                      Not Connected
                    </>
                  )}
                </Badge>
                <Badge variant="outline" data-testid="badge-store-count">
                  <Store className="h-3 w-3 mr-1" />
                  {storeCount} {storeCount === 1 ? 'Store' : 'Stores'}
                </Badge>
              </>
            )}
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
                value={isConnected ? "Connected" : "Not Connected"}
                icon={isConnected ? CheckCircle : XCircle}
                variant={isConnected ? "success" : "danger"}
                testId="stat-connection-status"
                isLoading={isLoading}
              />
              <StatCard
                title="Last Sync"
                value={formatTimeAgo(lastSyncTime)}
                icon={RefreshCw}
                description={formatDateTime(lastSyncTime)}
                testId="stat-last-sync"
                isLoading={isLoading}
              />
              <StatCard
                title="API Version"
                value="2024-01"
                icon={Zap}
                description="Shopify Admin API"
                testId="stat-api-version"
                isLoading={isLoading}
              />
              <StatCard
                title="Connected Stores"
                value={storeCount}
                icon={Store}
                description="Active store connections"
                testId="stat-store-count"
                isLoading={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        {shopifyStores.length > 0 && (
          <Card data-testid="section-connected-stores">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Connected Stores
              </CardTitle>
              <CardDescription>
                Your connected Shopify stores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Store URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead>Connected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shopifyStores.map((store) => (
                    <TableRow key={store.id} data-testid={`row-store-${store.id}`}>
                      <TableCell className="font-medium">
                        {store.storeName || 'Unnamed Store'}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {store.storeUrl}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={store.isActive 
                            ? "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30" 
                            : ""
                          }
                          variant={store.isActive ? "default" : "secondary"}
                        >
                          {store.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <Pause className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimeAgo(store.lastSyncAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimeAgo(store.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="section-api-configuration">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Shopify API credentials and webhook settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type={apiKeyVisible ? "text" : "password"}
                    value={apiKeyVisible && (setupData?.config?.hasApiKey || setupData?.checks?.hasApiKey) ? "Configured" : "••••••••••••••••"}
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
                <p className="text-xs text-muted-foreground">
                  {(setupData?.config?.hasApiKey || setupData?.checks?.hasApiKey) ? "API key is configured" : "API key not configured - set SHOPIFY_API_KEY in environment"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-secret">API Secret</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-secret"
                    type={apiSecretVisible ? "text" : "password"}
                    value={apiSecretVisible && (setupData?.config?.hasApiSecret || setupData?.checks?.hasApiSecret) ? "Configured" : "••••••••••••••••"}
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
                <p className="text-xs text-muted-foreground">
                  {(setupData?.config?.hasApiSecret || setupData?.checks?.hasApiSecret) ? "API secret is configured" : "API secret not configured - set SHOPIFY_API_SECRET in environment"}
                </p>
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
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending}
                className="w-full"
                data-testid="button-test-connection"
              >
                {testConnectionMutation.isPending ? (
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
                Product synchronization metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  title="Products Synced"
                  value={syncStats.productsSynced.toLocaleString()}
                  icon={Package}
                  testId="stat-products-synced"
                  isLoading={isLoading}
                />
                <StatCard
                  title="Last Product Sync"
                  value={formatTimeAgo(syncStats.lastProductSync)}
                  icon={Clock}
                  testId="stat-last-product-sync"
                  isLoading={isLoading}
                />
                <StatCard
                  title="Orders Synced"
                  value={syncStats.ordersSynced.toLocaleString()}
                  icon={ShoppingCart}
                  testId="stat-orders-synced"
                  isLoading={isLoading}
                />
                <StatCard
                  title="Sync Errors"
                  value={syncStats.syncErrors}
                  icon={AlertTriangle}
                  variant={syncStats.syncErrors > 0 ? "warning" : "default"}
                  testId="stat-sync-errors"
                  isLoading={isLoading}
                />
              </div>

              <Button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending || !isConnected}
                className="w-full"
                variant="outline"
                data-testid="button-force-sync"
              >
                {syncMutation.isPending ? (
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
                disabled={!isConnected}
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
                disabled={!autoPublish.enabled || !isConnected}
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
    </AdminLayout>
  );
}
