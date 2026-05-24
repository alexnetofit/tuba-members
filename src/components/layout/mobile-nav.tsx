"use client";

import {
  LayoutDashboard,
  ClipboardCheck,
  Trophy,
  User,
  Medal,
} from "lucide-react";
import { NavLink } from "./nav-link";

const items = [
  { href: "/app", label: "Início", icon: LayoutDashboard, exact: true },
  { href: "/app/concursos", label: "Concursos", icon: Medal },
  { href: "/app/simulados", label: "Simulados", icon: ClipboardCheck },
  { href: "/app/ranking", label: "Ranking", icon: Trophy },
  { href: "/app/perfil", label: "Perfil", icon: User },
];

const base =
  "flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors";

export function MobileNavAluno() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[--border] bg-[--surface]/95 backdrop-blur-md">
      <div className="grid grid-cols-5">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <NavLink
              key={it.href}
              href={it.href}
              exact={it.exact}
              className={base}
              activeClassName="text-[--primary]"
              inactiveClassName="text-[--foreground-muted]"
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
