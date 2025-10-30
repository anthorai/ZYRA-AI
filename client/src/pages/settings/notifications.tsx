import { useState } from "react";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { Mail, Smartphone, Monitor, MessageSquare, TrendingUp, CreditCard, Sparkles } from "lucide-react";

export default function NotificationsPage() {
  const { toast } = useToast();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  
  const [campaignAlerts, setCampaignAlerts] = useState(true);
  const [performanceAlerts, setPerformanceAlerts] = useState(true);
  const [billingAlerts, setBillingAlerts] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState(true);

  const handleSave = () => {
    toast({
      title: "Notification Settings Saved",
      description: "Your notification preferences have been updated",
      duration: 3000,
    });
  };

  return (
    <PageShell
      title="Notification Settings"
      subtitle="Manage how and when you receive notifications"
      maxWidth="xl"
      spacing="normal"
    >
      {/* Notification Channels */}
      <DashboardCard
        title="Notification Channels"
        description="Choose how you want to receive notifications"
        testId="card-notification-channels"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-slate-800/50">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Label className="text-white font-medium">Email Notifications</Label>
                <p className="text-sm text-slate-400">Receive updates via email</p>
              </div>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              className="data-[state=checked]:bg-primary"
              data-testid="switch-email-notifications"
            />
          </div>

          <Separator className="bg-slate-700" />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-slate-800/50">
                <Monitor className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Label className="text-white font-medium">In-App Notifications</Label>
                <p className="text-sm text-slate-400">See alerts within the dashboard</p>
              </div>
            </div>
            <Switch
              checked={inAppNotifications}
              onCheckedChange={setInAppNotifications}
              className="data-[state=checked]:bg-primary"
              data-testid="switch-inapp-notifications"
            />
          </div>

          <Separator className="bg-slate-700" />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-slate-800/50">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Label className="text-white font-medium">Push Notifications</Label>
                <p className="text-sm text-slate-400">Mobile and browser push alerts</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
                Coming Soon
              </Badge>
              <Switch
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
                disabled
                className="data-[state=checked]:bg-primary"
                data-testid="switch-push-notifications"
              />
            </div>
          </div>

          <Separator className="bg-slate-700" />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-slate-800/50">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Label className="text-white font-medium">SMS Alerts</Label>
                <p className="text-sm text-slate-400">Critical alerts via text message</p>
              </div>
            </div>
            <Switch
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
              className="data-[state=checked]:bg-primary"
              data-testid="switch-sms-notifications"
            />
          </div>
        </div>
      </DashboardCard>

      {/* Alert Categories */}
      <DashboardCard
        title="Alert Categories"
        description="Choose which types of alerts you want to receive"
        testId="card-alert-categories"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-slate-800/50">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Label className="text-white font-medium">Campaign Updates</Label>
                <p className="text-sm text-slate-400">Notifications about campaign launches and completions</p>
              </div>
            </div>
            <Switch
              checked={campaignAlerts}
              onCheckedChange={setCampaignAlerts}
              className="data-[state=checked]:bg-primary"
              data-testid="switch-campaign-alerts"
            />
          </div>

          <Separator className="bg-slate-700" />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-slate-800/50">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Label className="text-white font-medium">Performance Alerts</Label>
                <p className="text-sm text-slate-400">Get notified of significant performance changes</p>
              </div>
            </div>
            <Switch
              checked={performanceAlerts}
              onCheckedChange={setPerformanceAlerts}
              className="data-[state=checked]:bg-primary"
              data-testid="switch-performance-alerts"
            />
          </div>

          <Separator className="bg-slate-700" />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-slate-800/50">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Label className="text-white font-medium">Billing & Subscription</Label>
                <p className="text-sm text-slate-400">Payment receipts and subscription updates</p>
              </div>
            </div>
            <Switch
              checked={billingAlerts}
              onCheckedChange={setBillingAlerts}
              className="data-[state=checked]:bg-primary"
              data-testid="switch-billing-alerts"
            />
          </div>

          <Separator className="bg-slate-700" />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-slate-800/50">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Label className="text-white font-medium">AI Recommendations</Label>
                <p className="text-sm text-slate-400">Smart suggestions to optimize your content</p>
              </div>
            </div>
            <Switch
              checked={aiRecommendations}
              onCheckedChange={setAiRecommendations}
              className="data-[state=checked]:bg-primary"
              data-testid="switch-ai-recommendations"
            />
          </div>
        </div>
      </DashboardCard>

      {/* Save Button */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          onClick={handleSave}
          className="gradient-button"
          data-testid="button-save-notifications"
        >
          Save Changes
        </Button>
      </div>
    </PageShell>
  );
}
