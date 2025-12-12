import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare,
  Loader2
} from "lucide-react";
import type { AbandonedCart } from "@shared/schema";

interface CartItem {
  title?: string;
  name?: string;
  quantity?: number;
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return then.toLocaleDateString();
}

function formatCartItems(cartItems: unknown): string {
  if (!cartItems) return "Unknown items";
  
  try {
    const items = Array.isArray(cartItems) ? cartItems : [];
    if (items.length === 0) return "Unknown items";
    
    return items
      .slice(0, 3)
      .map((item: CartItem) => item.title || item.name || "Item")
      .join(", ") + (items.length > 3 ? ` +${items.length - 3} more` : "");
  } catch {
    return "Unknown items";
  }
}

export default function AbandonedCartSMSPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [smsMessage, setSmsMessage] = useState("Hey {Name}, don't forget your cart! Here's 10% off: CODE10. Shop now: [link]");

  // Fetch real abandoned carts data
  const { data: abandonedCarts = [], isLoading } = useQuery<AbandonedCart[]>({
    queryKey: ['/api/abandoned-carts'],
  });

  // Fetch analytics data
  const { data: analytics } = useQuery<{
    totalCarts: number;
    recoveredCarts: number;
    campaignsSent: number;
    totalValue: number;
    recoveredValue: number;
    recoveryRate: string;
    campaignSuccessRate: string;
  }>({
    queryKey: ['/api/cart-recovery/analytics'],
  });

  // Filter to show only active abandoned carts (not recovered)
  const activeCarts = abandonedCarts.filter(cart => cart.status === 'abandoned' || cart.status === 'contacted');

  // Send SMS mutation
  const sendSmsMutation = useMutation({
    mutationFn: async (cartId: string) => {
      return apiRequest('POST', `/api/abandoned-carts/${cartId}/recover`, { channel: 'sms', message: smsMessage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/abandoned-carts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart-recovery/analytics'] });
      toast({
        title: "SMS Sent!",
        description: "Recovery SMS has been sent to the customer.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send SMS",
        description: "Please check your SMS settings and try again.",
        variant: "destructive",
      });
    },
  });

  const handleScheduleSMS = () => {
    if (activeCarts.length === 0) {
      toast({
        title: "No carts to recover",
        description: "There are no abandoned carts to send SMS to.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "SMS Campaign Scheduled!",
      description: `SMS recovery messages scheduled for ${activeCarts.length} abandoned carts.`,
    });
  };

  return (
    <PageShell
      title="Abandoned Cart SMS"
      subtitle="Recover lost sales with AI-powered SMS reminders"
      backTo="/dashboard?tab=campaigns"
    >
      {/* Abandoned Carts Grid */}
      <div className="space-y-4">
        <h2 className="text-white text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
          Abandoned Carts ({isLoading ? "..." : activeCarts.length})
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-lg border border-slate-700/50 rounded-xl sm:rounded-2xl dark-theme-bg">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-32 bg-slate-700" />
                    <Skeleton className="h-4 w-48 bg-slate-700" />
                    <Skeleton className="h-4 w-24 bg-slate-700" />
                    <div className="pt-2 border-t border-slate-700/50">
                      <Skeleton className="h-8 w-20 bg-slate-700" />
                      <Skeleton className="h-9 w-full mt-3 bg-slate-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeCarts.length === 0 ? (
          <DashboardCard testId="card-empty-abandoned-carts">
            <div className="text-center py-8" data-testid="empty-state-abandoned-carts">
              <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4 opacity-50 flex-shrink-0" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No abandoned carts</h3>
              <p className="text-slate-300 mb-6 text-sm sm:text-base">Great news! All customers completed their purchases</p>
              <Button 
                variant="outline"
                onClick={() => window.history.back()}
                className="border-slate-600 text-slate-300 hover:bg-white/10"
                data-testid="button-back-dashboard"
              >
                Go Back
              </Button>
            </div>
          </DashboardCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {activeCarts.map((cart) => (
              <Card 
                key={cart.id} 
                className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl dark-theme-bg"
                data-testid={`cart-item-${cart.id}`}
              >
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="space-y-3">
                    <div className="min-w-0">
                      <h4 className="text-white font-medium text-base sm:text-lg md:text-xl truncate">
                        {cart.customerName || cart.customerEmail || "Unknown Customer"}
                      </h4>
                      <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">
                        {formatCartItems(cart.cartItems)}
                      </p>
                      <p className="text-slate-400 text-[10px] sm:text-xs truncate">
                        {formatTimeAgo(cart.abandonedAt)}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-700/50">
                      <div className="text-primary font-bold text-lg sm:text-xl md:text-2xl truncate">
                        ${Number(cart.cartValue).toFixed(2)}
                      </div>
                      <Button 
                        size="sm" 
                        className="mt-3 w-full bg-green-600 hover:bg-green-700 text-[10px] sm:text-xs md:text-sm"
                        onClick={() => sendSmsMutation.mutate(cart.id)}
                        disabled={sendSmsMutation.isPending || !cart.customerPhone}
                        data-testid={`button-send-sms-${cart.id}`}
                      >
                        {sendSmsMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        {cart.customerPhone ? "Send SMS" : "No Phone"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* SMS Template Editor */}
      <DashboardCard
        title="SMS Message Template"
        description="Customize your abandoned cart recovery message"
        testId="card-sms-template"
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-white text-lg">AI-Suggested SMS Message:</Label>
            <Textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white text-lg"
              rows={4}
              data-testid="textarea-sms-message"
            />
            <p className="text-slate-400 text-sm">
              Use {"{Name}"} for customer name, {"{Items}"} for cart items, {"{Total}"} for cart value
            </p>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" className="border-slate-600 text-slate-300 px-6" data-testid="button-preview">
              Preview
            </Button>
            <Button 
              onClick={handleScheduleSMS} 
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
              data-testid="button-schedule-sms"
            >
              Schedule SMS Campaign
            </Button>
          </div>
        </div>
      </DashboardCard>

      {/* Analytics Card */}
      <DashboardCard
        title="Recovery Analytics"
        testId="card-recovery-analytics"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <div className="text-center min-w-0">
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-primary truncate" data-testid="stat-recovery-rate">
              {analytics?.recoveryRate || "0"}%
            </div>
            <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Recovery Rate</div>
            <div className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs truncate">last 30 days</div>
          </div>
          <div className="text-center min-w-0">
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-primary truncate" data-testid="stat-carts-recovered">
              {analytics?.recoveredCarts || 0}
            </div>
            <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Carts Recovered</div>
            <div className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs truncate">this month</div>
          </div>
          <div className="text-center min-w-0">
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-primary truncate" data-testid="stat-revenue-recovered">
              ${analytics?.recoveredValue?.toLocaleString() || "0"}
            </div>
            <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Revenue Recovered</div>
            <div className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs truncate">this month</div>
          </div>
          <div className="text-center min-w-0">
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-primary truncate" data-testid="stat-campaign-rate">
              {analytics?.campaignSuccessRate || "0"}%
            </div>
            <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Campaign Success</div>
            <div className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs truncate">campaign performance</div>
          </div>
        </div>
      </DashboardCard>
    </PageShell>
  );
}
