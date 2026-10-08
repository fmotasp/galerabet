// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from './sanitizeHtml';

describe('sanitizeHtml', () => {
  it('remove <script> e seu conteúdo', () => {
    expect(sanitizeHtml('oi<script>alert(1)</script>')).toBe('oi');
  });
  it('remove handlers de evento', () => {
    const out = sanitizeHtml('<img src="https://x.com/a.png" onerror="alert(1)">');
    expect(out).not.toContain('onerror');
    expect(out).toContain('src="https://x.com/a.png"');
  });
  it('bloqueia javascript: em links', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript');
  });
  it('mantém links http e adiciona rel seguro', () => {
    const out = sanitizeHtml('<a href="https://x.com" target="_blank">x</a>');
    expect(out).toContain('href="https://x.com"');
    expect(out).toContain('noopener');
  });
  it('mantém a formatação permitida', () => {
    expect(sanitizeHtml('<strong>a</strong><br><em>b</em>')).toBe('<strong>a</strong><br><em>b</em>');
  });
  it('remove estilo com url() em imagens', () => {
    expect(sanitizeHtml('<img src="https://x.com/a.png" style="background:url(javascript:1)">')).not.toContain('style');
  });
  it('desembrulha tags desconhecidas mantendo o texto', () => {
    expect(sanitizeHtml('<marquee>oi</marquee>')).toBe('oi');
  });
});
