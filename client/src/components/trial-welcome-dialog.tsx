import { useEffect, useState } from "react";
import { useTrialStatus } from "@/hooks/use-trial-status";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
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

// Public pages where trial dialog should NOT show
const PUBLIC_PAGES = ['/', '/auth', '/about', '/contact', '/help', '/terms', '/blog', '/privacy-policy', '/terms-of-service', '/forgot-password', '/reset-password', '/auth/callback', '/shopify/install'];

export function TrialWelcomeDialog() {
  const { user, loading: authLoading } = useAuth();
  const [location] = useLocation();
  const { isOnTrial, daysRemaining, shouldShowWelcome, markWelcomeShown, trialEndDate, isLoading, isMarkingShown } = useTrialStatus();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Check if current page is a public page (should not show dialog)
  const isPublicPage = PUBLIC_PAGES.some(page => {
    if (page === '/') return location === '/';
    return location.startsWith(page);
  });

  useEffect(() => {
    // Only show dialog on authenticated dashboard pages
    if (!authLoading && user && !isPublicPage && !isLoading && shouldShowWelcome && isOnTrial && daysRemaining > 0) {
      setIsOpen(true);
    }
  }, [authLoading, user, isPublicPage, isLoading, shouldShowWelcome, isOnTrial, daysRemaining]);

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

  // Don't render on public pages or when user is not authenticated
  if (!user || isPublicPage || !isOnTrial || daysRemaining <= 0) {
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
      <DialogContent 
        className="sm:max-w-md !rounded-[18px] [&>button]:text-[#7C86B8] [&>button:hover]:text-[#E6F7FF]" 
        style={{ 
          background: '#141C36', 
          border: '1px solid rgba(0,240,255,0.35)',
          boxShadow: 'none'
        }}
        data-testid="dialog-trial-welcome"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(0,240,255,0.15)' }}>
              {(() => {
                const iconProps = { className: "w-6 h-6", style: { color: '#00F0FF' } };
                if (daysRemaining === 7) return <Sparkles {...iconProps} />;
                if (daysRemaining >= 4) return <Zap {...iconProps} />;
                if (daysRemaining >= 2) return <Clock {...iconProps} />;
                return <Target {...iconProps} />;
              })()}
            </div>
            <Badge 
              variant="outline"
              className="no-default-hover-elevate no-default-active-elevate"
              style={{ 
                background: 'rgba(0,240,255,0.15)', 
                border: '1px solid rgba(0,240,255,0.4)',
                color: '#00F0FF',
                fontWeight: 600
              }}
              data-testid="badge-trial-days"
            >
              {content.badgeText}
            </Badge>
          </div>
          <DialogTitle 
            className="text-xl" 
            style={{ color: '#FFFFFF', fontWeight: 700 }}
            data-testid="text-trial-title"
          >
            {content.title}
          </DialogTitle>
          <DialogDescription 
            className="text-base" 
            style={{ color: '#A9B4E5', fontWeight: 500 }}
            data-testid="text-trial-subtitle"
          >
            {content.subtitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p style={{ color: '#C6D2FF' }} data-testid="text-trial-message">
            {content.message}
          </p>
          
          {trialEndDate && (
            <p className="text-sm mt-3" style={{ color: '#9AA6D6' }} data-testid="text-trial-end-date">
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
            onClick={handleClose}
            disabled={isMarkingShown}
            className="w-full sm:w-auto no-default-hover-elevate"
            style={{ 
              background: '#00F0FF', 
              color: '#04141C', 
              border: 'none',
              fontWeight: 600
            }}
            data-testid="button-trial-continue"
          >
            {isMarkingShown ? "Saving..." : "Continue Exploring"}
          </Button>
          <Link href="/settings/billing">
            <Button 
              variant="outline"
              onClick={handleUpgrade}
              disabled={isMarkingShown}
              className="w-full sm:w-auto no-default-hover-elevate"
              style={{ 
                background: 'transparent', 
                border: '1px solid rgba(167,139,250,0.4)',
                color: '#A78BFA'
              }}
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
