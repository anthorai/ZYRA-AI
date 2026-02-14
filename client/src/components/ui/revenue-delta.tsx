import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevenueDeltaProps {
  amount: number;
  currency?: string;
  showSign?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function RevenueDelta({ 
  amount, 
  currency = 'USD',
  showSign = true,
  showIcon = true,
  size = 'md',
  className 
}: RevenueDeltaProps) {
  const isPositive = amount > 0;
  const isNegative = amount < 0;
  const isNeutral = amount === 0;
  
  const absAmount = Math.abs(amount);
  
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: absAmount >= 1000 ? 0 : 2,
  }).format(absAmount);
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl font-bold',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };
  
  const colorClasses = isPositive 
    ? 'text-green-500 dark:text-green-400' 
    : isNegative 
    ? 'text-red-500 dark:text-red-400'
    : 'text-muted-foreground';
  
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        sizeClasses[size],
        colorClasses,
        className
      )}
      data-testid="revenue-delta"
    >
      {showIcon && (
        isPositive ? (
          <ArrowUpRight className={iconSizes[size]} />
        ) : isNegative ? (
          <ArrowDownRight className={iconSizes[size]} />
        ) : (
          <Minus className={iconSizes[size]} />
        )
      )}
      <span>
        {showSign && isPositive && '+'}
        {showSign && isNegative && '-'}
        {formatted}
      </span>
    </span>
  );
}

interface RevenueDeltaCardProps {
  title: string;
  amount: number;
  description?: string;
  currency?: string;
  period?: string;
  className?: string;
}

export function RevenueDeltaCard({
  title,
  amount,
  description,
  currency = 'USD',
  period,
  className,
}: RevenueDeltaCardProps) {
  const isPositive = amount >= 0;
  
  return (
    <div 
      className={cn(
        "p-4 rounded-lg border",
        isPositive 
          ? "bg-green-500/5 dark:bg-green-400/5 border-green-500/20 dark:border-green-400/20"
          : "bg-red-500/5 dark:bg-red-400/5 border-red-500/20 dark:border-red-400/20",
        className
      )}
      data-testid="revenue-delta-card"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        {period && (
          <span className="text-xs text-muted-foreground">{period}</span>
        )}
      </div>
      <RevenueDelta amount={amount} currency={currency} size="xl" />
      {description && (
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  );
}
