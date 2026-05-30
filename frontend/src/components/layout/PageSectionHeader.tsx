import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type PageSectionHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

/** In-page section title inside PageBody — not a replacement for PageTopBar */
export const PageSectionHeader = ({
  title,
  description,
  actions,
  className,
}: PageSectionHeaderProps) => (
  <div
    className={cn(
      'flex flex-col gap-4 border-b border-cream-dark pb-6 sm:flex-row sm:items-start sm:justify-between',
      className
    )}
  >
    <div>
      <h2 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h2>
      {description ? (
        <p className="mt-1 text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);
