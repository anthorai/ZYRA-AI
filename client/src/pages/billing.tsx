import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageShell } from "@/components/ui/page-shell";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  CreditCard, 
  Calendar, 
  Download, 
  Crown, 
  Zap,
  Building,
  ExternalLink,
  Plus,
  Settings,
  Rocket,
  BarChart,
  Wand2
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

const planIcons: Record<string, JSX.Element> = {
  "7-Day Free Trial": <Rocket className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />,
  "Starter": <BarChart className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />,
  "Growth": <Zap className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />,
  "Pro": <Crown className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />,
  "Enterprise": <Building className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />
};

interface PlanFeatureCategory {
  name: string;
  features: string[];
}

interface PlanDetails {
  credits: string;
  tagline: string;
  categories: PlanFeatureCategory[];
}

const planDetails: Record<string, PlanDetails> = {
  "7-Day Free Trial": {
    credits: "100 credits / 7 days",
    tagline: "New users exploring Zyra features",
    categories: [
      {
        name: "Product Optimization & SEO",
        features: [
          "Optimized Products – 20 credits",
          "SEO Keyword Density Analysis – 10 credits"
        ]
      },
      {
        name: "Conversion Boosting & Sales Automation",
        features: [
          "AI-Powered Growth Intelligence – 20 credits",
          "Basic A/B Testing – 10 credits"
        ]
      },
      {
        name: "Content & Branding at Scale",
        features: [
          "Smart Product Descriptions – 20 credits",
          "Limited Dynamic Templates – 10 credits"
        ]
      },
      {
        name: "Performance Tracking & ROI Insights",
        features: ["Email Performance Analytics – 10 credits"]
      },
      {
        name: "Workflow & Integration Tools",
        features: [
          "One-Click Shopify Publish – 10 credits",
          "Rollback Button – included"
        ]
      }
    ]
  },
  "Starter": {
    credits: "1,000 credits / month",
    tagline: "Best for new Shopify stores just getting started",
    categories: [
      {
        name: "Product Optimization & SEO",
        features: [
          "Optimized Products – 200 credits",
          "SEO Keyword Density Analysis – 100 credits",
          "AI Image Alt-Text Generator – 100 credits",
          "Smart SEO Titles & Meta Tags – 100 credits"
        ]
      },
      {
        name: "Conversion Boosting & Sales Automation",
        features: [
          "AI-Powered Growth Intelligence – 150 credits",
          "A/B Testing – 50 credits",
          "Upsell Email Receipts – 100 credits",
          "Abandoned Cart SMS – 50 credits"
        ]
      },
      {
        name: "Content & Branding at Scale",
        features: [
          "Smart Product Descriptions – 100 credits",
          "Dynamic Templates – 50 credits",
          "Brand Voice Memory – included"
        ]
      },
      {
        name: "Performance Tracking & ROI Insights",
        features: ["Email & SMS Conversion Analytics – included"]
      },
      {
        name: "Workflow & Integration Tools",
        features: [
          "CSV Import/Export – included",
          "One-Click Shopify Publish – included",
          "Rollback Button – included",
          "Smart Bulk Suggestions – included"
        ]
      }
    ]
  },
  "Growth": {
    credits: "5,000 credits / month",
    tagline: "For scaling merchants ready to grow",
    categories: [
      {
        name: "Product Optimization & SEO",
        features: [
          "All Starter features +",
          "SEO Ranking Tracker – 200 credits",
          "Bulk Optimization & Smart Bulk Suggestions – 500 credits",
          "Scheduled Refresh for Content & SEO Updates – 300 credits"
        ]
      },
      {
        name: "Conversion Boosting & Sales Automation",
        features: [
          "AI Upsell Suggestions & Triggers – 300 credits",
          "Dynamic Segmentation of Customers – 200 credits",
          "Behavioral Targeting – 200 credits",
          "Full A/B Test Results Dashboard – included"
        ]
      },
      {
        name: "Content & Branding at Scale",
        features: [
          "Custom Templates – included",
          "Multimodal AI (text + image + insights) – 300 credits",
          "Multi-Channel Content Repurposing – 300 credits"
        ]
      },
      {
        name: "Performance Tracking & ROI Insights",
        features: [
          "Full Email & SMS tracking – included",
          "Content ROI Tracking – included",
          "Revenue Impact Attribution – included",
          "Product Management Dashboard – included"
        ]
      },
      {
        name: "Workflow & Integration Tools",
        features: ["Unlimited Starter workflow tools"]
      }
    ]
  },
  "Pro": {
    credits: "20,000 credits / month",
    tagline: "For high-revenue brands & enterprise",
    categories: [
      {
        name: "Product Optimization & SEO",
        features: ["All Growth features + priority processing"]
      },
      {
        name: "Conversion Boosting & Sales Automation",
        features: ["Full AI-driven automation for campaigns, upsells, and behavioral targeting"]
      },
      {
        name: "Content & Branding at Scale",
        features: [
          "Full template library, advanced brand voice memory,",
          "multimodal AI insights, multi-channel automation"
        ]
      },
      {
        name: "Performance Tracking & ROI Insights",
        features: ["Enterprise-grade analytics and revenue attribution dashboard"]
      },
      {
        name: "Workflow & Integration Tools",
        features: [
          "Enterprise bulk management, CSV import/export,",
          "rollback, smart bulk suggestions at scale"
        ]
      }
    ]
  }
};

export default function BillingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

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

  // Upgrade/downgrade mutation - PayPal USD-only
  const changePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/subscription/change-plan', { planId, gateway: 'paypal' });
      return await response.json();
    },
    onMutate: async (planId: string) => {
      setProcessingPlanId(planId);
    },
    onSuccess: async (data: any) => {
      console.log('💳 Payment flow started:', data);
      
      if (data.requiresPayment && data.gateway === 'paypal') {
        console.log('💳 PayPal payment required - redirecting to checkout');
        toast({
          title: "Payment Required",
          description: `Complete payment of $${data.amount} USD via PayPal to activate your ${data.plan.planName} plan.`,
        });
        
        sessionStorage.setItem('pending_subscription', JSON.stringify({
          transactionId: data.transactionId,
          planId: data.plan.id,
          amount: data.amount,
          planName: data.plan.planName
        }));
        
        setLocation('/checkout');
      } else if (data.requiresPayment === false) {
        queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
        queryClient.invalidateQueries({ queryKey: ['/api/usage-stats'] });
        toast({
          title: "Plan Updated",
          description: "Your subscription plan has been successfully updated.",
        });
      }
      setProcessingPlanId(null);
    },
    onError: (error: any) => {
      setProcessingPlanId(null);
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
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
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
      <PageShell
        title="Billing & Subscription"
        subtitle="Manage your subscription plans and billing"
        
        maxWidth="xl"
        spacing="normal"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-slate-300">Loading billing information...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Billing & Subscription"
      subtitle="Manage your subscription plans and billing"
      
      maxWidth="xl"
      spacing="normal"
    >
      {currentPlan && (
        <DashboardCard testId="card-current-plan">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {currentPlan.planName && planIcons[currentPlan.planName]}
              <div>
                <h2 className="text-white text-2xl font-semibold" data-testid="text-current-plan">
                  {currentPlan.planName || 'Current Plan'}
                </h2>
                <p className="text-slate-300">
                  {currentPlan.description}
                </p>
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
        </DashboardCard>
      )}
      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="inline-flex flex-nowrap w-full sm:grid sm:grid-cols-4 gradient-surface overflow-x-auto gap-2">
          <TabsTrigger value="plans" data-testid="tab-plans" className="flex-none min-w-max sm:flex-auto">Plans</TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-billing" className="flex-none min-w-max sm:flex-auto">Billing History</TabsTrigger>
          <TabsTrigger value="payment" data-testid="tab-payment" className="flex-none min-w-max sm:flex-auto">Payment Methods</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings" className="flex-none min-w-max sm:flex-auto">Settings</TabsTrigger>
        </TabsList>

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
            <DashboardCard testId="card-plans-error">
              <div className="text-center py-8">
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
              </div>
            </DashboardCard>
          ) : plans.length === 0 ? (
            <DashboardCard testId="card-no-plans">
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-white font-medium mb-2">No Plans Available</h3>
                <p className="text-slate-300 text-sm">
                  No subscription plans are currently available.
                </p>
              </div>
            </DashboardCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {plans.map((plan: SubscriptionPlan, index) => {
              const isCurrentPlan = plan.id === currentSubscription?.planId;
              const isPlanPopular = plan.planName === "Growth";
              const details = planDetails[plan.planName];
              
              return (
                <div key={plan.id} className={`relative ${isPlanPopular ? 'pt-6 sm:pt-6' : ''}`}>
                  {isPlanPopular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-primary text-primary-foreground px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold shadow-lg">
                        ⭐ Popular
                      </Badge>
                    </div>
                  )}
                  <DashboardCard 
                    size="sm"
                    className={`group relative overflow-hidden rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border border-slate-700/50 hover:border-primary/30 ${isPlanPopular ? 'border-primary/50' : ''}`}
                    testId={`card-plan-${index}`}
                  >
                  <div className="h-full flex flex-col">
                    {/* Header Section */}
                    <div className="space-y-3 sm:space-y-4 pb-4 sm:pb-6 border-b border-slate-700/50 text-center">
                      <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                        <div className="text-primary">
                          {planIcons[plan.planName] || <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 md:w-10 md:h-10 lg:w-11 lg:h-11 xl:w-10 xl:h-10 text-primary" />}
                        </div>
                        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-xl font-bold text-white leading-tight" data-testid={`text-plan-name-${index}`}>
                          {plan.planName}
                        </h3>
                      </div>
                      
                      <div className="space-y-1.5 sm:space-y-2">
                        <p className="text-white font-bold text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-3xl">
                          ${plan.price === 0 ? '0' : Math.floor(plan.price)}
                          <span className="text-sm sm:text-base text-slate-400 font-normal ml-1 sm:ml-2">
                            /{plan.interval === 'day' && plan.planName?.includes('7') ? '7 days' : 'mo'}
                          </span>
                        </p>
                        {details && (
                          <>
                            <p className="text-primary text-sm sm:text-base font-semibold">✨ {details.credits}</p>
                            <p className="text-slate-300 text-xs sm:text-sm px-2 sm:px-4">{details.tagline}</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Features Section */}
                    {details && (
                      <div className="flex-1 py-4 sm:py-5 md:py-6 px-1 sm:px-2 space-y-3 sm:space-y-4">
                        {details.categories.map((category, catIndex) => (
                          <div key={catIndex} className="space-y-1.5 sm:space-y-2 text-left">
                            <h4 className="text-white font-semibold text-xs sm:text-sm">{category.name}</h4>
                            <ul className="space-y-0.5 sm:space-y-1">
                              {category.features.map((feature, featureIndex) => (
                                <li key={featureIndex} className="text-slate-300 text-[11px] sm:text-xs leading-relaxed">
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* CTA Button */}
                    <div className="flex justify-center pt-3 sm:pt-4 border-t border-slate-700/50">
                      <Button
                        className={`w-full px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-xs sm:text-sm transition-all duration-200 border-0 font-semibold rounded-lg ${
                          isCurrentPlan 
                            ? 'bg-slate-700 text-white opacity-50 cursor-not-allowed' 
                            : 'bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95'
                        }`}
                        disabled={isCurrentPlan || processingPlanId !== null}
                        onClick={() => changePlanMutation.mutate(plan.id)}
                        data-testid={`button-choose-plan-${index}`}
                      >
                        <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        <span className="truncate">
                          {isCurrentPlan ? "Current Plan" :
                           processingPlanId === plan.id ? "Processing..." : 
                           plan.planName === "7-Day Free Trial" ? "Start Free Trial" :
                           plan.planName === "Starter" ? "Upgrade to Starter" :
                           plan.planName === "Growth" ? "Scale with Growth" :
                           plan.planName === "Pro" ? "Power Up with Pro" :
                           "Choose Plan"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </DashboardCard>
                </div>
              );
            })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <DashboardCard
            title="Billing History"
            description="View and download your invoices and receipts"
            headerAction={<Calendar className="w-5 h-5 mr-2 text-primary" />}
            testId="card-billing-history"
          >
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
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {invoices.map((invoice) => (
                    <div 
                      key={invoice.id} 
                      className="flex flex-col p-3 sm:p-4 md:p-6 bg-slate-800/30 border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl shadow-lg"
                      data-testid={`invoice-${invoice.id}`}
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4 mb-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium text-base sm:text-lg md:text-xl truncate" data-testid={`text-invoice-number-${invoice.id}`}>
                            Invoice #{invoice.invoiceNumber}
                          </p>
                          <p className="text-[10px] sm:text-xs md:text-sm text-slate-300 truncate" data-testid={`text-invoice-date-${invoice.id}`}>
                            {formatDate(invoice.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between space-x-3 sm:space-x-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium text-base sm:text-lg md:text-xl truncate" data-testid={`text-invoice-amount-${invoice.id}`}>
                            {formatPrice(invoice.amount, invoice.currency)}
                          </p>
                          <Badge 
                            variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                            className="capitalize text-[10px] sm:text-xs"
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
                            className="flex-shrink-0"
                          >
                            <Download className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </DashboardCard>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <DashboardCard
            title="Payment Methods"
            description="Manage your payment methods and billing information"
            headerAction={
              <Button
                onClick={() => addPaymentMethodMutation.mutate()}
                disabled={addPaymentMethodMutation.isPending}
                className="gradient-button ml-auto"
                data-testid="button-add-payment-method"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            }
            testId="card-payment-methods"
          >
              {paymentMethodsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-slate-300">Loading payment methods...</p>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-8 text-slate-300" data-testid="empty-state-payment-methods">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No payment methods yet</p>
                  <p className="text-sm">Add a payment method to manage your subscriptions</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {paymentMethods.map((method) => (
                    <div 
                      key={method.id} 
                      className="flex flex-col p-3 sm:p-4 md:p-6 bg-slate-800/30 border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl shadow-lg"
                      data-testid={`payment-method-${method.id}`}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium text-base sm:text-lg truncate">
                            {method.cardBrand} •••• {method.cardLast4}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-300 truncate">
                            Expires {method.cardExpMonth}/{method.cardExpYear}
                          </p>
                        </div>
                      </div>
                      {method.isDefault && (
                        <Badge className="bg-primary/20 text-primary text-[10px] sm:text-xs">Default</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </DashboardCard>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <DashboardCard
            title="Billing Settings"
            description="Configure your billing preferences and notifications"
            headerAction={<Settings className="w-5 h-5 mr-2 text-primary" />}
            testId="card-billing-settings"
          >
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-700/50 rounded-xl">
                  <div>
                    <p className="text-white font-medium">Email Receipts</p>
                    <p className="text-sm text-slate-300">Receive email confirmation for all payments</p>
                  </div>
                  <Badge>Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border border-slate-700/50 rounded-xl">
                  <div>
                    <p className="text-white font-medium">Auto-Renew</p>
                    <p className="text-sm text-slate-300">Automatically renew subscription at period end</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
              </div>
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
