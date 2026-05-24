"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useTransition, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  exact?: boolean;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  pendingClassName?: string;
  children: ReactNode;
  prefetch?: boolean;
}

/**
 * Link com:
 *  - estado "pending" instantâneo via useTransition (feedback visual sem esperar o server)
 *  - "active" calculado pelo pathname atual ou pelo pathname destino enquanto a transição roda
 *  - prefetch agressivo por padrão (já é default do Link, mas explicitamos)
 */
export function NavLink({
  href,
  exact,
  className,
  activeClassName = "",
  inactiveClassName = "",
  pendingClassName = "",
  children,
  prefetch = true,
}: NavLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const isOnRoute = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const active = isOnRoute || pending;

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      if (isOnRoute) return;
      e.preventDefault();
      startTransition(() => {
        router.push(href);
      });
    },
    [href, isOnRoute, router],
  );

  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={onClick}
      data-pending={pending ? "" : undefined}
      data-active={active ? "" : undefined}
      className={cn(
        className,
        active ? activeClassName : inactiveClassName,
        pending && pendingClassName,
      )}
    >
      {children}
    </Link>
  );
}
