import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Wand2,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileText,
  Sparkles,
  Image,
  Mail,
  MessageSquare,
  Search
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
    credits: "100 Credit / 7 days",
    tagline: "New users exploring Zyra features",
    categories: [
      {
        name: "Product Optimization & SEO",
        features: [
          "Optimized Products",
          "SEO Keyword Density Analysis"
        ]
      },
      {
        name: "Conversion Boosting & Sales Automation",
        features: [
          "AI-Powered Growth Intelligence",
          "Basic A/B Testing"
        ]
      },
      {
        name: "Content & Branding at Scale",
        features: [
          "Smart Product Descriptions",
          "Limited Dynamic Templates"
        ]
      },
      {
        name: "Performance Tracking & ROI Insights",
        features: ["Email Performance Analytics"]
      },
      {
        name: "Workflow & Integration Tools",
        features: [
          "One-Click Shopify Publish",
          "Rollback Button"
        ]
      }
    ]
  },
  "Starter": {
    credits: "1,000 Credit / month",
    tagline: "Best for new Shopify stores just getting started",
    categories: [
      {
        name: "Product Optimization & SEO",
        features: [
          "Optimized Products",
          "SEO Keyword Density Analysis",
          "AI Image Alt-Text Generator",
          "Smart SEO Titles & Meta Tags"
        ]
      },
      {
        name: "Conversion Boosting & Sales Automation",
        features: [
          "AI-Powered Growth Intelligence",
          "A/B Testing",
          "Upsell Email Receipts",
          "Abandoned Cart SMS"
        ]
      },
      {
        name: "Content & Branding at Scale",
        features: [
          "Smart Product Descriptions",
          "Dynamic Templates",
          "Brand Voice Memory"
        ]
      },
      {
        name: "Performance Tracking & ROI Insights",
        features: ["Email & SMS Conversion Analytics"]
      },
      {
        name: "Workflow & Integration Tools",
        features: [
          "CSV Import/Export",
          "One-Click Shopify Publish",
          "Rollback Button",
          "Smart Bulk Suggestions"
        ]
      }
    ]
  },
  "Growth": {
    credits: "6,000 Credit / month",
    tagline: "For scaling merchants ready to grow",
    categories: [
      {
        name: "Product Optimization & SEO",
        features: [
          "All Starter features +",
          "SEO Ranking Tracker",
          "Bulk Optimization & Smart Bulk Suggestions",
          "Scheduled Refresh for Content & SEO Updates"
        ]
      },
      {
        name: "Conversion Boosting & Sales Automation",
        features: [
          "AI Upsell Suggestions & Triggers",
          "Dynamic Segmentation of Customers",
          "Behavioral Targeting",
          "Full A/B Test Results Dashboard"
        ]
      },
      {
        name: "Content & Branding at Scale",
        features: [
          "Custom Templates",
          "Multimodal AI (text + image + insights)",
          "Multi-Channel Content Repurposing"
        ]
      },
      {
        name: "Performance Tracking & ROI Insights",
        features: [
          "Full Email & SMS tracking",
          "Content ROI Tracking",
          "Revenue Impact Attribution",
          "Product Management Dashboard"
        ]
      },
      {
        name: "Workflow & Integration Tools",
        features: ["Unlimited Starter workflow tools"]
      }
    ]
  },
  "Pro": {
    credits: "20,000 Credit / month",
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
  const [activeTab, setActiveTab] = useState<string>("plans");
  const [syncingSubscription, setSyncingSubscription] = useState(false);
  const plansRef = useRef<HTMLDivElement>(null);

  const scrollToPlans = useCallback(() => {
    setActiveTab("plans");
    setTimeout(() => {
      plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);
  const [isAnnual, setIsAnnual] = useState(false);

  // Sync subscription from Shopify when returning from pricing page
  useEffect(() => {
    const syncSubscriptionFromShopify = async () => {
      // Check if we're returning from Shopify (URL might have shopify-related params or referrer)
      const urlParams = new URLSearchParams(window.location.search);
      const hasShopifyReturn = urlParams.has('shop') || 
                               urlParams.has('charge_id') || 
                               document.referrer.includes('shopify') ||
                               document.referrer.includes('admin');
      
      if (hasShopifyReturn) {
        setSyncingSubscription(true);
        try {
          const response = await apiRequest('POST', '/api/shopify/billing/sync', {});
          const result = await response.json();
          
          if (result.synced && result.hasActiveSubscription) {
            // Subscription was synced - refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
            queryClient.invalidateQueries({ queryKey: ['/api/usage-stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
            
            toast({
              title: "Plan Activated",
              description: `Your ${result.plan?.planName || 'subscription'} has been activated successfully.`,
            });
          }
          
          // Clean up URL params
          if (urlParams.has('shop') || urlParams.has('charge_id')) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (error) {
          console.error('Failed to sync subscription:', error);
        } finally {
          setSyncingSubscription(false);
        }
      }
    };
    
    syncSubscriptionFromShopify();
  }, [toast]);

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

  // Upgrade/downgrade mutation - Shopify Managed Pricing only
  const handleUpgrade = async (planHandle: string) => {
    try {
      const response = await apiRequest("GET", `/api/billing/shopify-redirect?plan=${planHandle}`);
      const data = await response.json();
      if (data.url) {
        window.top.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start upgrade process",
        variant: "destructive",
      });
    }
  };

  const changePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const plan = plans.find(p => p.id === planId);
      if (plan?.planName === "7-Day Free Trial") {
        const billingPeriod = isAnnual ? 'annual' : 'monthly';
        const response = await apiRequest('POST', '/api/subscription/change-plan', { planId, billingPeriod });
        return await response.json();
      }
      // For paid plans, we use the shopify-redirect endpoint directly via handleUpgrade
      return { requiresShopifyRedirect: true, planHandle: (plan as any)?.shopifyPlanHandle };
    },
    onMutate: async (planId: string) => {
      const plan = plans.find(p => p.id === planId);
      if (plan?.planName !== "7-Day Free Trial") {
        handleUpgrade((plan as any)?.shopifyPlanHandle);
        return;
      }
      setProcessingPlanId(planId);
    },
    onSuccess: async (data: any) => {
      console.log('Subscription change response:', data);
      
      if (data.requiresShopifyBilling && data.confirmationUrl) {
        // Redirect to Shopify billing confirmation page
        window.location.href = data.confirmationUrl;
        return;
      } else if (data.requiresShopifyBilling === false) {
        // Free plan activated directly
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

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 70) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '[&>div]:bg-red-500';
    if (percentage >= 70) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-emerald-500';
  };

  const sortedInvoices = [...invoices].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latestInvoice = sortedInvoices.length > 0 ? sortedInvoices[0] : null;

  if (plansLoading || subscriptionLoading || usageLoading) {
    return (
      <PageShell
        title="Billing & Subscription"
        subtitle="Manage your subscription plans and billing"
        backTo="/settings"
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
      backTo="/settings"
      maxWidth="xl"
      spacing="normal"
    >
      {currentPlan && (
        <DashboardCard testId="card-my-subscription">
          <div className="space-y-6">
            {/* Header: Plan Info + Status */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  {currentPlan.planName && planIcons[currentPlan.planName]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-white text-xl sm:text-2xl font-bold" data-testid="text-current-plan">
                      {currentPlan.planName || 'Current Plan'}
                    </h2>
                    {currentSubscription?.status && (
                      <Badge 
                        variant={currentSubscription.status === 'active' || currentSubscription.status === 'trial' ? 'default' : currentSubscription.status === 'expired' ? 'destructive' : 'secondary'}
                        className="capitalize"
                        data-testid="badge-subscription-status"
                      >
                        {currentSubscription.status === 'active' ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" /> Active</>
                        ) : currentSubscription.status === 'trial' ? (
                          <><Sparkles className="w-3 h-3 mr-1" /> Trial</>
                        ) : currentSubscription.status === 'expired' ? (
                          <><AlertCircle className="w-3 h-3 mr-1" /> Expired</>
                        ) : currentSubscription.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {currentPlan.description}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-current-price">
                  {formatPrice(currentPlan.price)}
                  <span className="text-base sm:text-lg text-slate-400 font-normal">/{currentPlan.interval}</span>
                </div>
              </div>
            </div>

            {/* Subscription Timeline */}
            {currentSubscription && currentSubscription.currentPeriodStart && currentSubscription.currentPeriodEnd && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Started Date */}
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Started</p>
                    <p className="text-white font-semibold text-sm truncate" data-testid="text-subscription-start">
                      {formatShortDate(currentSubscription.currentPeriodStart)}
                    </p>
                  </div>
                </div>

                {/* Renewal/Trial End Date */}
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${currentSubscription.status === 'expired' ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                    <Clock className={`w-5 h-5 ${currentSubscription.status === 'expired' ? 'text-red-400' : 'text-emerald-400'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-400 text-xs uppercase tracking-wide">
                      {currentSubscription.status === 'expired' ? 'Trial Ended' : currentSubscription.status === 'trial' ? 'Trial Ends' : 'Renews On'}
                    </p>
                    <p className={`font-semibold text-sm truncate ${currentSubscription.status === 'expired' ? 'text-red-400' : 'text-white'}`} data-testid="text-renewal-date">
                      {formatShortDate(currentSubscription.currentPeriodEnd)}
                    </p>
                  </div>
                </div>

                {/* Days Remaining */}
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getDaysRemaining(currentSubscription.currentPeriodEnd) === 0 ? 'bg-red-500/10' : 'bg-purple-500/10'}`}>
                    <TrendingUp className={`w-5 h-5 ${getDaysRemaining(currentSubscription.currentPeriodEnd) === 0 ? 'text-red-400' : 'text-purple-400'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Days Left</p>
                    <p className={`font-semibold text-sm ${getDaysRemaining(currentSubscription.currentPeriodEnd) === 0 ? 'text-red-400' : 'text-white'}`} data-testid="text-days-remaining">
                      {getDaysRemaining(currentSubscription.currentPeriodEnd)} days
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Credits Usage Section */}
            {usageStats && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Credit Usage
                  </h3>
                  <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(usageStats.creditsUsed || 0, currentPlan.limits.credits))}`} data-testid="text-usage-percentage">
                    {Math.round(getUsagePercentage(usageStats.creditsUsed || 0, currentPlan.limits.credits))}% used
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Credits Used</span>
                    <span className="text-white font-medium" data-testid="text-credits-usage">
                      {(usageStats.creditsUsed || 0).toLocaleString()} / {currentPlan.limits.credits.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(usageStats.creditsUsed || 0, currentPlan.limits.credits)} 
                    className={`h-3 ${getProgressColor(getUsagePercentage(usageStats.creditsUsed || 0, currentPlan.limits.credits))}`}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      {(usageStats.creditsRemaining || currentPlan.limits.credits).toLocaleString()} credits remaining this {currentPlan.interval}
                    </p>
                    {getUsagePercentage(usageStats.creditsUsed || 0, currentPlan.limits.credits) >= 80 && (
                      <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Running Low
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Credit Usage Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-2">
                  <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Search className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs text-slate-400">SEO</span>
                    </div>
                    <p className="text-white font-semibold text-sm" data-testid="text-seo-usage">
                      {usageStats.seoOptimizationsUsed || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-xs text-slate-400">AI Gen</span>
                    </div>
                    <p className="text-white font-semibold text-sm" data-testid="text-ai-usage">
                      {usageStats.aiGenerationsUsed || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-slate-400">Emails</span>
                    </div>
                    <p className="text-white font-semibold text-sm" data-testid="text-email-usage">
                      {usageStats.emailsSent || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs text-slate-400">SMS</span>
                    </div>
                    <p className="text-white font-semibold text-sm" data-testid="text-sms-usage">
                      {usageStats.smsSent || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-700/50">
              {latestInvoice && latestInvoice.pdfUrl && (
                <Button
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                  onClick={() => window.open(latestInvoice.pdfUrl, '_blank')}
                  data-testid="button-download-latest-invoice"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download Latest Invoice
                </Button>
              )}
              {currentPlan.planName !== 'Pro' && (
                <Button
                  className="flex-1 gradient-button"
                  onClick={scrollToPlans}
                  data-testid="button-upgrade-plan"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              )}
            </div>

            {/* Cancel Warning */}
            {currentSubscription?.cancelAtPeriodEnd && currentSubscription.currentPeriodEnd && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-xl border border-red-500/30">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-red-400 font-medium text-sm">Subscription Ending</p>
                  <p className="text-red-300/80 text-xs">
                    Your subscription will end on {formatShortDate(currentSubscription.currentPeriodEnd)}. 
                    You won't be charged again.
                  </p>
                </div>
              </div>
            )}
          </div>
        </DashboardCard>
      )}
      <Tabs ref={plansRef} value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex flex-nowrap w-full sm:grid sm:grid-cols-4 gradient-surface overflow-x-auto gap-2">
          <TabsTrigger value="plans" data-testid="tab-plans" className="flex-none min-w-max sm:flex-auto">Plans</TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-billing" className="flex-none min-w-max sm:flex-auto">Billing History</TabsTrigger>
          <TabsTrigger value="payment" data-testid="tab-payment" className="flex-none min-w-max sm:flex-auto">Shopify Billing</TabsTrigger>
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
            
            <div className="flex items-center justify-center gap-3 mt-6" data-testid="billing-toggle">
              <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                data-testid="switch-billing-period"
              />
              <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Annual
              </span>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                Save 20%
              </Badge>
            </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {plans.filter((plan: SubscriptionPlan) => plan.planName !== "7-Day Free Trial").map((plan: SubscriptionPlan, index) => {
              const isCurrentPlan = plan.id === currentSubscription?.planId;
              const isPlanPopular = plan.planName === "Growth";
              const details = planDetails[plan.planName];
              const isTrial = plan.planName?.includes('Trial') || plan.price === 0;
              const displayPrice = isTrial ? 0 : (isAnnual ? Math.round(plan.price * 12 * 0.8) : plan.price);
              const annualSavings = isTrial ? 0 : Math.round(plan.price * 12 * 0.2);
              
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
                          ${displayPrice === 0 ? '0' : displayPrice.toLocaleString()}
                          <span className="text-sm sm:text-base text-slate-400 font-normal ml-1 sm:ml-2">
                            /{isTrial ? '7 days' : (isAnnual ? 'year' : 'mo')}
                          </span>
                        </p>
                        {isAnnual && !isTrial && annualSavings > 0 && (
                          <p className="text-green-400 text-xs font-medium" data-testid={`text-plan-savings-${index}`}>
                            Save ${annualSavings.toLocaleString()} per year
                          </p>
                        )}
                        {details && (
                          <>
                            <p className="text-primary text-sm sm:text-base font-semibold">{details.credits}</p>
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
                            : processingPlanId === plan.id
                              ? 'bg-primary/70 text-primary-foreground cursor-wait'
                              : processingPlanId !== null
                                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                : 'bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95'
                        }`}
                        disabled={isCurrentPlan || processingPlanId !== null}
                        onClick={() => changePlanMutation.mutate(plan.id)}
                        data-testid={`button-choose-plan-${index}`}
                      >
                        {processingPlanId === plan.id ? (
                          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        )}
                        <span className="truncate">
                          {isCurrentPlan ? "Current Plan" :
                           processingPlanId === plan.id ? "Processing..." : 
                           plan.planName === "7-Day Free Trial" ? "Start Free Trial" :
                           "Upgrade via Shopify"}
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
            title="Shopify Billing"
            description="All payments are managed through Shopify's secure billing system"
            headerAction={<CreditCard className="w-5 h-5 mr-2 text-primary" />}
            testId="card-shopify-billing"
          >
              <div className="text-center py-8 text-slate-300" data-testid="shopify-billing-info">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-primary" />
                </div>
                <p className="text-lg font-medium mb-2 text-white">Managed by Shopify</p>
                <p className="text-sm mb-6 max-w-md mx-auto">
                  Your subscription billing is handled securely through Shopify. 
                  To manage your payment methods or view billing details, visit your Shopify admin.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => window.open('https://admin.shopify.com/store', '_blank')}
                  className="border-slate-600 text-slate-300 hover:bg-white/10"
                  data-testid="button-shopify-admin"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Shopify Admin
                </Button>
              </div>
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
