import { useState } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  target: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    target: '',
    title: 'Welcome to Zyra AI! 🎉',
    description: 'Let\'s take a quick tour to help you get started with AI-powered product optimization.',
    placement: 'bottom'
  },
  {
    id: 'dashboard',
    target: '[data-tour="dashboard"]',
    title: 'Dashboard Overview',
    description: 'View your key metrics, recent activity, and performance insights at a glance.',
    placement: 'bottom'
  },
  {
    id: 'products',
    target: '[data-tour="products"]',
    title: 'Product Management',
    description: 'Add and manage your products. Use AI to generate compelling descriptions and optimize for SEO.',
    placement: 'bottom'
  },
  {
    id: 'ai-tools',
    target: '[data-tour="ai-tools"]',
    title: 'AI Tools',
    description: 'Access powerful AI features including product description generation, SEO optimization, and image alt-text creation.',
    placement: 'bottom'
  },
  {
    id: 'campaigns',
    target: '[data-tour="campaigns"]',
    title: 'Marketing Campaigns',
    description: 'Create and send email or SMS campaigns to engage your customers and recover abandoned carts.',
    placement: 'bottom'
  },
  {
    id: 'analytics',
    target: '[data-tour="analytics"]',
    title: 'Analytics & Insights',
    description: 'Track your performance with detailed analytics, campaign metrics, and conversion data.',
    placement: 'bottom'
  },
  {
    id: 'notifications',
    target: '[data-tour="notifications"]',
    title: 'Notifications',
    description: 'Stay updated with real-time notifications about campaigns, AI generations, billing, and performance updates.',
    placement: 'left'
  },
  {
    id: 'complete',
    target: '',
    title: 'You\'re All Set! 🚀',
    description: 'You\'re ready to start optimizing your products with AI. Need help? Check out our support resources.',
    placement: 'bottom'
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = tourSteps[currentStep];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(() => {
      onSkip();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300" />
      
      <Card 
        className={cn(
          "fixed z-50 w-96 shadow-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        data-testid="onboarding-tour-card"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg" data-testid="tour-step-title">{step.title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-6 w-6 p-0"
              data-testid="button-skip-tour"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground" data-testid="tour-step-description">
            {step.description}
          </p>

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    index === currentStep ? "bg-primary" : "bg-muted"
                  )}
                  data-testid={`tour-progress-${index}`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  data-testid="button-previous-step"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                data-testid="button-next-step"
              >
                {currentStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}
                {currentStep < tourSteps.length - 1 && (
                  <ChevronRight className="h-4 w-4 ml-1" />
                )}
              </Button>
            </div>
          </div>

          <div className="text-xs text-center text-muted-foreground" data-testid="tour-step-counter">
            Step {currentStep + 1} of {tourSteps.length}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
