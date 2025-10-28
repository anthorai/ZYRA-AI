import { ReactNode } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
  className?: string;
  testId?: string;
}

export function ToolCard({
  icon,
  title,
  description,
  buttonText,
  onClick,
  disabled = false,
  comingSoon = false,
  className,
  testId,
}: ToolCardProps) {
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden gradient-card rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border border-slate-700/50 hover:border-primary/30",
        className
      )}
      data-testid={testId}
    >
      <div className="h-full p-3 sm:p-4 md:p-6 flex flex-col">
        <CardHeader className="p-0 flex-1 space-y-2 sm:space-y-3">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="text-primary flex-shrink-0">
                {icon}
              </div>
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white leading-tight truncate">
                {title}
              </CardTitle>
            </div>
            {comingSoon && (
              <Badge className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded-full hover:bg-slate-700 flex-shrink-0 ml-2">
                Soon
              </Badge>
            )}
          </div>
          <CardDescription className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3">
            {description}
          </CardDescription>
        </CardHeader>
        
        <div className="flex justify-center mt-3 sm:mt-4">
          <Button
            onClick={onClick}
            disabled={disabled || comingSoon}
            className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-semibold rounded-full px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid={`${testId}-button`}
          >
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
            {buttonText}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ToolCard;
