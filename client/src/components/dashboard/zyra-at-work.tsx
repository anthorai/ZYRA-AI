import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { RevenueDelta } from "@/components/ui/revenue-delta";
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
  Wand2
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
  speed = 25, 
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
            <TypewriterText text={entry.message} speed={15} />
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

// Foundational action for new stores
interface FoundationalAction {
  type: 'seo_basics' | 'product_copy_clarity' | 'trust_signals' | 'recovery_setup';
  productId?: string;
  productName?: string;
  title: string;
  description: string;
  whyItHelps: string;
  expectedImpact: string;
  riskLevel: 'low';
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
  executionStatus?: 'pending' | 'running' | 'awaiting_approval' | 'idle';
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
    label: 'Finding Friction', 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/10',
    primaryText: 'ZYRA is identifying revenue friction',
    secondaryText: 'Analyzing where buyers hesitate before purchasing',
    statusMessage: 'Scanning your store for revenue opportunities...'
  },
  decide: { 
    icon: Brain, 
    label: 'Deciding Next Move', 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/10',
    primaryText: 'ZYRA is deciding the next best revenue move',
    secondaryText: 'Evaluating impact, confidence, and risk',
    statusMessage: 'Analyzing the best action to take...'
  },
  execute: { 
    icon: Zap, 
    label: 'Applying Fix', 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/10',
    primaryText: 'Applying approved revenue optimization',
    secondaryText: 'Changes are being published safely',
    statusMessage: 'Publishing changes to your store...'
  },
  prove: { 
    icon: TrendingUp, 
    label: 'Proving Results', 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/10',
    primaryText: 'Measuring revenue impact',
    secondaryText: 'Comparing before and after results',
    statusMessage: 'Tracking the impact of changes...'
  },
  learn: { 
    icon: Target, 
    label: 'Improving', 
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
    title: 'Checking store performance',
    descriptions: [
      'Reviewing your recent sales data and conversion rates',
      'Analyzing your store\'s revenue patterns',
      'Looking at what\'s working well in your store'
    ],
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    baseTime: 3000 // 3 seconds
  },
  {
    id: 2,
    icon: Search,
    title: 'Identifying where buyers hesitate',
    descriptions: [
      'Finding the moments where potential customers leave without buying',
      'Spotting drop-off points in the buying journey',
      'Discovering where interest doesn\'t convert to sales'
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
  executionStatus?: 'pending' | 'running' | 'awaiting_approval' | 'idle';
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

  useEffect(() => {
    if (isAutopilotEnabled && detectionPhase !== 'idle' && !startTime) {
      setStartTime(Date.now());
      console.log('[ProgressStages] Detection started - auto-advance timer started');
    }
    if (!isAutopilotEnabled || detectionPhase === 'idle') {
      setStartTime(null);
    }
  }, [isAutopilotEnabled, detectionPhase, startTime]);

  useEffect(() => {
    if (!isAutopilotEnabled || detectionPhase === 'idle') return;
    
    hardTimeoutRef.current = setTimeout(() => {
      console.log('[ProgressStages] Hard timeout (10s) reached - forcing completion');
      setCurrentStage(PROGRESS_STAGES.length - 1);
      setStartTime(null);
      onComplete?.();
    }, AUTO_ADVANCE_TIMEOUT_MS);
    
    return () => {
      if (hardTimeoutRef.current) {
        clearTimeout(hardTimeoutRef.current);
      }
    };
  }, [isAutopilotEnabled, detectionPhase, onComplete]);

  useEffect(() => {
    if (!isAutopilotEnabled || detectionPhase === 'idle' || isDetectionComplete) return;
    
    autoAdvanceRef.current = setInterval(() => {
      setCurrentStage(prev => {
        const next = Math.min(prev + 1, PROGRESS_STAGES.length - 2);
        console.log(`[ProgressStages] Auto-advancing to stage ${next + 1}`);
        return next;
      });
    }, STAGE_AUTO_ADVANCE_MS);
    
    return () => {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
      }
    };
  }, [isAutopilotEnabled, detectionPhase, isDetectionComplete]);

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

  // If insufficient_data BEFORE detection starts (idle phase), show baseline collection screen
  // This skips the loop animation entirely for newly connected stores
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

  // Get the current phase config for status display
  const phaseConfig = PHASE_CONFIG[activePhase] || PHASE_CONFIG.detect;
  const PhaseIcon = phaseConfig.icon;

  // Generate dynamic activity log entries based on current phase
  const generateLogEntries = useCallback((): AILogEntry[] => {
    const entries: AILogEntry[] = [];
    const now = new Date();
    
    if (currentStage >= 0) {
      entries.push({
        id: 'init',
        timestamp: new Date(now.getTime() - 8000),
        type: 'info',
        message: 'Initiating revenue opportunity scan for your store...',
        detail: 'Connecting to Shopify analytics and performance data'
      });
    }
    
    if (currentStage >= 1) {
      entries.push({
        id: 'scan-start',
        timestamp: new Date(now.getTime() - 6500),
        type: 'thinking',
        message: 'Analyzing store performance metrics and buyer behavior patterns',
        detail: 'Looking at conversion rates, cart abandonment, and product engagement',
        metrics: [
          { label: 'Products Scanned', value: Math.min(currentStage * 3, 12) },
          { label: 'Data Points', value: Math.min(currentStage * 47, 200) + '+' }
        ]
      });
    }
    
    if (currentStage >= 2) {
      entries.push({
        id: 'friction-detect',
        timestamp: new Date(now.getTime() - 5000),
        type: 'insight',
        message: 'Identified potential friction points in the buyer journey',
        detail: 'Scanning product pages, checkout flow, and trust indicators'
      });
    }
    
    if (currentStage >= 3) {
      entries.push({
        id: 'calc-impact',
        timestamp: new Date(now.getTime() - 3500),
        type: 'thinking',
        message: 'Calculating revenue impact of each identified opportunity',
        metrics: [
          { label: 'Opportunities', value: Math.max(1, Math.floor(currentStage / 2)) },
          { label: 'Est. Recovery', value: '$50-200/mo' }
        ]
      });
    }
    
    if (currentStage >= 4) {
      entries.push({
        id: 'prioritize',
        timestamp: new Date(now.getTime() - 2000),
        type: 'action',
        message: 'Prioritizing highest-impact optimization for your store',
        detail: 'Selected based on conversion lift potential and implementation ease'
      });
    }
    
    if (currentStage >= 5 && foundationalAction) {
      entries.push({
        id: 'ready',
        timestamp: new Date(now.getTime() - 500),
        type: 'success',
        message: `Recommended action ready: ${foundationalAction.title}`,
        detail: foundationalAction.description
      });
    }
    
    if (executionStatus === 'running' && activePhase === 'execute') {
      entries.push({
        id: 'exec-start',
        timestamp: new Date(now.getTime() - 3000),
        type: 'action',
        message: 'Starting AI optimization engine...',
        detail: 'Loading product data and brand voice settings'
      });
      entries.push({
        id: 'exec-ai',
        timestamp: new Date(now.getTime() - 1500),
        type: 'thinking',
        message: 'Generating AI-enhanced content with GPT-4o-mini...',
        detail: 'Crafting compelling product copy that converts',
        metrics: [
          { label: 'Model', value: 'GPT-4o-mini' },
          { label: 'Mode', value: 'Fast Quality' }
        ]
      });
      entries.push({
        id: 'exec-apply',
        timestamp: now,
        type: 'action',
        message: 'Publishing optimized content to Shopify...',
        detail: 'Applying changes via Shopify Admin API'
      });
    }
    
    if (executionStatus === 'running' && activePhase === 'prove') {
      entries.push({
        id: 'prove-start',
        timestamp: new Date(now.getTime() - 1000),
        type: 'action',
        message: 'Verifying changes were applied successfully...',
        detail: 'Comparing before/after content on Shopify'
      });
      entries.push({
        id: 'prove-collect',
        timestamp: now,
        type: 'thinking',
        message: 'Setting up performance tracking for this optimization...',
        detail: 'Will measure conversion rate impact over next 7 days'
      });
    }
    
    if (executionStatus === 'running' && activePhase === 'learn') {
      entries.push({
        id: 'learn-analyze',
        timestamp: new Date(now.getTime() - 500),
        type: 'insight',
        message: 'Recording optimization patterns for your store...',
        detail: 'Improving future recommendations based on this action'
      });
    }
    
    if (executionResult && executionResult.productsOptimized.length > 0) {
      entries.push({
        id: 'complete',
        timestamp: now,
        type: 'success',
        message: `Applied ${executionResult.totalChanges} improvements to ${executionResult.productsOptimized.length} product(s)`,
        detail: executionResult.estimatedImpact,
        metrics: [
          { label: 'Products Updated', value: executionResult.productsOptimized.length },
          { label: 'Total Changes', value: executionResult.totalChanges }
        ]
      });
    }
    
    return entries;
  }, [currentStage, foundationalAction, executionStatus, activePhase, executionResult]);

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

  return (
    <div className="py-4">
      {/* Header with Phase Status */}
      <div className={`mb-4 p-3 rounded-lg ${phaseConfig.bgColor} border border-slate-700/50`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${phaseConfig.bgColor} flex items-center justify-center relative`}>
            <PhaseIcon className={`w-4.5 h-4.5 ${phaseConfig.color}`} />
            {(executionStatus === 'running' || executionStatus === 'pending' || !isDetectionComplete) && (
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${phaseConfig.color}`}>
                {phaseConfig.label}
              </span>
              {!isDetectionComplete && (
                <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {phaseConfig.statusMessage}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono text-slate-500">{Math.round(progress)}%</div>
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
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[10px] font-mono text-slate-500 ml-2">ZYRA Activity Log</span>
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

      {/* Compact Progress Bar */}
      <div className="mb-4">
        <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 px-1">
          <span className="text-[10px] text-slate-600">Step {currentStage + 1}/{PROGRESS_STAGES.length}</span>
          <span className="text-[10px] text-slate-600">Working autonomously</span>
        </div>
      </div>
      
      {/* Status Display for completed detection - Step 8 is ALWAYS a terminal success state */}
      {isDetectionComplete && (
        <div className={`mt-4 p-3 rounded-lg ${
          detectionStatus === 'friction_found' ? 'bg-emerald-500/10 border border-emerald-500/30' :
          (detectionStatus === 'foundational_action' || isNewStore) ? 'bg-primary/10 border border-primary/30' :
          'bg-blue-500/10 border border-blue-500/30'
        }`}>
          {/* For new stores with foundational action - show the concrete Next Move */}
          {(detectionStatus === 'foundational_action' || isNewStore) && foundationalAction ? (
            <div className="text-left">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${executionStatus === 'running' ? 'bg-amber-400' : 'bg-primary'} animate-pulse`} />
                  <p className={`text-sm font-medium ${executionStatus === 'running' ? 'text-amber-400' : 'text-primary'}`}>
                    {executionStatus === 'running' 
                      ? (activePhase === 'prove' ? 'Proving Results...' 
                         : activePhase === 'learn' ? 'Learning & Improving...' 
                         : 'Applying Fix...') 
                      : executionStatus === 'awaiting_approval' ? 'Review & Approve' 
                      : 'Next Move Ready'}
                  </p>
                  {executionStatus === 'running' && (
                    <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                  )}
                </div>
                {executionStatus === 'awaiting_approval' && committedActionId && onApprove && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onApprove(committedActionId)}
                    disabled={isApproving}
                    data-testid="button-approve-foundational-action"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
                {foundationalAction.title}
              </p>
              {foundationalAction.productName && (
                <p className="text-xs text-slate-400 mb-2">
                  Product: {foundationalAction.productName}
                </p>
              )}
              <p className="text-xs text-slate-400 mb-2">
                {foundationalAction.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  Low Risk
                </span>
                <span className="text-xs text-slate-500">
                  {foundationalAction.expectedImpact}
                </span>
              </div>
              
              {/* EXECUTION RESULTS DISPLAY - Shows real changes made */}
              {executionResult && executionResult.productsOptimized.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">
                      {executionResult.totalChanges} Changes Applied
                    </span>
                  </div>
                  
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
                  
                  <div className="mt-3 p-2 bg-emerald-500/10 rounded text-center">
                    <p className="text-xs text-emerald-400 font-medium">
                      {executionResult.estimatedImpact}
                    </p>
                  </div>
                </div>
              )}
              
              {/* EXECUTION ACTIVITIES LOG - Detailed step-by-step log */}
              {executionActivities.length > 0 && !executionResult?.productsOptimized?.length && (
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
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
          ) : (
            <div className="text-center">
              <p className={`text-sm font-medium ${
                detectionStatus === 'friction_found' ? 'text-emerald-400' : 'text-blue-400'
              }`}>
                {detectionStatus === 'friction_found' 
                  ? 'Next revenue move ready'
                  : 'No urgent revenue risk detected'
                }
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {detectionStatus === 'friction_found'
                  ? 'Review recommended action in Next Move'
                  : 'ZYRA is actively monitoring your store for new opportunities'
                }
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
  
  // Store execution results for display
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executionActivities, setExecutionActivities] = useState<ExecutionActivityItem[]>([]);
  
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
    executionStatus?: 'pending' | 'running' | 'awaiting_approval' | 'idle';
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
      // Check if it's a foundational action
      if (actionId.startsWith('foundational_')) {
        // Execute foundational action - returns real execution results
        const response = await apiRequest('POST', '/api/zyra/execute-foundational', { 
          type: actionId.replace('foundational_', '') 
        });
        return response.json();
      }
      // Regular friction action - approve the opportunity
      const response = await apiRequest('POST', `/api/revenue-opportunities/${actionId}/approve`, {});
      return response.json();
    },
    onSuccess: async (data) => {
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
    onError: () => {
      toast({
        title: 'Approval Failed',
        description: 'Could not approve the action. Please try again.',
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
      setApprovedPhase(next);
      
      // When complete, refresh data to get next action
      if (next === 'complete') {
        setTimeout(() => {
          setApprovedPhase('idle');
          queryClient.invalidateQueries({ queryKey: ['/api/zyra/detection-status'] });
          queryClient.invalidateQueries({ queryKey: ['/api/zyra/live-stats'] });
        }, 2000);
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
  const detectionStatus: StrictDetectionStatus = 
    (isDetecting && detectionStatusData?.status) || 
    (stats?.detection?.complete ? 'insufficient_data' : 'detecting');
  
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
  const derivedExecutionStatus = (() => {
    // Backend is actively executing - always show 'running'
    if (serverExecutionPhase !== 'idle' && serverExecutionPhase !== 'completed') {
      return 'running';
    }
    // Local approvedPhase fallback for fast UI updates
    if (approvedPhase !== 'idle' && approvedPhase !== 'complete') {
      return 'running';
    }
    // Default to server's execution status
    return serverExecutionStatus;
  })();
  
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
    // Only trigger once per page load when conditions are met
    if (
      storeReadiness?.state === 'ready' &&
      isAutopilotEnabled &&
      !isDetecting &&
      !hasTriggeredInitialDetection.current &&
      (detectionPhase === 'idle' || !detectionStatusData?.complete)
    ) {
      console.log('[ZYRA Detection] Auto-triggering initial detection on page load');
      hasTriggeredInitialDetection.current = true;
      triggerDetectionMutation.mutate();
    }
  }, [storeReadiness?.state, isAutopilotEnabled, isDetecting, detectionPhase, detectionStatusData?.complete]);

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
  // Priority: backendExecutionPhase > approvedPhase > executionStatus > events > detection phase > default
  const currentPhase = (() => {
    // HIGHEST PRIORITY: Backend is executing - use its phase (synced with server)
    if (backendExecutionPhase !== 'idle' && backendExecutionPhase !== 'completed') {
      return mapBackendPhase(backendExecutionPhase);
    }
    // If local approvedPhase is active (fallback for fast UI updates)
    if (approvedPhase !== 'idle' && approvedPhase !== 'complete') {
      return approvedPhase;
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
    // Fall back to events-based phase
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
                
                {/* Summary Stats Row */}
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
              </div>
              
              {/* Product Changes - Collapsible Accordion */}
              <div className="p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2" data-testid="text-changes-applied-label">
                  <Activity className="w-3 h-3" />
                  Changes Applied
                </p>
                <Accordion type="single" collapsible className="space-y-2">
                  {executionResult.productsOptimized.map((product, pIdx) => (
                    <AccordionItem 
                      key={pIdx} 
                      value={`product-${pIdx}`}
                      className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-800/30 data-[state=open]:border-primary/30"
                    >
                      <AccordionTrigger className="px-4 py-3" data-testid={`accordion-trigger-product-${pIdx}`}>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Package className="w-4 h-4 text-primary" />
                          </div>
                          <div className="text-left flex-1">
                            <p className="text-sm font-medium text-white" data-testid={`text-product-name-${pIdx}`}>{product.productName}</p>
                            <p className="text-xs text-slate-400" data-testid={`text-product-fields-${pIdx}`}>{product.changes.length} field{product.changes.length !== 1 ? 's' : ''} optimized</p>
                          </div>
                          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-[10px] mr-2" data-testid={`badge-applied-${pIdx}`}>
                            Applied
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4 pt-2">
                          {product.changes.map((change, cIdx) => (
                            <div key={cIdx} className="rounded-lg bg-slate-900/50 p-4" data-testid={`change-card-${pIdx}-${cIdx}`}>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-sm font-medium text-white" data-testid={`text-change-field-${pIdx}-${cIdx}`}>{change.field}</span>
                              </div>
                              
                              {/* Before/After Comparison */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3" data-testid={`card-before-${pIdx}-${cIdx}`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                                      <span className="text-[10px] font-bold text-red-400">OLD</span>
                                    </div>
                                    <span className="text-xs font-medium text-red-400/80">Before</span>
                                  </div>
                                  <p className="text-sm text-slate-400 leading-relaxed" data-testid={`text-before-value-${pIdx}-${cIdx}`}>
                                    {change.before || <span className="italic text-slate-600">(empty)</span>}
                                  </p>
                                </div>
                                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3" data-testid={`card-after-${pIdx}-${cIdx}`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                      <span className="text-[10px] font-bold text-emerald-400">NEW</span>
                                    </div>
                                    <span className="text-xs font-medium text-emerald-400/80">After</span>
                                  </div>
                                  <p className="text-sm text-emerald-300 leading-relaxed" data-testid={`text-after-value-${pIdx}-${cIdx}`}>
                                    {change.after}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Reason Badge */}
                              <div className="mt-3 flex items-start gap-2">
                                <Brain className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                <p className="text-xs text-slate-400 leading-relaxed" data-testid={`text-change-reason-${pIdx}-${cIdx}`}>{change.reason}</p>
                              </div>
                            </div>
                          ))}
                          
                          {/* Product Impact */}
                          <div className="rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 p-3 flex items-start gap-2" data-testid={`card-product-impact-${pIdx}`}>
                            <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-300" data-testid={`text-product-impact-${pIdx}`}>{product.impactExplanation}</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
              
              {/* Impact Summary Footer */}
              <div className="px-5 py-4 bg-gradient-to-r from-emerald-500/10 via-primary/10 to-transparent border-t border-slate-700/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400/20 to-primary/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Expected Revenue Impact</p>
                      <p className="text-sm font-medium text-emerald-400" data-testid="text-estimated-impact">
                        {executionResult.estimatedImpact}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0 py-1.5 px-3" data-testid="badge-optimization-live">
                    <Sparkles className="w-3 h-3 mr-1.5" />
                    Optimization Live
                  </Badge>
                </div>
              </div>
            </div>
          )}
          
          <div 
            ref={scrollContainerRef}
            className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
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
          return (
            <Card 
              key={phase}
              className={`${config.bgColor} border-slate-700/50 transition-all duration-300 ${
                isActive ? 'ring-2 ring-offset-2 ring-offset-slate-900' : ''
              }`}
              style={{ '--tw-ring-color': isActive ? 'currentColor' : 'transparent' } as any}
              data-testid={`phase-indicator-${phase}`}
            >
              <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
                <div className={`p-2 rounded-lg bg-slate-800/50 mb-2 ${isActive ? 'animate-pulse' : ''}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <span className={`text-xs font-medium ${isActive ? config.color : 'text-slate-400'}`}>
                  {config.label}
                </span>
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

      {/* ZYRA Core Capabilities */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">ZYRA Core Capabilities</h2>
          <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">What ZYRA Can Do</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-[#16162c] border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/ai-tools/activity-timeline?filter=seo')} data-testid="card-seo-optimization">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">Product SEO Optimization</h3>
                  <p className="text-xs text-slate-400 mb-3">AI improves titles, descriptions & meta when revenue upside is detected</p>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30">Used by ZYRA</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-300" data-testid="button-see-seo-actions">
                <Eye className="w-4 h-4 mr-2" />
                See SEO Actions by ZYRA
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#16162c] border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/ai-tools/activity-timeline?filter=bulk')} data-testid="card-bulk-optimization">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">Bulk Product Optimization</h3>
                  <p className="text-xs text-slate-400 mb-3">ZYRA updates multiple products when patterns repeat</p>
                  <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-400/30">Automated</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-300" data-testid="button-view-bulk-actions">
                <Eye className="w-4 h-4 mr-2" />
                View Bulk Actions
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#16162c] border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/ai-tools/activity-timeline?filter=image')} data-testid="card-image-seo">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <ImageIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">Image SEO Enhancement</h3>
                  <p className="text-xs text-slate-400 mb-3">ZYRA auto-generates alt-text to improve discoverability</p>
                  <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-400/30">Active</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-300" data-testid="button-view-image-updates">
                <Eye className="w-4 h-4 mr-2" />
                View Image Updates
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#16162c] border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/ai-tools/activity-timeline?filter=voice')} data-testid="card-brand-voice">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">Brand Voice Intelligence</h3>
                  <p className="text-xs text-slate-400 mb-3">ZYRA applies your brand tone automatically</p>
                  <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-400/30">Learning</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-300" data-testid="button-view-applied-voice">
                <Eye className="w-4 h-4 mr-2" />
                View Applied Voice
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#16162c] border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/ai-tools/activity-timeline?filter=refresh')} data-testid="card-smart-refresh">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Calendar className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">Smart Content Refresh</h3>
                  <p className="text-xs text-slate-400 mb-3">ZYRA refreshes content when decay is detected</p>
                  <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-400/30">Scheduled</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-300" data-testid="button-view-refresh-history">
                <Eye className="w-4 h-4 mr-2" />
                View Refresh History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ZYRA Automation & Execution */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Automation & Execution</h2>
          <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">How ZYRA Executes</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#16162c] border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/ai-tools/activity-timeline?filter=publish')} data-testid="card-shopify-publishing">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Upload className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">Shopify Publishing Engine</h3>
                  <p className="text-xs text-slate-400 mb-3">ZYRA publishes approved changes automatically</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-300" data-testid="button-view-publish-log">
                <Eye className="w-4 h-4 mr-2" />
                View Publish Log
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#16162c] border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/ai-tools/activity-timeline?filter=patterns')} data-testid="card-optimization-patterns">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Layers className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">Optimization Patterns</h3>
                  <p className="text-xs text-slate-400 mb-3">Repeated improvements ZYRA applies across products</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-300" data-testid="button-view-pattern-usage">
                <Eye className="w-4 h-4 mr-2" />
                View Pattern Usage
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#16162c] border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/ai-tools/activity-timeline?filter=rollback')} data-testid="card-safety-rollback">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <History className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">Safety & Rollback System</h3>
                  <p className="text-xs text-slate-400 mb-3">Instantly revert any ZYRA action</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-300" data-testid="button-view-change-history">
                <Eye className="w-4 h-4 mr-2" />
                View Change History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue Actions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Active Revenue Actions</h2>
          <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">Marketing Running Now</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-[#16162c] border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/ai-tools/activity-timeline?filter=cart')} data-testid="card-cart-recovery">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <ShoppingCart className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">Cart Recovery Actions</h3>
                  <p className="text-xs text-slate-400 mb-3">ZYRA recovers lost revenue automatically</p>
                  <div className="flex items-center gap-2">
                    <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-0">Active</Badge>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-300" data-testid="button-view-active-recoveries">
                <Eye className="w-4 h-4 mr-2" />
                View Active Recoveries
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#16162c] border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/ai-tools/activity-timeline?filter=upsell')} data-testid="card-upsell-actions">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <Mail className="w-5 h-5 text-pink-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">Post-Purchase Upsell Actions</h3>
                  <p className="text-xs text-slate-400 mb-3">ZYRA recommends products after purchase</p>
                  <div className="flex items-center gap-2">
                    <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-0">Active</Badge>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-300" data-testid="button-view-upsell-actions">
                <Eye className="w-4 h-4 mr-2" />
                View Upsell Actions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue Impact Overview (Proof) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-chart-2" />
          <h2 className="text-lg font-semibold text-white">Revenue Impact Overview</h2>
          <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">Proof</Badge>
        </div>
        <Card className="bg-gradient-to-r from-primary/10 to-emerald-500/10 border-primary/20 hover-elevate cursor-pointer" onClick={() => setLocation('/analytics/revenue-impact')} data-testid="card-revenue-overview">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/20">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">What ZYRA Changed & Revenue Made</h3>
                  <p className="text-sm text-slate-400">See all decisions, affected products, and actual revenue impact</p>
                </div>
              </div>
              <Button variant="outline" className="border-primary/30 text-primary" onClick={() => setLocation('/ai-tools/activity-timeline')} data-testid="button-view-zyra-decisions">
                <Eye className="w-4 h-4 mr-2" />
                View ZYRA Decisions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#16162c] border-slate-700/50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">How ZYRA Works</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                ZYRA continuously monitors your store, detecting revenue opportunities and executing safe, 
                reversible optimizations. Every action is measured for real revenue impact, and ZYRA learns 
                what works best for your specific store over time.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="text-slate-400 border-slate-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Safe & Reversible
                </Badge>
                <Badge variant="outline" className="text-slate-400 border-slate-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Revenue-First
                </Badge>
                <Badge variant="outline" className="text-slate-400 border-slate-600">
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Auto-Rollback
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}