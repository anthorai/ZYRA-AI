import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DashboardContentSkeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/dashboard/sidebar";
import AITools from "@/components/dashboard/ai-tools";
import AutomationTools from "@/components/dashboard/automation-tools";
import Campaigns from "@/components/dashboard/campaigns";
import GrowthDashboard from "@/components/dashboard/growth-dashboard";
import Settings from "@/components/dashboard/settings";
import Profile from "@/components/dashboard/profile";
import NotificationCenter from "@/components/dashboard/notification-center";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import Footer from "@/components/ui/footer";
import ManageProducts from "@/pages/products/manage";
import { MasterAutomationToggle } from "@/components/MasterAutomationToggle";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useDashboard, useSkeletonLoader, useConnectionStatus } from "@/hooks/useDashboard";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Zap, TrendingUp, ShoppingCart, Eye, RotateCcw, Plus, Menu, User, LogOut, Settings as SettingsIcon, Sparkles } from "lucide-react";

export default function Dashboard() {
  const { user, appUser } = useAuth();
  const { handleLogout, isLoggingOut } = useLogout();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Initialize sidebar state from localStorage, default to true for desktop, false for mobile
  const getInitialSidebarState = () => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) {
      return saved === 'true';
    }
    // Default: open on desktop, closed on mobile
    return window.innerWidth >= 1024;
  };
  
  const [sidebarOpen, setSidebarOpen] = useState(getInitialSidebarState);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Onboarding tour
  const { showTour, completeOnboarding, skipOnboarding } = useOnboarding();

  // Get display name with robust fallback logic
  const getDisplayName = () => {
    if (appUser?.fullName) return appUser.fullName;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    if (user?.email) return user.email.split('@')[0];
    return "User";
  };

  const getInitials = () => {
    const name = getDisplayName();
    if (name === "User") return "U";
    return name.charAt(0).toUpperCase();
  };

  const displayName = getDisplayName();
  const initials = getInitials();

  // Enhanced logout with confirmation and comprehensive error handling
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    await handleLogout("/"); // Use standardized logout hook with redirect to landing page
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  

  // Real-time dashboard data
  const {
    dashboardData,
    formattedStats,
    isLoading,
    isInitialized,
    trackToolAccess,
    logActivity,
    updateUsageStats,
    lastUpdate,
    isTrackingTool,
  } = useDashboard();

  // Skeleton loader with delay
  const showSkeleton = useSkeletonLoader(isLoading, 300);

  // Connection status monitoring
  const { isOnline } = useConnectionStatus();

  


  // Handle navigation source from sessionStorage (for back button from AI tools, automation, campaigns, and settings)
  useEffect(() => {
    const navigationSource = sessionStorage.getItem('navigationSource');
    if (navigationSource === 'ai-tools') {
      setActiveTab('ai-tools');
      sessionStorage.removeItem('navigationSource'); // Clean up after use
    } else if (navigationSource === 'automation') {
      setActiveTab('automate');
      sessionStorage.removeItem('navigationSource'); // Clean up after use
    } else if (navigationSource === 'campaigns') {
      setActiveTab('campaigns');
      sessionStorage.removeItem('navigationSource'); // Clean up after use
    } else if (navigationSource === 'settings') {
      setActiveTab('settings');
      sessionStorage.removeItem('navigationSource'); // Clean up after use
    }
  }, []);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarOpen', String(sidebarOpen));
  }, [sidebarOpen]);

  // Handle responsive behavior - auto-close on mobile resize only
  useEffect(() => {
    const handleResize = () => {
      // Only auto-close when resizing to mobile, don't auto-open when resizing to desktop
      // This preserves user's choice
      if (window.innerWidth < 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Generate stats from real-time data with icons
  const stats = formattedStats.map((stat, index) => {
    const iconMap = {
      TrendingUp: <TrendingUp className="w-6 h-6" />,
      ShoppingCart: <ShoppingCart className="w-6 h-6" />,
      Eye: <Eye className="w-6 h-6" />,
      RotateCcw: <RotateCcw className="w-6 h-6" />,
    };
    return {
      ...stat,
      icon: iconMap[stat.icon as keyof typeof iconMap] || <TrendingUp className="w-6 h-6" />,
    };
  });

  // Quick actions with optimistic UI updates
  const handleToolNavigation = async (toolName: string, displayName: string) => {
    // Optimistic UI update - navigate immediately
    setActiveTab(toolName);
    
    // Track tool access in the background
    trackToolAccess(toolName);
    
    // Log activity
    logActivity(
      "tool_navigation",
      `Navigated to ${displayName}`,
      toolName,
      { timestamp: new Date().toISOString(), optimistic: true }
    );
    
    // Update usage stats based on tool type
    if (toolName === "ai-tools") {
      updateUsageStats("aiGenerationsUsed", 0); // Just tracking access, not usage
    } else if (toolName === "automate") {
      updateUsageStats("automationActionsUsed", 0);
    } else if (toolName === "campaigns") {
      updateUsageStats("campaignsUsed", 0);
    }
  };

  const quickActions = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Strategy AI",
      description: "Deep insights & campaign strategies powered by GPT-4o",
      action: () => setLocation("/strategy-insights"),
      primary: true,
      toolName: "strategy-ai",
      premium: true,
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "AI Product Generator",
      description: "Generate compelling product descriptions in seconds",
      action: () => handleToolNavigation("ai-tools", "AI Tools"),
      primary: true,
      toolName: "ai-tools",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Automation Tools", 
      description: "Streamline bulk operations and intelligent optimizations",
      action: () => handleToolNavigation("automate", "Automation Tools"),
      primary: false,
      toolName: "automate",
    },
    {
      icon: <ShoppingCart className="w-5 h-5" />,
      title: "AI Campaigns",
      description: "Automated email & SMS growth engine with AI targeting",
      action: () => handleToolNavigation("campaigns", "AI Campaigns"),
      primary: false,
      toolName: "campaigns",
    },
  ];

  // Format real-time activities
  const activities = dashboardData?.activityLogs?.map((log) => {
    const iconMap = {
      "tool_accessed": <Zap className="w-5 h-5 text-primary" />,
      "tool_navigation": <TrendingUp className="w-5 h-5 text-chart-2" />,
      "user_login": <ShoppingCart className="w-5 h-5 text-chart-3" />,
      "generated_product": <Zap className="w-5 h-5 text-primary" />,
      "optimized_seo": <TrendingUp className="w-5 h-5 text-chart-2" />,
      "sent_campaign": <ShoppingCart className="w-5 h-5 text-chart-3" />,
    };

    // Format time ago
    const timeAgo = (dateString: string) => {
      const now = new Date();
      const activityTime = new Date(dateString);
      const diffMs = now.getTime() - activityTime.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} minutes ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hours ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    };

    return {
      icon: iconMap[log.action as keyof typeof iconMap] || <Zap className="w-5 h-5 text-primary" />,
      description: log.description,
      time: timeAgo(log.createdAt),
      id: log.id,
    };
  }) || [
    // Fallback activities if no real data
    {
      icon: <Zap className="w-5 h-5 text-primary" />,
      description: "Dashboard initialized with real-time data",
      time: "Just now",
      id: "fallback-1",
    },
  ];

  const getPageTitle = () => {
    const titles = {
      overview: { title: "Dashboard", subtitle: "Overview and quick actions" },
      "ai-tools": { title: "AI Tools", subtitle: "AI-powered content generation" },
      "automate": { title: "Automation", subtitle: "Bulk operations and workflows" },
      campaigns: { title: "Campaigns", subtitle: "Email and SMS marketing" },
      products: { title: "Products", subtitle: "Manage your product catalog" },
      profile: { title: "Profile", subtitle: "Your account information" },
      settings: { title: "Settings", subtitle: "App configuration and preferences" },
    };
    return titles[activeTab as keyof typeof titles] || titles.overview;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "ai-tools":
        return <AITools />;
      case "automate":
        return <AutomationTools />;
      case "campaigns":
        return <Campaigns />;
      case "products":
        return <ManageProducts />;
      case "profile":
        return <Profile />;
      case "settings":
        return <Settings />;
      default:
        return <GrowthDashboard />;
    }
  };

  const pageTitle = getPageTitle();

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        user={user} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-64' : 'ml-0'
      }`}>
        {/* Top Bar */}
        <header className="gradient-surface border-b border px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center">
            {/* Left Section - Hamburger + Title */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
                data-testid="button-toggle-sidebar"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl" data-testid="text-page-title">{pageTitle.title}</h1>
                <p className="text-slate-300 text-xs sm:text-sm lg:text-base" data-testid="text-page-subtitle">{pageTitle.subtitle}</p>
              </div>
            </div>

            

            {/* Right Section - Master Toggle + Notifications + Profile */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
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
                      <p className="font-bold text-white text-sm" data-testid="text-user-name">{displayName}</p>
                      <p className="text-xs text-slate-300" data-testid="text-user-email">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <DropdownMenuItem
                    className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer"
                    onClick={() => setActiveTab("profile")}
                    data-testid="menuitem-profile"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer"
                    onClick={() => setActiveTab("settings")}
                    data-testid="menuitem-settings"
                  >
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <DropdownMenuItem
                    className={`text-red-300 hover:text-red-200 hover:bg-red-500/20 focus:text-red-200 focus:bg-red-500/20 cursor-pointer ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={isLoggingOut ? undefined : handleLogoutClick}
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

        {/* Dashboard Content */}
        <div className="flex-1 p-4 sm:p-6">
          {showSkeleton && activeTab === "overview" ? (
            <DashboardContentSkeleton />
          ) : (
            renderTabContent()
          )}
        </div>

        {/* Footer */}
        <Footer />
      </div>
      
      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="gradient-surface border/50 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Are you sure you want to logout? You will need to sign in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleLogoutCancel}
              className="bg-transparent border/50 text-slate-300 hover:bg-white/10 hover:text-white"
              disabled={isLoggingOut}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Onboarding Tour */}
      {showTour && (
        <OnboardingTour
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      )}
    </div>
  );
}
