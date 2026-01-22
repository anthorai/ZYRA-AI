/**
 * ZYRA Soft Upgrade Nudge
 * 
 * Displays subtle, inspiring messages about ZYRA's capabilities.
 * Never shows locked buttons or "Upgrade required" messages.
 * Instead, inspires users with what ZYRA could do for them.
 * 
 * DESIGN PRINCIPLES:
 * - Soft, helpful tone
 * - Focus on benefits, not restrictions
 * - Appear contextually, not constantly
 * - Never block user actions
 */

import { Info, Sparkles, Zap, Brain, TrendingUp, Coins } from "lucide-react";
import { usePlanExperience, PlanTier } from "@/hooks/use-plan-experience";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

type NudgeContext = 'approval' | 'speed' | 'automation' | 'intelligence' | 'credits_low';

interface ZyraNudgeProps {
  context: NudgeContext;
  className?: string;
  showLink?: boolean;
  softMessage?: string;
  tier?: PlanTier;
}

const CONTEXT_ICONS: Record<NudgeContext, typeof Info> = {
  approval: Sparkles,
  speed: Zap,
  automation: Brain,
  intelligence: TrendingUp,
  credits_low: Coins,
};

export function ZyraNudge({ 
  context, 
  className,
  showLink = false,
  softMessage,
  tier: tierProp
}: ZyraNudgeProps) {
  const planExperience = usePlanExperience();
  const tier = tierProp || planExperience.tier;
  
  const nudge = softMessage || (context !== 'credits_low' ? planExperience.getUpgradeNudge(context as any) : null);
  
  if (!nudge && !softMessage) {
    return null;
  }
  
  const displayMessage = nudge || softMessage;
  if (!displayMessage) return null;
  
  const Icon = CONTEXT_ICONS[context];
  
  return (
    <div 
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground",
        "py-1.5 px-2 rounded-md bg-muted/30",
        className
      )}
      data-testid={`nudge-${context}`}
    >
      <Icon className="h-3.5 w-3.5 text-primary/70 shrink-0" />
      <span className="flex-1">{displayMessage}</span>
      {showLink && (
        <Link 
          href="/settings/subscription"
          className="text-primary hover:underline shrink-0"
          data-testid="nudge-link-learn-more"
        >
          Learn more
        </Link>
      )}
    </div>
  );
}

interface ZyraInsightNudgeProps {
  insight: string;
  className?: string;
}

export function ZyraInsightNudge({ insight, className }: ZyraInsightNudgeProps) {
  const { tier } = usePlanExperience();
  
  const prefix: Record<typeof tier, string> = {
    trial: "ZYRA insight:",
    starter: "ZYRA noticed:",
    growth: "Opportunity:",
    scale: "",
  };
  
  return (
    <div 
      className={cn(
        "flex items-start gap-2 text-sm",
        "p-3 rounded-lg border border-primary/20 bg-primary/5",
        className
      )}
      data-testid="nudge-insight"
    >
      <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div>
        {prefix[tier] && (
          <span className="font-medium text-primary">{prefix[tier]} </span>
        )}
        <span className="text-foreground">{insight}</span>
      </div>
    </div>
  );
}

interface ZyraCapabilityNudgeProps {
  capability: string;
  benefit: string;
  className?: string;
}

export function ZyraCapabilityNudge({ 
  capability, 
  benefit,
  className 
}: ZyraCapabilityNudgeProps) {
  const { tier } = usePlanExperience();
  
  if (tier === 'scale') {
    return null;
  }
  
  return (
    <div 
      className={cn(
        "flex items-center gap-3 text-sm",
        "p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent",
        "border-l-2 border-primary/30",
        className
      )}
      data-testid="nudge-capability"
    >
      <div className="flex-1">
        <p className="font-medium text-foreground">{capability}</p>
        <p className="text-muted-foreground text-xs mt-0.5">{benefit}</p>
      </div>
      <Link 
        href="/settings/subscription"
        className="text-xs text-primary hover:underline shrink-0"
        data-testid="nudge-link-explore"
      >
        Explore
      </Link>
    </div>
  );
}

interface AutomationNudgeProps {
  actionType: string;
  className?: string;
}

export function AutomationNudge({ actionType, className }: AutomationNudgeProps) {
  const { tier, shouldAutoExecute } = usePlanExperience();
  
  if (shouldAutoExecute('low')) {
    return null;
  }
  
  const messages: Record<string, string> = {
    optimize_seo: "ZYRA could apply SEO improvements automatically",
    send_cart_recovery: "Cart recovery messages could send without waiting",
    update_price: "Price optimizations could apply in real-time",
    send_upsell: "Upsell recommendations could reach customers faster",
    default: "ZYRA could handle this automatically for you",
  };
  
  const message = messages[actionType] || messages.default;
  
  return (
    <div 
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground",
        "mt-2",
        className
      )}
      data-testid="nudge-automation"
    >
      <Zap className="h-3 w-3 text-amber-500" />
      <span>{message}</span>
    </div>
  );
}
