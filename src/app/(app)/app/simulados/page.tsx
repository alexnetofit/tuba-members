import Link from "next/link";
import { ArrowRight, ClipboardCheck, Clock, ListChecks, PlayCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Simulados — Curso Tubarão" };

export default async function SimuladosPage() {
  const { profile } = await getCurrentUser();
  const supabase = await createClient();

  const { data: simulados } = await supabase
    .from("tuba_simulados")
    .select("*, tuba_disciplinas(nome)")
    .eq("publicado", true)
    .order("created_at", { ascending: false });

  const ids = simulados?.map((s) => s.id) ?? [];
  const counts = new Map<string, number>();
  const minhasNotas = new Map<string, { nota: number; tentativa_id: string; finalizado_em: string }>();
  if (ids.length) {
    const [{ data: q }, { data: minhas }] = await Promise.all([
      supabase.from("tuba_questoes").select("simulado_id").in("simulado_id", ids),
      supabase
        .from("tuba_tentativas")
        .select("id, simulado_id, nota, finalizado_em")
        .in("simulado_id", ids)
        .eq("user_id", profile.id)
        .not("finalizado_em", "is", null)
        .order("nota", { ascending: false }),
    ]);
    q?.forEach((row) => counts.set(row.simulado_id, (counts.get(row.simulado_id) ?? 0) + 1));
    minhas?.forEach((t) => {
      if (!minhasNotas.has(t.simulado_id)) {
        minhasNotas.set(t.simulado_id, {
          nota: Number(t.nota ?? 0),
          tentativa_id: t.id,
          finalizado_em: t.finalizado_em!,
        });
      }
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Treine pra valer"
        title="Simulados"
        subtitle="Faça quantos quiser. Sua melhor nota em cada simulado vale pontos no ranking."
      />

      {!simulados?.length ? (
        <EmptyState
          icon={<ClipboardCheck size={24} />}
          title="Nenhum simulado disponível ainda"
          description="O coordenador vai liberar simulados em breve. Fique de olho!"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {simulados.map((s) => {
            const disc = (s as { tuba_disciplinas?: { nome?: string } }).tuba_disciplinas?.nome;
            const n = counts.get(s.id) ?? 0;
            const minha = minhasNotas.get(s.id);
            return (
              <Card key={s.id} className="p-6 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    {disc ? <Badge variant="gold">{disc}</Badge> : <Badge variant="muted">Geral</Badge>}
                  </div>
                  {minha ? (
                    <Badge variant={minha.nota >= 70 ? "success" : minha.nota >= 50 ? "gold" : "danger"}>
                      Melhor: {minha.nota.toFixed(1)}
                    </Badge>
                  ) : null}
                </div>

                <h3 className="font-[family-name:var(--font-playfair)] text-xl text-[--foreground] mb-1">
                  {s.titulo}
                </h3>
                {s.descricao ? (
                  <p className="text-sm text-[--foreground-muted] line-clamp-2 mb-3">{s.descricao}</p>
                ) : null}

                <div className="mt-auto pt-4 border-t border-[--border] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-[--foreground-muted]">
                    <span className="flex items-center gap-1">
                      <ListChecks size={12} /> {n} questões
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {s.duracao_minutos} min
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {minha ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/app/simulados/${s.id}/resultado?t=${minha.tentativa_id}`}>
                          Ver gabarito <ArrowRight size={14} />
                        </Link>
                      </Button>
                    ) : null}
                    <Button asChild size="sm">
                      <Link href={`/app/simulados/${s.id}/fazer`}>
                        <PlayCircle size={14} /> {minha ? "Refazer" : "Iniciar"}
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
