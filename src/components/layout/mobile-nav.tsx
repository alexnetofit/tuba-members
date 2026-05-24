"use client";

import {
  LayoutDashboard,
  ClipboardCheck,
  Trophy,
  User,
  Medal,
  Settings,
} from "lucide-react";
import { NavLink } from "./nav-link";
import { cn } from "@/lib/utils";

const baseItems = [
  { href: "/app", label: "Início", icon: LayoutDashboard, exact: true },
  { href: "/app/concursos", label: "Concursos", icon: Medal },
  { href: "/app/simulados", label: "Simulados", icon: ClipboardCheck },
  { href: "/app/ranking", label: "Ranking", icon: Trophy },
  { href: "/app/perfil", label: "Perfil", icon: User },
];

const adminItem = {
  href: "/admin",
  label: "Admin",
  icon: Settings,
  highlight: true,
};

const base =
  "flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors";

export function MobileNavAluno({ role }: { role?: string }) {
  const items = role === "admin" ? [...baseItems, adminItem] : baseItems;
  const cols =
    items.length === 6
      ? "grid-cols-6"
      : items.length === 5
        ? "grid-cols-5"
        : "grid-cols-4";

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[--border] bg-[--surface]/95 backdrop-blur-md">
      <div className={cn("grid", cols)}>
        {items.map((it) => {
          const Icon = it.icon;
          const isAdmin = "highlight" in it && it.highlight;
          return (
            <NavLink
              key={it.href}
              href={it.href}
              exact={"exact" in it ? it.exact : undefined}
              className={base}
              activeClassName={isAdmin ? "text-[--primary]" : "text-[--primary]"}
              inactiveClassName={isAdmin ? "text-[--primary]/80" : "text-[--foreground-muted]"}
            >
              <Icon size={20} />
              {it.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
