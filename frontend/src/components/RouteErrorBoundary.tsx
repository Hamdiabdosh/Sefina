import { useRouter } from '@tanstack/react-router';
import { AlertTriangle } from 'lucide-react';

export type RouteErrorBoundaryProps = {
  error: Error;
};

export function RouteErrorBoundary({ error }: RouteErrorBoundaryProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <AlertTriangle className="mb-4 h-10 w-10 text-danger-text" aria-hidden />
      <h1 className="text-lg font-medium text-foreground">This page couldn&apos;t load</h1>
      {import.meta.env.DEV && (
        <pre className="mt-4 max-w-lg overflow-auto rounded-md bg-danger-bg p-3 text-left text-xs text-danger-text">
          {error.message}
        </pre>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => void router.invalidate()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => router.history.back()}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Go back
        </button>
      </div>
    </div>
  );
}
