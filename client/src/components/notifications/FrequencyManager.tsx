import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Zap, Calendar, Inbox } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { NotificationRule } from "@shared/schema";

const categories = [
  { id: 'campaigns', name: 'Campaigns' },
  { id: 'products', name: 'Products' },
  { id: 'billing', name: 'Billing' },
  { id: 'security', name: 'Security' },
  { id: 'ai_insights', name: 'AI Insights' },
  { id: 'system', name: 'System' }
];

const frequencies = [
  { value: 'instant', label: 'Instant', description: 'Receive immediately', icon: Zap, color: 'text-green-400' },
  { value: 'hourly_digest', label: 'Hourly Digest', description: 'Bundled every hour', icon: Clock, color: 'text-blue-400' },
  { value: 'daily_digest', label: 'Daily Digest', description: 'Once per day at 9 AM', icon: Calendar, color: 'text-purple-400' },
  { value: 'weekly_summary', label: 'Weekly Summary', description: 'Monday mornings', icon: Inbox, color: 'text-orange-400' }
];

export default function FrequencyManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localRules, setLocalRules] = useState<Record<string, any>>({});

  const { data: rules = [] } = useQuery<NotificationRule[]>({
    queryKey: ['/api/notification-rules'],
  });

  useEffect(() => {
    if (rules) {
      const rulesMap: Record<string, any> = {};
      rules.forEach(rule => {
        rulesMap[rule.category] = rule;
      });
      setLocalRules(rulesMap);
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
      toast({
        title: "Frequency Updated",
        description: "Notification frequency has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update frequency",
        variant: "destructive",
      });
    },
  });

  const handleFrequencyChange = async (category: string, frequency: string) => {
    const existingRule = localRules[category];

    setLocalRules(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        frequency
      }
    }));

    if (existingRule?.id) {
      await updateRuleMutation.mutateAsync({
        ruleId: existingRule.id,
        updates: { frequency }
      });
    } else {
      await updateRuleMutation.mutateAsync({
        updates: {
          category,
          channels: { email: false, sms: false, in_app: true, push: false },
          enabled: true,
          frequency,
          minPriority: 'low'
        }
      });
    }
  };

  return (
    <Card className="gradient-card border-0">
      <CardHeader>
        <CardTitle className="text-white">Notification Frequency</CardTitle>
        <CardDescription className="text-slate-400">
          Control how often you receive notifications for each category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Frequency Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-4 border-b border-border/30">
            {frequencies.map((freq) => {
              const Icon = freq.icon;
              return (
                <div key={freq.value} className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 mt-0.5 ${freq.color}`} />
                  <div>
                    <div className="text-sm font-medium text-white">{freq.label}</div>
                    <div className="text-xs text-slate-400">{freq.description}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category Frequency Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => {
              const rule = localRules[category.id];
              const currentFrequency = rule?.frequency || 'instant';
              const selectedFreq = frequencies.find(f => f.value === currentFrequency);
              const Icon = selectedFreq?.icon || Zap;

              return (
                <div 
                  key={category.id}
                  className="p-4 rounded-lg bg-slate-800/30 border border-border/20"
                  data-testid={`frequency-${category.id}`}
                >
                  <Label className="text-white font-medium mb-2 block">{category.name}</Label>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${selectedFreq?.color || 'text-slate-400'}`} />
                    <Select
                      value={currentFrequency}
                      onValueChange={(value) => handleFrequencyChange(category.id, value)}
                    >
                      <SelectTrigger 
                        className="flex-1 bg-slate-800/50 border-border/40"
                        data-testid={`select-frequency-${category.id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencies.map((freq) => (
                          <SelectItem 
                            key={freq.value} 
                            value={freq.value}
                            data-testid={`option-${category.id}-${freq.value}`}
                          >
                            <div className="flex items-center gap-2">
                              <freq.icon className={`w-4 h-4 ${freq.color}`} />
                              <span>{freq.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
