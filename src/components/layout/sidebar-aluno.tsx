"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  GraduationCap,
  ClipboardCheck,
  Trophy,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/marca/logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { NavLink } from "./nav-link";

interface Props {
  user: { full_name: string | null; email: string; role: string };
}

const items = [
  { href: "/app", label: "Início", icon: LayoutDashboard, exact: true },
  { href: "/app/aulas", label: "Aulas", icon: GraduationCap },
  { href: "/app/simulados", label: "Simulados", icon: ClipboardCheck },
  { href: "/app/ranking", label: "Ranking", icon: Trophy },
  { href: "/app/perfil", label: "Meu Perfil", icon: User },
];

const baseLink =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors data-[pending]:opacity-90";
const activeLink = "bg-[--primary]/15 text-[--primary] border border-[--primary]/25";
const inactiveLink = "text-[--foreground-muted] hover:bg-[--surface-2] hover:text-[--foreground]";
const pendingLink = "after:absolute after:inset-x-3 after:bottom-1 after:h-px after:bg-[--primary]/60";

export function SidebarAluno({ user }: Props) {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[--border] bg-[--surface]/40 backdrop-blur-md">
      <div className="px-6 py-7 border-b border-[--border]">
        <Link href="/app" prefetch>
          <Logo variant="compact" />
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <NavLink
              key={it.href}
              href={it.href}
              exact={it.exact}
              className={`relative ${baseLink}`}
              activeClassName={activeLink}
              inactiveClassName={inactiveLink}
              pendingClassName={pendingLink}
            >
              <Icon size={18} />
              {it.label}
            </NavLink>
          );
        })}

        {user.role === "admin" ? (
          <NavLink
            href="/admin"
            className="mt-4 flex items-center gap-3 rounded-lg border border-[--primary]/30 bg-gradient-to-br from-[--primary]/10 to-transparent px-3 py-2.5 text-sm font-semibold text-[--primary] hover:from-[--primary]/20 transition-colors"
            activeClassName=""
            inactiveClassName=""
          >
            <Settings size={18} />
            Painel Admin
          </NavLink>
        ) : null}
      </nav>

      <div className="border-t border-[--border] px-4 py-4">
        <NavLink
          href="/app/perfil"
          className="flex items-center gap-3 rounded-lg p-2 hover:bg-[--surface-2] transition-colors"
        >
          <Avatar name={user.full_name ?? user.email} size="md" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-[--foreground]">
              {user.full_name ?? "Aluno"}
            </p>
            <p className="truncate text-xs text-[--foreground-muted]">{user.email}</p>
          </div>
        </NavLink>
        <form action={logoutAction} className="mt-2">
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-[--foreground-muted] hover:text-red-400">
            <LogOut size={16} /> Sair
          </Button>
        </form>
      </div>
    </aside>
  );
}
