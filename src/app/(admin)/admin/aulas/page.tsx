import Link from "next/link";
import { GraduationCap, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Aulas — Admin" };

export default async function AulasAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: aulas } = await supabase
    .from("tuba_aulas")
    .select("*, tuba_disciplinas(nome)")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        eyebrow="Conteúdo"
        title="Aulas"
        subtitle="Adicione, edite ou remova aulas do curso."
        action={
          <Button asChild>
            <Link href="/admin/aulas/nova">
              <Plus size={16} /> Nova aula
            </Link>
          </Button>
        }
      />

      {!aulas?.length ? (
        <EmptyState
          icon={<GraduationCap size={24} />}
          title="Nenhuma aula cadastrada"
          description="Comece adicionando a primeira aula com o link do YouTube."
          action={
            <Button asChild>
              <Link href="/admin/aulas/nova">
                <Plus size={16} /> Adicionar aula
              </Link>
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[--surface-2]/60 text-left text-xs uppercase tracking-wider text-[--foreground-muted]">
                <tr>
                  <th className="px-6 py-3 font-semibold">Título</th>
                  <th className="px-6 py-3 font-semibold">Disciplina</th>
                  <th className="px-6 py-3 font-semibold">Ordem</th>
                  <th className="px-6 py-3 font-semibold">Duração</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {aulas.map((a) => {
                  const disc = (a as { tuba_disciplinas?: { nome?: string } }).tuba_disciplinas?.nome;
                  return (
                    <tr key={a.id} className="hover:bg-[--surface-2]/40">
                      <td className="px-6 py-3 font-medium text-[--foreground]">
                        <Link href={`/admin/aulas/${a.id}`} className="hover:text-[--primary]">
                          {a.titulo}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-[--foreground-muted]">{disc ?? "—"}</td>
                      <td className="px-6 py-3 text-[--foreground-muted]">{a.ordem}</td>
                      <td className="px-6 py-3 text-[--foreground-muted]">
                        {a.duracao_min ? `${a.duracao_min} min` : "—"}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={a.publicada ? "success" : "muted"}>
                          {a.publicada ? "Publicada" : "Rascunho"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
