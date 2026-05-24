"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { excluirConcurso, togglePublicarConcurso } from "@/lib/admin/concursos-actions";

export function ConcursoActionsBar({ id, publicado }: { id: string; publicado: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const res = await togglePublicarConcurso(id);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(res.publicado ? "Concurso publicado." : "Concurso despublicado.");
        router.refresh();
      }
    });
  }

  function excluir() {
    if (
      !confirm(
        "Excluir este concurso? Isso remove a capa e os vínculos com disciplinas (as aulas e disciplinas permanecem).",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await excluirConcurso(id);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Concurso excluído.");
        router.push("/admin/concursos");
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={toggle} loading={pending}>
        {publicado ? <EyeOff size={14} /> : <Eye size={14} />}
        {publicado ? "Despublicar" : "Publicar"}
      </Button>
      <Button variant="ghost" size="sm" onClick={excluir} loading={pending}>
        <Trash2 size={14} /> Excluir
      </Button>
    </>
  );
}
