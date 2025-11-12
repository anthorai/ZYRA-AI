import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type WizardStep = {
  id: string;
  title: string;
  description: string;
};

type CampaignWizardProps = {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete?: () => void;
  children: React.ReactNode;
  canProceed?: boolean;
  isSubmitting?: boolean;
};

export function CampaignWizard({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  children,
  canProceed = true,
  isSubmitting = false
}: CampaignWizardProps) {
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (canProceed && !isLastStep) {
      onStepChange(currentStep + 1);
    } else if (isLastStep && onComplete) {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <button
                onClick={() => index < currentStep && onStepChange(index)}
                disabled={index > currentStep}
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all",
                  index < currentStep && "bg-primary text-primary-foreground cursor-pointer hover-elevate",
                  index === currentStep && "bg-primary text-primary-foreground",
                  index > currentStep && "bg-slate-700 text-slate-400 cursor-not-allowed"
                )}
                data-testid={`step-indicator-${index}`}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    "flex-1 h-1 mx-2 transition-all",
                    index < currentStep ? "bg-primary" : "bg-slate-700"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex items-start justify-between">
          {steps.map((step, index) => (
            <div 
              key={`label-${step.id}`}
              className="flex flex-col items-center"
              style={{ width: `${100 / steps.length}%` }}
            >
              <p className={cn(
                "text-sm font-medium transition-colors text-center",
                index === currentStep ? "text-white" : "text-slate-400"
              )}>
                {step.title}
              </p>
              {index === currentStep && (
                <p className="text-xs text-slate-500 mt-1 text-center">
                  {step.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {children}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-700">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep || isSubmitting}
          className="border-slate-700"
          data-testid="button-previous-step"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="text-sm text-slate-400">
          Step {currentStep + 1} of {steps.length}
        </div>

        <Button
          type="button"
          onClick={handleNext}
          disabled={!canProceed || isSubmitting}
          data-testid="button-next-step"
        >
          {isLastStep ? (
            isSubmitting ? "Creating..." : "Create Campaign"
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
