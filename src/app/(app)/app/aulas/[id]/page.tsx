import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Download, FileText } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { YoutubePlayer } from "@/components/aulas/youtube-player";
import { MarcarAssistida } from "@/components/aulas/marcar-assistida";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AulaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await getCurrentUser();
  const supabase = await createClient();

  const { data: aula } = await supabase
    .from("tuba_aulas")
    .select("*, tuba_disciplinas(nome, slug)")
    .eq("id", id)
    .maybeSingle();

  if (!aula) notFound();

  const [{ data: materiais }, { data: assistida }] = await Promise.all([
    supabase
      .from("tuba_aula_materiais")
      .select("*")
      .eq("aula_id", id)
      .order("created_at"),
    supabase
      .from("tuba_aulas_assistidas")
      .select("aula_id")
      .eq("user_id", profile.id)
      .eq("aula_id", id)
      .maybeSingle(),
  ]);

  const disciplina = (aula as { tuba_disciplinas?: { nome?: string } }).tuba_disciplinas;

  return (
    <>
      <Link
        href="/app/aulas"
        className="inline-flex items-center gap-2 mb-6 text-sm text-[--foreground-muted] hover:text-[--primary]"
      >
        <ArrowLeft size={14} /> Todas as aulas
      </Link>

      <YoutubePlayer url={aula.youtube_url} />

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {disciplina?.nome ? (
            <Badge variant="gold">{disciplina.nome}</Badge>
          ) : null}
          <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl text-[--foreground]">
            {aula.titulo}
          </h1>
          {aula.duracao_min ? (
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-[--foreground-muted]">
              <Clock size={14} /> {aula.duracao_min} minutos
            </p>
          ) : null}
        </div>
        <MarcarAssistida aulaId={aula.id} inicialAssistida={!!assistida} />
      </div>

      {aula.descricao ? (
        <Card className="mt-6 p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider gold-text mb-2">
            Sobre a aula
          </h3>
          <p className="whitespace-pre-line text-sm text-[--foreground] leading-relaxed">
            {aula.descricao}
          </p>
        </Card>
      ) : null}

      {materiais && materiais.length > 0 ? (
        <Card className="mt-6 p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider gold-text mb-4 flex items-center gap-2">
            <FileText size={14} /> Materiais
          </h3>
          <ul className="space-y-2">
            {materiais.map((m) => (
              <li key={m.id}>
                <a
                  href={m.url_storage}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border border-[--border] bg-[--surface]/50 px-4 py-3 hover:border-[--primary]/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[--primary]/15 text-[--primary]">
                      <FileText size={16} />
                    </span>
                    <span className="truncate text-sm font-medium text-[--foreground]">
                      {m.nome}
                    </span>
                  </div>
                  <Download size={14} className="text-[--foreground-muted]" />
                </a>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}
