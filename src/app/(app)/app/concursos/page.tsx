import Link from "next/link";
import Image from "next/image";
import { Medal } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import type { TubaVitrineConcursoRow } from "@/lib/supabase/types";

export const metadata = { title: "Concursos — Curso Tubarão" };

export default async function ConcursosVitrine() {
  const { profile } = await getCurrentUser();
  const supabase = await createClient();

  const { data } = await supabase.rpc("tuba_vitrine_concursos", { p_user_id: profile.id });
  const concursos = (data ?? []) as TubaVitrineConcursoRow[];

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Concursos disponíveis"
        subtitle="Escolha pra qual concurso você vai estudar. Cada um já vem com as disciplinas certas."
      />

      {!concursos.length ? (
        <EmptyState
          icon={<Medal size={24} />}
          title="Nenhum concurso disponível ainda"
          description="O coordenador vai liberar concursos em breve. Fique de olho."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {concursos.map((c) => (
            <CardConcurso key={c.id} c={c} />
          ))}
        </div>
      )}
    </>
  );
}

function CardConcurso({ c }: { c: TubaVitrineConcursoRow }) {
  return (
    <Link href={`/app/concursos/${c.slug}`} prefetch className="group block">
      <Card className="overflow-hidden p-0 h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_45px_-15px_rgba(212,164,74,0.45)]">
        <div className="relative aspect-[2/3] bg-[--surface-2]/40">
          {c.capa_url ? (
            <Image
              src={c.capa_url}
              alt={c.nome}
              fill
              sizes="(min-width:1280px) 240px, (min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${c.cor} 0%, #07101e 100%)`,
              }}
            >
              <Medal size={48} className="text-white/80" />
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col gap-1">
          <p className="font-[family-name:var(--font-playfair)] text-lg text-[--foreground] truncate">
            {c.nome}
          </p>
          <p className="text-xs text-[--foreground-muted] truncate">
            {c.banca ? `${c.banca}` : ""}
            {c.banca && c.ano ? " · " : ""}
            {c.ano ? c.ano : ""}
          </p>
          <p className="text-xs text-[--foreground-muted] mt-1">
            {Number(c.total_disciplinas)} disciplina
            {Number(c.total_disciplinas) === 1 ? "" : "s"} · {Number(c.total_aulas)} aula
            {Number(c.total_aulas) === 1 ? "" : "s"}
          </p>
        </div>
      </Card>
    </Link>
  );
}
