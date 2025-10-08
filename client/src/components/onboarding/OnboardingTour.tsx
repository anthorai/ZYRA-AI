import { useState, useEffect } from "react";
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
    title: 'Welcome to Zyra! 🎉',
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
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(true);

  const step = tourSteps[currentStep];

  useEffect(() => {
    if (step.target) {
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        
        let top = 0;
        let left = 0;

        switch (step.placement) {
          case 'bottom':
            top = rect.bottom + 10;
            left = rect.left + rect.width / 2;
            break;
          case 'top':
            top = rect.top - 10;
            left = rect.left + rect.width / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2;
            left = rect.left - 10;
            break;
          case 'right':
            top = rect.top + rect.height / 2;
            left = rect.right + 10;
            break;
          default:
            top = rect.bottom + 10;
            left = rect.left + rect.width / 2;
        }

        setTooltipPosition({ top, left });

        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        targetElement.classList.add('tour-highlight');
        
        return () => {
          targetElement.classList.remove('tour-highlight');
        };
      }
    } else {
      setTooltipPosition({ 
        top: window.innerHeight / 2, 
        left: window.innerWidth / 2 
      });
    }
  }, [currentStep, step.target, step.placement]);

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

  const isWelcomeOrComplete = !step.target;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300" />
      
      <Card 
        className={cn(
          "fixed z-50 w-96 shadow-2xl transition-all duration-300"
        )}
        style={
          isWelcomeOrComplete
            ? { 
                top: '50%', 
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }
            : step.placement === 'left'
            ? { 
                top: `${tooltipPosition.top}px`, 
                left: `${tooltipPosition.left}px`,
                transform: 'translate(-100%, -50%)'
              }
            : step.placement === 'top'
            ? {
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: 'translate(-50%, -100%)'
              }
            : {
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: 'translate(-50%, 0)'
              }
        }
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

      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          border-radius: 8px;
          transition: box-shadow 0.3s ease;
        }
      `}</style>
    </>
  );
}
