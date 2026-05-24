"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function MarcarAssistida({
  aulaId,
  inicialAssistida,
}: {
  aulaId: string;
  inicialAssistida: boolean;
}) {
  const [assistida, setAssistida] = useState(inicialAssistida);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      if (assistida) {
        const { error } = await supabase
          .from("tuba_aulas_assistidas")
          .delete()
          .eq("user_id", u.user.id)
          .eq("aula_id", aulaId);
        if (error) {
          toast.error("Não foi possível desmarcar.");
          return;
        }
        setAssistida(false);
        toast.success("Marcação removida.");
      } else {
        const { error } = await supabase
          .from("tuba_aulas_assistidas")
          .insert({ user_id: u.user.id, aula_id: aulaId, assistida_em: new Date().toISOString() });
        if (error) {
          toast.error("Não foi possível marcar.");
          return;
        }
        setAssistida(true);
        toast.success("Aula marcada como assistida.");
      }
    });
  }

  return (
    <Button
      variant={assistida ? "secondary" : "primary"}
      onClick={toggle}
      loading={pending}
      className="w-full sm:w-auto"
    >
      {assistida ? (
        <>
          <CheckCircle2 size={16} /> Assistida
        </>
      ) : (
        <>
          <Circle size={16} /> Marcar como assistida
        </>
      )}
    </Button>
  );
}
