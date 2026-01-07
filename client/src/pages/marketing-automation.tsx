import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useStoreCurrency } from "@/hooks/use-store-currency";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  TrendingUp,
  TrendingDown,
  Mail,
  ShoppingCart,
  Users,
  DollarSign,
  Activity,
  Zap
} from "lucide-react";

export default function MarketingAutomation() {
  const { toast } = useToast();
  const { currency } = useStoreCurrency();

  // Fetch marketing overview
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['/api/marketing/overview']
  });

  // Fetch automation settings
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['/api/automation/settings']
  });

  // Fetch A/B tests
  const { data: abTests, isLoading: loadingTests } = useQuery({
    queryKey: ['/api/marketing/ab-tests']
  });

  // Fetch cart recovery analytics
  const { data: cartStats, isLoading: loadingCartStats } = useQuery({
    queryKey: ['/api/marketing/cart-recovery-stats']
  });

  // Autopilot toggle mutation
  const autopilotMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return await apiRequest('/api/automation/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ autopilotEnabled: enabled })
      });
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/settings'] });
      toast({
        title: enabled ? 'Autopilot Enabled' : 'Autopilot Disabled',
        description: enabled 
          ? 'Marketing automation is now running autonomously' 
          : 'Marketing automation paused',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update autopilot settings',
        variant: 'destructive'
      });
    }
  });

  // Type assertions for data
  const overviewData = overview as any;
  const settingsData = settings as any;
  const abTestsData = abTests as any;
  const cartStatsData = cartStats as any;

  if (loadingOverview || loadingSettings) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading marketing automation...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-marketing-automation">
            Marketing Automation
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered campaign management and cart recovery
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Autopilot</span>
            <Switch 
              checked={settingsData?.autopilotEnabled || false}
              onCheckedChange={(checked) => autopilotMutation.mutate(checked)}
              disabled={autopilotMutation.isPending}
              data-testid="switch-autopilot"
            />
          </div>
          <Badge variant={settingsData?.dryRunMode ? "secondary" : "default"}>
            {settingsData?.dryRunMode ? 'Dry Run Mode' : 'Live'}
          </Badge>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-campaigns">
              {overviewData?.totalCampaigns || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {overviewData?.activeCampaigns || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-messages-sent">
              {overviewData?.totalSent?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {overviewData?.averageOpenRate?.toFixed(1) || 0}% open rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-conversions">
              {overviewData?.totalConverted || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {overviewData?.averageConversionRate?.toFixed(2) || 0}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-revenue">
              {formatCurrency(overviewData?.totalRevenue || 0, currency)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {(overviewData?.overallROI || 0) >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              {overviewData?.overallROI?.toFixed(1) || 0}% ROI
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="cart-recovery" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cart-recovery" data-testid="tab-cart-recovery">
            Cart Recovery
          </TabsTrigger>
          <TabsTrigger value="ab-tests" data-testid="tab-ab-tests">
            A/B Tests
          </TabsTrigger>
          <TabsTrigger value="safety" data-testid="tab-safety">
            Safety & Compliance
          </TabsTrigger>
        </TabsList>

        {/* Cart Recovery Tab */}
        <TabsContent value="cart-recovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Cart Recovery Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCartStats ? (
                <div className="text-center text-muted-foreground py-8">
                  Loading cart recovery stats...
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-cart-sequences">
                      {cartStatsData?.totalSequences || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Sequences</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-cart-converted">
                      {cartStatsData?.convertedSequences || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Converted</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-cart-conversion-rate">
                      {cartStatsData?.conversionRate?.toFixed(1) || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-cart-avg-time">
                      {cartStatsData?.averageRecoveryTime?.toFixed(0) || 0}h
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. Recovery Time</div>
                  </div>
                </div>
              )}
              
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Enabled</span>
                  <Badge variant={settingsData?.cartRecoveryEnabled ? "default" : "secondary"}>
                    {settingsData?.cartRecoveryEnabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Min Cart Value</span>
                  <span className="font-medium">{formatCurrency(settingsData?.minCartValue || 0, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Max Attempts</span>
                  <span className="font-medium">{settingsData?.maxRecoveryAttempts || 3}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* A/B Tests Tab */}
        <TabsContent value="ab-tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active A/B Tests</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTests ? (
                <div className="text-center text-muted-foreground py-8">
                  Loading A/B tests...
                </div>
              ) : !abTestsData || abTestsData.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No active A/B tests. Tests are created automatically when marketing rules trigger.
                </div>
              ) : (
                <div className="space-y-4">
                  {abTestsData.map((test: any) => (
                    <div 
                      key={test.testId} 
                      className="border rounded-lg p-4 space-y-3"
                      data-testid={`ab-test-${test.testId}`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{test.testName}</h4>
                        <Badge variant={test.status === 'active' ? 'default' : 'secondary'}>
                          {test.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        {test.variants?.map((variant: any, idx: number) => (
                          <div 
                            key={idx}
                            className={`p-2 rounded ${
                              test.winner === variant.name 
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                                : 'bg-muted'
                            }`}
                          >
                            <div className="font-medium flex items-center justify-between">
                              {variant.name}
                              {test.winner === variant.name && (
                                <Badge variant="default" className="text-xs">Winner</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Sent: {variant.sentCount}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Open: {variant.openRate?.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Click: {variant.clickRate?.toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>

                      {test.winner && test.confidence && (
                        <div className="text-sm text-muted-foreground">
                          Confidence: {test.confidence.toFixed(1)}% improvement
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Safety & Compliance Tab */}
        <TabsContent value="safety" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Safety Guardrails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Frequency Caps</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between p-2 rounded bg-muted">
                    <span className="text-muted-foreground">Daily Limit</span>
                    <span className="font-medium">3 messages</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted">
                    <span className="text-muted-foreground">Weekly Limit</span>
                    <span className="font-medium">5 messages</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Quiet Hours</h4>
                <div className="flex items-center justify-between p-2 rounded bg-muted text-sm">
                  <span className="text-muted-foreground">Active Hours</span>
                  <span className="font-medium">9 AM - 9 PM (Local Time)</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Compliance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>GDPR consent validation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Unsubscribe list checking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Channel preference respect</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full" data-testid="button-view-logs">
                  View Safety Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
