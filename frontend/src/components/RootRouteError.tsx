import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const RootRouteError = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6 text-center">
      <p className="text-foreground">{t('errors.appTitle')}</p>
      <Link to="/" className="mt-4 text-sm font-medium text-primary hover:underline">
        {t('errors.goHome')}
      </Link>
    </div>
  );
};
