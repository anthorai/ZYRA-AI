import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Bell, Smartphone } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { NotificationRule } from "@shared/schema";

const CATEGORY_COLORS: Record<string, string> = {
  campaigns: '#00F0FF',
  products: '#A78BFA',
  billing: '#22C55E',
  security: '#EF4444',
  ai_insights: '#06B6D4',
  system: '#F59E0B',
};

const categories = [
  { id: 'campaigns', name: 'Campaigns', description: 'Marketing campaign updates' },
  { id: 'products', name: 'Products', description: 'Product inventory and changes' },
  { id: 'billing', name: 'Billing', description: 'Payment and subscription alerts' },
  { id: 'security', name: 'Security', description: 'Login and security events' },
  { id: 'ai_insights', name: 'AI Insights', description: 'AI recommendations' },
  { id: 'system', name: 'System', description: 'System updates and maintenance' }
];

const channels = [
  { id: 'email', name: 'Email', icon: Mail, color: '#00F0FF' },
  { id: 'sms', name: 'SMS', icon: MessageSquare, color: '#F59E0B' },
  { id: 'in_app', name: 'In-App', icon: Bell, color: '#22C55E' },
  { id: 'push', name: 'Push', icon: Smartphone, color: '#3B82F6' }
];

const sectionStyle = {
  background: '#121833',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
};

export default function ChannelMatrix() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localRules, setLocalRules] = useState<Record<string, any>>({});

  const { data: rules = [], isLoading } = useQuery<NotificationRule[]>({
    queryKey: ['/api/notification-rules'],
  });

  useEffect(() => {
    if (rules && rules.length > 0) {
      const rulesMap: Record<string, any> = {};
      rules.forEach(rule => {
        rulesMap[rule.category] = rule;
      });
      
      const hasChanged = JSON.stringify(localRules) !== JSON.stringify(rulesMap);
      if (hasChanged) {
        setLocalRules(rulesMap);
      }
    }
  }, [rules]);

  const updateRuleMutation = useMutation({
    mutationFn: async ({ ruleId, updates }: { ruleId?: string; updates: any }) => {
      if (ruleId) {
        return apiRequest('PUT', `/api/notification-rules/${ruleId}`, updates);
      } else {
        return apiRequest('POST', '/api/notification-rules', updates);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-rules'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification rule",
        variant: "destructive",
      });
    },
  });

  const handleChannelToggle = async (category: string, channelId: string, enabled: boolean) => {
    const existingRule = localRules[category];
    const currentChannels = existingRule?.channels || { email: false, sms: false, in_app: true, push: false };
    
    const updatedChannels = {
      ...currentChannels,
      [channelId]: enabled
    };

    setLocalRules(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        channels: updatedChannels
      }
    }));

    if (existingRule?.id) {
      await updateRuleMutation.mutateAsync({
        ruleId: existingRule.id,
        updates: { channels: updatedChannels }
      });
    } else {
      await updateRuleMutation.mutateAsync({
        updates: {
          category,
          channels: updatedChannels,
          enabled: true,
          frequency: 'instant',
          minPriority: 'low'
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6" style={sectionStyle}>
        <div className="text-center" style={{ color: '#A9B4E5' }}>Loading channel preferences...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 md:p-6" style={sectionStyle} data-testid="card-channel-matrix">
      <div className="space-y-1 mb-5">
        <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#E6F7FF' }} data-testid="text-channel-matrix-title">
          Notification Channels
        </h2>
        <p className="text-xs sm:text-sm" style={{ color: '#A9B4E5' }}>
          Choose which channels to use for each notification category
        </p>
      </div>

      <div className="space-y-5">
        {/* Channel Legend */}
        <div
          className="flex flex-wrap gap-4 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <div key={channel.id} className="flex items-center gap-2">
                <Icon className="w-4 h-4" style={{ color: channel.color, opacity: 0.8 }} />
                <span className="text-sm" style={{ color: '#A9B4E5' }}>{channel.name}</span>
              </div>
            );
          })}
        </div>

        {/* Category Rows */}
        <div className="space-y-3">
          {categories.map((category) => {
            const rule = localRules[category.id];
            const channelStates = rule?.channels || { email: false, sms: false, in_app: true, push: false };
            const enabledCount = Object.values(channelStates).filter(Boolean).length;
            const catColor = CATEGORY_COLORS[category.id] || '#7C86B8';

            return (
              <div 
                key={category.id}
                className="relative overflow-hidden p-4 rounded-xl transition-colors"
                style={{
                  background: '#0F152B',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
                }}
                data-testid={`category-${category.id}`}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px]"
                  style={{ backgroundColor: catColor }}
                />
                <div className="pl-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Label className="font-medium" style={{ color: '#E6F7FF' }}>{category.name}</Label>
                        <Badge
                          className="text-xs no-default-hover-elevate no-default-active-elevate"
                          style={{
                            background: `${catColor}15`,
                            color: catColor,
                            border: 'none',
                          }}
                          data-testid={`badge-count-${category.id}`}
                        >
                          {enabledCount} {enabledCount === 1 ? 'channel' : 'channels'}
                        </Badge>
                      </div>
                      <p className="text-sm" style={{ color: '#A9B4E5' }}>{category.description}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      {channels.map((channel) => {
                        const Icon = channel.icon;
                        const isEnabled = channelStates[channel.id] || false;

                        return (
                          <div 
                            key={channel.id}
                            className="flex flex-col items-center gap-1"
                            data-testid={`channel-${category.id}-${channel.id}`}
                          >
                            <Icon
                              className="w-4 h-4"
                              style={{
                                color: isEnabled ? channel.color : '#2A2F45',
                                opacity: isEnabled ? 0.8 : 1,
                              }}
                            />
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) => handleChannelToggle(category.id, channel.id, checked)}
                              className="data-[state=checked]:bg-[#00F0FF]"
                              data-testid={`switch-${category.id}-${channel.id}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
