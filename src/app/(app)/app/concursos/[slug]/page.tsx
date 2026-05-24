import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Medal,
  PlayCircle,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("tuba_concursos")
    .select("nome")
    .eq("slug", slug)
    .maybeSingle();
  return { title: data?.nome ? `${data.nome} — Concursos` : "Concurso" };
}

export default async function ConcursoDetalhePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { profile } = await getCurrentUser();
  const { slug } = await params;
  const supabase = await createClient();

  const { data: concurso } = await supabase
    .from("tuba_concursos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!concurso) notFound();

  const [{ data: vinculos }, { data: assistidas }] = await Promise.all([
    supabase
      .from("tuba_concurso_disciplinas")
      .select("disciplina_id, ordem, tuba_disciplinas(id, nome, cor, ordem)")
      .eq("concurso_id", concurso.id)
      .order("ordem"),
    supabase.from("tuba_aulas_assistidas").select("aula_id").eq("user_id", profile.id),
  ]);

  const disciplinaIds = (vinculos ?? [])
    .map((v) => (v as { disciplina_id: string }).disciplina_id)
    .filter(Boolean);

  const { data: aulas } = disciplinaIds.length
    ? await supabase
        .from("tuba_aulas")
        .select("id, titulo, descricao, duracao_min, disciplina_id, ordem")
        .in("disciplina_id", disciplinaIds)
        .eq("publicada", true)
        .order("ordem")
    : { data: [] as Array<{ id: string; titulo: string; descricao: string | null; duracao_min: number | null; disciplina_id: string; ordem: number }> };

  const assistidasSet = new Set((assistidas ?? []).map((a) => a.aula_id));
  const aulasPorDisc = new Map<string, typeof aulas>();
  (aulas ?? []).forEach((a) => {
    const arr = aulasPorDisc.get(a.disciplina_id) ?? [];
    arr.push(a);
    aulasPorDisc.set(a.disciplina_id, arr);
  });

  const totalAulas = aulas?.length ?? 0;
  const totalAssistidas = (aulas ?? []).filter((a) => assistidasSet.has(a.id)).length;
  const pctGeral = totalAulas > 0 ? (totalAssistidas / totalAulas) * 100 : 0;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-10 -mt-8 lg:-mt-12 pb-8">
      {/* HERO */}
      <section className="relative min-h-[50vh] flex items-end overflow-hidden">
        {concurso.capa_url ? (
          <>
            <Image
              src={concurso.capa_url}
              alt={concurso.nome}
              fill
              sizes="100vw"
              priority
              unoptimized
              className="object-cover object-top scale-105 blur-[2px] opacity-80"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(7,16,32,1) 0%, rgba(7,16,32,0.85) 35%, rgba(7,16,32,0.4) 80%, rgba(7,16,32,0.1) 100%)",
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${concurso.cor} 0%, #07101e 100%)`,
            }}
          />
        )}

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 pb-10 pt-24">
          <Link
            href="/app/concursos"
            prefetch
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-white/80 hover:text-[--primary] mb-6"
          >
            <ArrowLeft size={14} /> Voltar para concursos
          </Link>

          <div className="grid items-end gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="relative aspect-[2/3] w-40 sm:w-48 lg:w-full overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] mx-auto lg:mx-0">
              {concurso.capa_url ? (
                <Image
                  src={concurso.capa_url}
                  alt={concurso.nome}
                  fill
                  sizes="240px"
                  priority
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[--surface] text-[--foreground-muted]">
                  <Medal size={48} />
                </div>
              )}
            </div>

            <div className="text-center lg:text-left">
              <Badge variant="gold" className="mb-2">
                {concurso.banca ?? "Concurso"}
                {concurso.banca && concurso.ano ? " · " : ""}
                {concurso.ano ?? ""}
              </Badge>
              <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-5xl text-white leading-tight">
                {concurso.nome}
              </h1>
              {concurso.descricao ? (
                <p className="mt-3 text-base text-white/85 max-w-2xl">{concurso.descricao}</p>
              ) : null}

              <div className="mt-5 max-w-md mx-auto lg:mx-0">
                <div className="mb-1.5 flex items-center justify-between text-xs text-white/85">
                  <span>Seu progresso neste concurso</span>
                  <span className="font-semibold">
                    {totalAssistidas} / {totalAulas} aulas
                  </span>
                </div>
                <Progress value={pctGeral} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DISCIPLINAS */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 mt-10 space-y-10">
        {!vinculos?.length ? (
          <EmptyState
            icon={<Medal size={24} />}
            title="Sem disciplinas vinculadas ainda"
            description="O coordenador ainda não selecionou as disciplinas deste concurso."
          />
        ) : (
          vinculos.map((v) => {
            const disc = (
              v as {
                tuba_disciplinas?: { id: string; nome: string; cor: string };
              }
            ).tuba_disciplinas;
            if (!disc) return null;
            const aulasDisc = aulasPorDisc.get(disc.id) ?? [];
            const assistDisc = aulasDisc.filter((a) => assistidasSet.has(a.id)).length;
            const pct = aulasDisc.length > 0 ? (assistDisc / aulasDisc.length) * 100 : 0;

            return (
              <section key={disc.id}>
                <header className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-[--foreground]">
                      {disc.nome}
                    </h2>
                    <p className="text-xs text-[--foreground-muted]">
                      {aulasDisc.length} {aulasDisc.length === 1 ? "aula" : "aulas"} · {assistDisc} assistidas
                    </p>
                  </div>
                  <div className="hidden sm:block w-48">
                    <Progress value={pct} />
                  </div>
                </header>

                {aulasDisc.length === 0 ? (
                  <Card className="p-8 text-center text-sm text-[--foreground-muted]">
                    Nenhuma aula publicada nesta disciplina ainda.
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {aulasDisc.map((aula) => {
                      const assistida = assistidasSet.has(aula.id);
                      return (
                        <Link
                          key={aula.id}
                          href={`/app/aulas/${aula.id}`}
                          prefetch
                          className="group"
                        >
                          <Card className="h-full p-5 transition-transform group-hover:-translate-y-1">
                            <div className="mb-3 flex items-start justify-between">
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
          })
        )}
      </div>
    </div>
  );
}
