"use client";

import { useState, useTransition } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { TubaDisciplina } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { salvarDisciplina, excluirDisciplina } from "@/lib/admin/actions";

const ICONES = ["BookOpen", "PenLine", "Scale", "TrendingUp", "Brain", "Calculator", "Globe", "Microscope"];

export function DisciplinasManager({ disciplinas }: { disciplinas: TubaDisciplina[] }) {
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData, onSuccess?: () => void) {
    startTransition(async () => {
      const res = await salvarDisciplina(formData);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Salvo");
        onSuccess?.();
      }
    });
  }

  function onDelete(id: string) {
    if (!confirm("Excluir esta disciplina? Aulas e simulados associados não serão deletados, mas ficarão sem categoria."))
      return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await excluirDisciplina(fd);
      toast.success("Disciplina removida");
    });
  }

  return (
    <div className="space-y-3">
      {disciplinas.map((d) => (
        <DisciplinaRow key={d.id} disciplina={d} onSubmit={onSubmit} onDelete={onDelete} pending={pending} />
      ))}

      {adding ? (
        <form
          action={(fd) => onSubmit(fd, () => setAdding(false))}
          className="grid gap-3 sm:grid-cols-[1fr,140px,120px,140px,auto] items-end rounded-xl border border-[--primary]/30 bg-[--primary]/5 p-4"
        >
          <div>
            <Label>Nome</Label>
            <Input name="nome" required placeholder="Ex: Matemática" />
          </div>
          <div>
            <Label>Ordem</Label>
            <Input name="ordem" type="number" defaultValue={disciplinas.length + 1} />
          </div>
          <div>
            <Label>Cor</Label>
            <Input name="cor" type="color" defaultValue="#d4a44a" className="h-11 p-1" />
          </div>
          <div>
            <Label>Ícone</Label>
            <Select name="icone" defaultValue="BookOpen">
              {ICONES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending}>
              <Save size={14} /> Adicionar
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" onClick={() => setAdding(true)}>
          <Plus size={16} /> Nova disciplina
        </Button>
      )}
    </div>
  );
}

function DisciplinaRow({
  disciplina,
  onSubmit,
  onDelete,
  pending,
}: {
  disciplina: TubaDisciplina;
  onSubmit: (fd: FormData) => void;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  return (
    <form
      action={onSubmit}
      className="grid gap-3 sm:grid-cols-[1fr,140px,120px,140px,auto] items-end rounded-xl border border-[--border] bg-[--surface]/40 p-4"
    >
      <input type="hidden" name="id" value={disciplina.id} />
      <div>
        <Label>Nome</Label>
        <Input name="nome" defaultValue={disciplina.nome} required />
      </div>
      <div>
        <Label>Ordem</Label>
        <Input name="ordem" type="number" defaultValue={disciplina.ordem} />
      </div>
      <div>
        <Label>Cor</Label>
        <Input name="cor" type="color" defaultValue={disciplina.cor} className="h-11 p-1" />
      </div>
      <div>
        <Label>Ícone</Label>
        <Select name="icone" defaultValue={disciplina.icone ?? "BookOpen"}>
          {ICONES.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={pending}>
          <Save size={14} /> Salvar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onDelete(disciplina.id)}
          className="hover:text-red-400"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </form>
  );
}
