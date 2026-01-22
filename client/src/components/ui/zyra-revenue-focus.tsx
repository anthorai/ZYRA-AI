/**
 * ZYRA Revenue Focus Components
 * 
 * For Scale users, the UI shifts focus from individual actions
 * to aggregate revenue impact. These components support that
 * revenue-focused view.
 * 
 * PLAN BEHAVIORS:
 * - Starter+/Growth: Show individual action details
 * - Scale: Show revenue totals and high-level summaries
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Sparkles,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { usePlanExperience } from "@/hooks/use-plan-experience";
import { cn } from "@/lib/utils";

interface RevenueStat {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface ZyraRevenueCardProps {
  title: string;
  stats: RevenueStat[];
  zyraContribution?: string;
  actionsToday?: number;
  className?: string;
}

export function ZyraRevenueCard({
  title,
  stats,
  zyraContribution,
  actionsToday,
  className,
}: ZyraRevenueCardProps) {
  const { tier, focusOnRevenue } = usePlanExperience();
  
  return (
    <Card className={cn("", className)} data-testid="card-revenue">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          {focusOnRevenue && zyraContribution && (
            <Badge variant="outline" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              ZYRA: {zyraContribution}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className={cn(
          "grid gap-4",
          focusOnRevenue ? "grid-cols-2" : "grid-cols-1"
        )}>
          {stats.map((stat, i) => (
            <div key={i} className="space-y-1">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "font-bold",
                  focusOnRevenue ? "text-2xl" : "text-lg"
                )}>
                  {stat.value}
                </span>
                {stat.change && (
                  <span className={cn(
                    "text-xs flex items-center",
                    stat.trend === 'up' && "text-green-600 dark:text-green-400",
                    stat.trend === 'down' && "text-red-600 dark:text-red-400",
                    stat.trend === 'neutral' && "text-muted-foreground"
                  )}>
                    {stat.trend === 'up' && <TrendingUp className="h-3 w-3 mr-0.5" />}
                    {stat.trend === 'down' && <TrendingDown className="h-3 w-3 mr-0.5" />}
                    {stat.change}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {!focusOnRevenue && actionsToday !== undefined && actionsToday > 0 && (
          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3 w-3" />
            {actionsToday} optimization{actionsToday !== 1 ? 's' : ''} applied today
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ZyraImpactSummaryProps {
  period: 'today' | 'week' | 'month';
  totalRevenue: string;
  zyraRevenue: string;
  actionsCount: number;
  topAction?: { type: string; impact: string };
  className?: string;
}

export function ZyraImpactSummary({
  period,
  totalRevenue,
  zyraRevenue,
  actionsCount,
  topAction,
  className,
}: ZyraImpactSummaryProps) {
  const { tier, focusOnRevenue } = usePlanExperience();
  
  const periodLabels = {
    today: "Today",
    week: "This week",
    month: "This month",
  };
  
  if (!focusOnRevenue) {
    return (
      <Card className={cn("border-primary/20", className)} data-testid="impact-summary">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                ZYRA helped generate {zyraRevenue} {periodLabels[period].toLowerCase()}
              </p>
              <p className="text-xs text-muted-foreground">
                From {actionsCount} automated optimization{actionsCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn("bg-gradient-to-br from-primary/10 to-primary/5", className)} data-testid="impact-summary-scale">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {periodLabels[period]} Revenue
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-bold">{totalRevenue}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs gap-1 border-primary/30">
              <Sparkles className="h-3 w-3 text-primary" />
              {zyraRevenue} from ZYRA
            </Badge>
          </div>
        </div>
        
        {topAction && (
          <div className="pt-2 border-t border-primary/10">
            <p className="text-xs text-muted-foreground">Top performer</p>
            <p className="text-sm mt-0.5">
              {topAction.type}: <span className="text-primary font-medium">{topAction.impact}</span>
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{actionsCount} optimizations</span>
          <span className="flex items-center gap-1 text-primary">
            View details <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface ZyraActivityFeedProps {
  activities: Array<{
    id: string;
    type: string;
    title: string;
    timestamp: string;
    status: 'auto_applied' | 'approved' | 'pending' | 'completed';
    impact?: string;
  }>;
  maxItems?: number;
  className?: string;
}

export function ZyraActivityFeed({
  activities,
  maxItems = 5,
  className,
}: ZyraActivityFeedProps) {
  const { tier, focusOnRevenue, getActionStatusLabel } = usePlanExperience();
  
  const displayActivities = activities.slice(0, maxItems);
  
  const statusLabels: Record<string, Record<string, string>> = {
    trial: {
      auto_applied: "Applied",
      approved: "You approved",
      pending: "Needs review",
      completed: "Done",
    },
    starter: {
      auto_applied: "Applied",
      approved: "Approved",
      pending: "Awaiting review",
      completed: "Complete",
    },
    growth: {
      auto_applied: "Auto-applied",
      approved: "Approved",
      pending: "Quick review",
      completed: "Done",
    },
    scale: {
      auto_applied: "Auto",
      approved: "Confirmed",
      pending: "Review",
      completed: "",
    },
  };
  
  return (
    <div className={cn("space-y-2", className)} data-testid="activity-feed">
      {focusOnRevenue ? (
        <div className="text-xs text-muted-foreground mb-3">
          Recent optimizations
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm font-medium mb-3">
          <Activity className="h-4 w-4 text-primary" />
          ZYRA Activity
        </div>
      )}
      
      {displayActivities.map((activity) => (
        <div 
          key={activity.id}
          className={cn(
            "flex items-center gap-3 py-2",
            !focusOnRevenue && "border-b border-border/50 last:border-0"
          )}
        >
          <div className="flex-1 min-w-0">
            <p className={cn(
              "truncate",
              focusOnRevenue ? "text-xs" : "text-sm"
            )}>
              {activity.title}
            </p>
            {!focusOnRevenue && (
              <p className="text-xs text-muted-foreground">
                {activity.timestamp}
              </p>
            )}
          </div>
          
          {focusOnRevenue && activity.impact ? (
            <span className="text-xs font-medium text-primary shrink-0">
              {activity.impact}
            </span>
          ) : (
            <Badge 
              variant={activity.status === 'pending' ? 'secondary' : 'outline'}
              className="text-xs shrink-0"
            >
              {statusLabels[tier]?.[activity.status] || activity.status}
            </Badge>
          )}
        </div>
      ))}
      
      {activities.length > maxItems && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          +{activities.length - maxItems} more
        </p>
      )}
    </div>
  );
}
