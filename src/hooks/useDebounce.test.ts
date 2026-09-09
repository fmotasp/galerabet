import { describe, it, expect, vi } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  it('está exportado corretamente e tem assinatura de função', () => {
    expect(typeof useDebounce).toBe('function');
  });
});
