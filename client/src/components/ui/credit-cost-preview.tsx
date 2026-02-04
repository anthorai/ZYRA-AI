import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Zap, Search, Lock, Unlock, CheckCircle, AlertTriangle } from "lucide-react";

export type ExecutionMode = "fast" | "competitive_intelligence";
export type ActionCategory = "foundation" | "growth" | "guard";

interface CreditCostPreviewProps {
  actionName: string;
  actionDescription: string;
  category: ActionCategory;
  mode: ExecutionMode;
  fastModeCredits: number;
  competitiveCredits: number;
  isLocked: boolean;
  lockMessage?: string;
  hasEnoughCredits: boolean;
  creditsRemaining: number;
  breakdown?: string[];
  compact?: boolean;
}

export function CreditCostPreview({
  actionName,
  actionDescription,
  category,
  mode,
  fastModeCredits,
  competitiveCredits,
  isLocked,
  lockMessage,
  hasEnoughCredits,
  creditsRemaining,
  breakdown = [],
  compact = false,
}: CreditCostPreviewProps) {
  const selectedCredits = mode === "competitive_intelligence" ? competitiveCredits : fastModeCredits;
  const savings = competitiveCredits - fastModeCredits;

  const getCategoryBadge = () => {
    switch (category) {
      case "foundation":
        return <Badge variant="outline">Foundation</Badge>;
      case "growth":
        return <Badge variant="secondary">Growth</Badge>;
      case "guard":
        return <Badge className="bg-primary text-primary-foreground">Guard</Badge>;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2 rounded border bg-muted/30">
        <div className="flex items-center gap-2">
          {isLocked ? (
            <Lock className="h-4 w-4 text-muted-foreground" />
          ) : (
            mode === "competitive_intelligence" ? (
              <Search className="h-4 w-4 text-primary" />
            ) : (
              <Zap className="h-4 w-4 text-yellow-500" />
            )
          )}
          <span className="text-sm font-medium">{actionName}</span>
        </div>
        <div className="flex items-center gap-2">
          {isLocked ? (
            <span className="text-xs text-muted-foreground">Locked</span>
          ) : (
            <span className="text-sm font-medium">{selectedCredits} credits</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={isLocked ? "opacity-75" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isLocked ? (
              <Lock className="h-5 w-5 text-muted-foreground" />
            ) : hasEnoughCredits ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            <CardTitle className="text-base">{actionName}</CardTitle>
          </div>
          {getCategoryBadge()}
        </div>
        <p className="text-sm text-muted-foreground">{actionDescription}</p>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLocked ? (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Already Optimized</p>
              <p className="text-xs text-muted-foreground">
                {lockMessage || "No credits used — locked until store changes"}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mode === "competitive_intelligence" ? (
                  <>
                    <Search className="h-4 w-4 text-primary" />
                    <span className="text-sm">Competitive Intelligence</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Fast Mode</span>
                  </>
                )}
              </div>
              <div className="text-right">
                <span className="text-lg font-bold">{selectedCredits}</span>
                <span className="text-sm text-muted-foreground ml-1">credits</span>
              </div>
            </div>

            {mode === "fast" && savings > 0 && (
              <div className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Saving {savings} credits vs Competitive Intelligence
              </div>
            )}

            {breakdown.length > 0 && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Cost Breakdown</p>
                  {breakdown.map((item, index) => (
                    <p key={index} className="text-xs text-muted-foreground">
                      {item}
                    </p>
                  ))}
                </div>
              </>
            )}

            {!hasEnoughCredits && (
              <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded-md text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  Insufficient credits. Need {selectedCredits}, have {creditsRemaining}
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
