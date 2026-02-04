import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Zap, Search, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ExecutionMode = "fast" | "competitive_intelligence";

interface ExecutionModeToggleProps {
  mode: ExecutionMode;
  onModeChange: (mode: ExecutionMode) => void;
  disabled?: boolean;
  showCreditDifference?: boolean;
  fastModeCredits?: number;
  competitiveCredits?: number;
  isStarterPlan?: boolean;
  competitiveUsageCount?: number;
  competitiveLimit?: number;
}

export function ExecutionModeToggle({
  mode,
  onModeChange,
  disabled = false,
  showCreditDifference = true,
  fastModeCredits = 0,
  competitiveCredits = 0,
  isStarterPlan = false,
  competitiveUsageCount = 0,
  competitiveLimit = 2,
}: ExecutionModeToggleProps) {
  const [showWarning, setShowWarning] = useState(false);
  const isCompetitive = mode === "competitive_intelligence";
  const creditDifference = competitiveCredits - fastModeCredits;

  const handleToggle = () => {
    if (disabled) return;

    if (!isCompetitive && isStarterPlan) {
      setShowWarning(true);
    } else {
      onModeChange(isCompetitive ? "fast" : "competitive_intelligence");
    }
  };

  const handleConfirmCompetitive = () => {
    setShowWarning(false);
    onModeChange("competitive_intelligence");
  };

  return (
    <>
      <div className="flex items-center gap-3 p-3 rounded-md border bg-card">
        <div className="flex items-center gap-2 flex-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                {isCompetitive ? (
                  <Search className="h-4 w-4 text-primary" />
                ) : (
                  <Zap className="h-4 w-4 text-yellow-500" />
                )}
                <span className="font-medium text-sm">
                  {isCompetitive ? "Competitive Intelligence" : "Fast Mode"}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              {isCompetitive ? (
                <p>Real-time Google SERP analysis with competitor benchmarking. Higher credit consumption.</p>
              ) : (
                <p>AI-powered optimization using proven internal patterns. Faster processing, lower credits.</p>
              )}
            </TooltipContent>
          </Tooltip>

          {isCompetitive && (
            <Badge variant="secondary" className="text-xs">
              Premium
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showCreditDifference && fastModeCredits > 0 && (
            <div className="text-xs text-muted-foreground">
              {isCompetitive ? (
                <span className="text-destructive">+{creditDifference} credits</span>
              ) : (
                <span className="text-green-600">Save {creditDifference} credits</span>
              )}
            </div>
          )}

          <Switch
            checked={isCompetitive}
            onCheckedChange={handleToggle}
            disabled={disabled}
            data-testid="toggle-execution-mode"
          />
        </div>
      </div>

      {isStarterPlan && (
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>
            {competitiveUsageCount}/{competitiveLimit} Competitive Intelligence actions used this month
          </span>
        </div>
      )}

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Premium Analysis Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-2">
              <p>
                Competitive Intelligence uses real-time Google SERP data
                and paid external APIs.
              </p>
              <p>
                This action will consume <strong>significantly more credits</strong>.
              </p>
              {isStarterPlan && (
                <p className="text-yellow-600">
                  Starter plans have limited access to prevent overuse.
                  You have {competitiveLimit - competitiveUsageCount} action(s) remaining this month.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-competitive">
              Stay with Fast Mode
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmCompetitive}
              data-testid="button-confirm-competitive"
            >
              Use Competitive Intelligence
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
