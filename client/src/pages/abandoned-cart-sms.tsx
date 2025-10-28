import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer, CardPageHeader } from "@/components/ui/standardized-layout";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare
} from "lucide-react";

export default function AbandonedCartSMSPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [smsMessage, setSmsMessage] = useState("Hey {Name}, don't forget your cart! Here's 10% off: CODE10. Shop now: [link]");

  const mockAbandonedCarts = [
    { id: 1, customerName: "Sarah Chen", items: "Wireless Headphones, Phone Case", value: 124.98, timeAgo: "2 hours ago" },
    { id: 2, customerName: "Mike Johnson", items: "Fitness Watch", value: 199.99, timeAgo: "4 hours ago" },
    { id: 3, customerName: "Emma Davis", items: "Coffee Beans, Mug Set", value: 45.98, timeAgo: "6 hours ago" },
    { id: 4, customerName: "Alex Rodriguez", items: "Gaming Mouse, Mousepad", value: 67.98, timeAgo: "8 hours ago" },
    { id: 5, customerName: "Lisa Wang", items: "Yoga Mat, Water Bottle", value: 89.97, timeAgo: "12 hours ago" }
  ];

  const handleScheduleSMS = () => {
    toast({
      title: "SMS Scheduled!",
      description: `SMS recovery messages scheduled for ${mockAbandonedCarts.length} abandoned carts.`,
    });
  };

  return (
    <div className="min-h-screen dark-theme-bg">
      <CardPageHeader title="Abandoned Cart SMS Recovery" />
      <PageContainer>
          {/* Abandoned Carts Grid */}
          <div className="space-y-4">
            <h2 className="text-white text-base sm:text-lg md:text-xl lg:text-2xl font-bold">Abandoned Carts ({mockAbandonedCarts.length})</h2>
            {mockAbandonedCarts.length === 0 ? (
              <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
                <CardContent className="p-8 sm:p-12">
                  <div className="text-center" data-testid="empty-state-abandoned-carts">
                    <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4 opacity-50 flex-shrink-0" />
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No abandoned carts</h3>
                    <p className="text-slate-300 mb-6 text-sm sm:text-base">Great news! All customers completed their purchases</p>
                    <Button 
                      variant="outline"
                      onClick={() => setLocation('/dashboard')}
                      className="border-slate-600 text-slate-300 hover:bg-white/10"
                      data-testid="button-back-dashboard"
                    >
                      Back to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {mockAbandonedCarts.map((cart) => (
                  <Card key={cart.id} className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl dark-theme-bg">
                    <CardContent className="p-3 sm:p-4 md:p-6">
                      <div className="space-y-3">
                        <div className="min-w-0">
                          <h4 className="text-white font-medium text-base sm:text-lg md:text-xl truncate">{cart.customerName}</h4>
                          <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">{cart.items}</p>
                          <p className="text-slate-400 text-[10px] sm:text-xs truncate">{cart.timeAgo}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-700/50">
                          <div className="text-primary font-bold text-lg sm:text-xl md:text-2xl truncate">${cart.value}</div>
                          <Button size="sm" className="mt-3 w-full bg-green-600 hover:bg-green-700 text-[10px] sm:text-xs md:text-sm">
                            Send SMS
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
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="text-white text-xl">SMS Message Template</CardTitle>
              <CardDescription className="text-slate-300">
                Customize your abandoned cart recovery message
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-white text-lg">AI-Suggested SMS Message:</Label>
                <Textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white text-lg"
                  rows={4}
                />
                <p className="text-slate-400 text-sm">
                  Use {"{Name}"} for customer name, {"{Items}"} for cart items, {"{Total}"} for cart value
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" className="border-slate-600 text-slate-300 px-6">
                  Preview
                </Button>
                <Button onClick={handleScheduleSMS} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                  Schedule SMS Campaign
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Card */}
          <Card className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl gradient-card">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-white text-base sm:text-lg md:text-xl">Recovery Analytics</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="text-center min-w-0">
                  <div className="text-lg sm:text-2xl md:text-3xl font-bold text-primary truncate">23%</div>
                  <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Recovery Rate</div>
                  <div className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs truncate">last 30 days</div>
                </div>
                <div className="text-center min-w-0">
                  <div className="text-lg sm:text-2xl md:text-3xl font-bold text-primary truncate">147</div>
                  <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Carts Recovered</div>
                  <div className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs truncate">this month</div>
                </div>
                <div className="text-center min-w-0">
                  <div className="text-lg sm:text-2xl md:text-3xl font-bold text-primary truncate">$8,429</div>
                  <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">Revenue Recovered</div>
                  <div className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs truncate">this month</div>
                </div>
                <div className="text-center min-w-0">
                  <div className="text-lg sm:text-2xl md:text-3xl font-bold text-primary truncate">4.2x</div>
                  <div className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">ROI</div>
                  <div className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs truncate">campaign performance</div>
                </div>
              </div>
            </CardContent>
          </Card>
      </PageContainer>
    </div>
  );
}