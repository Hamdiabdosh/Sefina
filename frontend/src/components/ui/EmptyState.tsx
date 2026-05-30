import { isValidElement, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export type EmptyStateProps = {
  icon: LucideIcon | ReactNode;
  title: string;
  body?: string;
  /** @deprecated use `body` */
  description?: string;
  action?: ReactNode;
  /** @deprecated use `action` */
  children?: ReactNode;
  className?: string;
};

const renderIcon = (icon: LucideIcon | ReactNode) => {
  if (isValidElement(icon)) return icon;
  const Icon = icon as LucideIcon;
  return <Icon className="h-7 w-7" aria-hidden />;
};

export const EmptyState = ({
  icon,
  title,
  body,
  description,
  action,
  children,
  className,
}: EmptyStateProps) => {
  const bodyText = body ?? description;
  const actionNode = action ?? children;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-cream-dark bg-surface px-6 py-16 text-center',
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-600">
        {renderIcon(icon)}
      </div>
      <h3 className="mb-1 text-lg font-medium text-teal-800">{title}</h3>
      {bodyText ? (
        <p className="max-w-sm text-sm text-muted-foreground">{bodyText}</p>
      ) : null}
      {actionNode ? <div className="mt-6">{actionNode}</div> : null}
    </div>
  );
};
