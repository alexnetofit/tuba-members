/**
 * Parser inteligente de questoes de provas brasileiras.
 *
 * Entrada: texto bruto extraido de PDF/OCR.
 * Saida: array de questoes com { numero, enunciado, alternativas: {a,b,c,d,e?}, gabarito_sugerido? }
 *
 * Estrategia:
 *  1. Normaliza texto (quebras de linha, hifens cortados, espacos).
 *  2. Detecta blocos de gabarito ("GABARITO", "RESPOSTAS") e os extrai (mapa numero->letra).
 *  3. Detecta inicio de cada questao por: "QUESTAO N", "QUESTAO N -", "N." no comeco da linha,
 *     "N)" no comeco, "0N -", etc.
 *  4. Para cada questao, separa enunciado das alternativas detectando padroes:
 *     "(A)", "A)", "a)", "A -", "a-" etc.
 *  5. Aplica gabarito sugerido (se houver).
 */

export type Alternativa = "a" | "b" | "c" | "d" | "e";

export interface QuestaoDetectada {
  numero: number;
  enunciado: string;
  alternativas: Partial<Record<Alternativa, string>>;
  gabarito_sugerido?: Alternativa;
}

export interface ParseResult {
  questoes: QuestaoDetectada[];
  warnings: string[];
  total_detectado: number;
}

const LETRA_KEYS: Alternativa[] = ["a", "b", "c", "d", "e"];

/* ---------------- Normalizacao ---------------- */
function normalizar(input: string): string {
  let t = input;
  // remove BOM e caracteres de controle invisiveis (mantendo \n e \t)
  t = t.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "");
  // une palavras quebradas com hifen no fim da linha: "respon-\nsabilidade" -> "responsabilidade"
  t = t.replace(/(\p{L})-\n(\p{L})/gu, "$1$2");
  // une quebras dentro de um paragrafo (mas mantem duplas)
  t = t.replace(/([^\n])\n(?!\n|\s*[A-Ea-e][\)\.\-]\s|\s*\d+[\.\)]\s|\s*QUEST[AÃ]O\b|\s*GABARITO\b|\s*RESPOSTAS\b)/giu, "$1 ");
  // normaliza espacos multiplos
  t = t.replace(/[ \t]+/g, " ");
  // remove paginas/numeros no rodape padrao
  t = t.replace(/^\s*P[áa]gina\s+\d+(\s*\/\s*\d+)?\s*$/gim, "");
  return t.trim();
}

/* ---------------- Gabarito ---------------- */
function extrairGabarito(texto: string): Map<number, Alternativa> {
  const mapa = new Map<number, Alternativa>();
  // tenta encontrar bloco "GABARITO" ou "RESPOSTAS"
  const blocoMatch = texto.match(/(GABARITO|RESPOSTAS|GABARITO\s+OFICIAL)[\s\S]{0,4000}$/i);
  const bloco = blocoMatch ? blocoMatch[0] : texto;

  // padroes comuns: "1-A  2-B  3-C", "01 - A", "1) A", "1 A", "1. A"
  const re = /(?<![\w])(\d{1,3})\s*[-.\)–—]?\s*([a-eA-E])(?![\w])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(bloco)) !== null) {
    const n = parseInt(m[1], 10);
    const l = m[2].toLowerCase() as Alternativa;
    if (n > 0 && n < 1000) {
      // se vier de um bloco gabarito explicito sobrescreve; senao so adiciona se nao existir
      if (blocoMatch || !mapa.has(n)) mapa.set(n, l);
    }
  }
  return mapa;
}

/* ---------------- Detecta inicio de questao ---------------- */
const RE_INICIO_QUESTAO = new RegExp(
  [
    "(?:^|\\n)\\s*(?:QUEST[ÃA]O\\s+)?0*(\\d{1,3})\\s*[\\)\\.\\-–—:]\\s+", // "Questao 1.", "1) ", "01 - "
    "|(?:^|\\n)\\s*\\(0*(\\d{1,3})\\)\\s+", // "(1) "
  ].join(""),
  "gmi",
);

/* ---------------- Detecta alternativas dentro de uma questao ---------------- */
const RE_ALTERNATIVA = new RegExp(
  "(?:^|\\s|\\n)\\(?([a-eA-E])\\)?\\s*[\\)\\.\\-–—:]\\s+",
  "g",
);
// Fallback simples: " a) ", " A) ", " a- ", " A. "
const RE_ALTERNATIVA_LINE = /(?:^|\n)\s*\(?([a-eA-E])\)?\s*[\)\.\-–—:]\s+/g;

interface BlocoQuestao {
  numero: number;
  corpo: string;
}

function fatiarPorQuestao(texto: string): BlocoQuestao[] {
  const blocos: BlocoQuestao[] = [];
  const matches: { start: number; end: number; numero: number }[] = [];

  RE_INICIO_QUESTAO.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RE_INICIO_QUESTAO.exec(texto)) !== null) {
    const numero = parseInt(m[1] ?? m[2], 10);
    if (!Number.isFinite(numero)) continue;
    matches.push({ start: m.index, end: m.index + m[0].length, numero });
  }

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const corpo = texto.slice(cur.end, next ? next.start : texto.length).trim();
    blocos.push({ numero: cur.numero, corpo });
  }

  return blocos;
}

function separarEnunciadoAlternativas(corpo: string): {
  enunciado: string;
  alternativas: Partial<Record<Alternativa, string>>;
} {
  const alternativas: Partial<Record<Alternativa, string>> = {};

  // tenta encontrar primeiro "linha-iniciada" de alternativa, mais confiavel
  const pontosLine: { letra: Alternativa; idx: number; len: number }[] = [];
  RE_ALTERNATIVA_LINE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RE_ALTERNATIVA_LINE.exec(corpo)) !== null) {
    pontosLine.push({ letra: m[1].toLowerCase() as Alternativa, idx: m.index, len: m[0].length });
  }

  let pontos = pontosLine;

  // fallback: se nao encontrou >= 2 alternativas por linha, tenta inline
  if (pontos.length < 2) {
    const pontosInline: typeof pontos = [];
    RE_ALTERNATIVA.lastIndex = 0;
    while ((m = RE_ALTERNATIVA.exec(corpo)) !== null) {
      pontosInline.push({ letra: m[1].toLowerCase() as Alternativa, idx: m.index, len: m[0].length });
    }
    if (pontosInline.length >= 2) pontos = pontosInline;
  }

  // filtrar para sequencia logica a,b,c,d,e (descartar matches espúrios)
  const filtrados: typeof pontos = [];
  let proximaEsperada = 0;
  for (const p of pontos) {
    const idxLetra = LETRA_KEYS.indexOf(p.letra);
    if (idxLetra === -1) continue;
    if (idxLetra === proximaEsperada) {
      filtrados.push(p);
      proximaEsperada++;
      if (proximaEsperada > 4) break;
    } else if (idxLetra > proximaEsperada) {
      // pulou uma letra (ex: detectou a, depois c) - aceita mas avança
      filtrados.push(p);
      proximaEsperada = idxLetra + 1;
    }
  }

  if (filtrados.length === 0) {
    return { enunciado: corpo.trim(), alternativas };
  }

  const enunciado = corpo.slice(0, filtrados[0].idx).trim();
  for (let i = 0; i < filtrados.length; i++) {
    const cur = filtrados[i];
    const next = filtrados[i + 1];
    const texto = corpo.slice(cur.idx + cur.len, next ? next.idx : corpo.length).trim();
    alternativas[cur.letra] = limparTextoAlternativa(texto);
  }

  return { enunciado: limparEnunciado(enunciado), alternativas };
}

function limparTextoAlternativa(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/^\s*[\-–—]\s*/, "")
    .trim();
}

function limparEnunciado(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/* ---------------- API publica ---------------- */
export function parseQuestoes(textoBruto: string): ParseResult {
  const warnings: string[] = [];
  const texto = normalizar(textoBruto);
  if (!texto) {
    return { questoes: [], warnings: ["Texto vazio."], total_detectado: 0 };
  }

  const gabarito = extrairGabarito(texto);

  // remove o bloco do gabarito do final pra nao virar questao
  let textoSemGabarito = texto;
  const blocoMatch = texto.match(/\n\s*(GABARITO|RESPOSTAS|GABARITO\s+OFICIAL)[\s\S]+$/i);
  if (blocoMatch) {
    textoSemGabarito = texto.slice(0, blocoMatch.index ?? texto.length);
  }

  const blocos = fatiarPorQuestao(textoSemGabarito);
  if (blocos.length === 0) {
    warnings.push(
      "Nenhuma questão detectada automaticamente. Verifique se o PDF possui texto numerado (1., 2., Questão 1, etc.) ou se o OCR retornou texto vazio.",
    );
  }

  const questoes: QuestaoDetectada[] = [];
  for (const b of blocos) {
    if (!b.corpo || b.corpo.length < 10) continue;
    const { enunciado, alternativas } = separarEnunciadoAlternativas(b.corpo);
    if (!enunciado) continue;
    const numAlts = Object.keys(alternativas).length;
    if (numAlts < 2) {
      warnings.push(
        `Questão ${b.numero}: só ${numAlts} alternativa(s) detectada(s). Revise manualmente.`,
      );
    }
    questoes.push({
      numero: b.numero,
      enunciado,
      alternativas,
      gabarito_sugerido: gabarito.get(b.numero),
    });
  }

  // remove duplicatas mantendo a com mais conteudo
  const porNumero = new Map<number, QuestaoDetectada>();
  for (const q of questoes) {
    const existing = porNumero.get(q.numero);
    if (!existing || q.enunciado.length > existing.enunciado.length) {
      porNumero.set(q.numero, q);
    }
  }

  const finais = Array.from(porNumero.values()).sort((a, b) => a.numero - b.numero);

  return {
    questoes: finais,
    warnings,
    total_detectado: finais.length,
  };
}
