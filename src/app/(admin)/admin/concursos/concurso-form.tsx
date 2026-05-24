"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { TubaDisciplina, TubaConcurso, TubaConcursoDisciplina } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { atualizarConcurso, criarConcurso } from "@/lib/admin/concursos-actions";

interface Props {
  modo: "novo" | "editar";
  concurso?: TubaConcurso;
  disciplinas: TubaDisciplina[];
  vinculos?: TubaConcursoDisciplina[];
}

export function ConcursoForm({ modo, concurso, disciplinas, vinculos = [] }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState(concurso?.nome ?? "");
  const [descricao, setDescricao] = useState(concurso?.descricao ?? "");
  const [banca, setBanca] = useState(concurso?.banca ?? "");
  const [ano, setAno] = useState(concurso?.ano?.toString() ?? "");
  const [cor, setCor] = useState(concurso?.cor ?? "#0a1d3a");
  const [ordem, setOrdem] = useState(concurso?.ordem?.toString() ?? "0");
  const [publicado, setPublicado] = useState(concurso?.publicado ?? false);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(
    new Set(vinculos.map((v) => v.disciplina_id)),
  );
  const [capaArquivo, setCapaArquivo] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(concurso?.capa_url ?? null);
  const [removerCapaFlag, setRemoverCapaFlag] = useState(false);

  useEffect(() => {
    if (!capaArquivo) return;
    const url = URL.createObjectURL(capaArquivo);
    setCapaPreview(url);
    setRemoverCapaFlag(false);
    return () => URL.revokeObjectURL(url);
  }, [capaArquivo]);

  function toggleDisciplina(id: string) {
    setSelecionadas((s) => {
      const nx = new Set(s);
      if (nx.has(id)) nx.delete(id);
      else nx.add(id);
      return nx;
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe o nome do concurso.");
      return;
    }
    const fd = new FormData();
    if (concurso?.id) fd.set("id", concurso.id);
    fd.set("nome", nome.trim());
    fd.set("descricao", descricao ?? "");
    fd.set("banca", banca ?? "");
    fd.set("ano", ano ?? "");
    fd.set("cor", cor);
    fd.set("ordem", ordem || "0");
    fd.set("publicado", publicado ? "true" : "false");
    if (capaArquivo) fd.set("capa", capaArquivo);
    if (removerCapaFlag) fd.set("remover_capa", "true");
    selecionadas.forEach((d) => fd.append("disciplina_ids", d));

    startTransition(async () => {
      const action = modo === "novo" ? criarConcurso : atualizarConcurso;
      const res = await action(fd);
      if (res?.error) toast.error(res.error);
      else if (res?.ok) {
        toast.success("Concurso atualizado.");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div>
        <Label>Capa (2:3)</Label>
        <div className="mt-2 relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-[--border] bg-[--surface]/40">
          {capaPreview ? (
            <>
              <Image
                src={capaPreview}
                alt="capa"
                fill
                sizes="260px"
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => {
                  setCapaArquivo(null);
                  setCapaPreview(null);
                  setRemoverCapaFlag(!!concurso?.capa_url);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-black/70 p-1.5 text-white hover:bg-red-600 transition-colors"
                title="Remover capa"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-full w-full flex-col items-center justify-center gap-2 text-[--foreground-muted] hover:text-[--primary] hover:bg-[--surface]/60 transition-colors"
            >
              <ImagePlus size={28} />
              <span className="text-xs font-medium">Enviar capa</span>
              <span className="text-[10px] uppercase tracking-wider">PNG / JPG / WEBP</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={(e) => setCapaArquivo(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        {capaPreview ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus size={14} /> Trocar imagem
          </Button>
        ) : null}

        <div className="mt-6">
          <Label>Cor de destaque</Label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border border-[--border] bg-transparent"
            />
            <span className="text-xs text-[--foreground-muted]">
              Usada nos detalhes da página do concurso
            </span>
          </div>
        </div>

        <label className="mt-6 flex items-start gap-3 rounded-xl border border-[--border] p-3">
          <input
            type="checkbox"
            checked={publicado}
            onChange={(e) => setPublicado(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[--primary]"
          />
          <div className="text-xs">
            <p className="text-sm font-semibold text-[--foreground]">Publicado</p>
            <p className="text-[--foreground-muted]">Visível pra todos os alunos na vitrine</p>
          </div>
        </label>
      </div>

      <div className="space-y-5">
        <div>
          <Label htmlFor="nome">Nome do concurso *</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: EAOF 2027"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="banca">Banca</Label>
            <Input
              id="banca"
              value={banca}
              onChange={(e) => setBanca(e.target.value)}
              placeholder="Ex: AFA"
            />
          </div>
          <div>
            <Label htmlFor="ano">Ano</Label>
            <Input
              id="ano"
              type="number"
              min={2020}
              max={2099}
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              placeholder="2027"
            />
          </div>
          <div>
            <Label htmlFor="ordem">Posição na vitrine</Label>
            <Input
              id="ordem"
              type="number"
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="desc">Descrição</Label>
          <Textarea
            id="desc"
            value={descricao ?? ""}
            onChange={(e) => setDescricao(e.target.value)}
            rows={4}
            placeholder="Breve apresentação do concurso, edital, perfil das provas, etc."
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Disciplinas vinculadas</Label>
            <span className="text-xs text-[--foreground-muted]">
              {selecionadas.size} selecionada{selecionadas.size === 1 ? "" : "s"}
            </span>
          </div>
          {disciplinas.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[--border] p-4 text-xs text-[--foreground-muted]">
              Nenhuma disciplina cadastrada. Crie em <strong>Disciplinas</strong> primeiro.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {disciplinas.map((d) => {
                const active = selecionadas.has(d.id);
                return (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => toggleDisciplina(d.id)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors text-left",
                      active
                        ? "border-[--primary]/50 bg-[--primary]/10 text-[--foreground]"
                        : "border-[--border] text-[--foreground-muted] hover:border-[--primary]/40 hover:text-[--foreground]",
                    )}
                  >
                    <span>{d.nome}</span>
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold",
                        active
                          ? "border-[--primary] bg-[--primary] text-[--primary-foreground]"
                          : "border-[--border]",
                      )}
                    >
                      {active ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[--border]">
          {modo === "editar" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/concursos")}
              disabled={pending}
            >
              <Trash2 size={14} /> Voltar sem salvar
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" loading={pending} disabled={pending}>
            <Save size={16} /> {modo === "novo" ? "Criar concurso" : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </form>
  );
}
