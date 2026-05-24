import Link from "next/link";
import { ClipboardCheck, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Simulados — Admin" };

export default async function SimuladosAdminPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: simulados } = await supabase
    .from("tuba_simulados")
    .select("*, tuba_disciplinas(nome)")
    .order("created_at", { ascending: false });

  // contar questoes por simulado
  const ids = simulados?.map((s) => s.id) ?? [];
  const countQuestoes = new Map<string, number>();
  if (ids.length) {
    const { data: q } = await supabase
      .from("tuba_questoes")
      .select("simulado_id")
      .in("simulado_id", ids);
    q?.forEach((row) => {
      countQuestoes.set(row.simulado_id, (countQuestoes.get(row.simulado_id) ?? 0) + 1);
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Conteúdo"
        title="Simulados"
        subtitle="Suba um PDF de questões e a plataforma gera o simulado automaticamente."
        action={
          <Button asChild>
            <Link href="/admin/simulados/novo">
              <Plus size={16} /> Novo simulado
            </Link>
          </Button>
        }
      />

      {!simulados?.length ? (
        <EmptyState
          icon={<ClipboardCheck size={24} />}
          title="Nenhum simulado ainda"
          description="Crie seu primeiro simulado fazendo upload de um PDF. A plataforma extrai as questões via OCR."
          action={
            <Button asChild>
              <Link href="/admin/simulados/novo">
                <Plus size={16} /> Criar primeiro simulado
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
                  <th className="px-6 py-3 font-semibold">Questões</th>
                  <th className="px-6 py-3 font-semibold">Duração</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Criado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {simulados.map((s) => {
                  const disc = (s as { tuba_disciplinas?: { nome?: string } }).tuba_disciplinas?.nome;
                  const n = countQuestoes.get(s.id) ?? 0;
                  return (
                    <tr key={s.id} className="hover:bg-[--surface-2]/40">
                      <td className="px-6 py-3 font-medium text-[--foreground]">
                        <Link href={`/admin/simulados/${s.id}`} className="hover:text-[--primary]">
                          {s.titulo}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-[--foreground-muted]">{disc ?? "—"}</td>
                      <td className="px-6 py-3 text-[--foreground-muted]">{n}</td>
                      <td className="px-6 py-3 text-[--foreground-muted]">{s.duracao_minutos} min</td>
                      <td className="px-6 py-3">
                        <Badge variant={s.publicado ? "success" : "muted"}>
                          {s.publicado ? "Publicado" : "Rascunho"}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-[--foreground-muted]">{formatDate(s.created_at)}</td>
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
