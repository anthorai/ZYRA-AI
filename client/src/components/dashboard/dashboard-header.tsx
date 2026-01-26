import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, User, LogOut, Settings as SettingsIcon } from "lucide-react";
import { MasterAutomationToggle } from "@/components/MasterAutomationToggle";
import NotificationCenter from "@/components/dashboard/notification-center";

interface DashboardHeaderProps {
  activeTab: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  displayName: string;
  userEmail?: string;
  initials: string;
  onLogoutClick: () => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  isLoggingOut: boolean;
}

// Memoized header component - only re-renders when its direct props change
// Completely isolated from query refetches and global state changes
export const DashboardHeader = memo(function DashboardHeader({
  activeTab,
  sidebarOpen,
  setSidebarOpen,
  displayName,
  userEmail,
  initials,
  onLogoutClick,
  onProfileClick,
  onSettingsClick,
  isLoggingOut,
}: DashboardHeaderProps) {
  // Memoize page title to prevent recalculation
  const pageTitle = useMemo(() => {
    const titles: Record<string, { title: string; subtitle: string }> = {
      overview: { title: "Dashboard", subtitle: "Overview and quick actions" },
      "next-move": { title: "Next Move", subtitle: "ZYRA's single most important revenue action" },
      "zyra-at-work": { title: "ZYRA at Work", subtitle: "See what ZYRA is doing for your store" },
      "ai-tools": { title: "AI Tools", subtitle: "AI-powered content generation" },
      "automate": { title: "Automation", subtitle: "Bulk operations and workflows" },
      campaigns: { title: "Campaigns", subtitle: "Email and SMS marketing" },
      products: { title: "Product Intelligence", subtitle: "AI-powered product insights and optimization" },
      profile: { title: "Profile", subtitle: "Your account information" },
      settings: { title: "Settings", subtitle: "App configuration and preferences" },
    };
    return titles[activeTab as keyof typeof titles] || titles.overview;
  }, [activeTab]);

  return (
    <header className="gradient-surface border-b px-3 sm:px-6 py-2 sm:py-4 flex-shrink-0 sticky top-0 z-50">
      <div className="flex items-center justify-between gap-2">
        {/* Left Section - Hamburger + Title */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
            data-testid="button-toggle-sidebar"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-bold text-white text-sm sm:text-lg lg:text-xl xl:text-2xl truncate" data-testid="text-page-title">
              {pageTitle.title}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm lg:text-base hidden sm:block truncate" data-testid="text-page-subtitle">
              {pageTitle.subtitle}
            </p>
          </div>
        </div>

        {/* Right Section - Automation Toggle + Notifications + Profile Menu */}
        <div className="flex items-center justify-end gap-1 sm:gap-3 flex-shrink-0">
          <MasterAutomationToggle />
          <NotificationCenter />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full text-slate-200 hover:text-primary transition-all duration-300 ease-in-out"
                data-testid="avatar-menu-trigger"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={displayName} />
                  <AvatarFallback className="gradient-surface text-primary border border-primary/20">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 gradient-surface border/50 text-white" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-bold text-white text-sm" data-testid="text-user-name">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-300" data-testid="text-user-email">
                    {userEmail}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-border/30" />
              <DropdownMenuItem
                className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer"
                onClick={onProfileClick}
                data-testid="menuitem-profile"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer"
                onClick={onSettingsClick}
                data-testid="menuitem-settings"
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/30" />
              <DropdownMenuItem
                className={`text-red-300 hover:text-red-200 hover:bg-red-500/20 focus:text-red-200 focus:bg-red-500/20 cursor-pointer ${
                  isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={isLoggingOut ? undefined : onLogoutClick}
                disabled={isLoggingOut}
                data-testid="menuitem-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? "Logging Out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
});

DashboardHeader.displayName = "DashboardHeader";
