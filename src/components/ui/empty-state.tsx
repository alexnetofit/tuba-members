import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[--border] bg-[--surface]/50 py-16 px-6 text-center",
        className
      )}
    >
      {icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[--primary]/10 text-[--primary]">
          {icon}
        </div>
      ) : null}
      <div className="max-w-md">
        <h3 className="text-lg font-semibold text-[--foreground]">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-[--foreground-muted]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
