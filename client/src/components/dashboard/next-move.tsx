import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  Zap,
  TrendingUp,
  Shield,
  Clock,
  RotateCcw,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  CircleDollarSign,
  ShieldCheck,
  ShoppingCart,
  CreditCard,
  Package,
  Search,
  FileText,
  Mail,
  Activity,
  Gauge,
  Award,
  BarChart3,
  RefreshCw,
  type LucideIcon
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ShopifyConnectionGate, WarmUpMode } from "@/components/zyra/store-connection-gate";
import type { StoreReadiness } from "@shared/schema";

// Store analytics data for AI Agent display
interface StoreAnalytics {
  productViews: number;
  addToCartRate: number;
  checkoutRate: number;
  conversionRate: number;
  averageOrderValue: number;
  benchmarkConversionRate: number;
  dataSource: string;
  lastUpdated: string;
  trendsDirection: 'up' | 'down' | 'stable';
  competitorsAnalyzed: number;
}

// AI reasoning step for transparency
interface AIReasoningStep {
  step: number;
  action: string;
  finding: string;
  dataPoint: string | null;
}

interface NextMoveAction {
  id: string;
  actionType: string;
  productId: string | null;
  productName: string | null;
  reason: string;
  expectedRevenue: number;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'ready' | 'awaiting_approval' | 'executing' | 'monitoring' | 'completed' | 'blocked' | 'no_action';
  planRequired: string;
  creditCost: number;
  createdAt: Date;
  executedAt: Date | null;
  completedAt: Date | null;
  score: number;
  opportunityId: string;
  rollbackAvailable: boolean;
  // Layer 1: Decision Transparency
  decisionReasons: string[];
  // Layer 2: Opportunity Cost
  opportunityCostMonthly: number;
  // Credit value justification
  creditValueRatio: number;
  // FRICTION CONTEXT (new friction-focused fields)
  frictionType?: 'view_no_cart' | 'cart_no_checkout' | 'checkout_drop' | 'purchase_no_upsell';
  frictionDescription?: string;
  whereIntentDied?: string;
  estimatedMonthlyLoss?: number;
  // AI AGENT DATA - Real store analytics
  storeAnalytics?: StoreAnalytics | null;
  aiReasoningSteps?: AIReasoningStep[];
  // Before/After preview
  currentValue?: string | null;
  proposedValue?: string | null;
  changeType?: string | null;
}

// Friction type labels for display
const FRICTION_TYPE_LABELS: Record<string, string> = {
  view_no_cart: 'View → No Add to Cart',
  cart_no_checkout: 'Cart → No Checkout',
  checkout_drop: 'Checkout Drop',
  purchase_no_upsell: 'Purchase → No Upsell'
};

const FRICTION_TYPE_ICONS: Record<string, LucideIcon> = {
  view_no_cart: Eye,
  cart_no_checkout: ShoppingCart,
  checkout_drop: CreditCard,
  purchase_no_upsell: Package
};

// Real agent stats from actual store data
interface AgentStats {
  productsMonitored: number;
  frictionDetected: number;
  optimizationsReady: number;
}

// Track record from completed actions
interface TrackRecord {
  totalOptimizations: number;
  revenueGenerated: number;
  successRate: number;
}

// Queued action preview
interface QueuedAction {
  type: string;
  product: string;
  score: number;
  expectedRevenue: number;
}

interface NextMoveResponse {
  nextMove: NextMoveAction | null;
  userPlan: string;
  planId: string;
  creditsRemaining: number;
  creditLimit: number;
  canAutoExecute: boolean;
  requiresApproval: boolean;
  blockedReason: string | null;
  executionSpeed: string;
  // Real stats from actual store data
  agentStats: AgentStats;
  trackRecord: TrackRecord;
  queuedActions: QueuedAction[];
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  product_seo: "SEO Optimization",
  seo_optimization: "SEO Optimization",
  cart_recovery: "Cart Recovery",
  upsell: "Smart Upsell",
  rollback: "Rollback Change",
  refresh: "Content Refresh",
  title_rewrite: "Title Optimization",
  description_enhancement: "Description Enhancement",
  price_adjustment: "Price Optimization",
};

const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  high: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  ready: { label: "Ready to Execute", icon: <Zap className="w-4 h-4" />, color: "text-emerald-400" },
  awaiting_approval: { label: "Awaiting Your Approval", icon: <Clock className="w-4 h-4" />, color: "text-amber-400" },
  executing: { label: "ZYRA is Executing...", icon: <Loader2 className="w-4 h-4 animate-spin" />, color: "text-primary" },
  monitoring: { label: "Monitoring Results", icon: <Target className="w-4 h-4" />, color: "text-blue-400" },
  completed: { label: "Completed", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-400" },
  blocked: { label: "Queued for Next Cycle", icon: <Clock className="w-4 h-4" />, color: "text-amber-400" },
};

// ZYRA AI Agent Powers - All capabilities the agent can perform
const ZYRA_POWERS = [
  {
    id: 'seo',
    icon: Search,
    title: 'SEO Optimization',
    description: 'AI rewrites titles & meta for Google ranking',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'copy',
    icon: FileText,
    title: 'Product Copy',
    description: 'Converts features into compelling benefits',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  {
    id: 'trust',
    icon: ShieldCheck,
    title: 'Trust Builder',
    description: 'Adds badges, policies & social proof',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  {
    id: 'recovery',
    icon: Mail,
    title: 'Cart Recovery',
    description: 'Auto-sends recovery emails & SMS',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  {
    id: 'upsell',
    icon: TrendingUp,
    title: 'Smart Upsell',
    description: 'Detects cross-sell opportunities',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
  },
  {
    id: 'prove',
    icon: BarChart3,
    title: 'Impact Proof',
    description: 'Tracks before/after with revenue attribution',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
];

// ZYRA Powers Grid Component - Shows all AI capabilities
function ZyraPowersGrid() {
  return (
    <div className="mb-6" data-testid="zyra-powers-grid">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">ZYRA's AI Powers</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {ZYRA_POWERS.map((power) => {
          const Icon = power.icon;
          return (
            <div
              key={power.id}
              className={`p-3 rounded-lg ${power.bgColor} border ${power.borderColor} overflow-visible hover-elevate`}
              data-testid={`power-${power.id}`}
            >
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className={`p-2 rounded-lg ${power.bgColor}`}>
                  <Icon className={`w-4 h-4 ${power.color}`} />
                </div>
                <p className={`text-xs font-medium ${power.color}`} data-testid={`power-title-${power.id}`}>{power.title}</p>
                <p className="text-[10px] text-muted-foreground leading-tight hidden sm:block" data-testid={`power-desc-${power.id}`}>{power.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// AI Agent Status Panel - Shows live monitoring stats
function AgentStatusPanel({ productsMonitored = 6, frictionDetected = 3, optimizationsReady = 1, isActive = true }: {
  productsMonitored?: number;
  frictionDetected?: number;
  optimizationsReady?: number;
  isActive?: boolean;
}) {
  return (
    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20" data-testid="agent-status-panel">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 rounded-xl bg-primary/20">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            {isActive && (
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-background animate-pulse" data-testid="indicator-active-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground" data-testid="text-agent-title">ZYRA Agent</h3>
              {isActive ? (
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 px-1.5 py-0" data-testid="badge-agent-active">
                  <Activity className="w-2.5 h-2.5 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted px-1.5 py-0" data-testid="badge-agent-standby">
                  Standby
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground" data-testid="text-agent-description">Autonomous revenue optimization</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-center" data-testid="stat-products">
            <p className="text-lg font-bold text-foreground" data-testid="text-products-count">{productsMonitored}</p>
            <p className="text-[10px] text-muted-foreground">Monitored</p>
          </div>
          <div className="text-center" data-testid="stat-friction">
            <p className="text-lg font-bold text-amber-400" data-testid="text-friction-count">{frictionDetected}</p>
            <p className="text-[10px] text-muted-foreground">Friction Found</p>
          </div>
          <div className="text-center" data-testid="stat-ready">
            <p className="text-lg font-bold text-emerald-400" data-testid="text-ready-count">{optimizationsReady}</p>
            <p className="text-[10px] text-muted-foreground">Ready</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Track Record Stats - Shows ZYRA's performance history
function TrackRecordStats({ totalOptimizations = 0, revenueGenerated = 0, successRate = 0 }: {
  totalOptimizations?: number;
  revenueGenerated?: number;
  successRate?: number;
}) {
  if (totalOptimizations === 0) return null;
  
  return (
    <div className="mb-6" data-testid="track-record-stats">
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-foreground" data-testid="text-track-record-title">ZYRA's Track Record</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-muted/30 border border-muted text-center" data-testid="stat-total-optimizations">
          <p className="text-xl font-bold text-foreground" data-testid="text-total-optimizations">{totalOptimizations}</p>
          <p className="text-xs text-muted-foreground">Optimizations</p>
        </div>
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center" data-testid="stat-revenue-generated">
          <p className="text-xl font-bold text-emerald-400" data-testid="text-revenue-generated">${revenueGenerated.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Generated</p>
        </div>
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center" data-testid="stat-success-rate">
          <p className="text-xl font-bold text-primary" data-testid="text-success-rate">{successRate}%</p>
          <p className="text-xs text-muted-foreground">Success Rate</p>
        </div>
      </div>
    </div>
  );
}

// Action Queue Preview - Shows upcoming optimizations
function ActionQueuePreview({ queuedActions = [] }: { queuedActions?: Array<{ type: string; product: string; score: number; expectedRevenue?: number }> }) {
  if (queuedActions.length === 0) return null;
  
  return (
    <div className="mt-6" data-testid="action-queue-preview">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground" data-testid="text-queue-header">Coming Up Next</h3>
        </div>
        <Badge variant="outline" className="text-[10px]" data-testid="badge-queue-count">{queuedActions.length} queued</Badge>
      </div>
      <div className="space-y-2">
        {queuedActions.slice(0, 3).map((action, idx) => (
          <div 
            key={idx} 
            className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-muted"
            data-testid={`queued-action-${idx}`}
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-medium" data-testid={`queue-number-${idx}`}>
                {idx + 2}
              </div>
              <div>
                <p className="text-xs font-medium text-foreground" data-testid={`queue-action-type-${idx}`}>{ACTION_TYPE_LABELS[action.type] || action.type}</p>
                <p className="text-[10px] text-muted-foreground" data-testid={`queue-product-${idx}`}>{action.product}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(action.expectedRevenue ?? 0) > 0 && (
                <span className="text-xs text-emerald-400" data-testid={`queue-revenue-${idx}`}>
                  ${(action.expectedRevenue ?? 0).toLocaleString()}
                </span>
              )}
              <div className="flex items-center gap-1">
                <Gauge className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground" data-testid={`queue-score-${idx}`}>{action.score}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// AI Reasoning Panel - Shows step-by-step AI analysis (like Cursor/ChatGPT)
function AIReasoningPanel({ steps, isExpanded = false }: { steps: AIReasoningStep[]; isExpanded?: boolean }) {
  const [isOpen, setIsOpen] = useState(isExpanded);
  
  if (!steps || steps.length === 0) return null;
  
  return (
    <div className="mb-4" data-testid="ai-reasoning-panel">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button 
            className="flex items-center justify-between w-full p-3 rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 text-left group overflow-visible hover-elevate"
            data-testid="button-toggle-reasoning"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <Brain className="w-4 h-4 text-primary" />
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <span className="text-sm font-medium text-primary">ZYRA's Analysis Process</span>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{steps.length} steps</Badge>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-primary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-primary" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="space-y-2 pl-2 border-l-2 border-primary/20 ml-2" data-testid="reasoning-steps">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-muted/10" data-testid={`reasoning-step-${idx}`}>
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold flex-shrink-0 mt-0.5">
                  {step.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground" data-testid={`step-action-${idx}`}>{step.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5" data-testid={`step-finding-${idx}`}>{step.finding}</p>
                  {step.dataPoint && (
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0" data-testid={`step-data-${idx}`}>
                        {step.dataPoint}
                      </Badge>
                    </div>
                  )}
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// Store Analytics Panel - Shows real store metrics
function StoreAnalyticsPanel({ analytics }: { analytics: StoreAnalytics }) {
  if (!analytics) return null;
  
  const TrendIcon = analytics.trendsDirection === 'up' ? TrendingUp : 
                    analytics.trendsDirection === 'down' ? TrendingUp : Activity;
  const trendColor = analytics.trendsDirection === 'up' ? 'text-emerald-400' : 
                     analytics.trendsDirection === 'down' ? 'text-red-400' : 'text-muted-foreground';
  const trendRotation = analytics.trendsDirection === 'down' ? 'rotate-180' : '';
  
  // Calculate if below benchmark
  const isBelowBenchmark = analytics.conversionRate < analytics.benchmarkConversionRate;
  
  return (
    <div className="mb-4 p-3 rounded-lg bg-muted/10 border border-muted" data-testid="store-analytics-panel">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-medium text-foreground" data-testid="text-analytics-title">Live Store Data</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-muted-foreground" data-testid="text-data-source">
            Source: {analytics.dataSource}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2 rounded-lg bg-muted/20 text-center" data-testid="metric-views">
          <p className="text-lg font-bold text-foreground" data-testid="text-views">{analytics.productViews.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Product Views</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/20 text-center" data-testid="metric-cart-rate">
          <p className="text-lg font-bold text-foreground" data-testid="text-cart-rate">{analytics.addToCartRate}%</p>
          <p className="text-[10px] text-muted-foreground">Add to Cart</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/20 text-center" data-testid="metric-checkout-rate">
          <p className="text-lg font-bold text-foreground" data-testid="text-checkout-rate">{analytics.checkoutRate}%</p>
          <p className="text-[10px] text-muted-foreground">Checkout Rate</p>
        </div>
        <div className={`p-2 rounded-lg text-center ${isBelowBenchmark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`} data-testid="metric-conversion">
          <div className="flex items-center justify-center gap-1">
            <p className={`text-lg font-bold ${isBelowBenchmark ? 'text-amber-400' : 'text-emerald-400'}`} data-testid="text-conversion-rate">
              {analytics.conversionRate.toFixed(1)}%
            </p>
            {analytics.trendsDirection !== 'stable' && (
              <TrendIcon className={`w-3 h-3 ${trendColor} ${trendRotation}`} />
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Conversion {isBelowBenchmark ? `(Benchmark: ${analytics.benchmarkConversionRate}%)` : ''}
          </p>
        </div>
      </div>
      
      {analytics.competitorsAnalyzed > 0 && (
        <div className="mt-2 pt-2 border-t border-muted flex items-center gap-2" data-testid="competitors-analyzed">
          <Search className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            {analytics.competitorsAnalyzed} competitors analyzed for keyword gaps
          </span>
        </div>
      )}
    </div>
  );
}

// Active Analysis Badge - Shows ZYRA has analyzed this opportunity
function ActiveAnalysisBadge() {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20" data-testid="active-analysis-badge">
      <div className="relative">
        <Brain className="w-4 h-4 text-primary" />
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />
      </div>
      <span className="text-xs text-primary font-medium">ZYRA has analyzed this opportunity and prepared an action</span>
    </div>
  );
}

export default function NextMove() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isApproving, setIsApproving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isReasonsOpen, setIsReasonsOpen] = useState(false);

  // CRITICAL: Check store readiness before showing Next Move
  // ZYRA must NEVER run if Shopify is not connected
  const { data: storeReadiness, isLoading: isReadinessLoading } = useQuery<StoreReadiness>({
    queryKey: ['/api/store-readiness'],
    refetchInterval: 30000,
  });

  const { data, isLoading, error } = useQuery<NextMoveResponse>({
    queryKey: ['/api/next-move'],
    refetchInterval: 10000,
    // Only fetch next move if store is ready
    enabled: storeReadiness?.state === 'ready',
  });

  const approveMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      return apiRequest('POST', '/api/next-move/approve', { opportunityId });
    },
    onSuccess: () => {
      toast({
        title: "Next Move Approved",
        description: "ZYRA is now executing this action.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/next-move'] });
      queryClient.invalidateQueries({ queryKey: ['/api/credits/balance'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      return apiRequest('POST', '/api/next-move/execute', { opportunityId });
    },
    onSuccess: () => {
      toast({
        title: "Execution Started",
        description: "ZYRA is now executing this action.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/next-move'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Execution Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      return apiRequest('POST', '/api/next-move/rollback', { opportunityId });
    },
    onSuccess: () => {
      toast({
        title: "Rolled Back",
        description: "The action has been rolled back successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/next-move'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Rollback Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  const handleApprove = async () => {
    if (!data?.nextMove) return;
    setIsApproving(true);
    try {
      await approveMutation.mutateAsync(data.nextMove.opportunityId);
    } finally {
      setIsApproving(false);
    }
  };

  const handleExecute = async () => {
    if (!data?.nextMove) return;
    setIsExecuting(true);
    try {
      await executeMutation.mutateAsync(data.nextMove.opportunityId);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRollback = () => {
    if (!data?.nextMove) return;
    rollbackMutation.mutate(data.nextMove.opportunityId);
  };

  // Loading state for store readiness check
  if (isReadinessLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center space-y-4">
          <Brain className="w-12 h-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Checking store connection...</p>
        </div>
      </div>
    );
  }

  // STATE 1: Shopify not connected - show connection gate
  // ZYRA must NEVER run if Shopify is not connected
  if (storeReadiness?.state === 'not_connected') {
    return <ShopifyConnectionGate readiness={storeReadiness} />;
  }

  // STATE 2: Shopify connected but warming up - show preparation screen
  // No optimizations allowed, only data ingestion
  if (storeReadiness?.state === 'warming_up') {
    return <WarmUpMode readiness={storeReadiness} />;
  }

  // STATE 3: Ready - continue to show Next Move
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center space-y-4">
          <Brain className="w-12 h-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">ZYRA is analyzing opportunities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-muted-foreground">Failed to load next move</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/next-move'] })}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const nextMove = data?.nextMove;

  if (!nextMove) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Next Best Revenue Move</h1>
            <p className="text-sm text-muted-foreground">ZYRA's single most important action right now</p>
          </div>
        </div>

        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-muted-foreground animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">ZYRA is Analyzing Your Store</h3>
            <p className="text-muted-foreground max-w-md">
              ZYRA continuously monitors your store for revenue opportunities. When ZYRA detects a friction point blocking your revenue, the recommended action will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const riskStyle = RISK_COLORS[nextMove.riskLevel] || RISK_COLORS.medium;
  const statusConfig = STATUS_CONFIG[nextMove.status] || STATUS_CONFIG.awaiting_approval;
  const actionLabel = ACTION_TYPE_LABELS[nextMove.actionType] || nextMove.actionType;

  const renderActionButton = () => {
    if (nextMove.status === 'blocked') {
      return (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-sm text-red-400">{data?.blockedReason || 'This action is blocked'}</p>
          </div>
          <Button variant="outline" className="w-full" disabled>
            <AlertCircle className="w-4 h-4 mr-2" />
            Action Blocked
          </Button>
        </div>
      );
    }

    if (nextMove.status === 'executing' || nextMove.status === 'monitoring') {
      return (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">ZYRA is working on this...</span>
            </div>
          </div>
          {nextMove.rollbackAvailable && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleRollback}
              disabled={rollbackMutation.isPending}
              data-testid="button-rollback"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {rollbackMutation.isPending ? 'Rolling back...' : 'Rollback if needed'}
            </Button>
          )}
        </div>
      );
    }

    if (nextMove.status === 'completed') {
      return (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Completed Successfully</span>
            </div>
          </div>
          {nextMove.rollbackAvailable && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleRollback}
              disabled={rollbackMutation.isPending}
              data-testid="button-rollback"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {rollbackMutation.isPending ? 'Rolling back...' : 'Rollback'}
            </Button>
          )}
        </div>
      );
    }

    if (data?.canAutoExecute && !data?.requiresApproval) {
      return (
        <div className="space-y-2">
          <Button 
            className="w-full"
            onClick={handleExecute}
            disabled={isExecuting || executeMutation.isPending}
            data-testid="button-execute"
          >
            {isExecuting || executeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ZYRA is executing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                ZYRA Will Execute Now
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Auto-execution enabled for your plan
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <Button 
          className="w-full"
          onClick={handleApprove}
          disabled={isApproving || approveMutation.isPending}
          data-testid="button-approve"
        >
          {isApproving || approveMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ZYRA is preparing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Let ZYRA Execute
            </>
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          ZYRA will execute this decision and monitor results
        </p>
      </div>
    );
  };


  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Plan Badges */}
      <div className="flex items-center justify-end gap-2">
        <Badge variant="outline" className="text-xs" data-testid="badge-user-plan">
          {data?.userPlan}
        </Badge>
        <Badge variant="outline" className="text-xs" data-testid="badge-execution-speed">
          {data?.executionSpeed === 'priority' ? 'Priority' : data?.executionSpeed === 'fast' ? 'Fast' : 'Standard'} Speed
        </Badge>
      </div>

      {/* ZYRA Agent Status Panel - Shows real store data */}
      <AgentStatusPanel 
        productsMonitored={data?.agentStats?.productsMonitored || 0}
        frictionDetected={data?.agentStats?.frictionDetected || 0}
        optimizationsReady={data?.agentStats?.optimizationsReady || 0}
        isActive={true}
      />

      {/* ZYRA Powers Grid - Shows all AI capabilities */}
      <ZyraPowersGrid />

      {/* Track Record Stats - Shows ZYRA's actual performance history */}
      <TrackRecordStats 
        totalOptimizations={data?.trackRecord?.totalOptimizations || 0}
        revenueGenerated={data?.trackRecord?.revenueGenerated || 0}
        successRate={data?.trackRecord?.successRate || 0}
      />

      {/* Current Priority Action Header */}
      <div className="flex items-center gap-2" data-testid="priority-action-header">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold" data-testid="priority-number">1</div>
        <h2 className="text-sm font-semibold text-foreground" data-testid="text-priority-action">Priority Action</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
      </div>

      <Card className="gradient-surface border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
        
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground" data-testid="text-action-type">{actionLabel}</CardTitle>
                {nextMove.productName && (
                  <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-product-name">
                    Product: {nextMove.productName}
                  </p>
                )}
              </div>
            </div>
            <div className={`flex items-center gap-2 ${statusConfig.color}`} data-testid="status-indicator">
              {statusConfig.icon}
              <span className="text-sm font-medium" data-testid="text-status">{statusConfig.label}</span>
            </div>
          </div>
          
          {/* FRICTION CONTEXT - Show where money is leaking */}
          {nextMove.frictionType && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20" data-testid="friction-context">
              <div className="flex items-start gap-3">
                <div className="text-red-400">
                  {(() => {
                    const Icon = FRICTION_TYPE_ICONS[nextMove.frictionType] || AlertCircle;
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-red-400 border-red-500/30 text-xs">
                      Friction Detected
                    </Badge>
                    <span className="text-sm font-medium text-red-400">
                      {FRICTION_TYPE_LABELS[nextMove.frictionType] || nextMove.frictionType}
                    </span>
                  </div>
                  {nextMove.whereIntentDied && (
                    <p className="text-sm text-muted-foreground">
                      Where intent died: <span className="text-foreground">{nextMove.whereIntentDied}</span>
                    </p>
                  )}
                  {nextMove.estimatedMonthlyLoss && nextMove.estimatedMonthlyLoss > 0 && (
                    <p className="text-sm text-red-400 mt-1 font-medium">
                      Money leaking: ${nextMove.estimatedMonthlyLoss.toLocaleString()}/month
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Active Analysis Badge */}
          <ActiveAnalysisBadge />
          
          {/* AI Agent Store Analytics - Real data from Shopify */}
          {nextMove.storeAnalytics && (
            <StoreAnalyticsPanel analytics={nextMove.storeAnalytics} />
          )}
          
          {/* AI Reasoning Steps - Shows ZYRA's analysis process */}
          {nextMove.aiReasoningSteps && nextMove.aiReasoningSteps.length > 0 && (
            <AIReasoningPanel steps={nextMove.aiReasoningSteps} />
          )}
          
          {/* Main reason - ZYRA's decision statement */}
          <div className="p-4 rounded-lg bg-muted/30 border border-muted" data-testid="card-reason">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary">ZYRA's Decision</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed" data-testid="text-reason">{nextMove.reason}</p>
          </div>

          {/* Layer 1: Decision Transparency - Collapsible "Why ZYRA chose this move" */}
          <Collapsible open={isReasonsOpen} onOpenChange={setIsReasonsOpen}>
            <CollapsibleTrigger asChild>
              <button 
                className="flex items-center justify-between w-full p-3 rounded-lg bg-primary/5 border border-primary/20 text-left group"
                data-testid="button-toggle-reasons"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Why ZYRA chose this move</span>
                </div>
                {isReasonsOpen ? (
                  <ChevronUp className="w-4 h-4 text-primary" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-primary" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="p-4 rounded-lg bg-muted/20 border border-muted space-y-2" data-testid="card-decision-reasons">
                {nextMove.decisionReasons?.map((reason, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{reason}</p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Layer 2: Opportunity Cost - What if you do nothing */}
          {nextMove.opportunityCostMonthly > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-500/5 border border-amber-500/20" data-testid="opportunity-cost">
              <CircleDollarSign className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-sm text-amber-400">
                If skipped, estimated revenue left on table this month: <span className="font-semibold">${nextMove.opportunityCostMonthly.toLocaleString()}</span>
              </span>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" data-testid="metrics-grid">
            <div className="p-3 rounded-lg bg-muted/20 text-center" data-testid="metric-revenue">
              <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground" data-testid="text-expected-revenue">${nextMove.expectedRevenue.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Expected Revenue</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 text-center" data-testid="metric-confidence">
              <Target className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground" data-testid="text-confidence">{nextMove.confidenceScore}%</p>
              <p className="text-xs text-muted-foreground">Confidence</p>
            </div>
            <div className={`p-3 rounded-lg text-center ${riskStyle.bg} ${riskStyle.border} border`} data-testid="metric-risk">
              <Shield className={`w-5 h-5 mx-auto mb-1 ${riskStyle.text}`} />
              <p className={`text-lg font-bold capitalize ${riskStyle.text}`} data-testid="text-risk-level">{nextMove.riskLevel}</p>
              <p className="text-xs text-muted-foreground">Risk Level</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 text-center" data-testid="metric-score">
              <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground" data-testid="text-priority-score">{nextMove.score.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Priority Score</p>
            </div>
          </div>

          {/* Layer 3: Reversible Commitment - System Guarantee Promise */}
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20" data-testid="rollback-promise">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-400">ZYRA will automatically undo this if revenue drops</p>
                <p className="text-xs text-muted-foreground mt-0.5">Rollback snapshot created before execution. One-click instant recovery.</p>
              </div>
            </div>
          </div>

          {renderActionButton()}
        </CardContent>
      </Card>

      {/* Low Credit Soft Nudge - inspiring message, not blocking */}
      {data && data.creditLimit > 0 && (() => {
        const percentUsed = Math.round((1 - (data.creditsRemaining / data.creditLimit)) * 100);
        const isLow = data.creditsRemaining <= data.creditLimit * 0.2 && data.creditsRemaining > 0;
        const isVeryLow = data.creditsRemaining <= data.creditLimit * 0.1 && data.creditsRemaining > 0;
        const isExhausted = data.creditsRemaining <= 0;
        
        if (isExhausted) {
          return (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20" data-testid="nudge-exhausted">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-400 font-medium">ZYRA is prioritizing highest-impact actions</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Some optimizations are queued for next cycle. Higher plans unlock faster continuous optimization.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        
        if (isVeryLow) {
          return (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20" data-testid="nudge-very-low">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-400 font-medium">Credits running low ({percentUsed}% used)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ZYRA is focusing on revenue-critical actions. Your credits will refresh at the start of your next billing cycle.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        
        if (isLow) {
          return (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20" data-testid="nudge-low">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-primary font-medium">ZYRA is working efficiently ({percentUsed}% credits deployed)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Deep AI analysis is consuming credits as expected. Higher plans unlock more autonomous actions.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        
        return null;
      })()}

      {/* Action Queue Preview - Shows upcoming optimizations */}
      <ActionQueuePreview queuedActions={data?.queuedActions || []} />

      {/* Credit Justification - reframe credits as growth fuel */}
      <div className="p-3 rounded-lg bg-muted/20 border border-muted" data-testid="credits-info">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground" data-testid="text-credits-remaining">
              Credits available: <span className="text-foreground font-medium">{data?.creditsRemaining?.toLocaleString() || 0}</span> / {data?.creditLimit?.toLocaleString() || 0}
            </span>
          </div>
          {/* Full credit value justification statement */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" data-testid="credit-value-statement">
            <span className="text-muted-foreground">
              Action cost: <span className="text-foreground font-medium">{nextMove.creditCost} credits</span>
            </span>
            <span className="text-muted-foreground hidden sm:inline">·</span>
            <span className="text-muted-foreground">
              Estimated return: <span className="text-emerald-400 font-medium">${nextMove.expectedRevenue.toLocaleString()}</span>
            </span>
            {nextMove.creditValueRatio > 0 && (
              <>
                <span className="text-muted-foreground hidden sm:inline">·</span>
                <span className="text-emerald-400 font-medium" data-testid="text-credit-value">
                  ≈ ${nextMove.creditValueRatio.toFixed(2)} per credit
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
