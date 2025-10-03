import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  actionText: string;
  category?: 'new' | 'existing' | 'metric' | 'performance' | 'growth';
  comingSoon?: boolean;
  value?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: (id: string) => void;
  className?: string;
  variant?: 'default' | 'analytics' | 'dashboard';
}

export function ToolCard({
  id,
  title,
  description,
  icon,
  actionText,
  category,
  comingSoon = false,
  value,
  change,
  trend,
  onClick,
  className,
  variant = 'default'
}: ToolCardProps) {
  const handleClick = () => {
    if (onClick && !comingSoon) {
      onClick(id);
    }
  };

  const cardClassName = cn(
    "relative transition-all duration-300 hover:scale-105 cursor-pointer",
    variant === 'analytics' && "gradient-card rounded-2xl border-slate-700/50 hover:shadow-cyan-500/30",
    variant === 'dashboard' && "gradient-card border-0",
    variant === 'default' && "hover:shadow-lg",
    className
  );

  return (
    <Card 
      className={cardClassName}
      onClick={handleClick}
      data-testid={`card-tool-${id}`}
    >
      {comingSoon && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
        </div>
      )}
      
      {category && (
        <div className="absolute top-3 left-3 z-10">
          <Badge 
            variant={category === 'new' ? 'default' : 'secondary'} 
            className="text-xs"
          >
            {category === 'new' ? 'New' : category}
          </Badge>
        </div>
      )}

      <CardHeader className={cn(
        "pb-4",
        variant === 'analytics' && "min-h-[120px]"
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 transition-all duration-300">
              {icon}
            </div>
            <CardTitle className={cn(
              "font-bold text-sm sm:text-base lg:text-lg",
              variant === 'analytics' && "text-white"
            )} data-testid={`text-title-${id}`}>
              {title}
            </CardTitle>
          </div>
          {value && (
            <div className="text-right">
              <div className="text-2xl font-bold">{value}</div>
              {change && (
                <div className={cn(
                  "text-sm",
                  trend === 'up' && "text-green-400",
                  trend === 'down' && "text-red-400",
                  trend === 'neutral' && "text-gray-400"
                )}>
                  {change}
                </div>
              )}
            </div>
          )}
        </div>
        <CardDescription className={cn(
          "text-xs sm:text-sm leading-relaxed ml-7 sm:ml-11",
          variant === 'analytics' && "text-slate-300 min-h-[40px]"
        )} data-testid={`text-description-${id}`}>
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 pb-6 px-6 mt-auto">
        <Button
          className={cn(
            "h-10 w-full font-medium transition-all duration-300",
            variant === 'analytics' && "gradient-button hover:scale-105",
            variant === 'dashboard' && "gradient-button",
            comingSoon && "opacity-50 cursor-not-allowed"
          )}
          disabled={comingSoon}
          data-testid={`button-action-${id}`}
        >
          {actionText}
        </Button>
      </CardContent>
    </Card>
  );
}

export default ToolCard;