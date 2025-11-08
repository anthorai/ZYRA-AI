import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import zyraLogo from "@assets/zyra logo_1758518826550.png";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { useLanguage } from "@/hooks/useLanguage";
import { useLocation } from "wouter";
import { 
  Zap, 
  Home, 
  Search, 
  BarChart3, 
  Mail, 
  Package, 
  Settings, 
  LogOut,
  User,
  X,
  Cog,
  ShieldCheck
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
  const { t } = useLanguage();
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

  const navItems = [
    { id: "overview", label: t('navigation.dashboard'), icon: <Home className="w-4 h-4 sm:w-5 sm:h-5" />, tourAttr: "dashboard" },
    { id: "ai-tools", label: t('navigation.aiTools'), icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />, tourAttr: "ai-tools" },
    { id: "automate", label: t('navigation.automate'), icon: <Cog className="w-4 h-4 sm:w-5 sm:h-5" />, tourAttr: "analytics" },
    { id: "campaigns", label: t('navigation.campaigns'), icon: <Mail className="w-4 h-4 sm:w-5 sm:h-5" />, tourAttr: "campaigns" },
    { id: "products", label: t('navigation.products'), icon: <Package className="w-4 h-4 sm:w-5 sm:h-5" />, tourAttr: "products" },
    { id: "settings", label: t('navigation.settings'), icon: <Settings className="w-4 h-4 sm:w-5 sm:h-5" /> },
  ];

  // Add admin link only for admin users
  console.log('🔍 Sidebar - appUser:', appUser);
  console.log('🔍 Sidebar - appUser.role:', appUser?.role);
  
  if (appUser?.role === 'admin') {
    console.log('✅ Admin role detected - adding admin nav item');
    navItems.push({
      id: "admin",
      label: "Admin Panel",
      icon: <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />,
      tourAttr: "admin"
    });
  } else {
    console.log('❌ Not admin role - appUser:', appUser);
  }

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
          "fixed left-0 top-0 w-64 h-full bg-black/20 backdrop-blur-md border border-border rounded-r-2xl z-40 transition-transform duration-300 ease-in-out lg:top-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button - visible on all screen sizes */}
        <div className="absolute top-4 right-4">
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

        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8" data-testid="sidebar-logo">
            <img 
              src={zyraLogo} 
              alt="Zyra AI Logo" 
              className="w-10 h-10 rounded-lg"
            />
            <span className="text-xl sm:text-2xl font-bold text-foreground">Zyra AI</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 mt-[-17px] mb-[-17px]">
            {navItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => {
                  if (item.id === "admin") {
                    setLocation("/admin");
                  } else {
                    onTabChange(item.id);
                  }
                }}
                variant="ghost"
                className={`w-full justify-start px-4 py-3 h-auto ${
                  activeTab === item.id
                    ? "bg-primary/20 text-primary hover:bg-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                data-testid={`nav-${item.id}`}
                data-tour={item.tourAttr}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Button>
            ))}
          </nav>
        </div>

        {/* Navigation Header Style User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
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
                <p className="text-slate-300 text-xs capitalize truncate" data-testid="text-user-plan">
                  {appUser?.plan || "trial"} Plan
                </p>
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