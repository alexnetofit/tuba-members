import Link from "next/link";
import { CheckCircle2, ChevronDown, Clock, GraduationCap, PlayCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";

export const metadata = { title: "Aulas — Curso Tubarão" };

export default async function AulasPage() {
  const { profile } = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: disciplinas }, { data: aulas }, { data: assistidas }] = await Promise.all([
    supabase
      .from("tuba_disciplinas")
      .select("id, nome, cor, ordem")
      .eq("ativa", true)
      .order("ordem"),
    supabase
      .from("tuba_aulas")
      .select("id, titulo, descricao, duracao_min, disciplina_id, ordem")
      .eq("publicada", true)
      .order("ordem"),
    supabase.from("tuba_aulas_assistidas").select("aula_id").eq("user_id", profile.id),
  ]);

  const assistidasSet = new Set(assistidas?.map((a) => a.aula_id) ?? []);

  return (
    <>
      <PageHeader
        eyebrow="Conteúdo"
        title="Aulas por disciplina"
        subtitle="Aulas ao vivo gravadas, organizadas para você consumir no seu ritmo."
      />

      {!disciplinas?.length ? (
        <EmptyState
          icon={<GraduationCap size={24} />}
          title="Nenhuma disciplina cadastrada"
          description="O coordenador ainda não adicionou disciplinas. Volte em breve."
        />
      ) : (
        <div className="space-y-3">
          {disciplinas.map((disc, idx) => {
            const aulasDisc = aulas?.filter((a) => a.disciplina_id === disc.id) ?? [];
            const totalAssist = aulasDisc.filter((a) => assistidasSet.has(a.id)).length;
            const pct = aulasDisc.length > 0 ? (totalAssist / aulasDisc.length) * 100 : 0;
            const completo = aulasDisc.length > 0 && totalAssist === aulasDisc.length;

            return (
              <details
                key={disc.id}
                open={idx === 0}
                className="group rounded-2xl border border-[--border] bg-[--surface]/40 backdrop-blur-sm overflow-hidden transition-colors open:border-[--primary]/30"
              >
                <summary className="list-none cursor-pointer select-none px-5 py-4 flex items-center gap-4 hover:bg-[--surface-2]/40 transition-colors">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[--primary] bg-[--primary]/15 group-open:gold-gradient group-open:text-[--primary-foreground] transition-colors"
                    style={{
                      // permite override de cor por disciplina sem perder o estado open
                      backgroundColor: undefined,
                    }}
                  >
                    <GraduationCap size={20} />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl text-[--foreground] truncate">
                        {disc.nome}
                      </h2>
                      {completo ? (
                        <Badge variant="success">
                          <CheckCircle2 size={12} /> Concluída
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-[--foreground-muted] mt-0.5">
                      {aulasDisc.length} {aulasDisc.length === 1 ? "aula" : "aulas"} ·{" "}
                      {totalAssist} assistida{totalAssist === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="hidden sm:block w-40">
                    <Progress value={pct} />
                  </div>

                  <ChevronDown
                    size={20}
                    className="text-[--foreground-muted] transition-transform duration-300 group-open:rotate-180 shrink-0"
                  />
                </summary>

                <div className="px-5 pb-5 pt-1 border-t border-[--border]/60">
                  <div className="sm:hidden mb-4 pt-3">
                    <Progress value={pct} />
                  </div>

                  {aulasDisc.length === 0 ? (
                    <p className="py-6 text-center text-sm text-[--foreground-muted]">
                      Nenhuma aula publicada nesta disciplina ainda.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-3">
                      {aulasDisc.map((aula) => {
                        const assistida = assistidasSet.has(aula.id);
                        return (
                          <Link
                            key={aula.id}
                            href={`/app/aulas/${aula.id}`}
                            prefetch
                            className="group/aula"
                          >
                            <Card className="h-full p-5 transition-transform group-hover/aula:-translate-y-1">
                              <div className="flex items-start justify-between mb-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--primary]/15 text-[--primary] group-hover/aula:bg-[--primary] group-hover/aula:text-[--primary-foreground] transition-colors">
                                  <PlayCircle size={18} />
                                </span>
                                {assistida ? (
                                  <Badge variant="success">
                                    <CheckCircle2 size={12} /> Assistida
                                  </Badge>
                                ) : null}
                              </div>
                              <h3 className="text-base font-semibold text-[--foreground] line-clamp-2">
                                {aula.titulo}
                              </h3>
                              {aula.descricao ? (
                                <p className="mt-1 text-xs text-[--foreground-muted] line-clamp-2">
                                  {aula.descricao}
                                </p>
                              ) : null}
                              {aula.duracao_min ? (
                                <div className="mt-3 inline-flex items-center gap-1 text-xs text-[--foreground-muted]">
                                  <Clock size={12} /> {aula.duracao_min} min
                                </div>
                              ) : null}
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </>
  );
}
