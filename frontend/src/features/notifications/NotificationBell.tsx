import { Bell } from 'lucide-react';

type NotificationBellProps = {
  count: number;
  onClick: () => void;
};

export const NotificationBell = ({ count, onClick }: NotificationBellProps) => {
  if (count <= 0) {
    return null;
  }

  const label = count > 99 ? '99+' : String(count);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-hover"
      aria-label={`${count} pending notifications`}
    >
      <Bell size={18} strokeWidth={1.75} />
      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium tabular-nums bg-danger-bg text-danger-text">
        {label}
      </span>
    </button>
  );
};
