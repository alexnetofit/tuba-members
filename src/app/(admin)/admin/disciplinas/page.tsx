import { BookMarked } from "lucide-react";
import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DisciplinasManager } from "./disciplinas-manager";

export const metadata = { title: "Disciplinas — Admin" };

export default async function DisciplinasPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: disciplinas } = await supabase
    .from("tuba_disciplinas")
    .select("*")
    .order("ordem");

  return (
    <>
      <PageHeader
        eyebrow="Conteúdo"
        title="Disciplinas"
        subtitle="As matérias do curso. A ordem define como aparecem para o aluno."
      />

      {!disciplinas?.length ? (
        <EmptyState
          icon={<BookMarked size={24} />}
          title="Nenhuma disciplina"
          description="Adicione disciplinas para organizar as aulas e simulados."
        />
      ) : null}

      <Card className="p-6">
        <DisciplinasManager disciplinas={disciplinas ?? []} />
      </Card>
    </>
  );
}
