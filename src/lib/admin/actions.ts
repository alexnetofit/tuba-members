"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/get-user";

/* ============================================================
 * ALUNOS
 * ============================================================ */
export async function criarAluno(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const full_name = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "aluno") === "admin" ? "admin" : "aluno";
  const senha = String(formData.get("senha") ?? "").trim();

  if (!email || !full_name) return { error: "Preencha nome e email." };
  if (senha.length < 8) return { error: "Senha precisa ter pelo menos 8 caracteres." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { full_name, role },
  });
  if (error) return { error: error.message };

  // upsert role (caso o trigger nao tenha pegado)
  if (data.user) {
    await admin
      .from("tuba_profiles")
      .upsert({ id: data.user.id, email, full_name, role, ativo: true });
  }

  revalidatePath("/admin/alunos");
  return { success: `Aluno criado. Senha temporária: ${senha}` };
}

export async function toggleAlunoAtivo(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const ativo = String(formData.get("ativo")) === "true";
  const admin = createAdminClient();
  await admin.from("tuba_profiles").update({ ativo }).eq("id", id);
  revalidatePath("/admin/alunos");
}

export async function excluirAluno(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: error.message };
  revalidatePath("/admin/alunos");
}

/* ============================================================
 * DISCIPLINAS
 * ============================================================ */
function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function salvarDisciplina(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const cor = String(formData.get("cor") ?? "#d4a44a");
  const icone = String(formData.get("icone") ?? "BookOpen");
  const ordem = Number(formData.get("ordem") ?? 0);
  if (!nome) return { error: "Informe o nome." };

  const supabase = await createClient();
  const slug = slugify(nome);
  if (id) {
    await supabase.from("tuba_disciplinas").update({ nome, cor, icone, ordem, slug }).eq("id", id);
  } else {
    await supabase.from("tuba_disciplinas").insert({ nome, cor, icone, ordem, slug, ativa: true });
  }
  revalidatePath("/admin/disciplinas");
  return { success: "Salvo." };
}

export async function excluirDisciplina(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("tuba_disciplinas").delete().eq("id", id);
  revalidatePath("/admin/disciplinas");
}

/* ============================================================
 * AULAS
 * ============================================================ */
export async function salvarAula(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const disciplina_id = String(formData.get("disciplina_id") ?? "");
  const youtube_url = String(formData.get("youtube_url") ?? "").trim();
  const duracao_min = Number(formData.get("duracao_min") ?? 0) || null;
  const ordem = Number(formData.get("ordem") ?? 0);
  const publicada = formData.get("publicada") === "on";

  if (!titulo || !disciplina_id || !youtube_url) return { error: "Preencha título, disciplina e URL do YouTube." };

  const supabase = await createClient();
  if (id) {
    await supabase
      .from("tuba_aulas")
      .update({ titulo, descricao, disciplina_id, youtube_url, duracao_min, ordem, publicada })
      .eq("id", id);
  } else {
    await supabase
      .from("tuba_aulas")
      .insert({ titulo, descricao, disciplina_id, youtube_url, duracao_min, ordem, publicada });
  }
  revalidatePath("/admin/aulas");
  return { success: "Aula salva." };
}

export async function excluirAula(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("tuba_aulas").delete().eq("id", id);
  revalidatePath("/admin/aulas");
}

export async function adicionarMaterial(formData: FormData) {
  await requireAdmin();
  const aula_id = String(formData.get("aula_id"));
  const nome = String(formData.get("nome") ?? "");
  const url_storage = String(formData.get("url_storage") ?? "");
  const tamanho = Number(formData.get("tamanho_bytes") ?? 0);
  if (!aula_id || !url_storage) return { error: "Faltam dados do material." };
  const supabase = await createClient();
  await supabase.from("tuba_aula_materiais").insert({
    aula_id,
    nome,
    url_storage,
    tamanho_bytes: tamanho || null,
  });
  revalidatePath(`/admin/aulas/${aula_id}`);
  return { success: "Material adicionado." };
}

export async function excluirMaterial(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const aula_id = String(formData.get("aula_id"));
  const supabase = await createClient();
  await supabase.from("tuba_aula_materiais").delete().eq("id", id);
  revalidatePath(`/admin/aulas/${aula_id}`);
}

/* ============================================================
 * SIMULADOS
 * ============================================================ */
export async function publicarSimulado(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const publicado = formData.get("publicado") === "true";
  const supabase = await createClient();
  await supabase.from("tuba_simulados").update({ publicado }).eq("id", id);
  revalidatePath("/admin/simulados");
}

export async function excluirSimulado(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("tuba_simulados").delete().eq("id", id);
  revalidatePath("/admin/simulados");
}
