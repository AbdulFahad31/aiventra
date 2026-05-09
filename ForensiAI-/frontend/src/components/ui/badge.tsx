import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "blue",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "blue" | "red" | "yellow" | "green" | "slate" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.04em]",
        tone === "blue" && "border-[rgba(220,38,38,0.2)] bg-[rgba(220,38,38,0.12)] text-[#fca5a5]",
        tone === "red" && "border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.12)] text-[#f87171]",
        tone === "yellow" && "border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.12)] text-[#fbbf24]",
        tone === "green" && "border-[rgba(220,38,38,0.2)] bg-[rgba(220,38,38,0.12)] text-[#fca5a5]",
        tone === "slate" && "border-[rgba(107,114,128,0.2)] bg-[rgba(107,114,128,0.12)] text-[#9ca3af]",
        className
      )}
      {...props}
    />
  );
}


