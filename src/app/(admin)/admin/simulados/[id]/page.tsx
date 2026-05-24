import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Clock, FileText, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import { SimuladoActions } from "./simulado-actions";

export const metadata = { title: "Simulado — Admin" };

export default async function SimuladoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: simulado } = await supabase
    .from("tuba_simulados")
    .select("*, tuba_disciplinas(nome, cor)")
    .eq("id", id)
    .maybeSingle();

  if (!simulado) notFound();

  const { data: questoes } = await supabase
    .from("tuba_questoes")
    .select("*")
    .eq("simulado_id", id)
    .order("numero");

  const { data: tentativas } = await supabase
    .from("tuba_tentativas")
    .select("id, nota, acertos, total_questoes, finalizado_em, user_id, tuba_profiles:user_id(full_name, email)")
    .eq("simulado_id", id)
    .not("finalizado_em", "is", null)
    .order("nota", { ascending: false })
    .limit(20);

  const disciplina = (simulado as { tuba_disciplinas?: { nome?: string; cor?: string } })
    .tuba_disciplinas;
  const totalQuestoes = questoes?.length ?? 0;
  const totalTentativas = tentativas?.length ?? 0;
  const mediaNota =
    totalTentativas > 0
      ? (tentativas!.reduce((acc, t) => acc + (Number(t.nota) || 0), 0) / totalTentativas).toFixed(1)
      : "—";

  return (
    <>
      <Link
        href="/admin/simulados"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[--foreground-muted] hover:text-[--primary] mb-4"
      >
        <ArrowLeft size={14} /> Voltar para simulados
      </Link>

      <PageHeader
        eyebrow={disciplina?.nome ?? "Geral"}
        title={simulado.titulo}
        subtitle={simulado.descricao ?? undefined}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={simulado.publicado ? "success" : "muted"}>
              {simulado.publicado ? "Publicado" : "Rascunho"}
            </Badge>
            <SimuladoActions id={simulado.id} publicado={simulado.publicado} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard icon={<FileText size={18} />} label="Questões" value={String(totalQuestoes)} />
        <StatCard icon={<Clock size={18} />} label="Duração" value={`${simulado.duracao_minutos} min`} />
        <StatCard icon={<Users size={18} />} label="Tentativas" value={String(totalTentativas)} />
        <StatCard icon={<BookOpen size={18} />} label="Média da turma" value={mediaNota} />
      </div>

      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-xl text-[--foreground]">
              Questões
            </h2>
            <p className="text-xs text-[--foreground-muted] mt-1">
              Visualização das questões salvas. Para editar, exclua e recrie o simulado.
            </p>
          </div>
          <p className="text-xs text-[--foreground-muted]">Criado em {formatDate(simulado.created_at)}</p>
        </div>

        {!questoes?.length ? (
          <p className="text-sm text-[--foreground-muted] italic">Sem questões.</p>
        ) : (
          <ol className="space-y-5">
            {questoes.map((q) => (
              <li key={q.id} className="rounded-xl border border-[--border] bg-[--surface]/40 p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <Badge variant="gold">Questão {q.numero}</Badge>
                  <span className="text-xs uppercase tracking-wider text-emerald-400">
                    Gabarito: {q.gabarito.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-[--foreground] mb-4 whitespace-pre-wrap">{q.enunciado}</p>
                <ul className="space-y-1.5 text-sm">
                  {(["a", "b", "c", "d", "e"] as const).map((letra) => {
                    const valor = q[`alt_${letra}` as `alt_${typeof letra}`];
                    if (!valor) return null;
                    const isCerta = q.gabarito === letra;
                    return (
                      <li
                        key={letra}
                        className={
                          isCerta
                            ? "flex gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-emerald-200"
                            : "flex gap-2 rounded-md border border-[--border] bg-[--background]/40 px-3 py-1.5 text-[--foreground-muted]"
                        }
                      >
                        <span className="font-bold uppercase">{letra})</span>
                        <span className="flex-1">{valor}</span>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl text-[--foreground] mb-1">
          Tentativas dos alunos
        </h2>
        <p className="text-xs text-[--foreground-muted] mb-5">
          Top 20 melhores notas (apenas tentativas finalizadas).
        </p>
        {!tentativas?.length ? (
          <p className="text-sm text-[--foreground-muted] italic">
            Nenhum aluno fez esse simulado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-[--foreground-muted]">
                <tr>
                  <th className="px-3 py-2 font-semibold">#</th>
                  <th className="px-3 py-2 font-semibold">Aluno</th>
                  <th className="px-3 py-2 font-semibold">Nota</th>
                  <th className="px-3 py-2 font-semibold">Acertos</th>
                  <th className="px-3 py-2 font-semibold">Finalizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {tentativas.map((t, idx) => {
                  const aluno = (
                    t as unknown as { tuba_profiles?: { full_name?: string; email?: string } }
                  ).tuba_profiles;
                  return (
                    <tr key={t.id} className="hover:bg-[--surface-2]/40">
                      <td className="px-3 py-2 text-[--foreground-muted]">{idx + 1}</td>
                      <td className="px-3 py-2 text-[--foreground]">
                        {aluno?.full_name ?? aluno?.email ?? "—"}
                      </td>
                      <td className="px-3 py-2 font-semibold gold-text">
                        {Number(t.nota ?? 0).toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-[--foreground-muted]">
                        {t.acertos ?? 0}/{t.total_questoes ?? 0}
                      </td>
                      <td className="px-3 py-2 text-[--foreground-muted]">
                        {t.finalizado_em ? formatDateTime(t.finalizado_em) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[--foreground-muted]">{icon}</span>
        <span className="text-xs uppercase tracking-wider text-[--foreground-muted]">{label}</span>
      </div>
      <p className="font-[family-name:var(--font-playfair)] text-2xl text-[--foreground]">{value}</p>
    </Card>
  );
}
