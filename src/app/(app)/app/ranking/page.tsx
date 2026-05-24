import Link from "next/link";
import { Trophy, TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Podium } from "@/components/marca/podium";
import { cn } from "@/lib/utils";

export const metadata = { title: "Ranking — Curso Tubarão" };

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ disciplina?: string }>;
}) {
  const { profile } = await getCurrentUser();
  const params = await searchParams;
  const filtroDisc = params.disciplina;
  const supabase = await createClient();

  const [{ data: ranking }, { data: disciplinas }] = await Promise.all([
    filtroDisc
      ? supabase
          .from("tuba_ranking_disciplina")
          .select("*")
          .eq("disciplina_id", filtroDisc)
          .order("posicao")
      : supabase.from("tuba_ranking_geral").select("*").order("posicao"),
    supabase.from("tuba_disciplinas").select("id, nome, slug").eq("ativa", true).order("ordem"),
  ]);

  const lista = ranking ?? [];
  const top3 = lista.slice(0, 3);
  const restante = lista.slice(3);
  const minhaPos = lista.find((r) => r.user_id === profile.id);

  return (
    <>
      <PageHeader
        eyebrow="Competição"
        title="Ranking dos Tubarões"
        subtitle="Quem manda mais nos simulados? Sua melhor nota em cada simulado vale pontos."
      />

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-2">
        <FiltroPill href="/app/ranking" active={!filtroDisc} label="Geral" />
        {disciplinas?.map((d) => (
          <FiltroPill
            key={d.id}
            href={`/app/ranking?disciplina=${d.id}`}
            active={filtroDisc === d.id}
            label={d.nome}
          />
        ))}
      </div>

      {lista.length === 0 ? (
        <EmptyState
          icon={<Trophy size={24} />}
          title="Ranking vazio"
          description="Quando os alunos começarem a fazer simulados, o ranking aparece aqui."
        />
      ) : (
        <>
          {/* Pódio */}
          <Card className="p-6 sm:p-10 mb-6">
            <Podium
              entries={top3.map((r) => ({
                user_id: r.user_id,
                full_name: r.full_name,
                avatar_url: r.avatar_url,
                pontos: r.pontos,
              }))}
            />
          </Card>

          {/* Sua posição */}
          {minhaPos ? (
            <Card className="mb-6 p-4 border-[--primary]/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full gold-gradient text-[--primary-foreground] font-bold">
                  {minhaPos.posicao}º
                </div>
                <Avatar name={profile.full_name ?? profile.email} src={profile.avatar_url} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[--foreground]">
                    Você está em {minhaPos.posicao}º lugar
                  </p>
                  <p className="text-xs text-[--foreground-muted]">
                    {minhaPos.pontos.toLocaleString("pt-BR")} pts · {minhaPos.simulados_feitos} simulados
                  </p>
                </div>
                <TrendingUp size={18} className="text-[--primary]" />
              </div>
            </Card>
          ) : null}

          {/* Lista */}
          {restante.length > 0 ? (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[--surface-2]/60 text-left text-xs uppercase tracking-wider text-[--foreground-muted]">
                    <tr>
                      <th className="px-6 py-3 font-semibold w-16">#</th>
                      <th className="px-6 py-3 font-semibold">Aluno</th>
                      <th className="px-6 py-3 font-semibold text-right">Simulados</th>
                      {!filtroDisc ? <th className="px-6 py-3 font-semibold text-right">Média</th> : null}
                      <th className="px-6 py-3 font-semibold text-right">Pontos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[--border]">
                    {restante.map((r) => {
                      const isMe = r.user_id === profile.id;
                      const media =
                        "media_geral" in r
                          ? Number(r.media_geral ?? 0)
                          : "media" in r
                          ? Number((r as { media?: number }).media ?? 0)
                          : 0;
                      return (
                        <tr
                          key={r.user_id}
                          className={cn(
                            "hover:bg-[--surface-2]/40",
                            isMe ? "bg-[--primary]/10" : "",
                          )}
                        >
                          <td className="px-6 py-3 font-bold text-[--foreground-muted]">
                            {r.posicao}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={r.full_name ?? "?"} src={r.avatar_url} size="sm" />
                              <span className="font-medium text-[--foreground]">
                                {r.full_name ?? "—"}
                              </span>
                              {isMe ? <Badge variant="gold">Você</Badge> : null}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right text-[--foreground-muted]">
                            {r.simulados_feitos}
                          </td>
                          {!filtroDisc ? (
                            <td className="px-6 py-3 text-right text-[--foreground-muted]">
                              {media.toFixed(1)}
                            </td>
                          ) : null}
                          <td className="px-6 py-3 text-right">
                            <span className="font-bold gold-text">
                              {r.pontos.toLocaleString("pt-BR")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
        </>
      )}
    </>
  );
}

function FiltroPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      prefetch
      className={cn(
        "rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors",
        active
          ? "gold-gradient border-transparent text-[--primary-foreground]"
          : "border-[--border] text-[--foreground-muted] hover:border-[--primary]/40 hover:text-[--foreground]",
      )}
    >
      {label}
    </Link>
  );
}
