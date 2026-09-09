import React, { useState } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  colorHex?: string;
  ring?: boolean;
  status?: 'online' | 'busy' | 'offline';
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; dot: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[9px]', dot: 'w-1.5 h-1.5' },
  sm: { container: 'w-7 h-7', text: 'text-[10px]', dot: 'w-2 h-2' },
  md: { container: 'w-9 h-9', text: 'text-xs', dot: 'w-2.5 h-2.5' },
  lg: { container: 'w-12 h-12', text: 'text-sm', dot: 'w-3 h-3' },
  xl: { container: 'w-16 h-16', text: 'text-lg', dot: 'w-3.5 h-3.5' },
};

const statusColors: Record<'online' | 'busy' | 'offline', string> = {
  online: 'bg-emerald-500 ring-[#101010]',
  busy: 'bg-rose-500 ring-[#101010]',
  offline: 'bg-slate-500 ring-[#101010]',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  colorHex,
  ring = false,
  status,
  className = '',
  style = {},
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string | null | undefined>(src);
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const initials = getInitials(name || alt);
  const { container, text, dot } = sizeStyles[size];

  const ringClass = ring ? 'ring-2 ring-[#E4007E]/60' : '';

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    const current = target.src;
    const driveMatch =
      current.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      current.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      current.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (driveMatch && driveMatch[1] && !current.includes('thumbnail?id=')) {
      setImgSrc(`https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w400`);
    } else {
      setHasError(true);
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${container} ${ringClass} ${className}`}
      style={style}
      {...props}
    >
      {imgSrc && !hasError ? (
        <img
          src={imgSrc}
          alt={alt || name || 'Avatar'}
          onError={handleImageError}
          className="w-full h-full rounded-full object-cover shadow-xs"
        />
      ) : (
        <div
          className={`w-full h-full rounded-full flex items-center justify-center font-black uppercase text-white shadow-xs ${text} ${
            !colorHex ? 'bg-gradient-to-tr from-[#222222] to-[#2E2E2E] border border-[#3A3A3A]' : ''
          }`}
          style={colorHex ? { backgroundColor: colorHex } : undefined}
        >
          {initials}
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ${dot} ${statusColors[status]}`}
        />
      )}
    </div>
  );
};
