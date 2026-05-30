import { Skeleton } from '../ui/Skeleton';

/** Placeholder chrome while current user is loading */
export const ShellSidebarSkeleton = () => (
  <div className="flex h-full min-h-0 flex-col bg-sidebar px-4 py-4">
    <div className="flex items-center gap-3 border-b border-sidebar-border pb-4">
      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-2 w-16" />
      </div>
    </div>
    <div className="mt-4 space-y-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full rounded-md opacity-40" />
      ))}
    </div>
    <div className="mt-auto border-t border-sidebar-border pt-4">
      <Skeleton className="h-10 w-full rounded-md opacity-40" />
    </div>
  </div>
);

export const ShellMainSkeleton = () => (
  <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
    <Skeleton className="h-10 w-48" />
    <Skeleton className="h-32 w-full rounded-xl" />
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);
