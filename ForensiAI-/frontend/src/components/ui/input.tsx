import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border border-[#2d1515] bg-[#1a1a1a] px-3 text-sm text-[#f5f5f5] outline-none transition placeholder:text-[#707070] focus:border-[#dc2626] focus:ring-2 focus:ring-[rgba(220,38,38,0.15)]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-md border border-[#2d1515] bg-[#1a1a1a] px-3 py-3 text-sm text-[#f5f5f5] outline-none transition placeholder:text-[#707070] focus:border-[#dc2626] focus:ring-2 focus:ring-[rgba(220,38,38,0.15)]",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";


