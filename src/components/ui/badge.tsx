import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[--surface-2] text-[--foreground] border border-[--border]",
        gold:
          "bg-[--primary]/15 text-[--primary] border border-[--primary]/30",
        success:
          "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
        danger:
          "bg-red-500/15 text-red-300 border border-red-500/30",
        muted:
          "bg-transparent text-[--foreground-muted] border border-[--border]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
