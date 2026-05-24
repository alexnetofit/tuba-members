"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import type { TubaDisciplina, TubaAula } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { salvarAula } from "@/lib/admin/actions";

interface Props {
  disciplinas: TubaDisciplina[];
  aula?: TubaAula;
}

export function AulaForm({ disciplinas, aula }: Props) {
  const router = useRouter();
  const [publicada, setPublicada] = useState(aula?.publicada ?? true);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await salvarAula(formData);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(res?.success ?? "Salvo");
        router.push("/admin/aulas");
      }
    });
  }

  return (
    <form action={onSubmit} className="grid gap-5">
      {aula ? <input type="hidden" name="id" value={aula.id} /> : null}

      <div>
        <Label htmlFor="titulo">Título da aula</Label>
        <Input id="titulo" name="titulo" defaultValue={aula?.titulo} required placeholder="Ex: Crase — Aula 1" />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <Label htmlFor="disciplina_id">Disciplina</Label>
          <Select id="disciplina_id" name="disciplina_id" defaultValue={aula?.disciplina_id ?? ""} required>
            <option value="" disabled>Selecione...</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>{d.nome}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="ordem">Ordem na disciplina</Label>
          <Input id="ordem" name="ordem" type="number" defaultValue={aula?.ordem ?? 0} />
        </div>
      </div>

      <div>
        <Label htmlFor="youtube_url">URL do YouTube (não-listado ou privado)</Label>
        <Input
          id="youtube_url"
          name="youtube_url"
          type="url"
          required
          defaultValue={aula?.youtube_url}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>

      <div>
        <Label htmlFor="duracao_min">Duração (minutos)</Label>
        <Input id="duracao_min" name="duracao_min" type="number" defaultValue={aula?.duracao_min ?? ""} placeholder="Ex: 60" />
      </div>

      <div>
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Textarea id="descricao" name="descricao" defaultValue={aula?.descricao ?? ""} rows={4} placeholder="O que será abordado nesta aula..." />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="publicada"
          checked={publicada}
          onChange={(e) => setPublicada(e.target.checked)}
          className="h-4 w-4 rounded border-[--border] bg-[--surface] accent-[--primary]"
        />
        <span className="text-sm text-[--foreground]">Publicada (visível para alunos)</span>
      </label>

      <div className="flex justify-end gap-2 pt-2 border-t border-[--border]">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" loading={pending}>
          <Save size={16} /> Salvar aula
        </Button>
      </div>
    </form>
  );
}
