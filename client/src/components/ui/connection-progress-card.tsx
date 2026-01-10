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
  { key: 'initializing', label: 'Initializing', icon: Link2 },
  { key: 'authenticating', label: 'Authenticating', icon: Shield },
  { key: 'verifying', label: 'Verifying', icon: Store },
  { key: 'syncing', label: 'Syncing', icon: RefreshCw },
  { key: 'complete', label: 'Connected', icon: CheckCircle2 },
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(targetProgress);
    }, 100);
    return () => clearTimeout(timer);
  }, [targetProgress]);

  return (
    <Card className={`w-full max-w-sm bg-slate-900/95 border border-slate-700/50 shadow-lg ${className}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="text-center mb-4">
          <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
            isError ? 'bg-red-500/20' : isComplete ? 'bg-green-500/20' : 'bg-primary/20'
          }`}>
            {isError ? (
              <AlertCircle className="w-6 h-6 text-red-400" />
            ) : isComplete ? (
              <Sparkles className="w-6 h-6 text-green-400" />
            ) : (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            )}
          </div>
          
          <h3 className="text-base font-semibold text-white mb-1" data-testid="text-connection-title">
            {isError ? 'Connection Failed' : isComplete ? 'Store Connected!' : 'Connecting...'}
          </h3>
          
          {storeName && isComplete && (
            <p className="text-primary text-sm font-medium" data-testid="text-store-name">{storeName}</p>
          )}
        </div>

        {/* Progress bar */}
        {!isError && !isComplete && (
          <div className="mb-4">
            <Progress value={animatedProgress} className="h-1.5 bg-slate-700" />
            <p className="text-xs text-slate-500 text-center mt-1">{Math.round(animatedProgress)}%</p>
          </div>
        )}

        {/* Compact step indicators */}
        <div className="flex justify-between mb-4">
          {STEPS.map((step, index) => {
            const isCompletedStep = index < currentStepIndex || isComplete;
            const isCurrentStep = index === currentStepIndex && !isError && !isComplete;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center" data-testid={`step-${step.key}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                  isCompletedStep 
                    ? 'bg-green-500/20' 
                    : isCurrentStep 
                      ? 'bg-primary/20 ring-2 ring-primary/40'
                      : 'bg-slate-700/50'
                }`}>
                  {isCompletedStep ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  ) : isCurrentStep ? (
                    <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                  ) : (
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
                <span className={`text-[9px] ${
                  isCompletedStep ? 'text-green-400' : isCurrentStep ? 'text-primary' : 'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {isError && (
          <Alert className="bg-red-500/10 border-red-500/30 mb-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 text-red-400" />
            <AlertDescription className="text-red-300 text-xs">
              {errorMessage || 'Connection failed. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Success message */}
        {isComplete && (
          <div className="flex items-center gap-2 bg-green-500/10 rounded-md px-3 py-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
            <span className="text-green-300 text-xs">Your store is connected and ready!</span>
          </div>
        )}

        {/* Action buttons */}
        {isError && (
          <div className="flex gap-2">
            <Button onClick={onCancel} variant="outline" size="sm" className="flex-1 border-slate-600 text-slate-300" data-testid="button-cancel-connection">
              Cancel
            </Button>
            <Button onClick={onRetry} size="sm" className="flex-1 gradient-button" data-testid="button-retry-connection">
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </Button>
          </div>
        )}

        {isComplete && (
          <Button onClick={onComplete} size="sm" className="w-full gradient-button" data-testid="button-go-to-dashboard">
            Continue <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        )}

        {!isError && !isComplete && (
          <p className="text-xs text-slate-500 text-center">Please wait...</p>
        )}
      </CardContent>
    </Card>
  );
}

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
    if (newStep !== 'error') setError(null);
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
