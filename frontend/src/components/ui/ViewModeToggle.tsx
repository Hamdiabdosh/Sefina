import type { ReactNode } from 'react';
import { LayoutGrid, List, Table2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

export type ListGridMode = 'list' | 'grid';
export type ListTableMode = 'list' | 'table';

type BaseProps = {
  className?: string;
};

type ListGridToggleProps = BaseProps & {
  variant: 'list-grid';
  value: ListGridMode;
  onChange: (mode: ListGridMode) => void;
};

type ListTableToggleProps = BaseProps & {
  variant: 'list-table';
  value: ListTableMode;
  onChange: (mode: ListTableMode) => void;
};

export type ViewModeToggleProps = ListGridToggleProps | ListTableToggleProps;

export const ViewModeToggle = (props: ViewModeToggleProps) => {
  const { t } = useTranslation();
  const { className } = props;

  if (props.variant === 'list-grid') {
    return (
      <div
        className={cn(
          'flex gap-1 rounded-md border border-cream-dark bg-surface p-0.5',
          className
        )}
        role="group"
        aria-label={t('layout.viewMode')}
      >
        <ToggleBtn
          pressed={props.value === 'list'}
          label={t('layout.viewList')}
          onClick={() => props.onChange('list')}
        >
          <List size={16} />
        </ToggleBtn>
        <ToggleBtn
          pressed={props.value === 'grid'}
          label={t('layout.viewGrid')}
          onClick={() => props.onChange('grid')}
        >
          <LayoutGrid size={16} />
        </ToggleBtn>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-1 rounded-md border border-cream-dark bg-surface p-0.5',
        className
      )}
      role="group"
      aria-label={t('layout.viewMode')}
    >
      <ToggleBtn
        pressed={props.value === 'list'}
        label={t('layout.viewList')}
        onClick={() => props.onChange('list')}
      >
        <List size={16} />
      </ToggleBtn>
      <ToggleBtn
        pressed={props.value === 'table'}
        label={t('layout.viewTable')}
        onClick={() => props.onChange('table')}
      >
        <Table2 size={16} />
      </ToggleBtn>
    </div>
  );
};

function ToggleBtn({
  pressed,
  label,
  onClick,
  children,
}: {
  pressed: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded transition-colors',
        pressed ? 'bg-cream text-foreground' : 'text-muted-foreground'
      )}
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
