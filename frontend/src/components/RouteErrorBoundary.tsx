import { useRouter } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ErrorState } from './ui/ErrorState';

export type RouteErrorBoundaryProps = {
  error: Error;
};

export function RouteErrorBoundary({ error }: RouteErrorBoundaryProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ErrorState
      title={t('errors.pageTitle')}
      message={import.meta.env.DEV ? error.message : t('errors.pageBody')}
      onRetry={() => void router.invalidate()}
      onBack={() => router.history.back()}
    />
  );
}
