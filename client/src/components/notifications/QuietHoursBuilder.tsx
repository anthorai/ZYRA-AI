import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Moon, Sun, Bell } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { NotificationPreferences } from "@shared/schema";

export default function QuietHoursBuilder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preferences } = useQuery<NotificationPreferences>({
    queryKey: ['/api/notification-preferences'],
  });

  const [enabled, setEnabled] = useState(false);
  const [startHour, setStartHour] = useState(22);
  const [endHour, setEndHour] = useState(8);
  const [allowUrgent, setAllowUrgent] = useState(true);

  useEffect(() => {
    if (preferences) {
      setEnabled(preferences.enableQuietHours || false);
      setAllowUrgent(preferences.allowUrgentInQuietHours || true);
      
      if (preferences.quietHoursStart) {
        const [hours] = preferences.quietHoursStart.split(':');
        setStartHour(parseInt(hours));
      }
      if (preferences.quietHoursEnd) {
        const [hours] = preferences.quietHoursEnd.split(':');
        setEndHour(parseInt(hours));
      }
    }
  }, [preferences]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: any) => {
      return apiRequest('PUT', '/api/notification-preferences', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-preferences'] });
      toast({
        title: "Quiet Hours Updated",
        description: "Your Do Not Disturb schedule has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quiet hours",
        variant: "destructive",
      });
    },
  });

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    updatePreferencesMutation.mutate({
      enableQuietHours: checked,
      quietHoursStart: `${startHour.toString().padStart(2, '0')}:00`,
      quietHoursEnd: `${endHour.toString().padStart(2, '0')}:00`,
      allowUrgentInQuietHours: allowUrgent
    });
  };

  const handleStartHourChange = (value: number[]) => {
    const newStartHour = value[0];
    setStartHour(newStartHour);
    updatePreferencesMutation.mutate({
      enableQuietHours: enabled,
      quietHoursStart: `${newStartHour.toString().padStart(2, '0')}:00`,
      quietHoursEnd: `${endHour.toString().padStart(2, '0')}:00`,
      allowUrgentInQuietHours: allowUrgent
    });
  };

  const handleEndHourChange = (value: number[]) => {
    const newEndHour = value[0];
    setEndHour(newEndHour);
    updatePreferencesMutation.mutate({
      enableQuietHours: enabled,
      quietHoursStart: `${startHour.toString().padStart(2, '0')}:00`,
      quietHoursEnd: `${newEndHour.toString().padStart(2, '0')}:00`,
      allowUrgentInQuietHours: allowUrgent
    });
  };

  const handleAllowUrgentChange = (checked: boolean) => {
    setAllowUrgent(checked);
    updatePreferencesMutation.mutate({
      enableQuietHours: enabled,
      quietHoursStart: `${startHour.toString().padStart(2, '0')}:00`,
      quietHoursEnd: `${endHour.toString().padStart(2, '0')}:00`,
      allowUrgentInQuietHours: checked
    });
  };

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const getQuietDuration = () => {
    let duration = 0;
    if (startHour < endHour) {
      duration = endHour - startHour;
    } else {
      duration = (24 - startHour) + endHour;
    }
    return duration;
  };

  return (
    <Card className="gradient-card border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Quiet Hours (Do Not Disturb)</CardTitle>
            <CardDescription className="text-slate-400">
              Set a schedule when notifications are silenced
            </CardDescription>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleEnabledChange}
            className="data-[state=checked]:bg-primary"
            data-testid="switch-quiet-hours"
          />
        </div>
      </CardHeader>
      <CardContent className={`space-y-6 ${!enabled ? 'opacity-50' : ''}`}>
        {/* Visual Timeline */}
        <div className="relative h-16 rounded-lg bg-slate-800/50 border border/20 overflow-hidden">
          {/* 24 Hour Markers */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex-1 border-r border/10 last:border-r-0" />
            ))}
          </div>

          {/* Quiet Hours Indicator */}
          {enabled && (
            <div
              className="absolute top-0 bottom-0 bg-primary/30 border-x-2 border-primary"
              style={{
                left: `${(startHour / 24) * 100}%`,
                width: `${(getQuietDuration() / 24) * 100}%`,
              }}
              data-testid="quiet-hours-indicator"
            >
              <div className="flex items-center justify-center h-full">
                <Moon className="w-5 h-5 text-primary" />
              </div>
            </div>
          )}

          {/* Time Labels */}
          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Sun className="w-3 h-3" />
              <span>12 AM</span>
            </div>
            <div className="text-xs text-slate-400">12 PM</div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Moon className="w-3 h-3" />
              <span>12 AM</span>
            </div>
          </div>
        </div>

        {/* Start Time Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-white">Start Time</Label>
            <div className="flex items-center gap-2 text-primary font-medium" data-testid="text-start-time">
              <Moon className="w-4 h-4" />
              {formatTime(startHour)}
            </div>
          </div>
          <Slider
            value={[startHour]}
            onValueChange={handleStartHourChange}
            min={0}
            max={23}
            step={1}
            disabled={!enabled}
            className="w-full"
            data-testid="slider-start-time"
          />
        </div>

        {/* End Time Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-white">End Time</Label>
            <div className="flex items-center gap-2 text-primary font-medium" data-testid="text-end-time">
              <Sun className="w-4 h-4" />
              {formatTime(endHour)}
            </div>
          </div>
          <Slider
            value={[endHour]}
            onValueChange={handleEndHourChange}
            min={0}
            max={23}
            step={1}
            disabled={!enabled}
            className="w-full"
            data-testid="slider-end-time"
          />
        </div>

        {/* Duration Info */}
        <div className="p-3 rounded-lg bg-slate-800/30 border border/20">
          <div className="text-sm text-slate-300">
            <span className="font-medium text-white">Quiet Period: </span>
            {getQuietDuration()} hours ({formatTime(startHour)} - {formatTime(endHour)})
          </div>
        </div>

        {/* Allow Urgent Notifications */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border/20">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-400" />
            <div>
              <Label className="text-white font-medium">Allow Urgent Notifications</Label>
              <p className="text-xs text-slate-400 mt-1">Critical alerts will still come through</p>
            </div>
          </div>
          <Switch
            checked={allowUrgent}
            onCheckedChange={handleAllowUrgentChange}
            disabled={!enabled}
            className="data-[state=checked]:bg-primary"
            data-testid="switch-allow-urgent"
          />
        </div>
      </CardContent>
    </Card>
  );
}
