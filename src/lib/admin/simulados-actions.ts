"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/get-user";
import type { Alternativa } from "@/lib/supabase/types";

interface QuestaoInput {
  numero: number;
  enunciado: string;
  alt_a: string;
  alt_b: string;
  alt_c: string;
  alt_d: string;
  alt_e?: string;
  gabarito: Alternativa;
}

export async function criarSimuladoComQuestoes(formData: FormData) {
  const { authId } = await requireAdmin();

  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const disciplina_id = String(formData.get("disciplina_id") ?? "") || null;
  const duracao_minutos = Number(formData.get("duracao_minutos") ?? 60) || 60;
  const json = String(formData.get("questoes_json") ?? "[]");
  const pdf = formData.get("pdf_file");

  if (!titulo) return { error: "Informe o título." };

  let questoes: QuestaoInput[];
  try {
    questoes = JSON.parse(json);
  } catch {
    return { error: "Questões inválidas." };
  }
  if (!Array.isArray(questoes) || questoes.length === 0) {
    return { error: "Nenhuma questão para salvar." };
  }
  for (const q of questoes) {
    if (
      !q.enunciado?.trim() ||
      !q.alt_a?.trim() ||
      !q.alt_b?.trim() ||
      !q.alt_c?.trim() ||
      !q.alt_d?.trim() ||
      !["a", "b", "c", "d", "e"].includes(q.gabarito)
    ) {
      return { error: `Questão ${q.numero}: dados incompletos.` };
    }
  }

  const admin = createAdminClient();

  // 1) upload PDF (se enviado)
  let pdf_original_url: string | null = null;
  if (pdf instanceof File && pdf.size > 0) {
    try {
      const path = `simulados/${Date.now()}-${pdf.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const arr = await pdf.arrayBuffer();
      const { error: upErr } = await admin.storage
        .from("tuba-simulados-pdf")
        .upload(path, new Uint8Array(arr), {
          contentType: "application/pdf",
          upsert: false,
        });
      if (!upErr) {
        // gera signed URL longa (1 ano) para referencia interna
        const { data: signed } = await admin.storage
          .from("tuba-simulados-pdf")
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        pdf_original_url = signed?.signedUrl ?? null;
      }
    } catch (e) {
      console.warn("[simulados] upload PDF falhou", e);
    }
  }

  // 2) cria simulado
  const supabase = await createClient();
  const { data: sim, error: simErr } = await supabase
    .from("tuba_simulados")
    .insert({
      titulo,
      descricao,
      disciplina_id: disciplina_id || null,
      duracao_minutos,
      pdf_original_url,
      publicado: true,
      created_by: authId,
    })
    .select()
    .single();

  if (simErr || !sim) {
    return { error: simErr?.message ?? "Erro ao criar simulado" };
  }

  // 3) insere questoes
  const rows = questoes.map((q) => ({
    simulado_id: sim.id,
    numero: q.numero,
    enunciado: q.enunciado.trim(),
    alt_a: q.alt_a.trim(),
    alt_b: q.alt_b.trim(),
    alt_c: q.alt_c.trim(),
    alt_d: q.alt_d.trim(),
    alt_e: q.alt_e?.trim() || null,
    gabarito: q.gabarito,
  }));

  const { error: qErr } = await supabase.from("tuba_questoes").insert(rows);
  if (qErr) {
    // rollback do simulado
    await supabase.from("tuba_simulados").delete().eq("id", sim.id);
    return { error: qErr.message };
  }

  revalidatePath("/admin/simulados");
  revalidatePath("/app/simulados");
  return { success: "Simulado criado", id: sim.id };
}

/* ============ Admin: gerenciar simulado existente ============ */

export async function togglePublicarSimulado(simuladoId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("tuba_simulados")
    .select("publicado")
    .eq("id", simuladoId)
    .maybeSingle();
  if (!atual) return { error: "Simulado não encontrado." };
  const { error } = await supabase
    .from("tuba_simulados")
    .update({ publicado: !atual.publicado })
    .eq("id", simuladoId);
  if (error) return { error: error.message };
  revalidatePath("/admin/simulados");
  revalidatePath(`/admin/simulados/${simuladoId}`);
  revalidatePath("/app/simulados");
  return { ok: true, publicado: !atual.publicado };
}

export async function excluirSimulado(simuladoId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("tuba_simulados").delete().eq("id", simuladoId);
  if (error) return { error: error.message };
  revalidatePath("/admin/simulados");
  revalidatePath("/app/simulados");
  return { ok: true };
}

export async function atualizarSimuladoMeta(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const disciplina_id = String(formData.get("disciplina_id") ?? "") || null;
  const duracao_minutos = Number(formData.get("duracao_minutos") ?? 60) || 60;
  if (!id || !titulo) return { error: "Dados inválidos." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("tuba_simulados")
    .update({ titulo, descricao, disciplina_id, duracao_minutos })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/admin/simulados/${id}`);
  revalidatePath("/admin/simulados");
  return { ok: true };
}

/* ============ Tela do aluno: iniciar, submeter ============ */

export async function iniciarTentativa(simuladoId: string) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Não autenticado" };

  // já existe tentativa em andamento?
  const { data: existente } = await supabase
    .from("tuba_tentativas")
    .select("id")
    .eq("user_id", auth.user.id)
    .eq("simulado_id", simuladoId)
    .is("finalizado_em", null)
    .maybeSingle();

  if (existente) return { id: existente.id };

  const { data, error } = await supabase
    .from("tuba_tentativas")
    .insert({
      user_id: auth.user.id,
      simulado_id: simuladoId,
      iniciado_em: new Date().toISOString(),
    })
    .select()
    .single();
  if (error || !data) return { error: error?.message ?? "Erro" };
  return { id: data.id };
}

export async function submeterTentativa(formData: FormData) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Não autenticado" };

  const tentativa_id = String(formData.get("tentativa_id"));
  const tempo_segundos = Number(formData.get("tempo_segundos") ?? 0);
  const respostas_json = String(formData.get("respostas_json") ?? "{}");

  let respostas: Record<string, Alternativa | null>;
  try {
    respostas = JSON.parse(respostas_json);
  } catch {
    return { error: "Respostas inválidas." };
  }

  // valida que a tentativa pertence ao usuario
  const { data: tent } = await supabase
    .from("tuba_tentativas")
    .select("id, user_id, simulado_id, finalizado_em")
    .eq("id", tentativa_id)
    .maybeSingle();
  if (!tent || tent.user_id !== auth.user.id) return { error: "Tentativa inválida." };
  if (tent.finalizado_em) return { error: "Tentativa já finalizada." };

  // busca questoes do simulado
  const { data: questoes } = await supabase
    .from("tuba_questoes")
    .select("id, gabarito")
    .eq("simulado_id", tent.simulado_id);

  if (!questoes || questoes.length === 0) return { error: "Simulado sem questões." };

  let acertos = 0;
  const rows = questoes.map((q) => {
    const marcada = respostas[q.id] ?? null;
    const correta = marcada === q.gabarito;
    if (correta) acertos++;
    return {
      tentativa_id,
      questao_id: q.id,
      alternativa_marcada: marcada,
      correta,
    };
  });

  // upsert respostas (admin client p/ bypass RLS se needed)
  const { error: respErr } = await admin
    .from("tuba_respostas")
    .upsert(rows, { onConflict: "tentativa_id,questao_id" });
  if (respErr) return { error: respErr.message };

  const nota = (acertos / questoes.length) * 100;

  await admin
    .from("tuba_tentativas")
    .update({
      finalizado_em: new Date().toISOString(),
      tempo_segundos,
      acertos,
      total_questoes: questoes.length,
      nota: Number(nota.toFixed(2)),
    })
    .eq("id", tentativa_id);

  revalidatePath("/app/simulados");
  revalidatePath("/app/ranking");
  revalidatePath("/app");
  return { ok: true, tentativa_id, nota, simulado_id: tent.simulado_id };
}
