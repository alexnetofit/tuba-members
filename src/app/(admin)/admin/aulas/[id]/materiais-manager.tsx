"use client";

import { useState, useTransition, useRef } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { TubaAulaMaterial } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { adicionarMaterial, excluirMaterial } from "@/lib/admin/actions";

export function MateriaisManager({
  aulaId,
  materiais,
}: {
  aulaId: string;
  materiais: TubaAulaMaterial[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) {
      toast.error("Arquivo muito grande (limite 30 MB).");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const path = `aulas/${aulaId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("tuba-materiais").upload(path, file);
      if (upErr) throw upErr;
      const { data: url } = supabase.storage.from("tuba-materiais").getPublicUrl(path);

      const fd = new FormData();
      fd.set("aula_id", aulaId);
      fd.set("nome", file.name);
      fd.set("url_storage", url.publicUrl);
      fd.set("tamanho_bytes", String(file.size));
      const res = await adicionarMaterial(fd);
      if (res?.error) throw new Error(res.error);
      toast.success("Material adicionado.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao subir o arquivo.";
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onDelete(id: string) {
    if (!confirm("Remover este material?")) return;
    const fd = new FormData();
    fd.set("id", id);
    fd.set("aula_id", aulaId);
    startTransition(async () => {
      await excluirMaterial(fd);
      toast.success("Removido");
    });
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf,application/zip,image/*,.docx,.pptx"
        onChange={onUpload}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => fileRef.current?.click()}
        loading={uploading}
      >
        <Upload size={16} /> Enviar material
      </Button>

      {materiais.length === 0 ? (
        <p className="text-xs text-[--foreground-muted] text-center py-4">
          Nenhum material ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {materiais.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-[--border] bg-[--surface]/40 px-3 py-2"
            >
              <a
                href={m.url_storage}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 min-w-0 text-sm text-[--foreground] hover:text-[--primary]"
              >
                <FileText size={14} className="shrink-0 text-[--primary]" />
                <span className="truncate">{m.nome}</span>
              </a>
              <button
                onClick={() => onDelete(m.id)}
                disabled={pending}
                className="text-[--foreground-muted] hover:text-red-400"
                title="Remover"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
