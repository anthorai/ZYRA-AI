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
      <Card
        className="max-w-lg w-full border-0"
        style={{
          background: '#121833',
          border: '1px dashed rgba(0,240,255,0.25)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{
              background: 'radial-gradient(circle, rgba(0,240,255,0.25), rgba(0,240,255,0.05))',
              boxShadow: '0 0 24px rgba(0,240,255,0.45)',
            }}
          >
            <Store className="w-10 h-10" style={{ color: '#00F0FF' }} />
          </div>
          
          <h2
            className="text-2xl mb-3"
            style={{ color: '#E6F7FF', fontWeight: 600 }}
            data-testid="text-gate-title"
          >
            ZYRA is not connected to your Shopify store
          </h2>
          
          <p className="mb-8 max-w-md" style={{ color: '#A9B4E5' }} data-testid="text-gate-description">
            Connect your Shopify store to allow ZYRA to detect revenue opportunities and run optimizations.
          </p>

          <div className="flex flex-col gap-4 w-full max-w-xs mb-6">
            <button
              onClick={handleConnectShopify}
              className="w-full inline-flex items-center justify-center rounded-md px-6 py-3 text-sm transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #00F0FF, #00FFE5)',
                color: '#04141C',
                fontWeight: 600,
                boxShadow: '0 6px 20px rgba(0,240,255,0.45)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #1AF5FF, #33FFE9)';
                e.currentTarget.style.boxShadow = '0 0 24px rgba(0,240,255,0.65)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #00F0FF, #00FFE5)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,240,255,0.45)';
              }}
              data-testid="button-connect-shopify"
            >
              <Link className="w-4 h-4 mr-2" />
              Connect Shopify Store
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>

          <div
            className="flex items-center gap-2 text-sm rounded-full px-4 py-2"
            style={{ background: 'rgba(34,197,94,0.12)' }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: '#22C55E' }} />
            <span style={{ color: '#9EFFC3' }} data-testid="text-gate-safety">No changes will be made without your approval.</span>
          </div>

          <div className="mt-8 pt-6 w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs mb-4" style={{ color: '#7C86B8' }}>What ZYRA will do once connected:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div
                className="flex flex-col items-center gap-2 p-3 rounded-lg"
                style={{ background: '#0F1F2E' }}
              >
                <Brain className="w-5 h-5" style={{ color: '#00F0FF' }} />
                <span className="text-center" style={{ color: '#B8C6FF' }}>Analyze products & competitors</span>
              </div>
              <div
                className="flex flex-col items-center gap-2 p-3 rounded-lg"
                style={{ background: '#0F1F2E' }}
              >
                <Zap className="w-5 h-5" style={{ color: '#A78BFA' }} />
                <span className="text-center" style={{ color: '#B8C6FF' }}>Detect revenue opportunities</span>
              </div>
              <div
                className="flex flex-col items-center gap-2 p-3 rounded-lg"
                style={{ background: '#0F1F2E' }}
              >
                <CheckCircle2 className="w-5 h-5" style={{ color: '#22C55E' }} />
                <span className="text-center" style={{ color: '#B8C6FF' }}>Execute optimizations safely</span>
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
