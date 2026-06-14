import { useId, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type FieldProps = {
  label: string;
  error?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  className?: string;
};

export const Field = ({ label, error, children, className }: FieldProps) => {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn(className)}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children({
        id,
        describedBy: errorId,
        invalid: Boolean(error),
      })}
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-danger-text" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};
