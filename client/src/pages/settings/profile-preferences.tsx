import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { User, Brain, Bell, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

const ProfilePage = lazy(() => import("@/pages/profile"));
const AIPreferencesPage = lazy(() => import("@/pages/settings/ai-preferences"));
const NotificationsPage = lazy(() => import("@/pages/settings/notifications"));

type TabType = 'profile' | 'ai' | 'notifications';

const TAB_PATH_MAP: Record<TabType, string> = {
  profile: '/settings/profile-preferences',
  ai: '/settings/ai-preferences',
  notifications: '/settings/notifications',
};

function resolveTabFromPath(path: string): TabType {
  if (path.includes('/ai-preferences')) return 'ai';
  if (path.includes('/notifications')) return 'notifications';
  return 'profile';
}

export default function ProfilePreferencesPage() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>(() => resolveTabFromPath(location));

  useEffect(() => {
    setActiveTab(resolveTabFromPath(location));
  }, [location]);

  const handleTabClick = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setLocation(TAB_PATH_MAP[tab], { replace: true });
  }, [setLocation]);

  const tabs: { id: TabType; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'ai', label: 'AI Preferences', icon: Brain },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <PageShell
      title="Profile & Preferences"
      subtitle="Manage your profile, AI settings, and notifications"
      maxWidth="xl"
      spacing="normal"
      useHistoryBack={true}
    >
      <div
        className="flex gap-1 p-1 rounded-xl mb-2"
        style={{ background: '#0F152B', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabClick(id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all"
            style={activeTab === id ? {
              background: 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(0,255,229,0.08))',
              color: '#00F0FF',
              border: '1px solid rgba(0,240,255,0.25)',
            } : {
              background: 'transparent',
              color: '#7C86B8',
              border: '1px solid transparent',
            }}
            data-testid={`tab-${id}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <Suspense fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00F0FF' }} />
        </div>
      }>
        {activeTab === 'profile' && <ProfilePage embedded />}
        {activeTab === 'ai' && <AIPreferencesPage embedded />}
        {activeTab === 'notifications' && <NotificationsPage embedded />}
      </Suspense>
    </PageShell>
  );
}
