import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Trophy
} from "lucide-react";
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
const PHASE_CONFIG = {
  detect: { 
    icon: Search, 
    label: 'Finding Friction', 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/10',
    primaryText: 'ZYRA is identifying revenue friction',
    secondaryText: 'Analyzing where buyers hesitate before purchasing'
  },
  decide: { 
    icon: Brain, 
    label: 'Deciding Next Move', 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/10',
    primaryText: 'ZYRA is deciding the next best revenue move',
    secondaryText: 'Evaluating impact, confidence, and risk'
  },
  execute: { 
    icon: Zap, 
    label: 'Applying Fix', 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/10',
    primaryText: 'Applying approved revenue optimization',
    secondaryText: 'Changes are being published safely'
  },
  prove: { 
    icon: TrendingUp, 
    label: 'Proving Results', 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/10',
    primaryText: 'Measuring revenue impact',
    secondaryText: 'Comparing before and after results'
  },
  learn: { 
    icon: Target, 
    label: 'Improving', 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/10',
    primaryText: 'ZYRA is improving future decisions',
    secondaryText: 'Learning what converts better for your store'
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

type StrictDetectionStatus = 'friction_found' | 'no_friction' | 'insufficient_data' | 'detecting';

function ProgressStages({ 
  isAutopilotEnabled, 
  detectionPhase = 'idle',
  detectionStatus = 'detecting',
  isDetectionComplete = false,
  onComplete 
}: { 
  isAutopilotEnabled: boolean;
  detectionPhase?: DetectionPhase;
  detectionStatus?: StrictDetectionStatus;
  isDetectionComplete?: boolean;
  onComplete?: () => void;
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

  return (
    <div className="py-6">
      {/* Current Stage Display */}
      <div className={`flex flex-col items-center text-center transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}>
        <div className={`w-16 h-16 rounded-full ${stage.bgColor} flex items-center justify-center mb-4 relative`}>
          <Icon className={`w-8 h-8 ${stage.color}`} />
          {detectionPhase !== 'idle' && !isDetectionComplete && (
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
          )}
        </div>
        <p className={`font-semibold text-lg mb-2 ${stage.color}`}>
          {stage.title}
        </p>
        <p className={`text-slate-400 text-sm max-w-md mb-6 transition-opacity duration-300 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}>
          {description}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-md mx-auto">
        <div className="flex justify-between mb-2 px-1">
          <span className="text-xs text-slate-500">Step {currentStage + 1} of {PROGRESS_STAGES.length}</span>
          <span className="text-xs text-slate-500">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Stage Dots */}
        <div className="flex justify-between mt-3">
          {PROGRESS_STAGES.map((s, idx) => (
            <div 
              key={s.id}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx < currentStage ? 'bg-emerald-400' : 
                idx === currentStage ? 'bg-primary scale-125' : 
                'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Reassurance Message */}
      <p className="text-center text-xs text-slate-500 mt-6">
        Working in the background — no action needed from you
      </p>
      
      {/* Status Display for completed detection */}
      {isDetectionComplete && (
        <div className={`mt-4 p-3 rounded-lg text-center ${
          detectionStatus === 'friction_found' ? 'bg-emerald-500/10 border border-emerald-500/30' :
          detectionStatus === 'insufficient_data' ? 'bg-amber-500/10 border border-amber-500/30' :
          'bg-blue-500/10 border border-blue-500/30'
        }`}>
          <p className={`text-sm font-medium ${
            detectionStatus === 'friction_found' ? 'text-emerald-400' :
            detectionStatus === 'insufficient_data' ? 'text-amber-400' :
            'text-blue-400'
          }`}>
            {detectionStatus === 'friction_found' 
              ? 'Revenue opportunity found — review in Next Move'
              : detectionStatus === 'insufficient_data'
              ? 'Collecting baseline data — ZYRA will act once signals are strong'
              : 'No urgent revenue risk — monitoring continues'
            }
          </p>
        </div>
      )}
    </div>
  );
}

function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
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
    }, 20);

    return () => clearInterval(interval);
  }, [text, onComplete]);

  return (
    <span>
      {displayedText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
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
  
  const DETECTION_TIMEOUT_MS = 10000;
  
  const { data: detectionStatusData } = useQuery<{
    phase: DetectionPhase;
    status: 'friction_found' | 'no_friction' | 'insufficient_data' | 'detecting';
    complete: boolean;
    timestamp: number;
    lastValidNextMoveId?: string;
    reason?: string;
    nextAction?: 'standby' | 'data_collection' | 'decide';
  }>({
    queryKey: ['/api/zyra/detection-status'],
    refetchInterval: isDetecting ? 1000 : false,
    enabled: storeReadiness?.state === 'ready' && isDetecting,
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

  const { toast } = useToast();
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

  const currentPhase = events.length > 0 ? events[events.length - 1].phase : 'detect';
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