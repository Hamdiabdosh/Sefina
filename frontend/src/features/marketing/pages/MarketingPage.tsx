import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Building2,
  CalendarCheck,
  Coins,
  GraduationCap,
  LogIn,
  Users,
  Wallet,
} from 'lucide-react';
import { AppLogo } from '../../../components/AppLogo';
import { BlessingFooter, MarketingHero, OrnateCard } from '../../../components/islamic';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';

const FEATURE_KEYS = [
  { key: 'medresas' as const, icon: Building2 },
  { key: 'students' as const, icon: Users },
  { key: 'attendance' as const, icon: CalendarCheck },
  { key: 'grades' as const, icon: BookOpen },
  { key: 'fees' as const, icon: Coins },
  { key: 'salaries' as const, icon: Wallet },
] as const;

export const MarketingPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-20 border-b border-cream-dark bg-cream/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <AppLogo size="md" className="h-10 w-10" />
            <span className="text-sm font-medium text-teal-800">{t('auth.appName')}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/login" className="btn-primary-inline !w-auto">
              <LogIn size={16} />
              {t('marketing.signIn')}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <MarketingHero
          variant="hero"
          actions={
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-gold-400 px-6 py-3 text-sm font-medium text-islamic-navy shadow-md transition-colors hover:bg-islamic-gold-hover"
            >
              <LogIn size={18} />
              {t('marketing.signIn')}
            </Link>
          }
        />

        <section className="mt-12">
          <h2 className="mb-6 text-center font-heading-ar text-xl font-semibold text-islamic-azure md:text-2xl">
            {t('marketing.featuresTitle')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_KEYS.map(({ key, icon: Icon }) => (
              <OrnateCard
                key={key}
                variant="metric"
                title={t(`marketing.features.${key}.title`)}
                titleAr={t(`marketing.features.${key}.titleAr`)}
                icon={<Icon size={20} className="text-teal-600" />}
              >
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`marketing.features.${key}.description`)}
                </p>
              </OrnateCard>
            ))}
          </div>
        </section>

        <section className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-islamic-taupe/50 bg-surface p-8 text-center shadow-sm">
          <GraduationCap className="text-teal-400" size={40} strokeWidth={1.25} />
          <p className="max-w-md text-sm text-muted-foreground">{t('marketing.heroSubtitle')}</p>
          <Link to="/login" className="btn-primary !w-auto min-w-[200px]">
            <LogIn size={18} />
            {t('marketing.signIn')}
          </Link>
        </section>
      </main>

      <BlessingFooter className="border-t border-cream-dark bg-surface-muted" />
    </div>
  );
};
