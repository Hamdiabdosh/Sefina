import { cn } from '../../lib/utils';

export type FilterTabOption<T extends string> = { value: T; label: string };

export type FilterTabsProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  tabs: FilterTabOption<T>[];
  className?: string;
};

export const FilterTabs = <T extends string>({
  value,
  onChange,
  tabs,
  className,
}: FilterTabsProps<T>) => (
  <div className={cn('flex flex-wrap gap-1', className)} role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab.value}
        type="button"
        role="tab"
        aria-selected={value === tab.value}
        onClick={() => onChange(tab.value)}
        className={cn(
          'rounded-md border border-transparent px-3 py-1.5 text-xs transition-colors',
          value === tab.value
            ? 'border-cream-dark bg-surface font-medium text-foreground'
            : 'text-muted-foreground hover:bg-cream-dark'
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
