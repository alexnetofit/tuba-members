import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ClipboardCheck, Trophy, XCircle, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, formatTime } from "@/lib/utils";

const LETRAS = ["a", "b", "c", "d", "e"] as const;

export default async function ResultadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id: simuladoId } = await params;
  const { t: tentativaId } = await searchParams;
  if (!tentativaId) notFound();

  const { profile } = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: tentativa }, { data: simulado }, { data: questoes }, { data: respostas }] = await Promise.all([
    supabase
      .from("tuba_tentativas")
      .select("*")
      .eq("id", tentativaId)
      .eq("user_id", profile.id)
      .maybeSingle(),
    supabase.from("tuba_simulados").select("*, tuba_disciplinas(nome)").eq("id", simuladoId).maybeSingle(),
    supabase
      .from("tuba_questoes")
      .select("*")
      .eq("simulado_id", simuladoId)
      .order("numero"),
    supabase
      .from("tuba_respostas")
      .select("*")
      .eq("tentativa_id", tentativaId),
  ]);

  if (!tentativa || !simulado || !questoes) notFound();

  const respostasMap = new Map(respostas?.map((r) => [r.questao_id, r]) ?? []);

  // media da turma
  const { data: outras } = await supabase
    .from("tuba_tentativas")
    .select("nota")
    .eq("simulado_id", simuladoId)
    .not("finalizado_em", "is", null);
  const notas = outras?.map((t) => Number(t.nota ?? 0)) ?? [];
  const mediaTurma = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
  const minhaPosicao = notas.filter((n) => n > Number(tentativa.nota ?? 0)).length + 1;

  const nota = Number(tentativa.nota ?? 0);

  return (
    <>
      <Link
        href="/app/simulados"
        className="inline-flex items-center gap-2 mb-4 text-sm text-[--foreground-muted] hover:text-[--primary]"
      >
        <ArrowLeft size={14} /> Todos os simulados
      </Link>

      <PageHeader
        eyebrow={
          (simulado as { tuba_disciplinas?: { nome?: string } }).tuba_disciplinas?.nome ?? "Resultado"
        }
        title={simulado.titulo}
        action={
          <Button asChild>
            <Link href={`/app/simulados/${simuladoId}/fazer`}>
              <ClipboardCheck size={16} /> Refazer simulado
            </Link>
          </Button>
        }
      />

      {/* Cards principais */}
      <div className="grid gap-5 md:grid-cols-3 mb-8">
        <Card className="p-6 md:col-span-1 text-center">
          <p className="text-xs font-bold uppercase tracking-wider gold-text">Sua nota</p>
          <p className="mt-2 font-[family-name:var(--font-playfair)] text-6xl gold-text">
            {nota.toFixed(1)}
          </p>
          <p className="mt-1 text-sm text-[--foreground-muted]">
            {tentativa.acertos} / {tentativa.total_questoes} corretas
          </p>
          <Progress value={nota} className="mt-4" />
          <Badge
            className="mt-4"
            variant={nota >= 70 ? "success" : nota >= 50 ? "gold" : "danger"}
          >
            {nota >= 90
              ? "Excelente! Predador letal."
              : nota >= 70
              ? "Muito bom!"
              : nota >= 50
              ? "No caminho — bora estudar mais!"
              : "Hora de revisar o conteúdo."}
          </Badge>
        </Card>

        <Card className="p-6 md:col-span-2">
          <h3 className="text-sm font-semibold text-[--foreground] mb-4">Estatísticas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Stat
              icon={<Trophy size={16} />}
              label="Sua posição"
              value={`${minhaPosicao}º`}
              hint={`de ${notas.length} tentativas`}
            />
            <Stat
              icon={<ClipboardCheck size={16} />}
              label="Média da turma"
              value={mediaTurma.toFixed(1)}
              hint={mediaTurma < nota ? "Você está acima" : mediaTurma > nota ? "Você está abaixo" : "Empate"}
            />
            <Stat
              icon={<Clock size={16} />}
              label="Tempo"
              value={tentativa.tempo_segundos ? formatTime(tentativa.tempo_segundos) : "—"}
              hint="seu tempo total"
            />
          </div>
        </Card>
      </div>

      {/* Gabarito */}
      <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-[--foreground] mb-4">
        Gabarito comentado
      </h2>
      <div className="space-y-4">
        {questoes.map((q) => {
          const r = respostasMap.get(q.id);
          const marcada = r?.alternativa_marcada;
          const correta = r?.correta === true;
          return (
            <Card key={q.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="gold">Questão {q.numero}</Badge>
                {correta ? (
                  <Badge variant="success">
                    <CheckCircle2 size={12} /> Correta
                  </Badge>
                ) : marcada ? (
                  <Badge variant="danger">
                    <XCircle size={12} /> Errada
                  </Badge>
                ) : (
                  <Badge variant="muted">Em branco</Badge>
                )}
              </div>
              <p className="text-sm leading-relaxed text-[--foreground] mb-4 whitespace-pre-line">
                {q.enunciado}
              </p>
              <div className="space-y-2">
                {LETRAS.map((l) => {
                  const valor = (q as unknown as Record<string, string | null>)[`alt_${l}`];
                  if (!valor) return null;
                  const ehGabarito = q.gabarito === l;
                  const ehMarcada = marcada === l;
                  return (
                    <div
                      key={l}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3",
                        ehGabarito
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : ehMarcada
                          ? "border-red-500/40 bg-red-500/10"
                          : "border-[--border] bg-[--surface]/40",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase border",
                          ehGabarito
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : ehMarcada
                            ? "bg-red-500 border-red-500 text-white"
                            : "border-[--border] text-[--foreground-muted]",
                        )}
                      >
                        {l}
                      </span>
                      <p className="text-sm leading-relaxed text-[--foreground] pt-1">{valor}</p>
                    </div>
                  );
                })}
              </div>
              {q.comentario ? (
                <div className="mt-4 rounded-lg border border-[--primary]/30 bg-[--primary]/5 p-3 text-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider gold-text mb-1">
                    Comentário
                  </p>
                  <p className="text-[--foreground]">{q.comentario}</p>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg bg-[--surface-2] p-3">
      <div className="flex items-center gap-2 text-xs text-[--foreground-muted]">
        <span className="text-[--primary]">{icon}</span>
        <span className="font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 font-[family-name:var(--font-playfair)] text-2xl text-[--foreground]">
        {value}
      </p>
      {hint ? <p className="text-[10px] text-[--foreground-muted]">{hint}</p> : null}
    </div>
  );
}
