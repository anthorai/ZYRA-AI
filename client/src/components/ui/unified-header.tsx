import { ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface UnifiedHeaderProps {
  title: string;
  subtitle: string;
  backTo?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  rightActions?: ReactNode;
  className?: string;
}

export function UnifiedHeader({
  title,
  subtitle,
  backTo,
  onBack,
  showBackButton = true,
  rightActions,
  className
}: UnifiedHeaderProps) {
  const [location, setLocation] = useLocation();

  // Track navigation history in sessionStorage
  useEffect(() => {
    const currentPath = sessionStorage.getItem('currentPath');
    
    if (currentPath && currentPath !== location) {
      sessionStorage.setItem('previousPath', currentPath);
    }
    sessionStorage.setItem('currentPath', location);
  }, [location]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backTo) {
      setLocation(backTo);
    } else {
      // Get the actual previous path from sessionStorage
      const previousPath = sessionStorage.getItem('previousPath');
      
      if (previousPath && previousPath !== location && previousPath !== '/') {
        setLocation(previousPath);
      } else {
        window.history.back();
      }
    }
  };

  return (
    <header className={cn(
      "gradient-surface border-b border-border px-4 sm:px-6 py-3 sm:py-4",
      className
    )}>
      <div className="flex items-center">
        {/* Left Section - Back Button + Title */}
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          )}
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
  );
}
