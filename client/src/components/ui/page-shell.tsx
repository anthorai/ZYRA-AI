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
          {/* Simple Page Header */}
          {(title || backTo) && (
            <div className="bg-card rounded-md border border-border py-[17px] px-4 sm:px-6 ml-[-19px] mr-[-19px] mt-[-20px] mb-6">
              <div className="flex items-start gap-4">
                {/* Back Button */}
                {backTo && (
                  <Link href={backTo}>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="flex-shrink-0"
                      data-testid="button-back"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
                
                {/* Title and Subtitle */}
                {title && (
                  <div className="flex-1">
                    <h1 
                      className="text-xl sm:text-2xl font-bold"
                      data-testid="page-title"
                    >
                      {title}
                    </h1>
                    {subtitle && (
                      <p 
                        className="text-sm text-muted-foreground mt-1"
                        data-testid="page-subtitle"
                      >
                        {subtitle}
                      </p>
                    )}
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
