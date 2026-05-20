import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { FilterTabs } from '../../../components/ui/FilterTabs';
import { TeacherAvatar } from '../../teachers/components/TeacherAvatar';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import { AssignRankModal } from '../components/AssignRankModal';
import { useSalaryPayments, useSalaryRanks } from '../hooks/useSalaries';
import { formatEtb } from '../utils/money';
import {
  formatEthiopianMonthYear,
  getCurrentEthiopianMonthYear,
} from '../utils/ethiopian';
import type { SalaryPaymentListStatus } from '../types';

const statusClass = (s: SalaryPaymentListStatus) =>
  s === 'PAID' ? 'bg-teal-50 text-teal-800' : 'bg-[#FCEBEB] text-danger-text';

export const SalaryPaymentListPage = () => {
  const { t } = useTranslation();
  const current = getCurrentEthiopianMonthYear();
  const [month, setMonth] = useState(current.month);
  const [year, setYear] = useState(current.year);
  const [statusFilter, setStatusFilter] = useState<'ALL' | SalaryPaymentListStatus>('ALL');
  const [rankFilter, setRankFilter] = useState('ALL');
  const [assignTarget, setAssignTarget] = useState<{ id: string; name: string } | null>(null);

  const ranks = useSalaryRanks();
  const { data, isLoading } = useSalaryPayments(
    month,
    year,
    statusFilter,
    rankFilter === 'ALL' ? undefined : rankFilter
  );

  const rankTabs = [
    { value: 'ALL', label: t('salaries.filterAllRanks') },
    ...(ranks.data?.items ?? []).map((r) => ({
      value: r.id,
      label: getLocalizedValue(r.name),
    })),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={t('salaries.paymentListTitle')}
        subtitle={formatEthiopianMonthYear(month, year)}
        actions={
          <div className="flex gap-2">
            <Link to="/admin/salaries/overview" className="btn-secondary text-sm">
              {t('salaries.networkTitle')}
            </Link>
            <Link to="/admin/salary-ranks" className="btn-secondary text-sm">
              {t('salaries.manageRanks')}
            </Link>
          </div>
        }
      />
      <PageBody>
        <div className="mb-4 flex flex-wrap gap-3 items-end">
          <label className="text-xs text-muted-foreground">
            {t('salaries.ethiopianMonth')}
            <input
              type="number"
              min={1}
              max={13}
              className="field-input mt-1 block w-20"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            {t('salaries.ethiopianYear')}
            <input
              type="number"
              className="field-input mt-1 block w-24"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </label>
        </div>

        {data?.summary && data.summary.unpaidCount > 0 ? (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {t('salaries.unpaidBanner', { count: data.summary.unpaidCount })}
          </p>
        ) : null}

        {data?.summary ? (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-cream-dark bg-teal-50 p-3">
              <p className="text-xs text-muted-foreground">{t('salaries.disbursed')}</p>
              <p className="text-lg font-medium text-teal-800">
                {formatEtb(data.summary.totalDisbursedEtb)}
              </p>
            </div>
            <div className="rounded-xl border border-cream-dark bg-[#FCEBEB] p-3">
              <p className="text-xs text-muted-foreground">{t('salaries.unpaid')}</p>
              <p className="text-lg font-medium text-danger-text">{data.summary.unpaidCount}</p>
            </div>
          </div>
        ) : null}

        <div className="mb-3">
          <FilterTabs value={statusFilter} onChange={setStatusFilter} tabs={[
            { value: 'ALL', label: t('salaries.filterAll') },
            { value: 'PAID', label: t('salaries.statusPaid') },
            { value: 'UNPAID', label: t('salaries.statusUnpaid') },
          ]} />
        </div>
        <div className="mb-4 overflow-x-auto">
          <FilterTabs value={rankFilter} onChange={setRankFilter} tabs={rankTabs} />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('salaries.loading')}</p>
        ) : (
          <ul className="space-y-2">
            {(data?.items ?? []).map((row) => (
              <li
                key={row.teacherId}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-cream-dark bg-surface p-3"
              >
                <TeacherAvatar
                  teacherId={row.teacherId}
                  name={row.fullName}
                  photoUrl={row.photoUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{row.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.rankName
                      ? `${getLocalizedValue(row.rankName)} · ${row.monthlyAmountEtb != null ? formatEtb(row.monthlyAmountEtb) : '—'}`
                      : t('salaries.noRankAssigned')}
                  </p>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusClass(row.status)}`}
                >
                  {t(`salaries.status${row.status}`)}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline"
                    onClick={() => setAssignTarget({ id: row.teacherId, name: row.fullName })}
                  >
                    {t('salaries.assignRank')}
                  </button>
                  {row.status === 'UNPAID' && row.monthlyAmountEtb != null ? (
                    <Link
                      to="/admin/salaries/record"
                      search={{
                        teacherId: row.teacherId,
                        teacherName: row.fullName,
                        month,
                        year,
                        amountEtb: row.monthlyAmountEtb,
                      }}
                      className="text-xs text-teal-700 underline"
                    >
                      {t('salaries.recordPayment')}
                    </Link>
                  ) : null}
                  <Link
                    to="/admin/teachers/$teacherId/salary"
                    params={{ teacherId: row.teacherId }}
                    className="text-xs text-muted-foreground underline"
                  >
                    {t('salaries.history')}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
      {assignTarget ? (
        <AssignRankModal
          teacherId={assignTarget.id}
          teacherName={assignTarget.name}
          onClose={() => setAssignTarget(null)}
        />
      ) : null}
    </div>
  );
};
