import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { BookOpen, Building2, Heart, LogIn, MapPin, Users } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { AppLogo } from '../../../components/AppLogo';
import { BlessingFooter, MarketingHero, OrnateCard } from '../../../components/islamic';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { MedresaShowcaseCard } from '../components/MedresaShowcaseCard';
import { usePublicMedresas } from '../hooks/usePublicMedresas';

const VALUE_KEYS = ['learning', 'community', 'heritage'] as const;

export const MarketingPage = () => {
  const { t } = useTranslation();
  const { data: medresas = [], isLoading, isError } = usePublicMedresas();

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-20 border-b border-cream-dark bg-cream/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <AppLogo size="md" className="h-10 w-10" />
            <div>
              <p className="text-sm font-medium text-teal-800">{t('marketing.siteName')}</p>
              <p className="text-[11px] text-muted-foreground">{t('marketing.siteTagline')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-800"
            >
              <LogIn size={16} />
              {t('marketing.staffSignIn')}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <MarketingHero
          variant="hero"
          title={t('marketing.heroTitle')}
          titleAr={t('marketing.heroTitleAr')}
          subtitle={t('marketing.heroSubtitle')}
        />

        <section className="mt-12">
          <h2 className="mb-2 text-center font-heading-ar text-xl font-semibold text-islamic-azure md:text-2xl">
            {t('marketing.valuesTitle')}
          </h2>
          <p className="mx-auto mb-6 max-w-lg text-center text-sm text-muted-foreground">
            {t('marketing.valuesSubtitle')}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {VALUE_KEYS.map((key) => {
              const Icon = key === 'learning' ? BookOpen : key === 'community' ? Users : Heart;
              return (
                <OrnateCard
                  key={key}
                  variant="metric"
                  title={t(`marketing.values.${key}.title`)}
                  titleAr={t(`marketing.values.${key}.titleAr`)}
                  icon={<Icon size={20} className="text-teal-600" />}
                >
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`marketing.values.${key}.description`)}
                  </p>
                </OrnateCard>
              );
            })}
          </div>
        </section>

        <section id="medresas" className="mt-14 scroll-mt-20">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <h2 className="font-heading-ar text-xl font-semibold text-islamic-azure md:text-2xl">
              {t('marketing.medresasTitle')}
            </h2>
            <p className="max-w-lg text-sm text-muted-foreground">{t('marketing.medresasSubtitle')}</p>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-xl border border-cream-dark bg-surface"
                  aria-hidden
                />
              ))}
            </div>
          ) : isError ? (
            <p className="rounded-xl border border-danger-text/20 bg-danger-bg px-4 py-6 text-center text-sm text-danger-text">
              {t('marketing.medresasLoadError')}
            </p>
          ) : medresas.length === 0 ? (
            <EmptyState icon={Building2} title={t('marketing.medresasEmpty')} className="py-8" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {medresas.map((medresa) => (
                <MedresaShowcaseCard key={medresa.id} medresa={medresa} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-14 flex flex-col items-center gap-3 rounded-2xl border border-islamic-taupe/50 bg-surface p-8 text-center shadow-sm">
          <MapPin className="text-teal-400" size={36} strokeWidth={1.25} aria-hidden />
          <p className="max-w-md text-sm text-muted-foreground">{t('marketing.enrollHint')}</p>
          <p className="text-xs text-muted-foreground">{t('marketing.staffOnlyNote')}</p>
        </section>
      </main>

      <BlessingFooter className="border-t border-cream-dark bg-surface-muted" />
    </div>
  );
};
