import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { AulaForm } from "../aula-form";

export const metadata = { title: "Nova aula — Admin" };

export default async function NovaAulaPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: disciplinas } = await supabase
    .from("tuba_disciplinas")
    .select("*")
    .eq("ativa", true)
    .order("ordem");

  return (
    <>
      <Link
        href="/admin/aulas"
        className="inline-flex items-center gap-2 mb-4 text-sm text-[--foreground-muted] hover:text-[--primary]"
      >
        <ArrowLeft size={14} /> Voltar
      </Link>
      <PageHeader eyebrow="Conteúdo" title="Nova aula" />
      <Card className="p-6">
        <AulaForm disciplinas={disciplinas ?? []} />
      </Card>
    </>
  );
}
