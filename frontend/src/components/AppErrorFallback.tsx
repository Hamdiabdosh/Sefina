import { useTranslation } from 'react-i18next';
import { AppLogo } from './AppLogo';
import type { AppErrorBoundaryState } from './AppErrorBoundary';

type AppErrorFallbackProps = {
  error: Error | null;
  onReload: () => void;
};

export const AppErrorFallback = ({ error, onReload }: AppErrorFallbackProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-12 text-center">
      <AppLogo size="lg" className="mb-6 h-16 w-16" />
      <h1 className="text-xl font-medium text-foreground">{t('errors.appTitle')}</h1>
      {import.meta.env.DEV && error && (
        <pre className="mt-4 max-w-lg overflow-auto rounded-md bg-danger-bg p-3 text-left text-xs text-danger-text">
          {error.message}
        </pre>
      )}
      <button
        type="button"
        onClick={onReload}
        className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {t('errors.reloadPage')}
      </button>
    </div>
  );
};

export type { AppErrorBoundaryState };
