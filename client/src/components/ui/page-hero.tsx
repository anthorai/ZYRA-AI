interface GradientPageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

export function GradientPageHeader({ icon, title, subtitle }: GradientPageHeaderProps) {
  return (
    <div className="text-center space-y-2 sm:space-y-4 mb-4 sm:mb-8">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-5 h-5 sm:w-8 sm:h-8 flex-shrink-0">{icon}</div>
        <h1 
          className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent"
          data-testid="text-page-title"
        >
          {title}
        </h1>
      </div>
      <p 
        className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-2"
        data-testid="text-page-subtitle"
      >
        {subtitle}
      </p>
    </div>
  );
}
