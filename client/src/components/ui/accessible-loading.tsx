import { Loader2 } from "lucide-react";

interface AccessibleLoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AccessibleLoading({ 
  message = "Loading...", 
  size = "md",
  className = "" 
}: AccessibleLoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div 
      className={`flex flex-col items-center justify-center space-y-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} aria-hidden="true" />
      <span className="text-sm text-muted-foreground">{message}</span>
      <span className="sr-only">{message}</span>
    </div>
  );
}

interface AccessibleSkeletonProps {
  count?: number;
  className?: string;
}

export function AccessibleSkeletonLoader({ count = 3, className = "" }: AccessibleSkeletonProps) {
  return (
    <div 
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading content"
      className={className}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-3 mb-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      ))}
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
}
