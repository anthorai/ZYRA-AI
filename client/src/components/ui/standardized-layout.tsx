import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Wand2, ArrowLeft, User, Settings, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";

// Standardized Page Header matching AI Tools design
interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  iconClassName?: string;
}

export function PageHeader({ icon: Icon, title, subtitle, iconClassName = "text-primary" }: PageHeaderProps) {
  return (
    <div className="text-center space-y-4">
      <h1 className="font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent text-[25px]">
        {title}
      </h1>
      <p className="text-muted-foreground max-w-2xl mx-auto text-[16px]">
        {subtitle}
      </p>
    </div>
  );
}

// Card Page Header with Back Button, Title, and Profile Icon
interface CardPageHeaderProps {
  title: string;
  onBack?: () => void;
  backLabel?: string;
}

export function CardPageHeader({ title, onBack, backLabel = "Back" }: CardPageHeaderProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { handleLogout } = useLogout();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setLocation("/dashboard");
    }
  };

  const displayName = user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return null;
}

// Responsive Card Grid: 1 column mobile, 2 tablet, 3 desktop
interface CardGridProps {
  children: ReactNode;
  className?: string;
}

export function CardGrid({ children, className = "" }: CardGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 ${className}`}>
      {children}
    </div>
  );
}

// Standardized Card matching AI Tools card design
interface StyledCardProps {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  description: string;
  actionText: string;
  onAction: () => void;
  testId?: string;
  actionTestId?: string;
  titleTestId?: string;
  descriptionTestId?: string;
  disabled?: boolean;
  badge?: ReactNode;
}

export function StyledCard({
  icon: Icon,
  iconClassName = "",
  title,
  description,
  actionText,
  onAction,
  testId,
  actionTestId,
  titleTestId,
  descriptionTestId,
  disabled = false,
  badge
}: StyledCardProps) {
  return (
    <Card
      className="group relative overflow-hidden gradient-card rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border border-slate-700/50 hover:border-primary/30"
      data-testid={testId}
    >
      <div className="h-full p-3 sm:p-4 md:p-6 flex flex-col">
        <CardHeader className="p-0 flex-1 space-y-2 sm:space-y-3">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="text-primary flex-shrink-0">
                <Icon className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${iconClassName}`} />
              </div>
              <CardTitle 
                className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white leading-tight"
                data-testid={titleTestId}
              >
                {title}
              </CardTitle>
            </div>
            {badge}
          </div>
          <CardDescription 
            className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3"
            data-testid={descriptionTestId}
          >
            {description}
          </CardDescription>
        </CardHeader>

        <div className="flex justify-center mt-3 sm:mt-4">
          <Button
            onClick={onAction}
            disabled={disabled}
            className="w-full px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 border-0 font-semibold rounded-lg bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid={actionTestId}
          >
            <Wand2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="truncate">
              {actionText}
            </span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Standardized Page Container matching AI Tools layout
interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`max-w-7xl mx-auto space-y-8 ${className}`}>
      {children}
    </div>
  );
}
