import { useTranslation } from 'react-i18next';
import { AppLogo } from '../../../components/AppLogo';
import { BlessingFooter } from '../../../components/islamic';
import { GeometricPattern } from '../../../components/GeometricPattern';

/** Left panel on large screens for login / auth flows. */
export const AuthMarketingPanel = () => {
  const { t } = useTranslation();

  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-800 via-teal-600 to-teal-700 p-10 text-white lg:flex">
      <GeometricPattern opacity={0.12} />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23fff' stroke-width='1'%3E%3Cpath d='M30 10c10 0 20 10 20 20s-10 20-20 20-20-10-20-20 10-20 20-20'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div className="relative z-10 max-w-lg">
        <AppLogo size="lg" tone="light" className="mb-6 h-16 w-16 drop-shadow-sm" />
        <p className="font-display-ar mb-3 text-2xl text-gold-50" dir="rtl">
          {t('marketing.basmala')}
        </p>
        <h1 className="font-display-ar text-3xl leading-tight md:text-4xl" dir="rtl">
          {t('marketing.heroTitleAr')}
        </h1>
        <p className="mt-2 text-xl font-medium text-white/95">{t('marketing.heroTitle')}</p>
        <p className="mt-3 text-sm text-white/75 md:text-base">{t('marketing.heroSubtitle')}</p>
      </div>
      <div className="relative z-10 space-y-4">
        <p className="max-w-md text-sm text-white/85">{t('auth.marketingBlurb')}</p>
        <BlessingFooter compact className="text-white/70" />
      </div>
    </aside>
  );
};
