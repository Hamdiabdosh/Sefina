import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

const toneIcon: Record<string, string> = {
  green: 'bg-teal-50 text-teal-600',
  teal: 'bg-teal-50 text-teal-400',
  amber: 'bg-gold-50 text-warning-text',
  blue: 'bg-info-bg text-info-text',
};

export type StatCardProps = {
  icon: LucideIcon;
  value: string | number;
  label: string;
  /** Secondary line e.g. trend or context */
  hint?: ReactNode;
  tone?: keyof typeof toneIcon;
  className?: string;
};

export const StatCard = ({
  icon: Icon,
  value,
  label,
  hint,
  tone = 'green',
  className,
}: StatCardProps) => (
  <div
    className={cn(
      'rounded-lg border border-cream-dark bg-surface p-4 shadow-sm',
      className
    )}
  >
    <div
      className={cn(
        'mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg',
        toneIcon[tone] ?? toneIcon.green
      )}
    >
      <Icon size={18} />
    </div>
    <p className="text-[22px] font-medium leading-none text-foreground">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    {hint ? <div className="mt-2 text-[11px] text-muted-foreground">{hint}</div> : null}
  </div>
);
