import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Zap, TrendingUp, ShoppingCart, Eye, RotateCcw, Plus, Sparkles, AlertTriangle, ExternalLink } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

interface StoreConnection {
  id: string;
  name: string | null;
  platform: string;
  status: string;
  url: string;
  lastSync: string | null;
}

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

  // Shopify store connection status
  const { data: storesData, isLoading: isLoadingStores, isSuccess: storesQuerySuccess } = useQuery<StoreConnection[]>({
    queryKey: ['/api/stores/connected'],
  });
  
  // Only show banner if query succeeded and no active Shopify store exists
  // Use case-insensitive check for platform and check status is 'connected' or 'active'
  const shopifyStores = storesData?.filter(s => s.platform?.toLowerCase() === 'shopify') || [];
  const isShopifyConnected = shopifyStores.length > 0 && shopifyStores.some(s => s.status === 'connected' || s.status === 'active');
  const shouldShowShopifyBanner = storesQuerySuccess && !isShopifyConnected;

  


  // Handle navigation source from sessionStorage or URL query params (for back button from AI tools, automation, campaigns, and settings)
  useEffect(() => {
    // First check URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam) {
      // Handle tab query parameter
      if (tabParam === 'ai-tools') {
        setActiveTab('ai-tools');
      } else if (tabParam === 'automate' || tabParam === 'automation') {
        setActiveTab('automate');
      } else if (tabParam === 'campaigns') {
        setActiveTab('campaigns');
      } else if (tabParam === 'settings') {
        setActiveTab('settings');
      } else if (tabParam === 'overview') {
        setActiveTab('overview');
      }
      // Clean up the URL by removing the query param
      window.history.replaceState({}, '', '/dashboard');
      return;
    }
    
    // Fallback to sessionStorage for backward compatibility
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
        return (
          <div className="space-y-6">
            {shouldShowShopifyBanner && (
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <AlertTriangle className="h-8 w-8 text-yellow-500 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg" data-testid="text-no-store-title">No Shopify Store Connected</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        Connect your Shopify store to sync products, manage inventory, and enable AI-powered optimizations.
                      </p>
                    </div>
                    <Button 
                      onClick={() => setLocation("/settings/integrations?connect=shopify")}
                      data-testid="button-connect-store-dashboard"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect Store
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <GrowthDashboard />
          </div>
        );
    }
  };

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
      <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-64' : 'ml-0'
      }`}>
        {/* Persistent Header - Isolated from query refetches */}
        <DashboardHeader
          activeTab={activeTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          displayName={displayName}
          userEmail={user?.email}
          initials={initials}
          onLogoutClick={handleLogoutClick}
          onProfileClick={() => setActiveTab("profile")}
          onSettingsClick={() => setActiveTab("settings")}
          isLoggingOut={isLoggingOut}
        />

        {/* Dashboard Content */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-auto">
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
