import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { useLocation } from "wouter";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Settings from "@/components/dashboard/settings";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import NotificationCenter from "@/components/dashboard/notification-center";
import Sidebar from "@/components/dashboard/sidebar";
import Footer from "@/components/ui/footer";
import { useState } from "react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { handleLogout } = useLogout();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("settings");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Handle sidebar navigation
  const handleTabChange = (tab: string) => {
    if (tab === "settings") {
      // Stay on settings page
      return;
    } else if (tab === "overview") {
      setLocation("/dashboard");
    } else if (tab === "ai-tools") {
      setLocation("/dashboard");
      sessionStorage.setItem('navigationSource', 'ai-tools');
    } else if (tab === "automate") {
      setLocation("/dashboard");
      sessionStorage.setItem('navigationSource', 'automation');
    } else if (tab === "campaigns") {
      setLocation("/dashboard");
    } else if (tab === "products") {
      setLocation("/products");
    }
    
    // Close sidebar after navigation
    setSidebarOpen(false);
  };

  // Handle logout with standardized behavior
  const onLogoutClick = () => {
    handleLogout("/auth"); // Redirect to /auth as expected by this component
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        user={user} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-64' : 'ml-0'
      }`}>
        {/* Top Bar */}
        <header className="bg-card/50 backdrop-blur-sm border rounded-2xl px-4 sm:px-6 py-3 sm:py-4 mx-4 sm:mx-6 sm:mt-6 mt-[3px] mb-[3px] ml-[3px] mr-[3px]">
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
                <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl" data-testid="text-page-title">Settings</h1>
                <p className="text-slate-300 text-xs sm:text-sm lg:text-base" data-testid="text-page-subtitle">Manage your integrations and preferences</p>
              </div>
            </div>

            {/* Right Section - Notifications + Profile */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
              <NotificationCenter />
              <AvatarMenu />
            </div>
          </div>
        </header>

        {/* Settings Content */}
        <div className="flex-1 p-4 sm:p-6">
          <Settings />
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}