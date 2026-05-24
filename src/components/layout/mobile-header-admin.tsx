import Link from "next/link";
import { Logo } from "@/components/marca/logo";

export function MobileHeaderAdmin() {
  return (
    <header className="lg:hidden sticky top-0 z-30 border-b border-[--border] bg-[--surface]/95 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/admin" prefetch className="flex items-center gap-3">
          <Logo variant="compact" />
          <span className="inline-flex items-center gap-1 rounded-full bg-[--primary]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[--primary]">
            Admin
          </span>
        </Link>
      </div>
    </header>
  );
}
