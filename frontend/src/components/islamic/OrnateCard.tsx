import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { GeometricDivider } from './GeometricDivider';

export type OrnateCardProps = {
  children: ReactNode;
  title?: string;
  titleAr?: string;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'default' | 'metric' | 'hero';
  className?: string;
  onClick?: () => void;
};

export const OrnateCard = ({
  children,
  title,
  titleAr,
  subtitle,
  icon,
  variant = 'default',
  className,
  onClick,
}: OrnateCardProps) => {
  const interactive = Boolean(onClick);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border-2 border-islamic-gold/40 bg-surface shadow-md transition-shadow',
        variant === 'metric' && 'border-islamic-gold/30',
        variant === 'hero' && 'border-islamic-gold/50 shadow-lg',
        interactive && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg',
        className
      )}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <GeometricDivider className="absolute left-0 right-0 top-0 z-[1]" />

      {(title || titleAr || subtitle || icon) && (
        <div className="relative z-[2] border-b border-islamic-taupe/40 px-4 py-3 pt-4">
          <div className="flex items-start gap-3">
            {icon ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-lg">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              {title ? (
                <h3 className="font-heading-ar text-sm font-semibold text-foreground">{title}</h3>
              ) : null}
              {titleAr ? (
                <p className="font-display-ar text-base leading-snug text-islamic-azure" dir="rtl">
                  {titleAr}
                </p>
              ) : null}
              {subtitle ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <div className={cn('relative z-[2]', (title || titleAr || subtitle || icon) ? 'p-4' : 'p-4 pt-5')}>
        {children}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 islamic-geometric-bg opacity-30"
      />
    </div>
  );
};
