import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

type BlessingFooterProps = {
  compact?: boolean;
  className?: string;
};

export const BlessingFooter = ({ compact = false, className }: BlessingFooterProps) => {
  const { t } = useTranslation();

  return (
    <footer
      className={cn(
        'text-center',
        compact ? 'py-4 px-2' : 'py-8 px-4',
        className
      )}
    >
      <p
        className={cn(
          'italic text-muted-foreground',
          compact ? 'text-[11px]' : 'text-sm'
        )}
      >
        &ldquo;{t('common.blessingQuote')}&rdquo;
      </p>
      <p
        className={cn(
          'font-display-ar text-islamic-azure mt-1',
          compact ? 'text-sm' : 'text-base'
        )}
        dir="rtl"
      >
        {t('common.blessingArabic')}
      </p>
      <p className={cn('text-muted-foreground mt-1', compact ? 'text-[10px]' : 'text-xs')}>
        {t('common.blessingReference')}
      </p>
    </footer>
  );
};
