import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-lg border border-[--border] bg-[--surface] px-4 text-sm text-[--foreground] placeholder:text-[--foreground-subtle] transition-colors",
          "focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[--primary]",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
