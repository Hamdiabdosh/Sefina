import { useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import { useTeacherSalaryHistory } from '../hooks/useSalaries';
import { formatEthiopianMonthYear } from '../utils/ethiopian';
import { formatEtb } from '../utils/money';

export const TeacherSalaryHistoryPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teacherId } = useParams({ strict: false }) as { teacherId: string };
  const { data, isLoading } = useTeacherSalaryHistory(teacherId, true);

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={t('salaries.historyTitle')}
        subtitle={data?.fullName}
        onBack={() => void navigate({ to: '/admin/salaries' })}
      />
      <PageBody>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('salaries.loading')}</p>
        ) : data ? (
          <>
            {data.currentRank ? (
              <div className="mb-4 rounded-xl border border-cream-dark bg-teal-50 p-3">
                <p className="text-xs text-muted-foreground">{t('salaries.currentRank')}</p>
                <p className="text-sm font-medium">
                  {getLocalizedValue(data.currentRank.rankName)} ·{' '}
                  {formatEtb(data.currentRank.monthlyAmountEtb)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('salaries.paidThisYear', { amount: formatEtb(data.totalPaidThisYearEtb) })}
                </p>
              </div>
            ) : null}
            <ul className="space-y-2">
              {data.items.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-cream-dark bg-surface px-3 py-2 text-sm"
                >
                  <p className="font-medium">
                    {formatEthiopianMonthYear(row.month, row.year)} · {formatEtb(row.amountPaidEtb)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getLocalizedValue(row.rankName)} · {row.bankReference} · {row.paymentDate}
                  </p>
                  {row.isAdjusted && row.adjustmentReason ? (
                    <p className="text-xs text-amber-800 mt-1">{row.adjustmentReason}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </PageBody>
    </div>
  );
};
