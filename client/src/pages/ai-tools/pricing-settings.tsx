import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Bell,
  Zap,
  Target,
  AlertTriangle
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const pricingSettingsSchema = z.object({
  pricingAutomationEnabled: z.boolean(),
  defaultStrategy: z.enum(['match', 'beat_by_percent', 'beat_by_amount', 'margin_based', 'custom']),
  globalMinMargin: z.coerce.number()
    .min(0, "Minimum margin must be at least 0%")
    .max(100, "Minimum margin cannot exceed 100%"),
  globalMaxDiscount: z.coerce.number()
    .min(0, "Maximum discount must be at least 0%")
    .max(100, "Maximum discount cannot exceed 100%"),
  priceUpdateFrequency: z.enum(['hourly', 'daily', 'weekly']),
  requireApproval: z.boolean(),
  approvalThreshold: z.coerce.number()
    .min(0, "Approval threshold must be at least 0%")
    .max(100, "Approval threshold cannot exceed 100%"),
  competitorScanEnabled: z.boolean(),
  maxCompetitorsPerProduct: z.number().int().min(1).max(10),
  notifyOnPriceChanges: z.boolean(),
});

type PricingSettingsForm = z.infer<typeof pricingSettingsSchema>;

interface PricingSettings extends PricingSettingsForm {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function PricingSettings() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<PricingSettings>({
    queryKey: ['/api/pricing/settings'],
  });

  const form = useForm<PricingSettingsForm>({
    resolver: zodResolver(pricingSettingsSchema),
    values: settings ? {
      pricingAutomationEnabled: settings.pricingAutomationEnabled,
      defaultStrategy: settings.defaultStrategy as any,
      globalMinMargin: typeof settings.globalMinMargin === 'string' 
        ? parseFloat(settings.globalMinMargin) 
        : settings.globalMinMargin,
      globalMaxDiscount: typeof settings.globalMaxDiscount === 'string'
        ? parseFloat(settings.globalMaxDiscount)
        : settings.globalMaxDiscount,
      priceUpdateFrequency: settings.priceUpdateFrequency as any,
      requireApproval: settings.requireApproval,
      approvalThreshold: typeof settings.approvalThreshold === 'string'
        ? parseFloat(settings.approvalThreshold)
        : settings.approvalThreshold,
      competitorScanEnabled: settings.competitorScanEnabled,
      maxCompetitorsPerProduct: settings.maxCompetitorsPerProduct,
      notifyOnPriceChanges: settings.notifyOnPriceChanges,
    } : {
      pricingAutomationEnabled: false,
      defaultStrategy: 'match',
      globalMinMargin: 10.00,
      globalMaxDiscount: 30.00,
      priceUpdateFrequency: 'daily',
      requireApproval: true,
      approvalThreshold: 10.00,
      competitorScanEnabled: true,
      maxCompetitorsPerProduct: 3,
      notifyOnPriceChanges: true,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PricingSettingsForm) => {
      const response = await apiRequest("POST", "/api/pricing/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pricing/settings'] });
      setHasChanges(false);
      toast({
        title: "Settings Saved",
        description: "Your pricing automation settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Save Settings",
        description: error.message || "An error occurred while saving your settings.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PricingSettingsForm) => {
    updateMutation.mutate(data);
  };

  const handleFormChange = () => {
    setHasChanges(true);
  };

  const automationEnabled = form.watch('pricingAutomationEnabled');
  const requireApproval = form.watch('requireApproval');
  const defaultStrategy = form.watch('defaultStrategy');

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-full">
          <div className="text-slate-300">Loading settings...</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" data-testid="heading-pricing-settings">
            <Settings className="w-8 h-8 text-blue-400" />
            Dynamic Pricing Settings
          </h1>
          <p className="text-slate-300 mt-2">
            Configure automated pricing strategies to stay competitive and maximize profit margins
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} onChange={handleFormChange}>
          {/* Master Switch */}
          <DashboardCard 
            title="Pricing Automation" 
            testId="card-pricing-automation"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="automation-enabled" className="text-base text-white">
                    Enable Pricing Automation
                  </Label>
                  <p className="text-sm text-slate-400">
                    Automatically adjust prices based on competitor data and rules
                  </p>
                </div>
                <Switch
                  id="automation-enabled"
                  checked={automationEnabled}
                  onCheckedChange={(checked) => {
                    form.setValue('pricingAutomationEnabled', checked);
                    handleFormChange();
                  }}
                  data-testid="switch-automation-enabled"
                />
              </div>

              {automationEnabled && (
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-md p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-100">
                        Automation Active
                      </p>
                      <p className="text-sm text-slate-300">
                        Prices will automatically update based on your configured rules and competitor data. 
                        Daily scans run at midnight. Changes above your approval threshold will require manual approval.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DashboardCard>

          {/* Pricing Strategy */}
          <DashboardCard 
            title="Default Pricing Strategy" 
            testId="card-pricing-strategy"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-strategy" className="text-white">
                  Strategy
                </Label>
                <Select
                  value={defaultStrategy}
                  onValueChange={(value) => {
                    form.setValue('defaultStrategy', value as any);
                    handleFormChange();
                  }}
                >
                  <SelectTrigger id="default-strategy" data-testid="select-default-strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match" data-testid="option-match">Match Competitor Price</SelectItem>
                    <SelectItem value="beat_by_percent" data-testid="option-beat-percent">Beat by Percentage</SelectItem>
                    <SelectItem value="beat_by_amount" data-testid="option-beat-amount">Beat by Fixed Amount</SelectItem>
                    <SelectItem value="margin_based" data-testid="option-margin">Maintain Target Margin</SelectItem>
                    <SelectItem value="custom" data-testid="option-custom">Custom Rules</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-400">
                  {defaultStrategy === 'match' && 'Match the lowest competitor price'}
                  {defaultStrategy === 'beat_by_percent' && 'Price below competitors by a percentage'}
                  {defaultStrategy === 'beat_by_amount' && 'Price below competitors by a fixed dollar amount'}
                  {defaultStrategy === 'margin_based' && 'Maintain your target profit margin'}
                  {defaultStrategy === 'custom' && 'Use custom pricing rules for each product'}
                </p>
              </div>
            </div>
          </DashboardCard>

          {/* Safety Limits */}
          <DashboardCard 
            title="Safety Limits" 
            testId="card-safety-limits"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-margin" className="text-white">
                    Minimum Profit Margin (%)
                  </Label>
                  <Input
                    id="min-margin"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...form.register('globalMinMargin', { valueAsNumber: true })}
                    data-testid="input-min-margin"
                  />
                  <p className="text-sm text-slate-400">
                    Never price below this profit margin
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-discount" className="text-white">
                    Maximum Discount (%)
                  </Label>
                  <Input
                    id="max-discount"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...form.register('globalMaxDiscount', { valueAsNumber: true })}
                    data-testid="input-max-discount"
                  />
                  <p className="text-sm text-slate-400">
                    Maximum discount from original price
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="require-approval" className="text-base text-white">
                      Require Manual Approval
                    </Label>
                    <p className="text-sm text-slate-400">
                      Require approval for price changes above threshold
                    </p>
                  </div>
                  <Switch
                    id="require-approval"
                    checked={requireApproval}
                    onCheckedChange={(checked) => {
                      form.setValue('requireApproval', checked);
                      handleFormChange();
                    }}
                    data-testid="switch-require-approval"
                  />
                </div>

                {requireApproval && (
                  <div className="space-y-2">
                    <Label htmlFor="approval-threshold" className="text-white">
                      Approval Threshold (%)
                    </Label>
                    <Input
                      id="approval-threshold"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...form.register('approvalThreshold', { valueAsNumber: true })}
                      data-testid="input-approval-threshold"
                    />
                    <p className="text-sm text-slate-400">
                      Price changes above this percentage require approval
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DashboardCard>

          {/* Competitor Scanning */}
          <DashboardCard 
            title="Competitor Monitoring" 
            testId="card-competitor-monitoring"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="competitor-scan" className="text-base text-white">
                    Enable Competitor Scanning
                  </Label>
                  <p className="text-sm text-slate-400">
                    Automatically monitor competitor prices
                  </p>
                </div>
                <Switch
                  id="competitor-scan"
                  checked={form.watch('competitorScanEnabled')}
                  onCheckedChange={(checked) => {
                    form.setValue('competitorScanEnabled', checked);
                    handleFormChange();
                  }}
                  data-testid="switch-competitor-scan"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scan-frequency" className="text-white">
                    Scan Frequency
                  </Label>
                  <Select
                    value={form.watch('priceUpdateFrequency')}
                    onValueChange={(value) => {
                      form.setValue('priceUpdateFrequency', value as any);
                      handleFormChange();
                    }}
                  >
                    <SelectTrigger id="scan-frequency" data-testid="select-scan-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly" data-testid="option-hourly">Hourly</SelectItem>
                      <SelectItem value="daily" data-testid="option-daily">Daily (Recommended)</SelectItem>
                      <SelectItem value="weekly" data-testid="option-weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-competitors" className="text-white">
                    Competitors per Product
                  </Label>
                  <Input
                    id="max-competitors"
                    type="number"
                    min="1"
                    max="10"
                    {...form.register('maxCompetitorsPerProduct', { valueAsNumber: true })}
                    data-testid="input-max-competitors"
                  />
                  <p className="text-sm text-slate-400">
                    Maximum competitors to track per product
                  </p>
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* Notifications */}
          <DashboardCard 
            title="Notifications" 
            testId="card-notifications"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notify-changes" className="text-base text-white">
                    Price Change Notifications
                  </Label>
                  <p className="text-sm text-slate-400">
                    Get notified when prices are automatically adjusted
                  </p>
                </div>
                <Switch
                  id="notify-changes"
                  checked={form.watch('notifyOnPriceChanges')}
                  onCheckedChange={(checked) => {
                    form.setValue('notifyOnPriceChanges', checked);
                    handleFormChange();
                  }}
                  data-testid="switch-notify-changes"
                />
              </div>
            </div>
          </DashboardCard>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-slate-400">
              {hasChanges && "You have unsaved changes"}
            </p>
            <Button 
              type="submit"
              disabled={updateMutation.isPending || !hasChanges}
              data-testid="button-save-settings"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
