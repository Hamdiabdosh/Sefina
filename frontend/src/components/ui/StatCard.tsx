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

function formatValue(value: string | number): string {
  if (typeof value === 'number') {
    return value.toLocaleString('en-US');
  }
  return value;
}

export const StatCard = ({
  icon: Icon,
  value,
  label,
  hint,
  tone = 'green',
  className,
}: StatCardProps) => (
  <div className={cn('card p-4 md:p-5', className)}>
    <div className="flex items-center gap-4">
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
          toneIcon[tone] ?? toneIcon.green
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <div className="text-3xl font-semibold tabular-nums tracking-tighter text-foreground">
          {formatValue(value)}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {hint ? (
          <div className="mt-2 text-[11px] text-muted-foreground md:text-xs">{hint}</div>
        ) : null}
      </div>
    </div>
  </div>
);
