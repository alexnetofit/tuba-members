import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TubaProfile } from "@/lib/supabase/types";

/**
 * Retorna o usuário e profile da request atual.
 * Deduplica automaticamente entre layout, pages e components da mesma request
 * (React `cache()`), eliminando round-trips redundantes ao Supabase.
 *
 * Usa `auth.getClaims()` para validar o JWT LOCALMENTE (zero network)
 * quando possível, com refresh automático quando o token expira.
 */
export const getCurrentUser = cache(
  async (): Promise<{ authId: string; profile: TubaProfile }> => {
    const supabase = await createClient();

    const { data: claimsData } = await supabase.auth.getClaims();
    const authId = claimsData?.claims?.sub;
    if (!authId) redirect("/login");

    const { data: profile } = await supabase
      .from("tuba_profiles")
      .select("id, email, full_name, avatar_url, role, ativo, created_at, updated_at")
      .eq("id", authId)
      .maybeSingle();

    if (!profile) redirect("/login");
    if (!profile.ativo) {
      await supabase.auth.signOut();
      redirect("/login?inativo=1");
    }

    return { authId, profile };
  },
);

/**
 * Garante que a request é de um admin. Mesma garantia de dedup (cache).
 */
export const requireAdmin = cache(async () => {
  const data = await getCurrentUser();
  if (data.profile.role !== "admin") redirect("/app");
  return data;
});

/**
 * Versão leve: só retorna o user id (sem buscar profile).
 * Use quando você só precisa saber se está autenticado.
 */
export const getUserId = cache(async (): Promise<string> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) redirect("/login");
  return id;
});
