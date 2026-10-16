// Leitura de documentos de briefing (Google Docs por link ou arquivo .docx) e extração das demandas.
// Formato esperado de cada demanda:
//   DEMANDA 105  |  LV25  ·  Jogos Ao Vivo  ·  Elite Roulette
//   1 código/oferta · 2 versões de comunicação · 6 arquivos nos 3 formatos.
//   VARIAÇÃO 1 (COPY BASE) — Reativados · Oferta
//   SUBTÍTULO: ...
//   PRINCIPAL: ...
//   NOME DO ARQUIVO: ...

export interface ParsedDemanda {
  /** Número da demanda no documento (ex.: 105) */
  number: number;
  /** Código da oferta (ex.: LV25) */
  code: string;
  category: string;
  game: string;
  /** Grupo de arte visual a que pertence (ex.: "Elite Roulette"), quando o documento informa */
  visualArt?: string;
  /** Título exatamente como no documento: "DEMANDA 105  |  LV25  ·  Jogos Ao Vivo  ·  Elite Roulette" */
  title: string;
  /** Descrição: resumo + variações, uma linha por item */
  description: string;
  /** Quantidade de variações de comunicação */
  variations: number;
}

export interface ParsedBriefing {
  house?: string;
  campaign?: string;
  demandas: ParsedDemanda[];
}

const DEMANDA_LINE = /^DEMANDA\s+(\d+)\s*\|\s*(.+)$/;
// Só estas linhas pertencem à descrição; cabeçalhos de seção entre demandas (SLOTS, ARTE VISUAL..., rodapé) ficam de fora
const DESCRIPTION_LINE = /^(\d+\s+código|VARIAÇÃO\s+\d+|SUBTÍTULO\s*:|PRINCIPAL\s*:|NOME DO ARQUIVO\s*:)/i;
const VISUAL_ART_LINE = /^ARTE VISUAL\s+\d+\s*\|\s*(.+)$/i;

/** Resumo no topo e cada variação em seu próprio bloco, separados por duas linhas em branco. */
const buildDescription = (body: string[]): string => {
  const blocks: string[][] = [[]];
  for (const line of body) {
    if (/^VARIAÇÃO\s+\d+/i.test(line)) blocks.push([]);
    blocks[blocks.length - 1].push(line);
  }
  return blocks
    .filter((b) => b.length > 0)
    .map((b) => b.join('\n'))
    .join('\n\n\n');
};

export const normalizeDocText = (raw: string): string =>
  raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n').replace(/ /g, ' ');

export const parseBriefing = (rawText: string): ParsedBriefing => {
  const lines = normalizeDocText(rawText).split('\n').map((l) => l.trim());
  const result: ParsedBriefing = { demandas: [] };

  let visualArt: string | undefined;
  let current: (ParsedDemanda & { lines: string[] }) | null = null;

  const flush = () => {
    if (!current) return;
    const { lines: body, ...rest } = current;
    result.demandas.push({ ...rest, description: buildDescription(body), variations: body.filter((l) => /^VARIAÇÃO\s+\d+/i.test(l)).length });
    current = null;
  };

  for (const line of lines) {
    if (!line) continue;

    const house = line.match(/^CASA\s*:\s*(.+)$/i);
    if (house && !result.house) result.house = house[1].trim();
    const campaign = line.match(/^CAMPANHA\s*:\s*(.+)$/i);
    if (campaign && !result.campaign) result.campaign = campaign[1].trim();

    const art = line.match(VISUAL_ART_LINE);
    if (art) {
      flush();
      visualArt = art[1].trim();
      continue;
    }

    const header = line.match(DEMANDA_LINE);
    if (header) {
      flush();
      // "LV25  ·  Jogos Ao Vivo  ·  Elite Roulette"
      const [code = '', category = '', game = ''] = header[2].split('·').map((p) => p.trim());
      current = {
        number: Number(header[1]),
        code,
        category,
        game,
        visualArt,
        title: line,
        description: '',
        variations: 0,
        lines: [],
      };
      continue;
    }

    if (current && DESCRIPTION_LINE.test(line)) current.lines.push(line);
    // qualquer outra linha (título de categoria, "Códigos: ...", rodapé) encerra a demanda atual
    else if (current && !DESCRIPTION_LINE.test(line)) flush();
  }
  flush();

  return result;
};

/** Extrai o texto de um .docx (zip com word/document.xml), um parágrafo por linha. */
export const extractTextFromDocx = async (buffer: ArrayBuffer): Promise<string> => {
  const { unzipSync, strFromU8 } = await import('fflate');
  const files = unzipSync(new Uint8Array(buffer), { filter: (f) => f.name === 'word/document.xml' });
  const xml = files['word/document.xml'];
  if (!xml) throw new Error('Arquivo inválido: não parece um documento Word (.docx).');

  const decode = (s: string) =>
    s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

  return strFromU8(xml)
    .split('</w:p>')
    .map((p) =>
      decode(
        p
          .replace(/<w:tab\s*\/>/g, '\t')
          .replace(/<w:br\s*\/>/g, '\n')
          .replace(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g, '$1\u0001')
          .replace(/<[^>]+>/g, '')
          .replace(/\u0001/g, '')
      )
    )
    .join('\n');
};

export const GOOGLE_DOC_ID = /docs\.google\.com\/document\/d\/([\w-]+)/;

/** Baixa o texto de um Google Docs compartilhado ("qualquer pessoa com o link"). */
export const fetchGoogleDocText = async (url: string): Promise<string> => {
  const id = url.match(GOOGLE_DOC_ID)?.[1];
  if (!id) throw new Error('Link inválido. Cole o endereço de um documento do Google Docs (docs.google.com/document/d/...).');

  let response: Response;
  try {
    response = await fetch(`https://docs.google.com/document/d/${id}/export?format=txt`);
  } catch {
    throw new Error('Não foi possível acessar o documento. Verifique se ele está compartilhado como "qualquer pessoa com o link".');
  }
  const type = response.headers.get('content-type') || '';
  if (!response.ok || type.includes('text/html')) {
    throw new Error('O documento não está acessível. Compartilhe como "qualquer pessoa com o link" (leitor) e tente de novo.');
  }
  return response.text();
};
