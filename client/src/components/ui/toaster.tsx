import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2 } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isSuccess = variant === "success";
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              {isSuccess && (
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#22C55E' }} />
              )}
              <div className="grid gap-1">
                {title && (
                  <ToastTitle style={isSuccess ? { color: '#FFFFFF', fontWeight: 600 } : undefined}>
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription style={isSuccess ? { color: '#C6D2FF', opacity: 1 } : undefined}>
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose
              style={isSuccess ? { color: '#7C86B8' } : undefined}
              className={isSuccess ? "hover:!text-[#E6F7FF]" : ""}
            />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
