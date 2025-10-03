import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}

export function AuthCard({ title, subtitle, children, className }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <Card className={cn("gradient-card border-0", className)} data-testid="card-auth">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold" data-testid="text-auth-title">
                {title}
              </h2>
              <p className="text-muted-foreground" data-testid="text-auth-subtitle">
                {subtitle}
              </p>
            </div>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AuthCard;
