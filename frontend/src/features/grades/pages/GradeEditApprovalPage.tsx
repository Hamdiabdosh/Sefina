import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { ContentCard } from '../../../components/ui/ContentCard';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import {
  useApproveGradeEdit,
  useGradeEditRequests,
  useRejectGradeEdit,
} from '../hooks/useGrades';

type Props = { variant: 'medresa' | 'admin' };

export const GradeEditApprovalPage = ({ variant: _variant }: Props) => {
  const { t } = useTranslation();
  const { data, isLoading } = useGradeEditRequests({ status: 'PENDING' });
  const approve = useApproveGradeEdit();
  const reject = useRejectGradeEdit();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const items = data?.items ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={t('grades.editApprovalTitle')}
        subtitle={t('grades.pendingCount', { count: items.length })}
      />
      <PageBody>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('grades.loading')}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('grades.noPendingEdits')}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <ContentCard>
                  <p className="text-sm font-medium">{item.teacherName}</p>
                  <p className="text-sm text-foreground">
                    {item.studentName} · {getLocalizedValue(item.courseName)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getLocalizedValue(item.examTypeName)}: {item.currentScore} →{' '}
                    {item.requestedScore}
                  </p>
                  <p className="text-xs italic text-muted-foreground mt-1">&quot;{item.reason}&quot;</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-cream-dark px-3 py-1.5 text-xs"
                      onClick={() => {
                        setRejectId(item.id);
                        setRejectReason('');
                      }}
                    >
                      {t('grades.reject')}
                    </button>
                    <button
                      type="button"
                      className="btn-primary-inline text-xs px-3 py-1.5"
                      disabled={approve.isPending}
                      onClick={() => void approve.mutateAsync(item.id)}
                    >
                      {t('grades.approve')}
                    </button>
                  </div>
                </ContentCard>
              </li>
            ))}
          </ul>
        )}

        {rejectId ? (
          <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4 sm:items-center">
            <div className="w-full max-w-md rounded-xl bg-surface p-4">
              <p className="font-medium mb-2">{t('grades.rejectReasonTitle')}</p>
              <textarea
                className="field-input w-full min-h-[80px]"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="mt-3 flex gap-2 justify-end">
                <button type="button" className="btn-secondary" onClick={() => setRejectId(null)}>
                  {t('grades.cancel')}
                </button>
                <button
                  type="button"
                  className="btn-primary-inline"
                  disabled={!rejectReason.trim() || reject.isPending}
                  onClick={() => {
                    void reject.mutateAsync({ id: rejectId, rejectionReason: rejectReason.trim() });
                    setRejectId(null);
                  }}
                >
                  {t('grades.confirmReject')}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </PageBody>
    </div>
  );
};
