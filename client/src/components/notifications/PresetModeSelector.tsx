import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BriefcaseBusiness, Focus, Bell, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NotificationPreferences } from "@shared/schema";

interface PresetModeProps {
  currentPreferences: NotificationPreferences | undefined;
}

export default function PresetModeSelector({ currentPreferences }: PresetModeProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const applyPresetMutation = useMutation({
    mutationFn: async (preset: string) => {
      return apiRequest('POST', '/api/notification-preferences/preset', { preset });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-preferences'] });
      toast({
        title: "Preset Applied",
        description: "Your notification preferences have been updated",
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

  const presets = [
    {
      id: 'work',
      name: 'Work Mode',
      description: 'Business hours only, hourly digests',
      icon: BriefcaseBusiness,
      features: [
        'Hourly notification digests',
        'Medium priority and above',
        'Quiet hours: 6PM - 9AM',
        'Urgent alerts always shown'
      ],
      color: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40'
    },
    {
      id: 'focus',
      name: 'Focus Mode',
      description: 'Daily digest, urgent alerts only',
      icon: Focus,
      features: [
        'Daily digest at 9AM',
        'Urgent notifications only',
        'Do Not Disturb enabled',
        'Critical alerts only'
      ],
      color: 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40'
    },
    {
      id: 'full_alerts',
      name: 'Full Alerts',
      description: 'Instant notifications, all priorities',
      icon: Bell,
      features: [
        'Instant notifications',
        'All priority levels',
        'No quiet hours',
        'Every update in real-time'
      ],
      color: 'bg-green-500/10 border-green-500/20 hover:border-green-500/40'
    }
  ];

  const activePreset = currentPreferences?.activePreset || 'full_alerts';

  return (
    <Card className="gradient-card border-0">
      <CardHeader>
        <CardTitle className="text-white">Quick Preset Modes</CardTitle>
        <CardDescription className="text-slate-400">
          Choose a preset to instantly configure your notification preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presets.map((preset) => {
            const Icon = preset.icon;
            const isActive = activePreset === preset.id;

            return (
              <div
                key={preset.id}
                className={`relative border rounded-lg p-4 transition-all ${preset.color} ${
                  isActive ? 'ring-2 ring-primary' : ''
                }`}
                data-testid={`preset-${preset.id}`}
              >
                {isActive && (
                  <Badge 
                    className="absolute -top-2 -right-2 bg-primary text-primary-foreground"
                    data-testid={`badge-active-${preset.id}`}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
                
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-slate-800/50">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{preset.name}</h3>
                    <p className="text-sm text-slate-400">{preset.description}</p>
                  </div>
                </div>

                <ul className="space-y-1 mb-4">
                  {preset.features.map((feature, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isActive ? "outline" : "default"}
                  className="w-full"
                  onClick={() => applyPresetMutation.mutate(preset.id)}
                  disabled={isActive || applyPresetMutation.isPending}
                  data-testid={`button-apply-${preset.id}`}
                >
                  {applyPresetMutation.isPending ? 'Applying...' : isActive ? 'Current Mode' : 'Apply Preset'}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
