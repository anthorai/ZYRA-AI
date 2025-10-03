import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  ArrowLeft
} from "lucide-react";

export default function UpsellEmailReceiptsPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const [isEnabled, setIsEnabled] = useState(false);

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    toast({
      title: enabled ? "AI Receipts Enabled!" : "AI Receipts Disabled",
      description: enabled ? "Enhanced email receipts are now active." : "Reverted to default Shopify receipts.",
    });
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen dark-theme-bg">
      {/* Header */}
      <header className="gradient-card backdrop-blur-sm border-b border-border/50 px-4 sm:px-6 py-3 sm:py-4">
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
                <Mail className="w-5 h-5 text-primary mr-2" />
                Upsell Email Receipts
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Compare and configure enhanced email receipts with upsell recommendations
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle className="text-white text-xl">Default Shopify Receipt</CardTitle>
                <CardDescription className="text-slate-300">
                  Standard order confirmation email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border border-slate-600 p-6 rounded-lg bg-slate-800/30">
                  <div className="font-bold text-white text-lg">Order Confirmation #1234</div>
                  <div className="mt-4 text-slate-300">Thank you for your purchase!</div>
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Wireless Headphones</span>
                      <span className="text-white">$89.99</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Shipping</span>
                      <span className="text-white">$5.99</span>
                    </div>
                    <div className="border-t border-slate-600 pt-2 mt-4">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">Total:</span>
                        <span className="text-white">$95.98</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card">
              <CardHeader>
                <CardTitle className="text-white text-xl">AI-Enhanced Receipt</CardTitle>
                <CardDescription className="text-slate-300">
                  Enhanced with personalized upsell recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border border-primary p-6 rounded-lg bg-slate-800/30">
                  <div className="font-bold text-white text-lg">Order Confirmation #1234</div>
                  <div className="mt-4 text-slate-300">Thank you for your purchase!</div>
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Wireless Headphones</span>
                      <span className="text-white">$89.99</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Shipping</span>
                      <span className="text-white">$5.99</span>
                    </div>
                    <div className="border-t border-slate-600 pt-2 mt-4">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">Total:</span>
                        <span className="text-white">$95.98</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 border-t border-slate-600 pt-6">
                    <div className="font-bold text-primary text-lg mb-4">Complete Your Setup:</div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-white">📱 Phone Case</div>
                          <div className="text-slate-400 text-sm">Perfect protection for your device</div>
                        </div>
                        <div className="text-right">
                          <div className="text-primary font-bold">$19.99</div>
                          <div className="text-green-400 text-sm">20% off</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-white">🔌 Charging Cable</div>
                          <div className="text-slate-400 text-sm">High-speed USB-C cable</div>
                        </div>
                        <div className="text-primary font-bold">$12.99</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Control Panel */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="text-white text-xl">Settings & Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <Switch checked={isEnabled} onCheckedChange={handleToggle} />
                  <Label className="text-white text-lg">Enable AI-Enhanced Receipts</Label>
                </div>
                <div className="text-slate-300">
                  CTR: <span className="text-primary font-bold text-xl">
                    {isEnabled ? "12.4%" : "0%"}
                  </span> 
                  <span className="text-slate-400 text-sm ml-2">
                    {isEnabled ? "(Live)" : "(Demo Mode)"}
                  </span>
                </div>
              </div>

              {isEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">+18%</div>
                    <div className="text-slate-300">Revenue Increase</div>
                    <div className="text-slate-400 text-sm">since enabling AI receipts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">2,847</div>
                    <div className="text-slate-300">Enhanced Receipts Sent</div>
                    <div className="text-slate-400 text-sm">this month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">$4,299</div>
                    <div className="text-slate-300">Additional Revenue</div>
                    <div className="text-slate-400 text-sm">from upsells</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}