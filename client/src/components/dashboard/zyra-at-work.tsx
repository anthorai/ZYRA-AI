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
  Play,
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
  Eye
} from "lucide-react";
import { useLocation } from "wouter";

interface ZyraStats {
  activePhase: string;
  currentAction: string | null;
  todayRevenueDelta: number;
  todayOptimizations: number;
  pendingApprovals: number;
  successRate: number;
  lastActionAt: string | null;
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

const PHASE_CONFIG = {
  detect: { icon: Search, label: 'Detecting', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  decide: { icon: Brain, label: 'Deciding', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  execute: { icon: Zap, label: 'Executing', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  prove: { icon: TrendingUp, label: 'Measuring', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  learn: { icon: Target, label: 'Learning', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
};

const SIMULATED_EVENTS: Omit<ZyraEvent, 'id' | 'timestamp'>[] = [
  { phase: 'detect', message: 'Scanning store for revenue-impacting issues...', status: 'in_progress' },
  { phase: 'detect', message: 'Analyzing product performance data across all categories', status: 'in_progress' },
  { phase: 'detect', message: 'Found 3 products with high traffic but low conversion', status: 'completed', details: 'Revenue opportunity detected' },
  { phase: 'decide', message: 'Calculating Revenue Priority Score for each candidate...', status: 'in_progress' },
  { phase: 'decide', message: 'Evaluating "Premium Wireless Headphones" - 2,340 views, 0.8% conversion', status: 'in_progress' },
  { phase: 'decide', message: 'Selected: Product optimization for highest revenue potential', status: 'completed', details: 'Confidence: 87%' },
  { phase: 'execute', message: 'Creating snapshot of original product content...', status: 'in_progress' },
  { phase: 'execute', message: 'Optimizing product title for conversion focus', status: 'in_progress' },
  { phase: 'execute', message: 'Enhancing product description with value framing', status: 'in_progress' },
  { phase: 'execute', message: 'Optimization applied safely - original preserved for rollback', status: 'completed', details: '1 credit used' },
  { phase: 'prove', message: 'Monitoring revenue impact over 24-hour window...', status: 'in_progress' },
  { phase: 'prove', message: 'Tracking conversion rate changes...', status: 'in_progress' },
  { phase: 'prove', message: 'Revenue delta: +$127.40 in first 6 hours', status: 'completed', details: 'Positive trend confirmed' },
  { phase: 'learn', message: 'Recording successful optimization pattern...', status: 'in_progress' },
  { phase: 'learn', message: 'Updating store-specific intelligence model', status: 'in_progress' },
  { phase: 'learn', message: 'Pattern saved: Value-focused descriptions increase conversions for this store', status: 'completed', details: 'Learning complete' },
  { phase: 'detect', message: 'Continuing automated revenue monitoring...', status: 'in_progress' },
  { phase: 'detect', message: 'Next scan scheduled in 15 minutes', status: 'completed' },
];

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

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-700/50 last:border-0">
      <div className={`p-2 rounded-lg ${config.bgColor} flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${config.color} border-current/30`}>
            {config.label}
          </Badge>
          <span className="text-[10px] text-slate-500">
            {event.timestamp.toLocaleTimeString()}
          </span>
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

export default function ZyraAtWork() {
  const [demoEvents, setDemoEvents] = useState<ZyraEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(true);
  const [showDemo, setShowDemo] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const [, setLocation] = useLocation();

  const { data: stats } = useQuery<ZyraStats>({
    queryKey: ['/api/zyra/live-stats'],
    refetchInterval: 10000,
  });

  const { data: activityData, isLoading, refetch, isRefetching } = useQuery<ActivityFeedResponse>({
    queryKey: ['/api/revenue-loop/activity-feed'],
    refetchInterval: 30000,
  });


  const realEvents: ZyraEvent[] = (activityData?.activities?.map(a => ({
    ...a,
    timestamp: new Date(a.timestamp),
  })) || []).reverse();

  const hasRealData = realEvents.length > 0;
  const events = showDemo ? demoEvents : realEvents;

  useEffect(() => {
    if (!showDemo) return;
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const addNextEvent = () => {
      if (currentEventIndex >= SIMULATED_EVENTS.length) {
        setCurrentEventIndex(0);
        setDemoEvents([]);
        return;
      }

      const eventTemplate = SIMULATED_EVENTS[currentEventIndex];
      const newEvent: ZyraEvent = {
        ...eventTemplate,
        id: `event-${Date.now()}-${currentEventIndex}`,
        timestamp: new Date(),
      };

      setDemoEvents(prev => [...prev.slice(-15), newEvent]);
      setIsTypingComplete(false);
    };

    addNextEvent();
  }, [showDemo]);

  useEffect(() => {
    if (!showDemo || !isTypingComplete) return;

    const delay = SIMULATED_EVENTS[currentEventIndex]?.status === 'completed' ? 2000 : 1500;
    
    const timer = setTimeout(() => {
      const nextIndex = (currentEventIndex + 1) % SIMULATED_EVENTS.length;
      
      if (nextIndex === 0) {
        setDemoEvents([]);
      }
      
      const eventTemplate = SIMULATED_EVENTS[nextIndex];
      const newEvent: ZyraEvent = {
        ...eventTemplate,
        id: `event-${Date.now()}-${nextIndex}`,
        timestamp: new Date(),
      };

      setDemoEvents(prev => [...prev.slice(-15), newEvent]);
      setCurrentEventIndex(nextIndex);
      setIsTypingComplete(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [showDemo, isTypingComplete, currentEventIndex]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [events]);

  const currentPhase = events.length > 0 ? events[events.length - 1].phase : 'detect';
  const currentConfig = PHASE_CONFIG[currentPhase];

  return (
    <div className="space-y-6 p-4 sm:p-6" data-testid="zyra-at-work-container">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2" data-testid="text-page-title">
            ZYRA at Work
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            {showDemo ? 'Demo mode - See how ZYRA optimizes your store' : 
             hasRealData ? 'Live activity from your revenue optimization loop' :
             'No activity yet - Enable autopilot in Automation settings'}
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
          {import.meta.env.DEV && (
            <Button
              variant={showDemo ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowDemo(!showDemo);
                isInitializedRef.current = false;
              }}
              data-testid="button-toggle-demo"
            >
              <Play className="w-4 h-4 mr-1" />
              {showDemo ? 'Show Live' : 'Demo Mode'}
            </Button>
          )}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            hasRealData || showDemo ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-500/10 border border-slate-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${hasRealData || showDemo ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            <span className={`text-xs font-medium ${hasRealData || showDemo ? 'text-emerald-400' : 'text-slate-400'}`}>
              {showDemo ? 'Demo' : hasRealData ? 'Active' : 'Waiting'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="stats-grid">
        <Card className="bg-slate-900/50 border-slate-700/50">
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

        <Card className="bg-slate-900/50 border-slate-700/50">
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

        <Card className="bg-slate-900/50 border-slate-700/50">
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

        <Card className="bg-slate-900/50 border-slate-700/50">
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
      <Card className="bg-slate-900/50 border-slate-700/50">
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <p className="text-slate-400 mb-2">No activity yet</p>
                <p className="text-slate-500 text-sm max-w-sm">
                  {showDemo ? 'Starting demo mode...' : 
                   'Enable autopilot in your Automation settings to see ZYRA working for you, or try Demo Mode to see how it works.'}
                </p>
              </div>
            ) : (
              events.map((event, index) => (
                <EventItem 
                  key={event.id} 
                  event={event}
                  isTyping={showDemo && index === events.length - 1 && !isTypingComplete}
                  onTypingComplete={() => setIsTypingComplete(true)}
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

      {/* ZYRA Core Capabilities */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">ZYRA Core Capabilities</h2>
          <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">What ZYRA Can Do</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-slate-900/50 border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/ai-tools/product-seo-engine')} data-testid="card-seo-optimization">
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

          <Card className="bg-slate-900/50 border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/ai-tools/bulk-optimization')} data-testid="card-bulk-optimization">
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

          <Card className="bg-slate-900/50 border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/ai-tools/ai-image-alt-text')} data-testid="card-image-seo">
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

          <Card className="bg-slate-900/50 border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/ai-tools/brand-voice-memory')} data-testid="card-brand-voice">
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

          <Card className="bg-slate-900/50 border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/ai-tools/scheduled-refresh')} data-testid="card-smart-refresh">
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
          <Card className="bg-slate-900/50 border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/automation/shopify-publish')} data-testid="card-shopify-publishing">
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

          <Card className="bg-slate-900/50 border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/automation/smart-bulk-suggestions')} data-testid="card-optimization-patterns">
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

          <Card className="bg-slate-900/50 border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/automation/rollback-changes')} data-testid="card-safety-rollback">
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
          <Card className="bg-slate-900/50 border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/cart-recovery')} data-testid="card-cart-recovery">
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

          <Card className="bg-slate-900/50 border-slate-700/50 hover-elevate cursor-pointer" onClick={() => setLocation('/upsell-email-receipts')} data-testid="card-upsell-actions">
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
        <Card className="bg-gradient-to-r from-primary/10 to-emerald-500/10 border-primary/20 hover-elevate cursor-pointer" onClick={() => setLocation('/revenue-impact')} data-testid="card-revenue-overview">
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
              <Button variant="outline" className="border-primary/30 text-primary" data-testid="button-view-zyra-decisions">
                <Eye className="w-4 h-4 mr-2" />
                View ZYRA Decisions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/30 border-slate-700/50">
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