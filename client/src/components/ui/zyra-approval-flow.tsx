/**
 * ZYRA Approval Flow Components
 * 
 * Plan-aware approval dialogs and action cards that adapt
 * their behavior based on subscription tier.
 * 
 * PLAN BEHAVIORS:
 * - Starter+: Detailed preview, safety emphasis, frequent approvals
 * - Growth: Streamlined approval, quick confirm, auto-apply low-risk
 * - Scale: Minimal prompts, only high-impact confirmation
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Undo2, 
  Sparkles,
  ArrowRight,
  Shield,
  Zap
} from "lucide-react";
import { usePlanExperience } from "@/hooks/use-plan-experience";
import { ZyraNudge, AutomationNudge } from "./zyra-nudge";
import { cn } from "@/lib/utils";

type RiskLevel = 'low' | 'medium' | 'high';

interface ApprovalAction {
  id: string;
  type: string;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  impact?: string;
  preview?: {
    before: string;
    after: string;
  };
  estimatedImpact?: {
    metric: string;
    change: string;
  };
}

interface ZyraApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ApprovalAction;
  onApprove: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export function ZyraApprovalDialog({
  open,
  onOpenChange,
  action,
  onApprove,
  onReject,
  isProcessing = false,
}: ZyraApprovalDialogProps) {
  const { 
    tier, 
    language, 
    showDetailedPreviews,
    shouldShowDetailedPreview,
    getUpgradeNudge
  } = usePlanExperience();
  
  const showPreview = showDetailedPreviews && shouldShowDetailedPreview(action.type);
  const isCompact = tier === 'scale' || (tier === 'growth' && action.riskLevel === 'low');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "sm:max-w-md",
          isCompact && "sm:max-w-sm"
        )}
        data-testid="dialog-approval"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isCompact ? action.title : language.approvalPrompt}
          </DialogTitle>
          {!isCompact && (
            <DialogDescription>
              {action.title}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {!isCompact && (
            <p className="text-sm text-muted-foreground">
              {action.description}
            </p>
          )}

          {showPreview && action.preview && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {language.previewLabel}
              </p>
              <div className="grid gap-2 text-sm">
                <div className="p-2 rounded bg-muted/50 border-l-2 border-red-500/50">
                  <span className="text-xs text-muted-foreground">Before:</span>
                  <p className="mt-1 line-clamp-2">{action.preview.before}</p>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="p-2 rounded bg-muted/50 border-l-2 border-green-500/50">
                  <span className="text-xs text-muted-foreground">After:</span>
                  <p className="mt-1 line-clamp-2">{action.preview.after}</p>
                </div>
              </div>
            </div>
          )}

          {action.estimatedImpact && tier !== 'scale' && (
            <div className="flex items-center gap-2 text-sm bg-primary/5 p-2 rounded">
              <Zap className="h-4 w-4 text-primary" />
              <span>
                Estimated {action.estimatedImpact.metric}: 
                <span className="font-medium text-primary ml-1">
                  {action.estimatedImpact.change}
                </span>
              </span>
            </div>
          )}

          {tier === 'starter' || tier === 'trial' ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Undo2 className="h-3 w-3" />
              {language.rollbackAvailable}
            </div>
          ) : null}

          <AutomationNudge actionType={action.type} />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onReject}
            disabled={isProcessing}
            data-testid="button-reject-action"
          >
            {language.cancelButton}
          </Button>
          <Button
            onClick={onApprove}
            disabled={isProcessing}
            data-testid="button-approve-action"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {language.confirmButton}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ZyraActionCardProps {
  action: ApprovalAction;
  onApprove: () => void;
  onReject: () => void;
  onPreview?: () => void;
  isProcessing?: boolean;
  className?: string;
}

export function ZyraActionCard({
  action,
  onApprove,
  onReject,
  onPreview,
  isProcessing = false,
  className,
}: ZyraActionCardProps) {
  const { 
    tier, 
    language, 
    showDetailedPreviews,
  } = usePlanExperience();
  
  const riskColors: Record<RiskLevel, string> = {
    low: "text-green-600 dark:text-green-400",
    medium: "text-amber-600 dark:text-amber-400", 
    high: "text-red-600 dark:text-red-400",
  };
  
  const riskLabels: Record<RiskLevel, string> = {
    low: tier === 'scale' ? 'Auto' : 'Safe',
    medium: tier === 'scale' ? 'Review' : 'Moderate',
    high: 'Important',
  };

  return (
    <Card className={cn("hover-elevate", className)} data-testid={`card-action-${action.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium">
            {action.title}
          </CardTitle>
          <Badge 
            variant="outline" 
            className={cn("text-xs shrink-0", riskColors[action.riskLevel])}
          >
            {riskLabels[action.riskLevel]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {action.description}
        </p>
        
        {action.impact && (
          <p className="text-xs text-primary mt-2 flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {action.impact}
          </p>
        )}
      </CardContent>
      
      <CardFooter className="gap-2">
        {showDetailedPreviews && onPreview && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onPreview}
            data-testid="button-preview-action"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
        )}
        <div className="flex-1" />
        <Button 
          variant="outline" 
          size="sm"
          onClick={onReject}
          disabled={isProcessing}
          data-testid="button-skip-action"
        >
          Skip
        </Button>
        <Button 
          size="sm"
          onClick={onApprove}
          disabled={isProcessing}
          data-testid="button-apply-action"
        >
          {isProcessing ? "..." : language.confirmButton}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface ZyraPendingActionsProps {
  actions: ApprovalAction[];
  onApprove: (actionId: string) => void;
  onReject: (actionId: string) => void;
  onApproveAll?: () => void;
  processingIds?: string[];
  className?: string;
}

export function ZyraPendingActions({
  actions,
  onApprove,
  onReject,
  onApproveAll,
  processingIds = [],
  className,
}: ZyraPendingActionsProps) {
  const { tier, language, focusOnRevenue } = usePlanExperience();
  const [selectedAction, setSelectedAction] = useState<ApprovalAction | null>(null);
  
  if (actions.length === 0) {
    return null;
  }
  
  const headerText = focusOnRevenue 
    ? `${actions.length} pending ${actions.length === 1 ? 'action' : 'actions'}`
    : `${language.actionPrepared} — ${actions.length} ready for review`;
  
  const lowRiskCount = actions.filter(a => a.riskLevel === 'low').length;
  
  return (
    <div className={cn("space-y-4", className)} data-testid="pending-actions">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-medium">{headerText}</h3>
        </div>
        
        {onApproveAll && actions.length > 1 && tier !== 'trial' && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onApproveAll}
            data-testid="button-approve-all"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {tier === 'scale' ? 'Approve all' : 'Apply all safe changes'}
          </Button>
        )}
      </div>
      
      {tier === 'starter' || tier === 'trial' ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <Shield className="h-3.5 w-3.5" />
          All changes can be undone. Review each action before applying.
        </div>
      ) : null}
      
      {tier === 'growth' && lowRiskCount > 0 && (
        <ZyraNudge context="automation" />
      )}
      
      <div className="grid gap-3">
        {actions.map((action) => (
          <ZyraActionCard
            key={action.id}
            action={action}
            onApprove={() => onApprove(action.id)}
            onReject={() => onReject(action.id)}
            onPreview={() => setSelectedAction(action)}
            isProcessing={processingIds.includes(action.id)}
          />
        ))}
      </div>
      
      {selectedAction && (
        <ZyraApprovalDialog
          open={!!selectedAction}
          onOpenChange={(open) => !open && setSelectedAction(null)}
          action={selectedAction}
          onApprove={() => {
            onApprove(selectedAction.id);
            setSelectedAction(null);
          }}
          onReject={() => {
            onReject(selectedAction.id);
            setSelectedAction(null);
          }}
          isProcessing={processingIds.includes(selectedAction.id)}
        />
      )}
    </div>
  );
}

interface ZyraAutoAppliedSummaryProps {
  count: number;
  actions: Array<{ type: string; title: string }>;
  revenueImpact?: string;
  className?: string;
}

export function ZyraAutoAppliedSummary({
  count,
  actions,
  revenueImpact,
  className,
}: ZyraAutoAppliedSummaryProps) {
  const { tier, language, focusOnRevenue } = usePlanExperience();
  
  if (count === 0) return null;
  
  return (
    <Card className={cn("border-primary/20 bg-primary/5", className)} data-testid="auto-applied-summary">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-sm">
            {focusOnRevenue 
              ? `${count} optimizations applied` 
              : `${language.autoAppliedNotice}`
            }
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent>
        {focusOnRevenue && revenueImpact ? (
          <p className="text-2xl font-bold text-primary">
            {revenueImpact}
          </p>
        ) : (
          <ul className="text-sm text-muted-foreground space-y-1">
            {actions.slice(0, 3).map((action, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {action.title}
              </li>
            ))}
            {actions.length > 3 && (
              <li className="text-xs text-muted-foreground">
                +{actions.length - 3} more
              </li>
            )}
          </ul>
        )}
        
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Undo2 className="h-3 w-3" />
          All changes are reversible
        </p>
      </CardContent>
    </Card>
  );
}
