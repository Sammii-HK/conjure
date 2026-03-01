import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-colors",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
