import { cn } from '../../lib/utils';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('skeleton rounded-md', className)} />
);

export const SkeletonCard = () => (
  <div className="rounded-xl border border-cream-dark bg-surface p-4">
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="mt-2 h-3 w-1/2" />
  </div>
);

const mdGridCols: Record<number, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
  7: 'md:grid-cols-7',
};

export const SkeletonStatGrid = ({ cols = 4 }: { cols?: number }) => (
  <div className={cn('grid grid-cols-2 gap-3', mdGridCols[cols] ?? 'md:grid-cols-4')}>
    {Array.from({ length: cols }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="overflow-hidden rounded-lg border border-cream-dark bg-surface">
    {Array.from({ length: rows }, (_, i) => (
      <div
        key={i}
        className="flex gap-3 border-b border-cream-dark/60 px-3 py-2.5 last:border-b-0"
      >
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="ml-auto h-3 w-32" />
      </div>
    ))}
  </div>
);

export const SkeletonList = ({ rows = 3 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);
