"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Alternativa } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Logo } from "@/components/marca/logo";
import { cn, formatTime } from "@/lib/utils";
import { submeterTentativa } from "@/lib/admin/simulados-actions";

interface QuestaoUI {
  id: string;
  numero: number;
  enunciado: string;
  alternativas: { a: string; b: string; c: string; d: string; e: string | null };
}

interface Props {
  simulado: { id: string; titulo: string; duracao_minutos: number; disciplina_nome: string | null };
  questoes: QuestaoUI[];
  tentativaId: string;
  userName: string;
}

const LETRAS: Alternativa[] = ["a", "b", "c", "d", "e"];

export function FazerSimulado({ simulado, questoes, tentativaId, userName }: Props) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, Alternativa | null>>({});
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [confirmFinalizar, setConfirmFinalizar] = useState(false);
  const [confirmSair, setConfirmSair] = useState(false);
  const [enviando, startEnviando] = useTransition();
  const [tempoSeg, setTempoSeg] = useState(simulado.duracao_minutos * 60);
  const inicioRef = useRef(Date.now());

  /* eslint-disable react-hooks/set-state-in-effect */
  // restaurar progresso do localStorage (so existe no client)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`tuba:tentativa:${tentativaId}`);
      if (raw) {
        const data = JSON.parse(raw) as {
          respostas: Record<string, Alternativa | null>;
          marcadas: string[];
          inicio?: number;
        };
        setRespostas(data.respostas ?? {});
        setMarcadas(new Set(data.marcadas ?? []));
        if (data.inicio) inicioRef.current = data.inicio;
      } else {
        localStorage.setItem(
          `tuba:tentativa:${tentativaId}`,
          JSON.stringify({ respostas: {}, marcadas: [], inicio: Date.now() }),
        );
      }
    } catch {}
  }, [tentativaId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // persistir
  useEffect(() => {
    try {
      localStorage.setItem(
        `tuba:tentativa:${tentativaId}`,
        JSON.stringify({
          respostas,
          marcadas: Array.from(marcadas),
          inicio: inicioRef.current,
        }),
      );
    } catch {}
  }, [respostas, marcadas, tentativaId]);

  // cronometro
  useEffect(() => {
    const id = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - inicioRef.current) / 1000);
      const restante = simulado.duracao_minutos * 60 - elapsedSec;
      setTempoSeg(restante);
      if (restante <= 0) {
        clearInterval(id);
        toast("Tempo esgotado! Enviando suas respostas...", { icon: "⏰" });
        finalizar();
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulado.duracao_minutos]);

  const respondidas = useMemo(
    () => Object.values(respostas).filter((v) => v != null).length,
    [respostas],
  );

  const q = questoes[idx];

  function marcar(letra: Alternativa) {
    setRespostas((r) => ({ ...r, [q.id]: r[q.id] === letra ? null : letra }));
  }

  function toggleMarcar() {
    setMarcadas((m) => {
      const next = new Set(m);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
  }

  function finalizar() {
    startEnviando(async () => {
      const tempo = Math.floor((Date.now() - inicioRef.current) / 1000);
      const fd = new FormData();
      fd.set("tentativa_id", tentativaId);
      fd.set("tempo_segundos", String(tempo));
      fd.set("respostas_json", JSON.stringify(respostas));
      const res = await submeterTentativa(fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      try {
        localStorage.removeItem(`tuba:tentativa:${tentativaId}`);
      } catch {}
      router.push(`/app/simulados/${simulado.id}/resultado?t=${tentativaId}`);
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-[--background] flex flex-col">
      {/* Topbar */}
      <header className="border-b border-[--border] bg-[--surface]/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Logo variant="compact" />
            <div className="h-8 w-px bg-[--border] hidden sm:block" />
            <div className="hidden sm:block min-w-0">
              <p className="text-xs text-[--foreground-muted]">{simulado.disciplina_nome ?? "Simulado"}</p>
              <p className="truncate text-sm font-semibold text-[--foreground]">{simulado.titulo}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-mono tabular-nums",
                tempoSeg < 60
                  ? "border-red-500/40 bg-red-500/15 text-red-300"
                  : tempoSeg < 300
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-200"
                  : "border-[--primary]/30 bg-[--primary]/10 text-[--primary]",
              )}
            >
              <Clock size={14} /> {formatTime(Math.max(0, tempoSeg))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setConfirmSair(true)}>
              <X size={14} /> Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-hidden flex">
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 lg:py-10">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-[0.28em] gold-text">
                Questão {q.numero} de {questoes.length}
              </p>
              <button
                onClick={toggleMarcar}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border transition-colors",
                  marcadas.has(q.id)
                    ? "border-amber-500/40 bg-amber-500/15 text-amber-200"
                    : "border-[--border] text-[--foreground-muted] hover:text-amber-200 hover:border-amber-500/40",
                )}
              >
                <Bookmark size={12} className={marcadas.has(q.id) ? "fill-current" : ""} />
                {marcadas.has(q.id) ? "Revisar depois" : "Marcar pra revisar"}
              </button>
            </div>

            <p className="text-base sm:text-lg leading-relaxed text-[--foreground] mb-6 whitespace-pre-line">
              {q.enunciado}
            </p>

            <div className="space-y-2.5">
              {LETRAS.map((l) => {
                const valor = q.alternativas[l as keyof typeof q.alternativas];
                if (!valor) return null;
                const ativa = respostas[q.id] === l;
                return (
                  <button
                    key={l}
                    onClick={() => marcar(l)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
                      ativa
                        ? "border-[--primary] bg-[--primary]/10 shadow-[0_2px_12px_-4px_rgba(212,164,74,0.4)]"
                        : "border-[--border] bg-[--surface]/40 hover:border-[--primary]/40 hover:bg-[--surface-2]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase border",
                        ativa
                          ? "gold-gradient border-transparent text-[--primary-foreground]"
                          : "border-[--border] text-[--foreground-muted]",
                      )}
                    >
                      {l}
                    </span>
                    <span className="text-sm leading-relaxed text-[--foreground] pt-1">{valor}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
              >
                <ChevronLeft size={16} /> Anterior
              </Button>
              {idx === questoes.length - 1 ? (
                <Button onClick={() => setConfirmFinalizar(true)}>
                  <Send size={16} /> Finalizar simulado
                </Button>
              ) : (
                <Button onClick={() => setIdx((i) => Math.min(questoes.length - 1, i + 1))}>
                  Próxima <ChevronRight size={16} />
                </Button>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar navegação */}
        <aside className="hidden md:flex w-72 shrink-0 flex-col border-l border-[--border] bg-[--surface]/40">
          <div className="px-5 py-4 border-b border-[--border]">
            <p className="text-xs font-bold uppercase tracking-wider gold-text">{userName}</p>
            <p className="text-xs text-[--foreground-muted] mt-1">
              {respondidas} / {questoes.length} respondidas
            </p>
          </div>
          <div className="p-4 grid grid-cols-5 gap-2 overflow-y-auto">
            {questoes.map((qq, i) => {
              const respondida = respostas[qq.id] != null;
              const marcada = marcadas.has(qq.id);
              const atual = i === idx;
              return (
                <button
                  key={qq.id}
                  onClick={() => setIdx(i)}
                  className={cn(
                    "relative h-10 rounded-md text-xs font-semibold tabular-nums border transition-all",
                    atual
                      ? "border-[--primary] bg-[--primary] text-[--primary-foreground]"
                      : respondida
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      : "border-[--border] bg-[--surface] text-[--foreground-muted] hover:border-[--primary]/40",
                  )}
                >
                  {qq.numero}
                  {marcada ? (
                    <Bookmark
                      size={8}
                      className="absolute top-0.5 right-0.5 fill-amber-400 text-amber-400"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="mt-auto p-4 border-t border-[--border]">
            <Button className="w-full" onClick={() => setConfirmFinalizar(true)}>
              <Send size={16} /> Finalizar
            </Button>
          </div>
        </aside>
      </div>

      <Dialog
        open={confirmFinalizar}
        onClose={() => setConfirmFinalizar(false)}
        title="Finalizar simulado?"
        description={
          respondidas < questoes.length
            ? `Você respondeu ${respondidas} de ${questoes.length} questões. As não respondidas serão consideradas erradas.`
            : "Você respondeu todas as questões. Pronto pra ver seu resultado?"
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmFinalizar(false)}>
            Voltar
          </Button>
          <Button onClick={finalizar} loading={enviando}>
            <CheckCircle2 size={16} /> Sim, finalizar
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={confirmSair}
        onClose={() => setConfirmSair(false)}
        title="Sair do simulado?"
        description="Seu progresso fica salvo neste navegador. Você pode voltar para continuar."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmSair(false)}>
            Continuar
          </Button>
          <Button variant="outline" onClick={() => router.push("/app/simulados")}>
            <AlertTriangle size={14} /> Sair sem enviar
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
