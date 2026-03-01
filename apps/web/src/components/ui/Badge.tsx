import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "safe" | "creative" | "experimental" | "account";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        {
          "bg-border text-text-muted": variant === "default",
          "bg-emerald-900/50 text-emerald-400 border border-emerald-800/50":
            variant === "safe",
          "bg-violet-900/50 text-violet-300 border border-violet-700/50":
            variant === "creative",
          "bg-orange-900/50 text-orange-400 border border-orange-800/50":
            variant === "experimental",
          "bg-indigo-900/50 text-indigo-300 border border-indigo-700/50":
            variant === "account",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
