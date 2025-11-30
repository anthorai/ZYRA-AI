import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Bell, Smartphone } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { NotificationRule } from "@shared/schema";

const categories = [
  { id: 'campaigns', name: 'Campaigns', description: 'Marketing campaign updates' },
  { id: 'products', name: 'Products', description: 'Product inventory and changes' },
  { id: 'billing', name: 'Billing', description: 'Payment and subscription alerts' },
  { id: 'security', name: 'Security', description: 'Login and security events' },
  { id: 'ai_insights', name: 'AI Insights', description: 'AI recommendations' },
  { id: 'system', name: 'System', description: 'System updates and maintenance' }
];

const channels = [
  { id: 'email', name: 'Email', icon: Mail, color: 'text-blue-400' },
  { id: 'sms', name: 'SMS', icon: MessageSquare, color: 'text-green-400' },
  { id: 'in_app', name: 'In-App', icon: Bell, color: 'text-purple-400' },
  { id: 'push', name: 'Push', icon: Smartphone, color: 'text-orange-400' }
];

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
      
      // Only update if there's actually a difference
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
      <Card className="gradient-card border-0">
        <CardContent className="p-6">
          <div className="text-center text-slate-400">Loading channel preferences...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card border-0">
      <CardHeader>
        <CardTitle className="text-white">Notification Channels</CardTitle>
        <CardDescription className="text-slate-400">
          Choose which channels to use for each notification category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Channel Legend */}
          <div className="flex flex-wrap gap-3 pb-4 border-b border/30">
            {channels.map((channel) => {
              const Icon = channel.icon;
              return (
                <div key={channel.id} className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${channel.color}`} />
                  <span className="text-sm text-slate-300">{channel.name}</span>
                </div>
              );
            })}
          </div>

          {/* Category Rows */}
          <div className="space-y-4">
            {categories.map((category) => {
              const rule = localRules[category.id];
              const channelStates = rule?.channels || { email: false, sms: false, in_app: true, push: false };
              const enabledCount = Object.values(channelStates).filter(Boolean).length;

              return (
                <div 
                  key={category.id}
                  className="p-4 rounded-lg bg-slate-800/30 border border/20 hover:border/40 transition-colors"
                  data-testid={`category-${category.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Label className="text-white font-medium">{category.name}</Label>
                        <Badge variant="outline" className="text-xs" data-testid={`badge-count-${category.id}`}>
                          {enabledCount} {enabledCount === 1 ? 'channel' : 'channels'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">{category.description}</p>
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
                            <Icon className={`w-4 h-4 ${isEnabled ? channel.color : 'text-slate-600'}`} />
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) => handleChannelToggle(category.id, channel.id, checked)}
                              className="data-[state=checked]:bg-primary"
                              data-testid={`switch-${category.id}-${channel.id}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
