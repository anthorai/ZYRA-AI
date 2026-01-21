import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  RefreshCw, 
  Brain, 
  TrendingUp, 
  Shield, 
  Clock, 
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  History
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/ui/standardized-layout";

interface RevenueLoopSettings {
  globalAutopilotEnabled: boolean;
  autopilotEnabled: boolean;
  autopilotMode: 'safe' | 'balanced' | 'aggressive';
  powerModeEnabled: boolean;
  autoPublishEnabled: boolean;
  maxDailyActions: number;
}

interface RevenueLoopStats {
  signalsDetected: number;
  opportunitiesPending: number;
  opportunitiesExecuting: number;
  opportunitiesProving: number;
  successfulOptimizations: number;
  totalRevenueLift: number;
  insightsLearned: number;
}

interface RecentOpportunity {
  id: string;
  opportunityType: string;
  entityId: string;
  entityType: string;
  status: string;
  priorityScore: number;
  estimatedRevenueLift: string;
  createdAt: string;
}

export default function RevenueLoopControls() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: settings, isLoading: loadingSettings } = useQuery<RevenueLoopSettings>({
    queryKey: ['/api/automation/settings'],
  });

  const { data: stats, isLoading: loadingStats } = useQuery<RevenueLoopStats>({
    queryKey: ['/api/revenue-loop/stats'],
    retry: false,
  });

  const { data: opportunities, isLoading: loadingOpportunities } = useQuery<RecentOpportunity[]>({
    queryKey: ['/api/revenue-loop/opportunities'],
    retry: false,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<RevenueLoopSettings>) => {
      return await apiRequest('PUT', '/api/automation/settings', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/settings'] });
      toast({
        title: "Settings updated",
        description: "Your revenue loop settings have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleToggleAutopilot = async (enabled: boolean) => {
    await updateSettings.mutateAsync({ autopilotEnabled: enabled });
  };

  const handleModeChange = async (mode: string) => {
    await updateSettings.mutateAsync({ autopilotMode: mode as 'safe' | 'balanced' | 'aggressive' });
  };

  const handleTogglePowerMode = async (enabled: boolean) => {
    await updateSettings.mutateAsync({ powerModeEnabled: enabled });
  };

  if (loadingSettings) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      </PageContainer>
    );
  }

  const isEnabled = settings?.autopilotEnabled || false;
  const mode = settings?.autopilotMode || 'safe';

  const getModeDescription = (m: string) => {
    switch (m) {
      case 'safe': return 'Only executes high-confidence opportunities with proven patterns';
      case 'balanced': return 'Balanced risk-reward approach with moderate confidence threshold';
      case 'aggressive': return 'Maximum optimization speed with lower confidence requirements';
      default: return '';
    }
  };

  const getModeColor = (m: string) => {
    switch (m) {
      case 'safe': return 'text-green-500';
      case 'balanced': return 'text-yellow-500';
      case 'aggressive': return 'text-orange-500';
      default: return 'text-muted-foreground';
    }
  };

  const loopPhases = [
    { id: 'detect', name: 'Detect', icon: <Target className="w-4 h-4" />, description: 'Scan for revenue opportunities' },
    { id: 'decide', name: 'Decide', icon: <Brain className="w-4 h-4" />, description: 'Prioritize by Revenue Score' },
    { id: 'execute', name: 'Execute', icon: <Zap className="w-4 h-4" />, description: 'Apply safe optimizations' },
    { id: 'prove', name: 'Prove', icon: <TrendingUp className="w-4 h-4" />, description: 'Measure revenue impact' },
    { id: 'learn', name: 'Learn', icon: <History className="w-4 h-4" />, description: 'Build store patterns' },
  ];

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <RefreshCw className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Revenue Loop</h1>
              <p className="text-muted-foreground">
                Autonomous revenue optimization with continuous learning
              </p>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className={`w-5 h-5 ${isEnabled ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
                <div>
                  <CardTitle>Revenue Loop Status</CardTitle>
                  <CardDescription>
                    {isEnabled ? 'Actively optimizing your store' : 'Enable to start autonomous optimization'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={isEnabled ? 'default' : 'secondary'} className={isEnabled ? 'bg-green-500' : ''}>
                  {isEnabled ? 'Active' : 'Inactive'}
                </Badge>
                <Switch
                  id="revenue-loop-toggle"
                  data-testid="switch-revenue-loop"
                  checked={isEnabled}
                  onCheckedChange={handleToggleAutopilot}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {loopPhases.map((phase, index) => (
                <div key={phase.id} className="flex items-center">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isEnabled ? 'bg-primary/5 border-primary/20' : 'bg-muted border-muted'}`}>
                    <div className={isEnabled ? 'text-primary' : 'text-muted-foreground'}>
                      {phase.icon}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{phase.name}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block">{phase.description}</div>
                    </div>
                  </div>
                  {index < loopPhases.length - 1 && (
                    <div className={`mx-1 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`}>
                      →
                    </div>
                  )}
                </div>
              ))}
              <div className={`mx-1 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`}>↻</div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card data-testid="card-signals-detected">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Signals Detected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-signals-detected">{stats?.signalsDetected || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Revenue opportunities found</p>
                </CardContent>
              </Card>

              <Card data-testid="card-pending-actions">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-pending-actions">{stats?.opportunitiesPending || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Waiting for execution</p>
                </CardContent>
              </Card>

              <Card data-testid="card-executing">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Executing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500" data-testid="stat-executing">{stats?.opportunitiesExecuting || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Optimizations in progress</p>
                </CardContent>
              </Card>

              <Card data-testid="card-proving">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Proving</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-500" data-testid="stat-proving">{stats?.opportunitiesProving || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Measuring revenue impact</p>
                </CardContent>
              </Card>

              <Card data-testid="card-successful-optimizations">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Successful Optimizations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500" data-testid="stat-successful-optimizations">{stats?.successfulOptimizations || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Proven revenue impact</p>
                </CardContent>
              </Card>

              <Card data-testid="card-patterns-learned">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Patterns Learned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500" data-testid="stat-patterns-learned">{stats?.insightsLearned || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Store-specific insights</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Revenue Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Revenue loop is building your store's optimization profile.</p>
                  <p className="text-sm mt-2">Results will appear as optimizations complete their proof window.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Optimization Mode
                </CardTitle>
                <CardDescription>
                  Control how aggressively the revenue loop optimizes your store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mode-select">Risk Tolerance</Label>
                  <Select value={mode} onValueChange={handleModeChange}>
                    <SelectTrigger id="mode-select" data-testid="select-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safe">Safe Mode</SelectItem>
                      <SelectItem value="balanced">Balanced Mode</SelectItem>
                      <SelectItem value="aggressive">Aggressive Mode</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className={`text-sm ${getModeColor(mode)}`}>
                    {getModeDescription(mode)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Auto-Rollback</div>
                      <div className="text-xs text-muted-foreground">
                        Automatically reverts changes with negative impact
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">72h Proof Window</div>
                      <div className="text-xs text-muted-foreground">
                        Measures impact before permanent changes
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Shield className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Snapshot Backup</div>
                      <div className="text-xs text-muted-foreground">
                        Full product state saved before any change
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-power-mode-settings">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Power Mode
                  <Badge variant="secondary" className="ml-2">Premium</Badge>
                </CardTitle>
                <CardDescription>
                  Use real-time Google SERP analysis + GPT-4o for advanced optimizations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <Label htmlFor="power-mode-toggle">Enable Power Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Analyze top-ranking competitors and generate content to outrank them (5 credits per optimization)
                    </p>
                  </div>
                  <Switch
                    id="power-mode-toggle"
                    data-testid="switch-power-mode"
                    checked={settings?.powerModeEnabled || false}
                    onCheckedChange={handleTogglePowerMode}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Target className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">SERP Intelligence</div>
                      <div className="text-xs text-muted-foreground">
                        Analyzes top 10 Google results in real-time
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Brain className="w-5 h-5 text-purple-500 dark:text-purple-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">GPT-4o Analysis</div>
                      <div className="text-xs text-muted-foreground">
                        Premium AI generates competitive content
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Learning Settings
                </CardTitle>
                <CardDescription>
                  How the system learns from your store's performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <Label>Store Pattern Learning</Label>
                      <p className="text-sm text-muted-foreground">
                        Learn what works best for your specific store and products
                      </p>
                    </div>
                    <Badge variant="secondary">Always On</Badge>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <Label>Avoid Failed Patterns</Label>
                      <p className="text-sm text-muted-foreground">
                        Don't repeat optimization types that historically failed
                      </p>
                    </div>
                    <Badge variant="secondary">Always On</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Optimizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!opportunities || opportunities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No optimizations yet.</p>
                    <p className="text-sm mt-2">Optimizations will appear here as the revenue loop runs.</p>
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="list-opportunities">
                    {opportunities.map((opp) => (
                      <div key={opp.id} className="flex items-center justify-between p-3 rounded-lg border" data-testid={`row-opportunity-${opp.id}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${opp.status === 'completed' ? 'bg-green-100 text-green-600' : opp.status === 'proving' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            {opp.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : opp.status === 'proving' ? <Clock className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-medium text-sm" data-testid={`text-opportunity-type-${opp.id}`}>{opp.opportunityType.replace(/_/g, ' ')}</div>
                            <div className="text-xs text-muted-foreground" data-testid={`text-opportunity-details-${opp.id}`}>
                              Priority: {opp.priorityScore}/100 | Est. Lift: ${opp.estimatedRevenueLift}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" data-testid={`badge-status-${opp.id}`}>{opp.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
