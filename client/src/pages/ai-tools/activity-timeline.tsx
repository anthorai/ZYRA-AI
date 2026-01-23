import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Undo2,
  Sparkles,
  AlertCircle,
  ShoppingCart,
  Mail,
  MessageSquare,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Zap
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AutonomousAction {
  id: string;
  actionType: string;
  status: string;
  entityId: string;
  entityType: string;
  decisionReason?: string;
  payload?: any;
  result: any;
  createdAt: string;
  completedAt: string | null;
}

interface AutopilotStats {
  totalActions: number;
  completedActions: number;
  failedActions: number;
  successRate: number;
  seoOptimizations: number;
  cartRecoveries: number;
  dailyBreakdown: {
    date: string;
    actions: number;
    completed: number;
    failed: number;
  }[];
}

// Page config based on filter type
const pageConfig: Record<string, { 
  title: string; 
  subtitle: string;
  description?: string;
  features?: string[];
  tip?: string;
}> = {
  all: {
    title: "ZYRA Execution Log",
    subtitle: "Every decision made, action taken, and result measured"
  },
  seo: {
    title: "SEO Optimization Actions",
    subtitle: "Titles, descriptions & meta improved for revenue upside",
    description: "ZYRA analyzes your product listings and automatically optimizes titles, descriptions, and meta tags to improve search rankings and drive more organic traffic to your store.",
    features: [
      "Keyword optimization for product titles",
      "SEO-friendly meta descriptions",
      "Search ranking improvement tracking",
      "Revenue impact measurement per optimization"
    ],
    tip: "Products with optimized SEO typically see 20-40% more organic traffic within 30 days."
  },
  bulk: {
    title: "Bulk Optimization Actions",
    subtitle: "Pattern-based updates across multiple products",
    description: "When ZYRA detects a successful optimization pattern, it automatically applies the same improvement across similar products in your catalog.",
    features: [
      "Pattern detection across product catalog",
      "Batch updates for efficiency",
      "Consistent branding across products",
      "Time-saving automation"
    ],
    tip: "Bulk optimizations save hours of manual work while ensuring consistency across your store."
  },
  image: {
    title: "Image SEO Updates",
    subtitle: "Alt-text generated to boost discoverability",
    description: "ZYRA automatically generates descriptive alt-text for your product images, improving accessibility and helping your products appear in image search results.",
    features: [
      "AI-generated descriptive alt-text",
      "Improved image search visibility",
      "ADA accessibility compliance",
      "Google Image search optimization"
    ],
    tip: "Products with proper alt-text can appear in Google Image searches, driving additional traffic."
  },
  voice: {
    title: "Brand Voice Applications",
    subtitle: "Your brand tone applied across content",
    description: "ZYRA learns your brand's unique voice and automatically applies it to all content updates, ensuring consistency across your entire product catalog.",
    features: [
      "Brand voice learning & analysis",
      "Consistent tone across products",
      "Automatic voice application",
      "Custom vocabulary preservation"
    ],
    tip: "Consistent brand voice increases customer trust and can improve conversion rates by up to 15%."
  },
  refresh: {
    title: "Content Refresh History",
    subtitle: "Stale content detected and refreshed",
    description: "ZYRA monitors your content for staleness and automatically refreshes outdated product descriptions, keeping your store fresh and relevant.",
    features: [
      "Stale content detection",
      "Automatic content updates",
      "Seasonal relevance adjustments",
      "Performance-based refresh triggers"
    ],
    tip: "Fresh content signals quality to search engines and can improve your search rankings."
  },
  publish: {
    title: "Shopify Publish Log",
    subtitle: "Approved changes pushed to your store",
    description: "Track all changes ZYRA has published to your Shopify store. Every update is logged with timestamps and can be reviewed or reverted.",
    features: [
      "Complete publish history",
      "Timestamp tracking",
      "Change preview before publish",
      "Instant rollback capability"
    ],
    tip: "All changes are staged first and only published after approval or automation rules are met."
  },
  patterns: {
    title: "Optimization Pattern Usage",
    subtitle: "Repeated improvements applied across products",
    description: "ZYRA identifies successful optimization patterns from your store data and applies them systematically to improve performance across similar products.",
    features: [
      "Pattern recognition from successful changes",
      "Cross-product application",
      "Performance tracking per pattern",
      "Pattern effectiveness scoring"
    ],
    tip: "Patterns that work well are automatically prioritized for future optimizations."
  },
  rollback: {
    title: "Change & Rollback History",
    subtitle: "Every change tracked with instant revert capability",
    description: "Every change ZYRA makes is tracked and can be instantly reverted. Your original content is always preserved and recoverable.",
    features: [
      "Complete change history",
      "One-click rollback",
      "Original content preservation",
      "Bulk rollback options"
    ],
    tip: "If any change doesn't perform as expected, you can instantly revert to the original version."
  },
  upsell: {
    title: "Post-Purchase Upsell Actions",
    subtitle: "Product recommendations sent after orders",
    description: "ZYRA sends personalized product recommendations to customers after they complete a purchase, increasing average order value and repeat purchases.",
    features: [
      "AI-powered product matching",
      "Personalized recommendations",
      "Order confirmation upsells",
      "Follow-up email campaigns"
    ],
    tip: "Post-purchase upsells can increase revenue by 10-30% with minimal additional effort."
  },
  cart: {
    title: "Cart Recovery Actions",
    subtitle: "Abandoned carts detected and revenue recovered",
    description: "ZYRA automatically detects abandoned carts and sends personalized recovery messages via email and SMS to bring customers back to complete their purchase.",
    features: [
      "Abandoned cart detection",
      "Email recovery campaigns",
      "SMS recovery messages",
      "Personalized incentives"
    ],
    tip: "Cart recovery campaigns typically recover 5-15% of abandoned carts."
  }
};

export default function ActivityTimeline() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get filter from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get('filter') || 'all';
  const [actionFilter, setActionFilter] = useState<string>(filterParam);
  
  // Get page title/subtitle based on filter
  const currentConfig = pageConfig[filterParam] || pageConfig.all;

  // Fetch autopilot statistics
  const { data: stats, isLoading: statsLoading } = useQuery<AutopilotStats>({
    queryKey: ['/api/autopilot/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch autonomous actions
  const { data: actions, isLoading } = useQuery<AutonomousAction[]>({
    queryKey: ['/api/autonomous-actions'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Rollback mutation
  const rollback = useMutation({
    mutationFn: async (actionId: string) => {
      return await apiRequest('POST', `/api/autonomous-actions/${actionId}/rollback`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/autonomous-actions'] });
      toast({
        title: "Action rolled back",
        description: "The change has been reverted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rollback failed",
        description: error.message || "Failed to rollback action",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'rolled_back':
        return <Undo2 className="w-4 h-4 text-orange-500" />;
      case 'dry_run':
        return <Activity className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'rolled_back':
        return <Badge variant="secondary" className="bg-orange-500">Rolled Back</Badge>;
      case 'dry_run':
        return <Badge variant="secondary" className="bg-blue-500">Preview (Dry Run)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionTitle = (action: AutonomousAction) => {
    switch (action.actionType) {
      case 'optimize_seo':
        return 'SEO Optimization';
      case 'fix_product':
        return 'Product Fix';
      case 'send_cart_recovery':
        const channel = action.payload?.channel || 'email';
        if (channel === 'both') return 'Cart Recovery (Email + SMS)';
        if (channel === 'sms') return 'Cart Recovery (SMS)';
        return 'Cart Recovery (Email)';
      case 'price_change':
        return 'Dynamic Pricing Adjustment';
      default:
        return action.actionType;
    }
  };

  const getActionIcon = (action: AutonomousAction) => {
    if (action.actionType === 'send_cart_recovery') {
      return <ShoppingCart className="w-4 h-4 text-primary" />;
    }
    if (action.actionType === 'price_change') {
      return <DollarSign className="w-4 h-4 text-primary" />;
    }
    return <Sparkles className="w-4 h-4 text-primary" />;
  };

  // Map URL filter params to actual action types
  const filterToActionTypes: Record<string, string[]> = {
    all: [], // empty means show all
    seo: ['optimize_seo', 'seo_optimization', 'meta_update'],
    bulk: ['bulk_update', 'bulk_optimization', 'batch_update'],
    image: ['image_seo', 'alt_text_update', 'image_optimization'],
    voice: ['brand_voice', 'tone_update', 'voice_application'],
    refresh: ['content_refresh', 'stale_content_update'],
    publish: ['shopify_publish', 'publish', 'sync_to_shopify'],
    patterns: ['pattern_apply', 'optimization_pattern'],
    rollback: ['rollback', 'revert', 'undo'],
    cart: ['send_cart_recovery', 'cart_recovery', 'abandoned_cart'],
    upsell: ['upsell', 'post_purchase', 'product_recommendation'],
  };

  // Filter actions based on selected filter
  const filteredActions = actions?.filter(action => {
    if (actionFilter === "all") return true;
    const matchingTypes = filterToActionTypes[actionFilter] || [];
    if (matchingTypes.length === 0) return true;
    return matchingTypes.some(type => 
      action.actionType.toLowerCase().includes(type.toLowerCase()) ||
      type.toLowerCase().includes(action.actionType.toLowerCase())
    );
  }) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading activity...</div>
        </div>
      </div>
    );
  }

  // Get filter-specific icon and styling
  const getFilterConfig = () => {
    switch (filterParam) {
      case 'seo': return { 
        icon: <Sparkles className="w-6 h-6 text-primary" />, 
        cardClass: 'border-primary/30 bg-primary/5',
        iconBgClass: 'bg-primary/10'
      };
      case 'bulk': return { 
        icon: <Activity className="w-6 h-6 text-blue-400" />, 
        cardClass: 'border-blue-500/30 bg-blue-500/5',
        iconBgClass: 'bg-blue-500/10'
      };
      case 'image': return { 
        icon: <Activity className="w-6 h-6 text-emerald-400" />, 
        cardClass: 'border-emerald-500/30 bg-emerald-500/5',
        iconBgClass: 'bg-emerald-500/10'
      };
      case 'voice': return { 
        icon: <MessageSquare className="w-6 h-6 text-purple-400" />, 
        cardClass: 'border-purple-500/30 bg-purple-500/5',
        iconBgClass: 'bg-purple-500/10'
      };
      case 'refresh': return { 
        icon: <Clock className="w-6 h-6 text-amber-400" />, 
        cardClass: 'border-amber-500/30 bg-amber-500/5',
        iconBgClass: 'bg-amber-500/10'
      };
      case 'publish': return { 
        icon: <CheckCircle2 className="w-6 h-6 text-green-400" />, 
        cardClass: 'border-green-500/30 bg-green-500/5',
        iconBgClass: 'bg-green-500/10'
      };
      case 'patterns': return { 
        icon: <Activity className="w-6 h-6 text-cyan-400" />, 
        cardClass: 'border-cyan-500/30 bg-cyan-500/5',
        iconBgClass: 'bg-cyan-500/10'
      };
      case 'rollback': return { 
        icon: <Undo2 className="w-6 h-6 text-red-400" />, 
        cardClass: 'border-red-500/30 bg-red-500/5',
        iconBgClass: 'bg-red-500/10'
      };
      case 'cart': return { 
        icon: <ShoppingCart className="w-6 h-6 text-orange-400" />, 
        cardClass: 'border-orange-500/30 bg-orange-500/5',
        iconBgClass: 'bg-orange-500/10'
      };
      case 'upsell': return { 
        icon: <Mail className="w-6 h-6 text-pink-400" />, 
        cardClass: 'border-pink-500/30 bg-pink-500/5',
        iconBgClass: 'bg-pink-500/10'
      };
      default: return { 
        icon: <Activity className="w-6 h-6 text-primary" />, 
        cardClass: 'border-primary/30 bg-primary/5',
        iconBgClass: 'bg-primary/10'
      };
    }
  };

  const filterConfig = getFilterConfig();

  return (
    <PageShell
      title={currentConfig.title}
      subtitle={currentConfig.subtitle}
      backTo="/dashboard?tab=zyra-at-work"
    >

      {/* Filter-Specific Content Section */}
      {filterParam !== 'all' && currentConfig.description && (
        <div className="mb-6 space-y-4">
          {/* Header Banner */}
          <Card className={`${filterConfig.cardClass}`}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className={`p-3 rounded-lg ${filterConfig.iconBgClass} flex-shrink-0`}>
                  {filterConfig.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{currentConfig.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{currentConfig.description}</p>
                  
                  {/* Features Grid */}
                  {currentConfig.features && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {currentConfig.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Tip */}
                  {currentConfig.tip && (
                    <Alert className="bg-primary/5 border-primary/20">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <AlertDescription className="text-sm">
                        <strong>Pro Tip:</strong> {currentConfig.tip}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <div className="text-center sm:text-right flex-shrink-0">
                  <div className="text-3xl font-bold">{filteredActions.length}</div>
                  <p className="text-xs text-muted-foreground">actions found</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Overview */}
      {stats && !statsLoading && stats.totalActions > 0 && (
        <div className="mb-6 space-y-4">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
                <Zap className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-actions">{stats.totalActions}</div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Target className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500" data-testid="stat-success-rate">{stats.successRate}%</div>
                <p className="text-xs text-muted-foreground">{stats.completedActions} completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SEO Optimizations</CardTitle>
                <Sparkles className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-seo-optimizations">{stats.seoOptimizations}</div>
                <p className="text-xs text-muted-foreground">Products improved</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cart Recoveries</CardTitle>
                <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-cart-recoveries">{stats.cartRecoveries}</div>
                <p className="text-xs text-muted-foreground">Recovery attempts</p>
              </CardContent>
            </Card>
          </div>

          {/* Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Activity Over Time
              </CardTitle>
              <CardDescription>Autonomous actions in the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.dailyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actions" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Total Actions"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    name="Completed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failed" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    name="Failed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {!actions || actions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No activity yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Enable Autopilot in settings to start autonomous optimizations. Your AI will scan your store daily and make improvements automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Action Type Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filter by Action Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={actionFilter} onValueChange={setActionFilter} data-testid="tabs-action-filter">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all" data-testid="tab-all">
                    All
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {actions.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="optimize_seo" data-testid="tab-seo">
                    SEO
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {actions.filter(a => a.actionType === 'optimize_seo').length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="price_change" data-testid="tab-pricing">
                    Pricing
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {actions.filter(a => a.actionType === 'price_change').length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="send_cart_recovery" data-testid="tab-cart">
                    Cart Recovery
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {actions.filter(a => a.actionType === 'send_cart_recovery').length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="fix_product" data-testid="tab-fixes">
                    Fixes
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {actions.filter(a => a.actionType === 'fix_product').length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Filtered Actions List */}
          {filteredActions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No {actionFilter === "all" ? "" : actionFilter.replace('_', ' ')} actions yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  This type of action hasn't been performed yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {filteredActions.map((action) => (
            <Card key={action.id} data-testid={`card-action-${action.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(action.status)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getActionIcon(action)}
                        {getActionTitle(action)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {action.createdAt && formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(action.status)}
                    {action.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-rollback-${action.id}`}
                        onClick={() => rollback.mutate(action.id)}
                        disabled={rollback.isPending}
                      >
                        <Undo2 className="w-4 h-4 mr-1" />
                        Rollback
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Decision Reason */}
                  {action.decisionReason && (
                    <div>
                      <div className="text-sm font-medium mb-1">Reasoning</div>
                      <div className="text-sm text-muted-foreground">
                        {action.decisionReason}
                      </div>
                    </div>
                  )}

                  {/* Cart Recovery Details */}
                  {action.actionType === 'send_cart_recovery' && action.payload && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-md">
                      {action.payload.cartValue && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Cart Value</div>
                          <div className="text-sm font-medium flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {parseFloat(action.payload.cartValue).toFixed(2)} {action.payload.currency || 'USD'}
                          </div>
                        </div>
                      )}
                      {action.payload.attemptNumber && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Attempt</div>
                          <div className="text-sm font-medium">
                            {action.payload.attemptNumber} of {action.payload.maxAttempts || 3}
                          </div>
                        </div>
                      )}
                      {action.payload.channel && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Channel</div>
                          <div className="text-sm font-medium flex items-center gap-1">
                            {action.payload.channel === 'email' && <Mail className="w-3 h-3" />}
                            {action.payload.channel === 'sms' && <MessageSquare className="w-3 h-3" />}
                            {action.payload.channel === 'both' && (
                              <>
                                <Mail className="w-3 h-3" />
                                <MessageSquare className="w-3 h-3" />
                              </>
                            )}
                            {action.payload.channel.charAt(0).toUpperCase() + action.payload.channel.slice(1)}
                          </div>
                        </div>
                      )}
                      {action.payload.customerEmail && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Customer</div>
                          <div className="text-sm font-medium truncate">
                            {action.payload.customerName || action.payload.customerEmail.split('@')[0]}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cart Recovery Result */}
                  {action.actionType === 'send_cart_recovery' && action.result && action.status === 'completed' && (
                    <div>
                      <div className="text-sm font-medium mb-1">Delivery Status</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {action.result.emailSent !== undefined && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            Email: {action.result.emailSent ? '✓ Sent' : '✗ Failed'}
                          </div>
                        )}
                        {action.result.smsSent !== undefined && (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-3 h-3" />
                            SMS: {action.result.smsSent ? '✓ Sent' : '✗ Failed'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SEO Result */}
                  {action.actionType === 'optimize_seo' && action.result && action.status === 'completed' && (
                    <div>
                      <div className="text-sm font-medium mb-1">Changes Made</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {action.result.seoTitle && (
                          <div>
                            <span className="font-medium">SEO Title:</span> {action.result.seoTitle}
                          </div>
                        )}
                        {action.result.metaDescription && (
                          <div>
                            <span className="font-medium">Meta Description:</span> {action.result.metaDescription}
                          </div>
                        )}
                        {action.result.seoScore && (
                          <div>
                            <span className="font-medium">SEO Score:</span> {action.result.seoScore}/100
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price Change Details */}
                  {action.actionType === 'price_change' && action.payload && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-md">
                      {action.payload.productName && (
                        <div className="col-span-2">
                          <div className="text-xs text-muted-foreground mb-1">Product</div>
                          <div className="text-sm font-medium">
                            {action.payload.productName}
                          </div>
                        </div>
                      )}
                      {action.payload.oldPrice != null && !isNaN(parseFloat(action.payload.oldPrice)) && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Previous Price</div>
                          <div className="text-sm font-medium">
                            ${parseFloat(action.payload.oldPrice).toFixed(2)}
                          </div>
                        </div>
                      )}
                      {action.payload.newPrice != null && !isNaN(parseFloat(action.payload.newPrice)) && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">New Price</div>
                          <div className="text-sm font-medium flex items-center gap-1">
                            ${parseFloat(action.payload.newPrice).toFixed(2)}
                            {action.payload.oldPrice != null && 
                             action.payload.newPrice != null && 
                             !isNaN(parseFloat(action.payload.oldPrice)) && 
                             !isNaN(parseFloat(action.payload.newPrice)) && (() => {
                              const oldPrice = parseFloat(action.payload.oldPrice);
                              const newPrice = parseFloat(action.payload.newPrice);
                              if (oldPrice === 0) return null; // Prevent division by zero
                              const change = ((newPrice - oldPrice) / oldPrice * 100).toFixed(1);
                              const isIncrease = newPrice > oldPrice;
                              return (
                                <span className={`text-xs flex items-center gap-0.5 ${isIncrease ? 'text-red-500' : 'text-green-500'}`}>
                                  {isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {isIncrease ? '+' : ''}{change}%
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                      {action.payload.competitorPrice != null && !isNaN(parseFloat(action.payload.competitorPrice)) && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Competitor Price</div>
                          <div className="text-sm font-medium">
                            ${parseFloat(action.payload.competitorPrice).toFixed(2)}
                          </div>
                        </div>
                      )}
                      {action.payload.strategy && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Strategy</div>
                          <div className="text-sm font-medium capitalize">
                            {action.payload.strategy.replace(/_/g, ' ')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Price Change Revenue Impact */}
                  {action.actionType === 'price_change' && 
                   action.result?.revenueImpact && 
                   action.status === 'completed' &&
                   (action.result.revenueImpact.estimatedMonthlyImpact != null || 
                    action.result.revenueImpact.marginChange != null) && (
                    <div>
                      <div className="text-sm font-medium mb-1">Revenue Impact Estimate</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {action.result.revenueImpact.estimatedMonthlyImpact != null && 
                         !isNaN(parseFloat(action.result.revenueImpact.estimatedMonthlyImpact)) && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3" />
                            Estimated Monthly Impact: ${parseFloat(action.result.revenueImpact.estimatedMonthlyImpact).toFixed(2)}
                          </div>
                        )}
                        {action.result.revenueImpact.marginChange != null && 
                         !isNaN(parseFloat(action.result.revenueImpact.marginChange)) && (
                          <div className="flex items-center gap-2">
                            <Target className="w-3 h-3" />
                            Margin Change: {parseFloat(action.result.revenueImpact.marginChange).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {action.result?.error && action.status === 'failed' && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-sm">
                        {action.result.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
            </>
          )}
        </div>
      )}
    </PageShell>
  );
}
