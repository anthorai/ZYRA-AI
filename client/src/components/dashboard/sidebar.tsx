import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import zyraLogo from "@assets/zyra logo_1758518826550.png";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Package, 
  Settings, 
  LogOut,
  X,
  Coins,
  Shield,
  Activity,
  BarChart3,
  LayoutDashboard,
  ClipboardList
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeTab, onTabChange, user, isOpen, onClose }: SidebarProps) {
  const { appUser, user: supabaseUser } = useAuth();
  const { handleLogout, isLoggingOut } = useLogout();
  const [, setLocation] = useLocation();
  
  // Robust user name display logic - same as avatar components
  const getDisplayName = () => {
    // Try multiple sources for the user's name
    if (appUser?.fullName) return appUser.fullName;
    if (supabaseUser?.user_metadata?.full_name) return supabaseUser.user_metadata.full_name;
    if (supabaseUser?.user_metadata?.name) return supabaseUser.user_metadata.name;
    if (supabaseUser?.email) return supabaseUser.email.split('@')[0];
    return "User";
  };

  const displayName = getDisplayName();
  const initials = displayName.charAt(0).toUpperCase();
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Fetch credits balance - maps to CreditBalance interface from server
  const { data: creditsData } = useQuery<{ 
    creditsRemaining: number; 
    creditsUsed: number; 
    creditLimit: number;
    isLow: boolean;
  }>({
    queryKey: ['/api/credits/balance'],
    enabled: !!supabaseUser,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch current subscription to get the actual plan name
  const { data: subscriptionData } = useQuery<{
    planId: string;
    planName: string;
    status: string;
  }>({
    queryKey: ['/api/subscription/current'],
    enabled: !!supabaseUser,
    refetchInterval: 60000, // Refresh every minute
  });

  // Get the display name for the current plan (short version for sidebar)
  const getCurrentPlanDisplay = () => {
    // If we have subscription data with a plan name, use it (but shorten trial names)
    if (subscriptionData?.planName) {
      const planName = subscriptionData.planName.toLowerCase();
      // Shorten long trial names for sidebar display
      if (planName.includes('trial') || planName.includes('free trial')) {
        return 'Trial';
      }
      return subscriptionData.planName;
    }
    // Fall back to appUser plan
    if (appUser?.plan) {
      // Format common plan values nicely (short for sidebar)
      const planMap: Record<string, string> = {
        'trial': 'Trial',
        'free': 'Free',
        'starter': 'Starter',
        'growth': 'Growth',
        'pro': 'Pro',
        'enterprise': 'Enterprise'
      };
      return planMap[appUser.plan.toLowerCase()] || appUser.plan;
    }
    return 'Trial';
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 1024
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close sidebar on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const onLogoutClick = () => {
    handleLogout("/"); // Redirect to landing page on logout
  };

  // Check if user is admin
  const isAdmin = appUser?.role === 'admin';

  // Build navigation items - simplified "one-brain" navigation
  const navItems = [
    { id: "revenue-immune", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />, tourAttr: "revenue-immune" },
    { id: "change-control", label: "Change Control", icon: <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />, onClick: () => setLocation("/change-control"), tourAttr: "change-control" },
    { id: "zyra-at-work", label: "ZYRA at Work", icon: <Activity className="w-4 h-4 sm:w-5 sm:h-5" />, tourAttr: "zyra-at-work" },
    { id: "products", label: "Products", icon: <Package className="w-4 h-4 sm:w-5 sm:h-5" />, tourAttr: "products" },
    { id: "reports", label: "Reports", icon: <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />, onClick: () => setLocation("/reports") },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4 sm:w-5 sm:h-5" /> },
    // Admin-only items
    ...(isAdmin ? [
      { id: "admin", label: "Admin Panel", icon: <Shield className="w-4 h-4 sm:w-5 sm:h-5" />, onClick: () => setLocation("/admin/subscriptions") },
    ] : []),
  ];

  return (
    <>
      {/* Overlay - closes sidebar when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 w-64 h-full border-r border-primary/20 rounded-r-2xl z-40 transition-transform duration-300 ease-in-out lg:top-0 overflow-hidden",
          "bg-black/20 backdrop-blur-md",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-3 pt-5 pb-4 relative z-10">
          {/* Logo row with close button */}
          <div className="flex items-center justify-between gap-2 mb-5 px-3" data-testid="sidebar-logo">
            <div className="flex items-center space-x-3">
              <img 
                src={zyraLogo} 
                alt="Zyra AI Logo" 
                className="w-9 h-9 rounded-lg"
              />
              <span className="text-lg font-bold text-foreground">Zyra AI</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-close-sidebar"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => (item as any).onClick ? (item as any).onClick() : onTabChange(item.id)}
                variant="ghost"
                className={`w-full justify-start px-3 h-10 text-sm ${
                  activeTab === item.id
                    ? "bg-primary/20 text-primary hover:bg-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                data-testid={`nav-${item.id}`}
                data-tour={(item as any).tourAttr}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Button>
            ))}
          </nav>
        </div>

        {/* Navigation Header Style User Profile */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 border-t border-primary/20 z-10">
          <div className="flex items-center justify-between space-x-3" data-testid="user-profile">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src="" alt={displayName} />
                <AvatarFallback className="gradient-surface text-primary border border-primary/20 text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold text-white tracking-tight truncate" data-testid="text-user-name">
                  {displayName}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge 
                    variant="outline" 
                    className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 border-primary/30 text-primary"
                    data-testid="badge-user-plan"
                  >
                    {getCurrentPlanDisplay()}
                  </Badge>
                  <span 
                    className={`text-[10px] flex items-center gap-0.5 ${
                      (creditsData?.creditsRemaining ?? 0) === 0 
                        ? 'text-red-400' 
                        : creditsData?.isLow 
                          ? 'text-yellow-400' 
                          : 'text-slate-400'
                    }`}
                    data-testid="text-credits-remaining"
                    title={`${creditsData?.creditsRemaining ?? 0} credits remaining${creditsData?.isLow ? ' (Low credits!)' : ''}`}
                  >
                    <Coins className="w-2.5 h-2.5" />
                    {creditsData?.creditsRemaining ?? 0}
                    {(creditsData?.creditsRemaining ?? 0) === 0 && (
                      <span className="text-[8px] ml-0.5">(empty)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Logout Icon Toggle */}
            <Button
              onClick={onLogoutClick}
              variant="ghost"
              size="icon"
              className={`h-8 w-8 text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-all duration-200 flex-shrink-0 ${
                isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoggingOut}
              data-testid="button-sidebar-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}