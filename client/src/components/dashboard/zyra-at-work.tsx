import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RevenueDelta } from "@/components/ui/revenue-delta";
import { useZyraActivity, ZyraActivityEvent } from "@/contexts/ZyraActivityContext";
import { MasterLoopPanel } from "./master-loop-panel";
import { 
  Activity, 
  Search, 
  Target, 
  Zap, 
  TrendingUp, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Brain,
  RefreshCw,
  Settings,
  ImageIcon,
  MessageSquare,
  Calendar,
  Upload,
  Layers,
  History,
  ShoppingCart,
  Mail,
  DollarSign,
  Eye,
  Trophy,
  Database,
  Sparkles,
  ArrowRight,
  Package,
  FileText,
  ChevronRight,
  Terminal,
  Bot,
  Cpu,
  Lightbulb,
  BarChart3,
  Globe,
  Shield,
  Wand2,
  Pause,
  Tag,
  Eraser,
  BarChart,
  CreditCard,
  Layout
} from "lucide-react";

// ============================================================================
// TYPEWRITER TEXT COMPONENT - Shows AI "thinking" and "writing" in real-time
// ============================================================================
interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  className?: string;
  showCursor?: boolean;
}

function TypewriterText({ 
  text, 
  speed = 35, // Matched to backend activity timing for natural feel
  delay = 0, 
  onComplete, 
  className = "",
  showCursor = true 
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);
    setHasStarted(false);
    
    const startTimer = setTimeout(() => {
      setHasStarted(true);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [text, delay]);

  useEffect(() => {
    if (!hasStarted) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [hasStarted, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {showCursor && !isComplete && <span className="animate-pulse text-primary">|</span>}
    </span>
  );
}

// ============================================================================
// AI ACTIVITY LOG ENTRY - Terminal-style log entries with timestamps
// ============================================================================
interface AILogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'thinking' | 'action' | 'success' | 'warning' | 'insight';
  message: string;
  detail?: string;
  metrics?: { label: string; value: string | number }[];
}

const LOG_TYPE_CONFIG = {
  info: { icon: Terminal, color: 'text-slate-400', prefix: '[INFO]', bgColor: 'bg-slate-500/10' },
  thinking: { icon: Brain, color: 'text-purple-400', prefix: '[THINK]', bgColor: 'bg-purple-500/10' },
  action: { icon: Zap, color: 'text-amber-400', prefix: '[ACTION]', bgColor: 'bg-amber-500/10' },
  success: { icon: CheckCircle2, color: 'text-emerald-400', prefix: '[DONE]', bgColor: 'bg-emerald-500/10' },
  warning: { icon: AlertCircle, color: 'text-orange-400', prefix: '[WARN]', bgColor: 'bg-orange-500/10' },
  insight: { icon: Lightbulb, color: 'text-cyan-400', prefix: '[INSIGHT]', bgColor: 'bg-cyan-500/10' },
};

function AILogEntryComponent({ entry, isNew = false }: { entry: AILogEntry; isNew?: boolean }) {
  const config = LOG_TYPE_CONFIG[entry.type];
  const Icon = config.icon;
  const timeStr = entry.timestamp.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  });

  return (
    <div 
      className={`flex items-start gap-3 py-2.5 px-3 rounded-lg transition-all duration-500 ${
        isNew ? 'animate-in fade-in slide-in-from-left-2 bg-slate-800/50' : ''
      }`}
      data-testid={`ai-log-${entry.id}`}
    >
      <div className={`shrink-0 mt-0.5 ${config.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[10px] font-mono font-bold ${config.color}`}>
            {config.prefix}
          </span>
          <span className="text-[10px] font-mono text-slate-600">
            {timeStr}
          </span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">
          {isNew ? (
            <TypewriterText text={entry.message} speed={35} />
          ) : (
            entry.message
          )}
        </p>
        {entry.detail && (
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {entry.detail}
          </p>
        )}
        {entry.metrics && entry.metrics.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {entry.metrics.map((m, idx) => (
              <div key={idx} className={`px-2 py-1 rounded ${config.bgColor} border border-slate-700/30`}>
                <span className="text-[10px] text-slate-500">{m.label}: </span>
                <span className={`text-xs font-medium ${config.color}`}>{m.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// AI THINKING PANEL - Shows what ZYRA is reasoning about
// ============================================================================
interface ThinkingPanelProps {
  thoughts: string[];
  isActive: boolean;
}

function ThinkingPanel({ thoughts, isActive }: ThinkingPanelProps) {
  if (!isActive || thoughts.length === 0) return null;

  return (
    <div className="mb-4 p-4 rounded-lg bg-purple-500/5 border border-purple-500/20" data-testid="ai-thinking-panel">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
        </div>
        <span className="text-xs font-medium text-purple-400">ZYRA is thinking...</span>
      </div>
      <div className="space-y-2 pl-8">
        {thoughts.map((thought, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="text-purple-400/50 text-xs">•</span>
            <p className="text-sm text-slate-300 italic">
              {idx === thoughts.length - 1 ? (
                <TypewriterText text={thought} speed={20} showCursor={true} />
              ) : (
                thought
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
import { useLocation } from "wouter";
import { ShopifyConnectionGate, WarmUpMode } from "@/components/zyra/store-connection-gate";
import { MasterAutomationToggle } from "@/components/MasterAutomationToggle";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { StoreReadiness } from "@shared/schema";

interface AutomationSettings {
  globalAutopilotEnabled?: boolean;
  autopilotEnabled?: boolean;
  autonomousCreditLimit?: number;
  maxDailyActions?: number;
}

// ============================================================================
// APPROVED ZYRA ACTION TYPES (17 Total) - Per Core Specification
// ============================================================================

// ZYRA Action Categories (per spec)
type ZyraActionCategory = 'seo' | 'conversion' | 'revenue_recovery' | 'revenue_protection' | 'learning';

// All 17 Approved Action Types (per spec)
type ZyraActionType = 
  // 🔍 DISCOVERABILITY & SEO (5 Actions)
  | 'product_title'            // Product Title Optimization
  | 'meta_optimization'        // Meta Title, Meta Description & Tag Optimization
  | 'search_intent_alignment'  // Search Intent Alignment Fix
  | 'image_alt_text'           // Image Alt-Text Optimization
  | 'stale_content_refresh'    // Stale SEO Content Refresh
  // 🛒 CONVERSION OPTIMIZATION (5 Actions)
  | 'product_description_clarity' // Product Description Clarity Upgrade
  | 'value_proposition_fix'    // Value Proposition Alignment Fix
  | 'trust_signals'            // Trust Signal Enhancement
  | 'friction_copy_removal'    // Friction Copy Removal
  | 'above_fold_optimization'  // Above-the-Fold Content Optimization
  // 💰 REVENUE RECOVERY (3 Actions)
  | 'abandoned_cart_recovery'  // Abandoned Cart Recovery Activation
  | 'post_purchase_upsell'     // Post-Purchase Upsell Enablement
  | 'checkout_dropoff_mitigation' // Checkout Drop-Off Mitigation
  // 🛡️ REVENUE PROTECTION (2 Actions)
  | 'underperforming_rollback' // Underperforming Change Rollback
  | 'risky_freeze'             // Risky Optimization Freeze
  // 🧠 LEARNING & INTELLIGENCE - Silent (2 Actions)
  | 'conversion_pattern_learning'  // Store Conversion Pattern Learning
  | 'performance_baseline_update'; // Product Performance Baseline Update

// Legacy type mapping for backwards compatibility
type LegacyActionType = 'seo_basics' | 'seo_foundation' | 'product_copy_clarity' | 'trust_signals' | 'recovery_setup' | 'foundational';

// Action Type Configuration
interface ZyraActionConfig {
  type: ZyraActionType;
  category: ZyraActionCategory;
  label: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  icon: string;
  color: string;
}

// All 17 Approved Action Type Configurations (per spec)
const ZYRA_ACTION_TYPES: Record<ZyraActionType, ZyraActionConfig> = {
  // 🔍 DISCOVERABILITY & SEO (5 Actions)
  product_title: {
    type: 'product_title',
    category: 'seo',
    label: 'Product Title Optimization',
    description: 'Optimize product titles for search visibility and click-through',
    riskLevel: 'low',
    icon: 'Tag',
    color: 'text-blue-400'
  },
  meta_optimization: {
    type: 'meta_optimization',
    category: 'seo',
    label: 'Meta Title, Description & Tag Optimization',
    description: 'Optimize meta tags for better SERP appearance and CTR',
    riskLevel: 'low',
    icon: 'Globe',
    color: 'text-cyan-400'
  },
  search_intent_alignment: {
    type: 'search_intent_alignment',
    category: 'seo',
    label: 'Search Intent Alignment Fix',
    description: 'Align product content with buyer search intent',
    riskLevel: 'low',
    icon: 'Target',
    color: 'text-indigo-400'
  },
  image_alt_text: {
    type: 'image_alt_text',
    category: 'seo',
    label: 'Image Alt-Text Optimization',
    description: 'Add SEO-optimized alt text for image search visibility',
    riskLevel: 'low',
    icon: 'Image',
    color: 'text-purple-400'
  },
  stale_content_refresh: {
    type: 'stale_content_refresh',
    category: 'seo',
    label: 'Stale SEO Content Refresh',
    description: 'Update outdated content to maintain search relevance',
    riskLevel: 'low',
    icon: 'RefreshCw',
    color: 'text-teal-400'
  },
  // 🛒 CONVERSION OPTIMIZATION (5 Actions)
  product_description_clarity: {
    type: 'product_description_clarity',
    category: 'conversion',
    label: 'Product Description Clarity Upgrade',
    description: 'Improve product descriptions for better conversion',
    riskLevel: 'low',
    icon: 'FileText',
    color: 'text-emerald-400'
  },
  value_proposition_fix: {
    type: 'value_proposition_fix',
    category: 'conversion',
    label: 'Value Proposition Alignment Fix',
    description: 'Clarify product value to address buyer hesitation',
    riskLevel: 'low',
    icon: 'Sparkles',
    color: 'text-amber-400'
  },
  trust_signals: {
    type: 'trust_signals',
    category: 'conversion',
    label: 'Trust Signal Enhancement',
    description: 'Add trust elements to increase buyer confidence',
    riskLevel: 'low',
    icon: 'Shield',
    color: 'text-green-400'
  },
  friction_copy_removal: {
    type: 'friction_copy_removal',
    category: 'conversion',
    label: 'Friction Copy Removal',
    description: 'Remove confusing or hesitation-causing language',
    riskLevel: 'low',
    icon: 'Eraser',
    color: 'text-orange-400'
  },
  above_fold_optimization: {
    type: 'above_fold_optimization',
    category: 'conversion',
    label: 'Above-the-Fold Content Optimization',
    description: 'Optimize first-view content to capture buyer attention',
    riskLevel: 'low',
    icon: 'Layout',
    color: 'text-pink-400'
  },
  // 💰 REVENUE RECOVERY (3 Actions)
  abandoned_cart_recovery: {
    type: 'abandoned_cart_recovery',
    category: 'revenue_recovery',
    label: 'Abandoned Cart Recovery Activation',
    description: 'Activate cart recovery to recapture lost sales',
    riskLevel: 'low',
    icon: 'ShoppingCart',
    color: 'text-red-400'
  },
  post_purchase_upsell: {
    type: 'post_purchase_upsell',
    category: 'revenue_recovery',
    label: 'Post-Purchase Upsell Enablement',
    description: 'Enable post-purchase offers to increase order value',
    riskLevel: 'low',
    icon: 'TrendingUp',
    color: 'text-lime-400'
  },
  checkout_dropoff_mitigation: {
    type: 'checkout_dropoff_mitigation',
    category: 'revenue_recovery',
    label: 'Checkout Drop-Off Mitigation',
    description: 'Reduce checkout abandonment with recovery flows',
    riskLevel: 'low',
    icon: 'CreditCard',
    color: 'text-rose-400'
  },
  // 🛡️ REVENUE PROTECTION (2 Actions)
  underperforming_rollback: {
    type: 'underperforming_rollback',
    category: 'revenue_protection',
    label: 'Underperforming Change Rollback',
    description: 'Revert changes that caused revenue decline',
    riskLevel: 'medium',
    icon: 'RotateCcw',
    color: 'text-yellow-400'
  },
  risky_freeze: {
    type: 'risky_freeze',
    category: 'revenue_protection',
    label: 'Risky Optimization Freeze',
    description: 'Pause risky optimizations to protect revenue',
    riskLevel: 'medium',
    icon: 'Pause',
    color: 'text-slate-400'
  },
  // 🧠 LEARNING & INTELLIGENCE - Silent (2 Actions)
  conversion_pattern_learning: {
    type: 'conversion_pattern_learning',
    category: 'learning',
    label: 'Store Conversion Pattern Learning',
    description: 'Learn what copy and patterns convert for this store',
    riskLevel: 'low',
    icon: 'Brain',
    color: 'text-violet-400'
  },
  performance_baseline_update: {
    type: 'performance_baseline_update',
    category: 'learning',
    label: 'Product Performance Baseline Update',
    description: 'Update performance baselines for future comparisons',
    riskLevel: 'low',
    icon: 'BarChart',
    color: 'text-sky-400'
  }
};

// Revenue Signal Types - ONLY money-related signals
type RevenueSignalType = 
  | 'high_traffic_low_conversion'  // High traffic with low conversion
  | 'funnel_dropoff'               // Drop-offs between funnel stages
  | 'wasted_visitors'              // Products wasting visitors
  | 'revenue_decline'              // Revenue decline after a change
  | 'missing_recovery'             // Missing recovery flows
  | 'conversion_readiness_gap';    // New-store conversion readiness gaps

// Revenue Signal Detection
interface RevenueSignal {
  type: RevenueSignalType;
  productId?: string;
  productName?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  estimatedRevenueLoss: number;
  eligibleActions: ZyraActionType[];
}

// Action Score Calculation (per spec: Impact × Confidence × Risk Inverse)
interface ActionScore {
  actionType: ZyraActionType;
  expectedRevenueImpact: number;
  confidenceScore: number;      // 0-1
  riskInverse: number;          // 1 / risk (higher = safer)
  totalScore: number;           // Impact × Confidence × RiskInverse
}

// Decision Explanation (business language per spec)
interface ActionDecision {
  selectedAction: ZyraActionType;
  productId?: string;
  productName?: string;
  whyThisProduct: string;       // Why this product
  whyThisAction: string;        // Why this action
  whyNow: string;               // Why now
  whySafe: string;              // Why it is safe
  score: ActionScore;
}

// Revenue Proof (ONLY revenue metrics - no vanity metrics)
interface RevenueProof {
  revenueGained: number;
  revenueProtected: number;
  revenueLost: number;
  proofStatement: string;       // "This action generated / protected ₹_____"
}

// Store Learning (what ZYRA learns from each action)
interface StoreLearning {
  copyPatterns: string[];       // What copy converts for this store
  safeActions: ZyraActionType[];
  riskyActions: ZyraActionType[];
  bestTiming: string[];
  productTypeResponses: Record<string, string>;
}

// Foundational action for new stores (expanded to support all action types)
interface FoundationalAction {
  type: ZyraActionType | LegacyActionType;
  category?: 'FOUNDATION' | 'GROWTH' | 'GUARD';
  productId?: string;
  productName?: string;
  title: string;
  description: string;
  whyItHelps: string;
  expectedImpact: string;
  riskLevel: 'low' | 'medium' | 'high';
  // Sub-actions for the Master Loop card display
  subActions?: string[];
  // Master Loop context fields
  storeSituation?: string;
  activePlan?: string;
  detectedIssue?: string;
  funnelStage?: string;
  // Decision explanation fields (per spec)
  whyThisProduct?: string;
  whyThisAction?: string;
  whyNow?: string;
  whySafe?: string;
  // Score calculation
  score?: ActionScore;
}

// Execution results from real AI-powered optimization
interface ContentChange {
  field: string;
  before: string;
  after: string;
  reason: string;
}

interface ProductOptimization {
  productId: string;
  productName: string;
  changes: ContentChange[];
  impactExplanation: string;
}

interface ExecutionResult {
  success: boolean;
  actionLabel: string;
  productsOptimized: ProductOptimization[];
  totalChanges: number;
  estimatedImpact: string;
  executionTimeMs: number;
}

interface ExecutionActivityItem {
  id: string;
  timestamp: string;
  phase: 'detect' | 'decide' | 'execute' | 'prove' | 'learn';
  message: string;
  status: 'in_progress' | 'completed' | 'warning';
  details?: string;
  productName?: string;
  changes?: ContentChange[];
}

interface ZyraStats {
  activePhase: string;
  currentAction: string | null;
  todayRevenueDelta: number;
  todayOptimizations: number;
  pendingApprovals: number;
  successRate: number;
  lastActionAt: string | null;
  detection?: {
    phase: 'idle' | 'detect_started' | 'cache_loaded' | 'friction_identified' | 'decision_ready' | 'preparing';
    complete: boolean;
    cacheStatus: string;
    timestamp: number;
  };
  // New store mode: for stores with age < 30 days OR orders < 50
  isNewStore?: boolean;
  storeAgeDays?: number;
  totalOrders?: number;
  // Foundational action for new stores
  foundationalAction?: FoundationalAction;
  // Execution status for loop progression
  executionStatus?: 'pending' | 'running' | 'awaiting_approval' | 'idle' | 'completed';
  // Execution phase from backend (real-time sync)
  executionPhase?: 'idle' | 'executing' | 'proving' | 'learning' | 'completed';
  committedActionId?: string | null;
}

interface ZyraEvent {
  id: string;
  timestamp: Date;
  phase: 'detect' | 'decide' | 'execute' | 'prove' | 'learn';
  message: string;
  status: 'in_progress' | 'completed' | 'warning';
  details?: string;
}

interface ActivityFeedResponse {
  activities: {
    id: string;
    timestamp: string;
    phase: 'detect' | 'decide' | 'execute' | 'prove' | 'learn';
    message: string;
    status: 'in_progress' | 'completed' | 'warning';
    details?: string;
  }[];
}

// Revenue-friction intelligence phases - trust-first language
const PHASE_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
  primaryText: string;
  secondaryText: string;
  statusMessage: string;
}> = {
  detect: { 
    icon: Search, 
    label: 'DETECT', 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/10',
    primaryText: 'Monitoring store signals in real time',
    secondaryText: 'Revenue signals active',
    statusMessage: 'Live intelligence layer active'
  },
  decide: { 
    icon: Brain, 
    label: 'DECIDE', 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/10',
    primaryText: 'ZYRA is deciding the next best revenue move',
    secondaryText: 'Evaluating impact, confidence, and risk',
    statusMessage: 'Analyzing the best action to take...'
  },
  execute: { 
    icon: Zap, 
    label: 'EXECUTE', 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/10',
    primaryText: 'Applying approved revenue optimization',
    secondaryText: 'Changes are being published safely',
    statusMessage: 'Publishing changes to your store...'
  },
  prove: { 
    icon: TrendingUp, 
    label: 'PROVE', 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/10',
    primaryText: 'Measuring revenue impact',
    secondaryText: 'Comparing before and after results',
    statusMessage: 'Tracking the impact of changes...'
  },
  learn: { 
    icon: Target, 
    label: 'LEARN', 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/10',
    primaryText: 'ZYRA is improving future decisions',
    secondaryText: 'Learning what converts better for your store',
    statusMessage: 'Updating strategies based on results...'
  },
};


// Business-language progress stages with microcopy variations for slow detection
const PROGRESS_STAGES = [
  {
    id: 1,
    icon: TrendingUp,
    title: 'Monitoring store performance',
    descriptions: [
      'Tracking your real-time sales data and conversion rates',
      'Analyzing live revenue patterns',
      'Detecting active traffic and engagement signals'
    ],
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    baseTime: 3000 // 3 seconds
  },
  {
    id: 2,
    icon: Search,
    title: 'Detecting revenue friction points',
    descriptions: [
      'Monitoring the moments where potential customers hesitate',
      'Tracking drop-off points in the buying journey',
      'Detecting where interest doesn\'t convert to sales'
    ],
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    baseTime: 5000 // 5 seconds
  },
  {
    id: 3,
    icon: DollarSign,
    title: 'Estimating lost revenue',
    descriptions: [
      'Calculating how much money these friction points cost your store',
      'Measuring the revenue impact of each issue',
      'Quantifying the opportunity for improvement'
    ],
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    baseTime: 5000 // 5 seconds
  },
  {
    id: 4,
    icon: Target,
    title: 'Selecting highest-impact opportunity',
    descriptions: [
      'Prioritizing the change that will recover the most revenue',
      'Finding the quick win with the biggest payoff',
      'Choosing the improvement that matters most'
    ],
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    baseTime: 5000 // 5 seconds
  },
  {
    id: 5,
    icon: CheckCircle2,
    title: 'Next revenue move ready',
    descriptions: [
      'Your recommended improvement is ready for review',
      'A high-impact optimization has been prepared',
      'Your next revenue opportunity is waiting'
    ],
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    baseTime: 4000 // 4 seconds - waits for detection
  },
  {
    id: 6,
    icon: Zap,
    title: 'Applying approved improvement',
    descriptions: [
      'Publishing your optimization to the store safely',
      'Making the approved changes live',
      'Implementing the revenue improvement'
    ],
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    baseTime: 4000 // 4 seconds
  },
  {
    id: 7,
    icon: TrendingUp,
    title: 'Measuring revenue impact',
    descriptions: [
      'Comparing before and after performance to prove results',
      'Tracking the improvement in real-time',
      'Monitoring the revenue change'
    ],
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    baseTime: 4000 // 4 seconds
  },
  {
    id: 8,
    icon: Brain,
    title: 'Improving future decisions',
    descriptions: [
      'Learning what works best for your specific store',
      'Building smarter recommendations for next time',
      'Getting better at finding revenue opportunities'
    ],
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    baseTime: 3000 // 3 seconds
  }
];

// Total expected time: 33 seconds (within 30-45s target)
const TOTAL_BASE_TIME = PROGRESS_STAGES.reduce((sum, s) => sum + s.baseTime, 0);

type DetectionPhase = 'idle' | 'detect_started' | 'cache_loaded' | 'friction_identified' | 'decision_ready' | 'preparing';

const phaseToMinStage: Record<DetectionPhase, number> = {
  idle: 0,
  detect_started: 1,
  cache_loaded: 3,
  friction_identified: 5,
  decision_ready: 7,
  preparing: 2,
};

const AUTO_ADVANCE_TIMEOUT_MS = 10000;
const STAGE_AUTO_ADVANCE_MS = 2500;

type StrictDetectionStatus = 'friction_found' | 'no_friction' | 'insufficient_data' | 'foundational_action' | 'detecting';

function ProgressStages({ 
  isAutopilotEnabled, 
  detectionPhase = 'idle',
  detectionStatus = 'detecting',
  isDetectionComplete = false,
  isNewStore = false,
  foundationalAction,
  executionStatus = 'idle',
  committedActionId = null,
  onApprove,
  isApproving = false,
  onComplete,
  activePhase = 'detect',
  executionResult = null,
  executionActivities = []
}: { 
  isAutopilotEnabled: boolean;
  detectionPhase?: DetectionPhase;
  detectionStatus?: StrictDetectionStatus;
  isDetectionComplete?: boolean;
  isNewStore?: boolean;
  foundationalAction?: FoundationalAction;
  executionStatus?: 'pending' | 'running' | 'awaiting_approval' | 'idle' | 'completed';
  committedActionId?: string | null;
  onApprove?: (actionId: string) => void;
  isApproving?: boolean;
  onComplete?: () => void;
  activePhase?: 'detect' | 'decide' | 'execute' | 'prove' | 'learn';
  executionResult?: ExecutionResult | null;
  executionActivities?: ExecutionActivityItem[];
}) {
  const [currentStage, setCurrentStage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [descriptionIndex, setDescriptionIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const hardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPhaseRef = useRef<DetectionPhase>('idle');
  const targetStage = phaseToMinStage[detectionPhase] || 0;
  
  // Real-time activity stream
  const { events: streamEvents, isConnected: isStreamConnected, isReconnecting } = useZyraActivity();

  // Map SSE event phases to progress stages (1-8)
  // Stages 1-4: DETECT phase (checking store, identifying friction, estimating revenue, selecting opportunity)
  // Stage 5: DECIDE phase (next move ready)
  // Stage 6: EXECUTE phase (applying improvement)
  // Stage 7: PROVE phase (measuring impact)
  // Stage 8: LEARN phase (improving decisions)
  const ssePhaseToStage = useCallback((phase: string, status: string): number => {
    switch (phase) {
      case 'detect':
        // Progress through stages 0-3 based on status
        if (status === 'in_progress') return 1; // Checking store performance
        if (status === 'completed') return 3; // Estimating lost revenue
        return 0;
      case 'decide':
        if (status === 'in_progress') return 3; // Selecting highest-impact opportunity
        if (status === 'completed') return 4; // Next revenue move ready
        return 3;
      case 'execute':
        if (status === 'in_progress') return 5; // Applying improvement
        if (status === 'completed') return 5;
        return 5;
      case 'prove':
        if (status === 'in_progress') return 6; // Measuring impact
        if (status === 'completed') return 6;
        return 6;
      case 'learn':
        if (status === 'in_progress') return 7; // Improving decisions
        if (status === 'completed') return 7; // Complete
        return 7;
      default:
        return 0;
    }
  }, []);

  // Drive progress stages from SSE events
  useEffect(() => {
    if (streamEvents.length === 0) return;
    
    // Get the most recent event
    const latestEvent = streamEvents[streamEvents.length - 1];
    const sseStage = ssePhaseToStage(latestEvent.phase, latestEvent.status);
    
    // Only advance forward (never go backwards)
    if (sseStage > currentStage) {
      console.log(`[ProgressStages] SSE event advancing to stage ${sseStage + 1}: ${latestEvent.phase} (${latestEvent.status})`);
      setCurrentStage(sseStage);
    }
  }, [streamEvents, currentStage, ssePhaseToStage]);

  useEffect(() => {
    if (isAutopilotEnabled && detectionPhase !== 'idle' && !startTime) {
      setStartTime(Date.now());
      console.log('[ProgressStages] Detection started - SSE-driven progress');
    }
    if (!isAutopilotEnabled || detectionPhase === 'idle') {
      setStartTime(null);
    }
  }, [isAutopilotEnabled, detectionPhase, startTime]);

  useEffect(() => {
    if (!isAutopilotEnabled || detectionPhase === 'idle') return;
    
    // Fallback hard timeout if SSE is not available
    hardTimeoutRef.current = setTimeout(() => {
      if (!isStreamConnected && streamEvents.length === 0) {
        console.log('[ProgressStages] Hard timeout (10s) reached - no SSE events, forcing completion');
        setCurrentStage(PROGRESS_STAGES.length - 1);
        setStartTime(null);
        onComplete?.();
      }
    }, AUTO_ADVANCE_TIMEOUT_MS);
    
    return () => {
      if (hardTimeoutRef.current) {
        clearTimeout(hardTimeoutRef.current);
      }
    };
  }, [isAutopilotEnabled, detectionPhase, onComplete, isStreamConnected, streamEvents.length]);

  // Fallback auto-advance only if SSE is not connected AND no events received
  useEffect(() => {
    if (!isAutopilotEnabled || detectionPhase === 'idle' || isDetectionComplete) return;
    
    // Only auto-advance if SSE is not working
    if (isStreamConnected || streamEvents.length > 0) {
      // SSE is active, don't auto-advance
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
      return;
    }
    
    autoAdvanceRef.current = setInterval(() => {
      setCurrentStage(prev => {
        const next = Math.min(prev + 1, PROGRESS_STAGES.length - 2);
        console.log(`[ProgressStages] Fallback auto-advancing to stage ${next + 1} (SSE not connected)`);
        return next;
      });
    }, STAGE_AUTO_ADVANCE_MS);
    
    return () => {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
      }
    };
  }, [isAutopilotEnabled, detectionPhase, isDetectionComplete, isStreamConnected, streamEvents.length]);

  useEffect(() => {
    if (!isAutopilotEnabled) return;
    
    const interval = setInterval(() => {
      setDescriptionIndex(prev => (prev + 1) % 3);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isAutopilotEnabled]);

  useEffect(() => {
    if (isDetectionComplete || detectionPhase === 'decision_ready') {
      console.log(`[ProgressStages] Detection complete with status: ${detectionStatus} - showing final stage`);
      setCurrentStage(PROGRESS_STAGES.length - 1);
      setStartTime(null);
      if (hardTimeoutRef.current) clearTimeout(hardTimeoutRef.current);
      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
      onComplete?.();
    }
  }, [detectionPhase, isDetectionComplete, detectionStatus, onComplete]);

  useEffect(() => {
    if (detectionPhase !== lastPhaseRef.current) {
      lastPhaseRef.current = detectionPhase;
      
      if (currentStage < targetStage && !isTransitioning) {
        advanceToTarget();
      }
    }
  }, [detectionPhase, targetStage]);

  const advanceToTarget = () => {
    if (currentStage >= targetStage) return;
    
    setIsTransitioning(true);
    timeoutRef.current = setTimeout(() => {
      setCurrentStage(prev => Math.min(prev + 1, targetStage));
      setDescriptionIndex(0);
      setIsTransitioning(false);
      
      if (currentStage + 1 < targetStage) {
        advanceToTarget();
      }
    }, 500);
  };

  useEffect(() => {
    if (!isAutopilotEnabled) {
      setCurrentStage(0);
      setDescriptionIndex(0);
      setStartTime(null);
      return;
    }

    if (currentStage < targetStage && !isTransitioning) {
      advanceToTarget();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAutopilotEnabled, targetStage]);

  const stage = PROGRESS_STAGES[currentStage];
  const Icon = stage.icon;
  const description = stage.descriptions[descriptionIndex % stage.descriptions.length];
  const progress = ((currentStage + 1) / PROGRESS_STAGES.length) * 100;

  // Get the current phase config for status display
  const phaseConfig = PHASE_CONFIG[activePhase] || PHASE_CONFIG.detect;
  const PhaseIcon = phaseConfig.icon;

  // Map backend execution activity to log entry type
  const mapPhaseToLogType = (phase: string, status: string): 'info' | 'thinking' | 'action' | 'success' | 'warning' | 'insight' => {
    if (status === 'warning') return 'warning';
    if (status === 'completed' && phase === 'learn') return 'success';
    if (status === 'completed' && phase === 'prove') return 'success';
    switch (phase) {
      case 'detect': return 'info';
      case 'decide': return 'action';
      case 'execute': return status === 'completed' ? 'action' : 'thinking';
      case 'prove': return 'insight';
      case 'learn': return 'success';
      default: return 'info';
    }
  };

  // Generate dynamic activity log entries based on current phase
  // PRIORITY: Real-time SSE events only - no simulated fallback
  const generateLogEntries = useCallback((): AILogEntry[] => {
    const entries: AILogEntry[] = [];
    const now = new Date();
    
    // Use real-time SSE events (keep showing even if disconnected)
    if (streamEvents.length > 0) {
      streamEvents.forEach((event: ZyraActivityEvent) => {
        entries.push({
          id: event.id,
          timestamp: new Date(event.timestamp),
          type: event.status as AILogEntry['type'],
          message: event.message,
          detail: event.detail,
          metrics: event.metrics?.map(m => ({ label: m.label, value: m.value })),
        });
      });
    }
    
    // Add execution activities if any
    if (executionActivities.length > 0) {
      executionActivities.forEach((activity) => {
        const activityTimestamp = typeof activity.timestamp === 'string' 
          ? new Date(activity.timestamp) 
          : activity.timestamp;
        entries.push({
          id: activity.id || `activity-${activityTimestamp.getTime()}`,
          timestamp: activityTimestamp,
          type: activity.status === 'completed' ? 'success' : 
                activity.status === 'warning' ? 'warning' : 'action',
          message: activity.message,
          detail: activity.details,
        });
      });
    }
    
    // Show waiting message only when no events yet and connected
    if (entries.length === 0 && isStreamConnected) {
      entries.push({
        id: 'waiting',
        timestamp: now,
        type: 'info',
        message: 'Waiting for ZYRA engine activity...',
        detail: 'Real-time events will appear here as they happen'
      });
    } else if (entries.length === 0 && !isStreamConnected && !isReconnecting) {
      entries.push({
        id: 'connecting',
        timestamp: now,
        type: 'info',
        message: 'Connecting to activity stream...',
        detail: 'Establishing real-time connection'
      });
    } else if (entries.length === 0 && isReconnecting) {
      entries.push({
        id: 'reconnecting',
        timestamp: now,
        type: 'warning',
        message: 'Reconnecting to activity stream...',
        detail: 'Connection was interrupted'
      });
    }
    
    return entries;
  }, [streamEvents, executionActivities, isStreamConnected, isReconnecting]);

  const logEntries = generateLogEntries();
  const latestEntry = logEntries[logEntries.length - 1];

  // Generate thinking thoughts based on phase
  const generateThoughts = useCallback((): string[] => {
    const thoughts: string[] = [];
    
    // Detection phase thoughts
    if (currentStage >= 1 && currentStage < 5 && !isDetectionComplete) {
      thoughts.push('Examining product listing quality and SEO signals...');
    }
    if (currentStage >= 2 && currentStage < 5 && !isDetectionComplete) {
      thoughts.push('Comparing trust elements against high-converting stores...');
    }
    if (currentStage >= 3 && currentStage < 5 && !isDetectionComplete) {
      thoughts.push('Evaluating which changes will drive the most revenue...');
    }
    
    // Execution phase thoughts
    if (executionStatus === 'running' && activePhase === 'execute') {
      thoughts.push('Analyzing your brand voice and writing style...');
      thoughts.push('Generating compelling, conversion-focused copy...');
      thoughts.push('Applying SEO best practices to content...');
    }
    
    // Prove phase thoughts
    if (executionStatus === 'running' && activePhase === 'prove') {
      thoughts.push('Verifying Shopify product updates applied correctly...');
      thoughts.push('Setting baseline metrics for performance tracking...');
    }
    
    // Learn phase thoughts
    if (executionStatus === 'running' && activePhase === 'learn') {
      thoughts.push('Recording successful optimization patterns...');
      thoughts.push('Updating store optimization profile...');
    }
    
    return thoughts;
  }, [currentStage, isDetectionComplete, executionStatus, activePhase]);

  const thoughts = generateThoughts();
  const isThinking = (currentStage >= 1 && currentStage < 5 && !isDetectionComplete) || 
                     (executionStatus === 'running' && ['execute', 'prove', 'learn'].includes(activePhase));

  // Early return: ZYRA standby screen
  if (!isAutopilotEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
          <DollarSign className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-white font-medium mb-2">ZYRA is on standby</p>
        <p className="text-slate-400 text-sm max-w-sm">
          Ready to find revenue opportunities. Turn on autopilot above to start.
        </p>
      </div>
    );
  }

  // Early return: Baseline collection screen for newly connected stores
  if (detectionStatus === 'insufficient_data' && detectionPhase === 'idle' && !isDetectionComplete && currentStage === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
          <Database className="w-7 h-7 text-amber-400" />
        </div>
        <p className="text-amber-400 font-medium mb-2">Collecting baseline data</p>
        <p className="text-slate-400 text-sm max-w-sm">
          ZYRA will act once signals are strong. This happens automatically as your store receives traffic.
        </p>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* Header with Phase Status - Live Intelligence Display */}
      <div className={`mb-4 p-3 rounded-lg ${phaseConfig.bgColor} border border-slate-700/50`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${phaseConfig.bgColor} flex items-center justify-center relative`}>
            <PhaseIcon className={`w-4.5 h-4.5 ${phaseConfig.color}`} />
            {isStreamConnected && (
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${phaseConfig.color}`}>
                {phaseConfig.label}
              </span>
              {isStreamConnected && activePhase === 'detect' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                  LIVE
                </span>
              )}
              {isReconnecting && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
                  RECONNECTING
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {activePhase === 'detect' && isStreamConnected 
                ? phaseConfig.primaryText
                : isReconnecting 
                  ? 'Reconnecting to live intelligence'
                  : phaseConfig.statusMessage}
            </p>
          </div>
          <div className="text-right">
            {isStreamConnected ? (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-medium">Active</span>
              </div>
            ) : isReconnecting ? (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] text-amber-400 font-medium">Reconnecting</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="text-[10px] text-slate-500 font-medium">Connecting</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Thinking Panel */}
      <ThinkingPanel thoughts={thoughts} isActive={isThinking} />

      {/* Live Activity Feed - Terminal Style */}
      <div className="mb-4 rounded-lg bg-slate-900/70 border border-slate-700/50 overflow-hidden" data-testid="live-activity-feed">
        {/* Terminal Header */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border-b border-slate-700/30">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className={`w-2.5 h-2.5 rounded-full ${isStreamConnected ? 'bg-green-500' : isReconnecting ? 'bg-yellow-500 animate-pulse' : 'bg-green-500/60'}`} />
          </div>
          <span className="text-[10px] font-mono text-slate-500 ml-2">
            ZYRA Activity Log
            {isStreamConnected && <span className="text-emerald-400 ml-1">(Live)</span>}
            {isReconnecting && <span className="text-yellow-400 ml-1">(Reconnecting...)</span>}
          </span>
          <div className="flex-1" />
          <Bot className="w-3.5 h-3.5 text-primary" />
        </div>
        
        {/* Log Entries */}
        <div className="max-h-64 overflow-y-auto p-2 space-y-1" data-testid="activity-log-entries">
          {logEntries.map((entry, idx) => (
            <AILogEntryComponent 
              key={entry.id} 
              entry={entry} 
              isNew={idx === logEntries.length - 1 && !isDetectionComplete}
            />
          ))}
        </div>
      </div>

      {/* Live Signals Status Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-3 px-1">
          {/* Live signal indicators */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">Signals:</span>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isStreamConnected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span className={`text-[10px] ${isStreamConnected ? 'text-emerald-400' : 'text-slate-500'}`}>Traffic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isStreamConnected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span className={`text-[10px] ${isStreamConnected ? 'text-emerald-400' : 'text-slate-500'}`}>Conversions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isStreamConnected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span className={`text-[10px] ${isStreamConnected ? 'text-emerald-400' : 'text-slate-500'}`}>Revenue</span>
            </div>
          </div>
          <div className="flex-1" />
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            {isStreamConnected ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400">Live</span>
              </>
            ) : isReconnecting ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] text-amber-400">Reconnecting...</span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span className="text-[10px] text-slate-500">Connecting...</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Status Display for completed detection - Step 8 is ALWAYS a terminal success state */}
      {isDetectionComplete && (
        <div className={`mt-4 p-4 rounded-lg ${
          detectionStatus === 'friction_found' ? 'bg-emerald-500/10 border border-emerald-500/30' :
          (detectionStatus === 'foundational_action' || isNewStore) ? 'bg-slate-800/60 border border-slate-700/50' :
          'bg-blue-500/10 border border-blue-500/30'
        }`}>
          {/* ZYRA ACTION QUEUED - Enhanced card design for Master Loop actions */}
          {(detectionStatus === 'foundational_action' || isNewStore) && foundationalAction ? (
            <div className="text-left">
              {/* Header: ZYRA ACTION QUEUED + Status */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {executionStatus === 'completed' ? 'ZYRA ACTION COMPLETE' :
                     executionStatus === 'running' ? 'ZYRA EXECUTING' : 'ZYRA ACTION QUEUED'}
                  </span>
                  {executionStatus === 'running' && (
                    <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                  )}
                  {executionStatus === 'completed' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                {executionStatus === 'awaiting_approval' && committedActionId && onApprove && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      console.log('[ZYRA Button] Approve button clicked for:', committedActionId);
                      onApprove(committedActionId);
                    }}
                    disabled={isApproving}
                    data-testid="button-approve-foundational-action"
                  >
                    {isApproving ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 mr-1" />
                        Approve & Run
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {/* Action Category Badge */}
              <div className="mb-3">
                <Badge className={`text-[10px] uppercase tracking-wider ${
                  foundationalAction.category === 'GUARD' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                  foundationalAction.category === 'GROWTH' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {foundationalAction.category === 'GUARD' ? 'Guard Action' :
                   foundationalAction.category === 'GROWTH' ? 'Growth Action' :
                   'Foundation Action'}
                </Badge>
              </div>
              
              {/* Action Title */}
              <h3 className="text-base font-semibold text-foreground mb-2">
                {foundationalAction.title}
              </h3>
              
              {/* Product Name */}
              {foundationalAction.productName && (
                <div className="mb-3">
                  <span className="text-xs text-slate-500">Product:</span>
                  <p className="text-sm text-foreground font-medium">
                    {foundationalAction.productName}
                  </p>
                </div>
              )}
              
              {/* Sub-Actions List */}
              {foundationalAction.subActions && foundationalAction.subActions.length > 0 && (
                <div className="mb-4">
                  <span className="text-xs text-slate-500 mb-2 block">Sub-Actions:</span>
                  <ul className="space-y-1">
                    {foundationalAction.subActions.map((subAction, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{subAction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Why ZYRA chose this - Always visible structured format */}
              <div className="mb-4 p-3 bg-slate-900/50 rounded-md border border-slate-700/30">
                <p className="text-xs font-medium text-slate-400 mb-2">Why ZYRA chose this:</p>
                <div className="space-y-1.5 text-xs">
                  {foundationalAction.storeSituation && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">Store Situation:</span>
                      <span className="text-slate-300">{foundationalAction.storeSituation}</span>
                    </div>
                  )}
                  {foundationalAction.activePlan && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">Active Plan:</span>
                      <span className="text-slate-300">{foundationalAction.activePlan}</span>
                    </div>
                  )}
                  {foundationalAction.detectedIssue && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">Detected Issue:</span>
                      <span className="text-slate-300">{foundationalAction.detectedIssue}</span>
                    </div>
                  )}
                  {foundationalAction.funnelStage && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">Funnel Stage:</span>
                      <span className="text-slate-300">{foundationalAction.funnelStage}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">Risk Level:</span>
                    <span className={`${
                      foundationalAction.riskLevel === 'low' ? 'text-emerald-400' :
                      foundationalAction.riskLevel === 'medium' ? 'text-amber-400' : 'text-red-400'
                    }`}>{foundationalAction.riskLevel === 'low' ? 'Low' : foundationalAction.riskLevel === 'medium' ? 'Medium' : 'High'}</span>
                  </div>
                </div>
              </div>
              
              {/* Expected Impact - Dynamic from backend */}
              <div className="mb-4">
                <p className="text-xs font-medium text-slate-400 mb-2">Expected Impact:</p>
                <p className="text-xs text-slate-300">{foundationalAction.expectedImpact}</p>
              </div>
              
              {/* Risk Level Footer with Auto-Rollback */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-700/30">
                <Badge className={`${
                  foundationalAction.riskLevel === 'low' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  foundationalAction.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {foundationalAction.riskLevel === 'low' ? 'Low Risk' : 
                   foundationalAction.riskLevel === 'medium' ? 'Medium Risk' : 'High Risk'}
                </Badge>
                <span className="text-xs text-slate-500">|</span>
                <span className="text-xs text-slate-400">Auto-Rollback Enabled</span>
              </div>
              
              {/* Legacy AI DECISION EXPLANATION - Expandable for more details */}
              {executionStatus === 'awaiting_approval' && (
                <details className="mt-4 group" data-testid="ai-reasoning-details">
                  <summary className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer hover:text-slate-300 transition-colors list-none">
                    <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                    <span>More details on this decision</span>
                  </summary>
                  <div className="mt-2 p-2.5 bg-slate-800/40 rounded-md border border-slate-700/30">
                    <div className="space-y-2.5 text-xs">
                      {/* WHY THIS PRODUCT */}
                      {foundationalAction.productName && (
                        <div className="flex items-start gap-2" data-testid="decision-why-product">
                          <Package className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-slate-300 font-medium">Why this product</p>
                            <p className="text-slate-400 mt-0.5">
                              {foundationalAction.whyThisProduct || 
                                `"${foundationalAction.productName}" has the highest potential for revenue improvement based on traffic and conversion patterns.`}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* WHY THIS ACTION */}
                      <div className="flex items-start gap-2" data-testid="decision-why-action">
                        <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-slate-300 font-medium">Why this action</p>
                          <p className="text-slate-400 mt-0.5">
                            {foundationalAction.whyThisAction || (
                              foundationalAction.type === 'seo_basics' || foundationalAction.type === 'seo_foundation'
                                ? 'SEO optimization has the highest impact-to-risk ratio for increasing discoverability and organic revenue.'
                                : foundationalAction.type === 'trust_signals'
                                ? 'Trust signals directly address first-time buyer hesitation, the #1 barrier to conversion for new stores.'
                                : foundationalAction.type === 'product_copy_clarity'
                                ? 'Clear, compelling product copy removes purchase friction and increases add-to-cart rates.'
                                : foundationalAction.type === 'recovery_setup'
                                ? 'Recovery flows capture revenue that would otherwise be lost from abandoned carts and missed follow-ups.'
                                : 'This action scored highest in the revenue impact calculation (Impact × Confidence × Safety).'
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {/* WHY NOW */}
                      <div className="flex items-start gap-2" data-testid="decision-why-now">
                        <Clock className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-slate-300 font-medium">Why now</p>
                          <p className="text-slate-400 mt-0.5">
                            {foundationalAction.whyNow || 
                              'This opportunity has the highest urgency based on current traffic patterns and revenue signals. Delaying may result in continued revenue loss.'}
                          </p>
                        </div>
                      </div>
                      
                      {/* WHY IT IS SAFE */}
                      <div className="flex items-start gap-2" data-testid="decision-why-safe">
                        <Shield className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-slate-300 font-medium">Why it is safe</p>
                          <p className="text-slate-400 mt-0.5">
                            {foundationalAction.whySafe || 
                              `${foundationalAction.riskLevel === 'low' ? 'Low risk' : foundationalAction.riskLevel === 'medium' ? 'Medium risk' : 'Higher risk'} - All changes are reversible with instant rollback. ZYRA saves original content before any modification.`}
                          </p>
                        </div>
                      </div>
                      
                      {/* ACTION SCORE (if available) */}
                      {foundationalAction.score && (
                        <div className="mt-2 pt-2 border-t border-slate-700/30" data-testid="decision-score">
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="text-slate-500">Action Score:</span>
                            <Badge className="bg-primary/20 text-primary border-0 text-[10px] h-5">
                              Impact: {foundationalAction.score.expectedRevenueImpact.toLocaleString()}
                            </Badge>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px] h-5">
                              Confidence: {Math.round(foundationalAction.score.confidenceScore * 100)}%
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-400 border-0 text-[10px] h-5">
                              Safety: {Math.round(foundationalAction.score.riskInverse * 100)}%
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              )}
              
              {/* EXECUTION RESULTS DISPLAY - Shows real changes made */}
              {executionResult && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className={`w-4 h-4 ${executionResult.productsOptimized.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span className={`text-sm font-medium ${executionResult.productsOptimized.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {executionResult.totalChanges > 0 
                        ? `${executionResult.totalChanges} Changes Applied`
                        : 'Action Completed'}
                    </span>
                  </div>
                  
                  {executionResult.productsOptimized.length > 0 ? (
                    <div className="space-y-3">
                      {executionResult.productsOptimized.map((product, pIdx) => (
                        <div key={pIdx} className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-xs font-medium text-white mb-2">
                            {product.productName}
                          </p>
                          <div className="space-y-2">
                            {product.changes.map((change, cIdx) => (
                              <div key={cIdx} className="text-xs">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-primary font-medium">{change.field}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-1 ml-2">
                                  <div className="flex items-start gap-2">
                                    <span className="text-red-400/70 font-mono text-[10px] uppercase">Before:</span>
                                    <span className="text-slate-500 line-through">{change.before}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-emerald-400/70 font-mono text-[10px] uppercase">After:</span>
                                    <span className="text-emerald-300">{change.after}</span>
                                  </div>
                                  <p className="text-slate-400 italic mt-1">{change.reason}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700/30">
                            {product.impactExplanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 rounded-lg p-3">
                      <p className="text-xs text-amber-400">
                        No product changes were needed at this time. Your store is already optimized for this action.
                      </p>
                    </div>
                  )}
                  
                  <div className={`mt-3 p-2 rounded text-center ${executionResult.productsOptimized.length > 0 ? 'bg-emerald-500/10' : 'bg-slate-800/50'}`}>
                    <p className={`text-xs font-medium ${executionResult.productsOptimized.length > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {executionResult.estimatedImpact}
                    </p>
                  </div>
                </div>
              )}
              
              {/* EXECUTION ACTIVITIES LOG - Detailed step-by-step log */}
              {executionActivities.length > 0 && !executionResult && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-slate-300">Activity Log</span>
                  </div>
                  <div className="space-y-2">
                    {executionActivities.slice(-5).map((activity, idx) => (
                      <div key={activity.id || idx} className="flex items-start gap-2 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                          activity.status === 'completed' ? 'bg-emerald-400' :
                          activity.status === 'warning' ? 'bg-amber-400' : 'bg-primary'
                        }`} />
                        <div className="flex-1">
                          <p className="text-slate-300">{activity.message}</p>
                          {activity.details && (
                            <p className="text-slate-500 mt-0.5">{activity.details}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (detectionStatus === 'foundational_action' || isNewStore) ? (
            // Fallback for new stores without foundational action (should not happen)
            <div className="text-left">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-sm font-medium text-primary">
                    Next Move Ready
                  </p>
                </div>
                {executionStatus === 'awaiting_approval' && onApprove && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onApprove('foundational_trust_signals')}
                    disabled={isApproving}
                    data-testid="button-approve-fallback-action"
                  >
                    {isApproving ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 mr-1" />
                        Approve & Run
                      </>
                    )}
                  </Button>
                )}
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Build Buyer Confidence
              </p>
              <p className="text-xs text-slate-400 mb-2">
                Add trust elements like clear policies, badges, and social proof
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  Low Risk
                </span>
                <span className="text-xs text-slate-500">
                  Prepares your store to overcome first-time buyer doubt
                </span>
              </div>
            </div>
          ) : detectionStatus === 'friction_found' ? (
            <div className="text-left">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    executionStatus === 'running' ? 'bg-amber-400' : 
                    executionResult ? 'bg-emerald-400' : 'bg-emerald-400'
                  } ${executionResult ? '' : 'animate-pulse'}`} />
                  <p className={`text-sm font-medium ${
                    executionStatus === 'running' ? 'text-amber-400' : 
                    executionResult ? 'text-emerald-400' : 'text-emerald-400'
                  }`}>
                    {executionResult ? 'Optimization Complete' :
                     executionStatus === 'running' 
                      ? (activePhase === 'prove' ? 'Proving Results...' 
                         : activePhase === 'learn' ? 'Learning & Improving...' 
                         : 'Applying Optimization...') 
                      : executionStatus === 'awaiting_approval' ? 'Review & Approve' 
                      : 'Revenue Opportunity Found'}
                  </p>
                  {executionStatus === 'running' && !executionResult && (
                    <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                  )}
                  {executionResult && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                {executionStatus === 'awaiting_approval' && committedActionId && onApprove && !executionResult && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onApprove(committedActionId)}
                    disabled={isApproving}
                    data-testid="button-approve-friction-action"
                  >
                    {isApproving ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 mr-1" />
                        Approve & Fix
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              <p className="text-sm font-medium text-foreground mb-1">
                {executionResult ? `${executionResult.actionLabel || 'AI Optimization'}` : 'Friction Point Detected'}
              </p>
              <p className="text-xs text-slate-400 mb-2">
                {executionResult 
                  ? `Successfully applied ${executionResult.totalChanges} improvements`
                  : 'ZYRA found a revenue opportunity that needs attention'}
              </p>
              
              {!executionResult && executionStatus !== 'running' && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    Low Risk
                  </span>
                  <span className="text-xs text-slate-500">
                    Changes can be rolled back instantly
                  </span>
                </div>
              )}
              
              {executionStatus === 'running' && !executionResult && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-slate-300">
                      {activePhase === 'execute' ? 'Applying AI-generated improvements to your products...' :
                       activePhase === 'prove' ? 'Verifying changes and setting up tracking...' :
                       activePhase === 'learn' ? 'Recording optimization patterns for future use...' :
                       'Processing optimization...'}
                    </span>
                  </div>
                </div>
              )}
              
              {executionResult && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className={`w-4 h-4 ${executionResult.productsOptimized.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span className={`text-sm font-medium ${executionResult.productsOptimized.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {executionResult.totalChanges > 0 
                        ? `${executionResult.totalChanges} Changes Applied`
                        : 'Action Completed'}
                    </span>
                  </div>
                  
                  {executionResult.productsOptimized.length > 0 ? (
                    <div className="space-y-3">
                      {executionResult.productsOptimized.map((product, pIdx) => (
                        <div key={pIdx} className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-xs font-medium text-white mb-2">
                            {product.productName}
                          </p>
                          <div className="space-y-2">
                            {product.changes.map((change, cIdx) => (
                              <div key={cIdx} className="text-xs">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-primary font-medium">{change.field}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-1 ml-2">
                                  <div className="flex items-start gap-2">
                                    <span className="text-red-400/70 font-mono text-[10px] uppercase">Before:</span>
                                    <span className="text-slate-500 line-through">{change.before || '(empty)'}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-emerald-400/70 font-mono text-[10px] uppercase">After:</span>
                                    <span className="text-emerald-300">{change.after}</span>
                                  </div>
                                  {change.reason && (
                                    <p className="text-slate-400 italic mt-1">{change.reason}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700/30">
                            {product.impactExplanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 rounded-lg p-3">
                      <p className="text-xs text-amber-400">
                        No product changes were needed at this time. Your store is already optimized for this action.
                      </p>
                    </div>
                  )}
                  
                  <div className={`mt-3 p-2 rounded text-center ${executionResult.productsOptimized.length > 0 ? 'bg-emerald-500/10' : 'bg-slate-800/50'}`}>
                    <p className={`text-xs font-medium ${executionResult.productsOptimized.length > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {executionResult.estimatedImpact}
                    </p>
                  </div>
                </div>
              )}
              
              {executionActivities.length > 0 && !executionResult && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-slate-300">Live Activity</span>
                  </div>
                  <div className="space-y-2">
                    {executionActivities.slice(-5).map((activity, idx) => (
                      <div key={activity.id || idx} className="flex items-start gap-2 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                          activity.status === 'completed' ? 'bg-emerald-400' :
                          activity.status === 'warning' ? 'bg-amber-400' : 'bg-primary'
                        }`} />
                        <div className="flex-1">
                          <p className="text-slate-300">{activity.message}</p>
                          {activity.details && (
                            <p className="text-slate-500 mt-0.5">{activity.details}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium text-blue-400">
                No urgent revenue risk detected
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ZYRA is actively monitoring your store for new opportunities
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// CSS animation for smooth event entry - injected once globally
const ANIMATION_INJECTED_KEY = 'zyra-event-animation-injected';

function injectEventAnimation() {
  if (typeof document !== 'undefined' && !document.getElementById(ANIMATION_INJECTED_KEY)) {
    const style = document.createElement('style');
    style.id = ANIMATION_INJECTED_KEY;
    style.textContent = `
      @keyframes slideInFade {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Inject animation styles once on module load
injectEventAnimation();

function EventItem({ event, isTyping, onTypingComplete }: { 
  event: ZyraEvent; 
  isTyping: boolean;
  onTypingComplete?: () => void;
}) {
  const config = PHASE_CONFIG[event.phase];
  const Icon = config.icon;
  
  const StatusIcon = event.status === 'completed' 
    ? CheckCircle2 
    : event.status === 'warning' 
      ? AlertCircle 
      : Clock;
  
  const statusColor = event.status === 'completed' 
    ? 'text-emerald-400' 
    : event.status === 'warning' 
      ? 'text-amber-400' 
      : 'text-slate-400';

  // Smooth entry animation with staggered delay based on status
  const isNewEvent = event.status === 'in_progress';
  
  return (
    <div 
      className="flex items-start gap-3 py-3 border-b border-slate-700/50 last:border-0"
      style={isNewEvent ? { animation: 'slideInFade 0.3s ease-out' } : undefined}
    >
        <div className={`p-2 rounded-lg ${config.bgColor} flex-shrink-0 ${
          isNewEvent ? 'ring-2 ring-primary/30 ring-offset-1 ring-offset-transparent' : ''
        }`}>
          <Icon className={`w-4 h-4 ${config.color} ${isNewEvent ? 'animate-pulse' : ''}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${config.color} border-current/30`}>
              {config.label}
            </Badge>
            <span className="text-[10px] text-slate-500">
              {event.timestamp.toLocaleTimeString()}
            </span>
            {isNewEvent && (
              <span className="text-[10px] text-primary animate-pulse">Active</span>
            )}
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            {isTyping ? (
              <TypewriterText text={event.message} onComplete={onTypingComplete} />
            ) : (
              event.message
            )}
          </p>
          {event.details && !isTyping && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <StatusIcon className={`w-3 h-3 ${statusColor}`} />
              {event.details}
            </p>
          )}
        </div>
    </div>
  );
}

type OptimizationMode = 'fast' | 'competitive';

export default function ZyraAtWork() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  
  // Real-time SSE activity stream for phase indicators
  const { events: streamEvents, isConnected: isStreamConnected, isReconnecting } = useZyraActivity();
  
  // Optimization mode preference (stored in localStorage)
  const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('zyra_optimization_mode') as OptimizationMode) || 'fast';
    }
    return 'fast';
  });
  
  const handleModeChange = (mode: OptimizationMode) => {
    setOptimizationMode(mode);
    localStorage.setItem('zyra_optimization_mode', mode);
  };

  // CRITICAL: Check store readiness before showing ZYRA At Work
  // ZYRA must NEVER run if Shopify is not connected
  const { data: storeReadiness, isLoading: isReadinessLoading } = useQuery<StoreReadiness>({
    queryKey: ['/api/store-readiness'],
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery<ZyraStats>({
    queryKey: ['/api/zyra/live-stats'],
    refetchInterval: 5000,
    enabled: storeReadiness?.state === 'ready',
  });

  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionStartTime, setDetectionStartTime] = useState<number | null>(null);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track post-approval phase progression (execute → prove → learn)
  const [approvedPhase, setApprovedPhase] = useState<'idle' | 'execute' | 'prove' | 'learn' | 'complete'>('idle');
  const approvedPhaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track completed action IDs to prevent button from reappearing after execution
  const [completedActionId, setCompletedActionId] = useState<string | null>(null);
  
  // Store execution results for display
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executionActivities, setExecutionActivities] = useState<ExecutionActivityItem[]>([]);
  
  // Track previous activities count for detecting new entries
  const prevActivitiesCountRef = useRef<number>(0);
  
  const DETECTION_TIMEOUT_MS = 10000;
  
  const { data: detectionStatusData } = useQuery<{
    phase: DetectionPhase;
    status: 'friction_found' | 'no_friction' | 'insufficient_data' | 'foundational_action' | 'detecting';
    complete: boolean;
    timestamp: number;
    lastValidNextMoveId?: string;
    reason?: string;
    nextAction?: 'standby' | 'data_collection' | 'decide' | 'foundational';
    isNewStore?: boolean;
    foundationalAction?: FoundationalAction;
    // DECIDE COMMIT STATUS - UI contract
    executionStatus?: 'pending' | 'running' | 'awaiting_approval' | 'idle' | 'completed';
    // Execution phase from backend (real-time sync)
    executionPhase?: 'idle' | 'executing' | 'proving' | 'learning' | 'completed';
    committedActionId?: string | null;
    nextState?: 'awaiting_approval' | 'auto_execute' | 'idle';
  }>({
    queryKey: ['/api/zyra/detection-status'],
    // Poll during detection (fast), and continue polling after completion for execution status
    refetchInterval: isDetecting ? 1000 : 5000,
    // Keep enabled after detection completes to show executionStatus/CTA
    enabled: storeReadiness?.state === 'ready',
    // Reduce staleTime so we get fresh data after detection
    staleTime: 2000,
  });
  
  // Initialize toast early since it's used by mutations below
  const { toast } = useToast();
  
  // Approve action mutation for awaiting_approval state
  const approveActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      console.log('[ZYRA Approve] Starting mutation for actionId:', actionId);
      
      // Check if it's a foundational action
      if (actionId.startsWith('foundational_')) {
        console.log('[ZYRA Approve] Executing foundational action:', actionId);
        // Execute foundational action - returns real execution results
        const response = await apiRequest('POST', '/api/zyra/execute-foundational', { 
          type: actionId.replace('foundational_', '') 
        });
        const result = await response.json();
        console.log('[ZYRA Approve] Foundational action result:', result);
        return result;
      }
      // Regular friction action - approve then execute
      const approveResponse = await apiRequest('POST', '/api/next-move/approve', { 
        opportunityId: actionId 
      });
      const approveData = await approveResponse.json();
      
      if (!approveData.success) {
        throw new Error(approveData.message || 'Failed to approve action');
      }
      
      // Execute the action after approval - returns real execution results
      const executeResponse = await apiRequest('POST', '/api/next-move/execute', { 
        opportunityId: actionId 
      });
      const executeData = await executeResponse.json();
      
      if (!executeData.success) {
        throw new Error(executeData.error || 'Execution failed');
      }
      
      // Return real execution results from backend
      return executeData;
    },
    onSuccess: async (data, actionId) => {
      console.log('[ZYRA Approve] onSuccess called with data:', data, 'actionId:', actionId);
      
      // Track this action as completed to prevent button from reappearing
      setCompletedActionId(actionId);
      
      // Store execution results for display
      if (data?.result) {
        setExecutionResult(data.result);
      }
      
      // Fetch execution activities for detailed log
      try {
        const activitiesResponse = await fetch('/api/zyra/execution-activities', {
          credentials: 'include',
        });
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          if (activitiesData.activities) {
            setExecutionActivities(activitiesData.activities);
          }
        }
      } catch (err) {
        console.log('[ZYRA] Could not fetch execution activities:', err);
      }
      
      toast({
        title: data?.success ? 'Optimization Complete' : 'Action Approved',
        description: data?.message || 'ZYRA has applied the improvements',
      });
      // Start post-approval phase progression: execute → prove → learn → complete
      setApprovedPhase('execute');
      queryClient.invalidateQueries({ queryKey: ['/api/zyra/detection-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/zyra/live-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/revenue-loop/activity-feed'] });
    },
    onError: (error) => {
      console.error('[ZYRA Approve] Mutation error:', error);
      toast({
        title: 'Approval Failed',
        description: error instanceof Error ? error.message : 'Could not approve the action. Please try again.',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (detectionStatusData?.complete) {
      setIsDetecting(false);
      setDetectionStartTime(null);
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = null;
      }
    }
  }, [detectionStatusData?.complete]);

  useEffect(() => {
    if (isDetecting && detectionStartTime) {
      detectionTimeoutRef.current = setTimeout(() => {
        console.log('[ZYRA Detection] Client-side timeout reached (10s) - forcing loop advance');
        setIsDetecting(false);
        setDetectionStartTime(null);
        queryClient.invalidateQueries({ queryKey: ['/api/zyra/detection-status'] });
        queryClient.invalidateQueries({ queryKey: ['/api/zyra/live-stats'] });
      }, DETECTION_TIMEOUT_MS);
      
      return () => {
        if (detectionTimeoutRef.current) {
          clearTimeout(detectionTimeoutRef.current);
        }
      };
    }
  }, [isDetecting, detectionStartTime]);

  // Post-approval phase auto-progression: execute (3s) → prove (3s) → learn (3s) → complete
  useEffect(() => {
    if (approvedPhase === 'idle' || approvedPhase === 'complete') {
      return;
    }
    
    // Clear any existing timeout
    if (approvedPhaseTimeoutRef.current) {
      clearTimeout(approvedPhaseTimeoutRef.current);
    }
    
    // Set timeout for next phase transition
    const phaseDelays = { execute: 3000, prove: 3000, learn: 3000 };
    const nextPhases = { execute: 'prove', prove: 'learn', learn: 'complete' } as const;
    
    approvedPhaseTimeoutRef.current = setTimeout(() => {
      const next = nextPhases[approvedPhase as keyof typeof nextPhases];
      console.log(`[ZYRA Phase] Transitioning from ${approvedPhase} → ${next}`);
      setApprovedPhase(next);
      
      // When complete, keep in completed state (don't refresh - this would show the button again)
      if (next === 'complete') {
        console.log('[ZYRA Phase] Loop completed - staying in complete state');
        // Don't reset to idle - keep showing completed state
        // The completedActionId will prevent the button from reappearing
      }
    }, phaseDelays[approvedPhase as keyof typeof phaseDelays]);
    
    return () => {
      if (approvedPhaseTimeoutRef.current) {
        clearTimeout(approvedPhaseTimeoutRef.current);
      }
    };
  }, [approvedPhase]);

  // When detection-status query is disabled (isDetecting=false), use stats as primary source
  const detectionPhase = (isDetecting && detectionStatusData?.phase) || stats?.detection?.phase || 'idle';
  
  // Derive strict status from server endpoint - NEVER default to 'no_friction'
  // When detection-status query is disabled (stale data), prioritize stats query
  // Check for foundational action to set proper status
  const hasFoundationalAction = detectionStatusData?.foundationalAction || stats?.foundationalAction;
  const detectionStatus: StrictDetectionStatus = 
    (isDetecting && detectionStatusData?.status) || 
    (hasFoundationalAction ? 'foundational_action' : 
     stats?.detection?.complete ? 'insufficient_data' : 'detecting');
  
  // Use strict status to determine completion - NOT boolean
  // Also check if stats says detection is complete OR if phase is decision_ready
  const isDetectionComplete = detectionStatus !== 'detecting' || 
    stats?.detection?.complete === true || 
    detectionPhase === 'decision_ready';
  
  // Determine if detection is actively running (from server state, not just local mutation)
  const isActivelyDetecting = (
    isDetecting || 
    (detectionPhase !== 'idle' && !isDetectionComplete)
  );
  
  // Derive execution status from both detection-status and stats (with fallback)
  const serverExecutionStatus = detectionStatusData?.executionStatus || stats?.executionStatus || 'idle';
  const serverExecutionPhase = detectionStatusData?.executionPhase || stats?.executionPhase || 'idle';
  const derivedCommittedActionId = detectionStatusData?.committedActionId || stats?.committedActionId || null;
  
  // Derive execution status - backend execution state takes priority
  // This ensures frontend stays in sync with backend execution progress
  // Get the current action ID to check against completed actions
  const currentActionId = detectionStatusData?.committedActionId || stats?.committedActionId;
  
  const derivedExecutionStatus = (() => {
    // If we've already completed this exact action, show 'completed' instead of 'awaiting_approval'
    if (completedActionId && currentActionId === completedActionId) {
      return 'completed';
    }
    // Local approvedPhase is complete - show 'completed'
    if (approvedPhase === 'complete') {
      return 'completed';
    }
    // Backend is actively executing - always show 'running'
    if (serverExecutionPhase !== 'idle' && serverExecutionPhase !== 'completed') {
      return 'running';
    }
    // Local approvedPhase fallback for fast UI updates
    if (!['idle', 'complete'].includes(approvedPhase)) {
      return 'running';
    }
    // Default to server's execution status
    return serverExecutionStatus;
  })();
  
  // LIVE POLLING: Fetch execution activities during running state for real-time log updates
  const isExecutionActive = derivedExecutionStatus === 'running' || !['idle', 'complete'].includes(approvedPhase);
  
  const { data: liveActivitiesData } = useQuery<{ activities: ExecutionActivityItem[] }>({
    queryKey: ['/api/zyra/execution-activities'],
    // Poll frequently during execution for live updates (every 800ms for smooth display)
    refetchInterval: isExecutionActive ? 800 : false,
    enabled: isExecutionActive && storeReadiness?.state === 'ready',
    staleTime: 500,
  });
  
  // Update execution activities from live polling
  useEffect(() => {
    if (liveActivitiesData?.activities && liveActivitiesData.activities.length > 0) {
      const newCount = liveActivitiesData.activities.length;
      const prevCount = prevActivitiesCountRef.current;
      
      // Only update if we have new activities
      if (newCount > prevCount || prevCount === 0) {
        console.log(`[ZYRA Live Activities] Updating: ${prevCount} -> ${newCount} activities`);
        setExecutionActivities(liveActivitiesData.activities);
        prevActivitiesCountRef.current = newCount;
      }
    }
  }, [liveActivitiesData]);
  
  // 30-second fail-safe timer for stuck states
  // If execution is stuck in 'running' for too long, force refresh
  // For 'awaiting_approval', use a longer timeout (2 min) to give user time to respond
  const FAILSAFE_RUNNING_TIMEOUT_MS = 30000;
  const FAILSAFE_APPROVAL_TIMEOUT_MS = 120000;
  const executionStartTimeRef = useRef<number | null>(null);
  const failsafeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastExecutionStatusRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Use derived execution status that combines detection-status and stats
    const executionStatus = derivedExecutionStatus;
    
    // Detect status change - reset timer if status changed
    if (executionStatus !== lastExecutionStatusRef.current) {
      if (failsafeTimeoutRef.current) {
        clearTimeout(failsafeTimeoutRef.current);
        failsafeTimeoutRef.current = null;
      }
      executionStartTimeRef.current = null;
      lastExecutionStatusRef.current = executionStatus || null;
    }
    
    if (executionStatus === 'running' || executionStatus === 'awaiting_approval') {
      // Start fail-safe timer for running or awaiting_approval state
      if (!executionStartTimeRef.current) {
        executionStartTimeRef.current = Date.now();
        const timeout = executionStatus === 'running' ? FAILSAFE_RUNNING_TIMEOUT_MS : FAILSAFE_APPROVAL_TIMEOUT_MS;
        failsafeTimeoutRef.current = setTimeout(() => {
          console.log(`[ZYRA Fail-safe] ${executionStatus} stuck for ${timeout/1000}s - forcing refresh`);
          queryClient.invalidateQueries({ queryKey: ['/api/zyra/detection-status'] });
          queryClient.invalidateQueries({ queryKey: ['/api/zyra/live-stats'] });
          queryClient.invalidateQueries({ queryKey: ['/api/revenue-loop/activity-feed'] });
          executionStartTimeRef.current = null;
          if (executionStatus === 'running') {
            toast({
              title: 'Execution Check',
              description: 'Refreshing status - action may have completed',
            });
          }
        }, timeout);
      }
    } else {
      // Clear fail-safe timer if execution completed
      if (failsafeTimeoutRef.current) {
        clearTimeout(failsafeTimeoutRef.current);
        failsafeTimeoutRef.current = null;
      }
      executionStartTimeRef.current = null;
    }
    
    return () => {
      if (failsafeTimeoutRef.current) {
        clearTimeout(failsafeTimeoutRef.current);
      }
    };
  }, [derivedExecutionStatus, toast]);

  const { data: activityData, isLoading, refetch, isRefetching } = useQuery<ActivityFeedResponse>({
    queryKey: ['/api/revenue-loop/activity-feed'],
    // Faster polling during active detection (using server state) for smoother updates
    refetchInterval: isActivelyDetecting ? 3000 : 15000,
    // Only fetch activity if store is ready
    enabled: storeReadiness?.state === 'ready',
  });

  // Fetch automation settings for autopilot toggle
  const { data: automationSettings } = useQuery<AutomationSettings>({
    queryKey: ['/api/automation/settings'],
    enabled: storeReadiness?.state === 'ready',
  });

  const isAutopilotEnabled = automationSettings?.globalAutopilotEnabled ?? false;

  const triggerDetectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/zyra/detect', {});
      return response.json();
    },
    onMutate: () => {
      console.log('[ZYRA Detection] Starting detection - timer started');
      setIsDetecting(true);
      setDetectionStartTime(Date.now());
    },
    onSuccess: (data) => {
      console.log('[ZYRA Detection] Completed:', data?.status || 'unknown');
      setIsDetecting(false);
      setDetectionStartTime(null);
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = null;
      }
      queryClient.invalidateQueries({ queryKey: ['/api/zyra/live-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/zyra/detection-status'] });
    },
    onError: (error) => {
      console.error('[ZYRA Detection] Failed:', error);
      setIsDetecting(false);
      setDetectionStartTime(null);
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = null;
      }
    },
  });

  // Toggle autopilot mutation
  const toggleAutopilotMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiRequest('PUT', '/api/automation/settings', { 
        globalAutopilotEnabled: enabled 
      });
      return response.json();
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/revenue-loop/activity-feed'] });
      
      if (enabled) {
        triggerDetectionMutation.mutate();
      }
      
      toast({
        title: enabled ? 'ZYRA Autopilot Enabled' : 'ZYRA Autopilot Disabled',
        description: enabled 
          ? 'ZYRA will now automatically detect and execute revenue opportunities.'
          : 'ZYRA will create recommendations for your approval.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update autopilot setting',
        variant: 'destructive'
      });
    }
  });

  // AUTO-TRIGGER: Start detection when page loads with autopilot enabled
  // This ensures detection runs even if user already had autopilot on
  const hasTriggeredInitialDetection = useRef(false);
  
  useEffect(() => {
    // Check if execution recently completed (within last 2 minutes)
    const recentlyCompleted = serverExecutionPhase === 'completed' || 
      (detectionStatusData?.executionStatus === 'completed');
    
    // Only trigger once per page load when conditions are met
    // Don't trigger if loop recently completed - wait for user action
    if (
      storeReadiness?.state === 'ready' &&
      isAutopilotEnabled &&
      !isDetecting &&
      !hasTriggeredInitialDetection.current &&
      !recentlyCompleted &&
      (detectionPhase === 'idle' || !detectionStatusData?.complete)
    ) {
      console.log('[ZYRA Detection] Auto-triggering initial detection on page load');
      hasTriggeredInitialDetection.current = true;
      triggerDetectionMutation.mutate();
    }
  }, [storeReadiness?.state, isAutopilotEnabled, isDetecting, detectionPhase, detectionStatusData?.complete, serverExecutionPhase, detectionStatusData?.executionStatus]);

  const events: ZyraEvent[] = (activityData?.activities?.map(a => ({
    ...a,
    timestamp: new Date(a.timestamp),
  })) || []).reverse();

  const hasRealData = events.length > 0;

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [events]);

  // Get backend execution phase for real-time sync
  const backendExecutionPhase = detectionStatusData?.executionPhase || stats?.executionPhase || 'idle';
  
  // Map backend execution phase to frontend phase names
  const mapBackendPhase = (phase: string): 'detect' | 'decide' | 'execute' | 'prove' | 'learn' => {
    switch (phase) {
      case 'executing': return 'execute';
      case 'proving': return 'prove';
      case 'learning': return 'learn';
      default: return 'detect';
    }
  };
  
  // Determine current phase - sync with execution status for consistency
  // Priority: executionResult > backendExecutionPhase > approvedPhase > executionStatus > events > detection phase > default
  // Helper to validate execution result has real change data
  const hasValidExecutionData = (result: ExecutionResult | null): boolean => {
    if (!result || !result.productsOptimized || result.productsOptimized.length === 0) {
      return false;
    }
    // Check at least one product has changes with real 'after' values
    // Note: 'before' may be null for fast-path executions (partialData flag)
    return result.productsOptimized.some(product => 
      product.changes && product.changes.length > 0 &&
      product.changes.some((change: { after?: string }) => change.after && change.after.length > 0)
    );
  };
  
  const currentPhase = (() => {
    // HIGHEST PRIORITY: Real-time SSE events - most authoritative source
    if (streamEvents.length > 0 && isStreamConnected) {
      const latestEvent = streamEvents[streamEvents.length - 1];
      // Map SSE event types to phases
      if (latestEvent.eventType.startsWith('DETECT_')) {
        return 'detect';
      } else if (latestEvent.eventType.startsWith('DECIDE_')) {
        return 'decide';
      } else if (latestEvent.eventType.startsWith('EXECUTE_')) {
        return 'execute';
      } else if (latestEvent.eventType.startsWith('PROVE_')) {
        return 'prove';
      } else if (latestEvent.eventType.startsWith('LEARN_')) {
        return 'learn';
      }
      // Use event's phase field if event type doesn't match
      if (latestEvent.phase) {
        return latestEvent.phase;
      }
    }
    
    // If we have VALIDATED execution results with real data, show 'learn'
    if (executionResult && hasValidExecutionData(executionResult)) {
      return 'learn';
    }
    // Backend is executing - use its phase (synced with server)
    if (backendExecutionPhase !== 'idle' && backendExecutionPhase !== 'completed') {
      return mapBackendPhase(backendExecutionPhase);
    }
    // Backend completed but no valid results - stay in prove phase (error state)
    if (backendExecutionPhase === 'completed' && !hasValidExecutionData(executionResult)) {
      return 'prove';
    }
    // Backend completed with valid results - show learn
    if (backendExecutionPhase === 'completed') {
      return 'learn';
    }
    // If local approvedPhase is active (fallback for fast UI updates)
    if (approvedPhase !== 'idle' && approvedPhase !== 'complete') {
      return approvedPhase;
    }
    // If approvedPhase just completed, check for valid results
    if (approvedPhase === 'complete') {
      return hasValidExecutionData(executionResult) ? 'learn' : 'prove';
    }
    // If actively executing, show execute phase
    if (derivedExecutionStatus === 'running') {
      return 'execute';
    }
    // If awaiting approval, show decide phase
    if (derivedExecutionStatus === 'awaiting_approval') {
      return 'decide';
    }
    // If detecting (pending), show detect phase
    if (derivedExecutionStatus === 'pending' || isActivelyDetecting) {
      return 'detect';
    }
    // Fall back to events-based phase (non-SSE events)
    if (events.length > 0) {
      return events[events.length - 1].phase;
    }
    // Default to detect
    return 'detect';
  })();
  const currentConfig = PHASE_CONFIG[currentPhase];

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

  // STATE 3: Ready - continue to show ZYRA At Work
  return (
    <div className="space-y-6 p-4 sm:p-6" data-testid="zyra-at-work-container">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2" data-testid="text-page-title">
            ZYRA at Work
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            {hasRealData ? 'Detecting and removing revenue friction in real-time' :
             isAutopilotEnabled ? 'Scanning for friction points - activity will appear as ZYRA works' :
             'Enable autopilot below to start friction detection'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            data-testid="button-refresh-activity"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            hasRealData ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-500/10 border border-slate-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${hasRealData ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            <span className={`text-xs font-medium ${hasRealData ? 'text-emerald-400' : 'text-slate-400'}`}>
              {hasRealData ? 'Active' : 'Waiting'}
            </span>
          </div>
        </div>
      </div>

      {/* Autopilot Control - Direct toggle to start/stop ZYRA */}
      <Card className={`border-2 transition-all ${
        isAutopilotEnabled 
          ? 'bg-gradient-to-r from-emerald-500/10 to-primary/10 border-emerald-500/30' 
          : 'bg-[#16162c] border-slate-700/50'
      }`} data-testid="card-autopilot-control">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isAutopilotEnabled ? 'bg-emerald-500/20' : 'bg-slate-700/50'}`}>
                <Brain className={`w-6 h-6 ${isAutopilotEnabled ? 'text-emerald-400' : 'text-slate-400'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white">ZYRA Autopilot</h3>
                  <Badge 
                    className={isAutopilotEnabled 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                      : 'bg-slate-700 text-slate-400 border-slate-600'
                    }
                  >
                    {isAutopilotEnabled ? 'Running' : 'Paused'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400">
                  {isAutopilotEnabled 
                    ? 'ZYRA is detecting revenue friction and removing it in real-time' 
                    : 'Enable autopilot to let ZYRA find and remove friction where money is leaking'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${isAutopilotEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isAutopilotEnabled ? 'ON' : 'OFF'}
              </span>
              <Switch
                checked={isAutopilotEnabled}
                onCheckedChange={(checked) => toggleAutopilotMutation.mutate(checked)}
                disabled={toggleAutopilotMutation.isPending}
                className="data-[state=checked]:bg-emerald-600 scale-125"
                data-testid="switch-autopilot-toggle"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Master Loop Panel - Production-level autonomous optimization control */}
      <MasterLoopPanel />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="stats-grid">
        <Card className="bg-[#16162c] border-slate-700/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Today's Revenue Impact</p>
                <RevenueDelta 
                  amount={stats?.todayRevenueDelta || 0} 
                  size="lg"
                  showSign={true}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#16162c] border-slate-700/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Optimizations Today</p>
                <p className="text-xl font-bold text-white">{stats?.todayOptimizations || 0}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-500/10">
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#16162c] border-slate-700/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Pending Approvals</p>
                <p className="text-xl font-bold text-white">{stats?.pendingApprovals || 0}</p>
              </div>
              <div className="p-2 rounded-full bg-amber-500/10">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#16162c] border-slate-700/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Success Rate</p>
                <p className="text-xl font-bold text-white">{stats?.successRate || 0}%</p>
              </div>
              <div className="p-2 rounded-full bg-emerald-500/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Activity Feed */}
      <Card className="bg-[#16162c] border-slate-700/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className={`w-5 h-5 ${currentConfig.color}`} />
              <span className="text-white">Live Activity Feed</span>
            </CardTitle>
            <Badge variant="outline" className={`${currentConfig.color} border-current/30`}>
              {currentConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* EXECUTION RESULTS BANNER - Professional Design */}
          {executionResult && executionResult.productsOptimized.length > 0 && (
            <div className="mb-6 rounded-xl overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-slate-900/50 to-slate-900/80" data-testid="execution-results-banner">
              {/* Success Header */}
              <div className="p-5 border-b border-emerald-500/10 bg-gradient-to-r from-emerald-500/10 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <CheckCircle2 className="w-7 h-7 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-amber-900" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-semibold text-white" data-testid="text-action-label">
                        {executionResult.actionLabel}
                      </h3>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs" data-testid="badge-complete">
                        Complete
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400" data-testid="text-optimization-status">
                      AI-powered optimization finished successfully
                    </p>
                  </div>
                </div>
                
                {/* Summary Stats Row - only show when there are products optimized */}
                {executionResult.productsOptimized.length > 0 ? (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center" data-testid="stat-products-updated">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Package className="w-4 h-4 text-primary" />
                        <span className="text-xl font-bold text-white" data-testid="text-products-count">{executionResult.productsOptimized.length}</span>
                      </div>
                      <p className="text-xs text-slate-400">Products Updated</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center" data-testid="stat-fields-changed">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span className="text-xl font-bold text-white" data-testid="text-changes-count">{executionResult.totalChanges}</span>
                      </div>
                      <p className="text-xs text-slate-400">Fields Changed</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center" data-testid="stat-success-rate">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xl font-bold text-white" data-testid="text-success-rate">100%</span>
                      </div>
                      <p className="text-xs text-slate-400">Success Rate</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 bg-slate-800/50 rounded-lg p-4 text-center" data-testid="stat-action-complete">
                    <p className="text-sm text-slate-300">Action processed successfully</p>
                    <p className="text-xs text-slate-500 mt-1">{executionResult.estimatedImpact || 'ZYRA will continue monitoring for improvements'}</p>
                  </div>
                )}
              </div>
              
              {/* Product Changes - Only show when there are products */}
              {executionResult.productsOptimized.length > 0 && (
              <div className="p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2" data-testid="text-changes-applied-label">
                  <Activity className="w-3 h-3" />
                  Changes Applied
                </p>
                <div className="space-y-3">
                  {executionResult.productsOptimized.map((product, pIdx) => (
                    <div 
                      key={pIdx} 
                      className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-800/30"
                      data-testid={`product-changes-${pIdx}`}
                    >
                      {/* Product Header */}
                      <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-700/30 bg-slate-800/20">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white" data-testid={`text-product-name-${pIdx}`}>{product.productName}</p>
                          <p className="text-xs text-slate-400" data-testid={`text-product-fields-${pIdx}`}>{product.changes.length} field{product.changes.length !== 1 ? 's' : ''} optimized</p>
                        </div>
                        <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-[10px]" data-testid={`badge-applied-${pIdx}`}>
                          Applied
                        </Badge>
                      </div>
                      
                      {/* Changes - Always Visible */}
                      <div className="px-4 py-3 space-y-3">
                        {product.changes.map((change, cIdx) => (
                          <div key={cIdx} className="rounded-lg bg-slate-900/50 p-3" data-testid={`change-card-${pIdx}-${cIdx}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <span className="text-sm font-medium text-white" data-testid={`text-change-field-${pIdx}-${cIdx}`}>{change.field}</span>
                            </div>
                            
                            {/* Before/After - Responsive */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="rounded-md bg-red-500/5 border border-red-500/20 p-2" data-testid={`card-before-${pIdx}-${cIdx}`}>
                                <span className="text-[10px] font-bold text-red-400 uppercase">Before</span>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2" data-testid={`text-before-value-${pIdx}-${cIdx}`}>
                                  {change.before || <span className="italic text-slate-600">(empty)</span>}
                                </p>
                              </div>
                              <div className="rounded-md bg-emerald-500/5 border border-emerald-500/20 p-2" data-testid={`card-after-${pIdx}-${cIdx}`}>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase">After</span>
                                <p className="text-xs text-emerald-300 mt-1 line-clamp-2" data-testid={`text-after-value-${pIdx}-${cIdx}`}>
                                  {change.after}
                                </p>
                              </div>
                            </div>
                            {/* AI Reason */}
                            {change.reason && (
                              <div className="mt-2 flex items-start gap-1.5" data-testid={`reason-${pIdx}-${cIdx}`}>
                                <Brain className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                                <p className="text-[10px] text-slate-400 leading-relaxed">{change.reason}</p>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Product Impact */}
                        <div className="rounded-md bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 p-2 flex items-start gap-2" data-testid={`card-product-impact-${pIdx}`}>
                          <TrendingUp className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <p className="text-xs text-slate-300" data-testid={`text-product-impact-${pIdx}`}>{product.impactExplanation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
              
              {/* REVENUE PROOF SUMMARY - ONLY Revenue Metrics (Per ZYRA Spec) */}
              {/* Format: "This action generated / protected ₹_____" */}
              {/* NEVER show: CTR, Rankings, Open rates, Vanity metrics */}
              <div className="px-5 py-4 bg-gradient-to-r from-emerald-500/10 via-primary/10 to-transparent border-t border-slate-700/50" data-testid="revenue-proof-section">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400/20 to-primary/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Revenue Proof</p>
                      <p className="text-sm font-medium text-emerald-400" data-testid="text-revenue-proof">
                        {/* Revenue-only proof statement per spec */}
                        {executionResult.estimatedImpact.includes('₹') || executionResult.estimatedImpact.includes('$')
                          ? `This action generated ${executionResult.estimatedImpact}`
                          : executionResult.estimatedImpact}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-0 py-1.5 px-3" data-testid="badge-optimization-live">
                      <Sparkles className="w-3 h-3 mr-1.5" />
                      Revenue Protected
                    </Badge>
                    <Badge variant="outline" className="text-slate-400 border-slate-600 py-1.5 px-3" data-testid="badge-rollback-available">
                      <RotateCcw className="w-3 h-3 mr-1.5" />
                      Rollback Available
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div 
            ref={scrollContainerRef}
            className="w-full"
            data-testid="activity-feed"
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                </div>
                <p className="text-slate-400">Loading activity...</p>
              </div>
            ) : events.length === 0 ? (
              <ProgressStages 
                isAutopilotEnabled={isAutopilotEnabled} 
                detectionPhase={detectionPhase as DetectionPhase}
                detectionStatus={detectionStatus}
                isDetectionComplete={isDetectionComplete}
                isNewStore={stats?.isNewStore || detectionStatusData?.isNewStore || false}
                foundationalAction={detectionStatusData?.foundationalAction || stats?.foundationalAction}
                executionStatus={derivedExecutionStatus}
                committedActionId={derivedCommittedActionId}
                onApprove={(actionId) => approveActionMutation.mutate(actionId)}
                isApproving={approveActionMutation.isPending}
                activePhase={currentPhase as 'detect' | 'decide' | 'execute' | 'prove' | 'learn'}
                executionResult={executionResult}
                executionActivities={executionActivities}
              />
            ) : (
              events.map((event) => (
                <EventItem 
                  key={event.id} 
                  event={event}
                  isTyping={false}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(PHASE_CONFIG).map(([phase, config]) => {
          const Icon = config.icon;
          const isActive = currentPhase === phase;
          const phaseOrder = ['detect', 'decide', 'execute', 'prove', 'learn'];
          const currentIndex = phaseOrder.indexOf(currentPhase);
          const phaseIndex = phaseOrder.indexOf(phase);
          const isCompleted = phaseIndex < currentIndex;
          
          return (
            <Card 
              key={phase}
              className={`${config.bgColor} border-slate-700/50 transition-all duration-300 ${
                isActive ? 'ring-2 ring-offset-2 ring-offset-slate-900' : ''
              } ${isCompleted ? 'opacity-60' : ''}`}
              style={{ '--tw-ring-color': isActive ? 'currentColor' : 'transparent' } as any}
              data-testid={`phase-indicator-${phase}`}
            >
              <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center relative">
                {isCompleted && (
                  <div className="absolute top-1 right-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                )}
                <div className={`p-2 rounded-lg bg-slate-800/50 mb-2 ${isActive ? 'animate-pulse' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? config.color : isCompleted ? 'text-emerald-400' : 'text-slate-500'}`} />
                </div>
                <span className={`text-xs font-medium ${isActive ? config.color : isCompleted ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {config.label}
                </span>
                {isActive && isStreamConnected && (
                  <span className="mt-1 text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Optimization Mode Selector */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">Optimization Mode</h2>
          <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">Cost Control</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className={`bg-[#16162c] border-2 cursor-pointer transition-all ${
              optimizationMode === 'fast' 
                ? 'border-primary ring-2 ring-primary/20' 
                : 'border-slate-700/50 hover-elevate'
            }`}
            onClick={() => handleModeChange('fast')}
            data-testid="card-mode-fast"
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Fast Mode</h3>
                  <p className="text-sm text-slate-400 mb-3">AI-powered SEO using proven patterns</p>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary/20 text-primary border-0">Lower Cost</Badge>
                    <span className="text-slate-500 text-xs">Faster processing</span>
                  </div>
                </div>
                {optimizationMode === 'fast' && (
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-[#16162c] border-2 cursor-pointer transition-all ${
              optimizationMode === 'competitive' 
                ? 'border-amber-400 ring-2 ring-amber-400/20' 
                : 'border-slate-700/50 hover-elevate'
            }`}
            onClick={() => handleModeChange('competitive')}
            data-testid="card-mode-competitive"
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-amber-500/10">
                  <Trophy className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Competitive Intelligence</h3>
                  <p className="text-sm text-slate-400 mb-3">Real-time Google SERP analysis + AI</p>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-amber-500/20 text-amber-400 border-0">Premium</Badge>
                    <span className="text-slate-500 text-xs">Uses DataForSEO API</span>
                  </div>
                </div>
                {optimizationMode === 'competitive' && (
                  <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <p className="text-xs text-slate-500 flex items-center gap-2">
          <AlertCircle className="w-3 h-3" />
          Credit usage varies based on the actions ZYRA takes. Competitive Intelligence costs more per action due to real-time SERP analysis.
        </p>
      </div>

      {/* APPROVED ZYRA ACTION TYPES (17 Total) - Per Core Specification */}
      <div className="space-y-4" data-testid="section-zyra-action-types">
        {/* 🔍 DISCOVERABILITY & SEO (5 Actions) */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-slate-500 uppercase tracking-wide mr-2">Discoverability & SEO:</span>
          <Badge 
            className="bg-blue-500/10 text-blue-400 border-blue-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-product-title"
          >
            <Tag className="w-3 h-3 mr-1.5" />
            Product Title Optimization
          </Badge>
          <Badge 
            className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-meta-optimization"
          >
            <Globe className="w-3 h-3 mr-1.5" />
            Meta Title, Description & Tags
          </Badge>
          <Badge 
            className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-search-intent"
          >
            <Target className="w-3 h-3 mr-1.5" />
            Search Intent Alignment Fix
          </Badge>
          <Badge 
            className="bg-purple-500/10 text-purple-400 border-purple-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-image-alt"
          >
            <ImageIcon className="w-3 h-3 mr-1.5" />
            Image Alt-Text Optimization
          </Badge>
          <Badge 
            className="bg-teal-500/10 text-teal-400 border-teal-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-stale-refresh"
          >
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Stale SEO Content Refresh
          </Badge>
        </div>

        {/* 🛒 CONVERSION OPTIMIZATION (5 Actions) */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-slate-500 uppercase tracking-wide mr-2">Conversion Optimization:</span>
          <Badge 
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-product-description"
          >
            <FileText className="w-3 h-3 mr-1.5" />
            Product Description Clarity Upgrade
          </Badge>
          <Badge 
            className="bg-amber-500/10 text-amber-400 border-amber-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-value-proposition"
          >
            <Sparkles className="w-3 h-3 mr-1.5" />
            Value Proposition Alignment Fix
          </Badge>
          <Badge 
            className="bg-green-500/10 text-green-400 border-green-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-trust-signals"
          >
            <Shield className="w-3 h-3 mr-1.5" />
            Trust Signal Enhancement
          </Badge>
          <Badge 
            className="bg-orange-500/10 text-orange-400 border-orange-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-friction-copy"
          >
            <Eraser className="w-3 h-3 mr-1.5" />
            Friction Copy Removal
          </Badge>
          <Badge 
            className="bg-pink-500/10 text-pink-400 border-pink-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-above-fold"
          >
            <Layout className="w-3 h-3 mr-1.5" />
            Above-the-Fold Content Optimization
          </Badge>
        </div>

        {/* 💰 REVENUE RECOVERY (3 Actions) */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-slate-500 uppercase tracking-wide mr-2">Revenue Recovery:</span>
          <Badge 
            className="bg-red-500/10 text-red-400 border-red-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-cart-recovery"
          >
            <ShoppingCart className="w-3 h-3 mr-1.5" />
            Abandoned Cart Recovery Activation
            <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </Badge>
          <Badge 
            className="bg-lime-500/10 text-lime-400 border-lime-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-post-purchase"
          >
            <TrendingUp className="w-3 h-3 mr-1.5" />
            Post-Purchase Upsell Enablement
            <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </Badge>
          <Badge 
            className="bg-rose-500/10 text-rose-400 border-rose-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-checkout-dropoff"
          >
            <CreditCard className="w-3 h-3 mr-1.5" />
            Checkout Drop-Off Mitigation
          </Badge>
        </div>

        {/* 🛡️ REVENUE PROTECTION (2 Actions) */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-slate-500 uppercase tracking-wide mr-2">Revenue Protection:</span>
          <Badge 
            className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-rollback"
          >
            <RotateCcw className="w-3 h-3 mr-1.5" />
            Underperforming Change Rollback
          </Badge>
          <Badge 
            className="bg-slate-500/10 text-slate-400 border-slate-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-freeze"
          >
            <Pause className="w-3 h-3 mr-1.5" />
            Risky Optimization Freeze
          </Badge>
        </div>

        {/* 🧠 LEARNING & INTELLIGENCE - Silent (2 Actions) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wide mr-2">Learning & Intelligence:</span>
          <Badge 
            className="bg-violet-500/10 text-violet-400 border-violet-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-pattern-learning"
          >
            <Brain className="w-3 h-3 mr-1.5" />
            Store Conversion Pattern Learning
            <span className="ml-1.5 text-[10px] text-slate-500">(Silent)</span>
          </Badge>
          <Badge 
            className="bg-sky-500/10 text-sky-400 border-sky-500/30 hover-elevate cursor-default" 
            data-testid="badge-action-baseline-update"
          >
            <BarChart className="w-3 h-3 mr-1.5" />
            Product Performance Baseline Update
            <span className="ml-1.5 text-[10px] text-slate-500">(Silent)</span>
          </Badge>
        </div>
      </div>

      {/* ZYRA CORE LOOP - DETECT → DECIDE → EXECUTE → PROVE → LEARN */}
      <div className="pt-3 border-t border-slate-700/30 space-y-3" data-testid="section-zyra-core-loop">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm text-slate-300 font-medium" data-testid="text-zyra-summary">
            ZYRA at Work: Live Revenue Operating System
          </span>
        </div>
        
        {/* Core Loop Visualization */}
        <div className="flex items-center justify-center gap-1 text-[10px] font-mono py-2" data-testid="core-loop-visual">
          <span className="text-blue-400">DETECT</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="text-purple-400">DECIDE</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="text-amber-400">EXECUTE</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="text-emerald-400">PROVE</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="text-cyan-400">LEARN</span>
        </div>
        
        <p className="text-xs text-slate-400 text-center" data-testid="text-core-law">
          Core Law: If an action does NOT directly increase or protect revenue, ZYRA will NOT perform it.
        </p>
        
        {/* Identity Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="outline" className="text-slate-400 border-slate-600" data-testid="badge-thinks">
            <Brain className="w-3 h-3 mr-1" />
            Thinks
          </Badge>
          <Badge variant="outline" className="text-slate-400 border-slate-600" data-testid="badge-acts">
            <Zap className="w-3 h-3 mr-1" />
            Acts
          </Badge>
          <Badge variant="outline" className="text-slate-400 border-slate-600" data-testid="badge-explains">
            <MessageSquare className="w-3 h-3 mr-1" />
            Explains
          </Badge>
          <Badge variant="outline" className="text-slate-400 border-slate-600" data-testid="badge-proves">
            <DollarSign className="w-3 h-3 mr-1" />
            Proves
          </Badge>
          <Badge variant="outline" className="text-slate-400 border-slate-600" data-testid="badge-improves">
            <Target className="w-3 h-3 mr-1" />
            Improves
          </Badge>
        </div>
      </div>
    </div>
  );
}