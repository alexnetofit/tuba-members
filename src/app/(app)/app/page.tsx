import Link from "next/link";
import {
  ArrowRight,
  Award,
  ClipboardCheck,
  Flame,
  GraduationCap,
  PlayCircle,
  Trophy,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";

interface DashboardData {
  ranking: {
    posicao: number;
    pontos: number;
    media_geral: number | string;
    simulados_feitos: number;
    conquistas: number;
  } | null;
  ultimas_tentativas: Array<{
    id: string;
    nota: number | string;
    finalizado_em: string;
    simulado_id: string;
    tuba_simulados: { titulo: string } | null;
  }>;
  proxima_aula: {
    id: string;
    titulo: string;
    disciplina_id: string | null;
    tuba_disciplinas: { nome: string } | null;
  } | null;
  aulas_assistidas: number;
  progresso: Array<{
    id: string;
    nome: string;
    cor: string;
    total_aulas: number;
    assistidas: number;
  }>;
}

export default async function DashboardAluno() {
  const { profile } = await getCurrentUser();
  const supabase = await createClient();

  const { data } = await supabase.rpc("tuba_dashboard_aluno", { p_user_id: profile.id });
  const dash = (data ?? {}) as Partial<DashboardData>;
  const ranking = dash.ranking ?? null;
  const ultimas = dash.ultimas_tentativas ?? [];
  const proxima = dash.proxima_aula ?? null;
  const aulasAssistidas = Number(dash.aulas_assistidas ?? 0);
  const progresso = dash.progresso ?? [];

  const nomeCurto = profile.full_name?.split(" ")[0] ?? "Aluno";

  return (
    <>
      <PageHeader
        eyebrow={`Olá, ${nomeCurto}`}
        title="Bora pra cima de mais uma vitória."
        subtitle="Veja seu progresso, próximos simulados e sua posição no ranking."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <KpiCard
          icon={<Trophy size={18} />}
          label="Sua posição"
          value={ranking?.posicao ? `${ranking.posicao}º` : "—"}
          hint={ranking ? `${Number(ranking.pontos).toLocaleString("pt-BR")} pts` : "Faça um simulado"}
        />
        <KpiCard
          icon={<ClipboardCheck size={18} />}
          label="Simulados feitos"
          value={String(ranking?.simulados_feitos ?? 0)}
          hint={ranking?.media_geral ? `Média ${Number(ranking.media_geral).toFixed(1)}` : "Nenhuma ainda"}
        />
        <KpiCard
          icon={<PlayCircle size={18} />}
          label="Aulas assistidas"
          value={String(aulasAssistidas)}
          hint="Marque conforme avança"
        />
        <KpiCard
          icon={<Award size={18} />}
          label="Conquistas"
          value={String(ranking?.conquistas ?? 0)}
          hint="Desbloqueie mais"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={14} className="text-[--primary]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] gold-text">
              Continue de onde parou
            </span>
          </div>
          {proxima ? (
            <>
              <h3 className="font-[family-name:var(--font-playfair)] text-2xl text-[--foreground]">
                {proxima.titulo}
              </h3>
              <p className="mt-1 text-sm text-[--foreground-muted]">
                {proxima.tuba_disciplinas?.nome ?? ""}
              </p>
              <Button asChild className="mt-6">
                <Link href={`/app/aulas/${proxima.id}`} prefetch>
                  <PlayCircle size={16} /> Assistir agora
                </Link>
              </Button>
            </>
          ) : (
            <p className="text-[--foreground-muted] py-8">
              Nenhuma aula publicada ainda. Volte em breve.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-[--foreground] mb-4 flex items-center gap-2">
            <ClipboardCheck size={16} className="text-[--primary]" />
            Últimos simulados
          </h3>
          {ultimas.length > 0 ? (
            <ul className="space-y-3">
              {ultimas.map((t) => {
                const titulo = t.tuba_simulados?.titulo ?? "Simulado";
                const nota = Number(t.nota ?? 0);
                return (
                  <li key={t.id}>
                    <Link
                      href={`/app/simulados/${t.simulado_id}/resultado?t=${t.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-[--surface-2]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[--foreground]">
                          {titulo}
                        </p>
                        <p className="text-xs text-[--foreground-muted]">
                          {new Date(t.finalizado_em).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge variant={nota >= 70 ? "success" : nota >= 50 ? "gold" : "danger"}>
                        {nota.toFixed(1)}
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-[--foreground-muted] py-2">Você ainda não fez nenhum simulado.</p>
          )}
          <Button asChild variant="ghost" size="sm" className="w-full mt-4">
            <Link href="/app/simulados" prefetch>
              Ver todos <ArrowRight size={14} />
            </Link>
          </Button>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h3 className="text-sm font-semibold text-[--foreground] mb-5 flex items-center gap-2">
          <GraduationCap size={16} className="text-[--primary]" />
          Progresso por disciplina
        </h3>
        <div className="space-y-5">
          {progresso.length === 0 ? (
            <p className="text-sm text-[--foreground-muted]">Nenhuma disciplina cadastrada ainda.</p>
          ) : (
            progresso.map((d) => {
              const total = Number(d.total_aulas);
              const assist = Number(d.assistidas);
              const pct = total > 0 ? (assist / total) * 100 : 0;
              return (
                <div key={d.id}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-[--foreground]">{d.nome}</span>
                    <span className="text-xs text-[--foreground-muted]">
                      {assist} / {total} aulas
                    </span>
                  </div>
                  <Progress value={pct} />
                </div>
              );
            })
          )}
        </div>
      </Card>
    </>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-[--foreground-muted]">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[--primary]/15 text-[--primary]">
          {icon}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-3 font-[family-name:var(--font-playfair)] text-3xl text-[--foreground]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[--foreground-muted]">{hint}</p> : null}
    </Card>
  );
}
