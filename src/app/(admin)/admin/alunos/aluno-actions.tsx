"use client";

import { useTransition } from "react";
import { Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleAlunoAtivo, excluirAluno } from "@/lib/admin/actions";

export function AlunoActions({ id, ativo }: { id: string; ativo: boolean }) {
  const [pending, startTransition] = useTransition();

  function onToggle() {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("ativo", String(!ativo));
    startTransition(async () => {
      await toggleAlunoAtivo(fd);
      toast.success(ativo ? "Aluno desativado" : "Aluno ativado");
    });
  }

  function onDelete() {
    if (!confirm("Tem certeza? Essa ação é irreversível.")) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      const res = await excluirAluno(fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Aluno removido");
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onToggle}
        loading={pending}
        title={ativo ? "Desativar" : "Ativar"}
      >
        <Power size={16} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        loading={pending}
        title="Excluir"
        className="hover:text-red-400"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
}
