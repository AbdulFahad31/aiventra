"use client";

import * as React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Toast = {
  id: number;
  title: string;
  description?: string;
  variant?: "success" | "error";
};

type ToastContextValue = {
  toast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((value: Omit<Toast, "id">) => {
    const id = Date.now();
    setToasts((current) => [...current, { ...value, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((item) => {
          const isError = item.variant === "error";
          const Icon = isError ? XCircle : CheckCircle2;
          return (
            <div
              key={item.id}
              className={cn(
                "rounded-lg border bg-card p-4 text-sm shadow-lg",
                isError ? "border-red-500/30" : "border-emerald-500/30"
              )}
            >
              <div className="flex gap-3">
                <Icon className={cn("mt-0.5 h-4 w-4", isError ? "text-red-300" : "text-emerald-300")} />
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.description ? <p className="mt-1 text-muted-foreground">{item.description}</p> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
