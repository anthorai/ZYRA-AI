import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, Zap, Shield, Activity, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AutomationSettings {
  autopilotEnabled: boolean;
  autopilotMode: 'safe' | 'balanced' | 'aggressive';
  autoPublishEnabled: boolean;
  maxDailyActions: number;
  maxCatalogChangePercent: number;
}

export default function AutopilotSettings() {
  const { toast } = useToast();

  // Fetch automation settings
  const { data: settings, isLoading } = useQuery<AutomationSettings>({
    queryKey: ['/api/automation/settings'],
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (updates: any) => {
      return await apiRequest('/api/automation/settings', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/settings'] });
      toast({
        title: "Settings updated",
        description: "Your autopilot settings have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleToggleAutopilot = async (enabled: boolean) => {
    await updateSettings.mutateAsync({
      autopilotEnabled: enabled,
    });
  };

  const handleModeChange = async (mode: string) => {
    await updateSettings.mutateAsync({
      autopilotMode: mode,
    });
  };

  const handlePublishToggle = async (enabled: boolean) => {
    await updateSettings.mutateAsync({
      autoPublishEnabled: enabled,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      </div>
    );
  }

  const isAutopilotEnabled = settings?.autopilotEnabled || false;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Autopilot Settings</h1>
        <p className="text-muted-foreground">
          Configure your AI Store Manager to work autonomously while you sleep
        </p>
      </div>

      {/* Main Autopilot Toggle */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Autonomous Mode</CardTitle>
              <CardDescription>
                Enable AI to automatically optimize your store
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label htmlFor="autopilot-toggle" className="text-base font-medium">
                Enable Autopilot
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                AI will scan your store daily and make optimizations automatically
              </p>
            </div>
            <Switch
              id="autopilot-toggle"
              data-testid="switch-autopilot"
              checked={isAutopilotEnabled}
              onCheckedChange={handleToggleAutopilot}
            />
          </div>

          {isAutopilotEnabled && (
            <Alert className="mt-4">
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Autopilot is active! Your store will be monitored and optimized automatically.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Mode Selection */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Optimization Mode</CardTitle>
              <CardDescription>
                Choose how aggressively AI should optimize
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mode-select">Mode</Label>
            <Select
              value={settings?.autopilotMode || 'safe'}
              onValueChange={handleModeChange}
              disabled={!isAutopilotEnabled}
            >
              <SelectTrigger id="mode-select" data-testid="select-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="safe" data-testid="option-safe">
                  Safe - Review before publishing
                </SelectItem>
                <SelectItem value="balanced" data-testid="option-balanced">
                  Balanced - Auto-publish low-risk changes
                </SelectItem>
                <SelectItem value="aggressive" data-testid="option-aggressive">
                  Aggressive - Auto-publish everything
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-muted rounded-md space-y-2">
            <div className="font-medium">
              {settings?.autopilotMode === 'safe' && '🛡️ Safe Mode'}
              {settings?.autopilotMode === 'balanced' && '⚖️ Balanced Mode'}
              {settings?.autopilotMode === 'aggressive' && '🚀 Aggressive Mode'}
            </div>
            <p className="text-sm text-muted-foreground">
              {settings?.autopilotMode === 'safe' &&
                'AI will generate optimizations but wait for your approval before publishing to Shopify.'}
              {settings?.autopilotMode === 'balanced' &&
                'AI will automatically publish SEO improvements but hold higher-impact changes for review.'}
              {settings?.autopilotMode === 'aggressive' &&
                'AI will automatically publish all optimizations immediately. Maximum automation.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Publish Toggle */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Auto-Publish</CardTitle>
              <CardDescription>
                Automatically publish optimizations to Shopify
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-publish-toggle" className="text-base font-medium">
                Enable Auto-Publish
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Changes will go live immediately without manual review
              </p>
            </div>
            <Switch
              id="auto-publish-toggle"
              data-testid="switch-auto-publish"
              checked={settings?.autoPublishEnabled || false}
              onCheckedChange={handlePublishToggle}
              disabled={!isAutopilotEnabled}
            />
          </div>

          {settings?.autoPublishEnabled && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Auto-publish is enabled. Changes will go live immediately. You can rollback any change from the Activity Timeline.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Safety Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Limits</CardTitle>
          <CardDescription>
            Prevent runaway automation with smart limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Max Daily Actions</Label>
              <div className="text-2xl font-bold">{settings?.maxDailyActions || 10}</div>
              <p className="text-xs text-muted-foreground">Per day</p>
            </div>
            <div>
              <Label className="text-sm">Max Catalog Change</Label>
              <div className="text-2xl font-bold">{settings?.maxCatalogChangePercent || 5}%</div>
              <p className="text-xs text-muted-foreground">Of total products</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
