import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Store, 
  Shield, 
  RefreshCw,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Link2
} from "lucide-react";

export type ConnectionStep = 
  | 'initializing'
  | 'authenticating' 
  | 'verifying'
  | 'syncing'
  | 'complete'
  | 'error';

interface ConnectionProgressCardProps {
  currentStep: ConnectionStep;
  errorMessage?: string;
  storeName?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
  className?: string;
}

const STEPS = [
  { key: 'initializing', label: 'Initializing', icon: Link2, description: 'Preparing secure connection...' },
  { key: 'authenticating', label: 'Authenticating', icon: Shield, description: 'Connecting with Shopify...' },
  { key: 'verifying', label: 'Verifying', icon: Store, description: 'Verifying store credentials...' },
  { key: 'syncing', label: 'Syncing', icon: RefreshCw, description: 'Syncing store data...' },
  { key: 'complete', label: 'Connected', icon: CheckCircle2, description: 'Your store is ready!' },
];

const getStepIndex = (step: ConnectionStep): number => {
  if (step === 'error') return -1;
  return STEPS.findIndex(s => s.key === step);
};

const getProgressValue = (step: ConnectionStep): number => {
  const index = getStepIndex(step);
  if (index === -1) return 0;
  return ((index + 1) / STEPS.length) * 100;
};

export function ConnectionProgressCard({
  currentStep,
  errorMessage,
  storeName,
  onRetry,
  onCancel,
  onComplete,
  className = ""
}: ConnectionProgressCardProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const targetProgress = getProgressValue(currentStep);
  const currentStepIndex = getStepIndex(currentStep);
  const isError = currentStep === 'error';
  const isComplete = currentStep === 'complete';

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(targetProgress);
    }, 100);
    return () => clearTimeout(timer);
  }, [targetProgress]);

  // Get current step details
  const getCurrentStepDetails = () => {
    if (isError) {
      return {
        icon: AlertCircle,
        label: 'Connection Failed',
        description: errorMessage || 'Unable to connect to your Shopify store'
      };
    }
    const step = STEPS[currentStepIndex];
    return step || STEPS[0];
  };

  const stepDetails = getCurrentStepDetails();
  const StepIcon = stepDetails.icon;

  return (
    <Card className={`w-full max-w-md gradient-card border-0 overflow-visible ${className}`}>
      <CardContent className="p-6 sm:p-8">
        {/* Header with animated icon */}
        <div className="text-center mb-6">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-500 ${
            isError 
              ? 'bg-red-500/20' 
              : isComplete 
                ? 'bg-green-500/20' 
                : 'bg-primary/20'
          }`}>
            {isError ? (
              <AlertCircle className="w-10 h-10 text-red-400" />
            ) : isComplete ? (
              <Sparkles className="w-10 h-10 text-green-400 animate-pulse" />
            ) : (
              <StepIcon className={`w-10 h-10 text-primary ${!isComplete ? 'animate-pulse' : ''}`} />
            )}
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2" data-testid="text-connection-title">
            {isError ? 'Connection Failed' : isComplete ? 'Store Connected!' : 'Connecting to Shopify'}
          </h2>
          
          {storeName && isComplete && (
            <p className="text-primary font-medium mb-2" data-testid="text-store-name">
              {storeName}
            </p>
          )}
          
          <p className="text-slate-400 text-sm" data-testid="text-connection-description">
            {stepDetails.description}
          </p>
        </div>

        {/* Progress bar - only show when not error/complete */}
        {!isError && !isComplete && (
          <div className="mb-6">
            <Progress 
              value={animatedProgress} 
              className="h-2 bg-slate-700"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>Connecting...</span>
              <span>{Math.round(animatedProgress)}%</span>
            </div>
          </div>
        )}

        {/* Step indicators */}
        <div className="space-y-3 mb-6">
          {STEPS.map((step, index) => {
            const isCurrentStep = index === currentStepIndex;
            const isCompletedStep = index < currentStepIndex || isComplete;
            const isPendingStep = index > currentStepIndex && !isError;
            const Icon = step.icon;

            return (
              <div 
                key={step.key}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                  isCurrentStep && !isError
                    ? 'bg-primary/10 border border-primary/30' 
                    : isCompletedStep 
                      ? 'bg-green-500/10 border border-green-500/20' 
                      : isError && index === 0
                        ? 'bg-red-500/10 border border-red-500/20'
                        : 'bg-slate-800/30 border border-slate-700/30'
                }`}
                data-testid={`step-${step.key}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompletedStep 
                    ? 'bg-green-500/20' 
                    : isCurrentStep && !isError
                      ? 'bg-primary/20'
                      : 'bg-slate-700/50'
                }`}>
                  {isCompletedStep ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : isCurrentStep && !isError ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isPendingStep ? 'text-slate-500' : 'text-slate-400'}`} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    isCompletedStep 
                      ? 'text-green-400' 
                      : isCurrentStep && !isError
                        ? 'text-primary'
                        : 'text-slate-400'
                  }`}>
                    {step.label}
                  </p>
                </div>

                {isCurrentStep && !isError && !isComplete && (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <span>In progress</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Error state with retry */}
        {isError && (
          <Alert className="bg-red-500/10 border-red-500/30 mb-4">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300 text-sm">
              {errorMessage || 'Connection failed. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {isError && (
            <>
              <Button
                onClick={onRetry}
                className="w-full gradient-button"
                data-testid="button-retry-connection"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                className="w-full border-slate-600 text-slate-300"
                data-testid="button-cancel-connection"
              >
                Cancel
              </Button>
            </>
          )}

          {isComplete && (
            <>
              <Alert className="bg-green-500/10 border-green-500/30">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300 text-sm">
                  Your Shopify store is now connected! You can start using all Zyra AI features.
                </AlertDescription>
              </Alert>
              <Button
                onClick={onComplete}
                className="w-full gradient-button"
                data-testid="button-go-to-dashboard"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {!isError && !isComplete && (
            <div className="text-center">
              <p className="text-xs text-slate-500">
                Please wait while we securely connect your store...
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for managing connection progress state
export function useConnectionProgress() {
  const [step, setStep] = useState<ConnectionStep>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);

  const reset = () => {
    setStep('initializing');
    setError(null);
    setStoreName(null);
  };

  const setConnectionStep = (newStep: ConnectionStep) => {
    setStep(newStep);
    if (newStep !== 'error') {
      setError(null);
    }
  };

  const setConnectionError = (errorMsg: string) => {
    setStep('error');
    setError(errorMsg);
  };

  const setConnectionComplete = (store?: string) => {
    setStep('complete');
    if (store) setStoreName(store);
  };

  return {
    step,
    error,
    storeName,
    reset,
    setStep: setConnectionStep,
    setError: setConnectionError,
    setComplete: setConnectionComplete,
    setStoreName
  };
}
