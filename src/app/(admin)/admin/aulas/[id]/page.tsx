import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { AulaForm } from "../aula-form";
import { MateriaisManager } from "./materiais-manager";
import { ExcluirAulaButton } from "./excluir-aula-button";

export default async function AulaEditarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: aula }, { data: disciplinas }, { data: materiais }] = await Promise.all([
    supabase.from("tuba_aulas").select("*").eq("id", id).maybeSingle(),
    supabase.from("tuba_disciplinas").select("*").eq("ativa", true).order("ordem"),
    supabase.from("tuba_aula_materiais").select("*").eq("aula_id", id).order("created_at"),
  ]);

  if (!aula) notFound();

  return (
    <>
      <Link
        href="/admin/aulas"
        className="inline-flex items-center gap-2 mb-4 text-sm text-[--foreground-muted] hover:text-[--primary]"
      >
        <ArrowLeft size={14} /> Voltar
      </Link>

      <PageHeader
        eyebrow="Editar"
        title={aula.titulo}
        action={<ExcluirAulaButton id={aula.id} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider gold-text mb-4">Dados da aula</h3>
          <AulaForm disciplinas={disciplinas ?? []} aula={aula} />
        </Card>

        <Card className="p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider gold-text mb-4">
            Materiais (PDFs)
          </h3>
          <MateriaisManager aulaId={aula.id} materiais={materiais ?? []} />
        </Card>
      </div>
    </>
  );
}
