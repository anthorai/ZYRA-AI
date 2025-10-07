import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  ArrowLeft
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

  const handleGoBack = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen dark-theme-bg">
      {/* Header */}
      <header className="dark-theme-bg backdrop-blur-sm border-b border-border/50 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl">
        <div className="flex items-center">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl truncate flex items-center">
                <MessageSquare className="w-5 h-5 text-primary mr-2" />
                Abandoned Cart SMS Recovery
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Configure SMS messages to recover abandoned shopping carts
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
            <AvatarMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Abandoned Carts List */}
          <div className="space-y-4">
            <h2 className="text-white text-2xl font-bold">Abandoned Carts ({mockAbandonedCarts.length})</h2>
            {mockAbandonedCarts.length === 0 ? (
              <Card className="gradient-card">
                <CardContent className="p-12">
                  <div className="text-center" data-testid="empty-state-abandoned-carts">
                    <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-white mb-2">No abandoned carts</h3>
                    <p className="text-slate-300 mb-6">Great news! All customers completed their purchases</p>
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
              mockAbandonedCarts.map((cart) => (
              <Card key={cart.id} className="dark-theme-bg  hover:shadow-cyan-500/20 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-lg">{cart.customerName}</h4>
                      <p className="text-slate-300">{cart.items}</p>
                      <p className="text-slate-400 text-sm">{cart.timeAgo}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-primary font-bold text-2xl">${cart.value}</div>
                      <Button size="sm" className="mt-3 bg-green-600 hover:bg-green-700 px-6">
                        Send SMS
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
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
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="text-white text-xl">Recovery Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">23%</div>
                  <div className="text-slate-300">Recovery Rate</div>
                  <div className="text-slate-400 text-sm">last 30 days</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">147</div>
                  <div className="text-slate-300">Carts Recovered</div>
                  <div className="text-slate-400 text-sm">this month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">$8,429</div>
                  <div className="text-slate-300">Revenue Recovered</div>
                  <div className="text-slate-400 text-sm">this month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">4.2x</div>
                  <div className="text-slate-300">ROI</div>
                  <div className="text-slate-400 text-sm">campaign performance</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}