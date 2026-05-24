import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractPdfText, pareceVazio } from "@/lib/ocr/pdf";
import { mistralOcr } from "@/lib/ocr/mistral";
import { parseQuestoes } from "@/lib/ocr/parser";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // verifica auth + admin
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("tuba_profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Apenas admin." }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "PDF muito grande (limite 25 MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const trace: string[] = [];

  // 1) pdf-parse
  let texto = await extractPdfText(buffer);
  if (texto && !pareceVazio(texto)) {
    trace.push("pdf-parse extraiu texto (PDF com camada de texto).");
  } else {
    trace.push("pdf-parse retornou vazio. Tentando OCR...");
    texto = null;
  }

  // 2) Mistral OCR (se a key existir e o pdf-parse falhou)
  if (!texto || pareceVazio(texto)) {
    const ocrText = await mistralOcr(buffer, file.name);
    if (ocrText) {
      texto = ocrText;
      trace.push("Mistral OCR extraiu texto via API.");
    } else {
      const haveKey = !!process.env.MISTRAL_API_KEY;
      trace.push(
        haveKey
          ? "Mistral OCR falhou. Verifique sua MISTRAL_API_KEY ou o conteúdo do PDF."
          : "MISTRAL_API_KEY não configurada. Configure-a no .env.local para OCR de PDFs escaneados.",
      );
    }
  }

  if (!texto || pareceVazio(texto)) {
    return NextResponse.json(
      {
        error: "Não foi possível extrair texto do PDF.",
        trace,
      },
      { status: 422 },
    );
  }

  const resultado = parseQuestoes(texto);

  return NextResponse.json({
    ok: true,
    trace,
    texto_amostra: texto.slice(0, 1500),
    ...resultado,
  });
}
