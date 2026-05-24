import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-11 w-full appearance-none rounded-lg border border-[--border] bg-[--surface] pl-4 pr-10 text-sm text-[--foreground] transition-colors",
            "focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[--foreground-muted]" size={16} />
      </div>
    );
  }
);
Select.displayName = "Select";
