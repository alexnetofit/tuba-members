/**
 * Mistral OCR API (state-of-the-art em 2026 para portugues).
 * Doc: https://docs.mistral.ai/capabilities/document/
 *
 * Modelo: mistral-ocr-latest
 *
 * Endpoint: POST https://api.mistral.ai/v1/ocr
 * Body:
 *   {
 *     model: "mistral-ocr-latest",
 *     document: { type: "document_url", document_url: "data:application/pdf;base64,..." }
 *   }
 */

interface MistralPage {
  index: number;
  markdown: string;
}

interface MistralOcrResponse {
  pages: MistralPage[];
  model: string;
}

export async function mistralOcr(buffer: Buffer, fileName = "doc.pdf"): Promise<string | null> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) return null;

  try {
    const base64 = buffer.toString("base64");
    const dataUrl = `data:application/pdf;base64,${base64}`;

    const resp = await fetch("https://api.mistral.ai/v1/ocr", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-ocr-latest",
        document: {
          type: "document_url",
          document_url: dataUrl,
          document_name: fileName,
        },
        include_image_base64: false,
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error("[mistral-ocr] HTTP", resp.status, errBody.slice(0, 500));
      return null;
    }

    const data = (await resp.json()) as MistralOcrResponse;
    const allText = (data.pages ?? [])
      .sort((a, b) => a.index - b.index)
      .map((p) => p.markdown ?? "")
      .join("\n\n");

    return allText.trim() || null;
  } catch (e) {
    console.error("[mistral-ocr] exception:", e);
    return null;
  }
}
