import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type ContentCardProps = {
  children: ReactNode;
  className?: string;
  /** Makes entire card interactive */
  onClick?: () => void;
};

/** White panel on canvas — default list/detail block surface */
export const ContentCard = ({ children, className, onClick }: ContentCardProps) => (
  <div
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={
      onClick
        ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick();
            }
          }
        : undefined
    }
    className={cn(
      'card',
      onClick && 'group cursor-pointer active:scale-[0.99]',
      className
    )}
  >
    {children}
  </div>
);
