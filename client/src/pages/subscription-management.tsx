import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  ArrowDownCircle
} from "lucide-react";
import { format } from "date-fns";

export default function SubscriptionManagement() {
  const { toast } = useToast();

  // Fetch current subscription
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["/api/subscription"],
  });

  // Fetch available plans
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/subscription-plans"],
  });

  // Fetch payment transactions
  const { data: transactions, isLoading: transLoading } = useQuery({
    queryKey: ["/api/payment-transactions"],
  });

  // Fetch invoices
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Change plan mutation
  const changePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest("POST", "/api/subscription/change-plan", { planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
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
      active: { variant: "default", icon: <CheckCircle2 className="w-3 h-3" /> },
      trialing: { variant: "secondary", icon: <Clock className="w-3 h-3" /> },
      canceled: { variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
      past_due: { variant: "destructive", icon: <Clock className="w-3 h-3" /> },
    };
    
    const config = variants[status] || variants.active;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
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

  if (subLoading || plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentPlan = Array.isArray(plans) ? plans.find((p: any) => p.id === (subscription as any)?.planId) : undefined;
  const isUpgrade = (planPrice: number) => planPrice > (parseFloat(currentPlan?.price || "0"));

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-subscription-title">Subscription Management</h1>
        <p className="text-muted-foreground">Manage your subscription, billing, and payment methods</p>
      </div>

      {/* Current Subscription */}
      <Card className="mb-6" data-testid="card-current-subscription">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Subscription</span>
            {subscription ? getStatusBadge((subscription as any).status) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Plan</p>
                <p className="text-xl font-semibold" data-testid="text-current-plan">{currentPlan?.name || "Unknown"}</p>
                <p className="text-sm text-muted-foreground">${currentPlan?.price || "0"}/{currentPlan?.interval || "month"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Billing Period</p>
                <p className="font-medium" data-testid="text-billing-period">
                  {(subscription as any).currentPeriodStart && format(new Date((subscription as any).currentPeriodStart), "MMM dd, yyyy")} - {(subscription as any).currentPeriodEnd && format(new Date((subscription as any).currentPeriodEnd), "MMM dd, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Next Billing Date</p>
                <p className="font-medium" data-testid="text-next-billing">
                  {(subscription as any).currentPeriodEnd ? format(new Date((subscription as any).currentPeriodEnd), "MMMM dd, yyyy") : "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No active subscription</p>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Upgrade or downgrade your subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.isArray(plans) && plans.map((plan: any) => (
              <Card 
                key={plan.id} 
                className={`relative ${currentPlan?.id === plan.id ? 'border-primary' : ''}`}
                data-testid={`card-plan-${plan.id}`}
              >
                {currentPlan?.id === plan.id && (
                  <div className="absolute -top-2 right-4">
                    <Badge>Current</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="text-2xl font-bold">
                    ${plan.price}
                    <span className="text-sm text-muted-foreground font-normal">/{plan.interval}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant={currentPlan?.id === plan.id ? "outline" : "default"}
                    disabled={currentPlan?.id === plan.id || changePlanMutation.isPending}
                    onClick={() => changePlanMutation.mutate(plan.id)}
                    data-testid={`button-select-plan-${plan.id}`}
                  >
                    {currentPlan?.id === plan.id ? (
                      "Current Plan"
                    ) : (
                      <>
                        {isUpgrade(parseFloat(plan.price)) ? (
                          <><ArrowUpCircle className="w-4 h-4 mr-2" /> Upgrade</>
                        ) : (
                          <><ArrowDownCircle className="w-4 h-4 mr-2" /> Downgrade</>
                        )}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : Array.isArray(transactions) && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((txn: any) => (
                <div key={txn.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`transaction-${txn.id}`}>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{txn.description || `${txn.gateway} payment`}</p>
                      <p className="text-sm text-muted-foreground">
                        {txn.createdAt && format(new Date(txn.createdAt), "MMM dd, yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-semibold">${txn.amount} {txn.currency}</p>
                      <p className="text-xs text-muted-foreground capitalize">{txn.gateway}</p>
                    </div>
                    {getPaymentStatusBadge(txn.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No payment history yet</p>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : Array.isArray(invoices) && invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.slice(0, 10).map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`invoice-${invoice.id}`}>
                  <div>
                    <p className="font-medium">Invoice #{invoice.invoiceNumber || invoice.id.substring(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.createdAt && format(new Date(invoice.createdAt), "MMMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-semibold">${invoice.amount} {invoice.currency}</p>
                    </div>
                    {invoice.pdfUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer" data-testid={`button-download-invoice-${invoice.id}`}>
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No invoices yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
