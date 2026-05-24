import { Users, UserPlus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NovoAlunoDialog } from "./novo-aluno-dialog";
import { AlunoActions } from "./aluno-actions";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Alunos — Admin" };

export default async function AlunosPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: alunos } = await supabase
    .from("tuba_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        eyebrow="Gerenciar"
        title="Alunos"
        subtitle="Adicione, desative ou remova alunos da plataforma."
        action={<NovoAlunoDialog />}
      />

      {!alunos?.length ? (
        <EmptyState
          icon={<Users size={24} />}
          title="Nenhum aluno ainda"
          description="Comece criando o primeiro aluno ou admin."
          action={<NovoAlunoDialog />}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[--surface-2]/60 text-left text-xs uppercase tracking-wider text-[--foreground-muted]">
                <tr>
                  <th className="px-6 py-3 font-semibold">Aluno</th>
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Papel</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Criado em</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {alunos.map((a) => (
                  <tr key={a.id} className="hover:bg-[--surface-2]/40">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={a.full_name ?? a.email} src={a.avatar_url} size="sm" />
                        <span className="font-medium text-[--foreground]">
                          {a.full_name ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-[--foreground-muted]">{a.email}</td>
                    <td className="px-6 py-3">
                      <Badge variant={a.role === "admin" ? "gold" : "default"}>
                        {a.role === "admin" ? "Admin" : "Aluno"}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={a.ativo ? "success" : "danger"}>
                        {a.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-[--foreground-muted]">
                      {formatDate(a.created_at)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <AlunoActions id={a.id} ativo={a.ativo} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs text-[--foreground-muted]">
        <UserPlus size={14} className="text-[--primary]" />
        Dica: ao criar um aluno, defina uma senha temporária e envie pelo WhatsApp.
      </div>
    </>
  );
}
