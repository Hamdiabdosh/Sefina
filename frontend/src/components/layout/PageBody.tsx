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
      'flex-1 overflow-y-auto bg-canvas px-4 py-6 sm:px-6 lg:px-8 space-y-8',
      !fullWidth && 'mx-auto w-full max-w-7xl',
      className
    )}
  >
    {children}
  </div>
);
