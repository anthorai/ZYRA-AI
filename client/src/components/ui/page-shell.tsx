import { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  backTo?: string;
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
  maxWidth = "full",
  spacing = "normal",
  className,
  contentClassName,
  headerActions
}: PageShellProps) {
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
          {/* Professional Page Header */}
          {(title || backTo) && (
            <div className="relative mb-4 sm:mb-6">
              {/* Back Button - Positioned top left */}
              {backTo && (
                <div className="absolute left-0 top-0 sm:top-1">
                  <Link href={backTo}>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="gap-1.5 text-slate-400 hover:text-white"
                      data-testid="button-back"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Back</span>
                    </Button>
                  </Link>
                </div>
              )}
              
              {/* Centered Header Content */}
              <div className="text-center space-y-2 sm:space-y-3 pt-8 sm:pt-0">
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {icon && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0">
                      {icon}
                    </div>
                  )}
                  {title && (
                    <h1 
                      className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent"
                      data-testid="page-title"
                    >
                      {title}
                    </h1>
                  )}
                </div>
                {subtitle && (
                  <p 
                    className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2"
                    data-testid="page-subtitle"
                  >
                    {subtitle}
                  </p>
                )}
                {headerActions && (
                  <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
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
