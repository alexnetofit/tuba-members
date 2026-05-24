import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { ConcursoForm } from "../concurso-form";

export const metadata = { title: "Novo concurso — Admin" };

export default async function NovoConcursoPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: disciplinas } = await supabase
    .from("tuba_disciplinas")
    .select("*")
    .order("ordem");

  return (
    <>
      <Link
        href="/admin/concursos"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[--foreground-muted] hover:text-[--primary] mb-4"
      >
        <ArrowLeft size={14} /> Voltar
      </Link>
      <PageHeader
        eyebrow="Catálogo"
        title="Novo concurso"
        subtitle="Preencha os dados, escolha as disciplinas e suba a capa."
      />
      <ConcursoForm modo="novo" disciplinas={disciplinas ?? []} />
    </>
  );
}
