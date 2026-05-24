import { Crown, Medal } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PodiumEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  pontos: number;
}

const config = [
  { place: 1, label: "1º Lugar", icon: Crown, gradient: "from-[#fde47a] to-[#b88729]", scale: "scale-110", ring: "ring-[#fde47a]" },
  { place: 2, label: "2º Lugar", icon: Medal, gradient: "from-[#e2e8f0] to-[#94a3b8]", scale: "scale-100", ring: "ring-[#e2e8f0]" },
  { place: 3, label: "3º Lugar", icon: Medal, gradient: "from-[#d97706] to-[#7c2d12]", scale: "scale-95", ring: "ring-[#d97706]" },
];

export function Podium({ entries }: { entries: PodiumEntry[] }) {
  const order = [2, 1, 3]; // visual: 2º à esquerda, 1º centro, 3º à direita

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end">
      {order.map((place) => {
        const cfg = config[place - 1];
        const entry = entries[place - 1];
        const Icon = cfg.icon;

        return (
          <div
            key={place}
            className={cn(
              "flex flex-col items-center text-center transition-transform",
              place === 1 ? "order-2" : place === 2 ? "order-1" : "order-3",
            )}
          >
            <div className={cn("relative mb-3 transition-transform", cfg.scale)}>
              <div
                className={cn(
                  "absolute -top-2 -right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br shadow-lg",
                  cfg.gradient,
                )}
              >
                <Icon size={18} className="text-[--primary-foreground]" />
              </div>
              <Avatar
                name={entry?.full_name ?? "—"}
                src={entry?.avatar_url}
                size="xl"
                className={cn("ring-4 ring-offset-4 ring-offset-[--background]", cfg.ring)}
              />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider gold-text">{cfg.label}</p>
            <p className="mt-1 text-sm sm:text-base font-semibold text-[--foreground] line-clamp-1 max-w-[140px]">
              {entry?.full_name ?? "—"}
            </p>
            <p className="mt-0.5 text-xs text-[--foreground-muted]">
              {entry ? `${entry.pontos.toLocaleString("pt-BR")} pts` : "Vaga aberta"}
            </p>
            <div
              className={cn(
                "mt-3 w-full rounded-t-lg bg-gradient-to-t",
                cfg.gradient,
                place === 1 ? "h-28" : place === 2 ? "h-20" : "h-14",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
