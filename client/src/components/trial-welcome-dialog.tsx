import { useEffect, useState } from "react";
import { useTrialStatus } from "@/hooks/use-trial-status";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, Zap, Target } from "lucide-react";
import { Link } from "wouter";

export function TrialWelcomeDialog() {
  const { isOnTrial, daysRemaining, shouldShowWelcome, markWelcomeShown, trialEndDate, isLoading, isMarkingShown } = useTrialStatus();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && shouldShowWelcome && isOnTrial && daysRemaining > 0) {
      setIsOpen(true);
    }
  }, [isLoading, shouldShowWelcome, isOnTrial, daysRemaining]);

  const handleClose = async () => {
    const success = await markWelcomeShown();
    if (success) {
      setIsOpen(false);
    } else {
      toast({
        title: "Could not save preference",
        description: "We'll remind you again tomorrow.",
        variant: "destructive",
      });
      setIsOpen(false);
    }
  };

  const handleUpgrade = async () => {
    await handleClose();
  };

  if (!isOnTrial || daysRemaining <= 0) {
    return null;
  }

  const getMessageByDaysRemaining = () => {
    if (daysRemaining === 7) {
      return {
        title: "Welcome to Zyra AI!",
        subtitle: "Your 7-day free trial has started",
        message: "Explore all our powerful features including AI-powered product descriptions, SEO optimization, and smart marketing automation.",
        icon: <Sparkles className="w-6 h-6 text-primary" />,
        badgeText: "7 days left",
        badgeVariant: "default" as const
      };
    } else if (daysRemaining >= 4) {
      return {
        title: "Welcome back!",
        subtitle: `${daysRemaining} days left in your trial`,
        message: "Continue exploring Zyra AI features. Optimize your products, automate your marketing, and grow your sales.",
        icon: <Zap className="w-6 h-6 text-primary" />,
        badgeText: `${daysRemaining} days left`,
        badgeVariant: "default" as const
      };
    } else if (daysRemaining >= 2) {
      return {
        title: "Trial ending soon!",
        subtitle: `Only ${daysRemaining} days left`,
        message: "Make the most of your remaining trial time. Upgrade now to keep all your AI-generated content and continue optimizing your store.",
        icon: <Clock className="w-6 h-6 text-yellow-500" />,
        badgeText: `${daysRemaining} days left`,
        badgeVariant: "secondary" as const
      };
    } else {
      return {
        title: "Last day of your trial!",
        subtitle: "Your trial expires tomorrow",
        message: "Upgrade today to ensure uninterrupted access to all your products, campaigns, and AI tools. All your data will be preserved.",
        icon: <Target className="w-6 h-6 text-destructive" />,
        badgeText: "Expires tomorrow",
        badgeVariant: "destructive" as const
      };
    }
  };

  const content = getMessageByDaysRemaining();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-trial-welcome">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              {content.icon}
            </div>
            <Badge variant={content.badgeVariant} data-testid="badge-trial-days">
              {content.badgeText}
            </Badge>
          </div>
          <DialogTitle className="text-xl" data-testid="text-trial-title">
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-base" data-testid="text-trial-subtitle">
            {content.subtitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-muted-foreground" data-testid="text-trial-message">
            {content.message}
          </p>
          
          {trialEndDate && (
            <p className="text-sm text-muted-foreground mt-3" data-testid="text-trial-end-date">
              Trial ends: {trialEndDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isMarkingShown}
            className="w-full sm:w-auto"
            data-testid="button-trial-continue"
          >
            {isMarkingShown ? "Saving..." : "Continue Exploring"}
          </Button>
          <Link href="/settings/billing">
            <Button 
              onClick={handleUpgrade}
              disabled={isMarkingShown}
              className="w-full sm:w-auto"
              data-testid="button-trial-upgrade"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
