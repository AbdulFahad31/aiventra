import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[rgba(220,38,38,0.35)] disabled:cursor-not-allowed disabled:opacity-50",
          variant === "primary" && "bg-[#dc2626] text-white hover:bg-[#b91c1c]",
          variant === "secondary" && "border border-[#2d1515] bg-[#1a1a1a] text-[#f5f5f5] hover:bg-[#2d1515]",
          variant === "ghost" && "text-[#b0b0b0] hover:bg-[#1a1a1a] hover:text-[#f5f5f5]",
          variant === "danger" && "border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.12)] text-[#f87171] hover:bg-[rgba(239,68,68,0.18)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";


