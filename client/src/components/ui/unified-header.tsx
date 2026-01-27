import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/dashboard/sidebar";
import { useAuth } from "@/hooks/useAuth";

interface UnifiedHeaderProps {
  title: string;
  subtitle: string;
  rightActions?: ReactNode;
  className?: string;
}

export function UnifiedHeader({
  title,
  subtitle,
  rightActions,
  className
}: UnifiedHeaderProps) {
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const handleTabChange = (tab: string) => {
    setSidebarOpen(false);
    if (tab === "change-control") {
      setLocation("/change-control");
    } else if (tab === "reports") {
      setLocation("/reports");
    } else {
      setLocation("/dashboard");
    }
  };

  return (
    <>
      <Sidebar
        activeTab=""
        onTabChange={handleTabChange}
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <header className={cn(
        "gradient-surface border-b border px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-50",
        className
      )}>
        <div className="flex items-center">
          {/* Left Section - Sidebar Toggle + Title */}
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
              <h1 
                className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl" 
                data-testid="text-page-title"
              >
                {title}
              </h1>
              <p 
                className="text-slate-300 text-xs sm:text-sm lg:text-base" 
                data-testid="text-page-subtitle"
              >
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right Section - Optional Actions */}
          {rightActions && (
            <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
              {rightActions}
            </div>
          )}
        </div>
      </header>
    </>
  );
}
