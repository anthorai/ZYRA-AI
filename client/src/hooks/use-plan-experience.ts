/**
 * Plan Experience Hook
 * 
 * Provides plan-aware UX behavior for ZYRA AI.
 * Users FEEL the power of their subscription through behavior,
 * automation level, and speed — not by reading plan limits.
 * 
 * BEHAVIOR RULES:
 * - Starter+: Approval-focused, safety-first, preview-oriented
 * - Growth: Semi-autonomous, faster feedback, fewer interruptions
 * - Scale: Full autonomy, revenue-focused, minimal prompts
 * 
 * UPGRADE EXPERIENCE:
 * - Never show locked buttons
 * - Never say "Upgrade required"
 * - Show soft nudges that inspire rather than restrict
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { getPlanIdByName, ZYRA_PLANS, PLAN_AUTONOMY } from '@/lib/constants/plans';

export type PlanTier = 'trial' | 'starter' | 'growth' | 'scale';
export type AutonomyLevel = 'manual' | 'semi_auto' | 'full_auto';

export interface ActionLanguage {
  actionPrepared: string;
  actionApplied: string;
  actionInProgress: string;
  approvalPrompt: string;
  autoAppliedNotice: string;
  rollbackAvailable: string;
  previewLabel: string;
  confirmButton: string;
  cancelButton: string;
}

export interface PlanExperience {
  tier: PlanTier;
  autonomyLevel: AutonomyLevel;
  
  showApprovalFlow: boolean;
  showDetailedPreviews: boolean;
  showAutoAppliedBadges: boolean;
  focusOnRevenue: boolean;
  minimalNotifications: boolean;
  
  language: ActionLanguage;
  
  shouldAutoExecute: (riskLevel: 'low' | 'medium' | 'high') => boolean;
  shouldShowApprovalModal: (riskLevel: 'low' | 'medium' | 'high') => boolean;
  shouldShowDetailedPreview: (actionType: string) => boolean;
  
  getUpgradeNudge: (context: 'approval' | 'speed' | 'automation' | 'intelligence') => string | null;
  getActionStatusLabel: (status: 'pending' | 'running' | 'completed' | 'auto_applied') => string;
}

const STARTER_LANGUAGE: ActionLanguage = {
  actionPrepared: "Prepared by ZYRA",
  actionApplied: "Applied successfully",
  actionInProgress: "Processing your request...",
  approvalPrompt: "Ready to apply — Review this change",
  autoAppliedNotice: "Applied with your approval",
  rollbackAvailable: "You can undo this anytime",
  previewLabel: "Preview changes before applying",
  confirmButton: "Apply Change",
  cancelButton: "Not Now",
};

const GROWTH_LANGUAGE: ActionLanguage = {
  actionPrepared: "ZYRA detected an opportunity",
  actionApplied: "Auto-applied by ZYRA",
  actionInProgress: "ZYRA is optimizing...",
  approvalPrompt: "Quick approval needed",
  autoAppliedNotice: "Handled automatically",
  rollbackAvailable: "Rollback available if needed",
  previewLabel: "Review summary",
  confirmButton: "Approve",
  cancelButton: "Skip",
};

const SCALE_LANGUAGE: ActionLanguage = {
  actionPrepared: "Optimization queued",
  actionApplied: "Optimized automatically",
  actionInProgress: "Autonomous optimization in progress",
  approvalPrompt: "High-impact action detected",
  autoAppliedNotice: "ZYRA handled this for you",
  rollbackAvailable: "All changes are reversible",
  previewLabel: "Impact summary",
  confirmButton: "Confirm",
  cancelButton: "Pause",
};

function getPlanTier(planName: string): PlanTier {
  const planId = getPlanIdByName(planName);
  
  if (planId === ZYRA_PLANS.SCALE) return 'scale';
  if (planId === ZYRA_PLANS.GROWTH) return 'growth';
  if (planId === ZYRA_PLANS.STARTER) return 'starter';
  return 'trial';
}

function getAutonomyLevel(planName: string): AutonomyLevel {
  const planId = getPlanIdByName(planName);
  const autonomy = PLAN_AUTONOMY[planId as keyof typeof PLAN_AUTONOMY];
  return (autonomy || 'manual') as AutonomyLevel;
}

export function usePlanExperience(): PlanExperience {
  const { appUser } = useAuth();
  const planName = appUser?.plan || 'trial';
  
  return useMemo(() => {
    const tier = getPlanTier(planName);
    const autonomyLevel = getAutonomyLevel(planName);
    
    const isScale = tier === 'scale';
    const isGrowth = tier === 'growth';
    const isStarter = tier === 'starter' || tier === 'trial';
    
    const language = isScale 
      ? SCALE_LANGUAGE 
      : isGrowth 
        ? GROWTH_LANGUAGE 
        : STARTER_LANGUAGE;
    
    const shouldAutoExecute = (riskLevel: 'low' | 'medium' | 'high'): boolean => {
      if (isScale) {
        return riskLevel === 'low' || riskLevel === 'medium';
      }
      if (isGrowth) {
        return riskLevel === 'low';
      }
      return false;
    };
    
    const shouldShowApprovalModal = (riskLevel: 'low' | 'medium' | 'high'): boolean => {
      if (isScale) {
        return riskLevel === 'high';
      }
      if (isGrowth) {
        return riskLevel === 'medium' || riskLevel === 'high';
      }
      return true;
    };
    
    const shouldShowDetailedPreview = (actionType: string): boolean => {
      if (isScale) {
        return ['price_change', 'bulk_update', 'delete'].includes(actionType);
      }
      if (isGrowth) {
        return ['price_change', 'bulk_update', 'delete', 'seo_update'].includes(actionType);
      }
      return true;
    };
    
    const getUpgradeNudge = (context: 'approval' | 'speed' | 'automation' | 'intelligence'): string | null => {
      if (isScale) return null;
      
      const nudges: Record<string, Record<string, string>> = {
        trial: {
          approval: "ZYRA could automate this safely",
          speed: "Higher autonomy unlocks faster growth",
          automation: "Let ZYRA handle routine optimizations",
          intelligence: "Advanced AI creates smarter recommendations",
        },
        starter: {
          approval: "ZYRA could handle low-risk actions automatically",
          speed: "Faster execution means more time for strategy",
          automation: "Trust ZYRA with routine optimizations",
          intelligence: "Premium AI analyzes deeper patterns",
        },
        growth: {
          approval: "Full autonomy handles even complex optimizations",
          speed: "Priority processing maximizes your advantage",
          automation: "ZYRA could optimize pricing automatically",
          intelligence: "Competitive intelligence reveals hidden opportunities",
        },
      };
      
      return nudges[tier]?.[context] || null;
    };
    
    const getActionStatusLabel = (status: 'pending' | 'running' | 'completed' | 'auto_applied'): string => {
      const labels: Record<string, Record<string, string>> = {
        trial: {
          pending: "Awaiting your approval",
          running: "Processing...",
          completed: "Applied successfully",
          auto_applied: "Applied with approval",
        },
        starter: {
          pending: "Ready for review",
          running: "Applying changes...",
          completed: "Change applied",
          auto_applied: "Applied with approval",
        },
        growth: {
          pending: "Quick approval needed",
          running: "ZYRA is working...",
          completed: "Optimization complete",
          auto_applied: "Auto-applied by ZYRA",
        },
        scale: {
          pending: "Confirmation needed",
          running: "Optimizing...",
          completed: "Optimized",
          auto_applied: "Handled automatically",
        },
      };
      
      return labels[tier]?.[status] || status;
    };
    
    return {
      tier,
      autonomyLevel,
      
      showApprovalFlow: isStarter,
      showDetailedPreviews: isStarter || isGrowth,
      showAutoAppliedBadges: isGrowth || isScale,
      focusOnRevenue: isScale,
      minimalNotifications: isScale,
      
      language,
      
      shouldAutoExecute,
      shouldShowApprovalModal,
      shouldShowDetailedPreview,
      getUpgradeNudge,
      getActionStatusLabel,
    };
  }, [planName]);
}

export function usePlanTier(): PlanTier {
  const { tier } = usePlanExperience();
  return tier;
}

export function useAutonomyLevel(): AutonomyLevel {
  const { autonomyLevel } = usePlanExperience();
  return autonomyLevel;
}
