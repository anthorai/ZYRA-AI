import { useState, useEffect } from "react";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, Smartphone, Monitor, MessageSquare, 
  Zap, Moon, Filter, Settings2, CheckCircle2,
  AlertCircle, Loader2, Briefcase, Target, Bell
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { NotificationPreferences, NotificationChannel } from "@shared/schema";
import ChannelMatrix from "@/components/notifications/ChannelMatrix";
import FrequencyManager from "@/components/notifications/FrequencyManager";
import QuietHoursBuilder from "@/components/notifications/QuietHoursBuilder";
import PriorityFilter from "@/components/notifications/PriorityFilter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Preset configurations
const PRESETS = {
  work: {
    name: "Work Mode",
    description: "Essential notifications only during work hours",
    icon: Briefcase,
    iconColor: "text-blue-400",
    settings: {
      enableQuietHours: true,
      quietHoursStart: "18:00",
      quietHoursEnd: "08:00",
      minPriority: "medium",
      enableDigests: true,
      defaultFrequency: "hourly_digest",
      allowUrgentInQuietHours: true
    }
  },
  focus: {
    name: "Focus Mode",
    description: "Critical alerts only, minimize distractions",
    icon: Target,
    iconColor: "text-purple-400",
    settings: {
      enableQuietHours: false,
      minPriority: "high",
      enableDigests: true,
      defaultFrequency: "daily_digest",
      allowUrgentInQuietHours: true
    }
  },
  full_alerts: {
    name: "Full Alerts",
    description: "Receive all notifications instantly",
    icon: Bell,
    iconColor: "text-green-400",
    settings: {
      enableQuietHours: false,
      minPriority: "low",
      enableDigests: false,
      defaultFrequency: "instant",
      allowUrgentInQuietHours: true
    }
  }
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Channel verification state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");

  // Fetch user preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery<NotificationPreferences>({
    queryKey: ['/api/notification-preferences'],
  });

  // Fetch notification channels
  const { data: channels = [], isLoading: channelsLoading } = useQuery<NotificationChannel[]>({
    queryKey: ['/api/notification-channels'],
  });

  const emailChannel = channels.find(c => c.channelType === 'email');
  const smsChannel = channels.find(c => c.channelType === 'sms');
  const hasEmail = !!emailChannel?.channelValue;
  const hasSMS = !!smsChannel?.channelValue;
  const emailEnabled = emailChannel?.enabled || false;
  const smsEnabled = smsChannel?.enabled || false;

  // Apply preset mode mutation
  const applyPresetMutation = useMutation({
    mutationFn: async (preset: string) => {
      return apiRequest('POST', '/api/notification-preferences/preset', { preset });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-preferences'] });
      toast({
        title: "Preset Applied",
        description: "Your notification settings have been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to apply preset",
        variant: "destructive",
      });
    },
  });

  // Channel mutations
  const updateChannelMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return apiRequest('PUT', `/api/notification-channels/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-channels'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update channel",
        variant: "destructive",
      });
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/notification-channels', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-channels'] });
      toast({
        title: "Channel Added",
        description: "Notification channel has been configured",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add channel",
        variant: "destructive",
      });
    },
  });

  const handleEmailToggle = (checked: boolean) => {
    if (!hasEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address below to enable notifications",
        variant: "default",
      });
      return;
    }
    if (emailChannel) {
      updateChannelMutation.mutate({
        id: emailChannel.id,
        updates: { enabled: checked }
      });
    }
  };

  const handleSMSToggle = (checked: boolean) => {
    if (!hasSMS) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number below to enable SMS notifications",
        variant: "default",
      });
      return;
    }
    if (smsChannel) {
      updateChannelMutation.mutate({
        id: smsChannel.id,
        updates: { enabled: checked }
      });
    }
  };

  const handleEmailVerify = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    await createChannelMutation.mutateAsync({
      channelType: 'email',
      channelValue: emailAddress,
      enabled: true,
      isPrimary: true
    });
    setEmailAddress("");
  };

  const handleSMSVerify = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    await createChannelMutation.mutateAsync({
      channelType: 'sms',
      channelValue: phoneNumber,
      enabled: true,
      isPrimary: true
    });
    setPhoneNumber("");
  };

  const handlePresetClick = (preset: string) => {
    applyPresetMutation.mutate(preset);
  };

  const isLoading = preferencesLoading || channelsLoading;
  const currentPreset = preferences?.activePreset || 'full_alerts';

  return (
    <PageShell
      title="Notification Settings"
      subtitle="Manage how and when you receive notifications"
      maxWidth="xl"
      spacing="normal"
    >
      {isLoading ? (
        <DashboardCard>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading notification settings...</span>
          </div>
        </DashboardCard>
      ) : (
        <>
          {/* Quick Preset Modes */}
          <DashboardCard
            title="Quick Presets"
            description="Apply a preset configuration to quickly adjust all your notification settings"
            testId="card-preset-modes"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(PRESETS).map(([key, preset]) => {
                const isActive = currentPreset === key;
                const IconComponent = preset.icon;
                return (
                  <button
                    key={key}
                    onClick={() => handlePresetClick(key)}
                    disabled={applyPresetMutation.isPending}
                    className={`
                      relative p-6 rounded-lg border-2 transition-all text-left
                      ${isActive 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border/30 bg-slate-800/30 hover:border-border/60'
                      }
                      ${applyPresetMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    data-testid={`preset-${key}`}
                  >
                    {isActive && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="mb-3">
                      <IconComponent className={`w-8 h-8 ${preset.iconColor}`} />
                    </div>
                    <h3 className="text-white font-semibold mb-1">{preset.name}</h3>
                    <p className="text-sm text-slate-400">{preset.description}</p>
                  </button>
                );
              })}
            </div>
          </DashboardCard>

          {/* Main Settings Tabs */}
          <Tabs defaultValue="channels" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
              <TabsTrigger value="channels" data-testid="tab-channels">
                <Settings2 className="w-4 h-4 mr-2" />
                Channels
              </TabsTrigger>
              <TabsTrigger value="frequency" data-testid="tab-frequency">
                <Zap className="w-4 h-4 mr-2" />
                Frequency
              </TabsTrigger>
              <TabsTrigger value="quiet-hours" data-testid="tab-quiet-hours">
                <Moon className="w-4 h-4 mr-2" />
                Quiet Hours
              </TabsTrigger>
              <TabsTrigger value="filters" data-testid="tab-filters">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </TabsTrigger>
            </TabsList>

            <TabsContent value="channels" className="space-y-6">
              {/* Primary Channels */}
              <DashboardCard
                title="Primary Notification Channels"
                description="Enable or disable notification channels. You'll need to verify your contact information for email and SMS."
                testId="card-primary-channels"
              >
                <div className="space-y-6">
                  {/* Email */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="p-2 rounded-lg bg-slate-800/50">
                          <Mail className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <Label className="text-white font-medium">Email Notifications</Label>
                          <p className="text-sm text-slate-400">
                            {hasEmail 
                              ? `Configured: ${emailChannel?.channelValue}` 
                              : 'Receive updates via email'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!hasEmail && (
                          <Badge variant="outline" className="text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Setup Required
                          </Badge>
                        )}
                        <Switch
                          checked={hasEmail && emailEnabled}
                          onCheckedChange={handleEmailToggle}
                          className="data-[state=checked]:bg-primary"
                          data-testid="switch-email-notifications"
                        />
                      </div>
                    </div>
                    
                    {/* Inline Email Input - Show when not configured */}
                    {!hasEmail && (
                      <div className="ml-14 space-y-2 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                        <Label htmlFor="email" className="text-sm text-slate-300">Email Address</Label>
                        <div className="flex gap-2">
                          <Input
                            id="email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={emailAddress}
                            onChange={(e) => setEmailAddress(e.target.value)}
                            data-testid="input-email-address"
                            className="flex-1"
                          />
                          <Button
                            onClick={handleEmailVerify}
                            disabled={createChannelMutation.isPending || !emailAddress}
                            data-testid="button-save-email"
                          >
                            {createChannelMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-slate-700" />

                  {/* In-App (Always Available) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-slate-800/50">
                        <Monitor className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white font-medium">In-App Notifications</Label>
                        <p className="text-sm text-slate-400">See alerts within the dashboard</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                        Always Active
                      </Badge>
                      <Switch
                        checked={true}
                        disabled
                        className="data-[state=checked]:bg-primary"
                        data-testid="switch-inapp-notifications"
                      />
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  {/* SMS */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="p-2 rounded-lg bg-slate-800/50">
                          <MessageSquare className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <Label className="text-white font-medium">SMS Alerts</Label>
                          <p className="text-sm text-slate-400">
                            {hasSMS 
                              ? `Configured: ${smsChannel?.channelValue}` 
                              : 'Critical alerts via text message'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!hasSMS && (
                          <Badge variant="outline" className="text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Setup Required
                          </Badge>
                        )}
                        <Switch
                          checked={hasSMS && smsEnabled}
                          onCheckedChange={handleSMSToggle}
                          className="data-[state=checked]:bg-primary"
                          data-testid="switch-sms-notifications"
                        />
                      </div>
                    </div>
                    
                    {/* Inline SMS Input - Show when not configured */}
                    {!hasSMS && (
                      <div className="ml-14 space-y-2 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                        <Label htmlFor="phone" className="text-sm text-slate-300">Phone Number</Label>
                        <div className="flex gap-2">
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            data-testid="input-phone-number"
                            className="flex-1"
                          />
                          <Button
                            onClick={handleSMSVerify}
                            disabled={createChannelMutation.isPending || !phoneNumber}
                            data-testid="button-save-phone"
                          >
                            {createChannelMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save'
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-slate-400">
                          Include country code (e.g., +1 for US)
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-slate-700" />

                  {/* Push (Coming Soon) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-slate-800/50">
                        <Smartphone className="w-5 h-5 text-orange-400" />
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
                        checked={false}
                        disabled
                        className="data-[state=checked]:bg-primary"
                        data-testid="switch-push-notifications"
                      />
                    </div>
                  </div>
                </div>
              </DashboardCard>

              {/* Channel Matrix */}
              <ChannelMatrix />
            </TabsContent>

            <TabsContent value="frequency" className="space-y-6">
              <FrequencyManager />
            </TabsContent>

            <TabsContent value="quiet-hours" className="space-y-6">
              <QuietHoursBuilder />
            </TabsContent>

            <TabsContent value="filters" className="space-y-6">
              <PriorityFilter />
            </TabsContent>
          </Tabs>
        </>
      )}

    </PageShell>
  );
}
