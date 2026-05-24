"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/get-user";

const BUCKET_CAPAS = "tuba-concursos-capas";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 64);
}

async function uploadCapa(file: File, slug: string): Promise<string | null> {
  const admin = createAdminClient();
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${slug}-${Date.now()}.${ext}`;
  const buf = await file.arrayBuffer();
  const { error } = await admin.storage
    .from(BUCKET_CAPAS)
    .upload(path, new Uint8Array(buf), {
      contentType: file.type || "image/jpeg",
      upsert: true,
      cacheControl: "31536000",
    });
  if (error) {
    console.warn("[concursos] upload capa falhou:", error.message);
    return null;
  }
  const { data } = admin.storage.from(BUCKET_CAPAS).getPublicUrl(path);
  return data.publicUrl;
}

async function removerCapaSeForDoBucket(url: string | null) {
  if (!url) return;
  const marker = `/${BUCKET_CAPAS}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length).split("?")[0];
  if (!path) return;
  const admin = createAdminClient();
  await admin.storage.from(BUCKET_CAPAS).remove([path]);
}

export async function criarConcurso(formData: FormData) {
  const { authId } = await requireAdmin();
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const banca = String(formData.get("banca") ?? "").trim() || null;
  const anoRaw = String(formData.get("ano") ?? "").trim();
  const ano = anoRaw ? Number(anoRaw) : null;
  const cor = String(formData.get("cor") ?? "#0a1d3a").trim() || "#0a1d3a";
  const ordem = Number(formData.get("ordem") ?? 0) || 0;
  const publicado = String(formData.get("publicado") ?? "false") === "true";
  const disciplinaIds = formData.getAll("disciplina_ids").map(String).filter(Boolean);
  const capa = formData.get("capa");

  if (!nome) return { error: "Informe o nome do concurso." };

  const slug = slugify(nome) + "-" + Date.now().toString(36).slice(-4);

  let capa_url: string | null = null;
  if (capa instanceof File && capa.size > 0) {
    capa_url = await uploadCapa(capa, slug);
  }

  const supabase = await createClient();
  const { data: novo, error } = await supabase
    .from("tuba_concursos")
    .insert({
      nome,
      slug,
      descricao,
      banca,
      ano,
      cor,
      ordem,
      publicado,
      capa_url,
      created_by: authId,
    })
    .select("id, slug")
    .single();
  if (error || !novo) return { error: error?.message ?? "Erro ao criar concurso." };

  if (disciplinaIds.length > 0) {
    const rows = disciplinaIds.map((disciplina_id, idx) => ({
      concurso_id: novo.id,
      disciplina_id,
      ordem: idx,
    }));
    await supabase.from("tuba_concurso_disciplinas").insert(rows);
  }

  revalidatePath("/admin/concursos");
  revalidatePath("/app/concursos");
  redirect(`/admin/concursos/${novo.id}`);
}

export async function atualizarConcurso(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID ausente." };

  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const banca = String(formData.get("banca") ?? "").trim() || null;
  const anoRaw = String(formData.get("ano") ?? "").trim();
  const ano = anoRaw ? Number(anoRaw) : null;
  const cor = String(formData.get("cor") ?? "#0a1d3a").trim() || "#0a1d3a";
  const ordem = Number(formData.get("ordem") ?? 0) || 0;
  const publicado = String(formData.get("publicado") ?? "false") === "true";
  const disciplinaIds = formData.getAll("disciplina_ids").map(String).filter(Boolean);
  const capa = formData.get("capa");
  const removerCapa = String(formData.get("remover_capa") ?? "false") === "true";

  if (!nome) return { error: "Informe o nome." };

  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("tuba_concursos")
    .select("slug, capa_url")
    .eq("id", id)
    .maybeSingle();
  if (!atual) return { error: "Concurso não encontrado." };

  let capa_url: string | null | undefined = undefined;
  if (capa instanceof File && capa.size > 0) {
    capa_url = await uploadCapa(capa, atual.slug);
    if (capa_url) await removerCapaSeForDoBucket(atual.capa_url);
  } else if (removerCapa && atual.capa_url) {
    await removerCapaSeForDoBucket(atual.capa_url);
    capa_url = null;
  }

  const update: Record<string, unknown> = {
    nome,
    descricao,
    banca,
    ano,
    cor,
    ordem,
    publicado,
  };
  if (capa_url !== undefined) update.capa_url = capa_url;

  const { error } = await supabase.from("tuba_concursos").update(update).eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("tuba_concurso_disciplinas").delete().eq("concurso_id", id);
  if (disciplinaIds.length > 0) {
    const rows = disciplinaIds.map((disciplina_id, idx) => ({
      concurso_id: id,
      disciplina_id,
      ordem: idx,
    }));
    await supabase.from("tuba_concurso_disciplinas").insert(rows);
  }

  revalidatePath("/admin/concursos");
  revalidatePath(`/admin/concursos/${id}`);
  revalidatePath("/app/concursos");
  return { ok: true };
}

export async function togglePublicarConcurso(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("tuba_concursos")
    .select("publicado")
    .eq("id", id)
    .maybeSingle();
  if (!atual) return { error: "Não encontrado." };
  const { error } = await supabase
    .from("tuba_concursos")
    .update({ publicado: !atual.publicado })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/concursos");
  revalidatePath(`/admin/concursos/${id}`);
  revalidatePath("/app/concursos");
  return { ok: true, publicado: !atual.publicado };
}

export async function excluirConcurso(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("tuba_concursos")
    .select("capa_url")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("tuba_concursos").delete().eq("id", id);
  if (error) return { error: error.message };
  if (atual?.capa_url) await removerCapaSeForDoBucket(atual.capa_url);
  revalidatePath("/admin/concursos");
  revalidatePath("/app/concursos");
  return { ok: true };
}
