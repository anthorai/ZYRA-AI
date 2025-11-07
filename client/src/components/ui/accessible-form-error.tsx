import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

interface AccessibleFormErrorProps {
  id: string;
  error?: string;
}

export function AccessibleFormError({ id, error }: AccessibleFormErrorProps) {
  if (!error) return null;

  return (
    <div 
      id={id}
      role="alert"
      aria-live="polite"
      className="flex items-center gap-2 text-sm text-destructive mt-1.5"
      data-testid={`error-${id}`}
    >
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <span>{error}</span>
    </div>
  );
}

interface AccessibleFormFieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  description?: string;
}

export function AccessibleFormField({ 
  id, 
  label, 
  error, 
  required = false,
  children,
  description 
}: AccessibleFormFieldProps) {
  const errorId = `${id}-error`;
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className="space-y-2">
      <label 
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      <div 
        className="relative"
        aria-invalid={!!error}
        aria-describedby={[errorId, descriptionId].filter(Boolean).join(' ') || undefined}
      >
        {children}
      </div>
      
      <AccessibleFormError id={errorId} error={error} />
    </div>
  );
}
