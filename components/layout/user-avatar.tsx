// components/layout/user-avatar.tsx
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  initials: string;
  src?: string;
  alt: string;
  className?: string;
}

export function UserAvatar({ initials, src, alt, className }: UserAvatarProps) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gold/30 bg-gold/15 text-sm font-extrabold text-gold',
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar host is user-defined, not in images.remotePatterns
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </div>
  );
}
