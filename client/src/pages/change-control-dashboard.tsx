import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { StoreReadiness } from "@shared/schema";

function stripHtmlTags(html: string): string {
  if (!html) return '';
  let text = html;
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<li[^>]*>/gi, '  \u2022 ');
  text = text.replace(/<\/ul>|<\/ol>/gi, '\n');
  text = text.replace(/<[^>]*>/g, '');
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

function isHistoricallyTruncated(text: string): boolean {
  if (!text) return false;
  const stripped = stripHtmlTags(text);
  return stripped.endsWith('...') && stripped.length === 103;
}

function renderDescription(text: string | undefined | null, emptyLabel = '(empty)') {
  if (!text) return <span className="italic text-muted-foreground">{emptyLabel}</span>;
  const cleaned = stripHtmlTags(text);
  const truncated = isHistoricallyTruncated(text);
  if (truncated) {
    const withoutEllipsis = cleaned.slice(0, -3);
    return (
      <span>
        {withoutEllipsis}
        <span className="inline-block ml-1 text-[10px] text-muted-foreground italic">(partial historical record)</span>
      </span>
    );
  }
  return cleaned;
}
import { ShopifyConnectionGate, WarmUpMode } from "@/components/zyra/store-connection-gate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useStoreCurrency } from "@/hooks/use-store-currency";
import { formatCurrency as formatCurrencyUtil } from "@/lib/utils";
import Sidebar from "@/components/dashboard/sidebar";
import Footer from "@/components/ui/footer";
import NotificationCenter from "@/components/dashboard/notification-center";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import { 
  Check, 
  X, 
  RotateCcw, 
  TrendingUp, 
  Shield, 
  Clock,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Bot,
  Lock,
  Eye,
  Package,
  FileText,
  ChevronRight,
  Activity,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Timer,
  Menu,
  Upload,
  Filter,
  RefreshCw,
  Search,
  ShoppingCart,
  Brain,
  Tag,
  Globe,
  Target,
  Image,
  Pause,
  BarChart,
  Database
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

type ActionStatus = "pending" | "running" | "completed" | "failed" | "rolled_back" | "dry_run";
type ActionType = "optimize_seo" | "fix_product" | "send_cart_recovery" | "run_ab_test" | "adjust_price" | "content_refresh" | "discoverability" | "seo_basics" | "product_copy_clarity" | "trust_signals" | "cart_recovery" | "title_optimization" | "meta_optimization" | "search_intent_fix" | "alt_text_optimization" | "image_alt_text_optimization" | "image_alt_text" | "stale_content_refresh" | "stale_seo_content_refresh" | "stale_seo_refresh" | "description_clarity" | "value_proposition_fix" | "value_proposition_alignment" | "value_proposition" | "trust_signal_enhancement" | "friction_copy_removal" | "above_fold_optimization" | "above_the_fold_optimization" | "product_title_optimization" | "product_description_clarity" | "search_intent_alignment" | "meta_title_description_tags" | "abandoned_cart_recovery" | "post_purchase_upsell" | "post_purchase_upsell_enablement" | "upsell" | "checkout_drop_mitigation" | "checkout_dropoff_mitigation" | "underperforming_rollback" | "risky_optimization_freeze" | "conversion_pattern_learning" | "performance_baseline_update" | "recovery_setup";
type RiskLevel = "low" | "medium" | "high";
type FilterStatus = "all" | "applied" | "pending" | "rolled_back";
type ActionCategory = "seo" | "conversion" | "revenue_recovery" | "revenue_protection" | "learning";

interface ChangeItem {
  id: string;
  userId: string;
  actionType: ActionType | string;
  entityType: string | null;
  entityId: string | null;
  status: ActionStatus;
  decisionReason: string | null;
  ruleId: string | null;
  payload: any;
  result: any;
  estimatedImpact: any;
  actualImpact: any;
  executedBy: string;
  dryRun: boolean;
  publishedToShopify: boolean;
  createdAt: string;
  completedAt: string | null;
  rolledBackAt: string | null;
  productName?: string;
  productImage?: string;
}

interface AutomationSettings {
  id: string;
  globalAutopilotEnabled: boolean;
  autopilotEnabled: boolean;
  autopilotMode: "safe" | "balanced" | "aggressive";
  dryRunMode: boolean;
  autoPublishEnabled: boolean;
  maxDailyActions: number;
}

const ACTION_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; category: ActionCategory }> = {
  // SEO Actions
  optimize_seo: { label: "SEO", icon: TrendingUp, color: "text-blue-400", category: "seo" },
  seo_basics: { label: "SEO Basics", icon: TrendingUp, color: "text-blue-400", category: "seo" },
  discoverability: { label: "Discoverability", icon: Eye, color: "text-orange-400", category: "seo" },
  title_optimization: { label: "Product Title Optimization", icon: Tag, color: "text-blue-400", category: "seo" },
  product_title_optimization: { label: "Product Title Optimization", icon: Tag, color: "text-blue-400", category: "seo" },
  meta_optimization: { label: "Meta Title, Description & Tag", icon: Globe, color: "text-cyan-400", category: "seo" },
  meta_title_description_tags: { label: "Meta Title, Description & Tags", icon: Globe, color: "text-cyan-400", category: "seo" },
  search_intent_fix: { label: "Search Intent Alignment Fix", icon: Target, color: "text-purple-400", category: "seo" },
  search_intent_alignment: { label: "Search Intent Alignment", icon: Target, color: "text-purple-400", category: "seo" },
  alt_text_optimization: { label: "Image Alt-Text Optimization", icon: Image, color: "text-emerald-400", category: "seo" },
  image_alt_text_optimization: { label: "Image Alt-Text Optimization", icon: Image, color: "text-emerald-400", category: "seo" },
  image_alt_text: { label: "Image Alt-Text Optimization", icon: Image, color: "text-emerald-400", category: "seo" },
  stale_content_refresh: { label: "Stale SEO Content Refresh", icon: RefreshCw, color: "text-amber-400", category: "seo" },
  stale_seo_content_refresh: { label: "Stale SEO Content Refresh", icon: RefreshCw, color: "text-amber-400", category: "seo" },
  stale_seo_refresh: { label: "Stale SEO Content Refresh", icon: RefreshCw, color: "text-amber-400", category: "seo" },
  content_refresh: { label: "Content Refresh", icon: FileText, color: "text-cyan-400", category: "seo" },
  
  // Conversion Actions
  fix_product: { label: "Content", icon: FileText, color: "text-green-400", category: "conversion" },
  product_copy_clarity: { label: "Copy Clarity", icon: FileText, color: "text-green-400", category: "conversion" },
  product_description_clarity: { label: "Product Description Clarity", icon: FileText, color: "text-green-400", category: "conversion" },
  description_clarity: { label: "Product Description Clarity Upgrade", icon: FileText, color: "text-green-400", category: "conversion" },
  value_proposition_fix: { label: "Value Proposition Alignment", icon: Sparkles, color: "text-violet-400", category: "conversion" },
  value_proposition_alignment: { label: "Value Proposition Alignment", icon: Sparkles, color: "text-violet-400", category: "conversion" },
  value_proposition: { label: "Value Proposition Alignment", icon: Sparkles, color: "text-violet-400", category: "conversion" },
  trust_signals: { label: "Trust Signals", icon: Shield, color: "text-indigo-400", category: "conversion" },
  trust_signal_enhancement: { label: "Trust Signal Enhancement", icon: Shield, color: "text-indigo-400", category: "conversion" },
  friction_copy_removal: { label: "Friction Copy Removal", icon: X, color: "text-orange-400", category: "conversion" },
  above_fold_optimization: { label: "Above-the-Fold Content Optimization", icon: Eye, color: "text-pink-400", category: "conversion" },
  above_the_fold_optimization: { label: "Above-the-Fold Content Optimization", icon: Eye, color: "text-pink-400", category: "conversion" },
  
  // Revenue Recovery Actions
  send_cart_recovery: { label: "Recovery", icon: DollarSign, color: "text-yellow-400", category: "revenue_recovery" },
  cart_recovery: { label: "Cart Recovery", icon: DollarSign, color: "text-yellow-400", category: "revenue_recovery" },
  recovery_setup: { label: "Recovery Setup", icon: DollarSign, color: "text-yellow-400", category: "revenue_recovery" },
  abandoned_cart_recovery: { label: "Abandoned Cart Recovery Activation", icon: ShoppingCart, color: "text-yellow-400", category: "revenue_recovery" },
  post_purchase_upsell: { label: "Post-Purchase Upsell Enablement", icon: TrendingUp, color: "text-green-400", category: "revenue_recovery" },
  post_purchase_upsell_enablement: { label: "Post-Purchase Upsell Enablement", icon: TrendingUp, color: "text-green-400", category: "revenue_recovery" },
  upsell: { label: "Upsell Opportunity", icon: TrendingUp, color: "text-green-400", category: "revenue_recovery" },
  checkout_drop_mitigation: { label: "Checkout Drop-Off Mitigation", icon: DollarSign, color: "text-rose-400", category: "revenue_recovery" },
  checkout_dropoff_mitigation: { label: "Checkout Drop-Off Mitigation", icon: DollarSign, color: "text-rose-400", category: "revenue_recovery" },
  
  // Revenue Protection Actions
  underperforming_rollback: { label: "Underperforming Change Rollback", icon: RotateCcw, color: "text-red-400", category: "revenue_protection" },
  risky_optimization_freeze: { label: "Risky Optimization Freeze", icon: Pause, color: "text-orange-400", category: "revenue_protection" },
  
  // Learning Actions
  conversion_pattern_learning: { label: "Store Conversion Pattern Learning", icon: Brain, color: "text-purple-400", category: "learning" },
  performance_baseline_update: { label: "Product Performance Baseline Update", icon: BarChart, color: "text-sky-400", category: "learning" },
  
  // Misc
  run_ab_test: { label: "A/B Test", icon: Activity, color: "text-purple-400", category: "conversion" },
  adjust_price: { label: "Pricing", icon: DollarSign, color: "text-emerald-400", category: "revenue_recovery" },
};

const CATEGORY_CONFIG: Record<ActionCategory, { label: string; icon: any; color: string; activeColor: string; description: string }> = {
  seo: { label: "Discoverability & SEO", icon: Search, color: "text-cyan-400", activeColor: "text-cyan-400", description: "Optimize product visibility in search" },
  conversion: { label: "Conversion Optimization", icon: ShoppingCart, color: "text-green-500", activeColor: "text-green-400", description: "Turn more visitors into buyers" },
  revenue_recovery: { label: "Revenue Recovery", icon: DollarSign, color: "text-amber-400", activeColor: "text-amber-400", description: "Recover lost sales opportunities" },
  revenue_protection: { label: "Revenue Protection", icon: Shield, color: "text-red-500", activeColor: "text-red-400", description: "Protect against revenue loss" },
  learning: { label: "Learning & Intelligence", icon: Brain, color: "text-violet-400", activeColor: "text-violet-400", description: "AI learns and improves" },
};

const SEO_ACTION_ROWS = [
  { key: "description", label: "Product Description", field: "Product Description" },
  { key: "title", label: "Product Title Optimization", field: "Product Title" },
  { key: "meta", label: "Meta Title, Description & Tags", field: "Meta Description" },
  { key: "search_intent", label: "Search Intent Alignment", field: "SEO Title" },
  { key: "alt_text", label: "Image Alt-Text", field: "Image Alt Text" },
  { key: "stale_refresh", label: "Stale SEO Content Refresh", field: "Content" },
];

const STATUS_CONFIG: Record<ActionStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: "Pending", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  running: { label: "Applying", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  completed: { label: "Applied", color: "text-green-400", bgColor: "bg-green-500/20" },
  failed: { label: "Failed", color: "text-red-400", bgColor: "bg-red-500/20" },
  rolled_back: { label: "Rolled Back", color: "text-slate-400", bgColor: "bg-slate-500/20" },
  dry_run: { label: "Preview", color: "text-purple-400", bgColor: "bg-purple-500/20" },
};

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  low: { label: "Low Risk", color: "text-green-400", bgColor: "bg-green-500/20 border-green-500/30" },
  medium: { label: "Medium Risk", color: "text-yellow-400", bgColor: "bg-yellow-500/20 border-yellow-500/30" },
  high: { label: "High Risk", color: "text-red-400", bgColor: "bg-red-500/20 border-red-500/30" },
};

function getRiskLevel(item: ChangeItem): RiskLevel {
  const impact = item.estimatedImpact;
  if (!impact) return "low";
  const revenueChange = Math.abs(parseFloat(impact?.expectedRevenue || "0"));
  if (revenueChange > 500) return "high";
  if (revenueChange > 100) return "medium";
  return "low";
}

let _storeCurrencyCode = 'USD';
function formatCurrency(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return formatCurrencyUtil(0, _storeCurrencyCode);
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return formatCurrencyUtil(0, _storeCurrencyCode);
  return formatCurrencyUtil(num, _storeCurrencyCode);
}

function getBeforeAfterContent(change: ChangeItem) {
  const before: Record<string, string> = {};
  const after: Record<string, string> = {};

  if (change.payload?.changes && Array.isArray(change.payload.changes)) {
    for (const fieldChange of change.payload.changes) {
      const fieldName = fieldChange.field || "Unknown Field";
      if (fieldChange.before !== undefined && fieldChange.before !== null) {
        before[fieldName] = String(fieldChange.before);
      }
      if (fieldChange.after !== undefined && fieldChange.after !== null) {
        after[fieldName] = String(fieldChange.after);
      }
    }
  }

  if (change.result?.changes && Array.isArray(change.result.changes)) {
    for (const fieldChange of change.result.changes) {
      const fieldName = fieldChange.field || "Unknown Field";
      if (fieldChange.before !== undefined && fieldChange.before !== null && !before[fieldName]) {
        before[fieldName] = String(fieldChange.before);
      }
      if (fieldChange.after !== undefined && fieldChange.after !== null && !after[fieldName]) {
        after[fieldName] = String(fieldChange.after);
      }
    }
  }

  if (change.payload?.before && typeof change.payload.before === 'object') {
    if (change.payload.before.title) before["Product Title"] = change.payload.before.title;
    if (change.payload.before.description) before["Product Description"] = change.payload.before.description;
    if (change.payload.before.seoTitle) before["SEO Title"] = change.payload.before.seoTitle;
    if (change.payload.before.metaDescription) before["Meta Description"] = change.payload.before.metaDescription;
  }

  if (change.payload?.after && typeof change.payload.after === 'object') {
    if (change.payload.after.title) after["Product Title"] = change.payload.after.title;
    if (change.payload.after.description) after["Product Description"] = change.payload.after.description;
    if (change.payload.after.seoTitle) after["SEO Title"] = change.payload.after.seoTitle;
    if (change.payload.after.metaDescription) after["Meta Description"] = change.payload.after.metaDescription;
  }

  const optimized = change.payload?.optimizedCopy || change.result?.optimizedContent;
  if (optimized && typeof optimized === 'object') {
    if (optimized.title && !after["Product Title"]) after["Product Title"] = optimized.title;
    if (optimized.description && !after["Product Description"]) after["Product Description"] = optimized.description;
    if (optimized.seoTitle && !after["SEO Title"]) after["SEO Title"] = optimized.seoTitle;
    if (optimized.metaDescription && !after["Meta Description"]) after["Meta Description"] = optimized.metaDescription;
  }

  if (Object.keys(before).length === 0 && Object.keys(after).length === 0) {
    const issueLabels: Record<string, string> = {
      weak_title: "Weak product title detected",
      seo_erosion: "SEO ranking decline detected",
      missing_description: "Missing product description",
      thin_content: "Thin content detected",
      missing_meta: "Missing meta description",
      low_seo_score: "Low SEO score detected",
      content_decay: "Content quality decline detected",
      copy_fatigue: "Product copy needs refresh",
    };
    const issueType = change.payload?.issueType;
    const actionLabel = change.payload?.actionLabel || change.decisionReason || "Optimization";
    const fieldLabel = actionLabel || "Content";

    if (issueType && issueLabels[issueType]) {
      before[fieldLabel] = issueLabels[issueType];
    } else if (change.decisionReason) {
      before[fieldLabel] = change.decisionReason;
    } else {
      before[fieldLabel] = "Issue detected by ZYRA";
    }

    const resultMsg = change.result?.message || change.result?.details?.reason;
    if (resultMsg) {
      after[fieldLabel] = resultMsg;
    } else if (change.status === 'failed' || change.status === 'rolled_back') {
      after[fieldLabel] = "Action did not complete";
    } else if (change.status === 'pending') {
      after[fieldLabel] = "Awaiting approval to optimize";
    }
  }

  return { before, after };
}

export default function ChangeControlDashboard() {
  const { toast } = useToast();
  const { currency: storeCurrency } = useStoreCurrency();
  _storeCurrencyCode = storeCurrency;
  const [selectedChange, setSelectedChange] = useState<ChangeItem | null>(null);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showLatestOnly, setShowLatestOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ActionCategory>("seo");

  const handleCategoryChange = (category: ActionCategory) => {
    setActiveCategory(category);
    setSelectedIds(new Set());
    setSelectedChange(null);
  };

  const { data: storeReadiness, isLoading: isReadinessLoading } = useQuery<StoreReadiness>({
    queryKey: ['/api/store-readiness'],
    refetchInterval: 30000,
  });

  const { data: changes, isLoading: changesLoading, refetch } = useQuery<ChangeItem[]>({
    queryKey: ["/api/autonomous-actions"],
  });

  const { data: learningStats } = useQuery<{ totalLearnings: number; snapshots: any[] }>({
    queryKey: ["/api/learning-stats"],
  });

  const { data: settings } = useQuery<AutomationSettings>({
    queryKey: ["/api/automation/settings"],
  });

  const filteredChanges = useMemo(() => {
    if (!changes) return [];
    
    let filtered = changes;
    
    // Allow store-wide actions (upsell, recovery, etc.) even without product names
    // Also allow any record with entity_type = 'store'
    const storeWideActionTypes = ['upsell', 'send_cart_recovery', 'cart_recovery', 'abandoned_cart_recovery', 'checkout_drop_mitigation'];
    filtered = filtered.filter(c => {
      if (storeWideActionTypes.includes(c.actionType)) return true;
      if (c.entityType === 'store') return true;
      const productName = c.productName || c.payload?.productName;
      return productName && productName !== "Unknown Product";
    });
    
    switch (filterStatus) {
      case "applied":
        filtered = filtered.filter(c => c.status === "completed" || c.status === "dry_run");
        break;
      case "pending":
        filtered = filtered.filter(c => c.status === "pending");
        break;
      case "rolled_back":
        filtered = filtered.filter(c => c.status === "rolled_back");
        break;
    }
    
    if (showLatestOnly) {
      const latestByProduct = new Map<string, ChangeItem>();
      for (const change of filtered) {
        const productKey = change.entityId || change.payload?.productId || change.id;
        const existing = latestByProduct.get(productKey);
        if (!existing || new Date(change.createdAt) > new Date(existing.createdAt)) {
          latestByProduct.set(productKey, change);
        }
      }
      filtered = Array.from(latestByProduct.values());
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [changes, filterStatus, showLatestOnly]);

  const categoryFilteredChanges = useMemo(() => {
    return filteredChanges.filter(change => {
      const config = ACTION_TYPE_CONFIG[change.actionType];
      const category = config?.category || "conversion";
      return category === activeCategory;
    });
  }, [filteredChanges, activeCategory]);

  const changesByCategory = useMemo(() => {
    const byCategory: Record<ActionCategory, ChangeItem[]> = {
      seo: [],
      conversion: [],
      revenue_recovery: [],
      revenue_protection: [],
      learning: []
    };
    
    filteredChanges.forEach(change => {
      const config = ACTION_TYPE_CONFIG[change.actionType];
      const category = config?.category || "conversion";
      byCategory[category].push(change);
    });
    
    return byCategory;
  }, [filteredChanges]);

  const rollbackMutation = useMutation({
    mutationFn: async (actionId: string) => {
      return await apiRequest("POST", `/api/autonomous-actions/${actionId}/rollback`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Change Rolled Back",
        description: "The change has been reversed on your Shopify store.",
      });
      setSelectedChange(null);
      setSelectedIds(new Set());
    },
    onError: (error: any) => {
      toast({
        title: "Rollback Failed",
        description: error?.message || "Unable to rollback this change. Please try again.",
        variant: "destructive",
      });
    },
  });

  const pushToShopifyMutation = useMutation({
    mutationFn: async (actionId: string) => {
      return await apiRequest("POST", `/api/autonomous-actions/${actionId}/push-to-shopify`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Pushed to Shopify",
        description: "The change has been applied to your Shopify store.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Push Failed",
        description: error?.message || "Unable to push this change. Please try again.",
        variant: "destructive",
      });
    },
  });

  const bulkRollbackMutation = useMutation({
    mutationFn: async (actionIds: string[]) => {
      const results = await Promise.allSettled(
        actionIds.map(id => apiRequest("POST", `/api/autonomous-actions/${id}/rollback`))
      );
      const realFailures = results.filter(r => {
        if (r.status === 'fulfilled') return false;
        const msg = r.reason?.message || '';
        if (msg.includes('already') || msg.includes('rolled_back')) return false;
        return true;
      }).length;
      if (realFailures > 0) throw new Error(`${realFailures} rollbacks failed`);
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Bulk Rollback Complete",
        description: `${selectedIds.size} changes have been rolled back.`,
      });
      setSelectedIds(new Set());
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Some Rollbacks Failed",
        description: error?.message || "Some changes could not be rolled back.",
        variant: "destructive",
      });
    },
  });

  const bulkPushMutation = useMutation({
    mutationFn: async (actionIds: string[]) => {
      const results = await Promise.allSettled(
        actionIds.map(id => apiRequest("POST", `/api/autonomous-actions/${id}/push-to-shopify`))
      );
      const realFailures = results.filter(r => {
        if (r.status === 'fulfilled') return false;
        const msg = r.reason?.message || '';
        if (msg.includes('already been published')) return false;
        if (msg.includes('No optimized content')) return false;
        if (msg.includes('Cannot push action')) return false;
        return true;
      }).length;
      if (realFailures > 0) throw new Error(`${realFailures} pushes failed`);
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Bulk Push Complete",
        description: `${selectedIds.size} changes have been pushed to Shopify.`,
      });
      setSelectedIds(new Set());
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      toast({
        title: "Some Pushes Failed",
        description: error?.message || "Some changes could not be pushed.",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (approvalId: string) => {
      return await apiRequest("POST", `/api/pending-approvals/${approvalId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pending-approvals"] });
      toast({
        title: "Change Approved",
        description: "ZYRA will push this change to your Shopify store.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (approvalId: string) => {
      return await apiRequest("POST", `/api/pending-approvals/${approvalId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pending-approvals"] });
      toast({
        title: "Change Rejected",
        description: "ZYRA will not apply this change.",
      });
      setSelectedChange(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<AutomationSettings>) => {
      return await apiRequest("PATCH", "/api/automation/settings", newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your control preferences have been saved.",
      });
    },
  });

  const pendingChanges = changes?.filter(c => c.status === "pending") || [];
  const appliedChanges = changes?.filter(c => c.status === "completed") || [];
  const rolledBackChanges = changes?.filter(c => c.status === "rolled_back") || [];

  const totalRevenueImpact = appliedChanges.reduce((sum, c) => {
    const impact = parseFloat(c.actualImpact?.revenue || c.estimatedImpact?.expectedRevenue || "0");
    return sum + impact;
  }, 0);

  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    setSidebarOpen(false);
    if (tab === "change-control") return;
    if (tab === "reports") {
      setLocation("/reports");
    } else {
      setLocation("/dashboard");
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === categoryFilteredChanges.length && categoryFilteredChanges.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(categoryFilteredChanges.map(c => c.id)));
    }
  };

  const canBulkRollback = useMemo(() => {
    return Array.from(selectedIds).some(id => {
      const change = changes?.find(c => c.id === id);
      return change && (change.status === "completed" || change.status === "dry_run");
    });
  }, [selectedIds, changes]);

  const canBulkPush = useMemo(() => {
    return Array.from(selectedIds).some(id => {
      const change = changes?.find(c => c.id === id);
      return change && !change.publishedToShopify && 
        (change.status === "pending" || change.status === "completed" || change.status === "dry_run");
    });
  }, [selectedIds, changes]);

  if (isReadinessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (storeReadiness?.state === 'not_connected') {
    return (
      <div className="min-h-screen flex">
        <Sidebar 
          activeTab="change-control" 
          onTabChange={handleTabChange} 
          user={user} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'sm:ml-64 ml-0' : 'ml-0'
        }`}>
          <header className="gradient-surface border-b px-3 sm:px-6 py-2 sm:py-4 flex-shrink-0 sticky top-0 z-50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
                  data-testid="button-toggle-sidebar"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <h1 className="text-base sm:text-lg font-bold text-white truncate">Change Control</h1>
              </div>
            </div>
          </header>
          <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-auto">
            <ShopifyConnectionGate readiness={storeReadiness} />
          </div>
        </div>
      </div>
    );
  }

  if (storeReadiness?.state === 'warming_up') {
    return (
      <div className="min-h-screen flex">
        <Sidebar 
          activeTab="change-control" 
          onTabChange={handleTabChange} 
          user={user} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'sm:ml-64 ml-0' : 'ml-0'
        }`}>
          <header className="gradient-surface border-b px-3 sm:px-6 py-2 sm:py-4 flex-shrink-0 sticky top-0 z-50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
                  data-testid="button-toggle-sidebar"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <h1 className="text-base sm:text-lg font-bold text-white truncate">Change Control</h1>
              </div>
            </div>
          </header>
          <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-auto">
            <WarmUpMode readiness={storeReadiness} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        activeTab="change-control" 
        onTabChange={handleTabChange} 
        user={user} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'sm:ml-64 ml-0' : 'ml-0'
      }`}>
        <header className="gradient-surface border-b px-3 sm:px-6 py-2 sm:py-4 flex-shrink-0 sticky top-0 z-50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
                data-testid="button-toggle-sidebar"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="font-bold text-white text-sm sm:text-lg lg:text-xl xl:text-2xl truncate" data-testid="text-page-title">
                  Change Control
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm lg:text-base hidden sm:block truncate" data-testid="text-page-subtitle">
                  Full visibility and control over every AI-driven change
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1 sm:gap-3 flex-shrink-0">
              <NotificationCenter />
              <AvatarMenu />
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-auto bg-slate-950">
          <div className="container max-w-7xl mx-auto space-y-6">
            
            {selectedIds.size > 0 && (
              <Card className="bg-primary/5 border-primary/30">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedIds.size === categoryFilteredChanges.length && categoryFilteredChanges.length > 0}
                        onCheckedChange={selectAll}
                        data-testid="checkbox-select-all"
                      />
                      <span className="text-sm font-medium">{selectedIds.size} selected in {CATEGORY_CONFIG[activeCategory].label}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {canBulkRollback && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const idsToRollback = Array.from(selectedIds).filter(id => {
                              const change = changes?.find(c => c.id === id);
                              return change && (change.status === "completed" || change.status === "dry_run");
                            });
                            if (idsToRollback.length > 0) {
                              bulkRollbackMutation.mutate(idsToRollback);
                            }
                          }}
                          disabled={bulkRollbackMutation.isPending}
                          className="gap-2"
                          data-testid="button-bulk-rollback"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Bulk Rollback ({Array.from(selectedIds).filter(id => {
                            const change = changes?.find(c => c.id === id);
                            return change && (change.status === "completed" || change.status === "dry_run");
                          }).length})
                        </Button>
                      )}
                      {canBulkPush && (
                        <Button
                          size="sm"
                          onClick={() => {
                            const idsToPush = Array.from(selectedIds).filter(id => {
                              const change = changes?.find(c => c.id === id);
                              return change && !change.publishedToShopify && 
                                (change.status === "pending" || change.status === "completed" || change.status === "dry_run");
                            });
                            if (idsToPush.length > 0) {
                              bulkPushMutation.mutate(idsToPush);
                            }
                          }}
                          disabled={bulkPushMutation.isPending}
                          className="gap-2 gradient-button font-semibold tracking-wide"
                          data-testid="button-bulk-push"
                        >
                          <Upload className="w-4 h-4" />
                          Bulk Push to Shopify ({Array.from(selectedIds).filter(id => {
                            const change = changes?.find(c => c.id === id);
                            return change && !change.publishedToShopify && 
                              (change.status === "pending" || change.status === "completed" || change.status === "dry_run");
                          }).length})
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedIds(new Set())}
                        data-testid="button-clear-selection"
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="mb-4 bg-slate-900/80 border-white/5">
              <CardContent className="pt-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CATEGORY_CONFIG) as ActionCategory[]).map((category) => {
                    const config = CATEGORY_CONFIG[category];
                    const Icon = config.icon;
                    const count = category === "learning" 
                      ? (changesByCategory[category]?.length || 0) + (learningStats?.totalLearnings || 0)
                      : changesByCategory[category]?.length || 0;
                    const isActive = activeCategory === category;
                    
                    const activeBgClass: Record<ActionCategory, string> = {
                      seo: 'bg-cyan-500/15 border-cyan-500/35 text-cyan-400',
                      conversion: 'bg-green-500/15 border-green-500/35 text-green-400',
                      revenue_recovery: 'bg-amber-500/15 border-amber-500/35 text-amber-400',
                      revenue_protection: 'bg-red-500/15 border-red-500/35 text-red-400',
                      learning: 'bg-violet-500/15 border-violet-500/35 text-violet-400',
                    };

                    return (
                      <Button
                        key={category}
                        variant={isActive ? "outline" : "outline"}
                        size="sm"
                        onClick={() => handleCategoryChange(category)}
                        className={cn(
                          "gap-2 transition-all duration-150",
                          isActive 
                            ? activeBgClass[category]
                            : "bg-slate-900/60 border-white/[0.08] text-slate-300 hover-elevate"
                        )}
                        data-testid={`tab-category-${category}`}
                      >
                        <Icon className={cn("w-4 h-4", config.color)} />
                        <span className="hidden sm:inline">{config.label}</span>
                        <Badge variant="secondary" className={cn("ml-1 text-xs", isActive && config.activeColor)}>
                          {count}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {CATEGORY_CONFIG[activeCategory].description}
                </p>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                <TabsList className="bg-slate-900/80 border border-white/5 rounded-xl">
                  <TabsTrigger value="all" className="gap-2 rounded-lg data-[state=active]:bg-cyan-400 data-[state=active]:text-slate-900" data-testid="tab-all">
                    <Filter className="w-4 h-4" />
                    All ({categoryFilteredChanges.length})
                  </TabsTrigger>
                  <TabsTrigger value="applied" className="gap-2 rounded-lg data-[state=active]:bg-cyan-400 data-[state=active]:text-slate-900" data-testid="tab-applied">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Applied <span className="text-green-400">({categoryFilteredChanges.filter(c => c.status === "completed" || c.status === "dry_run").length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="gap-2 rounded-lg data-[state=active]:bg-cyan-400 data-[state=active]:text-slate-900" data-testid="tab-pending">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Pending <span className="text-amber-400">({categoryFilteredChanges.filter(c => c.status === "pending").length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="rolled_back" className="gap-2 rounded-lg data-[state=active]:bg-cyan-400 data-[state=active]:text-slate-900" data-testid="tab-rolled-back">
                    <RotateCcw className="w-4 h-4 text-violet-400" />
                    Rolled Back <span className="text-violet-400">({categoryFilteredChanges.filter(c => c.status === "rolled_back").length})</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showLatestOnly}
                    onCheckedChange={setShowLatestOnly}
                    data-testid="switch-latest-only"
                  />
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    Latest per product
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="gap-2"
                  data-testid="button-refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {changesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-48 w-full rounded-lg" />
                    ))}
                  </div>
                ) : categoryFilteredChanges.length === 0 && !(activeCategory === "learning" && learningStats && learningStats.totalLearnings > 0) ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        {activeCategory === "learning" ? (
                          <>
                            <Brain className="w-12 h-12 text-purple-400 mb-4" />
                            <h3 className="text-lg font-medium mb-2">Learning & Intelligence</h3>
                            <p className="text-muted-foreground text-sm max-w-md">
                              ZYRA continuously learns from your store data to improve future decisions. This happens automatically in the background.
                            </p>
                            <div className="flex gap-4 mt-6">
                              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <Brain className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                <p className="text-sm font-medium">Store Conversion Pattern Learning</p>
                                <Badge variant="outline" className="mt-2 text-xs bg-green-500/20 text-green-400">
                                  Active
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-sky-500/10 border border-sky-500/20">
                                <BarChart className="w-8 h-8 text-sky-400 mx-auto mb-2" />
                                <p className="text-sm font-medium">Performance Baseline Update</p>
                                <Badge variant="outline" className="mt-2 text-xs bg-green-500/20 text-green-400">
                                  Active
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-4">
                              Used internally to improve future decisions
                            </p>
                          </>
                        ) : (
                          <>
                            <Bot className="w-12 h-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No {CATEGORY_CONFIG[activeCategory].label} Changes</h3>
                            <p className="text-muted-foreground text-sm max-w-md">
                              {filterStatus === "all" 
                                ? `ZYRA will show ${CATEGORY_CONFIG[activeCategory].label.toLowerCase()} optimizations here after analyzing your store.`
                                : `No ${filterStatus === "applied" ? "applied" : filterStatus === "pending" ? "pending" : "rolled back"} changes found.`}
                            </p>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : activeCategory === "seo" ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={selectedIds.size === categoryFilteredChanges.length && categoryFilteredChanges.length > 0}
                          onCheckedChange={selectAll}
                          data-testid="checkbox-select-all-seo"
                        />
                        <span className="text-sm text-muted-foreground">
                          {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
                        </span>
                      </div>
                      {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const idsToPush = Array.from(selectedIds).filter(id => {
                                const change = changes?.find(c => c.id === id);
                                return change && !change.publishedToShopify && 
                                  (change.status === "pending" || change.status === "completed" || change.status === "dry_run");
                              });
                              if (idsToPush.length > 0) {
                                bulkPushMutation.mutate(idsToPush);
                              }
                            }}
                            disabled={bulkPushMutation.isPending}
                            className="gap-2 gradient-button font-semibold tracking-wide"
                            data-testid="button-bulk-push-seo"
                          >
                            <Upload className="w-4 h-4" />
                            Push Selected ({Array.from(selectedIds).filter(id => {
                              const change = changes?.find(c => c.id === id);
                              return change && !change.publishedToShopify && 
                                (change.status === "pending" || change.status === "completed" || change.status === "dry_run");
                            }).length})
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const idsToRollback = Array.from(selectedIds).filter(id => {
                                const change = changes?.find(c => c.id === id);
                                return change && (change.status === "completed" || change.status === "dry_run");
                              });
                              if (idsToRollback.length > 0) {
                                bulkRollbackMutation.mutate(idsToRollback);
                              }
                            }}
                            disabled={bulkRollbackMutation.isPending}
                            className="gap-2"
                            data-testid="button-bulk-rollback-seo"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Rollback Selected
                          </Button>
                        </div>
                      )}
                    </div>
                    {categoryFilteredChanges.map((change) => {
                      const config = ACTION_TYPE_CONFIG[change.actionType] || ACTION_TYPE_CONFIG.optimize_seo;
                      const statusConfig = STATUS_CONFIG[change.status] || STATUS_CONFIG.pending;
                      const Icon = config.icon;
                      const { before, after } = getBeforeAfterContent(change);
                      const allFields = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
                      const isChecked = selectedIds.has(change.id);
                      
                      return (
                        <Card 
                          key={change.id}
                          className={cn(
                            "border-blue-500/20 bg-blue-500/5 transition-all",
                            isChecked && "ring-2 ring-primary/50"
                          )}
                          data-testid={`card-seo-${change.id}`}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <Checkbox 
                                  checked={isChecked}
                                  onCheckedChange={() => toggleSelection(change.id)}
                                  className="mt-1"
                                  data-testid={`checkbox-seo-${change.id}`}
                                />
                                {change.productImage ? (
                                  <img 
                                    src={change.productImage} 
                                    alt="" 
                                    className="w-12 h-12 rounded-md object-cover border border-border"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                                    <Package className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-sm">
                                    {change.productName || (change.entityType === 'store' ? "Store-wide" : "Unknown Product")}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge variant="outline" className={cn("text-xs", config.color)}>
                                      <Icon className="w-3 h-3 mr-1" />
                                      {config.label}
                                    </Badge>
                                    <Badge variant="outline" className={cn("text-xs", statusConfig.bgColor, statusConfig.color)}>
                                      {statusConfig.label}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {allFields.length} field{allFields.length !== 1 ? 's' : ''} optimized
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {!change.publishedToShopify && (change.status === "pending" || change.status === "completed" || change.status === "dry_run") && (
                                  <Button
                                    size="sm"
                                    onClick={() => pushToShopifyMutation.mutate(change.id)}
                                    disabled={pushToShopifyMutation.isPending}
                                    className="gap-1 gradient-button font-semibold tracking-wide"
                                    data-testid={`button-push-seo-${change.id}`}
                                  >
                                    <Upload className="w-4 h-4" />
                                    Push to Shopify
                                  </Button>
                                )}
                                {(change.status === "completed" || change.status === "dry_run") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => rollbackMutation.mutate(change.id)}
                                    disabled={rollbackMutation.isPending}
                                    className="gap-1 border-red-500/40 text-red-400 font-semibold"
                                    data-testid={`button-rollback-seo-${change.id}`}
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                    Rollback
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-2 space-y-4">
                            {allFields.map((field) => (
                              <div key={field}>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                  {field}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                      <X className="w-3 h-3 text-red-400" />
                                      Before
                                    </p>
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                      {renderDescription(before[field])}
                                    </div>
                                  </div>
                                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                    <p className="text-xs text-blue-400 mb-1 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      After
                                    </p>
                                    <div className="text-sm leading-relaxed font-medium whitespace-pre-wrap break-words">
                                      {renderDescription(after[field])}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : activeCategory === "learning" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-purple-500/5 border-purple-500/20">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <Brain className="w-10 h-10 text-purple-400 flex-shrink-0" />
                            <div>
                              <h4 className="font-medium">Store Conversion Pattern Learning</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                ZYRA learns which product attributes drive conversions in your store
                              </p>
                              <Badge variant="outline" className="mt-3 bg-green-500/20 text-green-400 border-green-500/30">
                                <Activity className="w-3 h-3 mr-1" />
                                Active - Updating
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-sky-500/5 border-sky-500/20">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <BarChart className="w-10 h-10 text-sky-400 flex-shrink-0" />
                            <div>
                              <h4 className="font-medium">Product Performance Baselines</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {learningStats?.totalLearnings || 0} product baselines captured for impact measurement
                              </p>
                              <Badge variant="outline" className="mt-3 bg-green-500/20 text-green-400 border-green-500/30">
                                <Activity className="w-3 h-3 mr-1" />
                                {learningStats?.totalLearnings || 0} Snapshots
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    {learningStats && learningStats.snapshots.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          Performance Baseline Snapshots
                        </h4>
                        {learningStats.snapshots.map((snapshot: any) => (
                          <Card key={snapshot.id} className="bg-slate-900/50 border-white/5">
                            <CardContent className="py-4">
                              <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                                    <BarChart className="w-4 h-4 text-violet-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{snapshot.productTitle || "Unknown Product"}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Baseline captured on {new Date(snapshot.snapshotDate || snapshot.createdAt).toLocaleDateString()}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {snapshot.pageViews !== null && snapshot.pageViews !== undefined && (
                                        <Badge variant="outline" className="text-xs">
                                          {snapshot.pageViews} page views
                                        </Badge>
                                      )}
                                      {snapshot.conversionRate !== null && snapshot.conversionRate !== undefined && (
                                        <Badge variant="outline" className="text-xs">
                                          {Number(snapshot.conversionRate).toFixed(1)}% conversion
                                        </Badge>
                                      )}
                                      {snapshot.seoHealthScore !== null && snapshot.seoHealthScore !== undefined && (
                                        <Badge variant="outline" className="text-xs">
                                          SEO: {snapshot.seoHealthScore}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30 text-xs flex-shrink-0">
                                  Baseline Recorded
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                ) : activeCategory === "revenue_protection" ? (
                  <div className="space-y-4">
                    {categoryFilteredChanges.length === 0 ? (
                      <Card className="bg-red-500/5 border-red-500/20">
                        <CardContent className="py-8">
                          <div className="flex flex-col items-center text-center">
                            <Shield className="w-12 h-12 text-red-400 mb-4" />
                            <h3 className="text-lg font-medium mb-2">Revenue Protection Active</h3>
                            <p className="text-muted-foreground text-sm max-w-md">
                              No revenue threats detected. ZYRA is monitoring for underperforming changes and risky optimizations.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      categoryFilteredChanges.map((change) => {
                        const config = ACTION_TYPE_CONFIG[change.actionType] || ACTION_TYPE_CONFIG.underperforming_rollback;
                        const Icon = config.icon;
                        return (
                          <Card 
                            key={change.id}
                            className="border-red-500/30 bg-red-500/5"
                            data-testid={`card-protection-${change.id}`}
                          >
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg bg-red-500/20">
                                    <Icon className="w-6 h-6 text-red-400" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium flex items-center gap-2">
                                      {config.label}
                                      <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Warning
                                      </Badge>
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {change.productName || (change.entityType === 'store' ? "Store-wide" : "Unknown Product")}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {change.decisionReason || "Revenue impact detected"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => rollbackMutation.mutate(change.id)}
                                    disabled={rollbackMutation.isPending}
                                    className="gap-1 font-semibold tracking-wide"
                                    data-testid={`button-rollback-protection-${change.id}`}
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                    Rollback
                                  </Button>
                                  {change.actionType === "risky_optimization_freeze" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1 border-orange-500/40 text-orange-400 font-semibold"
                                      data-testid={`button-freeze-${change.id}`}
                                    >
                                      <Pause className="w-4 h-4" />
                                      Freeze
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                ) : activeCategory === "revenue_recovery" ? (
                  <div className="space-y-4">
                    {categoryFilteredChanges.map((change) => {
                      const config = ACTION_TYPE_CONFIG[change.actionType] || ACTION_TYPE_CONFIG.abandoned_cart_recovery;
                      const statusConfig = STATUS_CONFIG[change.status] || STATUS_CONFIG.pending;
                      const Icon = config.icon;
                      const isEnabled = change.status === "completed";
                      
                      return (
                        <Card 
                          key={change.id}
                          className={cn(
                            "transition-all",
                            isEnabled ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30 bg-yellow-500/5"
                          )}
                          data-testid={`card-recovery-${change.id}`}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  isEnabled ? "bg-green-500/20" : "bg-yellow-500/20"
                                )}>
                                  <Icon className={cn("w-6 h-6", config.color)} />
                                </div>
                                <div>
                                  <h4 className="font-medium">{config.label}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {change.productName || "Store-wide"}
                                  </p>
                                  <div className="flex items-center gap-3 mt-3">
                                    <Badge variant="outline" className={cn("text-xs", statusConfig.bgColor, statusConfig.color)}>
                                      {isEnabled ? "Enabled" : "Pending"}
                                    </Badge>
                                    {change.estimatedImpact?.expectedRevenue && (
                                      <span className="text-xs text-green-400">
                                        Expected: +{formatCurrency(change.estimatedImpact.expectedRevenue)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {!isEnabled && (
                                  <Button
                                    size="sm"
                                    onClick={() => pushToShopifyMutation.mutate(change.id)}
                                    disabled={pushToShopifyMutation.isPending}
                                    className="gap-1 gradient-button font-semibold tracking-wide"
                                    data-testid={`button-enable-${change.id}`}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Enable
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => rollbackMutation.mutate(change.id)}
                                  disabled={rollbackMutation.isPending}
                                  className="gap-1 border-red-500/40 text-red-400 font-semibold"
                                  data-testid={`button-disable-${change.id}`}
                                >
                                  <X className="w-4 h-4" />
                                  {isEnabled ? "Disable" : "Rollback"}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : activeCategory === "conversion" ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={selectedIds.size === categoryFilteredChanges.length && categoryFilteredChanges.length > 0}
                          onCheckedChange={selectAll}
                          data-testid="checkbox-select-all-conversion"
                        />
                        <span className="text-sm text-muted-foreground">
                          {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
                        </span>
                      </div>
                      {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const idsToPush = Array.from(selectedIds).filter(id => {
                                const change = changes?.find(c => c.id === id);
                                return change && !change.publishedToShopify && 
                                  (change.status === "pending" || change.status === "completed" || change.status === "dry_run");
                              });
                              if (idsToPush.length > 0) {
                                bulkPushMutation.mutate(idsToPush);
                              }
                            }}
                            disabled={bulkPushMutation.isPending}
                            className="gap-2 gradient-button font-semibold tracking-wide"
                            data-testid="button-bulk-push-conversion"
                          >
                            <Upload className="w-4 h-4" />
                            Push Selected ({Array.from(selectedIds).filter(id => {
                              const change = changes?.find(c => c.id === id);
                              return change && !change.publishedToShopify && 
                                (change.status === "pending" || change.status === "completed" || change.status === "dry_run");
                            }).length})
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const idsToRollback = Array.from(selectedIds).filter(id => {
                                const change = changes?.find(c => c.id === id);
                                return change && (change.status === "completed" || change.status === "dry_run");
                              });
                              if (idsToRollback.length > 0) {
                                bulkRollbackMutation.mutate(idsToRollback);
                              }
                            }}
                            disabled={bulkRollbackMutation.isPending}
                            className="gap-2"
                            data-testid="button-bulk-rollback-conversion"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Rollback Selected
                          </Button>
                        </div>
                      )}
                    </div>
                    {categoryFilteredChanges.map((change) => {
                      const config = ACTION_TYPE_CONFIG[change.actionType] || ACTION_TYPE_CONFIG.description_clarity;
                      const statusConfig = STATUS_CONFIG[change.status] || STATUS_CONFIG.pending;
                      const Icon = config.icon;
                      const { before, after } = getBeforeAfterContent(change);
                      const allFields = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
                      const isChecked = selectedIds.has(change.id);
                      
                      return (
                        <Card 
                          key={change.id}
                          className={cn(
                            "border-green-500/20 bg-green-500/5 transition-all",
                            isChecked && "ring-2 ring-primary/50"
                          )}
                          data-testid={`card-conversion-${change.id}`}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <Checkbox 
                                  checked={isChecked}
                                  onCheckedChange={() => toggleSelection(change.id)}
                                  className="mt-1"
                                  data-testid={`checkbox-conversion-${change.id}`}
                                />
                                {change.productImage ? (
                                  <img 
                                    src={change.productImage} 
                                    alt="" 
                                    className="w-12 h-12 rounded-md object-cover border border-border"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                                    <Package className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-sm">
                                    {change.productName || (change.entityType === 'store' ? "Store-wide" : "Unknown Product")}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge variant="outline" className={cn("text-xs", config.color)}>
                                      <Icon className="w-3 h-3 mr-1" />
                                      {config.label}
                                    </Badge>
                                    <Badge variant="outline" className={cn("text-xs", statusConfig.bgColor, statusConfig.color)}>
                                      {statusConfig.label}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {allFields.length} field{allFields.length !== 1 ? 's' : ''} optimized
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {!change.publishedToShopify && (change.status === "pending" || change.status === "completed" || change.status === "dry_run") && (
                                  <Button
                                    size="sm"
                                    onClick={() => pushToShopifyMutation.mutate(change.id)}
                                    disabled={pushToShopifyMutation.isPending}
                                    className="gap-1 gradient-button font-semibold tracking-wide"
                                    data-testid={`button-push-conversion-${change.id}`}
                                  >
                                    <Upload className="w-4 h-4" />
                                    Push to Shopify
                                  </Button>
                                )}
                                {(change.status === "completed" || change.status === "dry_run") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => rollbackMutation.mutate(change.id)}
                                    disabled={rollbackMutation.isPending}
                                    className="gap-1 border-red-500/40 text-red-400 font-semibold"
                                    data-testid={`button-rollback-conversion-${change.id}`}
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                    Rollback
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-2 space-y-4">
                            {allFields.map((field) => (
                              <div key={field}>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                  {field}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                      <X className="w-3 h-3 text-red-400" />
                                      Before
                                    </p>
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                      {renderDescription(before[field])}
                                    </div>
                                  </div>
                                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                                    <p className="text-xs text-green-400 mb-1 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      After
                                    </p>
                                    <div className="text-sm leading-relaxed font-medium whitespace-pre-wrap break-words">
                                      {renderDescription(after[field])}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Bot className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Changes in This Category</h3>
                        <p className="text-muted-foreground text-sm max-w-md">
                          ZYRA will show optimizations here after analyzing your store.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                {selectedChange ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Eye className="w-5 h-5 text-primary" />
                          Change Details
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedChange(null)}
                          data-testid="button-close-details"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        {selectedChange.productImage ? (
                          <img 
                            src={selectedChange.productImage} 
                            alt="" 
                            className="w-16 h-16 rounded-md object-cover border border-border"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{selectedChange.productName || "Unknown Product"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(selectedChange.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          Why ZYRA recommends this
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {selectedChange.decisionReason || "AI analysis identified optimization opportunities."}
                        </p>
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Expected Impact</p>
                            <p className="text-sm font-bold text-green-400">
                              +{formatCurrency(selectedChange.estimatedImpact?.expectedRevenue || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Confidence</p>
                            <p className="text-sm font-bold">
                              {selectedChange.estimatedImpact?.confidence || 85}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">AI Mode</p>
                            {(() => {
                              const aiMode = selectedChange.payload?.aiMode || selectedChange.result?.aiMode;
                              if (aiMode === 'fast') {
                                return (
                                  <p className="text-sm font-bold text-cyan-400 flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    Fast
                                  </p>
                                );
                              } else if (aiMode === 'quality') {
                                return (
                                  <p className="text-sm font-bold text-amber-400 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Quality
                                  </p>
                                );
                              }
                              return <p className="text-sm font-bold">Auto</p>;
                            })()}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          All Field Changes
                        </h4>
                        
                        {(() => {
                          const { before, after } = getBeforeAfterContent(selectedChange);
                          const allFields = new Set([...Object.keys(before), ...Object.keys(after)]);
                          
                          if (allFields.size === 0) {
                            return (
                              <p className="text-sm text-muted-foreground italic">No field changes recorded.</p>
                            );
                          }

                          return (
                            <ScrollArea className="max-h-[500px] pr-2">
                              <div className="space-y-4">
                                {Array.from(allFields).map(field => (
                                  <div key={field} className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{field}</p>
                                    <div className="grid grid-cols-1 gap-2">
                                      <div className="p-3 rounded border bg-card">
                                        <p className="text-xs text-muted-foreground mb-1">Before</p>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{renderDescription(before[field], 'Empty')}</p>
                                      </div>
                                      <div className="p-3 rounded border border-primary/30 bg-primary/5">
                                        <p className="text-xs text-primary mb-1 flex items-center gap-1">
                                          <ArrowRight className="w-3 h-3" />
                                          After
                                        </p>
                                        <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap break-words">{renderDescription(after[field], 'Empty')}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          );
                        })()}
                      </div>

                      <Separator />

                      <div className="flex flex-wrap gap-2">
                        {selectedChange.status === "pending" && (
                          <>
                            <Button 
                              onClick={() => approveMutation.mutate(selectedChange.id)}
                              disabled={approveMutation.isPending}
                              className="gap-2 flex-1"
                              data-testid="button-approve-change"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => rejectMutation.mutate(selectedChange.id)}
                              disabled={rejectMutation.isPending}
                              className="gap-2"
                              data-testid="button-reject-change"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </Button>
                          </>
                        )}
                        {(selectedChange.status === "completed" || selectedChange.status === "dry_run") && (
                          <Button 
                            variant="destructive"
                            onClick={() => rollbackMutation.mutate(selectedChange.id)}
                            disabled={rollbackMutation.isPending}
                            className="gap-2 flex-1"
                            data-testid="button-rollback-change"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Rollback to Original
                          </Button>
                        )}
                        {selectedChange.status === "rolled_back" && (
                          <Badge variant="outline" className="bg-slate-500/20 text-slate-400">
                            This change has been rolled back
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-slate-900/80 border-white/5 overflow-hidden">
                    <div className="flex">
                      <div className="w-[3px] flex-shrink-0 bg-green-500" />
                      <div className="flex-1">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2 text-cyan-50">
                            <DollarSign className="w-5 h-5 text-green-400" />
                            Revenue Impact
                          </CardTitle>
                          <CardDescription className="text-slate-400">Only what matters: money</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/25">
                            <p className="text-xs text-green-400 uppercase tracking-wide font-medium mb-1">Total Revenue Added</p>
                            <p className="text-3xl font-bold text-green-500" data-testid="text-total-revenue">{formatCurrency(totalRevenueImpact)}</p>
                            <p className="text-xs text-slate-400 mt-1" data-testid="text-applied-count">From {appliedChanges.length} applied changes</p>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                              <p className="text-2xl font-bold text-green-400">{appliedChanges.length}</p>
                              <p className="text-xs text-slate-400">Applied</p>
                            </div>
                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                              <p className="text-2xl font-bold text-amber-400">{pendingChanges.length}</p>
                              <p className="text-xs text-slate-400">Pending</p>
                            </div>
                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                              <p className="text-2xl font-bold text-violet-400">{rolledBackChanges.length}</p>
                              <p className="text-xs text-slate-400">Rolled Back</p>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="bg-slate-900/80 border-white/5">
                  <CardHeader className="pb-3">
                    <button 
                      onClick={() => setSettingsExpanded(!settingsExpanded)}
                      className="w-full flex items-center justify-between"
                      data-testid="button-toggle-settings"
                    >
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2 text-cyan-50">
                          <Shield className="w-5 h-5 text-primary" />
                          Safety & Control
                        </CardTitle>
                        <CardDescription className="text-slate-400">Your automation preferences</CardDescription>
                      </div>
                      {settingsExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>
                  </CardHeader>
                  {settingsExpanded && (
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm text-cyan-50">Enable Autopilot</Label>
                          <p className="text-xs text-slate-400">Let ZYRA auto-apply low-risk changes</p>
                        </div>
                        <Switch 
                          checked={settings?.autopilotEnabled || false}
                          onCheckedChange={(checked) => updateSettingsMutation.mutate({ autopilotEnabled: checked })}
                          data-testid="switch-autopilot"
                        />
                      </div>
                      <Separator className="opacity-10" />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm text-cyan-50">Auto-Publish to Shopify</Label>
                          <p className="text-xs text-slate-400">Automatically push approved changes</p>
                        </div>
                        <Switch 
                          checked={settings?.autoPublishEnabled || false}
                          onCheckedChange={(checked) => updateSettingsMutation.mutate({ autoPublishEnabled: checked })}
                          data-testid="switch-auto-publish"
                        />
                      </div>
                      <Separator className="opacity-10" />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm text-cyan-50">Preview Mode</Label>
                          <p className="text-xs text-slate-400">See changes before they go live</p>
                        </div>
                        <Switch 
                          checked={settings?.dryRunMode || false}
                          onCheckedChange={(checked) => updateSettingsMutation.mutate({ dryRunMode: checked })}
                          data-testid="switch-dry-run"
                        />
                      </div>
                      <Separator className="opacity-10" />
                      <div className="space-y-2">
                        <Label className="text-sm text-cyan-50">Autonomy Level</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["safe", "balanced", "aggressive"] as const).map((mode) => (
                            <Button
                              key={mode}
                              variant={settings?.autopilotMode === mode ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateSettingsMutation.mutate({ autopilotMode: mode })}
                              className="capitalize text-xs"
                              data-testid={`button-mode-${mode}`}
                            >
                              {mode === "safe" && "Low-Risk"}
                              {mode === "balanced" && "Balanced"}
                              {mode === "aggressive" && "Full Auto"}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="bg-slate-900/80 border-white/5 overflow-hidden">
                  <div className="flex">
                    <div className="w-[3px] flex-shrink-0 bg-primary" />
                    <CardContent className="pt-6 flex-1">
                      <div className="flex items-start gap-3">
                        <Bot className="w-8 h-8 text-primary flex-shrink-0" />
                        <div>
                          <h4 className="font-medium mb-1 text-cyan-50">ZYRA is watching</h4>
                          <p className="text-xs text-slate-400">
                            Your AI growth manager is continuously analyzing your store and finding opportunities to increase revenue.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
