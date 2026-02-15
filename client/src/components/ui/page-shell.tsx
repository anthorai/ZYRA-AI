import { ReactNode } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  backTo?: string;
  useHistoryBack?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  spacing?: "compact" | "normal" | "relaxed";
  className?: string;
  contentClassName?: string;
  headerActions?: ReactNode;
}

export function PageShell({
  children,
  title,
  subtitle,
  icon,
  backTo,
  useHistoryBack = false,
  maxWidth = "full",
  spacing = "normal",
  className,
  contentClassName,
  headerActions
}: PageShellProps) {
  const [, setLocation] = useLocation();
  const maxWidthClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    "2xl": "max-w-[1920px]",
    full: "max-w-full"
  };

  const spacingClasses = {
    compact: "space-y-4",
    normal: "space-y-6 sm:space-y-8",
    relaxed: "space-y-8 sm:space-y-12"
  };

  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6">
        <div className={cn(
          "mx-auto",
          maxWidthClasses[maxWidth],
          spacingClasses[spacing],
          contentClassName
        )}>
          {/* Simple Page Header */}
          {(title || backTo) && (
            <div
              className="rounded-md py-3 sm:py-[17px] px-3 sm:px-6 mt-[-16px] sm:mt-[-20px] mb-4 sm:mb-6 ml-[-16px] sm:ml-[-22px] mr-[-16px] sm:mr-[-22px]"
              style={{
                background: 'linear-gradient(180deg, #0F152B, #0B0E1A)',
                boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div className="flex items-start gap-2 sm:gap-4">
                {(backTo || useHistoryBack) && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="flex-shrink-0 mt-0.5 sm:mt-0"
                    data-testid="button-back"
                    onClick={() => {
                      if (backTo) {
                        setLocation(backTo);
                      } else {
                        setLocation('/dashboard');
                      }
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                
                {title && (
                  <div className="flex-1 min-w-0">
                    <h1 
                      className="text-lg sm:text-xl md:text-2xl font-semibold truncate"
                      style={{ color: '#E6F7FF' }}
                      data-testid="page-title"
                    >
                      {title}
                    </h1>
                    {subtitle && (
                      <p 
                        className="text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-2"
                        style={{ color: '#9AA6D6' }}
                        data-testid="page-subtitle"
                      >
                        {subtitle}
                      </p>
                    )}
                  </div>
                )}

                {headerActions && (
                  <div className="flex-shrink-0" data-testid="header-actions">
                    {headerActions}
                  </div>
                )}
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

// Alternative: Content-only shell (for pages that already have their own layout structure)
interface PageContentShellProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  spacing?: "compact" | "normal" | "relaxed";
  className?: string;
}

export function PageContentShell({
  children,
  maxWidth = "full",
  spacing = "normal",
  className
}: PageContentShellProps) {
  const maxWidthClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    "2xl": "max-w-[1920px]",
    full: "max-w-full"
  };

  const spacingClasses = {
    compact: "space-y-4",
    normal: "space-y-6 sm:space-y-8",
    relaxed: "space-y-8 sm:space-y-12"
  };

  return (
    <div className={cn(
      "mx-auto",
      maxWidthClasses[maxWidth],
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
}
