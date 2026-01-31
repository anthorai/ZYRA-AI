import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck,
  Info,
  Loader2,
  TrendingUp,
  Zap,
  Shield,
  Activity,
} from "lucide-react";

interface RevenueImmuneData {
  isActive: boolean;
  sensitivity: "safe" | "balanced" | "aggressive";
  preventedRevenue: number;
  currency: string;
}

interface AutomationSettings {
  globalAutopilotEnabled: boolean;
  autopilotMode: string;
}

export default function RevenueImmuneCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);

  const { data: immuneData, isLoading: isLoadingImmune } = useQuery<RevenueImmuneData>({
    queryKey: ['/api/revenue-immune/status'],
  });

  const { data: settings, isLoading: isLoadingSettings } = useQuery<AutomationSettings>({
    queryKey: ['/api/automation/settings'],
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest('PATCH', '/api/automation/settings', { globalAutopilotEnabled: enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/revenue-immune/status'] });
      toast({
        title: immuneData?.isActive ? "Revenue Protection Paused" : "Revenue Protection Active",
        description: immuneData?.isActive 
          ? "Your store is no longer being protected automatically."
          : "ZYRA will now silently protect your revenue 24/7.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update protection status.",
        variant: "destructive",
      });
    },
  });

  const sensitivityMutation = useMutation({
    mutationFn: async (mode: string) => {
      return apiRequest('PATCH', '/api/automation/settings', { autopilotMode: mode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/revenue-immune/status'] });
      toast({
        title: "Sensitivity Updated",
        description: "Protection sensitivity has been adjusted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update sensitivity.",
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingImmune || isLoadingSettings;
  const isActive = settings?.globalAutopilotEnabled ?? false;
  const sensitivity = (settings?.autopilotMode as "safe" | "balanced" | "aggressive") ?? "balanced";
  const preventedRevenue = immuneData?.preventedRevenue ?? 0;
  const currency = immuneData?.currency ?? "₹";

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `${currency}${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `${currency}${(amount / 1000).toFixed(1)}K`;
    }
    return `${currency}${amount.toFixed(0)}`;
  };

  const sensitivityLabels = {
    safe: "Conservative",
    balanced: "Balanced", 
    aggressive: "Aggressive",
  };

  const sensitivityDescriptions = {
    safe: "Only act on high-confidence issues. Minimal changes, maximum safety.",
    balanced: "Balanced approach. Act when reasonably confident.",
    aggressive: "Act quickly on emerging issues. More proactive protection.",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6" data-testid="revenue-immune-container">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isActive ? 'bg-green-500/20' : 'bg-muted'}`}>
                <ShieldCheck className={`w-6 h-6 ${isActive ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-immune-title">
                  Revenue Immune System
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={isActive ? "default" : "secondary"}
                    className={isActive ? "bg-green-500/20 text-green-500 border-green-500/30" : ""}
                    data-testid="badge-immune-status"
                  >
                    {isActive ? "ACTIVE" : "PAUSED"}
                  </Badge>
                  <Dialog open={learnMoreOpen} onOpenChange={setLearnMoreOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                        data-testid="button-learn-more"
                      >
                        <Info className="w-3 h-3 mr-1" />
                        Learn more
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-primary" />
                          Revenue Immune System
                        </DialogTitle>
                        <DialogDescription className="text-left space-y-4 pt-4">
                          <p>
                            The Revenue Immune System is your store's silent guardian. It continuously monitors 
                            for revenue-threatening patterns and fixes them automatically before they hurt your sales.
                          </p>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Activity className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-foreground">24/7 Monitoring</p>
                                <p className="text-sm text-muted-foreground">Watches for content decay, SEO erosion, and copy fatigue</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-foreground">Silent Fixes</p>
                                <p className="text-sm text-muted-foreground">Automatically updates titles, descriptions, and meta tags</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-foreground">Safe & Reversible</p>
                                <p className="text-sm text-muted-foreground">All changes are versioned and can be rolled back instantly</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground border-t pt-4">
                            Think of it like an immune system: it works in the background so you don't have to.
                            You can be inactive for weeks and your store stays protected.
                          </p>
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Protection</span>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => toggleMutation.mutate(checked)}
                disabled={toggleMutation.isPending}
                data-testid="switch-immune-toggle"
              />
            </div>
          </div>

          <div className="bg-card/50 rounded-xl p-6 border border-border/50 mb-6">
            <p className="text-sm text-muted-foreground mb-2">Revenue loss prevented this month</p>
            <div className="flex items-baseline gap-2">
              <span 
                className="text-4xl sm:text-5xl font-bold text-foreground"
                data-testid="text-prevented-revenue"
              >
                {formatCurrency(preventedRevenue)}
              </span>
              {preventedRevenue > 0 && (
                <div className="flex items-center gap-1 text-green-500">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-medium">protected</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm font-medium text-foreground">Protection Sensitivity</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sensitivityDescriptions[sensitivity]}
              </p>
            </div>
            <Select
              value={sensitivity}
              onValueChange={(value) => sensitivityMutation.mutate(value)}
              disabled={sensitivityMutation.isPending || !isActive}
            >
              <SelectTrigger 
                className="w-[160px]" 
                data-testid="select-sensitivity"
              >
                <SelectValue placeholder="Select sensitivity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="safe" data-testid="option-conservative">
                  Conservative
                </SelectItem>
                <SelectItem value="balanced" data-testid="option-balanced">
                  Balanced
                </SelectItem>
                <SelectItem value="aggressive" data-testid="option-aggressive">
                  Aggressive
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!isActive && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Protection is paused</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your store is not being automatically protected. Revenue decay may go undetected.
                Turn on protection to let ZYRA guard your revenue 24/7.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
