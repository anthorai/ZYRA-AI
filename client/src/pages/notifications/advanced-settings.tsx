import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/ui/page-shell";
import PresetModeSelector from "@/components/notifications/PresetModeSelector";
import ChannelMatrix from "@/components/notifications/ChannelMatrix";
import FrequencyManager from "@/components/notifications/FrequencyManager";
import QuietHoursBuilder from "@/components/notifications/QuietHoursBuilder";
import PriorityFilter from "@/components/notifications/PriorityFilter";
import type { NotificationPreferences } from "@shared/schema";

export default function AdvancedNotificationSettings() {

  const { data: preferences, isLoading } = useQuery<NotificationPreferences>({
    queryKey: ['/api/notification-preferences'],
  });

  return (
    <PageShell
      title="Advanced Notification Settings"
      subtitle="Take complete control of your notification preferences with smart presets, channel controls, and scheduling"
      maxWidth="xl"
      spacing="normal"
    >
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
    </PageShell>
  );
}
