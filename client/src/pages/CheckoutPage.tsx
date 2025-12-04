import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageShell } from "@/components/ui/page-shell";
import { Check, Shield, CreditCard, Zap } from "lucide-react";
import { SiPaypal } from "react-icons/si";
import SubscriptionPayPalButton from "@/components/SubscriptionPayPalButton";

interface PendingSubscription {
  transactionId: string;
  planId: string;
  amount: string;
  planName: string;
  billingPeriod?: 'monthly' | 'annual';
}

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [pendingSubscription, setPendingSubscription] = useState<PendingSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load pending subscription from sessionStorage
  useEffect(() => {
    const pending = sessionStorage.getItem('pending_subscription');
    if (pending) {
      try {
        const data = JSON.parse(pending);
        setPendingSubscription(data);
      } catch (error) {
        console.error('Failed to parse pending subscription:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No payment information found. Please try again.",
        });
        navigate('/billing');
      }
    } else {
      toast({
        variant: "destructive",
        title: "No Plan Selected",
        description: "Please select a plan from the billing page.",
      });
      navigate('/billing');
    }
    setIsLoading(false);

    // Cleanup: Remove pending subscription on component unmount (any exit path)
    return () => {
      sessionStorage.removeItem('pending_subscription');
    };
  }, [navigate, toast]);

  // Verify PayPal payment and activate subscription
  const verifyPayment = useMutation({
    mutationFn: async (paypalOrderId: string) => {
      return apiRequest("POST", "/api/payments/paypal/verify-subscription", {
        transactionId: pendingSubscription?.transactionId,
        planId: pendingSubscription?.planId,
        paypalOrderId,
      });
    },
    onSuccess: () => {
      // Clear pending subscription
      sessionStorage.removeItem('pending_subscription');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/usage-stats'] });
      
      toast({
        title: "🎉 Payment Successful!",
        description: `Your ${pendingSubscription?.planName} subscription has been activated.`,
      });
      
      // Redirect to billing/dashboard
      setTimeout(() => navigate('/billing'), 2000);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Payment Verification Failed",
        description: error.message || "Failed to activate subscription. Please contact support.",
      });
    },
  });

  // Show loading state while verifying payment
  if (verifyPayment.isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Processing Payment...</h2>
        <p className="text-muted-foreground">Please wait while we activate your subscription</p>
      </div>
    );
  }

  const handlePaymentSuccess = (orderId: string) => {
    console.log('PayPal payment successful, order ID:', orderId);
    verifyPayment.mutate(orderId);
  };

  const handlePaymentError = (error: any) => {
    console.error('PayPal payment error:', error);
    toast({
      variant: "destructive",
      title: "Payment Failed",
      description: error.message || "Payment could not be processed. Please try again.",
    });
  };

  if (isLoading || !pendingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const planFeatures = getPlanFeatures(pendingSubscription.planName);
  const amount = parseFloat(pendingSubscription.amount);

  return (
    <PageShell
      title="Complete Your Upgrade"
      subtitle="Secure checkout powered by PayPal - Complete in seconds"
      maxWidth="xl"
      spacing="normal"
    >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Plan Details - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Plan Card */}
            <DashboardCard className="border-primary" testId="card-selected-plan">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Badge className="mb-2">Selected Plan</Badge>
                  <h2 className="text-2xl font-semibold text-white" data-testid="text-plan-name">
                    {pendingSubscription.planName}
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary" data-testid="text-plan-price">
                    ${amount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    USD/{pendingSubscription.billingPeriod === 'annual' ? 'year' : 'month'}
                  </div>
                </div>
              </div>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">
                    {getPlanDescription(pendingSubscription.planName)}
                  </p>
                  <Separator />
                  <div className="grid md:grid-cols-2 gap-3 pt-2">
                    {planFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
            </DashboardCard>

            {/* Payment Method */}
            <DashboardCard 
              title="Payment Method"
              headerAction={<CreditCard className="w-5 h-5" />}
              testId="card-payment-method"
            >
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border border-primary bg-primary/5 rounded-lg">
                    <SiPaypal className="text-4xl text-blue-500" />
                    <div className="flex-1">
                      <div className="font-semibold">PayPal</div>
                      <p className="text-sm text-muted-foreground">
                        Secure payment processing in USD
                      </p>
                    </div>
                    <Shield className="w-5 h-5 text-green-500" />
                  </div>

                  {/* PayPal Button */}
                  <div className="pt-4">
                    <SubscriptionPayPalButton
                      amount={pendingSubscription.amount}
                      currency="USD"
                      transactionId={pendingSubscription.transactionId}
                      planId={pendingSubscription.planId}
                      planName={pendingSubscription.planName}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    By completing this purchase, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
            </DashboardCard>
          </div>

          {/* Order Summary - Right Column */}
          <div className="lg:col-span-1">
            <DashboardCard 
              title="Order Summary" 
              className="sticky top-4"
              testId="card-order-summary"
            >
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">{pendingSubscription.planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing Cycle</span>
                    <span className="font-medium">
                      {pendingSubscription.billingPeriod === 'annual' ? 'Annual (Save 20%)' : 'Monthly'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span data-testid="text-subtotal">${amount} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span data-testid="text-tax">$0.00</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total Due Today</span>
                  <span className="text-primary" data-testid="text-total">
                    ${amount} USD
                  </span>
                </div>

                {/* What's Included */}
                <div className="pt-4 space-y-3 border-t">
                  <div className="font-semibold text-sm">What's Included:</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="w-4 h-4 text-primary" />
                      <span>Instant activation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-primary" />
                      <span>Cancel anytime</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span>Full feature access</span>
                    </div>
                  </div>
                </div>

                {/* Security Badges */}
                <div className="pt-4 space-y-2 border-t">
                  <div className="text-xs font-semibold text-muted-foreground">SECURE PAYMENT</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3 h-3 text-green-500" />
                    256-bit SSL Encryption
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3 h-3 text-green-500" />
                    PCI-DSS Compliant
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3 h-3 text-green-500" />
                    No card details stored
                  </div>
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>
    </PageShell>
  );
}

// Helper functions for plan details
function getPlanFeatures(planName: string): string[] {
  const features: Record<string, string[]> = {
    "Starter": [
      "1,000 AI credits/month",
      "Product optimization",
      "SEO tools & analysis",
      "Email & SMS campaigns",
      "Basic A/B testing",
      "Brand voice memory",
      "Analytics dashboard",
      "Shopify integration",
    ],
    "Growth": [
      "5,000 AI credits/month",
      "Advanced SEO tracking",
      "Bulk optimization",
      "AI upsell suggestions",
      "Customer segmentation",
      "Behavioral targeting",
      "Multi-channel content",
      "Priority support",
    ],
    "Pro": [
      "20,000 AI credits/month",
      "Priority AI processing",
      "Enterprise analytics",
      "Advanced automation",
      "Custom templates",
      "Revenue attribution",
      "Dedicated support",
      "API access",
    ],
  };
  
  return features[planName] || [
    "Full feature access",
    "AI-powered tools",
    "Analytics & reporting",
    "24/7 support",
  ];
}

function getPlanDescription(planName: string): string {
  const descriptions: Record<string, string> = {
    "Starter": "Perfect for new Shopify stores just getting started with AI-powered optimization",
    "Growth": "Ideal for scaling merchants ready to grow their revenue with advanced automation",
    "Pro": "Built for high-revenue brands and enterprises requiring maximum power and control",
  };
  
  return descriptions[planName] || "Upgrade your e-commerce experience with AI-powered tools";
}
