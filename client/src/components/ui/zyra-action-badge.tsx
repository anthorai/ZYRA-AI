/**
 * ZYRA Action Badge
 * 
 * Displays action status with plan-appropriate language.
 * Reinforces the "one revenue brain" concept by showing
 * ZYRA as an active agent, not a passive tool.
 * 
 * PLAN BEHAVIORS:
 * - Starter+: Emphasizes approval and review
 * - Growth: Shows auto-applied status, faster feedback
 * - Scale: Minimal, revenue-focused language
 */

import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Sparkles,
  Zap,
  Bot
} from "lucide-react";
import { usePlanExperience, PlanTier } from "@/hooks/use-plan-experience";
import { cn } from "@/lib/utils";

export type ActionStatus = 
  | 'pending' 
  | 'running' 
  | 'completed' 
  | 'auto_applied'
  | 'awaiting_approval'
  | 'scheduled';

interface ZyraActionBadgeProps {
  status: ActionStatus;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'default';
}

const STATUS_ICONS: Record<ActionStatus, typeof CheckCircle2> = {
  pending: Clock,
  running: Loader2,
  completed: CheckCircle2,
  auto_applied: Sparkles,
  awaiting_approval: Clock,
  scheduled: Zap,
};

const STATUS_VARIANTS: Record<ActionStatus, 'default' | 'secondary' | 'outline'> = {
  pending: 'secondary',
  running: 'outline',
  completed: 'default',
  auto_applied: 'default',
  awaiting_approval: 'secondary',
  scheduled: 'outline',
};

function getStatusLabel(
  status: ActionStatus, 
  tier: PlanTier,
  getActionStatusLabel: (s: 'pending' | 'running' | 'completed' | 'auto_applied') => string
): string {
  const mappedStatus = status === 'awaiting_approval' ? 'pending' 
    : status === 'scheduled' ? 'pending' 
    : status;
  
  if (status === 'scheduled') {
    return tier === 'scale' ? 'Queued' : 'Scheduled';
  }
  
  return getActionStatusLabel(mappedStatus as 'pending' | 'running' | 'completed' | 'auto_applied');
}

export function ZyraActionBadge({ 
  status, 
  className,
  showIcon = true,
  size = 'default'
}: ZyraActionBadgeProps) {
  const { tier, getActionStatusLabel } = usePlanExperience();
  
  const Icon = STATUS_ICONS[status];
  const variant = STATUS_VARIANTS[status];
  const label = getStatusLabel(status, tier, getActionStatusLabel);
  
  return (
    <Badge 
      variant={variant}
      className={cn(
        size === 'sm' && 'text-xs px-1.5 py-0',
        className
      )}
      data-testid={`badge-action-${status}`}
    >
      {showIcon && (
        <Icon 
          className={cn(
            "mr-1",
            size === 'sm' ? "h-3 w-3" : "h-3.5 w-3.5",
            status === 'running' && "animate-spin"
          )} 
        />
      )}
      {label}
    </Badge>
  );
}

interface ZyraAgentBadgeProps {
  action: 'detected' | 'analyzing' | 'optimizing' | 'completed' | 'learning';
  className?: string;
}

export function ZyraAgentBadge({ action, className }: ZyraAgentBadgeProps) {
  const { tier } = usePlanExperience();
  
  const labels: Record<typeof action, Record<PlanTier, string>> = {
    detected: {
      trial: "ZYRA found something",
      starter: "Opportunity detected",
      growth: "Revenue opportunity detected",
      scale: "Opportunity",
    },
    analyzing: {
      trial: "ZYRA is reviewing...",
      starter: "Analyzing for you...",
      growth: "Deep analysis in progress",
      scale: "Analyzing",
    },
    optimizing: {
      trial: "Preparing optimization...",
      starter: "Preparing changes...",
      growth: "Optimizing automatically",
      scale: "Optimizing",
    },
    completed: {
      trial: "Review complete",
      starter: "Ready for your review",
      growth: "Optimization applied",
      scale: "Done",
    },
    learning: {
      trial: "ZYRA is learning",
      starter: "Learning from results",
      growth: "Improving recommendations",
      scale: "Learning",
    },
  };
  
  const icons: Record<typeof action, typeof Bot> = {
    detected: Sparkles,
    analyzing: Loader2,
    optimizing: Zap,
    completed: CheckCircle2,
    learning: Bot,
  };
  
  const Icon = icons[action];
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        "gap-1",
        action === 'optimizing' && "border-primary/50 text-primary",
        action === 'completed' && "border-green-500/50 text-green-600 dark:text-green-400",
        className
      )}
      data-testid={`badge-zyra-${action}`}
    >
      <Icon 
        className={cn(
          "h-3 w-3",
          (action === 'analyzing' || action === 'optimizing') && "animate-spin"
        )} 
      />
      {labels[action][tier]}
    </Badge>
  );
}

interface AutoAppliedBadgeProps {
  className?: string;
  timestamp?: Date;
}

export function AutoAppliedBadge({ className, timestamp }: AutoAppliedBadgeProps) {
  const { tier, showAutoAppliedBadges, language } = usePlanExperience();
  
  if (!showAutoAppliedBadges && tier !== 'trial') {
    return null;
  }
  
  return (
    <Badge 
      variant="default"
      className={cn(
        "gap-1 bg-primary/10 text-primary border-primary/20",
        className
      )}
      data-testid="badge-auto-applied"
    >
      <Sparkles className="h-3 w-3" />
      {language.autoAppliedNotice}
    </Badge>
  );
}
