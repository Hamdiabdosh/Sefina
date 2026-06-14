import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
};

export const ErrorState = ({ title, message, onRetry, onBack }: ErrorStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger-text">
        <AlertTriangle className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="text-lg font-medium text-foreground">{title ?? t('errors.pageTitle')}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <button type="button" onClick={onRetry} className="btn-primary-inline">
            {t('errors.tryAgain')}
          </button>
        ) : null}
        {onBack ? (
          <button type="button" onClick={onBack} className="btn-secondary">
            {t('errors.goBack')}
          </button>
        ) : null}
      </div>
    </div>
  );
};
