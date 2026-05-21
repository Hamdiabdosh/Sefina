import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { GeometricDivider } from './GeometricDivider';

export type MarketingHeroProps = {
  variant?: 'hero' | 'compact' | 'auth';
  title?: string;
  titleAr?: string;
  subtitle?: string;
  showBlessing?: boolean;
  actions?: ReactNode;
  className?: string;
  /** auth variant: light text on teal panel */
  tone?: 'light' | 'dark';
};

export const MarketingHero = ({
  variant = 'hero',
  title,
  titleAr,
  subtitle,
  showBlessing = variant !== 'compact',
  actions,
  className,
  tone = 'dark',
}: MarketingHeroProps) => {
  const { t } = useTranslation();
  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';
  const isAuth = variant === 'auth';
  const isLight = tone === 'light';

  const displayTitle = title ?? t('auth.appName');
  const displayTitleAr =
    titleAr ?? (isHero || isAuth ? t('marketing.heroTitleAr') : undefined);
  const displaySubtitle =
    subtitle ?? (isHero ? t('marketing.heroSubtitle') : isAuth ? t('auth.tagline') : undefined);

  return (
    <header
      className={cn(
        'relative overflow-hidden',
        isHero && 'rounded-2xl bg-gradient-to-br from-islamic-navy via-islamic-azure to-teal-800 px-6 py-10 text-white md:px-10 md:py-14',
        isCompact && 'mb-4 border-b border-cream-dark pb-4',
        isAuth && 'relative',
        className
      )}
    >
      {isHero ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 islamic-geometric-bg opacity-20"
        />
      ) : null}

      <div className={cn('relative z-10', isCompact && 'flex flex-wrap items-end justify-between gap-4')}>
        <div className={cn(isCompact && 'min-w-0 flex-1')}>
          {showBlessing && !isCompact ? (
            <p
              className={cn(
                'font-display-ar mb-3',
                isHero ? 'text-2xl text-gold-400' : 'text-lg',
                isLight && 'text-gold-50'
              )}
              dir="rtl"
            >
              {t('marketing.basmala')}
            </p>
          ) : null}

          {displayTitleAr ? (
            <h1
              className={cn(
                'font-display-ar leading-tight',
                isHero && 'text-3xl md:text-4xl',
                isCompact && 'text-xl font-medium text-islamic-azure',
                isAuth && 'text-lg font-medium',
                isLight && 'text-white'
              )}
              dir="rtl"
            >
              {displayTitleAr}
            </h1>
          ) : null}
          <p
            className={cn(
              'font-medium',
              displayTitleAr && 'mt-1',
              isHero && 'text-xl md:text-2xl text-white/95',
              isCompact && 'text-lg text-foreground',
              isAuth && 'text-lg',
              isLight ? 'text-white' : !isHero && 'text-foreground'
            )}
          >
            {displayTitle}
          </p>
          {displaySubtitle ? (
            <p
              className={cn(
                'mt-2 max-w-xl',
                isHero && 'text-sm text-white/75 md:text-base',
                isCompact && 'text-sm text-muted-foreground',
                isAuth && 'text-[11px]',
                isLight ? 'text-white/70' : isAuth && 'text-white/70'
              )}
            >
              {displaySubtitle}
              {isAuth ? (
                <span className="font-body-ar" dir="rtl">
                  {' '}
                  · {t('auth.taglineAr')}
                </span>
              ) : null}
            </p>
          ) : null}

          {showBlessing && isHero ? (
            <p className="mt-4 text-xs text-white/60">{t('marketing.blessingLine')}</p>
          ) : null}
        </div>

        {actions ? (
          <div className={cn('mt-4 shrink-0', isCompact && 'mt-0')}>{actions}</div>
        ) : null}
      </div>

      {isHero ? <GeometricDivider className="absolute bottom-0 left-0 right-0" height="md" /> : null}
    </header>
  );
};
