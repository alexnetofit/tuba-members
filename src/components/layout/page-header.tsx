import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  eyebrow?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, action, eyebrow, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8", className)}>
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.32em] gold-text mb-2">{eyebrow}</p>
        ) : null}
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-[--foreground] leading-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm sm:text-base text-[--foreground-muted] max-w-2xl">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
