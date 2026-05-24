"use client";

import {
  LayoutDashboard,
  Users,
  Medal,
  GraduationCap,
  ClipboardCheck,
  ArrowLeft,
} from "lucide-react";
import { NavLink } from "./nav-link";

const items = [
  { href: "/admin", label: "Início", icon: LayoutDashboard, exact: true },
  { href: "/admin/alunos", label: "Alunos", icon: Users },
  { href: "/admin/concursos", label: "Concursos", icon: Medal },
  { href: "/admin/aulas", label: "Aulas", icon: GraduationCap },
  { href: "/admin/simulados", label: "Simulados", icon: ClipboardCheck },
];

const base =
  "flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors";

export function MobileNavAdmin() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[--border] bg-[--surface]/95 backdrop-blur-md">
      <div className="grid grid-cols-6">
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
        <NavLink
          href="/app"
          className={base}
          activeClassName=""
          inactiveClassName="text-[--primary]/80"
        >
          <ArrowLeft size={20} />
          App
        </NavLink>
      </div>
    </nav>
  );
}
