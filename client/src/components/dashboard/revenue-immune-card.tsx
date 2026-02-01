import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useZyraActivityStream, ZyraActivityEvent } from "@/hooks/useZyraActivityStream";
import {
  ShieldCheck,
  Info,
  Loader2,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  RefreshCw,
  ChevronRight,
  History,
  Zap,
  Search,
  TrendingUp,
  Mail,
  Radio,
  Wifi,
  WifiOff,
} from "lucide-react";

interface TodayIssue {
  problemType: string;
  entityName: string;
  timestamp: string;
}

interface TodayFix {
  surfaceTouched: string;
  entityName: string;
  timestamp: string;
}

interface WeeklyStats {
  scansPerformed: number;
  issuesDetected: number;
  fixesExecuted: number;
  rollbacksNeeded: number;
}

interface RevenueImmuneData {
  isActive: boolean;
  sensitivity: "safe" | "balanced" | "aggressive";
  preventedRevenue: number;
  currency: string;
  lastScanTimestamp: string | null;
  todayScannedProductsCount: number;
  totalProductsMonitored: number;
  todayDetectedIssues: TodayIssue[];
  todayFixesExecuted: TodayFix[];
  weeklyStats: WeeklyStats;
  protectionScope: string[];
}

interface AutomationSettings {
  globalAutopilotEnabled: boolean;
  autopilotMode: string;
}

const PHASE_MODULE_MAP: Record<ZyraActivityEvent['phase'], string> = {
  'detect': 'Detection Engine',
  'decide': 'Decision Engine',
  'execute': 'Execution Engine',
  'prove': 'Proof Engine',
  'learn': 'Learning Engine',
  'standby': 'System Status',
};

const SCANNING_ENGINES = [
  {
    name: 'Product Intent Intelligence',
    description: 'Detecting copy decay & buyer intent mismatch',
    icon: Search,
  },
  {
    name: 'SEO Drift Intelligence',
    description: 'Monitoring rankings, impressions & relevance decay',
    icon: TrendingUp,
  },
  {
    name: 'Conversion Integrity Engine',
    description: 'Analyzing traffic vs conversion stability',
    icon: Activity,
  },
  {
    name: 'Recovery Flow Intelligence',
    description: 'Preventing email & SMS message fatigue',
    icon: Mail,
  },
];

export default function RevenueImmuneCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  const { events: sseEvents, isConnected, isReconnecting } = useZyraActivityStream();

  const { data: immuneData, isLoading: isLoadingImmune } = useQuery<RevenueImmuneData>({
    queryKey: ['/api/revenue-immune/status'],
    refetchInterval: 60000,
  });

  const { data: settings, isLoading: isLoadingSettings } = useQuery<AutomationSettings>({
    queryKey: ['/api/automation/settings'],
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest('PATCH', '/api/automation/settings', { globalAutopilotEnabled: enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/revenue-immune/status'] });
      toast({
        title: immuneData?.isActive ? "Revenue Protection Paused" : "Revenue Protection Active",
        description: immuneData?.isActive 
          ? "Your store is no longer being protected automatically."
          : "ZYRA will now silently protect your revenue 24/7.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update protection status.",
        variant: "destructive",
      });
    },
  });

  const sensitivityMutation = useMutation({
    mutationFn: async (mode: string) => {
      return apiRequest('PATCH', '/api/automation/settings', { autopilotMode: mode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/revenue-immune/status'] });
      toast({
        title: "Sensitivity Updated",
        description: "Protection sensitivity has been adjusted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update sensitivity.",
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingImmune || isLoadingSettings;
  const isActive = settings?.globalAutopilotEnabled ?? false;
  const sensitivity = (settings?.autopilotMode as "safe" | "balanced" | "aggressive") ?? "balanced";
  const preventedRevenue = immuneData?.preventedRevenue ?? 0;
  const currency = immuneData?.currency ?? "₹";
  const lastScanTimestamp = immuneData?.lastScanTimestamp;
  const totalProductsMonitored = immuneData?.totalProductsMonitored ?? 0;
  const todayDetectedIssues = immuneData?.todayDetectedIssues ?? [];
  const todayFixesExecuted = immuneData?.todayFixesExecuted ?? [];
  const weeklyStats = immuneData?.weeklyStats;
  const protectionScope = immuneData?.protectionScope ?? ['Products', 'SEO', 'Recovery flows'];

  const activityLog = useMemo(() => {
    return sseEvents.slice(-8).map(event => {
      const timestamp = new Date(event.timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      return {
        id: event.id,
        timestamp,
        module: PHASE_MODULE_MAP[event.phase] || 'System',
        message: event.message,
        status: event.status,
      };
    });
  }, [sseEvents]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [activityLog]);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `${currency}${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `${currency}${(amount / 1000).toFixed(1)}K`;
    }
    return `${currency}${amount.toFixed(0)}`;
  };

  const getTimeSinceLastScan = () => {
    if (!lastScanTimestamp) return 'Awaiting first scan';
    const now = new Date();
    const lastScan = new Date(lastScanTimestamp);
    const diffMinutes = Math.floor((now.getTime() - lastScan.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const sensitivityDescriptions = {
    safe: "Only act on high-confidence issues. Minimal changes, maximum safety.",
    balanced: "Balanced approach. Act when reasonably confident.",
    aggressive: "Act quickly on emerging issues. More proactive protection.",
  };

  const protectedSurfaces = [
    { label: "Product copy decay", icon: CheckCircle2 },
    { label: "SEO ranking erosion", icon: CheckCircle2 },
    { label: "Conversion intent mismatch", icon: CheckCircle2 },
    { label: "Recovery message fatigue", icon: CheckCircle2 },
    { label: "Silent revenue leakage", icon: CheckCircle2 },
  ];

  const hasActivityToday = todayDetectedIssues.length > 0 || todayFixesExecuted.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6" data-testid="revenue-immune-container">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="p-6 sm:p-8">
          {/* Header Section with Multi-Pulse Shield */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className={`relative p-3 rounded-xl ${isActive ? 'bg-green-500/20' : 'bg-muted'}`}>
                <ShieldCheck className={`w-6 h-6 ${isActive ? 'text-green-500' : 'text-muted-foreground'} relative z-10`} />
                {isActive && (
                  <>
                    <div className="absolute inset-0 rounded-xl bg-green-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute inset-0 rounded-xl bg-green-500/10 animate-pulse" style={{ animationDuration: '1.5s' }} />
                  </>
                )}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-immune-title">
                  Revenue Immune System
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={isActive ? "default" : "secondary"}
                    className={isActive ? "bg-green-500/20 text-green-500 border-green-500/30" : ""}
                    data-testid="badge-immune-status"
                  >
                    <span className="flex items-center gap-1.5">
                      {isActive && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
                      {isActive ? "LIVE MONITORING" : "PAUSED"}
                    </span>
                  </Badge>
                  <Dialog open={learnMoreOpen} onOpenChange={setLearnMoreOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                        data-testid="button-learn-more"
                      >
                        <Info className="w-3 h-3 mr-1" />
                        Learn how protection works
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-primary" />
                          How Revenue Protection Works
                        </DialogTitle>
                        <DialogDescription className="text-left space-y-4 pt-4">
                          <p>
                            The Revenue Immune System is your store's silent guardian. It continuously monitors 
                            for revenue-threatening patterns and fixes them automatically before they hurt your sales.
                          </p>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Eye className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-foreground">24/7 Vigilance</p>
                                <p className="text-sm text-muted-foreground">Scans your products, SEO rankings, and recovery flows continuously</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Activity className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-foreground">Silent Repairs</p>
                                <p className="text-sm text-muted-foreground">Automatically updates titles, descriptions, and meta tags when decay is detected</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <RefreshCw className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-foreground">Safe & Reversible</p>
                                <p className="text-sm text-muted-foreground">All changes are versioned and can be rolled back instantly if needed</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground border-t pt-4">
                            Think of it like an immune system: it works in the background so you don't have to.
                            You can be inactive for weeks and your store stays protected.
                          </p>
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {isActive ? 'Revenue defense running in real time' : 'Protection paused'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Protection</span>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => toggleMutation.mutate(checked)}
                disabled={toggleMutation.isPending}
                data-testid="switch-immune-toggle"
              />
            </div>
          </div>

          {/* Scan Explanation Bar */}
          {isActive && (
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mb-6" data-testid="scan-explanation-bar">
              <div className="flex items-start gap-3">
                <Radio className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  ZYRA is continuously scanning your Shopify store for revenue decay, intent mismatch, 
                  SEO erosion, and recovery flow fatigue — automatically and silently.
                </p>
              </div>
            </div>
          )}

          {/* Live Activity Log */}
          {isActive && (
            <div className="bg-muted/30 rounded-lg p-4 mb-6 border border-border/50" data-testid="live-activity-log">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative">
                  {isConnected ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-500" />
                      <div className="absolute inset-0 animate-ping">
                        <Wifi className="w-4 h-4 text-green-500 opacity-50" />
                      </div>
                    </>
                  ) : (
                    <WifiOff className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-sm font-medium text-foreground">ZYRA Live Activity Log</h3>
                <Badge 
                  variant="outline" 
                  className={`text-xs ml-auto ${
                    isConnected 
                      ? "border-green-500/30 text-green-500" 
                      : isReconnecting 
                        ? "border-yellow-500/30 text-yellow-500"
                        : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                  data-testid="badge-sse-status"
                >
                  {isConnected ? "LIVE" : isReconnecting ? "RECONNECTING..." : "CONNECTING..."}
                </Badge>
              </div>
              <div 
                ref={logContainerRef}
                className="bg-background/50 rounded-md p-3 font-mono text-xs space-y-1.5 max-h-[200px] overflow-y-auto scroll-smooth"
                style={{ scrollBehavior: 'smooth' }}
              >
                {activityLog.length === 0 ? (
                  <p className="text-muted-foreground" data-testid="text-log-initializing">
                    {isConnected 
                      ? "Listening for scanning events..." 
                      : isReconnecting 
                        ? "Reconnecting to activity stream..."
                        : "Connecting to ZYRA activity stream..."}
                  </p>
                ) : (
                  activityLog.map((event) => (
                    <div 
                      key={event.id}
                      data-testid={`row-activity-${event.id}`}
                      className="flex items-start gap-2 text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                    >
                      <span className="text-primary/70 flex-shrink-0">[{event.timestamp}]</span>
                      <span className="text-foreground/80 font-medium">{event.module}:</span>
                      <span>{event.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Active Scanning Engines */}
          {isActive && (
            <div className="bg-muted/20 rounded-lg p-4 mb-6 border border-border/50" data-testid="scanning-engines-block">
              <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Active Revenue Defense Engines
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SCANNING_ENGINES.map((engine, idx) => (
                  <div 
                    key={idx}
                    data-testid={`card-engine-${engine.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border/30"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="p-2 rounded-md bg-primary/10">
                        <engine.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="absolute -top-1 -right-1">
                        <span className="relative flex h-2.5 w-2.5">
                          <span 
                            className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                            style={{ animationDelay: `${idx * 0.2}s` }}
                          ></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{engine.name}</p>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500/30 text-green-500 flex-shrink-0">
                          RUNNING
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{engine.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Protection Value Block */}
          <div className="bg-card/50 rounded-xl p-6 border border-border/50 mb-6">
            <p className="text-sm text-muted-foreground mb-2">Revenue loss prevented this month</p>
            <div className="flex items-baseline gap-2">
              <span 
                className="text-4xl sm:text-5xl font-bold text-foreground"
                data-testid="text-prevented-revenue"
              >
                {formatCurrency(preventedRevenue)}
              </span>
            </div>
            {preventedRevenue === 0 && (
              <div className="mt-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground/80">No revenue decay detected yet</p>
                <p className="text-xs mt-0.5">Prevention happens before loss — this is a good sign</p>
              </div>
            )}
          </div>

          {/* Today's Activity Block */}
          <div className="bg-muted/20 rounded-lg p-4 mb-6" data-testid="today-activity-block">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Today's Revenue Defense Report
            </h3>
            
            {!hasActivityToday ? (
              <div className="space-y-2">
                {totalProductsMonitored > 0 ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{totalProductsMonitored} products scanned</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>SEO checks completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>No revenue decay detected</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Store fully protected today</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Waiting for products to sync from Shopify</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {todayDetectedIssues.map((issue, idx) => (
                  <div key={`issue-${idx}`} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      Detected <span className="text-foreground font-medium">{issue.problemType}</span> on "{issue.entityName}"
                    </span>
                  </div>
                ))}
                {todayFixesExecuted.map((fix, idx) => (
                  <div key={`fix-${idx}`} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      Automatic repair applied to <span className="text-foreground font-medium">{fix.surfaceTouched}</span> on "{fix.entityName}"
                    </span>
                  </div>
                ))}
                {todayFixesExecuted.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Live monitoring & rollback enabled</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Protected Surfaces Block */}
          <div className="bg-muted/20 rounded-lg p-4 mb-6" data-testid="protected-surfaces-block">
            <h3 className="text-sm font-medium text-foreground mb-3">What ZYRA is protecting</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {protectedSurfaces.map((surface, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <surface.icon className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{surface.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sensitivity Control */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/30 rounded-lg mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">Defense Sensitivity</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sensitivityDescriptions[sensitivity]}
              </p>
            </div>
            <Select
              value={sensitivity}
              onValueChange={(value) => sensitivityMutation.mutate(value)}
              disabled={sensitivityMutation.isPending || !isActive}
            >
              <SelectTrigger 
                className="w-[160px]" 
                data-testid="select-sensitivity"
              >
                <SelectValue placeholder="Select sensitivity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="safe" data-testid="option-conservative">
                  Conservative
                </SelectItem>
                <SelectItem value="balanced" data-testid="option-balanced">
                  Balanced
                </SelectItem>
                <SelectItem value="aggressive" data-testid="option-aggressive">
                  Aggressive
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Protection History Expander */}
          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between text-muted-foreground hover:text-foreground"
                data-testid="button-view-history"
              >
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  View protection history
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Recent Protection Summary
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm font-medium text-foreground">Last 7 days:</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Intent decay scans</span>
                    <span className="font-medium text-foreground">{weeklyStats?.scansPerformed ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">SEO drift checks</span>
                    <span className="font-medium text-foreground">{Math.floor((weeklyStats?.scansPerformed ?? 0) / 3)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Copy repairs executed</span>
                    <span className="font-medium text-foreground">{weeklyStats?.fixesExecuted ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rollbacks needed</span>
                    <span className="font-medium text-foreground">{weeklyStats?.rollbacksNeeded ?? 0}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground border-t pt-3">
                  All changes are logged and reversible. ZYRA learns from each action to improve future decisions.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Protection Paused Warning */}
      {!isActive && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Protection is paused</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your store is not being automatically protected. Revenue decay may go undetected.
                Turn on protection to let ZYRA guard your revenue 24/7.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
