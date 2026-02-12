import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, AlertCircle, Info } from "lucide-react"

const variantConfig = {
  default: {
    icon: Info,
    iconColor: '#3B82F6',
    titleColor: '#FFFFFF',
    descColor: '#C6D2FF',
    closeColor: '#7C86B8',
    closeHover: 'hover:!text-[#E6F7FF]',
  },
  destructive: {
    icon: AlertCircle,
    iconColor: '#EF4444',
    titleColor: '#FFFFFF',
    descColor: '#E8B4B4',
    closeColor: '#9B7C7C',
    closeHover: 'hover:!text-[#FFE6E6]',
  },
  success: {
    icon: CheckCircle2,
    iconColor: '#22C55E',
    titleColor: '#FFFFFF',
    descColor: '#C6D2FF',
    closeColor: '#7C86B8',
    closeHover: 'hover:!text-[#E6F7FF]',
  },
};

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const v = variant || "default";
        const config = variantConfig[v as keyof typeof variantConfig] || variantConfig.default;
        const Icon = config.icon;
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: config.iconColor }} />
              <div className="grid gap-1">
                {title && (
                  <ToastTitle style={{ color: config.titleColor, fontWeight: 600 }}>
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription style={{ color: config.descColor, opacity: 1 }}>
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose
              style={{ color: config.closeColor }}
              className={config.closeHover}
            />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
