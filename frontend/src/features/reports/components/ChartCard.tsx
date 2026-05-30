import type { ReactNode } from 'react';
import { cn } from '../../../lib/utils';

type ChartCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export const ChartCard = ({ title, children, className }: ChartCardProps) => (
  <div className={cn('card p-4 transition-all duration-200', className)}>
    <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-teal-800">{title}</h3>
    {children}
  </div>
);
