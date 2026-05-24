"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Barra fina no topo que aparece durante transições de rota.
 * Implementação leve sem libs externas.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest("a");
      if (!target) return;
      const url = target.getAttribute("href");
      if (!url || url.startsWith("http") || url.startsWith("#") || target.target === "_blank") return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      try {
        const dest = new URL(url, window.location.href);
        if (dest.pathname === window.location.pathname) return;
      } catch {
        return;
      }
      start();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    finish();
  }, [pathname, searchParams]);

  function start() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setActive(true);
    setProgress(8);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 88) return p;
        const delta = (90 - p) / 12;
        return p + delta;
      });
    }, 120);
  }

  function finish() {
    if (timer.current) clearInterval(timer.current);
    setProgress(100);
    hideTimer.current = setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 220);
  }

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[100] h-[2px] pointer-events-none"
      style={{ opacity: active ? 1 : 0, transition: "opacity 240ms ease" }}
    >
      <div
        className="h-full gold-gradient shadow-[0_0_10px_rgba(212,164,74,0.6)]"
        style={{
          width: `${progress}%`,
          transition: "width 200ms cubic-bezier(.4,.0,.2,1)",
        }}
      />
    </div>
  );
}
