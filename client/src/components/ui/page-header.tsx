import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  className?: string;
}

export function PageHeader({ icon, title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={cn("text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8", className)}>
      <div className="flex items-center justify-center space-x-2 sm:space-x-3">
        <div className="text-primary flex-shrink-0">
          {icon}
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
          {title}
        </h1>
      </div>
      <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto px-4">
        {subtitle}
      </p>
    </div>
  );
}
