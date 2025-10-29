import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageShell } from "@/components/ui/page-shell";
import { 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
  RefreshCw,
  Rocket,
  BarChart,
  Zap,
  Crown
} from "lucide-react";
import { format } from "date-fns";

const planIcons: Record<string, JSX.Element> = {
  "7-Day Free Trial": <Rocket className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />,
  "Starter": <BarChart className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />,
  "Growth": <Zap className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />,
  "Pro": <Crown className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />,
};

export default function SubscriptionManagement() {
  const { toast } = useToast();

  // Fetch current subscription
  const { data: subscription, isLoading: subLoading, error: subError, isError: subIsError } = useQuery({
    queryKey: ["/api/subscription/current"],
  });

  // Fetch available plans
  const { data: plans, isLoading: plansLoading, error: plansError, isError: plansIsError } = useQuery({
    queryKey: ["/api/subscription-plans"],
  });

  // Fetch payment transactions
  const { data: transactions, isLoading: transLoading, error: transError, isError: transIsError } = useQuery({
    queryKey: ["/api/payments/transactions"],
  });

  // Fetch invoices
  const { data: invoices, isLoading: invoicesLoading, error: invoicesError, isError: invoicesIsError } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Show toast notification when errors occur
  useEffect(() => {
    if (subIsError && subError) {
      toast({
        title: "Error",
        description: subError instanceof Error ? subError.message : "Failed to load subscription data",
        variant: "destructive",
      });
    }
  }, [subIsError, subError, toast]);

  useEffect(() => {
    if (plansIsError && plansError) {
      toast({
        title: "Error",
        description: plansError instanceof Error ? plansError.message : "Failed to load subscription plans",
        variant: "destructive",
      });
    }
  }, [plansIsError, plansError, toast]);

  useEffect(() => {
    if (transIsError && transError) {
      toast({
        title: "Error",
        description: transError instanceof Error ? transError.message : "Failed to load payment transactions",
        variant: "destructive",
      });
    }
  }, [transIsError, transError, toast]);

  useEffect(() => {
    if (invoicesIsError && invoicesError) {
      toast({
        title: "Error",
        description: invoicesError instanceof Error ? invoicesError.message : "Failed to load invoices",
        variant: "destructive",
      });
    }
  }, [invoicesIsError, invoicesError, toast]);

  // Change plan mutation
  const changePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest("POST", "/api/subscription/change-plan", { planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/transactions"] });
      toast({
        title: "Plan Updated",
        description: "Your subscription plan has been successfully changed.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Plan Change Failed",
        description: error.message || "Failed to change plan. Please try again.",
      });
    },
  });

  const getStatusBadge = (status: string): JSX.Element => {
    const variants: Record<string, { variant: any; icon: any }> = {
      active: { variant: "default", icon: <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" /> },
      trialing: { variant: "secondary", icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" /> },
      canceled: { variant: "destructive", icon: <XCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" /> },
      past_due: { variant: "destructive", icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" /> },
    };
    
    const config = variants[status] || variants.active;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        <span className="truncate min-w-0">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-green-500/10 text-green-500 border-green-500/20",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      failed: "bg-red-500/10 text-red-500 border-red-500/20",
      refunded: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    
    return (
      <Badge className={`${colors[status] || colors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const currentPlan = Array.isArray(plans) ? plans.find((p: any) => p.id === (subscription as any)?.planId) : undefined;
  const isUpgrade = (planPrice: number) => planPrice > (parseFloat(currentPlan?.price || "0"));

  // Error State - Check if any critical query failed
  if (subIsError || plansIsError) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <DashboardCard testId="error-state">
          <div className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Failed to Load Subscription Data</h3>
            <p className="text-red-400 mb-4">Please try again.</p>
            <div className="flex gap-3 justify-center">
              {subIsError && (
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] })}
                  variant="default"
                  data-testid="button-retry-subscription"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Subscription
                </Button>
              )}
              {plansIsError && (
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] })}
                  variant="default"
                  data-testid="button-retry-plans"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Plans
                </Button>
              )}
            </div>
          </div>
        </DashboardCard>
      </div>
    );
  }

  return (
    <PageShell
      title="Subscription Management"
      subtitle="View and manage your subscription, invoices, and billing history"
      
      maxWidth="xl"
      spacing="normal"
    >
      {/* Current Subscription */}
      <DashboardCard 
        title="Current Subscription"
        className="mb-6" 
        testId="card-current-subscription"
        headerAction={
          subLoading ? (
            <Skeleton className="h-6 w-20" />
          ) : subscription ? (
            getStatusBadge((subscription as any).status)
          ) : null
        }
      >
          {subLoading || plansLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div>
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-5 w-36" />
              </div>
            </div>
          ) : subscription ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-1">Plan</p>
                <p className="text-base sm:text-lg md:text-xl font-semibold truncate" data-testid="text-current-plan">{currentPlan?.planName || "Unknown"}</p>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">${currentPlan?.price || "0"}/{currentPlan?.interval || "month"}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-1">Billing Period</p>
                <p className="text-[10px] sm:text-xs md:text-sm font-medium truncate" data-testid="text-billing-period">
                  {(subscription as any).currentPeriodStart && format(new Date((subscription as any).currentPeriodStart), "MMM dd, yyyy")} - {(subscription as any).currentPeriodEnd && format(new Date((subscription as any).currentPeriodEnd), "MMM dd, yyyy")}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-1">Next Billing Date</p>
                <p className="text-[10px] sm:text-xs md:text-sm font-medium truncate" data-testid="text-next-billing">
                  {(subscription as any).currentPeriodEnd ? format(new Date((subscription as any).currentPeriodEnd), "MMMM dd, yyyy") : "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground" data-testid="text-no-subscription">No active subscription</p>
          )}
      </DashboardCard>

      {/* Available Plans */}
      <DashboardCard 
        title="Available Plans"
        description="Upgrade or downgrade your subscription plan"
        className="mb-6"
        testId="card-available-plans"
      >
          {plansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <DashboardCard key={i} size="sm" className="rounded-xl sm:rounded-2xl shadow-lg border border-slate-700/50">
                  <div className="h-full flex flex-col">
                    <div className="pb-3 mb-3 flex-1">
                      <Skeleton className="h-8 w-8 mb-2" />
                      <Skeleton className="h-6 w-24 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex justify-center mt-3">
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </DashboardCard>
              ))}
            </div>
          ) : Array.isArray(plans) && plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {plans.map((plan: any) => (
                <DashboardCard 
                  key={plan.id} 
                  size="sm"
                  className={`group relative overflow-hidden rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border border-slate-700/50 hover:border-primary/30 ${currentPlan?.id === plan.id ? 'border-primary' : ''}`}
                  testId={`card-plan-${plan.id}`}
                >
                  {currentPlan?.id === plan.id && (
                    <div className="absolute -top-2 right-4 z-10">
                      <Badge>Current</Badge>
                    </div>
                  )}
                  <div className="h-full flex flex-col">
                    <div className="flex-1 space-y-2 sm:space-y-3">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="text-primary flex-shrink-0">
                          {planIcons[plan.planName] || <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />}
                        </div>
                        <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white leading-tight truncate min-w-0">
                          {plan.planName}
                        </h3>
                      </div>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                        ${plan.price}
                        <span className="text-[10px] sm:text-xs">/{plan.interval}</span>
                      </p>
                    </div>
                    
                    <div className="flex justify-center mt-3 sm:mt-4">
                      <Button
                        className={`w-full px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 border-0 font-semibold rounded-lg ${
                          currentPlan?.id === plan.id 
                            ? 'bg-slate-700 text-white opacity-50 cursor-not-allowed' 
                            : 'bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95'
                        }`}
                        disabled={currentPlan?.id === plan.id || changePlanMutation.isPending}
                        onClick={() => changePlanMutation.mutate(plan.id)}
                        data-testid={`button-select-plan-${plan.id}`}
                      >
                        {currentPlan?.id === plan.id ? (
                          "Current Plan"
                        ) : (
                          <>
                            {isUpgrade(parseFloat(plan.price)) ? (
                              <><ArrowUpCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" /> <span className="truncate min-w-0">Upgrade</span></>
                            ) : (
                              <><ArrowDownCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" /> <span className="truncate min-w-0">Downgrade</span></>
                            )}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DashboardCard>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4" data-testid="text-no-plans">No subscription plans available</p>
          )}
      </DashboardCard>

      {/* Payment History */}
      <DashboardCard 
        title="Payment History"
        headerAction={<Receipt className="w-5 h-5" />}
        className="mb-6"
        testId="card-payment-history"
      >
          {transLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 sm:p-4 md:p-6 border border-slate-700/50 rounded-xl sm:rounded-2xl shadow-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 rounded-full flex-shrink-0" />
                    <div className="space-y-2 flex-1 min-w-0">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : Array.isArray(transactions) && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((txn: any) => (
                <div key={txn.id} className="flex items-center justify-between p-3 sm:p-4 md:p-6 border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl shadow-lg" data-testid={`transaction-${txn.id}`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-base sm:text-lg md:text-xl font-medium truncate">{txn.description || `${txn.gateway} payment`}</p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">
                        {txn.createdAt && format(new Date(txn.createdAt), "MMM dd, yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3 flex-shrink-0">
                    <div className="min-w-0">
                      <p className="text-base sm:text-lg md:text-xl font-semibold truncate">${txn.amount} {txn.currency}</p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground capitalize truncate">{txn.gateway}</p>
                    </div>
                    {getPaymentStatusBadge(txn.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8" data-testid="text-no-transactions">No payment transactions found</p>
          )}
      </DashboardCard>

      {/* Invoices */}
      <DashboardCard
        title="Invoices"
        headerAction={<Calendar className="w-5 h-5" />}
        testId="card-invoices"
      >
          {invoicesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-slate-700/50 rounded-xl shadow-lg">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              ))}
            </div>
          ) : Array.isArray(invoices) && invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.slice(0, 10).map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl shadow-lg" data-testid={`invoice-${invoice.id}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">Invoice #{invoice.invoiceNumber}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {invoice.createdAt && format(new Date(invoice.createdAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="font-semibold text-sm sm:text-base">${invoice.amount}</p>
                    {getPaymentStatusBadge(invoice.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8" data-testid="text-no-invoices">No invoices available</p>
          )}
      </DashboardCard>
    </PageShell>
  );
}
