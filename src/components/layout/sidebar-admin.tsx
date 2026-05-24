"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  BookMarked,
  GraduationCap,
  ClipboardCheck,
  ArrowLeft,
  LogOut,
  Trophy,
  Medal,
} from "lucide-react";
import { Logo } from "@/components/marca/logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { NavLink } from "./nav-link";

interface Props {
  user: { full_name: string | null; email: string };
}

const items = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/alunos", label: "Alunos", icon: Users },
  { href: "/admin/concursos", label: "Concursos", icon: Medal },
  { href: "/admin/disciplinas", label: "Disciplinas", icon: BookMarked },
  { href: "/admin/aulas", label: "Aulas", icon: GraduationCap },
  { href: "/admin/simulados", label: "Simulados", icon: ClipboardCheck },
  { href: "/admin/ranking", label: "Ranking", icon: Trophy },
];

const baseLink =
  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors data-[pending]:opacity-90";
const activeLink = "bg-[--primary]/15 text-[--primary] border border-[--primary]/25";
const inactiveLink = "text-[--foreground-muted] hover:bg-[--surface-2] hover:text-[--foreground]";
const pendingLink = "after:absolute after:inset-x-3 after:bottom-1 after:h-px after:bg-[--primary]/60";

export function SidebarAdmin({ user }: Props) {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[--border] bg-[--surface]/40 backdrop-blur-md">
      <div className="px-6 py-7 border-b border-[--border]">
        <Link href="/admin" prefetch className="block">
          <Logo variant="compact" />
        </Link>
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-[--primary]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[--primary]">
          Admin
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <NavLink
              key={it.href}
              href={it.href}
              exact={it.exact}
              className={baseLink}
              activeClassName={activeLink}
              inactiveClassName={inactiveLink}
              pendingClassName={pendingLink}
            >
              <Icon size={18} />
              {it.label}
            </NavLink>
          );
        })}

        <NavLink
          href="/app"
          className="mt-4 flex items-center gap-3 rounded-lg border border-[--border] px-3 py-2.5 text-sm text-[--foreground-muted] hover:bg-[--surface-2] hover:text-[--foreground] transition-colors"
          activeClassName=""
          inactiveClassName=""
        >
          <ArrowLeft size={16} /> Voltar ao app
        </NavLink>
      </nav>

      <div className="border-t border-[--border] px-4 py-4">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <Avatar name={user.full_name ?? user.email} size="md" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-[--foreground]">
              {user.full_name ?? "Admin"}
            </p>
            <p className="truncate text-xs text-[--foreground-muted]">{user.email}</p>
          </div>
        </div>
        <form action={logoutAction} className="mt-2">
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-[--foreground-muted] hover:text-red-400">
            <LogOut size={16} /> Sair
          </Button>
        </form>
      </div>
    </aside>
  );
}
