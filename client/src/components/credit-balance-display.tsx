import { useCredits } from "@/hooks/use-credits";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Coins } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreditBalanceDisplayProps {
  showProgress?: boolean;
  compact?: boolean;
}

export function CreditBalanceDisplay({ showProgress = false, compact = false }: CreditBalanceDisplayProps) {
  const { balance, isLoading, isLow, creditsRemaining, creditLimit, percentUsed } = useCredits();

  if (isLoading || !balance) {
    return null;
  }

  if (compact) {
    return (
      <Badge 
        variant={isLow ? "destructive" : "secondary"} 
        className="gap-1"
        data-testid="badge-credit-balance"
      >
        <Coins className="w-3 h-3" />
        {creditsRemaining} credits
      </Badge>
    );
  }

  return (
    <div className="space-y-2" data-testid="credit-balance-display">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Credits Remaining</span>
        <Badge 
          variant={isLow ? "destructive" : "secondary"}
          data-testid="badge-credits-remaining"
        >
          {creditsRemaining} / {creditLimit}
        </Badge>
      </div>
      
      {showProgress && (
        <Progress 
          value={100 - percentUsed} 
          className={`h-2 ${isLow ? '[&>div]:bg-destructive' : ''}`}
          data-testid="progress-credits"
        />
      )}
    </div>
  );
}

export function LowCreditWarning() {
  const { balance, isLow, creditsRemaining } = useCredits();

  if (!balance || !isLow) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4" data-testid="alert-low-credits">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        You have only {creditsRemaining} credits remaining. Consider upgrading your plan to continue using AI features.
      </AlertDescription>
    </Alert>
  );
}

interface InsufficientCreditsMessageProps {
  requiredCredits: number;
  availableCredits: number;
}

export function InsufficientCreditsMessage({ requiredCredits, availableCredits }: InsufficientCreditsMessageProps) {
  return (
    <Alert variant="destructive" data-testid="alert-insufficient-credits">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        This operation requires {requiredCredits} credits, but you only have {availableCredits} remaining.
        Please upgrade your plan to continue.
      </AlertDescription>
    </Alert>
  );
}
