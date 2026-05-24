import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ConcursoForm } from "../concurso-form";
import { ConcursoActionsBar } from "./concurso-actions-bar";

export const metadata = { title: "Editar concurso — Admin" };

export default async function EditarConcursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: concurso }, { data: disciplinas }, { data: vinculos }] = await Promise.all([
    supabase.from("tuba_concursos").select("*").eq("id", id).maybeSingle(),
    supabase.from("tuba_disciplinas").select("*").order("ordem"),
    supabase
      .from("tuba_concurso_disciplinas")
      .select("*")
      .eq("concurso_id", id)
      .order("ordem"),
  ]);

  if (!concurso) notFound();

  return (
    <>
      <Link
        href="/admin/concursos"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[--foreground-muted] hover:text-[--primary] mb-4"
      >
        <ArrowLeft size={14} /> Voltar para concursos
      </Link>
      <PageHeader
        eyebrow={concurso.banca ?? "Concurso"}
        title={concurso.nome}
        subtitle="Edite os dados, troque a capa ou atualize as disciplinas vinculadas."
        action={
          <div className="flex items-center gap-2">
            <Badge variant={concurso.publicado ? "success" : "muted"}>
              {concurso.publicado ? "Publicado" : "Rascunho"}
            </Badge>
            <ConcursoActionsBar id={concurso.id} publicado={concurso.publicado} />
          </div>
        }
      />

      <ConcursoForm
        modo="editar"
        concurso={concurso}
        disciplinas={disciplinas ?? []}
        vinculos={vinculos ?? []}
      />
    </>
  );
}
