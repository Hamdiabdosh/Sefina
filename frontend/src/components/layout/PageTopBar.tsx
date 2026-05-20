import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export type PageTopBarProps = {
  title: string;
  subtitle?: string;
  /** Back button (preferred over ad-hoc links above the bar) */
  onBack?: () => void;
  /** Decorative icon next to title (optional) */
  icon?: LucideIcon;
  /** Primary actions (right side), e.g. search + button */
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Calm page header aligned with the shell — light top bar, not the legacy teal hero strip.
 */
export const PageTopBar = ({
  title,
  subtitle,
  onBack,
  icon: Icon,
  actions,
  className,
}: PageTopBarProps) => (
  <header
    className={cn(
      'shrink-0 border-b border-topbar-border bg-surface px-4 py-3 md:px-6 md:h-14 md:py-0 md:flex md:items-center',
      className
    )}
  >
    <div className="flex items-start justify-between gap-4 md:items-center md:flex-1 md:min-h-14">
      <div className="flex min-w-0 items-start gap-3 md:items-center">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-teal-800 hover:bg-cream-dark md:mt-0"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        {Icon && !onBack && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <Icon size={22} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-base font-medium text-foreground leading-tight break-words">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground md:truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>
      ) : null}
    </div>
  </header>
);
