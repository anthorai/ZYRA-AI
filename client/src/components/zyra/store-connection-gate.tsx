import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Link, ShieldCheck, Brain, Zap, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import type { StoreReadiness } from "@shared/schema";

interface StoreConnectionGateProps {
  readiness: StoreReadiness;
}

export function ShopifyConnectionGate({ readiness }: StoreConnectionGateProps) {
  const [, setLocation] = useLocation();

  const handleConnectShopify = () => {
    setLocation("/settings/integrations");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6" data-testid="shopify-connection-gate">
      <Card className="max-w-lg w-full border-dashed border-2 border-muted-foreground/30">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 ring-2 ring-primary/20">
            <Store className="w-10 h-10 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-3" data-testid="text-gate-title">
            ZYRA is not connected to your Shopify store
          </h2>
          
          <p className="text-muted-foreground mb-8 max-w-md" data-testid="text-gate-description">
            Connect your Shopify store to allow ZYRA to detect revenue opportunities and run optimizations.
          </p>

          <div className="flex flex-col gap-4 w-full max-w-xs mb-6">
            <Button 
              size="lg"
              onClick={handleConnectShopify}
              className="w-full"
              data-testid="button-connect-shopify"
            >
              <Link className="w-4 h-4 mr-2" />
              Connect Shopify Store
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span data-testid="text-gate-safety">No changes will be made without your approval.</span>
          </div>

          <div className="mt-8 pt-6 border-t border-muted w-full">
            <p className="text-xs text-muted-foreground mb-4">What ZYRA will do once connected:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="text-muted-foreground text-center">Analyze products & competitors</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-muted-foreground text-center">Detect revenue opportunities</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-muted-foreground text-center">Execute optimizations safely</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface WarmUpModeProps {
  readiness: StoreReadiness;
}

export function WarmUpMode({ readiness }: WarmUpModeProps) {
  const progressSteps = [
    {
      id: 'products',
      label: 'Products synced',
      completed: readiness.productsSynced > 0,
      detail: readiness.productsSynced > 0 ? `${readiness.productsSynced} products` : 'Syncing...'
    },
    {
      id: 'structure',
      label: 'Store structure analyzed',
      completed: readiness.storeAnalyzed,
      detail: readiness.storeAnalyzed ? 'Complete' : 'Analyzing...'
    },
    {
      id: 'competitor',
      label: 'Competitor SERP scanned',
      completed: readiness.competitorScanned,
      detail: readiness.competitorScanned ? 'Complete' : 'Scanning...'
    },
    {
      id: 'firstmove',
      label: 'Preparing first Next Move',
      completed: readiness.firstMoveReady,
      detail: readiness.firstMoveReady ? 'Ready' : 'Preparing...'
    }
  ];

  const completedSteps = progressSteps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedSteps / progressSteps.length) * 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6" data-testid="warm-up-mode">
      <Card className="max-w-lg w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center mb-6 relative">
            <Brain className="w-10 h-10 text-purple-400 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping" style={{ animationDuration: '2s' }} />
          </div>

          <Badge variant="outline" className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/30">
            Warm-Up Mode
          </Badge>
          
          <h2 className="text-2xl font-bold text-foreground mb-3" data-testid="text-warmup-title">
            ZYRA is preparing your store
          </h2>
          
          <p className="text-muted-foreground mb-2" data-testid="text-warmup-description">
            We're analyzing your products, structure, and competitors to prepare your first revenue move.
          </p>

          {readiness.storeName && (
            <p className="text-sm text-muted-foreground mb-6">
              Connected to: <span className="text-foreground font-medium">{readiness.storeName}</span>
            </p>
          )}

          <div className="w-full mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Preparation progress</span>
              <span className="text-foreground font-medium">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="w-full space-y-3">
            {progressSteps.map((step) => (
              <div 
                key={step.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                data-testid={`progress-step-${step.id}`}
              >
                <div className="flex items-center gap-3">
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                  )}
                  <span className={step.completed ? "text-foreground" : "text-muted-foreground"}>
                    {step.label}
                  </span>
                </div>
                <span className={`text-sm ${step.completed ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {step.detail}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-muted w-full">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>No actions will run until preparation is complete.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
