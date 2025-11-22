import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
  size?: "sm" | "md" | "lg";
  testId?: string;
}

export function DashboardCard({
  title,
  description,
  children,
  className,
  headerAction,
  size = "md",
  testId
}: DashboardCardProps) {
  const sizeClasses = {
    sm: "p-3 sm:p-4",
    md: "p-3 sm:p-4 md:p-6",
    lg: "p-4 sm:p-6 md:p-8"
  };

  return (
    <Card
      className={cn(
        "gradient-card rounded-xl sm:rounded-2xl shadow-lg border border-slate-700/50",
        "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10",
        "transition-all duration-300 overflow-visible",
        className
      )}
      data-testid={testId}
    >
      {(title || description || headerAction) && (
        <CardHeader className={sizeClasses[size]}>
          <div className="flex items-center justify-between">
            <div className="space-y-1 sm:space-y-1.5">
              {title && (
                <CardTitle className="text-white text-base sm:text-lg md:text-xl">
                  {title}
                </CardTitle>
              )}
              {description && (
                <CardDescription className="text-slate-300 text-xs sm:text-sm">
                  {description}
                </CardDescription>
              )}
            </div>
            {headerAction && (
              <div className="flex-shrink-0 ml-4">
                {headerAction}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(
        sizeClasses[size],
        (title || description || headerAction) && "pt-0",
        "overflow-visible"
      )}>
        {children}
      </CardContent>
    </Card>
  );
}

// Lightweight card variant for metric/stat cards
interface MetricCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
  testId?: string;
}

export function MetricCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  className,
  testId
}: MetricCardProps) {
  const trendColors = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-slate-400"
  };

  return (
    <Card
      className={cn(
        "gradient-card rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6",
        "shadow-lg border border-slate-700/50",
        "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10",
        "transition-all duration-300",
        className
      )}
      data-testid={testId}
    >
      <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
        <div className="p-2 sm:p-2.5 md:p-3 rounded-full bg-slate-800/50 transition-all duration-300 flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-white font-bold text-base sm:text-lg md:text-xl truncate">
            {value}
          </h3>
          <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm truncate">
            {title}
          </p>
          {subtitle && (
            <p className={cn(
              "text-[10px] sm:text-xs truncate mt-0.5",
              trend ? trendColors[trend] : "text-slate-400"
            )}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
