import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";

export default function BillingConfirmPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading');
  const [message, setMessage] = useState("");
  const [planName, setPlanName] = useState("");

  const searchParams = new URLSearchParams(window.location.search);
  const planId = searchParams.get('planId');
  const billingPeriod = searchParams.get('billingPeriod');
  const chargeId = searchParams.get('charge_id');

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/billing/confirm', planId, chargeId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (planId) params.set('planId', planId);
      if (billingPeriod) params.set('billingPeriod', billingPeriod);
      if (chargeId) params.set('charge_id', chargeId);
      
      const response = await fetch(`/api/billing/confirm?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to confirm subscription');
      }
      
      return response.json();
    },
    enabled: !!planId,
    retry: 2,
    retryDelay: 1000
  });

  useEffect(() => {
    if (data) {
      if (data.success && data.status === 'active') {
        setStatus('success');
        setMessage(data.message || "Your subscription has been activated successfully!");
        setPlanName(data.plan?.planName || "");
      } else if (data.status === 'pending') {
        setStatus('pending');
        setMessage(data.message || "Your subscription is pending approval.");
      } else {
        setStatus('error');
        setMessage(data.message || "Could not verify subscription status.");
      }
    }
    
    if (error) {
      setStatus('error');
      setMessage("Failed to confirm your subscription. Please try again or contact support.");
    }
  }, [data, error]);

  const handleGoToBilling = () => {
    setLocation('/billing');
  };

  const handleGoToDashboard = () => {
    setLocation('/dashboard');
  };

  return (
    <PageShell
      title="Subscription Confirmation"
      subtitle="Verifying your subscription status"
      maxWidth="sm"
      spacing="normal"
    >
      <DashboardCard testId="card-billing-confirm">
        <div className="text-center py-8">
          {(isLoading || status === 'loading') && (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Confirming your subscription...</h2>
              <p className="text-slate-400">Please wait while we verify your payment with Shopify.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Subscription Activated!</h2>
              {planName && (
                <p className="text-primary font-medium mb-2">{planName} Plan</p>
              )}
              <p className="text-slate-400 mb-6">{message}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={handleGoToDashboard}
                  className="gap-2"
                  data-testid="button-go-dashboard"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleGoToBilling}
                  data-testid="button-view-billing"
                >
                  View Billing
                </Button>
              </div>
            </>
          )}

          {status === 'pending' && (
            <>
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Subscription Pending</h2>
              <p className="text-slate-400 mb-6">{message}</p>
              <Button 
                variant="outline"
                onClick={handleGoToBilling}
                data-testid="button-back-billing"
              >
                Back to Billing
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Confirmation Failed</h2>
              <p className="text-slate-400 mb-6">{message}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={handleGoToBilling}
                  data-testid="button-try-again"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/settings/integrations'}
                  data-testid="button-contact-support"
                >
                  Contact Support
                </Button>
              </div>
            </>
          )}
        </div>
      </DashboardCard>
    </PageShell>
  );
}
