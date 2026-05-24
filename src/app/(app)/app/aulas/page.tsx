import Link from "next/link";
import { CheckCircle2, Clock, GraduationCap, PlayCircle } from "lucide-react";
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
        <div className="space-y-10">
          {disciplinas.map((disc) => {
            const aulasDisc = aulas?.filter((a) => a.disciplina_id === disc.id) ?? [];
            const totalAssist = aulasDisc.filter((a) => assistidasSet.has(a.id)).length;
            const pct = aulasDisc.length > 0 ? (totalAssist / aulasDisc.length) * 100 : 0;

            return (
              <section key={disc.id}>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-[--foreground]">
                      {disc.nome}
                    </h2>
                    <p className="text-xs text-[--foreground-muted]">
                      {aulasDisc.length} {aulasDisc.length === 1 ? "aula" : "aulas"} ·{" "}
                      {totalAssist} assistidas
                    </p>
                  </div>
                  <div className="w-48 hidden sm:block">
                    <Progress value={pct} />
                  </div>
                </div>

                {aulasDisc.length === 0 ? (
                  <Card className="p-8 text-center text-sm text-[--foreground-muted]">
                    Nenhuma aula publicada nesta disciplina ainda.
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {aulasDisc.map((aula) => {
                      const assistida = assistidasSet.has(aula.id);
                      return (
                        <Link key={aula.id} href={`/app/aulas/${aula.id}`} className="group">
                          <Card className="h-full p-5 transition-transform group-hover:-translate-y-1">
                            <div className="flex items-start justify-between mb-3">
                              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--primary]/15 text-[--primary] group-hover:bg-[--primary] group-hover:text-[--primary-foreground] transition-colors">
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
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
