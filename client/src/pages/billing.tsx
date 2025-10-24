import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import NotificationCenter from "@/components/dashboard/notification-center";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowLeft,
  CreditCard, 
  Calendar, 
  Download, 
  ChevronRight, 
  Check, 
  Crown, 
  Zap,
  Globe,
  Shield,
  Star,
  TrendingUp,
  Building,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Plus,
  User,
  Settings,
  LogOut,
  Gift,
  Award,
  Rocket,
  BarChart
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  planName: string;
  price: number;
  description: string;
  features: string[];
  limits: {
    credits: number;
  };
  currency?: string;
  interval: string;
  isActive?: boolean;
}

interface UserSubscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  invoiceNumber: string;
  invoiceUrl: string;
  pdfUrl: string;
  createdAt: string;
  paidAt: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  cardBrand: string;
  cardLast4: string;
  cardExpMonth: number;
  cardExpYear: number;
  isDefault: boolean;
}

interface UsageStats {
  productsCount?: number;
  emailsSent?: number;
  emailsRemaining?: number;
  smsSent?: number;
  smsRemaining?: number;
  aiGenerationsUsed?: number;
  seoOptimizationsUsed?: number;
  creditsUsed?: number;
  creditsRemaining?: number;
}

const planIcons = {
  "7-Day Free Trial": <Rocket className="w-6 h-6 text-primary" />,
  "Starter": <BarChart className="w-6 h-6 text-primary" />,
  "Growth": <Zap className="w-6 h-6 text-primary" />,
  "Pro": <Crown className="w-6 h-6 text-primary" />,
  "Enterprise": <Building className="w-6 h-6 text-primary" />
};

export default function BillingPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Handle navigation
  const handleGoBack = () => {
    // Check if we came from Settings specifically
    const navigationSource = sessionStorage.getItem('navigationSource');
    if (navigationSource === 'settings') {
      setLocation('/settings');
      sessionStorage.removeItem('navigationSource');
      return;
    }
    
    // Check for same-origin referrer and meaningful history
    const sameOriginReferrer = document.referrer && 
      new URL(document.referrer).origin === window.location.origin;
    
    if (sameOriginReferrer && window.history.length > 1) {
      // Safe in-app navigation - go back in history
      window.history.back();
    } else {
      // Direct/external navigation or no history - fallback to dashboard
      setLocation('/dashboard');
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setLocation("/auth");
  };

  // Fetch real subscription plans from API
  const { 
    data: plans = [], 
    isLoading: plansLoading, 
    error: plansError,
    refetch: refetchPlans 
  } = useQuery<SubscriptionPlan[]>({ 
    queryKey: ['/api/subscription-plans'],
  });

  // Fetch current user subscription
  const { 
    data: currentSubscription, 
    isLoading: subscriptionLoading 
  } = useQuery<UserSubscription>({ 
    queryKey: ['/api/subscription/current'],
  });

  // Fetch usage stats
  const { 
    data: usageStats, 
    isLoading: usageLoading 
  } = useQuery<UsageStats>({ 
    queryKey: ['/api/usage-stats'],
  });

  // Fetch invoices
  const { 
    data: invoices = [], 
    isLoading: invoicesLoading 
  } = useQuery<Invoice[]>({ 
    queryKey: ['/api/invoices'],
  });

  // Fetch payment methods
  const { 
    data: paymentMethods = [], 
    isLoading: paymentMethodsLoading 
  } = useQuery<PaymentMethod[]>({ 
    queryKey: ['/api/payment-methods'],
  });

  const plansErrorDetails = plansError as any;

  // Upgrade/downgrade mutation
  const changePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/subscription/change-plan', { planId, gateway: 'razorpay' });
      return await response.json();
    },
    onSuccess: async (data: any) => {
      console.log('💳 Payment flow started:', data);
      
      // Check if payment is required
      if (data.requiresPayment && data.gateway === 'razorpay') {
        console.log('💳 Razorpay payment required, loading script...');
        
        // Load Razorpay script if not already loaded
        if (!(window as any).Razorpay) {
          console.log('📥 Loading Razorpay script...');
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onerror = () => {
            console.error('❌ Failed to load Razorpay script');
            toast({
              title: "Script Load Error",
              description: "Failed to load payment gateway. Please refresh and try again.",
              variant: "destructive",
            });
          };
          document.body.appendChild(script);
          await new Promise((resolve) => {
            script.onload = resolve;
          });
          console.log('✅ Razorpay script loaded');
        } else {
          console.log('✅ Razorpay already loaded');
        }

        // Initialize Razorpay payment
        console.log('🚀 Opening Razorpay modal with options:', {
          key: data.order?.keyId,
          amount: data.order?.amount,
          currency: data.order?.currency,
          orderId: data.order?.id
        });
        
        const options = {
          key: data.order.keyId,
          amount: data.order.amount,
          currency: data.order.currency,
          name: 'Zyra AI',
          description: `${data.plan.planName} Plan`,
          order_id: data.order.id,
          handler: async function (response: any) {
            try {
              // Verify payment with backend
              const verifyResult: any = await apiRequest('POST', '/api/payments/razorpay/verify', {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                transactionId: data.transactionId
              });

              if (verifyResult?.success) {
                queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
                queryClient.invalidateQueries({ queryKey: ['/api/usage-stats'] });
                toast({
                  title: "Payment Successful",
                  description: "Your subscription has been activated!",
                });
              } else {
                // Verification failed - show error with support option
                toast({
                  title: "Payment Verification Failed",
                  description: "Payment was processed but verification failed. Please contact support with your payment ID.",
                  variant: "destructive",
                });
              }
            } catch (error: any) {
              // Handle verification errors
              const errorMessage = error.message || error.error || "Payment verification failed";
              toast({
                title: "Payment Verification Error",
                description: `${errorMessage}. If payment was deducted, please contact support.`,
                variant: "destructive",
              });
            }
          },
          prefill: {
            email: user?.email || '',
          },
          theme: {
            color: '#8b5cf6'
          },
          modal: {
            ondismiss: function() {
              toast({
                title: "Payment Cancelled",
                description: "You cancelled the payment process.",
                variant: "destructive",
              });
            }
          }
        };

        try {
          const rzp = new (window as any).Razorpay(options);
          console.log('✅ Razorpay instance created, opening modal...');
          rzp.open();
          console.log('✅ Razorpay modal opened');
        } catch (error) {
          console.error('❌ Error opening Razorpay modal:', error);
          toast({
            title: "Payment Modal Error",
            description: "Failed to open payment modal. Please try again.",
            variant: "destructive",
          });
        }
      } else if (data.requiresPayment === false) {
        // Free plan, no payment required
        queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
        queryClient.invalidateQueries({ queryKey: ['/api/usage-stats'] });
        toast({
          title: "Plan Updated",
          description: "Your subscription plan has been successfully updated.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription plan.",
        variant: "destructive",
      });
    },
  });

  // Add payment method mutation
  const addPaymentMethodMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/payment-methods/add');
    },
    onSuccess: (data: any) => {
      // Redirect to payment gateway setup page
      if (data.setupUrl) {
        window.location.href = data.setupUrl;
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
        toast({
          title: "Success",
          description: "Payment method added successfully.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add payment method.",
        variant: "destructive",
      });
    },
  });

  const currentPlan = plans.find((plan: SubscriptionPlan) => 
    plan.id === currentSubscription?.planId
  );

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    // Price is already in dollars from the database
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (plansLoading || subscriptionLoading || usageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <div className="p-4 sm:p-6 bg-[#0d0d1f]">
        {/* Header */}
        <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight" data-testid="page-title">
                Subscription & Billing
              </h1>
              <p className="text-slate-300 text-sm sm:text-base lg:text-lg">
                Manage your subscription, view billing history, and update payment methods
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto space-y-8">

        {/* Current Plan Overview */}
        {currentPlan && (
          <Card className="gradient-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {currentPlan.planName && planIcons[currentPlan.planName as keyof typeof planIcons]}
                  <div>
                    <CardTitle className="text-white text-2xl" data-testid="text-current-plan">
                      {currentPlan.planName || 'Current Plan'}
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      {currentPlan.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white" data-testid="text-current-price">
                    {formatPrice(currentPlan.price)}
                    <span className="text-lg text-slate-300">/{currentPlan.interval}</span>
                  </div>
                  {currentSubscription?.status && (
                    <Badge 
                      variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize mt-2"
                      data-testid="badge-subscription-status"
                    >
                      {currentSubscription.status}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usageStats && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Credits Used</span>
                      <span className="text-white font-medium" data-testid="text-credits-usage">
                        {usageStats.creditsUsed || 0} / {currentPlan.limits.credits}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(usageStats.creditsUsed || 0, currentPlan.limits.credits)} 
                      className="h-3"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {usageStats.creditsRemaining || currentPlan.limits.credits} credits remaining this {currentPlan.interval}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs for different sections */}
        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 gradient-surface">
            <TabsTrigger value="plans" data-testid="tab-plans">Plans</TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">Billing History</TabsTrigger>
            <TabsTrigger value="payment" data-testid="tab-payment">Payment Methods</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          {/* Plan Selection */}
          <TabsContent value="plans" className="space-y-6">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4" data-testid="text-pricing-title">
                Choose Your Plan
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground px-4 sm:px-0">
                Start with a 7-day free trial, upgrade anytime
              </p>
            </div>

            {plansLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-slate-300">Loading subscription plans...</p>
              </div>
            ) : plansError ? (
              <Card className="gradient-card">
                <CardContent className="text-center py-8">
                  <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExternalLink className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-white font-medium mb-2">Unable to Load Plans</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    We couldn't fetch the subscription plans. This might be due to a temporary server issue.
                  </p>
                  <Button
                    onClick={() => refetchPlans()}
                    className="gradient-button"
                    data-testid="button-retry-plans"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : plans.length === 0 ? (
              <Card className="gradient-card">
                <CardContent className="text-center py-8">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-white font-medium mb-2">No Plans Available</h3>
                  <p className="text-slate-300 text-sm">
                    No subscription plans are currently available.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {plans.map((plan: SubscriptionPlan, index) => {
                const isCurrentPlan = plan.id === currentSubscription?.planId;
                const isPlanPopular = plan.planName === "Growth";
                const isFreeTrialPlan = plan.price === 0 || plan.planName?.toLowerCase().includes('trial');
                
                // Format price to match landing page
                const displayPrice = plan.price === 0 ? '$0' : `$${Math.floor(plan.price)}`;
                const displayPeriod = plan.interval === 'day' && plan.planName?.includes('7') ? '7 days' : 
                                     plan.interval === 'month' ? 'per month' : 
                                     plan.interval;
                
                // Icon size must be w-8 h-8 to match landing page
                const iconMap = {
                  "7-Day Free Trial": <Rocket className="w-8 h-8" />,
                  "Starter": <BarChart className="w-8 h-8" />,
                  "Growth": <Zap className="w-8 h-8" />,
                  "Pro": <Crown className="w-8 h-8" />,
                };
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`pricing-card border-0 relative h-full ${isPlanPopular ? 'border-primary/50 lg:scale-105' : ''}`}
                    data-testid={`card-plan-${index}`}
                  >
                    {isPlanPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                      </div>
                    )}
                    <CardContent className="p-4 sm:p-6 h-full flex flex-col">
                      <div className="text-center mb-4 sm:mb-6">
                        <div className="flex justify-center text-primary mb-2">
                          {plan.planName && iconMap[plan.planName as keyof typeof iconMap]}
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2" data-testid={`text-plan-name-${index}`}>
                          {plan.planName}
                        </h3>
                        <div className="text-2xl sm:text-3xl font-bold" data-testid={`text-plan-price-${index}`}>
                          {displayPrice}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3" data-testid={`text-plan-period-${index}`}>
                          {displayPeriod}
                        </div>
                        {plan.description && (
                          <p className="text-xs sm:text-sm text-primary/80 font-medium px-2 sm:px-0" data-testid={`text-plan-target-${index}`}>
                            {plan.description}
                          </p>
                        )}
                      </div>
                      <div className="flex-1">
                        <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                          {plan.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-start text-xs sm:text-sm" data-testid={`text-plan-feature-${index}-${featureIndex}`}>
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {!isCurrentPlan ? (
                        <Button
                          onClick={() => changePlanMutation.mutate(plan.id)}
                          disabled={changePlanMutation.isPending}
                          className={`w-full ${isPlanPopular ? 'gradient-button' : 'border border-border hover:bg-muted'}`}
                          variant={isPlanPopular ? "default" : "outline"}
                          data-testid={`button-choose-plan-${index}`}
                        >
                          {changePlanMutation.isPending ? "Processing..." : 
                           plan.planName === "7-Day Free Trial" ? "Start Free Trial" :
                           plan.planName === "Starter" ? "Upgrade to Starter" :
                           plan.planName === "Growth" ? "Scale with Growth" :
                           plan.planName === "Pro" ? "Power Up with Pro" :
                           "Choose Plan"}
                        </Button>
                      ) : (
                        <Button
                          disabled
                          className="w-full bg-muted text-muted-foreground cursor-not-allowed"
                          data-testid={`button-current-plan-${index}`}
                        >
                          Current Plan
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            )}
          </TabsContent>

          {/* Billing History */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-primary" />
                  Billing History
                </CardTitle>
                <CardDescription className="text-slate-300">
                  View and download your invoices and receipts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-slate-300">Loading invoices...</p>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-8 text-slate-300" data-testid="empty-state-invoices">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No invoices yet</p>
                    <p className="text-sm mb-6">Invoices will appear here when you subscribe to a plan</p>
                    <Button 
                      variant="outline"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="border-slate-600 text-slate-300 hover:bg-white/10"
                      data-testid="button-view-plans"
                    >
                      View Plans
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div 
                        key={invoice.id} 
                        className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg"
                        data-testid={`invoice-${invoice.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-white font-medium" data-testid={`text-invoice-number-${invoice.id}`}>
                              Invoice #{invoice.invoiceNumber}
                            </p>
                            <p className="text-sm text-slate-300" data-testid={`text-invoice-date-${invoice.id}`}>
                              {formatDate(invoice.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-white font-medium" data-testid={`text-invoice-amount-${invoice.id}`}>
                              {formatPrice(invoice.amount, invoice.currency)}
                            </p>
                            <Badge 
                              variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                              className="capitalize"
                              data-testid={`badge-invoice-status-${invoice.id}`}
                            >
                              {invoice.status}
                            </Badge>
                          </div>
                          {invoice.pdfUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(invoice.pdfUrl, '_blank')}
                              data-testid={`button-download-invoice-${invoice.id}`}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              PDF
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods */}
          <TabsContent value="payment" className="space-y-6">
            <Card className="gradient-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-primary" />
                      Payment Methods
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      Manage your payment methods and billing information
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => addPaymentMethodMutation.mutate()}
                    disabled={addPaymentMethodMutation.isPending}
                    className="gradient-button"
                    data-testid="button-add-payment-method"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {paymentMethodsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-slate-300">Loading payment methods...</p>
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <div className="text-center py-8 text-slate-300">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No payment methods added</p>
                    <p className="text-sm mt-2">Add a payment method to start using paid features</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div 
                        key={method.id} 
                        className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg"
                        data-testid={`payment-method-${method.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-white font-medium capitalize" data-testid={`text-card-brand-${method.id}`}>
                              {method.cardBrand} •••• {method.cardLast4}
                            </p>
                            <p className="text-sm text-slate-300" data-testid={`text-card-expiry-${method.id}`}>
                              Expires {method.cardExpMonth.toString().padStart(2, '0')}/{method.cardExpYear}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {method.isDefault && (
                            <Badge className="bg-green-600" data-testid={`badge-default-${method.id}`}>
                              Default
                            </Badge>
                          )}
                          <Button variant="outline" size="sm" data-testid={`button-manage-payment-${method.id}`}>
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-primary" />
                  Subscription Settings
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Manage your subscription preferences and billing settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentSubscription && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Billing Cycle</p>
                        <p className="text-sm text-slate-300">
                          Next billing date: {formatDate(currentSubscription.currentPeriodEnd)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {currentPlan?.interval || 'monthly'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Auto-renewal</p>
                        <p className="text-sm text-slate-300">
                          {currentSubscription.cancelAtPeriodEnd 
                            ? 'Your subscription will not renew' 
                            : 'Your subscription will automatically renew'
                          }
                        </p>
                      </div>
                      <Button variant="outline" size="sm" data-testid="button-manage-renewal">
                        {currentSubscription.cancelAtPeriodEnd ? 'Resume' : 'Cancel'} Subscription
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="pt-6 border-t border-slate-700">
                  <h3 className="text-white font-medium mb-4">Need Help?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="justify-start" data-testid="button-contact-support">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Contact Support
                    </Button>
                    <Button variant="outline" className="justify-start" data-testid="button-billing-portal">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Billing Portal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}