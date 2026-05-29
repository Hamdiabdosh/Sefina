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
      'rounded-lg border border-cream-dark bg-surface p-4 shadow-sm md:p-5',
      className
    )}
  >
    <div
      className={cn(
        'mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg md:mb-3 md:h-11 md:w-11',
        toneIcon[tone] ?? toneIcon.green
      )}
    >
      <Icon className="h-[18px] w-[18px] md:h-6 md:w-6" />
    </div>
    <p className="text-[22px] font-medium leading-none text-foreground md:text-[26px]">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground md:text-sm">{label}</p>
    {hint ? (
      <div className="mt-2 text-[11px] text-muted-foreground md:text-xs">{hint}</div>
    ) : null}
  </div>
);
