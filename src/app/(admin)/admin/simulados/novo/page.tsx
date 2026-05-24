import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { NovoSimuladoWizard } from "./wizard";

export const metadata = { title: "Novo simulado — Admin" };

export default async function NovoSimuladoPage() {
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
        href="/admin/simulados"
        className="inline-flex items-center gap-2 mb-4 text-sm text-[--foreground-muted] hover:text-[--primary]"
      >
        <ArrowLeft size={14} /> Voltar
      </Link>
      <PageHeader
        eyebrow="Novo conteúdo"
        title="Criar simulado a partir de PDF"
        subtitle="A plataforma extrai as questões e alternativas automaticamente. Você só precisa revisar e marcar o gabarito."
      />
      <Card className="p-6">
        <NovoSimuladoWizard disciplinas={disciplinas ?? []} />
      </Card>
    </>
  );
}
