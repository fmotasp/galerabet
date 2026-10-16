import { describe, it, expect } from 'vitest';
import { parseBriefing } from './briefingDoc';

const SAMPLE = `PLANO DE CRIATIVOS CRM
CASA: Bet Caixa
CAMPANHA: Life Cycle · Fase 3 — Reativação & Reativados
RESUMO GERAL
Categoria
ESPORTES
ARTE VISUAL 01  |  Esportes
Composição visual reaproveitável · 2 códigos · 3 versões de comunicação.
Códigos: ES01, ES02
DEMANDA 001  |  ES01  ·  Esportes  ·  Esportes
1 código/oferta · 2 versões de comunicação · 6 arquivos nos 3 formatos.
VARIAÇÃO 1 (COPY BASE) — Reativação · Oferta
SUBTÍTULO: Uma oferta especial para você!
PRINCIPAL: Aposte R$20 em Esportes
NOME DO ARQUIVO: Formato_ES01_Reativacao_Oferta_BetCaixa
VARIAÇÃO 2 — Reativação · Reminder
SUBTÍTULO: Sua oferta ainda está disponível!
PRINCIPAL: Aposte R$20 em Esportes
NOME DO ARQUIVO: Formato_ES01_Reativacao_Reminder_BetCaixa
DEMANDA 002  |  ES02  ·  Esportes  ·  Esportes
1 código/oferta · 1 versões de comunicação · 3 arquivos nos 3 formatos.
VARIAÇÃO 1 (COPY BASE) — Reativação · Oferta
SUBTÍTULO: Olá
PRINCIPAL: Aposte
NOME DO ARQUIVO: Formato_ES02_Reativacao_Oferta_BetCaixa
SLOTS
ARTE VISUAL 02  |  Classic Coins
Composição visual reaproveitável · 1 códigos · 2 versões de comunicação.
Códigos: CS01
DEMANDA 003  |  CS01  ·  Slots  ·  Classic Coins
1 código/oferta · 1 versões de comunicação · 3 arquivos nos 3 formatos.
VARIAÇÃO 1 (COPY BASE) — Reativação · Oferta
SUBTÍTULO: Oi
PRINCIPAL: Gire
NOME DO ARQUIVO: Formato_CS01_Reativacao_Oferta_BetCaixa
Bet Caixa  ·  Plano de Criativos CRM  ·  Reativação & Reativados`;

describe('parseBriefing', () => {
  const r = parseBriefing(SAMPLE);

  it('lê casa e campanha do cabeçalho', () => {
    expect(r.house).toBe('Bet Caixa');
    expect(r.campaign).toContain('Life Cycle');
  });
  it('encontra todas as demandas', () => {
    expect(r.demandas.map((d) => d.number)).toEqual([1, 2, 3]);
  });
  it('mantém o título como no documento e separa código, categoria e jogo', () => {
    expect(r.demandas[0].title).toBe('DEMANDA 001  |  ES01  ·  Esportes  ·  Esportes');
    expect(r.demandas[2]).toMatchObject({ code: 'CS01', category: 'Slots', game: 'Classic Coins', visualArt: 'Classic Coins' });
  });
  it('conta as variações', () => {
    expect(r.demandas[0].variations).toBe(2);
    expect(r.demandas[1].variations).toBe(1);
  });
  it('descrição só tem resumo e variações (sem cabeçalhos de seção nem rodapé)', () => {
    const d = r.demandas[1].description;
    expect(d).toContain('VARIAÇÃO 1 (COPY BASE)');
    expect(d).toContain('NOME DO ARQUIVO: Formato_ES02_Reativacao_Oferta_BetCaixa');
    expect(d).not.toMatch(/SLOTS|ARTE VISUAL|Códigos:|Plano de Criativos/);
  });
  it('separa o resumo e cada variação com duas linhas em branco', () => {
    expect(r.demandas[0].description).toBe(
      [
        '1 código/oferta · 2 versões de comunicação · 6 arquivos nos 3 formatos.',
        '',
        '',
        'VARIAÇÃO 1 (COPY BASE) — Reativação · Oferta',
        'SUBTÍTULO: Uma oferta especial para você!',
        'PRINCIPAL: Aposte R$20 em Esportes',
        'NOME DO ARQUIVO: Formato_ES01_Reativacao_Oferta_BetCaixa',
        '',
        '',
        'VARIAÇÃO 2 — Reativação · Reminder',
        'SUBTÍTULO: Sua oferta ainda está disponível!',
        'PRINCIPAL: Aposte R$20 em Esportes',
        'NOME DO ARQUIVO: Formato_ES01_Reativacao_Reminder_BetCaixa',
      ].join('\n')
    );
  });
  it('aceita CRLF e BOM do Google Docs', () => {
    const crlf = '﻿' + SAMPLE.replace(/\n/g, '\r\n');
    expect(parseBriefing(crlf).demandas).toHaveLength(3);
  });
});
