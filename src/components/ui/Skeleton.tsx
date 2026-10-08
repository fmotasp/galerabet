import React from 'react';

/** Bloco de carregamento. Respeita prefers-reduced-motion (a animação é desligada pelo CSS global). */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div aria-hidden="true" className={`bg-raised rounded-xl animate-pulse ${className}`} />
);

/** Linhas de tabela em carregamento. */
export const SkeletonRows: React.FC<{ rows?: number; columns: number }> = ({ rows = 5, columns }) => (
  <>
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r} aria-hidden="true">
        {Array.from({ length: columns }).map((__, c) => (
          <td key={c} className="px-4 py-4">
            <Skeleton className="h-4 w-full max-w-[160px]" />
          </td>
        ))}
      </tr>
    ))}
  </>
);
