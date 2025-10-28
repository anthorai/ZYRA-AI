import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Dashboard-specific skeleton components
function DashboardStatSkeleton() {
  return (
    <div className="stat-card border-0 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg" />
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <Skeleton className="w-20 h-8 mb-1" />
      <Skeleton className="w-24 h-4" />
    </div>
  );
}

function DashboardQuickActionSkeleton() {
  return (
    <div className="gradient-card border-0 p-4 sm:p-6">
      <div className="flex items-center mb-3 sm:mb-4">
        <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg mr-2 sm:mr-3" />
        <Skeleton className="w-32 h-6" />
      </div>
      <Skeleton className="w-full h-4 mb-2" />
      <Skeleton className="w-3/4 h-4 mb-3 sm:mb-4" />
      <Skeleton className="w-full h-10 rounded-md" />
    </div>
  );
}

function DashboardActivitySkeleton() {
  return (
    <div className="flex items-center p-3 sm:p-4 bg-muted/30 rounded-lg">
      <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg mr-3 sm:mr-4 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="w-full h-4 mb-2" />
        <Skeleton className="w-20 h-3" />
      </div>
      <Skeleton className="w-12 h-6 rounded flex-shrink-0" />
    </div>
  );
}

function DashboardContentSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <DashboardStatSkeleton key={index} />
        ))}
      </div>

      {/* Quick Actions Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <DashboardQuickActionSkeleton key={index} />
        ))}
      </div>

      {/* Recent Activity Skeleton */}
      <div className="gradient-card border-0 p-4 sm:p-6">
        <Skeleton className="w-40 h-6 mb-4 sm:mb-6" />
        <div className="space-y-3 sm:space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <DashboardActivitySkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export { 
  Skeleton, 
  DashboardStatSkeleton, 
  DashboardQuickActionSkeleton, 
  DashboardActivitySkeleton,
  DashboardContentSkeleton 
}
