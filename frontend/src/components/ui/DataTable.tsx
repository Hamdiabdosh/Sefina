import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type DataTableProps = {
  children: ReactNode;
  className?: string;
  /** Card list shown on small screens when table columns are cramped */
  mobileFallback?: ReactNode;
};

export const DataTable = ({ children, className, mobileFallback }: DataTableProps) => (
  <>
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-cream-dark bg-surface',
        mobileFallback && 'hidden md:block',
        className
      )}
    >
      <div
        className={cn(
          '[&_table]:w-full [&_table]:text-sm',
          '[&_tbody_tr:nth-child(even)]:bg-cream-dark/25',
          '[&_tbody_tr:hover]:bg-teal-50/40',
          '[&_tbody_tr]:transition-colors'
        )}
      >
        {children}
      </div>
    </div>
    {mobileFallback ? <div className="md:hidden">{mobileFallback}</div> : null}
  </>
);
