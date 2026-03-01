"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20":
              variant === "primary",
            "bg-card border border-border hover:border-accent/50 text-text":
              variant === "secondary",
            "hover:bg-card text-text-muted hover:text-text": variant === "ghost",
            "bg-red-900/50 hover:bg-red-900 text-red-300 border border-red-800":
              variant === "danger",
          },
          {
            "px-3 py-1.5 text-xs": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
