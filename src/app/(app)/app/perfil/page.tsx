import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as Icons from "lucide-react";

export const metadata = { title: "Perfil — Curso Tubarão" };

export default async function PerfilPage() {
  const { profile } = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: ranking }, { data: conquistas }, { data: ultimas }] = await Promise.all([
    supabase.from("tuba_ranking_geral").select("*").eq("user_id", profile.id).maybeSingle(),
    supabase
      .from("tuba_usuario_conquistas")
      .select("conquistado_em, tuba_conquistas(*)")
      .eq("user_id", profile.id)
      .order("conquistado_em", { ascending: false }),
    supabase
      .from("tuba_tentativas")
      .select("id, simulado_id, nota, finalizado_em, tuba_simulados(titulo)")
      .eq("user_id", profile.id)
      .not("finalizado_em", "is", null)
      .order("finalizado_em", { ascending: false })
      .limit(10),
  ]);

  return (
    <>
      <PageHeader eyebrow="Minha conta" title="Meu perfil" subtitle="Seu histórico, conquistas e estatísticas." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={profile.full_name ?? profile.email} src={profile.avatar_url} size="xl" />
            <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-2xl text-[--foreground]">
              {profile.full_name ?? "—"}
            </h2>
            <p className="text-sm text-[--foreground-muted]">{profile.email}</p>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <Stat label="Posição" value={ranking?.posicao ? `${ranking.posicao}º` : "—"} />
            <Stat label="Pontos" value={(ranking?.pontos ?? 0).toLocaleString("pt-BR")} />
            <Stat label="Média" value={ranking?.media_geral ? Number(ranking.media_geral).toFixed(1) : "—"} />
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-[--foreground] mb-4">Conquistas</h3>
          {conquistas?.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {conquistas.map((c) => {
                const cq = (c as { tuba_conquistas?: { nome: string; descricao: string; icone: string; pontos_bonus: number } })
                  .tuba_conquistas;
                if (!cq) return null;
                const Icon = (Icons[cq.icone as keyof typeof Icons] as React.ComponentType<{ size?: number }>) ?? Icons.Award;
                return (
                  <div
                    key={(cq.nome ?? "") + c.conquistado_em}
                    className="flex items-start gap-3 rounded-xl border border-[--primary]/25 bg-gradient-to-br from-[--primary]/10 to-transparent p-3"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gold-gradient text-[--primary-foreground]">
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[--foreground]">{cq.nome}</p>
                      <p className="text-xs text-[--foreground-muted]">{cq.descricao}</p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider gold-text">
                        +{cq.pontos_bonus} pts
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[--foreground-muted]">
              Nenhuma conquista ainda. Faça simulados e assista aulas para desbloquear!
            </p>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h3 className="text-sm font-semibold text-[--foreground] mb-4">Histórico de simulados</h3>
        {ultimas?.length ? (
          <div className="divide-y divide-[--border]">
            {ultimas.map((t) => {
              const nota = Number(t.nota ?? 0);
              const titulo = (t as { tuba_simulados?: { titulo?: string } }).tuba_simulados?.titulo ?? "Simulado";
              return (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[--foreground]">{titulo}</p>
                    <p className="text-xs text-[--foreground-muted]">
                      {new Date(t.finalizado_em!).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge variant={nota >= 70 ? "success" : nota >= 50 ? "gold" : "danger"}>
                    {nota.toFixed(1)}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[--foreground-muted]">Você ainda não fez nenhum simulado.</p>
        )}
      </Card>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[--surface-2] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[--foreground-muted]">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-playfair)] text-xl text-[--foreground]">
        {value}
      </p>
    </div>
  );
}
