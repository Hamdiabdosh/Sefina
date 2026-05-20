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
      <PageTopBar title="Account pending setup" subtitle={t('pending.assignHint')} />
      <PageBody>
        <div className="mx-auto max-w-lg">
          <div className="rounded-xl border border-cream-dark bg-surface p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-500">
              <Clock size={28} />
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Hi {currentUser?.fullName}, your account is active but not linked to a medresa yet.
            </p>
            <button type="button" onClick={() => logout()} className="btn-secondary">
              Sign out
            </button>
          </div>
        </div>
      </PageBody>
    </div>
  );
};
