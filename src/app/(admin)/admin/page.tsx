import Link from "next/link";
import { Users, ClipboardCheck, GraduationCap, Trophy, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Admin — Visão Geral" };

export default async function AdminHome() {
  await requireAdmin();
  const supabase = await createClient();

  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalAlunos },
    { count: totalAulas },
    { count: totalSimulados },
    { count: tentativasHoje },
    { data: topAlunos },
    { data: ultimasTentativas },
  ] = await Promise.all([
    supabase.from("tuba_profiles").select("*", { count: "exact", head: true }).eq("role", "aluno").eq("ativo", true),
    supabase.from("tuba_aulas").select("*", { count: "exact", head: true }),
    supabase.from("tuba_simulados").select("*", { count: "exact", head: true }).eq("publicado", true),
    supabase
      .from("tuba_tentativas")
      .select("*", { count: "exact", head: true })
      .gte("finalizado_em", since),
    supabase.from("tuba_ranking_geral").select("*").order("posicao").limit(5),
    supabase
      .from("tuba_tentativas")
      .select("id, nota, finalizado_em, tuba_simulados(titulo), tuba_profiles(full_name)")
      .not("finalizado_em", "is", null)
      .order("finalizado_em", { ascending: false })
      .limit(8),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Painel Admin"
        title="Visão geral"
        subtitle="O que tá rolando na plataforma agora."
        action={
          <Button asChild>
            <Link href="/admin/simulados/novo">
              <Plus size={16} /> Novo simulado
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <KpiCard icon={<Users size={18} />} label="Alunos ativos" value={String(totalAlunos ?? 0)} href="/admin/alunos" />
        <KpiCard icon={<GraduationCap size={18} />} label="Aulas" value={String(totalAulas ?? 0)} href="/admin/aulas" />
        <KpiCard icon={<ClipboardCheck size={18} />} label="Simulados publicados" value={String(totalSimulados ?? 0)} href="/admin/simulados" />
        <KpiCard icon={<Trophy size={18} />} label="Tentativas em 24h" value={String(tentativasHoje ?? 0)} href="/admin/ranking" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-[--foreground] mb-4">Top 5 alunos</h3>
          {topAlunos?.length ? (
            <ul className="space-y-3">
              {topAlunos.map((a) => (
                <li key={a.user_id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[--primary]/15 text-xs font-bold text-[--primary]">
                    {a.posicao}
                  </span>
                  <Avatar name={a.full_name ?? "?"} src={a.avatar_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-[--foreground]">{a.full_name ?? "—"}</p>
                    <p className="text-xs text-[--foreground-muted]">
                      {a.simulados_feitos} simulados · média {Number(a.media_geral).toFixed(1)}
                    </p>
                  </div>
                  <Badge variant="gold">{a.pontos.toLocaleString("pt-BR")} pts</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[--foreground-muted]">Sem dados ainda.</p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-[--foreground] mb-4">Últimas tentativas</h3>
          {ultimasTentativas?.length ? (
            <ul className="space-y-3">
              {ultimasTentativas.map((t) => {
                const nome = (t as { tuba_profiles?: { full_name?: string } }).tuba_profiles?.full_name ?? "—";
                const titulo = (t as { tuba_simulados?: { titulo?: string } }).tuba_simulados?.titulo ?? "Simulado";
                const nota = Number(t.nota ?? 0);
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[--foreground]">{nome}</p>
                      <p className="truncate text-xs text-[--foreground-muted]">{titulo}</p>
                    </div>
                    <Badge variant={nota >= 70 ? "success" : nota >= 50 ? "gold" : "danger"}>
                      {nota.toFixed(1)}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-[--foreground-muted]">Nenhuma tentativa registrada.</p>
          )}
        </Card>
      </div>
    </>
  );
}

function KpiCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-5 hover:-translate-y-0.5 cursor-pointer transition-transform">
        <div className="flex items-center gap-2 text-[--foreground-muted]">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[--primary]/15 text-[--primary]">
            {icon}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <p className="mt-3 font-[family-name:var(--font-playfair)] text-3xl text-[--foreground]">
          {value}
        </p>
      </Card>
    </Link>
  );
}
