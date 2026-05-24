import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "full" | "compact" | "icon";
}

export function Logo({ className, variant = "full" }: LogoProps) {
  if (variant === "icon") {
    return <SharkMark className={cn("h-9 w-9", className)} />;
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <SharkMark className="h-9 w-9" />
        <div className="flex flex-col leading-none">
          <span className="font-[family-name:var(--font-bebas)] text-lg tracking-[0.18em] text-[--foreground]">
            TUBARÃO
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] gold-text">
            EAOF 2027
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <SharkMark className="h-12 w-12" />
      <div className="flex flex-col leading-none">
        <span className="text-xs font-semibold uppercase tracking-[0.4em] text-[--foreground-muted]">
          Curso
        </span>
        <span className="font-[family-name:var(--font-bebas)] text-2xl tracking-[0.18em] text-[--foreground]">
          TUBARÃO
        </span>
        <span className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.32em] gold-text">
          EAOF 2027
        </span>
      </div>
    </div>
  );
}

function SharkMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl gold-gradient shadow-[0_4px_20px_-6px_rgba(212,164,74,0.6)]",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-3/5 w-3/5 text-[--primary-foreground]"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12c2-4 7-6 11-6 3 0 5 1 7 3l-2 3 2 3c-2 2-4 3-7 3-4 0-9-2-11-6z" fill="currentColor" fillOpacity="0.2" />
        <path d="M3 12c2-4 7-6 11-6 3 0 5 1 7 3l-2 3 2 3c-2 2-4 3-7 3-4 0-9-2-11-6z" />
        <circle cx="16" cy="10" r="1" fill="currentColor" />
        <path d="M9 14c1 1 3 1 4 0" />
      </svg>
    </div>
  );
}
