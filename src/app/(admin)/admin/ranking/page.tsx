import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Trophy } from "lucide-react";

export const metadata = { title: "Ranking — Admin" };

export default async function RankingAdmin() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: ranking } = await supabase.from("tuba_ranking_geral").select("*").order("posicao");

  return (
    <>
      <PageHeader eyebrow="Visão geral" title="Ranking completo" subtitle="Posição de todos os alunos cadastrados." />

      {!ranking?.length ? (
        <EmptyState icon={<Trophy size={24} />} title="Sem ranking ainda" description="Aguardando alunos fazerem simulados." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[--surface-2]/60 text-left text-xs uppercase tracking-wider text-[--foreground-muted]">
                <tr>
                  <th className="px-6 py-3 font-semibold w-16">#</th>
                  <th className="px-6 py-3 font-semibold">Aluno</th>
                  <th className="px-6 py-3 font-semibold text-right">Simulados</th>
                  <th className="px-6 py-3 font-semibold text-right">Média</th>
                  <th className="px-6 py-3 font-semibold text-right">Conquistas</th>
                  <th className="px-6 py-3 font-semibold text-right">Pontos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {ranking.map((r) => (
                  <tr key={r.user_id} className="hover:bg-[--surface-2]/40">
                    <td className="px-6 py-3 font-bold text-[--foreground-muted]">{r.posicao}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.full_name ?? "?"} src={r.avatar_url} size="sm" />
                        <span className="font-medium text-[--foreground]">{r.full_name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-[--foreground-muted]">{r.simulados_feitos}</td>
                    <td className="px-6 py-3 text-right text-[--foreground-muted]">{Number(r.media_geral).toFixed(1)}</td>
                    <td className="px-6 py-3 text-right text-[--foreground-muted]">{r.conquistas}</td>
                    <td className="px-6 py-3 text-right">
                      <span className="font-bold gold-text">{r.pontos.toLocaleString("pt-BR")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
