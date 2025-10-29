import { ReactNode } from "react";
import { UnifiedHeader } from "@/components/ui/unified-header";
import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  backTo?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  rightActions?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  spacing?: "compact" | "normal" | "relaxed";
  className?: string;
  contentClassName?: string;
}

export function PageShell({
  title,
  subtitle,
  children,
  backTo,
  onBack,
  showBackButton = true,
  rightActions,
  maxWidth = "full",
  spacing = "normal",
  className,
  contentClassName
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
      {/* Header */}
      <UnifiedHeader
        title={title}
        subtitle={subtitle}
        backTo={backTo}
        onBack={onBack}
        showBackButton={showBackButton}
        rightActions={rightActions}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6">
        <div className={cn(
          "mx-auto",
          maxWidthClasses[maxWidth],
          spacingClasses[spacing],
          contentClassName
        )}>
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
