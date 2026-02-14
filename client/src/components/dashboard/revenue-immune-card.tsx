import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StoreReadiness } from "@shared/schema";
import { ShopifyConnectionGate, WarmUpMode } from "@/components/zyra/store-connection-gate";
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
import { useZyraActivity, ZyraActivityEvent } from "@/contexts/ZyraActivityContext";
import { useStoreCurrency } from "@/hooks/use-store-currency";
import { getCurrencySymbol } from "@/lib/utils";
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
  Pause,
  Search,
  TrendingUp,
  Mail,
  Radio,
  Wifi,
  WifiOff,
  Lock,
  Wrench,
  SlidersHorizontal,
  Radar,
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
    id: 'product-intent',
    name: 'Product Intent Intelligence',
    shortName: 'INTENT',
    description: 'Detecting copy decay & buyer intent mismatch',
    icon: Search,
    keywords: ['product', 'copy', 'description', 'intent', 'detect', 'decision'],
  },
  {
    id: 'seo-drift',
    name: 'SEO Drift Intelligence',
    shortName: 'SEO',
    description: 'Monitoring rankings, impressions & relevance decay',
    icon: TrendingUp,
    keywords: ['seo', 'ranking', 'search', 'keyword', 'meta', 'title'],
  },
  {
    id: 'conversion-integrity',
    name: 'Conversion Integrity Engine',
    shortName: 'CONV',
    description: 'Analyzing traffic vs conversion stability',
    icon: Activity,
    keywords: ['conversion', 'traffic', 'execute', 'optimize', 'proof', 'prove'],
  },
  {
    id: 'recovery-flow',
    name: 'Recovery Flow Intelligence',
    shortName: 'RCVR',
    description: 'Preventing email & SMS message fatigue',
    icon: Mail,
    keywords: ['email', 'sms', 'cart', 'recover', 'message', 'campaign', 'learn'],
  },
];

const SYSTEM_CAPABILITIES = [
  {
    icon: Clock,
    title: '24/7 Monitoring',
    description: 'Always-on autonomous protection',
    color: 'text-blue-500',
  },
  {
    icon: Shield,
    title: '4 Defense Engines',
    description: 'Multi-layer revenue protection',
    color: 'text-green-500',
  },
  {
    icon: Radar,
    title: 'Auto Detection',
    description: 'Issues found before impact',
    color: 'text-amber-500',
  },
  {
    icon: Wrench,
    title: 'Silent Repairs',
    description: 'Automatic fixes applied',
    color: 'text-purple-500',
  },
  {
    icon: TrendingUp,
    title: 'Revenue Tracking',
    description: 'Prevention value measured',
    color: 'text-emerald-500',
  },
  {
    icon: SlidersHorizontal,
    title: 'Configurable',
    description: 'Adjust sensitivity levels',
    color: 'text-cyan-500',
  },
  {
    icon: Radio,
    title: 'Real-Time Stream',
    description: 'Live SSE activity feed',
    color: 'text-pink-500',
  },
];

export default function RevenueImmuneCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [connectionElapsed, setConnectionElapsed] = useState(0);
  const connectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { events: sseEvents, isConnected, isReconnecting, retryCount } = useZyraActivity();

  const { data: storeReadiness, isLoading: isReadinessLoading } = useQuery<StoreReadiness>({
    queryKey: ['/api/store-readiness'],
    refetchInterval: 30000,
  });

  // Track connection elapsed time
  useEffect(() => {
    if (isConnected) {
      setConnectionElapsed(0);
      if (connectionTimerRef.current) {
        clearInterval(connectionTimerRef.current);
        connectionTimerRef.current = null;
      }
    } else {
      if (!connectionTimerRef.current) {
        connectionTimerRef.current = setInterval(() => {
          setConnectionElapsed(prev => prev + 1);
        }, 1000);
      }
    }
    return () => {
      if (connectionTimerRef.current) {
        clearInterval(connectionTimerRef.current);
      }
    };
  }, [isConnected]);

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

  const isLoading = isLoadingImmune || isLoadingSettings || isReadinessLoading;
  const isActive = settings?.globalAutopilotEnabled ?? false;
  const sensitivity = (settings?.autopilotMode as "safe" | "balanced" | "aggressive") ?? "balanced";
  const preventedRevenue = immuneData?.preventedRevenue ?? 0;
  const { currency: storeCurrency } = useStoreCurrency();
  const currencySymbol = getCurrencySymbol(storeCurrency);
  const lastScanTimestamp = immuneData?.lastScanTimestamp;
  const totalProductsMonitored = immuneData?.totalProductsMonitored ?? 0;
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

  // Map SSE events to engines based on keywords
  const engineActivity = useMemo(() => {
    const activity: Record<string, { lastEvent: ZyraActivityEvent | null; recentCount: number }> = {};
    
    SCANNING_ENGINES.forEach(engine => {
      activity[engine.id] = { lastEvent: null, recentCount: 0 };
    });

    // Look at last 20 events to map to engines
    const recentEvents = sseEvents.slice(-20);
    
    recentEvents.forEach(event => {
      const messageLower = event.message.toLowerCase();
      const phaseLower = event.phase.toLowerCase();
      
      SCANNING_ENGINES.forEach(engine => {
        const matched = engine.keywords.some(keyword => 
          messageLower.includes(keyword) || phaseLower.includes(keyword)
        );
        if (matched) {
          activity[engine.id].lastEvent = event;
          activity[engine.id].recentCount++;
        }
      });
    });

    return activity;
  }, [sseEvents]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [activityLog]);

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `${currencySymbol}${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `${currencySymbol}${(amount / 1000).toFixed(1)}K`;
    }
    return `${currencySymbol}${amount.toFixed(0)}`;
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
    { label: "Product Copy Decay", description: "Content freshness monitoring", icon: Search, color: "text-blue-400", bgColor: "bg-blue-500/15", borderColor: "border-l-blue-500", accentBg: "bg-blue-500/5" },
    { label: "SEO Ranking Erosion", description: "Search visibility tracking", icon: TrendingUp, color: "text-emerald-400", bgColor: "bg-emerald-500/15", borderColor: "border-l-emerald-500", accentBg: "bg-emerald-500/5" },
    { label: "Conversion Mismatch", description: "Buyer intent alignment", icon: Activity, color: "text-purple-400", bgColor: "bg-purple-500/15", borderColor: "border-l-purple-500", accentBg: "bg-purple-500/5" },
    { label: "Message Fatigue", description: "Recovery flow optimization", icon: Mail, color: "text-orange-400", bgColor: "bg-orange-500/15", borderColor: "border-l-orange-500", accentBg: "bg-orange-500/5" },
    { label: "Revenue Leakage", description: "Silent loss detection", icon: Shield, color: "text-rose-400", bgColor: "bg-rose-500/15", borderColor: "border-l-rose-500", accentBg: "bg-rose-500/5" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (storeReadiness?.state === 'not_connected') {
    return <ShopifyConnectionGate readiness={storeReadiness} />;
  }

  if (storeReadiness?.state === 'warming_up') {
    return <WarmUpMode readiness={storeReadiness} />;
  }

  return (
    <div className="space-y-4 p-4 sm:p-6" data-testid="revenue-immune-container">
      <Card className="overflow-hidden border-slate-700/60 bg-[#0d0d1a]">
        <CardContent className="p-0">
          {/* LAYER 1 — SYSTEM STATUS BAR (MOST IMPORTANT) */}
          <div className={`px-6 sm:px-8 py-5 border-b ${
            isActive 
              ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20' 
              : 'bg-gradient-to-r from-amber-500/8 via-amber-500/3 to-transparent border-amber-500/15'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`relative p-3.5 rounded-xl ${isActive ? 'bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-amber-500/15'}`}>
                  <ShieldCheck className={`w-7 h-7 ${isActive ? 'text-emerald-400' : 'text-amber-400'} relative z-10`} />
                  {isActive && (
                    <>
                      <div className="absolute inset-0 rounded-xl bg-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                      <div className="absolute inset-0 rounded-xl bg-emerald-500/10 animate-pulse" style={{ animationDuration: '1.5s' }} />
                    </>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold text-white" data-testid="text-immune-title">
                      Revenue Immune System
                    </h2>
                    <Badge 
                      className={`text-xs font-bold uppercase tracking-wider px-3 py-1 ${
                        !isActive 
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                          : isConnected 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                            : isReconnecting 
                              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                              : 'bg-slate-500/20 text-slate-400 border-slate-500/40'
                      }`}
                      data-testid="badge-immune-status"
                    >
                      <span className="flex items-center gap-1.5">
                        {isActive && isConnected && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        )}
                        {isActive && isReconnecting && !isConnected && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-pulse inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                          </span>
                        )}
                        {!isActive 
                          ? "PAUSED" 
                          : isConnected 
                            ? "LIVE" 
                            : isReconnecting 
                              ? "RECONNECTING" 
                              : "CONNECTING"}
                      </span>
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-sm text-slate-400">
                      {!isActive 
                        ? 'Protection paused — your store is unguarded' 
                        : isConnected 
                          ? 'Revenue defense running in real time' 
                          : isReconnecting 
                            ? 'Reconnecting to monitoring system...'
                            : 'Establishing connection to monitoring system...'}
                    </p>
                    <Dialog open={learnMoreOpen} onOpenChange={setLearnMoreOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs text-slate-500"
                          data-testid="button-learn-more"
                        >
                          <Info className="w-3 h-3 mr-1" />
                          Learn more
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
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white tracking-wide uppercase">Protection</span>
                <button
                  onClick={() => toggleMutation.mutate(!isActive)}
                  disabled={toggleMutation.isPending}
                  className={`relative flex items-center rounded-full p-1 w-[88px] h-[40px] transition-all duration-300 cursor-pointer border-2 ${
                    isActive 
                      ? 'bg-emerald-500/20 border-emerald-500/50' 
                      : 'bg-red-500/20 border-red-500/40'
                  } ${toggleMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  data-testid="switch-immune-toggle"
                >
                  <span className={`absolute left-2.5 text-[10px] font-bold uppercase tracking-wider transition-opacity duration-200 ${
                    isActive ? 'opacity-100 text-emerald-400' : 'opacity-0'
                  }`}>ON</span>
                  <span className={`absolute right-2.5 text-[10px] font-bold uppercase tracking-wider transition-opacity duration-200 ${
                    !isActive ? 'opacity-100 text-red-400' : 'opacity-0'
                  }`}>OFF</span>
                  <div className={`w-8 h-8 rounded-full transition-all duration-300 flex items-center justify-center ${
                    isActive 
                      ? 'translate-x-[48px] bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
                      : 'translate-x-0 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                  }`}>
                    {isActive 
                      ? <Zap className="w-4 h-4 text-white" />
                      : <Pause className="w-4 h-4 text-white" />
                    }
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">

          {/* LAYER 2 — PRIMARY METRIC (Revenue Impact) */}
          <div className={`rounded-xl p-6 sm:p-8 text-center ${
            isActive 
              ? 'bg-gradient-to-br from-emerald-500/8 via-[#111125] to-[#111125] border border-emerald-500/15' 
              : 'bg-[#111125] border border-slate-700/40'
          }`}>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-3">Revenue loss prevented this month</p>
            <div className="flex items-baseline justify-center gap-1">
              <span 
                className={`text-5xl sm:text-6xl font-black tracking-tight ${isActive ? 'text-emerald-400' : 'text-white'}`}
                style={isActive && preventedRevenue > 0 ? { textShadow: '0 0 30px rgba(16,185,129,0.3)' } : undefined}
                data-testid="text-prevented-revenue"
              >
                {formatCompactCurrency(preventedRevenue)}
              </span>
            </div>
            {preventedRevenue === 0 && (
              <div className="mt-4">
                <p className="text-sm text-slate-300 font-medium">No sales attributed yet</p>
                <p className="text-xs text-slate-500 mt-1">Revenue will appear here when customers buy products ZYRA has optimized</p>
              </div>
            )}
          </div>

          {/* Scan Explanation Bar */}
          {isActive && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-4" data-testid="scan-explanation-bar">
              <div className="flex items-start gap-3">
                <Radio className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <p className="text-sm text-slate-400">
                  ZYRA is continuously scanning your Shopify store for revenue decay, intent mismatch, 
                  SEO erosion, and recovery flow fatigue -- automatically and silently.
                </p>
              </div>
            </div>
          )}

          {/* Live Activity Log - Terminal Style */}
          {isActive && (
            <div 
              className="rounded-[14px] overflow-hidden border border-slate-600/50" 
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}
              data-testid="live-activity-log"
            >
              {/* Terminal Top Bar */}
              <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  {/* macOS Window Buttons */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/90 shadow-[0_0_4px_rgba(239,68,68,0.5)]" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/90 shadow-[0_0_4px_rgba(234,179,8,0.5)]" />
                    <div className="w-3 h-3 rounded-full bg-green-500/90 shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
                  </div>
                  <span className="ml-3 text-xs font-mono text-slate-400 tracking-wide">ZYRA Activity Log</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Connection Status */}
                  <div className="flex items-center gap-1.5">
                    {isConnected ? (
                      <div className="relative">
                        <Wifi className="w-3.5 h-3.5 text-green-400" />
                        <div className="absolute inset-0 animate-ping">
                          <Wifi className="w-3.5 h-3.5 text-green-400 opacity-40" />
                        </div>
                      </div>
                    ) : (
                      <WifiOff className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span 
                      className={`text-[10px] font-mono uppercase tracking-wider ${
                        isConnected ? 'text-green-400' : isReconnecting ? 'text-yellow-400' : 'text-slate-500'
                      }`}
                      data-testid="badge-sse-status"
                    >
                      {isConnected ? "LIVE" : isReconnecting ? "RECONNECTING" : "CONNECTING"}
                    </span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>

              {/* Terminal Log Body */}
              <div 
                ref={logContainerRef}
                className="p-3 sm:p-4 font-mono text-[11px] sm:text-[13px] leading-relaxed"
                data-testid="log-body"
              >
                {activityLog.length === 0 ? (
                  <div className="space-y-2 sm:space-y-1.5">
                    {/* Line 1: Initializing */}
                    <div className="flex items-start gap-1.5 sm:gap-2 animate-in fade-in-0 duration-500">
                      <span className="text-cyan-400 flex-shrink-0">{'>_'}</span>
                      <span className="text-blue-300 flex-shrink-0">[INFO]</span>
                      <span className="text-slate-300 break-words">Initializing ZYRA monitoring engine...</span>
                    </div>
                    
                    {/* Line 2: Connection status */}
                    <div className="flex items-start gap-1.5 sm:gap-2 animate-in fade-in-0 duration-500 delay-150">
                      <span className="text-cyan-400 flex-shrink-0">{'>_'}</span>
                      <span className={`flex-shrink-0 ${isConnected ? 'text-green-400' : isReconnecting ? 'text-yellow-400' : 'text-cyan-300'}`}>
                        [{isConnected ? 'OK' : isReconnecting ? 'RETRY' : 'SYSTEM'}]
                      </span>
                      <span className="text-slate-300 break-words flex items-center gap-1 flex-wrap">
                        {isConnected ? (
                          <>
                            <span className="text-green-400">Connected</span>
                            <span className="hidden sm:inline">—</span>
                            <span>Listening for scanning events</span>
                            <span className="inline-flex gap-0.5 ml-1">
                              <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                              <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                              <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                            </span>
                          </>
                        ) : isReconnecting ? (
                          <>
                            <span className="text-yellow-400">Reconnecting</span>
                            {retryCount > 0 && (
                              <span className="text-slate-500 text-[10px]">(attempt {retryCount})</span>
                            )}
                            <span className="inline-flex gap-0.5 ml-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDuration: '0.6s' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDuration: '0.6s', animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDuration: '0.6s', animationDelay: '300ms' }} />
                            </span>
                          </>
                        ) : (
                          <>
                            <span>Establishing connection</span>
                            <span className="text-slate-500 text-[10px] ml-1">({connectionElapsed}s)</span>
                            <span className="inline-flex gap-0.5 ml-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDuration: '0.6s' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDuration: '0.6s', animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDuration: '0.6s', animationDelay: '300ms' }} />
                            </span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Line 3: Wait message or timeout warning */}
                    {!isConnected && (
                      <div className="flex items-start gap-1.5 sm:gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-300">
                        <span className="text-cyan-400 flex-shrink-0">{'>_'}</span>
                        {connectionElapsed >= 10 ? (
                          <>
                            <span className="text-amber-400 flex-shrink-0">[SLOW]</span>
                            <span className="text-amber-300 break-words text-[10px] sm:text-[12px]">
                              Connection taking longer than expected. Auto-retrying...
                              <span className="inline-block w-1.5 h-3 sm:h-4 bg-amber-400/70 animate-pulse ml-1" />
                            </span>
                          </>
                        ) : connectionElapsed >= 5 ? (
                          <>
                            <span className="text-yellow-400 flex-shrink-0">[WAIT]</span>
                            <span className="text-yellow-300 break-words text-[10px] sm:text-[12px]">
                              Taking longer than expected. Please wait...
                              <span className="inline-block w-1.5 h-3 sm:h-4 bg-yellow-400/70 animate-pulse ml-1" />
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-slate-500 flex-shrink-0">[WAIT]</span>
                            <span className="text-slate-400 break-words text-[10px] sm:text-[12px]">
                              Real-time stream will activate shortly
                              <span className="inline-block w-1.5 h-3 sm:h-4 bg-cyan-400/70 animate-pulse ml-1" />
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Line 4: Additional status when connection is slow */}
                    {!isConnected && connectionElapsed >= 5 && (
                      <div className="flex items-start gap-1.5 sm:gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                        <span className="text-cyan-400 flex-shrink-0">{'>_'}</span>
                        <span className="text-slate-600 flex-shrink-0">[DEBUG]</span>
                        <span className="text-slate-500 break-words text-[9px] sm:text-[11px]">
                          {connectionElapsed >= 15 
                            ? `Reconnection in progress... (${connectionElapsed}s elapsed)`
                            : connectionElapsed >= 10
                              ? 'Checking server availability...'
                              : 'Waiting for SSE endpoint response...'}
                        </span>
                      </div>
                    )}

                    {/* Line 5: Network hint when very slow */}
                    {!isConnected && connectionElapsed >= 15 && (
                      <div className="flex items-start gap-1.5 sm:gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                        <span className="text-cyan-400 flex-shrink-0">{'>_'}</span>
                        <span className="text-slate-600 flex-shrink-0">[HINT]</span>
                        <span className="text-slate-500 break-words text-[9px] sm:text-[11px]">
                          Check network connection or refresh page if issue persists
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {activityLog.map((event, index) => {
                      const isLast = index === activityLog.length - 1;
                      const logLevel = event.status === 'warning' ? 'WARNING'
                        : event.status === 'error' ? 'ERROR'
                        : event.status === 'success' ? 'SUCCESS'
                        : event.module.includes('Detection') ? 'INFO' 
                        : event.module.includes('Decision') ? 'SYSTEM'
                        : event.module.includes('Execution') ? 'SUCCESS'
                        : event.module.includes('Proof') ? 'SUCCESS'
                        : event.module.includes('Learn') ? 'INFO'
                        : 'SYSTEM';
                      const levelColor = logLevel === 'INFO' ? 'text-blue-300'
                        : logLevel === 'SYSTEM' ? 'text-cyan-300'
                        : logLevel === 'SUCCESS' ? 'text-green-400'
                        : logLevel === 'WARNING' ? 'text-amber-400'
                        : logLevel === 'ERROR' ? 'text-red-400'
                        : 'text-amber-400';
                      
                      return (
                        <div 
                          key={event.id}
                          data-testid={`row-activity-${event.id}`}
                          className="flex items-start gap-2 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                          style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                        >
                          <span className="text-cyan-400 flex-shrink-0">{'>_'}</span>
                          <span className={`${levelColor} flex-shrink-0`}>[{logLevel}]</span>
                          <span className="text-slate-300">{event.message}</span>
                          {/* Typing cursor on last entry */}
                          {isLast && (
                            <span className="inline-block w-2 h-4 bg-cyan-400/80 animate-pulse ml-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Revenue Defense Engines - Terminal Style */}
          {isActive && (
            <div 
              className="rounded-[14px] overflow-hidden border border-slate-600/50"
              data-testid="scanning-engines-block"
            >
              {/* Terminal Header */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-3 sm:px-4 py-2.5 flex items-center justify-between border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  {/* macOS Window Buttons */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/90 shadow-[0_0_4px_rgba(239,68,68,0.5)]" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/90 shadow-[0_0_4px_rgba(234,179,8,0.5)]" />
                    <div className="w-3 h-3 rounded-full bg-green-500/90 shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
                  </div>
                  <span className="ml-3 text-[10px] sm:text-xs font-mono text-slate-400 tracking-wide">Revenue Defense Engines</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Global Connection Status */}
                  <div className="flex items-center gap-1.5">
                    {isConnected ? (
                      <div className="relative">
                        <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400" />
                        <div className="absolute inset-0 animate-ping">
                          <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400 opacity-40" />
                        </div>
                      </div>
                    ) : isReconnecting ? (
                      <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400 animate-pulse" />
                    ) : (
                      <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                    )}
                    <span 
                      className={`text-[9px] sm:text-[10px] font-mono uppercase tracking-wider ${
                        isConnected ? 'text-green-400' : isReconnecting ? 'text-yellow-400' : 'text-slate-500'
                      }`}
                    >
                      {isConnected ? "ALL LIVE" : isReconnecting ? "SYNCING" : "OFFLINE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Engine Grid Body */}
              <div className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-800 p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {SCANNING_ENGINES.map((engine, idx) => {
                    const activity = engineActivity[engine.id];
                    const hasRecentActivity = activity?.recentCount > 0;
                    const engineStatus = isConnected ? 'live' : isReconnecting ? 'connecting' : 'offline';
                    
                    return (
                      <div 
                        key={engine.id}
                        data-testid={`card-engine-${engine.id}`}
                        className="relative bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden group"
                      >
                        {/* Engine Header */}
                        <div className="flex items-center justify-between p-2.5 sm:p-3 border-b border-slate-700/30">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative flex-shrink-0">
                              <div className={`p-1.5 rounded-md ${
                                engineStatus === 'live' ? 'bg-green-500/10' : 
                                engineStatus === 'connecting' ? 'bg-yellow-500/10' : 'bg-slate-600/20'
                              }`}>
                                <engine.icon className={`w-3.5 h-3.5 ${
                                  engineStatus === 'live' ? 'text-green-400' : 
                                  engineStatus === 'connecting' ? 'text-yellow-400' : 'text-slate-500'
                                }`} />
                              </div>
                              {/* Status dot */}
                              <div className="absolute -top-0.5 -right-0.5">
                                {engineStatus === 'live' ? (
                                  <span className="relative flex h-2 w-2">
                                    <span 
                                      className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                                      style={{ animationDelay: `${idx * 200}ms` }}
                                    />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                  </span>
                                ) : engineStatus === 'connecting' ? (
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-pulse inline-flex rounded-full h-2 w-2 bg-yellow-500" />
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full h-2 w-2 bg-slate-600" />
                                )}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] sm:text-xs font-mono font-medium text-slate-200 truncate">
                                {engine.shortName}
                              </p>
                            </div>
                          </div>
                          {/* Status Badge */}
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono uppercase tracking-wider ${
                            engineStatus === 'live' 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                              : engineStatus === 'connecting'
                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                : 'bg-slate-600/20 text-slate-500 border border-slate-600/30'
                          }`}>
                            {engineStatus === 'live' ? (
                              <>
                                <span className="inline-flex gap-0.5">
                                  <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                                  <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                                </span>
                                <span>LIVE</span>
                              </>
                            ) : engineStatus === 'connecting' ? (
                              <>
                                <span className="inline-flex gap-0.5">
                                  <span className="w-1 h-1 rounded-full bg-yellow-400 animate-bounce" style={{ animationDuration: '0.6s' }} />
                                  <span className="w-1 h-1 rounded-full bg-yellow-400 animate-bounce" style={{ animationDuration: '0.6s', animationDelay: '150ms' }} />
                                </span>
                                <span>SYNC</span>
                              </>
                            ) : (
                              <span>OFFLINE</span>
                            )}
                          </div>
                        </div>

                        {/* Engine Activity Body */}
                        <div className="p-2.5 sm:p-3 font-mono text-[10px] sm:text-[11px] min-h-[52px]">
                          {hasRecentActivity && activity?.lastEvent ? (
                            <div className="flex items-start gap-1.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
                              <span className="text-cyan-400 flex-shrink-0">{'>_'}</span>
                              <span className="text-slate-400 break-words leading-relaxed">
                                {activity.lastEvent.message.length > 60 
                                  ? activity.lastEvent.message.substring(0, 60) + '...'
                                  : activity.lastEvent.message}
                              </span>
                              <span className="inline-block w-1.5 h-3 bg-cyan-400/70 animate-pulse ml-0.5 flex-shrink-0" />
                            </div>
                          ) : (
                            <div className="flex items-start gap-1.5">
                              <span className="text-slate-600 flex-shrink-0">{'>_'}</span>
                              <span className="text-slate-500 break-words leading-relaxed">
                                {engineStatus === 'live' 
                                  ? engine.description 
                                  : engineStatus === 'connecting'
                                    ? 'Syncing with monitoring system...'
                                    : 'Engine offline'}
                              </span>
                              {engineStatus === 'connecting' && (
                                <span className="inline-flex gap-0.5 ml-1 flex-shrink-0">
                                  <span className="w-1 h-1 rounded-full bg-yellow-400 animate-bounce" style={{ animationDuration: '0.6s' }} />
                                  <span className="w-1 h-1 rounded-full bg-yellow-400 animate-bounce" style={{ animationDuration: '0.6s', animationDelay: '150ms' }} />
                                  <span className="w-1 h-1 rounded-full bg-yellow-400 animate-bounce" style={{ animationDuration: '0.6s', animationDelay: '300ms' }} />
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Activity indicator line */}
                        {hasRecentActivity && engineStatus === 'live' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-400/50 to-transparent animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* LAYER 3 — WHAT ZYRA IS PROTECTING (DISTINCT ACCENT COLORS) */}
          <div data-testid="protected-surfaces-block">
            <p className="text-sm font-semibold text-white uppercase tracking-wider mb-4">What ZYRA is Protecting</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {protectedSurfaces.map((surface, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-3 p-4 rounded-lg ${surface.accentBg} border border-slate-700/40 hover-elevate transition-all`}
                  data-testid={`badge-protected-${idx}`}
                >
                  <div className={`p-2.5 rounded-lg ${surface.bgColor}`}>
                    <surface.icon className={`w-4.5 h-4.5 ${surface.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{surface.label}</p>
                    <p className="text-xs text-slate-400 truncate">{surface.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className={`p-1 rounded-full ${isActive ? 'bg-emerald-500/20' : 'bg-slate-600/30'}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    </div>
                    <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {isActive ? 'Protected' : 'Idle'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LAYER 4 — SYSTEM CAPABILITIES (DE-EMPHASIZED) */}
          <div data-testid="system-capabilities-block">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">System Capabilities</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {SYSTEM_CAPABILITIES.map((capability, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/30 border border-slate-700/20"
                  data-testid={`badge-capability-${idx}`}
                >
                  <div className="p-1.5 rounded-md bg-slate-700/30">
                    <capability.icon className={`w-3 h-3 text-slate-400`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-slate-300 truncate">{capability.title}</p>
                    <p className="text-[9px] text-slate-500 truncate">{capability.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LAYER 5 — CONTROLS (VISUALLY SEPARATE) */}
          <div className="rounded-xl bg-[#111125] border border-slate-700/40 p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-semibold text-white">Defense Sensitivity</p>
                </div>
                <p className="text-xs text-slate-500 ml-6">
                  {sensitivityDescriptions[sensitivity]}
                </p>
              </div>
              <Select
                value={sensitivity}
                onValueChange={(value) => sensitivityMutation.mutate(value)}
                disabled={sensitivityMutation.isPending || !isActive}
              >
                <SelectTrigger 
                  className="w-[180px] bg-slate-800/60 border-slate-600/50" 
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

            <div className="border-t border-slate-700/30 pt-4">
              <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between border-slate-600/50 bg-slate-800/40 text-slate-300"
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
            </div>
          </div>

          </div>
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
