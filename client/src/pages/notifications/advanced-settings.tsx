import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import PresetModeSelector from "@/components/notifications/PresetModeSelector";
import ChannelMatrix from "@/components/notifications/ChannelMatrix";
import FrequencyManager from "@/components/notifications/FrequencyManager";
import QuietHoursBuilder from "@/components/notifications/QuietHoursBuilder";
import PriorityFilter from "@/components/notifications/PriorityFilter";
import type { NotificationPreferences } from "@shared/schema";

export default function AdvancedNotificationSettings() {
  const [, setLocation] = useLocation();

  const { data: preferences, isLoading } = useQuery<NotificationPreferences>({
    queryKey: ['/api/notification-preferences'],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/settings')}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
              data-testid="button-back-to-settings"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Settings
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Advanced Notification Settings
          </h1>
          <p className="text-slate-300 text-lg">
            Take complete control of your notification preferences with smart presets, channel controls, and scheduling
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Preset Mode Selector */}
            <PresetModeSelector currentPreferences={preferences} />

            {/* Channel Matrix */}
            <ChannelMatrix />

            {/* Frequency Manager */}
            <FrequencyManager />

            {/* Quiet Hours Builder */}
            <QuietHoursBuilder />

            {/* Priority Filter */}
            <PriorityFilter />
          </div>
        )}

        {/* Info Card */}
        <div className="p-6 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <h3 className="text-lg font-bold text-white mb-2">How It Works</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
              <span><strong>Preset Modes</strong> instantly configure all settings based on your workflow (Work, Focus, or Full Alerts)</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
              <span><strong>Channel Matrix</strong> lets you choose which delivery methods (Email, SMS, In-App, Push) to use per category</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
              <span><strong>Frequency Manager</strong> controls how often notifications are sent (instant, hourly, daily, or weekly)</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
              <span><strong>Quiet Hours</strong> silences all non-urgent notifications during your chosen schedule</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
              <span><strong>Priority Filter</strong> shows only notifications at or above your selected importance level</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
