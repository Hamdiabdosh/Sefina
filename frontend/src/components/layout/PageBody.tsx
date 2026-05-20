import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type PageBodyProps = {
  children: ReactNode;
  /** Wider layouts (tables, attendance grids) can disable max width */
  fullWidth?: boolean;
  className?: string;
};

/**
 * Standard content padding for the main column. Canvas background is provided by the route wrapper or shell inner area.
 */
export const PageBody = ({ children, fullWidth, className }: PageBodyProps) => (
  <div
    className={cn(
      'flex-1 overflow-y-auto px-4 py-5 md:px-6 bg-canvas',
      !fullWidth && 'mx-auto w-full max-w-6xl',
      className
    )}
  >
    {children}
  </div>
);
