import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { iniciarTentativa } from "@/lib/admin/simulados-actions";
import { FazerSimulado } from "./fazer-simulado";

export const metadata = { title: "Simulado em andamento" };

export default async function FazerSimuladoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await getCurrentUser();
  const supabase = await createClient();

  const { data: simulado } = await supabase
    .from("tuba_simulados")
    .select("*, tuba_disciplinas(nome)")
    .eq("id", id)
    .eq("publicado", true)
    .maybeSingle();

  if (!simulado) notFound();

  const { data: questoes } = await supabase
    .from("tuba_questoes")
    .select("id, numero, enunciado, alt_a, alt_b, alt_c, alt_d, alt_e")
    .eq("simulado_id", id)
    .order("numero");

  if (!questoes || questoes.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[--foreground-muted]">Esse simulado ainda não tem questões.</p>
      </div>
    );
  }

  // inicia tentativa (ou usa existente em aberto)
  const initRes = await iniciarTentativa(id);
  if ("error" in initRes) {
    redirect("/app/simulados");
  }

  return (
    <FazerSimulado
      simulado={{
        id: simulado.id,
        titulo: simulado.titulo,
        duracao_minutos: simulado.duracao_minutos,
        disciplina_nome:
          (simulado as { tuba_disciplinas?: { nome?: string } }).tuba_disciplinas?.nome ?? null,
      }}
      questoes={questoes.map((q) => ({
        id: q.id,
        numero: q.numero,
        enunciado: q.enunciado,
        alternativas: {
          a: q.alt_a,
          b: q.alt_b,
          c: q.alt_c,
          d: q.alt_d,
          e: q.alt_e,
        },
      }))}
      tentativaId={initRes.id!}
      userName={profile.full_name ?? profile.email}
    />
  );
}
