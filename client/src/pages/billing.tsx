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
  Award
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  planName: string;
  price: number;
  description: string;
  features: string[];
  limits: {
    products: number;
    emails: number;
    sms: number;
    aiGenerations: number;
    seoOptimizations: number;
  };
  currency: string;
  interval: string;
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
  productsCount: number;
  emailsSent: number;
  emailsRemaining: number;
  smsSent: number;
  smsRemaining: number;
  aiGenerationsUsed: number;
  seoOptimizationsUsed: number;
}

const planIcons = {
  "7-Day Free Trial": <Gift className="w-6 h-6 text-primary" />,
  "Starter": <Zap className="w-6 h-6 text-primary" />,
  "Growth": <Award className="w-6 h-6 text-primary" />,
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

  // Mock billing data for UI-only mode
  const mockPlans: SubscriptionPlan[] = [
    {
      id: "trial",
      planName: "7-Day Free Trial",
      price: 0,
      description: "Try ZYRA risk-free for 7 days.",
      features: [
        "✨ 100 credits / 7 days",
        "🔧 Product Optimization & SEO:",
        "• Optimized Products – 20 credits",
        "• SEO Keyword Density Analysis – 10 credits",
        "📈 Conversion Boosting & Sales Automation:",
        "• AI-Powered Growth Intelligence – 20 credits",
        "• Basic A/B Testing – 10 credits",
        "🎨 Content & Branding at Scale:",
        "• Smart Product Descriptions – 20 credits",
        "• Limited Dynamic Templates – 10 credits",
        "📊 Performance Tracking & ROI Insights:",
        "• Email Performance Analytics – 10 credits",
        "⚡ Workflow & Integration Tools:",
        "• One-Click Shopify Publish – 10 credits",
        "• Rollback Button – included"
      ],
      limits: { products: 5, emails: 100, sms: 0, aiGenerations: 10, seoOptimizations: 5 },
      currency: "USD",
      interval: "7 days"
    },
    {
      id: "starter", 
      planName: "Starter",
      price: 49,
      description: "Best for new Shopify stores just getting started.",
      features: [
        "✨ 1,000 credits / month",
        "🔧 Product Optimization & SEO:",
        "• Optimized Products – 200 credits",
        "• SEO Keyword Density Analysis – 100 credits",
        "• AI Image Alt-Text Generator – 100 credits",
        "• Smart SEO Titles & Meta Tags – 100 credits",
        "📈 Conversion Boosting & Sales Automation:",
        "• AI-Powered Growth Intelligence – 150 credits",
        "• A/B Testing – 50 credits",
        "• Upsell Email Receipts – 100 credits",
        "• Abandoned Cart SMS – 50 credits",
        "🎨 Content & Branding at Scale:",
        "• Smart Product Descriptions – 100 credits",
        "• Dynamic Templates – 50 credits",
        "• Brand Voice Memory – included",
        "📊 Performance Tracking & ROI Insights:",
        "• Email & SMS Conversion Analytics – included",
        "⚡ Workflow & Integration Tools:",
        "• CSV Import/Export – included",
        "• One-Click Shopify Publish – included",
        "• Rollback Button – included",
        "• Smart Bulk Suggestions – included"
      ],
      limits: { products: 50, emails: 1000, sms: 100, aiGenerations: 100, seoOptimizations: 50 },
      currency: "USD",
      interval: "month"
    },
    {
      id: "growth",
      planName: "Growth",
      price: 299,
      description: "Made for scaling merchants ready to grow.",
      features: [
        "✨ 5,000 credits / month",
        "🔧 Product Optimization & SEO:",
        "• All Starter features +",
        "• SEO Ranking Tracker – 200 credits",
        "• Bulk Optimization & Smart Bulk Suggestions – 500 credits",
        "• Scheduled Refresh for Content & SEO Updates – 300 credits",
        "📈 Conversion Boosting & Sales Automation:",
        "• AI Upsell Suggestions & Triggers – 300 credits",
        "• Dynamic Segmentation of Customers – 200 credits",
        "• Behavioral Targeting – 200 credits",
        "• Full A/B Test Results Dashboard – included",
        "🎨 Content & Branding at Scale:",
        "• Custom Templates – included",
        "• Multimodal AI (text + image + insights) – 300 credits",
        "• Multi-Channel Content Repurposing – 300 credits",
        "📊 Performance Tracking & ROI Insights:",
        "• Full Email & SMS tracking – included",
        "• Content ROI Tracking – included",
        "• Revenue Impact Attribution – included",
        "• Product Management Dashboard – included",
        "⚡ Workflow & Integration Tools:",
        "• Unlimited Starter workflow tools"
      ],
      limits: { products: 500, emails: 10000, sms: 1000, aiGenerations: 1000, seoOptimizations: 500 },
      currency: "USD",
      interval: "month"
    },
    {
      id: "pro",
      planName: "Pro",
      price: 999,
      description: "Perfect for high-revenue brands & enterprises.",
      features: [
        "✨ 20,000 credits / month",
        "🔧 Product Optimization & SEO:",
        "• All Growth features + priority processing",
        "📈 Conversion Boosting & Sales Automation:",
        "• Full AI-driven automation for campaigns, upsells, and behavioral targeting",
        "🎨 Content & Branding at Scale:",
        "• Full template library, advanced brand voice memory, multimodal AI insights, multi-channel automation",
        "📊 Performance Tracking & ROI Insights:",
        "• Enterprise-grade analytics and revenue attribution dashboard",
        "⚡ Workflow & Integration Tools:",
        "• Enterprise bulk management, CSV import/export, rollback, smart bulk suggestions at scale"
      ],
      limits: { products: 9999, emails: 100000, sms: 10000, aiGenerations: 10000, seoOptimizations: 5000 },
      currency: "USD",
      interval: "month"
    }
  ];

  const mockSubscription: UserSubscription = {
    id: "sub_1",
    planId: "trial",
    status: "active",
    currentPeriodStart: new Date(Date.now() - 432000000).toISOString(),
    currentPeriodEnd: new Date(Date.now() + 172800000).toISOString(),
    cancelAtPeriodEnd: false
  };

  const mockUsageStats = {
    totalRevenue: 125000,
    totalOrders: 342,
    conversionRate: 320,
    cartRecoveryRate: 1850,
    productsCount: 28,
    productsOptimized: 28,
    emailsSent: 1456,
    smsSent: 234,
    aiGenerationsUsed: 67,
    seoOptimizationsUsed: 45,
    lastUpdated: new Date().toISOString()
  };

  const mockInvoices: Invoice[] = [];
  const mockPaymentMethods: PaymentMethod[] = [];

  // Use mock data instead of API calls
  const plans = mockPlans;
  const plansLoading = false;
  const plansError = false;
  const plansErrorDetails = null;
  const refetchPlans = () => Promise.resolve();
  const currentSubscription = mockSubscription;
  const subscriptionLoading = false;
  const usageStats = mockUsageStats;
  const usageLoading = false;
  const invoices = mockInvoices;
  const invoicesLoading = false;
  const paymentMethods = mockPaymentMethods;
  const paymentMethodsLoading = false;

  // Upgrade/downgrade mutation
  const changePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      return apiRequest('/api/subscription/change-plan', 'POST', { planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/usage-stats'] });
      toast({
        title: "Plan Updated",
        description: "Your subscription plan has been successfully updated.",
      });
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
      return apiRequest('/api/payment-methods/add', 'POST');
    },
    onSuccess: (data: any) => {
      // Redirect to Stripe setup page
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Products</span>
                      <span className="text-white" data-testid="text-products-usage">
                        {usageStats.productsCount}
                        {currentPlan.limits.products !== -1 && `/${currentPlan.limits.products}`}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(usageStats.productsCount, currentPlan.limits.products)} 
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Emails</span>
                      <span className="text-white" data-testid="text-emails-usage">
                        {usageStats.emailsSent}
                        {currentPlan.limits.emails !== -1 && `/${currentPlan.limits.emails}`}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(usageStats.emailsSent, currentPlan.limits.emails)} 
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">SMS</span>
                      <span className="text-white" data-testid="text-sms-usage">
                        {usageStats.smsSent}
                        {currentPlan.limits.sms !== -1 && `/${currentPlan.limits.sms}`}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(usageStats.smsSent, currentPlan.limits.sms)} 
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">AI Generations</span>
                      <span className="text-white" data-testid="text-ai-usage">
                        {usageStats.aiGenerationsUsed}
                        {currentPlan.limits.aiGenerations !== -1 && `/${currentPlan.limits.aiGenerations}`}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(usageStats.aiGenerationsUsed, currentPlan.limits.aiGenerations)} 
                      className="h-2"
                    />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto px-4">
                {plans.map((plan: SubscriptionPlan, index) => {
                const isCurrentPlan = plan.id === currentSubscription?.planId;
                const isUpgrade = plan.price > (currentPlan?.price || 0);
                const isDowngrade = plan.price < (currentPlan?.price || 0);
                const isPlanPopular = plan.planName === "Growth"; // Growth is the popular plan
                const isFreeTrialPlan = plan.price === 0 || plan.planName?.toLowerCase().includes('trial'); // Highlight free trial
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`pricing-card relative h-full ${isPlanPopular ? 'border-primary/50 shadow-primary/20 scale-[1.02] shadow-lg' : ''} ${isCurrentPlan ? 'border-primary/50 shadow-primary/20 ring-2 ring-primary/30' : ''} ${isFreeTrialPlan ? 'border-green-500/60 shadow-green-500/30 ring-2 ring-green-500/20 scale-[1.02]' : ''}`}
                    data-testid={`card-plan-${plan.planName?.toLowerCase().replace(' ', '-') || 'unknown'}`}
                  >
                    {(isPlanPopular || isCurrentPlan || isFreeTrialPlan) && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className={isFreeTrialPlan ? "bg-green-500 text-white animate-pulse" : "bg-primary text-primary-foreground"}>
                          {isCurrentPlan ? "Current Plan" : isFreeTrialPlan ? "FREE TRIAL" : "Popular"}
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-4 sm:p-6 h-full flex flex-col">
                      <div className="text-center mb-4 sm:mb-6">
                        <div className="flex justify-center mb-2 text-primary">
                          {plan.planName && planIcons[plan.planName as keyof typeof planIcons]}
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white" data-testid={`text-plan-name-${plan.planName?.toLowerCase().replace(' ', '-') || 'unknown'}`}>
                          {plan.planName || 'Unknown Plan'}
                        </h3>
                        <div className="text-2xl sm:text-3xl font-bold text-white" data-testid={`text-plan-price-${plan.planName?.toLowerCase().replace(' ', '-') || 'unknown'}`}>
                          {formatPrice(plan.price)}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-300 mb-2 sm:mb-3" data-testid={`text-plan-period-${plan.planName?.toLowerCase().replace(' ', '-') || 'unknown'}`}>
                          {plan.interval}
                        </div>
                        {plan.description && (
                          <p className="text-xs sm:text-sm text-primary/80 font-medium px-2 sm:px-0" data-testid={`text-plan-description-${plan.planName?.toLowerCase().replace(' ', '-') || 'unknown'}`}>
                            {plan.planName !== "7-Day Free Trial" && "Who it's for: "}{plan.description}
                          </p>
                        )}
                      </div>
                      <div className="flex-1">
                        <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                          {plan.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-start text-xs sm:text-sm text-slate-300" data-testid={`text-plan-feature-${index}-${featureIndex}`}>
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-2 mt-0.5 flex-shrink-0 text-primary" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {!isCurrentPlan ? (
                        <Button
                          onClick={() => changePlanMutation.mutate(plan.id)}
                          disabled={changePlanMutation.isPending}
                          className={`w-full font-medium ${
                            isFreeTrialPlan 
                              ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25' 
                              : 'gradient-button'
                          }`}
                          data-testid={`button-change-plan-${plan.planName?.toLowerCase().replace(' ', '-') || 'unknown'}`}
                        >
                          {changePlanMutation.isPending ? "Processing..." : 
                           isFreeTrialPlan ? "Start Free Trial" :
                           isUpgrade ? "Upgrade" : isDowngrade ? "Downgrade" : "Choose Plan"}
                        </Button>
                      ) : (
                        <Button
                          disabled
                          className="w-full bg-slate-700 text-slate-300"
                          variant="secondary"
                          data-testid={`button-current-plan-${plan.planName?.toLowerCase().replace(' ', '-') || 'unknown'}`}
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
                  <div className="text-center py-8 text-slate-300">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No invoices yet</p>
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