interface GradientPageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

export function GradientPageHeader({ icon, title, subtitle }: GradientPageHeaderProps) {
  return (
    <div className="text-center space-y-4 mb-8">
      <div className="flex items-center justify-center space-x-2">
        {icon}
        <h1 
          className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent"
          data-testid="text-page-title"
        >
          {title}
        </h1>
      </div>
      <p 
        className="text-xl text-muted-foreground max-w-2xl mx-auto"
        data-testid="text-page-subtitle"
      >
        {subtitle}
      </p>
    </div>
  );
}
