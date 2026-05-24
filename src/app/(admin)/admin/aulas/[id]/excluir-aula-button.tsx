"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { excluirAula } from "@/lib/admin/actions";

export function ExcluirAulaButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function onClick() {
    if (!confirm("Excluir esta aula? Materiais associados também serão removidos.")) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await excluirAula(fd);
      toast.success("Aula excluída");
      router.push("/admin/aulas");
    });
  }
  return (
    <Button variant="outline" onClick={onClick} loading={pending} className="hover:text-red-400">
      <Trash2 size={16} /> Excluir aula
    </Button>
  );
}
