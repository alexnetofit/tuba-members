import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: "gold" | "success" | "danger";
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, variant = "gold", ...props }, ref) => {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    const fillClass = {
      gold: "gold-gradient",
      success: "bg-emerald-500",
      danger: "bg-red-500",
    }[variant];

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-[--surface-2]",
          className
        )}
        {...props}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", fillClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";
