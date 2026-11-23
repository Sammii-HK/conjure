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
          "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800/50":
            variant === "safe",
          "bg-violet-900/50 text-accent-text border border-violet-700/50":
            variant === "creative",
          "bg-orange-50 text-orange-800 border border-orange-300 dark:bg-orange-900/50 dark:text-orange-400 dark:border-orange-800/50":
            variant === "experimental",
          "bg-indigo-50 text-indigo-800 border border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700/50":
            variant === "account",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
