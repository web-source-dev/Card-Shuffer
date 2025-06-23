"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            className="bg-zinc-900/90 backdrop-blur-sm border-zinc-700 text-white shadow-lg"
          >
            <div className="grid gap-1">
              {title && <ToastTitle className="text-white">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-zinc-200">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="text-white hover:text-white/80" />
          </Toast>
        )
      })}
      <ToastViewport className="z-[9999]" />
    </ToastProvider>
  )
}
