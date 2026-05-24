"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { excluirSimulado, togglePublicarSimulado } from "@/lib/admin/simulados-actions";

export function SimuladoActions({ id, publicado }: { id: string; publicado: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function togglePublicar() {
    startTransition(async () => {
      const res = await togglePublicarSimulado(id);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(res.publicado ? "Simulado publicado." : "Simulado despublicado.");
        router.refresh();
      }
    });
  }

  function excluir() {
    if (!confirm("Excluir este simulado? As questões, tentativas e respostas também serão removidas. Esta ação não pode ser desfeita.")) {
      return;
    }
    startTransition(async () => {
      const res = await excluirSimulado(id);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Simulado excluído.");
        router.push("/admin/simulados");
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={togglePublicar} loading={pending}>
        {publicado ? <EyeOff size={14} /> : <Eye size={14} />}
        {publicado ? "Despublicar" : "Publicar"}
      </Button>
      <Button variant="ghost" size="sm" onClick={excluir} loading={pending}>
        <Trash2 size={14} /> Excluir
      </Button>
    </>
  );
}
