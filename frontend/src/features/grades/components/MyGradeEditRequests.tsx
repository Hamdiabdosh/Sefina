import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { cn } from '../../../lib/utils';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import { useMyGradeEditRequests } from '../hooks/useGrades';
import type { GradeEditRequestDTO } from '../types';

const statusClass = (status: GradeEditRequestDTO['status']) => {
  switch (status) {
    case 'PENDING':
      return 'bg-gold-50 text-[#8a6914]';
    case 'APPROVED':
      return 'bg-teal-50 text-teal-800';
    case 'REJECTED':
      return 'bg-danger-bg text-danger-text';
    default:
      return 'bg-cream text-muted-foreground';
  }
};

const formatSubmittedAgo = (createdAt: string, t: TFunction): string => {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return t('grades.submittedToday');
  if (days === 1) return t('grades.submittedYesterday');
  return t('grades.submittedDaysAgo', { count: days });
};

const RequestSkeleton = () => (
  <ul className="space-y-3">
    {[0, 1].map((i) => (
      <li key={i} className="h-24 animate-pulse rounded-xl border border-cream-dark bg-surface" />
    ))}
  </ul>
);

export const MyGradeEditRequests = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useMyGradeEditRequests();
  const items = data?.items ?? [];

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-foreground">{t('grades.myEditRequests')}</h2>
      {isLoading ? (
        <RequestSkeleton />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('grades.noEditRequests')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const examLabel = item.examTypeName
              ? getLocalizedValue(item.examTypeName)
              : t('grades.examTypeLabel');
            const reviewNote = item.rejectionReason?.trim();

            return (
              <li
                key={item.id}
                className="rounded-xl border border-cream-dark bg-surface p-4"
              >
                <p className="font-medium text-foreground">
                  {item.studentName ?? t('grades.student')} · {examLabel}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('grades.requestedChange', {
                    current: item.currentScore,
                    requested: item.requestedScore,
                  })}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'inline-block rounded-md px-2 py-0.5 text-[10px] font-medium',
                      statusClass(item.status)
                    )}
                  >
                    {t(`grades.editStatus${item.status}`)}
                  </span>
                  {item.createdAt ? (
                    <span className="text-[10px] text-muted-foreground">
                      {formatSubmittedAgo(item.createdAt, t)}
                    </span>
                  ) : null}
                </div>
                {item.status === 'REJECTED' && reviewNote ? (
                  <p className="mt-2 text-xs italic text-muted-foreground">{reviewNote}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
