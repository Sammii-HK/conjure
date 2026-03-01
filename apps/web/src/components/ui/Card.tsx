import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3", className)} {...props} />;
}

function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-sm font-semibold text-text-muted uppercase tracking-wider", className)} {...props} />
  );
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardContent };
