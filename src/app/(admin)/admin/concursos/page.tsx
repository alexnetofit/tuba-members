import Link from "next/link";
import Image from "next/image";
import { ImageOff, Plus, Trophy } from "lucide-react";
import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Concursos — Admin" };

export default async function ConcursosAdminPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: concursos } = await supabase
    .from("tuba_concursos")
    .select("*, tuba_concurso_disciplinas(disciplina_id)")
    .order("ordem")
    .order("nome");

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Concursos"
        subtitle="Cada concurso reúne as disciplinas que o aluno vai estudar pra aquela prova."
        action={
          <Button asChild>
            <Link href="/admin/concursos/novo" prefetch>
              <Plus size={16} /> Novo concurso
            </Link>
          </Button>
        }
      />

      {!concursos?.length ? (
        <EmptyState
          icon={<Trophy size={24} />}
          title="Nenhum concurso ainda"
          description="Cadastre o primeiro concurso: vincule disciplinas, suba uma capa e publique pra aparecer na vitrine dos alunos."
          action={
            <Button asChild>
              <Link href="/admin/concursos/novo">
                <Plus size={16} /> Criar primeiro concurso
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {concursos.map((c) => {
            const qtdDisc =
              (c as { tuba_concurso_disciplinas?: { disciplina_id: string }[] })
                .tuba_concurso_disciplinas?.length ?? 0;
            return (
              <Link key={c.id} href={`/admin/concursos/${c.id}`} className="group">
                <Card className="overflow-hidden flex flex-col h-full transition-transform group-hover:-translate-y-1">
                  <div className="relative aspect-[2/3] bg-[--surface-2]/60">
                    {c.capa_url ? (
                      <Image
                        src={c.capa_url}
                        alt={c.nome}
                        fill
                        sizes="(min-width:1280px) 240px, (min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[--foreground-muted]">
                        <ImageOff size={32} />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={c.publicado ? "success" : "muted"}>
                        {c.publicado ? "Publicado" : "Rascunho"}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-1">
                    <p className="font-[family-name:var(--font-playfair)] text-lg text-[--foreground] truncate">
                      {c.nome}
                    </p>
                    <p className="text-xs text-[--foreground-muted] mt-auto pt-2">
                      {qtdDisc} disciplina{qtdDisc === 1 ? "" : "s"}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
