import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "green" | "yellow" | "red" | "outline";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-primary/15 text-primary border-primary/30",
    secondary: "bg-secondary text-secondary-foreground border-border",
    green: "bg-emerald-500/12 text-emerald-300 border-emerald-500/30",
    yellow: "bg-amber-500/12 text-amber-300 border-amber-500/30",
    red: "bg-red-500/12 text-red-300 border-red-500/30",
    outline: "text-muted-foreground border-border"
  };

  return (
    <div
      className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium", variants[variant], className)}
      {...props}
    />
  );
}
