/**
 * Normaliza um código de cor digitado pelo usuário para "#RRGGBB" (maiúsculas).
 * Aceita com ou sem "#", e a forma curta de 3 dígitos ("F00" -> "#FF0000").
 * Devolve null quando não é um hexadecimal válido.
 */
export const normalizeHex = (value?: string | null): string | null => {
  const raw = (value ?? '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw.split('').map((c) => c + c).join('')}`.toUpperCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw}`.toUpperCase();
  return null;
};

/** Limpa o que está sendo digitado: só dígitos hexa, com "#" na frente, no máximo 7 caracteres. */
export const sanitizeHexInput = (value: string): string => {
  const digits = value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase();
  return digits ? `#${digits}` : '';
};
