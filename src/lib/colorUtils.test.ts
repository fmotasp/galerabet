import { describe, it, expect } from 'vitest';
import { normalizeHex, sanitizeHexInput } from './colorUtils';

describe('normalizeHex', () => {
  it('aceita #RRGGBB e devolve em maiúsculas', () => {
    expect(normalizeHex('#e4007e')).toBe('#E4007E');
  });
  it('aceita sem #', () => {
    expect(normalizeHex('ff0000')).toBe('#FF0000');
  });
  it('expande a forma curta', () => {
    expect(normalizeHex('#f0a')).toBe('#FF00AA');
    expect(normalizeHex('abc')).toBe('#AABBCC');
  });
  it('ignora espaços', () => {
    expect(normalizeHex('  #123456 ')).toBe('#123456');
  });
  it('rejeita códigos incompletos ou inválidos', () => {
    expect(normalizeHex('#12345')).toBeNull();
    expect(normalizeHex('#GGGGGG')).toBeNull();
    expect(normalizeHex('')).toBeNull();
    expect(normalizeHex(undefined)).toBeNull();
  });
});

describe('sanitizeHexInput', () => {
  it('põe # na frente e remove o que não é hexa', () => {
    expect(sanitizeHexInput('ff00zz')).toBe('#FF00');
  });
  it('limita a 6 dígitos', () => {
    expect(sanitizeHexInput('#1234567890')).toBe('#123456');
  });
  it('vazio continua vazio', () => {
    expect(sanitizeHexInput('')).toBe('');
    expect(sanitizeHexInput('#')).toBe('');
  });
});
