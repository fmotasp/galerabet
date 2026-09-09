import { useState, useEffect } from 'react';

/**
 * Hook customizado para atrasar a atualização de um valor (debounce).
 * Útil para evitar filtragens ou chamadas de API excessivas a cada tecla digitada.
 *
 * @param value Valor a ser atrasado
 * @param delay Tempo em milissegundos (default: 300ms)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
