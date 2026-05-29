import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { useAuth } from '../hooks/useAuth';
import { useCurrentUser } from '../hooks/useCurrentUser';

export const PendingAccessPage = () => {
  const { t } = useTranslation();
  const { currentUser } = useCurrentUser();
  const { logout } = useAuth();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageTopBar title={t('pending.title')} />
      <PageBody>
        <div className="mx-auto max-w-lg">
          <div className="rounded-xl border border-cream-dark bg-surface p-8 shadow-sm">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-500">
              <Clock size={28} />
            </div>

            <h2 className="text-center text-lg font-medium text-foreground">{t('pending.title')}</h2>

            <p className="mt-3 text-center text-sm text-muted-foreground">
              {t('pending.greeting', { fullName: currentUser?.fullName ?? '' })}
            </p>

            <div className="mt-8">
              <p className="text-sm font-medium text-foreground">{t('pending.whatHappensNext')}</p>
              <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-medium text-teal-700">1.</span>
                  <span>{t('pending.step1')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-teal-700">2.</span>
                  <span>{t('pending.step2')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-teal-700">3.</span>
                  <span>{t('pending.step3')}</span>
                </li>
              </ol>
            </div>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              {t('pending.alreadyAssigned')}{' '}
              <button
                type="button"
                onClick={() => logout()}
                className="text-teal-700 underline hover:text-teal-800"
              >
                {t('pending.signOut')}
              </button>{' '}
              {t('pending.alreadyAssignedSuffix')}
            </p>
          </div>
        </div>
      </PageBody>
    </div>
  );
};
