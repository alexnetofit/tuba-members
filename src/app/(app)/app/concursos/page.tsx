import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Medal, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { TubaVitrineConcursoRow } from "@/lib/supabase/types";

export const metadata = { title: "Concursos — Curso Tubarão" };

export default async function ConcursosVitrine() {
  const { profile } = await getCurrentUser();
  const supabase = await createClient();

  const { data } = await supabase.rpc("tuba_vitrine_concursos", { p_user_id: profile.id });
  const concursos = (data ?? []) as TubaVitrineConcursoRow[];

  const destaque = concursos[0];
  const resto = concursos.slice(1);

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-10 -mt-8 lg:-mt-12 pb-8">
      {destaque ? <Hero c={destaque} /> : null}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 mt-12">
        {!concursos.length ? (
          <EmptyState
            icon={<Medal size={24} />}
            title="Nenhum concurso disponível ainda"
            description="O coordenador vai liberar concursos em breve. Fique de olho."
          />
        ) : (
          <Carrossel titulo="Catálogo Tubarão" subtitulo="Escolha pra qual concurso você vai estudar" concursos={resto.length ? resto : concursos} />
        )}
      </div>
    </div>
  );
}

function Hero({ c }: { c: TubaVitrineConcursoRow }) {
  return (
    <section className="relative min-h-[58vh] sm:min-h-[64vh] flex items-end overflow-hidden">
      {c.capa_url ? (
        <>
          <Image
            src={c.capa_url}
            alt={c.nome}
            fill
            sizes="100vw"
            priority
            unoptimized
            className="object-cover object-top scale-105 blur-[2px] opacity-80"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(7,16,32,1) 0%, rgba(7,16,32,0.85) 35%, rgba(7,16,32,0.4) 70%, rgba(7,16,32,0.1) 100%)",
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${c.cor} 0%, #07101e 100%)`,
          }}
        />
      )}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 pb-12 pt-32">
        <div className="grid items-end gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="relative aspect-[2/3] w-44 sm:w-52 lg:w-full overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] mx-auto lg:mx-0">
            {c.capa_url ? (
              <Image
                src={c.capa_url}
                alt={c.nome}
                fill
                sizes="260px"
                priority
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[--surface] text-[--foreground-muted]">
                <Medal size={48} />
              </div>
            )}
          </div>

          <div className="text-center lg:text-left">
            <Badge variant="gold" className="mb-3">
              <Sparkles size={12} /> Em destaque
            </Badge>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-5xl text-white leading-tight">
              {c.nome}
            </h1>
            {(c.banca || c.ano) && (
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.25em] text-white/70">
                {c.banca}
                {c.banca && c.ano ? " · " : ""}
                {c.ano}
              </p>
            )}
            {c.descricao ? (
              <p className="mt-4 text-base sm:text-lg text-white/85 max-w-2xl">
                {c.descricao}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-white/80">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
                {Number(c.total_disciplinas)} disciplinas
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
                {Number(c.total_aulas)} aulas
              </span>
            </div>

            <div className="mt-7 flex items-center justify-center lg:justify-start gap-3">
              <Link
                href={`/app/concursos/${c.slug}`}
                prefetch
                className="inline-flex items-center gap-2 rounded-lg gold-gradient px-6 py-3 text-sm font-bold text-[--primary-foreground] shadow-lg hover:opacity-90 transition-opacity"
              >
                Acessar concurso <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Carrossel({
  titulo,
  subtitulo,
  concursos,
}: {
  titulo: string;
  subtitulo?: string;
  concursos: TubaVitrineConcursoRow[];
}) {
  return (
    <section>
      <header className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-[--foreground]">
            {titulo}
          </h2>
          {subtitulo ? (
            <p className="text-sm text-[--foreground-muted]">{subtitulo}</p>
          ) : null}
        </div>
      </header>

      <div
        className="-mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 overflow-x-auto pb-4"
        style={{ scrollSnapType: "x mandatory" }}
      >
        <div className="flex gap-4 sm:gap-5">
          {concursos.map((c) => (
            <CardConcurso key={c.id} c={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CardConcurso({ c }: { c: TubaVitrineConcursoRow }) {
  return (
    <Link
      href={`/app/concursos/${c.slug}`}
      prefetch
      className="group block shrink-0 w-[150px] sm:w-[180px] lg:w-[200px]"
      style={{ scrollSnapAlign: "start" }}
    >
      <Card className="overflow-hidden p-0 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_45px_-15px_rgba(212,164,74,0.45)]">
        <div className="relative aspect-[2/3] bg-[--surface-2]/40">
          {c.capa_url ? (
            <Image
              src={c.capa_url}
              alt={c.nome}
              fill
              sizes="200px"
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
              <Medal size={42} className="text-white/80" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <h3 className="text-sm font-bold text-white truncate">{c.nome}</h3>
            <p className="text-[10px] uppercase tracking-wider text-white/70 truncate">
              {c.banca ? c.banca : "Concurso"}
              {c.banca && c.ano ? " · " : ""}
              {c.ano ? c.ano : ""}
            </p>
          </div>
        </div>
        <div className="p-3 text-xs text-[--foreground-muted]">
          <span>
            {Number(c.total_disciplinas)} disc · {Number(c.total_aulas)} aulas
          </span>
        </div>
      </Card>
    </Link>
  );
}
