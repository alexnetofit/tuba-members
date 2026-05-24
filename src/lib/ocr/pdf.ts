/**
 * Extrai texto de um PDF usando pdf-parse v2 (classe PDFParse via pdfjs-dist).
 * Roda no servidor (Node.js runtime). Retorna `null` em caso de falha ou PDF escaneado.
 */

export async function extractPdfText(buffer: Buffer): Promise<string | null> {
  let parser: { getText: () => Promise<{ text: string }>; destroy: () => Promise<void> } | null =
    null;
  try {
    const mod = await import("pdf-parse");
    const PDFParse = (mod as unknown as { PDFParse: new (opts: { data: Uint8Array }) => typeof parser }).PDFParse;
    parser = new (PDFParse as unknown as new (opts: { data: Uint8Array }) => NonNullable<typeof parser>)({
      data: new Uint8Array(buffer),
    });
    const result = await parser!.getText();
    const text: string = result?.text ?? "";
    return text.trim().length > 0 ? text : null;
  } catch (e) {
    console.warn("[pdf-parse] falha:", e);
    return null;
  } finally {
    try {
      await parser?.destroy();
    } catch {
      /* ignore */
    }
  }
}

/** Heurística: o texto extraído parece "vazio" (pouco útil)? */
export function pareceVazio(text: string | null): boolean {
  if (!text) return true;
  const limpo = text.replace(/\s+/g, " ").trim();
  return limpo.length < 80;
}
