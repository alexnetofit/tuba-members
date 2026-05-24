"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Sparkles,
  Upload,
  AlertCircle,
  CheckCircle2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import type { TubaDisciplina, Alternativa } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { criarSimuladoComQuestoes } from "@/lib/admin/simulados-actions";

interface QuestaoDetectada {
  numero: number;
  enunciado: string;
  alternativas: Partial<Record<Alternativa, string>>;
  gabarito_sugerido?: Alternativa;
}

type Step = "info" | "upload" | "revisar";

interface QuestaoEditavel {
  numero: number;
  enunciado: string;
  alt_a: string;
  alt_b: string;
  alt_c: string;
  alt_d: string;
  alt_e: string;
  gabarito: Alternativa | "";
}

const LETRAS: Alternativa[] = ["a", "b", "c", "d", "e"];

export function NovoSimuladoWizard({ disciplinas }: { disciplinas: TubaDisciplina[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("info");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [disciplinaId, setDisciplinaId] = useState<string>("");
  const [duracao, setDuracao] = useState(60);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [trace, setTrace] = useState<string[]>([]);
  const [questoes, setQuestoes] = useState<QuestaoEditavel[]>([]);
  const [salvando, startSaving] = useTransition();

  async function processarPdf() {
    if (!file) return toast.error("Selecione um PDF.");
    setProcessing(true);
    setWarnings([]);
    setTrace([]);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const r = await fetch("/api/simulados/ocr", { method: "POST", body: fd });
      const json = await r.json();
      if (!r.ok || !json.ok) {
        toast.error(json.error ?? "Falha no OCR");
        setTrace(json.trace ?? []);
        return;
      }
      const detect = (json.questoes ?? []) as QuestaoDetectada[];
      setWarnings(json.warnings ?? []);
      setTrace(json.trace ?? []);
      if (detect.length === 0) {
        toast.error("Nenhuma questão detectada. Tente outro PDF.");
        return;
      }
      const ed: QuestaoEditavel[] = detect.map((q) => ({
        numero: q.numero,
        enunciado: q.enunciado,
        alt_a: q.alternativas.a ?? "",
        alt_b: q.alternativas.b ?? "",
        alt_c: q.alternativas.c ?? "",
        alt_d: q.alternativas.d ?? "",
        alt_e: q.alternativas.e ?? "",
        gabarito: (q.gabarito_sugerido ?? "") as Alternativa | "",
      }));
      setQuestoes(ed);
      setStep("revisar");
      toast.success(`${detect.length} questão(ões) detectadas!`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro inesperado";
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  }

  function atualizar(i: number, patch: Partial<QuestaoEditavel>) {
    setQuestoes((arr) => arr.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function removerQuestao(i: number) {
    setQuestoes((arr) => arr.filter((_, idx) => idx !== i));
  }

  function adicionarQuestao() {
    const nextNumero = questoes.length > 0 ? Math.max(...questoes.map((q) => q.numero)) + 1 : 1;
    setQuestoes((arr) => [
      ...arr,
      {
        numero: nextNumero,
        enunciado: "",
        alt_a: "",
        alt_b: "",
        alt_c: "",
        alt_d: "",
        alt_e: "",
        gabarito: "",
      },
    ]);
  }

  function podeSalvar() {
    if (questoes.length === 0) return false;
    return questoes.every(
      (q) =>
        q.enunciado.trim() &&
        q.alt_a.trim() &&
        q.alt_b.trim() &&
        q.alt_c.trim() &&
        q.alt_d.trim() &&
        q.gabarito !== "",
    );
  }

  async function salvarSimulado() {
    if (!podeSalvar()) {
      toast.error("Preencha todas as questões e marque o gabarito de cada uma.");
      return;
    }
    startSaving(async () => {
      const fd = new FormData();
      fd.set("titulo", titulo);
      fd.set("descricao", descricao);
      fd.set("disciplina_id", disciplinaId);
      fd.set("duracao_minutos", String(duracao));
      fd.set("questoes_json", JSON.stringify(questoes));
      if (file) fd.set("pdf_file", file);
      const res = await criarSimuladoComQuestoes(fd);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Simulado criado!");
        router.push("/admin/simulados");
      }
    });
  }

  return (
    <div>
      <StepIndicator step={step} />

      {step === "info" && (
        <div className="mt-6 grid gap-5 max-w-2xl">
          <div>
            <Label htmlFor="titulo">Título do simulado</Label>
            <Input
              id="titulo"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Simulado de Português — Semana 1"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="disc">Disciplina (opcional)</Label>
              <Select id="disc" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}>
                <option value="">Geral / sem disciplina</option>
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="duracao">Duração (minutos)</Label>
              <Input
                id="duracao"
                type="number"
                min={5}
                value={duracao}
                onChange={(e) => setDuracao(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="desc">Descrição (opcional)</Label>
            <Textarea id="desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setStep("upload")} disabled={!titulo.trim()}>
              Próximo: enviar PDF
            </Button>
          </div>
        </div>
      )}

      {step === "upload" && (
        <div className="mt-6 max-w-2xl">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[--border-strong] bg-[--surface]/40 px-6 py-12 hover:border-[--primary] transition-colors"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[--primary]/15 text-[--primary]">
              {file ? <FileText size={26} /> : <Upload size={26} />}
            </span>
            {file ? (
              <>
                <p className="text-base font-semibold text-[--foreground]">{file.name}</p>
                <p className="text-xs text-[--foreground-muted]">
                  {(file.size / 1024 / 1024).toFixed(2)} MB · clique para trocar
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-[--foreground]">
                  Clique para enviar o PDF
                </p>
                <p className="text-xs text-[--foreground-muted]">
                  PDFs com texto ou escaneados · máx. 25 MB
                </p>
              </>
            )}
          </button>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep("info")} disabled={processing}>
              ← Voltar
            </Button>
            <Button onClick={processarPdf} disabled={!file || processing} loading={processing}>
              {processing ? null : <Sparkles size={16} />}
              {processing ? "Processando…" : "Extrair questões"}
            </Button>
          </div>

          {trace.length > 0 ? (
            <div className="mt-6 rounded-lg border border-[--border] bg-[--surface]/40 p-4 text-xs text-[--foreground-muted] space-y-1">
              {trace.map((t, i) => (
                <p key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 size-1.5 rounded-full bg-[--primary]" />
                  {t}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {step === "revisar" && (
        <div className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <h2 className="font-[family-name:var(--font-playfair)] text-xl text-[--foreground]">
                Revise as questões antes de publicar
              </h2>
              <p className="text-sm text-[--foreground-muted]">
                {questoes.length} questão(ões) detectadas. Marque o gabarito de cada uma.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep("upload")}>
                ← Refazer OCR
              </Button>
              <Button onClick={salvarSimulado} loading={salvando} disabled={!podeSalvar()}>
                <Save size={16} /> Salvar simulado
              </Button>
            </div>
          </div>

          {warnings.length > 0 ? (
            <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              <p className="flex items-center gap-2 font-semibold mb-2">
                <AlertCircle size={14} /> Avisos do parser:
              </p>
              <ul className="space-y-1 text-xs">
                {warnings.map((w, i) => (
                  <li key={i}>· {w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="space-y-4">
            {questoes.map((q, i) => (
              <QuestaoEditor
                key={i}
                q={q}
                index={i}
                onChange={(patch) => atualizar(i, patch)}
                onRemove={() => removerQuestao(i)}
              />
            ))}
          </div>

          <Button variant="outline" className="mt-4 w-full" onClick={adicionarQuestao}>
            + Adicionar questão manualmente
          </Button>

          <div className="mt-6 flex items-center justify-between sticky bottom-0 bg-[--background]/95 backdrop-blur py-4 border-t border-[--border]">
            <p className="text-xs text-[--foreground-muted]">
              {questoes.filter((q) => q.gabarito !== "").length} de {questoes.length} com gabarito definido
            </p>
            <Button onClick={salvarSimulado} loading={salvando} disabled={!podeSalvar()} size="lg">
              <CheckCircle2 size={16} /> Publicar simulado
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestaoEditor({
  q,
  index,
  onChange,
  onRemove,
}: {
  q: QuestaoEditavel;
  index: number;
  onChange: (patch: Partial<QuestaoEditavel>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-[--border] bg-[--surface]/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <Badge variant="gold">
          Questão {q.numero}
        </Badge>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-[--foreground-muted] hover:text-red-400"
        >
          Remover
        </button>
      </div>

      <div className="mb-3">
        <Label htmlFor={`enun-${index}`}>Enunciado</Label>
        <Textarea
          id={`enun-${index}`}
          value={q.enunciado}
          onChange={(e) => onChange({ enunciado: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid gap-2">
        {LETRAS.map((l) => {
          const field = `alt_${l}` as keyof QuestaoEditavel;
          const valor = String(q[field] ?? "");
          const isCorrect = q.gabarito === l;
          return (
            <div
              key={l}
              className={cn(
                "flex items-start gap-2 rounded-lg border p-2 transition-colors",
                isCorrect
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-[--border] bg-[--background]/40",
              )}
            >
              <button
                type="button"
                onClick={() => onChange({ gabarito: l })}
                className={cn(
                  "shrink-0 mt-1.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold uppercase border transition-colors",
                  isCorrect
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-[--border] text-[--foreground-muted] hover:border-[--primary] hover:text-[--primary]",
                )}
                title="Marcar como correta"
              >
                {l}
              </button>
              <Textarea
                value={valor}
                onChange={(e) => onChange({ [field]: e.target.value } as Partial<QuestaoEditavel>)}
                rows={1}
                placeholder={`Alternativa ${l.toUpperCase()}`}
                className="min-h-9 py-2"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "info", label: "1. Informações" },
    { key: "upload", label: "2. Enviar PDF" },
    { key: "revisar", label: "3. Revisar e publicar" },
  ];
  const idx = steps.findIndex((s) => s.key === step);
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
              i < idx
                ? "gold-gradient text-[--primary-foreground]"
                : i === idx
                ? "bg-[--primary]/20 border border-[--primary] text-[--primary]"
                : "bg-[--surface-2] text-[--foreground-muted]",
            )}
          >
            {i < idx ? <CheckCircle2 size={14} /> : i + 1}
          </div>
          <span className={cn("text-sm font-medium", i === idx ? "text-[--foreground]" : "text-[--foreground-muted]")}>
            {s.label}
          </span>
          {i < steps.length - 1 ? <span className="text-[--foreground-subtle] mx-1">·</span> : null}
        </div>
      ))}
    </div>
  );
}
