import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { Input } from "@/components/ui/input";

const PRESETS = {
  work: {
    name: "Work Mode",
    description: "Essential notifications only during work hours",
    icon: Briefcase,
    accentColor: '#00F0FF',
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
    accentColor: '#A78BFA',
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
    accentColor: '#22C55E',
    settings: {
      enableQuietHours: false,
      minPriority: "low",
      enableDigests: false,
      defaultFrequency: "instant",
      allowUrgentInQuietHours: true
    }
  }
};

const CHANNEL_ACCENTS: Record<string, string> = {
  email: '#00F0FF',
  inapp: '#22C55E',
  sms: '#F59E0B',
  push: '#3B82F6',
};

const sectionStyle = {
  background: '#121833',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
};

const channelCardStyle = {
  background: '#131A33',
  borderRadius: '14px',
  boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
};

const inputAreaStyle = {
  background: '#0F152B',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '12px',
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");

  const { data: preferences, isLoading: preferencesLoading } = useQuery<NotificationPreferences>({
    queryKey: ['/api/notification-preferences'],
  });

  const { data: channels = [], isLoading: channelsLoading } = useQuery<NotificationChannel[]>({
    queryKey: ['/api/notification-channels'],
  });

  const emailChannel = channels.find(c => c.channelType === 'email');
  const smsChannel = channels.find(c => c.channelType === 'sms');
  const hasEmail = !!emailChannel?.channelValue;
  const hasSMS = !!smsChannel?.channelValue;
  const emailEnabled = emailChannel?.enabled || false;
  const smsEnabled = smsChannel?.enabled || false;

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
      useHistoryBack={true}
    >
      {isLoading ? (
        <div className="p-4 sm:p-6" style={sectionStyle}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00F0FF' }} />
            <span className="ml-3" style={{ color: '#A9B4E5' }}>Loading notification settings...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Preset Modes */}
          <div className="p-4 sm:p-5 md:p-6" style={sectionStyle} data-testid="card-preset-modes">
            <div className="space-y-1 mb-5">
              <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#E6F7FF' }} data-testid="text-presets-title">
                Quick Presets
              </h2>
              <p className="text-xs sm:text-sm" style={{ color: '#A9B4E5' }}>
                Apply a preset configuration to quickly adjust all your notification settings
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {Object.entries(PRESETS).map(([key, preset]) => {
                const isActive = currentPreset === key;
                const IconComponent = preset.icon;
                return (
                  <Button
                    key={key}
                    variant="outline"
                    onClick={() => handlePresetClick(key)}
                    disabled={applyPresetMutation.isPending}
                    className={`h-auto flex flex-col items-start text-left rounded-xl sm:rounded-2xl transition-all duration-300 toggle-elevate ${isActive ? 'toggle-elevated' : ''}`}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, #0E3B44, #122B3A)'
                        : '#161C36',
                      boxShadow: isActive
                        ? '0 0 0 1px rgba(0,240,255,0.35), 0 6px 24px rgba(0,0,0,0.4)'
                        : '0 6px 24px rgba(0,0,0,0.4)',
                      borderColor: isActive ? 'rgba(0,240,255,0.35)' : 'rgba(255,255,255,0.06)',
                    }}
                    data-testid={`preset-${key}`}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <IconComponent
                        className="w-6 h-6 sm:w-7 sm:h-7"
                        style={{ color: preset.accentColor }}
                      />
                      {isActive && (
                        <CheckCircle2 className="w-5 h-5" style={{ color: '#00F0FF' }} />
                      )}
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base" style={{ color: '#E6F7FF' }}>{preset.name}</h3>
                    <p className="text-xs sm:text-sm mt-1" style={{ color: '#A9B4E5' }}>{preset.description}</p>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Main Settings Tabs */}
          <Tabs defaultValue="channels" className="space-y-6">
            <TabsList
              className="grid w-full grid-cols-4"
              style={{
                background: '#121833',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <TabsTrigger
                value="channels"
                className="data-[state=active]:text-[#E6F7FF] data-[state=inactive]:text-[#7C86B8]"
                data-testid="tab-channels"
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Channels
              </TabsTrigger>
              <TabsTrigger
                value="frequency"
                className="data-[state=active]:text-[#E6F7FF] data-[state=inactive]:text-[#7C86B8]"
                data-testid="tab-frequency"
              >
                <Zap className="w-4 h-4 mr-2" />
                Frequency
              </TabsTrigger>
              <TabsTrigger
                value="quiet-hours"
                className="data-[state=active]:text-[#E6F7FF] data-[state=inactive]:text-[#7C86B8]"
                data-testid="tab-quiet-hours"
              >
                <Moon className="w-4 h-4 mr-2" />
                Quiet Hours
              </TabsTrigger>
              <TabsTrigger
                value="filters"
                className="data-[state=active]:text-[#E6F7FF] data-[state=inactive]:text-[#7C86B8]"
                data-testid="tab-filters"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </TabsTrigger>
            </TabsList>

            <TabsContent value="channels" className="space-y-6">
              {/* Primary Channels */}
              <div className="p-4 sm:p-5 md:p-6" style={sectionStyle} data-testid="card-primary-channels">
                <div className="space-y-1 mb-5">
                  <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#E6F7FF' }} data-testid="text-channels-title">
                    Primary Notification Channels
                  </h2>
                  <p className="text-xs sm:text-sm" style={{ color: '#A9B4E5' }}>
                    Enable or disable notification channels. You'll need to verify your contact information for email and SMS.
                  </p>
                </div>
                <div className="space-y-4">
                  {/* Email Channel */}
                  <div
                    className="relative overflow-hidden p-4"
                    style={channelCardStyle}
                    data-testid="channel-email"
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[3px]"
                      style={{ backgroundColor: CHANNEL_ACCENTS.email }}
                    />
                    <div className="pl-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="p-2 rounded-lg" style={{ background: 'rgba(0,240,255,0.1)' }}>
                            <Mail className="w-5 h-5" style={{ color: CHANNEL_ACCENTS.email }} />
                          </div>
                          <div className="space-y-1 flex-1">
                            <Label className="font-medium" style={{ color: '#E6F7FF' }}>Email Notifications</Label>
                            <p className="text-sm" style={{ color: '#A9B4E5' }}>
                              {hasEmail 
                                ? `Configured: ${emailChannel?.channelValue}` 
                                : 'Receive updates via email'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {!hasEmail && (
                            <Badge variant="outline" className="text-xs" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#F59E0B' }}>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Setup Required
                            </Badge>
                          )}
                          <Switch
                            checked={hasEmail && emailEnabled}
                            onCheckedChange={handleEmailToggle}
                            className="data-[state=checked]:bg-[#00F0FF]"
                            data-testid="switch-email-notifications"
                          />
                        </div>
                      </div>
                      
                      {!hasEmail && (
                        <div className="mt-3 space-y-2 p-3" style={inputAreaStyle}>
                          <Label htmlFor="email" className="text-sm" style={{ color: '#A9B4E5' }}>Email Address</Label>
                          <div className="flex gap-2">
                            <Input
                              id="email"
                              type="email"
                              placeholder="your.email@example.com"
                              value={emailAddress}
                              onChange={(e) => setEmailAddress(e.target.value)}
                              data-testid="input-email-address"
                              className="flex-1 focus:ring-1 focus:ring-[#00F0FF]/35 focus:border-[#00F0FF]"
                              style={{ background: '#0B0E1A', border: '1px solid rgba(255,255,255,0.06)', color: '#E6F7FF' }}
                            />
                            <Button
                              onClick={handleEmailVerify}
                              disabled={createChannelMutation.isPending || !emailAddress}
                              data-testid="button-save-email"
                              className="border-0 font-semibold"
                              style={{
                                background: 'linear-gradient(135deg, #00F0FF, #00FFE5)',
                                color: '#04141C',
                              }}
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
                  </div>

                  {/* In-App Channel */}
                  <div
                    className="relative overflow-hidden p-4"
                    style={channelCardStyle}
                    data-testid="channel-inapp"
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[3px]"
                      style={{ backgroundColor: CHANNEL_ACCENTS.inapp }}
                    />
                    <div className="pl-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)' }}>
                            <Monitor className="w-5 h-5" style={{ color: CHANNEL_ACCENTS.inapp }} />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-medium" style={{ color: '#E6F7FF' }}>In-App Notifications</Label>
                            <p className="text-sm" style={{ color: '#A9B4E5' }}>See alerts within the dashboard</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="text-xs" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: 'none' }}>
                            Always Active
                          </Badge>
                          <Switch
                            checked={true}
                            disabled
                            className="data-[state=checked]:bg-[#00F0FF]"
                            data-testid="switch-inapp-notifications"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SMS Channel */}
                  <div
                    className="relative overflow-hidden p-4"
                    style={channelCardStyle}
                    data-testid="channel-sms"
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[3px]"
                      style={{ backgroundColor: CHANNEL_ACCENTS.sms }}
                    />
                    <div className="pl-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="p-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)' }}>
                            <MessageSquare className="w-5 h-5" style={{ color: CHANNEL_ACCENTS.sms }} />
                          </div>
                          <div className="space-y-1 flex-1">
                            <Label className="font-medium" style={{ color: '#E6F7FF' }}>SMS Alerts</Label>
                            <p className="text-sm" style={{ color: '#A9B4E5' }}>
                              {hasSMS 
                                ? `Configured: ${smsChannel?.channelValue}` 
                                : 'Critical alerts via text message'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {!hasSMS && (
                            <Badge variant="outline" className="text-xs" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#F59E0B' }}>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Setup Required
                            </Badge>
                          )}
                          <Switch
                            checked={hasSMS && smsEnabled}
                            onCheckedChange={handleSMSToggle}
                            className="data-[state=checked]:bg-[#00F0FF]"
                            data-testid="switch-sms-notifications"
                          />
                        </div>
                      </div>
                      
                      {!hasSMS && (
                        <div className="mt-3 space-y-2 p-3" style={inputAreaStyle}>
                          <Label htmlFor="phone" className="text-sm" style={{ color: '#A9B4E5' }}>Phone Number</Label>
                          <div className="flex gap-2">
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              data-testid="input-phone-number"
                              className="flex-1 focus:ring-1 focus:ring-[#00F0FF]/35 focus:border-[#00F0FF]"
                              style={{ background: '#0B0E1A', border: '1px solid rgba(255,255,255,0.06)', color: '#E6F7FF' }}
                            />
                            <Button
                              onClick={handleSMSVerify}
                              disabled={createChannelMutation.isPending || !phoneNumber}
                              data-testid="button-save-phone"
                              className="border-0 font-semibold"
                              style={{
                                background: 'linear-gradient(135deg, #00F0FF, #00FFE5)',
                                color: '#04141C',
                              }}
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
                          <p className="text-xs" style={{ color: '#7C86B8' }}>
                            Include country code (e.g., +1 for US)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Push Channel */}
                  <div
                    className="relative overflow-hidden p-4"
                    style={channelCardStyle}
                    data-testid="channel-push"
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[3px]"
                      style={{ backgroundColor: CHANNEL_ACCENTS.push }}
                    />
                    <div className="pl-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)' }}>
                            <Smartphone className="w-5 h-5" style={{ color: CHANNEL_ACCENTS.push }} />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-medium" style={{ color: '#E6F7FF' }}>Push Notifications</Label>
                            <p className="text-sm" style={{ color: '#A9B4E5' }}>Mobile and browser push alerts</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="text-xs" style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6', border: 'none' }}>
                            Coming Soon
                          </Badge>
                          <Switch
                            checked={false}
                            disabled
                            className="data-[state=checked]:bg-[#00F0FF]"
                            data-testid="switch-push-notifications"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
